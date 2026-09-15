import { useCallback, useSyncExternalStore } from 'react';
import { downloadFile } from './nativeDownloader';
import { sanitizeHttpUrl } from './safeUrl';

interface DownloadState {
  message: string | null;
  error: boolean;
  loading: boolean;
}

const INITIAL_STATE: DownloadState = { message: null, error: false, loading: false };
let state: DownloadState = INITIAL_STATE;
let clearTimer: number | undefined;
let completionCleanup: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(next: DownloadState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function scheduleClear(delay = 3500) {
  if (clearTimer) window.clearTimeout(clearTimer);
  clearTimer = window.setTimeout(() => {
    clearTimer = undefined;
    emit({ message: null, error: false, loading: false });
  }, delay);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useDownload() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const download = useCallback(async (url: string | null | undefined, fileName: string, mimeType = 'application/octet-stream') => {
    const safeUrl = sanitizeHttpUrl(url);
    if (!safeUrl) {
      emit({ message: 'الملف غير متاح حاليًا', error: true, loading: false });
      scheduleClear();
      return false;
    }

    if (clearTimer) window.clearTimeout(clearTimer);
    completionCleanup?.();
    completionCleanup = null;
    emit({ message: 'جاري تحميل الملف...', error: false, loading: true });

    try {
      let finished = false;
      let finishTimer: number | undefined;

      const started = await downloadFile(
        safeUrl,
        fileName,
        mimeType,
        (startedFileName) => {
          emit({ message: `جاري تحميل ${startedFileName}`, error: false, loading: true });
        },
        (result) => {
          finished = true;
          if (finishTimer) window.clearTimeout(finishTimer);
          if (result.success) {
            emit({ message: `تم تحميل ${result.fileName || fileName} بنجاح`, error: false, loading: false });
          } else {
            emit({ message: result.error || 'فشل تحميل الملف، حاول مرة أخرى', error: true, loading: false });
          }
          scheduleClear();
          completionCleanup = null;
        },
      );

      completionCleanup = started.cleanup;
      finishTimer = window.setTimeout(() => {
        if (!finished) {
          emit({ message: 'جاري التحميل في الخلفية...', error: false, loading: true });
        }
      }, 30 * 60 * 1000);

      return true;
    } catch (cause) {
      emit({
        message: cause instanceof Error ? cause.message : 'تعذر بدء تحميل الملف، حاول مرة أخرى',
        error: true,
        loading: false,
      });
      scheduleClear();
      return false;
    }
  }, []);

  return { ...snapshot, download };
}
