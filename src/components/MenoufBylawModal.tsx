import React, { useState, useCallback, memo } from 'react';
import {
  X,
  Download,
  FileText,
  CheckCircle2,
  GraduationCap,
  Award,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { triggerHaptic } from '../utils/haptics';

interface MenoufBylawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenoufBylawModal: React.FC<MenoufBylawModalProps> = memo(({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'grades' | 'departments' | 'rules'>('summary');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const handleTabSelect = (tab: 'summary' | 'grades' | 'departments' | 'rules') => {
    triggerHaptic('selection');
    setActiveTab(tab);
  };

  const handleDownloadSummary = useCallback(() => {
    triggerHaptic('light');
    setIsDownloading(true);

    setTimeout(() => {
      // Generate official summary document blob
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
      link.download = 'FEE_Menouf_Bylaw_Summary.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setIsDownloaded(true);
      triggerHaptic('success');
      setTimeout(() => setIsDownloaded(false), 3000);
    }, 600);
  }, []);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} id="menouf-bylaw-sheet" maxWidthClass="max-w-lg">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <GraduationCap size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              دليل لائحة كلية الهندسة الإلكترونية
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              نظام الساعات المعتمدة وقواعد النجاح والتخرج
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          aria-label="إغلاق النافذة"
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs Pill Navigation */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-slate-100 flex gap-1.5 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => handleTabSelect('summary')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <BookOpen size={14} />
          <span>ملخص عام</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('grades')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'grades'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Award size={14} />
          <span>التقديرات والـ GPA</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('departments')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'departments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers size={14} />
          <span>الأقسام العلمية</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('rules')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Scale size={14} />
          <span>قواعد الإنذار والعبء</span>
        </button>
      </div>

      {/* Tab Content Area */}
      <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[60vh] text-slate-700 text-sm leading-relaxed">
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4">
              <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-1.5">
                <GraduationCap size={18} className="text-blue-600" />
                <span>متطلبات نيل درجة البكالوريوس (165 ساعة)</span>
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-blue-950 leading-normal">
                <li>إتمام 165 ساعة معتمدة بنجاح بمعدل تراكمي عام لا يقل عن 2.00 (C).</li>
                <li>اجتياز المقررات الإجبارية والاختيارية ومتطلبات الجامعة والكلية.</li>
                <li>إتمام فترتي التدريب الصيفي الميداني بنجاح واجتياز المناقشة.</li>
                <li>إنجاز مشروع التخرج ومناقشته والحصول على تقدير C على الأقل.</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">الفصول الدراسية</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">فصلين رئيسيين + صيفي</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium block">لغة الدراسة</span>
                <span className="text-xs font-bold text-slate-800 mt-0.5 block">اللغة الإنجليزية</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="space-y-3">
            <div className="overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">الرمز</th>
                    <th className="p-2.5">النسبة المئوية</th>
                    <th className="p-2.5">النقاط (4.00)</th>
                    <th className="p-2.5">التقدير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                  <tr className="bg-emerald-50/40">
                    <td className="p-2.5 font-bold text-emerald-700">A+</td>
                    <td className="p-2.5">≥ 97%</td>
                    <td className="p-2.5 font-bold">4.00</td>
                    <td className="p-2.5 font-bold">ممتاز مرتفع</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-600">A</td>
                    <td className="p-2.5">93% - &lt;97%</td>
                    <td className="p-2.5 font-bold">4.00</td>
                    <td className="p-2.5">ممتاز</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-emerald-600">A-</td>
                    <td className="p-2.5">89% - &lt;93%</td>
                    <td className="p-2.5 font-bold">3.70</td>
                    <td className="p-2.5">ممتاز</td>
                  </tr>
                  <tr className="bg-blue-50/40">
                    <td className="p-2.5 font-bold text-blue-700">B+</td>
                    <td className="p-2.5">84% - &lt;89%</td>
                    <td className="p-2.5 font-bold">3.30</td>
                    <td className="p-2.5 font-bold">جيد جداً مرتفع</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-600">B</td>
                    <td className="p-2.5">80% - &lt;84%</td>
                    <td className="p-2.5 font-bold">3.00</td>
                    <td className="p-2.5">جيد جداً</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-blue-600">B-</td>
                    <td className="p-2.5">76% - &lt;80%</td>
                    <td className="p-2.5 font-bold">2.70</td>
                    <td className="p-2.5">جيد جداً</td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-2.5 font-bold text-amber-700">C+</td>
                    <td className="p-2.5">73% - &lt;76%</td>
                    <td className="p-2.5 font-bold">2.30</td>
                    <td className="p-2.5">جيد مرتفع</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-amber-600">C</td>
                    <td className="p-2.5">70% - &lt;73%</td>
                    <td className="p-2.5 font-bold">2.00</td>
                    <td className="p-2.5 font-bold">جيد (الحد الأدنى للتخرج)</td>
                  </tr>
                  <tr className="bg-rose-50/40">
                    <td className="p-2.5 font-bold text-rose-600">F</td>
                    <td className="p-2.5">&lt; 60%</td>
                    <td className="p-2.5 font-bold">0.00</td>
                    <td className="p-2.5 font-bold text-rose-600">راسب</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <h5 className="font-bold text-xs text-slate-900 mb-1">
                1. قسم هندسة وعلوم الحاسب (CSE)
              </h5>
              <p className="text-xs text-slate-600">
                يشمل تخصصات الذكاء الاصطناعي، الأمن السيبراني، هندسة البرمجيات، النظم المدمجة، وشبكات الحاسب.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <h5 className="font-bold text-xs text-slate-900 mb-1">
                2. قسم هندسة الإلكترونيات والاتصالات الكهربية (ECE)
              </h5>
              <p className="text-xs text-slate-600">
                يشمل نظم الاتصالات الخلوية والأقمار الصناعية، الدوائر المتكاملة (VLSI)، والموجات الدقيقة والهوائيات.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80">
              <h5 className="font-bold text-xs text-slate-900 mb-1">
                3. قسم هندسة التحكم والآلات الإلكترونية الصناعية (IEC)
              </h5>
              <p className="text-xs text-slate-600">
                يشمل الروبوتات والأنظمة الذكية، الأتمتة الصناعية (PLC & SCADA)، والتحكم في إلكترونيات القوى.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs text-rose-950">
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-rose-700">
                <AlertCircle size={16} />
                <span>الإنذار الأكاديمي والتحذير</span>
              </div>
              <p className="leading-relaxed">
                يوجه الإنذار الأكاديمي للطالب إذا كان معدله التراكمي (CGPA) أقل من 2.00 في أي فصل دراسي رئيسي، ويُسمح له بتسجيل 12 ساعة فقط لتحسين معدله.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
              <h5 className="font-bold text-slate-900 mb-1">العبء الدراسي للفصل</h5>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>الحد الأدنى للتسجيل: 12 ساعة معتمدة.</li>
                <li>الحد الأقصى: 19 ساعة معتمدة (21 ساعة للمتفوقين GPA &gt; 3.00 أو الخريجين).</li>
                <li>الفصل الصيفي: 7 ساعات كحد أقصى (9 ساعات للخريجين).</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-slate-500 text-center sm:text-right">
          المصدر: اللائحة الأكاديمية الرسمية المعتمدة لكلية الهندسة الإلكترونية بمنوف
        </span>

        <button
          type="button"
          onClick={handleDownloadSummary}
          disabled={isDownloading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
        >
          {isDownloading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>جاري تحضير الملخص...</span>
            </>
          ) : isDownloaded ? (
            <>
              <CheckCircle2 size={15} className="text-emerald-300" />
              <span>تم حفظ الملخص بنجاح</span>
            </>
          ) : (
            <>
              <Download size={15} />
              <span>تنزيل ملخص اللائحة (TXT)</span>
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
});

MenoufBylawModal.displayName = 'MenoufBylawModal';
