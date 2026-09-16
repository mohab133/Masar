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
  courseRef?: string | null;
  linkUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  created_at?: string | null;
}

export type ScheduleType = 'lecture' | 'section';

export interface ScheduleEvent {
  id: string;
  course: string;
  courseCode?: string | null;
  type: ScheduleType;
  sectionNumber?: number | null;
  lectureNumber?: number | null;
  dayOfWeek: number;
  dayNameAr: string;
  startTime: string;
  endTime: string;
  location: string;
  instructor?: string | null;
  notes?: string | null;
}

export type FileCategory = 'slides' | 'sheets' | 'solutions' | 'summaries' | 'exams' | 'lectures' | 'sections' | 'reviews' | 'solved_questions' | 'other';

export interface CourseFile {
  id: string;
  title: string;
  category: FileCategory;
  type: 'pdf' | 'slides' | 'sheet' | 'doc';
  size: string;
  date: string;
  totalPages?: number;
  url?: string | null;
}

export interface Course {
  id: string;
  code: string;
  nameEn: string;
  nameAr?: string | null;
  instructor: string;
  filesCount: number;
  files: CourseFile[];
  department?: 'general' | 'computers' | 'control_communications' | null;
  iconUrl?: string | null;
}

export type AcademicEventType = 'assignment' | 'submission' | 'quiz' | 'project' | 'lab' | 'midterm' | 'final' | 'lecture' | 'registration_start' | 'registration_end' | 'result_release' | 'meeting' | 'other';

export interface AcademicEventDetails {
  steps?: string[];
  submissionLocation?: string;
  submissionUrl?: string;
  quizLocation?: string;
  quizUrl?: string;
  deadlineNote?: string;
  instructions?: string;
  notes?: string;
}

export interface AcademicEvent {
  id: string;
  type: AcademicEventType;
  typeLabelAr: string;
  course: string;
  eventName: string;
  date: string;
  displayDateAr: string;
  time?: string;
  remainingTimeAr: string;
  daysUntil: number;
  location?: string;
  details?: AcademicEventDetails | null;
}

export type FeedbackType = 'error' | 'suggestion' | 'note';

export interface AppAsset {
  id: string;
  assetKey: string;
  title: string;
  fileName: string;
  fileType: string;
  fileUrl?: string | null;
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
  fileUrl?: string | null;
}
