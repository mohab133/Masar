import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Award,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  AlertCircle,
} from 'lucide-react';

interface MenoufBylawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenoufBylawModal: React.FC<MenoufBylawModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'grades' | 'departments' | 'rules'>('summary');
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    // Generate official printable PDF/Document blob
    const content = `
===================================================================
جامعة المنوفية - كلية الهندسة الإلكترونية بمنوف (FEE Menouf)
دليل اللائحة الداخلية لمرحلة البكالوريوس - نظام الساعات المعتمدة
===================================================================

1. متطلبات التخرج:
- إجمالي الساعات المعتمدة لنيل درجة البكالوريوس: 165 ساعة معتمدة.
- استيفاء متطلبات الجامعة والكلية والتخصص الإجباري والاختياري.
- اجتياز فترات التدريب الصيفي الميداني (تدريب 1 وتدريب 2).
- إنجاز مشروع التخرج بنجاح بمعدل تراكمي لا يقل عن 2.00 (C).

2. الأقسام العلمية بالكلية:
- قسم هندسة وعلوم الحاسب (Computer Science & Engineering)
- قسم هندسة الإلكترونيات والاتصالات الكهربية (Electronics & Comm. Engineering)
- قسم هندسة التحكم والآلات الإلكترونية الصناعية (Industrial Electronics & Control)

3. العبء الدراسي للفصل الواحد:
- الحد الأدنى للتسجيل: 12 ساعة معتمدة.
- الحد الأقصى للتسجيل: 19 ساعة معتمدة (يمكن زيادتها إلى 21 ساعة للطلاب المتفوقين أو المتوقع تخرجهم).
- الفصل الصيفي: بحد أقصى 7 إلى 9 ساعات معتمدة.

4. نظام حساب التقديرات والـ GPA:
- A+ : 97% فأكثر (4.00) | ممتاز مرتفع
- A  : 93% إلى أقل من 97% (4.00) | ممتاز
- A- : 89% إلى أقل من 93% (3.70)
- B+ : 84% إلى أقل من 89% (3.30) | جيد جداً مرتفع
- B  : 80% إلى أقل من 84% (3.00) | جيد جداً
- B- : 76% إلى أقل من 80% (2.70)
- C+ : 73% إلى أقل من 76% (2.30) | جيد مرتفع
- C  : 70% إلى أقل من 73% (2.00) | جيد (الحد الأدنى للتخرج)
- C- : 67% إلى أقل من 70% (1.70)
- D+ : 64% إلى أقل من 67% (1.30) | مقبول مرتفع
- D  : 60% إلى أقل من 64% (1.00) | مقبول
- F  : أقل من 60% (0.00) | راسب

5. الإنذار الأكاديمي:
- يوجه الإنذار الأكاديمي للطالب إذا انخفض معدله التراكمي (CGPA) عن 2.00 في أي فصل دراسي رئيسي.
===================================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FEE_Menouf_Bylaw_Credit_Hours.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 3500);
  };

  return (
    <div
      id="menouf-bylaw-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div
        id="menouf-bylaw-modal-container"
        className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">لائحة هندسة منوف (PDF)</h3>
                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                كلية الهندسة الإلكترونية بمنوف • جامعة المنوفية
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

        {/* Action Bar */}
        <div className="px-4 py-2.5 bg-red-50/60 border-b border-red-100 flex items-center justify-between text-xs">
          <span className="text-red-900 font-bold flex items-center gap-1.5">
            <Scale size={15} className="text-red-600" />
            نظام الساعات المعتمدة واللوائح الرسمية
          </span>

          <div className="flex items-center gap-1.5">
            <a
              href="http://fee.menofia.edu.eg/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-white text-slate-700 hover:text-red-700 rounded-lg border border-slate-200 text-xs font-semibold inline-flex items-center gap-1"
              title="موقع الكلية الرسمي"
            >
              <ExternalLink size={13} />
              <span>الكلية</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs ${
                isDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
              }`}
            >
              {isDownloaded ? (
                <>
                  <CheckCircle2 size={13} />
                  <span>تم التنزيل</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>تحميل الدليل</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50/80 px-3 pt-2 text-xs font-bold gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            className={`pb-2 px-3 border-b-2 transition-all shrink-0 ${
              activeTab === 'summary'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            نظرة عامة والتخرج
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grades')}
            className={`pb-2 px-3 border-b-2 transition-all shrink-0 ${
              activeTab === 'grades'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            التقديرات والـ GPA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`pb-2 px-3 border-b-2 transition-all shrink-0 ${
              activeTab === 'departments'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الأقسام العلمية
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`pb-2 px-3 border-b-2 transition-all shrink-0 ${
              activeTab === 'rules'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            الإنذار والتسجيل
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3.5 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'summary' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                  <GraduationCap size={18} className="text-red-600" />
                  <span>متطلبات نيل درجة البكالوريوس</span>
                </div>
                <p className="text-slate-600 text-xs">
                  تمنح جامعة المنوفية بناءً على طلب مجلس كلية الهندسة الإلكترونية بمنوف درجة البكالوريوس في الهندسة الإلكترونية في التخصص المعني عند استيفاء الآتي:
                </p>
                <ul className="mt-2 space-y-1.5 text-slate-700">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>اجتياز إجمالي <strong>165 ساعة معتمدة</strong> بنجاح.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>الحصول على معدل تراكمي عام (CGPA) لا يقل عن <strong>2.00 (تقدير C)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>اجتياز فترات التدريب الميداني الصيفي (تدريب 1 وتدريب 2).</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-500 font-bold">•</span>
                    <span>إنجاز مشروع التخرج بنجاح وفق شروط القسم العلمي.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 text-sm font-bold text-red-900 mb-1">
                  <Calendar size={18} className="text-red-600" />
                  <span>الفصول والسنوات الدراسية</span>
                </div>
                <p className="text-xs text-slate-600">
                  العام الجامعي يتكون من فصلين دراسيين رئيسيين (خريف وربيع) مدة كل منهما 15 أسبوعاً دراسياً، ويجوز فتح فصل صيفي مكثف (8 أسابيع) بموافقة الكلية.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
                  <Award size={18} className="text-amber-600" />
                  <span>جدول حساب التقديرات ونقاط الـ GPA</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="p-2 border-b">الدرجة المئوية</th>
                        <th className="p-2 border-b">الرمز</th>
                        <th className="p-2 border-b">النقاط (4.00)</th>
                        <th className="p-2 border-b">التقدير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="p-2">97% فأكثر</td><td className="p-2 font-bold text-emerald-700">A+</td><td className="p-2 font-bold">4.00</td><td className="p-2">ممتاز مرتفع</td></tr>
                      <tr><td className="p-2">93% إلى أقل من 97%</td><td className="p-2 font-bold text-emerald-700">A</td><td className="p-2 font-bold">4.00</td><td className="p-2">ممتاز</td></tr>
                      <tr><td className="p-2">89% إلى أقل من 93%</td><td className="p-2 font-bold text-emerald-700">A-</td><td className="p-2 font-bold">3.70</td><td className="p-2">ممتاز منخفض</td></tr>
                      <tr><td className="p-2">84% إلى أقل من 89%</td><td className="p-2 font-bold text-slate-800">B+</td><td className="p-2 font-bold">3.30</td><td className="p-2">جيد جداً مرتفع</td></tr>
                      <tr><td className="p-2">80% إلى أقل من 84%</td><td className="p-2 font-bold text-slate-800">B</td><td className="p-2 font-bold">3.00</td><td className="p-2">جيد جداً</td></tr>
                      <tr><td className="p-2">73% إلى أقل من 76%</td><td className="p-2 font-bold text-amber-700">C+</td><td className="p-2 font-bold">2.30</td><td className="p-2">جيد مرتفع</td></tr>
                      <tr><td className="p-2">70% إلى أقل من 73%</td><td className="p-2 font-bold text-amber-700">C</td><td className="p-2 font-bold">2.00</td><td className="p-2">جيد (حد التخرج)</td></tr>
                      <tr><td className="p-2">60% إلى أقل من 64%</td><td className="p-2 font-bold text-slate-700">D</td><td className="p-2 font-bold">1.00</td><td className="p-2">مقبول</td></tr>
                      <tr><td className="p-2">أقل من 60%</td><td className="p-2 font-bold text-rose-700">F</td><td className="p-2 font-bold">0.00</td><td className="p-2 text-rose-600 font-bold">راسب</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'departments' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Layers size={16} className="text-slate-700" />
                  <span>هندسة وعلوم الحاسب (CSE)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  البرمجيات، الذكاء الاصطناعي، شبكات الحاسب، أنظمة التشغيل، الأمن السيبراني، والحوسبة السحابية.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Layers size={16} className="text-slate-700" />
                  <span>هندسة الإلكترونيات والاتصالات الكهربية (ECE)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  أنظمة الاتصالات الرقمية، معالجة الإشارات، الدوائر الإلكترونية المتكاملة، الهوائيات والموجات الدقيقة.
                </p>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Layers size={16} className="text-emerald-600" />
                  <span>هندسة التحكم والآلات الإلكترونية الصناعية (IEC)</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  أنظمة التحكم الآلي، الروبوتات، الأتمتة الصناعية، أنظمة القيادة الكهربائية والإلكترونيات القوى.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80">
                <div className="flex items-center gap-2 text-sm font-bold text-amber-900 mb-1">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span>الإنذار الأكاديمي والعبء الدراسي</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  • <strong>الإنذار الأكاديمي:</strong> يوجه للطالب إذا كان معدله التراكمي أقل من <strong>2.00</strong>، ويترتب عليه تقليص عدد الساعات المسجلة في الفصل التالي (12 ساعة كحد أقصى) للتركيز على تحسين المعدل.
                </p>
                <p className="text-xs text-slate-700 leading-relaxed mt-2">
                  • <strong>ساعات الفصل الدراسي:</strong> الطالب غير المنذر يسجل من 12 إلى 19 ساعة معتمدة. الطالب المنذر بحد أقصى 12-14 ساعة معتمدة.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                  <BookOpen size={18} className="text-slate-700" />
                  <span>الحذف والإضافة والانسحاب</span>
                </div>
                <p className="text-xs text-slate-600">
                  يجوز للطالب تعديل تسجيله (إضافة أو حذف مقررات) خلال أول أسبوعين من بداية الفصل الدراسي الرئيسي دون أن يسجل ذلك في سجله الأكاديمي.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>لائحة الساعات المعتمدة الرسمية</span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="text-red-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            <Download size={13} />
            <span>تنزيل نسخة نصية / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
