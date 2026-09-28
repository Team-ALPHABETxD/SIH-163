import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  Shield,
  FileText,
  Calendar,
  Crosshair,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { reportsApi } from '../services/reportService';
import { AssessmentReport } from '../types';

export const ReportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await reportsApi.getReportById(id);
        if (data) setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Generating report document...</div>;
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-base font-semibold text-white">Report Not Found</h3>
        <Link to="/reports">
          <Button variant="secondary" size="sm">Back to Reports</Button>
        </Link>
      </div>
    );
  }

  const chartData = [
    { name: 'Critical', value: report.findingsDistribution.critical, color: '#ef4444' },
    { name: 'High', value: report.findingsDistribution.high, color: '#f97316' },
    { name: 'Medium', value: report.findingsDistribution.medium, color: '#f59e0b' },
    { name: 'Low', value: report.findingsDistribution.low, color: '#3b82f6' },
    { name: 'Info', value: report.findingsDistribution.info, color: '#64748b' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
        <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Reports Repository</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => reportsApi.downloadReportPdf(report.id)}
            className="h-8 text-xs font-mono"
          >
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print / PDF</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => reportsApi.exportReportJson(report)}
            className="h-8 text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Realistic Client Deliverable Document Container */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-md p-6 sm:p-10 space-y-8 shadow-xl">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>SENTINEL SECURITY ASSESSMENT DELIVERABLE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {report.title}
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Report Ref: {report.id} · Classification: CONFIDENTIAL / CLIENT ACCESS
            </p>
          </div>

          <div className="text-right font-mono text-xs space-y-1 text-slate-400">
            <div>Date: <span className="text-slate-200">{report.assessmentDate}</span></div>
            <div>Status: <span className="text-emerald-400 font-semibold">{report.status}</span></div>
            <div>Assessor: <span className="text-slate-200">{report.assessor}</span></div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>1. Executive Summary</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.executiveSummary}
          </p>
        </section>

        {/* 2. Scope & Target Environment */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>2. Assessment Scope & Target Environment</span>
          </h2>
          <div className="p-3 bg-[#070b16] rounded border border-slate-800/80 font-mono text-xs space-y-1">
            <div className="text-slate-400">Application: <span className="text-white font-semibold">{report.targetName}</span></div>
            <div className="text-slate-400">Target Endpoint: <span className="text-indigo-400">{report.targetUrl}</span></div>
            <div className="text-slate-400">Environment Tier: <span className="text-emerald-400">{report.environment}</span></div>
          </div>
          <div className="space-y-1 pt-1">
            <div className="text-xs font-mono text-slate-400">Evaluated Endpoint Paths:</div>
            <ul className="space-y-1 text-xs font-mono text-slate-300 pl-2">
              {report.scopeSummary.map((s, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-indigo-400">▸</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Methodology */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>3. Testing Methodology</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.methodology}
          </p>
        </section>

        {/* 4. Severity Distribution & Risk Overview */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>4. Vulnerability Severity Distribution</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="w-40 h-40 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono text-white tabular-nums">
                    {report.findingsDistribution.total}
                  </span>
                  <span className="text-[9px] uppercase font-mono text-slate-500">FINDINGS</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-7 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex justify-between">
                  <span className="text-red-400 font-semibold">Critical:</span>
                  <span className="text-white font-bold">{report.findingsDistribution.critical}</span>
                </div>
                <div className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex justify-between">
                  <span className="text-orange-400 font-semibold">High:</span>
                  <span className="text-white font-bold">{report.findingsDistribution.high}</span>
                </div>
                <div className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex justify-between">
                  <span className="text-amber-400 font-semibold">Medium:</span>
                  <span className="text-white font-bold">{report.findingsDistribution.medium}</span>
                </div>
                <div className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex justify-between">
                  <span className="text-blue-400 font-semibold">Low:</span>
                  <span className="text-white font-bold">{report.findingsDistribution.low}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Detailed Findings Register */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>5. Detailed Findings Register</span>
          </h2>

          <div className="space-y-4">
            {report.findings.map((f, idx) => (
              <div key={f.id} className="p-4 bg-[#070b16] border border-slate-800 rounded-md space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={f.severity} size="sm" />
                    <span className="text-sm font-semibold text-white">{idx + 1}. {f.title}</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">CVSS: {f.cvssScore.toFixed(1)} · {f.cwe}</span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  Component: <span className="text-indigo-300">{f.affectedComponent}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {f.overview}
                </p>

                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <span className="font-semibold text-slate-400">Remediation: </span>
                  <span className="text-slate-300">{f.remediation.summary}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Remediation Roadmap */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>6. Strategic Remediation Roadmap</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {report.remediationSummary}
          </p>
        </section>

        {/* Appendix */}
        <section className="space-y-2 pt-4 border-t border-slate-800 text-[11px] font-mono text-slate-500">
          <div className="font-semibold text-slate-400">APPENDIX: REFERENCES & STANDARDS</div>
          <div>· OWASP Web Security Testing Guide (WSTG v4.2)</div>
          <div>· OWASP API Security Top 10 (2023)</div>
          <div>· Common Weakness Enumeration (CWE) Specification</div>
        </section>
      </div>
    </div>
  );
};
