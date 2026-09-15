import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { Calendar, MapPin, Clock, Info, X } from 'lucide-react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { getArabicCourseName, getCourseIconMeta, formatDeadline } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';
import { useDownload } from '../lib/useDownload';
import { DownloadButton } from './DownloadButton';

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
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-xl smooth-interaction cursor-pointer shadow-2xs shrink-0"
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
  const { download } = useDownload();
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<AcademicEvent | null>(null);
  const [displayedEvent, setDisplayedEvent] = useState<AcademicEvent | null>(null);
  const [isDetailsMounted, setIsDetailsMounted] = useState(false);

  useEffect(() => {
    if (selectedEventForDetails) {
      setDisplayedEvent(selectedEventForDetails);
      setIsDetailsMounted(true);
    } else if (isDetailsMounted) {
      const timer = window.setTimeout(() => {
        setIsDetailsMounted(false);
        setDisplayedEvent(null);
      }, 160);
      return () => window.clearTimeout(timer);
    }
  }, [selectedEventForDetails, isDetailsMounted]);


  const midtermDoc = useMemo(() => officialSchedules.find((d) => d.type === 'midterm'), [officialSchedules]);
  const finalDoc = useMemo(() => officialSchedules.find((d) => d.type === 'final'), [officialSchedules]);

  const handleOpenDoc = useCallback(async (doc: OfficialScheduleDocument) => {
    const mimeType = doc.type === 'lectures_sections' ? 'image/jpeg' : 'application/pdf';
    await download(doc.fileUrl, doc.downloadFileName || 'exam-schedule.pdf', mimeType);
  }, [download]);

  const sortedEvents = useMemo(() => {
    return [...(events || [])].filter((event) => event.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil);
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
          className={`flex-1 py-2 text-sm font-bold rounded-xl smooth-interaction relative ${
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
          className={`flex-1 py-2 text-sm font-bold rounded-xl smooth-interaction relative ${
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
          className={`flex-1 py-2 text-sm font-bold rounded-xl smooth-interaction relative ${
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
          {/* Midterm Schedule Card: يظهر فقط بعد نشر الجدول */}
          {midtermDoc?.fileUrl && (
            <div className="bg-white border border-slate-200/90 border-r-4 border-r-amber-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900">جدول الميدتيرم</span>
                  {midtermDoc.approvedDate && <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/70">{midtermDoc.approvedDate}</span>}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">مواعيد وقاعات الامتحانات الرسمية المعتمدة</p>
              </div>
              <DownloadButton available onClick={() => void handleOpenDoc(midtermDoc)} label="تحميل جدول الميدتيرم" />
            </div>
          )}

          {/* Final Schedule Card: يظهر فقط بعد نشر الجدول */}
          {finalDoc?.fileUrl && (
            <div className="bg-white border border-slate-200/90 border-r-4 border-r-purple-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900">جدول الفاينال</span>
                  {finalDoc.approvedDate && <span className="text-xs bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200/70">{finalDoc.approvedDate}</span>}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">مواعيد وقاعات الامتحانات الرسمية المعتمدة</p>
              </div>
              <DownloadButton available onClick={() => void handleOpenDoc(finalDoc)} label="تحميل جدول الفاينال" />
            </div>
          )}

          {filteredEvents.length === 0 && !midtermDoc?.fileUrl && !finalDoc?.fileUrl && (
            <EmptyState
              icon="calendar"
              title="لا توجد جداول امتحانات حاليًا"
              description="ستظهر جداول الميدتيرم والفاينال هنا فور نشرها"
            />
          )}
        </div>
      )}

      {/* Task Details Modal */}
      
        {isDetailsMounted && (
          <div
            className={`overlay-fade fixed inset-0 z-50 w-screen min-h-[100dvh] bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4 ${selectedEventForDetails ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setSelectedEventForDetails(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`modal-card-pop bg-white border border-slate-200/80 rounded-[1.75rem] max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl overflow-hidden ${selectedEventForDetails ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-[0.98] opacity-0'}`}
              dir="rtl"
            >
              <div className="relative flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-3 min-w-0">
                  {displayedEvent && (() => {
                    const meta = getCourseIconMeta(displayedEvent.course);
                    const Icon = meta.Icon;
                    return (
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}>
                        <Icon size={18} />
                      </div>
                    );
                  })()}
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-lg font-black text-slate-950 leading-tight break-words">
                      {displayedEvent && getArabicCourseName(displayedEvent.course)}
                    </h3>
                    <span className="inline-flex mt-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2 py-0.5 font-bold">
                      {displayedEvent?.typeLabelAr}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEventForDetails(null)}
                  aria-label="إغلاق التفاصيل"
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 font-bold block">تفاصيل الموعد</span>
                  <h4 className="text-xl font-black text-slate-950 leading-snug break-words">
                    {displayedEvent?.eventName}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
                  {displayedEvent?.location && (
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                      <MapPin size={17} className="text-rose-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500 font-bold">المكان</p>
                        <p className="font-bold text-slate-900 mt-0.5 break-words">{displayedEvent.location}</p>
                      </div>
                    </div>
                  )}
                  {displayedEvent?.time && (
                    <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                      <Clock size={16} className="text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 font-bold">الوقت</p>
                        <p className="font-bold text-slate-900 mt-0.5">{displayedEvent.time}</p>
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
