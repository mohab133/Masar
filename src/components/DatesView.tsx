import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Download,
  Calendar,
  MapPin,
  ExternalLink,
  Info,
  FileText,
  Globe,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AcademicEvent, OfficialScheduleDocument } from '../types';
import { OFFICIAL_SCHEDULE_DOCS, getCourseNameAr } from '../data/sampleData';
import { OfficialScheduleModal } from './OfficialScheduleModal';

interface DatesViewProps {
  events: AcademicEvent[];
}

type FilterCategory = 'assignments' | 'quizzes' | 'exam_schedules';

export const DatesView: React.FC<DatesViewProps> = memo(({ events }) => {
  const [filter, setFilter] = useState<FilterCategory>('assignments');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<OfficialScheduleDocument | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const midtermDoc = useMemo(
    () => OFFICIAL_SCHEDULE_DOCS.find((d) => d.type === 'midterm') || OFFICIAL_SCHEDULE_DOCS[1],
    []
  );
  const finalDoc = useMemo(
    () => OFFICIAL_SCHEDULE_DOCS.find((d) => d.type === 'final') || OFFICIAL_SCHEDULE_DOCS[2],
    []
  );

  const handleOpenDoc = useCallback((doc: OfficialScheduleDocument) => {
    setSelectedDoc(doc);
    setIsDocModalOpen(true);
  }, []);

  const handleCloseDoc = useCallback(() => {
    setIsDocModalOpen(false);
    setSelectedDoc(null);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
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
      return false;
    });
  }, [sortedEvents, filter]);

  const handleSetAssignmentsFilter = useCallback(() => setFilter('assignments'), []);
  const handleSetQuizzesFilter = useCallback(() => setFilter('quizzes'), []);
  const handleSetExamSchedulesFilter = useCallback(() => setFilter('exam_schedules'), []);

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
            const hasDetails = Boolean(item.note || (item.instructions && item.instructions.length > 0) || item.submissionUrl);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 hover:border-blue-300 transition-all shadow-2xs space-y-2.5"
              >
                {/* Top row: Type badge, delivery method & Course badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80">
                      {item.typeLabelAr || 'تسليم'}
                    </span>
                    {item.deliveryMethod === 'online' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        <Globe size={11} />
                        <span>تسليم إلكتروني</span>
                      </span>
                    )}
                    {item.deliveryMethod === 'in_person' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        <FileCheck size={11} />
                        <span>تسليم ورقي</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                    {getCourseNameAr(item.course)}
                  </span>
                </div>

                {/* Main Event / Assignment title on its own row */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                  {item.eventName}
                </h3>

                {/* Location row if present */}
                {item.location && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>المكان: <strong className="text-slate-800">{item.location}</strong></span>
                  </div>
                )}

                {/* Bottom row: Deadline & time + Remaining Countdown badge */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <Calendar size={15} className="text-blue-600 shrink-0" />
                    <span>أخر موعد: <strong className="text-slate-900 font-extrabold">{item.displayDateAr}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.time && (
                      <span className="text-xs text-slate-500 font-medium">({item.time})</span>
                    )}
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {item.remainingTimeAr}
                    </span>
                  </div>
                </div>

                {/* "اعرف المزيد / تفاصيل التسليم" Button when details exist */}
                {hasDetails && (
                  <div className="pt-1 border-t border-slate-100/80">
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.id)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/60 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <Info size={13} className="text-blue-600" />
                        <span>{isExpanded ? 'إخفاء تفاصيل التسليم والتعليمات' : 'اعرف المزيد وتفاصيل التسليم'}</span>
                      </div>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    {/* Expandable Details Accordion */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18, ease: 'easeInOut' }}
                          className="overflow-hidden space-y-2.5 pt-2.5"
                        >
                          {/* Note Callout */}
                          {item.note && (
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                              <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-900 ml-1">ملاحظة:</strong>
                                <span>{item.note}</span>
                              </div>
                            </div>
                          )}

                          {/* Instructions List */}
                          {item.instructions && item.instructions.length > 0 && (
                            <div className="bg-blue-50/40 border border-blue-100/80 rounded-xl p-3 text-xs space-y-1.5">
                              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                                <FileText size={13} className="text-blue-700 shrink-0" />
                                <span>تعليمات وشروط التسليم:</span>
                              </div>
                              <ul className="space-y-1.5 pr-2 pt-0.5">
                                {item.instructions.map((instruction, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-slate-700 leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                                    <span>{instruction}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Direct Submission Link Button */}
                          {item.submissionUrl && (
                            <div className="pt-0.5">
                              <a
                                href={item.submissionUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
                              >
                                <span>{item.submissionUrlTitle || 'رابط استمارة التسليم'}</span>
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
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
        onClose={handleCloseDoc}
        document={selectedDoc}
      />
    </div>
  );
});

DatesView.displayName = 'DatesView';

