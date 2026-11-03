import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onSave?: () => void;
  onNew?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onEscape?: () => void;
  onTabChange?: (tabIndex: number) => void;
  onOpenHelp?: () => void;
}

/**
 * Hook bắt các phím tắt hệ thống chuyên nghiệp cho Desktop
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers, isEnabled: boolean = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isEnabled) return;

      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // 1. Phím Ctrl + S: Luôn hoạt động ưu tiên, chặn Save trang web của trình duyệt
      if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        if (handlers.onSave) {
          handlers.onSave();
        }
        return;
      }

      // 2. Phím Esc: Đóng modal / hủy thao tác
      if (e.key === 'Escape') {
        if (handlers.onEscape) {
          handlers.onEscape();
        }
        return;
      }

      // 3. Phím Ctrl + F: Tìm kiếm nhanh (đưa con trỏ vào ô tìm kiếm của bảng)
      if (isCtrlOrCmd && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        e.stopPropagation();
        if (handlers.onSearch) {
          handlers.onSearch();
        }
        return;
      }

      // 4. Phím Ctrl + N: Thêm mới bản ghi
      if (isCtrlOrCmd && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        e.stopPropagation();
        if (handlers.onNew) {
          handlers.onNew();
        }
        return;
      }

      // 5. Phím Ctrl + 1..6: Chuyển tab nhanh (1: Dự án, 2: Dự toán, 3: Chi phí, 4: Nghiệm thu, 5: Pháp lý, 6: Kế hoạch)
      if (isCtrlOrCmd && ['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        const tabIdx = parseInt(e.key, 10);
        if (handlers.onTabChange) {
          handlers.onTabChange(tabIdx);
        }
        return;
      }

      // 6. Phím F1: Mở trợ giúp phím tắt
      if (e.key === 'F1') {
        e.preventDefault();
        e.stopPropagation();
        if (handlers.onOpenHelp) {
          handlers.onOpenHelp();
        }
        return;
      }

      // === NẾU ĐANG GÕ TRONG INPUT / TEXTAREA: BỎ QUA CÁC PHÍM KÝ TỰ ĐƠN BÊN DƯỚI ===
      if (isInput) return;

      // 7. Phím '?' (Shift + /): Mở trợ giúp phím tắt
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        if (handlers.onOpenHelp) {
          handlers.onOpenHelp();
        }
        return;
      }

      // 8. Phím F2: Sửa bản ghi đang chọn
      if (e.key === 'F2') {
        e.preventDefault();
        if (handlers.onEdit) {
          handlers.onEdit();
        }
        return;
      }

      // 9. Phím Delete: Xóa bản ghi đang chọn
      if (e.key === 'Delete') {
        e.preventDefault();
        if (handlers.onDelete) {
          handlers.onDelete();
        }
        return;
      }
    },
    [handlers, isEnabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
