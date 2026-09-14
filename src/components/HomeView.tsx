import React, { useState, useRef, useMemo, useCallback, memo } from 'react';
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Clock,
  FileText,
  Download,
} from 'lucide-react';
import { Announcement, AcademicEvent } from '../types';
import { AllAnnouncementsModal } from './AllAnnouncementsModal';
import { ConfirmModal } from './ConfirmModal';
import { formatDeadline } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';

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
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const annTouchStartX = useRef<number | null>(null);

  // Confirm Modal State for links & downloads
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'download' | 'link';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'download',
    onConfirm: () => {},
  });

  // Upcoming Dates Carousel State
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const dateTouchStartX = useRef<number | null>(null);

  const activeAnnouncements = useMemo(() => {
    return [...(announcements || [])]
      .filter((a) => a.status === 'active')
      .sort((a, b) => {
        const aTime = Date.parse(a.date);
        const bTime = Date.parse(b.date);
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
        return bTime - aTime;
      });
  }, [announcements]);

  const nearestDates = useMemo(() => {
    return (upcomingDates || []).slice(0, 6);
  }, [upcomingDates]);

  // Announcement navigation
  const prevAnnouncement = useCallback(() => {
    setCurrentAnnIndex((prev) => (prev > 0 ? prev - 1 : activeAnnouncements.length - 1));
  }, [activeAnnouncements.length]);

  const nextAnnouncement = useCallback(() => {
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
    const diff = annTouchStartX.current - touchEndX;

    if (diff > 35) {
      prevAnnouncement();
    } else if (diff < -35) {
      nextAnnouncement();
    }
    annTouchStartX.current = null;
  }, [prevAnnouncement, nextAnnouncement]);

  // Upcoming Dates navigation
  const prevDate = useCallback(() => {
    setCurrentDateIndex((prev) => (prev > 0 ? prev - 1 : nearestDates.length - 1));
  }, [nearestDates.length]);

  const nextDate = useCallback(() => {
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
    const diff = dateTouchStartX.current - touchEndX;

    if (diff > 35) {
      prevDate();
    } else if (diff < -35) {
      nextDate();
    }
    dateTouchStartX.current = null;
  }, [prevDate, nextDate]);

  const activeAnnouncement = activeAnnouncements[currentAnnIndex] || activeAnnouncements[0];
  const activeDate = nearestDates[currentDateIndex] || nearestDates[0];

  return (
    <div id="home-screen-view" className="space-y-5 pb-24 pt-1" dir="rtl">
      {/* SECTION 1: IMPORTANT ANNOUNCEMENTS (التنبيهات) */}
      {activeAnnouncements.length > 0 ? (
        <section id="home-announcements-section" aria-label="التنبيهات" data-no-swipe="true">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">التنبيهات</span>
            {activeAnnouncements.length > 1 && (
              <button
                type="button"
                onClick={() => setIsAnnModalOpen(true)}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                عرض الكل ({activeAnnouncements.length})
              </button>
            )}
          </div>

          <div
            id="announcement-carousel-card"
            onTouchStart={handleAnnTouchStart}
            onTouchEnd={handleAnnTouchEnd}
            className="bg-white border border-slate-200/90 border-r-4 border-r-blue-600 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden"
          >
            
              <div
                key={activeAnnouncement.id}
              >
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 max-w-full break-words" dir="auto">
                    {activeAnnouncement.courseRef || activeAnnouncement.categoryNameAr}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeAnnouncement.timeAgo}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug break-words text-right" dir="auto">
                  تنبيه
                </h3>
                <p className="text-[15px] text-slate-700 leading-8 break-words text-right" dir="auto">
                  {activeAnnouncement.content}
                </p>

                {(activeAnnouncement.linkUrl || activeAnnouncement.attachmentUrl) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-start gap-2 flex-wrap">
                    {activeAnnouncement.linkUrl && (
                      <button
                        type="button"
                        onClick={() => setConfirmState({
                          isOpen: true,
                          title: 'فتح الرابط',
                          message: 'سيتم فتح الرابط خارج التطبيق. هل تريد المتابعة؟',
                          type: 'link',
                          onConfirm: () => window.open(activeAnnouncement.linkUrl!, '_blank', 'noopener,noreferrer'),
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold"
                      >
                        <ExternalLink size={15} />
                        عرض الرابط
                      </button>
                    )}
                    {activeAnnouncement.attachmentUrl && (
                      <button
                        type="button"
                        onClick={() => setConfirmState({
                          isOpen: true,
                          title: 'فتح المرفق',
                          message: `سيتم فتح ${activeAnnouncement.attachmentName || 'الملف'} خارج التطبيق. هل تريد المتابعة؟`,
                          type: 'download',
                          onConfirm: () => window.open(activeAnnouncement.attachmentUrl!, '_blank', 'noopener,noreferrer'),
                        })}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold"
                      >
                        <Download size={15} />
                        تحميل الملف
                      </button>
                    )}
                  </div>
                )}
              </div>
            

            {/* Dots indicator */}
            {activeAnnouncements.length > 1 && (
              <div className="flex items-center justify-center pt-3 mt-3 border-t border-slate-100 gap-1.5">
                {activeAnnouncements.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentAnnIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentAnnIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'
                    }`}
                    aria-label={`تنبيه ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section id="home-announcements-section" aria-label="التنبيهات" data-no-swipe="true">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">التنبيهات</span>
          </div>
          <EmptyState compact icon="inbox" title="لا توجد تنبيهات جديدة حاليًا" description="ستظهر هنا أحدث إعلانات الكلية والتحديثات عند نشرها" />
        </section>
      )}

      {/* SECTION 2: UPCOMING DEADLINES / DATES (أقرب المواعيد والتسليمات - بنفس شكل التنبيهات) */}
      {nearestDates.length > 0 && activeDate ? (
        <section id="home-upcoming-dates-section" aria-label="أقرب التسليمات والمواعيد">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">أقرب التسليمات والمواعيد</span>
            <button
              type="button"
              id="view-all-dates-button"
              onClick={onNavigateToDates}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>عرض كل المواعيد</span>
              <ArrowLeft size={14} />
            </button>
          </div>

          <div
            id="dates-carousel-card"
            onTouchStart={handleDateTouchStart}
            onTouchEnd={handleDateTouchEnd}
            className="bg-white border border-slate-200/90 border-r-4 border-r-blue-600 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all relative overflow-hidden"
          >
            
              <div
                key={activeDate.id}
              >
                {/* Top bar with course badge and remaining time badge */}
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 max-w-full break-words" dir="auto">
                    {activeDate.course}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                      activeDate.daysUntil <= 3
                        ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
                    }`}
                  >
                    {activeDate.remainingTimeAr}
                  </span>
                </div>

                {/* Event Name */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5 leading-snug break-words text-right" dir="auto">
                  {activeDate.eventName}
                </h3>

                {/* Event Date & Details */}
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="inline-flex items-center gap-1.5 font-medium">
                    <Calendar size={15} className="text-slate-400 shrink-0" />
                    <span>{formatDeadline(activeDate.date, activeDate.displayDateAr)}</span>
                  </div>
                  {activeDate.time && (
                    <div className="inline-flex items-center gap-1.5 font-medium">
                      <Clock size={15} className="text-slate-400 shrink-0" />
                      <span>{activeDate.time}</span>
                    </div>
                  )}
                </div>

                {activeDate.notes && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 break-words text-right" dir="auto">
                    {activeDate.notes}
                  </p>
                )}
              </div>
            

            {/* Dots indicator for dates */}
            {nearestDates.length > 1 && (
              <div className="flex items-center justify-center pt-3 mt-3 border-t border-slate-100 gap-1.5">
                {nearestDates.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentDateIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === currentDateIndex ? 'w-5 bg-blue-600' : 'w-1.5 bg-slate-200'
                    }`}
                    aria-label={`موعد ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section id="home-upcoming-dates-section" aria-label="أقرب التسليمات والمواعيد">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-bold text-slate-700">أقرب التسليمات والمواعيد</span>
          </div>
          <EmptyState compact icon="tasks" title="لا توجد تسليمات أو مواعيد قريبة" description="أنت حاليًا بدون استحقاقات مسجلة، وسنظهرها هنا فور إضافتها" />
        </section>
      )}

      {/* SECTION 3: UNIVERSITY PLATFORMS & OFFICIAL BYLAW */}
      <section id="home-platforms-section" aria-label="المنصات الجامعية واللوائح">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-sm font-bold text-slate-700">المنصات الجامعية واللوائح الرسمية</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* منصة ابن الهيثم */}
          <button
            type="button"
            id="link-ibn-alhaytham"
            onClick={() =>
              setConfirmState({
                isOpen: true,
                title: 'الانتقال إلى منصة ابن الهيثم',
                message: 'هل تريد فتح منصة ابن الهيثم لشؤون الطلاب والنتائج؟',
                type: 'link',
                onConfirm: () =>
                  window.open('https://stdch.menofia.education/static/index.html', '_blank', 'noopener,noreferrer'),
              })
            }
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-teal-500 rounded-2xl hover:border-teal-300 hover:shadow-xs transition-all text-right w-full cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  منصة ابن الهيثم
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  شؤون الطلاب والنتائج والتسجيل
                </p>
              </div>
            </div>
            <div className="p-1.5 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0 mr-2">
              <ExternalLink size={18} />
            </div>
          </button>

          {/* منصة الكتب الإلكترونية */}
          <button
            type="button"
            id="link-ebooks-platform"
            onClick={() =>
              setConfirmState({
                isOpen: true,
                title: 'الانتقال إلى منصة الكتب',
                message: 'هل تريد فتح منصة الكتب الجامعية والمقررات الرقمية؟',
                type: 'link',
                onConfirm: () =>
                  window.open('https://menofia.education/login/index.php', '_blank', 'noopener,noreferrer'),
              })
            }
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-indigo-500 rounded-2xl hover:border-indigo-300 hover:shadow-xs transition-all text-right w-full cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                  منصة الكتب الجامعية
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  الكتاب الجامعي والمقررات الرقمية
                </p>
              </div>
            </div>
            <div className="p-1.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 mr-2">
              <ExternalLink size={18} />
            </div>
          </button>

          {/* لائحة منوف PDF */}
          <div
            id="btn-menouf-bylaw-pdf"
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-rose-500 rounded-2xl hover:border-rose-300 hover:shadow-xs transition-all text-right w-full sm:col-span-2"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                    لائحة هندسة منوف
                  </h4>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-md">
                    PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  اللائحة الداخلية ونظام الساعات المعتمدة والتخرج
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="p-2.5 bg-slate-100 text-slate-300 rounded-xl border border-slate-200 transition-all shrink-0 flex items-center justify-center cursor-not-allowed shadow-2xs"
              aria-label="لائحة منوف غير متاحة حاليًا"
              title="لائحة منوف غير متاحة حاليًا"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Announcements Full Modal */}
      <AllAnnouncementsModal
        isOpen={isAnnModalOpen}
        onClose={() => setIsAnnModalOpen(false)}
        announcements={activeAnnouncements}
      />

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        onConfirm={confirmState.onConfirm}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
});

HomeView.displayName = 'HomeView';
