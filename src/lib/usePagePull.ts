import { useCallback, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

function scrollMetrics() {
  const element = document.scrollingElement ?? document.documentElement;
  const top = window.scrollY || element.scrollTop || 0;
  const max = Math.max(0, element.scrollHeight - window.innerHeight);
  return { top, max };
}

function ignoredTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('button, input, textarea, a, select, [data-no-swipe], .overflow-x-auto, [role="tablist"], .scrollable, .no-swipe, [data-modal-content]'));
}

export function usePagePull(onRefresh?: () => void, refreshing = false) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const edge = useRef<'top' | 'bottom' | null>(null);
  const pulling = useRef(false);
  const distanceRef = useRef(0);
  const [distance, setDistance] = useState(0);

  const onTouchStart = useCallback((event: TouchEvent) => {
    if (ignoredTarget(event.target) || event.touches.length !== 1) return;
    const { top, max } = scrollMetrics();
    startX.current = event.touches[0].clientX;
    startY.current = event.touches[0].clientY;
    edge.current = top <= 2 ? 'top' : max > 0 && top >= max - 2 ? 'bottom' : null;
    pulling.current = false;
  }, []);

  const onTouchMove = useCallback((event: TouchEvent) => {
    if (startX.current === null || startY.current === null || !edge.current || refreshing) return;
    if (ignoredTarget(event.target)) return;
    const dx = event.touches[0].clientX - startX.current;
    const dy = event.touches[0].clientY - startY.current;
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(dy) < 4) return;
    const outward = edge.current === 'top' ? dy > 0 : dy < 0;
    if (!outward) return;
    event.preventDefault();
    pulling.current = true;
    const resistance = Math.min(112, Math.abs(dy) * 0.42);
    distanceRef.current = resistance;
    setDistance(edge.current === 'top' ? resistance : -resistance);
  }, [refreshing]);

  const reset = useCallback(() => {
    const shouldRefresh = edge.current === 'top' && distanceRef.current >= 50 && pulling.current && !refreshing;
    startX.current = null;
    startY.current = null;
    edge.current = null;
    pulling.current = false;
    distanceRef.current = 0;
    setDistance(0);
    if (shouldRefresh) onRefresh?.();
  }, [onRefresh, refreshing]);

  return { distance, onTouchStart, onTouchMove, onTouchEnd: reset, onTouchCancel: reset };
}
