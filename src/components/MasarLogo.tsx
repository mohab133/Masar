import React from 'react';

interface MasarLogoProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full';
}

export const MasarLogo: React.FC<MasarLogoProps> = ({
  size = 40,
  className = '',
  variant = 'mark',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Icon Emblem: A serene, modern academic path & guiding beacon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform active:scale-95 drop-shadow-xs select-none"
      >
        <defs>
          {/* Calm, serene sky & ocean gradient for the app icon tile */}
          <linearGradient id="masar-tile-gradient" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="0.6" stopColor="#2563eb" />
            <stop offset="1" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Gentle inner light sheen */}
          <linearGradient id="masar-sheen" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Path highlight gradient */}
          <linearGradient id="masar-path-accent" x1="10" y1="38" x2="38" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#93c5fd" />
            <stop offset="1" stopColor="#ffffff" />
          </linearGradient>

          {/* Soft ambient glow behind the star */}
          <radialGradient id="masar-star-glow" cx="34" cy="14" r="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Rounded Squircle Tile */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="14"
          fill="url(#masar-tile-gradient)"
          stroke="#93c5fd"
          strokeOpacity="0.3"
          strokeWidth="1"
        />

        {/* Soft top-half ambient sheen */}
        <rect
          x="1"
          y="1"
          width="46"
          height="24"
          rx="14"
          fill="url(#masar-sheen)"
        />

        {/* Guiding star ambient glow */}
        <circle cx="34" cy="14" r="10" fill="url(#masar-star-glow)" />

        {/* Academic Open Book Base Foundation */}
        <path
          d="M 12 34 C 18 32, 21 34.5, 24 36 C 27 34.5, 30 32, 36 34"
          stroke="#ffffff"
          strokeOpacity="0.45"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 24 36 V 39"
          stroke="#ffffff"
          strokeOpacity="0.4"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* The "Masar" (Ascending Learning Path)
            Smoothly curving upward like a student's journey & stylized 'م' flow */}
        <path
          d="M 13 32 C 15 23, 20 22, 22 26 C 24 30, 28 30, 31 23 C 33 18, 33 16, 34 14"
          stroke="url(#masar-path-accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Milestone Station Node on the Path */}
        <circle
          cx="22"
          cy="26"
          r="2.5"
          fill="#ffffff"
          stroke="#2563eb"
          strokeWidth="1.2"
        />

        {/* Guiding North Star / Academic Beacon at the top apex */}
        <path
          d="M 34 8 
             C 34.3 11.2, 35.5 12.8, 39 13.5 
             C 35.5 14.2, 34.3 15.8, 34 19 
             C 33.7 15.8, 32.5 14.2, 29 13.5 
             C 32.5 12.8, 33.7 11.2, 34 8 Z"
          fill="#ffffff"
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
        />
      </svg>

      {/* Optional full text lockup */}
      {variant === 'full' && (
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-black text-slate-900 tracking-normal">
            مَسَارْ
          </span>
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide">
            دليلك الأكاديمي
          </span>
        </div>
      )}
    </div>
  );
};
