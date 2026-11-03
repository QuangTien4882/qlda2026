import React, { useState } from 'react';
import { ProjectDetailItem, ProjectGroup, ProjectType, ProjectLevel, ProjectStatus, SevenCostCategory } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { CostBreakdownModal } from './CostBreakdownModal';
import { formatVnNumber } from '../../../utils/numberUtils';
import { Layers } from 'lucide-react';

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

  // Modal mở chi tiết cấu thành cho từng loại trong 7 chi phí
  const [breakdownModal, setBreakdownModal] = useState<{
    isOpen: boolean;
    costCategory: SevenCostCategory;
    costCategoryName: string;
    currentCostAmount: number;
    fromEditModal?: boolean;
  }>({
    isOpen: false,
    costCategory: 'costConstruction',
    costCategoryName: '',
    currentCostAmount: 0,
    fromEditModal: false,
  });

  const handleOpenBreakdown = (
    costCategory: SevenCostCategory,
    costCategoryName: string,
    currentCostAmount: number,
    fromEditModal = false
  ) => {
    setBreakdownModal({
      isOpen: true,
      costCategory,
      costCategoryName,
      currentCostAmount,
      fromEditModal,
    });
  };

  const handleApplyBreakdownTotal = (newTotal: number) => {
    const { costCategory, fromEditModal } = breakdownModal;

    if (fromEditModal) {
      handleCostChange(costCategory, newTotal);
    } else {
      const updated = {
        ...projectDetail,
        [costCategory]: newTotal,
      };
      const sum =
        (updated.costCompensation || 0) +
        (updated.costConstruction || 0) +
        (updated.costEquipment || 0) +
        (updated.costManagement || 0) +
        (updated.costConsulting || 0) +
        (updated.costOthers || 0) +
        (updated.costContingency || 0);

      const finalDetail = { ...updated, totalInvestment: sum };
      onUpdate(finalDetail);
      setFormData(finalDetail);
    }
  };

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
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costCompensation', 'CP Bồi thường, HT & TĐC', item.costCompensation);
            }}
            title="Xem & sửa nội dung chi tiết cấu thành CP Bồi thường, HT & TĐC"
            className="p-1 rounded text-slate-400 hover:text-blue-300 hover:bg-blue-900/40 transition-colors"
          >
            <Layers size={13} />
          </button>
          <span className="font-mono">{formatVnNumber(item.costCompensation)}</span>
        </div>
      ),
    },
    {
      id: 'costConstruction',
      title: 'CP Xây dựng',
      unit: '(đồng)',
      width: 180,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costConstruction', 'CP Xây dựng', item.costConstruction);
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
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costEquipment', 'CP Thiết bị', item.costEquipment);
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
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costManagement', 'CP Quản lý dự án', item.costManagement);
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
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costConsulting', 'CP Tư vấn ĐTXD', item.costConsulting);
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
      width: 160,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costOthers', 'CP Khác', item.costOthers);
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
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5 w-full">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenBreakdown('costContingency', 'CP Dự phòng', item.costContingency);
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
        tableId="tab_project_info"
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
                label={
                  <div className="flex items-center justify-between">
                    <span>1. CP BT, HT & TĐC</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenBreakdown(
                          'costCompensation',
                          'CP Bồi thường, HT & TĐC',
                          formData.costCompensation,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costCompensation}
                onChange={(val) => handleCostChange('costCompensation', val)}
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
                          formData.costConstruction,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costConstruction}
                onChange={(val) => handleCostChange('costConstruction', val)}
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
                          formData.costEquipment,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costEquipment}
                onChange={(val) => handleCostChange('costEquipment', val)}
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
                          formData.costManagement,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costManagement}
                onChange={(val) => handleCostChange('costManagement', val)}
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
                          formData.costConsulting,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costConsulting}
                onChange={(val) => handleCostChange('costConsulting', val)}
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
                          formData.costOthers,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
                value={formData.costOthers}
                onChange={(val) => handleCostChange('costOthers', val)}
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
                          formData.costContingency,
                          true
                        )
                      }
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-normal"
                    >
                      <Layers size={11} /> Chi tiết
                    </button>
                  </div>
                }
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

      {/* Modal Cấp 2: Chi tiết cấu thành khoản mục chi phí */}
      <CostBreakdownModal
        isOpen={breakdownModal.isOpen}
        onClose={() => setBreakdownModal((prev) => ({ ...prev, isOpen: false }))}
        projectId={projectDetail.projectId || projectDetail.id}
        parentId={projectDetail.id}
        parentTitle={`${projectDetail.code} - ${projectDetail.name}`}
        costCategory={breakdownModal.costCategory}
        costCategoryName={breakdownModal.costCategoryName}
        currentCostAmount={breakdownModal.currentCostAmount}
        onApplyTotal={handleApplyBreakdownTotal}
      />

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
        confirmLabel="Xóa toàn bộ dự án"
        message={
          <div className="space-y-2 text-xs md:text-sm">
            <p>
              Bạn có chắc chắn muốn xóa dự án{' '}
              <strong className="text-white">
                {projectDetail.code} - {projectDetail.name}
              </strong>
              ?
            </p>
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/70 text-rose-300 text-xs">
              ⚠️ <strong>Lưu ý quan trọng:</strong> Toàn bộ dữ liệu dự toán, nội dung chi phí, nghiệm thu, hồ sơ pháp lý, kế hoạch và các khoản mục chi tiết cấu thành liên quan sẽ bị <strong>xóa vĩnh viễn</strong>.
            </div>
          </div>
        }
      />
    </div>
  );
};
