import React, { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Crosshair,
  PlaySquare,
  AlertTriangle,
  Layers,
  FileText,
  Settings,
  X,
  Server,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { checkBackendHealth } from '../../services/apiClient';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; message: string; latency?: number }>({
    connected: true,
    message: 'Checking...',
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await checkBackendHealth();
      setBackendStatus(res);
    } catch {
      setBackendStatus({ connected: false, message: 'Backend Offline' });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'New Scan', to: '/target', icon: Crosshair },
    { name: 'Live Monitor', to: '/assessment/running', icon: PlaySquare },
    { name: 'Findings', to: '/findings', icon: AlertTriangle },
    { name: 'Attack Graph', to: '/graph', icon: Layers },
    { name: 'Test Modules', to: '/modules', icon: Layers },
    { name: 'Reports', to: '/reports', icon: FileText },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 flex flex-col h-full select-none shrink-0">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-slate-100 hover:text-white transition-colors">
          <div className="w-7 h-7 bg-indigo-600/20 border border-indigo-500/40 rounded flex items-center justify-center text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm tracking-tight flex items-center gap-1.5">
              <span>Sentinel</span>
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-indigo-950 text-indigo-300 border border-indigo-800/50 rounded-sm">
                SEC
              </span>
            </div>
          </div>
        </Link>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Security Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-950/60 text-indigo-300 border-l-2 border-indigo-500 font-semibold pl-2.5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        <div className="pt-4 px-2 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500">
          Quick Links
        </div>
        <Link
          to="/"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 rounded-md transition-colors"
        >
          <span className="flex items-center gap-3">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <span>Product Website</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Home</span>
        </Link>
      </div>

      {/* Backend Status & Version Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-[#080d19] text-xs">
        <div className="p-2.5 bg-[#0e1628] rounded border border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Server className="w-3 h-3 text-slate-500" />
              <span>Backend Engine</span>
            </span>
            <button
              onClick={checkStatus}
              title="Refresh connection"
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                backendStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'
              }`}
            />
            <span className="font-mono text-[11px] text-slate-300 truncate">
              {backendStatus.connected ? 'Connected' : 'Backend Offline'}
            </span>
          </div>

          <p className="text-[10px] text-slate-500 mt-1 truncate font-mono">
            {backendStatus.message}
          </p>
        </div>

        <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Sentinel Core</span>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
