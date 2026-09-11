import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { motion } from 'motion/react';
import { MasarLogo } from './MasarLogo';

interface HeaderProps {
  onOpenFeedback: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFeedback }) => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-md px-4.5 py-3 border-b border-slate-200/60"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand identity: Logo & Name with calm colors */}
        <div className="flex items-center gap-3">
          <MasarLogo size={40} />
          <div className="flex flex-col -space-y-1">
            <span className="text-xl font-black text-slate-900 tracking-normal">
              مَسَارْ
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
              دليلك الأكاديمي
            </span>
          </div>
        </div>

        {/* Feedback action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.94 }}
          id="header-feedback-button"
          type="button"
          onClick={onOpenFeedback}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-100 active:bg-blue-100 border border-blue-200/80 transition-all shadow-2xs"
          aria-label="إرسال ملاحظة"
        >
          <MessageSquarePlus size={14} className="text-blue-600" />
          <span>ملاحظة</span>
        </motion.button>
      </div>
    </header>
  );
};

