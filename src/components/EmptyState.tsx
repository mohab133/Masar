import React, { memo } from 'react';
import { CalendarDays, FileText, GraduationCap, Inbox, ListChecks } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'calendar' | 'file' | 'courses' | 'inbox' | 'tasks';
  compact?: boolean;
}

const ICONS = {
  calendar: CalendarDays,
  file: FileText,
  courses: GraduationCap,
  inbox: Inbox,
  tasks: ListChecks,
};

export const EmptyState: React.FC<EmptyStateProps> = memo(({ title, description, icon = 'inbox', compact = false }) => {
  const Icon = ICONS[icon];
  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl text-center ${compact ? 'p-5' : 'p-6'}`} dir="rtl">
      <div className="mx-auto mb-2.5 w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center">
        <Icon size={21} />
      </div>
      <p className="font-bold text-slate-800 text-sm">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
