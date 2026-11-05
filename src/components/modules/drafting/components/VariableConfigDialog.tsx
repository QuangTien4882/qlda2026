import React, { useState, useEffect } from 'react';
import { Settings2, X } from 'lucide-react';
import { TemplateVariable } from '../../../../types/drafting';

interface VariableConfigDialogProps {
  isOpen: boolean;
  selectedText: string;
  onSave: (variable: Partial<TemplateVariable>) => void;
  onClose: () => void;
}

export const VariableConfigDialog: React.FC<VariableConfigDialogProps> = ({ isOpen, selectedText, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<TemplateVariable['type']>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [sourceVariableId, setSourceVariableId] = useState('');
  const [dependentConfig, setDependentConfig] = useState('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [jvField, setJvField] = useState('');
  const [paragraphIndent, setParagraphIndent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setLabel(selectedText.substring(0, 50));
      setType('text');
      setOptionsStr('');
      setSourceVariableId('');
      setDependentConfig('');
      setFormulaExpression('');
      setJvField('');
      setParagraphIndent('');
    }
  }, [isOpen, selectedText]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      label: label.trim() || name.trim(),
      type,
      originalText: selectedText,
      value: '',
      optionsStr: optionsStr || undefined,
      sourceVariableId: sourceVariableId || undefined,
      dependentConfig: dependentConfig || undefined,
      formulaExpression: formulaExpression || undefined,
      jvField: jvField || undefined,
      paragraphIndent: paragraphIndent || undefined,
    });
  };

  const inputClass = 'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0c1424] border border-[#232f4e] rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Settings2 size={16} className="text-blue-400" /> Cấu hình biến mới
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={18} /></button>
        </div>

        <div className="mb-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-[10px] text-amber-400 uppercase font-bold mb-1">Text đã chọn</p>
          <p className="text-xs text-amber-200 font-medium break-words">"{selectedText}"</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tên biến (không dấu, duy nhất) *</label>
            <input value={name} onChange={e => setName(e.target.value.replace(/\s/g, '_'))} placeholder="vd: ten_du_an" className={inputClass} autoFocus />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Nhãn hiển thị</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="vd: Tên dự án" className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Loại biến</label>
            <select value={type} onChange={e => setType(e.target.value as TemplateVariable['type'])} className={inputClass}>
              <option value="text">Văn bản ngắn</option>
              <option value="long_text">Đoạn văn bản (nhiều dòng)</option>
              <option value="number">Số (định dạng VN)</option>
              <option value="number_to_words">Đọc số thành chữ</option>
              <option value="date">Ngày tháng</option>
              <option value="formula">Công thức tính toán</option>
              <option value="dropdown">Danh sách chọn</option>
              <option value="dependent_dropdown">Danh sách phụ thuộc</option>
              <option value="project">Chọn dự án</option>
              <option value="contractor">Chọn nhà thầu</option>
              <option value="project_dependent">Tự động từ dự án</option>
              <option value="contractor_dependent">Tự động từ nhà thầu</option>
              <option value="joint_venture">Liên danh</option>
              <option value="table">Bảng động</option>
            </select>
          </div>

          {/* Conditional fields based on type */}
          {type === 'dropdown' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Danh sách lựa chọn (phân cách bằng dấu phẩy)</label>
              <input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder="Lựa chọn A, Lựa chọn B, Lựa chọn C" className={inputClass} />
            </div>
          )}
          {(type === 'number_to_words' || type === 'dependent_dropdown' || type === 'project_dependent' || type === 'contractor_dependent') && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">ID biến nguồn</label>
              <input value={sourceVariableId} onChange={e => setSourceVariableId(e.target.value)} placeholder="ID biến cha" className={inputClass} />
            </div>
          )}
          {(type === 'dependent_dropdown' || type === 'project_dependent' || type === 'contractor_dependent') && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cấu hình phụ thuộc</label>
              <input value={dependentConfig} onChange={e => setDependentConfig(e.target.value)} placeholder="vd: location hoặc GiaTri1:Con1,Con2" className={inputClass} />
            </div>
          )}
          {type === 'formula' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Biểu thức công thức</label>
              <input value={formulaExpression} onChange={e => setFormulaExpression(e.target.value)} placeholder="{{bien_a}} + {{bien_b}}" className={inputClass} />
            </div>
          )}
          {type === 'joint_venture' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">JV Field mapping</label>
              <select value={jvField} onChange={e => setJvField(e.target.value)} className={inputClass}>
                <option value="">-- Chọn field --</option>
                <option value="company_name">Tên công ty</option>
                <option value="representative">Người đại diện</option>
                <option value="position">Chức vụ</option>
                <option value="address">Địa chỉ</option>
                <option value="tax_code">MST</option>
                <option value="bank_account">Số TK</option>
                <option value="bank_name">Ngân hàng</option>
                <option value="phone">Điện thoại</option>
                <option value="email">Email</option>
                <option value="_custom_text">Tuỳ chỉnh (text)</option>
                <option value="_custom_number">Tuỳ chỉnh (số)</option>
                <option value="_custom_date">Tuỳ chỉnh (ngày)</option>
              </select>
            </div>
          )}
          {type === 'long_text' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Thụt đầu dòng (cm)</label>
              <input value={paragraphIndent} onChange={e => setParagraphIndent(e.target.value)} placeholder="0" className={inputClass} />
            </div>
          )}
          {type === 'table' && (
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Cột bảng (phân cách phẩy, col:type)</label>
              <input value={optionsStr} onChange={e => setOptionsStr(e.target.value)} placeholder="stt, noi_dung, gia_tri:number" className={inputClass} />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg border border-[#232f4e] text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors">Hủy</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Tạo biến</button>
        </div>
      </div>
    </div>
  );
};

