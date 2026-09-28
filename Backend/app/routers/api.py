import time
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from fastapi.responses import StreamingResponse, PlainTextResponse
from sqlalchemy.orm import Session

from ..db import get_db, SessionLocal
from ..models import Target, SecurityModule, Finding, AssessmentRun, Chain, Report
from ..schemas import TargetIn, TestConnectionIn, ToggleIn, StartAssessmentIn, StatusIn, ChainDecisionIn
from ..services.engine import seed_modules, run_assessment, MODULES, CHECK_TO_MODULE
from ..services.reports import build_pdf, build_markdown
from ..services.tool_adapters import inventory

router = APIRouter(prefix='/api')


def target_out(t):
    return {'id':t.id,'name':t.name,'url':t.url,'environment':t.environment,'scope':t.scope,'requestTimeout':t.request_timeout,'maxRequestRate':t.max_request_rate,'status':t.status,'isAuthorized':t.is_authorized}


def latest_run(db, completed_only=False):
    q = db.query(AssessmentRun)
    if completed_only:
        q = q.filter(AssessmentRun.status == 'completed')
    return q.order_by(AssessmentRun.started_at.desc()).first()


def module_out(m, db=None, run=None):
    status = m.status
    findings_count = m.findings_count
    if db is not None and run is not None:
        if m.id in (run.active_modules or []):
            findings_count = db.query(Finding).filter(Finding.run_id == run.id, Finding.module_id == m.id).count()
            if run.status == 'completed':
                status = 'warning' if findings_count else 'passed'
            elif run.status == 'paused' and m.id == run.current_module_id:
                status = 'paused'
            elif run.status == 'running':
                status = 'running' if m.id == run.current_module_id else 'pending'
        else:
            status = 'idle'
            findings_count = 0
    return {'id':m.id,'slug':m.slug,'name':m.name,'category':m.category,'description':m.description,'checksCount':m.checks_count,'estimatedDuration':m.estimated_duration,'enabled':m.enabled,'status':status,'findingsCount':findings_count,'checks':m.checks}


def finding_out(f):
    return {'id':f.id,'title':f.title,'severity':f.severity,'category':f.category,'affectedComponent':f.affected_component,'status':f.status,'detectedAt':f.detected_at.isoformat() if f.detected_at else None,'moduleId':f.module_id,'cwe':f.cwe,'cvssScore':f.cvss_score,'cvssVector':f.cvss_vector,'confidence':getattr(f,'confidence',None) or 'medium','overview':f.overview,'description':f.description,'impact':f.impact,'evidence':f.evidence,'reproductionSteps':f.reproduction_steps,'remediation':f.remediation,'references':f.references,'runId':f.run_id}


def run_out(r):
    return {'id':r.id,'targetId':r.target_id,'targetName':r.target_name,'targetUrl':r.target_url,'status':r.status,'progress':r.progress,'startedAt':r.started_at.isoformat() if r.started_at else None,'completedAt':r.completed_at.isoformat() if r.completed_at else None,'totalChecks':r.total_checks,'passedChecks':r.passed_checks,'failedChecks':r.failed_checks,'currentModuleId':r.current_module_id,'currentCheckName':r.current_check_name,'findingsCount':r.findings_count or {'critical':0,'high':0,'medium':0,'low':0,'info':0},'activeModules':r.active_modules or [],'logs':r.logs or [],'checkResults':r.check_results or []}


@router.get('/health')
def health():
    return {'status':'healthy','version':'1.0.0','service':'VulnWeave Engine'}


@router.get('/tools')
def tools(): return inventory()


@router.get('/target')
def get_target(db:Session=Depends(get_db)):
    t=db.query(Target).first()
    if not t: raise HTTPException(404,'Target not configured')
    return target_out(t)


