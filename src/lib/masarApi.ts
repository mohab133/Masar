import {
  Announcement,
  AcademicEvent,
  Course,
  ScheduleEvent,
  OfficialScheduleDocument,
} from '../types';
import { validateMasarData } from './apiValidation';

export interface MasarData {
  announcements: Announcement[];
  dates: AcademicEvent[];
  schedule: ScheduleEvent[];
  courses: Course[];
  officialSchedules: OfficialScheduleDocument[];
}

const EMPTY_DATA: MasarData = {
  announcements: [],
  dates: [],
  schedule: [],
  courses: [],
  officialSchedules: [],
};


export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://jbvngzazhcmovlkoarzk.supabase.co/functions/v1/masar-api').replace(/\/$/, '');

export function getFallbackData(): MasarData {
  return EMPTY_DATA;
}

export async function fetchMasarData(signal?: AbortSignal): Promise<MasarData> {
  const response = await fetch(`${API_BASE_URL}/api/bootstrap`, {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Masar API returned ${response.status}`);
  }

  const rawData: unknown = await response.json();
  const data = validateMasarData(rawData);

  if (!data) {
    throw new Error('Masar API returned invalid data');
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
    try {
      const payload: unknown = await response.json();
      if (payload && typeof payload === 'object' && 'error' in payload) {
        const value = (payload as { error?: unknown }).error;
        if (typeof value === 'string') serverMessage = value;
      }
    } catch {
      // Ignore non-JSON error bodies. The UI supplies the user-facing message.
    }
    throw new Error(serverMessage || `Feedback request failed with ${response.status}`);
  }
}
