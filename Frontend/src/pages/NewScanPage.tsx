import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Globe, ShieldCheck, AlertCircle, RefreshCw, Terminal, Lock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { targetApi } from '../services/targetApi';
import { TargetConfig } from '../types';

export const Target: React.FC = () => {
  const [config, setConfig] = useState<TargetConfig | null>(null);
  const [scopeText, setScopeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; responseTimeMs: number; statusText: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await targetApi.getTarget();
      setConfig(data);
      setScopeText(data.scope.join('\n'));
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setIsSaving(true);
    setNotification(null);
    try {
      const updatedScope = scopeText.split('\n').map(s => s.trim()).filter(Boolean);
      const updated = await targetApi.updateTarget({
        ...config,
        scope: updatedScope,
      });
      setConfig(updated);
      setNotification('Target configuration saved successfully.');
    } catch {
      setNotification('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await targetApi.testConnection(config.url);
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        responseTimeMs: 0,
        statusText: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (!config) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Loading target configuration...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Title & Context */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Target Configuration</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Specify the target web application endpoint, environment parameters, and evaluation scope boundaries.
        </p>
      </div>

      {/* Explicit Authorization Notice */}
      <div className="p-4 bg-amber-950/20 border-l-4 border-amber-500 rounded-r-md flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-amber-200">EXPLICIT AUTHORIZATION REQUIRED</div>
          <p className="text-amber-300/80 leading-relaxed">
            Only assess systems for which you have explicit written authorization. Sentinel executes targeted
            security probes strictly within your specified endpoint scope and adheres to configured rate limits.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/80 rounded-md text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Target Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-5">
          <div className="font-semibold text-sm text-white pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Core Endpoint & Environment</span>
            <span className="text-xs font-mono text-slate-400">Target ID: {config.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Target Application Name
              </label>
              <input
                type="text"
                value={config.name}
                onChange={e => setConfig({ ...config, name: e.target.value })}
                className="w-full bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Environment Tier
              </label>
              <select
                value={config.environment}
                onChange={e => setConfig({ ...config, environment: e.target.value as any })}
                className="w-full bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              >
                <option value="Authorized Test Environment">Authorized Test Environment</option>
                <option value="Staging">Staging</option>
                <option value="Local Sandbox">Local Sandbox</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Target Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={config.url}
                onChange={e => setConfig({ ...config, url: e.target.value })}
                className="flex-1 bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                placeholder="https://staging-app.worldmonitor.internal"
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTesting}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Test Connection</span>
              </Button>
            </div>
          </div>

          {/* Test Connection Result Box */}
          {testResult && (
            <div
              className={`p-3 rounded border font-mono text-xs ${
                testResult.success
                  ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/20 border-red-800 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Status: {testResult.statusText}</span>
                {testResult.responseTimeMs > 0 && (
                  <span>Latency: {testResult.responseTimeMs}ms</span>
                )}
              </div>
            </div>
          )}

          {/* Scope Textarea */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">
              Assessment Scope (Whitelist Path Patterns)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              One URL pattern per line. Endpoints outside this whitelist are strictly excluded from automated probes.
            </p>
            <textarea
              rows={5}
              value={scopeText}
              onChange={e => setScopeText(e.target.value)}
              className="w-full bg-[#070b16] border border-slate-700/80 rounded p-3 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          {/* Safety & Performance Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-800">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Maximum Request Rate (Requests / sec)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={config.maxRequestRate}
                onChange={e => setConfig({ ...config, maxRequestRate: Number(e.target.value) })}
                className="w-full bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Prevents denial-of-service on test application infrastructure.
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Request Timeout (Seconds)
              </label>
              <input
                type="number"
                min={2}
                max={60}
                value={config.requestTimeout}
                onChange={e => setConfig({ ...config, requestTimeout: Number(e.target.value) })}
                className="w-full bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Drop slow responses to protect network sockets.
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Configured for client/backend API decoupling</span>
          </div>

          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
