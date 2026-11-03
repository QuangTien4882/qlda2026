import React from 'react';
import { MainMenuType } from '../../types/project';
import { Briefcase, BarChart3, FileEdit, Building2, Sliders } from 'lucide-react';

interface MobileNavProps {
  currentMenu: MainMenuType;
  onSelectMenu: (menu: MainMenuType) => void;
  onOpenSettings: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentMenu,
  onSelectMenu,
  onOpenSettings,
}) => {
  const items: { id: MainMenuType; label: string; icon: React.ReactNode }[] = [
    { id: 'projects', label: 'Dự án', icon: <Briefcase size={18} /> },
    { id: 'reports', label: 'Báo cáo', icon: <BarChart3 size={18} /> },
    { id: 'drafting', label: 'Soạn thảo', icon: <FileEdit size={18} /> },
    { id: 'companies', label: 'Công ty', icon: <Building2 size={18} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c1322] border-t border-[#232f4e] px-2 py-1.5 flex items-center justify-around select-none">
      {items.map((item) => {
        const isActive = currentMenu === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectMenu(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg transition-colors ${
              isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1 rounded-md ${
                isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'
              }`}
            >
              {item.icon}
            </div>
            <span className="text-[10px] leading-none">{item.label}</span>
          </button>
        );
      })}

      {/* Button for settings/font */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-200"
      >
        <div className="p-1 rounded-md text-slate-400">
          <Sliders size={18} />
        </div>
        <span className="text-[10px] leading-none">Cài đặt</span>
      </button>
    </nav>
  );
};

