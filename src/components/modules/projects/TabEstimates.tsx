import React, { useState } from 'react';
import { EstimateItem, ProjectType, ProjectLevel } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { formatVnNumber } from '../../../utils/numberUtils';

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
    setWorkType('Dân dụng');
    setWorkLevel('Cấp II');
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
      workType,
      workLevel,
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
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costConstruction)}</span>,
    },
    {
      id: 'costEquipment',
      title: 'CP Thiết bị',
      unit: '(đồng)',
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costEquipment)}</span>,
    },
    {
      id: 'costManagement',
      title: 'CP QLDA',
      unit: '(đồng)',
      width: 130,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costManagement)}</span>,
    },
    {
      id: 'costConsulting',
      title: 'CP TVĐTXD',
      unit: '(đồng)',
      width: 140,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costConsulting)}</span>,
    },
    {
      id: 'costOthers',
      title: 'CP Khác',
      unit: '(đồng)',
      width: 130,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costOthers)}</span>,
    },
    {
      id: 'costContingency',
      title: 'CP Dự phòng',
      unit: '(đồng)',
      width: 140,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costContingency)}</span>,
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
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Loại công trình</label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as ProjectType)}
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
                value={workLevel}
                onChange={(e) => setWorkLevel(e.target.value as ProjectLevel)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              >
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
                label="CP Xây dựng (đồng)"
                value={costConstruction}
                onChange={(val) => setCostConstruction(val)}
                suffix="đồng"
              />
              <VnNumberInput
                label="CP Thiết bị (đồng)"
                value={costEquipment}
                onChange={(val) => setCostEquipment(val)}
                suffix="đồng"
              />
              <VnNumberInput
                label="CP QLDA (đồng)"
                value={costManagement}
                onChange={(val) => setCostManagement(val)}
                suffix="đồng"
              />
              <VnNumberInput
                label="CP TVĐTXD (đồng)"
                value={costConsulting}
                onChange={(val) => setCostConsulting(val)}
                suffix="đồng"
              />
              <VnNumberInput
                label="CP Khác (đồng)"
                value={costOthers}
                onChange={(val) => setCostOthers(val)}
                suffix="đồng"
              />
              <VnNumberInput
                label="CP Dự phòng (đồng)"
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
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Ghi chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>
        </form>
      </AppModal>

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
