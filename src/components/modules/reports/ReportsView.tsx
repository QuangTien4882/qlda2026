import React, { useState, useEffect, useMemo } from 'react';
import { AppCard } from '../../common/AppCard';
import { AppButton } from '../../common/AppButton';
import { AppBadge } from '../../common/AppBadge';
import { VnDateInput } from '../../common/VnDateInput';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Filter, 
  Building2, 
  Calendar, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  Percent,
  DollarSign,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { formatVnNumber } from '../../../utils/numberUtils';
import { parseCustomVnDate, formatCustomVnDate } from '../../../utils/dateUtils';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { CostCategory, CostType } from '../../../types/project';

export const ReportsView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { 
    projects, 
    costPackages, 
    inspections, 
    getEffectiveContractValue,
    getContractAppendicesByPackage
  } = useData();

  useEffect(() => {
    setHeaderTitle('BÁO CÁO TỔNG HỢP SỐ LIỆU GÓI THẦU DỰ ÁN');
  }, [setHeaderTitle]);

  // ==================== BỘ LỌC BÁO CÁO ====================
  // 1. Lọc theo Dự án (Hỗ trợ 1 hoặc nhiều dự án, mặc định chọn tất cả)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(() => projects.map((p) => p.id));
  
  // Tự động cập nhật nếu danh sách dự án thay đổi
  useEffect(() => {
    if (selectedProjectIds.length === 0 && projects.length > 0) {
      setSelectedProjectIds(projects.map((p) => p.id));
    }
  }, [projects]);

  // 2. Lọc theo Khoảng thời gian (Từ ngày - Đến ngày)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // 3. Lọc theo Phân loại Chi phí vs Phí
  const [selectedCostType, setSelectedCostType] = useState<'all' | CostType>('all');

  // 4. Lọc theo Loại chi phí / Khoản mục (TVXD, XD, K)
  const [selectedCategories, setSelectedCategories] = useState<CostCategory[]>(['TVXD', 'XD', 'K']);

  // 5. Tìm kiếm từ khóa gói thầu / nhà thầu
  const [keyword, setKeyword] = useState<string>('');

  // 6. Lựa chọn các gói thầu cụ thể cần báo cáo (Set các packageId)
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [isAllPackagesSelected, setIsAllPackagesSelected] = useState<boolean>(true);

  // Toggle thu gọn / mở rộng bộ lọc
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(true);
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState<boolean>(false);
  const [isPackageFilterOpen, setIsPackageFilterOpen] = useState<boolean>(false);

  // ==================== TÍNH TOÁN DỮ LIỆU BÁO CÁO ====================
  // Lấy toàn bộ danh sách gói thầu thô của các dự án được chọn
  const rawPackagesList = useMemo(() => {
    const list: Array<{
      projectId: string;
      projectCode: string;
      projectName: string;
      packageId: string;
      content: string;
      category: CostCategory;
      costType: CostType;
      contractor: string;
      contractNumber: string;
      contractDate: string;
      effectiveContractValue: number;
      appendixCount: number;
    }> = [];

    projects.forEach((proj) => {
      // Chỉ xét các dự án nằm trong bộ lọc dự án
      if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(proj.id)) {
        return;
      }

      const pkgs = costPackages[proj.id] || [];
      pkgs.forEach((cost) => {
        // Lọc Phân loại Chi phí / Phí
        if (selectedCostType !== 'all' && cost.costType !== selectedCostType) {
          return;
        }

        // Lọc Khoản mục TVXD, XD, K
        if (!selectedCategories.includes(cost.category)) {
          return;
        }

        const effectiveVal = getEffectiveContractValue(proj.id, cost.id);
        const apps = getContractAppendicesByPackage(proj.id, cost.id);

        list.push({
          projectId: proj.id,
          projectCode: proj.code,
          projectName: proj.name,
          packageId: cost.id,
          content: cost.content,
          category: cost.category,
          costType: cost.costType,
          contractor: cost.contractor || 'Chưa xác định',
          contractNumber: cost.contractNumber || '—',
          contractDate: cost.contractDate || '—',
          effectiveContractValue: effectiveVal,
          appendixCount: apps.length,
        });
      });
    });

    return list;
  }, [projects, selectedProjectIds, selectedCostType, selectedCategories, costPackages, getEffectiveContractValue, getContractAppendicesByPackage]);

  // Khởi tạo danh sách gói thầu được chọn mặc định là tất cả
  useEffect(() => {
    if (isAllPackagesSelected) {
      setSelectedPackageIds(rawPackagesList.map((p) => p.packageId));
    }
  }, [rawPackagesList, isAllPackagesSelected]);

  // Tính toán số liệu báo cáo chi tiết sau khi lọc theo ngày và chọn gói thầu
  const reportRows = useMemo(() => {
    const fromDate = startDate ? parseCustomVnDate(startDate) : null;
    const toDate = endDate ? parseCustomVnDate(endDate) : null;

    return rawPackagesList
      .filter((pkg) => {
        // Lọc theo gói thầu được chọn
        if (!isAllPackagesSelected && !selectedPackageIds.includes(pkg.packageId)) {
          return false;
        }

        // Lọc theo từ khóa tìm kiếm
        if (keyword.trim()) {
          const kw = keyword.toLowerCase().trim();
          const matchContent = pkg.content.toLowerCase().includes(kw);
          const matchContractor = pkg.contractor.toLowerCase().includes(kw);
          const matchProj = pkg.projectName.toLowerCase().includes(kw) || pkg.projectCode.toLowerCase().includes(kw);
          if (!matchContent && !matchContractor && !matchProj) {
            return false;
          }
        }

        return true;
      })
      .map((pkg) => {
        // Lấy danh sách nghiệm thu của gói thầu này
        const projInsps = inspections[pkg.projectId] || [];
        const matchInsps = projInsps.filter((i) => {
          if (i.costPackageId && i.costPackageId === pkg.packageId) return true;
          return i.packageName.trim().toLowerCase() === pkg.content.trim().toLowerCase();
        });

        // Lọc các đợt nghiệm thu rơi vào khoảng thời gian chọn
        const filteredInsps = matchInsps.filter((insp) => {
          if (!insp.inspectionDate) return true;
          const iDate = parseCustomVnDate(insp.inspectionDate);
          if (!iDate) return true;

          if (fromDate && iDate.getTime() < fromDate.getTime()) {
            return false;
          }
          if (toDate && iDate.getTime() > toDate.getTime()) {
            return false;
          }
          return true;
        });

        const totalInspVal = filteredInsps.reduce((s, i) => s + (Number(i.inspectionValue) || 0), 0);
        const totalPayVal = filteredInsps.reduce((s, i) => s + (Number(i.paymentValue) || 0), 0);

        // Tỷ lệ NT/HĐ: Nghiệm thu / Hợp đồng (%)
        const ratioNtHd = pkg.effectiveContractValue > 0
          ? Number(((totalInspVal / pkg.effectiveContractValue) * 100).toFixed(1))
          : 0;

        // Tỷ lệ TT/NT: Thanh toán / Nghiệm thu (%)
        const ratioTtNt = totalInspVal > 0
          ? Number(((totalPayVal / totalInspVal) * 100).toFixed(1))
          : (pkg.effectiveContractValue > 0 && totalPayVal > 0
              ? Number(((totalPayVal / pkg.effectiveContractValue) * 100).toFixed(1))
              : 0);

        return {
          ...pkg,
          inspectionValue: totalInspVal,
          paymentValue: totalPayVal,
          ratioNtHd,
          ratioTtNt,
          inspCount: filteredInsps.length,
        };
      });
  }, [rawPackagesList, isAllPackagesSelected, selectedPackageIds, keyword, inspections, startDate, endDate]);

  // ==================== TỔNG CỘNG TOÀN BỘ BÁO CÁO ====================
  const reportTotals = useMemo(() => {
    let contractTotal = 0;
    let inspTotal = 0;
    let payTotal = 0;

    reportRows.forEach((row) => {
      contractTotal += row.effectiveContractValue;
      inspTotal += row.inspectionValue;
      payTotal += row.paymentValue;
    });

    const avgRatioNtHd = contractTotal > 0
      ? Number(((inspTotal / contractTotal) * 100).toFixed(1))
      : 0;

    const avgRatioTtNt = inspTotal > 0
      ? Number(((payTotal / inspTotal) * 100).toFixed(1))
      : 0;

    return {
      contractTotal,
      inspTotal,
      payTotal,
      avgRatioNtHd,
      avgRatioTtNt,
      rowCount: reportRows.length,
    };
  }, [reportRows]);

  // ==================== CÁC HÀM XỬ LÝ SỰ KIỆN LỌC ====================
  // Chọn / bỏ chọn 1 dự án
  const handleToggleProject = (projId: string) => {
    setSelectedProjectIds((prev) => {
      if (prev.includes(projId)) {
        // Không cho phép bỏ chọn hết (giữ lại ít nhất 1)
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== projId);
      } else {
        return [...prev, projId];
      }
    });
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
  };

  // Chọn / bỏ chọn khoản mục TVXD, XD, K
  const handleToggleCategory = (cat: CostCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  // Chọn / bỏ chọn gói thầu
  const handleTogglePackage = (pkgId: string) => {
    setIsAllPackagesSelected(false);
    setSelectedPackageIds((prev) => {
      if (prev.includes(pkgId)) {
        return prev.filter((id) => id !== pkgId);
      } else {
        return [...prev, pkgId];
      }
    });
  };

  const handleSelectAllPackages = () => {
    setIsAllPackagesSelected(true);
    setSelectedPackageIds(rawPackagesList.map((p) => p.packageId));
  };

  const handleDeselectAllPackages = () => {
    setIsAllPackagesSelected(false);
    setSelectedPackageIds([]);
  };

  // Đặt lại toàn bộ bộ lọc về mặc định
  const handleResetFilters = () => {
    setSelectedProjectIds(projects.map((p) => p.id));
    setStartDate('');
    setEndDate('');
    setSelectedCostType('all');
    setSelectedCategories(['TVXD', 'XD', 'K']);
    setKeyword('');
    setIsAllPackagesSelected(true);
    setSelectedPackageIds(rawPackagesList.map((p) => p.packageId));
  };

  // Xuất file CSV (Tương thích Excel tiếng Việt UTF-8 BOM)
  const handleExportCsv = () => {
    if (reportRows.length === 0) {
      alert('Không có dữ liệu gói thầu nào trong báo cáo để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Mã Dự Án',
      'Tên Dự Án',
      'Tên Gói Thầu / Nội Dung Chi Phí',
      'Khoản Mục',
      'Phân Loại',
      'Đơn Vị Thực Hiện (Nhà Thầu)',
      'Số Hợp Đồng',
      'Ngày Ký HĐ',
      'Giá Trị Hợp Đồng (đồng)',
      'Giá Trị Nghiệm Thu (đồng)',
      'Giá Trị Thanh Toán (đồng)',
      'Tỷ Lệ NT/HĐ (%)',
      'Tỷ Lệ TT/NT (%)'
    ];

    const rows = reportRows.map((r, idx) => [
      idx + 1,
      `"${r.projectCode}"`,
      `"${r.projectName.replace(/"/g, '""')}"`,
      `"${r.content.replace(/"/g, '""')}"`,
      r.category,
      r.costType,
      `"${r.contractor.replace(/"/g, '""')}"`,
      `"${r.contractNumber}"`,
      r.contractDate,
      r.effectiveContractValue,
      r.inspectionValue,
      r.paymentValue,
      r.ratioNtHd,
      r.ratioTtNt
    ]);

    // Thêm dòng tổng cộng
    rows.push([
      'TỔNG CỘNG',
      '',
      '',
      `"${reportTotals.rowCount} gói thầu"`,
      '',
      '',
      '',
      '',
      '',
      reportTotals.contractTotal,
      reportTotals.inspTotal,
      reportTotals.payTotal,
      reportTotals.avgRatioNtHd,
      reportTotals.avgRatioTtNt
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Goi_Thau_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 overflow-y-auto h-full pr-1 pb-10 print:p-0 print:overflow-visible">
      {/* 1. TIÊU ĐỀ TRANG & CÁC NÚT THAO TÁC XUẤT BÁO CÁO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0c1322] p-4 rounded-xl border border-[#232f4e] shadow-md print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide">
                Báo Cáo Tổng Hợp Số Liệu Các Gói Thầu
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiểm soát đơn vị thực hiện, giá trị hợp đồng, nghiệm thu, thanh toán và tỷ lệ giải ngân
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AppButton 
            variant="outline" 
            size="sm" 
            icon={<Printer size={15} />} 
            onClick={handlePrint}
            className="text-xs"
          >
            In báo cáo
          </AppButton>
          <AppButton
            variant="success"
            size="sm"
            icon={<Download size={15} />}
            onClick={handleExportCsv}
            className="text-xs font-semibold shadow-md shadow-emerald-950/60"
          >
            Xuất Excel (.CSV)
          </AppButton>
        </div>
      </div>

      {/* 2. BỘ LỌC ĐA TIÊU CHÍ (PROJECTS, KHOẢNG THỜI GIAN, GÓI THẦU, TVXD/XD/K, CHI PHÍ/PHÍ) */}
      <div className="bg-[#0c1424] border border-[#232f4e] rounded-xl p-3.5 space-y-3.5 shadow-md print:hidden">
        <div className="flex items-center justify-between border-b border-[#1b2b4c] pb-2.5">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-blue-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
              Bộ Lọc Báo Cáo Chuyên Sâu
            </span>
            <span className="text-[11px] text-slate-400 font-mono bg-[#142038] px-2 py-0.5 rounded border border-[#2b3e66]">
              {reportRows.length} gói thầu phù hợp
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-[#16233d]"
              title="Đặt lại bộ lọc về mặc định"
            >
              <RotateCcw size={12} />
              <span>Đặt lại</span>
            </button>
            <button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-[#16233d] transition-colors"
            >
              {isFilterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isFilterExpanded && (
          <div className="space-y-3 text-xs">
            {/* Hàng 1: Bộ lọc Dự án & Khoảng thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Cột chọn Dự án (5 cols) */}
              <div className="md:col-span-6 p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building2 size={14} className="text-blue-400" />
                    <span>Dự án báo cáo ({selectedProjectIds.length}/{projects.length}):</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleSelectAllProjects}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-medium px-1.5 py-0.5 rounded hover:bg-blue-950/60"
                    >
                      Chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {projects.map((p) => {
                    const isSelected = selectedProjectIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleProject(p.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
                          isSelected
                            ? 'bg-blue-600/30 text-blue-200 border-blue-500/80 shadow-sm'
                            : 'bg-[#0f172a] text-slate-400 border-[#232f4e] hover:text-slate-200'
                        }`}
                        title={p.name}
                      >
                        {isSelected ? <CheckSquare size={13} className="text-blue-400" /> : <Square size={13} />}
                        <span className="font-bold">{p.code}</span>
                        <span className="truncate max-w-[140px] text-[11px] font-sans opacity-90">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cột Khoảng thời gian (7 cols) */}
              <div className="md:col-span-6 p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Calendar size={14} className="text-cyan-400" />
                    <span>Khoảng thời gian báo cáo (Nghiệm thu / Thanh toán):</span>
                  </span>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-medium px-1.5 py-0.5 rounded hover:bg-rose-950/60"
                    >
                      Xóa khoảng ngày
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  <VnDateInput
                    label="Từ ngày"
                    value={startDate}
                    onChange={(val) => setStartDate(val)}
                    placeholder="VD: 01/01/2026"
                  />
                  <VnDateInput
                    label="Đến ngày"
                    value={endDate}
                    onChange={(val) => setEndDate(val)}
                    placeholder="VD: 31/12/2026"
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: Phân loại Chi phí/Phí, Khoản mục TVXD/XD/K & Tìm kiếm */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              {/* Phân loại: Chi phí vs Phí (4 cols) */}
              <div className="sm:col-span-4 p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Phân loại chi phí:</span>
                <div className="flex rounded-lg border border-[#232f4e] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSelectedCostType('all')}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      selectedCostType === 'all'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#0f172a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCostType('Chi phí')}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors border-x border-[#232f4e] ${
                      selectedCostType === 'Chi phí'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#0f172a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Chi phí
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCostType('Phí')}
                    className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                      selectedCostType === 'Phí'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#0f172a] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Phí
                  </button>
                </div>
              </div>

              {/* Khoản mục: TVXD, XD, K (4 cols) */}
              <div className="sm:col-span-4 p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Khoản mục chi phí:</span>
                <div className="flex items-center gap-1.5">
                  {(['TVXD', 'XD', 'K'] as CostCategory[]).map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    const label = cat === 'TVXD' ? 'TVXD (Tư vấn)' : cat === 'XD' ? 'XD (Xây dựng)' : 'K (Khác)';
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-cyan-600/30 text-cyan-200 border-cyan-500 font-bold'
                            : 'bg-[#0f172a] text-slate-400 border-[#232f4e] hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tìm kiếm từ khóa (4 cols) */}
              <div className="sm:col-span-4 p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Tìm kiếm gói thầu / Nhà thầu:</span>
                <div className="relative">
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Nhập tên gói thầu, nhà thầu..."
                    className="w-full bg-[#0c1424] border border-[#232f4e] focus:border-blue-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:italic placeholder:text-slate-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                  {keyword && (
                    <button
                      onClick={() => setKeyword('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Hàng 3: Chọn các Gói thầu cụ thể đưa vào báo cáo */}
            <div className="p-2.5 rounded-lg bg-[#070d18] border border-[#1e2e4c] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase size={14} className="text-amber-400" />
                  <span className="font-semibold text-slate-200">
                    Lựa chọn gói thầu báo cáo ({selectedPackageIds.length}/{rawPackagesList.length} gói thầu):
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAllPackages}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isAllPackagesSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#142038] text-blue-300 hover:bg-[#1a2b4c]'
                    }`}
                  >
                    Chọn tất cả gói thầu
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllPackages}
                    className="px-2 py-0.5 rounded text-[11px] text-slate-400 hover:text-slate-200 bg-[#142038] hover:bg-[#1a2b4c] transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>

              {/* Danh sách gói thầu dạng pills checkbox */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {rawPackagesList.map((pkg) => {
                  const isChecked = selectedPackageIds.includes(pkg.packageId);
                  return (
                    <button
                      key={pkg.packageId}
                      type="button"
                      onClick={() => handleTogglePackage(pkg.packageId)}
                      className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1.5 transition-colors border text-left ${
                        isChecked
                          ? 'bg-amber-600/20 text-amber-200 border-amber-500/70'
                          : 'bg-[#0b1222] text-slate-400 border-[#1e2c4c] hover:text-slate-300'
                      }`}
                    >
                      {isChecked ? <CheckSquare size={12} className="text-amber-400 shrink-0" /> : <Square size={12} className="shrink-0" />}
                      <span className="font-medium truncate max-w-[200px]" title={pkg.content}>{pkg.content}</span>
                      <span className="text-[10px] font-mono text-slate-400">({pkg.contractor})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. CÁC THẺ KPI TỔNG HỢP NHANH (SUMMARY STATS CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
        {/* Thẻ 1: Số lượng gói thầu */}
        <div className="p-3.5 rounded-xl bg-[#0b1426] border border-blue-500/40 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Số gói thầu trong báo cáo:</span>
          <div className="text-2xl font-bold font-mono text-blue-300">
            {reportTotals.rowCount} <span className="text-xs font-normal text-slate-400 font-sans">gói thầu</span>
          </div>
          <span className="text-[11px] text-blue-400 block truncate">
            Thuộc {selectedProjectIds.length} dự án được chọn
          </span>
        </div>

        {/* Thẻ 2: Tổng giá trị Hợp đồng */}
        <div className="p-3.5 rounded-xl bg-[#071720] border border-cyan-500/40 space-y-1 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Tổng Giá trị Hợp đồng:</span>
          <div className="text-xl font-bold font-mono text-cyan-300 truncate" title={`${formatVnNumber(reportTotals.contractTotal)} đồng`}>
            {formatVnNumber(reportTotals.contractTotal)} đ
          </div>
          <span className="text-[11px] text-cyan-400 block">
            Đã tính đầy đủ các Phụ lục HĐ (PLHĐ)
          </span>
        </div>

        {/* Thẻ 3: Tổng giá trị Nghiệm thu & Tỷ lệ NT/HĐ */}
        <div className="p-3.5 rounded-xl bg-[#091b1a] border border-emerald-500/40 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Giá trị Nghiệm thu:</span>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700/60">
              NT/HĐ: {reportTotals.avgRatioNtHd}%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-300 truncate" title={`${formatVnNumber(reportTotals.inspTotal)} đồng`}>
            {formatVnNumber(reportTotals.inspTotal)} đ
          </div>
          <span className="text-[11px] text-emerald-400 block">
            {startDate || endDate ? 'Theo kỳ thời gian được chọn' : 'Lũy kế toàn bộ các đợt nghiệm thu'}
          </span>
        </div>

        {/* Thẻ 4: Tổng giá trị Thanh toán & Tỷ lệ TT/NT */}
        <div className="p-3.5 rounded-xl bg-[#140f26] border border-purple-500/40 space-y-1 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tổng Giá trị Thanh toán:</span>
            <span className="text-[11px] font-mono font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-700/60">
              TT/NT: {reportTotals.avgRatioTtNt}%
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 truncate" title={`${formatVnNumber(reportTotals.payTotal)} đồng`}>
            {formatVnNumber(reportTotals.payTotal)} đ
          </div>
          <span className="text-[11px] text-purple-400 block">
            Đã thanh toán giải ngân thực tế
          </span>
        </div>
      </div>

      {/* 4. BẢNG DỮ LIỆU BÁO CÁO CÁC GÓI THẦU (DATA GRID) */}
      <div className="bg-[#0b1222] border border-[#232f4e] rounded-xl overflow-hidden shadow-lg">
        <div className="p-3 bg-[#101b33] border-b border-[#232f4e] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-blue-400" />
            <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Bảng Số Liệu Chi Tiết Các Gói Thầu
            </h3>
            <span className="text-xs text-slate-400">
              ({reportRows.length} gói thầu)
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-3">
            <span>* Đơn vị tính: <strong>đồng</strong></span>
            <span>• NT: <strong>Nghiệm thu</strong></span>
            <span>• TT: <strong>Thanh toán</strong></span>
            <span>• HĐ: <strong>Hợp đồng</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-data-grid text-xs">
            <thead className="bg-[#0f172a] text-slate-200 uppercase font-semibold border-b border-[#232f4e] sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">STT</th>
                <th className="py-2.5 px-3 w-40">Dự án</th>
                <th className="py-2.5 px-3 min-w-[220px]">Tên gói thầu / Nội dung chi phí</th>
                <th className="py-2.5 px-3 text-center w-28">Khoản mục</th>
                <th className="py-2.5 px-3 w-48">Đơn vị thực hiện (Nhà thầu)</th>
                <th className="py-2.5 px-3 text-right w-40">Giá trị hợp đồng (đồng)</th>
                <th className="py-2.5 px-3 text-right w-40">Giá trị nghiệm thu (đồng)</th>
                <th className="py-2.5 px-3 text-right w-40">Giá trị thanh toán (đồng)</th>
                <th className="py-2.5 px-3 text-center w-24">Tỷ lệ NT/HĐ</th>
                <th className="py-2.5 px-3 text-center w-24">Tỷ lệ TT/NT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b2b4c]/70 text-slate-200">
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <HelpCircle size={28} className="text-slate-500 opacity-60" />
                      <span>Không tìm thấy gói thầu nào phù hợp với bộ lọc hiện tại.</span>
                      <span className="text-[11px] text-slate-500">
                        Vui lòng kiểm tra lại bộ lọc Dự án, Khoảng thời gian hoặc Phân loại chi phí.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                reportRows.map((row, idx) => (
                  <tr key={row.packageId} className="hover:bg-[#121e38] transition-colors">
                    {/* STT */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-semibold">
                      {idx + 1}
                    </td>

                    {/* Dự án */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono font-bold text-blue-300 text-[11px]">{row.projectCode}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]" title={row.projectName}>
                        {row.projectName}
                      </div>
                    </td>

                    {/* Tên gói thầu */}
                    <td className="py-2.5 px-3 font-medium text-slate-100">
                      <div>{row.content}</div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>Số HĐ: {row.contractNumber}</span>
                        {row.appendixCount > 0 && (
                          <span className="text-blue-400">({row.appendixCount} PLHĐ)</span>
                        )}
                      </div>
                    </td>

                    {/* Khoản mục & Phân loại */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        row.category === 'XD'
                          ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                          : row.category === 'TVXD'
                          ? 'bg-blue-950/60 text-blue-300 border-blue-700/60'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {row.category}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {row.costType}
                      </span>
                    </td>

                    {/* Đơn vị thực hiện (Nhà thầu) */}
                    <td className="py-2.5 px-3 text-slate-300 text-[11px] leading-relaxed">
                      {row.contractor}
                    </td>

                    {/* Giá trị hợp đồng */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                      {formatVnNumber(row.effectiveContractValue)}
                    </td>

                    {/* Giá trị nghiệm thu */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatVnNumber(row.inspectionValue)}
                      {row.inspCount > 0 && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          ({row.inspCount} đợt NT)
                        </span>
                      )}
                    </td>

                    {/* Giá trị thanh toán */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-400">
                      {formatVnNumber(row.paymentValue)}
                    </td>

                    {/* Tỷ lệ NT/HĐ */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        row.ratioNtHd >= 100
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                          : row.ratioNtHd >= 50
                          ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                          : row.ratioNtHd > 0
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {row.ratioNtHd}%
                      </span>
                    </td>

                    {/* Tỷ lệ TT/NT */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded text-xs border ${
                        row.ratioTtNt >= 90
                          ? 'bg-purple-950/80 text-purple-300 border-purple-600'
                          : row.ratioTtNt >= 50
                          ? 'bg-indigo-950/80 text-indigo-300 border-indigo-600'
                          : row.ratioTtNt > 0
                          ? 'bg-slate-900 text-slate-300 border-slate-700'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {row.ratioTtNt}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* DÒNG TỔNG CỘNG TOÀN BỘ BÁO CÁO (FOOTER ROW) */}
            {reportRows.length > 0 && (
              <tfoot className="bg-[#091122] border-t-2 border-blue-500/60 font-bold text-xs sticky bottom-0 z-10 shadow-lg">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-slate-200 uppercase tracking-wider text-right">
                    TỔNG CỘNG ({reportTotals.rowCount} GÓI THẦU):
                  </td>
                  {/* Tổng HĐ */}
                  <td className="py-3 px-3 text-right font-mono text-sm text-cyan-300">
                    {formatVnNumber(reportTotals.contractTotal)}
                  </td>
                  {/* Tổng NT */}
                  <td className="py-3 px-3 text-right font-mono text-sm text-emerald-300">
                    {formatVnNumber(reportTotals.inspTotal)}
                  </td>
                  {/* Tổng TT */}
                  <td className="py-3 px-3 text-right font-mono text-sm text-purple-300">
                    {formatVnNumber(reportTotals.payTotal)}
                  </td>
                  {/* Tỷ lệ NT/HĐ tổng */}
                  <td className="py-3 px-3 text-center font-mono text-sm text-emerald-400 bg-emerald-950/40">
                    {reportTotals.avgRatioNtHd}%
                  </td>
                  {/* Tỷ lệ TT/NT tổng */}
                  <td className="py-3 px-3 text-center font-mono text-sm text-purple-400 bg-purple-950/40">
                    {reportTotals.avgRatioTtNt}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
