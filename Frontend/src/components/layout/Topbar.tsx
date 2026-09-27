import React from 'react';
import { Menu, ShieldCheck, Play, Crosshair } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path.startsWith('/target')) return 'Target Configuration';
    if (path.startsWith('/assessment/running')) return 'Live Assessment Execution';
    if (path.startsWith('/assessment')) return 'New Security Assessment';
    if (path.startsWith('/findings/')) return 'Finding Detail Inspection';
    if (path.startsWith('/findings')) return 'Security Findings';
    if (path.startsWith('/modules/')) return 'Module Detail';
    if (path.startsWith('/modules')) return 'Assessment Modules';
    if (path.startsWith('/reports/')) return 'Executive Security Report';
    if (path.startsWith('/reports')) return 'Security Reports';
    if (path.startsWith('/settings')) return 'Platform Settings';
    return 'Security Overview';
  };

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 hidden sm:inline">Workspace /</span>
          <h1 className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
            {getBreadcrumb()}
          </h1>
        </div>
      </div>

      {/* Target Status Banner & Quick Action */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1 bg-[#0d1424] border border-slate-800 rounded text-xs">
          <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Target:</span>
          <span className="font-medium text-slate-200 font-mono">World Monitor</span>
          <span className="text-slate-600">|</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Authorized Test Env</span>
          </span>
        </div>

        {location.pathname !== '/assessment' && location.pathname !== '/assessment/running' && (
          <Link to="/assessment">
            <Button size="sm" variant="primary" className="h-8 text-xs font-medium">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">New</span> Assessment
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
