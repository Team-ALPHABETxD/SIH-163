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

  exportReportJson(report: AssessmentReport): void {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.id}_Assessment_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  downloadReportPdf(reportId: string): void {
    // In browser frontend, triggers print or alert
    window.print();
  }
};
