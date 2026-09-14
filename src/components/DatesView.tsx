import React, { useState, useMemo, useCallback, memo } from 'react';
import { Download, Calendar, MapPin, Clock, Info, X } from 'lucide-react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { OfficialScheduleModal } from './OfficialScheduleModal';
import { ConfirmModal } from './ConfirmModal';
import { getArabicCourseName, getCourseIconMeta, formatDeadline } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';

interface DatesViewProps {
  events: AcademicEvent[];
  officialSchedules: OfficialScheduleDocument[];
}

type FilterCategory = 'assignments' | 'quizzes' | 'exam_schedules';

interface AcademicEventCardProps {
  item: AcademicEvent;
  onOpenDetails: (item: AcademicEvent) => void;
}

const AcademicEventCard: React.FC<AcademicEventCardProps> = memo(({ item, onOpenDetails }) => {
  const meta = getCourseIconMeta(item.course);
  const Icon = meta.Icon;

  return (
    <div
      className={`bg-white border border-slate-200/90 ${meta.borderRightClass} rounded-2xl p-4 hover:border-blue-300 transition-colors shadow-2xs space-y-3`}
    >
      {/* Header: Course Logo Icon + Arabic Course Name & Remaining Time Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}>
            <Icon size={18} />
          </div>
          <span className="text-xs font-bold text-slate-800 break-words" dir="auto">
            {getArabicCourseName(item.course)}
          </span>
        </div>

        <span
          className={`shrink-0 text-xs px-2.5 py-1 rounded-xl border font-bold ${meta.badgeClass}`}
        >
          {item.remainingTimeAr}
        </span>
      </div>

      {/* Event Name */}
      <h3 className="text-base font-bold text-slate-900 leading-snug break-words text-right" dir="auto">
        {item.eventName}
      </h3>

      {/* Footer: Date / Time + "اعرف المزيد" Button on same line */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium min-w-0 flex-1 truncate">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span className="truncate">{formatDeadline(item.date, item.displayDateAr)}</span>
          {item.time && (
            <span className="inline-flex items-center gap-1 shrink-0">
              • <Clock size={13} className="text-slate-400" />
              {item.time}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-xl transition-all cursor-pointer shadow-2xs shrink-0"
        >
          <Info size={13} />
          <span>اعرف المزيد</span>
        </button>
      </div>
    </div>
  );
});

AcademicEventCard.displayName = 'AcademicEventCard';

export const DatesView: React.FC<DatesViewProps> = memo(({ events, officialSchedules }) => {
  const [filter, setFilter] = useState<FilterCategory>('assignments');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OfficialScheduleDocument | null>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<AcademicEvent | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const midtermDoc = useMemo(() => officialSchedules.find((d) => d.type === 'midterm'), [officialSchedules]);
  const finalDoc = useMemo(() => officialSchedules.find((d) => d.type === 'final'), [officialSchedules]);

  const handleOpenDoc = useCallback((doc: OfficialScheduleDocument) => {
    setConfirmModalState({
      isOpen: true,
      title: 'تحميل جدول الامتحانات',
      message: `هل تريد عرض وتحميل ${doc.title}؟`,
      onConfirm: () => {
        setSelectedDoc(doc);
        setIsDocModalOpen(true);
      },
    });
  }, []);

  const sortedEvents = useMemo(() => {
    return [...(events || [])].sort((a, b) => a.daysUntil - b.daysUntil);
  }, [events]);

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((ev) => {
      if (filter === 'assignments') {
        return ['assignment', 'submission', 'project'].includes(ev.type);
      }
      if (filter === 'quizzes') {
        return ['quiz', 'lab'].includes(ev.type);
      }
      if (filter === 'exam_schedules') {
        return ['midterm', 'final'].includes(ev.type);
      }
      return false;
    });
  }, [sortedEvents, filter]);

  return (
    <div id="dates-screen-view" className="space-y-4 pb-24 pt-1" dir="rtl">
      {/* Filter Tabs: تسليمات | كويزات | جداول الامتحانات */}
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl relative select-none"
      >
        <button
          type="button"
          onClick={() => setFilter('assignments')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative ${
            filter === 'assignments'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'assignments' && (
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
            />
          )}
          <span className="relative z-10">تسليمات</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('quizzes')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative ${
            filter === 'quizzes'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'quizzes' && (
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
            />
          )}
          <span className="relative z-10">كويزات</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('exam_schedules')}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative ${
            filter === 'exam_schedules'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'exam_schedules' && (
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
            />
          )}
          <span className="relative z-10">جداول الامتحانات</span>
        </button>
      </div>

      {/* Main Content: Tasks List when on Assignments / Quizzes */}
      {filter !== 'exam_schedules' && (
        <div className="space-y-3">
          {filteredEvents.map((item) => (
            <AcademicEventCard
              key={item.id}
              item={item}
              onOpenDetails={setSelectedEventForDetails}
            />
          ))}

          {filteredEvents.length === 0 && (
            <EmptyState
              icon="tasks"
              title={filter === 'assignments' ? 'لا توجد تسليمات حاليًا' : 'لا توجد كويزات أو تقييمات حاليًا'}
              description="ستظهر المواعيد هنا فور نشرها"
            />
          )}
        </div>
      )}

      {/* Exam Schedules Tab (جداول الامتحانات) */}
      {filter === 'exam_schedules' && (
        <div className="space-y-3 pt-1">
          {filteredEvents.length > 0 && (
            <div className="space-y-3">
              {filteredEvents.map((item) => (
                <AcademicEventCard
                  key={item.id}
                  item={item}
                  onOpenDetails={setSelectedEventForDetails}
                />
              ))}
            </div>
          )}
          {/* Midterm Schedule Card */}
          <div className="bg-white border border-slate-200/90 border-r-4 border-r-amber-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-900">جدول الميدتيرم</span>
                {midtermDoc?.fileUrl && midtermDoc.approvedDate && <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/70">{midtermDoc.approvedDate}</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{midtermDoc?.fileUrl ? 'مواعيد وقاعات الامتحانات الرسمية المعتمدة' : 'لم يتم نشر جدول الميدتيرم بعد'}</p>
            </div>
            <button type="button" onClick={() => midtermDoc?.fileUrl && handleOpenDoc(midtermDoc)} disabled={!midtermDoc?.fileUrl}
              className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center shadow-2xs ${midtermDoc?.fileUrl ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80 cursor-pointer' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
              aria-label="تحميل جدول الميدتيرم" title={midtermDoc?.fileUrl ? 'تحميل جدول الميدتيرم' : 'جدول الميدتيرم غير منشور'}><Download size={18} /></button>
          </div>

          {/* Final Schedule Card */}
          <div className="bg-white border border-slate-200/90 border-r-4 border-r-purple-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base font-bold text-slate-900">جدول الفاينال</span>
                {finalDoc?.fileUrl && finalDoc.approvedDate && <span className="text-xs bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200/70">{finalDoc.approvedDate}</span>}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{finalDoc?.fileUrl ? 'مواعيد وقاعات الامتحانات الرسمية المعتمدة' : 'لم يتم نشر جدول الفاينال بعد'}</p>
            </div>
            <button type="button" onClick={() => finalDoc?.fileUrl && handleOpenDoc(finalDoc)} disabled={!finalDoc?.fileUrl}
              className={`p-2.5 rounded-xl border transition-all shrink-0 flex items-center justify-center shadow-2xs ${finalDoc?.fileUrl ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200/80 cursor-pointer' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'}`}
              aria-label="تحميل جدول الفاينال" title={finalDoc?.fileUrl ? 'تحميل جدول الفاينال' : 'جدول الفاينال غير منشور'}><Download size={18} /></button>
          </div>
        </div>
      )}

      {/* Official Schedule Sheet Modal */}
      <OfficialScheduleModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
      />

      {/* Download Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        type="download"
        onConfirm={confirmModalState.onConfirm}
        onClose={() =>
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {/* Task Details Modal */}
      
        {selectedEventForDetails && (
          <div
            className="fixed inset-0 z-50 w-screen min-h-[100dvh] bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4"
            onClick={() => setSelectedEventForDetails(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl overflow-hidden"
              dir="rtl"
            >
              <div className="relative flex items-center justify-between border-b border-slate-100 pb-3 pl-10">
                <div className="flex items-center gap-2.5">
                  {(() => {
                    const meta = getCourseIconMeta(selectedEventForDetails.course);
                    const Icon = meta.Icon;
                    return (
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-700 border border-slate-200">
                        <Icon size={18} />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {getArabicCourseName(selectedEventForDetails.course)}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {selectedEventForDetails.typeLabelAr}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEventForDetails(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-xs text-blue-600 font-semibold block mb-1">تفاصيل التكليف والمعلومات</span>
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {selectedEventForDetails.eventName}
                  </h4>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 text-xs sm:text-sm">
                  {selectedEventForDetails.location && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 font-semibold">المكان</p>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedEventForDetails.location}</p>
                      </div>
                    </div>
                  )}
                  {selectedEventForDetails.time && (
                    <div className="flex items-start gap-2">
                      <Clock size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-slate-500 font-semibold">الوقت</p>
                        <p className="font-bold text-slate-900 mt-0.5">{selectedEventForDetails.time}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      
    </div>
  );
});

DatesView.displayName = 'DatesView';
