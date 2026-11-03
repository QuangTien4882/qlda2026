import React, { useState } from 'react';
import { 
  ProjectListItem,
  ProjectDetailItem,
  EstimateItem,
  CostPackageItem,
  InspectionItem,
  LegalDocItem,
  PlanTaskItem
} from '../../../types/project';
import { useData } from '../../../context/DataContext';
import { ProjectListView } from './ProjectListView';
import { ProjectDetailContainer } from './ProjectDetailContainer';

export const ProjectsModuleView: React.FC = () => {
  const {
    projects,
    projectDetails,
    estimates,
    costPackages,
    inspections,
    legalDocs,
    planTasks,
    addProject,
    updateProject,
    deleteProject,
    addEstimate,
    updateEstimate,
    deleteEstimate,
    addCostPackage,
    updateCostPackage,
    deleteCostPackage,
    addInspection,
    updateInspection,
    deleteInspection,
    addLegalDoc,
    updateLegalDoc,
    deleteLegalDoc,
    addPlanTask,
    updatePlanTask,
    deletePlanTask,
  } = useData();

  // ID dự án đang mở xem chi tiết (null nếu đang ở màn hình danh sách Cấp 1)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Thao tác với Project (Cấp 1)
  const handleAddProject = (newProject: ProjectListItem, customDetail?: ProjectDetailItem) => {
    addProject(newProject, customDetail);
  };

  const handleUpdateProject = (updated: ProjectListItem, updatedDetail?: ProjectDetailItem) => {
    updateProject(updated, updatedDetail);
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProject(projectId);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  // Cập nhật Tab 1: Dự án
  const handleUpdateProjectDetail = (updated: ProjectDetailItem) => {
    // Cập nhật chi tiết và đồng bộ lại tổng mức đầu tư, trạng thái lên danh mục Cấp 1
    const currentProject = projects.find((p) => p.id === updated.projectId);
    if (currentProject) {
      updateProject(
        {
          ...currentProject,
          code: updated.code,
          name: updated.name,
          location: updated.location,
          status: updated.status,
          totalInvestment: updated.totalInvestment,
          note: updated.note,
        },
        updated
      );
    }
  };

  // Thao tác Tab 2: Dự toán
  const handleAddEstimate = (item: EstimateItem) => {
    addEstimate(item);
  };
  const handleUpdateEstimate = (item: EstimateItem) => {
    updateEstimate(item);
  };
  const handleDeleteEstimate = (id: string) => {
    if (!selectedProjectId) return;
    deleteEstimate(selectedProjectId, id);
  };

  // Thao tác Tab 3: Nội dung chi phí
  const handleAddCostPackage = (item: CostPackageItem) => {
    addCostPackage(item);
  };
  const handleUpdateCostPackage = (item: CostPackageItem) => {
    updateCostPackage(item);
  };
  const handleDeleteCostPackage = (id: string) => {
    if (!selectedProjectId) return;
    deleteCostPackage(selectedProjectId, id);
  };

  // Thao tác Tab 4: Nghiệm thu
  const handleAddInspection = (item: InspectionItem) => {
    addInspection(item);
  };
  const handleUpdateInspection = (item: InspectionItem) => {
    updateInspection(item);
  };
  const handleDeleteInspection = (id: string) => {
    if (!selectedProjectId) return;
    deleteInspection(selectedProjectId, id);
  };

  // Thao tác Tab 5: Hồ sơ pháp lý
  const handleAddLegalDoc = (item: LegalDocItem) => {
    addLegalDoc(item);
  };
  const handleUpdateLegalDoc = (item: LegalDocItem) => {
    updateLegalDoc(item);
  };
  const handleDeleteLegalDoc = (id: string) => {
    if (!selectedProjectId) return;
    deleteLegalDoc(selectedProjectId, id);
  };

  // Thao tác Tab 6: Kế hoạch tiến độ
  const handleAddPlanTask = (item: PlanTaskItem) => {
    addPlanTask(item);
  };
  const handleUpdatePlanTask = (item: PlanTaskItem) => {
    updatePlanTask(item);
  };
  const handleDeletePlanTask = (id: string) => {
    if (!selectedProjectId) return;
    deletePlanTask(selectedProjectId, id);
  };

  // Dự án được chọn
  const activeProject = projects.find((p) => p.id === selectedProjectId);
  const activeDetail = activeProject
    ? projectDetails[activeProject.id] || {
        id: `dt-${activeProject.id}`,
        projectId: activeProject.id,
        stt: activeProject.stt,
        code: activeProject.code,
        name: activeProject.name,
        location: activeProject.location,
        scale: '',
        status: activeProject.status,
        group: 'Nhóm B',
        type: 'Dân dụng',
        level: 'Cấp II',
        costCompensation: 0,
        costConstruction: 0,
        costEquipment: 0,
        costManagement: 0,
        costConsulting: 0,
        costOthers: 0,
        costContingency: 0,
        totalInvestment: activeProject.totalInvestment,
        approvalDecision: '',
        note: activeProject.note,
      }
    : null;

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {!selectedProjectId || !activeProject || !activeDetail ? (
        /* CẤP 1: BẢNG DANH SÁCH DỰ ÁN */
        <ProjectListView
          projects={projects}
          projectDetails={projectDetails}
          onSelectProject={(id) => setSelectedProjectId(id)}
          onAddProject={handleAddProject}
          onUpdateProject={handleUpdateProject}
          onDeleteProject={handleDeleteProject}
        />
      ) : (
        /* CẤP 2: MÀN HÌNH CHI TIẾT DỰ ÁN (6 TAB) */
        <ProjectDetailContainer
          project={activeProject}
          projectDetail={activeDetail}
          estimates={estimates[activeProject.id] || []}
          costPackages={costPackages[activeProject.id] || []}
          inspections={inspections[activeProject.id] || []}
          legalDocs={legalDocs[activeProject.id] || []}
          planTasks={planTasks[activeProject.id] || []}
          onBack={() => setSelectedProjectId(null)}
          onUpdateProjectDetail={handleUpdateProjectDetail}
          onDeleteProject={(id) => {
            handleDeleteProject(id);
            setSelectedProjectId(null);
          }}
          onAddEstimate={handleAddEstimate}
          onUpdateEstimate={handleUpdateEstimate}
          onDeleteEstimate={handleDeleteEstimate}
          onAddCostPackage={handleAddCostPackage}
          onUpdateCostPackage={handleUpdateCostPackage}
          onDeleteCostPackage={handleDeleteCostPackage}
          onAddInspection={handleAddInspection}
          onUpdateInspection={handleUpdateInspection}
          onDeleteInspection={handleDeleteInspection}
          onAddLegalDoc={handleAddLegalDoc}
          onUpdateLegalDoc={handleUpdateLegalDoc}
          onDeleteLegalDoc={handleDeleteLegalDoc}
          onAddPlanTask={handleAddPlanTask}
          onUpdatePlanTask={handleUpdatePlanTask}
          onDeletePlanTask={handleDeletePlanTask}
        />
      )}
    </div>
  );
};
