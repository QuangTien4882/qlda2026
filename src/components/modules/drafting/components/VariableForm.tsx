import React, { useState } from 'react';
import { FileText, Search, CheckSquare, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { TemplateVariable } from '../../../../types/drafting';
import { formatVnNumber } from '../../../../utils/numberUtils';
import { VnDateInput } from '../../../common/VnDateInput';
import { ProjectListItem, ContractorItem, CostPackageItem, LegalDocItem } from '../../../../types/project';

/**
 * Kiểm tra xem một biến có đóng vai trò là biến chọn Dự án hay không.
 * Hỗ trợ cả type === 'project' lẫn type === 'project_dependent' khi cấu hình là tên dự án
 * hoặc tên biến / nhãn là 'Tên dự án'.
 */
export const isProjectSelectorVar = (
  v: TemplateVariable,
  allVars?: TemplateVariable[]
): boolean => {
  if (v.type === 'project') return true;
  if (v.type === 'project_dependent') {
    // Nếu trong danh sách đã có biến với type === 'project' tường minh thì ưu tiên biến đó
    if (allVars && allVars.some((o) => o.id !== v.id && o.type === 'project')) {
      return false;
    }
    const nameLower = (v.name || '').toLowerCase();
    const labelLower = (v.label || '').toLowerCase();
    return (
      v.dependentConfig === 'name' ||
      nameLower === 'ten_du_an' ||
      nameLower === 'du_an' ||
      nameLower.includes('ten_du_an') ||
      labelLower.includes('tên dự án') ||
      labelLower === 'dự án'
    );
  }
  return false;
};

export interface VariableFormProps {
  draftVariables: TemplateVariable[];
  projects: ProjectListItem[];
  companies: ContractorItem[];
  costPackages?: CostPackageItem[];
  allCostPackages?: Record<string, CostPackageItem[]>;
  legalDocs?: LegalDocItem[];
  activeVarName?: string | null;
  selectedProjectId?: string;
  onFocusVar?: (varName: string) => void;
  onProjectChange?: (projectId: string) => void;
  onCostPackageSelect?: (costPackage: CostPackageItem) => void;
  onVariableChange: (varName: string, value: string) => void;
  onNumberInput: (varName: string, value: string) => void;
  onReorderVar?: (fromIndex: number, toIndex: number) => void;
}

// ==================== BỘ TÍCH CHỌN NHIỀU HỒ SƠ PHÁP LÝ (CÓ TÌM KIẾM) ====================
interface LegalDocMultiPickerProps {
  variable: TemplateVariable;
  legalDocs: LegalDocItem[];
  hasProjectSelected?: boolean;
  onChange: (value: string) => void;
  onFocus?: () => void;
}

const LegalDocMultiPicker: React.FC<LegalDocMultiPickerProps> = ({
  variable,
  legalDocs,
  hasProjectSelected = true,
  onChange,
  onFocus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [formatMode, setFormatMode] = useState<'cancu' | 'dash' | 'semicolon'>('cancu');

  if (!hasProjectSelected) {
    return (
      <div className="space-y-1.5" onFocus={onFocus}>
        <div className="w-full text-left px-3 py-2 rounded-lg border border-dashed border-amber-500/40 bg-[#070b16] text-amber-300/80 text-xs font-medium flex items-center justify-between cursor-not-allowed">
          <span className="flex items-center gap-1.5 truncate">
            <span className="text-amber-400">⚠️</span>
            <span className="truncate">Cần chọn Tên dự án trước để tải danh sách hồ sơ pháp lý</span>
          </span>
        </div>
        <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5">
          <span className="shrink-0 text-xs">⚠️</span>
          <span>Vui lòng chọn <strong>Tên dự án</strong> để tải danh mục hồ sơ pháp lý.</span>
        </p>
      </div>
    );
  }

  // Lọc hồ sơ theo từ khóa
  const filteredDocs = legalDocs.filter((ld) => {
    const q = search.toLowerCase();
    return (
      ld.content.toLowerCase().includes(q) ||
      (ld.fileName && ld.fileName.toLowerCase().includes(q)) ||
      (ld.note && ld.note.toLowerCase().includes(q))
    );
  });

  const isSelected = (content: string) => {
    return variable.value.includes(content);
  };

  const applyFormat = (list: string[], mode: 'cancu' | 'dash' | 'semicolon') => {
    let result = '';
    if (mode === 'cancu') {
      result = list
        .map((c) => {
          const trimmed = c.trim().replace(/;$/, '');
          return trimmed.toLowerCase().startsWith('căn cứ') ? `${trimmed};` : `Căn cứ ${trimmed};`;
        })
        .join('\n');
    } else if (mode === 'dash') {
      result = list.map((c) => `- ${c.trim().replace(/;$/, '')};`).join('\n');
    } else {
      result = list.map((c) => c.trim().replace(/;$/, '')).join('; ');
    }
    onChange(result);
  };

  const handleToggle = (ld: LegalDocItem) => {
    const targetContent = ld.content;
    let selectedList = legalDocs
      .filter((d) => isSelected(d.content))
      .map((d) => d.content);

    if (selectedList.includes(targetContent)) {
      selectedList = selectedList.filter((c) => c !== targetContent);
    } else {
      selectedList.push(targetContent);
    }

    applyFormat(selectedList, formatMode);
  };

  const handleSelectAllFiltered = () => {
    const currentSelected = new Set(
      legalDocs.filter((d) => isSelected(d.content)).map((d) => d.content)
    );
    filteredDocs.forEach((d) => currentSelected.add(d.content));
    applyFormat(Array.from(currentSelected), formatMode);
  };

  const handleClearAll = () => {
    onChange('');
  };

  const selectedCount = legalDocs.filter((d) => isSelected(d.content)).length;

  return (
    <div className="space-y-1.5" onFocus={onFocus}>
      {/* Nút bật/tắt bảng tích chọn */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
          isOpen
            ? 'bg-blue-600/20 border-blue-500 text-blue-200'
            : 'bg-[#080d1a] border-[#232f4e] text-slate-300 hover:border-blue-400'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          <FileText size={14} className="text-blue-400 shrink-0" />
          <span className="truncate">
            {selectedCount > 0
              ? `Đã tích chọn ${selectedCount} hồ sơ pháp lý`
              : 'Click để tích chọn các hồ sơ pháp lý...'}
          </span>
        </span>
        <span className="text-slate-400 text-[10px] shrink-0 ml-1">
          {isOpen ? '▲ Thu gọn' : '▼ Tích chọn'}
        </span>
      </button>

      {/* Bảng tích chọn có tìm kiếm */}
      {isOpen && (
        <div className="p-3 bg-[#0a1122] border border-blue-500/40 rounded-xl space-y-2.5 animate-fadeIn shadow-2xl">
          {/* Ô tìm kiếm */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo số QĐ, nội dung, ghi chú..."
              className="w-full bg-[#060a14] border border-[#232f4e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Công cụ định dạng & chọn nhanh */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 border-t border-[#1a2542] text-[11px]">
            <div className="flex items-center gap-1 text-slate-400">
              <span>Định dạng:</span>
              <button
                type="button"
                onClick={() => {
                  setFormatMode('cancu');
                  applyFormat(
                    legalDocs.filter((d) => isSelected(d.content)).map((d) => d.content),
                    'cancu'
                  );
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  formatMode === 'cancu'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Căn cứ...
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormatMode('dash');
                  applyFormat(
                    legalDocs.filter((d) => isSelected(d.content)).map((d) => d.content),
                    'dash'
                  );
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  formatMode === 'dash'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Gạch (-)
              </button>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-blue-400 hover:text-blue-300 font-semibold text-[10px] flex items-center gap-0.5"
              >
                <CheckSquare size={12} /> Chọn hết ({filteredDocs.length})
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-red-400 hover:text-red-300 text-[10px] flex items-center gap-0.5"
              >
                <Square size={12} /> Bỏ chọn
              </button>
            </div>
          </div>

          {/* Danh sách các hồ sơ có checkbox */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredDocs.length === 0 ? (
              <p className="text-center text-slate-500 text-xs py-3 italic">
                {legalDocs.length === 0
                  ? 'Dự án này chưa có hồ sơ pháp lý trong cơ sở dữ liệu.'
                  : 'Không tìm thấy hồ sơ nào khớp từ khóa.'}
              </p>
            ) : (
              filteredDocs.map((ld) => {
                const checked = isSelected(ld.content);
                return (
                  <label
                    key={ld.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${
                      checked
                        ? 'bg-blue-600/15 border-blue-500/50 text-slate-100'
                        : 'bg-[#0e162b] border-[#1d2948] text-slate-300 hover:bg-[#141f3d]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(ld)}
                      className="mt-0.5 rounded border-[#232f4e] text-blue-600 focus:ring-0 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-relaxed">{ld.content}</p>
                      {ld.fileName && (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          📎 File: {ld.fileName} {ld.note ? `• ${ld.note}` : ''}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Textarea hiển thị kết quả và cho phép sửa trực tiếp */}
      <textarea
        value={variable.value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Nội dung căn cứ pháp lý đã tích chọn (hoặc tự nhập tay)..."
        className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-xs resize-y leading-relaxed"
      />
    </div>
  );
};

// ==================== VARIABLE FORM CHÍNH ====================
export const VariableForm: React.FC<VariableFormProps> = ({
  draftVariables,
  projects,
  companies,
  costPackages = [],
  allCostPackages,
  legalDocs = [],
  activeVarName,
  selectedProjectId,
  onFocusVar,
  onProjectChange,
  onCostPackageSelect,
  onVariableChange,
  onNumberInput,
  onReorderVar,
}) => {
  const inputClass =
    'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-sm';
  const labelClass = 'text-xs font-semibold block mb-1';

  // Deduplicate by name
  const uniqueVars: TemplateVariable[] = [];
  draftVariables.forEach((v) => {
    if (!uniqueVars.find((u) => u.name === v.name)) uniqueVars.push(v);
  });

  // Xác định trạng thái chọn của các biến cha trong toàn bộ biểu mẫu
  const projectVar = draftVariables.find((u) => isProjectSelectorVar(u, draftVariables));
  const hasProjectSelected = Boolean(selectedProjectId) || Boolean(projectVar?.value?.trim());

  const packageVar = draftVariables.find((u) => u.type === 'cost_package');
  const hasPackageSelected = packageVar ? Boolean(packageVar.value?.trim()) : false;

  const contractorVar = draftVariables.find(
    (u) =>
      u.type === 'contractor' ||
      (u.type === 'cost_package_dependent' && u.dependentConfig === 'contractor') ||
      u.name.includes('nha_thau') ||
      (u.label && u.label.toLowerCase().includes('nhà thầu'))
  );
  const hasContractorSelected = contractorVar ? Boolean(contractorVar.value?.trim()) : false;

  return (
    <>
      {uniqueVars.map((v, index) => {
        const isFocused = activeVarName === v.name;
        return (
          <div key={v.id} className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label
                className={`${labelClass} flex items-center gap-1.5 mb-0 ${
                  isFocused ? 'text-amber-400 font-bold' : 'text-slate-400'
                }`}
              >
                <span>{v.label || v.name}</span>
                {isFocused && (
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-mono font-medium">
                    Đang xem trên văn bản 👁️
                  </span>
                )}
              </label>

              {onReorderVar && uniqueVars.length > 1 && (
                <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderVar(index, index - 1)}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                    title="Di chuyển biến lên trên"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    disabled={index === uniqueVars.length - 1}
                    onClick={() => onReorderVar(index, index + 1)}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 transition-colors"
                    title="Di chuyển biến xuống dưới"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              )}
            </div>

            {v.type === 'text' && (
              <input
                value={v.value}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                placeholder="Nhập văn bản..."
                className={`${inputClass} ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              />
            )}

            {v.type === 'long_text' && (
              <textarea
                value={v.value}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                placeholder="Nhập đoạn văn bản..."
                rows={3}
                className={`${inputClass} resize-y ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              />
            )}

            {v.type === 'number' && (
              <input
                value={formatVnNumber(v.value)}
                onChange={(e) => onNumberInput(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                placeholder="0"
                className={`${inputClass} text-blue-300 font-mono font-bold ${
                  isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''
                }`}
              />
            )}

            {/* Ngày tháng chuẩn Việt Nam với popup DatePicker */}
            {v.type === 'date' && (
              <div onFocus={() => onFocusVar?.(v.name)}>
                <VnDateInput
                  value={v.value || ''}
                  onChange={(val) => onVariableChange(v.name, val)}
                  placeholder="dd/mm/yyyy (vd: 15/01/2026)"
                  inputClassName={isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}
                />
              </div>
            )}

            {v.type === 'dropdown' && (
              <select
                value={v.value}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                className={`${inputClass} ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              >
                <option value="">-- Chọn --</option>
                {(v.optionsStr || '')
                  .split(',')
                  .map((o, i) => (
                    <option key={i} value={o.trim()}>
                      {o.trim()}
                    </option>
                  ))}
              </select>
            )}

            {v.type === 'dependent_dropdown' && (
              <select
                value={v.value}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                className={`${inputClass} ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              >
                <option value="">-- Chọn --</option>
                {(v.optionsStr || '')
                  .split(',')
                  .map((o, i) => (
                    <option key={i} value={o.trim()}>
                      {o.trim()}
                    </option>
                  ))}
              </select>
            )}

            {isProjectSelectorVar(v, uniqueVars) && (
              <select
                value={
                  projects.find(
                    (p) =>
                      p.name === v.value ||
                      p.id === v.value ||
                      (p.code && v.value?.includes(p.code))
                  )?.id ||
                  (selectedProjectId && projects.some((p) => p.id === selectedProjectId)
                    ? selectedProjectId
                    : '')
                }
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const matched = projects.find((p) => p.id === selectedId);
                  if (matched) {
                    onVariableChange(v.name, matched.name);
                    onProjectChange?.(matched.id);
                  } else {
                    onVariableChange(v.name, '');
                    onProjectChange?.('');
                  }
                }}
                onFocus={() => onFocusVar?.(v.name)}
                className={`${inputClass} font-medium ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code} - ` : ''}{p.name}
                  </option>
                ))}
              </select>
            )}

            {v.type === 'contractor' && (
              <select
                value={v.value}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                onFocus={() => onFocusVar?.(v.name)}
                className={`${inputClass} ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
              >
                <option value="">-- Chọn nhà thầu --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {v.type === 'cost_package' && (
              <div className="space-y-1">
                <select
                  value={v.value}
                  disabled={!hasProjectSelected}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    onVariableChange(v.name, selectedVal);
                    const foundPkg = costPackages.find((cp) => cp.content === selectedVal);
                    if (foundPkg) {
                      onCostPackageSelect?.(foundPkg);
                    }
                  }}
                  onFocus={() => onFocusVar?.(v.name)}
                  className={`${inputClass} ${
                    !hasProjectSelected
                      ? 'opacity-60 cursor-not-allowed border-dashed border-amber-500/40 bg-[#070b16]'
                      : isFocused
                      ? 'border-amber-400 ring-1 ring-amber-400'
                      : ''
                  }`}
                >
                  <option value="">
                    {!hasProjectSelected
                      ? '-- Vui lòng chọn Tên dự án trước --'
                      : costPackages.length > 0
                      ? `-- Chọn gói thầu / nội dung chi phí (${costPackages.length}) --`
                      : '-- Dự án chưa có gói thầu nào trong Danh mục chi phí --'}
                  </option>
                  {hasProjectSelected &&
                    costPackages.map((cp) => (
                      <option key={cp.id} value={cp.content}>
                        {cp.content} ({cp.category}) - {formatVnNumber(cp.contractValue || cp.estimateValue)} đ
                      </option>
                    ))}
                </select>
                {!hasProjectSelected && (
                  <p className="text-[11px] text-amber-400/90 flex items-center gap-1.5 pt-0.5">
                    <span className="shrink-0 text-xs">⚠️</span>
                    <span>Cần chọn <strong>Tên dự án</strong> trước để hiển thị danh sách gói thầu.</span>
                  </p>
                )}
              </div>
            )}

            {/* Hồ sơ pháp lý: Tích chọn nhiều nội dung có tìm kiếm */}
            {v.type === 'legal_doc' && (
              <LegalDocMultiPicker
                variable={v}
                legalDocs={legalDocs}
                hasProjectSelected={hasProjectSelected}
                onChange={(val) => onVariableChange(v.name, val)}
                onFocus={() => onFocusVar?.(v.name)}
              />
            )}

            {/* Biến phụ thuộc vào Dự án */}
            {v.type === 'project_dependent' && !isProjectSelectorVar(v, uniqueVars) && (
              <div className="space-y-1">
                <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                  <input
                    value={v.value || ''}
                    onChange={(e) => onVariableChange(v.name, e.target.value)}
                    placeholder={
                      !hasProjectSelected
                        ? '⚠️ Chờ chọn Tên dự án để trích xuất tự động...'
                        : 'Tự động trích xuất hoặc nhập tay...'
                    }
                    className={`${inputClass} pr-8 ${
                      v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                    } ${
                      !hasProjectSelected
                        ? 'border-dashed border-amber-500/40 bg-[#070b16]'
                        : isFocused
                        ? 'border-amber-400 ring-1 ring-amber-400'
                        : ''
                    }`}
                  />
                  <span
                    className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                    title="Biến trích xuất từ Dự án"
                  >
                    🏛️
                  </span>
                </div>
                {!hasProjectSelected && (
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1.5">
                    <span className="shrink-0 text-xs">⚠️</span>
                    <span>Chưa chọn <strong>Tên dự án</strong> (biến phụ thuộc sẽ tự trích xuất khi chọn dự án).</span>
                  </p>
                )}
              </div>
            )}

            {/* Biến phụ thuộc vào Gói thầu */}
            {v.type === 'cost_package_dependent' && (
              <div className="space-y-1">
                <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                  <input
                    value={v.value || ''}
                    onChange={(e) => onVariableChange(v.name, e.target.value)}
                    placeholder={
                      !hasPackageSelected
                        ? '⚠️ Chờ chọn Gói thầu để trích xuất tự động...'
                        : 'Tự động trích xuất hoặc nhập tay...'
                    }
                    className={`${inputClass} pr-8 ${
                      v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                    } ${
                      !hasPackageSelected
                        ? 'border-dashed border-amber-500/30 bg-[#070b16]'
                        : isFocused
                        ? 'border-amber-400 ring-1 ring-amber-400'
                        : ''
                    }`}
                  />
                  <span
                    className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                    title="Biến trích xuất từ Gói thầu"
                  >
                    💰
                  </span>
                </div>
                {!hasPackageSelected && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="shrink-0 text-xs">ℹ️</span>
                    <span>Chờ chọn <strong>Gói thầu</strong> để trích xuất {v.label || v.name}.</span>
                  </p>
                )}
              </div>
            )}

            {/* Biến phụ thuộc vào Nhà thầu */}
            {v.type === 'contractor_dependent' && (
              <div className="space-y-1">
                <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                  <input
                    value={v.value || ''}
                    onChange={(e) => onVariableChange(v.name, e.target.value)}
                    placeholder={
                      !hasContractorSelected
                        ? '⚠️ Chờ thông tin Nhà thầu để trích xuất...'
                        : 'Tự động trích xuất hoặc nhập tay...'
                    }
                    className={`${inputClass} pr-8 ${
                      v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                    } ${
                      !hasContractorSelected
                        ? 'border-dashed border-amber-500/30 bg-[#070b16]'
                        : isFocused
                        ? 'border-amber-400 ring-1 ring-amber-400'
                        : ''
                    }`}
                  />
                  <span
                    className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                    title="Biến trích xuất từ Nhà thầu"
                  >
                    🏢
                  </span>
                </div>
                {!hasContractorSelected && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="shrink-0 text-xs">ℹ️</span>
                    <span>Chờ thông tin <strong>Nhà thầu</strong> để trích xuất {v.label || v.name}.</span>
                  </p>
                )}
              </div>
            )}

            {/* Biến phụ thuộc vào Hồ sơ pháp lý */}
            {v.type === 'legal_doc_dependent' && (() => {
              const docVar = v.sourceVariableId
                ? draftVariables.find((s) => s.id === v.sourceVariableId || s.name === v.sourceVariableId)
                : draftVariables.find((s) => s.type === 'legal_doc');
              const hasDoc = Boolean(docVar?.value?.trim());

              return (
                <div className="space-y-1">
                  <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                    <input
                      value={v.value || ''}
                      onChange={(e) => onVariableChange(v.name, e.target.value)}
                      placeholder={
                        !hasDoc
                          ? '⚠️ Chờ chọn Hồ sơ pháp lý để trích xuất...'
                          : 'Tự động trích xuất hoặc nhập tay...'
                      }
                      className={`${inputClass} pr-8 ${
                        v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                      } ${
                        !hasDoc
                          ? 'border-dashed border-amber-500/30 bg-[#070b16]'
                          : isFocused
                          ? 'border-amber-400 ring-1 ring-amber-400'
                          : ''
                      }`}
                    />
                    <span
                      className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                      title="Trích xuất từ Hồ sơ pháp lý"
                    >
                      📜
                    </span>
                  </div>
                  {!hasDoc && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="shrink-0 text-xs">ℹ️</span>
                      <span>Chờ chọn <strong>Hồ sơ pháp lý</strong> để trích xuất {v.label || v.name}.</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Đọc số thành chữ */}
            {v.type === 'number_to_words' && (() => {
              const parentVar = v.sourceVariableId
                ? draftVariables.find((p) => p.id === v.sourceVariableId || p.name === v.sourceVariableId)
                : draftVariables.find(
                    (p) =>
                      p.type === 'number' ||
                      p.type === 'formula' ||
                      (p.type === 'project_dependent' && p.dependentConfig === 'totalInvestment') ||
                      (p.type === 'cost_package_dependent' &&
                        (p.dependentConfig === 'estimateValue' || p.dependentConfig === 'contractValue'))
                  );
              const hasParentValue = Boolean(parentVar?.value?.trim());

              return (
                <div className="space-y-1">
                  <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                    <input
                      value={v.value || ''}
                      onChange={(e) => onVariableChange(v.name, e.target.value)}
                      placeholder={
                        !hasParentValue
                          ? '⚠️ Chờ giá trị số tiền để đọc thành chữ...'
                          : 'Tự động đọc số thành chữ hoặc nhập tay...'
                      }
                      className={`${inputClass} pr-8 ${
                        v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                      } ${
                        !hasParentValue
                          ? 'border-dashed border-amber-500/30 bg-[#070b16]'
                          : isFocused
                          ? 'border-amber-400 ring-1 ring-amber-400'
                          : ''
                      }`}
                    />
                    <span
                      className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                      title="Đọc số thành chữ"
                    >
                      🤖
                    </span>
                  </div>
                  {!hasParentValue && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <span className="shrink-0 text-xs">ℹ️</span>
                      <span>Tự động chuyển đổi số tiền thành chữ tiếng Việt ({parentVar?.label || parentVar?.name || 'chưa có số'}).</span>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Biến công thức */}
            {v.type === 'formula' && (
              <div className="relative" onFocus={() => onFocusVar?.(v.name)}>
                <input
                  value={v.value || ''}
                  onChange={(e) => onVariableChange(v.name, e.target.value)}
                  placeholder="Tự động tính theo công thức hoặc nhập tay..."
                  className={`${inputClass} pr-8 ${
                    v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'
                  } ${isFocused ? 'border-amber-400 ring-1 ring-amber-400' : ''}`}
                />
                <span
                  className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                  title="Công thức tính toán"
                >
                  ∑
                </span>
              </div>
            )}

            {v.type === 'joint_venture' && (
              <div
                className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-slate-400 italic min-h-[38px] flex items-center text-sm"
                onFocus={() => onFocusVar?.(v.name)}
              >
                <span className="text-purple-400 mr-2">🤝</span>
                <span className="truncate">{v.value || 'Cấu hình ở danh sách Liên danh bên dưới'}</span>
              </div>
            )}

            {v.type === 'table' && (
              <div
                className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-slate-400 italic min-h-[38px] flex items-center text-sm"
                onFocus={() => onFocusVar?.(v.name)}
              >
                <span className="text-blue-400 mr-2">📊</span>
                <span className="truncate">
                  {v.value ? `${JSON.parse(v.value).length} dòng` : 'Chưa có dữ liệu bảng'}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
