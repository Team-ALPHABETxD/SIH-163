import { TargetConfig, SecurityModule, SecurityFinding, AssessmentRun, AssessmentReport, ActivityItem } from '../../types';

export const mockTarget: TargetConfig = {
  id: '',
  name: '',
  url: '',
  environment: 'Authorized Test Environment',
  scope: [],
  requestTimeout: 0,
  maxRequestRate: 0,
  status: 'Ready',
  isAuthorized: false,
};

export const mockModules: SecurityModule[] = [];
export const mockFindings: SecurityFinding[] = [];

export const mockAssessmentRun: AssessmentRun = {
  id: '',
  targetId: '',
  targetName: '',
  targetUrl: '',
  status: 'stopped',
  progress: 0,
  startedAt: '',
  totalChecks: 0,
  passedChecks: 0,
  failedChecks: 0,
  currentModuleId: '',
  currentCheckName: '',
  findingsCount: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  },
  activeModules: [],
  logs: [],
};

export const mockReports: AssessmentReport[] = [];
export const mockActivityItems: ActivityItem[] = [];
