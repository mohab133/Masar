import React, { memo } from 'react';
import { Check, Download } from 'lucide-react';

interface DownloadButtonProps {
  available: boolean;
  downloading?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = memo(({ available, downloading = false, onClick, label = 'تحميل الملف' }) => !available ? (
  <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">غير متاح حاليًا</span>
) : (
  <button
    type="button"
    onClick={onClick}
    disabled={downloading}
    className={`w-10 h-10 rounded-xl border transition-all duration-200 shrink-0 flex items-center justify-center shadow-2xs active:scale-95 ${
      downloading
        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
        : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200 cursor-pointer'
    }`}
    aria-label={label}
    title={label}
  >
    {downloading ? <Check size={18} /> : <Download size={19} strokeWidth={2.2} />}
  </button>
));

DownloadButton.displayName = 'DownloadButton';
