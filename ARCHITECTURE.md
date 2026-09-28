# VulnWeave connected architecture

Frontend (React/Vite/TS) -> FastAPI REST API -> SQLAlchemy -> PostgreSQL (Compose)\n                         |-> bounded HTTP assessment engine -> authorized target sandbox\n                         |-> normalization -> CVSS decision mapping -> correlation engine\n                         |-> remediation templates -> report generator -> PDF/Markdown\n                         |-> optional external-tool inventory/adapters

The frontend uses the supplied `BACKEND_SPEC.md` contract. The backend implements the health, target, module, assessment, findings, chains, and report endpoints. The graph page now consumes the backend chain/finding data rather than hard-coded graph nodes.
