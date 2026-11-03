import React, { useState, useEffect } from 'react';
import { 
  ProjectListItem,
  ProjectDetailItem,
  EstimateItem,
  CostPackageItem,
  InspectionItem,
  LegalDocItem,
  PlanTaskItem,
  ProjectDetailTabType
} from '../../../types/project';
import { AppTabs, TabItem } from '../../common/AppTabs';
import { TabProjectInfo } from './TabProjectInfo';
import { TabEstimates } from './TabEstimates';
import { TabCosts } from './TabCosts';
import { TabInspections } from './TabInspections';
import { TabLegal } from './TabLegal';
import { TabSchedule } from './TabSchedule';
import { useSettings } from '../../../context/SettingsContext';
import { 
  Building2, 
  Layers, 
  Briefcase, 
  CheckCircle2, 
  FileCheck, 
  Clock 
} from 'lucide-react';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';

interface ProjectDetailContainerProps {
  project: ProjectListItem;
  projectDetail: ProjectDetailItem;
  estimates: EstimateItem[];
  costPackages: CostPackageItem[];
  inspections: InspectionItem[];
  legalDocs: LegalDocItem[];
  planTasks: PlanTaskItem[];
  onBack: () => void;
  onUpdateProjectDetail: (detail: ProjectDetailItem) => void;
  onDeleteProject?: (id: string) => void;
  onAddEstimate: (item: EstimateItem) => void;
  onUpdateEstimate: (item: EstimateItem) => void;
  onDeleteEstimate: (id: string) => void;
  onAddCostPackage: (item: CostPackageItem) => void;
  onUpdateCostPackage: (item: CostPackageItem) => void;
  onDeleteCostPackage: (id: string) => void;
  onAddInspection: (item: InspectionItem) => void;
  onUpdateInspection: (item: InspectionItem) => void;
  onDeleteInspection: (id: string) => void;
  onAddLegalDoc: (item: LegalDocItem) => void;
  onUpdateLegalDoc: (item: LegalDocItem) => void;
  onDeleteLegalDoc: (id: string) => void;
  onAddPlanTask: (item: PlanTaskItem) => void;
  onUpdatePlanTask: (item: PlanTaskItem) => void;
  onDeletePlanTask: (id: string) => void;
}

