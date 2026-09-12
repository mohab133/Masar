import React, { useState } from 'react';
import { Download, Calendar, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS } from '../data/sampleData';
import { OfficialScheduleModal } from './OfficialScheduleModal';

interface DatesViewProps {
  events: AcademicEvent[];
}

type FilterCategory = 'assignments' | 'quizzes' | 'exam_schedules';

export const DatesView: React.FC<DatesViewProps> = ({ events }) => {
  // Default to 'assignments' (تسليمات) as 'all' was removed per request
  const [filter, setFilter] = useState<FilterCategory>('assignments');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OfficialScheduleDocument | null>(null);

  const midtermDoc = OFFICIAL_SCHEDULE_DOCS.find((d) => d.type === 'midterm') || OFFICIAL_SCHEDULE_DOCS[1];
  const finalDoc = OFFICIAL_SCHEDULE_DOCS.find((d) => d.type === 'final') || OFFICIAL_SCHEDULE_DOCS[2];

  const handleOpenDoc = (doc: OfficialScheduleDocument) => {
    setSelectedDoc(doc);
    setIsDocModalOpen(true);
  };

  const sortedEvents = [...(events || [])].sort((a, b) => a.daysUntil - b.daysUntil);

  const filteredEvents = sortedEvents.filter((ev) => {
    if (filter === 'assignments') {
      return ['assignment', 'submission', 'project'].includes(ev.type);
    }
    if (filter === 'quizzes') {
      return ['quiz', 'lab'].includes(ev.type);
    }
    return false;
  });

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
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
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
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
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
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-xl shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">جداول الامتحانات</span>
        </button>
      </div>

      {/* Main Content: Tasks List when on Assignments / Quizzes */}
      {filter !== 'exam_schedules' && (
        <div className="space-y-3">
          {filteredEvents.map((item) => {
            const isUrgent = item.daysUntil <= 3;
            const isQuiz = item.type === 'quiz' || item.type === 'lab';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 hover:border-blue-300 transition-colors shadow-2xs flex items-center justify-between gap-3.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {item.course}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        isQuiz
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/70'
                      }`}
                    >
                      {item.typeLabelAr}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {item.eventName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-500 font-medium mt-1.5">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={13} className="text-slate-400" />
                      {item.displayDateAr}
                    </span>
                    {item.time && (
                      <span className="inline-flex items-center gap-1">
                        • <Clock size={13} className="text-slate-400" />
                        {item.time}
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        • <MapPin size={13} className="text-slate-400" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs sm:text-sm px-3 py-1.5 rounded-xl border font-bold ${
                    isUrgent
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.remainingTimeAr}
                </span>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">
              لا توجد عناصر في هذا القسم حالياً
            </div>
          )}
        </div>
      )}

      {/* Exam Schedules Tab (جداول الامتحانات) */}
      {filter === 'exam_schedules' && (
        <div className="space-y-3 pt-1">
          {/* Midterm Schedule Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">جدول الميدتيرم</span>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-md border border-amber-200/70">
                  1 نوفمبر
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                مواعيد وقاعات الامتحانات الرسمية المعتمدة
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDoc(midtermDoc)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-200/80 transition-all inline-flex items-center gap-1.5 shrink-0"
            >
              <Download size={15} />
              <span>عرض الجدول</span>
            </button>
          </div>

          {/* Final Schedule Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">جدول الفاينال</span>
                <span className="text-xs bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded-md border border-purple-200/70">
                  27 ديسمبر
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                مواعيد وقاعات الامتحانات النهائية الرسمية
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDoc(finalDoc)}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-200/80 transition-all inline-flex items-center gap-1.5 shrink-0"
            >
              <Download size={15} />
              <span>عرض الجدول</span>
            </button>
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
    </div>
  );
};
