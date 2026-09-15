import React, { memo } from 'react';
import { CheckCircle2, AlertCircle, LoaderCircle } from 'lucide-react';

interface DownloadToastProps {
  message: string | null;
  error?: boolean;
  loading?: boolean;
  // 'fixed' (default): pinned above the bottom nav, viewport-wide — used in the tab views.
  // 'inline': anchored to the bottom of its own positioned container — used inside modals,
  // so the toast can never overlap content outside the modal it belongs to.
  variant?: 'fixed' | 'inline';
}

export const DownloadToast: React.FC<DownloadToastProps> = memo(({ message, error = false, loading = false, variant = 'fixed' }) => {
  if (!message) return null;
  const positionClass = variant === 'inline'
    ? 'absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)]'
    : 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md';
  return (
    <div className={positionClass} dir="rtl">
      <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl border text-sm font-bold ${
        loading ? 'bg-blue-50 text-blue-800 border-blue-200' : error ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}>
        {loading ? <LoaderCircle size={20} className="shrink-0 animate-spin" /> : error ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
});
