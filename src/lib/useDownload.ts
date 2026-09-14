import { useCallback, useState } from 'react';
import { downloadFile } from './nativeDownloader';

export function useDownload() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const download = useCallback(async (url: string | null | undefined, fileName: string, mimeType = 'application/octet-stream') => {
    if (!url) {
      setError(true);
      setMessage('الملف غير متاح حاليًا');
      window.setTimeout(() => setMessage(null), 3500);
      return false;
    }
    setLoading(true);
    setError(false);
    setMessage('جاري تحميل الملف…');
    try {
      await downloadFile(url, fileName, mimeType);
      setMessage(`تم تحميل ${fileName} بنجاح إلى مجلد التنزيلات`);
      return true;
    } catch (cause) {
      setError(true);
      setMessage(cause instanceof Error ? cause.message : 'فشل تحميل الملف، حاول مرة أخرى');
      return false;
    } finally {
      setLoading(false);
      window.setTimeout(() => setMessage(null), 3500);
    }
  }, []);

  return { message, error, loading, download };
}
