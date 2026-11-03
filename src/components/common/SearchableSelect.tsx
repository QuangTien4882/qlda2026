import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  badgeColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate';
  extraData?: any;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string, selectedOption?: SearchableOption) => void;
  placeholder?: string;
  allowCustomInput?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Chọn hoặc tìm kiếm...',
  allowCustomInput = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lọc options theo từ khóa tìm kiếm (không phân biệt dấu và hoa thường)
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const l = opt.label.toLowerCase();
    const sub = (opt.subLabel || '').toLowerCase();
    return l.includes(q) || sub.includes(q);
  });

  const handleSelectOption = (opt: SearchableOption) => {
    onChange(opt.value, opt);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text, undefined);
    setSearchTerm(text);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input hiển thị & tìm kiếm */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleCustomInputChange}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          placeholder={placeholder}
          className="w-full bg-[#080d1a] border border-[#232f4e] focus:border-blue-500 rounded-lg pl-3 pr-16 py-2 text-slate-100 text-xs md:text-sm leading-relaxed"
        />

        <div className="absolute right-2 flex items-center gap-1 text-slate-400">
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('', undefined);
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:text-white rounded"
              title="Xóa lựa chọn"
            >
              <X size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:text-white rounded"
          >
            <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Menu thả xuống với danh sách gợi ý và tìm kiếm */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl bg-[#0a1224] border border-[#203154] shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          {/* Header ô tìm kiếm nhanh */}
          <div className="p-2 border-b border-[#1b2b4a] bg-[#0c162d] flex items-center gap-2">
            <Search size={14} className="text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ từ khóa để lọc nhanh danh mục..."
              autoFocus
              className="w-full bg-transparent border-0 text-slate-100 text-xs focus:outline-none placeholder:text-slate-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Danh sách các lựa chọn */}
          <div className="overflow-y-auto flex-1 divide-y divide-[#15233e]">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {allowCustomInput ? (
                  <span>
                    Không tìm thấy mục trùng khớp. Giá trị <strong>"{value}"</strong> sẽ được lưu dưới dạng tùy chỉnh.
                  </span>
                ) : (
                  <span>Không tìm thấy danh mục phù hợp.</span>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value || opt.label === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(opt)}
                    className={`p-2.5 px-3 cursor-pointer hover:bg-[#12203d] transition-colors flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-blue-950/60 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-xs font-semibold text-slate-100 leading-snug">
                        {opt.label}
                      </div>
                      {opt.subLabel && (
                        <div className="text-[11px] text-slate-400 leading-tight">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                      {opt.badge && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-blue-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

