import React, { useState } from 'react';
import { Sparkles, MapPin, Clock, FileImage, Download, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScheduleEvent, ScheduleType, LiveSectionInfo, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS } from '../data/sampleData';
import { LiveSectionsModal } from './LiveSectionsModal';
import { OfficialScheduleModal } from './OfficialScheduleModal';

interface ScheduleViewProps {
  scheduleEvents: ScheduleEvent[];
  liveSections: LiveSectionInfo[];
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الإثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  scheduleEvents,
  liveSections,
}) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType>('lecture');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
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

  const handleSectionChange = (sec: string) => {
    setSelectedSection(sec);
    try {
      localStorage.setItem('masar_user_section', sec);
    } catch {
      // ignore
    }
  };

  // Filter events by selected type, day, and section number
  const filteredEvents = (scheduleEvents || []).filter((ev) => {
    if (ev.type !== scheduleType || ev.dayOfWeek !== selectedDay) return false;
    if (scheduleType === 'section' && selectedSection !== 'all') {
      return ev.sectionNumber === Number(selectedSection);
    }
    return true;
  });

  const handleOpenDoc = (doc: OfficialScheduleDocument) => {
    setSelectedDoc(doc);
    setIsDocModalOpen(true);
  };

  return (
    <div id="schedule-screen-view" className="space-y-4 pb-24 pt-1" dir="rtl">
      {/* Schedule Image Button */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FileImage size={18} />
          </div>
          <span className="text-xs font-bold text-slate-800">
            صورة الجدول الأسبوعي
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleOpenDoc(OFFICIAL_SCHEDULE_DOCS[0])}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200/80 hover:bg-blue-100 transition-all shrink-0 inline-flex items-center gap-1.5"
        >
          <Download size={13} />
          <span>عرض الصورة</span>
        </button>
      </div>

      {/* Live Sections */}
      <button
        type="button"
        id="open-live-sections-button"
        onClick={() => setIsLiveModalOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl text-xs hover:bg-emerald-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-bold text-emerald-900 text-xs">السكاشن الحالية والقادمة الآن</span>
        </div>
        <span className="text-xs font-bold text-emerald-700">
          عرض ←
        </span>
      </button>

      {/* Segmented Control: المحاضرات | السكاشن */}
      <div className="p-1 bg-slate-200/70 rounded-xl flex items-center relative">
        <button
          type="button"
          id="schedule-tab-lectures"
          onClick={() => setScheduleType('lecture')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 ${
            scheduleType === 'lecture'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'lecture' && (
            <motion.div
              layoutId="scheduleTypePill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">المحاضرات</span>
        </button>

        <button
          type="button"
          id="schedule-tab-sections"
          onClick={() => setScheduleType('section')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10 ${
            scheduleType === 'section'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {scheduleType === 'section' && (
            <motion.div
              layoutId="scheduleTypePill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">السكاشن</span>
        </button>
      </div>

      {/* Section Filter (يظهر فقط في تبويب السكاشن لاختيار سكشن الطالب مثل ٣) */}
      <AnimatePresence>
        {scheduleType === 'section' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-3 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Filter size={14} className="text-blue-600" />
                <span>اختر سكشنك لعرض مواعيده فقط:</span>
              </span>
              {selectedSection !== 'all' ? (
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/70">
                  يعرض سكشن {selectedSection} فقط
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-medium">
                  يعرض كل السكاشن
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSectionChange('all')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                  selectedSection === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    سكشن {secNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Days Selector - Smooth interactive pills */}
      <div className="flex items-center gap-1.5">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDay === day.id;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => setSelectedDay(day.id)}
              className={`flex-1 py-2 px-1 rounded-xl text-center text-xs transition-all relative ${
                isSelected
                  ? 'text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 font-medium'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="scheduleDayPill"
                  className="absolute inset-0 bg-blue-600 rounded-xl"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
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
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="space-y-3 pt-1"
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.04 }}
                className="bg-white border border-slate-200/70 rounded-xl p-4 hover:border-blue-200 transition-colors shadow-2xs"
              >
                {/* Card Header: Course & Section/Lecture Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {item.course}
                    </span>
                    {item.instructor && (
                      <span className="text-xs text-slate-500">
                        • {item.instructor}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${
                      item.type === 'lecture'
                        ? 'bg-blue-50 text-blue-700 border-blue-200/60'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                    }`}
                  >
                    {item.typeLabelAr}
                    {item.sectionNumber ? ` • سكشن ${item.sectionNumber}` : ''}
                  </span>
                </div>

                {/* Card Body: Time, Location */}
                <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    <span>
                      {item.startTime} - {item.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {item.location}
                    </span>
                  </div>
                </div>

                {/* Important Notes / Tips */}
                {item.notes && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50/50 -mx-1 px-2.5 py-1.5 rounded-lg">
                    <Sparkles size={13} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>{item.notes}</span>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-500">
              لا توجد {scheduleType === 'lecture' ? 'محاضرات' : 'سكاشن'} مسجلة لهذا اليوم
              {selectedSection !== 'all' ? ` لسكشن ${selectedSection}` : ''}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Live Sections Modal */}
      <LiveSectionsModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        liveSections={liveSections}
      />

      {/* Official Schedule Sheet Modal */}
      <OfficialScheduleModal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDoc(null);
        }}
        document={selectedDoc}
      />
    </div>
  );
};
