import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'gradient-purple' | 'gradient-magenta' | 'gradient-action';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97] hover:-translate-y-0.5';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-white hover:bg-zinc-100 text-black font-semibold shadow-sm focus:ring-white border border-white',
    gradient: 'bg-white hover:bg-zinc-100 text-black font-semibold shadow-sm focus:ring-white border border-white',
    secondary: 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 border border-zinc-800 focus:ring-zinc-400',
    outline: 'border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-300 hover:text-white focus:ring-zinc-400',
    ghost: 'hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 focus:ring-zinc-400 border border-transparent',
    danger: 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-900/50 shadow-glow-coral focus:ring-rose-400',
    'gradient-purple': 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-glow-purple focus:ring-brand-purple border-none',
    'gradient-magenta': 'bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:from-blue-500 hover:via-indigo-500 hover:to-pink-500 text-white font-semibold shadow-glow-magenta focus:ring-brand-purple border-none',
    'gradient-action': 'bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white font-semibold shadow-glow-blue focus:ring-brand-blue border-none',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};



