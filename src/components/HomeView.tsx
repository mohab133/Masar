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
import { AcademicEvent, AppAsset } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { formatDeadline } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';
import { useDownload } from '../lib/useDownload';

interface HomeViewProps {
  upcomingDates: AcademicEvent[];
  onNavigateToDates: () => void;
  appAssets: AppAsset[];
}

export const HomeView: React.FC<HomeViewProps> = memo(({
  upcomingDates,
  onNavigateToDates,
  appAssets,
}) => {
  // Announcements Carousel State
  const { download } = useDownload();

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

  const nearestDates = useMemo(() => {
    return [...(upcomingDates || [])].filter((event) => event.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6);
  }, [upcomingDates]);

  const activeDate = nearestDates[currentDateIndex] || nearestDates[0];

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

  const handleBylawDownload = useCallback(async () => {
    const bylaw = appAssets.find((asset) => asset.assetKey === 'menouf_bylaw' && asset.fileUrl);
    await download(bylaw?.fileUrl, bylaw?.fileName || 'menouf-bylaw.pdf', 'application/pdf');
  }, [appAssets, download]);

  return (
    <div id="home-screen-view" className="space-y-5 pb-24 pt-1" dir="rtl">
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
            className="bg-white border border-slate-200/90 border-r-4 border-r-blue-600 rounded-2xl p-4 sm:p-5 shadow-2xs smooth-interaction relative overflow-hidden"
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
                    className={`h-1.5 rounded-full smooth-interaction cursor-pointer ${
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
          <EmptyState compact icon="tasks" title="لا توجد تسليمات أو مواعيد قريبة" description="لا توجد لديك حاليًا مواعيد أو تسليمات مسجلة، وستظهر هنا فور إضافتها" />
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
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-teal-500 rounded-2xl hover:border-teal-300 hover:shadow-xs smooth-interaction text-right w-full cursor-pointer"
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
            className="group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-indigo-500 rounded-2xl hover:border-indigo-300 hover:shadow-xs smooth-interaction text-right w-full cursor-pointer"
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
          {(() => {
            const bylaw = appAssets.find((asset) => asset.assetKey === 'menouf_bylaw' && asset.fileUrl);
            return (
              <button
                id="btn-menouf-bylaw-pdf"
                type="button"
                onClick={handleBylawDownload}
                disabled={!bylaw?.fileUrl}
                className={`group flex items-center justify-between p-3.5 bg-white border border-slate-200/90 border-r-4 border-r-blue-500 rounded-2xl hover:border-blue-300 hover:shadow-xs smooth-interaction text-right w-full sm:col-span-2 ${bylaw?.fileUrl ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                aria-label="تحميل لائحة هندسة منوف"
              >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                <FileText size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    لائحة هندسة منوف
                  </h4>
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md">
                    PDF
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                  اللائحة الداخلية ونظام الساعات المعتمدة والتخرج
                </p>
              </div>
            </div>

            <span
              className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 smooth-interaction shrink-0 flex items-center justify-center shadow-2xs group-hover:bg-blue-100 group-hover:border-blue-200 active:scale-95"
              aria-hidden="true"
              title="تحميل اللائحة"
            >
              <Download size={19} strokeWidth={2.2} />
            </span>
              </button>
            );
          })()}
        </div>
      </section>

      {/* Announcements Full Modal */}
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
