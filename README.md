# Masar

Masar is an Arabic RTL Android student app for announcements, schedule, courses, and academic dates.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Capacitor 8
- Supabase Edge Function API + PostgreSQL + Storage
- Firebase Cloud Messaging for Android push notifications

## Build

```bash
npm install
npm run lint
npm run build
npm run build:android
```

For Android push notifications, place the Firebase Android configuration at `android/app/google-services.json` before the Android build.

## Android build integrity

Always build Android with `npm run build:android`. The command runs Vite, Capacitor sync, and a post-sync hash check that verifies the Android bundled web assets exactly match `dist`.

## PWA Service Worker

The Service Worker is registered only in a normal web/PWA environment. Capacitor Android uses its bundled WebView assets and should not register the PWA Service Worker.
