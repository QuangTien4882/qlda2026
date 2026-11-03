import React, { useEffect, useRef } from 'react';
import { AppButton } from './AppButton';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { modalStack } from '../../utils/modalStack';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  extraAction?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận xóa dữ liệu',
  message,
  confirmLabel = 'Xóa dữ liệu',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  extraAction,
}) => {
  const dialogIdRef = useRef<string>(`confirm-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (isOpen) {
      const id = dialogIdRef.current;
      modalStack.push(id);
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (modalStack.isTop(id)) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        modalStack.pop(id);
        if (modalStack.count() === 0) {
          document.body.style.overflow = 'unset';
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    if (variant === 'danger') return <AlertTriangle size={20} className="text-rose-400 shrink-0" />;
    if (variant === 'warning') return <AlertCircle size={20} className="text-amber-400 shrink-0" />;
    return <Info size={20} className="text-blue-400 shrink-0" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-[#0f172a] border border-[#232f4e] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gọn gàng */}
        <div className="px-5 py-3.5 border-b border-[#1e2a4a] flex items-center justify-between gap-3 bg-[#111a2e] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {getIcon()}
            <h4 className="font-semibold text-slate-100 text-sm md:text-base truncate">
              {title}
            </h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nội dung thông điệp */}
        <div className="p-5 overflow-y-auto max-h-[60vh] text-xs md:text-sm text-slate-300 leading-relaxed">
          {message}
        </div>

        {/* Chân modal chứa các nút hành động */}
        <div className="px-5 py-3.5 bg-[#0b1222] border-t border-[#1e2a4a] flex flex-wrap items-center justify-end gap-2.5 shrink-0">
          {cancelLabel && (
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              {cancelLabel}
            </AppButton>
          )}

          {confirmLabel && (
            <AppButton
              variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmLabel}
            </AppButton>
          )}

          {extraAction}
        </div>
      </div>
    </div>
  );
};
