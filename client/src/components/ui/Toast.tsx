import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.durationMs || 4000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />,
          border: 'border-zinc-500',
          bg: 'bg-zinc-950/95',
          accent: 'bg-white',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-zinc-300 flex-shrink-0" />,
          border: 'border-zinc-600',
          bg: 'bg-zinc-950/95',
          accent: 'bg-zinc-400',
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-zinc-200 flex-shrink-0" />,
          border: 'border-zinc-600',
          bg: 'bg-zinc-950/95',
          accent: 'bg-zinc-400',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-white flex-shrink-0" />,
          border: 'border-zinc-600',
          bg: 'bg-zinc-950/95',
          accent: 'bg-white',
        };
    }
  };

  const style = getToastStyle();

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border ${style.border} ${style.bg} shadow-2xl shadow-black/80 backdrop-blur-xl min-w-[320px] max-w-md transition-all duration-200 animate-in fade-in slide-in-from-top-2`}
    >
      <div className={`absolute top-0 left-3 right-3 h-[2px] ${style.accent} rounded-full opacity-70`} />
      {style.icon}
      <div className="flex-1 pr-2">
        <h4 className="text-xs font-semibold text-zinc-100">{toast.title}</h4>
        {toast.message && <p className="text-xs text-zinc-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

