"""Optional external-tool discovery AND best-effort execution.

The default SIH demo works entirely on the bounded Python checks in
http_checks.py so the project runs without downloading heavyweight security
tool images. If a real tool binary (testssl.sh, nuclei) happens to be present
on the host/container PATH, these adapters will actually invoke it against
the authorized target and fold its findings into the same normalized schema
used by the rest of the pipeline. If the binary is absent, each adapter
returns an empty list immediately -- it never blocks or fails the run.

Install inside the authorized Docker sandbox only, and keep the
`config/rules_of_engagement.yaml` scope/rate limits in force for any tool you
add here.
"""
import json
import shutil
import subprocess
import time
import uuid

from .cvss import score, severity
from .remediation import get as remediation

TOOLS = {
    'zap': {'binary': 'zap-baseline.py', 'scope': 'web', 'mode': 'baseline'},
    'nuclei': {'binary': 'nuclei', 'scope': 'web', 'mode': 'templates'},
    'testssl': {'binary': 'testssl.sh', 'scope': 'tls', 'mode': 'audit'},
    'jwt_tool': {'binary': 'jwt_tool', 'scope': 'jwt', 'mode': 'analysis'},
    'sqlmap': {'binary': 'sqlmap', 'scope': 'db-input', 'mode': 'safe-detection'},
    'semgrep': {'binary': 'semgrep', 'scope': 'source', 'mode': 'rules'},
    'trufflehog': {'binary': 'trufflehog', 'scope': 'source', 'mode': 'filesystem'},
}


def inventory():
    return [{'name': name, **meta, 'available': bool(shutil.which(meta['binary']))} for name, meta in TOOLS.items()]


def _wrap(kind, title, category, component, description, evidence, cwe):
    sc, vec = score(kind)
    return {
        'id': f'F-{uuid.uuid4().hex[:10]}', 'title': title, 'severity': severity(sc), 'category': category,
        'affectedComponent': component, 'status': 'open', 'detectedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'moduleId': '', 'cwe': cwe, 'cvssScore': sc, 'cvssVector': vec, 'confidence': 'high',
        'overview': description, 'description': description, 'impact': 'See external tool report for full detail.',
        'evidence': {'requestMethod': 'TOOL', 'requestUrl': component, 'requestHeaders': {}, 'requestBody': None,
                     'responseStatus': 0, 'responseHeaders': {}, 'responseBody': evidence[:8000], 'payloadInjected': None},
        'reproductionSteps': [f'Re-run: {TOOLS.get(kind, {}).get("binary", kind)} against the authorized target.'],
        'remediation': remediation('tls' if kind == 'testssl' else 'headers'), 'references': [],
    }


def run_testssl(target_url, timeout=90):
    """Best-effort testssl.sh run. Returns [] if the binary is not installed
    or the target is not HTTPS (testssl.sh needs a TLS endpoint)."""
    if not shutil.which('testssl.sh') or not target_url.startswith('https://'):
        return [], []
    logs = [f'testssl.sh: binary found, running bounded audit against {target_url}']
    try:
        proc = subprocess.run(
            ['testssl.sh', '--jsonfile-pretty', '/dev/stdout', '--quiet', '--warnings', 'off', target_url],
            capture_output=True, text=True, timeout=timeout,
        )
        data = json.loads(proc.stdout or '[]')
    except Exception as e:
        return [], logs + [f'testssl.sh: run failed or timed out ({e}); continuing without this module.']
    findings = []
    for entry in data if isinstance(data, list) else []:
        sev = str(entry.get('severity', '')).upper()
        if sev in ('HIGH', 'CRITICAL'):
            findings.append(_wrap('testssl', f"TLS weakness: {entry.get('id', 'finding')}", 'Secure Communication',
                                   target_url, entry.get('finding', 'testssl.sh flagged a high/critical TLS issue.'),
                                   json.dumps(entry), 'CWE-326'))
    logs.append(f'testssl.sh: {len(findings)} high/critical findings folded into the pipeline.')
    return findings, logs


def run_nuclei(target_url, timeout=90, templates='cves,exposures,misconfiguration'):
    """Best-effort nuclei run against the authorized target. Returns [] if the
    nuclei binary is not installed."""
    if not shutil.which('nuclei'):
        return [], []
    logs = [f'nuclei: binary found, running bounded template scan ({templates}) against {target_url}']
    try:
        proc = subprocess.run(
            ['nuclei', '-u', target_url, '-tags', templates, '-jsonl', '-silent', '-timeout', '5', '-rl', '10'],
            capture_output=True, text=True, timeout=timeout,
        )
    except Exception as e:
        return [], logs + [f'nuclei: run failed or timed out ({e}); continuing without this module.']
    findings = []
    for line in (proc.stdout or '').splitlines():
        try:
            entry = json.loads(line)
        except Exception:
            continue
        sev = str(entry.get('info', {}).get('severity', '')).lower()
        if sev in ('high', 'critical', 'medium'):
            findings.append(_wrap('nuclei', entry.get('info', {}).get('name', 'nuclei finding'), 'API Security',
                                   entry.get('matched-at', target_url),
                                   entry.get('info', {}).get('description', 'Flagged by a nuclei template.'),
                                   json.dumps(entry), 'CWE-1035'))
    logs.append(f'nuclei: {len(findings)} medium+ findings folded into the pipeline.')
    return findings, logs
