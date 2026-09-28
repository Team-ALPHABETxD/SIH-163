# Sentinel Backend API Integration Specification

This document details the exact REST API contracts expected by the Sentinel Security Assessment frontend.

The frontend communicates with your **FastAPI** or **Flask** backend using standard JSON HTTP requests.

---

## 1. Backend Configuration in Frontend

- **Environment Variable**: `VITE_API_BASE_URL` (default: `http://localhost:8000/api`)
- **Runtime Switching**: Users can toggle between **Mock Mode** and **Live API Mode** at runtime in **Platform Settings** (`/settings`), or via `localStorage.setItem('sentinel_use_mock_data', 'false')`.

---

## 2. Required API Endpoints

### 2.1 Health Check
- **`GET /api/health`**
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "service": "Sentinel Engine"
  }
  ```

---

### 2.2 Target Management
- **`GET /api/target`**
  - Returns current target configuration:
  ```json
  {
    "id": "tgt-worldmon-01",
    "name": "World Monitor (Test Suite)",
    "url": "https://staging-app.worldmonitor.internal",
    "environment": "Authorized Test Environment",
    "scope": [
      "https://staging-app.worldmonitor.internal/api/v1/incidents/*",
      "https://staging-app.worldmonitor.internal/api/v1/auth/*"
    ],
    "requestTimeout": 15,
    "maxRequestRate": 20,
    "status": "Ready",
    "isAuthorized": true
  }
  ```

- **`PUT /api/target`**
  - Updates target settings. Receives partial or full target JSON.
  - Returns updated `TargetConfig`.

- **`POST /api/target/test-connection`**
  - Request body: `{ "url": "https://..." }`
  - Response:
  ```json
  {
    "success": true,
    "responseTimeMs": 142,
    "statusText": "HTTP 200 OK (TLS 1.3 Handshake Succeeded)"
  }
  ```

---

### 2.3 Assessment Modules
- **`GET /api/modules`**
  - Returns array of `SecurityModule` objects.
  - Slug values:
    - `authentication`
    - `authorization`
    - `api-security`
    - `input-validation`
    - `client-security`
    - `communication`
    - `data-privacy`

- **`POST /api/modules/{id}/toggle`**
  - Body: `{ "enabled": boolean }`
  - Returns updated `SecurityModule`.

---

### 2.4 Assessment Execution
- **`POST /api/assessment/start`**
  - Body: `{ "moduleIds": ["mod-auth", "mod-authz", "mod-api"] }`
  - Starts async security testing task on target.
  - Returns initial `AssessmentRun` object.

- **`GET /api/assessment/running`**
  - Returns active assessment telemetry:
  ```json
  {
    "id": "run-9021",
    "targetName": "World Monitor (Test Suite)",
    "targetUrl": "https://staging-app.worldmonitor.internal",
    "status": "running",
    "progress": 74,
    "totalChecks": 15,
    "passedChecks": 0,
    "failedChecks": 7,
    "currentCheckName": "Testing SQL parameterization across /api/v1/incidents",
    "findingsCount": {
      "critical": 1,
      "high": 2,
      "medium": 2,
      "low": 1,
      "info": 1
    },
    "logs": [
      {
        "id": "l-1",
        "timestamp": "18:41:22",
        "level": "error",
        "module": "Authorization",
        "message": "CRITICAL: BOLA/IDOR confirmed on /api/v1/incidents/{incident_id}"
      }
    ]
  }
  ```

- **`POST /api/assessment/{id}/pause`**
- **`POST /api/assessment/{id}/stop`**
- **`GET /api/assessment/activity`**

---

### 2.5 Security Findings & Evidence
- **`GET /api/findings`**
  - Returns array of `SecurityFinding` objects with technical evidence, reproduction steps, and remediation guides.
- **`GET /api/findings/{id}`**
- **`PATCH /api/findings/{id}/status`**
  - Body: `{ "status": "open" | "in_review" | "resolved" | "accepted_risk" }`

---

### 2.6 Reports
- **`GET /api/reports`**
- **`GET /api/reports/{id}`**
- **`GET /api/reports/{id}/pdf`**

---

## 3. Sample Backend Implementations Provided

Ready-to-use boilerplate templates are available in:
- `src/api/sample_fastapi_server.py` (FastAPI)
- `src/api/sample_flask_server.py` (Flask)
