const UNREAD_KEY = 'masar_notifications_unread';
const EVENT_NAME = 'masar:notifications-unread-changed';
const OPEN_REQUEST_EVENT = 'masar:open-notifications-requested';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function hasUnreadNotifications(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(UNREAD_KEY) === 'true';
}

export function markNotificationsUnread(): void {
  if (canUseStorage()) {
    window.localStorage.setItem(UNREAD_KEY, 'true');
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function clearNotificationsUnread(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(UNREAD_KEY);
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

export function subscribeToUnreadNotifications(listener: (unread: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => listener(hasUnreadNotifications());
  window.addEventListener(EVENT_NAME, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(EVENT_NAME, handleChange);
    window.removeEventListener('storage', handleChange);
  };
}

// Lets a tapped push notification tell the running app to open the
// notifications modal directly, instead of just lighting up the bell badge.
export function requestOpenNotifications(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(OPEN_REQUEST_EVENT));
  }
}

export function subscribeToOpenNotificationsRequest(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(OPEN_REQUEST_EVENT, listener);
  return () => window.removeEventListener(OPEN_REQUEST_EVENT, listener);
}
