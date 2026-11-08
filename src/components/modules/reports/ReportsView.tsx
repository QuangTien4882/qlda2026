import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  FileSpreadsheet,
  FolderSync,
  Upload,
  CheckCircle2,
  Share2,
  X, 
  Check, 
  Building2 
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { formatVnNumber } from '../../../utils/numberUtils';
import { parseCustomVnDate, formatCustomVnDate } from '../../../utils/dateUtils';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { VnDateInput } from '../../common/VnDateInput';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface FilterDropdownProps {
  label: string;
  selectedCount: number;
  totalCount: number;
  displayText?: string;
  isOpen: boolean;
  onToggle: () => void;
  onClear: (e: React.MouseEvent) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  align?: 'left' | 'right';
  popupWidth?: string;
  children: React.ReactNode;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  selectedCount,
  totalCount,
  displayText,
  isOpen,
  onToggle,
  onClear,
  searchTerm,
  onSearchChange,
  onSelectAll,
  isAllSelected,
  align = 'left',
  popupWidth = 'w-72',
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobileDropdown = useIsMobile(640);

  // Focus ô tìm kiếm mà không làm cuộn khung nhìn ngang/dọc
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }, [isOpen]);

  const titleText = displayText 
    ? displayText 
    : selectedCount === totalCount && totalCount > 0
    ? `${totalCount} mục đã chọn`
    : selectedCount === 0
    ? '0 mục đã chọn'
    : `${selectedCount} mục đã chọn`;

  // Nội dung bên trong popup (dùng chung cho cả mobile overlay và desktop dropdown)
  const popupContent = (
    <>
      {/* Tiêu đề popup trên mobile */}
      {isMobileDropdown && (
        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-[#232f4e]">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">{label}</span>
          <button
            type="button"
            onClick={onToggle}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search box in popup */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm..."
          className="w-full bg-[#060c18] border border-[#1e2c4c] focus:border-blue-500 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-100 placeholder:italic placeholder:text-slate-500 focus:outline-none"
        />
        <Search size={13} className="absolute left-2 top-2.5 text-slate-500" />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-2 text-slate-400 hover:text-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Select all option */}
      <div
        onClick={onSelectAll}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#142038] cursor-pointer text-xs font-semibold text-blue-300 border-b border-[#1b2b4c] pb-1.5"
      >
        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
          isAllSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500 bg-[#060c18]'
        }`}>
          {isAllSelected && <Check size={12} strokeWidth={3} />}
        </div>
        <span>Chọn tất cả</span>
      </div>

      {/* Options list */}
      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar text-xs">
        {children}
      </div>
    </>
  );

  return (
    <div className="relative flex-1 min-w-[130px]" ref={containerRef}>
      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1 truncate">
        {label}
      </label>
      <div
        onClick={onToggle}
        className={`h-9 px-2.5 rounded-lg bg-[#060c18] border flex items-center justify-between cursor-pointer select-none transition-colors text-xs ${
          isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-[#1e2c4c] hover:border-slate-500'
        }`}
      >
        <span className="truncate text-slate-200 font-medium mr-1" title={titleText}>
          {titleText}
        </span>
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="p-0.5 hover:text-rose-400 rounded transition-colors"
              title="Xóa lựa chọn"
            >
              <X size={13} />
            </button>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
        </div>
      </div>

      {/* POPUP MENU */}
      {isOpen && (
        isMobileDropdown ? (
          /* ===== MOBILE: Fixed overlay giữa màn hình ===== */
          <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onToggle}>
            <div className="absolute inset-0 bg-black/50" />
            <div 
              className="relative w-full max-w-md bg-[#0c1424] border border-[#232f4e] rounded-t-2xl shadow-2xl p-3 space-y-1.5 animate-in slide-in-from-bottom duration-200 mb-0 pb-6"
              onClick={(e) => e.stopPropagation()}
            >
              {popupContent}
            </div>
          </div>
        ) : (
          /* ===== DESKTOP: Absolute dropdown ===== */
          <div 
            className={`absolute top-full mt-1.5 ${popupWidth} max-w-[90vw] bg-[#0c1424] border border-[#232f4e] rounded-xl shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 ${
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
            }`}
          >
            {popupContent}
          </div>
        )
      )}
    </div>
  );
};

export const ReportsView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { 
    projects, 
    costPackages, 
    inspections, 
    getEffectiveContractValue,
    getContractAppendicesByPackage,
    lastSavedTime,
    importDatabaseFromJson,
    inspectBackupPackage,
    applyRestoreBackupPackage
  } = useData();
  const isMobile = useIsMobile(1024);

  // Thao tác cập nhật nhanh từ Google Drive / Tệp
  const driveFileInputRef = useRef<HTMLInputElement>(null);
  const [updateFeedback, setUpdateFeedback] = useState<string | null>(null);
  const [isUpdatingFromDrive, setIsUpdatingFromDrive] = useState(false);

  const handleDriveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsUpdatingFromDrive(true);
    try {
      if (file.name.endsWith('.projectm') || file.name.endsWith('.zip')) {
        const inspected = await inspectBackupPackage(file);
        if (inspected.isValid) {
          const res = await applyRestoreBackupPackage(inspected);
          if (res.success) {
            setUpdateFeedback(`Đã nạp ${inspected.stats.projectsCount} dự án từ gói sao lưu!`);
            setTimeout(() => setUpdateFeedback(null), 4000);
          } else {
            alert(res.message);
          }
        } else {
          alert(inspected.errorMessage || 'File không hợp lệ');
        }
      } else {
        const res = await importDatabaseFromJson(file);
        if (res.success) {
          setUpdateFeedback(`Đã cập nhật số liệu mới nhất từ Google Drive!`);
          setTimeout(() => setUpdateFeedback(null), 4000);
        } else {
          alert(res.message);
        }
      }
    } catch (err) {
      alert(`Lỗi khi nạp dữ liệu: ${err instanceof Error ? err.message : 'Không xác định'}`);
    } finally {
      setIsUpdatingFromDrive(false);
    }
  };

  useEffect(() => {
    setHeaderTitle('BÁO CÁO NGHIỆM THU DỰ ÁN');
  }, [setHeaderTitle]);

  // Search input ở góc trên phải
  const [globalSearch, setGlobalSearch] = useState('');

  // 1. Khoảng thời gian
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 2. Dự án (multi-select)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() => projects.map((p) => p.id));
  const [projectSearch, setProjectSearch] = useState('');

  // 3. Nội dung chi phí / Tên gói thầu (multi-select)
  const [selectedCostContents, setSelectedCostContents] = useState<string[]>([]);
  const [costContentSearch, setCostContentSearch] = useState('');

  // 4. KMCP (Khoản mục chi phí: XD, TVXD, K, GPMB)
  const [selectedKmcps, setSelectedKmcps] = useState<string[]>(['XD', 'TVXD', 'K']);
  const [kmcpSearch, setKmcpSearch] = useState('');

  // 5. LOẠI CP (Loại chi phí: Chi phí, Phí/Lệ phí)
  const [selectedCostTypes, setSelectedCostTypes] = useState<string[]>(['Chi phí', 'Phí']);
  const [costTypeSearch, setCostTypeSearch] = useState('');

  // Dropdown open states: 'project' | 'content' | 'kmcp' | 'costType' | null
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Thu gọn / mở rộng từng dự án trong bảng
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  const filterContainerRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (filterContainerRef.current && !filterContainerRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, []);

  // Lấy danh sách tất cả các tên gói thầu / nội dung chi phí độc nhất
  const allUniqueCostContents = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((proj) => {
      const pkgs = costPackages[proj.id] || [];
      pkgs.forEach((p) => {
        if (p.content && p.content.trim()) {
          set.add(p.content.trim());
        }
      });
    });
    return Array.from(set).sort();
  }, [projects, costPackages]);

  // Khởi tạo mặc định chọn tất cả nội dung chi phí
  useEffect(() => {
    if (allUniqueCostContents.length > 0 && selectedCostContents.length === 0) {
      setSelectedCostContents(allUniqueCostContents);
    }
  }, [allUniqueCostContents]);

  // Đồng bộ lại selectedProjectIds khi danh sách projects thay đổi
  useEffect(() => {
    if (projects.length > 0 && selectedProjectIds.length === 0) {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  }, [projects]);

  // Các tùy chọn KMCP chuẩn
  const kmcpOptions = useMemo(() => [
    { id: 'XD', label: 'Xây dựng' },
    { id: 'TVXD', label: 'TVXD' },
    { id: 'K', label: 'K' },
  ], []);

  // Các tùy chọn LOẠI CP chuẩn
  const costTypeOptions = useMemo(() => [
    { id: 'Chi phí', label: 'Chi phí' },
    { id: 'Phí', label: 'Phí/Lệ phí' },
  ], []);

  // ==================== TỔNG HỢP DỮ LIỆU BÁO CÁO THEO DỰ ÁN (HIERARCHY) ====================
  const reportData = useMemo(() => {
    const fromDate = startDate ? parseCustomVnDate(startDate) : null;
    const toDate = endDate ? parseCustomVnDate(endDate) : null;
    const kw = globalSearch.trim().toLowerCase();

    const resultProjects: Array<{
      projectId: string;
      projectStt: number;
      projectCode: string;
      projectName: string;
      contractTotal: number;
      inspTotal: number;
      payTotal: number;
      ratioNtHd: number;
      ratioTtNt: number;
      packages: Array<{
        packageId: string;
        subStt: string;
        content: string;
        contractor: string;
        category: string;
        costType: string;
        contractValue: number;
        inspectionValue: number;
        paymentValue: number;
        ratioNtHd: number;
        ratioTtNt: number;
      }>;
    }> = [];

    let grandContract = 0;
    let grandInsp = 0;
    let grandPay = 0;

    projects.forEach((proj, projIndex) => {
      // 1. Lọc theo Dự án được chọn
      if (!selectedProjectIds.includes(proj.id)) {
        return;
      }

      const pkgs = costPackages[proj.id] || [];
      const projInsps = inspections[proj.id] || [];

      const filteredPackages: Array<{
        packageId: string;
        subStt: string;
        content: string;
        contractor: string;
        category: string;
        costType: string;
        contractValue: number;
        inspectionValue: number;
        paymentValue: number;
        ratioNtHd: number;
        ratioTtNt: number;
      }> = [];

      let pContract = 0;
      let pInsp = 0;
      let pPay = 0;

      pkgs.forEach((cost, costIndex) => {
        // 2. Lọc theo Nội dung chi phí
        if (selectedCostContents.length > 0 && !selectedCostContents.includes(cost.content.trim())) {
          return;
        }

        // 3. Lọc theo KMCP (XD, TVXD, K)
        if (!selectedKmcps.includes(cost.category)) {
          return;
        }

        // 4. Lọc theo LOẠI CP (Chi phí vs Phí)
        if (!selectedCostTypes.includes(cost.costType)) {
          return;
        }

        // 5. Lọc theo từ khóa tìm kiếm (Tên gói thầu, nhà thầu, tên dự án)
        if (kw) {
          const matchContent = cost.content.toLowerCase().includes(kw);
          const matchContractor = (cost.contractor || '').toLowerCase().includes(kw);
          const matchProj = proj.name.toLowerCase().includes(kw) || proj.code.toLowerCase().includes(kw);
          if (!matchContent && !matchContractor && !matchProj) {
            return;
          }
        }

        // Giá trị hợp đồng hiệu lực sau PLHĐ
        const effectiveVal = getEffectiveContractValue(proj.id, cost.id);

        // Lấy danh sách nghiệm thu tương ứng
        const matchInsps = projInsps.filter((i) => {
          if (i.costPackageId && i.costPackageId === cost.id) return true;
          return i.packageName.trim().toLowerCase() === cost.content.trim().toLowerCase();
        });

        // Lọc theo khoảng thời gian nghiệm thu
        const inRangeInsps = matchInsps.filter((i) => {
          if (!i.inspectionDate) return true;
          const iDate = parseCustomVnDate(i.inspectionDate);
          if (!iDate) return true;
          if (fromDate && iDate.getTime() < fromDate.getTime()) return false;
          if (toDate && iDate.getTime() > toDate.getTime()) return false;
          return true;
        });

        const inspVal = inRangeInsps.reduce((s, i) => s + (Number(i.inspectionValue) || 0), 0);
        const payVal = inRangeInsps.reduce((s, i) => s + (Number(i.paymentValue) || 0), 0);

        const ratioNtHd = effectiveVal > 0 ? Number(((inspVal / effectiveVal) * 100).toFixed(1)) : 0;
        const ratioTtNt = inspVal > 0 
          ? Number(((payVal / inspVal) * 100).toFixed(1))
          : (effectiveVal > 0 && payVal > 0 ? Number(((payVal / effectiveVal) * 100).toFixed(1)) : 0);

        pContract += effectiveVal;
        pInsp += inspVal;
        pPay += payVal;

        filteredPackages.push({
          packageId: cost.id,
          subStt: `${projIndex + 1}.${costIndex + 1}`,
          content: cost.content,
          contractor: cost.contractor || '—',
          category: cost.category,
          costType: cost.costType,
          contractValue: effectiveVal,
          inspectionValue: inspVal,
          paymentValue: payVal,
          ratioNtHd,
          ratioTtNt,
        });
      });

      // Nếu có gói thầu thỏa mãn thì đưa dự án vào danh sách báo cáo
      if (filteredPackages.length > 0) {
        const pRatioNtHd = pContract > 0 ? Number(((pInsp / pContract) * 100).toFixed(1)) : 0;
        const pRatioTtNt = pInsp > 0 
          ? Number(((pPay / pInsp) * 100).toFixed(1))
          : (pContract > 0 && pPay > 0 ? Number(((pPay / pContract) * 100).toFixed(1)) : 0);

        grandContract += pContract;
        grandInsp += pInsp;
        grandPay += pPay;

        resultProjects.push({
          projectId: proj.id,
          projectStt: projIndex + 1,
          projectCode: proj.code,
          projectName: proj.name,
          contractTotal: pContract,
          inspTotal: pInsp,
          payTotal: pPay,
          ratioNtHd: pRatioNtHd,
          ratioTtNt: pRatioTtNt,
          packages: filteredPackages,
        });
      }
    });

    const grandRatioNtHd = grandContract > 0 ? Number(((grandInsp / grandContract) * 100).toFixed(1)) : 0;
    const grandRatioTtNt = grandInsp > 0 ? Number(((grandPay / grandInsp) * 100).toFixed(1)) : 0;

    return {
      projects: resultProjects,
      grandContract,
      grandInsp,
      grandPay,
      grandRatioNtHd,
      grandRatioTtNt,
    };
  }, [projects, costPackages, inspections, selectedProjectIds, selectedCostContents, selectedKmcps, selectedCostTypes, startDate, endDate, globalSearch, getEffectiveContractValue]);

  // Toggle thu gọn dự án
  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Hàm chia sẻ trực tiếp qua Zalo / Tin nhắn (trên Mobile) hoặc tải về máy
  const shareFileOrSaveAs = async (
    blob: Blob,
    fileName: string,
    mimeType: string,
    title: string,
    text: string
  ) => {
    try {
      const file = new File([blob], fileName, { type: mimeType });
      const navAny = navigator as unknown as { 
        canShare?: (data: unknown) => boolean; 
        share?: (data: unknown) => Promise<void> 
      };

      if (navAny.canShare && navAny.canShare({ files: [file] }) && navAny.share) {
        await navAny.share({
          files: [file],
          title,
          text,
        });
        return;
      }
    } catch (shareErr) {
      if ((shareErr as Error)?.name === 'AbortError') return;
      console.warn('Web Share không thực hiện được, chuyển sang tải file:', shareErr);
    }
    saveAs(blob, fileName);
  };

  // ==================== XUẤT FILE EXCEL (.XLS) VỚI ĐỊNH DẠNG CHUẨN BẢNG TÍNH ====================
  const handleExportExcel = async () => {
    if (reportData.projects.length === 0) {
      alert('Không có dữ liệu nào trong báo cáo để xuất Excel.');
      return;
    }

    const todayStr = formatCustomVnDate(new Date());
    const safeDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    let rowsHtml = '';
    reportData.projects.forEach((proj) => {
      // Dòng Dự án
      rowsHtml += `
        <tr style="background-color: #dbeafe; font-weight: bold;">
          <td style="text-align: center; border: 1px solid #94a3b8; font-weight: bold;">${proj.projectStt}</td>
          <td colspan="2" style="border: 1px solid #94a3b8; font-weight: bold; color: #1e40af;">${proj.projectName}</td>
          <td style="text-align: right; border: 1px solid #94a3b8; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${proj.contractTotal}</td>
          <td style="text-align: right; border: 1px solid #94a3b8; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${proj.inspTotal}</td>
          <td style="text-align: right; border: 1px solid #94a3b8; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${proj.payTotal}</td>
          <td style="text-align: center; border: 1px solid #94a3b8; font-weight: bold;">${proj.ratioNtHd.toFixed(1).replace('.', ',')}%</td>
          <td style="text-align: center; border: 1px solid #94a3b8; font-weight: bold;">${proj.ratioTtNt.toFixed(1).replace('.', ',')}%</td>
        </tr>
      `;

      // Các gói thầu con
      proj.packages.forEach((pkg) => {
        rowsHtml += `
          <tr>
            <td style="text-align: center; border: 1px solid #cbd5e1;">${pkg.subStt}</td>
            <td style="border: 1px solid #cbd5e1;">${pkg.content}</td>
            <td style="border: 1px solid #cbd5e1;">${pkg.contractor || '—'}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; mso-number-format:'\\#\\,\\#\\#0';">${pkg.contractValue}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; mso-number-format:'\\#\\,\\#\\#0';">${pkg.inspectionValue}</td>
            <td style="text-align: right; border: 1px solid #cbd5e1; mso-number-format:'\\#\\,\\#\\#0';">${pkg.paymentValue}</td>
            <td style="text-align: center; border: 1px solid #cbd5e1;">${pkg.ratioNtHd.toFixed(1).replace('.', ',')}%</td>
            <td style="text-align: center; border: 1px solid #cbd5e1;">${pkg.ratioTtNt.toFixed(1).replace('.', ',')}%</td>
          </tr>
        `;
      });
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>BaoCaoNghiemThuGiaiNgan</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Times New Roman', Arial; font-size: 11pt; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #0284c7; color: #ffffff; font-weight: bold; border: 1px solid #334155; padding: 8px; text-align: center; }
          td { padding: 6px; }
          .title { font-size: 14pt; font-weight: bold; text-align: center; color: #0f172a; }
          .subtitle { font-size: 10pt; font-style: italic; text-align: center; color: #475569; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="8" class="title">BÁO CÁO TỔNG HỢP TIẾN ĐỘ NGHIỆM THU VÀ GIẢI NGÂN CÁC DỰ ÁN</td>
          </tr>
          <tr>
            <td colspan="8" class="subtitle">Thời điểm lập báo cáo: ${todayStr} • Phần mềm Quản lý Dự án ProjectM</td>
          </tr>
          <tr><td colspan="8"></td></tr>
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th style="width: 320px;">DỰ ÁN / NỘI DUNG CHI PHÍ, GÓI THẦU</th>
              <th style="width: 240px;">ĐƠN VỊ THỰC HIỆN</th>
              <th style="width: 150px;">GIÁ TRỊ HỢP ĐỒNG (ĐỒNG)</th>
              <th style="width: 150px;">GIÁ TRỊ NGHIỆM THU (ĐỒNG)</th>
              <th style="width: 150px;">GIÁ TRỊ THANH TOÁN (ĐỒNG)</th>
              <th style="width: 90px;">TỶ LỆ NT/HĐ (%)</th>
              <th style="width: 90px;">TỶ LỆ TT/NT (%)</th>
            </tr>
            <tr style="background-color: #0369a1; color: white; font-weight: bold;">
              <td style="text-align: center; border: 1px solid #334155;">—</td>
              <td colspan="2" style="border: 1px solid #334155; font-weight: bold;">TỔNG CỘNG TOÀN BỘ (${reportData.projects.length} dự án)</td>
              <td style="text-align: right; border: 1px solid #334155; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${reportData.grandContract}</td>
              <td style="text-align: right; border: 1px solid #334155; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${reportData.grandInsp}</td>
              <td style="text-align: right; border: 1px solid #334155; font-weight: bold; mso-number-format:'\\#\\,\\#\\#0';">${reportData.grandPay}</td>
              <td style="text-align: center; border: 1px solid #334155; font-weight: bold;">${reportData.grandRatioNtHd.toFixed(1).replace('.', ',')}%</td>
              <td style="text-align: center; border: 1px solid #334155; font-weight: bold;">${reportData.grandRatioTtNt.toFixed(1).replace('.', ',')}%</td>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const fileName = `Bao_Cao_Giai_Ngan_${safeDate}.xls`;

    await shareFileOrSaveAs(
      blob,
      fileName,
      'application/vnd.ms-excel',
      'Báo cáo Nghiệm thu Giải ngân ProjectM',
      `Báo cáo tổng hợp số liệu nghiệm thu và giải ngân - Ngày ${todayStr}`
    );
  };

  // ==================== XUẤT FILE WORD (.DOC) ====================
  const handleExportWord = async () => {
    if (reportData.projects.length === 0) {
      alert('Không có dữ liệu nào trong báo cáo để xuất Word.');
      return;
    }

    const todayStr = formatCustomVnDate(new Date());
    const safeDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    let rowsHtml = '';
    reportData.projects.forEach((proj) => {
      // Dòng Dự án
      rowsHtml += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
          <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1;">${proj.projectStt}</td>
          <td colspan="2" style="padding: 6px; border: 1px solid #cbd5e1; color: #1e40af;">${proj.projectName}</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #cbd5e1;">${formatVnNumber(proj.contractTotal)}</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #cbd5e1;">${formatVnNumber(proj.inspTotal)}</td>
          <td style="text-align: right; padding: 6px; border: 1px solid #cbd5e1;">${formatVnNumber(proj.payTotal)}</td>
          <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1;">${proj.ratioNtHd}%</td>
          <td style="text-align: center; padding: 6px; border: 1px solid #cbd5e1;">${proj.ratioTtNt}%</td>
        </tr>
      `;

      // Các gói thầu con
      proj.packages.forEach((pkg) => {
        rowsHtml += `
          <tr>
            <td style="text-align: center; padding: 5px; border: 1px solid #cbd5e1;">${pkg.subStt}</td>
            <td style="padding: 5px; border: 1px solid #cbd5e1;">${pkg.content}</td>
            <td style="padding: 5px; border: 1px solid #cbd5e1;">${pkg.contractor}</td>
            <td style="text-align: right; padding: 5px; border: 1px solid #cbd5e1;">${formatVnNumber(pkg.contractValue)}</td>
            <td style="text-align: right; padding: 5px; border: 1px solid #cbd5e1;">${formatVnNumber(pkg.inspectionValue)}</td>
            <td style="text-align: right; padding: 5px; border: 1px solid #cbd5e1;">${formatVnNumber(pkg.paymentValue)}</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #cbd5e1;">${pkg.ratioNtHd}%</td>
            <td style="text-align: center; padding: 5px; border: 1px solid #cbd5e1;">${pkg.ratioTtNt}%</td>
          </tr>
        `;
      });
    });

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Báo cáo Nghiệm thu</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background-color: #e2e8f0; font-weight: bold; border: 1px solid #94a3b8; padding: 8px; text-align: center; }
          td { border: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0; text-transform: uppercase;">BÁO CÁO NGHIỆM THU VÀ GIẢI NGÂN CÁC GÓI THẦU</h2>
          <p style="margin: 5px 0; font-style: italic;">Tổng hợp số liệu thực hiện và nghiệm thu dự án đầu tư xây dựng</p>
          <p style="margin: 3px 0; font-size: 10pt;">Ngày lập báo cáo: ${todayStr}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px;">STT</th>
              <th>DỰ ÁN / NỘI DUNG CHI PHÍ</th>
              <th style="width: 200px;">ĐƠN VỊ THỰC HIỆN</th>
              <th style="width: 120px;">GIÁ TRỊ HỢP ĐỒNG (ĐỒNG)</th>
              <th style="width: 120px;">GIÁ TRỊ NGHIỆM THU (ĐỒNG)</th>
              <th style="width: 120px;">GIÁ TRỊ THANH TOÁN (ĐỒNG)</th>
              <th style="width: 70px;">TỶ LỆ NT/HĐ (%)</th>
              <th style="width: 70px;">TỶ LỆ TT/NT (%)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr style="background-color: #cbd5e1; font-weight: bold;">
              <td colspan="3" style="text-align: right; padding: 8px;">TỔNG CỘNG:</td>
              <td style="text-align: right; padding: 8px;">${formatVnNumber(reportData.grandContract)}</td>
              <td style="text-align: right; padding: 8px;">${formatVnNumber(reportData.grandInsp)}</td>
              <td style="text-align: right; padding: 8px;">${formatVnNumber(reportData.grandPay)}</td>
              <td style="text-align: center; padding: 8px;">${reportData.grandRatioNtHd}%</td>
              <td style="text-align: center; padding: 8px;">${reportData.grandRatioTtNt}%</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + wordContent], { type: 'application/msword;charset=utf-8' });
    const fileName = `Bao_Cao_Nghiem_Thu_${safeDate}.doc`;

    await shareFileOrSaveAs(
      blob,
      fileName,
      'application/msword',
      'Báo cáo Nghiệm thu Dự án (Word)',
      `Báo cáo nghiệm thu và giải ngân - Ngày ${todayStr}`
    );
  };

  return (
    <div className="space-y-3.5 overflow-y-auto overflow-x-hidden h-full pr-1 pb-10 print:p-0 print:overflow-visible">
      {/* 1. HEADER TITLE & SEARCH (Y HỆT HÌNH ẢNH SỐ 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100 tracking-wide">
            Báo cáo Nghiệm thu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tổng hợp số liệu thực hiện và nghiệm thu dự án
          </p>
        </div>

        {/* Ô Tìm dự án, nhà thầu... */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Tìm dự án, nhà thầu..."
            className="w-full bg-[#080e1c] border border-[#1e2c4c] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
          />
          <Search size={14} className="absolute left-2.5 top-2 text-slate-500" />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-white text-xs"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* THANH ĐỒNG BỘ NHANH: CẬP NHẬT SỐ LIỆU TỪ GOOGLE DRIVE / TỆP (DÀNH CHO ĐIỆN THOẠI & MÁY TÍNH) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0d1627] p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border border-blue-500/30 shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 shrink-0">
            <FolderSync size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
              <span>Đồng bộ Báo cáo Mobile & Google Drive</span>
              {updateFeedback && (
                <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {updateFeedback}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              {lastSavedTime ? `Thời gian lưu gần nhất: ${lastSavedTime}` : 'Sẵn sàng'} • Hiện có <strong className="text-blue-300">{projects.length}</strong> dự án trong máy
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={driveFileInputRef}
            type="file"
            accept=".json,.projectm"
            className="hidden"
            onChange={handleDriveFileChange}
          />
          <button
            type="button"
            onClick={() => driveFileInputRef.current?.click()}
            disabled={isUpdatingFromDrive}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-950/50 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            title="Chọn file projectm_data.json từ Google Drive hoặc bộ nhớ điện thoại để cập nhật số liệu mới nhất"
          >
            <Upload size={15} />
            <span>{isUpdatingFromDrive ? 'Đang nạp số liệu...' : 'Cập nhật từ Google Drive / Tệp'}</span>
          </button>
        </div>
      </div>

      {/* 2. THANH BỘ LỌC NGANG DUY NHẤT (THEO ĐÚNG HÌNH ẢNH 1, 2, 3, 4, 5) */}
      <div 
        ref={filterContainerRef}
        className="bg-[#0b1322] border border-[#232f4e] rounded-xl p-3 shadow-lg"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 items-end">
          {/* TỪ NGÀY */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Từ Ngày
            </label>
            <VnDateInput
              value={startDate}
              onChange={(val) => setStartDate(val)}
              placeholder="Từ ngày"
              inputClassName="!h-9 !py-0 !text-xs !bg-[#060c18] !border-[#1e2c4c] hover:!border-slate-500 focus:!border-blue-500 font-mono"
            />
          </div>

          {/* ĐẾN NGÀY */}
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Đến Ngày
            </label>
            <VnDateInput
              value={endDate}
              onChange={(val) => setEndDate(val)}
              placeholder="Đến ngày"
              inputClassName="!h-9 !py-0 !text-xs !bg-[#060c18] !border-[#1e2c4c] hover:!border-slate-500 focus:!border-blue-500 font-mono"
            />
          </div>

          {/* DỰ ÁN */}
          <FilterDropdown
            label="Dự Án"
            selectedCount={selectedProjectIds.length}
            totalCount={projects.length}
            isOpen={activeDropdown === 'project'}
            onToggle={() => setActiveDropdown(activeDropdown === 'project' ? null : 'project')}
            onClear={(e) => {
              e.stopPropagation();
              setSelectedProjectIds([]);
            }}
            searchTerm={projectSearch}
            onSearchChange={setProjectSearch}
            onSelectAll={() => {
              if (selectedProjectIds.length === projects.length) {
                setSelectedProjectIds([]);
              } else {
                setSelectedProjectIds(projects.map((p) => p.id));
              }
            }}
            isAllSelected={selectedProjectIds.length === projects.length && projects.length > 0}
          >
            {projects
              .filter((p) => p.name.toLowerCase().includes(projectSearch.toLowerCase()) || p.code.toLowerCase().includes(projectSearch.toLowerCase()))
              .map((p) => {
                const isSelected = selectedProjectIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectIds((prev) =>
                        prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      );
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142038] cursor-pointer text-xs text-slate-200 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500 bg-[#060c18]'
                    }`}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate" title={p.name}>{p.name}</span>
                  </div>
                );
              })}
          </FilterDropdown>

          {/* NỘI DUNG CHI PHÍ */}
          <FilterDropdown
            label="Nội Dung Chi Phí"
            selectedCount={selectedCostContents.length}
            totalCount={allUniqueCostContents.length}
            isOpen={activeDropdown === 'content'}
            onToggle={() => setActiveDropdown(activeDropdown === 'content' ? null : 'content')}
            onClear={(e) => {
              e.stopPropagation();
              setSelectedCostContents([]);
            }}
            searchTerm={costContentSearch}
            onSearchChange={setCostContentSearch}
            onSelectAll={() => {
              if (selectedCostContents.length === allUniqueCostContents.length) {
                setSelectedCostContents([]);
              } else {
                setSelectedCostContents(allUniqueCostContents);
              }
            }}
            isAllSelected={selectedCostContents.length === allUniqueCostContents.length && allUniqueCostContents.length > 0}
          >
            {allUniqueCostContents
              .filter((c) => c.toLowerCase().includes(costContentSearch.toLowerCase()))
              .map((content) => {
                const isSelected = selectedCostContents.includes(content);
                return (
                  <div
                    key={content}
                    onClick={() => {
                      setSelectedCostContents((prev) =>
                        prev.includes(content) ? prev.filter((c) => c !== content) : [...prev, content]
                      );
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142038] cursor-pointer text-xs text-slate-200 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500 bg-[#060c18]'
                    }`}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span className="truncate" title={content}>{content}</span>
                  </div>
                );
              })}
          </FilterDropdown>

          {/* KMCP */}
          <FilterDropdown
            label="KMCP"
            selectedCount={selectedKmcps.length}
            totalCount={kmcpOptions.length}
            displayText={selectedKmcps.length === kmcpOptions.length ? '3 mục...' : `${selectedKmcps.length} mục...`}
            isOpen={activeDropdown === 'kmcp'}
            onToggle={() => setActiveDropdown(activeDropdown === 'kmcp' ? null : 'kmcp')}
            onClear={(e) => {
              e.stopPropagation();
              setSelectedKmcps([]);
            }}
            searchTerm={kmcpSearch}
            onSearchChange={setKmcpSearch}
            onSelectAll={() => {
              if (selectedKmcps.length === kmcpOptions.length) {
                setSelectedKmcps([]);
              } else {
                setSelectedKmcps(kmcpOptions.map((k) => k.id));
              }
            }}
            isAllSelected={selectedKmcps.length === kmcpOptions.length}
            align="right"
            popupWidth="w-60"
          >
            {kmcpOptions
              .filter((k) => k.label.toLowerCase().includes(kmcpSearch.toLowerCase()))
              .map((item) => {
                const isSelected = selectedKmcps.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedKmcps((prev) =>
                        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                      );
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142038] cursor-pointer text-xs text-slate-200 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500 bg-[#060c18]'
                    }`}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span>{item.label}</span>
                  </div>
                );
              })}
          </FilterDropdown>

          {/* LOẠI CP */}
          <FilterDropdown
            label="Loại CP"
            selectedCount={selectedCostTypes.length}
            totalCount={costTypeOptions.length}
            displayText={selectedCostTypes.length === costTypeOptions.length ? 'Chi phí...' : `${selectedCostTypes.join(', ')}`}
            isOpen={activeDropdown === 'costType'}
            onToggle={() => setActiveDropdown(activeDropdown === 'costType' ? null : 'costType')}
            onClear={(e) => {
              e.stopPropagation();
              setSelectedCostTypes([]);
            }}
            searchTerm={costTypeSearch}
            onSearchChange={setCostTypeSearch}
            onSelectAll={() => {
              if (selectedCostTypes.length === costTypeOptions.length) {
                setSelectedCostTypes([]);
              } else {
                setSelectedCostTypes(costTypeOptions.map((c) => c.id));
              }
            }}
            isAllSelected={selectedCostTypes.length === costTypeOptions.length}
            align="right"
            popupWidth="w-56"
          >
            {costTypeOptions
              .filter((c) => c.label.toLowerCase().includes(costTypeSearch.toLowerCase()))
              .map((item) => {
                const isSelected = selectedCostTypes.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedCostTypes((prev) =>
                        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                      );
                    }}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-[#142038] cursor-pointer text-xs text-slate-200 transition-colors"
                  >
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-500 bg-[#060c18]'
                    }`}>
                      {isSelected && <Check size={11} strokeWidth={3} />}
                    </div>
                    <span>{item.label}</span>
                  </div>
                );
              })}
          </FilterDropdown>
        </div>
      </div>

      {/* 3. NĂM THẺ KPI MÀU RỰC RỠ NẰM NGANG (THEO ĐÚNG HÌNH ẢNH 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Thẻ 1: TỔNG GT HỢP ĐỒNG (Xanh dương) */}
        <div className="bg-[#1d4ed8] text-white p-3 rounded-xl shadow-md space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
            TỔNG GT HỢP ĐỒNG
          </span>
          <div className="text-sm sm:text-base md:text-lg font-bold font-mono truncate" title={`${formatVnNumber(reportData.grandContract)} đ`}>
            {formatVnNumber(reportData.grandContract)} đ
          </div>
        </div>

        {/* Thẻ 2: TỔNG GT NGHIỆM THU (Xanh lá) */}
        <div className="bg-[#059669] text-white p-3 rounded-xl shadow-md space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
            TỔNG GT NGHIỆM THU
          </span>
          <div className="text-sm sm:text-base md:text-lg font-bold font-mono truncate" title={`${formatVnNumber(reportData.grandInsp)} đ`}>
            {formatVnNumber(reportData.grandInsp)} đ
          </div>
        </div>

        {/* Thẻ 3: TỔNG GT THANH TOÁN (Xanh Cyan) */}
        <div className="bg-[#0284c7] text-white p-3 rounded-xl shadow-md space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
            TỔNG GT THANH TOÁN
          </span>
          <div className="text-sm sm:text-base md:text-lg font-bold font-mono truncate" title={`${formatVnNumber(reportData.grandPay)} đ`}>
            {formatVnNumber(reportData.grandPay)} đ
          </div>
        </div>

        {/* Thẻ 4: TỶ LỆ NT/HĐ (Tím) */}
        <div className="bg-[#9333ea] text-white p-3 rounded-xl shadow-md space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
            TỶ LỆ NT/HĐ
          </span>
          <div className="text-sm sm:text-base md:text-lg font-bold font-mono">
            {reportData.grandRatioNtHd.toFixed(1).replace('.', ',')}%
          </div>
        </div>

        {/* Thẻ 5: TỶ LỆ TT/NT (Cam / Vàng) */}
        <div className="bg-[#d97706] text-white p-3 rounded-xl shadow-md space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
            TỶ LỆ TT/NT
          </span>
          <div className="text-sm sm:text-base md:text-lg font-bold font-mono">
            {reportData.grandRatioTtNt.toFixed(1).replace('.', ',')}%
          </div>
        </div>
      </div>

      {/* 4. NÚT XUẤT BÁO CÁO: EXCEL & WORD & CHIA SẺ TRỰC TIẾP */}
      <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
        <div className="text-xs text-slate-400 italic hidden sm:block">
          * Xuất số liệu tổng hợp nghiệm thu và thanh toán các dự án
        </div>
        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            title="Xuất file bảng tính Excel (.xls) và mở bảng chia sẻ Zalo/Email nếu trên điện thoại"
          >
            <FileSpreadsheet size={15} />
            <span>Xuất Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportWord}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg bg-[#2563eb] hover:bg-blue-600 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40 transition-all cursor-pointer"
            title="Xuất file văn bản Word (.doc)"
          >
            <FileText size={15} />
            <span>Xuất Word</span>
          </button>
        </div>
      </div>

      {/* 5. BẢNG PHÂN CẤP DỰ ÁN & GÓI THẦU */}
      {isMobile ? (
        /* ==================== MOBILE CARD VIEW (<1024px) ==================== */
        <div className="space-y-3">
          {reportData.projects.length === 0 ? (
            <div className="bg-[#0c1424] border border-[#232f4e] rounded-xl p-8 text-center text-slate-400 italic text-sm">
              Không tìm thấy dữ liệu nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            reportData.projects.map((proj) => {
              const isCollapsed = !!collapsedProjects[proj.projectId];
              return (
                <div key={proj.projectId} className="bg-[#0c1424] border border-[#232f4e] rounded-xl overflow-hidden shadow-lg">
                  {/* Header dự án - bấm để mở rộng/thu gọn */}
                  <div 
                    onClick={() => toggleProjectCollapse(proj.projectId)}
                    className="flex items-start gap-2 p-3 bg-[#0f1b33] cursor-pointer active:bg-[#142342] transition-colors"
                  >
                    <span className="shrink-0 bg-blue-900/60 text-blue-300 text-[10px] font-mono font-bold w-6 h-6 flex items-center justify-center rounded-md border border-blue-700/40 mt-0.5">
                      {proj.projectStt}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-sm font-bold text-blue-400 leading-snug">
                        {isCollapsed ? (
                          <ChevronRight size={14} className="shrink-0" />
                        ) : (
                          <ChevronDown size={14} className="shrink-0" />
                        )}
                        <span className="break-words">{proj.projectName}</span>
                      </div>
                      {/* Tóm tắt số liệu dự án */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-500">GT HĐ:</span>
                          <span className="text-slate-100 font-mono font-semibold">{formatVnNumber(proj.contractTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">GT NT:</span>
                          <span className="text-emerald-400 font-mono font-semibold">{formatVnNumber(proj.inspTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">GT TT:</span>
                          <span className="text-cyan-400 font-mono font-semibold">{formatVnNumber(proj.payTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">NT/HĐ:</span>
                          <span className="text-purple-400 font-mono font-semibold">{proj.ratioNtHd.toFixed(1).replace('.', ',')}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Các gói thầu con */}
                  {!isCollapsed && proj.packages.length > 0 && (
                    <div className="divide-y divide-[#1e2a4a]/40">
                      {proj.packages.map((pkg) => (
                        <div key={pkg.packageId} className="p-3 bg-[#080d1a] space-y-1.5">
                          {/* Dòng 1: STT + Tên gói thầu */}
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 text-[10px] font-mono text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded mt-0.5">
                              {pkg.subStt}
                            </span>
                            <span className="text-xs font-medium text-slate-200 break-words leading-snug">
                              {pkg.content}
                            </span>
                          </div>

                          {/* Dòng 2: Nhà thầu */}
                          {pkg.contractor && pkg.contractor !== '—' && (
                            <div className="flex items-start gap-1.5 pl-1 text-[11px]">
                              <Building2 size={11} className="text-slate-500 shrink-0 mt-0.5" />
                              <span className="text-slate-400 break-words">{pkg.contractor}</span>
                            </div>
                          )}

                          {/* Dòng 3: Số liệu dạng grid 2 cột */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] pl-1">
                            <div className="flex justify-between">
                              <span className="text-slate-500">GT HĐ:</span>
                              <span className="text-slate-200 font-mono">{formatVnNumber(pkg.contractValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">GT NT:</span>
                              <span className="text-emerald-400 font-mono">{formatVnNumber(pkg.inspectionValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">GT TT:</span>
                              <span className="text-cyan-400 font-mono">{formatVnNumber(pkg.paymentValue)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">NT/HĐ:</span>
                              <span className="text-slate-300 font-mono">{pkg.ratioNtHd.toFixed(1).replace('.', ',')}%</span>
                            </div>
                            <div className="flex justify-between col-span-2 sm:col-span-1">
                              <span className="text-slate-500">TT/NT:</span>
                              <span className="text-slate-300 font-mono">{pkg.ratioTtNt.toFixed(1).replace('.', ',')}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
      /* ==================== DESKTOP TABLE VIEW (>=1024px) ==================== */
      <div className="bg-[#0c1424] border border-[#232f4e] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Header Columns */}
            <thead className="bg-[#0f172a] text-slate-300 uppercase font-semibold border-b border-[#232f4e] select-none text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12 border-r border-[#1e2a4a]/50">STT</th>
                <th className="py-3 px-4 min-w-[280px] border-r border-[#1e2a4a]/50">DỰ ÁN / NỘI DUNG CHI PHÍ</th>
                <th className="py-3 px-4 w-60 border-r border-[#1e2a4a]/50">ĐƠN VỊ THỰC HIỆN</th>
                <th className="py-3 px-3 text-right w-36 border-r border-[#1e2a4a]/50">
                  <div>GIÁ TRỊ HỢP ĐỒNG</div>
                  <div className="text-[9px] font-normal text-slate-400 lowercase">(đồng)</div>
                </th>
                <th className="py-3 px-3 text-right w-36 border-r border-[#1e2a4a]/50">
                  <div>GIÁ TRỊ NGHIỆM THU</div>
                  <div className="text-[9px] font-normal text-slate-400 lowercase">(đồng)</div>
                </th>
                <th className="py-3 px-3 text-right w-36 border-r border-[#1e2a4a]/50">
                  <div>GIÁ TRỊ THANH TOÁN</div>
                  <div className="text-[9px] font-normal text-slate-400 lowercase">(đồng)</div>
                </th>
                <th className="py-3 px-2.5 text-center w-20 border-r border-[#1e2a4a]/50">
                  <div>TỶ LỆ NT/HĐ</div>
                  <div className="text-[9px] font-normal text-slate-400">(%)</div>
                </th>
                <th className="py-3 px-2.5 text-center w-20">
                  <div>TỶ LỆ TT/NT</div>
                  <div className="text-[9px] font-normal text-slate-400">(%)</div>
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-[#1e2a4a]/60">
              {reportData.projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy dữ liệu nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                reportData.projects.map((proj) => {
                  const isCollapsed = !!collapsedProjects[proj.projectId];
                  return (
                    <React.Fragment key={proj.projectId}>
                      {/* DÒNG CẤP 1: DỰ ÁN */}
                      <tr 
                        onClick={() => toggleProjectCollapse(proj.projectId)}
                        className="bg-[#0f1b33] hover:bg-[#142342] cursor-pointer transition-colors font-bold text-slate-100 border-b border-[#232f4e]"
                      >
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300 border-r border-[#1e2a4a]/50">
                          {proj.projectStt}
                        </td>
                        <td className="py-2.5 px-4 text-blue-400 border-r border-[#1e2a4a]/50">
                          <div className="flex items-center gap-1.5">
                            {isCollapsed ? (
                              <ChevronRight size={15} className="text-blue-400 shrink-0" />
                            ) : (
                              <ChevronDown size={15} className="text-blue-400 shrink-0" />
                            )}
                            <span className="hover:underline">{proj.projectName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-normal border-r border-[#1e2a4a]/50">—</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-100 border-r border-[#1e2a4a]/50">
                          {formatVnNumber(proj.contractTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 border-r border-[#1e2a4a]/50">
                          {formatVnNumber(proj.inspTotal)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-cyan-400 border-r border-[#1e2a4a]/50">
                          {formatVnNumber(proj.payTotal)}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-200 border-r border-[#1e2a4a]/50">
                          {proj.ratioNtHd.toFixed(1).replace('.', ',')}%
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-200">
                          {proj.ratioTtNt.toFixed(1).replace('.', ',')}%
                        </td>
                      </tr>

                      {/* DÒNG CẤP 2: CÁC GÓI THẦU */}
                      {!isCollapsed &&
                        proj.packages.map((pkg) => (
                          <tr 
                            key={pkg.packageId}
                            className="bg-[#080d1a] hover:bg-[#0d162b] transition-colors text-slate-300"
                          >
                            <td className="py-2 px-3 text-center font-mono text-slate-400 border-r border-[#1e2a4a]/40">
                              {pkg.subStt}
                            </td>
                            <td className="py-2 px-4 pl-8 font-normal text-slate-200 border-r border-[#1e2a4a]/40">
                              {pkg.content}
                            </td>
                            <td className="py-2 px-4 text-slate-300 text-[11px] leading-relaxed border-r border-[#1e2a4a]/40">
                              {pkg.contractor}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-200 border-r border-[#1e2a4a]/40">
                              {formatVnNumber(pkg.contractValue)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-400 border-r border-[#1e2a4a]/40">
                              {formatVnNumber(pkg.inspectionValue)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-cyan-400 border-r border-[#1e2a4a]/40">
                              {formatVnNumber(pkg.paymentValue)}
                            </td>
                            <td className="py-2 px-2.5 text-center font-mono border-r border-[#1e2a4a]/40">
                              {pkg.ratioNtHd.toFixed(1).replace('.', ',')}%
                            </td>
                            <td className="py-2 px-2.5 text-center font-mono">
                              {pkg.ratioTtNt.toFixed(1).replace('.', ',')}%
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
