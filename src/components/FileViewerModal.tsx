import React, { memo, useCallback, useState } from 'react';
import { X, FileText, Download, ExternalLink, Calendar, HardDrive, CheckCircle2, Loader2 } from 'lucide-react';
import { CourseFile } from '../types';
import { BottomSheet } from './BottomSheet';
import { triggerHaptic } from '../utils/haptics';

interface FileViewerModalProps {
  file: CourseFile | null;
  courseName: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = memo(({
  file,
  courseName,
  onClose,
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle');

  const handleSimulateDownload = useCallback(() => {
    if (downloadState !== 'idle') return;
    triggerHaptic('light');
    setDownloadState('downloading');

    setTimeout(() => {
      triggerHaptic('success');
      setDownloadState('completed');
      setTimeout(() => {
        setDownloadState('idle');
      }, 2500);
    }, 900);
  }, [downloadState]);

  return (
    <BottomSheet isOpen={!!file} onClose={onClose} id="file-viewer-bottom-sheet" maxWidthClass="max-w-md">
      {file && (
        <>
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                <FileText size={18} />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-500">{courseName}</span>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-[220px]">
                  {file.title}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </div>

          {/* File Details & Preview Canvas */}
          <div className="p-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center py-7">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-rose-600 mb-3">
                <FileText size={32} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 px-2">{file.title}</h4>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-medium">
                  <HardDrive size={13} />
                  {file.size}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={13} />
                  {file.date}
                </span>
                {file.totalPages && (
                  <>
                    <span>•</span>
                    <span className="font-medium">{file.totalPages} صفحة</span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleSimulateDownload}
                disabled={downloadState === 'downloading'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20 disabled:opacity-80"
              >
                {downloadState === 'downloading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>جاري تنزيل الملف...</span>
                  </>
                ) : downloadState === 'completed' ? (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-200" />
                    <span>تم التنزيل بنجاح</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>تنزيل الملف ({file.size})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSimulateDownload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
              >
                <ExternalLink size={15} />
                <span>فتح ومعاينة في المتصفح</span>
              </button>
            </div>
          </div>
        </>
      )}
    </BottomSheet>
  );
});

FileViewerModal.displayName = 'FileViewerModal';
