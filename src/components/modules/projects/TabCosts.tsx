import React, { useState } from 'react';
import { 
  CostPackageItem, 
  CostStatus, 
  CostCategory, 
  CostType, 
  BiddingForm, 
  BiddingMethod, 
  ContractType 
} from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppBadge } from '../../common/AppBadge';
import { ContractAppendixModal } from './ContractAppendixModal';
import { Plus } from 'lucide-react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { VnDateInput } from '../../common/VnDateInput';
import { SearchableSelect, SearchableOption } from '../../common/SearchableSelect';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useData } from '../../../context/DataContext';

interface TabCostsProps {
  costPackages: CostPackageItem[];
  projectId: string;
  onAdd: (item: CostPackageItem) => void;
  onUpdate: (item: CostPackageItem) => void;
  onDelete: (id: string) => void;
}

export const TabCosts: React.FC<TabCostsProps> = ({
  costPackages,
  projectId,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const { 
    companies, 
    inspections, 
    getContractAppendicesByPackage, 
    getEffectiveContractValue 
  } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CostPackageItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CostPackageItem | null>(null);
  const [appendixModalPackage, setAppendixModalPackage] = useState<CostPackageItem | null>(null);

  // Form states
  const [stt, setStt] = useState(costPackages.length + 1);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<CostStatus>('Chưa thực hiện');
  const [category, setCategory] = useState<CostCategory>('XD');
  const [costType, setCostType] = useState<CostType>('Chi phí');
  const [contractor, setContractor] = useState('');
  const [estimateValue, setEstimateValue] = useState(0);
  const [contractValue, setContractValue] = useState(0);
  const [biddingTime, setBiddingTime] = useState('');
  const [biddingForm, setBiddingForm] = useState<BiddingForm>('Đấu thầu rộng rãi');
  const [biddingMethod, setBiddingMethod] = useState<BiddingMethod>('01 giai đoạn 02 túi hồ sơ');
  const [contractNumber, setContractNumber] = useState('');
  const [contractDate, setContractDate] = useState('18/01/2026');
  const [contractType, setContractType] = useState<ContractType>('Đơn giá cố định');
  const [executionTime, setExecutionTime] = useState('');
  const [contractAppendix, setContractAppendix] = useState('Không');
  const [note, setNote] = useState('');

  // Danh mục nhà thầu để chọn nhanh
  const companyOptions: SearchableOption[] = companies.map((c) => ({
    value: c.name,
    label: c.name,
    subLabel: `MST: ${c.taxCode || '—'} • Đại diện: ${c.representative || '—'}`,
    badge: c.shortName || undefined,
    badgeColor: 'blue',
    extraData: c,
  }));

  // Tìm các đợt nghiệm thu liên quan đến gói thầu đang muốn xóa
  const relatedInspections = (inspections[projectId] || []).filter(
    (insp) =>
      insp.costPackageId === deletingItem?.id ||
      (deletingItem?.content &&
        insp.packageName?.trim().toLowerCase() === deletingItem?.content.trim().toLowerCase())
  );

  // Tìm các phụ lục hợp đồng liên quan đến gói thầu đang muốn xóa
  const relatedAppendices = deletingItem
    ? getContractAppendicesByPackage(projectId, deletingItem.id)
    : [];

  // Tự động tính Tỷ lệ giảm thầu (%) = (Dự toán - Hợp đồng) / Dự toán * 100%
  const discountRate =
    estimateValue > 0 && contractValue > 0
      ? Number((((estimateValue - contractValue) / estimateValue) * 100).toFixed(2))
      : 0;

  const handleOpenAdd = () => {
    const nextStt =
      costPackages.length > 0 ? Math.max(...costPackages.map((c) => Number(c.stt) || 0)) + 1 : 1;
    setEditingItem(null);
    setStt(nextStt);
    setContent('');
    setStatus('' as any);
    setCategory('' as any);
    setCostType('Chi phí');
    setContractor('');
    setEstimateValue(0);
    setContractValue(0);
    setBiddingTime('');
    setBiddingForm('' as any);
    setBiddingMethod('' as any);
    setContractNumber('');
    setContractDate('');
    setContractType('' as any);
    setExecutionTime('');
    setContractAppendix('');
    setNote('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CostPackageItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setContent(item.content);
    setStatus(item.status);
    setCategory(item.category);
    setCostType(item.costType || 'Chi phí');
    setContractor(item.contractor);
    setEstimateValue(item.estimateValue);
    setContractValue(item.contractValue);
    setBiddingTime(item.biddingTime || '');
    setBiddingForm(item.biddingForm);
    setBiddingMethod(item.biddingMethod);
    setContractNumber(item.contractNumber || '');
    setContractDate(item.contractDate || '');
    setContractType(item.contractType);
    setExecutionTime(item.executionTime || '');
    setContractAppendix(item.contractAppendix || '');
    setNote(item.note || '');
    setModalOpen(true);
  };

  const isFee = costType === 'Phí';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const record: CostPackageItem = {
      id: editingItem ? editingItem.id : `cp-${Date.now()}`,
      projectId,
      stt,
      content: content.trim(),
      status: status || 'Chưa thực hiện',
      category: category || 'XD',
      costType: costType || 'Chi phí',
      contractor: contractor.trim(),
      estimateValue,
      contractValue,
      discountRate: isFee ? 0 : discountRate,
      biddingTime: isFee ? '' : biddingTime.trim(),
      biddingForm: isFee ? ('Không áp dụng' as any) : (biddingForm || 'Đấu thầu rộng rãi'),
      biddingMethod: isFee ? 'Không áp dụng' : (biddingMethod || '01 giai đoạn 02 túi hồ sơ'),
      contractNumber: isFee ? '' : contractNumber.trim(),
      contractDate: isFee ? '' : contractDate.trim(),
      contractType: isFee ? 'Trọn gói' : (contractType || 'Đơn giá cố định'),
      executionTime: isFee ? '' : executionTime.trim(),
      contractAppendix: isFee ? '' : contractAppendix.trim(),
      note: note.trim(),
    };

    if (editingItem) {
      onUpdate(record);
    } else {
      onAdd(record);
    }
    setModalOpen(false);
  };

  // Cấu hình các cột theo yêu cầu số 4
  const columns: AdvancedColumn<CostPackageItem>[] = [
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
      id: 'content',
      title: 'Nội dung chi phí',
      width: 320,
      minWidth: 25,
      pinned: true,
      render: (item) => <span className="font-semibold text-slate-100">{item.content}</span>,
    },
    {
      id: 'status',
      title: 'Trạng thái',
      width: 150,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        const variant =
          item.status === 'Hoàn thành'
            ? 'emerald'
            : item.status === 'Đang thực hiện'
            ? 'blue'
            : 'slate';
        return <AppBadge variant={variant} dot>{item.status}</AppBadge>;
      },
    },
    {
      id: 'category',
      title: 'Khoản mục',
      width: 110,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="purple">{item.category}</AppBadge>,
    },
    {
      id: 'costType',
      title: 'Loại chi phí',
      width: 120,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="slate">{item.costType}</AppBadge>,
    },
    {
      id: 'contractor',
      title: 'Đơn vị thực hiện',
      width: 260,
      minWidth: 25,
      render: (item) => <span className="text-slate-300 text-xs font-medium">{item.contractor || '—'}</span>,
    },
    {
      id: 'estimateValue',
      title: 'Giá trị dự toán',
      unit: '(đồng)',
      width: 170,
      minWidth: 25,
      align: 'right',
      render: (item) => <span className="font-mono">{formatVnNumber(item.estimateValue)}</span>,
    },
    {
      id: 'contractValue',
      title: 'Giá trị hợp đồng',
      unit: '(đồng)',
      width: 190,
      minWidth: 25,
      align: 'right',
      render: (item) => {
        const itemAppendices = getContractAppendicesByPackage(projectId, item.id);
        const totalAdj = itemAppendices.reduce((s, a) => s + (Number(a.adjustmentAmount) || 0), 0);
        const effectiveVal = Number(item.contractValue) + totalAdj;

        return (
          <div className="flex flex-col items-end">
            <span className="font-mono font-bold text-emerald-400">
              {formatVnNumber(item.contractValue)}
            </span>
            {totalAdj !== 0 && (
              <span 
                className="text-[10px] text-blue-300 font-mono" 
                title={`Giá trị hiệu lực sau phụ lục: ${formatVnNumber(effectiveVal)} đ`}
              >
                Sau PL: <strong className={totalAdj > 0 ? 'text-emerald-300' : 'text-amber-300'}>{formatVnNumber(effectiveVal)}</strong>
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'discountRate',
      title: 'Tỷ lệ giảm thầu',
      unit: '(%)',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        if (item.costType === 'Phí') return <span className="text-slate-500 font-mono text-xs">—</span>;
        const valStr = item.discountRate > 0 ? `${String(item.discountRate).replace('.', ',')}%` : '0%';
        return (
          <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
            {valStr}
          </span>
        );
      },
    },
    {
      id: 'biddingTime',
      title: 'Thời gian LCNT',
      width: 140,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="text-xs text-slate-300">{item.biddingTime}</span>,
    },
    {
      id: 'biddingForm',
      title: 'Hình thức LCNT',
      width: 170,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="text-xs text-slate-300">{item.biddingForm}</span>,
    },
    {
      id: 'biddingMethod',
      title: 'Phương thức LCNT',
      width: 210,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="text-xs text-slate-300">{item.biddingMethod}</span>,
    },
    {
      id: 'contractNumber',
      title: 'Số HĐ',
      width: 150,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-blue-300">
          {item.contractNumber || '—'}
        </span>
      ),
    },
    {
      id: 'contractDate',
      title: 'Ngày ký HĐ',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono text-emerald-400">
          {item.contractDate || '—'}
        </span>
      ),
    },
    {
      id: 'contractType',
      title: 'Loại HĐ',
      width: 150,
      minWidth: 25,
      align: 'center',
      render: (item) => <AppBadge variant="slate">{item.contractType}</AppBadge>,
    },
    {
      id: 'executionTime',
      title: 'Thời gian thực hiện HĐ',
      width: 170,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="text-slate-200">{item.executionTime}</span>,
    },
    {
      id: 'contractAppendix',
      title: 'PLHĐ',
      width: 190,
      minWidth: 25,
      align: 'center',
      render: (item) => {
        const itemAppendices = getContractAppendicesByPackage(projectId, item.id);
        const count = itemAppendices.length;
        const totalAdj = itemAppendices.reduce((s, a) => s + (Number(a.adjustmentAmount) || 0), 0);

        if (count === 0) {
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setAppendixModalPackage(item);
              }}
              title="Bấm để mở Quản lý Phụ lục Hợp đồng"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#0b1424] hover:bg-blue-900/40 border border-[#232f4e] hover:border-blue-500/60 text-slate-400 hover:text-blue-300 text-xs transition-colors group"
            >
              <Plus size={12} className="text-slate-500 group-hover:text-blue-400" />
              <span>+ Thêm PLHĐ</span>
            </button>
          );
        }

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAppendixModalPackage(item);
            }}
            title={`Có ${count} Phụ lục hợp đồng. Bấm để quản lý chi tiết.`}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg bg-[#0b172e] hover:bg-[#122345] border border-blue-500/40 hover:border-blue-400 text-xs transition-all w-full max-w-[170px] mx-auto text-center"
          >
            <div className="flex items-center gap-1 font-bold text-blue-300">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span>{count} PLHĐ</span>
            </div>
            {totalAdj !== 0 ? (
              <span className={`font-mono text-[11px] font-semibold ${totalAdj > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {totalAdj > 0 ? '+' : ''}{formatVnNumber(totalAdj)} đ
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Điều chỉnh tiến độ/nội dung</span>
            )}
          </button>
        );
      },
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
      <AdvancedTable
        tableId="tab_costs"
        columns={columns}
        data={costPackages}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có gói thầu / nội dung chi phí nào. Bấm 'Thêm mới' ở góc trên để tạo gói thầu."
      />

      {/* Modal Thêm / Sửa - Cấp 2 (Bằng 90% Cấp 1 theo yêu cầu 4) */}
      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Sửa Nội Dung Chi Phí & Hợp Đồng' : 'Thêm Mới Nội Dung Chi Phí'}
        level={2}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSave}>
              {editingItem ? 'Lưu cập nhật' : 'Thêm nội dung'}
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
                Nội dung chi phí <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ví dụ: Thi công xây dựng khối nhà làm việc..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Trạng thái</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CostStatus)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm"
              >
                <option value="">-- Click để chọn --</option>
                <option value="Chưa thực hiện">Chưa thực hiện</option>
                <option value="Đang thực hiện">Đang thực hiện</option>
                <option value="Hoàn thành">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Khoản mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm"
              >
                <option value="">-- Click để chọn --</option>
                <option value="TVXD">TVXD (Tư vấn XD)</option>
                <option value="XD">XD (Xây lắp)</option>
                <option value="K">K (Chi phí khác)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Loại chi phí</label>
              <select
                value={costType}
                onChange={(e) => {
                  const newType = e.target.value as CostType;
                  setCostType(newType);
                  if (newType === 'Phí') {
                    setBiddingTime('');
                    setBiddingForm('Không áp dụng' as any);
                    setBiddingMethod('Không áp dụng');
                    setContractNumber('');
                    setContractDate('');
                    setContractType('Trọn gói');
                    setExecutionTime('');
                    setContractAppendix('');
                  }
                }}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm"
              >
                <option value="Chi phí">Chi phí</option>
                <option value="Phí">Phí</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Đơn vị thực hiện
                <span className="text-slate-400 font-normal text-[11px] ml-1.5">(Nhà thầu)</span>
              </label>
              <SearchableSelect
                options={companyOptions}
                value={contractor}
                onChange={(val) => setContractor(val)}
                placeholder="-- Click để chọn hoặc nhập tên nhà thầu --"
                allowCustomInput={true}
              />
            </div>
          </div>

          {/* Giá trị và Tỷ lệ giảm thầu */}
          <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
            <h4 className="font-bold text-blue-400 uppercase text-xs">Giá trị & Tỷ lệ giảm thầu</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <VnNumberInput
                label="Giá trị dự toán (đồng)"
                value={estimateValue}
                onChange={(val) => setEstimateValue(val)}
                suffix="đồng"
                placeholder="0"
              />
              <VnNumberInput
                label="Giá trị hợp đồng (đồng)"
                value={contractValue}
                onChange={(val) => setContractValue(val)}
                suffix="đồng"
                placeholder="0"
              />
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium text-xs md:text-sm">
                  Tỷ lệ giảm thầu (%)
                </label>
                <div
                  className={`w-full border rounded-lg py-2 px-3 font-mono font-bold text-xs md:text-sm ${
                    isFee
                      ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-[#0b1222] border-[#232f4e] text-blue-400'
                  }`}
                >
                  {isFee ? '— (Không áp dụng)' : (discountRate > 0 ? `${String(discountRate).replace('.', ',')}%` : '0%')}
                </div>
              </div>
            </div>
          </div>

          {/* Đấu thầu & LCNT (Disable nếu là Phí) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Thời gian LCNT {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <input
                type="text"
                disabled={isFee}
                value={isFee ? '' : biddingTime}
                onChange={(e) => setBiddingTime(e.target.value)}
                placeholder={isFee ? 'Không áp dụng đối với Phí' : 'Ví dụ: Quý I/2026'}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm placeholder:italic placeholder:text-slate-500 ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              />
            </div>
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Hình thức LCNT {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <select
                disabled={isFee}
                value={isFee ? '' : biddingForm}
                onChange={(e) => setBiddingForm(e.target.value as BiddingForm)}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              >
                <option value="">-- Click để chọn --</option>
                <option value="Chỉ định thầu rút gọn">Chỉ định thầu rút gọn</option>
                <option value="Chỉ định thầu">Chỉ định thầu</option>
                <option value="Đấu thầu rộng rãi">Đấu thầu rộng rãi</option>
              </select>
            </div>
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Phương thức LCNT {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <select
                disabled={isFee}
                value={isFee ? '' : biddingMethod}
                onChange={(e) => setBiddingMethod(e.target.value as BiddingMethod)}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              >
                <option value="">-- Click để chọn --</option>
                <option value="Không áp dụng">Không áp dụng</option>
                <option value="01 giai đoạn 01 túi hồ sơ">01 giai đoạn 01 túi hồ sơ</option>
                <option value="01 giai đoạn 02 túi hồ sơ">01 giai đoạn 02 túi hồ sơ</option>
                <option value="02 giai đoạn 01 túi hồ sơ">02 giai đoạn 01 túi hồ sơ</option>
                <option value="02 giai đoạn 02 túi hồ sơ">02 giai đoạn 02 túi hồ sơ</option>
              </select>
            </div>
          </div>

          {/* Hợp đồng (Disable nếu là Phí) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Số HĐ {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <input
                type="text"
                disabled={isFee}
                value={isFee ? '' : contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder={isFee ? 'Không áp dụng đối với Phí' : 'Ví dụ: 18/2026/HĐ-XD'}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 font-mono text-xs md:text-sm placeholder:italic placeholder:text-slate-500 ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              />
            </div>
            <div>
              <VnDateInput
                label={
                  <span>
                    Ngày ký HĐ {isFee && <span className="text-[11px] text-slate-500 italic font-normal">(Không áp dụng)</span>}
                  </span>
                }
                disabled={isFee}
                value={isFee ? '' : contractDate}
                onChange={(formatted) => setContractDate(formatted)}
                placeholder={isFee ? 'Không áp dụng đối với Phí' : 'dd/mm/yyyy (Click để chọn ngày)'}
              />
            </div>
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Loại HĐ {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <select
                disabled={isFee}
                value={isFee ? '' : contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              >
                <option value="">-- Click để chọn --</option>
                <option value="Trọn gói">Trọn gói</option>
                <option value="Đơn giá cố định">Đơn giá cố định</option>
                <option value="Đơn giá điều chỉnh">Đơn giá điều chỉnh</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                Thời gian thực hiện HĐ {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <input
                type="text"
                disabled={isFee}
                value={isFee ? '' : executionTime}
                onChange={(e) => setExecutionTime(e.target.value)}
                placeholder={isFee ? 'Không áp dụng đối với Phí' : 'Ví dụ: 180 ngày'}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm placeholder:italic placeholder:text-slate-500 ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              />
            </div>
            <div>
              <label className={`block mb-1 ${isFee ? 'text-slate-500' : 'text-slate-300'}`}>
                PLHĐ (Phụ lục hợp đồng) {isFee && <span className="text-[11px] text-slate-500 italic">(Không áp dụng)</span>}
              </label>
              <input
                type="text"
                disabled={isFee}
                value={isFee ? '' : contractAppendix}
                onChange={(e) => setContractAppendix(e.target.value)}
                placeholder={isFee ? 'Không áp dụng đối với Phí' : 'Phụ lục hợp đồng nếu có...'}
                className={`w-full border rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm placeholder:italic placeholder:text-slate-500 ${
                  isFee ? 'bg-slate-900/60 border-slate-800 opacity-50 cursor-not-allowed' : 'bg-[#080d1a] border-[#232f4e]'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Ghi chú</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm nếu có..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs md:text-sm placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>
        </form>
      </AppModal>

      {/* Confirm xóa kèm cảnh báo ràng buộc toàn vẹn xóa lan tỏa */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) onDelete(deletingItem.id);
        }}
        title="Xóa nội dung chi phí & gói thầu"
        confirmLabel={
          relatedInspections.length > 0 || relatedAppendices.length > 0
            ? 'Xác nhận xóa toàn bộ'
            : 'Xác nhận xóa'
        }
        message={
          relatedInspections.length > 0 || relatedAppendices.length > 0 ? (
            <div className="space-y-3 text-xs md:text-sm">
              <p className="text-slate-200">
                Bạn có chắc chắn muốn xóa gói thầu/nội dung: <strong className="text-white">"{deletingItem?.content}"</strong>?
              </p>
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/70 text-rose-300 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-rose-200">
                  ⚠️ CẢNH BÁO RÀNG BUỘC TOÀN VẸN:
                </div>
                {relatedAppendices.length > 0 && (
                  <div>
                    • Gói thầu này có <strong className="text-blue-300 font-semibold">{relatedAppendices.length} phụ lục hợp đồng (PLHĐ)</strong> liên kết. Khi xóa, toàn bộ các phụ lục này sẽ được tự động xóa theo.
                  </div>
                )}
                {relatedInspections.length > 0 && (
                  <div>
                    • Gói thầu này hiện đang liên kết với{' '}
                    <strong className="text-white underline font-semibold">
                      {relatedInspections.length} đợt nghiệm thu/thanh toán
                    </strong>{' '}
                    bên tab <span className="font-bold text-rose-200">4. Nghiệm thu</span>. Toàn bộ các đợt nghiệm thu này sẽ được xóa để đảm bảo không bị sai lệch số liệu!
                  </div>
                )}
              </div>
            </div>
          ) : (
            `Bạn có chắc muốn xóa gói thầu/nội dung "${deletingItem?.content}"?`
          )
        }
      />

      {/* Modal Quản Lý Phụ Lục Hợp Đồng (Cấp 2) */}
      {appendixModalPackage && (
        <ContractAppendixModal
          isOpen={!!appendixModalPackage}
          onClose={() => setAppendixModalPackage(null)}
          projectId={projectId}
          costPackage={appendixModalPackage}
        />
      )}
    </div>
  );
};

