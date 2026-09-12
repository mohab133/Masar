import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../types';
import { CourseDetailView } from './CourseDetailView';

interface CoursesViewProps {
  courses: Course[];
}

const COURSE_COLOR_ACCENTS = [
  'bg-slate-100 text-slate-800 border-slate-200',
  'bg-emerald-50 text-emerald-800 border-emerald-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-purple-50 text-purple-800 border-purple-200',
  'bg-teal-50 text-teal-800 border-teal-200',
];

export const CoursesView: React.FC<CoursesViewProps> = ({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  if (selectedCourse) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="course-detail"
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -14 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <CourseDetailView
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div id="courses-screen-view" className="space-y-3.5 pb-24 pt-1" dir="rtl">
      {/* Screen Title */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base font-bold text-slate-800 tracking-wide">
          المواد الدراسية
        </h2>
        <span className="text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
          {courses.length} مواد مسجلة
        </span>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {courses.map((course, index) => {
          const accentClass = COURSE_COLOR_ACCENTS[index % COURSE_COLOR_ACCENTS.length];

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.08) }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setSelectedCourse(course)}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 cursor-pointer hover:border-slate-400 transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Course Code Badge */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${accentClass}`}
                  >
                    {course.code.split(' ')[0]}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition-colors truncate">
                      {course.nameAr}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate mt-0.5">
                      {course.nameEn} • {course.code}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1">
                      {course.instructor}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 group-hover:text-slate-900 group-hover:bg-slate-100 transition-colors shrink-0">
                  <ChevronLeft size={20} />
                </div>
              </div>

              {/* Course Meta Info */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs sm:text-sm">
                <span className="font-semibold text-slate-600">{course.nameEn}</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {course.files?.length ?? course.filesCount ?? 0} ملفات
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
