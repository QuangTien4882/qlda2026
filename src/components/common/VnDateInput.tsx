import React, { useRef } from 'react';
import {
  formatCustomVnDate,
  parseCustomVnDate,
  toIsoDateString,
  fromIsoToCustomVnDate,
} from '../../utils/dateUtils';
import { Calendar as CalendarIcon } from 'lucide-react';

interface VnDateInputProps {
  value?: string; // Chuỗi ngày theo chuẩn VN đặc thù (VD: 18/01/2026, 18/3/2026)
  onChange?: (dateStr: string, dateObj: Date | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
}

export const VnDateInput: React.FC<VnDateInputProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
}) => {
  const hiddenDateInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn ngày từ bộ lịch
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // yyyy-mm-dd
    if (!isoVal) {
      if (onChange) onChange('', null);
      return;
    }
    const formattedVn = fromIsoToCustomVnDate(isoVal);
    const dateObj = parseCustomVnDate(formattedVn);
    if (onChange) {
      onChange(formattedVn, dateObj);
    }
  };

  // Mở popup lịch
  const openCalendar = () => {
    if (disabled) return;
    if (hiddenDateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        hiddenDateInputRef.current.showPicker();
      } else {
        hiddenDateInputRef.current.focus();
      }
    }
  };

  const isoValue = toIsoDateString(value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={value}
          onClick={openCalendar}
          placeholder={placeholder}
          className={`w-full bg-[#0b1222] border rounded-lg py-2 pl-3 pr-10 text-slate-100 placeholder-slate-500 font-mono text-sm cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500'
              : 'border-[#232f4e] hover:border-slate-500 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : ''}`}
        />

        {/* Nút bấm icon lịch */}
        <button
          type="button"
          disabled={disabled}
          onClick={openCalendar}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-blue-400 rounded transition-colors focus:outline-none"
          title="Chọn ngày từ lịch"
        >
          <CalendarIcon size={16} />
        </button>

        {/* Native hidden date picker */}
        <input
          ref={hiddenDateInputRef}
          type="date"
          value={isoValue}
          disabled={disabled}
          onChange={handleNativeDateChange}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

