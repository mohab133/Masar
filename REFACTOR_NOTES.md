# Masar Refactor

- Fixed the production `masar-api` bootstrap contract so database snake_case fields are mapped to the app's camelCase types.
- Restored `dates` mapping and `appAssets` from the API response.
- Kept FCM HTTP v1 and token invalidation behavior intact.
- Protected notification broadcast with the Supabase `apikey` secret-key check.
- Centralized download UI state in `src/lib/useDownload.ts`.
- Centralized download button styling and unavailable-file behavior in `src/components/DownloadButton.tsx`.
- Removed the unused `OfficialScheduleModal` component.
- Removed the unused download-confirm modal state from `DatesView`.
- Removed the `other` category from the visible course tabs while preserving legacy category normalization for old records.
- Kept legacy `solved_questions` and `reviews` normalization so old database records remain usable.
- When an exam/official file has no URL, the UI now shows `غير متاح حاليًا` instead of a dead download button.
