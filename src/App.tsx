import React, { useState } from 'react';
import { MainMenuType } from './types/project';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { ProjectsModuleView } from './components/modules/projects/ProjectsModuleView';
import { ReportsView } from './components/modules/reports/ReportsView';
import { DraftingView } from './components/modules/drafting/DraftingView';
import { CompaniesView } from './components/modules/companies/CompaniesView';
import { SettingsModal } from './components/modules/settings/SettingsModal';
import { BackupManagerModal } from './components/modules/settings/BackupManagerModal';
import { ShortcutsGuideModal } from './components/common/ShortcutsGuideModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Save, CheckCircle2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<MainMenuType>('projects');
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isOpenSettingsModal, setIsOpenSettingsModal] = useState(false);
  const [isOpenBackupModal, setIsOpenBackupModal] = useState(false);
  const [isOpenShortcutsModal, setIsOpenShortcutsModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Bắt phím tắt toàn hệ thống: Ctrl+S để lưu nhanh, F1/? để mở hướng dẫn phím tắt
  useKeyboardShortcuts({
    onSave: () => {
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    },
    onOpenHelp: () => {
      setIsOpenShortcutsModal(true);
    },
  });

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#090d16] text-slate-100 flex flex-col select-none">
      {/* Top Header - Cố định ở đỉnh, không bao giờ bị che */}
      <Header
        onToggleMobileMenu={() => setIsOpenMobileMenu(true)}
        onOpenSyncModal={() => setIsOpenSettingsModal(true)}
      />

      {/* Main Layout Area - Chiếm trọn phần chiều cao còn lại */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar
          currentMenu={currentMenu}
          onSelectMenu={setCurrentMenu}
          isOpenMobile={isOpenMobileMenu}
          onCloseMobile={() => setIsOpenMobileMenu(false)}
          onOpenSettings={() => setIsOpenSettingsModal(true)}
          onOpenBackups={() => setIsOpenBackupModal(true)}
          onOpenShortcuts={() => setIsOpenShortcutsModal(true)}
        />

        {/* Right Main Content */}
        <main className="flex-1 min-w-0 min-h-0 h-full flex flex-col overflow-hidden p-3 md:p-5 bg-[#090d16]">
          <div className="flex-1 min-h-0 flex flex-col w-full h-full">
            {currentMenu === 'projects' && <ProjectsModuleView />}
            {currentMenu === 'reports' && <ReportsView />}
            {currentMenu === 'drafting' && <DraftingView />}
            {currentMenu === 'companies' && <CompaniesView />}
          </div>
        </main>
      </div>

      {/* Bottom Nav on Mobile */}
      <MobileNav
        currentMenu={currentMenu}
        onSelectMenu={setCurrentMenu}
        onOpenSettings={() => setIsOpenSettingsModal(true)}
      />

      {/* Modal Cài đặt tổng hợp: Font, Cỡ chữ, File Drive */}
      <SettingsModal
        isOpen={isOpenSettingsModal}
        onClose={() => setIsOpenSettingsModal(false)}
      />

      {/* Modal Quản lý Sao lưu & Khôi phục CSDL IndexedDB */}
      <BackupManagerModal
        isOpen={isOpenBackupModal}
        onClose={() => setIsOpenBackupModal(false)}
      />

      {/* Modal Bảng tra cứu phím tắt chuyên nghiệp */}
      <ShortcutsGuideModal
        isOpen={isOpenShortcutsModal}
        onClose={() => setIsOpenShortcutsModal(false)}
      />

      {/* Toast thông báo lưu nhanh khi bấm Ctrl + S */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 text-xs shadow-2xl backdrop-blur-md animate-fade-in font-medium">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>Dữ liệu đã được lưu an toàn tuyệt đối vào <strong>IndexedDB</strong>!</span>
        </div>
      )}
    </div>
  );
};
