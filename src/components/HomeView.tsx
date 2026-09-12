import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Calendar,
  BookOpen,
  GraduationCap,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Announcement, AcademicEvent } from '../types';
import { getCourseNameAr } from '../data/sampleData';
import { AllAnnouncementsModal } from './AllAnnouncementsModal';
import { MenoufBylawModal } from './MenoufBylawModal';

interface HomeViewProps {
  announcements: Announcement[];
  upcomingDates: AcademicEvent[];
  onNavigateToDates: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  announcements,
  upcomingDates,
  onNavigateToDates,
}) => {
  // Announcements Carousel State
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [isBylawModalOpen, setIsBylawModalOpen] = useState(false);
  const annTouchStartX = useRef<number | null>(null);

  // Upcoming Dates Carousel State (same presentation format as announcements)
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const dateTouchStartX = useRef<number | null>(null);

  const activeAnnouncements = (announcements || []).filter((a) => a.status === 'active');
  const nearestDates = (upcomingDates || []).slice(0, 6);

  // Announcement navigation
  const prevAnnouncement = () => {
    setCurrentAnnIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1));
  };

  const nextAnnouncement = () => {
    setCurrentAnnIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0));
  };

  const handleAnnTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    annTouchStartX.current = e.touches[0].clientX;
  };

  const handleAnnTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (annTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = annTouchStartX.current - touchEndX;

    if (diff > 35) {
      nextAnnouncement();
    } else if (diff < -35) {
      prevAnnouncement();
    }
    annTouchStartX.current = null;
  };

  // Upcoming Dates navigation
  const prevDate = () => {
    setCurrentDateIndex((prev) => (prev > 0 ? prev - 1 : nearestDates.length - 1));
  };

  const nextDate = () => {
    setCurrentDateIndex((prev) => (prev < nearestDates.length - 1 ? prev + 1 : 0));
  };

  const handleDateTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    dateTouchStartX.current = e.touches[0].clientX;
  };

  const handleDateTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (dateTouchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = dateTouchStartX.current - touchEndX;

    if (diff > 35) {
      nextDate();
    } else if (diff < -35) {
      prevDate();
    }
    dateTouchStartX.current = null;
  };

  const activeAnnouncement = activeAnnouncements[currentAnnIndex];
  const activeDate = nearestDates[currentDateIndex];

  // Auto-play announcement carousel gently
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAnnIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0));
    }, 9000);
    return () => clearInterval(interval);
  }, [activeAnnouncements.length]);

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
                onClick={() => setIsAnnModalOpen(true)}
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
            className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAnnouncement.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
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

            {/* Dots and controls */}
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {activeAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentAnnIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentAnnIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'
                      }`}
                      aria-label={`تنبيه ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevAnnouncement}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    aria-label="السابق"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={nextAnnouncement}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    aria-label="التالي"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
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
              onClick={onNavigateToDates}
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
            className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDate.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <div className="space-y-2.5">
                  {/* Top row: Type badge & Course badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/80">
                      {activeDate.typeLabelAr || 'تسليم'}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {getCourseNameAr(activeDate.course)}
                    </span>
                  </div>

                  {/* Main task / assignment title - full text on its own line */}
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">
                    {activeDate.eventName}
                  </h3>

                  {/* Bottom row: Deadline & time */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Calendar size={16} className="text-blue-600 shrink-0" />
                      <span>أخر موعد: <strong className="text-slate-900 font-extrabold">{activeDate.displayDateAr}</strong></span>
                    </div>
                    {activeDate.time && (
                      <span className="text-xs text-slate-500 font-medium">({activeDate.time})</span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots and controls for dates */}
            {nearestDates.length > 1 && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {nearestDates.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentDateIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentDateIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'
                      }`}
                      aria-label={`موعد ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevDate}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    aria-label="السابق"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={nextDate}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    aria-label="التالي"
                  >
                    <ChevronLeft size={18} />
                  </button>
                </div>
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
            href="https://hes.mans.edu.eg/"
            target="_blank"
            rel="noopener noreferrer"
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

          {/* منصة الكتب الإلكترونية */}
          <a
            id="link-ebooks-platform"
            href="https://books.mans.edu.eg/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  منصة الكتب الجامعية
                </h4>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  الكتاب الجامعي والمقررات الرقمية
                </p>
              </div>
            </div>
            <div className="p-1 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 mr-2">
              <ExternalLink size={16} />
            </div>
          </a>

          {/* لائحة منوف PDF */}
          <button
            type="button"
            id="btn-menouf-bylaw-pdf"
            onClick={() => setIsBylawModalOpen(true)}
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 rounded-2xl hover:border-red-300 hover:shadow-xs transition-all text-right w-full sm:col-span-2 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors">
                    لائحة هندسة منوف (PDF)
                  </h4>
                  <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.2 rounded">
                    PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  اللائحة الداخلية ونظام الساعات المعتمدة والتخرج
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-100 group-hover:bg-red-600 group-hover:text-white transition-all shrink-0 mr-2 shadow-2xs">
              عرض وتحميل
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
};
