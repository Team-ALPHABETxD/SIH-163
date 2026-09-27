import { apiClient, getUseMockData } from './apiClient';
import { SecurityFinding, FindingStatus } from '../types';
import { mockFindings } from '../data/mock/mockData';

let currentFindingsState: SecurityFinding[] = [...mockFindings];

export const findingsApi = {
  async getFindings(): Promise<SecurityFinding[]> {
    if (getUseMockData()) {
      return [...currentFindingsState];
    }
    const res = await apiClient<SecurityFinding[]>('/findings');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getFindingById(id: string): Promise<SecurityFinding | undefined> {
    if (getUseMockData()) {
      return currentFindingsState.find(f => f.id === id);
    }
    const res = await apiClient<SecurityFinding>(`/findings/${id}`);
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async updateFindingStatus(id: string, status: FindingStatus): Promise<SecurityFinding> {
    if (getUseMockData()) {
      currentFindingsState = currentFindingsState.map(f => f.id === id ? { ...f, status } : f);
      const updated = currentFindingsState.find(f => f.id === id)!;
      return updated;
    }
    const res = await apiClient<SecurityFinding>(`/findings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.error) throw new Error(res.error);
    return res.data;
  }
};
