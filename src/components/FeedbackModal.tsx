import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Lightbulb, MessageSquare, Send } from 'lucide-react';
import { FeedbackType } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [type, setType] = useState<FeedbackType>('error');
  const [courseOrSection, setCourseOrSection] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

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
      const existing = JSON.parse(localStorage.getItem('masar_feedback_entries') || '[]');
      localStorage.setItem('masar_feedback_entries', JSON.stringify([...existing, newFeedback]));
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
    }, 1800);
  };

  return (
    <div
      id="feedback-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-0 sm:p-4"
      dir="rtl"
    >
      <div
        id="feedback-modal-card"
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">إرسال ملاحظة</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              اكتب ملاحظتك أو أي تصحيح في المواعيد
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {isSubmitted ? (
            <div className="py-8 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h4 className="text-base font-bold text-slate-900">تم استلام ملاحظتك بنجاح</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                شكراً لمساعدتك في إبقاء بيانات مسار دقيقة ومحدثة لجميع الزملاء.
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
                    onClick={() => setType('error')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                      type === 'error'
                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle size={14} className={type === 'error' ? 'text-rose-600' : 'text-slate-600'} />
                    <span>خطأ بالبيانات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('suggestion')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                      type === 'suggestion'
                        ? 'border-sky-200 bg-sky-50 text-sky-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Lightbulb size={14} className={type === 'suggestion' ? 'text-sky-600' : 'text-slate-600'} />
                    <span>اقتراح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('note')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-colors ${
                      type === 'note'
                        ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare size={14} className={type === 'note' ? 'text-slate-800' : 'text-slate-600'} />
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
                  placeholder="مثال: Biology - سكشن 3 أو مادة Physics"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-400 bg-slate-50/50"
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-400 bg-slate-50/50 resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!details.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Send size={14} className="rotate-180" />
                  <span>إرسال الملاحظة</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