@router.put('/target')
def update_target(payload:TargetIn, db:Session=Depends(get_db)):
    t=db.query(Target).first()
    if not t: raise HTTPException(404,'Target not configured')
    data=payload.model_dump(exclude_none=True)
    mapping={'requestTimeout':'request_timeout','maxRequestRate':'max_request_rate','isAuthorized':'is_authorized'}
    for k,v in data.items(): setattr(t,mapping.get(k,k),v)
    t.status='Ready'
    db.commit(); db.refresh(t)
    return target_out(t)


@router.post('/target/test-connection')
def test_connection(payload:TestConnectionIn):
    start=time.perf_counter()
    try:
        with httpx.Client(timeout=5,follow_redirects=True,verify=False) as c:
            r=c.get(payload.url,headers={'User-Agent':'VulnWeave-Connection-Test/1.0'})
        return {'success':True,'responseTimeMs':round((time.perf_counter()-start)*1000),'statusText':f'HTTP {r.status_code} {r.reason_phrase}'}
    except Exception as e:
        return {'success':False,'responseTimeMs':round((time.perf_counter()-start)*1000),'statusText':str(e)}


@router.get('/modules')
def modules(db:Session=Depends(get_db)):
    seed_modules(db)
    r = latest_run(db)
    return [module_out(x, db, r) for x in db.query(SecurityModule).order_by(SecurityModule.id).all()]


@router.get('/modules/{slug}')
def module(slug:str,db:Session=Depends(get_db)):
    seed_modules(db)
    m=db.query(SecurityModule).filter((SecurityModule.slug==slug)|(SecurityModule.id==slug)).first()
    if not m: raise HTTPException(404,'Module not found')
    return module_out(m, db, latest_run(db))


@router.post('/modules/{id}/toggle')
def toggle(id:str,payload:ToggleIn,db:Session=Depends(get_db)):
    m=db.get(SecurityModule,id)
    if not m: raise HTTPException(404,'Module not found')
    m.enabled=payload.enabled; db.commit(); db.refresh(m)
    return module_out(m, db, latest_run(db))


@router.post('/assessment/start')
def start(payload:StartAssessmentIn, background_tasks: BackgroundTasks, db:Session=Depends(get_db)):
    t=db.query(Target).first()
    if not t or not t.is_authorized:
        raise HTTPException(400,'Target must be explicitly marked authorized before active assessment.')
    active = db.query(AssessmentRun).filter(AssessmentRun.status.in_(['running','paused'])).first()
    if active:
        raise HTTPException(409, f'Assessment {active.id} is already {active.status}. Complete or stop it before starting another run.')
    seed_modules(db)
    known_ids = {m['id'] for m in MODULES}
    requested = list(dict.fromkeys(payload.moduleIds or []))
    if requested:
        invalid = [x for x in requested if x not in known_ids]
        if invalid:
            raise HTTPException(400, f'Unknown assessment module(s): {", ".join(invalid)}')
        mods = requested
    else:
        mods = [m.id for m in db.query(SecurityModule).filter(SecurityModule.enabled==True).all() if m.id in known_ids]
    if not mods:
        raise HTTPException(400,'No enabled assessment modules are available.')
    total_checks = sum(len(next(m['checks'] for m in MODULES if m['id']==mid)) for mid in mods)
    run=AssessmentRun(id=f'run-{uuid.uuid4().hex[:8]}',target_id=t.id,target_name=t.name,target_url=t.url,status='running',progress=0,started_at=datetime.now(timezone.utc),active_modules=mods,total_checks=total_checks,findings_count={'critical':0,'high':0,'medium':0,'low':0,'info':0},check_results=[])
    db.add(run); db.commit()
    background_tasks.add_task(run_assessment, SessionLocal, run.id)
    return run_out(run)


@router.get('/assessment/running')
def running(db:Session=Depends(get_db)):
    r = db.query(AssessmentRun).filter(AssessmentRun.status.in_(['running','paused'])).order_by(AssessmentRun.started_at.desc()).first()
    if not r:
        r = latest_run(db)
    if not r: raise HTTPException(404,'No assessment exists')
    return run_out(r)


