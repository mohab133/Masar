import React, { useEffect, useRef, useState } from 'react';
import { TabType } from './types';
import { useMasarData } from './lib/useMasarData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScheduleView } from './components/ScheduleView';
import { CoursesView } from './components/CoursesView';
import { DatesView } from './components/DatesView';
import { FeedbackModal } from './components/FeedbackModal';
import { AllAnnouncementsModal } from './components/AllAnnouncementsModal';
import { initializePushNotifications } from './lib/pushNotifications';
import { clearNotificationsUnread, hasUnreadNotifications as getHasUnreadNotifications, subscribeToUnreadNotifications } from './lib/notificationCenter';

const TAB_ORDER: TabType[] = ['home', 'schedule', 'courses', 'dates'];

export default function App() {
  const { data, isLoading, isRefreshing, error, refresh } = useMasarData();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(() => getHasUnreadNotifications());

  useEffect(() => {
    // Notification permission is optional and must not compete with the first data load.
    if (!isLoading) void initializePushNotifications();
    return subscribeToUnreadNotifications(setHasUnreadNotifications);
  }, [isLoading]);

  // Touch gesture references for main page swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);
  const pullStartY = useRef<number | null>(null);
  const pullStartX = useRef<number | null>(null);
  const isPulling = useRef<boolean>(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);

  const getPageScrollTop = () =>
    Math.max(
      window.scrollY || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0
    );

  const handlePullTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      getPageScrollTop() > 2 ||
      target?.closest('button, input, textarea, a, select, [data-no-swipe], .overflow-x-auto, [role="tablist"], #course-detail-view, .scrollable, .no-swipe')
    ) {
      pullStartY.current = null;
      pullStartX.current = null;
      isPulling.current = false;
      return;
    }

    pullStartY.current = e.touches[0].clientY;
    pullStartX.current = e.touches[0].clientX;
    isPulling.current = false;
  };

  const handlePullTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current === null || pullStartX.current === null || isRefreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    const dx = e.touches[0].clientX - pullStartX.current;

    if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) return;
    if (getPageScrollTop() > 2) return;

    isPulling.current = true;
    const distance = Math.min(80, dy * 0.6);
    pullDistanceRef.current = distance;
    setPullDistance(distance);
  };

  const handlePullTouchEnd = () => {
    const shouldRefresh = isPulling.current && pullDistanceRef.current >= 48 && !isRefreshing;
    pullStartY.current = null;
    pullStartX.current = null;
    isPulling.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
    if (shouldRefresh) void refresh(true);
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
  };

  // Touch handlers for mobile swipe between primary tabs ONLY
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    // Strictly ignore swipe if touch originates on interactive elements or scroll areas
    if (
      target?.closest(
        'button, input, textarea, a, select, [data-no-swipe], .overflow-x-auto, [role="tablist"], #course-detail-view, .scrollable, .no-swipe'
      )
    ) {
      isSwiping.current = false;
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;

    // Strict horizontal swipe check: min 60px distance & predominantly horizontal
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);

      // Inverted RTL Navigation:
      // Swiping to the right (deltaX > 0) advances to the next tab in Arabic reading flow
      // Swiping to the left (deltaX < 0) returns to the previous tab
      if (deltaX > 0) {
        if (currentIndex < TAB_ORDER.length - 1) {
          handleTabChange(TAB_ORDER[currentIndex + 1]);
        }
      } else {
        if (currentIndex > 0) {
          handleTabChange(TAB_ORDER[currentIndex - 1]);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-slate-200">
      {/* Mobile Application Container */}
      <div
        className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col shadow-sm relative overflow-x-hidden"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={(e) => { handleTouchStart(e); handlePullTouchStart(e); }}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={(e) => { handleTouchEnd(e); handlePullTouchEnd(); }}
      >
        {(pullDistance > 0 || isRefreshing) && !isLoading && (
          <div
            className="fixed left-1/2 z-40 -translate-x-1/2 pointer-events-none"
            style={{ top: `${isRefreshing ? 16 : Math.max(12, pullDistance - 28)}px` }}
            aria-hidden="true"
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
              <div
                className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"
                style={{ transform: `rotate(${pullDistance * 4}deg)` }}
              />
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center px-8 text-center" dir="rtl">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            <p className="mt-4 text-sm font-semibold text-slate-700">جارٍ تحميل بيانات التطبيق...</p>
            <p className="mt-1 text-xs text-slate-400">يتم الاتصال بالخادم، لحظة واحدة</p>
          </div>
        )}

        {!isLoading && error && data.courses.length === 0 && data.schedule.length === 0 && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center px-8 text-center" dir="rtl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg font-bold">!</div>
            <p className="mt-4 text-sm font-bold text-slate-800">تعذر تحميل البيانات</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">تأكد من اتصال الإنترنت وحاول مرة أخرى.</p>
            <button type="button" onClick={() => void refresh(true)} className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold active:scale-95 transition-transform">إعادة المحاولة</button>
          </div>
        )}

        {/* Main Application Header */}
        <Header
          onOpenFeedback={() => setIsFeedbackOpen(true)}
          onOpenNotifications={() => {
            clearNotificationsUnread();
            setIsNotificationsOpen(true);
          }}
          hasUnreadNotifications={hasUnreadNotifications}
        />

        {/* Main screen content. Lightweight 150ms transition keeps navigation smooth without heavy JS animation. */}
        <main className="flex-1 px-4.5 pt-24 relative">
          <div key={activeTab} className="w-full tab-page-enter" aria-live="polite">
              {activeTab === 'home' && (
                <HomeView
                  upcomingDates={data.dates}
                  onNavigateToDates={() => handleTabChange('dates')}
                  appAssets={data.appAssets}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleView
                  scheduleEvents={data.schedule}
                  officialSchedules={data.officialSchedules}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesView courses={data.courses} />
              )}

              {activeTab === 'dates' && (
                <DatesView events={data.dates} officialSchedules={data.officialSchedules} />
              )}
          </div>
        </main>

        {/* Bottom Navigation with animated active pill */}
        <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

        {/* In-app Notification Center */}
        <AllAnnouncementsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          announcements={data.announcements.filter((announcement) => announcement.status === 'active')}
        />

        {/* Global Feedback Sheet / Modal */}
        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      </div>
    </div>
  );
}
