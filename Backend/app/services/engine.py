import shutil
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import AssessmentRun, Finding, SecurityModule, Target, Chain
from .http_checks import run_http_checks
from .correlation import correlate
from .tool_adapters import run_testssl, run_nuclei

MODULES = [
    {'id':'mod-auth','slug':'authentication','name':'Authentication & Session','category':'Authentication','description':'Session, cookie and bounded authentication-control checks.','checks':[('auth-1','Cookie flags','Inspect session cookie attributes.','OWASP ASVS V3'),('auth-2','Rate limiting','Bounded invalid-login probe.','OWASP API4:2023'),('auth-3','JWT algorithm triage','Inspect observed JWT headers for unsafe algorithm markers.','OWASP ASVS V3')]},
    {'id':'mod-authz','slug':'authorization','name':'Authorization & Access Control','category':'Authorization','description':'BOLA/IDOR and mass-assignment checks against sandbox fixtures.','checks':[('authz-1','BOLA/IDOR','Compare object responses using the sandbox fixture pattern.','OWASP API1:2023'),('authz-2','Mass assignment','Probe privileged fields on a sandbox object update endpoint.','OWASP API6:2023')]},
    {'id':'mod-api','slug':'api-security','name':'API Security','category':'API','description':'CORS and API documentation exposure checks.','checks':[('api-1','CORS policy','Non-trusted Origin probe.','OWASP API8:2023'),('api-2','Docs exposure','Common API documentation endpoints.','OWASP API9:2023')]},
    {'id':'mod-input','slug':'input-validation','name':'Input Validation','category':'Input','description':'Safe reflection and error-signal checks.','checks':[('input-1','Injection signal','Non-destructive error-signal triage.','OWASP A03:2021'),('input-2','Reflected input','Benign marker reflection.','OWASP A03:2021')]},
    {'id':'mod-client','slug':'client-security','name':'Client-Side Security','category':'Client','description':'Browser security headers and redirect validation signals.','checks':[('client-1','Security headers','CSP, framing, MIME and referrer controls.','OWASP A05:2021'),('client-2','Open redirect','Bounded external redirect-target validation probe.','CWE-601')]},
    {'id':'mod-communication','slug':'communication','name':'Secure Communication','category':'TLS','description':'TLS/HTTPS configuration checks.','checks':[('tls-1','HTTPS','Verify HTTPS where required.','OWASP ASVS V9'),('tls-2','HSTS','Inspect HSTS on HTTPS responses.','OWASP A02:2021')]},
    {'id':'mod-privacy','slug':'data-privacy','name':'Data Storage & Privacy','category':'Storage','description':'Response-level sensitive data and development-artifact exposure checks.','checks':[('privacy-1','Sensitive fields','Search JSON responses for credential-like fields.','OWASP API3:2023'),('privacy-2','Backup/config exposure','Check bounded development/backup artifact paths.','CWE-538')]},
]

CATEGORY_TO_MODULE = {
    'authentication': 'mod-auth', 'authorization': 'mod-authz', 'api security': 'mod-api',
    'input validation': 'mod-input', 'client security': 'mod-client', 'secure communication': 'mod-communication',
    'data privacy': 'mod-privacy',
}

CHECK_TO_MODULE = {
    check_id: module['id']
    for module in MODULES
    for check_id, *_ in module['checks']
}


def _module_payload(m):
    checks = [{'id': i, 'name': n, 'description': d, 'standardRef': ref} for i, n, d, ref in m['checks']]
    return {**m, 'checks': checks, 'checks_count': len(checks), 'estimated_duration': '1–3 min'}


def seed_modules(db: Session):
    for raw in MODULES:
        m = _module_payload(raw)
        obj = db.get(SecurityModule, m['id'])
        if not obj:
            obj = SecurityModule(id=m['id'])
            db.add(obj)
        obj.slug = m['slug']; obj.name = m['name']; obj.category = m['category']; obj.description = m['description']
        obj.checks_count = m['checks_count']; obj.estimated_duration = m['estimated_duration']; obj.checks = m['checks']
    db.commit()


def _log(db, run, level, module, message):
    logs = list(run.logs or [])
    logs.append({'id':f'l-{uuid.uuid4().hex[:8]}','timestamp':datetime.now().strftime('%H:%M:%S'),'level':level,'module':module,'message':message})
    run.logs = logs[-250:]
    db.commit()


def module_for_category(cat):
    c = (cat or '').strip().lower()
    if c in CATEGORY_TO_MODULE:
        return CATEGORY_TO_MODULE[c]
    for key, module_id in CATEGORY_TO_MODULE.items():
        if key in c:
            return module_id
    return None


def _normalize(f, run_id):
    x = dict(f)
    module_id = x.get('moduleId') or module_for_category(x.get('category'))
    if not module_id:
        raise ValueError(f"Unmapped finding category: {x.get('category')}")
    x['moduleId'] = module_id
    x['run_id'] = run_id
    return x


def _dict_to_model(f):
    return Finding(
        id=f['id'], title=f['title'], severity=f['severity'], category=f['category'],
        affected_component=f['affectedComponent'], status=f['status'], module_id=f['moduleId'],
        cwe=f['cwe'], cvss_score=f['cvssScore'], cvss_vector=f.get('cvssVector',''),
        confidence=f.get('confidence','medium'), overview=f['overview'], description=f['description'],
        impact=f['impact'], evidence=f['evidence'], reproduction_steps=f['reproductionSteps'],
        remediation=f['remediation'], references=f.get('references',[]), run_id=f.get('run_id'),
    )


def _wait_for_resume(db_factory, run_id):
    import time
    while True:
        db = db_factory()
        try:
            run = db.get(AssessmentRun, run_id)
            if not run or run.status == 'stopped':
                return False
            if run.status != 'paused':
                return True
        finally:
            db.close()
        time.sleep(0.5)


