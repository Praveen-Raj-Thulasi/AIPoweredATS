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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97] hover:-translate-y-0.5';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm focus:ring-sky-500 border border-sky-500',
    gradient: 'bg-sky-500 hover:bg-sky-600 text-white font-semibold shadow-sm focus:ring-sky-500 border border-sky-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 focus:ring-slate-400',
    outline: 'border border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700 hover:text-slate-900 focus:ring-slate-400',
    ghost: 'hover:bg-slate-100/80 text-slate-500 hover:text-slate-900 focus:ring-slate-400 border border-transparent',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-sm focus:ring-red-400',
    'gradient-purple': 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-semibold shadow-glow-blue focus:ring-sky-500 border-none',
    'gradient-magenta': 'bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-400 hover:from-sky-500 hover:via-sky-400 hover:to-cyan-300 text-white font-semibold shadow-glow-cyan focus:ring-sky-500 border-none',
    'gradient-action': 'bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-350 text-white font-semibold shadow-glow-blue focus:ring-sky-500 border-none',
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



