import React, { memo, useState } from 'react';
import { X, Download, FileImage, CheckCircle2 } from 'lucide-react';
import { OfficialScheduleDocument } from '../types';

interface OfficialScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficialScheduleDocument | null;
}

export const OfficialScheduleModal: React.FC<OfficialScheduleModalProps> = memo(({ isOpen, onClose, document }) => {
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen || !document) return null;

  const download = () => {
    if (!document.fileUrl) return;
    window.open(document.fileUrl, '_blank', 'noopener,noreferrer');
    setIsDownloaded(true);
    window.setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <>
      <div
        id="official-schedule-modal-overlay"
        data-no-swipe="true"
        className="fixed inset-0 z-50 w-screen min-h-[100dvh] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-3"
        dir="rtl"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="relative p-4 pr-4 pl-12 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileImage size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 break-words">{document.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{document.term} • {document.academicYear}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200" aria-label="إغلاق">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 bg-slate-100/80 overflow-auto flex-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
                  <FileImage size={21} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 break-words">{document.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {document.description || 'المستند الرسمي المنشور في مسار.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-slate-400">النوع</p><p className="font-bold text-slate-800 mt-1">{document.typeLabelAr}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-slate-400">العام الدراسي</p><p className="font-bold text-slate-800 mt-1">{document.academicYear}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-slate-400">الفصل الدراسي</p><p className="font-bold text-slate-800 mt-1">{document.term}</p></div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><p className="text-slate-400">تاريخ الاعتماد</p><p className="font-bold text-slate-800 mt-1">{document.approvedDate}</p></div>
              </div>

              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 leading-relaxed">
                لا توجد أي بيانات جدول أو أسماء مواد ثابتة داخل التطبيق. المستند المعروض هنا يعتمد على البيانات المنشورة من قاعدة البيانات.
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>{document.approvedDate}</span>
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
            >
              {isDownloaded ? <CheckCircle2 size={16} /> : <Download size={16} />}
              {isDownloaded ? 'تم الفتح' : 'فتح الجدول'}
            </button>
          </div>
        </div>
      </div>

    </>
  );
});

OfficialScheduleModal.displayName = 'OfficialScheduleModal';
