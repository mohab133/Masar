import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ArrowRight,
  FileText,
  Presentation,
  FileSpreadsheet,
  CheckCircle2,
  BookmarkCheck,
  GraduationCap,
  Download,
  Check
} from 'lucide-react';
import { Course, CourseFile, FileCategory } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { getDynamicBorderClass } from '../lib/courseIcons';
import { EmptyState } from './EmptyState';

interface CourseDetailViewProps {
  course: Course;
  onBack: () => void;
}

type CategoryTab = 'slides' | 'sheets' | 'solutions' | 'summaries' | 'exams' | 'other';

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
  { id: 'other', label: 'أخرى', icon: FileText },
];

const normalizeCategory = (cat: FileCategory): CategoryTab => {
  if (cat === 'slides' || cat === 'lectures') return 'slides';
  if (cat === 'sheets' || cat === 'sections') return 'sheets';
  if (cat === 'solutions' || cat === 'solved_questions') return 'solutions';
  if (cat === 'summaries' || cat === 'reviews') return 'summaries';
  if (cat === 'exams') return 'exams';
  return 'other';
};

interface CourseFileCardProps {
  file: CourseFile;
  idx: number;
  downloadingId: string | null;
  onDownload: (e: React.MouseEvent, file: CourseFile) => void;
}

const CourseFileCard: React.FC<CourseFileCardProps> = memo(({ file, idx, downloadingId, onDownload }) => {
  return (
    <div
      onClick={(e) => file.url && onDownload(e, file)}
      className={`bg-white border border-slate-200/90 ${getDynamicBorderClass(idx)} ${file.url ? 'hover:border-blue-300 cursor-pointer' : 'cursor-default'} rounded-2xl p-4 flex items-center justify-between gap-3 transition-all shadow-2xs group`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 flex items-center justify-center shrink-0">
          <FileText size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug break-words">
            {file.title}
          </h4>
          <div className="text-xs sm:text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>{file.size}</span>
            {file.totalPages && <span>• {file.totalPages} صفحة</span>}
          </div>
        </div>
      </div>

      {/* Action Button: Download */}
      <div className="shrink-0">
        <button
          type="button"
          onClick={(e) => file.url && onDownload(e, file)}
          disabled={!file.url}
          className={`p-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
            downloadingId === file.id
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : file.url
                ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
                : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
          }`}
          title={file.url ? 'تحميل الملف' : 'الملف غير متاح حاليًا'}
          aria-label={file.url ? 'تحميل الملف' : 'الملف غير متاح حاليًا'}
        >
          {downloadingId === file.id ? (
            <Check size={18} className="text-emerald-600" />
          ) : (
            <Download size={18} />
          )}
        </button>
      </div>
    </div>
  );
});

CourseFileCard.displayName = 'CourseFileCard';

export const CourseDetailView: React.FC<CourseDetailViewProps> = memo(({ course, onBack }) => {
  const [activeTab, setActiveTab] = useState<CategoryTab>('slides');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const files = useMemo(() => course.files || [], [course.files]);

  // Count files per category
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryTab, number> = {
      slides: 0,
      sheets: 0,
      solutions: 0,
      summaries: 0,
      exams: 0,
      other: 0,
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

  const handleDownload = useCallback((e: React.MouseEvent, file: CourseFile) => {
    e.stopPropagation();
    if (!file.url) return;
    setConfirmModalState({
      isOpen: true,
      title: 'تحميل الملف',
      message: `هل تريد تحميل ملف "${file.title}"؟`,
      onConfirm: () => {
        if (!file.url) return;
        window.open(file.url, '_blank', 'noopener,noreferrer');
        setDownloadingId(file.id);
        setTimeout(() => setDownloadingId(null), 2000);
      },
    });
  }, []);

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
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0"
          aria-label="العودة للمواد"
        >
          <ArrowRight size={22} />
        </button>

        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] sm:text-[15px] font-extrabold text-slate-900 leading-[1.35] tracking-tight break-words">
            {course.nameAr || course.nameEn}
          </h2>
          {course.nameAr && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug mt-0.5">
              {course.nameEn}
            </p>
          )}
        </div>

        <span className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 shrink-0">
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
          currentCategoryFiles.map((file, idx) => (
            <CourseFileCard
              key={file.id}
              file={file}
              idx={idx}
              downloadingId={downloadingId}
              onDownload={handleDownload}
            />
          ))
        ) : (
          <EmptyState icon="file" compact title="لا توجد ملفات في هذا القسم حاليًا" description="ستظهر الملفات هنا فور نشرها" />
        )}
      </div>

      {/* Download Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        type="download"
        onConfirm={confirmModalState.onConfirm}
        onClose={() =>
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
});

CourseDetailView.displayName = 'CourseDetailView';
