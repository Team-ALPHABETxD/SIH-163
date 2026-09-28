import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { assessmentApi } from '../services/scanService';
import { AssessmentRun, SecurityModule } from '../types';

export const AssessmentRunning: React.FC = () => {
  const navigate = useNavigate();
  const [run, setRun] = useState<AssessmentRun | null>(null);
  const [modules, setModules] = useState<SecurityModule[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [r, mods] = await Promise.all([assessmentApi.getRunningAssessment(), assessmentApi.getModules()]);
        if (!active) return;
        setRun(r);
        setModules(mods);
        setProgress(r.progress);
        setLogs(r.logs);
        setIsPaused(r.status === 'paused');
      } catch (err) {
        if (active) console.error('Unable to load assessment telemetry', err);
      }
    };
    load();
    const timer = setInterval(load, 1500);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const handlePause = async () => {
    if (!run) return;
    const updated = await assessmentApi.pauseAssessment(run.id);
    setRun(updated);
    setIsPaused(updated.status === 'paused');
  };

  const handleStop = async () => {
    if (!run) return;
    const updated = await assessmentApi.stopAssessment(run.id);
    setRun(updated);
    navigate('/findings');
  };

  if (!run) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">No assessment run found</h3>
        <p className="text-xs text-slate-400">Start an assessment to open live scanner telemetry.</p>
        <Link to="/assessment"><Button variant="primary" size="sm">New Assessment</Button></Link>
      </div>
    );
  }

  const moduleExecutionSteps = modules.filter(m => run.activeModules.includes(m.id)).map((m) => {
    const status = run.status === 'completed'
      ? 'completed'
      : (run.status === 'paused' && m.id === run.currentModuleId
        ? 'paused'
        : (m.id === run.currentModuleId ? 'running' : 'pending'));
    return {
      name: m.name,
      status,
      duration: status === 'completed' ? 'Completed' : status === 'running' ? 'Active' : status === 'paused' ? 'Paused' : 'Queued',
    };
  });
  const findingTotal = Object.values(run.findingsCount).reduce((sum, value) => sum + value, 0);
  const evaluatedChecks = run.passedChecks + run.failedChecks;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Bar with Live Badge & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {run.status === 'completed' ? 'ASSESSMENT COMPLETED' : run.status === 'stopped' ? 'ASSESSMENT STOPPED' : isPaused ? 'ASSESSMENT PAUSED' : 'ASSESSMENT IN PROGRESS'}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono text-indigo-400">{run.id}</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Testing: {run.targetName}
          </h2>
          <div className="text-xs font-mono text-slate-400">
            {run.targetUrl}
          </div>
        </div>

        {/* Primary Operational Controls (Strictly rectangular, no pill buttons) */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePause}
            disabled={run.status !== 'running' && run.status !== 'paused'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current mr-1" /> : <Pause className="w-3.5 h-3.5 mr-1" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleStop}
            disabled={run.status !== 'running' && run.status !== 'paused'}
          >
            <Square className="w-3.5 h-3.5 fill-current mr-1" />
            <span>Stop Assessment</span>
          </Button>

          <Link to="/findings">
            <Button variant="primary" size="sm">
              <span>View Findings ({run.findingsCount.critical + run.findingsCount.high + run.findingsCount.medium + run.findingsCount.low + run.findingsCount.info})</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-mono text-slate-400">CURRENT EXECUTION PROGRESS</div>
            <div className="text-xs text-slate-300 font-mono">
              {run.currentCheckName || 'Preparing assessment...'}
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-400 tabular-nums">
            {progress}%
          </div>
        </div>

        {/* Progress Bar (no rounded full) */}
        <div className="w-full h-2.5 bg-[#070b16] rounded-xs overflow-hidden border border-slate-800">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs font-mono">
          <div>
            <span className="text-slate-500">Evaluated:</span>{' '}
            <span className="text-white font-semibold tabular-nums">{evaluatedChecks} / {run.totalChecks} Checks</span>
          </div>
          <div>
            <span className="text-slate-500">Passed:</span>{' '}
            <span className="text-emerald-400 font-semibold tabular-nums">{run.passedChecks} Clean</span>
          </div>
          <div>
            <span className="text-slate-500">Flagged Findings:</span>{' '}
            <span className="text-red-400 font-semibold tabular-nums">{findingTotal} Issues</span>
          </div>
          <div>
            <span className="text-slate-500">Estimated Left:</span>{' '}
            <span className="text-slate-300 tabular-nums">{run.status === 'completed' ? 'Complete' : 'In progress'}</span>
          </div>
        </div>
      </div>

      {/* Module Steps Breakdown and Live Log Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Steps */}
        <div className="lg:col-span-5 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
            <span>Module Execution Flow</span>
            <span className="text-xs font-mono text-slate-500">{moduleExecutionSteps.length} Modules</span>
          </h3>

          <div className="space-y-2 font-mono text-xs">
            {moduleExecutionSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded border flex items-center justify-between text-xs ${
                  step.status === 'completed'
                    ? 'bg-[#080d19] border-slate-800 text-slate-300'
                    : step.status === 'running'
                    ? 'bg-indigo-950/40 border-indigo-700/80 text-indigo-200'
                    : step.status === 'paused'
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    : 'bg-[#070b16] border-slate-800/60 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {step.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {step.status === 'running' && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />}
                  {step.status === 'paused' && <Pause className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {step.status === 'pending' && <span className="w-3.5 h-3.5 rounded-none border border-slate-700 shrink-0" />}
                  <span className="truncate">{step.name}</span>
                </div>
                <span className="text-[11px] text-slate-500 shrink-0">{step.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Terminal Activity Stream */}
        <div className="lg:col-span-7 p-5 bg-[#0a0f1d] border border-slate-800 rounded-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Scanner Log</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Live stdout trace</span>
          </div>

          <div className="bg-[#050811] border border-slate-800/80 rounded p-3 font-mono text-[11px] text-slate-300 space-y-2 h-80 overflow-y-auto">
            {logs.map((log) => {
              const color =
                log.level === 'error'
                  ? 'text-red-400 bg-red-950/30 border-l-2 border-red-500'
                  : log.level === 'warn'
                  ? 'text-amber-400 bg-amber-950/20 border-l-2 border-amber-500'
                  : log.level === 'success'
                  ? 'text-emerald-400'
                  : 'text-slate-400';

              return (
                <div key={log.id} className={`p-1 leading-relaxed ${color}`}>
                  <span className="text-slate-600">[{log.timestamp}]</span>{' '}
                  <span className="text-indigo-400">[{log.module}]</span>{' '}
                  <span>{log.message}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Buffer: 9 entries streaming</span>
            <span>Non-blocking async telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
