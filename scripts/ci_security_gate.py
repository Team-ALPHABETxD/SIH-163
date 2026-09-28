#!/usr/bin/env python3
"""CI security gate: runs a VulnWeave assessment against the already-running
backend (pointed at the local Attack Lab) and fails the build if critical/high
findings exceed the given thresholds. Used by .github/workflows/security-gate.yml
to demonstrate the "continuous security assurance" pitch from the proposal.
"""
import argparse
import sys
import time

import requests


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base-url', default='http://localhost:8000/api')
    ap.add_argument('--max-critical', type=int, default=0)
    ap.add_argument('--max-high', type=int, default=2)
    ap.add_argument('--timeout-seconds', type=int, default=180)
    args = ap.parse_args()

    print(f'[gate] verifying and explicitly authorizing the local target')
    target = requests.get(f'{args.base_url}/target', timeout=30)
    target.raise_for_status()
    target_data = target.json()
    target_data['isAuthorized'] = True
    if not target_data.get('scope'):
        target_data['scope'] = [target_data['url'].rstrip('/') + '/*']
    authorized = requests.put(f'{args.base_url}/target', json=target_data, timeout=30)
    authorized.raise_for_status()

    print(f'[gate] starting assessment via {args.base_url}/assessment/start')
    r = requests.post(f'{args.base_url}/assessment/start', json={'moduleIds': []}, timeout=30)
    r.raise_for_status()
    run = r.json()
    run_id = run['id']

    deadline = time.time() + args.timeout_seconds
    status = run.get('status')
    while status not in ('completed', 'stopped') and time.time() < deadline:
        time.sleep(3)
        r = requests.get(f'{args.base_url}/assessment/{run_id}', timeout=30)
        if r.status_code != 200:
            continue
        run = r.json()
        status = run.get('status')
        print(f'[gate] assessment {run_id}: {status} ({run.get("progress", 0)}%)')

    if status != 'completed':
        print(f'[gate] assessment did not complete within {args.timeout_seconds}s (last status: {status})')
        sys.exit(2)

    counts = run.get('findingsCount', {})
    critical = counts.get('critical', 0)
    high = counts.get('high', 0)
    print(f'[gate] findings: critical={critical} high={high} medium={counts.get("medium", 0)} low={counts.get("low", 0)}')

    if critical > args.max_critical or high > args.max_high:
        print(f'[gate] FAILED: critical>{args.max_critical} or high>{args.max_high} threshold exceeded.')
        sys.exit(1)

    print('[gate] PASSED: findings within configured thresholds.')


if __name__ == '__main__':
    main()
