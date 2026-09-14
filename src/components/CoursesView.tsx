import React, { useState, memo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Course } from '../types';
import { CourseDetailView } from './CourseDetailView';
import { getCourseDepartmentLabel, getCourseIconMeta } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';

interface CoursesViewProps {
  courses: Course[];
}

interface CourseCardProps {
  course: Course;
  index: number;
  onSelect: (course: Course) => void;
}

const CourseCard: React.FC<CourseCardProps> = memo(({ course, index, onSelect }) => {
  const meta = getCourseIconMeta(course.nameEn || course.nameAr || '', index);
  const Icon = meta.Icon;
  const departmentLabel = course.department === 'computers'
    ? 'قسم حاسبات'
    : course.department === 'control_communications'
      ? 'قسم تحكم واتصالات'
      : getCourseDepartmentLabel(course.nameAr || course.nameEn || '');
  const fileCount = course.files?.length ?? course.filesCount ?? 0;

  return (
    <div
      onClick={() => onSelect(course)}
      className={`bg-white border border-slate-200/90 ${meta.borderRightClass} rounded-2xl p-4 cursor-pointer hover:border-blue-300 transition-all shadow-2xs group`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug whitespace-normal" dir="auto">
            {course.nameAr || course.nameEn}
          </h3>

          {course.nameAr && course.nameEn && (
            <div className="text-xs text-slate-500 font-medium leading-tight mt-0.5" dir="ltr">
              {course.nameEn}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${meta.badgeClass}`}>
              {fileCount} ملفات
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
              {departmentLabel}
            </span>
          </div>
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}>
          {course.iconUrl ? (
            <img
              src={course.iconUrl}
              alt=""
              className="w-7 h-7 object-contain rounded-lg"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <Icon size={20} />
          )}
        </div>

        <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
          <ChevronLeft size={18} />
        </div>
      </div>
    </div>
  );
});
CourseCard.displayName = 'CourseCard';

export const CoursesView: React.FC<CoursesViewProps> = memo(({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  if (selectedCourse) {
    return (
      
        <div
          key="course-detail"
        >
          <CourseDetailView
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
          />
        </div>
      
    );
  }

  return (
    <div id="courses-screen-view" className="space-y-3.5 pb-24 pt-1" dir="rtl">
      {/* Screen Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800 tracking-wide">
          المواد الدراسية
        </h2>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {courses.length > 0 ? courses.map((course, index) => (
          <CourseCard
            key={course.id}
            course={course}
            index={index}
            onSelect={setSelectedCourse}
          />
        )) : (
          <EmptyState icon="courses" title="لا توجد مواد دراسية حاليًا" description="ستظهر المواد هنا فور إضافتها إلى مسار" />
        )}
      </div>
    </div>
  );
});

CoursesView.displayName = 'CoursesView';
