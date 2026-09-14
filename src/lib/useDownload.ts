import { useCallback, useEffect, useRef, useState } from 'react';
import { downloadFile } from './nativeDownloader';

export function useDownload() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const completionCleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    completionCleanup.current?.();
  }, []);

  const download = useCallback(async (url: string | null | undefined, fileName: string, mimeType = 'application/octet-stream') => {
    if (!url) {
      setError(true);
      setMessage('الملف غير متاح حاليًا');
      window.setTimeout(() => setMessage(null), 3500);
      return false;
    }
    setLoading(true);
    setError(false);
    setMessage('تم بدء تحميل الملف');
    completionCleanup.current?.();
    completionCleanup.current = null;
    try {
      let finished = false;
      let finishTimer: number | undefined;

      const started = await downloadFile(
        url,
        fileName,
        mimeType,
        (startedFileName) => {
          setMessage(`تم بدء تحميل ${startedFileName}`);
        },
        (result) => {
          finished = true;
          if (finishTimer) window.clearTimeout(finishTimer);
          setLoading(false);
          if (result.success) {
            setError(false);
            setMessage(`تم تحميل ${result.fileName || fileName} بنجاح`);
          } else {
            setError(true);
            setMessage(result.error || 'فشل تحميل الملف، حاول مرة أخرى');
          }
          window.setTimeout(() => setMessage(null), 3500);
        },
      );

      // download() resolving only means Android accepted the job. Do not wait for the file.
      completionCleanup.current = started.cleanup;
      finishTimer = window.setTimeout(() => {
        if (!finished) {
          setLoading(false);
          setMessage(null);
        }
      }, 30 * 60 * 1000);

      return true;
    } catch (cause) {
      setLoading(false);
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'تعذر بدء تحميل الملف، حاول مرة أخرى');
      window.setTimeout(() => setMessage(null), 3500);
      return false;
    }
  }, []);

  return { message, error, loading, download };
}
