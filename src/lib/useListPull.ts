import { useCallback, useRef, useState, type CSSProperties, type TouchEvent } from 'react';

const ENGAGE_THRESHOLD = 8;
const RESISTANCE = 0.42;
const MAX_OFFSET = 34;
const SNAP_MS = 220;

export function useListPull<T extends HTMLElement>() {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const [offsetY, setOffsetY] = useState(0);
  const [isReturning, setIsReturning] = useState(false);

  const onTouchStart = useCallback((event: TouchEvent<T>) => {
    if (event.touches.length !== 1) return;
    startX.current = event.touches[0].clientX;
    startY.current = event.touches[0].clientY;
    dragging.current = false;
    setIsReturning(false);
  }, []);

  const onTouchMove = useCallback((event: TouchEvent<T>) => {
    if (startX.current === null || startY.current === null || event.touches.length !== 1) return;
    const dx = event.touches[0].clientX - startX.current;
    const dy = event.touches[0].clientY - startY.current;
    if (!dragging.current) {
      if (Math.abs(dy) < ENGAGE_THRESHOLD || Math.abs(dx) > Math.abs(dy)) return;
      dragging.current = true;
    }
    setOffsetY(Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy * RESISTANCE)));
  }, []);

  const returnToRest = useCallback(() => {
    startX.current = null;
    startY.current = null;
    if (!dragging.current && offsetY === 0) return;
    dragging.current = false;
    setIsReturning(true);
    setOffsetY(0);
    window.setTimeout(() => setIsReturning(false), SNAP_MS);
  }, [offsetY]);

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd: returnToRest,
      onTouchCancel: returnToRest,
    },
    contentStyle: {
      transform: `translate3d(0, ${offsetY}px, 0)`,
      transition: isReturning ? `transform ${SNAP_MS}ms cubic-bezier(0.16, 1, 0.3, 1)` : 'none',
      willChange: offsetY !== 0 || isReturning ? 'transform' : undefined,
    } as CSSProperties,
  };
}
