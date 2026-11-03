import React from 'react';
import { AppModal } from './AppModal';
import { AppButton } from './AppButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
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
}) => {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle size={20} />
          <span>{title}</span>
        </div>
      }
      level={3}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </AppButton>
        </div>
      }
    >
      <div className="py-2 text-sm text-slate-300 leading-relaxed">
        {message}
      </div>
    </AppModal>
  );
};

