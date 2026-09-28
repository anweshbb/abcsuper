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
      <div className="bg-white text-gray-900 p-3.5 sm:p-4 rounded-2xl shadow-xl border border-emerald-200/80 flex items-start gap-3 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin-slow" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
              Live Sync Update
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 mt-0.5 font-medium leading-snug">
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
