import { useRef, useState } from 'react';
import type { TouchEvent as ReactTouchEvent, CSSProperties } from 'react';
import {
  elasticProgress,
  elasticScaleFor,
  ELASTIC_ENGAGE_THRESHOLD,
  ELASTIC_SNAP_MS,
  ELASTIC_SNAP_EASE,
} from './elasticEdge';

/**
 * Attach `scrollRef` to the scrollable element and spread `handlers` onto it.
 * Apply `contentStyle` to the element that should visually stretch (can be the
 * same element, or an inner wrapper around its content).
 */
export function useEdgeStretch<T extends HTMLElement>() {
  const scrollRef = useRef<T | null>(null);
  const startY = useRef<number | null>(null);
  const activeEdge = useRef<'top' | 'bottom' | null>(null);
  const rafId = useRef<number | null>(null);
  const targetProgress = useRef(0);
  const [progress, setProgress] = useState(0); // signed: positive = top edge, negative = bottom edge
  const [isSnapping, setIsSnapping] = useState(false);

  const springBack = () => {
    if (rafId.current !== null) {
      window.cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setIsSnapping(true);
    setProgress(0);
    window.setTimeout(() => setIsSnapping(false), ELASTIC_SNAP_MS);
  };

  const onTouchStart = (e: ReactTouchEvent) => {
    startY.current = e.touches[0].clientY;
    activeEdge.current = null;
    setIsSnapping(false);
  };

  const onTouchMove = (e: ReactTouchEvent) => {
    const el = scrollRef.current;
    if (!el || startY.current === null) return;

    const dy = e.touches[0].clientY - startY.current;
    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    if (!activeEdge.current) {
      if (Math.abs(dy) < ELASTIC_ENGAGE_THRESHOLD) return;
      if (dy > 0 && atTop) activeEdge.current = 'top';
      else if (dy < 0 && atBottom) activeEdge.current = 'bottom';
      else return; // normal scroll — let the browser handle it
    }

    const stillAtEdge = activeEdge.current === 'top' ? atTop && dy > 0 : atBottom && dy < 0;
    if (!stillAtEdge) {
      activeEdge.current = null;
      if (progress !== 0) springBack();
      return;
    }

    const sign = activeEdge.current === 'top' ? 1 : -1;
    targetProgress.current = elasticProgress(dy) * sign;
    if (rafId.current === null) {
      rafId.current = window.requestAnimationFrame(() => {
        rafId.current = null;
        setProgress(targetProgress.current);
      });
    }
  };

  const onTouchEnd = () => {
    startY.current = null;
    const wasActive = activeEdge.current !== null;
    activeEdge.current = null;
    if (wasActive) springBack();
  };

  const scale = elasticScaleFor(Math.abs(progress));
  const contentStyle: CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: progress >= 0 ? 'top center' : 'bottom center',
    transition: isSnapping ? `transform ${ELASTIC_SNAP_MS}ms ${ELASTIC_SNAP_EASE}` : undefined,
  };

  return {
    scrollRef,
    contentStyle,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
  };
}
