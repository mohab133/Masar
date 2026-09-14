import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Triggers safe haptic feedback across native Android/Capacitor and fallback Web environments
 */
export const triggerHaptic = async (
  type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' = 'light'
): Promise<void> => {
  try {
    if (type === 'selection') {
      await Haptics.selectionChanged();
    } else if (type === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (type === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else {
      const style =
        type === 'heavy'
          ? ImpactStyle.Heavy
          : type === 'medium'
          ? ImpactStyle.Medium
          : ImpactStyle.Light;
      await Haptics.impact({ style });
    }
  } catch {
    // Fallback for Web browsers / PWA
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        if (type === 'selection') navigator.vibrate(4);
        else if (type === 'light') navigator.vibrate(8);
        else if (type === 'medium') navigator.vibrate(18);
        else if (type === 'heavy') navigator.vibrate(28);
        else if (type === 'success') navigator.vibrate([12, 35, 12]);
        else if (type === 'warning') navigator.vibrate([20, 20, 20]);
      } catch {
        // Ignore vibration errors
      }
    }
  }
};
