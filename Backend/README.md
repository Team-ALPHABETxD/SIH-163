# VulnWeave Backend

FastAPI orchestration/API layer for the SIH VulnWeave platform. It provides the frontend contract, an authorization gate, bounded HTTP checks, finding normalization, CVSS decision mapping, attack-chain correlation, and PDF/Markdown reporting.

The active checks are intentionally bounded and designed for the self-hosted/local sandbox. The backend refuses to start an assessment unless the target is explicitly marked authorized.

## Local run

```powershell
cd Backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Database

SQLite is the default for the simplest local run. Docker Compose uses PostgreSQL and the same SQLAlchemy models.

## Safety boundary

Only mark a target authorized when you control or have explicit authorization to assess it. For SIH, use the Dockerized DemoTarget or your self-hosted World Monitor staging clone. Do not run active/intrusive checks against the public production World Monitor service.
