import React, { memo, useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronDown, Clock, ExternalLink, FileImage, Info, MapPin } from 'lucide-react';
import type { AcademicEvent, OfficialScheduleDocument } from '../types';
import { getArabicCourseName, getCourseIconMeta, formatDeadline } from '../lib/courseIcons';
import { getEventTypeLabel, getLegacyDetails, safeExternalUrl } from '../lib/eventDetails';
import { EmptyState } from './EmptyState';
import { DownloadToast } from './DownloadToast';
import { useDownload } from '../lib/useDownload';
import { DownloadButton } from './DownloadButton';

interface DatesViewProps {
  events: AcademicEvent[];
  officialSchedules: OfficialScheduleDocument[];
  pendingEventId?: string | null;
  onPendingEventHandled?: () => void;
}

type FilterCategory = 'assignments' | 'quizzes' | 'exam_schedules';

function DetailRow({ label, value, url }: { label: string; value?: string; url?: string }) {
  if (!value) return null;
  const safeUrl = safeExternalUrl(url);
  return <div className="flex items-start gap-2 text-xs sm:text-sm"><Info size={15} className="text-blue-600 mt-0.5 shrink-0" /><div><p className="text-slate-500 font-semibold">{label}</p>{safeUrl ? <a href={safeUrl} target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline underline-offset-2 break-all">{value}</a> : <p className="font-bold text-slate-900 mt-0.5 whitespace-pre-wrap break-words">{value}</p>}</div></div>;
}

const AcademicEventCard = memo(({ item, expanded, onToggle }: { item: AcademicEvent; expanded: boolean; onToggle: () => void }) => {
  const meta = getCourseIconMeta(item.course);
  const Icon = meta.Icon;
  const details = item.details ?? getLegacyDetails(item);
  const panelId = `event-details-${item.id}`;
  return <article className={`bg-white border border-slate-200/90 ${meta.borderRightClass} rounded-2xl p-4 hover:border-blue-300 transition-colors shadow-2xs space-y-3`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1"><div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgClass}`}><Icon size={18} /></div><span className="text-xs font-bold text-slate-800 break-words" dir="auto">{getArabicCourseName(item.course)}</span></div>
      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-xl border font-bold ${meta.badgeClass}`}>{item.remainingTimeAr}</span>
    </div>
    <h3 className="text-base font-bold text-slate-900 leading-snug break-words text-right" dir="auto">{item.eventName}</h3>
    <div className="flex items-center gap-2 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-2.5 py-1.5 w-fit"><Calendar size={13} />{getEventTypeLabel(item)}</div>
    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500"><div className="flex items-center gap-1.5 font-medium min-w-0 flex-1"><Calendar size={13} className="text-slate-400 shrink-0" /><span className="truncate">{formatDeadline(item.date, item.displayDateAr)}</span>{item.time && <span className="inline-flex items-center gap-1 shrink-0">• <Clock size={13} />{item.time}</span>}</div><button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={onToggle} className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-2.5 py-1 rounded-xl transition-all shrink-0"><span>{expanded ? 'إخفاء التفاصيل' : 'اعرف المزيد'}</span><ChevronDown size={14} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} /></button></div>
    <div id={panelId} className={`grid transition-[grid-template-rows,opacity] duration-250 ease-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><div className="border-t border-slate-100 pt-3 space-y-3 text-right">
      {!details && <p className="text-xs text-slate-500">لا توجد تفاصيل إضافية لهذا الموعد حاليًا.</p>}
      {details?.steps && details.steps.length > 0 && <div><p className="text-xs text-slate-500 font-semibold mb-1">الخطوات</p><ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm font-medium text-slate-800">{details.steps.map((step, index) => <li key={`${item.id}-step-${index}`}>{step}</li>)}</ol></div>}
      <DetailRow label="مكان التسليم" value={details?.submissionLocation} />
      <DetailRow label="رابط التسليم" value={details?.submissionUrl} url={details?.submissionUrl} />
      <DetailRow label="مكان الكويز أو الاختبار" value={details?.quizLocation} />
      <DetailRow label="رابط الكويز أو الاختبار" value={details?.quizUrl} url={details?.quizUrl} />
      <DetailRow label="ملاحظات الموعد" value={details?.deadlineNote} />
      <DetailRow label="التعليمات" value={details?.instructions} />
      <DetailRow label="ملاحظات إضافية" value={details?.notes} />
    </div></div></div>
  </article>;
});
AcademicEventCard.displayName = 'AcademicEventCard';

export const DatesView: React.FC<DatesViewProps> = memo(({ events, officialSchedules, pendingEventId, onPendingEventHandled }) => {
  const [filter, setFilter] = useState<FilterCategory>('assignments');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const { message: downloadMessage, error: downloadError, loading: downloadLoading, download } = useDownload();
  const midtermDoc = useMemo(() => officialSchedules.find((d) => d.type === 'midterm'), [officialSchedules]);
  const finalDoc = useMemo(() => officialSchedules.find((d) => d.type === 'final'), [officialSchedules]);
  const sortedEvents = useMemo(() => [...(events || [])].filter((event) => event.daysUntil >= 0).sort((a, b) => a.daysUntil - b.daysUntil), [events]);
  const filteredEvents = useMemo(() => sortedEvents.filter((ev) => filter === 'assignments' ? ['assignment', 'submission', 'project'].includes(ev.type) : filter === 'quizzes' ? ['quiz', 'lab'].includes(ev.type) : ['midterm', 'final'].includes(ev.type)), [sortedEvents, filter]);

  useEffect(() => {
    if (!pendingEventId) return;
    const event = sortedEvents.find((item) => item.id === pendingEventId);
    if (!event) { onPendingEventHandled?.(); return; }
    setFilter(['midterm', 'final'].includes(event.type) ? 'exam_schedules' : ['quiz', 'lab'].includes(event.type) ? 'quizzes' : 'assignments');
    setExpandedIds((current) => new Set(current).add(event.id));
    window.setTimeout(() => document.getElementById(`event-details-${event.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 40);
    onPendingEventHandled?.();
  }, [pendingEventId, sortedEvents, onPendingEventHandled]);

  const toggle = (id: string) => setExpandedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const handleOpenDoc = async (doc: OfficialScheduleDocument) => download(doc.fileUrl, doc.downloadFileName || 'exam-schedule.pdf', doc.type === 'lectures_sections' ? 'image/jpeg' : 'application/pdf');
  const renderEvents = filteredEvents.map((item) => <AcademicEventCard key={item.id} item={item} expanded={expandedIds.has(item.id)} onToggle={() => toggle(item.id)} />);

  return <div id="dates-screen-view" className="space-y-4 pb-24 pt-1" dir="rtl"><DownloadToast message={downloadMessage} error={downloadError} loading={downloadLoading} />
    <div data-no-swipe="true" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()} className="flex items-center gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl relative select-none">{([['assignments', 'تسليمات'], ['quizzes', 'كويزات'], ['exam_schedules', 'جداول الامتحانات']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative ${filter === id ? 'text-blue-700 font-black bg-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>{label}</button>)}</div>
    {filter !== 'exam_schedules' && <div className="space-y-3">{renderEvents}{filteredEvents.length === 0 && <EmptyState icon="tasks" title={filter === 'assignments' ? 'لا توجد تسليمات حاليًا' : 'لا توجد كويزات أو تقييمات حاليًا'} description="ستظهر المواعيد هنا فور نشرها" />}</div>}
    {filter === 'exam_schedules' && <div className="space-y-3">{renderEvents}{midtermDoc?.fileUrl && <OfficialCard title="جدول الميدتيرم" description="مواعيد وقاعات الامتحانات الرسمية المعتمدة" doc={midtermDoc} onDownload={handleOpenDoc} color="amber" />}{finalDoc?.fileUrl && <OfficialCard title="جدول الفاينال" description="مواعيد وقاعات الامتحانات الرسمية المعتمدة" doc={finalDoc} onDownload={handleOpenDoc} color="purple" />}{filteredEvents.length === 0 && !midtermDoc?.fileUrl && !finalDoc?.fileUrl && <EmptyState icon="calendar" title="لا توجد جداول امتحانات حاليًا" description="ستظهر جداول الميدتيرم والفاينال هنا فور نشرها" />}</div>}
  </div>;
});

function OfficialCard({ title, description, doc, onDownload, color }: { title: string; description: string; doc: OfficialScheduleDocument; onDownload: (doc: OfficialScheduleDocument) => Promise<void>; color: 'amber' | 'purple' }) {
  return <div className={`bg-white border border-slate-200/90 border-r-4 border-r-${color}-500 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs`}><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="text-base font-bold text-slate-900">{title}</span>{doc.approvedDate && <span className="text-xs bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">{doc.approvedDate}</span>}</div><p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p></div><DownloadButton available onClick={() => void onDownload(doc)} label={`تحميل ${title}`} /></div>;
}
DatesView.displayName = 'DatesView';
