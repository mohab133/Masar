import React from 'react';

interface FEELogoProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full';
}

export const FEELogo: React.FC<FEELogoProps> = ({
  size = 36,
  className = '',
  variant = 'mark',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
      {/* Modern Electronic Engineering Pulse Icon (Silicon Valley / Linear / Tech Style) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 select-none shadow-2xs rounded-xl overflow-hidden"
      >
        <defs>
          <linearGradient id="fee-brand-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* Clean Rounded Squircle Canvas */}
        <rect
          width="44"
          height="44"
          rx="11"
          fill="url(#fee-brand-grad)"
        />

        {/* Microchip Integrated Circuit Body */}
        <rect
          x="11"
          y="11"
          width="22"
          height="22"
          rx="5"
          fill="#1e40af"
          stroke="#60a5fa"
          strokeWidth="1.2"
        />

        {/* Circuit IC Pins - Top */}
        <line x1="16" y1="6" x2="16" y2="11" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="28" y1="6" x2="28" y2="11" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />

        {/* Circuit IC Pins - Bottom */}
        <line x1="16" y1="33" x2="16" y2="38" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="28" y1="33" x2="28" y2="38" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />

        {/* Circuit IC Pins - Left */}
        <line x1="6" y1="16" x2="11" y2="16" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="6" y1="28" x2="11" y2="28" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />

        {/* Circuit IC Pins - Right */}
        <line x1="33" y1="16" x2="38" y2="16" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="33" y1="28" x2="38" y2="28" stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" />

        {/* Electric Energy & Electricity Bolt (⚡) */}
        <path
          d="M 23 13.5 L 16.5 23 H 22 L 20.5 30.5 L 27.5 21 H 22.2 L 23 13.5 Z"
          fill="#ffffff"
        />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col -space-y-0.5">
          <span className="text-base font-black text-slate-900 tracking-tight">
            هندسة منوف
          </span>
          <span className="text-[11px] font-semibold text-blue-600">
            FEE Portal
          </span>
        </div>
      )}
    </div>
  );
};

