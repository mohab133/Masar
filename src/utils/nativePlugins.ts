import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

async function setupStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.show();
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
  } catch (error) {
    console.warn('Masar: native status bar setup failed.', error);
  }
}

export async function hideSplashScreen(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('Masar: splash screen could not be hidden.', error);
  }
}

export async function initNativeApp(): Promise<void> {
  await setupStatusBar();
  await hideSplashScreen();
}
