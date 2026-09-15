import React, { memo } from 'react';
import { Bell, MessageSquarePlus } from 'lucide-react';
import { MasarLogo } from './MasarLogo';

interface HeaderProps {
  onOpenFeedback: () => void;
  onOpenNotifications: () => void;
  hasUnreadNotifications: boolean;
}

export const Header: React.FC<HeaderProps> = memo(({ onOpenFeedback, onOpenNotifications, hasUnreadNotifications }) => {
  return (
    <header
      id="app-main-header"
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md px-4 pt-safe-top pb-3 border-b border-slate-200/60 shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
    >
      <div className="max-w-md md:max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand identity: Logo & Name enlarged per request */}
        <div className="flex items-center gap-3">
          <MasarLogo size={46} />
          <div className="flex flex-col -space-y-0.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              مَسَارْ
            </span>
            <span className="text-xs font-bold text-slate-400 tracking-wide">
              دليلك الأكاديمي
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="header-notifications-button"
            type="button"
            onClick={onOpenNotifications}
            className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 bg-slate-50 hover:bg-slate-100 active:bg-slate-100 border border-slate-200/80 smooth-interaction"
            aria-label="فتح الإشعارات"
            title="الإشعارات"
          >
            <Bell size={20} />
            {hasUnreadNotifications && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white"
                aria-label="إشعار جديد"
              />
            )}
          </button>

          <button
          id="header-feedback-button"
          type="button"
          onClick={onOpenFeedback}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 active:bg-blue-100 border border-blue-200/80 smooth-interaction shadow-2xs"
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
