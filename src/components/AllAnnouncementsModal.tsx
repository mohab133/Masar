import React, { memo, useEffect, useState } from 'react';
import { X, Bell, Calendar, Tag, ExternalLink, Download } from 'lucide-react';
import { Announcement } from '../types';
import { getDynamicBorderClass } from '../lib/courseIcons';
import { ConfirmModal } from './ConfirmModal';
import { useDownload } from '../lib/useDownload';
import { isAnnouncementNew } from '../lib/announcementUtils';

interface AllAnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export const AllAnnouncementsModal: React.FC<AllAnnouncementsModalProps> = memo(({
  isOpen,
  onClose,
  announcements,
}) => {
  const { download } = useDownload();
  const [isMounted, setIsMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
    } else if (isMounted) {
      const timer = window.setTimeout(() => setIsMounted(false), 220);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'download' | 'link';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'link',
    onConfirm: () => {},
  });

  return (
    <>
      {isMounted && (
        <div
          id="all-announcements-modal"
          data-no-swipe="true"
          className={`overlay-fade fixed inset-0 z-50 w-screen min-h-[100dvh] flex items-center justify-center bg-slate-900/40 p-4 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          dir="rtl"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`modal-card-pop relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.985] opacity-0'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">الإشعارات</h3>
                  <p className="text-xs text-slate-500">أحدث الإشعارات وإعلانات الكلية</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of active announcements */}
            <div className="p-4 overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="min-h-[220px] flex flex-col items-center justify-center text-center px-6 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-4">
                    <Bell size={26} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">لا توجد إشعارات</h4>
                  <p className="text-sm text-slate-500 mt-1.5 leading-6">ستظهر هنا الإشعارات والإعلانات الجديدة عند وصولها</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((ann, idx) => (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-xl border border-slate-200/80 ${getDynamicBorderClass(idx)} bg-white hover:border-blue-200 transition-colors`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          <Tag size={12} />
                          {ann.courseRef || 'عام'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isAnnouncementNew(ann) && (
                            <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              جديد
                            </span>
                          )}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar size={12} />
                            {ann.date}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug break-words text-right" dir="auto">{ann.title || 'تنبيه'}</h4>
                      <p className="text-base text-slate-700 leading-8 break-words text-right" dir="auto">{ann.content}</p>
                      {(ann.linkUrl || ann.attachmentUrl) && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                          {ann.linkUrl && (
                            <button type="button" onClick={() => setConfirmState({
                                isOpen: true,
                                title: 'فتح الرابط',
                                message: 'سيتم فتح الرابط خارج التطبيق. هل تريد المتابعة؟',
                                type: 'link',
                                onConfirm: () => window.open(ann.linkUrl!, '_blank', 'noopener,noreferrer'),
                              })} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold">
                              <ExternalLink size={14} /> عرض الرابط
                            </button>
                          )}
                          {ann.attachmentUrl && (
                            <button
                              type="button"
                              onClick={() => void download(ann.attachmentUrl, ann.attachmentName || 'attachment')}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-xs font-bold smooth-interaction hover:bg-blue-100 hover:border-blue-200 active:scale-[0.98]"
                            >
                              <Download size={15} strokeWidth={2.2} /> تحميل الملف
                            </button>
                          )}
                        </div>
                      )}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end text-xs">
                        <span className="text-slate-500">{ann.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </>
  );
});

AllAnnouncementsModal.displayName = 'AllAnnouncementsModal';
