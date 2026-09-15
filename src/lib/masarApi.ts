import {
  Announcement,
  AcademicEvent,
  Course,
  ScheduleEvent,
  OfficialScheduleDocument,
  AppAsset,
} from '../types';
import { validateMasarData } from './apiValidation';

export interface MasarData {
  announcements: Announcement[];
  dates: AcademicEvent[];
  schedule: ScheduleEvent[];
  courses: Course[];
  officialSchedules: OfficialScheduleDocument[];
  appAssets: AppAsset[];
}

const EMPTY_DATA: MasarData = {
  announcements: [],
  dates: [],
  schedule: [],
  courses: [],
  officialSchedules: [],
  appAssets: [],
};


export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://jbvngzazhcmovlkoarzk.supabase.co/functions/v1/masar-api').replace(/\/$/, '');

export function getFallbackData(): MasarData {
  return EMPTY_DATA;
}

export class MasarApiError extends Error {
  readonly kind: 'offline' | 'timeout' | 'server' | 'http' | 'invalid_data' | 'network';
  readonly status?: number;

  constructor(
    message: string,
    kind: MasarApiError['kind'],
    status?: number,
  ) {
    super(message);
    this.name = 'MasarApiError';
    this.kind = kind;
    this.status = status;
  }
}

export function getMasarApiErrorMessage(error: unknown): string {
  if (error instanceof MasarApiError) {
    if (error.kind === 'offline') return 'لا يوجد اتصال بالإنترنت حاليًا.';
    if (error.kind === 'timeout') return 'الخادم لم يستجب في الوقت المحدد. حاول مرة أخرى.';
    if (error.kind === 'invalid_data') return 'الخادم أرسل بيانات غير صالحة. حاول مرة أخرى.';
    if (error.kind === 'http') {
      if (error.status === 401 || error.status === 403) return 'الخادم رفض الاتصال بالتطبيق.';
      if (error.status === 404) return 'خدمة البيانات غير متاحة حاليًا.';
      if (error.status >= 500) return 'يوجد عطل مؤقت في خادم البيانات.';
      return `تعذر تحميل البيانات من الخادم (رمز ${error.status}).`;
    }
    if (error.kind === 'server') return 'حدث خطأ داخل خادم البيانات.';
    return 'تعذر الوصول إلى خادم البيانات. تحقق من الشبكة وحاول مرة أخرى.';
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'انتهت مهلة الاتصال بالخادم. حاول مرة أخرى.';
  }
  if (error instanceof TypeError) {
    return 'تعذر الوصول إلى خادم البيانات. اتصال الإنترنت موجود لكن الخادم لم يمكن الوصول إليه.';
  }
  return 'تعذر تحميل بيانات التطبيق حاليًا. حاول مرة أخرى.';
}

export async function fetchMasarData(signal?: AbortSignal): Promise<MasarData> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new MasarApiError('Device is offline', 'offline');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/bootstrap?refresh=${Date.now()}`, {
      signal,
      cache: 'no-store',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new MasarApiError('Request timed out or was cancelled', 'timeout');
    }
    throw new MasarApiError(error instanceof Error ? error.message : 'Network request failed', 'network');
  }

  if (!response.ok) {
    const status = response.status;
    throw new MasarApiError(`Masar API returned ${status}`, status >= 500 ? 'server' : 'http', status);
  }

  let rawData: unknown;
  try {
    rawData = await response.json();
  } catch {
    throw new MasarApiError('Masar API returned a non-JSON response', 'invalid_data');
  }

  const data = validateMasarData(rawData);
  if (!data) {
    throw new MasarApiError('Masar API returned invalid data', 'invalid_data');
  }

  return data;
}

export async function submitFeedback(details: string, clientId?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ details, clientId }),
  });

  if (!response.ok) {
    let serverMessage = '';
    let retryAfterSeconds = 0;
    try {
      const payload: unknown = await response.json();
      if (payload && typeof payload === 'object') {
        if ('error' in payload && typeof (payload as { error?: unknown }).error === 'string') {
          serverMessage = (payload as { error: string }).error;
        }
        if ('retryAfterSeconds' in payload && typeof (payload as { retryAfterSeconds?: unknown }).retryAfterSeconds === 'number') {
          retryAfterSeconds = (payload as { retryAfterSeconds: number }).retryAfterSeconds;
        }
      }
    } catch {
      // Ignore non-JSON error bodies.
    }
    const error = new Error(serverMessage || `Feedback request failed with ${response.status}`) as Error & { status?: number; retryAfterSeconds?: number };
    error.status = response.status;
    error.retryAfterSeconds = retryAfterSeconds;
    throw error;
  }
}
