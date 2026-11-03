import React from 'react';
import { AppModal } from './AppModal';
import { AppButton } from './AppButton';
import { Keyboard, Command, Save, Plus, Edit, Trash2, Search, ArrowRight, X } from 'lucide-react';

interface ShortcutsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  desc: string;
  icon?: React.ReactNode;
}

interface ShortcutGroup {
  groupName: string;
  items: ShortcutItem[];
}

export const ShortcutsGuideModal: React.FC<ShortcutsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keyGroups: ShortcutGroup[] = [
    {
      groupName: 'Thao tác Dữ liệu & Lưu trữ',
      items: [
        {
          keys: ['Ctrl', 'S'],
          desc: 'Lưu tức thì toàn bộ dữ liệu & Form đang mở vào CSDL Offline',
          icon: <Save size={13} className="text-emerald-400" />,
        },
        {
          keys: ['Ctrl', 'N'],
          desc: 'Mở nhanh cửa sổ Thêm mới bản ghi vào bảng đang xem',
          icon: <Plus size={13} className="text-blue-400" />,
        },
        {
          keys: ['F2'],
          desc: 'Chỉnh sửa dòng/bản ghi đang chọn trong bảng',
          icon: <Edit size={13} className="text-amber-400" />,
        },
        {
          keys: ['Delete'],
          desc: 'Xóa bản ghi đang chọn trong bảng (có hộp thoại xác nhận)',
          icon: <Trash2 size={13} className="text-rose-400" />,
        },
        {
          keys: ['Ctrl', 'F'],
          desc: 'Đưa con trỏ vào ô Tìm kiếm nhanh của bảng dữ liệu',
          icon: <Search size={13} className="text-cyan-400" />,
        },
        {
          keys: ['Esc'],
          desc: 'Đóng popup, modal hoặc hủy chỉnh sửa đang dở',
          icon: <X size={13} className="text-slate-400" />,
        },
      ],
    },
    {
      groupName: 'Chuyển đổi nhanh 6 Tab Quản lý Dự án',
      items: [
        { keys: ['Ctrl', '1'], desc: 'Tab 1: Thông tin Dự án & TMĐT' },
        { keys: ['Ctrl', '2'], desc: 'Tab 2: Dự toán Công trình' },
        { keys: ['Ctrl', '3'], desc: 'Tab 3: Nội dung Chi phí, Gói thầu & Hợp đồng' },
        { keys: ['Ctrl', '4'], desc: 'Tab 4: Nghiệm thu & Thanh toán' },
        { keys: ['Ctrl', '5'], desc: 'Tab 5: Hồ sơ Pháp lý & File đính kèm' },
        { keys: ['Ctrl', '6'], desc: 'Tab 6: Kế hoạch & Tiến độ chi tiết' },
      ],
    },
    {
      groupName: 'Hỗ trợ & Tra cứu',
      items: [
        {
          keys: ['F1'],
          desc: 'Mở cửa sổ Hướng dẫn phím tắt này bất cứ lúc nào',
          icon: <Keyboard size={13} className="text-purple-400" />,
        },
        {
          keys: ['?'],
          desc: 'Mở nhanh bảng tra cứu phím tắt (khi không trong ô nhập văn bản)',
          icon: <Keyboard size={13} className="text-purple-400" />,
        },
      ],
    },
  ];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-white">
          <Keyboard size={20} className="text-blue-400" />
          <span>Hệ Thống Phím Tắt Chuyên Nghiệp (Desktop Shortcuts)</span>
        </div>
      }
      subtitle="Thao tác nhanh không cần chuột - Tăng gấp 3 lần tốc độ làm việc"
      level={1}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            Mẹo: Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-600 font-mono text-[11px] text-slate-200">Esc</kbd> để đóng cửa sổ này.
          </span>
          <AppButton variant="primary" size="sm" onClick={onClose}>
            Đã hiểu
          </AppButton>
        </div>
      }
    >
      <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {keyGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>{group.groupName}</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#080e1c] border border-[#1b2742] hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {item.icon && <span className="shrink-0">{item.icon}</span>}
                    <span className="text-xs text-slate-300 truncate" title={item.desc}>
                      {item.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k, kIdx) => (
                      <React.Fragment key={kIdx}>
                        <kbd className="min-w-[24px] px-1.5 py-0.5 text-center font-mono font-bold text-[11px] rounded bg-[#131c30] text-blue-200 border border-[#2a3c65] shadow-sm">
                          {k}
                        </kbd>
                        {kIdx < item.keys.length - 1 && <span className="text-slate-500 text-xs">+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
};
