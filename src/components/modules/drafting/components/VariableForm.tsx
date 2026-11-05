import React from 'react';
import { TemplateVariable } from '../../../../types/drafting';
import { formatVnNumber } from '../../../../utils/numberUtils';
import { ProjectListItem, ContractorItem } from '../../../../types/project';

interface VariableFormProps {
  draftVariables: TemplateVariable[];
  projects: ProjectListItem[];
  companies: ContractorItem[];
  onVariableChange: (varName: string, value: string) => void;
  onNumberInput: (varName: string, value: string) => void;
}

export const VariableForm: React.FC<VariableFormProps> = ({
  draftVariables,
  projects,
  companies,
  onVariableChange,
  onNumberInput,
}) => {
  const inputClass = 'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500';

  // Deduplicate by name
  const uniqueVars: TemplateVariable[] = [];
  draftVariables.forEach(v => {
    if (!uniqueVars.find(u => u.name === v.name)) uniqueVars.push(v);
  });

  return (
    <>
      {uniqueVars.map(v => (
        <div key={v.id} className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400">{v.label || v.name}</label>

          {v.type === 'text' && (
            <input value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} placeholder="Nhập văn bản..." className={inputClass} />
          )}
          {v.type === 'long_text' && (
            <textarea value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} placeholder="Nhập đoạn văn bản..." rows={3} className={`${inputClass} resize-y`} />
          )}
          {v.type === 'number' && (
            <input value={formatVnNumber(v.value)} onChange={e => onNumberInput(v.name, e.target.value)} placeholder="0" className={`${inputClass} text-blue-300 font-mono font-bold`} />
          )}
          {v.type === 'date' && (
            <input type="date" value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} className={inputClass} />
          )}
          {v.type === 'dropdown' && (
            <select value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} className={inputClass}>
              <option value="">-- Chọn --</option>
              {(v.optionsStr || '').split(',').map((o, i) => <option key={i} value={o.trim()}>{o.trim()}</option>)}
            </select>
          )}
          {v.type === 'dependent_dropdown' && (
            <select value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} className={inputClass}>
              <option value="">-- Chọn --</option>
              {/* dependent options will be resolved by parent variable */}
              {(v.optionsStr || '').split(',').map((o, i) => <option key={i} value={o.trim()}>{o.trim()}</option>)}
            </select>
          )}
          {v.type === 'project' && (
            <select value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} className={inputClass}>
              <option value="">-- Chọn dự án --</option>
              {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          )}
          {v.type === 'contractor' && (
            <select value={v.value} onChange={e => onVariableChange(v.name, e.target.value)} className={inputClass}>
              <option value="">-- Chọn nhà thầu --</option>
              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          {(v.type === 'number_to_words' || v.type === 'formula' || v.type === 'project_dependent' || v.type === 'contractor_dependent') && (
            <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-xs text-slate-400 italic min-h-[36px] flex items-center">
              {v.type === 'number_to_words' && <span className="text-slate-500 mr-1.5">🤖</span>}
              {v.type === 'formula' && <span className="text-slate-500 mr-1.5">∑</span>}
              {(v.type === 'project_dependent' || v.type === 'contractor_dependent') && <span className="text-slate-500 mr-1.5">🧬</span>}
              <span className="truncate">{v.value || 'Tự động...'}</span>
            </div>
          )}
          {v.type === 'joint_venture' && (
            <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-xs text-slate-400 italic min-h-[36px] flex items-center">
              <span className="text-slate-500 mr-1.5">🤝</span>
              <span className="truncate">{v.value || 'Cấu hình ở panel Liên danh'}</span>
            </div>
          )}
          {v.type === 'table' && (
            <div className="px-3 py-2 bg-[#080d1a] border border-[#232f4e] rounded-lg text-xs text-slate-400 italic min-h-[36px] flex items-center">
              <span className="text-slate-500 mr-1.5">📊</span>
              <span className="truncate">{v.value ? `${JSON.parse(v.value).length} dòng` : 'Chưa có dữ liệu'}</span>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

