from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, Boolean, DateTime, JSON
from .db import Base

def now(): return datetime.now(timezone.utc)

class Target(Base):
    __tablename__ = "targets"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    environment = Column(String, nullable=False, default="Local Sandbox")
    scope = Column(JSON, nullable=False, default=list)
    request_timeout = Column(Integer, default=15)
    max_request_rate = Column(Integer, default=5)
    status = Column(String, default="Ready")
    is_authorized = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), default=now, onupdate=now)

class SecurityModule(Base):
    __tablename__ = "modules"
    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    checks_count = Column(Integer, default=0)
    estimated_duration = Column(String, default="1–3 min")
    enabled = Column(Boolean, default=True)
    status = Column(String, default="idle")
    findings_count = Column(Integer, default=0)
    checks = Column(JSON, nullable=False, default=list)

class Finding(Base):
    __tablename__ = "findings"
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    category = Column(String, nullable=False)
    affected_component = Column(String, nullable=False)
    status = Column(String, default="open")
    detected_at = Column(DateTime(timezone=True), default=now)
    module_id = Column(String, nullable=False)
    cwe = Column(String, default="CWE-0")
    cvss_score = Column(Float, default=0.0)
    cvss_vector = Column(String, default="")
    confidence = Column(String, default="medium")
    overview = Column(Text, default="")
    description = Column(Text, default="")
    impact = Column(Text, default="")
    evidence = Column(JSON, nullable=False, default=dict)
    reproduction_steps = Column(JSON, nullable=False, default=list)
    remediation = Column(JSON, nullable=False, default=dict)
    references = Column(JSON, nullable=False, default=list)
    run_id = Column(String, nullable=True, index=True)

class AssessmentRun(Base):
    __tablename__ = "assessment_runs"
    id = Column(String, primary_key=True)
    target_id = Column(String, nullable=False)
    target_name = Column(String, nullable=False)
    target_url = Column(String, nullable=False)
    status = Column(String, default="running")
    progress = Column(Integer, default=0)
    started_at = Column(DateTime(timezone=True), default=now)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    total_checks = Column(Integer, default=0)
    passed_checks = Column(Integer, default=0)
    failed_checks = Column(Integer, default=0)
    current_module_id = Column(String, default="")
    current_check_name = Column(String, default="")
    findings_count = Column(JSON, nullable=False, default=dict)
    active_modules = Column(JSON, nullable=False, default=list)
    logs = Column(JSON, nullable=False, default=list)
    check_results = Column(JSON, nullable=False, default=list)

class Chain(Base):
    __tablename__ = "chains"
    id = Column(String, primary_key=True)
    run_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    severity = Column(String, default="medium")
    score = Column(Float, default=0.0)
    status = Column(String, default="proposed")
    node_ids = Column(JSON, nullable=False, default=list)
    edges = Column(JSON, nullable=False, default=list)
    rejection_reason = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=now)

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True)
    run_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    target_name = Column(String, nullable=False)
    target_url = Column(String, nullable=False)
    environment = Column(String, nullable=False)
    assessment_date = Column(String, nullable=False)
    assessor = Column(String, default="VulnWeave")
    executive_summary = Column(Text, default="")
    scope_summary = Column(JSON, nullable=False, default=list)
    methodology = Column(Text, default="")
    findings_distribution = Column(JSON, nullable=False, default=dict)
    finding_ids = Column(JSON, nullable=False, default=list)
    remediation_summary = Column(Text, default="")
    status = Column(String, default="Final")
