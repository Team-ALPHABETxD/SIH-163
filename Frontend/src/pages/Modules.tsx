import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Lock,
  Shield,
  Server,
  Zap,
  Globe,
  Activity,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowLeft,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { assessmentApi } from '../services/scanService';
import { SecurityModule } from '../types';

export const Modules: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [modules, setModules] = useState<SecurityModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await assessmentApi.getModules();
        setModules(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getModuleIcon = (s: string) => {
    switch (s) {
      case 'authentication': return Lock;
      case 'authorization': return Shield;
      case 'api-security': return Server;
      case 'input-validation': return Zap;
      case 'client-security': return Globe;
      case 'communication': return Activity;
      case 'data-privacy': return Database;
      default: return Shield;
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Loading module directory...</div>;
  }

  // If a specific module slug is selected
  const activeModule = slug ? modules.find(m => m.slug === slug) : null;

  if (activeModule) {
    const Icon = getModuleIcon(activeModule.slug);
    const isApiSecurity = activeModule.slug === 'api-security';

    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <Link to="/modules" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Modules</span>
          </Link>

          <Link to="/assessment">
            <Button size="sm" variant="primary">
              <Play className="w-3.5 h-3.5 fill-current mr-1" />
              <span>Run This Module</span>
            </Button>
          </Link>
        </div>

        {/* Module Header Card */}
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{activeModule.name}</h1>
                <span className="font-mono text-xs text-slate-400">({activeModule.category})</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{activeModule.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500">Total Checks:</span>{' '}
              <span className="text-white font-bold tabular-nums">{activeModule.checksCount}</span>
            </div>
            <div>
              <span className="text-slate-500">Est. Duration:</span>{' '}
              <span className="text-slate-200">{activeModule.estimatedDuration}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>{' '}
              <span className={activeModule.status === 'failed' ? 'text-red-400' : activeModule.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}>
                {activeModule.status.toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Findings:</span>{' '}
              <span className="text-amber-400 font-bold tabular-nums">{activeModule.findingsCount} Flagged</span>
            </div>
          </div>
        </div>

        {/* Dedicated Section 28: Detailed API Security Table */}
        {isApiSecurity && (
          <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Target API Endpoints Coverage Matrix</h3>
                <p className="text-xs text-slate-400">Granular audit status per REST route and authentication layer.</p>
              </div>
              <span className="text-xs font-mono text-indigo-400">5 Monitored Endpoints</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded bg-[#070b16]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0c1324] border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Method & Endpoint</th>
                    <th className="py-2.5 px-3">Auth Scheme</th>
                    <th className="py-2.5 px-3">BOLA Check</th>
                    <th className="py-2.5 px-3">CORS Status</th>
                    <th className="py-2.5 px-3">Rate Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-[11px]">
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">GET /api/v1/incidents/&#123;id&#125;</td>
                    <td className="py-2.5 px-3 text-indigo-300">Bearer JWT</td>
                    <td className="py-2.5 px-3 text-red-400 font-bold">VULNERABLE (IDOR)</td>
                    <td className="py-2.5 px-3 text-emerald-400">Strict Origin</td>
                    <td className="py-2.5 px-3 text-slate-400">60 req/min</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">POST /api/v1/auth/token</td>
                    <td className="py-2.5 px-3 text-slate-400">Basic / Public</td>
                    <td className="py-2.5 px-3 text-slate-500">N/A</td>
                    <td className="py-2.5 px-3 text-emerald-400">Protected</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">UNTHROTTLED</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">POST /api/v1/reports/export</td>
                    <td className="py-2.5 px-3 text-indigo-300">Bearer JWT</td>
                    <td className="py-2.5 px-3 text-emerald-400">Passed</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">WILDCARD PERMISSIVE</td>
                    <td className="py-2.5 px-3 text-slate-400">30 req/min</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">GET /api/v1/regions</td>
                    <td className="py-2.5 px-3 text-indigo-300">Bearer JWT</td>
                    <td className="py-2.5 px-3 text-emerald-400">Passed</td>
                    <td className="py-2.5 px-3 text-emerald-400">Strict Origin</td>
                    <td className="py-2.5 px-3 text-slate-400">120 req/min</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 text-slate-200 font-semibold">POST /api/v1/telemetry/ingest</td>
                    <td className="py-2.5 px-3 text-indigo-300">API Key</td>
                    <td className="py-2.5 px-3 text-emerald-400">Passed</td>
                    <td className="py-2.5 px-3 text-emerald-400">Strict Origin</td>
                    <td className="py-2.5 px-3 text-slate-400">100 req/sec</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Standard Checks List for Module */}
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Evaluated Checks ({activeModule.checks.length})</h3>
            <span className="text-xs font-mono text-slate-500">OWASP ASVS Standardized</span>
          </div>

          <div className="space-y-2.5">
            {activeModule.checks.map(c => (
              <div key={c.id} className="p-3 bg-[#070b16] border border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <span className="font-mono text-[11px] text-slate-500">[{c.standardRef}]</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{c.description}</p>
                </div>

                <div className="shrink-0 font-mono text-[11px]">
                  {c.status === 'passed' && (
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Passed</span>
                    </span>
                  )}
                  {c.status === 'warning' && (
                    <span className="inline-flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Warning</span>
                    </span>
                  )}
                  {c.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-red-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Failed (Finding)</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Overview of all 7 modules
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Security Assessment Modules</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore the 7 standardized testing domains, automated inspection criteria, and findings distribution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((m) => {
          const Icon = getModuleIcon(m.slug);
          return (
            <div
              key={m.id}
              className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-sm border ${
                    m.status === 'failed'
                      ? 'bg-red-950/40 border-red-800/60 text-red-400'
                      : m.status === 'warning'
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                  }`}>
                    {m.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-semibold text-base text-white mb-1.5">{m.name}</h3>
                <span className="text-[11px] font-mono text-slate-500 block mb-2">{m.category}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{m.description}</p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{m.checksCount} Checks</span>
                <Link to={`/modules/${m.slug}`}>
                  <Button variant="outline" size="sm" className="h-7 text-[11px]">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
