"""
Sentinel Security Assessment Platform - Sample Flask Backend Template
=====================================================================
Run with:
    pip install flask flask-cors
    python sample_flask_server.py

Then in frontend Settings:
    Backend Service URL: http://localhost:8000/api
    Data Source Mode: Live API Mode
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from Sentinel frontend

current_target = {
    "id": "tgt-worldmon-01",
    "name": "World Monitor (Test Suite)",
    "url": "https://staging-app.worldmonitor.internal",
    "environment": "Authorized Test Environment",
    "scope": [
        "https://staging-app.worldmonitor.internal/api/v1/incidents/*",
        "https://staging-app.worldmonitor.internal/api/v1/auth/*",
    ],
    "requestTimeout": 15,
    "maxRequestRate": 20,
    "status": "Ready",
    "isAuthorized": True,
}

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Sentinel Flask Engine",
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route("/api/target", methods=["GET", "PUT"])
def target_endpoint():
    global current_target
    if request.method == "GET":
        return jsonify(current_target)
    elif request.method == "PUT":
        data = request.get_json() or {}
        current_target.update(data)
        return jsonify(current_target)

@app.route("/api/target/test-connection", methods=["POST"])
def test_connection():
    data = request.get_json() or {}
    url = data.get("url", "")
    return jsonify({
        "success": True,
        "responseTimeMs": 135,
        "statusText": f"Handshake verified for {url} (HTTP 200 OK)"
    })

@app.route("/api/assessment/start", methods=["POST"])
def start_assessment():
    data = request.get_json() or {}
    module_ids = data.get("moduleIds", [])
    return jsonify({
        "id": f"run-{int(datetime.utcnow().timestamp())}",
        "targetId": current_target["id"],
        "targetName": current_target["name"],
        "targetUrl": current_target["url"],
        "status": "running",
        "progress": 10,
        "startedAt": datetime.utcnow().isoformat(),
        "totalChecks": 15,
        "passedChecks": 0,
        "failedChecks": 0,
        "currentModuleId": module_ids[0] if module_ids else "mod-auth",
        "currentCheckName": "Executing initial DNS and TLS protocol audit...",
        "findingsCount": {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0},
        "activeModules": module_ids,
        "logs": [
            {"id": "l-1", "timestamp": datetime.utcnow().strftime("%H:%M:%S"), "level": "info", "module": "Dispatcher", "message": "Initialized assessment task."}
        ]
    })

if __name__ == "__main__":
    app.run(port=8000, debug=True)
