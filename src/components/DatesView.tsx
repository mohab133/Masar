import React, { useState } from 'react';
import { Download, Calendar, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS } from '../data/sampleData';
import { OfficialScheduleModal } from './OfficialScheduleModal';

interface DatesViewProps {
  events: AcademicEvent[];
}

type FilterCategory = 'all' | 'assignments' | 'quizzes' | 'exam_schedules';

export const DatesView: React.FC<DatesViewProps> = ({ events }) => {
  const [filter, setFilter] = useState<FilterCategory>('all');
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
    if (filter === 'all') return true;
    if (filter === 'assignments') {
      return ['assignment', 'submission', 'project'].includes(ev.type);
    }
    if (filter === 'quizzes') {
      return ['quiz', 'lab'].includes(ev.type);
    }
    return false;
  });

  return (
    <div id="dates-screen-view" className="space-y-3 pb-24 pt-1" dir="rtl">
      {/* Filter Tabs (الكل، تسليمات وشيتات، كويزات، جداول الامتحانات) */}
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl relative select-none"
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
            filter === 'all'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'all' && (
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">الكل ({sortedEvents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('assignments')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
            filter === 'assignments'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'assignments' && (
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">تسليمات وشيتات</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('quizzes')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
            filter === 'quizzes'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'quizzes' && (
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">كويزات</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('exam_schedules')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all relative ${
            filter === 'exam_schedules'
              ? 'text-blue-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-bold'
          }`}
        >
          {filter === 'exam_schedules' && (
            <motion.div
              layoutId="datesFilterPill"
              className="absolute inset-0 bg-white rounded-lg shadow-xs"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10">جداول الامتحانات</span>
        </button>
      </div>

      {/* Main Content: Tasks List when on All / Assignments / Quizzes */}
      {filter !== 'exam_schedules' && (
        <div className="space-y-2">
          {filteredEvents.map((item) => {
            const isUrgent = item.daysUntil <= 3;
            const isQuiz = item.type === 'quiz' || item.type === 'lab';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-xl p-3 hover:border-blue-200 transition-colors shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.course}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                        isQuiz
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}
                    >
                      {item.typeLabelAr}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-slate-800 mt-1 truncate">
                    {item.eventName}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{item.displayDateAr}</span>
                    {item.time && <span>• {item.time}</span>}
                    {item.location && (
                      <span className="flex items-center gap-0.5">
                        • <MapPin size={10} className="inline" />
                        {item.location}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold ${
                    isUrgent
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.remainingTimeAr}
                </span>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              لا توجد مواعيد في هذا القسم حالياً
            </div>
          )}

          {/* Quick link to Exam Schedules from All view */}
          {filter === 'all' && (
            <button
              type="button"
              onClick={() => setFilter('exam_schedules')}
              className="w-full py-2.5 px-3 bg-slate-100/80 hover:bg-slate-200/70 text-slate-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              <span>عرض جداول الميدتيرم والفاينال</span>
              <span>←</span>
            </button>
          )}
        </div>
      )}

      {/* Exam Schedules Tab (جداول الامتحانات) */}
      {filter === 'exam_schedules' && (
        <div className="space-y-2.5 pt-1">
          {/* Midterm Schedule Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">جدول الميدتيرم</span>
                <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-1.5 py-0.2 rounded-md border border-amber-200/60">
                  1 نوفمبر
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مواعيد وقاعات الامتحانات
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDoc(midtermDoc)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/70 transition-all inline-flex items-center gap-1 shrink-0"
            >
              <Download size={13} />
              <span>عرض الصورة</span>
            </button>
          </div>

          {/* Final Schedule Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">جدول الفاينال</span>
                <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-1.5 py-0.2 rounded-md border border-purple-200/60">
                  27 ديسمبر
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                مواعيد وقاعات الامتحانات
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenDoc(finalDoc)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200/70 transition-all inline-flex items-center gap-1 shrink-0"
            >
              <Download size={13} />
              <span>عرض الصورة</span>
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
