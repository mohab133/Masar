import React, { memo } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { MasarLogo } from './MasarLogo';

interface HeaderProps {
  onOpenFeedback: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ onOpenFeedback }) => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 bg-white px-4.5 pt-safe-top pb-3 border-b border-slate-200/60"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand identity: Logo & Name enlarged per request */}
        <div className="flex items-center gap-3">
          <MasarLogo size={48} />
          <div className="flex flex-col -space-y-0.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              مَسَارْ
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-wide">
              دليلك الأكاديمي
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
          id="header-feedback-button"
          type="button"
          onClick={onOpenFeedback}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 active:bg-blue-100 border border-blue-200/80 transition-all shadow-2xs"
          aria-label="إرسال ملاحظة"
        >
          <MessageSquarePlus size={14} className="text-blue-600" />
          <span>ملاحظة</span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

