import React, { useState, useCallback, memo } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, MessageSquare, Send } from 'lucide-react';
import { FeedbackType } from '../types';
import { BottomSheet } from './BottomSheet';
import { triggerHaptic } from '../utils/haptics';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = memo(({ isOpen, onClose }) => {
  const [type, setType] = useState<FeedbackType>('error');
  const [courseOrSection, setCourseOrSection] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleTypeChange = (newType: FeedbackType) => {
    triggerHaptic('selection');
    setType(newType);
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!details.trim()) return;

      triggerHaptic('success');

      // Save feedback locally in storage
      const newFeedback = {
        id: `fb-${Date.now()}`,
        type,
        courseOrSection: courseOrSection.trim(),
        details: details.trim(),
        submittedAt: new Date().toISOString(),
        isOffline: !navigator.onLine,
      };

      try {
        const existing = JSON.parse(localStorage.getItem('fee_feedback_entries') || '[]');
        localStorage.setItem('fee_feedback_entries', JSON.stringify([...existing, newFeedback]));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setDetails('');
        setCourseOrSection('');
        setType('error');
        onClose();
      }, 1600);
    },
    [details, type, courseOrSection, onClose]
  );

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} id="feedback-bottom-sheet" maxWidthClass="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">إرسال ملاحظة أو تصحيح</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            اكتب ملاحظتك لمساعدتنا في تحديث البيانات
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 overflow-y-auto">
        {isSubmitted ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 shadow-xs border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-900">تم استلام ملاحظتك بنجاح</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
              شكراً لمساعدتك في إبقاء بيانات التطبيق دقيقة ومحدثة لجميع طلاب الكلية.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                نوع الملاحظة
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('error')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'error'
                      ? 'border-rose-300 bg-rose-50 text-rose-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle size={14} className={type === 'error' ? 'text-rose-600' : 'text-slate-500'} />
                  <span>خطأ بيانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('suggestion')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'suggestion'
                      ? 'border-blue-300 bg-blue-50 text-blue-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lightbulb size={14} className={type === 'suggestion' ? 'text-blue-600' : 'text-slate-500'} />
                  <span>اقتراح</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTypeChange('note')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    type === 'note'
                      ? 'border-slate-300 bg-slate-100 text-slate-900 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare size={14} className={type === 'note' ? 'text-slate-900' : 'text-slate-500'} />
                  <span>ملاحظة عامة</span>
                </button>
              </div>
            </div>

            {/* Optional Course/Section */}
            <div>
              <label htmlFor="course-reference" className="block text-xs font-semibold text-slate-700 mb-1">
                المادة أو السكشن المعني (اختياري)
              </label>
              <input
                id="course-reference"
                type="text"
                value={courseOrSection}
                onChange={(e) => setCourseOrSection(e.target.value)}
                placeholder="مثال: الرياضيات 2 - سكشن 4 أو معمل الإلكترونيات"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 transition-colors"
              />
            </div>

            {/* Details */}
            <div>
              <label htmlFor="feedback-details" className="block text-xs font-semibold text-slate-700 mb-1">
                تفاصيل الملاحظة <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="feedback-details"
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="اكتب التعديل المطلوب أو الملاحظة بدقة..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 resize-none transition-colors"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!details.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
              >
                <Send size={14} className="rotate-180" />
                <span>إرسال الملاحظة</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
});

FeedbackModal.displayName = 'FeedbackModal';
