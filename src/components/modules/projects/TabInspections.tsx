import React, { useState } from 'react';
import { InspectionItem } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { VnDateInput } from '../../common/VnDateInput';
import { formatVnNumber } from '../../../utils/numberUtils';

interface TabInspectionsProps {
  inspections: InspectionItem[];
  projectId: string;
  onAdd: (item: InspectionItem) => void;
  onUpdate: (item: InspectionItem) => void;
  onDelete: (id: string) => void;
}

export const TabInspections: React.FC<TabInspectionsProps> = ({
  inspections,
  projectId,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InspectionItem | null>(null);

  // Form states
  const [stt, setStt] = useState(inspections.length + 1);
  const [packageName, setPackageName] = useState('');
  const [inspectionRound, setInspectionRound] = useState('Đợt 1');
  const [inspectionDate, setInspectionDate] = useState('18/01/2026');
  const [inspectionValue, setInspectionValue] = useState(0);
  const [paymentValue, setPaymentValue] = useState(0);
  const [note, setNote] = useState('');

  // Tự động tính Tỷ lệ TT/NT (%) = (Giá trị TT / Giá trị NT) * 100
  const ratio =
    inspectionValue > 0 && paymentValue > 0
      ? Number(((paymentValue / inspectionValue) * 100).toFixed(2))
      : 0;

  const handleOpenAdd = () => {
    const nextStt =
      inspections.length > 0 ? Math.max(...inspections.map((i) => Number(i.stt) || 0)) + 1 : 1;
    setEditingItem(null);
    setStt(nextStt);
    setPackageName('');
    setInspectionRound(`Đợt ${nextStt}`);
    setInspectionDate('18/01/2026');
    setInspectionValue(0);
    setPaymentValue(0);
    setNote('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: InspectionItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setPackageName(item.packageName);
    setInspectionRound(item.inspectionRound);
    setInspectionDate(item.inspectionDate);
    setInspectionValue(item.inspectionValue);
    setPaymentValue(item.paymentValue);
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;

    const record: InspectionItem = {
      id: editingItem ? editingItem.id : `insp-${Date.now()}`,
      projectId,
      stt,
      packageName: packageName.trim(),
      inspectionRound: inspectionRound.trim(),
      inspectionDate: inspectionDate.trim(),
      inspectionValue,
      paymentValue,
      ratio,
      note: note.trim(),
    };

    if (editingItem) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setModalOpen(false);
  };

  // Cấu hình các cột theo yêu cầu số 5
  const columns: AdvancedColumn<InspectionItem>[] = [
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
      id: 'packageName',
      title: 'Tên gói thầu',
      width: 320,
      minWidth: 25,
      pinned: true,
      render: (item) => <span className="font-semibold text-slate-100">{item.packageName}</span>,
    },
    {
      id: 'inspectionRound',
      title: 'Đợt NT',
      width: 100,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
          {item.inspectionRound}
        </span>
      ),
    },
    {
      id: 'inspectionDate',
      title: 'Ngày NT',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono text-emerald-400 font-semibold">
          {item.inspectionDate}
        </span>
      ),
    },
    {
      id: 'inspectionValue',
      title: 'Giá trị NT',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-medium text-slate-100">
          {formatVnNumber(item.inspectionValue)}
        </span>
      ),
    },
    {
      id: 'paymentValue',
      title: 'Giá trị TT',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-amber-400">
          {formatVnNumber(item.paymentValue)}
        </span>
      ),
    },
    {
      id: 'ratio',
      title: 'Tỷ lệ TT/NT',
      unit: '(%)',
      width: 120,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
          {item.ratio > 0 ? `${item.ratio}%` : '—'}
        </span>
      ),
    },
    {
      id: 'note',
      title: 'Ghi chú',
      width: 260,
      minWidth: 25,
      render: (item) => <span className="text-slate-400">{item.note || '—'}</span>,
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      <AdvancedTable
        columns={columns}
        data={inspections}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có đợt nghiệm thu / thanh toán nào. Bấm 'Thêm mới' ở góc trên để tạo đợt nghiệm thu."
      />

      {/* Modal Thêm / Sửa - Cấp 2 (Bằng 90% Cấp 1 theo yêu cầu 4) */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sửa Đợt Nghiệm Thu / Thanh Toán' : 'Thêm Mới Đợt Nghiệm Thu'}
        level={2}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Thêm đợt NT'}
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
                Tên gói thầu <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="Ví dụ: Gói thầu số 18: Thi công xây lắp..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Đợt NT</label>
              <input
                type="text"
                value={inspectionRound}
                onChange={(e) => setInspectionRound(e.target.value)}
                placeholder="Ví dụ: Đợt 1, Đợt 2..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <VnDateInput
                label="Ngày NT (Chuẩn VN)"
                value={inspectionDate}
                onChange={(formatted) => setInspectionDate(formatted)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <VnNumberInput
              label="Giá trị NT (đồng)"
              value={inspectionValue}
              onChange={(val) => setInspectionValue(val)}
              suffix="đồng"
            />
            <VnNumberInput
              label="Giá trị TT (đồng)"
              value={paymentValue}
              onChange={(val) => setPaymentValue(val)}
              suffix="đồng"
            />
          </div>

          <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-lg flex items-center justify-between">
            <span className="text-slate-300 font-medium">Tỷ lệ TT/NT (%):</span>
            <span className="font-mono font-bold text-purple-400 text-sm">
              {ratio}%
            </span>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Chi tiết nội dung khối lượng nghiệm thu..."
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 resize-none"
            />
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
        title="Xóa đợt nghiệm thu"
        message={`Bạn có chắc muốn xóa đợt nghiệm thu "${deletingItem?.inspectionRound} - ${deletingItem?.packageName}"?`}
      />
    </div>
  );
};

