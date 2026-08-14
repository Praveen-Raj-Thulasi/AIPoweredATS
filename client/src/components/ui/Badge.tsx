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
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    gray: 'bg-slate-50 text-slate-500 border border-slate-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    orange: 'bg-orange-50 text-orange-700 border border-orange-200 font-medium',
    danger: 'bg-red-50 text-red-755 border border-red-205 font-medium',
    purple: 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    outline: 'border border-slate-200 text-slate-600 bg-transparent hover:border-slate-300',
  };

  return (
    <span className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))} {...props}>
      {children}
    </span>
  );
};


