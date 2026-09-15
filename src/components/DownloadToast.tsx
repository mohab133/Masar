import React, { memo } from 'react';
import { CheckCircle2, AlertCircle, LoaderCircle } from 'lucide-react';

interface DownloadToastProps {
  message: string | null;
  error?: boolean;
  loading?: boolean;
  variant?: 'fixed';
}

export const DownloadToast: React.FC<DownloadToastProps> = memo(({ message, error = false, loading = false }) => {
  if (!message) return null;
  return (
    <div
      className="download-toast fixed left-1/2 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] -translate-x-1/2 z-[80] w-[calc(100%-2rem)] max-w-md pointer-events-none"
      dir="rtl"
      role={error ? 'alert' : 'status'}
      aria-live="polite"
    >
      <div className={`download-toast-card flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl border text-sm font-bold ${
        loading ? 'bg-blue-50 text-blue-800 border-blue-200' : error ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}>
        {loading ? <LoaderCircle size={20} className="shrink-0 animate-spin" /> : error ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
        <span className="min-w-0 truncate text-center">{message}</span>
      </div>
    </div>
  );
});
