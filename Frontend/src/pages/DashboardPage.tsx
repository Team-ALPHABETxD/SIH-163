import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Play,
  Crosshair,
  Activity,
  Layers,
  CheckCircle2,
  FileCode,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { targetApi } from '../services/targetApi';
import { findingsApi } from '../services/findingsService';
import { assessmentApi } from '../services/scanService';
import { TargetConfig, SecurityFinding, ActivityItem } from '../types';

export const Dashboard: React.FC = () => {
  const [target, setTarget] = useState<TargetConfig | null>(null);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [tgt, fnd, acts] = await Promise.all([
          targetApi.getTarget(),
          findingsApi.getFindings(),
          assessmentApi.getActivityLog(),
        ]);
        setTarget(tgt);
        setFindings(fnd);
        setActivities(acts);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const postureData = [
    { name: 'Passed', value: 35, color: '#10b981' },
    { name: 'Low', value: findings.filter(f => f.severity === 'low').length || 1, color: '#3b82f6' },
    { name: 'Medium', value: findings.filter(f => f.severity === 'medium').length || 2, color: '#f59e0b' },
    { name: 'High', value: findings.filter(f => f.severity === 'high').length || 2, color: '#f97316' },
    { name: 'Critical', value: findings.filter(f => f.severity === 'critical').length || 1, color: '#ef4444' },
  ];

  const highCriticalCount = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-[#0a0f1d] border border-slate-800 rounded-md" />
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-[#0a0f1d] border border-slate-800 rounded-md" />
          ))}
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
      {/* 1. TOP TARGET PANEL */}
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
              <h2 className="text-xl font-bold text-white tracking-tight">{target?.name || 'World Monitor'}</h2>
              <span className="text-xs font-mono text-slate-400">{target?.url}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link to="/target">
              <Button variant="secondary" size="sm">
                <Crosshair className="w-3.5 h-3.5 mr-1" />
                <span>Configure Target</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. METRICS ROW (Structured, compact, no giant bubbles) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-slate-400 uppercase">CHECKS</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">42</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Automated probes</div>
        </div>

        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-emerald-400 uppercase">PASSED</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">35</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Controls verified</div>
        </div>

        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-amber-400 uppercase">FINDINGS</div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">{findings.length || 7}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Requires review</div>
        </div>

        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-red-400 uppercase">HIGH / CRITICAL</div>
          <div className="text-2xl font-bold font-mono text-red-400 tabular-nums mt-1">{highCriticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Urgent priority</div>
        </div>

        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-slate-400 uppercase">ENDPOINTS</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">28</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Under scope</div>
        </div>

        <div className="p-3.5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="text-[11px] font-mono text-indigo-400 uppercase">COVERAGE</div>
          <div className="text-2xl font-bold font-mono text-indigo-400 tabular-nums mt-1">83%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Route surface mapped</div>
        </div>
      </div>

      {/* 3. SECURITY POSTURE VISUALIZATION & FINDINGS PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Posture Donut Chart */}
        <div className="lg:col-span-4 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Security Posture</h3>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded-sm">
                Sample Assessment
              </span>
            </div>
            <p className="text-xs text-slate-400">Distribution across 42 evaluated security checks.</p>
          </div>

          <div className="py-4 flex flex-col items-center">
            <div className="w-44 h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={postureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={46}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {postureData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">42</span>
                <span className="text-[9px] uppercase font-mono text-slate-500">TOTAL CHECKS</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full px-2">
              {postureData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                  </span>
                  <span className="text-slate-200 font-semibold tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Overall Score: 83.3%</span>
            <span className="text-emerald-400">Pass Rate: 83%</span>
          </div>
        </div>

        {/* Recent Discovered Findings */}
        <div className="lg:col-span-8 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-white">Discovered Security Findings</h3>
                <p className="text-xs text-slate-400">Vulnerabilities and misconfigurations flagged during latest run.</p>
              </div>
              <Link to="/findings">
                <Button variant="ghost" size="sm" className="text-xs font-mono text-indigo-400 hover:text-indigo-300">
                  <span>View All ({findings.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="mt-4 border border-slate-800 rounded divide-y divide-slate-800 bg-[#070b16]">
              {findings.slice(0, 4).map((f) => (
                <div key={f.id} className="p-3 hover:bg-slate-900/50 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={f.severity} size="sm" />
                      <Link to={`/findings/${f.id}`} className="text-xs font-medium text-slate-200 hover:text-white truncate">
                        {f.title}
                      </Link>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate flex items-center gap-2">
                      <span>{f.affectedComponent}</span>
                      <span>·</span>
                      <span>{f.cwe}</span>
                    </div>
                  </div>

                  <Link to={`/findings/${f.id}`} className="shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-[11px]">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Evidence sanitized with zero token leakage</span>
            <Link to="/assessment/running" className="text-indigo-400 hover:text-indigo-300">
              Live Scanner Telemetry →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. ACTIVITY TIMELINE & ENDPOINT STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Activity Timeline */}
        <div className="lg:col-span-7 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Assessment Activity</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Chronological Event Stream</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-2.5 rounded bg-[#070b16] border border-slate-800/80">
                <span className="text-slate-500 text-[11px] shrink-0 mt-0.5">{act.timestamp}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-medium text-[11px]">{act.module}:</span>
                    <span className="text-slate-300 text-xs">{act.message}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Target Endpoints Monitored */}
        <div className="lg:col-span-5 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>Target Endpoints Scope</span>
            </h3>
            <Link to="/target" className="text-[11px] font-mono text-indigo-400 hover:text-indigo-300">
              Edit Scope
            </Link>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[
              { path: '/api/v1/incidents/*', method: 'GET, POST', status: 'Findings (BOLA)', state: 'flagged' },
              { path: '/api/v1/auth/*', method: 'POST', status: 'Findings (Rate Limit)', state: 'flagged' },
              { path: '/api/v1/reports/*', method: 'POST, GET', status: 'Findings (CORS)', state: 'flagged' },
              { path: '/api/v1/regions/*', method: 'GET', status: 'Passed (Clean)', state: 'passed' },
              { path: '/api/v1/telemetry/*', method: 'POST', status: 'Findings (Stacktrace)', state: 'flagged' },
            ].map((ep, i) => (
              <div key={i} className="p-2.5 bg-[#070b16] border border-slate-800 rounded flex items-center justify-between text-[11px]">
                <div className="truncate pr-2">
                  <span className="text-indigo-300 font-semibold">{ep.method}</span>{' '}
                  <span className="text-slate-300">{ep.path}</span>
                </div>
                <span className={`shrink-0 ${ep.state === 'flagged' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {ep.status}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>28 endpoints cataloged</span>
            <span>Non-destructive fuzzer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
