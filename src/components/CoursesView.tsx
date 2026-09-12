import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course } from '../types';
import { CourseDetailView } from './CourseDetailView';

interface CoursesViewProps {
  courses: Course[];
}

const COURSE_COLOR_ACCENTS = [
  'bg-blue-50 text-blue-600 border-blue-100',
  'bg-purple-50 text-purple-600 border-purple-100',
  'bg-amber-50 text-amber-700 border-amber-100',
  'bg-emerald-50 text-emerald-600 border-emerald-100',
  'bg-rose-50 text-rose-600 border-rose-100',
];

export const CoursesView: React.FC<CoursesViewProps> = ({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  if (selectedCourse) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="course-detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
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
        <h2 className="text-sm font-bold text-slate-700 tracking-wide">
          المواد الدراسية
        </h2>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.04 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setSelectedCourse(course)}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 cursor-pointer hover:border-blue-300 transition-all shadow-2xs group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Course Code Badge */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${accentClass}`}
                  >
                    {course.code.split(' ')[0]}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {course.nameAr}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {course.nameEn} • {course.code}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {course.instructor}
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
                  <ChevronLeft size={18} />
                </div>
              </div>

              {/* Course Meta Info */}
              <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">{course.nameEn}</span>
                <span className="font-bold text-blue-600">
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
