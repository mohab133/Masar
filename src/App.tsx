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
import { clearNotificationsUnread, hasUnreadNotifications as getHasUnreadNotifications, subscribeToUnreadNotifications, subscribeToOpenNotificationsRequest } from './lib/notificationCenter';
import { OfflineBanner } from './components/OfflineBanner';
import { DownloadToast } from './components/DownloadToast';
import { useDownload } from './lib/useDownload';
import { elasticProgress, elasticScaleFor, ELASTIC_ENGAGE_THRESHOLD, ELASTIC_SNAP_MS } from './lib/elasticEdge';

const TAB_ORDER: TabType[] = ['home', 'schedule', 'courses', 'dates'];
const GESTURE_EXCLUSION_SELECTOR = 'button, input, textarea, a, select, [data-no-swipe], .overflow-x-auto, [role="tablist"], [role="dialog"], #course-detail-view, .scrollable, .no-swipe';
// Buttons are excluded from horizontal tab-swipe, but NOT from the pull-to-refresh
// gesture: whole sections (like the platforms/bylaw cards) are plain <button>s, so
// excluding "button" here made pulling down from that area do nothing. A real drag
// is still safely told apart from a tap by the existing distance threshold below,
// and handleContentClickCapture already suppresses the click that would otherwise
// fire on the button once a drag is detected.
const PULL_GESTURE_EXCLUSION_SELECTOR = 'input, textarea, a, select, [data-no-swipe], .overflow-x-auto, [role="tablist"], [role="dialog"], #course-detail-view, .scrollable, .no-swipe';

