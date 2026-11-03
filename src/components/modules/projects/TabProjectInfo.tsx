import React, { useState } from 'react';
import { ProjectDetailItem, ProjectGroup, ProjectType, ProjectLevel, ProjectStatus } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { formatVnNumber } from '../../../utils/numberUtils';

interface TabProjectInfoProps {
  projectDetail: ProjectDetailItem;
  onUpdate: (updated: ProjectDetailItem) => void;
  onDelete?: (id: string) => void;
}

export const TabProjectInfo: React.FC<TabProjectInfoProps> = ({
  projectDetail,
  onUpdate,
  onDelete,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProjectDetailItem>(projectDetail);

  // Mở modal sửa
  const handleOpenEdit = () => {
    setFormData(projectDetail);
    setIsEditModalOpen(true);
  };

  // Tự động tính tổng 7 chi phí thành Tổng mức đầu tư
  const handleCostChange = (field: keyof ProjectDetailItem, val: number) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      const sum =
        (updated.costCompensation || 0) +
        (updated.costConstruction || 0) +
        (updated.costEquipment || 0) +
        (updated.costManagement || 0) +
        (updated.costConsulting || 0) +
        (updated.costOthers || 0) +
        (updated.costContingency || 0);
      return { ...updated, totalInvestment: sum };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditModalOpen(false);
  };

  // Cấu hình đầy đủ 18 cột theo đúng yêu cầu - Đồng bộ cỡ chữ text-sm
  const columns: AdvancedColumn<ProjectDetailItem>[] = [
    {
      id: 'stt',
      title: 'STT',
      width: 60,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => <span className="font-mono text-slate-300 font-semibold">{item.stt}</span>,
    },
    {
      id: 'code',
      title: 'Mã dự án',
      width: 140,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => (
        <span className="font-mono font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
          {item.code}
        </span>
      ),
    },
    {
      id: 'name',
      title: 'Tên dự án',
      width: 320,
      minWidth: 25,
      pinned: true,
      render: (item) => <span className="font-semibold text-slate-100">{item.name}</span>,
    },
    {
      id: 'location',
      title: 'Địa điểm',
      width: 220,
      minWidth: 25,
      render: (item) => <span className="text-slate-200">{item.location}</span>,
    },
    {
      id: 'scale',
      title: 'Quy mô đầu tư',
      width: 280,
      minWidth: 25,
      render: (item) => <span className="text-slate-300">{item.scale}</span>,
    },
    {
      id: 'status',
      title: 'Trạng thái',
      width: 190,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        const variant =
          item.status === 'Đang thực hiện'
            ? 'blue'
            : item.status === 'Chuẩn bị đầu tư'
            ? 'amber'
            : item.status === 'Hoàn thành chưa quyết toán'
            ? 'purple'
            : 'emerald';
        return <AppBadge variant={variant} dot>{item.status}</AppBadge>;
      },
    },
    {
      id: 'group',
      title: 'Nhóm dự án',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="slate">{item.group}</AppBadge>,
    },
    {
      id: 'type',
      title: 'Loại dự án',
      width: 150,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="blue">{item.type}</AppBadge>,
    },
    {
      id: 'level',
      title: 'Cấp công trình',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="purple">{item.level}</AppBadge>,
    },
    {
      id: 'costCompensation',
      title: 'CP BT, HT & TĐC',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costCompensation)}</span>,
    },
    {
      id: 'costConstruction',
      title: 'CP Xây dựng',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono font-medium">{formatVnNumber(item.costConstruction)}</span>,
    },
    {
      id: 'costEquipment',
      title: 'CP Thiết bị',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costEquipment)}</span>,
    },
    {
      id: 'costManagement',
      title: 'CP QLDA',
      unit: '(đồng)',
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costManagement)}</span>,
    },
    {
      id: 'costConsulting',
      title: 'CP TVĐTXD',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costConsulting)}</span>,
    },
    {
      id: 'costOthers',
      title: 'CP Khác',
      unit: '(đồng)',
      width: 150,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costOthers)}</span>,
    },
    {
      id: 'costContingency',
      title: 'CP Dự phòng',
      unit: '(đồng)',
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.costContingency)}</span>,
    },
    {
      id: 'totalInvestment',
      title: 'Tổng mức đầu tư',
      unit: '(đồng)',
      width: 190,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <span className="font-mono font-bold text-emerald-400">
          {formatVnNumber(item.totalInvestment)}
        </span>
      ),
    },
    {
      id: 'approvalDecision',
      title: 'Quyết định phê duyệt',
      width: 250,
      minWidth: 25,
      render: (item) => <span className="font-mono text-blue-300">{item.approvalDecision}</span>,
    },
    {
      id: 'note',
      title: 'Ghi chú',
      width: 220,
      minWidth: 25,
      render: (item) => <span className="text-slate-400">{item.note || '—'}</span>,
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Bảng hiển thị thông tin dự án & 7 chi phí (Có cả nút Sửa và Xóa theo yêu cầu 1) */}
      <AdvancedTable
        columns={columns}
        data={[projectDetail]}
        keyExtractor={(item) => item.id}
        onEdit={handleOpenEdit}
        onDelete={() => setIsDeleteDialogOpen(true)}
        showActionsColumn={true}
      />

      {/* Modal Sửa Thông Tin Dự Án - Cấp 1 (Theo yêu cầu 4) */}
      <AppModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh Sửa Thông Tin Dự Án & Chi Phí TMĐT"
        subtitle="Cập nhật quy mô, cấp công trình và 7 nhóm chi phí (Tổng mức đầu tư sẽ tự động tính)"
        level={1}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              Lưu cập nhật
            </AppButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs md:text-sm">
          {/* Nhóm 1: Thông tin chung */}
          <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
            <h4 className="font-bold text-blue-400 uppercase text-xs">1. Thông tin chung</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Mã dự án</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 mb-1">Tên dự án</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-semibold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Địa điểm</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Quy mô đầu tư</label>
                <input
                  type="text"
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value })}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
                  placeholder="Ví dụ: Quy mô 5 tầng nổi, 1 tầng hầm..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-300 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
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
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value as ProjectGroup })}
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
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
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
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as ProjectLevel })}
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
                  value={formData.approvalDecision}
                  onChange={(e) => setFormData({ ...formData, approvalDecision: e.target.value })}
                  placeholder="Số QĐ, ngày ban hành, cơ quan phê duyệt..."
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Ghi chú</label>
                <input
                  type="text"
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Cơ cấu 7 khoản mục chi phí Tổng mức đầu tư */}
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
                label="1. CP BT, HT & TĐC"
                value={formData.costCompensation}
                onChange={(val) => handleCostChange('costCompensation', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="2. CP Xây dựng"
                value={formData.costConstruction}
                onChange={(val) => handleCostChange('costConstruction', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="3. CP Thiết bị"
                value={formData.costEquipment}
                onChange={(val) => handleCostChange('costEquipment', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="4. CP QLDA"
                value={formData.costManagement}
                onChange={(val) => handleCostChange('costManagement', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="5. CP TVĐTXD"
                value={formData.costConsulting}
                onChange={(val) => handleCostChange('costConsulting', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="6. CP Khác"
                value={formData.costOthers}
                onChange={(val) => handleCostChange('costOthers', val)}
                suffix="đồng"
              />

              <VnNumberInput
                label="7. CP Dự phòng"
                value={formData.costContingency}
                onChange={(val) => handleCostChange('costContingency', val)}
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
                {formatVnNumber(formData.totalInvestment)} đồng
              </div>
            </div>
          </div>
        </form>
      </AppModal>

      {/* Dialog xác nhận xóa dự án */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (onDelete) {
            onDelete(projectDetail.id);
            setIsDeleteDialogOpen(false);
          }
        }}
        title="Xác nhận xóa dự án"
        message={
          <div>
            Bạn có chắc chắn muốn xóa dự án{' '}
            <strong className="text-white">
              {projectDetail.code} - {projectDetail.name}
            </strong>
            ? Toàn bộ các dữ liệu dự toán, hợp đồng, nghiệm thu và hồ sơ pháp lý liên quan sẽ bị xóa hoàn toàn.
          </div>
        }
      />
    </div>
  );
};