@router.get('/assessments')
def assessments(db:Session=Depends(get_db)):
    runs = db.query(AssessmentRun).order_by(AssessmentRun.started_at.desc()).all()
    report_by_run = {}
    for report in db.query(Report).filter(Report.run_id.isnot(None)).order_by(Report.assessment_date.desc(), Report.id.desc()).all():
        report_by_run.setdefault(report.run_id, report.id)
    return [{**run_out(r), 'reportId': report_by_run.get(r.id)} for r in runs]


@router.get('/assessment/{id}')
def get_assessment(id:str, db:Session=Depends(get_db)):
    r=db.get(AssessmentRun,id)
    if not r: raise HTTPException(404,'Assessment not found')
    return run_out(r)


@router.post('/assessment/{id}/pause')
def pause(id:str,db:Session=Depends(get_db)):
    r=db.get(AssessmentRun,id)
    if not r: raise HTTPException(404,'Assessment not found')
    if r.status not in ('running','paused'): return run_out(r)
    r.status='running' if r.status=='paused' else 'paused'; db.commit(); return run_out(r)


@router.post('/assessment/{id}/stop')
def stop(id:str,db:Session=Depends(get_db)):
    r=db.get(AssessmentRun,id)
    if not r: raise HTTPException(404,'Assessment not found')
    if r.status in ('running','paused'):
        r.status='stopped'; r.completed_at=datetime.now(timezone.utc); db.commit()
    return run_out(r)


@router.get('/assessment/activity')
def activity(db:Session=Depends(get_db)):
    r = db.query(AssessmentRun).filter(AssessmentRun.status.in_(['running','paused'])).order_by(AssessmentRun.started_at.desc()).first() or latest_run(db)
    if not r: return []
    return [{'id':x['id'],'timestamp':x['timestamp'],'message':x['message'],'module':x['module'],'type': 'finding' if x['level']=='error' else ('completed' if x['level']=='success' else 'started')} for x in (r.logs or [])[::-1]]


@router.get('/findings')
def findings(run_id:str|None=None, db:Session=Depends(get_db)):
    r = db.get(AssessmentRun, run_id) if run_id else latest_run(db)
    if not r: return []
    return [finding_out(x) for x in db.query(Finding).filter(Finding.run_id==r.id).order_by(Finding.detected_at.desc()).all()]


@router.get('/findings/{id}')
def finding(id:str,db:Session=Depends(get_db)):
    f=db.get(Finding,id)
    if not f: raise HTTPException(404,'Finding not found')
    return finding_out(f)


@router.patch('/findings/{id}/status')
def finding_status(id:str,payload:StatusIn,db:Session=Depends(get_db)):
    if payload.status not in {'open','in_review','resolved','accepted_risk'}: raise HTTPException(400,'Invalid status')
    f=db.get(Finding,id)
    if not f: raise HTTPException(404,'Finding not found')
    f.status=payload.status; db.commit(); return finding_out(f)


@router.get('/chains')
def chains(run_id:str|None=None, db:Session=Depends(get_db)):
    r = db.get(AssessmentRun, run_id) if run_id else latest_run(db)
    if not r: return []
    return [{'id':c.id,'title':c.title,'description':c.description,'severity':c.severity,'score':c.score,'status':c.status,'node_ids':c.node_ids,'edges':c.edges,'runId':c.run_id} for c in db.query(Chain).filter(Chain.run_id==r.id).order_by(Chain.created_at.desc()).all()]


@router.get('/chains/{id}')
def chain(id:str,db:Session=Depends(get_db)):
    c=db.get(Chain,id)
    if not c: raise HTTPException(404,'Chain not found')
    return {'id':c.id,'title':c.title,'description':c.description,'severity':c.severity,'score':c.score,'status':c.status,'node_ids':c.node_ids,'edges':c.edges,'runId':c.run_id}


