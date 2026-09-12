import React, { useState, useRef, useCallback, memo } from 'react';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  GraduationCap,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Globe,
  FileCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Announcement, AcademicEvent } from '../types';
import { getCourseNameAr } from '../data/sampleData';
import { AllAnnouncementsModal } from './AllAnnouncementsModal';
import { MenoufBylawModal } from './MenoufBylawModal';
import { triggerHaptic } from '../utils/haptics';

interface HomeViewProps {
  announcements: Announcement[];
  upcomingDates: AcademicEvent[];
  onNavigateToDates: () => void;
}

export const HomeView: React.FC<HomeViewProps> = memo(({
  announcements,
  upcomingDates,
  onNavigateToDates,
}) => {
  // Announcements Carousel State
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [annDirection, setAnnDirection] = useState<number>(1);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [isBylawModalOpen, setIsBylawModalOpen] = useState(false);
  const annTouchStartX = useRef<number | null>(null);

  // Upcoming Dates Carousel State
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [dateDirection, setDateDirection] = useState<number>(1);
  const dateTouchStartX = useRef<number | null>(null);

  const activeAnnouncements = (announcements || []).filter((a) => a.status === 'active');
  const nearestDates = (upcomingDates || []).slice(0, 6);

  // Announcement navigation
  const prevAnnouncement = useCallback(() => {
    triggerHaptic('selection');
    setAnnDirection(-1);
    setCurrentAnnIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1));
  }, [activeAnnouncements.length]);

  const nextAnnouncement = useCallback(() => {
    triggerHaptic('selection');
    setAnnDirection(1);
    setCurrentAnnIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0));
  }, [activeAnnouncements.length]);

  const handleAnnTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    annTouchStartX.current = e.touches[0].clientX;
  }, []);

  const handleAnnTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (annTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - annTouchStartX.current; // Positive = Dragged Right, Negative = Dragged Left

    // Swiping right (diff > 35): moves to next item
    // Swiping left (diff < -35): moves to previous item
    if (diff > 35) {
      nextAnnouncement();
    } else if (diff < -35) {
      prevAnnouncement();
    }
    annTouchStartX.current = null;
  }, [nextAnnouncement, prevAnnouncement]);

  // Upcoming Dates navigation
  const prevDate = useCallback(() => {
    triggerHaptic('selection');
    setDateDirection(-1);
    setCurrentDateIndex((prev) => (prev > 0 ? prev - 1 : nearestDates.length - 1));
  }, [nearestDates.length]);

  const nextDate = useCallback(() => {
    triggerHaptic('selection');
    setDateDirection(1);
    setCurrentDateIndex((prev) => (prev < nearestDates.length - 1 ? prev + 1 : 0));
  }, [nearestDates.length]);

  const handleDateTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    dateTouchStartX.current = e.touches[0].clientX;
  }, []);

  const handleDateTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (dateTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - dateTouchStartX.current;

    if (diff > 35) {
      nextDate();
    } else if (diff < -35) {
      prevDate();
    }
    dateTouchStartX.current = null;
  }, [nextDate, prevDate]);

  const activeAnnouncement = activeAnnouncements[currentAnnIndex];
  const activeDate = nearestDates[currentDateIndex];

  return (
    <div id="home-screen-view" className="space-y-4 pb-32 pt-1" dir="rtl">
      {/* SECTION 1: IMPORTANT ANNOUNCEMENTS (تنبيهات هامة) */}
      {activeAnnouncements.length > 0 && (
        <section id="home-announcements-section" aria-label="التنبيهات">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">تنبيهات هامة</span>
            {activeAnnouncements.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsAnnModalOpen(true);
                }}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                عرض الكل ({activeAnnouncements.length})
              </button>
            )}
          </div>

          <div
            id="announcement-carousel-card"
            onTouchStart={handleAnnTouchStart}
            onTouchEnd={handleAnnTouchEnd}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs transition-colors relative overflow-hidden"
          >
            <AnimatePresence mode="wait" custom={annDirection}>
              <motion.div
                key={activeAnnouncement.id}
                custom={annDirection}
                initial={{ opacity: 0, x: annDirection > 0 ? -20 : 20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.12, ease: 'easeOut' },
                }}
                exit={{
                  opacity: 0,
                  x: annDirection > 0 ? 20 : -20,
                  transition: { duration: 0.08, ease: 'easeIn' },
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    {activeAnnouncement.courseRef || activeAnnouncement.categoryNameAr}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeAnnouncement.timeAgo}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug">
                  {activeAnnouncement.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeAnnouncement.content}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Interactive Pagination Dots */}
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3 mt-3.5 border-t border-slate-100">
                {activeAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCurrentAnnIndex(idx);
                    }}
                    className="p-1.5 -m-1.5 focus:outline-hidden"
                    aria-label={`تنبيه ${idx + 1}`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentAnnIndex
                          ? 'w-7 bg-blue-600 shadow-xs'
                          : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: UPCOMING DEADLINES / DATES (أقرب المواعيد والتسليمات) */}
      {nearestDates.length > 0 && activeDate && (
        <section id="home-upcoming-dates-section" aria-label="أقرب التسليمات والمواعيد">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">أقرب التسليمات والمواعيد</span>
            <button
              type="button"
              id="view-all-dates-button"
              onClick={() => {
                triggerHaptic('selection');
                onNavigateToDates();
              }}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>عرض كل المواعيد</span>
              <ArrowLeft size={14} />
            </button>
          </div>

          <div
            id="dates-carousel-card"
            onTouchStart={handleDateTouchStart}
            onTouchEnd={handleDateTouchEnd}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs transition-colors relative overflow-hidden"
          >
            <AnimatePresence mode="wait" custom={dateDirection}>
              <motion.div
                key={activeDate.id}
                custom={dateDirection}
                initial={{ opacity: 0, x: dateDirection > 0 ? -20 : 20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.12, ease: 'easeOut' },
                }}
                exit={{
                  opacity: 0,
                  x: dateDirection > 0 ? 20 : -20,
                  transition: { duration: 0.08, ease: 'easeIn' },
                }}
              >
                <div className="space-y-3">
                  {/* Top row: Course Name, Type & Delivery Method badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80">
                        {activeDate.typeLabelAr || 'تسليم'}
                      </span>
                      {activeDate.deliveryMethod === 'online' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <Globe size={11} />
                          <span>إلكتروني</span>
                        </span>
                      )}
                      {activeDate.deliveryMethod === 'in_person' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <FileCheck size={11} />
                          <span>ورقي</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {getCourseNameAr(activeDate.course)}
                    </span>
                  </div>

                  {/* Main task / event title */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                    {activeDate.eventName}
                  </h3>

                  {/* Location if present */}
                  {activeDate.location && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span>المكان: <strong className="text-slate-800">{activeDate.location}</strong></span>
                    </div>
                  )}

                  {/* Note / Instructions if present */}
                  {activeDate.note && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 leading-relaxed">
                      <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{activeDate.note}</span>
                    </div>
                  )}

                  {/* Submission Link Button if available */}
                  {activeDate.submissionUrl && (
                    <div>
                      <a
                        href={activeDate.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                      >
                        <ExternalLink size={13} />
                        <span>{activeDate.submissionUrlTitle || 'رابط استمارة التسليم'}</span>
                      </a>
                    </div>
                  )}

                  {/* Bottom row: Direct Deadline date & Remaining countdown tag */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                      <Calendar size={15} className="text-blue-600 shrink-0" />
                      <span>{activeDate.displayDateAr}</span>
                      {activeDate.time && (
                        <span className="text-slate-500 font-normal text-xs">({activeDate.time})</span>
                      )}
                    </div>

                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                      {activeDate.remainingTimeAr}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Interactive Pagination Dots */}
            {nearestDates.length > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3 mt-3.5 border-t border-slate-100">
                {nearestDates.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      triggerHaptic('selection');
                      setCurrentDateIndex(idx);
                    }}
                    className="p-1.5 -m-1.5 focus:outline-hidden"
                    aria-label={`موعد ${idx + 1}`}
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentDateIndex
                          ? 'w-7 bg-blue-600 shadow-xs'
                          : 'w-2 bg-slate-200 hover:bg-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: UNIVERSITY PLATFORMS & OFFICIAL BYLAW */}
      <section id="home-platforms-section" aria-label="المنصات الجامعية واللوائح">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-sm font-bold text-slate-700">المنصات الجامعية واللوائح الرسمية</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* منصة ابن الهيثم */}
          <a
            id="link-ibn-alhaytham"
            href="https://hes.menofia.edu.eg/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('light')}
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  منصة ابن الهيثم
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  شؤون الطلاب والنتائج والتسجيل
                </p>
              </div>
            </div>
            <div className="p-1 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 mr-2">
              <ExternalLink size={16} />
            </div>
          </a>

          {/* البوابة الرسمية للكلية */}
          <a
            id="link-fee-portal"
            href="https://fee.menofia.edu.eg/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('light')}
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  بوابة كلية الهندسة الإلكترونية
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  الموقع الرسمي والجداول المعتمدة
                </p>
              </div>
            </div>
            <div className="p-1 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 mr-2">
              <ExternalLink size={16} />
            </div>
          </a>

          {/* دليل لائحة منوف */}
          <button
            type="button"
            id="btn-menouf-bylaw-pdf"
            onClick={() => {
              triggerHaptic('light');
              setIsBylawModalOpen(true);
            }}
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-blue-300 hover:shadow-xs transition-all text-right w-full sm:col-span-2 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    دليل لائحة هندسة منوف
                  </h4>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                    الساعات المعتمدة
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  اللائحة الداخلية ونظام الساعات المعتمدة والتقديرات وقواعد التخرج
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0 mr-2 shadow-2xs">
              عرض الدليل
            </div>
          </button>
        </div>
      </section>

      {/* Announcements Full Modal */}
      <AllAnnouncementsModal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        announcements={activeAnnouncements}
      />

      {/* Menouf Bylaw Modal */}
      <MenoufBylawModal
        isOpen={isBylawModalOpen}
        onClose={() => setIsBylawModalOpen(false)}
      />
    </div>
  );
});

HomeView.displayName = 'HomeView';
