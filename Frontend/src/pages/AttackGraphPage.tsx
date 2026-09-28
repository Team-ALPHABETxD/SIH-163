import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AttackGraphCanvas } from '../components/graph/AttackGraphCanvas';
import { Network, FileDown, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { chainsApi, AttackChain } from '../services/chainsService';
import { findingsApi } from '../services/findingsService';
import { SecurityFinding } from '../types';

export const AttackGraphPage: React.FC = () => {
  const [chains, setChains] = useState<AttackChain[]>([]);
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const runId = searchParams.get('runId') || undefined;
    Promise.all([chainsApi.getChains(runId), findingsApi.getFindings(runId)]).then(([c, f]) => { setChains(c); setFindings(f); }).catch(console.error);
  }, [searchParams]);

  const active = chains.length > 0;
  const nodeIds = Array.from(new Set(chains.flatMap(chain => chain.node_ids)));
  const nodes = nodeIds.map((id, i) => {
    const f = findings.find(x => x.id === id);
    return { id, position: { x: (i % 3) * 300 + 80, y: Math.floor(i / 3) * 180 + 80 }, data: { label: f ? `${f.title} [${f.severity.toUpperCase()}]` : id }, style: { backgroundColor: '#1e1b4b', color: '#e0e7ff', border: '1px solid #6366f1' } };
  });
  const edges = chains.flatMap((chain, chainIndex) => chain.edges.map((e, i) => ({ id: `e-${chainIndex}-${i}`, source: e.source, target: e.target, label: e.label, animated: true })));

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ chains, findings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'vulnweave-attack-graph.json'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono uppercase tracking-wider">Correlation Engine</span><span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono uppercase tracking-wider">Live API</span></div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2"><Network className="w-7 h-7 text-indigo-500" />Attack Graph Visualizer</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">Rule-based candidate attack chains generated from normalized findings. Analysts can confirm or reject chains before reporting.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportJson}><FileDown className="w-4 h-4 mr-2" />Export Graph JSON</Button>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4"><div className="text-slate-400 text-xs font-mono mb-1">IDENTIFIED FINDINGS</div><div className="text-2xl font-bold text-slate-200">{findings.length}</div></div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4"><div className="text-slate-400 text-xs font-mono mb-1">ATTACK CHAINS</div><div className="text-2xl font-bold text-indigo-400">{chains.length}</div></div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4"><div className="text-slate-400 text-xs font-mono mb-1">HIGH/CRITICAL CHAINS</div><div className="text-2xl font-bold text-red-400 flex items-center gap-2"><ShieldAlert className="w-5 h-5" />{chains.filter(c => c.severity === 'high' || c.severity === 'critical').length}</div></div>
        <div className="bg-[#0b1222] border border-slate-800 rounded-lg p-4"><div className="text-slate-400 text-xs font-mono mb-1">ENGINE STATUS</div><div className="text-sm font-bold text-emerald-400">{active ? 'Synchronized' : 'Awaiting chains'}</div></div>
      </div>
      <div className="flex-1 w-full rounded-xl shadow-2xl relative border border-slate-800 bg-[#060913] p-1">
        {active ? <AttackGraphCanvas initialNodes={nodes} initialEdges={edges} /> : <div className="h-full flex items-center justify-center text-slate-500 text-sm">Run an assessment to generate candidate attack chains.</div>}
      </div>
    </div>
  );
};