@router.post('/chains/{id}/decision')
def chain_decision(id:str,payload:ChainDecisionIn,db:Session=Depends(get_db)):
    c=db.get(Chain,id)
    if not c: raise HTTPException(404,'Chain not found')
    if payload.action not in {'confirm','reject','edit'}: raise HTTPException(400,'Invalid action')
    c.status={'confirm':'confirmed','reject':'rejected','edit':'proposed'}[payload.action]; c.rejection_reason=payload.reason; db.commit(); return {'status':'ok'}


def report_out(r,db):
    fs=[db.get(Finding,x) for x in (r.finding_ids or [])]; fs=[x for x in fs if x]
    return {'id':r.id,'runId':r.run_id,'title':r.title,'targetName':r.target_name,'targetUrl':r.target_url,'environment':r.environment,'assessmentDate':r.assessment_date,'assessor':r.assessor,'executiveSummary':r.executive_summary,'scopeSummary':r.scope_summary,'methodology':r.methodology,'findingsDistribution':r.findings_distribution,'findings':[finding_out(x) for x in fs],'remediationSummary':r.remediation_summary,'status':r.status}


@router.get('/reports')
def reports(db:Session=Depends(get_db)):
    return [report_out(x,db) for x in db.query(Report).order_by(Report.assessment_date.desc()).all()]


@router.get('/reports/{id}')
def report(id:str,db:Session=Depends(get_db)):
    r=db.get(Report,id)
    if not r: raise HTTPException(404,'Report not found')
    return report_out(r,db)


@router.get('/reports/{id}/pdf')
def report_pdf(id:str,db:Session=Depends(get_db)):
    r=db.get(Report,id)
    if not r: raise HTTPException(404,'Report not found')
    fs=[db.get(Finding,x) for x in (r.finding_ids or [])]; fs=[x for x in fs if x]
    cs=db.query(Chain).filter(Chain.run_id==r.run_id).all() if r.run_id else []
    return StreamingResponse(build_pdf(r,fs,cs),media_type='application/pdf',headers={'Content-Disposition':f'attachment; filename={id}.pdf'})


@router.get('/reports/{id}/markdown')
def report_markdown(id:str,db:Session=Depends(get_db)):
    r=db.get(Report,id)
    if not r: raise HTTPException(404,'Report not found')
    fs=[db.get(Finding,x) for x in (r.finding_ids or [])]; fs=[x for x in fs if x]
    cs=db.query(Chain).filter(Chain.run_id==r.run_id).all() if r.run_id else []
    return PlainTextResponse(build_markdown(r,fs,cs),media_type='text/markdown')


@router.post('/reports/generate')
def generate_report(db:Session=Depends(get_db)):
    t=db.query(Target).first()
    rrun=latest_run(db, completed_only=True)
    if not t or not rrun: raise HTTPException(400,'A completed assessment is required before generating a report.')
    fs=db.query(Finding).filter(Finding.run_id==rrun.id).all()
    chain_count=db.query(Chain).filter(Chain.run_id==rrun.id).count()
    counts={s:sum(1 for f in fs if f.severity==s) for s in ['critical','high','medium','low','info']}; counts['total']=len(fs)
    report=Report(
        id=f'RPT-{uuid.uuid4().hex[:8]}', run_id=rrun.id, title='VulnWeave Security Assessment',
        target_name=rrun.target_name, target_url=rrun.target_url, environment=t.environment,
        assessment_date=datetime.now().strftime('%Y-%m-%d'),
        executive_summary=f'Assessment {rrun.id} identified {len(fs)} findings across the configured authorized target. Attack-chain correlation produced {chain_count} candidate chains for analyst review.',
        scope_summary=t.scope,
        methodology='Rules-of-engagement constrained reconnaissance, bounded HTTP security checks, normalization, CVSS decision mapping, rule-based attack-chain correlation, and report generation.',
        findings_distribution=counts, finding_ids=[f.id for f in fs],
        remediation_summary='Prioritize confirmed high-impact findings, validate fixes, and re-run the assessment.', status='Final'
    )
    db.add(report); db.commit(); db.refresh(report)
    return report_out(report,db)
