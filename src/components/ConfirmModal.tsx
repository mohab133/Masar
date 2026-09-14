import React, { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, ExternalLink, HelpCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: 'download' | 'link' | 'action';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = memo(({
  isOpen,
  title = 'تأكيد الإجراء',
  message,
  type = 'download',
  confirmText,
  cancelText = 'إلغاء',
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultConfirmText =
    type === 'download' ? 'تحميل الملف' :
    type === 'link' ? 'الانتقال للموقع' : 'موافق';

  const icon =
    type === 'download' ? <Download size={21} strokeWidth={2.25} /> :
    type === 'link' ? <ExternalLink size={21} strokeWidth={2.25} /> :
    <HelpCircle size={21} strokeWidth={2.25} />;

  const iconBg =
    type === 'download'
      ? 'bg-blue-50 text-blue-600 border-blue-100'
      : type === 'link'
      ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
      : 'bg-slate-50 text-slate-600 border-slate-100';

  const modal = (
    <div
      data-no-swipe="true"
      className="fixed inset-0 z-[100] flex items-center justify-center w-screen h-[100dvh] bg-slate-950/35 backdrop-blur-[1px] p-4 sm:p-5"
      dir="rtl"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-[25rem] overflow-hidden rounded-[1.55rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3.5 top-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 active:bg-slate-200"
          aria-label="إغلاق"
        >
          <X size={19} strokeWidth={2} />
        </button>

        <div className="px-6 pb-5 pt-7 text-center sm:px-7 sm:pt-8">
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${iconBg}`}>
            {icon}
          </div>

          <h3
            id="confirm-modal-title"
            className="mt-4 text-[18px] font-extrabold leading-7 text-slate-950"
          >
            {title}
          </h3>

          <p className="mx-auto mt-2 max-w-[20rem] text-sm font-medium leading-6 text-slate-600">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2.5 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="min-h-11 flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
          >
            {confirmText || defaultConfirmText}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-[5rem] rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white active:bg-slate-100"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null;
});

ConfirmModal.displayName = 'ConfirmModal';
