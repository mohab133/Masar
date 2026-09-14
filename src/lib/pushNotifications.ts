import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const REGISTER_DELAY_MS = 800;
// Enable only in builds that include android/app/google-services.json.
// Calling FCM registration without Firebase configuration can terminate the
// Android process immediately after notification permission is granted.
const PUSH_NOTIFICATIONS_ENABLED = import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true';
const PUSH_REGISTRATION_ENABLED = import.meta.env.VITE_ENABLE_PUSH_REGISTRATION === 'true';

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
    },
  );

  listenersRegistered = true;
}

async function initializePushNotificationsInternal(): Promise<void> {
  if (!PUSH_NOTIFICATIONS_ENABLED || !Capacitor.isNativePlatform()) return;

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

    // Permission can be requested safely even when Firebase is not configured.
    // Native FCM registration is kept behind a separate flag because a missing
    // google-services.json can terminate the Android process during register().
    if (!PUSH_REGISTRATION_ENABLED) {
      console.info('Masar: notification permission granted; FCM registration is disabled until Firebase is configured.');
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
