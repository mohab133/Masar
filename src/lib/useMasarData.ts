import { useCallback, useEffect, useRef, useState } from 'react';
import { MasarData, fetchMasarData, getFallbackData } from './masarApi';
import { readCachedMasarData, writeCachedMasarData } from './offlineCache';

type DataSource = 'remote' | 'cache' | 'bundled';

const REFRESH_THROTTLE_MS = 1000 * 60 * 3;
const REQUEST_TIMEOUT_MS = 10000;

export function useMasarData() {
  const cached = readCachedMasarData();
  const [data, setData] = useState<MasarData>(cached?.data || getFallbackData());
  const [isLoading, setIsLoading] = useState(Boolean(import.meta.env.VITE_API_BASE_URL) && !cached);
  const [isOnlineData, setIsOnlineData] = useState(Boolean(cached));
  const [dataSource, setDataSource] = useState<DataSource>(cached ? 'cache' : 'bundled');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(cached?.savedAt || null);

  const lastRefreshAttemptRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async (force = false) => {
    if (!import.meta.env.VITE_API_BASE_URL) {
      setIsOnlineData(false);
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    if (!force && now - lastRefreshAttemptRef.current < REFRESH_THROTTLE_MS) return;
    lastRefreshAttemptRef.current = now;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const nextData = await fetchMasarData(controller.signal);
      if (controller.signal.aborted) return;

      setData(nextData);
      const savedAt = writeCachedMasarData(nextData);
      setLastSyncedAt(savedAt);
      setIsOnlineData(true);
      setDataSource('remote');
    } catch (error) {
      if (controller.signal.aborted) return;

      setIsOnlineData(false);

      const fallback = readCachedMasarData();
      if (fallback) {
        setData(fallback.data);
        setLastSyncedAt(fallback.savedAt);
        setDataSource('cache');
      } else {
        setData(getFallbackData());
        setDataSource('bundled');
      }
      console.warn('Masar API unavailable. Using offline data.', error);
    } finally {
      window.clearTimeout(timeout);
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);

    const handleOnline = () => { void refresh(); };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      requestControllerRef.current?.abort();
    };
  }, [refresh]);

  return { data, isLoading, isOnlineData, dataSource, lastSyncedAt, refresh };
}