def _available_external_checks():
    checks = []
    if shutil.which('testssl.sh'):
        checks.append(('external-testssl', 'mod-communication'))
    if shutil.which('nuclei'):
        checks.append(('external-nuclei', 'mod-api'))
    return checks


def run_assessment(db_factory, run_id):
    db = db_factory()
    try:
        run = db.get(AssessmentRun, run_id)
        if not run:
            return
        target = db.get(Target, run.target_id)
        if not target:
            run.status = 'stopped'; run.completed_at = datetime.now(timezone.utc); db.commit(); return
        _log(db, run, 'info', 'Orchestrator', 'Assessment started; authorization and scope are enforced by target configuration.')
        if not target.is_authorized:
            run.status='stopped'; run.completed_at=datetime.now(timezone.utc)
            _log(db, run, 'error', 'Orchestrator', 'Target is not marked authorized. No active checks were executed.')
            db.commit(); return

        enabled_ids = set(run.active_modules or [])
        active_defs = [_module_payload(m) for m in MODULES if m['id'] in enabled_ids]
        if not active_defs:
            run.status='stopped'; run.completed_at=datetime.now(timezone.utc)
            _log(db, run, 'error', 'Orchestrator', 'No valid assessment modules were selected.')
            db.commit(); return

        selected_check_ids = [c['id'] for m in active_defs for c in m['checks']]
        external = [(cid, mid) for cid, mid in _available_external_checks() if mid in enabled_ids]
        # Baseline check totals come only from the deterministic built-in registry. Optional external
        # adapters enrich findings when available but do not distort the check/progress denominator.
        run.total_checks = len(selected_check_ids)
        run.current_module_id = active_defs[0]['id']
        run.current_check_name = f'Running {len(selected_check_ids)} scoped HTTP checks'
        run.progress = 5
        db.commit()

        findings, logs, check_results = run_http_checks(
            target.url, target.request_timeout, target.max_request_rate, target.scope, selected_check_ids
        )
        for msg in logs:
            _log(db, run, 'info', 'HTTP Checks', msg)
        run.progress = 55
        db.commit()

        # Optional real adapters. They remain strictly optional and are counted only when the binary exists.
        if ('external-testssl', 'mod-communication') in external:
            ts_findings, ts_logs = run_testssl(target.url)
            findings.extend(ts_findings)
            for msg in ts_logs: _log(db, run, 'info', 'testssl.sh', msg)
        if ('external-nuclei', 'mod-api') in external:
            nu_findings, nu_logs = run_nuclei(target.url)
            findings.extend(nu_findings)
            for msg in nu_logs: _log(db, run, 'info', 'Nuclei', msg)

        for f in findings:
            db.merge(_dict_to_model(_normalize(f, run.id)))
        db.commit()

        run = db.get(AssessmentRun, run.id)
        if run.status == 'paused':
            _log(db, run, 'warn', 'Orchestrator', 'Assessment paused; waiting for operator resume.')
            db.commit(); db.close()
            if not _wait_for_resume(db_factory, run.id): return
            db = db_factory(); run = db.get(AssessmentRun, run.id)
        if run.status == 'stopped':
            _log(db, run, 'warn', 'Orchestrator', 'Assessment was stopped by the operator; finalization skipped.')
            db.commit(); return

        # Persist per-run check execution state in the run log. The check counts below are derived from the
        # actual selected registry, not from finding count.
        passed = sum(1 for x in check_results if x['status'] == 'passed')
        failed = sum(1 for x in check_results if x['status'] == 'failed')
        skipped = sum(1 for x in check_results if x['status'] == 'skipped')
        run.passed_checks = passed
        run.failed_checks = failed
        run.check_results = check_results
        run.progress = 80
        _log(db, run, 'info', 'Orchestrator', f'Executed {len(check_results)} checks: {passed} passed, {failed} flagged, {skipped} skipped.')
        db.commit()

        _log(db, run, 'info', 'Correlation', 'Normalizing findings and proposing attack chains.')
        data = []
        for f in db.query(Finding).filter(Finding.run_id == run.id).all():
            data.append({'id':f.id,'category':f.category,'title':f.title,'cwe':f.cwe,'cvssScore':f.cvss_score})
        chain_count = 0
        for c in correlate(data):
            chain = Chain(
                id=f'CH-{uuid.uuid4().hex[:8]}', run_id=run.id, title=c['title'], description=c['description'],
                severity=c['severity'], score=c['score'], node_ids=c['node_ids'], edges=c['edges']
            )
            db.add(chain); chain_count += 1

        counts = {s: db.query(Finding).filter(Finding.run_id==run.id, Finding.severity==s).count() for s in ['critical','high','medium','low','info']}
        for module in active_defs:
            db_module = db.get(SecurityModule, module['id'])
            if db_module:
                module_findings = db.query(Finding).filter(Finding.run_id==run.id, Finding.module_id==module['id']).count()
                db_module.findings_count = module_findings
                db_module.status = 'warning' if module_findings else 'passed'
        run.findings_count = counts
        run.progress = 100
        run.status = 'completed'
        run.completed_at = datetime.now(timezone.utc)
        run.current_check_name = 'Assessment complete'
        db.commit()
        _log(db, run, 'success', 'Orchestrator', f'Assessment completed with {sum(counts.values())} findings and {chain_count} proposed chains.')
    except Exception as e:
        try:
            run = db.get(AssessmentRun, run_id)
            if run:
                run.status='stopped'; run.completed_at=datetime.now(timezone.utc)
                _log(db, run, 'error', 'Orchestrator', f'Assessment failed gracefully: {e}')
                db.commit()
        except Exception:
            pass
    finally:
        db.close()
