export type TabType = 'home' | 'schedule' | 'courses' | 'dates';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  timeAgo: string;
  category: 'schedule' | 'exam' | 'academic' | 'general';
  categoryNameAr: string;
  isImportant: boolean;
  status: 'active' | 'expired';
  courseRef?: string;
}

export type ScheduleType = 'lecture' | 'section';

export interface ScheduleEvent {
  id: string;
  course: string;
  courseCode?: string;
  type: ScheduleType;
  sectionNumber?: number;
  lectureNumber?: number;
  dayOfWeek: number; // 0: Sunday, 1: Monday, 2: Tuesday, 3: Wednesday, 4: Thursday
  dayNameAr: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor?: string;
}

export interface LiveSectionInfo {
  event: ScheduleEvent;
  status: 'running' | 'started_recently' | 'starting_soon';
  statusTextAr: string;
  timeDiffMinutes: number;
}

export type FileCategory = 
  | 'slides'
  | 'sheets'
  | 'solutions'
  | 'summaries'
  | 'exams'
  | 'lectures'
  | 'sections'
  | 'reviews'
  | 'solved_questions'
  | 'other';

export interface CourseFile {
  id: string;
  title: string;
  category: FileCategory;
  type: 'pdf' | 'slides' | 'sheet' | 'doc';
  size: string;
  date: string;
  totalPages?: number;
}

export interface Course {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string;
  instructor: string;
  filesCount: number;
  files: CourseFile[];
}

export type AcademicEventType = 
  | 'assignment'
  | 'submission'
  | 'quiz'
  | 'project'
  | 'lab'
  | 'midterm'
  | 'final';

export interface AcademicEvent {
  id: string;
  type: AcademicEventType;
  typeLabelAr: string;
  course: string;
  eventName: string;
  date: string; // e.g. "2026-09-15"
  displayDateAr: string; // e.g. "الثلاثاء 15 سبتمبر"
  time?: string; // e.g. "11:59 م" or "10:00 ص"
  remainingTimeAr: string; // e.g. "بعد 3 أيام"
  daysUntil: number;
  location?: string;
  note?: string; // ملاحظة إضافية للتسليم أو التكليف
  instructions?: string[]; // تعليمات وشروط التسليم خطوة بخطوة
  submissionUrl?: string; // رابط التسليم (فورم / درايف / منصة)
  submissionUrlTitle?: string; // عنوان زر الرابط (مثل: رابط فورم التسليم)
  deliveryMethod?: 'online' | 'in_person' | 'email'; // طريقة التسليم (إلكتروني / ورقي مع المعيد)
}

export type FeedbackType = 'error' | 'suggestion' | 'note';

export interface FeedbackSubmission {
  id: string;
  type: FeedbackType;
  courseOrSection?: string;
  details: string;
  submittedAt: string;
}

export interface OfficialScheduleDocument {
  id: string;
  title: string;
  type: 'lectures_sections' | 'midterm' | 'final';
  typeLabelAr: string;
  term: string;
  academicYear: string;
  approvedDate: string;
  description: string;
  fileSize: string;
  downloadFileName: string;
}

