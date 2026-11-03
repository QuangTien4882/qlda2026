import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useData } from '../../context/DataContext';
import { Menu, FileSpreadsheet, ArrowLeft, HardDrive } from 'lucide-react';
import { AppBadge } from '../common/AppBadge';
import { formatVnNumber } from '../../utils/numberUtils';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  title?: string;
  onOpenSyncModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  title,
  onOpenSyncModal,
}) => {
  const { headerTitle, activeProjectInfo } = useSettings();
  const { lastSavedTime, isDirectFileConnected } = useData();
  const displayTitle = title || headerTitle;

  return (
    <header className="h-16 bg-[#0c1322] border-b border-[#232f4e] px-3 md:px-5 flex items-center justify-between shrink-0 select-none z-30 shadow-md">
      {/* 1. KHỐI TÊN PHẦN MỀM: LUÔN HIỂN THỊ CỐ ĐỊNH Ở GÓC TRÁI (KHÔNG BAO GIỜ BỊ CHE MẤT) */}
      <div className="w-auto lg:w-72 shrink-0 pr-3 sm:pr-4 border-r border-[#232f4e] flex items-center gap-2.5">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-900/50">
            PM
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-100 text-sm leading-none tracking-wide">
                ProjectM
              </h1>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono font-medium hidden sm:inline-block">
                OFFLINE V1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 hidden md:block">
              Quản lý Dự án ĐTXD
            </p>
          </div>
        </div>
      </div>

      {/* 2. KHỐI GIỮA: NẾU ĐANG XEM DỰ ÁN THÌ HIỂN THỊ THÔNG TIN DỰ ÁN */}
      {activeProjectInfo ? (
        <div className="flex items-center gap-2.5 min-w-0 flex-1 px-3">
          {/* Nút quay lại danh mục dự án */}
          <button
            onClick={activeProjectInfo.onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#142038] hover:bg-[#1e2f52] border border-[#2b3c66] text-blue-300 text-xs font-semibold shrink-0 transition-colors shadow-sm"
            title="Quay lại danh mục các dự án"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Danh mục</span>
          </button>

          <div className="flex flex-col justify-center min-w-0 flex-1">
            {/* Dòng 1: Mã DA, Trạng thái, Tên dự án */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-blue-300 bg-blue-950/80 border border-blue-700/60 px-2 py-0.5 rounded shrink-0">
                {activeProjectInfo.code}
              </span>
              <AppBadge variant="blue" dot className="shrink-0 hidden xs:inline-flex">
                {activeProjectInfo.status}
              </AppBadge>
              <h2
                className="font-bold text-white text-xs sm:text-sm tracking-wide truncate"
                title={activeProjectInfo.name}
              >
                {activeProjectInfo.name}
              </h2>
            </div>

            {/* Dòng 2: Địa điểm, Nhóm, Cấp, Loại */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
              <span className="truncate">
                Địa điểm: <strong className="text-slate-200">{activeProjectInfo.location}</strong>
              </span>
              {activeProjectInfo.group && (
                <span className="hidden md:inline shrink-0">
                  • Nhóm: <strong className="text-blue-300">{activeProjectInfo.group}</strong>
                </span>
              )}
              {activeProjectInfo.level && (
                <span className="hidden lg:inline shrink-0">
                  • Cấp: <strong className="text-purple-300">{activeProjectInfo.level}</strong>
                </span>
              )}
              {activeProjectInfo.type && (
                <span className="hidden lg:inline shrink-0">
                  • Loại: <strong className="text-slate-200">{activeProjectInfo.type}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* 3. KHỐI BÊN PHẢI: CHỈ BÁO LƯU TRỮ, TIÊU ĐỀ BẢNG HIỆN TẠI & TỔNG MỨC ĐẦU TƯ */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {/* Nút chỉ báo lưu trữ Offline & Drive */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          title="Trạng thái lưu trữ Offline & Google Drive. Bấm để mở Sao lưu / Nạp file JSON."
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c1626] hover:bg-[#14233c] border border-emerald-500/30 text-emerald-400 text-xs cursor-pointer transition-colors shadow-sm"
        >
          <span className={`w-2 h-2 rounded-full ${isDirectFileConnected ? 'bg-cyan-400' : 'bg-emerald-400'} animate-pulse`} />
          <span className="text-[11px] font-mono text-slate-300">
            {isDirectFileConnected ? 'File đĩa' : 'Đã lưu'}: <strong className="text-emerald-400">{lastSavedTime}</strong>
          </span>
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111a2e] border border-blue-500/40 shadow-sm shrink-0">
          <FileSpreadsheet size={15} className="text-blue-400 shrink-0" />
          <span className="text-xs font-bold text-slate-100 uppercase tracking-wide truncate max-w-[180px] lg:max-w-none">
            {displayTitle}
          </span>
        </div>

        {activeProjectInfo?.totalInvestment !== undefined && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/50 shadow-sm shrink-0">
            <span className="text-[11px] text-slate-400">TMĐT:</span>
            <span className="font-mono text-xs md:text-sm font-bold text-emerald-400">
              {formatVnNumber(activeProjectInfo.totalInvestment)} đ
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
