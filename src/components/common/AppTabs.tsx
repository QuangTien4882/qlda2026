import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface AppTabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
}

export function AppTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
}: AppTabsProps<T>) {
  return (
    <div
      className={`flex items-center gap-1.5 p-1 bg-[#0b1222] border border-[#232f4e] rounded-xl overflow-x-auto scrollbar-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-150 whitespace-nowrap select-none ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#16203a]'
            }`}
          >
            {tab.icon && (
              <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

