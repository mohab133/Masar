import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Send } from 'lucide-react';
import { submitFeedback } from '../lib/masarApi';

const MAX_FEEDBACK_LENGTH = 2000;
const FEEDBACK_COOLDOWN_MS = 30 * 1000;
const FEEDBACK_CLIENT_ID_KEY = 'masar_feedback_client_id';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = memo(({ isOpen, onClose }) => {
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = details.trim();
    if (!value || isSending) return;
    setErrorMessage('');
    if (value.length > MAX_FEEDBACK_LENGTH) {
      setErrorMessage(`الملاحظة طويلة جدًا. الحد الأقصى ${MAX_FEEDBACK_LENGTH} حرف.`);
      return;
    }

    const lastSubmittedAt = Number(localStorage.getItem('masar_feedback_last_submitted_at') || 0);
    if (Date.now() - lastSubmittedAt < FEEDBACK_COOLDOWN_MS) {
      setErrorMessage('تم إرسال ملاحظة مؤخرًا. حاول مرة أخرى بعد قليل.');
      return;
    }

    setIsSending(true);
    try {
      if (import.meta.env.VITE_API_BASE_URL) {
        let clientId = localStorage.getItem(FEEDBACK_CLIENT_ID_KEY);
        if (!clientId) {
          clientId = crypto.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          localStorage.setItem(FEEDBACK_CLIENT_ID_KEY, clientId);
        }
        await submitFeedback(value, clientId);
      } else {
        const newNote = { id: `note-${Date.now()}`, details: value, submittedAt: new Date().toISOString() };
        const existing = JSON.parse(localStorage.getItem('masar_feedback_entries') || '[]');
        localStorage.setItem('masar_feedback_entries', JSON.stringify([...existing, newNote]));
      }

      localStorage.setItem('masar_feedback_last_submitted_at', String(Date.now()));
      setErrorMessage('');
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setDetails('');
        onClose();
      }, 1200);
    } catch (err) {
      console.warn('Feedback send failed', err);
      setErrorMessage('تعذر إرسال الملاحظة الآن. حاول مرة أخرى.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const modal = (
    <>
      {isOpen && (
        <div
          id="feedback-modal-overlay"
          data-no-swipe="true"
        className="fixed inset-0 z-50 w-screen min-h-[100dvh] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-0 sm:p-4"
          dir="rtl"
          onClick={onClose}
        >
          <div
            id="feedback-modal-card"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">كتابة ملاحظة</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  اكتب ملاحظتك وسيتم استلامها فوراً
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {isSubmitted ? (
                <div className="py-6 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                    <CheckCircle2 size={26} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">تم إرسال الملاحظة بنجاح</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    شكراً لك، تم حفظ ملاحظتك.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-5 text-red-700"
                    >
                      {errorMessage}
                    </div>
                  )}
                  <div>
                    <textarea
                      id="feedback-details"
                      rows={4}
                      value={details}
                      maxLength={MAX_FEEDBACK_LENGTH}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="اكتب ملاحظتك هنا..."
                      aria-describedby="feedback-limit"
                      className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-500 bg-slate-50/50 resize-none text-slate-800 placeholder:text-slate-400"
                      autoFocus
                      required
                    />
                    <p id="feedback-limit" className="mt-1 text-[10px] text-slate-400 text-left">الحد الأقصى 2000 حرف</p>
                  </div>

                  <button
                    type="submit"
                    disabled={!details.trim() || isSending}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                  >
                    <Send size={15} className="rotate-180" />
                    <span>{isSending ? 'جارٍ الإرسال...' : 'إرسال الملاحظة'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
});

FeedbackModal.displayName = 'FeedbackModal';
