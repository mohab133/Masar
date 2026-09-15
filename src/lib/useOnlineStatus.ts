import { useEffect, useState } from 'react';

export type ConnectivityBannerState = 'offline' | 'back-online' | 'hidden';

const BACK_ONLINE_DISPLAY_MS = 2500;

function currentlyOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(currentlyOnline);
  const [bannerState, setBannerState] = useState<ConnectivityBannerState>(() => (
    currentlyOnline() ? 'hidden' : 'offline'
  ));

  useEffect(() => {
    let backOnlineTimer: number | undefined;

    const handleOnline = () => {
      window.clearTimeout(backOnlineTimer);
      setIsOnline(true);
      setBannerState('back-online');
      backOnlineTimer = window.setTimeout(() => setBannerState('hidden'), BACK_ONLINE_DISPLAY_MS);
    };

    const handleOffline = () => {
      window.clearTimeout(backOnlineTimer);
      setIsOnline(false);
      setBannerState('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearTimeout(backOnlineTimer);
    };
  }, []);

  return { isOnline, bannerState };
}
