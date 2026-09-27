import React from 'react';
import { AttackGraphCanvas } from '../components/graph/AttackGraphCanvas';
import { Network, FileDown, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Dummy attack chain data simulating correlated vulnerabilities
const initialNodes = [
  { id: '1', position: { x: 50, y: 250 }, data: { label: 'Internet (Attacker)' }, type: 'input', style: { border: '2px solid #ef4444', backgroundColor: '#450a0a', color: '#fca5a5' } },
  { id: '2', position: { x: 350, y: 150 }, data: { label: 'Auth Bypass (CVE-2023-XXXX)' }, style: { backgroundColor: '#1e1b4b', color: '#c7d2fe', border: '1px solid #4f46e5' } },
  { id: '3', position: { x: 350, y: 350 }, data: { label: 'Exposed API Endpoint' }, style: { backgroundColor: '#1e1b4b', color: '#c7d2fe', border: '1px solid #4f46e5' } },
  { id: '4', position: { x: 650, y: 250 }, data: { label: 'Stolen JWT Admin Token' }, style: { backgroundColor: '#312e81', color: '#e0e7ff', border: '2px solid #6366f1' } },
  { id: '5', position: { x: 950, y: 250 }, data: { label: 'Production Database' }, type: 'output', style: { border: '2px solid #10b981', backgroundColor: '#064e3b', color: '#6ee7b7' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', style: { stroke: '#6366f1' } },
  { id: 'e3-4', source: '3', target: '4', style: { stroke: '#6366f1' } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#10b981', strokeWidth: 3 } },
];

export const AttackGraphPage: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono uppercase tracking-wider">
              Correlation Engine
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Network className="w-7 h-7 text-indigo-500" />
            Attack Graph Visualizer
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Interactive mapping of correlated vulnerability chains. This visualizer automatically connects individual findings to map potential multi-step breach scenarios.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <FileDown className="w-4 h-4 mr-2" />
            Export Graph SVG
          </Button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-mono mb-1">IDENTIFIED NODES</div>
          <div className="text-2xl font-bold text-slate-200">24</div>
        </div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-mono mb-1">ATTACK PATHS</div>
          <div className="text-2xl font-bold text-indigo-400">12</div>
        </div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4">
          <div className="text-slate-400 text-xs font-mono mb-1">CRITICAL CHAINS</div>
          <div className="text-2xl font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> 3
          </div>
        </div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-mono mb-1">ENGINE STATUS</div>
            <div className="text-sm font-bold text-emerald-400">Synchronized</div>
          </div>
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div className="flex-1 w-full rounded-xl shadow-2xl relative border border-slate-800 bg-[#060913] p-1">
        <AttackGraphCanvas initialNodes={initialNodes} initialEdges={initialEdges} />
      </div>
    </div>
  );
};
