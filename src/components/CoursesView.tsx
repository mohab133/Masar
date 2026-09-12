import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ChevronLeft,
  Search,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  Presentation,
  CheckCircle2,
  FileText,
  FolderOpen,
  User,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Course, CourseFile, FileCategory } from '../types';
import { CourseDetailView } from './CourseDetailView';

interface CoursesViewProps {
  courses: Course[];
}

const getCategoryCounts = (files: CourseFile[] = []) => {
  let slides = 0;
  let sheets = 0;
  let solutions = 0;
  let exams = 0;

  files.forEach((f) => {
    if (f.category === 'slides' || f.category === 'lectures') slides++;
    else if (f.category === 'sheets' || f.category === 'sections') sheets++;
    else if (f.category === 'solutions' || f.category === 'solved_questions') solutions++;
    else if (f.category === 'exams') exams++;
  });

  return { slides, sheets, solutions, exams, total: files.length };
};

export const CoursesView: React.FC<CoursesViewProps> = memo(({ courses }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered courses based on search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const query = searchQuery.toLowerCase().trim();
    return courses.filter((c) => {
      const matchNameAr = (c.nameAr || '').toLowerCase().includes(query);
      const matchNameEn = (c.nameEn || '').toLowerCase().includes(query);
      const matchCode = (c.code || '').toLowerCase().includes(query);
      const matchInstructor = (c.instructor || '').toLowerCase().includes(query);
      return matchNameAr || matchNameEn || matchCode || matchInstructor;
    });
  }, [courses, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedCourse(null);
  }, []);

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
            onBack={handleBackFromDetail}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div id="courses-screen-view" className="space-y-4 pb-28 pt-1" dir="rtl">
      {/* Search and Summary Bar */}
      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المادة، الكود، أو الدكتور..."
            className="w-full bg-white border border-slate-200/90 rounded-2xl py-3 pr-11 pl-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 shadow-2xs transition-all"
          />
          <Search
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Header Title with Counter */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-slate-700">
            {searchQuery ? `نتائج البحث (${filteredCourses.length})` : 'المقررات الدراسية المسجلة'}
          </span>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl">
            {courses.length} مواد هذا الترم
          </span>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3.5">
        {filteredCourses.map((course, index) => {
          const stats = getCategoryCounts(course.files);

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: Math.min(index * 0.03, 0.1) }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedCourse(course)}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-2xs group space-y-3.5"
            >
              {/* Top Row: Course Code & Total Files */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-black tracking-wide text-blue-800 bg-blue-50 border border-blue-100/90 px-3 py-1 rounded-xl shadow-2xs">
                  {course.code}
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-xl">
                  <FolderOpen size={13} className="text-slate-500" />
                  <span>{stats.total || course.filesCount || 0} ملفات</span>
                </span>
              </div>

              {/* Middle Section: Course Names & Instructor */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug">
                  {course.nameAr || course.nameEn}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 font-sans">
                  {course.nameEn}
                </p>

                <div className="flex items-center gap-1.5 pt-1 text-xs sm:text-sm text-slate-600 font-medium">
                  <User size={14} className="text-slate-400 shrink-0" />
                  <span>{course.instructor}</span>
                </div>
              </div>

              {/* Resources Breakdown Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                {stats.slides > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-medium">
                    <Presentation size={12} className="text-blue-600" />
                    <span>سلايدز ({stats.slides})</span>
                  </span>
                )}
                {stats.sheets > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-medium">
                    <FileSpreadsheet size={12} className="text-emerald-600" />
                    <span>شيتات ({stats.sheets})</span>
                  </span>
                )}
                {stats.solutions > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-medium">
                    <CheckCircle2 size={12} className="text-purple-600" />
                    <span>حلول ({stats.solutions})</span>
                  </span>
                )}
                {stats.exams > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700 font-medium">
                    <GraduationCap size={12} className="text-amber-600" />
                    <span>امتحانات ({stats.exams})</span>
                  </span>
                )}
              </div>

              {/* Bottom Row CTA */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-bold text-blue-600 group-hover:text-blue-700">
                <span>تصفح وتحميل ملفات المادة</span>
                <div className="w-7 h-7 rounded-xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-colors">
                  <ChevronLeft size={16} />
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <BookOpen size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">لا توجد مواد مطابقة للبحث</p>
            <p className="text-xs text-slate-500">جرب كتابة كود المادة أو جزء من اسمها</p>
          </div>
        )}
      </div>
    </div>
  );
});

CoursesView.displayName = 'CoursesView';

