import React, { useState } from 'react';
import { Download, Calendar, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS, getCourseNameAr } from '../data/sampleData';
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
    <div id="dates-screen-view" className="space-y-4 pb-32 pt-1" dir="rtl">
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
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 hover:border-blue-300 transition-all shadow-2xs space-y-2.5"
              >
                {/* Top row: Type badge & Course badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80">
                    {item.typeLabelAr || 'تسليم'}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {getCourseNameAr(item.course)}
                  </span>
                </div>

                {/* Main Event / Assignment title on its own row, never truncated */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                  {item.eventName}
                </h3>

                {/* Location row if present */}
                {item.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>المكان: {item.location}</span>
                  </div>
                )}

                {/* Bottom row: Deadline & time */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Calendar size={15} className="text-blue-600 shrink-0" />
                    <span>أخر موعد: <strong className="text-slate-900 font-extrabold">{item.displayDateAr}</strong></span>
                  </div>
                  {item.time && (
                    <span className="text-xs text-slate-500 font-medium">({item.time})</span>
                  )}
                </div>
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-all">
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
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-200/80 transition-all inline-flex items-center gap-1.5 shrink-0 shadow-2xs"
            >
              <Download size={15} />
              <span>عرض الجدول</span>
            </button>
          </div>

          {/* Final Schedule Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition-all">
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
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-200/80 transition-all inline-flex items-center gap-1.5 shrink-0 shadow-2xs"
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
