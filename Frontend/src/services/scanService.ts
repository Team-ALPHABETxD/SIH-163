import { apiClient, getUseMockData } from './apiClient';
import { AssessmentRun, AssessmentHistoryItem, SecurityModule, ActivityItem } from '../types';
import { mockAssessmentRun, mockModules, mockActivityItems } from '../data/mock/mockData';

let currentRunState: AssessmentRun = { ...mockAssessmentRun };
let currentModulesState: SecurityModule[] = [...mockModules];
let currentActivityState: ActivityItem[] = [...mockActivityItems];

export const assessmentApi = {
  async getModules(): Promise<SecurityModule[]> {
    if (getUseMockData()) {
      return [...currentModulesState];
    }
    const res = await apiClient<SecurityModule[]>('/modules');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getModuleBySlug(slug: string): Promise<SecurityModule | undefined> {
    if (getUseMockData()) {
      return currentModulesState.find(m => m.slug === slug || m.id === slug);
    }
    const res = await apiClient<SecurityModule>(`/modules/${slug}`);
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async toggleModule(id: string, enabled: boolean): Promise<SecurityModule> {
    if (getUseMockData()) {
      currentModulesState = currentModulesState.map(m => m.id === id ? { ...m, enabled } : m);
      const updated = currentModulesState.find(m => m.id === id)!;
      return updated;
    }
    const res = await apiClient<SecurityModule>(`/modules/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async startAssessment(moduleIds: string[]): Promise<AssessmentRun> {
    if (getUseMockData()) {
      currentRunState = {
        ...mockAssessmentRun,
        id: `run-${Date.now().toString().slice(-4)}`,
        status: 'running',
        progress: 10,
        startedAt: new Date().toISOString(),
        activeModules: moduleIds,
      };
      currentActivityState.unshift({
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        module: 'Assessment Engine',
        message: `Assessment ${currentRunState.id} started on authorized scope (${moduleIds.length} modules active)`,
        type: 'started',
      });
      return { ...currentRunState };
    }
    const res = await apiClient<AssessmentRun>('/assessment/start', {
      method: 'POST',
      body: JSON.stringify({ moduleIds }),
    });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getAssessmentHistory(): Promise<AssessmentHistoryItem[]> {
    if (getUseMockData()) return [];
    const res = await apiClient<AssessmentHistoryItem[]>('/assessments');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getRunningAssessment(): Promise<AssessmentRun> {
    if (getUseMockData()) {
      return { ...currentRunState };
    }
    const res = await apiClient<AssessmentRun>('/assessment/running');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async pauseAssessment(id: string): Promise<AssessmentRun> {
    if (getUseMockData()) {
      currentRunState = {
        ...currentRunState,
        status: currentRunState.status === 'paused' ? 'running' : 'paused',
      };
      return { ...currentRunState };
    }
    const res = await apiClient<AssessmentRun>(`/assessment/${id}/pause`, { method: 'POST' });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async stopAssessment(id: string): Promise<AssessmentRun> {
    if (getUseMockData()) {
      currentRunState = {
        ...currentRunState,
        status: 'stopped',
        completedAt: new Date().toISOString(),
      };
      return { ...currentRunState };
    }
    const res = await apiClient<AssessmentRun>(`/assessment/${id}/stop`, { method: 'POST' });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getActivityLog(): Promise<ActivityItem[]> {
    if (getUseMockData()) {
      return [...currentActivityState];
    }
    const res = await apiClient<ActivityItem[]>('/assessment/activity');
    if (res.error) throw new Error(res.error);
    return res.data;
  }
};
