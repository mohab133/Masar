import React, { memo } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface DownloadToastProps {
  message: string | null;
  error?: boolean;
}

export const DownloadToast: React.FC<DownloadToastProps> = memo(({ message, error = false }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md" dir="rtl">
      <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl border text-sm font-bold ${error ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
        {error ? <AlertCircle size={20} className="shrink-0" /> : <CheckCircle2 size={20} className="shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
});
