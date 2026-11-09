import React, { useState } from 'react';
import { FolderOpen, Save } from 'lucide-react';
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
    isFirstRun,
    completeOnboarding,
    handleUserOpenFile,
    handleUserSaveAs,
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
      {/* BANNER THIẾT LẬP NƠI LƯU DỮ LIỆU LẦN ĐẦU TIÊN (FIRST-RUN ONBOARDING) */}
      {isFirstRun && !selectedProjectId && projects.length === 0 && (
        <div className="bg-gradient-to-r from-blue-950/90 via-[#0d1d3a] to-slate-900 border-b border-blue-500/40 p-3.5 sm:p-4 shrink-0 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-fadeIn z-20">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
              <FolderOpen size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Chào mừng bạn đến với ProjectM!
                <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-full font-medium">Thiết lập lần đầu</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Bạn đang sử dụng thiết bị này lần đầu. Hãy chọn cách thiết lập nơi lưu trữ để dữ liệu được tự động bảo đảm an toàn:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={async () => {
                const res = await handleUserOpenFile();
                if (res.success) alert(res.message);
                else if (res.message && !res.message.includes('Đã hủy') && !res.message.includes('Vui lòng chọn')) alert(res.message);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Chọn tệp dữ liệu .json hoặc .projectm đã có sẵn trên máy để làm việc tiếp"
            >
              <FolderOpen size={14} />
              Lấy dữ liệu từ file có sẵn
            </button>

            <button
              type="button"
              onClick={async () => {
                const res = await handleUserSaveAs();
                if (res.message && !res.message.includes('Đã hủy')) alert(res.message);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Chọn vị trí lưu (ổ C, D, E...) và đặt tên tệp dữ liệu mới theo nhu cầu của bạn"
            >
              <Save size={14} />
              Chọn nơi lưu file mới
            </button>

            <button
              type="button"
              onClick={() => completeOnboarding()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer border border-slate-700"
              title="Bắt đầu nhập liệu trực tiếp, bạn có thể bấm nút Lưu dữ liệu ở thanh tiêu đề bất cứ lúc nào"
            >
              Bắt đầu với dữ liệu mới
            </button>
          </div>
        </div>
      )}

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
