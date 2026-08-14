import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  variant?: 'default' | 'glass' | 'glow-purple' | 'glow-magenta';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hoverable = false,
  variant = 'default',
  ...props
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4 sm:p-5',
    md: 'p-6 sm:p-7',
    lg: 'p-8 sm:p-9',
  };

  const variantClasses = {
    default: 'bg-card border border-border shadow-sm',
    glass: 'glass-card',
    'glow-purple': 'bg-card border border-border gradient-border-purple shadow-glow-purple/10',
    'glow-magenta': 'bg-card border border-border gradient-border-magenta shadow-glow-magenta/15',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl text-slate-800 relative overflow-hidden transition-all duration-300',
          paddingStyles[padding],
          variantClasses[variant],
          hoverable && 'hover:border-slate-300 hover:bg-slate-50 hover:shadow-glow-blue/5 hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};



