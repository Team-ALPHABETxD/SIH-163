import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  Copy,
  ExternalLink,
  Code,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { findingsApi } from '../services/findingsService';
import { SecurityFinding, FindingStatus } from '../types';

export const FindingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [finding, setFinding] = useState<SecurityFinding | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'reproduction' | 'remediation'>('evidence');

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await findingsApi.getFindingById(id);
        if (data) setFinding(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleStatusChange = async (newStatus: FindingStatus) => {
    if (!finding) return;
    try {
      const updated = await findingsApi.updateFindingStatus(finding.id, newStatus);
      setFinding(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const copyEvidence = () => {
    if (!finding) return;
    const text = `Vulnerability: ${finding.title}\nID: ${finding.id}\nComponent: ${finding.affectedComponent}\nRequest: ${finding.evidence.requestMethod} ${finding.evidence.requestUrl}\nPayload: ${finding.evidence.payloadInjected || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="h-64 flex items-center justify-center font-mono text-xs text-slate-500">Loading finding details...</div>;
  }

  if (!finding) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">Finding Not Found</h3>
        <p className="text-xs text-slate-400">The requested finding ID does not exist in the assessment registry.</p>
        <Link to="/findings">
          <Button variant="secondary" size="sm">Back to Findings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <Link
          to="/findings"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Findings Register</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">Triage Status:</span>
          <select
            value={finding.status}
            onChange={(e) => handleStatusChange(e.target.value as FindingStatus)}
            className="bg-[#0c1324] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
          >
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="accepted_risk">Accepted Risk</option>
          </select>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="p-6 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={finding.severity} size="md" />
          <span className="text-xs font-mono text-slate-400">ID: {finding.id}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-slate-400">{finding.category}</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs font-mono text-indigo-400">{finding.cwe}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {finding.title}
        </h1>

        <div className="p-3 bg-[#070b16] rounded border border-slate-800/80 font-mono text-xs text-slate-300 flex items-center justify-between">
          <span className="text-slate-500">Affected Component:</span>
          <span className="text-indigo-300 font-semibold">{finding.affectedComponent}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs font-mono">
          <div>
            <div className="text-slate-500 text-[11px]">CVSS 3.1 BASE</div>
            <div className="text-base font-bold text-white tabular-nums mt-0.5">
              {finding.cvssScore > 0 ? finding.cvssScore.toFixed(1) : 'Informational'}
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">MODULE</div>
            <div className="text-slate-200 font-semibold mt-0.5">{finding.category}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">STATUS</div>
            <div className="text-slate-200 font-semibold mt-0.5 capitalize">{finding.status.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">DETECTED</div>
            <div className="text-slate-200 font-semibold mt-0.5">{new Date(finding.detectedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Overview & Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-2">
          <h3 className="text-sm font-semibold text-white">Vulnerability Overview</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{finding.overview}</p>
          <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800">{finding.description}</p>
        </div>

        <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Technical & Business Impact</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">{finding.impact}</p>
        </div>
      </div>

      {/* Tabs: Evidence / Reproduction / Remediation */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-md overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 bg-[#0d1424] px-4 gap-2">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-indigo-500 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Technical Evidence
          </button>
          <button
            onClick={() => setActiveTab('reproduction')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reproduction'
                ? 'border-indigo-500 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Reproduction Steps
          </button>
          <button
            onClick={() => setActiveTab('remediation')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'remediation'
                ? 'border-indigo-500 text-indigo-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Remediation & Patch
          </button>
        </div>

        <div className="p-6">
          {/* 1. Evidence Tab */}
          {activeTab === 'evidence' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span>HTTP TRANSACTION AUDIT TRAIL</span>
                <Button variant="ghost" size="sm" onClick={copyEvidence} className="h-7 text-[11px]">
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>{copied ? 'Copied' : 'Copy Evidence'}</span>
                </Button>
              </div>

              {finding.evidence.payloadInjected && (
                <div className="p-3 bg-amber-950/20 border border-amber-800/60 rounded font-mono text-xs text-amber-300">
                  <span className="font-semibold">Injected Vector: </span>
                  <span>{finding.evidence.payloadInjected}</span>
                </div>
              )}

              {/* Request */}
              <div className="space-y-2">
                <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-indigo-500" />
                  <span>Dispatched Request</span>
                </div>
                <div className="p-3 bg-[#050811] rounded border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-indigo-400 font-semibold">{finding.evidence.requestMethod}</span>{' '}
                    <span>{finding.evidence.requestUrl}</span> HTTP/1.1
                  </div>
                  {Object.entries(finding.evidence.requestHeaders).map(([k, v]) => (
                    <div key={k} className="text-slate-400">
                      <span className="text-slate-500">{k}:</span> {v}
                    </div>
                  ))}
                  {finding.evidence.requestBody && (
                    <div className="pt-2 text-indigo-200 border-t border-slate-800/80">
                      {finding.evidence.requestBody}
                    </div>
                  )}
                </div>
              </div>

              {/* Response */}
              <div className="space-y-2">
                <div className="font-mono text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-none bg-emerald-500" />
                  <span>Target Response</span>
                </div>
                <div className="p-3 bg-[#050811] rounded border border-slate-800/90 font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-emerald-400">
                    HTTP/1.1 {finding.evidence.responseStatus} OK
                  </div>
                  {Object.entries(finding.evidence.responseHeaders).map(([k, v]) => (
                    <div key={k} className="text-slate-400">
                      <span className="text-slate-500">{k}:</span> {v}
                    </div>
                  ))}
                  <pre className="pt-2 text-slate-300 border-t border-slate-800/80 overflow-x-auto text-[11px]">
                    {finding.evidence.responseBody}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* 2. Reproduction Tab */}
          {activeTab === 'reproduction' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Verification Sequence</h4>
              <p className="text-xs text-slate-400">
                Follow these manual curl or proxy reproduction steps to confirm the vulnerability independently:
              </p>
              <div className="space-y-2.5">
                {finding.reproductionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#070b16] border border-slate-800 rounded text-xs font-mono">
                    <span className="w-5 h-5 rounded-xs bg-indigo-950 text-indigo-400 border border-indigo-800/50 flex items-center justify-center shrink-0 text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-300 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Remediation Tab */}
          {activeTab === 'remediation' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">Recommended Engineering Fix</h4>
                <p className="text-xs text-slate-300">{finding.remediation.summary}</p>
              </div>

              {finding.remediation.codeExample && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>CODE PATCH ({finding.remediation.language?.toUpperCase() || 'SOURCE'})</span>
                  </div>
                  <pre className="p-4 bg-[#050811] border border-slate-800 rounded font-mono text-xs text-indigo-200 overflow-x-auto leading-relaxed">
                    {finding.remediation.codeExample}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-xs font-mono uppercase text-slate-400">Engineering Action Items</h5>
                <ul className="space-y-2">
                  {finding.remediation.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 shrink-0 font-mono">▸</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* References Section */}
      <div className="p-5 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-3">
        <h4 className="text-xs font-mono uppercase text-slate-400">Industry Standards & References</h4>
        <div className="space-y-2">
          {finding.references.map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2.5 bg-[#070b16] border border-slate-800 rounded hover:border-slate-700 transition-colors text-xs text-slate-300 hover:text-white"
            >
              <span>{ref.title}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
