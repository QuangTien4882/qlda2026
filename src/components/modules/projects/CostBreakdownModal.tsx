import React, { useState, useEffect, useMemo } from 'react';
import { CostBreakdownItem, SevenCostCategory } from '../../../types/project';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
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

  // Nạp dữ liệu khi mở modal
  useEffect(() => {
    if (isOpen) {
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

  // Tính tổng các khoản con
  const totalBreakdownAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [items]);

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
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // Đánh số lại STT liên tục
      return filtered.map((item, idx) => ({ ...item, stt: idx + 1 }));
    });
  };

  // Lưu chi tiết và cập nhật tổng tiền ra bảng chính
  const handleSaveAndApply = () => {
    const validItems = items.filter((i) => i.name.trim() || i.amount > 0);
    const newTotal = saveCostBreakdowns(projectId, parentId, costCategory, validItems);
    onApplyTotal(newTotal);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-sm">
          <Layers size={18} className="text-blue-400" />
          <span>Chi tiết cấu thành: </span>
          <span className="text-blue-300 font-semibold uppercase">{costCategoryName}</span>
        </div>
      }
      level={2}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-400">
            Tổng cộng chi tiết: <strong className="text-emerald-400 font-mono text-sm">{formatVnNumber(totalBreakdownAmount)} đ</strong>
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </AppButton>
            <AppButton variant="primary" size="sm" onClick={handleSaveAndApply}>
              <Check size={14} className="mr-1" />
              Cập nhật tổng vào chi phí
            </AppButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Banner thông tin ngữ cảnh */}
        <div className="p-3.5 rounded-xl bg-[#091224] border border-[#1e2f52] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="text-slate-300">
              <span className="text-slate-400">Đối tượng:</span> <strong className="text-slate-100">{parentTitle}</strong>
            </div>
            <div className="text-slate-300">
              <span className="text-slate-400">Loại chi phí:</span> <strong className="text-blue-300">{costCategoryName}</strong>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <div className="text-slate-400 text-[11px] font-sans">Giá trị hiện tại ở bảng</div>
              <div className="text-slate-200 font-semibold">{formatVnNumber(currentCostAmount)} đ</div>
            </div>
            <ArrowRight size={16} className="text-slate-500" />
            <div className="text-right">
              <div className="text-slate-400 text-[11px] font-sans">Tổng các khoản chi tiết</div>
              <div className="text-emerald-400 font-bold text-sm">{formatVnNumber(totalBreakdownAmount)} đ</div>
            </div>
          </div>
        </div>

        {/* Chênh lệch nếu có */}
        {diffAmount !== 0 && currentCostAmount > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
            <Info size={14} className="shrink-0 text-blue-400" />
            <span>
              Tổng chi tiết cấu thành {diffAmount > 0 ? 'lớn hơn' : 'nhỏ hơn'} giá trị hiện tại là{' '}
              <strong className="font-mono text-white">{formatVnNumber(Math.abs(diffAmount))} đ</strong>. Bấm nút "Cập nhật tổng vào chi phí" để đồng bộ.
            </span>
          </div>
        )}

        {/* Bảng danh sách các khoản mục con chi tiết */}
        <div className="border border-slate-700/80 rounded-lg overflow-hidden bg-[#070d1a]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#111c33] text-slate-200 uppercase font-semibold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3 text-center w-14">STT</th>
                <th className="py-2.5 px-3 min-w-[280px]">Nội dung khoản mục chi tiết cấu thành</th>
                <th className="py-2.5 px-3 text-right w-48">Giá trị (đồng)</th>
                <th className="py-2.5 px-3 w-48">Căn cứ / Ghi chú</th>
                <th className="py-2.5 px-3 text-center w-14">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Chưa có khoản mục chi tiết nào. Bấm nút "Thêm khoản mục" bên dưới để nhập.
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
                        className="w-full bg-[#050914] border border-[#233152] focus:border-blue-500 rounded px-2.5 py-1.5 text-slate-100 text-xs"
                      />
                    </td>

                    {/* Số tiền */}
                    <td className="py-1.5 px-2">
                      <VnNumberInput
                        value={item.amount}
                        onChange={(val) => handleUpdateItem(index, 'amount', val)}
                        className="w-full text-right font-mono font-semibold !py-1 text-emerald-400 bg-[#050914] border border-[#233152] rounded"
                      />
                    </td>

                    {/* Ghi chú */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={(e) => handleUpdateItem(index, 'note', e.target.value)}
                        placeholder="Căn cứ định mức..."
                        className="w-full bg-[#050914] border border-[#233152] focus:border-blue-500 rounded px-2.5 py-1.5 text-slate-300 text-xs"
                      />
                    </td>

                    {/* Nút Xóa dòng */}
                    <td className="py-1.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                        title="Xóa khoản mục này"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-[#0b1426] border-t-2 border-slate-700 font-semibold">
                <tr>
                  <td colSpan={2} className="py-2.5 px-3 text-right uppercase text-slate-300 tracking-wide text-xs">
                    Tổng cộng {costCategoryName}:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold text-sm">
                    {formatVnNumber(totalBreakdownAmount)}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-400 text-[11px] font-normal">
                    (đồng)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Nút thêm dòng */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAddItem}
            className="px-3 py-1.5 rounded-lg bg-[#142340] hover:bg-[#1b2f56] text-blue-300 border border-blue-500/40 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Thêm khoản mục chi tiết</span>
          </button>

          <div className="text-[11px] text-slate-400">
            Số khoản mục: <strong className="text-slate-200">{items.length}</strong>
          </div>
        </div>
      </div>
    </AppModal>
  );
};

