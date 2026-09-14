import React from 'react';
import {
  Activity,
  Atom,
  Binary,
  BookOpen,
  Calculator,
  CircuitBoard,
  Code2,
  Cpu,
  Dna,
  FlaskConical,
  Radio,
  Search,
  Sigma,
  Zap,
} from 'lucide-react';

export const COURSE_NAME_AR_MAP: Record<string, string> = {
  'Biology': 'علم الأحياء العام',
  'Chemistry': 'الكيمياء العامة',
  'Physics': 'الفيزياء العامة',
  'Mathematics': 'الرياضيات التفاضلية',
  'Math': 'الرياضيات التفاضلية',
  'Computer Science': 'علوم الحاسب',
  'English': 'اللغة الإنجليزية',
  'Biochemistry': 'الكيمياء الحيوية',
  'Botany': 'علم النبات',
  'Zoology': 'علم الحيوان',
  'Geology': 'علم الجيولوجيا',
  'Microbiology': 'الأحياء الدقيقة',
};

export const getArabicCourseName = (courseName: string): string => {
  return COURSE_NAME_AR_MAP[courseName] || courseName;
};

export const formatDeadline = (dateStr?: string, fallback?: string): string => {
  if (!dateStr) return fallback || '';
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${day} ${MONTHS[d.getMonth()]} ${DAYS[d.getDay()]}`;
  }
  return fallback || dateStr;
};

export interface CourseIconMeta {
  Icon: React.ElementType;
  bgClass: string;
  badgeClass: string;
  accentColor: string;
  borderRightClass: string;
  topAccentClass: string;
}

export const DYNAMIC_BORDER_CLASSES = [
  'border-r-4 border-r-indigo-500',
  'border-r-4 border-r-rose-500',
  'border-r-4 border-r-emerald-500',
  'border-r-4 border-r-amber-500',
  'border-r-4 border-r-teal-500',
  'border-r-4 border-r-purple-500',
  'border-r-4 border-r-sky-500',
  'border-r-4 border-r-cyan-500',
  'border-r-4 border-r-violet-500',
  'border-r-4 border-r-fuchsia-500',
  'border-r-4 border-r-blue-500',
  'border-r-4 border-r-orange-500',
];

export const getDynamicBorderClass = (index: number): string => {
  return DYNAMIC_BORDER_CLASSES[index % DYNAMIC_BORDER_CLASSES.length];
};

export const getCourseIconMeta = (courseName: string, index?: number): CourseIconMeta => {
  const nameLower = (courseName || '').toLowerCase();
  if (nameLower.includes('phys') || nameLower.includes('فيزياء')) {
    return {
      Icon: Atom,
      bgClass: 'bg-rose-50 text-rose-600 border-rose-200/80',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80',
      accentColor: 'bg-rose-500',
      borderRightClass: 'border-r-4 border-r-rose-500',
      topAccentClass: 'border-t-4 border-t-rose-500',
    };
  }
  if (nameLower.includes('chem') || nameLower.includes('كيمياء')) {
    return {
      Icon: FlaskConical,
      bgClass: 'bg-teal-50 text-teal-600 border-teal-200/80',
      badgeClass: 'bg-teal-50 text-teal-800 border-teal-200/80',
      accentColor: 'bg-teal-500',
      borderRightClass: 'border-r-4 border-r-teal-500',
      topAccentClass: 'border-t-4 border-t-teal-500',
    };
  }
  if (nameLower.includes('bio') || nameLower.includes('أحياء')) {
    return {
      Icon: Dna,
      bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      accentColor: 'bg-emerald-500',
      borderRightClass: 'border-r-4 border-r-emerald-500',
      topAccentClass: 'border-t-4 border-t-emerald-500',
    };
  }
  if (nameLower.includes('math') || nameLower.includes('رياضيات')) {
    return {
      Icon: Calculator,
      bgClass: 'bg-amber-50 text-amber-600 border-amber-200/80',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
      accentColor: 'bg-amber-500',
      borderRightClass: 'border-r-4 border-r-amber-500',
      topAccentClass: 'border-t-4 border-t-amber-500',
    };
  }
  if (nameLower.includes('برمجة') || nameLower.includes('programming') || nameLower.includes('code')) {
    return {
      Icon: Code2,
      bgClass: 'bg-blue-50 text-blue-600 border-blue-200/80',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
      accentColor: 'bg-blue-500',
      borderRightClass: 'border-r-4 border-r-blue-500',
      topAccentClass: 'border-t-4 border-t-blue-500',
    };
  }
  if (nameLower.includes('تصميم منطقي') || nameLower.includes('التصميم المنطقي') || nameLower.includes('logic design') || nameLower.includes('logic-design') || nameLower.includes('logic')) {
    return {
      Icon: Binary,
      bgClass: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      accentColor: 'bg-indigo-500',
      borderRightClass: 'border-r-4 border-r-indigo-500',
      topAccentClass: 'border-t-4 border-t-indigo-500',
    };
  }

  if (
    nameLower.includes('comp') ||
    nameLower.includes('حاسب')
  ) {
    return {
      Icon: Cpu,
      bgClass: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
      accentColor: 'bg-indigo-500',
      borderRightClass: 'border-r-4 border-r-indigo-500',
      topAccentClass: 'border-t-4 border-t-indigo-500',
    };
  }
  if (nameLower.includes('eng') || nameLower.includes('إنجليزية') || nameLower.includes('لغة')) {
    return {
      Icon: BookOpen,
      bgClass: 'bg-sky-50 text-sky-600 border-sky-200/80',
      badgeClass: 'bg-sky-50 text-sky-700 border-sky-200/80',
      accentColor: 'bg-sky-500',
      borderRightClass: 'border-r-4 border-r-sky-500',
      topAccentClass: 'border-t-4 border-t-sky-500',
    };
  }

  if (nameLower.includes('إشارات') || nameLower.includes('اشارات') || nameLower.includes('signal')) {
    return {
      Icon: Activity,
      bgClass: 'bg-cyan-50 text-cyan-600 border-cyan-200/80',
      badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
      accentColor: 'bg-cyan-500',
      borderRightClass: 'border-r-4 border-r-cyan-500',
      topAccentClass: 'border-t-4 border-t-cyan-500',
    };
  }
  if (nameLower.includes('كهرومغناطيس') || nameLower.includes('electromagnetic')) {
    return {
      Icon: Radio,
      bgClass: 'bg-violet-50 text-violet-600 border-violet-200/80',
      badgeClass: 'bg-violet-50 text-violet-700 border-violet-200/80',
      accentColor: 'bg-violet-500',
      borderRightClass: 'border-r-4 border-r-violet-500',
      topAccentClass: 'border-t-4 border-t-violet-500',
    };
  }
  if (nameLower.includes('بحث') || nameLower.includes('تحليل') || nameLower.includes('research') || nameLower.includes('analysis')) {
    return {
      Icon: Search,
      bgClass: 'bg-orange-50 text-orange-600 border-orange-200/80',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200/80',
      accentColor: 'bg-orange-500',
      borderRightClass: 'border-r-4 border-r-orange-500',
      topAccentClass: 'border-t-4 border-t-orange-500',
    };
  }
  if (nameLower.includes('هندسة كهربية') || nameLower.includes('هندسة كهرب') || nameLower.includes('electrical engineering')) {
    return {
      Icon: Zap,
      bgClass: 'bg-yellow-50 text-yellow-700 border-yellow-200/80',
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200/80',
      accentColor: 'bg-yellow-500',
      borderRightClass: 'border-r-4 border-r-yellow-500',
      topAccentClass: 'border-t-4 border-t-yellow-500',
    };
  }
  if (nameLower.includes('معادلات') || nameLower.includes('تفاضلية') || nameLower.includes('differential')) {
    return {
      Icon: Sigma,
      bgClass: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200/80',
      badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80',
      accentColor: 'bg-fuchsia-500',
      borderRightClass: 'border-r-4 border-r-fuchsia-500',
      topAccentClass: 'border-t-4 border-t-fuchsia-500',
    };
  }
  if (nameLower.includes('إلكترونيات') || nameLower.includes('الكترونيات') || nameLower.includes('electronics')) {
    return {
      Icon: CircuitBoard,
      bgClass: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
      accentColor: 'bg-emerald-500',
      borderRightClass: 'border-r-4 border-r-emerald-500',
      topAccentClass: 'border-t-4 border-t-emerald-500',
    };
  }

  return {
    Icon: BookOpen,
    bgClass: 'bg-purple-50 text-purple-600 border-purple-200/80',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80',
    accentColor: 'bg-purple-500',
    borderRightClass: 'border-r-4 border-r-purple-500',
    topAccentClass: 'border-t-4 border-t-purple-500',
  };
};
