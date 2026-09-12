import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

export const setupNativeAppearance = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch {
      // Ignore if not supported
    }
  }
};

export const hideSplashScreen = async (): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      await SplashScreen.hide();
    } catch {
      // Ignore
    }
  }
};

export const initNativeApp = async (): Promise<void> => {
  await hideSplashScreen();
  await setupNativeAppearance();
};

