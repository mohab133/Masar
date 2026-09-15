import React, { useState, memo } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Course } from '../types';
import { CourseDetailView } from './CourseDetailView';
import { getCourseIconMeta } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';

interface CoursesViewProps {
  courses: Course[];
}

interface CourseCardProps {
  course: Course;
  onSelect: (course: Course) => void;
}

const getDepartmentLabel = (department?: Course['department'] | null) => {
  if (department === 'computers') return 'قسم حاسبات';
  if (department === 'control_communications') return 'قسم تحكم واتصالات';
  return 'عام';
};

const CourseCard: React.FC<CourseCardProps> = memo(({ course, onSelect }) => {
  const meta = getCourseIconMeta(course.nameEn || course.nameAr || '');
  const Icon = meta.Icon;

  return (
    <div
      onClick={() => onSelect(course)}
      className={`bg-white border border-slate-200/90 ${meta.borderRightClass} rounded-2xl px-3.5 py-3 cursor-pointer hover:border-blue-300 smooth-interaction shadow-2xs group`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}>
          {course.iconUrl ? (
            <img
              src={course.iconUrl}
              alt=""
              className="w-6 h-6 object-contain rounded-lg"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <Icon size={18} />
          )}
        </div>

        <div className="min-w-0 flex-1 text-right">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug truncate" dir="auto">
            {course.nameAr || course.nameEn}
          </h3>
          <span className="mt-1 inline-flex max-w-full items-center rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-500 truncate">
            {getDepartmentLabel(course.department)}
          </span>
        </div>

        <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
          <ChevronLeft size={17} />
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
    <div id="courses-screen-view" className="space-y-3 pb-24 pt-1" dir="rtl">
      {/* Screen Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800 tracking-wide">
          المواد الدراسية
        </h2>
      </div>

      {/* Courses List */}
      <div className="space-y-2.5">
        {courses.length > 0 ? courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
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
