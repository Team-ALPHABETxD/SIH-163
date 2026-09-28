import { apiClient, getUseMockData } from './apiClient';
import { AssessmentReport } from '../types';
import { mockReports } from '../data/mock/mockData';

let currentReportsState: AssessmentReport[] = [...mockReports];

export const reportsApi = {
  async getReports(): Promise<AssessmentReport[]> {
    if (getUseMockData()) {
      return [...currentReportsState];
    }
    const res = await apiClient<AssessmentReport[]>('/reports');
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  async getReportById(id: string): Promise<AssessmentReport | undefined> {
    if (getUseMockData()) {
      return currentReportsState.find(r => r.id === id);
    }
    const res = await apiClient<AssessmentReport>(`/reports/${id}`);
    if (res.error) throw new Error(res.error);
    return res.data;
  },


  async generateReport(): Promise<AssessmentReport> {
    if (getUseMockData()) throw new Error('Report generation requires Live API mode.');
    const res = await apiClient<AssessmentReport>('/reports/generate', { method: 'POST' });
    if (res.error) throw new Error(res.error);
    return res.data;
  },

  exportReportJson(report: AssessmentReport): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.id}_Assessment_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  async downloadReportPdf(reportId: string): Promise<void> {
    if (getUseMockData()) { window.print(); return; }
    const base = localStorage.getItem('sentinel_api_base_url') || 'http://localhost:8000/api';
    const res = await fetch(`${base.replace(/\/$/, '')}/reports/${reportId}/pdf`, { headers: { Accept: 'application/pdf' } });
    if (!res.ok) throw new Error(`PDF export failed: HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${reportId}.pdf`; a.click(); URL.revokeObjectURL(url);
  }
};
