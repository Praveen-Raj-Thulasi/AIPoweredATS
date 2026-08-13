import React from 'react';
import { Check, AlertTriangle, Circle, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type EvidenceStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'PARTIAL'
  | 'UNVERIFIED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'INSUFFICIENT'
  | 'CONTRADICTED'
  | 'CONFLICTING';

interface StatusIndicatorProps {
  status: EvidenceStatus | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normalized = (status || '').toUpperCase().trim();

  let icon = <Circle className="w-3 h-3 text-zinc-500" />;
  let text = label || 'Unverified';
  let styleClasses = 'text-zinc-400 bg-zinc-900/40 border-zinc-800/80';

  if (normalized === 'VERIFIED' || normalized === 'READY' || normalized === 'READY_FOR_OFFER') {
    icon = <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />;
    text = label || 'Verified';
    styleClasses = 'text-emerald-300 bg-emerald-950/20 border-emerald-800/40 shadow-glow-emerald/20';
  } else if (
    normalized === 'PARTIALLY_VERIFIED' ||
    normalized === 'PARTIAL' ||
    normalized === 'MOSTLY_READY' ||
    normalized === 'NEEDS_TARGETED_VERIFICATION'
  ) {
    icon = <AlertTriangle className="w-3 h-3 text-amber-400" />;
    text = label || 'Partial';
    styleClasses = 'text-amber-300 bg-amber-950/20 border-amber-800/40 shadow-glow-amber/20';
  } else if (
    normalized === 'INSUFFICIENT_EVIDENCE' ||
    normalized === 'INSUFFICIENT' ||
    normalized === 'REQUIRES_REVIEW'
  ) {
    icon = <AlertCircle className="w-3 h-3 text-brand-coral" />;
    text = label || 'Insufficient Evidence';
    styleClasses = 'text-rose-300 bg-rose-950/20 border-rose-900/40 shadow-glow-coral/20';
  } else if (normalized === 'CONTRADICTED' || normalized === 'CONFLICTING' || normalized === 'REJECTED') {
    icon = <X className="w-3 h-3 text-rose-400 stroke-[2.5]" />;
    text = label || 'Contradicted';
    styleClasses = 'text-rose-300 bg-rose-950/20 border-rose-800/40 shadow-glow-coral/20';
  } else if (normalized === 'UNVERIFIED' || normalized === 'PENDING') {
    icon = <Circle className="w-3 h-3 text-zinc-500" />;
    text = label || 'Unverified';
    styleClasses = 'text-zinc-400 bg-zinc-900/40 border-zinc-800/70';
  }


  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center font-medium rounded-full border tracking-tight select-none transition-colors',
          sizeClasses[size],
          styleClasses,
          className
        )
      )}
    >
      {showIcon && <span className="shrink-0">{icon}</span>}
      <span>{text}</span>
    </span>
  );
};
