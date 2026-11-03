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

export const AppContent: React.FC = () => {
  const [currentMenu, setCurrentMenu] = useState<MainMenuType>('projects');
  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState(false);
  const [isOpenSettingsModal, setIsOpenSettingsModal] = useState(false);

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
    </div>
  );
};
