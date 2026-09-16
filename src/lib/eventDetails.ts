import type { AcademicEvent, AcademicEventDetails, AcademicEventType } from '../types';

export const EVENT_TYPE_LABELS_AR: Record<AcademicEventType, string> = {
  assignment: 'آخر موعد لتسليم التكليف',
  submission: 'آخر موعد للتسليم',
  quiz: 'موعد اختبار الكويز',
  project: 'موعد تسليم المشروع',
  lab: 'موعد المعمل',
  midterm: 'موعد امتحان الميدتيرم',
  final: 'موعد امتحان الفاينال',
  lecture: 'موعد المحاضرة',
  registration_start: 'موعد بداية التسجيل',
  registration_end: 'موعد نهاية التسجيل',
  result_release: 'موعد إعلان النتيجة',
  meeting: 'موعد اجتماع أو فعالية',
  other: 'موعد مهم',
};

export function getEventTypeLabel(event: Pick<AcademicEvent, 'type' | 'typeLabelAr'>): string {
  return event.typeLabelAr || EVENT_TYPE_LABELS_AR[event.type] || 'موعد مهم';
}

export function normalizeEventDetails(value: unknown): AcademicEventDetails | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const text = (key: string) => typeof source[key] === 'string' && source[key].trim() ? source[key].trim() : undefined;
  const steps = Array.isArray(source.steps)
    ? source.steps.filter((step): step is string => typeof step === 'string' && Boolean(step.trim())).map((step) => step.trim())
    : typeof source.steps === 'string' && source.steps.trim() ? [source.steps.trim()] : undefined;
  const details: AcademicEventDetails = {
    steps,
    submissionLocation: text('submission_location') ?? text('submissionLocation'),
    submissionUrl: text('submission_url') ?? text('submissionUrl'),
    quizLocation: text('quiz_location') ?? text('quizLocation'),
    quizUrl: text('quiz_url') ?? text('quizUrl'),
    deadlineNote: text('deadline_note') ?? text('deadlineNote'),
    instructions: text('instructions'),
    notes: text('notes'),
  };
  return Object.values(details).some((item) => Array.isArray(item) ? item.length > 0 : Boolean(item)) ? details : null;
}

export function safeExternalUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getLegacyDetails(event: Pick<AcademicEvent, 'location' | 'time'>): AcademicEventDetails | null {
  if (!event.location && !event.time) return null;
  return {
    quizLocation: event.location || undefined,
    deadlineNote: event.time ? `الوقت: ${event.time}` : undefined,
  };
}
