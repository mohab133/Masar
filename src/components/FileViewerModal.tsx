import React from 'react';
import { X, FileText, Download, ExternalLink, Calendar, HardDrive, CheckCircle2 } from 'lucide-react';
import { CourseFile } from '../types';

interface FileViewerModalProps {
  file: CourseFile | null;
  courseName: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  courseName,
  onClose,
}) => {
  const [downloaded, setDownloaded] = React.useState(false);

  if (!file) return null;

  const handleSimulateDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div
      id="file-viewer-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500">{courseName}</span>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-[240px]">
                {file.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* File Details & Preview Canvas */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-center text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-rose-600 mb-3">
              <FileText size={32} />
            </div>
            <h4 className="text-xs font-bold text-slate-900 mb-1">{file.title}</h4>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <HardDrive size={12} />
                {file.size}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {file.date}
              </span>
              {file.totalPages && (
                <>
                  <span>•</span>
                  <span>{file.totalPages} صفحة</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSimulateDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-xs"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 size={15} className="text-emerald-200" />
                  <span>تم التنزيل بنجاح</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>تنزيل الملف ({file.size})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateDownload}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors"
            >
              <ExternalLink size={14} />
              <span>فتح الملف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
