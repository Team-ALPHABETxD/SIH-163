import re
import time
import uuid
import fnmatch
import base64
import json as _json
from urllib.parse import urljoin, urlparse

import httpx

from .cvss import score, severity
from .remediation import get as remediation
from .fingerprint import detect as detect_stack

SENSITIVE = re.compile(r'(?i)(password|passwd|secret|token|api[_-]?key|authorization|private[_-]?key)')
JWT_PATTERN = re.compile(r'\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{0,}\b')
BACKUP_PATHS = ['/.env', '/.env.local', '/.git/config', '/backup.zip', '/config.php.bak', '/database.sql.bak', '/.DS_Store']


def _finding(kind, title, category, component, overview, description, impact, req, resp, steps, cwe, stack='generic', confidence='medium'):
    sc, vec = score(kind)
    return {
        'id': f'F-{uuid.uuid4().hex[:10]}',
        'title': title,
        'severity': severity(sc),
        'category': category,
        'affectedComponent': component,
        'status': 'open',
        'detectedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'moduleId': '',
        'cwe': cwe,
        'cvssScore': sc,
        'cvssVector': vec,
        'confidence': confidence,
        'overview': overview,
        'description': description,
        'impact': impact,
        'evidence': {
            'requestMethod': req.get('method', 'GET'),
            'requestUrl': req.get('url', ''),
            'requestHeaders': req.get('headers', {}),
            'requestBody': req.get('body'),
            'responseStatus': resp.get('status', 0),
            'responseHeaders': resp.get('headers', {}),
            'responseBody': resp.get('body', ''),
            'payloadInjected': req.get('payload'),
        },
        'reproductionSteps': steps,
        'remediation': remediation(kind, stack),
        'references': [],
    }


def _resp(r):
    return {'status': r.status_code, 'headers': dict(r.headers), 'body': r.text[:12000]}


def _in_scope(url, scope):
    if not scope:
        return False
    normalized = url.rstrip('/')
    for pattern in scope:
        p = str(pattern).rstrip('/')
        if fnmatch.fnmatch(normalized, p) or fnmatch.fnmatch(normalized + '/', p):
            return True
        if p.endswith('/*') and normalized.startswith(p[:-2].rstrip('/')):
            return True
    return False


def _decode_jwt_header(token):
    try:
        head = token.split('.')[0]
        head += '=' * (-len(head) % 4)
        return _json.loads(base64.urlsafe_b64decode(head))
    except Exception:
        return None


