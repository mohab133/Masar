import React from 'react';
import { FEELogo } from './FEELogo';

export const Header: React.FC = () => {
  return (
    <header
      id="app-main-header"
      className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-4 py-2.5 border-b border-slate-100 text-slate-900 shadow-2xs"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand identity: Electronic Engineering IC Logo & College Title */}
        <div className="flex items-center gap-2.5">
          <FEELogo size={36} />
          <div className="flex flex-col">
            <span className="text-[15px] font-black text-slate-900 tracking-tight leading-tight">
              هندسة منوف
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight">
              كلية الهندسة الإلكترونية
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};


