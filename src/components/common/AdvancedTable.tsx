import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Pin, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { AppButton } from './AppButton';
import { useIsMobile } from '../../hooks/useIsMobile';

export interface AdvancedColumn<T> {
  id: string;
  title: string;           // Tên tiêu đề (ví dụ: "Tổng mức đầu tư")
  unit?: string;           // Đơn vị (ví dụ: "(đồng)", "(%)") - Bắt buộc nhảy dòng
  width: number;           // Độ rộng ban đầu (px)
  minWidth?: number;       // Độ rộng tối thiểu (px, mặc định 25)
  align?: 'left' | 'center' | 'right';
  pinned?: boolean;        // Mặc định có ghim hay không
  canPin?: boolean;        // Cho phép ghim hay không (mặc định true)
  canResize?: boolean;     // Cho phép kéo dãn hay không (mặc định true)
  render?: (item: T, index: number) => React.ReactNode;
  searchValue?: (item: T) => string; // Chuỗi dùng để tìm kiếm
  /** Hiển thị cột này trên thẻ mobile (mặc định true cho 4 cột đầu tiên) */
  showOnMobileCard?: boolean;
  /** Nếu true, giá trị cột này sẽ là tiêu đề chính của thẻ mobile */
  mobileCardTitle?: boolean;
}

interface AdvancedTableProps<T> {
  tableId?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  columns: AdvancedColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  onAdd?: () => void;
  addLabel?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
  showActionsColumn?: boolean;
}

