import { apiClient, getUseMockData } from './apiClient';
import { TargetConfig } from '../types';
import { mockTarget } from '../data/mock/mockData';

let currentTargetState: TargetConfig = { ...mockTarget };

export const targetApi = {
  async getTarget(): Promise<TargetConfig> {
    if (getUseMockData()) {
      return { ...currentTargetState };
    }
    const res = await apiClient<TargetConfig>('/target');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async updateTarget(data: Partial<TargetConfig>): Promise<TargetConfig> {
    if (getUseMockData()) {
      currentTargetState = { ...currentTargetState, ...data };
      return { ...currentTargetState };
    }
    const res = await apiClient<TargetConfig>('/target', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async testConnection(url: string): Promise<{ success: boolean; responseTimeMs: number; statusText: string }> {
    if (getUseMockData()) {
      await new Promise(r => setTimeout(r, 600));
      return {
        success: true,
        responseTimeMs: 142,
        statusText: 'HTTP 200 OK (TLS 1.3 Handshake Succeeded)'
      };
    }
    const res = await apiClient<{ success: boolean; responseTimeMs: number; statusText: string }>('/target/test-connection', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    if (res.error) throw new Error(res.error);
    return res.data;
  }
};