export default function App() {
  const { data, isLoading, isRefreshing, error, refresh } = useMasarData();
  const { message: downloadMessage, error: downloadError, loading: downloadLoading } = useDownload();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(() => getHasUnreadNotifications());

  useEffect(() => {
    // Notification permission is optional and must not compete with the first data load.
    if (!isLoading) void initializePushNotifications();
    return subscribeToUnreadNotifications(setHasUnreadNotifications);
  }, [isLoading]);

  useEffect(() => {
    return subscribeToOpenNotificationsRequest(() => {
      clearNotificationsUnread();
      setIsNotificationsOpen(true);
    });
  }, []);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isSwiping = useRef<boolean>(false);
  const pullStartY = useRef<number | null>(null);
  const pullStartX = useRef<number | null>(null);
  const isPulling = useRef<boolean>(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const pullFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);

  // Live horizontal tracking for the tab swipe, so the page visibly follows the
  // finger instead of only reacting once the gesture ends.
  const [swipeDirection, setSwipeDirection] = useState<'forward' | 'backward'>('forward');
  const [dragOffset, setDragOffset] = useState(0);
  const dragOffsetTargetRef = useRef(0);
  const dragFrameRef = useRef<number | null>(null);
  const isHorizontalDragging = useRef(false);
  const [isSnappingBack, setIsSnappingBack] = useState(false);

  // Elastic "give" for the card content when the page itself is pulled past its
  // top or bottom edge — shares its physics with the notifications list, see
  // lib/elasticEdge.ts and lib/useEdgeStretch.ts.
  const edgeStretchStartY = useRef<number | null>(null);
  const edgeStretchActive = useRef<'top' | 'bottom' | null>(null);
  const edgeStretchRaf = useRef<number | null>(null);
  const edgeStretchTarget = useRef(0);
  const [cardStretch, setCardStretch] = useState(0); // signed: positive = top edge, negative = bottom edge
  const [isCardSnapping, setIsCardSnapping] = useState(false);

  const getPageScrollTop = () => Math.max(
    window.scrollY || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0,
  );

  const getPageScrollBottomGap = () => {
    const doc = document.documentElement;
    const scrollBottom = getPageScrollTop() + window.innerHeight;
    return doc.scrollHeight - scrollBottom;
  };

  const springBackCardStretch = () => {
    if (edgeStretchRaf.current !== null) {
      window.cancelAnimationFrame(edgeStretchRaf.current);
      edgeStretchRaf.current = null;
    }
    setIsCardSnapping(true);
    setCardStretch(0);
    window.setTimeout(() => setIsCardSnapping(false), ELASTIC_SNAP_MS);
  };

  const handleEdgeStretchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest(PULL_GESTURE_EXCLUSION_SELECTOR)) {
      edgeStretchStartY.current = null;
      edgeStretchActive.current = null;
      return;
    }
    edgeStretchStartY.current = e.touches[0].clientY;
    edgeStretchActive.current = null;
    setIsCardSnapping(false);
  };

  const handleEdgeStretchMove = (e: React.TouchEvent) => {
    if (edgeStretchStartY.current === null) return;
    const dy = e.touches[0].clientY - edgeStretchStartY.current;
    const atTop = getPageScrollTop() <= 2;
    const atBottom = getPageScrollBottomGap() <= 2;

    if (!edgeStretchActive.current) {
      if (Math.abs(dy) < ELASTIC_ENGAGE_THRESHOLD) return;
      if (dy > 0 && atTop) edgeStretchActive.current = 'top';
      else if (dy < 0 && atBottom) edgeStretchActive.current = 'bottom';
      else return;
    }

    const stillAtEdge = edgeStretchActive.current === 'top' ? (atTop && dy > 0) : (atBottom && dy < 0);
    if (!stillAtEdge) {
      edgeStretchActive.current = null;
      if (cardStretch !== 0) springBackCardStretch();
      return;
    }

    const sign = edgeStretchActive.current === 'top' ? 1 : -1;
    edgeStretchTarget.current = elasticProgress(dy) * sign;
    if (edgeStretchRaf.current === null) {
      edgeStretchRaf.current = window.requestAnimationFrame(() => {
        edgeStretchRaf.current = null;
        setCardStretch(edgeStretchTarget.current);
      });
    }
  };

  const handleEdgeStretchEnd = () => {
    edgeStretchStartY.current = null;
    const wasActive = edgeStretchActive.current !== null;
    edgeStretchActive.current = null;
    if (wasActive) springBackCardStretch();
  };

  const handlePullTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      getPageScrollTop() > 2 ||
      target?.closest(PULL_GESTURE_EXCLUSION_SELECTOR)
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

    if (dy < 8) return;

    isPulling.current = true;
    suppressClickRef.current = true;
    const distance = Math.min(72, Math.max(0, (dy - 8) * 0.52));
    pullDistanceRef.current = distance;
    if (pullFrameRef.current === null) {
      pullFrameRef.current = window.requestAnimationFrame(() => {
        pullFrameRef.current = null;
        setPullDistance(pullDistanceRef.current);
      });
    }
  };

  const handlePullTouchEnd = () => {
    const shouldRefresh = isPulling.current && pullDistanceRef.current >= 48 && !isRefreshing;
    pullStartY.current = null;
    pullStartX.current = null;
    isPulling.current = false;
    pullDistanceRef.current = 0;
    if (pullFrameRef.current !== null) {
      window.cancelAnimationFrame(pullFrameRef.current);
      pullFrameRef.current = null;
    }
    setPullDistance(0);
    if (shouldRefresh) void refresh(true);
    else suppressClickRef.current = false;
  };

  const handleContentClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const newIndex = TAB_ORDER.indexOf(newTab);
    setSwipeDirection(newIndex > currentIndex ? 'forward' : 'backward');
    setActiveTab(newTab);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement | null;
    if (
      target?.closest(GESTURE_EXCLUSION_SELECTOR)
    ) {
      isSwiping.current = false;
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
    isHorizontalDragging.current = false;
    setIsSnappingBack(false);
  };

  // Tracks the finger during a horizontal swipe and moves the current page
  // with it in real time (with light rubber-band resistance at the first/last tab).
  const handleSwipeTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || touchStartX.current === null || touchStartY.current === null) return;
    if (isPulling.current || isRefreshing) return;

    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isHorizontalDragging.current) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.2) {
        // Vertical intent — leave it to native scrolling.
        isSwiping.current = false;
        return;
      }
      isHorizontalDragging.current = true;
    }

    const currentIndex = TAB_ORDER.indexOf(activeTab);
    const atForwardEdge = currentIndex === TAB_ORDER.length - 1;
    const atBackwardEdge = currentIndex === 0;
    let offset = dx;
    if ((dx > 0 && atForwardEdge) || (dx < 0 && atBackwardEdge)) {
      offset = dx * 0.35;
    }
    offset = Math.max(-110, Math.min(110, offset));
    dragOffsetTargetRef.current = offset;
    if (dragFrameRef.current === null) {
      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        setDragOffset(dragOffsetTargetRef.current);
      });
    }
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

    const wasDragging = isHorizontalDragging.current;
    isHorizontalDragging.current = false;
    if (wasDragging && dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }

    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);

      if (deltaX > 0) {
        if (currentIndex < TAB_ORDER.length - 1) {
          setDragOffset(0);
          handleTabChange(TAB_ORDER[currentIndex + 1]);
          return;
        }
      } else {
        if (currentIndex > 0) {
          setDragOffset(0);
          handleTabChange(TAB_ORDER[currentIndex - 1]);
          return;
        }
      }
    }

    if (wasDragging) {
      setIsSnappingBack(true);
      setDragOffset(0);
      window.setTimeout(() => setIsSnappingBack(false), 200);
    }
  };

  const handleSwipeTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
    isSwiping.current = false;
    if (isHorizontalDragging.current) {
      isHorizontalDragging.current = false;
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      setIsSnappingBack(true);
      setDragOffset(0);
      window.setTimeout(() => setIsSnappingBack(false), 200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center text-slate-900 selection:bg-slate-200">
      <div
        className="w-full max-w-md md:max-w-3xl min-h-screen bg-slate-50 flex flex-col shadow-sm relative"
        style={{ overflowX: 'clip' }}
      >
        {(pullDistance > 0 || isRefreshing) && !isLoading && (
          <div
            className={`fixed left-1/2 z-40 pointer-events-none ${pullDistance > 0 ? '' : 'refresh-indicator-return'}`}
            style={{
              top: 'calc(env(safe-area-inset-top) + 88px)',
              opacity: isRefreshing ? 1 : Math.min(1, pullDistance / 28),
              transform: `translate(-50%, ${isRefreshing ? 0 : Math.min(54, pullDistance * 0.56)}px)`,
            }}
            aria-hidden="true"
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center">
              {isRefreshing ? (
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
              ) : (
                <div
                  className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-blue-600"
                  style={{ transform: `rotate(${Math.min(180, pullDistance * 3.75)}deg)` }}
                />
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center px-8 text-center" dir="rtl">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
            <p className="mt-4 text-sm font-semibold text-slate-700">جارٍ تحميل بيانات التطبيق...</p>
            <p className="mt-1 text-xs text-slate-500">يتم الاتصال بالخادم، لحظة واحدة</p>
          </div>
        )}

        {!isLoading && error && data.courses.length === 0 && data.schedule.length === 0 && (
          <div className="absolute inset-0 z-30 bg-slate-50 flex flex-col items-center justify-center px-8 text-center" dir="rtl">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-lg font-bold">!</div>
            <p className="mt-4 text-sm font-bold text-slate-800">تعذر تحميل البيانات</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{error}</p>
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

        <main
          className="flex-1 px-4 md:px-6 pt-28 relative"
          style={{ touchAction: 'pan-y', overscrollBehaviorY: 'contain' }}
          onTouchStart={(e) => { handleTouchStart(e); handlePullTouchStart(e); handleEdgeStretchStart(e); }}
          onTouchMove={(e) => { handlePullTouchMove(e); handleSwipeTouchMove(e); handleEdgeStretchMove(e); }}
          onTouchEnd={(e) => { handleTouchEnd(e); handlePullTouchEnd(); handleEdgeStretchEnd(); }}
          onTouchCancel={(e) => { handleSwipeTouchCancel(); handlePullTouchEnd(); handleEdgeStretchEnd(); }}
          onClickCapture={handleContentClickCapture}
        >
          <OfflineBanner />
          {isRefreshing && (
            <div
              className="absolute inset-0 z-20 bg-transparent"
              aria-hidden="true"
            />
          )}
          <div
            key={activeTab}
            className={`w-full ${swipeDirection === 'forward' ? 'tab-slide-forward-enter' : 'tab-slide-backward-enter'} ${(isSnappingBack || isCardSnapping) ? 'transition-transform duration-[220ms] ease-out' : ''}`}
            style={{
              transform: `translate3d(${dragOffset}px, 0, 0) scale(${elasticScaleFor(Math.abs(cardStretch))})`,
              transformOrigin: cardStretch >= 0 ? 'top center' : 'bottom center',
            }}
            aria-live="polite"
          >
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

        <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

        <DownloadToast message={downloadMessage} error={downloadError} loading={downloadLoading} />

        <AllAnnouncementsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          announcements={data.announcements.filter((announcement) => announcement.status === 'active')}
        />

        <FeedbackModal
          isOpen={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
      </div>
    </div>
  );
}
