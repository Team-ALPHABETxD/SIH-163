# VulnWeave — SIH 26163

VulnWeave is an authorized security-assessment platform: a FastAPI orchestration layer, normalized findings store, rule-based attack-chain correlation, remediation templates, report generation, and the supplied React/Vite frontend.

## Fastest demo

Requirements: Docker Desktop with Compose.

```powershell
docker compose up --build
```

Open:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Local attack lab: http://localhost:9000

In the frontend go to **Settings**, disable **Mock Mode**, keep the backend URL `http://localhost:8000/api`, save, then open **Target**. The target is preconfigured as the authorized local sandbox.

Start an assessment from **New Assessment / New Scan**. The current built-in registry contains 15 bounded checks across the seven modules; optional Nuclei/testssl.sh adapters can enrich findings when their binaries are installed. The engine performs bounded, non-destructive HTTP checks against the local lab, normalizes findings, proposes attack chains, and makes the findings/report available in the UI.

## What is included

- FastAPI backend matching the supplied frontend API contract
- SQLite for quick local Python development; PostgreSQL in Compose
- Authorization gate and rules-of-engagement file
- 15 bounded HTTP security checks: browser headers, HTTPS/HSTS, credentialed CORS, cookie flags, JWT algorithm triage, BOLA/IDOR, mass assignment, SQL error signal, API documentation discovery, backup/config exposure, open redirect, reflected-input triage, authentication throttling heuristic, and sensitive-field exposure
- Finding normalization and CVSS v3.1 decision mapping
- Rule-based attack-chain correlation with human review state
- PDF and Markdown reports
- WebSocket-ready architecture point for future live streaming; REST polling is the current frontend fallback
- Intentionally vulnerable local Attack Lab for repeatable validation

## Important boundary

Use active testing only on the local Attack Lab or an explicitly authorized staging clone that you control. Do not point the active scanner at the public World Monitor production service. The supplied methodology explicitly requires active/intrusive testing to stay inside the self-hosted sandbox.

## Optional external scanners

The platform's module model is designed for ZAP, Nuclei, testssl.sh, jwt_tool, sqlmap, Semgrep and trufflehog adapters. The default demo deliberately uses bounded Python checks so the project works without downloading heavyweight security-tool images. Two adapters (`nuclei`, `testssl.sh`) will actually **execute** if their binary is present on PATH inside the backend container and fold real findings into the same pipeline (`Backend/app/services/tool_adapters.py`); if the binary is absent they no-op instantly and never block a run. Integrate the rest inside the authorized sandbox only, and preserve the request/time limits in `config/rules_of_engagement.yaml`.

## Upgrades in this revision

- **New checks:** JWT `alg=none`/missing-alg triage, mass-assignment probe (PATCH with a privileged field), backup/dev-artifact exposure scan (`.env`, `.git/config`, etc.), unvalidated open-redirect probe, and an actual TLS/HSTS check for the "Secure Communication" module (previously defined but never populated).
- **Stack-aware remediation:** `services/fingerprint.py` passively fingerprints the target stack (FastAPI/Express/Django/Flask/Next.js/Spring) from response headers/body; `services/remediation.py` now returns a framework-specific code sample per finding kind, falling back to a generic sample when the stack isn't recognized.
- **Generalized correlation engine:** `services/correlation.py` replaced the 4 hardcoded finding-pairs with a directed graph of precondition→consequence "enables" edges and a path search (up to 3 hops), so new finding kinds automatically participate in chain discovery instead of needing a new hardcoded rule.
- **Fixed a module-attribution bug:** `services/engine.py`'s old substring match (`'auth' in category`) mis-routed every "Authorization" finding into the Authentication module, since "authorization" contains "auth". Findings/module counts now use an exact-match lookup.
- **Assessment-scoped state:** findings, attack chains, reports, and telemetry are tied to a specific assessment run so repeated scans cannot mix historical results.
- **CI security gate:** `.github/workflows/security-gate.yml` + `scripts/ci_security_gate.py` explicitly authorize the local Attack Lab, run the pipeline against that sandbox, poll the exact run ID, and fail if findings exceed configurable thresholds.
- **Attack Lab additions:** `DemoTarget/app.py` gained a `PATCH /api/v1/users/{id}` (mass assignment), `GET /redirect?next=` (open redirect), and `GET /.env` (fake leaked secrets) so the new checks above have something real to find during the demo.

## Clean restart

For a completely fresh local demonstration database:

```powershell
docker compose down -v --remove-orphans
docker compose up --build
```

Then open `http://localhost:3000`, keep Live API mode enabled (Mock Mode OFF), verify the local target, and start a new assessment. The UI layout is unchanged; live counters now come from the current assessment run rather than seeded/hardcoded values.

## V1.1 — Data-driven workspace

V1.1 removes synthetic assessment state from the live dashboard. A fresh installation contains target/module configuration only; it does not seed a fake assessment, finding set, attack graph, or report.

- Dashboard counters, posture, findings, activity, and scope are derived from persisted backend data.
- Assessment history is stored in PostgreSQL and surfaced from the dashboard.
- Findings and attack chains can be opened for a specific assessment run.
- Generated reports are associated with their assessment run and can be opened from assessment history.
- Empty-state views are shown until a real assessment is completed.
- IndexedDB is not used as a second source of truth; PostgreSQL remains authoritative so historical results cannot diverge between browser and backend.
- Mock Mode remains available as an explicit development option, but the packaged environment defaults to Live API mode and contains no seeded mock findings/reports.
