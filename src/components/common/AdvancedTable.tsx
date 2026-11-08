import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Pin, 
  Search, 
  X, 
  Edit3, 
  Trash2, 
  Plus, 
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Check
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

  // ==================== 1. QUẢN LÝ CẤU HÌNH CỘT (THỨ TỰ, ẨN/HIỆN, GHIM) ====================
  const colConfigStorageKey = useMemo(() => {
    if (tableId) return `projectm_table_col_config_${tableId}`;
    const colSignature = initialColumns.map((c) => c.id).join('_');
    return `projectm_table_col_config_${colSignature}`;
  }, [tableId, initialColumns]);

  // Thứ tự sắp xếp các cột (mảng các id)
  const [colOrder, setColOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(colConfigStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.order)) {
          const existing = parsed.order.filter((id: string) => initialColumns.some((c) => c.id === id));
          const missing = initialColumns.map((c) => c.id).filter((id) => !existing.includes(id));
          return [...existing, ...missing];
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc colOrder từ localStorage:', e);
    }
    return initialColumns.map((c) => c.id);
  });

  // Danh sách các cột bị ẩn (mảng các id)
  const [hiddenCols, setHiddenCols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(colConfigStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.hidden)) {
          return parsed.hidden;
        }
      }
    } catch (_) {}
    return [];
  });

  // Cột mốc để ghim cố định (Freeze Panes - ghim từ cột đầu đến cột này)
  const [freezeColId, setFreezeColId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(colConfigStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.freezeColId !== undefined) {
          return parsed.freezeColId;
        }
      }
    } catch (_) {}
    // Mặc định ban đầu: cột cuối cùng có pinned === true
    let lastPinned: string | null = null;
    initialColumns.forEach((c) => {
      if (c.pinned) lastPinned = c.id;
    });
    return lastPinned;
  });

  // Lưu cấu hình cột vào localStorage
  const saveColConfig = useCallback(
    (newOrder: string[], newHidden: string[], newFreezeId: string | null) => {
      try {
        localStorage.setItem(
          colConfigStorageKey,
          JSON.stringify({ order: newOrder, hidden: newHidden, freezeColId: newFreezeId })
        );
      } catch (err) {
        console.error('Lỗi lưu colConfig:', err);
      }
    },
    [colConfigStorageKey]
  );

  // Danh sách toàn bộ các cột theo thứ tự đã sắp xếp
  const orderedAllColumns = useMemo(() => {
    const colMap = new Map(initialColumns.map((c) => [c.id, c]));
    const result: AdvancedColumn<T>[] = [];
    colOrder.forEach((id) => {
      const col = colMap.get(id);
      if (col) result.push(col);
    });
    // Bổ sung cột mới xuất hiện nếu có
    initialColumns.forEach((c) => {
      if (!result.some((col) => col.id === c.id)) {
        result.push(c);
      }
    });
    return result;
  }, [initialColumns, colOrder]);

  // Các cột đang thực sự hiển thị trên bảng
  const visibleColumns = useMemo(() => {
    const hiddenSet = new Set(hiddenCols);
    const filtered = orderedAllColumns.filter((c) => !hiddenSet.has(c.id));
    // Giữ ít nhất 1 cột hiển thị tránh trống trơn
    return filtered.length > 0 ? filtered : orderedAllColumns.slice(0, 1);
  }, [orderedAllColumns, hiddenCols]);

  // Chỉ số ghim cột lũy tiến trong mảng visibleColumns
  const freezeIndex = useMemo(() => {
    if (!freezeColId) return -1;
    return visibleColumns.findIndex((c) => c.id === freezeColId);
  }, [visibleColumns, freezeColId]);

  // Menu tùy chỉnh cột dạng popover
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const configMenuRef = useRef<HTMLDivElement>(null);

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    if (!isConfigOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (configMenuRef.current && !configMenuRef.current.contains(e.target as Node)) {
        setIsConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isConfigOpen]);

  // Thao tác đổi thứ tự cột (Move Up / Move Down)
  const handleMoveCol = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= orderedAllColumns.length) return;

    const newOrder = [...orderedAllColumns.map((c) => c.id)];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    setColOrder(newOrder);
    saveColConfig(newOrder, hiddenCols, freezeColId);
  };

  // Thao tác bật / tắt hiển thị cột
  const handleToggleCol = (colId: string) => {
    let nextHidden: string[];
    if (hiddenCols.includes(colId)) {
      nextHidden = hiddenCols.filter((id) => id !== colId);
    } else {
      // Không cho ẩn nếu chỉ còn 1 cột hiển thị
      if (visibleColumns.length <= 1) return;
      nextHidden = [...hiddenCols, colId];
      // Nếu cột đang bị ẩn trùng với cột mốc ghim, bỏ ghim cột đó
      if (freezeColId === colId) {
        setFreezeColId(null);
        saveColConfig(colOrder, nextHidden, null);
        setHiddenCols(nextHidden);
        return;
      }
    }
    setHiddenCols(nextHidden);
    saveColConfig(colOrder, nextHidden, freezeColId);
  };

  // Thao tác chọn cột mốc ghim (Freeze Panes)
  const handleSelectFreezeCol = (colId: string | null) => {
    setFreezeColId(colId);
    saveColConfig(colOrder, hiddenCols, colId);
  };

  // Hiện tất cả các cột
  const handleShowAllCols = () => {
    setHiddenCols([]);
    saveColConfig(colOrder, [], freezeColId);
  };

  // Đặt lại mặc định toàn bộ cấu hình cột
  const handleResetColConfig = () => {
    const defaultOrder = initialColumns.map((c) => c.id);
    let defaultLastPinned: string | null = null;
    initialColumns.forEach((c) => {
      if (c.pinned) defaultLastPinned = c.id;
    });

    setColOrder(defaultOrder);
    setHiddenCols([]);
    setFreezeColId(defaultLastPinned);

    try {
      localStorage.removeItem(colConfigStorageKey);
    } catch (_) {}
  };

  // ==================== 2. QUẢN LÝ ĐỘ RỘNG CỘT (RESIZE) ====================
  const storageWidthKey = useMemo(() => {
    if (tableId) return `projectm_table_col_widths_${tableId}`;
    const colSignature = initialColumns.map((c) => c.id).join('_');
    return `projectm_table_col_widths_${colSignature}`;
  }, [tableId, initialColumns]);

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

  // Ref và trạng thái kéo giãn cột (Column Resizing)
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
        if (storageWidthKey) {
          localStorage.setItem(storageWidthKey, JSON.stringify(latestColWidthsRef.current));
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
      localStorage.removeItem(storageWidthKey);
    } catch (err) {
      console.error('Lỗi xóa colWidths khỏi localStorage:', err);
    }
  };

  const hasCustomWidths = useMemo(() => {
    return initialColumns.some(
      (col) => colWidths[col.id] !== undefined && colWidths[col.id] !== col.width
    );
  }, [initialColumns, colWidths]);

  // ==================== 3. TÍNH TOÁN OFFSET CÁC CỘT GHIM ====================
  const { pinnedOffsets, totalTableWidth } = useMemo(() => {
    const offsets: number[] = [];
    let currentLeft = 0;
    let totalW = 0;

    visibleColumns.forEach((col, idx) => {
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
  }, [visibleColumns, freezeIndex, colWidths, showActionsColumn, onEdit, onDelete]);

  // ==================== 4. TÌM KIẾM OUT-OF-ORDER ====================
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const tokens = searchTerm
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return data.filter((item) => {
      const rowTexts = visibleColumns
        .map((col) => {
          if (col.searchValue) return col.searchValue(item);
          const raw = (item as Record<string, unknown>)[col.id];
          return raw !== undefined && raw !== null ? String(raw) : '';
        })
        .join(' ')
        .toLowerCase();

      return tokens.every((token) => rowTexts.includes(token));
    });
  }, [data, searchTerm, visibleColumns]);

  // Cuộn ngang
  const scrollHorizontally = (delta: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Mobile card detection
  const isMobile = useIsMobile(1024);

  const mobileVisibleColumns = useMemo(() => {
    const explicitCols = visibleColumns.filter((c) => c.showOnMobileCard === true);
    if (explicitCols.length > 0) return explicitCols;
    return visibleColumns.filter((c) => c.id !== 'stt');
  }, [visibleColumns]);

  const mobileTitleColumn = useMemo(() => {
    return visibleColumns.find((c) => c.mobileCardTitle) || visibleColumns.find((c) => c.id === 'name') || visibleColumns[1] || visibleColumns[0];
  }, [visibleColumns]);

  return (
    <div className={`flex flex-col flex-1 min-h-0 h-full overflow-hidden ${className}`}>
      {/* THANH CÔNG CỤ: Bản ghi + Tùy chỉnh cột & Ghim + Cuộn ngang + Tìm kiếm + Nút Thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0d1424] px-3 py-2 rounded-xl border border-[#232f4e] shrink-0 mb-2 shadow-sm relative">
        <div className="min-w-0 flex items-center gap-2">
          <span className="text-xs bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40 font-mono font-bold shrink-0">
            {filteredData.length}/{data.length} bản ghi
          </span>
          {title && <div className="text-xs font-semibold text-slate-200 truncate">{title}</div>}
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* NÚT TÙY CHỈNH CỘT (HIỂN THỊ, THỨ TỰ & GHIM CỘT) */}
          <div className="relative" ref={configMenuRef}>
            <button
              type="button"
              onClick={() => setIsConfigOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                isConfigOpen || hiddenCols.length > 0 || freezeIndex >= 0
                  ? 'bg-blue-900/40 text-blue-300 border-blue-600/60 shadow-sm'
                  : 'bg-[#080d1a] hover:bg-[#14233c] text-slate-300 hover:text-white border-[#232f4e]'
              }`}
              title="Tùy chỉnh bật/tắt cột, sắp xếp thứ tự và ghim cố định cột"
            >
              <SlidersHorizontal size={13} className="text-blue-400 shrink-0" />
              <span className="text-xs">Tùy chỉnh cột</span>
              {hiddenCols.length > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                  -{hiddenCols.length}
                </span>
              )}
              {freezeIndex >= 0 && (
                <Pin size={11} className="text-blue-400 rotate-45 shrink-0" />
              )}
            </button>

            {/* POPOVER TÙY CHỈNH CỘT */}
            {isConfigOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 p-3.5 space-y-3.5 text-slate-200">
                {/* Header Menu */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Tùy chỉnh Cột & Ghim Bảng
                    </span>
                  </div>
                  <button
                    onClick={() => setIsConfigOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Phần 1: Ghim cố định cột bên trái (Freeze Panes) */}
                <div className="space-y-1.5 bg-[#080d1a] p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                      <Pin size={12} className="text-blue-400 rotate-45" />
                      <span>Ghim cố định cột bên trái (Freeze Panes):</span>
                    </label>
                    {freezeIndex >= 0 && (
                      <button
                        onClick={() => handleSelectFreezeCol(null)}
                        className="text-[10px] text-amber-400 hover:underline"
                      >
                        Bỏ ghim
                      </button>
                    )}
                  </div>
                  <select
                    value={freezeColId || ''}
                    onChange={(e) => handleSelectFreezeCol(e.target.value || null)}
                    className="w-full bg-[#111c33] border border-slate-700 text-slate-100 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Không ghim cố định cột nào --</option>
                    {visibleColumns.map((col, idx) => (
                      <option key={col.id} value={col.id}>
                        Ghim từ cột đầu đến cột: {col.title} {col.unit ? `[${col.unit}]` : ''} ({idx + 1} cột)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 italic">
                    {freezeIndex >= 0
                      ? `Đang ghim cố định ${freezeIndex + 1} cột đầu khi cuộn ngang.`
                      : 'Chọn cột mốc để giữ cố định các cột bên trái khi cuộn bảng sang phải.'}
                  </p>
                </div>

                {/* Phần 2: Thứ tự & Bật/Tắt hiển thị cột */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span>Thứ tự & Bật/Tắt hiển thị cột:</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {visibleColumns.length}/{orderedAllColumns.length} cột hiển thị
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded-lg p-1.5 bg-[#080d1a]">
                    {orderedAllColumns.map((col, idx) => {
                      const isHidden = hiddenCols.includes(col.id);
                      const isPinned = !isHidden && visibleColumns.findIndex((c) => c.id === col.id) <= freezeIndex && freezeIndex >= 0;

                      return (
                        <div
                          key={col.id}
                          className={`flex items-center justify-between gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                            isHidden
                              ? 'bg-slate-900/60 text-slate-500'
                              : isPinned
                              ? 'bg-blue-950/40 border border-blue-800/40 text-slate-200'
                              : 'bg-[#0f172a] text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Checkbox Bật / Tắt */}
                          <label className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!isHidden}
                              onChange={() => handleToggleCol(col.id)}
                              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="truncate text-xs font-medium" title={col.title}>
                              {col.title}
                            </span>
                            {col.unit && (
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {col.unit}
                              </span>
                            )}
                            {isPinned && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-blue-900/70 text-blue-300 font-mono shrink-0">
                                Ghim
                              </span>
                            )}
                          </label>

                          {/* Nút di chuyển Thứ tự cột */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveCol(idx, 'up')}
                              disabled={idx === 0}
                              title="Di chuyển lên trước"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                            >
                              <ChevronUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCol(idx, 'down')}
                              disabled={idx === orderedAllColumns.length - 1}
                              title="Di chuyển xuống sau"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-20 disabled:hover:bg-transparent"
                            >
                              <ChevronDown size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Popover: Các nút hành động nhanh */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-xs">
                  <div className="flex items-center gap-2">
                    {hiddenCols.length > 0 && (
                      <button
                        type="button"
                        onClick={handleShowAllCols}
                        className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Hiện tất cả
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleResetColConfig}
                      className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw size={10} />
                      <span>Mặc định</span>
                    </button>
                  </div>

                  <AppButton size="sm" variant="primary" onClick={() => setIsConfigOpen(false)}>
                    Hoàn tất
                  </AppButton>
                </div>
              </div>
            )}
          </div>

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
          <div className="relative flex items-center min-w-[160px] sm:min-w-[220px]">
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

          {/* Nút thêm mới */}
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
                    {visibleColumns.find((c) => c.id === 'stt') && (
                      <span className="shrink-0 bg-slate-700/60 text-slate-300 text-[10px] font-mono font-bold w-6 h-6 flex items-center justify-center rounded-md border border-slate-600/50">
                        {(() => {
                          const sttCol = visibleColumns.find((c) => c.id === 'stt');
                          if (sttCol?.render) return sttCol.render(item, index);
                          return String((item as Record<string, unknown>)['stt'] ?? (index + 1));
                        })()}
                      </span>
                    )}
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
            {/* Header Bảng: Hoàn toàn không chứa icon ghim ở từng ô, căn giữa, đơn vị nhảy dòng, resizer ở mép phải */}
            <thead className="bg-[#141f36] p-0 m-0">
              <tr>
                {visibleColumns.map((col, idx) => {
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
                      {/* Header Content: Căn giữa, không có icon ghim */}
                      <div className="flex flex-col items-center justify-start min-h-[44px]">
                        <span className="font-semibold text-slate-100 tracking-wide text-center leading-tight">
                          {col.title}
                        </span>

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
                    colSpan={visibleColumns.length + (showActionsColumn && (onEdit || onDelete) ? 1 : 0)}
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
                    {visibleColumns.map((col, idx) => {
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
