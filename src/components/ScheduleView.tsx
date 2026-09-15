import React, { useState, useMemo, useCallback, memo } from 'react';
import { MapPin, Clock, FileImage, Filter } from 'lucide-react';
import { ScheduleEvent, ScheduleType, OfficialScheduleDocument } from '../types';
import { getArabicCourseName, getCourseIconMeta } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';
import { DownloadToast } from './DownloadToast';
import { useDownload } from '../lib/useDownload';
import { DownloadButton } from './DownloadButton';

interface ScheduleViewProps {
  scheduleEvents: ScheduleEvent[];
  officialSchedules: OfficialScheduleDocument[];
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
];

interface ScheduleEventCardProps {
  item: ScheduleEvent;
}

const ScheduleEventCard: React.FC<ScheduleEventCardProps> = memo(({ item }) => {
  const meta = getCourseIconMeta(`${item.course} ${item.courseCode ?? ''}`);
  const Icon = meta.Icon;
  const typeText = item.type === 'lecture' ? 'محاضرة' : item.sectionNumber ? `سكشن ${item.sectionNumber}` : 'سكشن';

  return (
    <div
      className={`bg-white border border-slate-200/90 ${meta.borderRightClass} rounded-2xl p-3 hover:border-blue-300 smooth-interaction shadow-2xs`}
    >
      {/* Card Header: Subject Icon Logo + Course Name & Type Badge */}
      <div className="flex items-center justify-between gap-2.5 mb-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}>
            <Icon size={17} />
          </div>
          <h3 className="text-sm font-bold text-slate-900 leading-snug break-words text-right min-w-0 flex-1" dir="auto">
            {getArabicCourseName(item.course)}
          </h3>
        </div>

        {typeText && typeText.trim() !== '' && (
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-xl border shrink-0 ${
              item.type === 'lecture'
                ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                : 'bg-teal-50 text-teal-800 border-teal-200/80'
            }`}
          >
            {typeText}
            {item.sectionNumber && !typeText.includes(`سكشن ${item.sectionNumber}`) ? ` • سكشن ${item.sectionNumber}` : ''}
          </span>
        )}
      </div>

      {/* Card Body: Time, Location */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-slate-700 font-medium">
          <Clock size={14} className="text-blue-600 shrink-0" />
          <span className="font-semibold">
            {item.startTime} - {item.endTime}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-slate-800 font-bold">
          <MapPin size={14} className="text-rose-500 shrink-0" />
          <span>{item.location}</span>
        </div>
      </div>

      {/* Important Notes / Tips */}
      {item.notes && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50/70 px-3 py-2 rounded-xl">
          <span className="font-semibold">{item.notes}</span>
        </div>
      )}
    </div>
  );
});

ScheduleEventCard.displayName = 'ScheduleEventCard';

export const ScheduleView: React.FC<ScheduleViewProps> = memo(({
  scheduleEvents,
  officialSchedules,
}) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType>('lecture');
  const [selectedDay, setSelectedDay] = useState<number>(0);

  // Student's chosen section
  const { message: downloadMessage, error: downloadError, loading: downloadLoading, download } = useDownload();

  const handleOfficialDownload = useCallback(async (doc: OfficialScheduleDocument) => {
    await download(doc.fileUrl, doc.downloadFileName || 'official-schedule.jpg', 'image/jpeg');
  }, [download]);

  const [selectedSection, setSelectedSection] = useState<string>(() => {
    try {
      return localStorage.getItem('masar_user_section') || 'all';
    } catch {
      return 'all';
    }
  });

  const handleSectionChange = useCallback((sec: string) => {
    setSelectedSection(sec);
    try {
      localStorage.setItem('masar_user_section', sec);
    } catch {
      // ignore
    }
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return (scheduleEvents || []).filter((ev) => {
      if (ev.type !== scheduleType || ev.dayOfWeek !== selectedDay) return false;
      if (scheduleType === 'section' && selectedSection !== 'all') {
        return ev.sectionNumber === Number(selectedSection);
      }
      return true;
    });
  }, [scheduleEvents, scheduleType, selectedDay, selectedSection]);

  return (
    <div id="schedule-screen-view" className="space-y-4 pb-24 pt-1" dir="rtl">
      <DownloadToast message={downloadMessage} error={downloadError} loading={downloadLoading} />

      {/* Schedule Image Button */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/80">
            <FileImage size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              صورة الجدول الأسبوعي الرسمي
            </span>
            <span className="text-[11px] text-slate-500 font-medium block">
              جدول المحاضرات والسكاشن المعتمد
            </span>
          </div>
        </div>

        {(() => {
          const doc = officialSchedules.find((item) => item.type === 'lectures_sections' && item.fileUrl);
          return doc ? (
            <DownloadButton available={Boolean(doc.fileUrl)} onClick={() => void handleOfficialDownload(doc)} label="تحميل الجدول الرسمي" />
          ) : (
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">غير متاح حاليًا</span>
          );
        })()}
      </div>

      {/* Segmented Control: المحاضرات | السكاشن */}
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="p-1.5 bg-slate-200/80 rounded-2xl flex items-center relative select-none"
      >
        <button
          type="button"
          id="schedule-tab-lectures"
          onClick={() => setScheduleType('lecture')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl smooth-interaction relative z-10 ${
            scheduleType === 'lecture'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'lecture' && (
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
            />
          )}
          <span className="relative z-10">المحاضرات</span>
        </button>

        <button
          type="button"
          id="schedule-tab-sections"
          onClick={() => setScheduleType('section')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl smooth-interaction relative z-10 ${
            scheduleType === 'section'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'section' && (
            <div
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
            />
          )}
          <span className="relative z-10">السكاشن</span>
        </button>
      </div>

      {/* Section Filter (يظهر فقط في تبويب السكاشن لاختيار سكشن الطالب مثل ٣) */}
      
        {scheduleType === 'section' && (
          <div
            className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5 overflow-hidden shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Filter size={15} className="text-blue-600" />
                <span>اختر السكشن:</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSectionChange('all')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold smooth-interaction ${
                  selectedSection === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              {[1, 2, 3, 4].map((secNum) => {
                const isSelected = selectedSection === String(secNum);
                return (
                  <button
                    key={secNum}
                    type="button"
                    onClick={() => handleSectionChange(String(secNum))}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold smooth-interaction ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    سكشن {secNum}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      

      {/* Days Selector - Smooth interactive pills */}
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 select-none"
      >
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day.id;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDay(day.id)}
              className={`flex-1 py-2 px-1 rounded-xl text-center text-xs smooth-interaction relative ${
                isSelected
                  ? 'text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 font-bold'
              }`}
            >
              {isSelected && (
                <div
                  className="absolute inset-0 bg-blue-600 rounded-xl"
                />
              )}
              <span className="relative z-10">{day.label}</span>
            </button>
          );
        })}
      </div>

      {/* Events List for Selected Day and Type with smooth animated switch */}
      
        <div
          key={`${scheduleType}-${selectedDay}-${selectedSection}`}
          className="space-y-3 pt-1"
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item) => (
              <ScheduleEventCard key={item.id} item={item} />
            ))
          ) : (
            <EmptyState
              compact
              icon="calendar"
              title={`لا توجد ${scheduleType === 'lecture' ? 'محاضرات' : 'سكاشن'} مسجلة لهذا اليوم`}
              description={selectedSection !== 'all' ? `لا توجد مواعيد لسكشن ${selectedSection} في هذا اليوم` : 'يمكنك اختيار يوم آخر من الأعلى'}
            />
          )}
        </div>
      

    </div>
  );
});

ScheduleView.displayName = 'ScheduleView';