export const ProjectDetailContainer: React.FC<ProjectDetailContainerProps> = ({
  project,
  projectDetail,
  estimates,
  costPackages,
  inspections,
  legalDocs,
  planTasks,
  onBack,
  onUpdateProjectDetail,
  onDeleteProject,
  onAddEstimate,
  onUpdateEstimate,
  onDeleteEstimate,
  onAddCostPackage,
  onUpdateCostPackage,
  onDeleteCostPackage,
  onAddInspection,
  onUpdateInspection,
  onDeleteInspection,
  onAddLegalDoc,
  onUpdateLegalDoc,
  onDeleteLegalDoc,
  onAddPlanTask,
  onUpdatePlanTask,
  onDeletePlanTask,
}) => {
  const { setHeaderTitle, setActiveProjectInfo } = useSettings();
  const [activeTab, setActiveTab] = useState<ProjectDetailTabType>('tab_project');

  // Đưa toàn bộ thông tin dự án lên Header phần mềm (Tiêu chuẩn theo yêu cầu 2)
  useEffect(() => {
    setActiveProjectInfo({
      id: project.id,
      code: project.code,
      name: project.name,
      location: project.location,
      status: project.status,
      group: projectDetail.group,
      level: projectDetail.level,
      type: projectDetail.type,
      totalInvestment: projectDetail.totalInvestment || project.totalInvestment,
      onBack,
    });

    return () => {
      setActiveProjectInfo(null);
    };
  }, [project, projectDetail, onBack, setActiveProjectInfo]);

  // Đồng bộ tiêu đề bảng theo Tab đang chọn lên Header
  useEffect(() => {
    switch (activeTab) {
      case 'tab_project':
        setHeaderTitle('1. DỰ ÁN & TỔNG MỨC ĐẦU TƯ');
        break;
      case 'tab_estimates':
        setHeaderTitle('2. DỰ TOÁN ĐƯỢC DUYỆT');
        break;
      case 'tab_costs':
        setHeaderTitle('3. NỘI DUNG CHI PHÍ & HỢP ĐỒNG');
        break;
      case 'tab_inspections':
        setHeaderTitle('4. NGHIỆM THU & THANH TOÁN');
        break;
      case 'tab_legal':
        setHeaderTitle('5. HỒ SƠ PHÁP LÝ DỰ ÁN');
        break;
      case 'tab_plan':
        setHeaderTitle('6. KẾ HOẠCH TIẾN ĐỘ DỰ ÁN');
        break;
    }
  }, [activeTab, setHeaderTitle]);

  const tabs: TabItem<ProjectDetailTabType>[] = [
    { id: 'tab_project', label: '1. Dự án', icon: <Building2 size={16} /> },
    { id: 'tab_estimates', label: '2. Dự toán', icon: <Layers size={16} />, badge: estimates.length },
    { id: 'tab_costs', label: '3. Nội dung chi phí', icon: <Briefcase size={16} />, badge: costPackages.length },
    { id: 'tab_inspections', label: '4. Nghiệm thu', icon: <CheckCircle2 size={16} />, badge: inspections.length },
    { id: 'tab_legal', label: '5. Hồ sơ pháp lý', icon: <FileCheck size={16} />, badge: legalDocs.length },
    { id: 'tab_plan', label: '6. Kế hoạch', icon: <Clock size={16} />, badge: planTasks.length },
  ];

  // Bắt phím tắt chuyên nghiệp: Ctrl+1..6 để chuyển tab nhanh, Ctrl+F để tìm kiếm
  useKeyboardShortcuts({
    onTabChange: (tabIdx) => {
      const tabMap: Record<number, ProjectDetailTabType> = {
        1: 'tab_project',
        2: 'tab_estimates',
        3: 'tab_costs',
        4: 'tab_inspections',
        5: 'tab_legal',
        6: 'tab_plan',
      };
      if (tabMap[tabIdx]) {
        setActiveTab(tabMap[tabIdx]);
      }
    },
    onSearch: () => {
      const searchInputs = document.querySelectorAll('input[type="text"], input[type="search"]');
      for (let i = 0; i < searchInputs.length; i++) {
        const inp = searchInputs[i] as HTMLInputElement;
        const ph = inp.placeholder?.toLowerCase() || '';
        if (ph.includes('tìm') || ph.includes('search')) {
          inp.focus();
          inp.select();
          break;
        }
      }
    },
  });

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden space-y-2">
      {/* 6 Tabs nghiệp vụ - Cố định ở đầu màn hình nội dung */}
      <div className="shrink-0">
        <AppTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Nội dung Tab - Chiếm trọn toàn bộ chiều cao còn lại cho bảng dữ liệu */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Tab 1: Dự án */}
        {activeTab === 'tab_project' && (
          <TabProjectInfo
            projectDetail={projectDetail}
            onUpdate={onUpdateProjectDetail}
            onDelete={onDeleteProject}
          />
        )}

        {/* Tab 2: Dự toán */}
        {activeTab === 'tab_estimates' && (
          <TabEstimates
            estimates={estimates}
            projectId={project.id}
            onAdd={onAddEstimate}
            onUpdate={onUpdateEstimate}
            onDelete={onDeleteEstimate}
          />
        )}

        {/* Tab 3: Nội dung chi phí */}
        {activeTab === 'tab_costs' && (
          <TabCosts
            costPackages={costPackages}
            projectId={project.id}
            onAdd={onAddCostPackage}
            onUpdate={onUpdateCostPackage}
            onDelete={onDeleteCostPackage}
          />
        )}

        {/* Tab 4: Nghiệm thu */}
        {activeTab === 'tab_inspections' && (
          <TabInspections
            inspections={inspections}
            projectId={project.id}
            onAdd={onAddInspection}
            onUpdate={onUpdateInspection}
            onDelete={onDeleteInspection}
          />
        )}

        {/* Tab 5: Hồ sơ pháp lý */}
        {activeTab === 'tab_legal' && (
          <TabLegal
            legalDocs={legalDocs}
            projectId={project.id}
            projectCode={project.code}
            projectName={project.name}
            onAdd={onAddLegalDoc}
            onUpdate={onUpdateLegalDoc}
            onDelete={onDeleteLegalDoc}
          />
        )}

        {/* Tab 6: Kế hoạch tiến độ & Cảnh báo hạn chót */}
        {activeTab === 'tab_plan' && (
          <TabSchedule
            projectId={project.id}
            planTasks={planTasks}
            onAdd={onAddPlanTask}
            onUpdate={onUpdatePlanTask}
            onDelete={onDeletePlanTask}
          />
        )}
      </div>
    </div>
  );
};
