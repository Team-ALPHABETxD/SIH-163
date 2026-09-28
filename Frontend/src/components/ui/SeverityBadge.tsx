import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const configs: Record<Severity, { label: string; text: string; bg: string; border: string; dot: string }> = {
    critical: {
      label: 'CRITICAL',
      text: 'text-red-400',
      bg: 'bg-red-950/40',
      border: 'border-red-800/60',
      dot: 'bg-red-500',
    },
    high: {
      label: 'HIGH',
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-800/60',
      dot: 'bg-orange-500',
    },
    medium: {
      label: 'MEDIUM',
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-800/60',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'LOW',
      text: 'text-blue-400',
      bg: 'bg-blue-950/40',
      border: 'border-blue-800/60',
      dot: 'bg-blue-500',
    },
    info: {
      label: 'INFO',
      text: 'text-slate-400',
      bg: 'bg-slate-900/60',
      border: 'border-slate-700/60',
      dot: 'bg-slate-500',
    },
  };

  const c = configs[severity];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded-sm border ${c.bg} ${c.border} ${c.text} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-none ${c.dot}`} aria-hidden="true" />
      {c.label}
    </span>
  );
};
