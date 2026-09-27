"""
Sentinel Security Assessment Platform - Sample FastAPI Backend Template
========================================================================
Run with:
    pip install fastapi uvicorn pydantic
    uvicorn sample_fastapi_server:app --reload --port 8000

Then set frontend setting:
    Backend Service URL: http://localhost:8000/api
    Data Source Mode: Live API Mode
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

app = FastAPI(title="Sentinel Security Engine API", version="1.0.0")

# CORS middleware allowing Sentinel frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Data Models -----------------
class TargetModel(BaseModel):
    id: str
    name: str
    url: str
    environment: str
    scope: List[str]
    requestTimeout: int
    maxRequestRate: int
    status: str
    isAuthorized: bool

class StartAssessmentRequest(BaseModel):
    moduleIds: List[str]

class UpdateStatusRequest(BaseModel):
    status: str

# ----------------- In-Memory State -----------------
current_target = {
    "id": "tgt-worldmon-01",
    "name": "World Monitor (Test Suite)",
    "url": "https://staging-app.worldmonitor.internal",
    "environment": "Authorized Test Environment",
    "scope": [
        "https://staging-app.worldmonitor.internal/api/v1/incidents/*",
        "https://staging-app.worldmonitor.internal/api/v1/auth/*",
        "https://staging-app.worldmonitor.internal/api/v1/reports/*",
    ],
    "requestTimeout": 15,
    "maxRequestRate": 20,
    "status": "Ready",
    "isAuthorized": True,
}

# ----------------- Endpoints -----------------

@app.get("/api/health")
def health_check():
    """Health status endpoint called by Sentinel frontend status indicator."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat(), "service": "Sentinel FastAPI Engine"}

@app.get("/api/target")
def get_target():
    """Fetch current target configuration."""
    return current_target

@app.put("/api/target")
def update_target(target: TargetModel):
    """Update target configuration and scopes."""
    global current_target
    current_target = target.dict()
    return current_target

@app.post("/api/target/test-connection")
def test_connection(payload: Dict[str, str]):
    """Test connection and TLS handshake with authorized target endpoint."""
    url = payload.get("url", "")
    # In real backend, execute a safe HEAD/GET probe here
    return {
        "success": True,
        "responseTimeMs": 118,
        "statusText": f"Connected to {url} (HTTP 200 OK)"
    }

@app.post("/api/assessment/start")
def start_assessment(payload: StartAssessmentRequest):
    """Start automated security probe run."""
    run_id = f"run-{int(datetime.utcnow().timestamp())}"
    return {
        "id": run_id,
        "targetId": current_target["id"],
        "targetName": current_target["name"],
        "targetUrl": current_target["url"],
        "status": "running",
        "progress": 5,
        "startedAt": datetime.utcnow().isoformat(),
        "totalChecks": 42,
        "passedChecks": 0,
        "failedChecks": 0,
        "currentModuleId": payload.moduleIds[0] if payload.moduleIds else "mod-auth",
        "currentCheckName": "Initializing target validation checks...",
        "findingsCount": {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0},
        "activeModules": payload.moduleIds,
        "logs": [
            {"id": "l-1", "timestamp": datetime.utcnow().strftime("%H:%M:%S"), "level": "info", "module": "Runner", "message": f"Assessment {run_id} started."}
        ]
    }
