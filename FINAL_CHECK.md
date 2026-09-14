# Masar v29 final check

This package keeps the Masar React/Vite/Capacitor app and the Supabase backend together.

Included:
- React + TypeScript + Vite app
- Capacitor Android project
- Supabase Edge Functions backend under `backend/`
- Supabase bootstrap API and feedback API
- Supabase seed script
- New light Masar logo in `public/masar-logo.png`
- New Android/PWA icon assets
- Android application id `com.masar.studentapp`
- App name `Masar`
- Bundled sample-data fallback when `VITE_API_BASE_URL` is not configured
- Persistent offline cache with automatic refresh when the app reconnects or returns to foreground
- Firebase Cloud Messaging registration and Android notification channel
- Foreground notification display through Capacitor Local Notifications
- Supabase Edge Functions endpoints for device-token registration and protected broadcast notifications
- Reusable empty states for announcements, deadlines, exams, schedules, courses, and course files

Important build step:
Run `npm install`, then `npm run lint`, then `npm run build:android` before building the APK. `cap sync` regenerates Android web assets from the current source and prevents stale bundled JavaScript from being packaged.

Backend deployment is separate from the Android build. Configure `VITE_API_BASE_URL` to the deployed Supabase Edge Functions URL for production data.


Push notification setup: add the real Firebase Android `google-services.json` to `android/app/` locally. It is intentionally not included in the ZIP or GitHub repository. Then run `npm install`, `npm run lint`, and `npm run build:android`.

For Supabase Edge Functions, set `ADMIN_NOTIFICATION_KEY` as a secret environment variable before using `/api/notifications/broadcast`.
