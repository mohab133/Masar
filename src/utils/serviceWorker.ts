import { Capacitor } from '@capacitor/core';

export function registerWebServiceWorker(): void {
  if (Capacitor.isNativePlatform() || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Masar: Service Worker registration failed.', error);
    });
  }, { once: true });
}
