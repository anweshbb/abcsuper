import React, { useEffect } from 'react';
import { Sparkles, X, CheckCircle2, TrendingDown } from 'lucide-react';

interface LiveToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const LiveToast: React.FC<LiveToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-short">
      <div className="bg-gray-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-gray-700/60 flex items-start gap-3 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
              Live Sync Update
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-200 mt-0.5 font-medium leading-snug">
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
