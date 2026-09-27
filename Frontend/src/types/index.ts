export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingStatus = 'open' | 'in_review' | 'resolved' | 'accepted_risk';

export interface TargetConfig {
  id: string;
  name: string;
  url: string;
  environment: 'Authorized Test Environment' | 'Staging' | 'Local Sandbox';
  scope: string[];
  requestTimeout: number; // in seconds
  maxRequestRate: number; // requests per second
  authHeaderPrefix?: string;
  lastAssessed?: string;
  status: 'Ready' | 'Assessing' | 'Unreachable';
  isAuthorized: boolean;
}

export interface SecurityModule {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  checksCount: number;
  estimatedDuration: string;
  enabled: boolean;
  status: 'passed' | 'warning' | 'failed' | 'idle' | 'running';
  latestRun?: string;
  findingsCount: number;
  checks: {
    id: string;
    name: string;
    description: string;
    status: 'passed' | 'warning' | 'failed' | 'pending';
    standardRef: string; // e.g. "OWASP API1:2023"
  }[];
}

export interface TechnicalEvidence {
  requestMethod: string;
  requestUrl: string;
  requestHeaders: Record<string, string>;
  requestBody?: string;
  responseStatus: number;
  responseHeaders: Record<string, string>;
  responseBody: string;
  payloadInjected?: string;
}

export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  affectedComponent: string;
  status: FindingStatus;
  detectedAt: string;
  moduleId: string;
  cwe: string;
  cvssScore: number;
  overview: string;
  description: string;
  impact: string;
  evidence: TechnicalEvidence;
  reproductionSteps: string[];
  remediation: {
    summary: string;
    codeExample?: string;
    language?: string;
    recommendations: string[];
  };
  references: {
    title: string;
    url: string;
  }[];
}

export interface AssessmentRun {
  id: string;
  targetId: string;
  targetName: string;
  targetUrl: string;
  status: 'running' | 'completed' | 'paused' | 'stopped';
  progress: number;
  startedAt: string;
  completedAt?: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  currentModuleId: string;
  currentCheckName: string;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  activeModules: string[];
  logs: {
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'success';
    module: string;
    message: string;
  }[];
}

export interface AssessmentReport {
  id: string;
  title: string;
  targetName: string;
  targetUrl: string;
  environment: string;
  assessmentDate: string;
  assessor: string;
  executiveSummary: string;
  scopeSummary: string[];
  methodology: string;
  findingsDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  findings: SecurityFinding[];
  remediationSummary: string;
  status: 'Final' | 'Draft';
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  message: string;
  module: string;
  type: 'completed' | 'started' | 'finding' | 'config';
}
