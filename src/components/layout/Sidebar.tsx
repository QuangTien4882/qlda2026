import React from 'react';
import { MainMenuType } from '../../types/project';
import { 
  Briefcase, 
  BarChart3, 
  FileEdit, 
  Building2, 
  HardDrive, 
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentMenu: MainMenuType;
  onSelectMenu: (menu: MainMenuType) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenRulesModal?: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  isOpenMobile,
  onCloseMobile,
  onOpenRulesModal,
  onOpenSettings,
}) => {
  const menuItems: { id: MainMenuType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'projects',
      label: 'Danh mục dự án',
      icon: <Briefcase size={18} />,
      desc: 'Dự án, Dự toán, Chi phí, Nghiệm thu, Pháp lý, Kế hoạch',
    },
    {
      id: 'reports',
      label: 'Báo cáo',
      icon: <BarChart3 size={18} />,
      desc: 'Tổng hợp số liệu, giải ngân, cơ cấu vốn, xuất Excel',
    },
    {
      id: 'drafting',
      label: 'Soạn thảo',
      icon: <FileEdit size={18} />,
      desc: 'Văn bản theo mẫu, tự động điền biến từ dự án',
    },
    {
      id: 'companies',
      label: 'Danh mục nhà thầu',
      icon: <Building2 size={18} />,
      desc: 'Quản lý thông tin nhà thầu, tư vấn, đối tác',
    },
  ];

  const handleMenuClick = (id: MainMenuType) => {
    onSelectMenu(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container - Điều chỉnh còn 80% chiều ngang (w-56 lg:w-64) để tiết kiệm không gian */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 z-40 w-56 lg:w-64 h-full bg-[#0a0f1d] border-r border-[#232f4e] flex flex-col justify-between shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Menu List */}
        <div className="p-3 space-y-4">
          {/* Section Label */}
          <div>
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>HỆ THỐNG QUẢN LÝ</span>
            </div>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const isActive = currentMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all duration-150 group ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-950/40'
                        : 'text-slate-300 hover:text-white hover:bg-[#121c32] border border-transparent'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                          : 'bg-[#121c32] text-slate-400 group-hover:text-slate-200 group-hover:bg-[#1a2847]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs md:text-sm font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>
                          {item.label}
                        </span>
                        {isActive && <ChevronRight size={13} className="text-blue-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom: Settings button */}
        <div className="p-2.5 border-t border-[#1e2a4a] bg-[#0c1222]">
          {/* Nút Cài đặt gom Font, Cỡ chữ, File Drive */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#121c32] hover:bg-[#1a2846] border border-[#232f4e] text-slate-200 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Settings size={15} />
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold block text-slate-100">Cài đặt hệ thống</span>
                <span className="text-[10px] text-slate-400">Font, Cỡ chữ, Drive</span>
              </div>
            </div>
            <ChevronRight size={13} className="text-slate-500 group-hover:text-blue-400 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};

