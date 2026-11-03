import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  level?: 1 | 2 | 3 | 4; // Cấp modal: Cấp 2 = 90% Cấp 1, Cấp 3 = 90% Cấp 2, Cấp 4 = 90% Cấp 3
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  level = 1,
  maxWidth,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Cấu hình quy chuẩn kích thước theo yêu cầu:
  // - Chiều cao: Giữ bằng chiều cao màn hình làm việc (92vh) cho các cấp
  // - Chiều ngang: Cấp sau bằng 90% chiều ngang cấp trước (Cấp 1: 95vw -> Cấp 2: 85.5vw -> Cấp 3: 77vw -> Cấp 4: 69vw)
  const levelConfig: Record<number, { wrapperClass: string; zContainer: string; badgeLabel: string }> = {
    1: {
      wrapperClass: 'w-[95vw] max-w-7xl h-[92vh]',
      zContainer: 'z-50',
      badgeLabel: 'Cấp 1',
    },
    2: {
      wrapperClass: 'w-[85.5vw] max-w-6xl h-[92vh]',
      zContainer: 'z-[60]',
      badgeLabel: 'Cấp 2',
    },
    3: {
      wrapperClass: 'w-[77vw] max-w-4xl h-[92vh]',
      zContainer: 'z-[70]',
      badgeLabel: 'Cấp 3',
    },
    4: {
      wrapperClass: 'w-[69vw] max-w-2xl max-h-[92vh]',
      zContainer: 'z-[80]',
      badgeLabel: 'Cấp 4',
    },
  };

  const maxWidthFallback: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-[95vw]',
  };

  const currentLevelConfig = levelConfig[level] || levelConfig[1];
  const sizeClass = maxWidth ? `${maxWidthFallback[maxWidth]} max-h-[90vh]` : currentLevelConfig.wrapperClass;

  return (
    <div className={`fixed inset-0 ${currentLevelConfig.zContainer} flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn`}>
      <div
        className={`${sizeClass} bg-[#0f172a] border border-[#232f4e] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3.5 border-b border-[#1e2a4a] flex items-center justify-between gap-3 bg-[#111a2e] shrink-0">
          <div className="min-w-0 flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base md:text-lg truncate">{title}</h3>
                <span className="text-xs bg-blue-950/80 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded font-mono font-medium shrink-0">
                  {currentLevelConfig.badgeLabel}
                </span>
              </div>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Đóng cửa sổ"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal - Không ép cứng text-sm để cỡ chữ toàn hệ thống co giãn chuẩn theo cài đặt */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-200">{children}</div>

        {/* Footer Modal */}
        {footer && (
          <div className="px-5 py-3 border-t border-[#1e2a4a] bg-[#111a2e]/70 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
