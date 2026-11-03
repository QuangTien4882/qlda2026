import React, { useState, useEffect } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { VnNumberInput } from '../../common/VnNumberInput';
import { CostBreakdownModal } from './CostBreakdownModal';
import { formatVnNumber } from '../../../utils/numberUtils';
import { Layers } from 'lucide-react';
import { 
  ProjectListItem, 
  ProjectDetailItem, 
  ProjectStatus, 
  ProjectGroup, 
  ProjectType, 
  ProjectLevel,
  SevenCostCategory
} from '../../../types/project';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectListItem, detail: ProjectDetailItem) => void;
  initialData?: ProjectListItem | null;
  initialDetail?: ProjectDetailItem | null;
  nextStt: number;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialDetail,
  nextStt,
}) => {
  // ID dự án dùng cố định xuyên suốt phiên tạo / sửa form để liên kết chi tiết cấu thành
  const [formProjectId, setFormProjectId] = useState<string>(() => initialData?.id || `prj-${Date.now()}`);

  // 1. Nhóm thông tin chung
  const [stt, setStt] = useState<number>(nextStt);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [scale, setScale] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Chuẩn bị đầu tư');
  const [group, setGroup] = useState<ProjectGroup>('Nhóm B');
  const [type, setType] = useState<ProjectType>('Dân dụng');
  const [level, setLevel] = useState<ProjectLevel>('Cấp II');
  const [approvalDecision, setApprovalDecision] = useState('');
  const [note, setNote] = useState('');

  // 2. Nhóm 7 chi phí thành phần Tổng mức đầu tư
  const [costCompensation, setCostCompensation] = useState<number>(0);
  const [costConstruction, setCostConstruction] = useState<number>(0);
  const [costEquipment, setCostEquipment] = useState<number>(0);
  const [costManagement, setCostManagement] = useState<number>(0);
  const [costConsulting, setCostConsulting] = useState<number>(0);
  const [costOthers, setCostOthers] = useState<number>(0);
  const [costContingency, setCostContingency] = useState<number>(0);

  // Modal mở chi tiết cấu thành cho từng loại trong 7 chi phí
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    costCategory: SevenCostCategory;
    costCategoryName: string;
    currentCostAmount: number;
  }>({
    isOpen: false,
    costCategory: 'costConstruction',
    costCategoryName: '',
    currentCostAmount: 0,
  });

  const handleOpenBreakdown = (
    costCategory: SevenCostCategory,
    costCategoryName: string,
    currentCostAmount: number
  ) => {
    setBreakdownModal({
      isOpen: true,
      costCategory,
      costCategoryName,
      currentCostAmount,
    });
  };

  const handleApplyBreakdownTotal = (newTotal: number) => {
    switch (breakdownModal.costCategory) {
      case 'costCompensation':
        setCostCompensation(newTotal);
        break;
      case 'costConstruction':
        setCostConstruction(newTotal);
        break;
      case 'costEquipment':
        setCostEquipment(newTotal);
        break;
      case 'costManagement':
        setCostManagement(newTotal);
        break;
      case 'costConsulting':
        setCostConsulting(newTotal);
        break;
      case 'costOthers':
        setCostOthers(newTotal);
        break;
      case 'costContingency':
        setCostContingency(newTotal);
        break;
    }
  };

  // Tổng mức đầu tư tự động cộng realtime
  const totalInvestment =
    costCompensation +
    costConstruction +
    costEquipment +
    costManagement +
    costConsulting +
    costOthers +
    costContingency;

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormProjectId(initialData.id);
      setStt(initialData.stt);
      setCode(initialData.code);
      setName(initialData.name);
      setLocation(initialData.location);
      setStatus(initialData.status);
      setNote(initialData.note || '');

      if (initialDetail) {
        setScale(initialDetail.scale || '');
        setGroup(initialDetail.group || 'Nhóm B');
        setType(initialDetail.type || 'Dân dụng');
        setLevel(initialDetail.level || 'Cấp II');
        setApprovalDecision(initialDetail.approvalDecision || '');
        setCostCompensation(initialDetail.costCompensation || 0);
        setCostConstruction(initialDetail.costConstruction || 0);
        setCostEquipment(initialDetail.costEquipment || 0);
        setCostManagement(initialDetail.costManagement || 0);
        setCostConsulting(initialDetail.costConsulting || 0);
        setCostOthers(initialDetail.costOthers || 0);
        setCostContingency(initialDetail.costContingency || 0);
      } else {
        setScale('');
        setGroup('Nhóm B');
        setType('Dân dụng');
        setLevel('Cấp II');
        setApprovalDecision('');
        setCostCompensation(0);
        setCostConstruction(initialData.totalInvestment || 0);
        setCostEquipment(0);
        setCostManagement(0);
        setCostConsulting(0);
        setCostOthers(0);
        setCostContingency(0);
      }
    } else {
      setFormProjectId(`prj-${Date.now()}`);
      setStt(nextStt);
      setCode(`DA-2026/0${nextStt}`);
      setName('');
      setLocation('');
      setScale('');
      setStatus('Chuẩn bị đầu tư');
      setGroup('Nhóm B');
      setType('Dân dụng');
      setLevel('Cấp II');
      setApprovalDecision('');
      setNote('');
      setCostCompensation(0);
      setCostConstruction(0);
      setCostEquipment(0);
      setCostManagement(0);
      setCostConsulting(0);
      setCostOthers(0);
      setCostContingency(0);
    }
    setError('');
  }, [initialData, initialDetail, nextStt, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Vui lòng nhập Mã hiệu dự án');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập Tên dự án');
      return;
    }

    const projectId = formProjectId;
    const detailId = initialDetail ? initialDetail.id : `dtl-${projectId}`;

    // 1. Dữ liệu bảng Cấp 1
    const projectRecord: ProjectListItem = {
      id: projectId,
      stt,
      code: code.trim(),
      name: name.trim(),
      location: location.trim(),
      status,
      totalInvestment,
      note: note.trim(),
    };

    // 2. Đầy đủ dữ liệu chi tiết Tab 1 (Dự án & 7 chi phí)
    const detailRecord: ProjectDetailItem = {
      id: detailId,
      projectId,
      stt,
      code: code.trim(),
      name: name.trim(),
      location: location.trim(),
      scale: scale.trim(),
      status,
      group,
      type,
      level,
      costCompensation,
      costConstruction,
      costEquipment,
      costManagement,
      costConsulting,
      costOthers,
      costContingency,
      totalInvestment,
      approvalDecision: approvalDecision.trim(),
      note: note.trim(),
    };

    onSave(projectRecord, detailRecord);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh Sửa Thông Tin Dự Án' : 'Thêm Mới Dự Án Đầu Tư Xây Dựng'}
      subtitle="Nhập đầy đủ thông tin chung và cơ cấu 7 nhóm chi phí Tổng mức đầu tư"
      level={1}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Hủy bỏ
          </AppButton>
          <AppButton variant="primary" size="sm" onClick={handleSubmit}>
            {initialData ? 'Lưu cập nhật' : 'Thêm dự án'}
          </AppButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs">
            {error}
          </div>
        )}

        {/* PHẦN 1: THÔNG TIN CHUNG DỰ ÁN (Đầy đủ theo yêu cầu số 3) */}
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-blue-400 uppercase text-xs">
              1. Thông tin chung dự án
            </h4>
            <span className="text-[11px] text-slate-400">
              * Điền đầy đủ để đồng bộ với Bảng Dự án và 6 Tab quản lý
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">STT</label>
              <input
                type="number"
                value={stt}
                onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Mã dự án <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: DA-2026/01"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1">
                Tên dự án <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Xây dựng Trung tâm Đào tạo và Chuyển giao..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">
                Địa điểm xây dựng <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Phường Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Quy mô đầu tư</label>
              <input
                type="text"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                placeholder="VD: Quy mô 5 tầng nổi, 1 tầng hầm, diện tích sàn 14.500 m2..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Trạng thái dự án</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Chuẩn bị đầu tư">Chuẩn bị đầu tư</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành chưa quyết toán">Hoàn thành chưa quyết toán</option>
                <option value="Quyết toán">Quyết toán</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Nhóm dự án</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as ProjectGroup)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Nhóm A">Nhóm A</option>
                <option value="Nhóm B">Nhóm B</option>
                <option value="Nhóm C">Nhóm C</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Loại dự án</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Giao thông">Giao thông</option>
                <option value="Hạ tầng kỹ thuật">Hạ tầng kỹ thuật</option>
                <option value="Phục vụ NN & MT">Phục vụ NN & MT</option>
                <option value="Công nghiệp">Công nghiệp</option>
                <option value="Dân dụng">Dân dụng</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Cấp công trình</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as ProjectLevel)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Cấp I">Cấp I</option>
                <option value="Cấp II">Cấp II</option>
                <option value="Cấp III">Cấp III</option>
                <option value="Cấp IV">Cấp IV</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Quyết định phê duyệt</label>
              <input
                type="text"
                value={approvalDecision}
                onChange={(e) => setApprovalDecision(e.target.value)}
                placeholder="VD: Số 182/QĐ-SXD ngày 18/02/2026..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Ghi chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú tổng quát của dự án..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* PHẦN 2: CƠ CẤU 7 KHOẢN MỤC CHI PHÍ VÀ TỰ ĐỘNG TÍNH TỔNG MỨC ĐẦU TƯ */}
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-emerald-400 uppercase text-xs">
              2. Cơ cấu 7 nhóm chi phí Tổng mức đầu tư (đồng)
            </h4>
            <span className="text-[11px] text-slate-400 italic">
              * Tự động cộng dồn realtime vào Tổng mức đầu tư
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>1. CP BT, HT & TĐC</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costCompensation',
                        'CP Bồi thường, HT & TĐC',
                        costCompensation
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costCompensation}
              onChange={(val) => setCostCompensation(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>2. CP Xây dựng</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costConstruction',
                        'CP Xây dựng',
                        costConstruction
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costConstruction}
              onChange={(val) => setCostConstruction(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>3. CP Thiết bị</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costEquipment',
                        'CP Thiết bị',
                        costEquipment
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costEquipment}
              onChange={(val) => setCostEquipment(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>4. CP QLDA</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costManagement',
                        'CP Quản lý dự án',
                        costManagement
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costManagement}
              onChange={(val) => setCostManagement(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>5. CP TVĐTXD</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costConsulting',
                        'CP Tư vấn ĐTXD',
                        costConsulting
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costConsulting}
              onChange={(val) => setCostConsulting(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>6. CP Khác</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costOthers',
                        'CP Khác',
                        costOthers
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costOthers}
              onChange={(val) => setCostOthers(val)}
              suffix="đồng"
            />

            <VnNumberInput
              label={
                <div className="flex items-center justify-between">
                  <span>7. CP Dự phòng</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenBreakdown(
                        'costContingency',
                        'CP Dự phòng',
                        costContingency
                      )
                    }
                    className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                  >
                    <Layers size={11} /> Chi tiết
                  </button>
                </div>
              }
              value={costContingency}
              onChange={(val) => setCostContingency(val)}
              suffix="đồng"
            />
          </div>

          {/* Khối hiển thị Tổng mức đầu tư nổi bật */}
          <div className="mt-3 p-3.5 bg-[#071322] border-2 border-emerald-500/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-lg">
            <div>
              <span className="text-xs uppercase font-bold text-slate-300 block">
                Tổng mức đầu tư (đồng)
              </span>
              <span className="text-[11px] text-slate-400">
                (Tổng cộng của 7 nhóm chi phí thành phần ở trên)
              </span>
            </div>
            <div className="text-lg md:text-xl font-mono font-bold text-emerald-400">
              {formatVnNumber(totalInvestment)} đồng
            </div>
          </div>
        </div>
      </form>

      {/* Modal Cấp 2: Chi tiết cấu thành chi phí khi tạo / sửa dự án */}
      <CostBreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal((prev) => ({ ...prev, isOpen: false }))}
        projectId={formProjectId}
        parentId={initialDetail?.id || `dtl-${formProjectId}`}
        parentTitle={code ? `${code} - ${name || 'Dự án mới'}` : (name || 'Dự án mới')}
        costCategory={breakdownModal.costCategory}
        costCategoryName={breakdownModal.costCategoryName}
        currentCostAmount={breakdownModal.currentCostAmount}
        onApplyTotal={handleApplyBreakdownTotal}
      />
    </AppModal>
  );
};
