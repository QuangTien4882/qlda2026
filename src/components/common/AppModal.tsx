import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { modalStack } from '../../utils/modalStack';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  level?: 1 | 2 | 3 | 4; // Cấp modal: Cấp 2 = 90% Cấp 1, Cấp 3 = 90% Cấp 2, Cấp 4 = 90% Cấp 3
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  fullScreen?: boolean; // Mở toàn màn hình làm việc
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
  fullScreen = false,
}) => {
  const modalIdRef = useRef<string>(`modal-${Math.random().toString(36).slice(2, 9)}`);
  const [isFull, setIsFull] = useState<boolean>(fullScreen);

  useEffect(() => {
    setIsFull(fullScreen);
  }, [fullScreen, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const id = modalIdRef.current;
      modalStack.push(id);
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Chỉ modal trên cùng trong stack mới được phép xử lý ESC
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
  
  // Xác định class kích thước
  let sizeClass = maxWidth ? `${maxWidthFallback[maxWidth]} max-h-[90vh]` : currentLevelConfig.wrapperClass;
  if (isFull) {
    sizeClass = 'w-full h-full max-w-none max-h-none rounded-none border-none';
  }

  return (
    <div
      className={`fixed inset-0 ${currentLevelConfig.zContainer} flex items-center justify-center ${
        isFull ? 'p-0' : 'p-2 sm:p-4'
      } bg-black/80 backdrop-blur-sm animate-fadeIn`}
    >
      <div
        className={`${sizeClass} bg-[#0f172a] border border-[#232f4e] ${
          isFull ? 'rounded-none' : 'rounded-2xl shadow-2xl'
        } overflow-hidden flex flex-col transition-all duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-3 border-b border-[#1e2a4a] flex items-center justify-between gap-3 bg-[#111a2e] shrink-0">
          <div className="min-w-0 flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-base md:text-lg truncate">{title}</h3>
                <span className="text-xs bg-blue-950/80 text-blue-300 border border-blue-700/50 px-2 py-0.5 rounded font-mono font-medium shrink-0">
                  {currentLevelConfig.badgeLabel}
                </span>
                {isFull && (
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-1.5 py-0.5 rounded font-medium shrink-0">
                    Toàn màn hình
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Nút phóng to / thu nhỏ toàn màn hình */}
            <button
              onClick={() => setIsFull(!isFull)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title={isFull ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            {/* Nút đóng modal */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Modal */}
        <div className={`p-4 sm:p-5 overflow-y-auto flex-1 text-slate-200 min-h-0 ${isFull ? 'flex flex-col' : ''}`}>
          {children}
        </div>

        {/* Footer Modal */}
        {footer && (
          <div className="px-5 py-2.5 border-t border-[#1e2a4a] bg-[#111a2e]/70 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
