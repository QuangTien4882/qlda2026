import React, { useRef, useState, useEffect } from 'react';
import { formatVnNumber, parseVnNumber } from '../../utils/numberUtils';

interface VnNumberInputProps {
  value?: number | null;
  onChange?: (val: number, formattedStr: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  suffix?: string;
  prefix?: string;
  allowDecimals?: boolean;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
}

export const VnNumberInput: React.FC<VnNumberInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0',
  suffix,
  prefix,
  allowDecimals = true,
  disabled = false,
  required = false,
  helperText,
  error,
  className = '',
  inputClassName = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value !== undefined && value !== null ? formatVnNumber(value, allowDecimals) : '';
  });

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const currentParsed = parseVnNumber(displayValue);
      // Chỉ cập nhật nếu giá trị số khác với giá trị hiện tại trên màn hình
      // để tránh giật con trỏ khi người dùng đang gõ
      if (Math.abs(currentParsed - value) > 0.00001) {
        setDisplayValue(formatVnNumber(value, allowDecimals));
      }
    } else if (value === null || value === undefined) {
      if (displayValue !== '') {
        setDisplayValue('');
      }
    }
  }, [value, allowDecimals]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawVal = input.value;
    const cursorPos = input.selectionStart || 0;

    // Đếm số lượng chữ số nằm bên trái con trỏ trước khi format
    const leftText = rawVal.slice(0, cursorPos);
    const digitsBeforeCursor = leftText.replace(/\D/g, '').length;
    const hasCommaBeforeCursor = leftText.includes(',');

    // Chỉ cho phép chữ số, dấu chấm và 1 dấu phẩy
    // Loại bỏ các ký tự không hợp lệ
    let sanitized = rawVal.replace(/[^\d,]/g, '');

    // Nếu có nhiều hơn 1 dấu phẩy, chỉ giữ dấu phẩy đầu tiên
    const commaParts = sanitized.split(',');
    if (commaParts.length > 2) {
      sanitized = `${commaParts[0]},${commaParts.slice(1).join('')}`;
    }

    if (!allowDecimals) {
      sanitized = sanitized.replace(/,/g, '');
    }

    // Format theo chuẩn VN (chấm phân cách nghìn, phẩy thập phân)
    const formatted = formatVnNumber(sanitized, allowDecimals);

    setDisplayValue(formatted);

    // Tính toán giá trị số thực
    const numericValue = parseVnNumber(formatted);
    if (onChange) {
      onChange(numericValue, formatted);
    }

    // Phục hồi vị trí con trỏ chuột chính xác sau khi render
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let newPos = 0;
      let countedDigits = 0;
      let passedComma = false;

      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] === ',') {
          passedComma = true;
          if (hasCommaBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        if (/\d/.test(formatted[i])) {
          countedDigits++;
        }
        if (countedDigits >= digitsBeforeCursor) {
          newPos = i + 1;
          break;
        }
      }

      if (cursorPos === 0) newPos = 0;
      inputRef.current.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-xs md:text-sm text-slate-400 pointer-events-none select-none">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-[#0b1222] border rounded-lg py-2 text-slate-100 placeholder:italic placeholder:text-slate-500 font-mono text-right transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            prefix ? 'pl-8' : 'pl-3'
          } ${suffix ? 'pr-14' : 'pr-3'} ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500'
              : 'border-[#232f4e] hover:border-slate-600 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : ''} ${inputClassName}`}
        />
        {suffix && (
          <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none select-none bg-[#111a2e] px-1.5 py-0.5 rounded border border-[#232f4e]">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

