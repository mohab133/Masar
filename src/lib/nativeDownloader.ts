import { registerPlugin } from '@capacitor/core';

interface MasarDownloaderPlugin {
  download(options: { url: string; fileName: string; mimeType?: string }): Promise<{
    success: boolean;
    fileName: string;
    location: string;
  }>;
}

const MasarDownloader = registerPlugin<MasarDownloaderPlugin>('MasarDownloader');

export async function downloadFile(url: string, fileName: string, mimeType = 'application/octet-stream') {
  if (!url) throw new Error('الملف غير متاح حاليًا');
  if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');

  return MasarDownloader.download({ url, fileName, mimeType });
}
