import React, { useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Send } from 'lucide-react';
import { submitFeedback } from '../lib/masarApi';

const MAX_FEEDBACK_LENGTH = 300;
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
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setErrorMessage('');
      setIsOverLimit(false);
      setIsSubmitted(false);
      setDetails('');
    } else if (isMounted) {
      const timer = window.setTimeout(() => setIsMounted(false), 160);
      return () => window.clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(Math.max(textarea.scrollHeight, 64), 360)}px`;
  }, [details]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = details.trim();
    if (!value || isSending) return;
    setErrorMessage('');
    if (isOverLimit || value.length > MAX_FEEDBACK_LENGTH) {
      setErrorMessage(`الحد الأقصى ${MAX_FEEDBACK_LENGTH} حرف.`);
      return;
    }

    const lastSubmittedAt = Number(localStorage.getItem('masar_feedback_last_submitted_at') || 0);
    if (Date.now() - lastSubmittedAt < FEEDBACK_COOLDOWN_MS) {
      setErrorMessage('تم إرسال ملاحظة مؤخرًا. حاول مرة أخرى بعد قليل.');
      return;
    }

    setIsSending(true);
    try {
      let clientId = localStorage.getItem(FEEDBACK_CLIENT_ID_KEY);
      if (!clientId) {
        clientId = crypto.randomUUID?.() || `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(FEEDBACK_CLIENT_ID_KEY, clientId);
      }
      await submitFeedback(value, clientId);

      localStorage.setItem('masar_feedback_last_submitted_at', String(Date.now()));
      setErrorMessage('');
      setIsSubmitted(true);
    } catch (err) {
      console.warn('Feedback send failed', err);
      const status = err && typeof err === 'object' && 'status' in err ? Number((err as { status?: unknown }).status) : 0;
      if (status === 429) {
        setErrorMessage('تم الوصول للحد المسموح من الملاحظات. حاول مرة أخرى لاحقًا.');
      } else {
        setErrorMessage('تعذر إرسال الملاحظة الآن. حاول مرة أخرى.');
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isMounted) return null;

  const modal = (
    <>
      <div
        id="feedback-modal-overlay"
        data-no-swipe="true"
        className={`fixed inset-0 z-50 w-screen min-h-[100dvh] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 transition-opacity duration-150 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        dir="rtl"
        onClick={onClose}
      >
        <div
          id="feedback-modal-card"
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transform transition-transform duration-150 ease-out ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[0.98]'}`}
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
                      ref={textareaRef}
                      id="feedback-details"
                      rows={2}
                      value={details}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        if (rawValue.length > MAX_FEEDBACK_LENGTH) {
                          setDetails(rawValue.slice(0, MAX_FEEDBACK_LENGTH));
                          setIsOverLimit(true);
                          setErrorMessage(`الحد الأقصى ${MAX_FEEDBACK_LENGTH} حرف.`);
                        } else {
                          setDetails(rawValue);
                          if (isOverLimit) {
                            setIsOverLimit(false);
                            setErrorMessage('');
                          }
                        }
                      }}
                      placeholder="اكتب ملاحظتك هنا..."
                      className={`w-full min-h-16 p-3 text-sm leading-6 rounded-xl border bg-slate-50/50 resize-none overflow-y-auto text-slate-800 placeholder:text-slate-400 focus:outline-hidden transition-colors ${isOverLimit ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                      autoFocus
                      required
                    />
                    <div className={`mt-1.5 text-left text-[11px] font-medium ${details.length >= MAX_FEEDBACK_LENGTH ? 'text-red-600' : 'text-slate-400'}`} dir="ltr">
                      {details.length} / {MAX_FEEDBACK_LENGTH}
                    </div>
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
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
});

FeedbackModal.displayName = 'FeedbackModal';
