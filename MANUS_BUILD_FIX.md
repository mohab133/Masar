# Masar production API build fix

The Android build previously produced an APK with an empty `VITE_API_BASE_URL`, so the app could not reach the Supabase Edge Function.

This source copy fixes that in two layers:

1. `.env.production` defines the public production API URL used by Vite:
   `https://jbvngzazhcmovlkoarzk.supabase.co/functions/v1/masar-api`
2. `src/lib/masarApi.ts` has the same URL as a public fallback, so the app remains connected even if the Codemagic environment group does not inject the variable.
3. `useMasarData.ts`, `FeedbackModal.tsx`, and `pushNotifications.ts` now use the resolved API configuration instead of branching on the raw environment variable.

Build command remains `npm run build:android`.

Before releasing the APK, verify the built JS contains `jbvngzazhcmovlkoarzk.supabase.co/functions/v1/masar-api`.
