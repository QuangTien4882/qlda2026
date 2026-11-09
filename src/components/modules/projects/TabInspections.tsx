import React, { useState, useMemo } from 'react';
import { InspectionItem } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { VnDateInput } from '../../common/VnDateInput';
import { SearchableSelect, SearchableOption } from '../../common/SearchableSelect';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useData } from '../../../context/DataContext';
import { AlertTriangle, CheckCircle2, ShieldAlert, History } from 'lucide-react';

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
  const { 
    costPackages, 
    getEffectiveContractValue, 
    getContractAppendicesByPackage 
  } = useData();
  const projectPackages = costPackages[projectId] || [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InspectionItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InspectionItem | null>(null);

  // Form states
  const [stt, setStt] = useState(inspections.length + 1);
  const [packageName, setPackageName] = useState('');
  const [costPackageId, setCostPackageId] = useState<string>('');
  const [contractValue, setContractValue] = useState<number>(0);
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

  // Danh mục gói thầu từ Tab 3: Chi phí để chọn nhanh (Hiển thị giá trị HĐ sau phụ lục nếu có)
  const costPackageOptions: SearchableOption[] = projectPackages.map((pkg) => {
    const effectiveVal = getEffectiveContractValue(projectId, pkg.id);
    const appendices = getContractAppendicesByPackage(projectId, pkg.id);
    const hasAppendices = appendices.length > 0;

    return {
      value: pkg.content,
      label: pkg.content,
      subLabel: `HĐ gốc: ${formatVnNumber(pkg.contractValue)} đ${
        hasAppendices ? ` • Sau ${appendices.length} PLHĐ: ${formatVnNumber(effectiveVal)} đ` : ''
      } • Nhà thầu: ${pkg.contractor || 'Chưa chọn'}`,
      badge: pkg.contractNumber ? `Số HĐ: ${pkg.contractNumber}` : pkg.category,
      badgeColor: 'blue',
      extraData: pkg,
    };
  });

  // Gói thầu đang được gắn với đợt nghiệm thu này
  const targetPackage = projectPackages.find(
    (p) => (costPackageId && p.id === costPackageId) || p.content.trim().toLowerCase() === packageName.trim().toLowerCase()
  );

  // Danh sách phụ lục hợp đồng của gói thầu này (nếu có)
  const targetAppendices = targetPackage
    ? getContractAppendicesByPackage(projectId, targetPackage.id)
    : [];
  const appendixAdjustmentTotal = targetAppendices.reduce(
    (sum, a) => sum + (Number(a.adjustmentAmount) || 0),
    0
  );

  // Giá trị hợp đồng hiệu lực sau phụ lục (hoặc giá trị hợp đồng gốc nếu chưa có PL)
  const originalContractVal = targetPackage?.contractValue || contractValue || 0;
  const activeContractValue = targetPackage
    ? getEffectiveContractValue(projectId, targetPackage.id)
    : (contractValue || 0);

  // Lấy các đợt nghiệm thu khác của cùng gói thầu này (để tính cộng dồn và hiển thị danh sách đợt trước)
  const otherInspections = useMemo(() => {
    if (!packageName.trim() && !costPackageId) return [];
    return inspections.filter((i) => {
      if (editingItem && i.id === editingItem.id) return false;
      if (costPackageId && i.costPackageId === costPackageId) return true;
      if (targetPackage && i.costPackageId === targetPackage.id) return true;
      return i.packageName.trim().toLowerCase() === packageName.trim().toLowerCase();
    }).sort((a, b) => (Number(a.stt) || 0) - (Number(b.stt) || 0));
  }, [inspections, editingItem, costPackageId, targetPackage, packageName]);

  const prevInspectionSum = otherInspections.reduce((sum, i) => sum + (Number(i.inspectionValue) || 0), 0);
  const prevPaymentSum = otherInspections.reduce((sum, i) => sum + (Number(i.paymentValue) || 0), 0);

  const totalProjectedInspection = prevInspectionSum + (Number(inspectionValue) || 0);
  const totalProjectedPayment = prevPaymentSum + (Number(paymentValue) || 0);

  const remainingInspectionQuota = Math.max(0, activeContractValue - prevInspectionSum);
  const isOverContract = activeContractValue > 0 && totalProjectedInspection > activeContractValue;
  const isOverContractPayment = activeContractValue > 0 && totalProjectedPayment > activeContractValue;
  const excessInspectionAmount = totalProjectedInspection - activeContractValue;
  const excessPaymentAmount = totalProjectedPayment - activeContractValue;

  const handleOpenAdd = () => {
    const nextStt =
      inspections.length > 0 ? Math.max(...inspections.map((i) => Number(i.stt) || 0)) + 1 : 1;
    setEditingItem(null);
    setStt(nextStt);
    setPackageName('');
    setCostPackageId('');
    setContractValue(0);
    setInspectionRound('');
    setInspectionDate('');
    setInspectionValue(0);
    setPaymentValue(0);
    setNote('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: InspectionItem) => {
    setEditingItem(item);
    setStt(item.stt);
    setPackageName(item.packageName);
    const matched = projectPackages.find(
      (p) => p.id === item.costPackageId || p.content.trim().toLowerCase() === item.packageName.trim().toLowerCase()
    );
    setCostPackageId(item.costPackageId || matched?.id || '');
    setContractValue(item.contractValue || matched?.contractValue || 0);
    setInspectionRound(item.inspectionRound);
    setInspectionDate(item.inspectionDate);
    setInspectionValue(item.inspectionValue);
    setPaymentValue(item.paymentValue);
    setNote(item.note || '');
    setModalOpen(true);
  };

  const handleSelectPackage = (value: string, selectedOption?: SearchableOption) => {
    setPackageName(value);
    if (selectedOption?.extraData) {
      const pkg = selectedOption.extraData;
      setCostPackageId(pkg.id);
      setContractValue(pkg.contractValue || 0);
    } else {
      const matched = projectPackages.find(
        (p) => p.content.trim().toLowerCase() === value.trim().toLowerCase()
      );
      if (matched) {
        setCostPackageId(matched.id);
        setContractValue(matched.contractValue || 0);
      } else {
        setCostPackageId('');
        setContractValue(0);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageName.trim()) return;

    const record: InspectionItem = {
      id: editingItem ? editingItem.id : `insp-${Date.now()}`,
      projectId,
      stt,
      packageName: packageName.trim(),
      costPackageId: costPackageId || targetPackage?.id,
      contractValue: activeContractValue,
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

  // Cấu hình các cột theo yêu cầu
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
      width: 340,
      minWidth: 25,
      pinned: true,
      render: (item) => {
        const matched = projectPackages.find(
          (p) => p.id === item.costPackageId || p.content.trim().toLowerCase() === item.packageName.trim().toLowerCase()
        );
        const pkgVal = matched?.contractValue || item.contractValue || 0;

        // Tổng các đợt nghiệm thu của gói thầu này trong danh sách
        const allPkgInspections = inspections.filter(
          (i) => (matched && i.costPackageId === matched.id) || i.packageName.trim().toLowerCase() === item.packageName.trim().toLowerCase()
        );
        const totalInspectionForPkg = allPkgInspections.reduce((s, i) => s + (Number(i.inspectionValue) || 0), 0);
        const isPackageOver = pkgVal > 0 && totalInspectionForPkg > pkgVal;

        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-100">{item.packageName}</span>
            {pkgVal > 0 && (
              <div className="flex items-center gap-1.5 text-[11px]">
                {isPackageOver ? (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-medium bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/60 animate-pulse">
                    ⚠️ Vượt HĐ (+{formatVnNumber(totalInspectionForPkg - pkgVal)} đ)
                  </span>
                ) : (
                  <span className="text-emerald-400/90 font-mono text-[11px]">
                    HĐ: {formatVnNumber(pkgVal)} đ ({((totalInspectionForPkg / pkgVal) * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            )}
          </div>
        );
      },
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
        tableId="tab_inspections"
        columns={columns}
        data={inspections}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có đợt nghiệm thu / thanh toán nào. Bấm 'Thêm mới' ở góc trên để tạo đợt nghiệm thu."
      />

      {/* Modal Thêm / Sửa - Cấp 2 */}
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
                onFocus={(e) => e.target.select()}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-slate-300 mb-1">
                Tên gói thầu <span className="text-rose-400">*</span>
                <span className="text-slate-400 font-normal text-[11px] ml-2">
                  (Liên kết từ tab 3. Nội dung chi phí)
                </span>
              </label>
              <SearchableSelect
                options={costPackageOptions}
                value={packageName}
                onChange={handleSelectPackage}
                placeholder="Click để chọn hoặc gõ tìm kiếm nội dung chi phí"
                allowCustomInput={true}
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
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
            <div>
              <VnDateInput
                label="Ngày NT"
                value={inspectionDate}
                onChange={(formatted) => setInspectionDate(formatted)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <VnNumberInput
              label="Giá trị NT đợt này (đồng)"
              value={inspectionValue}
              onChange={(val) => setInspectionValue(val)}
              suffix="đồng"
            />
            <VnNumberInput
              label="Giá trị TT đợt này (đồng)"
              value={paymentValue}
              onChange={(val) => setPaymentValue(val)}
              suffix="đồng"
            />
          </div>

          {/* Bảng Danh sách các đợt đã nghiệm thu của nội dung chi phí này */}
          {packageName.trim() && (
            <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400 uppercase flex items-center gap-1.5">
                  <History size={14} className="text-blue-400" />
                  Các đợt đã nghiệm thu của gói thầu này ({otherInspections.length} đợt)
                </span>
                <span className="text-[11px] text-slate-400">
                  {otherInspections.length > 0 ? (
                    <span>Tổng đã NT trước đó: <strong className="font-mono text-emerald-400 font-bold">{formatVnNumber(prevInspectionSum)} đ</strong></span>
                  ) : (
                    <span className="italic">Chưa có đợt nghiệm thu nào trước đó</span>
                  )}
                </span>
              </div>

              {otherInspections.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-[#1b2744]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#0e172a] text-slate-400 font-semibold border-b border-[#1b2744]">
                      <tr>
                        <th className="py-1.5 px-2.5 text-center w-10">STT</th>
                        <th className="py-1.5 px-2.5">Đợt NT</th>
                        <th className="py-1.5 px-2.5 text-center">Ngày NT</th>
                        <th className="py-1.5 px-2.5 text-right font-mono">Giá trị NT (đồng)</th>
                        <th className="py-1.5 px-2.5 text-right font-mono">Giá trị TT (đồng)</th>
                        <th className="py-1.5 px-2.5 text-center">Tỷ lệ TT/NT</th>
                        <th className="py-1.5 px-2.5">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#18233c] bg-[#080d1a]">
                      {otherInspections.map((item, idx) => {
                        const rowRatio = item.inspectionValue > 0
                          ? ((item.paymentValue / item.inspectionValue) * 100).toFixed(1)
                          : '0.0';
                        return (
                          <tr key={item.id} className="hover:bg-[#0f1b33] transition-colors">
                            <td className="py-1.5 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-medium text-slate-200">
                              <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/50 font-semibold text-[11px]">
                                {item.inspectionRound}
                              </span>
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-mono text-slate-300">{item.inspectionDate}</td>
                            <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-400">
                              {formatVnNumber(item.inspectionValue)} đ
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-mono text-blue-300">
                              {formatVnNumber(item.paymentValue)} đ
                            </td>
                            <td className="py-1.5 px-2.5 text-center font-mono text-purple-300">
                              {rowRatio}%
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-400 italic truncate max-w-[140px]">
                              {item.note || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-[#0b1426] border-t border-[#1e2e4e] font-semibold text-slate-200">
                      <tr>
                        <td colSpan={3} className="py-1.5 px-2.5 text-right text-slate-400">
                          Tổng cộng đã NT trước đó:
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatVnNumber(prevInspectionSum)} đ
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono font-bold text-blue-300">
                          {formatVnNumber(prevPaymentSum)} đ
                        </td>
                        <td colSpan={2} className="py-1.5 px-2.5 text-center text-slate-400 font-normal italic">
                          ({otherInspections.length} đợt)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="p-2.5 text-center rounded-lg bg-[#080d1a] border border-[#1b2744] text-slate-400 text-xs italic">
                  Chưa có đợt nghiệm thu nào trước đó cho gói thầu này (Đợt này sẽ là đợt nghiệm thu đầu tiên).
                </div>
              )}
            </div>
          )}

          {/* Hộp kiểm soát hợp đồng và cảnh báo vượt giá trị hợp đồng realtime */}
          {activeContractValue > 0 && (
            <div
              className={`p-3 rounded-xl border transition-all ${
                isOverContract
                  ? 'bg-rose-950/40 border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'bg-[#0b1222] border-[#232f4e]'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  {isOverContract ? (
                    <ShieldAlert size={15} className="text-rose-400 animate-pulse" />
                  ) : (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  )}
                  {targetAppendices.length > 0 ? 'Giá trị HĐ hiệu lực (sau PL):' : 'Kiểm soát Giá trị Hợp đồng:'}
                </span>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatVnNumber(activeContractValue)} đ
                  </span>
                  {targetAppendices.length > 0 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      (Gốc: {formatVnNumber(originalContractVal)} đ {appendixAdjustmentTotal >= 0 ? '+' : ''}{formatVnNumber(appendixAdjustmentTotal)} đ qua {targetAppendices.length} PLHĐ)
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-[#070d1a] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Đã NT các đợt trước:</div>
                  <div className="font-mono text-slate-200 font-medium">
                    {formatVnNumber(prevInspectionSum)} đ
                  </div>
                </div>
                <div className="p-2 rounded bg-[#070d1a] border border-slate-800">
                  <div className="text-[11px] text-slate-400">Hạn mức NT còn lại:</div>
                  <div className="font-mono text-emerald-400 font-semibold">
                    {formatVnNumber(remainingInspectionQuota)} đ
                  </div>
                </div>
                <div className="p-2 rounded bg-[#070d1a] border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-slate-400">Tổng NT gồm đợt này:</div>
                  <div
                    className={`font-mono font-bold ${
                      isOverContract ? 'text-rose-400' : 'text-slate-100'
                    }`}
                  >
                    {formatVnNumber(totalProjectedInspection)} đ
                  </div>
                </div>
              </div>

              {isOverContract && (
                <div className="mt-2.5 p-2 rounded bg-rose-950/60 border border-rose-600/70 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <strong className="text-rose-200">CẢNH BÁO VƯỢT GIÁ TRỊ HỢP ĐỒNG:</strong> Tổng giá
                    trị nghiệm thu ({formatVnNumber(totalProjectedInspection)} đ) đã VƯỢT giá trị hợp
                    đồng {targetAppendices.length > 0 ? 'sau phụ lục' : ''} ({formatVnNumber(activeContractValue)} đ) là{' '}
                    <strong className="underline text-rose-100 font-mono">
                      {formatVnNumber(excessInspectionAmount)} đ
                    </strong>{' '}
                    (+{((excessInspectionAmount / activeContractValue) * 100).toFixed(1)}%). Vui lòng
                    kiểm tra lại số liệu!
                  </div>
                </div>
              )}

              {isOverContractPayment && !isOverContract && (
                <div className="mt-2.5 p-2 rounded bg-amber-950/60 border border-amber-600/70 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-200">Lưu ý:</strong> Tổng giá trị thanh toán (
                    {formatVnNumber(totalProjectedPayment)} đ) đã vượt giá trị hợp đồng là{' '}
                    <strong className="font-mono text-amber-100">
                      {formatVnNumber(excessPaymentAmount)} đ
                    </strong>
                    .
                  </div>
                </div>
              )}
            </div>
          )}

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
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 resize-none placeholder:italic placeholder:text-slate-500"
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

