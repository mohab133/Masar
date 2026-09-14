import { PluginListenerHandle, registerPlugin } from '@capacitor/core';

interface DownloadStarted {
  success: boolean;
  fileName: string;
  location: string;
  downloadId: number;
}

export interface DownloadFinished {
  success: boolean;
  fileName: string;
  location: string;
  localUri?: string;
  error?: string;
}

interface MasarDownloaderPlugin {
  download(options: { url: string; fileName: string; mimeType?: string }): Promise<DownloadStarted>;
  addListener(
    eventName: 'downloadComplete',
    listenerFunc: (result: DownloadFinished & { downloadId: number }) => void,
  ): Promise<PluginListenerHandle>;
}

const MasarDownloader = registerPlugin<MasarDownloaderPlugin>('MasarDownloader');

function inferMimeType(fileName: string, fallback: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
    txt: 'text/plain', csv: 'text/csv',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip', rar: 'application/vnd.rar',
  };
  return mimeTypes[extension || ''] || fallback;
}

export async function downloadFile(
  url: string,
  fileName: string,
  mimeType = 'application/octet-stream',
  onStarted?: (fileName: string) => void,
  onFinished?: (result: DownloadFinished) => void,
) {
  if (!url) throw new Error('الملف غير متاح حاليًا');
  if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');

  let listener: PluginListenerHandle | undefined;
  let startedId: number | undefined;
  let cleanupTimer: number | undefined;
  let cleanedUp = false;

  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    if (cleanupTimer) window.clearTimeout(cleanupTimer);
    void listener?.remove();
  };

  try {
    // Register before enqueueing so even very small files cannot finish before the listener exists.
    listener = await MasarDownloader.addListener('downloadComplete', (result) => {
      if (startedId === undefined || result.downloadId !== startedId) return;
      onFinished?.(result);
      cleanup();
    });

    const resolvedMimeType = inferMimeType(fileName, mimeType);
    const started = await MasarDownloader.download({
      url,
      fileName,
      mimeType: resolvedMimeType,
    });

    startedId = started.downloadId;
    onStarted?.(started.fileName || fileName);
    cleanupTimer = window.setTimeout(cleanup, 60 * 60 * 1000);

    return { ...started, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
