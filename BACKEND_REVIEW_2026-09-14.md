# Masar backend review

## Fixed in this project copy

- Feedback API payload is aligned with `public.feedback`: `type`, `course_or_section`, `details`.
- Bootstrap maps course files into `courses[].files` instead of returning them as a disconnected top-level array.
- Course files expose an optional public URL from `course-materials.storage_path`.
- Official schedules expose an optional public URL from `official_schedules.storage_path`.
- Official schedule cards are considered downloadable only when a file URL exists.
- No exam start date is shown when the corresponding schedule file is unavailable.
- Missing course files are shown as unavailable instead of pretending a download happened.
- The weekly official schedule download is disabled until a real file is published.
- The old unused `masar:open-bylaw` event path was removed from the home screen action because no listener existed.

## Current production data check

- Active announcements: 2
- Courses: 6
- Schedule rows: 14
- Official schedule records: 3
- Course file records: 31
- Course files with Storage paths: 0
- Official schedule files with Storage paths: 0

Therefore the UI must not pretend that those 31 course-file records or the 3 official-schedule records are downloadable yet.

## Backend source

`masar-api-index-fixed.ts` contains the corrected Edge Function source. It is prepared for deployment but this project copy does not claim that the remote Edge Function was redeployed from this local file.
