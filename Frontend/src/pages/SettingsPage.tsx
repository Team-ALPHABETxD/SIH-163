import React, { useState, useEffect } from 'react';
import {
  Server,
  Sliders,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Monitor
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import {
  getUseMockData,
  setUseMockData,
  getApiBaseUrl,
  setApiBaseUrl,
  checkBackendHealth
} from '../services/apiClient';

export const Settings: React.FC = () => {
  const [useMock, setUseMock] = useState(true);
  const [baseUrl, setBaseUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ connected: boolean; message: string; latency?: number } | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);
  const [compactMode, setCompactMode] = useState(false);
  const [redactionActive, setRedactionActive] = useState(true);

  useEffect(() => {
    setUseMock(getUseMockData());
    setBaseUrl(getApiBaseUrl());
    const storedCompact = localStorage.getItem('sentinel_compact_mode') === 'true';
    setCompactMode(storedCompact);
  }, []);

  const handleSaveBackend = (e: React.FormEvent) => {
    e.preventDefault();
    setUseMockData(useMock);
    setApiBaseUrl(baseUrl);
    localStorage.setItem('sentinel_compact_mode', compactMode ? 'true' : 'false');
    setSavedNotification('Settings updated successfully.');
    setTimeout(() => setSavedNotification(null), 3000);
  };

  const handleCheckHealth = async () => {
    setIsChecking(true);
    setHealthStatus(null);
    try {
      // Temporarily store so checkBackendHealth uses current input
      setApiBaseUrl(baseUrl);
      setUseMockData(useMock);
      const res = await checkBackendHealth();
      setHealthStatus(res);
    } catch {
      setHealthStatus({ connected: false, message: 'Backend unreachable' });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure backend API endpoints, testing execution parameters, and interface preferences.
        </p>
      </div>

      {savedNotification && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800 rounded-md text-xs font-mono text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedNotification}</span>
        </div>
      )}

      <form onSubmit={handleSaveBackend} className="space-y-6">
        {/* Backend & Integration Section */}
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Backend API Integration</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Flask / FastAPI Engine</span>
          </div>

          {/* Mock vs Real Backend Toggle */}
          <div className="p-4 bg-[#070b16] rounded border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-slate-200">Data Source Mode</div>
                <p className="text-[11px] text-slate-400">
                  {useMock
                    ? 'Mock Mode: Operating with local synthetic assessment data (No external server required).'
                    : 'Live API Mode: Dispatching actual requests to your configured FastAPI/Flask backend service.'}
                </p>
              </div>

              <div
                onClick={() => setUseMock(!useMock)}
                className={`w-12 h-6 p-0.5 rounded border transition-colors flex items-center cursor-pointer ${
                  useMock ? 'bg-indigo-600 border-indigo-500 justify-end' : 'bg-slate-800 border-slate-700 justify-start'
                }`}
              >
                <div className="w-4.5 h-4.5 bg-white rounded-xs" />
              </div>
            </div>
          </div>

          {/* API Base URL */}
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1.5">
              Backend Service URL (VITE_API_BASE_URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8000/api"
                className="flex-1 bg-[#070b16] border border-slate-700/80 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCheckHealth}
                isLoading={isChecking}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                <span>Test Health</span>
              </Button>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block font-mono">
              Expected endpoints: GET /api/health, POST /api/assessment/start, GET /api/findings
            </span>
          </div>

          {healthStatus && (
            <div
              className={`p-3 rounded border font-mono text-xs ${
                healthStatus.connected
                  ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                  : 'bg-red-950/20 border-red-800 text-red-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{healthStatus.message}</span>
                {healthStatus.latency && (
                  <span>Latency: {healthStatus.latency}ms</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security & Evidence Redaction Preferences */}
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Evidence & Privacy Safeguards</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">Strict Enforcement</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#070b16] rounded border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Automatic Credential Redaction</div>
                <div className="text-[11px] text-slate-400">
                  Masks Authorization headers, bearer tokens, and session cookies in stored evidence.
                </div>
              </div>
              <span className="text-emerald-400 font-mono text-xs">ALWAYS ACTIVE</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#070b16] rounded border border-slate-800">
              <div>
                <div className="font-semibold text-slate-200">Non-Destructive Safety Gate</div>
                <div className="text-[11px] text-slate-400">
                  Blocks DROP TABLE, arbitrary file writes, and state-destroying payloads during fuzzing.
                </div>
              </div>
              <span className="text-emerald-400 font-mono text-xs">ENFORCED</span>
            </div>
          </div>
        </div>

        {/* Appearance & Interface */}
        <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Interface Preferences</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Workspace View</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-[#070b16] rounded border border-slate-800">
            <div>
              <div className="font-semibold text-xs text-slate-200">Compact Density View</div>
              <div className="text-[11px] text-slate-400">
                Reduces row heights in findings and telemetry tables for higher information density.
              </div>
            </div>
            <input
              type="checkbox"
              checked={compactMode}
              onChange={e => setCompactMode(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" variant="primary" size="md">
            <span>Save Preferences</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
