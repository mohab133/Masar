import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from './masarApi';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { markNotificationsUnread, requestOpenNotifications } from './notificationCenter';

const REGISTER_DELAY_MS = 800;
// Firebase is configured in android/app/google-services.json. Keep registration
// enabled by default; it can still be disabled explicitly for a build with
// VITE_ENABLE_PUSH_NOTIFICATIONS=false.
const PUSH_NOTIFICATIONS_ENABLED = import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS !== 'false';

let initializationPromise: Promise<void> | null = null;
let listenersRegistered = false;
let registrationTimer: number | null = null;

async function registerToken(token: string): Promise<void> {
  if (!API_BASE_URL || !token) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
    });

    if (!response.ok) {
      console.warn(`Masar: push token registration returned ${response.status}`);
    }
  } catch (error) {
    console.warn('Masar: could not register push token', error);
  }
}

async function registerListeners(): Promise<void> {
  if (listenersRegistered) return;

  await PushNotifications.addListener('registration', (token: Token) => {
    void registerToken(token.value);
  });

  await PushNotifications.addListener('registrationError', (error) => {
    console.warn('Masar push registration error', error);
  });

  await PushNotifications.addListener(
    'pushNotificationReceived',
    async (notification: PushNotificationSchema) => {
      console.info('Masar notification received in foreground', notification.title);
      markNotificationsUnread();

      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Math.floor(Date.now() % 2147483647),
              title: notification.title || 'Masar',
              body: notification.body || '',
              channelId: 'masar_updates',
            },
          ],
        });
      } catch (error) {
        console.warn('Masar: foreground notification could not be shown.', error);
      }
    },
  );

  await PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.info('Masar notification opened', action.notification.data);
      markNotificationsUnread();
      requestOpenNotifications();
    },
  );

  listenersRegistered = true;
}

async function initializePushNotificationsInternal(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const permission = await PushNotifications.checkPermissions();
    let receive = permission.receive;

    if (receive === 'prompt' || receive === 'prompt-with-rationale') {
      receive = (await PushNotifications.requestPermissions()).receive;
    }

    if (receive !== 'granted') {
      console.info('Masar: notification permission was not granted.');
      return;
    }

    await registerListeners();

    try {
      await PushNotifications.createChannel({
        id: 'masar_updates',
        name: 'تحديثات مسار',
        description: 'إشعارات المواعيد والإعلانات والتحديثات المهمة',
        importance: 5,
        sound: 'default',
        vibration: true,
      });
    } catch {
      // Channel creation is best-effort.
    }

    if (!PUSH_NOTIFICATIONS_ENABLED) {
      console.info('Masar: FCM registration is disabled by build configuration.');
      return;
    }

    if (registrationTimer !== null) {
      window.clearTimeout(registrationTimer);
    }

    registrationTimer = window.setTimeout(() => {
      registrationTimer = null;
      void PushNotifications.register().catch((error) => {
        console.warn('Masar: push registration failed safely.', error);
      });
    }, REGISTER_DELAY_MS);
  } catch (error) {
    // Notifications are optional and must never prevent Masar from opening.
    console.warn('Masar push notifications are not available yet.', error);
  }
}

export function initializePushNotifications(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = initializePushNotificationsInternal();
  }

  return initializationPromise;
}
