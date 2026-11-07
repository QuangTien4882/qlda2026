import React from 'react';
import { TemplateVariable } from '../../../../types/drafting';
import { formatVnNumber } from '../../../../utils/numberUtils';
import { ProjectListItem, ContractorItem, CostPackageItem, LegalDocItem } from '../../../../types/project';

interface VariableFormProps {
  draftVariables: TemplateVariable[];
  projects: ProjectListItem[];
  companies: ContractorItem[];
  costPackages?: CostPackageItem[];
  legalDocs?: LegalDocItem[];
  onVariableChange: (varName: string, value: string) => void;
  onNumberInput: (varName: string, value: string) => void;
}

export const VariableForm: React.FC<VariableFormProps> = ({
  draftVariables,
  projects,
  companies,
  costPackages = [],
  legalDocs = [],
  onVariableChange,
  onNumberInput,
}) => {
  const inputClass =
    'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-sm';
  const labelClass = 'text-xs font-semibold text-slate-400 block mb-1';

  // Deduplicate by name
  const uniqueVars: TemplateVariable[] = [];
  draftVariables.forEach((v) => {
    if (!uniqueVars.find((u) => u.name === v.name)) uniqueVars.push(v);
  });

  return (
    <>
      {uniqueVars.map((v) => (
        <div key={v.id} className="space-y-1">
          <label className={labelClass}>{v.label || v.name}</label>

          {v.type === 'text' && (
            <input
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              placeholder="Nhập văn bản..."
              className={inputClass}
            />
          )}

          {v.type === 'long_text' && (
            <textarea
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              placeholder="Nhập đoạn văn bản..."
              rows={3}
              className={`${inputClass} resize-y`}
            />
          )}

          {v.type === 'number' && (
            <input
              value={formatVnNumber(v.value)}
              onChange={(e) => onNumberInput(v.name, e.target.value)}
              placeholder="0"
              className={`${inputClass} text-blue-300 font-mono font-bold`}
            />
          )}

          {v.type === 'date' && (
            <input
              type="date"
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
            />
          )}

          {v.type === 'dropdown' && (
            <select
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
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
              className={inputClass}
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

          {v.type === 'project' && (
            <select
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn dự án --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.code} - {p.name}
                </option>
              ))}
            </select>
          )}

          {v.type === 'contractor' && (
            <select
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
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
            <select
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn gói thầu / nội dung chi phí --</option>
              {costPackages.map((cp) => (
                <option key={cp.id} value={cp.content}>
                  {cp.content} ({cp.category}) - {formatVnNumber(cp.contractValue || cp.estimateValue)} đ
                </option>
              ))}
            </select>
          )}

          {v.type === 'legal_doc' && (
            <select
              value={v.value}
              onChange={(e) => onVariableChange(v.name, e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn hồ sơ pháp lý --</option>
              {legalDocs.map((ld) => (
                <option key={ld.id} value={ld.content}>
                  {ld.content} {ld.fileName ? `(${ld.fileName})` : ''}
                </option>
              ))}
            </select>
          )}

          {(v.type === 'number_to_words' ||
            v.type === 'formula' ||
            v.type === 'project_dependent' ||
            v.type === 'contractor_dependent' ||
            v.type === 'cost_package_dependent' ||
            v.type === 'legal_doc_dependent') && (
            <div className="relative">
              <input
                value={v.value || ''}
                onChange={(e) => onVariableChange(v.name, e.target.value)}
                placeholder="Tự động trích xuất hoặc nhập tay..."
                className={`${inputClass} pr-8 ${v.value ? 'text-slate-100 font-medium' : 'text-slate-500 italic'}`}
              />
              <span
                className="absolute right-2.5 top-2.5 text-xs select-none pointer-events-none opacity-80"
                title={`Biến tự động: ${v.type}`}
              >
                {v.type === 'number_to_words' && '🤖'}
                {v.type === 'formula' && '∑'}
                {v.type === 'project_dependent' && '🏛️'}
                {v.type === 'contractor_dependent' && '🏢'}
                {v.type === 'cost_package_dependent' && '💰'}
                {v.type === 'legal_doc_dependent' && '📜'}
              </span>
            </div>
          )}

          {v.type === 'joint_venture' && (
            <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-slate-400 italic min-h-[38px] flex items-center text-sm">
              <span className="text-purple-400 mr-2">🤝</span>
              <span className="truncate">{v.value || 'Cấu hình ở danh sách Liên danh bên dưới'}</span>
            </div>
          )}

          {v.type === 'table' && (
            <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-slate-400 italic min-h-[38px] flex items-center text-sm">
              <span className="text-blue-400 mr-2">📊</span>
              <span className="truncate">{v.value ? `${JSON.parse(v.value).length} dòng` : 'Chưa có dữ liệu bảng'}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
};