export function AdvancedTable<T>({
  tableId,
  title,
  subtitle,
  columns: initialColumns,
  data,
  keyExtractor,
  onAdd,
  addLabel = 'Thêm mới',
  onEdit,
  onDelete,
  onRowClick,
  emptyMessage = 'Không tìm thấy dữ liệu phù hợp',
  className = '',
  showActionsColumn = true,
}: AdvancedTableProps<T>) {
  // Ref container cuộn của bảng
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Khóa lưu độ rộng cột vào localStorage
  const storageKey = useMemo(() => {
    if (tableId) return `projectm_table_col_widths_${tableId}`;
    const colSignature = initialColumns.map((c) => c.id).join('_');
    return `projectm_table_col_widths_${colSignature}`;
  }, [tableId, initialColumns]);

  // 1. Quản lý độ rộng từng cột (Resize độc lập & Khôi phục từ localStorage)
  const [colWidths, setColWidths] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    initialColumns.forEach((c) => {
      map[c.id] = c.width;
    });
    try {
      const savedKey = tableId
        ? `projectm_table_col_widths_${tableId}`
        : `projectm_table_col_widths_${initialColumns.map((c) => c.id).join('_')}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...map, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc colWidths từ localStorage:', e);
    }
    return map;
  });

  const latestColWidthsRef = useRef(colWidths);
  useEffect(() => {
    latestColWidthsRef.current = colWidths;
  }, [colWidths]);

  // 2. Quản lý ghim cột lũy tiến (Freeze Panes chuẩn Excel: Ghim cột k thì ghim toàn bộ 0..k)
  const initialFreezeIndex = useMemo(() => {
    let maxIdx = -1;
    initialColumns.forEach((col, idx) => {
      if (col.pinned) maxIdx = Math.max(maxIdx, idx);
    });
    return maxIdx;
  }, [initialColumns]);

  const [freezeIndex, setFreezeIndex] = useState<number>(initialFreezeIndex);

  const handleToggleFreeze = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index <= freezeIndex) {
      // Đang được ghim: bỏ ghim từ cột này trở về sau
      setFreezeIndex(index - 1);
    } else {
      // Chưa ghim: ghim toàn bộ từ cột 0 đến cột này
      setFreezeIndex(index);
    }
  };

  // 3. Quản lý tìm kiếm không theo thứ tự (Out-of-order Search)
  const [searchTerm, setSearchTerm] = useState('');

  // 4. Ref và trạng thái kéo giãn cột (Column Resizing)
  const resizingRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const startResize = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      colId,
      startX: e.clientX,
      startWidth: colWidths[colId] || 100,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingRef.current) return;
      const { colId: activeId, startX, startWidth } = resizingRef.current;
      const delta = moveEvent.clientX - startX;
      const colDef = initialColumns.find((c) => c.id === activeId);
      const minW = colDef?.minWidth !== undefined ? colDef.minWidth : 25;
      const newWidth = Math.max(minW, Math.max(20, startWidth + delta));

      setColWidths((prev) => {
        const next = {
          ...prev,
          [activeId]: newWidth,
        };
        latestColWidthsRef.current = next;
        return next;
      });
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      try {
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(latestColWidthsRef.current));
        }
      } catch (err) {
        console.error('Lỗi lưu colWidths vào localStorage:', err);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Khôi phục độ rộng các cột về mặc định ban đầu
  const handleResetWidths = () => {
    const map: Record<string, number> = {};
    initialColumns.forEach((c) => {
      map[c.id] = c.width;
    });
    setColWidths(map);
    latestColWidthsRef.current = map;
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Lỗi xóa colWidths khỏi localStorage:', err);
    }
  };

  const hasCustomWidths = useMemo(() => {
    return initialColumns.some(
      (col) => colWidths[col.id] !== undefined && colWidths[col.id] !== col.width
    );
  }, [initialColumns, colWidths]);

  // 5. Tính toán vị trí offset `left` cho các cột ghim (Freeze Panes Offsets)
  const { pinnedOffsets, totalTableWidth } = useMemo(() => {
    const offsets: number[] = [];
    let currentLeft = 0;
    let totalW = 0;

    initialColumns.forEach((col, idx) => {
      const w = colWidths[col.id] || col.width;
      if (idx <= freezeIndex) {
        offsets[idx] = currentLeft;
        currentLeft += w;
      } else {
        offsets[idx] = 0;
      }
      totalW += w;
    });

    if (showActionsColumn && (onEdit || onDelete)) {
      totalW += 90; // Cột thao tác
    }

    return { pinnedOffsets: offsets, totalTableWidth: totalW };
  }, [initialColumns, freezeIndex, colWidths, showActionsColumn, onEdit, onDelete]);

  // 6. Lọc dữ liệu tìm kiếm không theo thứ tự (Out-of-order Multi-keyword Search)
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const tokens = searchTerm
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return data.filter((item) => {
      const rowTexts = initialColumns
        .map((col) => {
          if (col.searchValue) return col.searchValue(item);
          const raw = (item as Record<string, unknown>)[col.id];
          return raw !== undefined && raw !== null ? String(raw) : '';
        })
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => rowTexts.includes(token));
    });
  }, [data, searchTerm, initialColumns]);

  // Nút cuộn ngang tiện lợi
  const scrollHorizontally = (delta: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Phát hiện thiết bị di động để chuyển sang giao diện thẻ (card)
  const isMobile = useIsMobile(1024);

  // Xác định các cột hiển thị trên mobile card
  const mobileVisibleColumns = useMemo(() => {
    // Nếu cột nào có showOnMobileCard=true thì ưu tiên
    const explicitCols = initialColumns.filter((c) => c.showOnMobileCard === true);
    if (explicitCols.length > 0) return explicitCols;
    // Mặc định hiển thị tất cả các cột (trừ STT)
    return initialColumns.filter((c) => c.id !== 'stt');
  }, [initialColumns]);

  // Tìm cột tiêu đề chính cho mobile card
  const mobileTitleColumn = useMemo(() => {
    return initialColumns.find((c) => c.mobileCardTitle) || initialColumns.find((c) => c.id === 'name') || initialColumns[1] || initialColumns[0];
  }, [initialColumns]);

  return (
    <div className={`flex flex-col flex-1 min-h-0 h-full overflow-hidden ${className}`}>
      {/* Thanh công cụ gọn gàng: Số bản ghi + Nút cuộn ngang + Tìm kiếm Out-of-order + Nút Thêm mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0d1424] px-3 py-2 rounded-xl border border-[#232f4e] shrink-0 mb-2 shadow-sm">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-xs bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40 font-mono font-bold shrink-0">
            {filteredData.length}/{data.length} bản ghi
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Nút điều hướng cuộn ngang nhanh cho chuột thường */}
          <div className="hidden md:flex items-center gap-1 bg-[#080d1a] border border-[#232f4e] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => scrollHorizontally(-220)}
              title="Cuộn bảng sang trái"
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-[11px] text-slate-400 font-mono px-1">Cuộn ngang</span>
            <button
              type="button"
              onClick={() => scrollHorizontally(220)}
              title="Cuộn bảng sang phải"
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Ô tìm kiếm thông minh không cần theo thứ tự */}
          <div className="relative flex items-center min-w-[180px] sm:min-w-[240px]">
            <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mọi từ khóa..."
              className="w-full bg-[#080d1a] border border-[#232f4e] focus:border-blue-500 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-100 rounded"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Nút Bỏ ghim nếu đang có cột ghim */}
          {freezeIndex >= 0 && (
            <button
              onClick={() => setFreezeIndex(-1)}
              title="Bỏ ghim toàn bộ các cột"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs transition-colors"
            >
              <RotateCcw size={12} />
              <span className="hidden xl:inline text-[11px]">Bỏ ghim</span>
            </button>
          )}

          {/* Nút Khôi phục độ rộng mặc định */}
          {hasCustomWidths && (
            <button
              onClick={handleResetWidths}
              title="Khôi phục độ rộng các cột về mặc định ban đầu"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs transition-colors"
            >
              <RotateCcw size={12} />
              <span className="hidden xl:inline text-[11px]">Độ rộng mặc định</span>
            </button>
          )}

          {/* Nút thêm mới đồng bộ: "Thêm mới" */}
          {onAdd && (
            <AppButton size="sm" variant="primary" icon={<Plus size={14} />} onClick={onAdd}>
              {addLabel}
            </AppButton>
          )}
        </div>
      </div>

      {/* ==================== MOBILE CARD VIEW (< 1024px) ==================== */}
      {isMobile ? (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pb-2">
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search size={24} className="text-slate-500 mb-2" />
              <span className="text-sm">{emptyMessage}</span>
            </div>
          ) : (
            filteredData.map((item, index) => (
              <div
                key={keyExtractor(item, index)}
                onClick={() => onRowClick && onRowClick(item)}
                className={`bg-[#0d1527] border border-[#232f4e] rounded-xl p-3 space-y-2 transition-colors ${
                  onRowClick ? 'cursor-pointer active:bg-[#162544]' : ''
                }`}
              >
                {/* Dòng đầu: STT + Tiêu đề chính + Nút thao tác */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    {/* STT badge nhỏ */}
                    {initialColumns.find((c) => c.id === 'stt') && (
                      <span className="shrink-0 bg-slate-700/60 text-slate-300 text-[10px] font-mono font-bold w-6 h-6 flex items-center justify-center rounded-md border border-slate-600/50">
                        {(() => {
                          const sttCol = initialColumns.find((c) => c.id === 'stt');
                          if (sttCol?.render) return sttCol.render(item, index);
                          return String((item as Record<string, unknown>)['stt'] ?? (index + 1));
                        })()}
                      </span>
                    )}
                    {/* Tiêu đề chính */}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-100 leading-snug break-words">
                        {mobileTitleColumn.render
                          ? mobileTitleColumn.render(item, index)
                          : String((item as Record<string, unknown>)[mobileTitleColumn.id] ?? '')}
                      </div>
                    </div>
                  </div>

                  {/* Nút Sửa / Xóa */}
                  {showActionsColumn && (onEdit || onDelete) && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Các trường dữ liệu còn lại dạng label: value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {mobileVisibleColumns
                    .filter((col) => col.id !== mobileTitleColumn.id && col.id !== 'stt')
                    .map((col) => (
                      <div key={col.id} className="flex items-start gap-1.5 py-0.5">
                        <span className="text-slate-500 shrink-0 min-w-[70px]">
                          {col.title}{col.unit ? ` ${col.unit}` : ''}:
                        </span>
                        <span className="text-slate-200 break-words min-w-0">
                          {col.render
                            ? col.render(item, index)
                            : String((item as Record<string, unknown>)[col.id] ?? '—')}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
      /* ==================== DESKTOP TABLE VIEW (>= 1024px) ==================== */
      <div 
        ref={tableScrollRef}
        className="flex-1 min-h-0 w-full overflow-auto rounded-lg border border-slate-600 bg-[#080e1a] shadow-xl relative"
      >
        <table
          className="table-data-grid border-separate border-spacing-0 text-left table-fixed w-full"
          style={{ width: `${totalTableWidth}px`, minWidth: `${totalTableWidth}px` }}
        >
          {/* Header Bảng: Căn giữa, Top, Đơn vị nhảy dòng (Alt+Enter), Ghim lũy tiến, sticky top-0 trực tiếp trên từng th */}
          <thead className="bg-[#141f36] p-0 m-0">
            <tr>
              {initialColumns.map((col, idx) => {
                const isPinned = idx <= freezeIndex;
                const isLastPinned = idx === freezeIndex;
                const leftPos = isPinned ? pinnedOffsets[idx] : undefined;
                const width = colWidths[col.id] || col.width;

                return (
                  <th
                    key={col.id}
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      maxWidth: `${width}px`,
                      left: isPinned ? `${leftPos}px` : undefined,
                      top: 0,
                    }}
                    className={`sticky top-0 ${
                      isPinned
                        ? 'z-30 bg-[#162544]'
                        : 'z-20 bg-[#141f36]'
                    } py-2.5 px-2.5 align-top text-center select-none relative group border-b-2 border-r border-slate-600 text-slate-100 font-semibold ${
                      isLastPinned ? 'border-r-2 border-r-blue-400 shadow-[4px_0_12px_rgba(0,0,0,0.65)]' : ''
                    }`}
                  >
                    {/* Header Content: Căn giữa & Top */}
                    <div className="flex flex-col items-center justify-start min-h-[44px]">
                      <div className="flex items-center justify-center gap-1.5 w-full">
                        <span className="font-semibold text-slate-100 tracking-wide text-center leading-tight">
                          {col.title}
                        </span>

                        {/* Nút Ghim Cột Lũy Tiến (Freeze Panes) */}
                        {col.canPin !== false && (
                          <button
                            onClick={(e) => handleToggleFreeze(idx, e)}
                            title={
                              isPinned
                                ? `Bỏ ghim từ cột này trở đi`
                                : `Ghim cố định từ cột 1 đến cột "${col.title}"`
                            }
                            className={`p-1 rounded transition-colors ${
                              isPinned
                                ? 'text-blue-400 bg-blue-900/50 hover:bg-blue-800'
                                : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Pin size={12} className={isPinned ? 'rotate-45 text-blue-300' : ''} />
                          </button>
                        )}
                      </div>

                      {/* Đơn vị nhảy dòng (như Alt+Enter trong Excel) */}
                      {col.unit && (
                        <span className="header-unit text-[11px] font-mono font-medium text-slate-300 mt-1 whitespace-nowrap bg-[#0b1222] px-1.5 py-0.5 rounded border border-slate-500/50">
                          {col.unit}
                        </span>
                      )}
                    </div>

                    {/* Thanh kéo dãn mép cột (Col Resizer Handle) */}
                    {col.canResize !== false && (
                      <div
                        onMouseDown={(e) => startResize(col.id, e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-400 active:bg-blue-300 select-none touch-none z-40 transition-colors"
                        title="Kéo sang trái/phải để thay đổi độ rộng cột"
                      />
                    )}
                  </th>
                );
              })}

              {/* Cột thao tác (Sửa / Xóa) - GHIM CỐ ĐỊNH BÊN PHẢI (STICKY RIGHT) */}
              {showActionsColumn && (onEdit || onDelete) && (
                <th
                  style={{ width: '90px', minWidth: '90px', maxWidth: '90px', top: 0, right: 0 }}
                  className="sticky top-0 right-0 z-30 py-2.5 px-2 align-top text-center bg-[#162544] text-slate-100 font-semibold border-b-2 border-l-2 border-l-blue-500/60 border-r border-slate-600 shadow-[-4px_0_12px_rgba(0,0,0,0.65)]"
                >
                  <div className="flex flex-col items-center justify-start min-h-[44px]">
                    <span className="font-semibold text-slate-100 leading-tight">Thao tác</span>
                    <span className="header-unit text-[11px] text-slate-400 mt-1 font-mono">(Sửa/Xóa)</span>
                  </div>
                </th>
              )}
            </tr>
          </thead>

          {/* Body Bảng: Kẻ khung từng ô, Tự động xuống dòng khi resize cột */}
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={initialColumns.length + (showActionsColumn && (onEdit || onDelete) ? 1 : 0)}
                  className="py-12 text-center text-slate-400 border-b border-r border-slate-700/80 bg-[#080e1a]"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search size={24} className="text-slate-500" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr
                  key={keyExtractor(item, index)}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`group transition-colors duration-100 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {initialColumns.map((col, idx) => {
                    const isPinned = idx <= freezeIndex;
                    const isLastPinned = idx === freezeIndex;
                    const leftPos = isPinned ? pinnedOffsets[idx] : undefined;
                    const width = colWidths[col.id] || col.width;

                    return (
                      <td
                        key={col.id}
                        style={{
                          width: `${width}px`,
                          minWidth: `${width}px`,
                          maxWidth: `${width}px`,
                          left: isPinned ? `${leftPos}px` : undefined,
                        }}
                        className={`py-2 px-2.5 text-slate-200 align-top border-b border-r border-slate-700/80 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${
                          isPinned
                            ? `sticky z-10 ${index % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#0a101f]'} group-hover:bg-[#162544]`
                            : `${index % 2 === 0 ? 'bg-[#0d1527]' : 'bg-[#080e1a]'} group-hover:bg-[#162544]`
                        } ${isLastPinned ? 'border-r-2 border-r-blue-400 shadow-[4px_0_12px_rgba(0,0,0,0.65)]' : ''}`}
                      >
                        {/* Tự động xuống dòng khi resize cột hẹp lại */}
                        <div className="whitespace-normal break-words leading-relaxed">
                          {col.render
                            ? col.render(item, index)
                            : String((item as Record<string, unknown>)[col.id] ?? '')}
                        </div>
                      </td>
                    );
                  })}

                  {/* Cột thao tác (Sửa / Xóa) - GHIM CỐ ĐỊNH BÊN PHẢI (STICKY RIGHT) */}
                  {showActionsColumn && (onEdit || onDelete) && (
                    <td
                      style={{ width: '90px', minWidth: '90px', maxWidth: '90px', right: 0 }}
                      className={`sticky right-0 z-20 py-2 px-2 text-center align-top border-b border-l-2 border-l-blue-500/60 border-r border-slate-700/80 shadow-[-4px_0_12px_rgba(0,0,0,0.65)] ${
                        index % 2 === 0 ? 'bg-[#0f172a]' : 'bg-[#0a101f]'
                      } group-hover:bg-[#162544]`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            title="Chỉnh sửa dữ liệu"
                            className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            title="Xóa dữ liệu"
                            className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
