import React, { useState, useMemo, useRef } from 'react';
import { 
  CostPackageItem, 
  ContractAppendixItem, 
  AppendixAdjustmentType 
} from '../../../types/project';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { VnDateInput } from '../../common/VnDateInput';
import { formatVnNumber } from '../../../utils/numberUtils';
import { formatCustomVnDate, calculateContractDeadline } from '../../../utils/dateUtils';
import { useData } from '../../../context/DataContext';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  FileSpreadsheet,
  Download, 
  Paperclip, 
  ArrowRight,
  Calculator,
  Calendar,
  X,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';

interface ContractAppendixModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  costPackage: CostPackageItem | null;
}

export const ContractAppendixModal: React.FC<ContractAppendixModalProps> = ({
  isOpen,
  onClose,
  projectId,
  costPackage,
}) => {
  const { 
    getContractAppendicesByPackage, 
    saveContractAppendix, 
    deleteContractAppendix 
  } = useData();

  // Danh sách các phụ lục của gói thầu hiện tại
  const appendices = useMemo(() => {
    if (!costPackage) return [];
    return getContractAppendicesByPackage(projectId, costPackage.id);
  }, [projectId, costPackage, getContractAppendicesByPackage]);

  // Tổng hợp số tiền điều chỉnh từ tất cả phụ lục
  const totalAdjustmentAmount = useMemo(() => {
    return appendices.reduce((sum, item) => sum + (Number(item.adjustmentAmount) || 0), 0);
  }, [appendices]);

  // Tổng hợp số ngày gia hạn/rút ngắn
  const totalAdjustmentDays = useMemo(() => {
    return appendices.reduce((sum, item) => sum + (Number(item.adjustmentDays) || 0), 0);
  }, [appendices]);

  // Giá trị hợp đồng gốc và giá trị sau phụ lục
  const originalContractValue = Number(costPackage?.contractValue) || 0;
  const effectiveContractValue = originalContractValue + totalAdjustmentAmount;

  // Tính toán hạn chót hợp đồng hiện tại (gồm cả ngày gia hạn từ các PLHĐ)
  const deadlineInfo = useMemo(() => {
    if (!costPackage) return null;
    return calculateContractDeadline(
      costPackage.contractDate,
      costPackage.executionTime,
      totalAdjustmentDays,
      costPackage.status === 'Hoàn thành',
      costPackage.costType === 'Phí'
    );
  }, [costPackage, totalAdjustmentDays]);

  // State cho Form Thêm mới / Chỉnh sửa phụ lục
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContractAppendixItem | null>(null);

  // Form Fields
  const [appendixNumber, setAppendixNumber] = useState('');
  const [signedDate, setSignedDate] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AppendixAdjustmentType>('Giá trị');
  const [adjustmentSign, setAdjustmentSign] = useState<'+' | '-'>('+');
  const [adjustmentAmountAbs, setAdjustmentAmountAbs] = useState<number>(0);
  const [adjustmentDays, setAdjustmentDays] = useState<number>(0);
  const [newExecutionTime, setNewExecutionTime] = useState('');
  const [content, setContent] = useState('');
  const [legalBasis, setLegalBasis] = useState('');
  const [note, setNote] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState('');
  const [formError, setFormError] = useState('');

  // State xác nhận xóa
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!costPackage) return null;

  // Mở Form Thêm mới
  const handleOpenAdd = () => {
    const nextStt = appendices.length > 0 ? Math.max(...appendices.map((a) => a.stt || 0)) + 1 : 1;
    const defaultNum = `PL${String(nextStt).padStart(2, '0')}/${costPackage.contractNumber || 'HĐ'}`;
    
    setEditingItem(null);
    setAppendixNumber(defaultNum);
    setSignedDate('');
    setAdjustmentType('' as any);
    setAdjustmentSign('+');
    setAdjustmentAmountAbs(0);
    setAdjustmentDays(0);
    setNewExecutionTime('');
    setContent('');
    setLegalBasis('');
    setNote('');
    setAttachedFileName('');
    setAttachedFileUrl('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Mở Form Chỉnh sửa
  const handleOpenEdit = (item: ContractAppendixItem) => {
    setEditingItem(item);
    setAppendixNumber(item.appendixNumber);
    setSignedDate(item.signedDate);
    setAdjustmentType(item.adjustmentType);
    if (item.adjustmentAmount < 0) {
      setAdjustmentSign('-');
      setAdjustmentAmountAbs(Math.abs(item.adjustmentAmount));
    } else {
      setAdjustmentSign('+');
      setAdjustmentAmountAbs(item.adjustmentAmount);
    }
    setAdjustmentDays(item.adjustmentDays || 0);
    setNewExecutionTime(item.newExecutionTime || '');
    setContent(item.content);
    setLegalBasis(item.legalBasis || '');
    setNote(item.note || '');
    setAttachedFileName(item.attachedFileName || '');
    setAttachedFileUrl(item.attachedFileUrl || '');
    setFormError('');
    setIsFormOpen(true);
  };

  // Xử lý chọn tệp đính kèm (Lưu dạng Data URL Base64 để bền vững sau khi F5)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedFileUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Lưu phụ lục hợp đồng
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appendixNumber.trim()) {
      setFormError('Vui lòng nhập Số phụ lục hợp đồng (VD: 01/PLHĐ).');
      return;
    }
    if (!content.trim()) {
      setFormError('Vui lòng nhập Nội dung điều chỉnh.');
      return;
    }

    const finalAmount = adjustmentSign === '-' ? -Math.abs(adjustmentAmountAbs) : Math.abs(adjustmentAmountAbs);

    const appendixItem: ContractAppendixItem = {
      id: editingItem ? editingItem.id : `plhd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      projectId,
      costPackageId: costPackage.id,
      stt: editingItem ? editingItem.stt : appendices.length + 1,
      appendixNumber: appendixNumber.trim(),
      signedDate: signedDate.trim(),
      adjustmentType: adjustmentType || 'Giá trị',
      adjustmentAmount: finalAmount,
      adjustmentDays: Number(adjustmentDays) || 0,
      newExecutionTime: newExecutionTime.trim() || undefined,
      content: content.trim(),
      legalBasis: legalBasis.trim() || undefined,
      attachedFileName: attachedFileName.trim() || undefined,
      attachedFileUrl: attachedFileUrl || undefined,
      note: note.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    saveContractAppendix(appendixItem);
    setIsFormOpen(false);
  };

  // Xóa phụ lục
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteContractAppendix(projectId, deletingId);
      setDeletingId(null);
    }
  };

  // Tải file phụ lục
  const handleDownloadFile = (item: ContractAppendixItem) => {
    const a = document.createElement('a');
    if (item.attachedFileUrl) {
      a.href = item.attachedFileUrl;
      a.download = item.attachedFileName || `PLHD-${item.appendixNumber}.pdf`;
    } else {
      const blob = new Blob(
        [
          `PHỤ LỤC HỢP ĐỒNG SỐ: ${item.appendixNumber}\n` +
          `Gói thầu: ${costPackage.content}\n` +
          `Ngày ký: ${item.signedDate}\n` +
          `Loại điều chỉnh: ${item.adjustmentType}\n` +
          `Giá trị điều chỉnh: ${formatVnNumber(item.adjustmentAmount)} đồng\n` +
          `Thời gian gia hạn: ${item.adjustmentDays} ngày\n` +
          `Nội dung: ${item.content}\n` +
          `Căn cứ pháp lý: ${item.legalBasis || '—'}\n`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      a.href = URL.createObjectURL(blob);
      a.download = `PLHD_${item.appendixNumber.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-base md:text-lg">
            <Layers size={20} className="text-blue-400" />
            <span>Quản Lý Phụ Lục Hợp Đồng (PLHĐ): </span>
            <span className="text-blue-300 font-bold uppercase truncate max-w-md">
              {costPackage.content}
            </span>
          </div>
        }
        subtitle={`Số HĐ gốc: ${costPackage.contractNumber || '—'} • Đơn vị thực hiện: ${costPackage.contractor || 'Chưa chọn nhà thầu'}`}
        level={2}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-mono">
              Tổng số phụ lục: <strong className="text-blue-300">{appendices.length} PLHĐ</strong>
            </span>
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              Đóng cửa sổ
            </AppButton>
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-3.5">
          {/* BANNER THÔNG TIN HỢP ĐỒNG & GIÁ TRỊ SAU PHỤ LỤC */}
          <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1e2f52] shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Thẻ 1: Hợp đồng gốc */}
              <div className="p-3 rounded-lg bg-[#060c18] border border-[#1a2846] space-y-1">
                <span className="text-slate-400 text-xs block">1. Hợp đồng gốc đã ký:</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Số HĐ: <strong className="text-blue-300 font-mono">{costPackage.contractNumber || '—'}</strong></span>
                  <span className="text-slate-400">{costPackage.contractDate || '—'}</span>
                </div>
                <div className="text-sm font-semibold text-slate-100 font-mono pt-0.5">
                  {formatVnNumber(originalContractValue)} đ
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  TG thực hiện: {costPackage.executionTime || '—'}
                </div>
              </div>

              {/* Thẻ 2: Tổng biến động qua các phụ lục */}
              <div className="p-3 rounded-lg bg-[#060c18] border border-[#1a2846] space-y-1">
                <span className="text-slate-400 text-xs block">2. Tổng điều chỉnh qua {appendices.length} PLHĐ:</span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Biến động giá trị:</span>
                  <span className={`font-mono font-bold ${totalAdjustmentAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {totalAdjustmentAmount > 0 ? '+' : ''}{formatVnNumber(totalAdjustmentAmount)} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-300">Gia hạn tiến độ:</span>
                  <span className={`font-mono font-semibold ${totalAdjustmentDays >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {totalAdjustmentDays > 0 ? '+' : ''}{totalAdjustmentDays} ngày
                  </span>
                </div>
                {deadlineInfo && deadlineInfo.status !== 'unknown' && deadlineInfo.status !== 'not_applicable' && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1a2846] mt-1">
                    <span className="text-slate-400">Hạn chót:</span>
                    <span className={`font-mono text-[11px] font-bold ${
                      deadlineInfo.status === 'overdue' ? 'text-rose-400' :
                      deadlineInfo.status === 'urgent' ? 'text-amber-300' :
                      deadlineInfo.status === 'warning' ? 'text-yellow-300' : 'text-emerald-400'
                    }`}>
                      {deadlineInfo.deadlineStr} ({deadlineInfo.statusText})
                    </span>
                  </div>
                )}
              </div>

              {/* Thẻ 3: Giá trị hợp đồng sau phụ lục (Hiệu lực nghiệm thu) */}
              <div className="p-3 rounded-lg bg-[#091b33] border-2 border-emerald-500/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    3. Giá trị HĐ sau phụ lục:
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
                    HIỆU LỰC
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                  {formatVnNumber(effectiveContractValue)} đ
                </div>
                <div className="text-[11px] text-slate-300">
                  * Hạn mức nghiệm thu tại tab Nghiệm thu sẽ kiểm soát theo con số này.
                </div>
              </div>
            </div>
          </div>

          {/* THANH CÔNG CỤ: Nút thêm phụ lục mới */}
          <div className="flex items-center justify-between gap-2 px-1 shrink-0">
            <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
              <FileSpreadsheet size={15} className="text-blue-400" />
              <span>Danh sách các Phụ lục Hợp đồng đã ký ({appendices.length})</span>
            </span>

            <AppButton
              size="sm"
              variant="primary"
              icon={<Plus size={14} />}
              onClick={handleOpenAdd}
            >
              Thêm Phụ Lục Mới
            </AppButton>
          </div>

          {/* BẢNG DANH SÁCH CÁC PHỤ LỤC HỢP ĐỒNG */}
          <div className="flex-1 min-h-[300px] border border-slate-700/80 rounded-xl overflow-auto bg-[#070d1a] relative shadow-inner">
            <table className="w-full text-left border-collapse table-data-grid">
              <thead className="bg-[#111c33] text-slate-200 uppercase font-semibold text-xs border-b border-slate-700 sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-3 text-center w-14">STT</th>
                  <th className="py-2.5 px-3 w-36">Số PLHĐ</th>
                  <th className="py-2.5 px-3 text-center w-28">Ngày ký</th>
                  <th className="py-2.5 px-3 text-center w-36">Loại điều chỉnh</th>
                  <th className="py-2.5 px-3 text-right w-44">Giá trị điều chỉnh (đồng)</th>
                  <th className="py-2.5 px-3 text-center w-28">Tiến độ (+/- ngày)</th>
                  <th className="py-2.5 px-3 min-w-[220px]">Nội dung điều chỉnh</th>
                  <th className="py-2.5 px-3 w-40">Căn cứ pháp lý</th>
                  <th className="py-2.5 px-3 text-center w-28">File đính kèm</th>
                  <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
                {appendices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText size={28} className="text-slate-500 opacity-60" />
                        <span>Chưa có phụ lục hợp đồng nào cho gói thầu này.</span>
                        <span className="text-[11px] text-slate-500">
                          Bấm nút <strong>"Thêm Phụ Lục Mới"</strong> ở góc trên để tạo phụ lục bổ sung giá trị hoặc gia hạn tiến độ.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  appendices.map((item) => (
                    <tr key={item.id} className="hover:bg-[#0d172e] transition-colors">
                      {/* STT */}
                      <td className="py-2 px-3 text-center font-mono text-slate-400 font-semibold">
                        {item.stt}
                      </td>

                      {/* Số PLHĐ */}
                      <td className="py-2 px-3 font-mono font-bold text-blue-300">
                        {item.appendixNumber}
                      </td>

                      {/* Ngày ký */}
                      <td className="py-2 px-3 text-center font-mono text-emerald-400">
                        {item.signedDate}
                      </td>

                      {/* Loại điều chỉnh */}
                      <td className="py-2 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-blue-900/40 text-blue-300 border border-blue-700/50 font-medium">
                          {item.adjustmentType}
                        </span>
                      </td>

                      {/* Giá trị điều chỉnh */}
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {item.adjustmentAmount !== 0 ? (
                          <span className={item.adjustmentAmount > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {item.adjustmentAmount > 0 ? '+' : ''}{formatVnNumber(item.adjustmentAmount)} đ
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 đ</span>
                        )}
                      </td>

                      {/* Tiến độ điều chỉnh */}
                      <td className="py-2 px-3 text-center font-mono font-semibold">
                        {item.adjustmentDays !== 0 ? (
                          <span className={item.adjustmentDays > 0 ? 'text-blue-300' : 'text-amber-400'}>
                            {item.adjustmentDays > 0 ? '+' : ''}{item.adjustmentDays} ngày
                          </span>
                        ) : (
                          <span className="text-slate-500 font-normal">—</span>
                        )}
                      </td>

                      {/* Nội dung điều chỉnh */}
                      <td className="py-2 px-3 leading-relaxed">
                        <div className="font-medium text-slate-200">{item.content}</div>
                        {item.note && (
                          <div className="text-[11px] text-slate-400 mt-0.5 italic">{item.note}</div>
                        )}
                      </td>

                      {/* Căn cứ pháp lý */}
                      <td className="py-2 px-3 text-slate-400 leading-snug">
                        {item.legalBasis || '—'}
                      </td>

                      {/* File đính kèm */}
                      <td className="py-2 px-3 text-center">
                        {item.attachedFileName ? (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(item)}
                            title={`Tải file: ${item.attachedFileName}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-950/60 hover:bg-blue-900 text-blue-300 border border-blue-700/50 text-[11px] transition-colors"
                          >
                            <Download size={12} />
                            <span className="truncate max-w-[80px] font-mono">{item.attachedFileName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-600 italic text-[11px]">Không có file</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Chỉnh sửa phụ lục này"
                            className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            title="Xóa phụ lục này"
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </AppModal>

      {/* MODAL CẤP 3: FORM THÊM MỚI / CHỈNH SỬA PHỤ LỤC HỢP ĐỒNG */}
      <AppModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-blue-400" />
            <span>{editingItem ? 'Chỉnh Sửa Phụ Lục Hợp Đồng' : 'Thêm Mới Phụ Lục Hợp Đồng'}</span>
          </div>
        }
        subtitle={`Gói thầu: ${costPackage.content} • Số HĐ gốc: ${costPackage.contractNumber || '—'}`}
        level={3}
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <AppButton variant="secondary" size="sm" onClick={() => setIsFormOpen(false)}>
              Hủy bỏ
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSaveForm}>
              <Check size={14} className="mr-1" />
              {editingItem ? 'Lưu cập nhật' : 'Thêm phụ lục'}
            </AppButton>
          </div>
        }
      >
        <form onSubmit={handleSaveForm} className="space-y-4 text-xs md:text-sm">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs flex items-center gap-2">
              <X size={15} className="shrink-0 text-rose-400" />
              <span>{formError}</span>
            </div>
          )}

          {/* Dòng 1: Số PLHĐ, Ngày ký, Loại điều chỉnh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">
                Số PLHĐ <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={appendixNumber}
                onChange={(e) => setAppendixNumber(e.target.value)}
                placeholder="VD: 01/PLHĐ-12/2025"
                className="w-full bg-[#080d1a] border border-[#232f4e] focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs placeholder:italic placeholder:text-slate-500"
                required
              />
            </div>

            <div>
              <VnDateInput
                label="Ngày ký PLHĐ"
                required
                value={signedDate}
                onChange={(formatted) => setSignedDate(formatted)}
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">Loại điều chỉnh</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as AppendixAdjustmentType)}
                className={`w-full bg-[#080d1a] border border-[#232f4e] focus:border-blue-500 rounded-lg px-3 py-2 text-xs ${
                  !adjustmentType ? 'text-slate-500 italic' : 'text-slate-100'
                }`}
              >
                <option value="" disabled hidden>Click để chọn</option>
                <option value="Giá trị">Chỉ điều chỉnh Giá trị</option>
                <option value="Tiến độ">Chỉ điều chỉnh Tiến độ</option>
                <option value="Giá trị & Tiến độ">Điều chỉnh cả Giá trị & Tiến độ</option>
                <option value="Điều khoản khác">Điều khoản khác (Nhân sự, thanh toán...)</option>
              </select>
            </div>
          </div>

          {/* Dòng 2: Giá trị điều chỉnh (Tăng / Giảm) */}
          {(adjustmentType === 'Giá trị' || adjustmentType === 'Giá trị & Tiến độ') && (
            <div className="p-3.5 rounded-xl bg-[#091428] border border-blue-500/40 space-y-2">
              <span className="text-xs font-semibold text-blue-300 block">
                Điều chỉnh Giá trị hợp đồng (đồng):
              </span>
              <div className="flex items-center gap-2">
                {/* Chọn Tăng (+) hoặc Giảm (-) */}
                <div className="flex rounded-lg border border-[#232f4e] overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setAdjustmentSign('+')}
                    className={`px-3 py-1.5 font-mono font-bold text-xs transition-colors ${
                      adjustmentSign === '+' ? 'bg-emerald-600 text-white' : 'bg-[#080d1a] text-slate-400 hover:text-white'
                    }`}
                  >
                    Tăng (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentSign('-')}
                    className={`px-3 py-1.5 font-mono font-bold text-xs transition-colors ${
                      adjustmentSign === '-' ? 'bg-rose-600 text-white' : 'bg-[#080d1a] text-slate-400 hover:text-white'
                    }`}
                  >
                    Giảm trừ (-)
                  </button>
                </div>

                {/* Ô nhập số tiền */}
                <div className="flex-1">
                  <VnNumberInput
                    value={adjustmentAmountAbs}
                    onChange={(val) => setAdjustmentAmountAbs(Math.abs(val))}
                    placeholder="0"
                    suffix="đồng"
                    className="w-full"
                    inputClassName={`text-right font-mono font-bold text-sm ${adjustmentSign === '+' ? 'text-emerald-400' : 'text-rose-400'}`}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Nếu phát sinh bổ sung khối lượng: chọn <strong>Tăng (+)</strong>. Nếu cắt giảm khối lượng: chọn <strong>Giảm trừ (-)</strong>.
              </p>
            </div>
          )}

          {/* Dòng 3: Tiến độ điều chỉnh (Gia hạn ngày) */}
          {(adjustmentType === 'Tiến độ' || adjustmentType === 'Giá trị & Tiến độ') && (
            <div className="p-3.5 rounded-xl bg-[#091428] border border-blue-500/40 space-y-2">
              <span className="text-xs font-semibold text-blue-300 block">
                Điều chỉnh Tiến độ / Thời gian thực hiện:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Số ngày gia hạn (+/- ngày):</label>
                  <input
                    type="number"
                    value={adjustmentDays}
                    onChange={(e) => setAdjustmentDays(Number(e.target.value) || 0)}
                    placeholder="VD: 30 hoặc -15"
                    className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-1.5 text-slate-100 font-mono text-xs placeholder:italic placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs mb-1">Thời gian thực hiện sau điều chỉnh:</label>
                  <input
                    type="text"
                    value={newExecutionTime}
                    onChange={(e) => setNewExecutionTime(e.target.value)}
                    placeholder="VD: 210 ngày hoặc đến ngày 18/8/2026"
                    className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder:italic placeholder:text-slate-500"
                  />
                </div>
              </div>
              {costPackage && adjustmentDays !== 0 && (
                <div className="text-[11px] text-blue-300 bg-blue-950/40 border border-blue-800/40 rounded px-2.5 py-1.5 font-mono">
                  Dự kiến hạn chót mới sau khi điều chỉnh {adjustmentDays > 0 ? `+${adjustmentDays}` : adjustmentDays} ngày:{' '}
                  <strong className="text-emerald-400">
                    {calculateContractDeadline(
                      costPackage.contractDate,
                      costPackage.executionTime,
                      (editingItem ? totalAdjustmentDays - (editingItem.adjustmentDays || 0) : totalAdjustmentDays) + adjustmentDays
                    ).deadlineStr || '—'}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Dòng 4: Nội dung điều chỉnh */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium">
              Nội dung tóm tắt phụ lục <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ghi rõ nội dung bổ sung khối lượng, phạm vi công việc, lý do gia hạn..."
              className="w-full bg-[#080d1a] border border-[#232f4e] focus:border-blue-500 rounded-lg px-3 py-2 text-slate-100 text-xs leading-relaxed placeholder:italic placeholder:text-slate-500"
              required
            />
          </div>

          {/* Dòng 5: Căn cứ pháp lý & Ghi chú */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Căn cứ pháp lý</label>
              <input
                type="text"
                value={legalBasis}
                onChange={(e) => setLegalBasis(e.target.value)}
                placeholder="VD: Quyết định 123/QĐ-UBND, Biên bản thương thảo..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs placeholder:italic placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Ghi chú thêm</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú thêm nếu có..."
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 text-xs placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Dòng 6: Đính kèm file quét / PDF của Phụ lục Hợp đồng */}
          <div className="p-3 bg-[#080e1c] border border-[#232f4e] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Paperclip size={14} className="text-blue-400" />
                <span>Tệp đính kèm văn bản PLHĐ (PDF / Quét)</span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
              >
                {attachedFileName ? 'Đổi tệp khác' : 'Chọn tệp từ máy tính...'}
              </button>
            </div>

            {attachedFileName ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#0d162b] border border-[#1e2c4c] text-xs">
                <span className="font-mono text-blue-300 truncate max-w-sm">{attachedFileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFileName('');
                    setAttachedFileUrl('');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded"
                  title="Gỡ file đính kèm"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                * Có thể đính kèm file quyết định hoặc bản scan phụ lục có chữ ký hai bên để mở xem nhanh.
              </p>
            )}
          </div>
        </form>
      </AppModal>

      {/* DIALOG XÁC NHẬN XÓA PHỤ LỤC HỢP ĐỒNG */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa phụ lục hợp đồng"
        confirmLabel="Xóa phụ lục"
        cancelLabel="Hủy bỏ"
        variant="danger"
        message={
          <div className="space-y-2 text-xs md:text-sm">
            <p className="text-slate-200">
              Bạn có chắc chắn muốn xóa phụ lục hợp đồng này khỏi gói thầu <strong className="text-white">"{costPackage.content}"</strong>?
            </p>
            <p className="text-amber-400 text-xs">
              * Giá trị hợp đồng sau phụ lục và hạn mức nghiệm thu sẽ tự động được tính toán lại.
            </p>
          </div>
        }
      />
    </>
  );
};

