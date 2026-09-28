import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Play, ShieldCheck, Target as TargetIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { assessmentApi } from '../services/scanService';
import { targetApi } from '../services/targetApi';
import { SecurityModule, TargetConfig } from '../types';

export const AssessmentSetup: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [target, setTarget] = useState<TargetConfig | null>(null);
  const [modules, setModules] = useState<SecurityModule[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([targetApi.getTarget(), assessmentApi.getModules()])
      .then(([t, m]) => {
        setTarget(t);
        setModules(m);
        const requestedModule = searchParams.get('module');
        const requested = requestedModule ? m.find(x => x.id === requestedModule || x.slug === requestedModule) : undefined;
        setSelected(requested ? [requested.id] : m.filter(x => x.enabled).map(x => x.id));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load assessment configuration.'))
      .finally(() => setLoading(false));
  }, []);

  const selectedModules = useMemo(() => modules.filter(m => selected.includes(m.id)), [modules, selected]);
  const totalChecks = selectedModules.reduce((sum, m) => sum + m.checksCount, 0);

  const toggle = (id: string) => {
    setSelected(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  const start = async () => {
    if (!target?.isAuthorized) {
      setError('The target is not marked as authorized. Update the target configuration first.');
      return;
    }
    if (!authorized) {
      setError('Confirm that you have explicit authorization for this assessment.');
      return;
    }
    if (!selected.length) {
      setError('Select at least one assessment module.');
      return;
    }

    setStarting(true);
    setError(null);
    try {
      const run = await assessmentApi.startAssessment(selected);
      navigate('/assessment/running', { replace: true, state: { runId: run.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assessment could not be started.');
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Loading assessment configuration...</div>;
  }

  if (!target) {
    return <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md text-xs text-red-300">Target configuration could not be loaded.</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">New Security Assessment</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Select the authorized security modules to execute against the configured target.</p>
      </div>

      <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
              <TargetIcon className="w-3.5 h-3.5 text-indigo-400" />
              Target Environment
            </div>
            <div className="text-lg font-bold text-white">{target.name}</div>
            <div className="text-xs font-mono text-slate-400">{target.url}</div>
          </div>
          <div className="text-right font-mono text-xs">
            <div className="text-slate-500">Environment</div>
            <div className="text-emerald-400">{target.environment}</div>
            <div className="mt-1 flex items-center justify-end gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              {target.isAuthorized ? 'Authorized' : 'Authorization required'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-800 rounded-md text-xs font-mono text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Assessment Modules</h3>
            <p className="text-[11px] text-slate-500 mt-1">Only selected modules will be dispatched to the local authorized target.</p>
          </div>
          <span className="text-xs font-mono text-indigo-400">{selected.length} selected · {totalChecks} checks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map(module => {
            const checked = selected.includes(module.id);
            return (
              <label key={module.id} className={`p-4 border rounded-md cursor-pointer transition-colors ${checked ? 'bg-indigo-950/30 border-indigo-700/70' : 'bg-[#070b16] border-slate-800 hover:border-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={checked} onChange={() => toggle(module.id)} className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700" />
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-white">{module.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{module.checksCount} checks</span>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-300 mt-1">{module.category}</div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{module.description}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-amber-950/20 border-l-4 border-amber-500 rounded-r-md">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={authorized} onChange={e => setAuthorized(e.target.checked)} className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700" />
          <span className="text-xs text-amber-200 leading-relaxed">I confirm that I have explicit authorization to perform this assessment against the configured target and that the target is an isolated/local test environment.</span>
        </label>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Non-destructive, rate-limited execution</span>
        </div>
        <Button variant="primary" size="md" onClick={start} isLoading={starting} disabled={!target.isAuthorized || !selected.length}>
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Start Assessment</span>
        </Button>
      </div>
    </div>
  );
};
