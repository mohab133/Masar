import type { MasarData } from './masarApi';
import type { Announcement, AcademicEvent, Course, CourseFile, ScheduleEvent, OfficialScheduleDocument, AppAsset } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isString = (value: unknown): value is string => typeof value === 'string';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isArray = Array.isArray;

function isAnnouncement(value: unknown): value is Announcement {
  return isRecord(value) && isString(value.id) && isString(value.title) && isString(value.content)
    && isString(value.date) && isString(value.timeAgo) && isString(value.category)
    && isString(value.categoryNameAr) && typeof value.isImportant === 'boolean'
    && isString(value.status)
    && (value.courseRef === undefined || value.courseRef === null || isString(value.courseRef))
    && (value.linkUrl === undefined || value.linkUrl === null || isString(value.linkUrl))
    && (value.attachmentUrl === undefined || value.attachmentUrl === null || isString(value.attachmentUrl))
    && (value.attachmentName === undefined || value.attachmentName === null || isString(value.attachmentName));
}

function isAcademicEvent(value: unknown): value is AcademicEvent {
  return isRecord(value) && isString(value.id) && isString(value.type)
    && isString(value.typeLabelAr) && isString(value.course) && isString(value.eventName)
    && isString(value.date) && isString(value.displayDateAr) && isString(value.remainingTimeAr)
    && isNumber(value.daysUntil) && (value.time === undefined || isString(value.time))
    && (value.location === undefined || isString(value.location));
}

function isScheduleEvent(value: unknown): value is ScheduleEvent {
  return isRecord(value) && isString(value.id) && isString(value.course)
    && isString(value.type) && isNumber(value.dayOfWeek) && isString(value.dayNameAr)
    && isString(value.startTime) && isString(value.endTime) && isString(value.location)
    && (value.courseCode === undefined || value.courseCode === null || isString(value.courseCode))
    && (value.sectionNumber === undefined || value.sectionNumber === null || isNumber(value.sectionNumber))
    && (value.lectureNumber === undefined || value.lectureNumber === null || isNumber(value.lectureNumber))
    && (value.instructor === undefined || value.instructor === null || isString(value.instructor))
    && (value.notes === undefined || value.notes === null || isString(value.notes));
}

function isCourseFile(value: unknown): value is CourseFile {
  return isRecord(value) && isString(value.id) && isString(value.title)
    && isString(value.category) && isString(value.type) && isString(value.size)
    && isString(value.date) && (value.totalPages === undefined || isNumber(value.totalPages))
    && (value.url === undefined || value.url === null || isString(value.url));
}

function isCourse(value: unknown): value is Course {
  return isRecord(value) && isString(value.id) && isString(value.code) && isString(value.nameEn)
    && (value.nameAr === undefined || value.nameAr === null || isString(value.nameAr)) && isString(value.instructor)
    && isNumber(value.filesCount) && isArray(value.files) && value.files.every(isCourseFile)
    && (value.department === undefined || value.department === null || isString(value.department))
    && (value.iconUrl === undefined || value.iconUrl === null || isString(value.iconUrl));
}

function isAppAsset(value: unknown): value is AppAsset {
  return isRecord(value) && isString(value.id) && isString(value.assetKey)
    && isString(value.title) && isString(value.fileName) && isString(value.fileType)
    && (value.fileUrl === undefined || value.fileUrl === null || isString(value.fileUrl));
}

function isOfficialSchedule(value: unknown): value is OfficialScheduleDocument {
  return isRecord(value) && isString(value.id) && isString(value.title) && isString(value.type)
    && isString(value.typeLabelAr) && isString(value.term) && isString(value.academicYear)
    && isString(value.approvedDate) && isString(value.description) && isString(value.fileSize)
    && isString(value.downloadFileName)
    && (value.fileUrl === undefined || value.fileUrl === null || isString(value.fileUrl));
}

export function validateMasarData(value: unknown): MasarData | null {
  if (!isRecord(value)) return null;
  if (!isArray(value.announcements) || !value.announcements.every(isAnnouncement)) return null;
  if (!isArray(value.dates) || !value.dates.every(isAcademicEvent)) return null;
  if (!isArray(value.schedule) || !value.schedule.every(isScheduleEvent)) return null;
  if (!isArray(value.courses) || !value.courses.every(isCourse)) return null;
  if (!isArray(value.officialSchedules) || !value.officialSchedules.every(isOfficialSchedule)) return null;
  if (!isArray(value.appAssets) || !value.appAssets.every(isAppAsset)) return null;

  return {
    announcements: value.announcements,
    dates: value.dates,
    schedule: value.schedule,
    courses: value.courses,
    officialSchedules: value.officialSchedules,
    appAssets: value.appAssets,
  };
}
