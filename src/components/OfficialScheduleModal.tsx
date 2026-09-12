import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, CheckCircle2, FileImage } from 'lucide-react';
import { OfficialScheduleDocument } from '../types';

interface OfficialScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OfficialScheduleDocument | null;
}

export const OfficialScheduleModal: React.FC<OfficialScheduleModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen || !document) return null;

  const handleDownload = () => {
    const svgElement = window.document.getElementById('official-schedule-svg') as unknown as SVGElement | null;
    if (svgElement) {
      try {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL;
        const blobUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
          const canvas = window.document.createElement('canvas');
          // Scale 2x for Retina high resolution
          canvas.width = 1520;
          canvas.height = 1080;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((pngBlob) => {
              if (pngBlob) {
                const pngUrl = URL.createObjectURL(pngBlob);
                const link = window.document.createElement('a');
                link.href = pngUrl;
                link.download = document.downloadFileName || 'Masar_Official_Schedule.png';
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
                URL.revokeObjectURL(pngUrl);
              }
            }, 'image/png');
          }
          URL.revokeObjectURL(blobUrl);
        };
        img.src = blobUrl;
      } catch {
        // Fallback to SVG download if canvas is restricted
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = 'Masar_Official_Schedule.svg';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3500);
  };

  return (
    <div
      id="official-schedule-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="official-schedule-modal-container"
        className="bg-white rounded-3xl w-full max-w-xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <FileImage size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{document.title}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {document.term} • {document.academicYear}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="إغلاق"
          >
            <X size={20} />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.2))}
              className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs flex items-center gap-1 font-bold"
              title="تكبير"
            >
              <ZoomIn size={14} />
              <span>تكبير</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs flex items-center gap-1 font-bold"
              title="تصغير"
            >
              <ZoomOut size={14} />
              <span>تصغير</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-semibold"
            >
              الحجم الطبيعي
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs ${
              isDownloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 text-white hover:bg-black active:scale-95'
            }`}
          >
            {isDownloaded ? (
              <>
                <CheckCircle2 size={14} />
                <span>تم التحميل بنجاح</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>تحميل الصورة بدقة عالية</span>
              </>
            )}
          </button>
        </div>

        {/* Schedule Sheet Content Viewer */}
        <div className="p-3 bg-slate-200/70 overflow-auto flex-1 flex items-center justify-center min-h-[380px]">
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 bg-white p-3.5 rounded-xl shadow-md border border-slate-300 w-full max-w-[680px]"
          >
            {/* SVG Timetable / Sheet with official look */}
            <svg
              id="official-schedule-svg"
              viewBox="0 0 760 540"
              className="w-full h-auto text-slate-900"
              style={{ fontFamily: "'Cairo', 'Segoe UI', system-ui, sans-serif" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White Background with subtle outer border */}
              <rect width="760" height="540" fill="#ffffff" rx="10" stroke="#cbd5e1" strokeWidth="1" />

              {/* Official University Header Bar */}
              <rect width="760" height="74" fill="#0f172a" rx="10 10 0 0" />
              <rect x="0" y="72" width="760" height="3" fill="#10b981" />

              {/* University Title & Department (Right side) */}
              <text x="735" y="30" fill="#ffffff" fontSize="15" fontWeight="800" textAnchor="end">
                جامعة المنوفية • كلية الهندسة الإلكترونية بمنوف (FEE)
              </text>
              <text x="735" y="52" fill="#94a3b8" fontSize="11" fontWeight="600" textAnchor="end">
                شؤون التعليم والطلاب • الفرقة الثانية • {document.term} {document.academicYear}
              </text>

              {/* Left Official Badge */}
              <rect x="25" y="20" width="185" height="34" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
              <text x="117" y="42" fill="#e2e8f0" fontSize="11.5" fontWeight="700" textAnchor="middle">
                {document.typeLabelAr} المعتمد
              </text>

              {document.type === 'lectures_sections' ? (
                // Lectures & Sections Timetable
                <g transform="translate(20, 92)">
                  {/* Table Column Headers (Total width: 720) */}
                  <rect x="0" y="0" width="720" height="34" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="6 6 0 0" />
                  
                  {/* Day Column Header */}
                  <text x="675" y="22" fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">
                    اليوم
                  </text>

                  {/* Time Periods Headers */}
                  <text x="555" y="22" fill="#1e293b" fontSize="11.5" fontWeight="700" textAnchor="middle">
                    09:00 - 10:30 ص
                  </text>
                  <text x="405" y="22" fill="#1e293b" fontSize="11.5" fontWeight="700" textAnchor="middle">
                    11:00 - 12:30 م
                  </text>
                  <text x="255" y="22" fill="#1e293b" fontSize="11.5" fontWeight="700" textAnchor="middle">
                    01:00 - 02:30 م
                  </text>
                  <text x="100" y="22" fill="#1e293b" fontSize="11.5" fontWeight="700" textAnchor="middle">
                    02:45 - 04:15 م
                  </text>

                  {/* Vertical dividers in header */}
                  <line x1="630" y1="0" x2="630" y2="34" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="480" y1="0" x2="480" y2="34" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="330" y1="0" x2="330" y2="34" stroke="#cbd5e1" strokeWidth="1" />
                  <line x1="180" y1="0" x2="180" y2="34" stroke="#cbd5e1" strokeWidth="1" />

                  {/* Day 1: Sunday (الأحد) */}
                  <g transform="translate(0, 34)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="630" y="0" width="90" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="675" y="34" fill="#0f172a" fontSize="12.5" fontWeight="800" textAnchor="middle">الأحد</text>

                    {/* Period 1: Biology Lecture */}
                    <rect x="487" y="5" width="136" height="48" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="555" y="24" fill="#1e3a8a" fontSize="11.5" fontWeight="800" textAnchor="middle">محاضرة Biology</text>
                    <text x="555" y="42" fill="#475569" fontSize="10" fontWeight="600" textAnchor="middle">مدرج 3 • د. سامح</text>

                    {/* Period 2: Physics Lecture */}
                    <rect x="337" y="5" width="136" height="48" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="405" y="24" fill="#1e3a8a" fontSize="11.5" fontWeight="800" textAnchor="middle">محاضرة Physics</text>
                    <text x="405" y="42" fill="#475569" fontSize="10" fontWeight="600" textAnchor="middle">مدرج 1 • د. عصام جودة</text>

                    {/* Period 3: Chemistry Sections */}
                    <rect x="187" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="255" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكاشن كيمياء (1, 2, 3)</text>
                    <text x="255" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معامل الكيمياء 1 و 4</text>

                    {/* Period 4: Free */}
                    <rect x="10" y="8" width="160" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="90" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">فترة استراحة وأنشطة</text>
                  </g>

                  {/* Day 2: Monday (الإثنين) */}
                  <g transform="translate(0, 92)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="630" y="0" width="90" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="675" y="34" fill="#0f172a" fontSize="12.5" fontWeight="800" textAnchor="middle">الإثنين</text>

                    {/* Period 1: Chemistry Lecture */}
                    <rect x="487" y="5" width="136" height="48" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="555" y="24" fill="#1e3a8a" fontSize="11.5" fontWeight="800" textAnchor="middle">محاضرة Chemistry</text>
                    <text x="555" y="42" fill="#475569" fontSize="10" fontWeight="600" textAnchor="middle">مدرج 2 • د. نادية سليم</text>

                    {/* Period 2: Biology Sections */}
                    <rect x="337" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="405" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكاشن Biology (1, 2, 3)</text>
                    <text x="405" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معامل الأحياء 1 و 3</text>

                    {/* Period 3: Section 3 Physics */}
                    <rect x="187" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="255" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 3 فيزياء</text>
                    <text x="255" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل فيزياء 3 • م. طارق</text>

                    {/* Period 4: Free */}
                    <rect x="10" y="8" width="160" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="90" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">--</text>
                  </g>

                  {/* Day 3: Tuesday (الثلاثاء) */}
                  <g transform="translate(0, 150)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="630" y="0" width="90" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="675" y="34" fill="#0f172a" fontSize="12.5" fontWeight="800" textAnchor="middle">الثلاثاء</text>

                    {/* Period 1: Section 2 Biology */}
                    <rect x="487" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="555" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 2 أحياء</text>
                    <text x="555" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل 3 • م. ياسمين</text>

                    {/* Period 2: Section 3 Biology */}
                    <rect x="337" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="405" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 3 أحياء</text>
                    <text x="405" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل 2 • م. فهمي</text>

                    {/* Period 3: Section 2 Physics */}
                    <rect x="187" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="255" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 2 فيزياء</text>
                    <text x="255" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">قاعة 6 • م. سارة</text>

                    {/* Period 4: Free */}
                    <rect x="10" y="8" width="160" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="90" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">--</text>
                  </g>

                  {/* Day 4: Wednesday (الأربعاء) */}
                  <g transform="translate(0, 208)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <rect x="630" y="0" width="90" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="675" y="34" fill="#0f172a" fontSize="12.5" fontWeight="800" textAnchor="middle">الأربعاء</text>

                    {/* Period 1: Physics Lecture 2 */}
                    <rect x="487" y="5" width="136" height="48" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="555" y="24" fill="#1e3a8a" fontSize="11.5" fontWeight="800" textAnchor="middle">محاضرة Physics 2</text>
                    <text x="555" y="42" fill="#475569" fontSize="10" fontWeight="600" textAnchor="middle">مدرج 1 • د. عصام جودة</text>

                    {/* Period 2: Section 2 Chem */}
                    <rect x="337" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="405" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 2 كيمياء</text>
                    <text x="405" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل 3 • م. أحمد خالد</text>

                    {/* Period 3: Section 3 Chem */}
                    <rect x="187" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="255" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 3 كيمياء</text>
                    <text x="255" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل 2 • م. سارة محمود</text>

                    {/* Period 4: Free */}
                    <rect x="10" y="8" width="160" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="90" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">--</text>
                  </g>

                  {/* Day 5: Thursday (الخميس) */}
                  <g transform="translate(0, 266)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="0 0 6 6" />
                    <rect x="630" y="0" width="90" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="0 0 6 0" />
                    <text x="675" y="34" fill="#0f172a" fontSize="12.5" fontWeight="800" textAnchor="middle">الخميس</text>

                    {/* Period 1: Section 3 Biology extra */}
                    <rect x="487" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="555" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 3 أحياء</text>
                    <text x="555" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل 2 (10:00 - 11:30)</text>

                    {/* Period 2: Section 1 Physics */}
                    <rect x="337" y="5" width="136" height="48" rx="8" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="405" y="24" fill="#065f46" fontSize="11.5" fontWeight="800" textAnchor="middle">سكشن 1 فيزياء</text>
                    <text x="405" y="42" fill="#047857" fontSize="10" fontWeight="600" textAnchor="middle">معمل فيزياء 2</text>

                    {/* Period 3: End of Day */}
                    <rect x="187" y="8" width="136" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="255" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">انتهاء اليوم الدراسي</text>

                    {/* Period 4: Free */}
                    <rect x="10" y="8" width="160" height="42" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeDasharray="3 2" />
                    <text x="90" y="33" fill="#94a3b8" fontSize="10" fontWeight="600" textAnchor="middle">--</text>
                  </g>
                </g>
              ) : (
                // Official Exam Schedule (Midterm or Final Table)
                <g transform="translate(20, 92)">
                  <rect x="0" y="0" width="720" height="34" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="6 6 0 0" />
                  <text x="650" y="22" fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">التاريخ واليوم</text>
                  <text x="480" y="22" fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">المقرر والرمز</text>
                  <text x="310" y="22" fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">التوقيت والزمن</text>
                  <text x="120" y="22" fill="#0f172a" fontSize="12" fontWeight="800" textAnchor="middle">أماكن اللجان والقاعات</text>

                  {/* Exam Row 1 */}
                  <g transform="translate(0, 34)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="650" y="26" fill="#0f172a" fontSize="11.5" fontWeight="800" textAnchor="middle">
                      {document.type === 'midterm' ? 'الأحد 01 نوفمبر' : 'الأحد 27 ديسمبر'}
                    </text>
                    <text x="650" y="44" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">اليوم الأول</text>

                    <text x="480" y="26" fill="#1e3a8a" fontSize="12" fontWeight="800" textAnchor="middle">Biology (BIO 101)</text>
                    <text x="480" y="44" fill="#64748b" fontSize="10" textAnchor="middle">أحياء عامة 1</text>

                    <text x="310" y="26" fill="#0f172a" fontSize="11.5" fontWeight="700" textAnchor="middle">09:00 ص - 10:30 ص</text>
                    <text x="310" y="44" fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle">ساعة ونصف</text>

                    <text x="120" y="26" fill="#0f172a" fontSize="11.5" fontWeight="600" textAnchor="middle">مدرج أ / ب المركزي</text>
                    <text x="120" y="44" fill="#64748b" fontSize="10" textAnchor="middle">حسب رقم الجلوس</text>
                  </g>

                  {/* Exam Row 2 */}
                  <g transform="translate(0, 92)">
                    <rect x="0" y="0" width="720" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="650" y="26" fill="#0f172a" fontSize="11.5" fontWeight="800" textAnchor="middle">
                      {document.type === 'midterm' ? 'الأربعاء 04 نوفمبر' : 'الأربعاء 30 ديسمبر'}
                    </text>
                    <text x="650" y="44" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">اليوم الثاني</text>

                    <text x="480" y="26" fill="#1e3a8a" fontSize="12" fontWeight="800" textAnchor="middle">Physics (PHYS 102)</text>
                    <text x="480" y="44" fill="#64748b" fontSize="10" textAnchor="middle">فيزياء عامة 1</text>

                    <text x="310" y="26" fill="#0f172a" fontSize="11.5" fontWeight="700" textAnchor="middle">09:00 ص - 10:30 ص</text>
                    <text x="310" y="44" fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle">ساعة ونصف</text>

                    <text x="120" y="26" fill="#0f172a" fontSize="11.5" fontWeight="600" textAnchor="middle">مدرج 1 ومدرج 2</text>
                    <text x="120" y="44" fill="#64748b" fontSize="10" textAnchor="middle">جميع المجموعات</text>
                  </g>

                  {/* Exam Row 3 */}
                  <g transform="translate(0, 150)">
                    <rect x="0" y="0" width="720" height="58" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="650" y="26" fill="#0f172a" fontSize="11.5" fontWeight="800" textAnchor="middle">
                      {document.type === 'midterm' ? 'الأحد 08 نوفمبر' : 'الأحد 03 يناير'}
                    </text>
                    <text x="650" y="44" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">اليوم الثالث</text>

                    <text x="480" y="26" fill="#1e3a8a" fontSize="12" fontWeight="800" textAnchor="middle">Chemistry (CHEM 101)</text>
                    <text x="480" y="44" fill="#64748b" fontSize="10" textAnchor="middle">كيمياء عامة وفيزيائية</text>

                    <text x="310" y="26" fill="#0f172a" fontSize="11.5" fontWeight="700" textAnchor="middle">09:00 ص - 10:30 ص</text>
                    <text x="310" y="44" fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle">ساعة ونصف</text>

                    <text x="120" y="26" fill="#0f172a" fontSize="11.5" fontWeight="600" textAnchor="middle">مبنى الامتحانات المركزي</text>
                    <text x="120" y="44" fill="#64748b" fontSize="10" textAnchor="middle">قاعات 101 - 108</text>
                  </g>

                  {/* Exam Row 4 */}
                  <g transform="translate(0, 208)">
                    <rect x="0" y="0" width="720" height="58" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="0 0 6 6" />
                    <text x="650" y="26" fill="#0f172a" fontSize="11.5" fontWeight="800" textAnchor="middle">
                      {document.type === 'midterm' ? 'الخميس 12 نوفمبر' : 'الخميس 07 يناير'}
                    </text>
                    <text x="650" y="44" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">اليوم الرابع</text>

                    <text x="480" y="26" fill="#1e3a8a" fontSize="12" fontWeight="800" textAnchor="middle">Mathematics (MATH 101)</text>
                    <text x="480" y="44" fill="#64748b" fontSize="10" textAnchor="middle">تفاضل وتكامل 1</text>

                    <text x="310" y="26" fill="#0f172a" fontSize="11.5" fontWeight="700" textAnchor="middle">09:00 ص - 10:30 ص</text>
                    <text x="310" y="44" fill="#059669" fontSize="10" fontWeight="700" textAnchor="middle">ساعة ونصف</text>

                    <text x="120" y="26" fill="#0f172a" fontSize="11.5" fontWeight="600" textAnchor="middle">مدرج 3 وصالة الامتحانات</text>
                    <text x="120" y="44" fill="#64748b" fontSize="10" textAnchor="middle">اللجان الفردية والزوجية</text>
                  </g>
                </g>
              )}

              {/* Official Stamp & University Signatures */}
              <g transform="translate(30, 442)">
                {/* Official Signatures */}
                <text x="95" y="20" fill="#475569" fontSize="11" fontWeight="700" textAnchor="middle">أمين عام الكلية</text>
                <text x="95" y="38" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">يعتمد / أ. محمود متولي</text>

                <text x="345" y="20" fill="#475569" fontSize="11" fontWeight="700" textAnchor="middle">مدير عام شؤون الطلاب</text>
                <text x="345" y="38" fill="#64748b" fontSize="10" fontWeight="600" textAnchor="middle">أ. إيمان سالم</text>

                <text x="615" y="20" fill="#0f172a" fontSize="11.5" fontWeight="800" textAnchor="middle">وكيل الكلية لشؤون التعليم والطلاب</text>
                <text x="615" y="38" fill="#1e40af" fontSize="11" fontWeight="800" textAnchor="middle">أ.د. عبد الحميد الوزير</text>

                {/* Republic Seal Circular Stamp */}
                <circle cx="215" cy="30" r="30" fill="none" stroke="#2563eb" strokeWidth="2" opacity="0.65" />
                <circle cx="215" cy="30" r="25" fill="none" stroke="#2563eb" strokeWidth="1" strokeDasharray="3 2" opacity="0.65" />
                <text x="215" y="26" fill="#2563eb" fontSize="7.5" fontWeight="bold" textAnchor="middle" opacity="0.8">جامعة المنصورة</text>
                <text x="215" y="37" fill="#2563eb" fontSize="7" fontWeight="bold" textAnchor="middle" opacity="0.8">خاتم شعار الجمهورية</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{document.approvedDate}</span>
          <span className="font-semibold text-slate-700">{document.fileSize}</span>
        </div>
      </div>
    </div>
  );
};
