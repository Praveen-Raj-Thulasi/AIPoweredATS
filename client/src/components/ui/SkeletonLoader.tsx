import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'table-row';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const getBaseClasses = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full bg-zinc-900/80 shimmer-effect';
      case 'rectangular':
        return 'rounded-xl bg-zinc-900/80 shimmer-effect';
      case 'card':
        return 'rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 p-6 shimmer-effect';
      case 'table-row':
        return 'h-14 w-full rounded-xl bg-zinc-900/30 border-b border-zinc-850/60 shimmer-effect';
      case 'text':
      default:
        return 'h-4 w-full rounded-lg bg-zinc-900/80 shimmer-effect';
    }
  };

  const renderSingle = (key: number) => {
    if (variant === 'card') {
      return (
        <div key={key} className={`space-y-3 ${getBaseClasses()} ${className}`}>
          <div className="flex items-center justify-between">
            <div className="h-4 w-1/3 bg-zinc-800 rounded" />
            <div className="h-4 w-12 bg-zinc-800 rounded" />
          </div>
          <div className="h-3 w-3/4 bg-zinc-800/70 rounded" />
          <div className="h-3 w-1/2 bg-zinc-800/70 rounded" />
          <div className="pt-2 flex gap-2">
            <div className="h-6 w-16 bg-zinc-800 rounded-full" />
            <div className="h-6 w-20 bg-zinc-800 rounded-full" />
          </div>
        </div>
      );
    }

    if (variant === 'table-row') {
      return (
        <div key={key} className={`flex items-center gap-4 px-4 ${getBaseClasses()} ${className}`}>
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
          <div className="h-4 w-1/4 bg-zinc-800 rounded" />
          <div className="h-4 w-1/5 bg-zinc-800/70 rounded" />
          <div className="h-4 w-1/6 bg-zinc-800/70 rounded hidden md:block" />
          <div className="h-6 w-20 bg-zinc-800 rounded-full ml-auto" />
        </div>
      );
    }

    return <div key={key} className={`${getBaseClasses()} ${className}`} />;
  };

  if (count === 1) {
    return renderSingle(0);
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => renderSingle(i))}
    </div>
  );
};

