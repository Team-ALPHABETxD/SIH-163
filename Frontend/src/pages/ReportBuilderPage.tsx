import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, Calendar, Crosshair, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { reportsApi } from '../services/reportService';
import { AssessmentReport } from '../types';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await reportsApi.getReports();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExportJson = (r: AssessmentReport) => {
    reportsApi.exportReportJson(r);
  };

  const handleDownloadPdf = (id: string) => {
    reportsApi.downloadReportPdf(id);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Loading reports repository...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Assessment Reports</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official assessment deliverables, executive summaries, and vulnerability registers ready for client presentation.
          </p>
        </div>
      </div>

      {/* Reports Table Panel */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1424] border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
              <tr>
                <th className="py-3 px-4">Report Identifier</th>
                <th className="py-3 px-4">Assessment Title</th>
                <th className="py-3 px-4">Target Application</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Findings Breakdown</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-indigo-400 whitespace-nowrap">
                    {r.id}
                  </td>
                  <td className="py-3 px-4 min-w-[240px]">
                    <Link to={`/reports/${r.id}`} className="font-medium text-slate-200 hover:text-white block hover:underline">
                      {r.title}
                    </Link>
                    <span className="text-[11px] text-slate-500 font-mono">{r.environment}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {r.targetName}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {r.assessmentDate}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {r.findingsDistribution.critical > 0 && (
                        <span className="text-red-400 font-bold">{r.findingsDistribution.critical} Crit</span>
                      )}
                      {r.findingsDistribution.high > 0 && (
                        <span className="text-orange-400 font-semibold">{r.findingsDistribution.high} High</span>
                      )}
                      {r.findingsDistribution.medium > 0 && (
                        <span className="text-amber-400">{r.findingsDistribution.medium} Med</span>
                      )}
                      <span className="text-slate-500">({r.findingsDistribution.total} total)</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap font-mono">
                    <span className="text-emerald-400 text-[11px]">{r.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/reports/${r.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2">
                          <Eye className="w-3 h-3 mr-1" />
                          <span>View</span>
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleExportJson(r)}
                        className="h-7 text-[11px] px-2 font-mono"
                        title="Export JSON format"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        <span>JSON</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
