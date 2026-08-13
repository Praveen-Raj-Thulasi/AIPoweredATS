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
    default: 'bg-[#0c0c0e]/85 border border-zinc-800/80',
    glass: 'glass-card',
    'glow-purple': 'bg-[#0c0c0e]/85 border border-zinc-800/80 gradient-border-purple shadow-glow-purple/20',
    'glow-magenta': 'bg-[#0c0c0e]/85 border border-zinc-800/80 gradient-border-magenta shadow-glow-magenta/25',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-2xl text-zinc-100 relative overflow-hidden transition-all duration-300',
          paddingStyles[padding],
          variantClasses[variant],
          hoverable && 'hover:border-zinc-700 hover:bg-[#101013]/90 hover:shadow-glow-subtle hover:-translate-y-0.5',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};



