import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-40 bg-amber-500 text-white px-3.5 py-1.5 shadow-sm text-xs flex items-center justify-between gap-2"
          dir="rtl"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <WifiOff size={14} className="shrink-0 animate-pulse text-amber-100" />
            <span>وضع عدم الاتصال — كافة الجداول والمواد متاحة للعمل دون إنترنت</span>
          </div>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          key="reconnected-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-40 bg-emerald-600 text-white px-3.5 py-1.5 shadow-sm text-xs flex items-center justify-center gap-1.5 font-medium"
          dir="rtl"
        >
          <Wifi size={14} className="shrink-0 text-emerald-100" />
          <span>تمت استعادة الاتصال بالإنترنت</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
