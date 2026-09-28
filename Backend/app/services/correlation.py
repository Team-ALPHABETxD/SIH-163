"""Rule-based attack-chain correlation.

Findings are classified into a small set of "kinds". A directed graph of
kind -> [kinds it enables] encodes how one weakness increases the reach or
impact of another (a precondition/consequence relationship). Chains are
discovered by walking simple paths (length 2-3) through this graph, using
only kinds that actually have at least one finding in the current run.

This is intentionally a v1: a fixed, human-reviewed rule graph rather than a
learned or fully general reasoner, but it is not limited to hand-picked
pairs — any path the graph supports is discovered automatically, including
3-hop chains, as new finding kinds are added.
"""
from collections import defaultdict
from itertools import islice

from .cvss import severity

# kind -> kinds it enables (precondition -> consequence)
GRAPH = {
    'cors': ['idor'],
    'rate-limit': ['auth', 'jwt'],
    'xss': ['privacy'],
    'sqli': ['privacy'],
    'jwt': ['idor'],
    'exposure': ['sqli', 'auth'],
    'mass-assignment': ['idor'],
    'redirect': ['auth'],
}

LABELS = {
    'cors': 'a permissive cross-origin policy',
    'idor': 'a broken object-level authorization weakness',
    'rate-limit': 'the absence of authentication throttling',
    'auth': 'a session/authentication weakness',
    'xss': 'a client-side injection weakness',
    'privacy': 'excessive data exposure in API responses',
    'sqli': 'an injection signal',
    'jwt': 'a forgeable or unsigned authentication token',
    'exposure': 'an exposed backup/configuration artifact',
    'mass-assignment': 'a mass-assignment weakness',
    'redirect': 'an unvalidated redirect',
}


def _kind(f):
    title = (f.get('title') or '').lower()
    category = (f.get('category') or '').lower()
    cwe = (f.get('cwe') or '').lower()
    if 'cors' in title or 'cors' in category or cwe == 'cwe-942':
        return 'cors'
    if 'idor' in title or 'object-level authorization' in title or cwe == 'cwe-639':
        return 'idor'
    if 'rate limit' in title or 'throttl' in title or cwe == 'cwe-307':
        return 'rate-limit'
    if 'cookie' in title or 'session' in title or cwe == 'cwe-614':
        return 'auth'
    if 'xss' in title or 'reflected input' in title or cwe == 'cwe-79':
        return 'xss'
    if 'sql injection' in title or 'injection' in title or cwe == 'cwe-89':
        return 'sqli'
    if 'jwt' in title or 'alg=none' in title or cwe == 'cwe-347':
        return 'jwt'
    if 'exposed' in title or 'backup' in title or cwe == 'cwe-538':
        return 'exposure'
    if 'mass assignment' in title or cwe == 'cwe-915':
        return 'mass-assignment'
    if 'redirect' in title or cwe == 'cwe-601':
        return 'redirect'
    if 'privacy' in category or 'sensitive fields' in title or cwe == 'cwe-200':
        return 'privacy'
    return category


def _paths_from(node, graph, max_depth, visited):
    """Yield simple paths starting at node, up to max_depth nodes."""
    yield [node]
    if len(visited) >= max_depth:
        return
    for nxt in graph.get(node, []):
        if nxt in visited:
            continue
        for sub in _paths_from(nxt, graph, max_depth, visited | {nxt}):
            yield [node] + sub


def correlate(findings, max_chains=8, max_depth=3):
    by = defaultdict(list)
    for f in findings:
        by[_kind(f)].append(f)

    all_paths = []
    for start in GRAPH:
        if not by[start]:
            continue
        for path in _paths_from(start, GRAPH, max_depth, {start}):
            if len(path) >= 2 and all(by[k] for k in path):
                all_paths.append(path)

    # De-duplicate by node-kind sequence, keep the longest chain when one path
    # is a prefix of another (a 3-hop chain supersedes its 2-hop sub-chain).
    unique = {}
    for p in all_paths:
        key = tuple(p)
        unique[key] = p
    paths = list(unique.values())
    prefixes_to_drop = set()
    for p in paths:
        for q in paths:
            if p != q and len(q) < len(p) and tuple(p[:len(q)]) == tuple(q):
                prefixes_to_drop.add(tuple(q))
    paths = [p for p in paths if tuple(p) not in prefixes_to_drop]

    chains = []
    for path in paths:
        selected = [by[k][0] for k in path]
        base_score = max(x.get('cvssScore', 0) for x in selected)
        # Each additional hop compounds the effective risk (bounded at 10.0).
        score = min(10.0, base_score + 0.5 * (len(path) - 1))
        title = ' \u2192 '.join(LABELS.get(k, k).capitalize() if i == 0 else LABELS.get(k, k) for i, k in enumerate(path))
        description = (
            f"{LABELS.get(path[0], path[0]).capitalize()} can be combined with "
            + ' and then '.join(LABELS.get(k, k) for k in path[1:])
            + f" to form a {len(path)}-step attack path with higher combined impact than any single finding alone."
        )
        chains.append({
            'title': title,
            'description': description,
            'severity': severity(score),
            'score': round(score, 1),
            'node_ids': [x['id'] for x in selected],
            'edges': [{'source': selected[i]['id'], 'target': selected[i + 1]['id'], 'label': 'enables'} for i in range(len(selected) - 1)],
        })

    chains.sort(key=lambda c: c['score'], reverse=True)
    return chains[:max_chains]