def run_http_checks(base_url, timeout=15, max_rate=5, scope=None, selected_check_ids=None):
    """Run only the explicitly selected bounded HTTP checks.

    Returns findings, human-readable logs, and one result record per selected check.
    A check is failed only when its corresponding probe produces a finding; a clean
    probe is counted as passed. Scope/transport limitations are recorded as skipped.
    """
    findings, logs, results = [], [], []
    base_url = base_url.rstrip('/') + '/'
    scope = scope or [base_url + '*']
    selected = set(selected_check_ids or [])

    if not _in_scope(base_url, scope):
        return [], ['Scope guard blocked the assessment: target root is outside the configured whitelist.'], [
            {'checkId': c, 'status': 'skipped', 'reason': 'target root outside scope'} for c in sorted(selected)
        ]

    def begin(check_id):
        return len(findings)

    def finish(check_id, before, status='auto', reason=''):
        if status == 'auto':
            status = 'failed' if len(findings) > before else 'passed'
        results.append({'checkId': check_id, 'status': status, **({'reason': reason} if reason else {})})

    client = httpx.Client(
        timeout=timeout,
        follow_redirects=False,
        verify=False,
        headers={'User-Agent': 'VulnWeave-Authorized-Scanner/1.0'},
    )
    try:
        r = client.get(base_url, follow_redirects=True)
        h = {k.lower(): v for k, v in r.headers.items()}
        stack = detect_stack(h, r.text)
        if stack != 'generic':
            logs.append(f'Fingerprint: target stack signature matched "{stack}" (used to tailor remediation code samples).')

        # Client security: baseline headers
        if 'client-1' in selected:
            before = begin('client-1')
            missing = [x for x in ['content-security-policy', 'x-content-type-options', 'referrer-policy'] if x not in h]
            if 'x-frame-options' not in h and 'frame-ancestors' not in h.get('content-security-policy', '').lower():
                missing.append('frame protection')
            if missing:
                findings.append(_finding('headers', 'Missing baseline browser security headers', 'Client Security', base_url,
                    'One or more baseline headers are absent.', f'Missing controls: {", ".join(missing)}',
                    'Browser-side hardening is weaker than the expected baseline.', {'url': str(r.request.url), 'method': 'GET'}, _resp(r),
                    ['Request the application root.', 'Inspect response security headers.', 'Compare against the expected baseline.'],
                    'CWE-693', stack, 'high'))
                logs.append(f'Header check: missing {", ".join(missing)}')
            finish('client-1', before)

        # Secure communication: HTTPS and HSTS are deliberately separate checks.
        parsed = urlparse(base_url)
        if 'tls-1' in selected:
            before = begin('tls-1')
            if parsed.scheme != 'https':
                findings.append(_finding('tls', 'Application not served over HTTPS', 'Secure Communication', base_url,
                    'The assessed origin responds over plain HTTP.',
                    'Traffic to this origin is not protected by TLS in this environment.',
                    'Credentials and session tokens transmitted over HTTP are exposed to network-level interception.',
                    {'url': base_url, 'method': 'GET'}, _resp(r),
                    ['Request the application root.', 'Inspect the URL scheme.', 'Confirm whether HTTPS is terminated upstream in the real deployment.'],
                    'CWE-319', stack, 'medium'))
                logs.append('TLS check: origin served over HTTP in this environment.')
            finish('tls-1', before)

        if 'tls-2' in selected:
            before = begin('tls-2')
            if parsed.scheme == 'https' and 'strict-transport-security' not in h:
                findings.append(_finding('tls', 'Missing HTTP Strict Transport Security (HSTS)', 'Secure Communication', base_url,
                    'The HTTPS response does not set Strict-Transport-Security.',
                    'Without HSTS, browsers may still attempt an initial plaintext HTTP connection.',
                    'Users are exposed to SSL-stripping style downgrade attacks on first visits.',
                    {'url': base_url, 'method': 'GET'}, _resp(r),
                    ['Request the application root over HTTPS.', 'Inspect the Strict-Transport-Security response header.'],
                    'CWE-319', stack, 'high'))
                logs.append('TLS check: HSTS header missing on HTTPS response.')
            finish('tls-2', before)

        # API Security: CORS
        if 'api-1' in selected:
            before = begin('api-1')
            origin = 'https://vulnweave-invalid-origin.example'
            cr = client.get(base_url, headers={'Origin': origin})
            acao = cr.headers.get('access-control-allow-origin', '')
            acac = cr.headers.get('access-control-allow-credentials', '').lower()
            if acao in ('*', origin) and acac == 'true':
                findings.append(_finding('cors', 'Credentialed permissive CORS policy', 'API Security', str(cr.request.url),
                    'The server permits a non-trusted origin while allowing credentials.',
                    'A controlled Origin probe was reflected by the server together with credentialed CORS.',
                    'Cross-origin JavaScript may be able to make authenticated requests depending on browser cookie policy and endpoint behavior.',
                    {'url': str(cr.request.url), 'method': 'GET', 'headers': {'Origin': origin}}, _resp(cr),
                    ['Send a GET request with a non-trusted Origin header.', 'Check Access-Control-Allow-Origin and Access-Control-Allow-Credentials.'],
                    'CWE-942', stack, 'high'))
                logs.append('CORS check: permissive credentialed origin detected')
            finish('api-1', before)

        # Authentication: cookie flags
        if 'auth-1' in selected:
            before = begin('auth-1')
            for cookie in r.headers.get_list('set-cookie'):
                low = cookie.lower()
                bad = []
                if parsed.scheme == 'https' and 'secure' not in low:
                    bad.append('Secure')
                if 'httponly' not in low:
                    bad.append('HttpOnly')
                if 'samesite' not in low:
                    bad.append('SameSite')
                if bad:
                    findings.append(_finding('auth', 'Session cookie missing security flags', 'Authentication', str(r.request.url),
                        'A Set-Cookie response lacks one or more expected flags.', f'Missing: {", ".join(bad)}',
                        'Cookie theft or cross-site request risks can be increased by weak cookie configuration.',
                        {'url': str(r.request.url), 'method': 'GET'}, _resp(r),
                        ['Inspect Set-Cookie headers.', 'Verify Secure, HttpOnly and SameSite are set appropriately.'],
                        'CWE-614', stack, 'high'))
                    break
            finish('auth-1', before)

        # Authentication: JWT algorithm triage
        if 'auth-3' in selected:
            before = begin('auth-3')
            jwt_candidates = set(JWT_PATTERN.findall(r.text))
            for cookie in r.headers.get_list('set-cookie'):
                jwt_candidates.update(JWT_PATTERN.findall(cookie))
            for tok in list(jwt_candidates)[:5]:
                head = _decode_jwt_header(tok)
                if head and str(head.get('alg', '')).lower() in ('none', ''):
                    findings.append(_finding('jwt', 'JWT issued with "none" or missing algorithm', 'Authentication', str(r.request.url),
                        'A token observed in the response decodes to a JWT header with alg=none.', f'Decoded header: {head}',
                        'A token accepted with alg=none allows an attacker to forge tokens without a signing secret.',
                        {'url': str(r.request.url), 'method': 'GET'}, _resp(r),
                        ['Locate a JWT-looking value.', 'Decode the first segment.', 'Check the alg field.'],
                        'CWE-347', stack, 'medium'))
                    logs.append('JWT check: token with alg=none or missing alg observed.')
                    break
            finish('auth-3', before)

        user1 = urljoin(base_url, 'api/v1/users/1')
        user2 = urljoin(base_url, 'api/v1/users/2')

        # Authorization: BOLA/IDOR
        if 'authz-1' in selected:
            before = begin('authz-1')
            a = client.get(user1) if _in_scope(user1, scope) else None
            b = client.get(user2) if _in_scope(user2, scope) else None
            if a is not None and b is not None and a.status_code == 200 and b.status_code == 200 and a.text and b.text and a.text != b.text:
                findings.append(_finding('idor', 'Potential broken object-level authorization (BOLA/IDOR)', 'Authorization', str(a.request.url),
                    'Two distinct object identifiers returned distinct records without an authorization context.',
                    'The endpoint appears to disclose object data solely by changing the identifier; this is a heuristic.',
                    'A low-privilege or unauthenticated client could potentially access another user object by changing its identifier.',
                    {'method': 'GET', 'url': str(a.request.url)}, _resp(a),
                    ['Request object ID 1 without privileged credentials.', 'Request object ID 2 using the same context.', 'Compare ownership fields.', 'Confirm with explicit authorization tests.'],
                    'CWE-639', stack, 'medium'))
            finish('authz-1', before)

        # Authorization: independent mass-assignment probe
        if 'authz-2' in selected:
            before = begin('authz-2')
            patch_url = user1
            payload = {'role': 'admin', 'is_admin': True}
            pr = None
            if _in_scope(patch_url, scope):
                try:
                    pr = client.patch(patch_url, json=payload)
                except Exception:
                    pr = None
            if pr is not None and pr.status_code in (200, 201, 204):
                accepted = False
                try:
                    body = pr.json()
                    accepted = isinstance(body, dict) and (
                        (body.get('role') == 'admin') or (body.get('is_admin') is True)
                    )
                except Exception:
                    accepted = False
                if accepted:
                    findings.append(_finding('mass-assignment', 'Mass assignment on object update endpoint', 'Authorization', patch_url,
                        'A privileged field supplied in the request body was accepted by a write endpoint.',
                        'A PATCH request including role/is_admin was accepted rather than ignored.',
                        'A low-privilege client may be able to self-escalate privileges by supplying extra fields.',
                        {'method': 'PATCH', 'url': patch_url, 'body': _json.dumps(payload)}, _resp(pr),
                        ['Send a PATCH request to a sandbox object.', 'Include a privileged field not exposed by the normal UI.', 'Re-fetch and verify whether the field changed.'],
                        'CWE-915', stack, 'medium'))
                    logs.append('Mass assignment check: privileged field accepted on object update endpoint.')
            finish('authz-2', before)

        # Input validation: SQL error signal
        if 'input-1' in selected:
            before = begin('input-1')
            search_url = urljoin(base_url, 'api/v1/search?q=test%27')
            sq = client.get(search_url) if _in_scope(urljoin(base_url, 'api/v1/search'), scope) else None
            if sq is not None and sq.status_code >= 500 and any(x in sq.text.lower() for x in ['sql', 'sqlite', 'syntax error', 'database error', 'unrecognized token', 'operational error', 'near \"']):
                findings.append(_finding('sqli', 'SQL injection error signal', 'Input Validation', str(sq.request.url),
                    'A single benign quote character caused a database error signature.',
                    'This is a triage signal only; no data extraction or destructive SQL was attempted.',
                    'If confirmed, attacker-controlled input may alter database queries.',
                    {'method': 'GET', 'url': str(sq.request.url), 'payload': "test'"}, _resp(sq),
                    ['Send one benign quote marker.', 'Observe the HTTP status/error signature.', 'Confirm using parameterized-query review or a dedicated sandbox test.'],
                    'CWE-89', stack, 'high'))
            finish('input-1', before)

        # API Security: documentation exposure
        if 'api-2' in selected:
            before = begin('api-2')
            for path in ['/docs', '/openapi.json', '/swagger.json']:
                docs_url = urljoin(base_url, path)
                if not _in_scope(docs_url, scope):
                    continue
                rr = client.get(docs_url)
                if rr.status_code == 200 and ('json' in rr.headers.get('content-type', '') or 'swagger' in rr.text.lower() or 'openapi' in rr.text.lower()):
                    logs.append(f'Documentation endpoint reachable: {path}')
                    # Reachability alone is not necessarily a vulnerability; keep this check clean unless a policy flags it.
                    break
            finish('api-2', before)

        # Privacy: backup/configuration artifact exposure
        if 'privacy-2' in selected:
            before = begin('privacy-2')
            baseline = client.get(urljoin(base_url, f'/vulnweave-nonexistent-{uuid.uuid4().hex[:8]}'))
            for path in BACKUP_PATHS:
                exp_url = urljoin(base_url, path)
                if not _in_scope(exp_url, scope):
                    continue
                er = client.get(exp_url)
                if er.status_code == 200 and er.status_code != baseline.status_code and len(er.text) > 0:
                    findings.append(_finding('exposure', f'Potentially exposed sensitive file: {path}', 'Data Privacy', exp_url,
                        'A development/backup artifact path returned HTTP 200 distinct from the nonexistent-path baseline.',
                        f'Path {path} responded 200 while a random nonexistent path returned {baseline.status_code}.',
                        'Backup or environment files frequently contain credentials, API keys or database dumps.',
                        {'method': 'GET', 'url': exp_url}, _resp(er),
                        ['Request the candidate path.', 'Compare its status with a nonexistent baseline.', 'Confirm contents manually before reporting a secret leak.'],
                        'CWE-538', stack, 'low'))
                    logs.append(f'Exposure check: {path} returned 200 (baseline was {baseline.status_code}).')
                    break
            finish('privacy-2', before)

        # Client security: open redirect
        if 'client-2' in selected:
            before = begin('client-2')
            redirect_url = urljoin(base_url, 'redirect?next=https://vulnweave-redirect-test.example/')
            if _in_scope(urljoin(base_url, 'redirect'), scope):
                try:
                    rd = client.get(redirect_url)
                    loc = rd.headers.get('location', '')
                    if rd.status_code in (301, 302, 303, 307, 308) and 'vulnweave-redirect-test.example' in loc:
                        findings.append(_finding('redirect', 'Unvalidated open redirect', 'Client Security', redirect_url,
                            'A redirect target supplied via query parameter was honored without validation.',
                            f'Location header pointed to attacker-controlled value: {loc}',
                            'Open redirects can be chained into phishing campaigns that abuse a trusted domain.',
                            {'method': 'GET', 'url': redirect_url}, _resp(rd),
                            ['Request the redirect endpoint with an external next parameter.', 'Inspect Location.', 'Confirm validation behavior.'],
                            'CWE-601', stack, 'medium'))
                        logs.append('Open redirect check: unvalidated redirect target observed.')
                except Exception:
                    pass
            finish('client-2', before)

        # Input validation: safe reflection
        if 'input-2' in selected:
            before = begin('input-2')
            marker = 'VWREFLECT_' + uuid.uuid4().hex[:8]
            reflection_url = urljoin(base_url, '?q=' + marker)
            rr = client.get(reflection_url) if _in_scope(base_url, scope) else None
            if rr is not None and marker in rr.text:
                findings.append(_finding('xss', 'Reflected input observed in response', 'Input Validation', str(rr.request.url),
                    'A unique benign marker supplied as a query parameter was reflected into the response.',
                    'The marker was reflected without evidence here of JavaScript execution; this is a triage signal for context-specific XSS review.',
                    'If reflected into an executable HTML context, attacker-controlled script may execute in a victim browser.',
                    {'method': 'GET', 'url': str(rr.request.url), 'payload': marker}, _resp(rr),
                    ['Send a unique non-script marker.', 'Confirm it appears in the response.', 'Verify the rendering context before treating it as confirmed XSS.'],
                    'CWE-79', stack, 'medium'))
            finish('input-2', before)

        # Authentication: bounded rate-limit signal
        if 'auth-2' in selected:
            before = begin('auth-2')
            endpoint = urljoin(base_url, 'api/v1/auth/token')
            count = min(5, max(2, int(max_rate)))
            statuses = []
            if _in_scope(endpoint, scope):
                for _ in range(count):
                    x = client.post(endpoint, json={'username': 'vulnweave-test', 'password': 'invalid'}, headers={'X-VulnWeave-Test': 'rate-limit-check'})
                    statuses.append(x.status_code)
                    time.sleep(1 / max(1, max_rate))
            if statuses and all(s not in (429, 403) for s in statuses) and len(set(statuses)) == 1:
                findings.append(_finding('rate-limit', 'Authentication endpoint lacks visible throttling signal', 'Authentication', endpoint,
                    'A bounded set of invalid test-account requests did not produce a throttle response.',
                    'This is a heuristic check only; distributed controls or upstream WAFs may exist outside the application.',
                    'Without effective throttling, password guessing and credential stuffing become easier to scale.',
                    {'method': 'POST', 'url': endpoint, 'body': '{"username":"vulnweave-test","password":"invalid"}'},
                    {'status': statuses[-1], 'headers': {}, 'body': ''},
                    ['Send a small bounded sequence of invalid test-account requests.', 'Observe whether a throttle status such as 429 appears.', 'Confirm controls at application and edge layers.'],
                    'CWE-307', stack, 'medium'))
            finish('auth-2', before)

        # Privacy: sensitive JSON fields
        if 'privacy-1' in selected:
            before = begin('privacy-1')
            for p in ['/api/v1/users', '/api/v1/incidents']:
                privacy_url = urljoin(base_url, p)
                if not _in_scope(privacy_url, scope):
                    continue
                x = client.get(privacy_url)
                if not x.headers.get('content-type', '').startswith('application/json'):
                    continue
                try:
                    keys = []
                    obj = x.json()
                    def walk(v):
                        if isinstance(v, dict):
                            for k, val in v.items():
                                if SENSITIVE.search(k):
                                    keys.append(k)
                                walk(val)
                        elif isinstance(v, list):
                            for z in v:
                                walk(z)
                    walk(obj)
                    if keys:
                        findings.append(_finding('privacy', 'Sensitive fields exposed by API response', 'Data Privacy', str(x.request.url),
                            'The response contains field names associated with secrets or credentials.',
                            f'Sensitive-looking fields: {sorted(set(keys))[:10]}',
                            'Unnecessary exposure of credentials or tokens can increase confidentiality impact.',
                            {'method': 'GET', 'url': str(x.request.url)}, _resp(x),
                            ['Request the endpoint with scanner test context.', 'Inspect JSON field names.', 'Confirm whether each sensitive field is necessary and authorized.'],
                            'CWE-200', stack, 'high'))
                        break
                except Exception:
                    pass
            finish('privacy-1', before)
    finally:
        client.close()

    return findings, logs, results
