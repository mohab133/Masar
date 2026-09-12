import React, { useState, useCallback, useMemo, memo } from 'react';
import { MapPin, Clock, FileImage, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScheduleEvent, ScheduleType, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS } from '../data/sampleData';
import { OfficialScheduleModal } from './OfficialScheduleModal';

interface ScheduleViewProps {
  scheduleEvents: ScheduleEvent[];
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
];

export const ScheduleView: React.FC<ScheduleViewProps> = memo(({
  scheduleEvents,
}) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType>('lecture');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OfficialScheduleDocument | null>(null);

  // Student's chosen section (persisted in localStorage, e.g. section 3)
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

  // Filter events by selected type, day, and section number
  const filteredEvents = useMemo(() => {
    return (scheduleEvents || []).filter((ev) => {
      if (ev.type !== scheduleType || ev.dayOfWeek !== selectedDay) return false;
      if (scheduleType === 'section' && selectedSection !== 'all') {
        return ev.sectionNumber === Number(selectedSection);
      }
      return true;
    });
  }, [scheduleEvents, scheduleType, selectedDay, selectedSection]);

  const handleOpenDoc = useCallback((doc: OfficialScheduleDocument) => {
    setSelectedDoc(doc);
    setIsDocModalOpen(true);
  }, []);

  const handleCloseDoc = useCallback(() => {
    setIsDocModalOpen(false);
    setSelectedDoc(null);
  }, []);

  const handleSetLectureType = useCallback(() => setScheduleType('lecture'), []);
  const handleSetSectionType = useCallback(() => setScheduleType('section'), []);

  return (
    <div id="schedule-screen-view" className="space-y-4 pb-32 pt-1" dir="rtl">
      {/* Schedule Image Button */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileImage size={20} />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-900 block">
              صورة الجدول الأسبوعي الرسمي
            </span>
            <span className="text-xs text-slate-500 font-medium block">
              جدول المحاضرات والسكاشن المعتمد
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDoc(OFFICIAL_SCHEDULE_DOCS[0])}
          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs sm:text-sm rounded-xl border border-blue-200/80 transition-all shrink-0 inline-flex items-center gap-1.5 shadow-2xs"
        >
          <Download size={14} />
          <span>عرض الجدول</span>
        </button>
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
          onClick={handleSetLectureType}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all relative z-10 ${
            scheduleType === 'lecture'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'lecture' && (
            <motion.div
              layoutId="scheduleTypePill"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: 'spring', stiffness: 550, damping: 32 }}
            />
          )}
          <span className="relative z-10">المحاضرات</span>
        </button>

        <button
          type="button"
          id="schedule-tab-sections"
          onClick={handleSetSectionType}
          className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all relative z-10 ${
            scheduleType === 'section'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'section' && (
            <motion.div
              layoutId="scheduleTypePill"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: 'spring', stiffness: 550, damping: 32 }}
            />
          )}
          <span className="relative z-10">السكاشن</span>
        </button>
      </div>

      {/* Section Filter - Simple and streamlined */}
      <AnimatePresence>
        {scheduleType === 'section' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80"
          >
            <button
              type="button"
              onClick={() => handleSectionChange('all')}
              className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedSection === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              كل السكاشن
            </button>
            {[1, 2, 3, 4].map((secNum) => {
              const isSelected = selectedSection === String(secNum);
              return (
                <button
                  key={secNum}
                  type="button"
                  onClick={() => handleSectionChange(String(secNum))}
                  className={`flex-1 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  سكشن {secNum}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

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
              className={`flex-1 py-2.5 px-1 rounded-xl text-center text-xs sm:text-sm transition-all relative ${
                isSelected
                  ? 'text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 font-bold'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="scheduleDayPill"
                  className="absolute inset-0 bg-blue-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 550, damping: 32 }}
                />
              )}
              <span className="relative z-10">{day.label}</span>
            </button>
          );
        })}
      </div>

      {/* Events List for Selected Day and Type with smooth animated switch */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${scheduleType}-${selectedDay}-${selectedSection}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.12 }}
          className="space-y-3 pt-1"
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.14, delay: Math.min(idx * 0.02, 0.1) }}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-blue-300 transition-colors shadow-2xs"
              >
                {/* Card Header: Course & Section/Lecture Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {item.course}
                    </span>
                    {item.instructor && (
                      <span className="text-xs sm:text-sm text-slate-500 font-medium">
                        • {item.instructor}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-bold px-2.5 py-1 rounded-lg border ${
                      item.type === 'lecture'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                    }`}
                  >
                    {item.typeLabelAr}
                    {item.sectionNumber ? ` • سكشن ${item.sectionNumber}` : ''}
                  </span>
                </div>

                {/* Card Body: Time, Location */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs sm:text-sm text-slate-600 mt-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} className="text-slate-400" />
                    <span>
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-slate-400" />
                    <span className="font-bold text-slate-800">
                      {item.location}
                    </span>
                  </div>
                </div>

                {/* Important Notes / Tips */}
                {item.notes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-xs sm:text-sm text-amber-800 bg-amber-50/70 -mx-1 px-3 py-2 rounded-xl">
                    <span className="font-semibold">{item.notes}</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-sm font-medium text-slate-500">
              لا توجد {scheduleType === 'lecture' ? 'محاضرات' : 'سكاشن'} مسجلة لهذا اليوم
              {selectedSection !== 'all' ? ` لسكشن ${selectedSection}` : ''}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Official Schedule Sheet Modal */}
      <OfficialScheduleModal
        isOpen={isDocModalOpen}
        onClose={handleCloseDoc}
        document={selectedDoc}
      />
    </div>
  );
});

ScheduleView.displayName = 'ScheduleView';


