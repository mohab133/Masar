import { registerPlugin } from '@capacitor/core';

interface MasarDownloaderPlugin {
  download(options: { url: string; fileName: string; mimeType?: string }): Promise<{
    success: boolean;
    fileName: string;
    location: string;
    downloadId: number;
  }>;
  waitForCompletion(options: { downloadId: number }): Promise<{
    success: boolean;
    fileName: string;
    location: string;
    localUri?: string;
  }>;
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

export async function downloadFile(url: string, fileName: string, mimeType = 'application/octet-stream') {
  if (!url) throw new Error('الملف غير متاح حاليًا');
  if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت');

  const resolvedMimeType = inferMimeType(fileName, mimeType);
  const started = await MasarDownloader.download({ url, fileName, mimeType: resolvedMimeType });
  return MasarDownloader.waitForCompletion({ downloadId: started.downloadId });
}
