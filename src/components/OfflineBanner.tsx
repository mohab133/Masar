import React, { memo } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../lib/useOnlineStatus';

export const OfflineBanner: React.FC = memo(() => {
  const { bannerState } = useOnlineStatus();
  if (bannerState === 'hidden') return null;

  const isOffline = bannerState === 'offline';

  return (
    <div
      id="connectivity-banner"
      role="status"
      aria-live="polite"
      dir="rtl"
      className={`-mx-4.5 mb-3 flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold smooth-interaction ${
        isOffline ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'
      }`}
    >
      {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
      {isOffline ? 'لا يوجد اتصال بالإنترنت' : 'تم الاتصال بالإنترنت'}
    </div>
  );
});

OfflineBanner.displayName = 'OfflineBanner';
