import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crosshair,
  Activity,
  FileCode,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Clock,
  Play,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { targetApi } from '../services/targetApi';
import { findingsApi } from '../services/findingsService';
import { assessmentApi } from '../services/scanService';
import { reportsApi } from '../services/reportService';
import { TargetConfig, SecurityFinding, ActivityItem, AssessmentHistoryItem, AssessmentReport } from '../types';

export const Dashboard: React.FC = () => {
  const [target, setTarget] = useState<TargetConfig | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDashboardData() {
      try {
        const [tgt, runs, acts, reps] = await Promise.all([
          targetApi.getTarget(),
          assessmentApi.getAssessmentHistory(),
          assessmentApi.getActivityLog().catch(() => []),
          reportsApi.getReports().catch(() => []),
        ]);
        if (!active) return;
        setTarget(tgt);
        setHistory(runs);
        setActivities(acts);
        setReports(reps);

        const selectedRun = runs.find(r => r.status === 'running' || r.status === 'paused') || runs[0];
        if (selectedRun) {
          const f = await findingsApi.getFindings(selectedRun.id);
          if (active) setFindings(f);
        } else {
          setFindings([]);
        }
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadDashboardData();
    return () => { active = false; };
  }, []);

  const selectedRun = history.find(r => r.status === 'running' || r.status === 'paused') || history.find(r => r.status === 'completed') || history[0] || null;
  const hasAssessment = Boolean(selectedRun);
  const totalChecks = selectedRun?.totalChecks ?? 0;
  const passedChecks = selectedRun?.passedChecks ?? 0;
  const highCriticalCount = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
  const endpointCount = new Set(findings.map(f => f.affectedComponent)).size;
  const coverage = totalChecks && selectedRun?.status === 'completed' ? Math.round((passedChecks / totalChecks) * 100) : 0;

  const postureData = useMemo(() => [
    { name: 'Passed', value: passedChecks, color: '#10b981' },
    { name: 'Low', value: findings.filter(f => f.severity === 'low').length, color: '#3b82f6' },
    { name: 'Medium', value: findings.filter(f => f.severity === 'medium').length, color: '#f59e0b' },
    { name: 'High', value: findings.filter(f => f.severity === 'high').length, color: '#f97316' },
    { name: 'Critical', value: findings.filter(f => f.severity === 'critical').length, color: '#ef4444' },
  ], [passedChecks, findings]);

  const reportByRun = useMemo(() => {
    const map = new Map<string, AssessmentReport>();
    reports.forEach(report => { if (report.runId) map.set(report.runId, report); });
    return map;
  }, [reports]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#0a0f1d] border border-slate-800 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-[#0a0f1d] border border-slate-800 rounded-md" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-72 bg-[#0a0f1d] border border-slate-800 rounded-md" />
          <div className="lg:col-span-8 h-72 bg-[#0a0f1d] border border-slate-800 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">TARGET ENVIRONMENT</span>
              <span className="text-slate-600">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{target?.environment || 'Authorized Test Environment'}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="text-xl font-bold text-white tracking-tight">{target?.name || 'Target not configured'}</h2>
              <span className="text-xs font-mono text-slate-400">{target?.url}</span>
            </div>
          </div>
          <Link to="/target">
            <Button variant="secondary" size="sm"><Crosshair className="w-3.5 h-3.5 mr-1" /><span>Configure Target</span></Button>
          </Link>
        </div>
      </div>

      {!hasAssessment && (
        <div className="p-5 bg-[#0a0f1d] border border-indigo-900/60 rounded-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white">No assessments yet</h3>
              <p className="text-xs text-slate-400 mt-1">This workspace contains no generated assessment results. Run an authorized assessment to populate the dashboard.</p>
            </div>
            <Link to="/target"><Button variant="primary" size="sm"><Play className="w-3.5 h-3.5 mr-1" /><span>New Assessment</span></Button></Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          ['CHECKS', totalChecks, 'Automated probes', 'text-slate-400', 'text-white'],
          ['PASSED', passedChecks, 'Controls verified', 'text-emerald-400', 'text-emerald-400'],
          ['FINDINGS', findings.length, 'Requires review', 'text-amber-400', 'text-amber-400'],
          ['HIGH / CRITICAL', highCriticalCount, 'Current assessment', 'text-red-400', 'text-red-400'],
          ['ENDPOINTS', endpointCount, 'Affected components', 'text-slate-400', 'text-white'],
          ['COVERAGE', `${coverage}%`, 'Assessment coverage', 'text-indigo-400', 'text-indigo-400'],
        ].map(([label, value, sub, labelClass, valueClass]) => (
          <div key={String(label)} className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
            <div className={`text-[11px] font-mono uppercase ${labelClass}`}>{label}</div>
            <div className={`text-2xl font-bold font-mono tabular-nums mt-1 ${valueClass}`}>{value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-400" />Assessment History</h3>
              <p className="text-xs text-slate-400 mt-1">Persisted assessment runs from PostgreSQL. No synthetic runs are shown.</p>
            </div>
            <Link to="/reports" className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300">Reports →</Link>
          </div>
          <div className="border border-slate-800 rounded divide-y divide-slate-800 bg-[#070b16]">
            {history.slice(0, 5).map(run => {
              const report = reportByRun.get(run.id);
              const runFindings = Object.values(run.findingsCount || {}).reduce((a, b) => a + b, 0);
              return (
                <div key={run.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-200 truncate">{run.targetName}</span>
                      <span className={`text-[10px] font-mono ${run.status === 'completed' ? 'text-emerald-400' : run.status === 'running' ? 'text-indigo-400' : 'text-slate-500'}`}>{run.status}</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">{run.id} · {run.totalChecks} checks · {runFindings} findings</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/findings?runId=${encodeURIComponent(run.id)}`}><Button variant="outline" size="sm" className="h-7 text-[11px]">Findings</Button></Link>
                    <Link to={`/graph?runId=${encodeURIComponent(run.id)}`}><Button variant="secondary" size="sm" className="h-7 text-[11px]">Graph</Button></Link>
                    {report && <Link to={`/reports/${report.id}`}><Button variant="primary" size="sm" className="h-7 text-[11px]"><FileText className="w-3 h-3 mr-1" />Report</Button></Link>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Security Posture</h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-sm">{selectedRun ? `Assessment ${selectedRun.status}` : 'No assessment'}</span>
            </div>
            <p className="text-xs text-slate-400">Distribution across {totalChecks} evaluated security checks.</p>
          </div>
          <div className="py-4 flex flex-col items-center">
            {hasAssessment ? (
              <>
                <div className="w-44 h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={postureData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value">
                        {postureData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-mono text-white tabular-nums">{totalChecks}</span>
                    <span className="text-[9px] uppercase font-mono text-slate-500">TOTAL CHECKS</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full px-2">
                  {postureData.map(d => <div key={d.name} className="flex items-center justify-between text-xs font-mono text-slate-400"><span className="flex items-center gap-1.5"><span className="w-2 h-2" style={{ backgroundColor: d.color }} /><span>{d.name}</span></span><span className="text-slate-200 font-semibold tabular-nums">{d.value}</span></div>)}
                </div>
              </>
            ) : (
              <div className="h-44 flex items-center justify-center text-center text-xs text-slate-500 font-mono">No assessment data available yet.</div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Overall Score: {totalChecks ? ((passedChecks / totalChecks) * 100).toFixed(1) : '0.0'}%</span>
            <span className="text-emerald-400">Pass Rate: {totalChecks ? Math.round((passedChecks / totalChecks) * 100) : 0}%</span>
          </div>
        </div>

        <div className="lg:col-span-8 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div><h3 className="text-sm font-semibold text-white">Discovered Security Findings</h3><p className="text-xs text-slate-400">Findings belonging to the selected/latest persisted assessment.</p></div>
              <Link to="/findings"><Button variant="ghost" size="sm" className="text-xs font-mono text-indigo-400 hover:text-indigo-300"><span>View All ({findings.length})</span><ArrowUpRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
            </div>
            <div className="mt-4 border border-slate-800 rounded divide-y divide-slate-800 bg-[#070b16]">
              {findings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">No findings recorded for this assessment.</div>
              ) : findings.slice(0, 4).map(f => (
                <div key={f.id} className="p-3 hover:bg-slate-900/50 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0"><div className="flex items-center gap-2"><SeverityBadge severity={f.severity} size="sm" /><Link to={`/findings/${f.id}`} className="text-xs font-medium text-slate-200 hover:text-white truncate">{f.title}</Link></div><div className="text-[11px] font-mono text-slate-500 truncate flex items-center gap-2"><span>{f.affectedComponent}</span><span>·</span><span>{f.cwe}</span></div></div>
                  <Link to={`/findings/${f.id}`} className="shrink-0"><Button variant="outline" size="sm" className="h-7 text-[11px]">Inspect</Button></Link>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono"><span>Evidence sanitized with zero token leakage</span><Link to="/assessment/running" className="text-indigo-400 hover:text-indigo-300">Live Scanner Telemetry →</Link></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-400" /><span>Assessment Activity</span></h3><span className="text-[11px] font-mono text-slate-500">Chronological Event Stream</span></div>
          <div className="space-y-3 font-mono text-xs">
            {activities.length === 0 ? <div className="p-5 text-center text-slate-500">No assessment activity recorded.</div> : activities.map(act => <div key={act.id} className="flex items-start gap-3 p-2.5 rounded bg-[#070b16] border border-slate-800/80"><span className="text-slate-500 text-[11px] shrink-0 mt-0.5">{act.timestamp}</span><div className="flex-1"><div className="flex items-center gap-2"><span className="text-indigo-400 font-medium text-[11px]">{act.module}:</span><span className="text-slate-300 text-xs">{act.message}</span></div></div></div>)}
          </div>
        </div>

        <div className="lg:col-span-5 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileCode className="w-4 h-4 text-indigo-400" /><span>Target Endpoints Scope</span></h3><Link to="/target" className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300">Edit Scope</Link></div>
          <div className="space-y-2 font-mono text-xs">
            {(target?.scope || []).slice(0, 5).map((path, i) => <div key={`${path}-${i}`} className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex items-center justify-between text-[11px]"><span className="text-slate-300 truncate">{path}</span><span className="shrink-0 text-emerald-400 ml-3">Scoped</span></div>)}
            {!target?.scope?.length && <div className="p-5 text-center text-slate-500">No target scope configured.</div>}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between"><span>{endpointCount} affected components observed</span><span>Scoped probes</span></div>
        </div>
      </div>
    </div>
  );
};
