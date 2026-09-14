import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, MasarData, fetchMasarData, getFallbackData } from './masarApi';
import { readCachedMasarData, writeCachedMasarData } from './offlineCache';

type DataSource = 'remote' | 'cache' | 'bundled';

const REFRESH_THROTTLE_MS = 1000 * 60 * 3;
const REQUEST_TIMEOUT_MS = 10000;
const INITIAL_RETRIES = 3;

export function useMasarData() {
  const cached = readCachedMasarData();
  const [data, setData] = useState<MasarData>(cached?.data || getFallbackData());
  const [isLoading, setIsLoading] = useState(Boolean(API_BASE_URL) && !cached);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnlineData, setIsOnlineData] = useState(Boolean(cached));
  const [dataSource, setDataSource] = useState<DataSource>(cached ? 'cache' : 'bundled');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(cached?.savedAt || null);

  const lastRefreshAttemptRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef(!cached);

  const refresh = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastRefreshAttemptRef.current < REFRESH_THROTTLE_MS) return false;
    lastRefreshAttemptRef.current = now;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const attemptCount = isInitialLoadRef.current ? INITIAL_RETRIES : 1;
    setIsRefreshing(true);
    setError(null);

    try {
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= attemptCount; attempt += 1) {
        try {
          const nextData = await fetchMasarData(controller.signal);
          if (controller.signal.aborted) return false;

          setData(nextData);
          const savedAt = writeCachedMasarData(nextData);
          setLastSyncedAt(savedAt);
          setIsOnlineData(true);
          setDataSource('remote');
          setError(null);
          return true;
        } catch (requestError) {
          lastError = requestError;
          if (controller.signal.aborted || attempt === attemptCount) break;
          await new Promise((resolve) => window.setTimeout(resolve, 700 * attempt));
        }
      }

      if (controller.signal.aborted) return false;

      setIsOnlineData(false);
      const fallback = readCachedMasarData();
      if (fallback) {
        setData(fallback.data);
        setLastSyncedAt(fallback.savedAt);
        setDataSource('cache');
        setError(null);
      } else {
        // Do not silently turn an API failure into an apparently empty app.
        // Keep the UI in a clear retry state until data can be loaded.
        setData(getFallbackData());
        setDataSource('bundled');
        setError('تعذر تحميل بيانات التطبيق الآن.');
      }
      console.warn('Masar API unavailable. Using offline data when available.', lastError);
      return false;
    } finally {
      window.clearTimeout(timeout);
      if (requestControllerRef.current === controller) requestControllerRef.current = null;
      isInitialLoadRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
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

  return { data, isLoading, isRefreshing, error, isOnlineData, dataSource, lastSyncedAt, refresh };
}
