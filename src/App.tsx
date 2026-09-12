import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TabType } from './types';
import {
  SAMPLE_ANNOUNCEMENTS,
  UPCOMING_DATES,
  SCHEDULE_EVENTS,
  SAMPLE_COURSES,
} from './data/sampleData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { ScheduleView } from './components/ScheduleView';
import { CoursesView } from './components/CoursesView';
import { DatesView } from './components/DatesView';
import { OfflineIndicator } from './components/OfflineIndicator';

const TAB_ORDER: TabType[] = ['home', 'schedule', 'courses', 'dates'];

// Page slide animation with responsive spring physics matching RTL direction
const pageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? -20 : 20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: 'spring', stiffness: 550, damping: 38, mass: 0.8 },
      opacity: { duration: 0.14, ease: 'easeOut' },
    },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? 16 : -16,
    opacity: 0,
    transition: {
      x: { type: 'spring', stiffness: 550, damping: 38, mass: 0.8 },
      opacity: { duration: 0.08, ease: 'easeIn' },
    },
  }),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [direction, setDirection] = useState<number>(1);

  // Touch gesture references for main page swipe
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);

  const handleTabChange = (newTab: TabType, explicitDir?: number) => {
    if (newTab === activeTab) return;
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = TAB_ORDER.indexOf(newTab);
    const dir = explicitDir !== undefined ? explicitDir : (newIndex > currentIndex ? 1 : -1);
    setDirection(dir);
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
          handleTabChange(TAB_ORDER[currentIndex + 1], 1);
        }
      } else {
        if (currentIndex > 0) {
          handleTabChange(TAB_ORDER[currentIndex - 1], -1);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-blue-100">
      {/* Mobile Application Container */}
      <div
        className="w-full max-w-md min-h-screen bg-[#f8fafc] flex flex-col shadow-xl relative overflow-x-hidden border-x border-slate-200"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Connection state notifier */}
        <OfflineIndicator />

        {/* Main Application Header */}
        <Header />

        {/* Dynamic Screen Views with smooth directional slide animations */}
        <main className="flex-1 px-4.5 pt-3.5 relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={activeTab}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {activeTab === 'home' && (
                <HomeView
                  announcements={SAMPLE_ANNOUNCEMENTS}
                  upcomingDates={UPCOMING_DATES}
                  onNavigateToDates={() => handleTabChange('dates', 1)}
                />
              )}

              {activeTab === 'schedule' && (
                <ScheduleView
                  scheduleEvents={SCHEDULE_EVENTS}
                />
              )}

              {activeTab === 'courses' && (
                <CoursesView courses={SAMPLE_COURSES} />
              )}

              {activeTab === 'dates' && (
                <DatesView events={UPCOMING_DATES} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation with animated active pill */}
        <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />
      </div>
    </div>
  );
}
