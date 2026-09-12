import React, { memo } from 'react';
import { X, Bell, Calendar, Tag } from 'lucide-react';
import { Announcement } from '../types';
import { BottomSheet } from './BottomSheet';
import { triggerHaptic } from '../utils/haptics';

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
  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} id="all-announcements-modal" maxWidthClass="max-w-md">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">كل التنبيهات</h3>
            <p className="text-xs text-slate-500">تحديثات المواعيد والمواد والمحاضرات</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
      </div>

      {/* List of active announcements */}
      <div className="p-4 space-y-3 overflow-y-auto max-h-[68vh]">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                <Tag size={12} />
                {ann.categoryNameAr}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar size={12} />
                {ann.date}
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1">{ann.title}</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{ann.content}</p>
            {ann.courseRef && (
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-600">{ann.courseRef}</span>
                <span className="text-slate-500">{ann.timeAgo}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </BottomSheet>
  );
});

AllAnnouncementsModal.displayName = 'AllAnnouncementsModal';
