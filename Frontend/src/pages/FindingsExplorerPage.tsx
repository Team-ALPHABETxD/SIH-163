import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { findingsApi } from '../services/findingsService';
import { SecurityFinding, Severity, FindingStatus } from '../types';

export const Findings: React.FC = () => {
  const [findings, setFindings] = useState<SecurityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await findingsApi.getFindings();
        setFindings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = Array.from(new Set(findings.map(f => f.category)));

  const filtered = findings.filter(f => {
    const matchesSearch =
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.affectedComponent.toLowerCase().includes(search.toLowerCase()) ||
      f.cwe.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus;

    return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'open':
        return <span className="text-[11px] font-mono text-red-400">Open</span>;
      case 'in_review':
        return <span className="text-[11px] font-mono text-amber-400">In Review</span>;
      case 'resolved':
        return <span className="text-[11px] font-mono text-emerald-400">Resolved</span>;
      case 'accepted_risk':
        return <span className="text-[11px] font-mono text-slate-400">Accepted Risk</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security Findings</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review vulnerabilities, misconfigurations, and non-compliant controls flagged during security testing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/reports">
            <Button variant="secondary" size="sm">
              <span>Generate Executive Report</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-md space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search findings by title, endpoint, or CWE..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#070b16] border border-slate-700/80 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={e => setSelectedSeverity(e.target.value)}
              className="bg-[#070b16] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[#070b16] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Category: All</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="bg-[#070b16] border border-slate-700/80 rounded px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="accepted_risk">Accepted Risk</option>
            </select>

            {(search || selectedSeverity !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setSelectedSeverity('all');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="text-xs text-slate-400 hover:text-white h-8 px-2"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
          <span>Showing {filtered.length} of {findings.length} findings</span>
          <span>Redacted HTTP proof available for each entry</span>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-mono text-xs text-slate-500">Loading findings register...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No security findings found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No vulnerabilities match your current search and filter parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1424] border-b border-slate-800 font-mono text-[11px] text-slate-400 uppercase">
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Finding Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Affected Component</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">CVSS / CWE</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SeverityBadge severity={f.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 min-w-[260px]">
                      <Link
                        to={`/findings/${f.id}`}
                        className="font-medium text-slate-200 hover:text-white block hover:underline"
                      >
                        {f.title}
                      </Link>
                      <span className="text-[11px] text-slate-500 font-mono">{f.id}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {f.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] max-w-xs truncate">
                      {f.affectedComponent}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(f.status)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      <span className="text-slate-200 font-semibold">{f.cvssScore > 0 ? f.cvssScore.toFixed(1) : '—'}</span>
                      <span className="text-slate-600"> / </span>
                      <span>{f.cwe}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link to={`/findings/${f.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px]">
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
