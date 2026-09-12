import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  FileText,
  Presentation,
  FileSpreadsheet,
  CheckCircle2,
  BookmarkCheck,
  GraduationCap,
  Download,
  Eye,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { Course, CourseFile, FileCategory } from '../types';
import { FileViewerModal } from './FileViewerModal';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
}

type CategoryTab = 'slides' | 'sheets' | 'solutions' | 'summaries' | 'exams';

interface CategoryConfig {
  id: CategoryTab;
  label: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'slides', label: 'سلايدات', icon: Presentation },
  { id: 'sheets', label: 'شيتات', icon: FileSpreadsheet },
  { id: 'solutions', label: 'حل الشيتات', icon: CheckCircle2 },
  { id: 'summaries', label: 'ملخصات', icon: BookmarkCheck },
  { id: 'exams', label: 'امتحانات سابقة', icon: GraduationCap },
];

const normalizeCategory = (cat: FileCategory): CategoryTab => {
  if (cat === 'slides' || cat === 'lectures') return 'slides';
  if (cat === 'sheets' || cat === 'sections') return 'sheets';
  if (cat === 'solutions' || cat === 'solved_questions') return 'solutions';
  if (cat === 'summaries' || cat === 'reviews') return 'summaries';
  if (cat === 'exams') return 'exams';
  return 'slides';
};

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('slides');
  const [activeFile, setActiveFile] = useState<CourseFile | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const files = useMemo(() => course.files || [], [course.files]);

  // Count files per category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      slides: 0,
      sheets: 0,
      solutions: 0,
      summaries: 0,
      exams: 0,
    };
    files.forEach((file) => {
      const norm = normalizeCategory(file.category);
      if (counts[norm] !== undefined) {
        counts[norm] += 1;
      }
    });
    return counts;
  }, [files]);

  // Filter files by the selected category tab
  const currentCategoryFiles = useMemo(() => {
    return files.filter((file) => normalizeCategory(file.category) === activeTab);
  }, [files, activeTab]);

  const handleDownload = (e: React.MouseEvent, file: CourseFile) => {
    e.stopPropagation();
    setDownloadingId(file.id);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  return (
    <div
      id="course-detail-view"
      data-no-swipe="true"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      className="space-y-4 pb-28 pt-1"
      dir="rtl"
    >
      {/* Sleek Minimal Top Navigation Bar */}
      <div className="flex items-center justify-between px-0.5 py-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 text-slate-700 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50/50 flex items-center justify-center shadow-2xs transition-all shrink-0"
            aria-label="العودة للمواد"
          >
            <ArrowRight size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 truncate">
              {course.nameAr || course.nameEn}
            </h2>
          </div>
        </div>

        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100/80 shrink-0">
          {files.length} ملف
        </span>
      </div>

      {/* Category Tabs (سلايدات، شيتات، حل الشيتات، ملخصات، امتحانات) */}
      <div
        data-no-swipe="true"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = activeTab === cat.id;
          const count = categoryCounts[cat.id] || 0;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`relative px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Simple Files List under the selected category */}
      <div className="space-y-2.5">
        {currentCategoryFiles.length > 0 ? (
          currentCategoryFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setActiveFile(file)}
              className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-relaxed">
                    {file.title}
                  </h4>
                  <div className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                    <span>{file.size}</span>
                    {file.totalPages && <span>• {file.totalPages} صفحة</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, file)}
                  className={`p-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                    downloadingId === file.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="تحميل الملف"
                  aria-label="تحميل الملف"
                >
                  {downloadingId === file.id ? (
                    <Check size={16} className="text-emerald-600" />
                  ) : (
                    <Download size={16} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFile(file)}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <Eye size={15} />
                  <span>عرض</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-sm text-slate-500 space-y-1.5 font-medium">
            <p className="font-bold text-slate-800 text-base">لا توجد ملفات في هذا القسم حالياً</p>
            <p className="text-xs sm:text-sm text-slate-400">سيتم إضافة الملفات فور نشرها من الكلية</p>
          </div>
        )}
      </div>

      {/* File Viewer Modal */}
      <FileViewerModal
        file={activeFile}
        courseName={course.nameAr || course.nameEn}
        onClose={() => setActiveFile(null)}
      />
    </div>
  );
};
