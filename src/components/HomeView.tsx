import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ArrowLeft, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Announcement, AcademicEvent } from '../types';
import { AllAnnouncementsModal } from './AllAnnouncementsModal';

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
  const [currentAnnIndex, setCurrentAnnIndex] = useState(0);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const activeAnnouncements = (announcements || []).filter((a) => a.status === 'active');
  const nearestDates = (upcomingDates || []).slice(0, 4);

  const prevAnnouncement = () => {
    setCurrentAnnIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1));
  };

  const nextAnnouncement = () => {
    setCurrentAnnIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 35) {
      nextAnnouncement();
    } else if (diff < -35) {
      prevAnnouncement();
    }
    touchStartX.current = null;
  };

  const activeAnnouncement = activeAnnouncements[currentAnnIndex];

  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAnnIndex((prev) => (prev < activeAnnouncements.length - 1 ? prev + 1 : 0));
    }, 8000);
    return () => clearInterval(interval);
  }, [activeAnnouncements.length]);

  return (
    <div id="home-screen-view" className="space-y-4 pb-24 pt-1" dir="rtl">
      {/* SECTION 1: IMPORTANT ANNOUNCEMENTS (تنبيهات هامة) */}
      {activeAnnouncements.length > 0 && (
        <section id="home-announcements-section" aria-label="التنبيهات">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-bold text-slate-500">تنبيهات</span>
            {activeAnnouncements.length > 1 && (
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                عرض الكل ({activeAnnouncements.length})
              </button>
            )}
          </div>

          <div
            id="announcement-carousel-card"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs transition-all relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAnnouncement.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {activeAnnouncement.courseRef || activeAnnouncement.categoryNameAr}
                  </span>
                  <span className="text-[11px] text-slate-400">{activeAnnouncement.timeAgo}</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                  {activeAnnouncement.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeAnnouncement.content}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Dots if more than 1 announcement */}
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  {activeAnnouncements.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentAnnIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentAnnIndex ? 'w-4 bg-blue-600' : 'w-1.5 bg-slate-200'
                      }`}
                      aria-label={`تنبيه ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={prevAnnouncement}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    aria-label="السابق"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={nextAnnouncement}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    aria-label="التالي"
                  >
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: UPCOMING DEADLINES / DATES (أقرب المواعيد والتسليمات) */}
      <section id="home-upcoming-dates-section" aria-label="أقرب المواعيد">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold text-slate-500">أقرب التسليمات والمواعيد</span>
          <button
            type="button"
            id="view-all-dates-button"
            onClick={onNavigateToDates}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
          >
            <span>عرض الكل</span>
            <ArrowLeft size={13} />
          </button>
        </div>

        <div className="space-y-2">
          {nearestDates.map((item) => {
            const isVeryUrgent = item.daysUntil <= 3;
            const isExam = item.type === 'quiz' || item.type === 'midterm' || item.type === 'final';

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-blue-200 transition-colors shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.course}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-md ${
                        isExam
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                      }`}
                    >
                      {item.typeLabelAr}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 mt-0.5 truncate">
                    {item.eventName}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {item.displayDateAr} {item.time ? `• ${item.time}` : ''}
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border font-bold ${
                    isVeryUrgent
                      ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {item.remainingTimeAr}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Announcements Modal */}
      <AllAnnouncementsModal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        announcements={activeAnnouncements}
      />
    </div>
  );
};
