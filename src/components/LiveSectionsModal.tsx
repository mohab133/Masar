import React from 'react';
import { X, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { LiveSectionInfo } from '../types';

interface LiveSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveSections: LiveSectionInfo[];
}

export const LiveSectionsModal: React.FC<LiveSectionsModalProps> = ({
  isOpen,
  onClose,
  liveSections,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="live-sections-modal"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">إيه المتاح دلوقتي؟</h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500">السكاشن المنعقدة حالياً أو التي تبدأ قريباً</p>
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

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto">

          {/* Reference Time Tag */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1 font-medium">
            <span>توقيت المتابعة: 12:30 ظهراً</span>
            <span className="text-slate-700">3 سكاشن مجدولة</span>
          </div>

          {/* Live Section Cards */}
          <div className="space-y-3">
            {liveSections.map((item) => {
              const { event, statusTextAr } = item;

              return (
                <div
                  key={event.id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 hover:border-emerald-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {event.course}
                      </span>
                      <span className="text-xs text-slate-500">
                        • سكشن {event.sectionNumber}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-md">
                      {statusTextAr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100">
                    <span dir="ltr" className="font-mono">
                      {event.startTime} - {event.endTime}
                    </span>
                    <span>{event.location}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
