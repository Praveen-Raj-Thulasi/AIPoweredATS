import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'blue' | 'outline' | 'orange' | 'gray';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full tracking-tight transition-colors select-none';

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-xs',
  };

  const variantStyles = {
    default: 'bg-zinc-900/80 text-zinc-300 border border-zinc-800',
    gray: 'bg-zinc-900/50 text-zinc-400 border border-zinc-800/80',
    success: 'bg-emerald-950/30 text-emerald-300 border border-emerald-800/40 font-medium',
    warning: 'bg-amber-950/30 text-amber-300 border border-amber-800/40 font-medium',
    orange: 'bg-orange-950/30 text-orange-300 border border-orange-800/40 font-medium',
    danger: 'bg-rose-950/30 text-rose-300 border border-rose-800/40 font-medium',
    purple: 'bg-zinc-800/70 text-zinc-200 border border-zinc-700 font-medium',
    blue: 'bg-zinc-850 text-zinc-200 border border-zinc-700 font-medium',
    outline: 'border border-zinc-800 text-zinc-400 bg-transparent hover:border-zinc-700',
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))} {...props}>
      {children}
    </span>
  );
};


