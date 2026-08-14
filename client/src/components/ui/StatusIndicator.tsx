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

  let icon = <Circle className="w-3 h-3 text-slate-500" />;
  let text = label || 'Unverified';
  let styleClasses = 'text-slate-600 bg-slate-50 border-slate-250';

  if (normalized === 'VERIFIED' || normalized === 'READY' || normalized === 'READY_FOR_OFFER') {
    icon = <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />;
    text = label || 'Verified';
    styleClasses = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  } else if (
    normalized === 'PARTIALLY_VERIFIED' ||
    normalized === 'PARTIAL' ||
    normalized === 'MOSTLY_READY' ||
    normalized === 'NEEDS_TARGETED_VERIFICATION'
  ) {
    icon = <AlertTriangle className="w-3 h-3 text-amber-600" />;
    text = label || 'Partial';
    styleClasses = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (
    normalized === 'INSUFFICIENT_EVIDENCE' ||
    normalized === 'INSUFFICIENT' ||
    normalized === 'REQUIRES_REVIEW'
  ) {
    icon = <AlertCircle className="w-3 h-3 text-red-650" />;
    text = label || 'Insufficient Evidence';
    styleClasses = 'text-red-755 bg-red-50 border-red-205';
  } else if (normalized === 'CONTRADICTED' || normalized === 'CONFLICTING' || normalized === 'REJECTED') {
    icon = <X className="w-3 h-3 text-rose-600 stroke-[2.5]" />;
    text = label || 'Contradicted';
    styleClasses = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (normalized === 'UNVERIFIED' || normalized === 'PENDING') {
    icon = <Circle className="w-3 h-3 text-slate-400" />;
    text = label || 'Unverified';
    styleClasses = 'text-slate-500 bg-slate-50 border-slate-200';
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
