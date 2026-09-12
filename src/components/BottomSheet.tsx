import React, { useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  id?: string;
  maxWidthClass?: string; // e.g., 'max-w-md' or 'max-w-lg'
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = memo(({
  isOpen,
  onClose,
  children,
  id = 'app-bottom-sheet',
  maxWidthClass = 'max-w-md',
  showHandle = true,
}) => {
  // Trigger haptic when opening
  useEffect(() => {
    if (isOpen) {
      triggerHaptic('light');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        triggerHaptic('light');
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // If pulled down sufficiently or flicked downwards
      if (info.offset.y > 100 || info.velocity.y > 500) {
        triggerHaptic('medium');
        onClose();
      }
    },
    [onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        triggerHaptic('light');
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id={id}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden"
          dir="rtl"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-colors"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                type: 'spring',
                damping: 34,
                stiffness: 420,
                mass: 0.85,
              },
            }}
            exit={{
              y: '100%',
              opacity: 0,
              transition: {
                duration: 0.22,
                ease: [0.32, 0, 0.67, 0],
              },
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.65 }}
            dragSnapToOrigin
            onDragEnd={handleDragEnd}
            className={`relative z-10 w-full ${maxWidthClass} bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[86vh]`}
          >
            {/* Top Drag Handle Indicator */}
            {showHandle && (
              <div className="w-full pt-3 pb-1 flex justify-center items-center cursor-grab active:cursor-grabbing select-none shrink-0">
                <div className="w-12 h-1.5 rounded-full bg-slate-300" />
              </div>
            )}

            {/* Inner Content Slot */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

BottomSheet.displayName = 'BottomSheet';
