import type { MasarData } from './masarApi';
import { validateMasarData } from './apiValidation';

const CACHE_KEY = 'masar_data_cache_v2';
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

interface CachedMasarData {
  savedAt: number;
  data: MasarData;
}

export function readCachedMasarData(): { data: MasarData; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<CachedMasarData>;
    if (!candidate.data || typeof candidate.savedAt !== 'number' || !Number.isFinite(candidate.savedAt)) return null;
    if (Date.now() - candidate.savedAt > CACHE_MAX_AGE_MS) return null;

    const data = validateMasarData(candidate.data);
    if (!data) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return { data, savedAt: candidate.savedAt };
  } catch {
    return null;
  }
}

export function writeCachedMasarData(data: MasarData): number {
  const savedAt = Date.now();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt, data } satisfies CachedMasarData));
  } catch {
    // Storage can be unavailable or full. The app still works with in-memory data.
  }
  return savedAt;
}
