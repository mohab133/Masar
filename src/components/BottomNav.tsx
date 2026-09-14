import React, { memo } from 'react';
import { Home, CalendarCheck2, BookOpen, Clock } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'schedule', label: 'الجدول', icon: CalendarCheck2 },
  { id: 'courses', label: 'المواد', icon: BookOpen },
  { id: 'dates', label: 'المواعيد', icon: Clock },
];

export const BottomNav: React.FC<BottomNavProps> = memo(({ activeTab, onChangeTab }) => {
  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="التنقل الرئيسي"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(15,23,42,0.03)]"
    >
      <div className="max-w-md mx-auto px-3 h-16 flex items-center justify-around pb-safe-bottom">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              id={`tab-button-${tab.id}`}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 group relative select-none cursor-pointer"
            >
              <div className="relative flex items-center justify-center px-4 py-1">
                {/* Static active indicator keeps the bottom bar responsive. */}
                {isActive && (
                  <div
                    className="absolute inset-0 bg-blue-50/90 rounded-full border border-blue-100"
                  />
                )}
                
                <span className="relative z-10">
                  <Icon
                    size={20}
                    className={`transition-colors duration-150 ${
                      isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                </span>
              </div>

              <span
                className={`text-xs tracking-tight mt-0.5 whitespace-nowrap transition-colors duration-150 relative z-10 ${
                  isActive ? 'font-black text-blue-700' : 'font-medium text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
