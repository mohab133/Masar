# Masar backend setup

Masar uses a Supabase backend and does not require user login. The Android app talks to the public `masar-api` Edge Function over HTTPS.

## Runtime API

Set the frontend API base URL to:

```text
VITE_API_BASE_URL=https://jbvngzazhcmovlkoarzk.supabase.co/functions/v1/masar-api
```

The app expects these API routes:

- `GET /api/bootstrap` for announcements, dates, schedules, courses, and official schedules
- `POST /api/feedback` for feedback
- `POST /api/devices/register` for FCM device tokens

If the API is unavailable, Masar falls back to its local cache and bundled data.

## Supabase resources

The backend data lives in Supabase PostgreSQL and Storage. The Edge Function source is kept under `supabase/functions/masar-api/`. Firebase FCM is used only for Android push delivery. Service-account credentials and other secrets stay in Supabase Edge Function secrets and must never be committed to GitHub.

## Local Android build

1. Install dependencies with `npm install`.
2. Put the Firebase Android configuration at `android/app/google-services.json` when push notifications are needed.
3. Run:

```bash
npm run build:android
```

The generated APK uses the bundled web build and the configured API URL.
