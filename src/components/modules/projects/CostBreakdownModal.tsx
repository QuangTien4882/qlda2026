import React, { useState, useEffect, useMemo } from 'react';
import { CostBreakdownItem, SevenCostCategory } from '../../../types/project';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { VnNumberInput } from '../../common/VnNumberInput';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useData } from '../../../context/DataContext';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Check, 
  Info, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface CostBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  parentId: string; // ID của ProjectDetail hoặc EstimateItem
  parentTitle: string; // Tên dự án hoặc Hạng mục công trình
  costCategory: SevenCostCategory;
  costCategoryName: string; // Tên tiếng Việt (VD: "Chi phí TVĐTXD")
  currentCostAmount: number; // Giá trị hiện tại ở bảng chính
  onApplyTotal: (newTotal: number) => void;
}

export const CostBreakdownModal: React.FC<CostBreakdownModalProps> = ({
  isOpen,
  onClose,
  projectId,
  parentId,
  parentTitle,
  costCategory,
  costCategoryName,
  currentCostAmount,
  onApplyTotal,
}) => {
  const { costBreakdowns, saveCostBreakdowns } = useData();

  // Danh sách các khoản mục con chi tiết của loại chi phí này
  const [items, setItems] = useState<CostBreakdownItem[]>([]);

  // Trạng thái theo dõi chỉnh sửa (dirty) để cảnh báo khi thoát
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Tùy chọn làm tròn đến hàng nghìn đồng (Mặc định tích chọn)
  const [roundToThousand, setRoundToThousand] = useState<boolean>(true);

  // Nạp dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
      setShowExitConfirm(false);
      setRoundToThousand(true);

      const allProjectBreakdowns = costBreakdowns[projectId] || [];
      const filtered = allProjectBreakdowns
        .filter((b) => b.parentId === parentId && b.costCategory === costCategory)
        .sort((a, b) => a.stt - b.stt);

      if (filtered.length > 0) {
        setItems(filtered);
      } else {
        // Khởi tạo dòng đầu tiên nếu chưa có
        setItems([
          {
            id: `cb-${Date.now()}-1`,
            projectId,
            parentId,
            costCategory,
            stt: 1,
            name: '',
            amount: currentCostAmount > 0 ? currentCostAmount : 0,
            note: '',
          },
        ]);
      }
    }
  }, [isOpen, projectId, parentId, costCategory, costBreakdowns, currentCostAmount]);

  // Tính tổng chính xác các khoản con
  const exactTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

  // Tổng sau khi áp dụng tùy chọn làm tròn đến hàng nghìn nếu bật
  const totalBreakdownAmount = useMemo(() => {
    if (roundToThousand) {
      return Math.round(exactTotal / 1000) * 1000;
    }
    return exactTotal;
  }, [exactTotal, roundToThousand]);

  const diffAmount = totalBreakdownAmount - currentCostAmount;

  const handleAddItem = () => {
    const nextStt = items.length > 0 ? Math.max(...items.map((i) => i.stt || 0)) + 1 : 1;
    setItems((prev) => [
      ...prev,
      {
        id: `cb-${Date.now()}-${nextStt}`,
        projectId,
        parentId,
        costCategory,
        stt: nextStt,
        name: '',
        amount: 0,
        note: '',
      },
    ]);
    setIsDirty(true);
  };

  const handleUpdateItem = (index: number, field: keyof CostBreakdownItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
    setIsDirty(true);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Đánh số lại STT liên tục
      return filtered.map((item, idx) => ({ ...item, stt: idx + 1 }));
    });
    setIsDirty(true);
  };

  // Yêu cầu 3: Bấm thoát hoặc ESC thì kiểm tra dirty để xác nhận
  const handleRequestClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  };

  // Lưu chi tiết và cập nhật tổng tiền ra bảng chính
  const handleSaveAndApply = () => {
    const validItems = items.filter((i) => i.name.trim() || i.amount > 0);
    saveCostBreakdowns(projectId, parentId, costCategory, validItems);
    onApplyTotal(totalBreakdownAmount);
    setIsDirty(false);
    setShowExitConfirm(false);
    onClose();
  };

  const handleDiscardAndClose = () => {
    setIsDirty(false);
    setShowExitConfirm(false);
    onClose();
  };

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={
          <div className="flex items-center gap-2 text-base md:text-lg">
            <Layers size={20} className="text-blue-400" />
            <span>Chi tiết cấu thành: </span>
            <span className="text-blue-300 font-bold uppercase">{costCategoryName}</span>
          </div>
        }
        level={2}
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-sm text-slate-300">
                Tổng cộng chi tiết:{' '}
                <strong className="text-emerald-400 font-mono text-base ml-1">
                  {formatVnNumber(totalBreakdownAmount)} đ
                </strong>
                {roundToThousand && exactTotal !== totalBreakdownAmount && (
                  <span className="text-xs text-slate-400 ml-2 font-normal italic font-mono">
                    (Gốc: {formatVnNumber(exactTotal)} đ)
                  </span>
                )}
              </div>

              {/* Yêu cầu 2: Checkbox làm tròn đến hàng nghìn */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300 hover:text-white bg-[#0b1426] px-2.5 py-1 rounded-lg border border-[#23355c]">
                <input
                  type="checkbox"
                  checked={roundToThousand}
                  onChange={(e) => {
                    setRoundToThousand(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500 bg-[#060b17] cursor-pointer"
                />
                <span>Làm tròn đến hàng nghìn đồng</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <AppButton variant="secondary" size="sm" onClick={handleRequestClose}>
                Đóng
              </AppButton>
              <AppButton variant="primary" size="sm" onClick={handleSaveAndApply}>
                <Check size={15} className="mr-1" />
                Cập nhật tổng vào chi phí
              </AppButton>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-3.5">
          {/* Banner thông tin ngữ cảnh */}
          <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1e2f52] flex flex-wrap items-center justify-between gap-3 text-sm shrink-0">
            <div className="space-y-1">
              <div className="text-slate-300">
                <span className="text-slate-400">Đối tượng:</span>{' '}
                <strong className="text-slate-100">{parentTitle}</strong>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-400">Loại chi phí:</span>{' '}
                <strong className="text-blue-300 font-semibold">{costCategoryName}</strong>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono">
              <div className="text-right">
                <div className="text-slate-400 text-xs font-sans">Giá trị hiện tại ở bảng</div>
                <div className="text-slate-200 font-semibold text-sm">
                  {formatVnNumber(currentCostAmount)} đ
                </div>
              </div>
              <ArrowRight size={18} className="text-slate-500" />
              <div className="text-right">
                <div className="text-slate-400 text-xs font-sans">Tổng các khoản chi tiết</div>
                <div className="text-emerald-400 font-bold text-base">
                  {formatVnNumber(totalBreakdownAmount)} đ
                </div>
              </div>
            </div>
          </div>

          {/* Chênh lệch nếu có */}
          {diffAmount !== 0 && currentCostAmount > 0 && (
            <div className="px-3.5 py-2 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-sm flex items-center gap-2 shrink-0">
              <Info size={16} className="shrink-0 text-blue-400" />
              <span>
                Tổng chi tiết cấu thành {diffAmount > 0 ? 'lớn hơn' : 'nhỏ hơn'} giá trị hiện tại là{' '}
                <strong className="font-mono text-white">{formatVnNumber(Math.abs(diffAmount))} đ</strong>. Bấm nút "Cập nhật tổng vào chi phí" để đồng bộ.
              </span>
            </div>
          )}

          {/* Bảng danh sách các khoản mục con chi tiết - Chiếm trọn không gian chiều cao */}
          <div className="flex-1 min-h-[300px] border border-slate-700/80 rounded-xl overflow-auto bg-[#070d1a] relative">
            <table className="w-full text-left border-collapse table-data-grid">
              <thead className="bg-[#111c33] text-slate-200 uppercase font-semibold border-b border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-center w-14">STT</th>
                  <th className="py-2.5 px-3 min-w-[300px]">Nội dung khoản mục chi tiết cấu thành</th>
                  <th className="py-2.5 px-3 text-right w-56">Giá trị (đồng)</th>
                  <th className="py-2.5 px-3 w-52">Căn cứ / Ghi chú</th>
                  <th className="py-2.5 px-3 text-center w-14">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      Chưa có khoản mục chi tiết nào. Bấm nút "Thêm khoản mục chi tiết" bên dưới để nhập.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#0d172e] transition-colors">
                      {/* STT */}
                      <td className="py-2 px-3 text-center font-mono text-slate-400 font-semibold">
                        {item.stt}
                      </td>

                      {/* Tên khoản mục chi tiết */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                          placeholder="Ví dụ: Chi phí thẩm tra thiết kế, Chi phí khảo sát địa chất..."
                          className="w-full bg-[#050914] border border-[#233152] focus:border-blue-500 rounded-lg px-3 py-1.5 text-slate-100"
                        />
                      </td>

                      {/* Số tiền - Căn phải chuẩn số */}
                      <td className="py-1.5 px-2">
                        <VnNumberInput
                          value={item.amount}
                          onChange={(val) => handleUpdateItem(index, 'amount', val)}
                          className="w-full"
                          inputClassName="w-full text-right font-mono font-semibold text-emerald-400 bg-[#050914] border border-[#233152] rounded-lg !py-1"
                        />
                      </td>

                      {/* Ghi chú */}
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={item.note || ''}
                          onChange={(e) => handleUpdateItem(index, 'note', e.target.value)}
                          placeholder="Căn cứ định mức..."
                          className="w-full bg-[#050914] border border-[#233152] focus:border-blue-500 rounded-lg px-3 py-1.5 text-slate-300"
                        />
                      </td>

                      {/* Nút Xóa dòng */}
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                          title="Xóa khoản mục này"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {items.length > 0 && (
                <tfoot className="bg-[#0b1426] border-t-2 border-slate-700 font-semibold sticky bottom-0 z-10">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-300 tracking-wide font-bold">
                      Tổng cộng chi tiết {costCategoryName}:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold text-base">
                      {formatVnNumber(totalBreakdownAmount)}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-slate-400 font-medium">
                      (đồng)
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Nút thêm dòng */}
          <div className="flex items-center justify-between shrink-0 pt-1">
            <button
              type="button"
              onClick={handleAddItem}
              className="px-3.5 py-2 rounded-lg bg-[#142340] hover:bg-[#1b2f56] text-blue-300 border border-blue-500/40 font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm text-sm"
            >
              <Plus size={16} />
              <span>Thêm khoản mục chi tiết</span>
            </button>

            <div className="text-xs text-slate-400">
              Số khoản mục: <strong className="text-slate-200 font-mono text-sm">{items.length}</strong>
            </div>
          </div>
        </div>
      </AppModal>

      {/* Yêu cầu 3: Xác nhận khi bấm thoát / ESC để tránh mất dữ liệu */}
      <ConfirmDialog
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={handleDiscardAndClose}
        title="Xác nhận đóng cửa sổ chi tiết"
        confirmLabel="Hủy thay đổi & Đóng"
        cancelLabel="Ở lại chỉnh sửa"
        variant="warning"
        extraAction={
          <AppButton variant="primary" size="sm" onClick={handleSaveAndApply}>
            <Check size={14} className="mr-1" />
            Lưu cập nhật và đóng
          </AppButton>
        }
        message={
          <div className="space-y-2 text-xs md:text-sm">
            <p className="text-slate-200">
              Bạn có các khoản mục chi tiết vừa nhập/sửa đổi <strong className="text-amber-300">chưa được lưu cập nhật</strong> vào chi phí.
            </p>
            <p className="text-slate-400">
              Bạn có muốn lưu các khoản chi tiết này trước khi đóng không?
            </p>
          </div>
        }
      />
    </>
  );
};

