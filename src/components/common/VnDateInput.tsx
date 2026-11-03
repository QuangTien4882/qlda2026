import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  formatCustomVnDate,
  parseCustomVnDate,
} from '../../utils/dateUtils';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check 
} from 'lucide-react';

export interface VnDateInputProps {
  value?: string; // Chuỗi ngày theo chuẩn VN (VD: 18/01/2026, 18/3/2026)
  onChange?: (dateStr: string, dateObj: Date | null) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  inputClassName?: string;
}

export const VnDateInput: React.FC<VnDateInputProps> = ({
  value = '',
  onChange,
  label,
  placeholder = 'dd/mm/yyyy (Click để chọn ngày)',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  inputClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpenCalendar, setIsOpenCalendar] = useState(false);

  // Parse ngày ban đầu nếu có giá trị
  const initialDateObj = useMemo(() => {
    if (!value) return null;
    return parseCustomVnDate(value);
  }, [value]);

  const today = useMemo(() => new Date(), []);

  // Tháng (0-11) và Năm hiển thị trên bộ lịch
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return initialDateObj ? initialDateObj.getMonth() : today.getMonth();
  });
  const [viewYear, setViewYear] = useState<number>(() => {
    return initialDateObj ? initialDateObj.getFullYear() : today.getFullYear();
  });

  // Khi `value` bên ngoài thay đổi, đồng bộ lại view lịch nếu mở
  useEffect(() => {
    if (initialDateObj) {
      setViewMonth(initialDateObj.getMonth());
      setViewYear(initialDateObj.getFullYear());
    }
  }, [initialDateObj]);

  // Đóng lịch khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenCalendar(false);
      }
    };

    if (isOpenCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpenCalendar]);

  // Điều hướng tháng trước / tháng sau
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Tính số ngày và các ô trống trong tháng
  const { leadingEmptySlots, daysInMonth } = useMemo(() => {
    // Ngày đầu tiên của tháng rơi vào thứ mấy: 0: CN, 1: T2, 2: T3, ..., 6: T7
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    // Quy đổi sang tuần bắt đầu từ Thứ Hai:
    // T2 (1) -> 0, T3 (2) -> 1, ..., T7 (6) -> 5, CN (0) -> 6
    const leadingSlots = firstDay === 0 ? 6 : firstDay - 1;

    // Số ngày trong tháng (28, 29, 30, 31)
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    return { leadingEmptySlots: leadingSlots, daysInMonth: totalDays };
  }, [viewYear, viewMonth]);

  // Chọn một ngày cụ thể trong tháng
  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    const formatted = formatCustomVnDate(selectedDate);
    if (onChange) {
      onChange(formatted, selectedDate);
    }
    setIsOpenCalendar(false);
  };

  // Chọn ngày hôm nay
  const handleSelectToday = () => {
    const now = new Date();
    const formatted = formatCustomVnDate(now);
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    if (onChange) {
      onChange(formatted, now);
    }
    setIsOpenCalendar(false);
  };

  // Xóa ngày
  const handleClearDate = () => {
    if (onChange) {
      onChange('', null);
    }
    setIsOpenCalendar(false);
  };

  // Xử lý khi người dùng gõ trực tiếp vào ô input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typedVal = e.target.value;
    const parsed = parseCustomVnDate(typedVal);
    if (onChange) {
      onChange(typedVal, parsed);
    }
  };

  // Danh sách các năm để chọn nhanh (2015 đến 2040)
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = 2018; y <= 2038; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block text-xs md:text-sm font-medium text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          onClick={() => !disabled && setIsOpenCalendar((prev) => !prev)}
          placeholder={placeholder}
          className={`w-full bg-[#0b1222] border rounded-lg py-2 pl-3 pr-10 text-slate-100 placeholder:italic placeholder:text-slate-500 font-mono text-xs md:text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error
              ? 'border-rose-500/80 focus:ring-rose-500'
              : 'border-[#232f4e] hover:border-slate-500 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/60' : 'cursor-pointer'} ${inputClassName}`}
        />

        {/* Nút icon lịch mở DatePicker */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpenCalendar((prev) => !prev)}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-blue-400 rounded transition-colors focus:outline-none"
          title="Click để mở lịch chuẩn Việt Nam"
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-400">{helperText}</p>
      ) : null}

      {/* POPUP LỊCH CHUẨN TIẾNG VIỆT */}
      {isOpenCalendar && !disabled && (
        <div 
          className="absolute z-[120] left-0 mt-1.5 p-3.5 bg-[#0d162b] border border-[#23355c] rounded-2xl shadow-2xl w-[290px] sm:w-[310px] animate-fadeIn select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Datepicker: Nút chuyển tháng + Chọn nhanh Tháng + Chọn nhanh Năm */}
          <div className="flex items-center justify-between gap-1.5 pb-2.5 border-b border-[#1e2c4c]">
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Tháng trước"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2846] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex items-center gap-1.5">
              {/* Dropdown chọn nhanh tháng */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="bg-[#070c18] border border-[#23355c] text-blue-300 font-semibold text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Dropdown chọn nhanh năm */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="bg-[#070c18] border border-[#23355c] text-emerald-300 font-bold font-mono text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              title="Tháng sau"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2846] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Hàng Tiêu đề Thứ trong tuần (T2 -> CN, CN màu cam/đỏ) */}
          <div className="grid grid-cols-7 gap-1 pt-2.5 pb-1 text-center font-semibold text-[11px]">
            {weekdays.map((w, idx) => (
              <div
                key={w}
                className={idx === 6 ? 'text-rose-400 font-bold' : 'text-slate-400'}
              >
                {w}
              </div>
            ))}
          </div>

          {/* Lưới Ngày trong tháng:
              - CHỈ hiển thị ngày của tháng hiện tại (không hiển thị ngày của tháng khác)
              - Highlight ngày hiện tại và ngày đang chọn */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {/* Các ô trống đầu tháng (không hiển thị ngày tháng trước) */}
            {Array.from({ length: leadingEmptySlots }).map((_, i) => (
              <div key={`empty-lead-${i}`} className="h-8 w-8" />
            ))}

            {/* Các ngày trong tháng */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;

              // Kiểm tra xem có phải ngày hôm nay không
              const isToday =
                today.getDate() === day &&
                today.getMonth() === viewMonth &&
                today.getFullYear() === viewYear;

              // Kiểm tra xem có phải ngày đang được chọn không
              const isSelected =
                initialDateObj !== null &&
                initialDateObj.getDate() === day &&
                initialDateObj.getMonth() === viewMonth &&
                initialDateObj.getFullYear() === viewYear;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 rounded-lg text-xs font-mono font-medium flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/60 ring-2 ring-blue-400'
                      : isToday
                      ? 'border-2 border-amber-400 text-amber-300 font-bold bg-amber-950/30 hover:bg-amber-900/40'
                      : 'text-slate-200 hover:bg-[#1a2744] hover:text-white'
                  }`}
                  title={isToday ? 'Hôm nay' : undefined}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Chân Datepicker: Nút "Hôm nay", "Xóa", "Đóng" */}
          <div className="flex items-center justify-between gap-1.5 pt-3 mt-2.5 border-t border-[#1e2c4c] text-xs">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700/50 font-medium transition-colors"
            >
              Hôm nay
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearDate}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={() => setIsOpenCalendar(false)}
                className="px-2.5 py-1 rounded-lg bg-[#142038] hover:bg-[#1b2b4c] text-slate-300 font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
