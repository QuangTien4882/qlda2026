import React, { useState } from 'react';
import { EstimateItem, ProjectType, ProjectLevel, SevenCostCategory } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { CostBreakdownModal } from './CostBreakdownModal';
import { formatVnNumber } from '../../../utils/numberUtils';
import { Layers } from 'lucide-react';

interface TabEstimatesProps {
  estimates: EstimateItem[];
  projectId: string;
  onAdd: (item: EstimateItem) => void;
  onUpdate: (item: EstimateItem) => void;
  onDelete: (id: string) => void;
}

export const TabEstimates: React.FC<TabEstimatesProps> = ({
  estimates,
  projectId,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<EstimateItem | null>(null);

  // Modal mở chi tiết cấu thành cho các loại chi phí dự toán
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    estimateId: string;
    workName: string;
    costCategory: SevenCostCategory;
    costCategoryName: string;
    currentCostAmount: number;
    fromEditModal?: boolean;
  }>({
    isOpen: false,
    estimateId: '',
    workName: '',
    costCategory: 'costConstruction',
    costCategoryName: '',
    currentCostAmount: 0,
    fromEditModal: false,
  });

  const handleOpenBreakdown = (
    estimateId: string,
    workNameText: string,
    costCategory: SevenCostCategory,
    costCategoryName: string,
    currentCostAmount: number,
    fromEditModal = false
  ) => {
    setBreakdownModal({
      isOpen: true,
      estimateId,
      workName: workNameText,
      costCategory,
      costCategoryName,
      currentCostAmount,
      fromEditModal,
    });
  };

  const handleApplyBreakdownTotal = (newTotal: number) => {
    const { estimateId, costCategory, fromEditModal } = breakdownModal;

    if (fromEditModal) {
      switch (costCategory) {
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
    } else {
      const targetEstimate = estimates.find((e) => e.id === estimateId);
      if (targetEstimate) {
        const updated = {
          ...targetEstimate,
          [costCategory]: newTotal,
        };
        const sum =
          (updated.costConstruction || 0) +
          (updated.costEquipment || 0) +
          (updated.costManagement || 0) +
          (updated.costConsulting || 0) +
          (updated.costOthers || 0) +
          (updated.costContingency || 0);

        onUpdate({ ...updated, totalEstimate: sum });
      }
    }
  };

  // Form state
  const [stt, setStt] = useState(estimates.length + 1);
  const [workName, setWorkName] = useState('');
  const [workType, setWorkType] = useState<ProjectType>('Dân dụng');
  const [workLevel, setWorkLevel] = useState<ProjectLevel>('Cấp II');
  const [costConstruction, setCostConstruction] = useState(0);
  const [costEquipment, setCostEquipment] = useState(0);
  const [costManagement, setCostManagement] = useState(0);
  const [costConsulting, setCostConsulting] = useState(0);
  const [costOthers, setCostOthers] = useState(0);
  const [costContingency, setCostContingency] = useState(0);
  const [approvalDecision, setApprovalDecision] = useState('');
  const [note, setNote] = useState('');

  const totalEstimate =
    costConstruction +
    costEquipment +
    costManagement +
    costConsulting +
    costOthers +
    costContingency;

  const handleOpenAdd = () => {
    const nextStt =
      estimates.length > 0 ? Math.max(...estimates.map((e) => Number(e.stt) || 0)) + 1 : 1;
    setEditingItem(null);
    setStt(nextStt);
    setWorkName('');
    setWorkType('' as any);
    setWorkLevel('' as any);
    setCostConstruction(0);
    setCostEquipment(0);
    setCostManagement(0);
    setCostConsulting(0);
    setCostOthers(0);
    setCostContingency(0);
    setApprovalDecision('');
    setNote('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: EstimateItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setWorkName(item.workName);
    setWorkType(item.workType);
    setWorkLevel(item.workLevel);
    setCostConstruction(item.costConstruction);
    setCostEquipment(item.costEquipment);
    setCostManagement(item.costManagement);
    setCostConsulting(item.costConsulting);
    setCostOthers(item.costOthers);
    setCostContingency(item.costContingency);
    setApprovalDecision(item.approvalDecision);
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workName.trim()) return;

    const record: EstimateItem = {
      id: editingItem ? editingItem.id : `est-${Date.now()}`,
      projectId,
      stt,
      workName: workName.trim(),
      workType: workType || 'Dân dụng',
      workLevel: workLevel || 'Cấp II',
      costConstruction,
      costEquipment,
      costManagement,
      costConsulting,
      costOthers,
      costContingency,
      totalEstimate,
      approvalDecision: approvalDecision.trim(),
      note: note.trim(),
    };

    if (editingItem) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setModalOpen(false);
  };

  // Cấu hình các cột theo yêu cầu số 3
  const columns: AdvancedColumn<EstimateItem>[] = [
    {
      id: 'stt',
      title: 'STT',
      width: 60,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => <span className="font-mono">{item.stt}</span>,
    },
    {
      id: 'workName',
      title: 'Tên công trình/Hạng mục',
      width: 320,
      minWidth: 25,
      pinned: true,
      render: (item) => <span className="font-semibold text-slate-100">{item.workName}</span>,
    },
    {
      id: 'workType',
      title: 'Loại công trình',
      width: 140,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="blue">{item.workType}</AppBadge>,
    },
    {
      id: 'workLevel',
      title: 'Cấp công trình',
      width: 120,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="purple">{item.workLevel}</AppBadge>,
    },
    {
      id: 'costConstruction',
      title: 'CP Xây dựng',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costConstruction', 'CP Xây dựng', item.costConstruction);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP Xây dựng"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono font-medium text-slate-100">{formatVnNumber(item.costConstruction)}</span>
        </div>
      ),
    },
    {
      id: 'costEquipment',
      title: 'CP Thiết bị',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costEquipment', 'CP Thiết bị', item.costEquipment);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP Thiết bị"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costEquipment)}</span>
        </div>
      ),
    },
    {
      id: 'costManagement',
      title: 'CP QLDA',
      unit: '(đồng)',
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costManagement', 'CP Quản lý dự án', item.costManagement);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP QLDA"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costManagement)}</span>
        </div>
      ),
    },
    {
      id: 'costConsulting',
      title: 'CP TVĐTXD',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costConsulting', 'CP Tư vấn ĐTXD', item.costConsulting);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP TVĐTXD"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costConsulting)}</span>
        </div>
      ),
    },
    {
      id: 'costOthers',
      title: 'CP Khác',
      unit: '(đồng)',
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costOthers', 'CP Khác', item.costOthers);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP Khác"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costOthers)}</span>
        </div>
      ),
    },
    {
      id: 'costContingency',
      title: 'CP Dự phòng',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown(item.id, item.workName, 'costContingency', 'CP Dự phòng', item.costContingency);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP Dự phòng"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costContingency)}</span>
        </div>
      ),
    },
    {
      id: 'totalEstimate',
      title: 'Tổng dự toán',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatVnNumber(item.totalEstimate)}
        </span>
      ),
    },
    {
      id: 'approvalDecision',
      title: 'Quyết định phê duyệt',
      width: 200,
      minWidth: 25,
      render: (item) => <span className="font-mono text-blue-300">{item.approvalDecision}</span>,
    },
    {
      id: 'note',
      title: 'Ghi chú',
      width: 180,
      minWidth: 25,
      render: (item) => <span className="text-slate-400">{item.note || '—'}</span>,
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      <AdvancedTable
        tableId="tab_estimates"
        columns={columns}
        data={estimates}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có hạng mục dự toán nào. Bấm 'Thêm mới' ở góc trên để tạo dự toán."
      />

      {/* Modal Thêm / Sửa - Cấp 2 (Bằng 90% Cấp 1 theo yêu cầu 4) */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sửa Hạng Mục Dự Toán' : 'Thêm Mới Hạng Mục Dự Toán'}
        level={2}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Thêm hạng mục'}
            </AppButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs md:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">STT</label>
              <input
                type="number"
                value={stt}
                onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-slate-300 mb-1">
                Tên công trình / Hạng mục <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                placeholder="Ví dụ: Khối nhà trung tâm đào tạo..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Loại công trình</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as ProjectType)}
                className={`w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs md:text-sm ${
                  !workType ? 'text-slate-500 italic' : 'text-slate-100'
                }`}
              >
                <option value="" disabled hidden>Click để chọn</option>
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
                value={workLevel}
                onChange={(e) => setWorkLevel(e.target.value as ProjectLevel)}
                className={`w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs md:text-sm ${
                  !workLevel ? 'text-slate-500 italic' : 'text-slate-100'
                }`}
              >
                <option value="" disabled hidden>Click để chọn</option>
                <option value="Cấp I">Cấp I</option>
                <option value="Cấp II">Cấp II</option>
                <option value="Cấp III">Cấp III</option>
                <option value="Cấp IV">Cấp IV</option>
              </select>
            </div>
          </div>

          {/* Chi tiết chi phí */}
          <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
            <h4 className="font-bold text-blue-400 uppercase text-xs">Các khoản chi phí dự toán (đồng)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <VnNumberInput
                label={
                  <div className="flex items-center justify-between">
                    <span>CP Xây dựng</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costConstruction',
                          'CP Xây dựng',
                          costConstruction,
                          true
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
                    <span>CP Thiết bị</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costEquipment',
                          'CP Thiết bị',
                          costEquipment,
                          true
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
                    <span>CP QLDA</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costManagement',
                          'CP Quản lý dự án',
                          costManagement,
                          true
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
                    <span>CP TVĐTXD</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costConsulting',
                          'CP Tư vấn ĐTXD',
                          costConsulting,
                          true
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
                    <span>CP Khác</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costOthers',
                          'CP Khác',
                          costOthers,
                          true
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
                    <span>CP Dự phòng</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          editingItem?.id || 'temp-estimate',
                          workName || 'Hạng mục mới',
                          'costContingency',
                          'CP Dự phòng',
                          costContingency,
                          true
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

            <div className="p-2.5 rounded-lg bg-[#0e172a] border border-emerald-500/40 flex items-center justify-between">
              <span className="font-bold text-slate-200">Tổng dự toán (đồng) = Tổng các chi phí:</span>
              <span className="font-mono text-base font-bold text-emerald-400">
                {formatVnNumber(totalEstimate)} đồng
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Quyết định phê duyệt</label>
              <input
                type="text"
                value={approvalDecision}
                onChange={(e) => setApprovalDecision(e.target.value)}
                placeholder="Số, ngày quyết định..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Ghi chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>
        </form>
      </AppModal>

      {/* Modal Cấp 2: Chi tiết cấu thành chi phí dự toán */}
      <CostBreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal((prev) => ({ ...prev, isOpen: false }))}
        projectId={projectId}
        parentId={breakdownModal.estimateId}
        parentTitle={breakdownModal.workName}
        costCategory={breakdownModal.costCategory}
        costCategoryName={breakdownModal.costCategoryName}
        currentCostAmount={breakdownModal.currentCostAmount}
        onApplyTotal={handleApplyBreakdownTotal}
      />

      {/* Confirm xóa */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) onDelete(deletingItem.id);
        }}
        title="Xóa hạng mục dự toán"
        message={`Bạn có chắc muốn xóa hạng mục "${deletingItem?.workName}"?`}
      />
    </div>
  );
};
