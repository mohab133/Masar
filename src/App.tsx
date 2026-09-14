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
  const { data } = useMasarData();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(() => getHasUnreadNotifications());

  useEffect(() => {
    void initializePushNotifications();
    return subscribeToUnreadNotifications(setHasUnreadNotifications);
  }, []);

  // Touch gesture references for main page swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
