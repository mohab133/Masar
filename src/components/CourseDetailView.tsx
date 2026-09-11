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
      {/* Clean Course Header without duplication */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0"
          aria-label="العودة للمواد"
        >
          <ArrowRight size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 truncate">
            {course.nameAr || course.nameEn} ({course.code})
          </h2>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {course.instructor}
          </p>
        </div>

        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0">
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
              className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className={isSelected ? 'text-white' : 'text-slate-400'} />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white font-black'
                    : 'bg-slate-100 text-slate-500'
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
              className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
                  <FileText size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-relaxed">
                    {file.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{file.size}</span>
                    {file.totalPages && <span>• {file.totalPages} صفحة</span>}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, file)}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                    downloadingId === file.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="تحميل الملف"
                  aria-label="تحميل الملف"
                >
                  {downloadingId === file.id ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Download size={14} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveFile(file)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/70 transition-all inline-flex items-center gap-1 shadow-2xs"
                >
                  <Eye size={13} />
                  <span>عرض</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">لا توجد ملفات في هذا القسم حالياً</p>
            <p className="text-[11px] text-slate-400">سيتم إضافة الملفات فور نشرها من الكلية</p>
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
