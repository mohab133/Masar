import type { Announcement } from '../types';

/** An announcement is considered new for the rest of the local calendar day it was published. */
export function isAnnouncementNew(announcement: Announcement, now = new Date()): boolean {
  if (!announcement.created_at) return false;
  const created = new Date(announcement.created_at);
  if (Number.isNaN(created.getTime())) return false;

  return created.getFullYear() === now.getFullYear()
    && created.getMonth() === now.getMonth()
    && created.getDate() === now.getDate();
}
