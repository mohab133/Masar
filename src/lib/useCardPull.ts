import { useCallback, useRef, useState, type CSSProperties, type TouchEvent } from 'react';
import { ELASTIC_ENGAGE_THRESHOLD, ELASTIC_PULL_CAP, ELASTIC_RESISTANCE, ELASTIC_SNAP_EASE, ELASTIC_SNAP_MS } from './elasticEdge';

const MAX_OFFSET = ELASTIC_PULL_CAP * 0.42;

export function useCardPull() {
  const startY = useRef<number | null>(null);
  const startX = useRef<number | null>(null);
  const dragging = useRef(false);
  const [offsetY, setOffsetY] = useState(0);
  const [isReturning, setIsReturning] = useState(false);

  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) return;
    startY.current = event.touches[0].clientY;
    startX.current = event.touches[0].clientX;
    dragging.current = false;
    setIsReturning(false);
  }, []);

  const onTouchMove = useCallback((event: TouchEvent<HTMLElement>) => {
    if (startY.current === null || startX.current === null || event.touches.length !== 1) return;
    const deltaY = event.touches[0].clientY - startY.current;
    const deltaX = event.touches[0].clientX - startX.current;
    if (!dragging.current) {
      if (Math.abs(deltaY) < ELASTIC_ENGAGE_THRESHOLD || Math.abs(deltaX) > Math.abs(deltaY)) return;
      dragging.current = true;
    }
    const resisted = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, deltaY * ELASTIC_RESISTANCE));
    setOffsetY(resisted);
  }, []);

  const returnToRest = useCallback(() => {
    startY.current = null;
    startX.current = null;
    if (!dragging.current && offsetY === 0) return;
    dragging.current = false;
    setIsReturning(true);
    setOffsetY(0);
    window.setTimeout(() => setIsReturning(false), ELASTIC_SNAP_MS);
  }, [offsetY]);

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd: returnToRest, onTouchCancel: returnToRest },
    style: {
      transform: `translate3d(0, ${offsetY}px, 0)`,
      transition: isReturning ? `transform ${ELASTIC_SNAP_MS}ms ${ELASTIC_SNAP_EASE}` : 'none',
      willChange: offsetY !== 0 || isReturning ? 'transform' : undefined,
    } as CSSProperties,
  };
}
