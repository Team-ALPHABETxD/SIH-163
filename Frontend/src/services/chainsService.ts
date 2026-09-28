import { apiClient, getUseMockData } from './apiClient';

export interface AttackChain {
  id: string;
  title: string;
  description: string;
  severity: string;
  score: number;
  status: 'proposed' | 'confirmed' | 'rejected';
  node_ids: string[];
  edges: { source: string; target: string; label: string }[];
}

export const chainsApi = {
  async getChains(runId?: string): Promise<AttackChain[]> {
    if (getUseMockData()) return [];
    const query = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
    const res = await apiClient<AttackChain[]>(`/chains${query}`);
    if (res.error) throw new Error(res.error);
    return res.data;
  },
  async decide(id: string, action: 'confirm' | 'reject' | 'edit', reason = '') {
    const res = await apiClient<{status:string}>(`/chains/${id}/decision`, { method: 'POST', body: JSON.stringify({ action, reason }) });
    if (res.error) throw new Error(res.error);
    return res.data;
  }
};
