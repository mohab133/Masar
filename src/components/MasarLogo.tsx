import React, { memo } from 'react';

interface MasarLogoProps {
  size?: number;
  className?: string;
  variant?: 'mark' | 'full';
}

export const MasarLogo: React.FC<MasarLogoProps> = memo(({
  size = 40,
  className = '',
  variant = 'mark',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/masar-logo.png"
        width={size}
        height={size}
        alt="Masar"
        className="shrink-0 object-contain select-none"
        draggable={false}
      />
      {variant === 'full' && (
        <div className="flex flex-col -space-y-1">
          <span className="text-xl font-black text-slate-900 tracking-normal">
            مَسَارْ
          </span>
          <span className="text-xs font-semibold text-slate-400 tracking-wide">
            دليلك الأكاديمي
          </span>
        </div>
      )}
    </div>
  );
});

MasarLogo.displayName = 'MasarLogo';
