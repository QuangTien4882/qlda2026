import React, { useState, useEffect } from 'react';
import { Settings2, Info, Link2, CheckCircle2 } from 'lucide-react';
import { TemplateVariable } from '../../../../types/drafting';
import { AppModal } from '../../../common/AppModal';
import { AppButton } from '../../../common/AppButton';

interface VariableConfigDialogProps {
  isOpen: boolean;
  selectedText: string;
  editingVariable?: TemplateVariable | null;
  existingVariables?: TemplateVariable[];
  onSave: (variable: Partial<TemplateVariable>) => void;
  onClose: () => void;
}

export const VariableConfigDialog: React.FC<VariableConfigDialogProps> = ({
  isOpen,
  selectedText,
  editingVariable = null,
  existingVariables = [],
  onSave,
  onClose,
}) => {
  const [selectedExistingVarId, setSelectedExistingVarId] = useState<string>('');

  // Form fields
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<TemplateVariable['type']>('text');
  const [optionsStr, setOptionsStr] = useState('');
  const [sourceVariableId, setSourceVariableId] = useState('');
  const [dependentConfig, setDependentConfig] = useState('');
  const [formulaExpression, setFormulaExpression] = useState('');
  const [jvField, setJvField] = useState('');
  const [paragraphIndent, setParagraphIndent] = useState('1.0');

  useEffect(() => {
    if (isOpen) {
      if (editingVariable) {
        // Chế độ chỉnh sửa biến đã có
        setSelectedExistingVarId('');
        setName(editingVariable.name);
        setLabel(editingVariable.label || editingVariable.name);
        setType(editingVariable.type);
        setOptionsStr(editingVariable.optionsStr || '');
        setSourceVariableId(editingVariable.sourceVariableId || '');
        setDependentConfig(editingVariable.dependentConfig || '');
        setFormulaExpression(editingVariable.formulaExpression || '');
        setJvField(editingVariable.jvField || '');
        setParagraphIndent(editingVariable.paragraphIndent || '1.0');
      } else {
        // Chế độ tạo biến mới hoặc gán vào biến đã có từ text bôi đen
        const cleanSelected = selectedText
          .trim()
          .replace(/^(\[|\{|\<)+|(\]|\}|\>)+$/g, '')
          .trim();

        // Kiểm tra xem đoạn text bôi đen có khớp với biến đã tồn tại nào không
        const matched = existingVariables.find(
          (v) =>
            v.name.toLowerCase() === cleanSelected.toLowerCase() ||
            v.originalText.trim().toLowerCase() === selectedText.trim().toLowerCase() ||
            (v.originalTexts &&
              v.originalTexts.some((t) => t.trim().toLowerCase() === selectedText.trim().toLowerCase()))
        );

        if (matched) {
          setSelectedExistingVarId(matched.id);
          setName(matched.name);
          setLabel(matched.label);
          setType(matched.type);
          setOptionsStr(matched.optionsStr || '');
          setSourceVariableId(matched.sourceVariableId || '');
          setDependentConfig(matched.dependentConfig || '');
          setFormulaExpression(matched.formulaExpression || '');
          setJvField(matched.jvField || '');
          setParagraphIndent(matched.paragraphIndent || '1.0');
        } else {
          setSelectedExistingVarId('');
          setName(cleanSelected || '');
          setLabel(cleanSelected || selectedText.substring(0, 50));
          setType('text');
          setOptionsStr('');
          setSourceVariableId('');
          setDependentConfig('');
          setFormulaExpression('');
          setJvField('');
          setParagraphIndent('1.0');
        }
      }
    }
  }, [isOpen, selectedText, existingVariables, editingVariable]);

  const handleSelectExistingVar = (targetVar: TemplateVariable) => {
    setSelectedExistingVarId(targetVar.id);
    setName(targetVar.name);
    setLabel(targetVar.label);
    setType(targetVar.type);
    setOptionsStr(targetVar.optionsStr || '');
    setSourceVariableId(targetVar.sourceVariableId || '');
    setDependentConfig(targetVar.dependentConfig || '');
  };

  const handleTypeChange = (newType: TemplateVariable['type']) => {
    setType(newType);
    setDependentConfig('');

    // Tự động chọn biến nguồn tương thích nhất nếu có
    let compat: TemplateVariable[] = [];
    if (newType === 'contractor_dependent') {
      compat = existingVariables.filter(
        (v) =>
          v.type === 'contractor' ||
          (v.type === 'cost_package_dependent' && v.dependentConfig === 'contractor') ||
          v.name.includes('nha_thau') ||
          v.label.includes('nhà thầu')
      );
    } else if (newType === 'cost_package_dependent') {
      compat = existingVariables.filter((v) => v.type === 'cost_package');
    } else if (newType === 'number_to_words') {
      compat = existingVariables.filter(
        (v) =>
          v.type === 'number' ||
          v.type === 'formula' ||
          (v.type === 'project_dependent' && v.dependentConfig === 'totalInvestment') ||
          (v.type === 'cost_package_dependent' &&
            (v.dependentConfig === 'estimateValue' || v.dependentConfig === 'contractValue'))
      );
    } else if (newType === 'dependent_dropdown') {
      compat = existingVariables.filter((v) => v.type === 'dropdown');
    }

    if (compat.length > 0) {
      setSourceVariableId(compat[0].id);
    } else {
      setSourceVariableId('');
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingVariable) {
      onSave({
        id: editingVariable.id,
        name: name.trim(),
        label: label.trim() || name.trim(),
        type,
        optionsStr: optionsStr || undefined,
        sourceVariableId: sourceVariableId || undefined,
        dependentConfig: dependentConfig || undefined,
        formulaExpression: formulaExpression || undefined,
        jvField: jvField || undefined,
        paragraphIndent: paragraphIndent || undefined,
      });
      return;
    }

    if (selectedExistingVarId) {
      const targetVar = existingVariables.find((v) => v.id === selectedExistingVarId);
      if (targetVar) {
        onSave({
          ...targetVar,
          originalText: selectedText,
        });
        return;
      }
    }

    // Biến mới
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

  const inputClass =
    'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-sm';
  const labelClass = 'block text-slate-400 font-semibold mb-1 text-sm';

  // Phân loại nguồn tương thích cao và nguồn thông thường
  const getCompatibleSources = () => {
    if (type === 'contractor_dependent') {
      const highCompat = existingVariables.filter(
        (v) =>
          v.type === 'contractor' ||
          (v.type === 'cost_package_dependent' && v.dependentConfig === 'contractor') ||
          v.name.includes('nha_thau') ||
          v.label.includes('nhà thầu')
      );
      const others = existingVariables.filter((v) => !highCompat.includes(v));
      return { highCompat, others, highLabel: 'Biến cung cấp tên nhà thầu (Khuyên dùng)' };
    }

    if (type === 'number_to_words') {
      const highCompat = existingVariables.filter(
        (v) =>
          v.type === 'number' ||
          v.type === 'formula' ||
          (v.type === 'project_dependent' && v.dependentConfig === 'totalInvestment') ||
          (v.type === 'cost_package_dependent' &&
            (v.dependentConfig === 'estimateValue' || v.dependentConfig === 'contractValue'))
      );
      const others = existingVariables.filter((v) => !highCompat.includes(v));
      return { highCompat, others, highLabel: 'Biến chứa giá trị số / tiền tệ (Khuyên dùng)' };
    }

    if (type === 'cost_package_dependent') {
      const highCompat = existingVariables.filter((v) => v.type === 'cost_package');
      const others = existingVariables.filter((v) => !highCompat.includes(v));
      return { highCompat, others, highLabel: 'Biến chọn gói thầu từ dự án (Khuyên dùng)' };
    }

    if (type === 'dependent_dropdown') {
      const highCompat = existingVariables.filter((v) => v.type === 'dropdown');
      const others = existingVariables.filter((v) => !highCompat.includes(v));
      return { highCompat, others, highLabel: 'Biến danh sách chọn cha (Khuyên dùng)' };
    }

    return { highCompat: existingVariables, others: [], highLabel: 'Biến có sẵn' };
  };

  const { highCompat, others, highLabel } = getCompatibleSources();
  const selectedExistingVar = existingVariables.find((v) => v.id === selectedExistingVarId);

  // Tìm các biến đã có khớp với từ khóa đang gõ (theo name hoặc label)
  const query = name.trim().toLowerCase();
  const matchingSuggestions =
    query.length > 0 && !editingVariable
      ? existingVariables.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.label.toLowerCase().includes(query)
        )
      : [];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      level={2}
      title={
        <div className="flex items-center gap-2">
          <Settings2 size={20} className="text-blue-400" />
          <span>{editingVariable ? `Chỉnh sửa biến {{${editingVariable.name}}}` : 'Cấu hình biến cho biểu mẫu'}</span>
        </div>
      }
      subtitle={
        editingVariable
          ? 'Cập nhật tên biến, nhãn hiển thị hoặc kiểu dữ liệu'
          : 'Gán biến động hoặc liên kết với biến đã có để đồng bộ dữ liệu'
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <AppButton variant="secondary" onClick={onClose}>
            Hủy bỏ
          </AppButton>
          <AppButton
            variant="primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {editingVariable ? 'Lưu thay đổi' : selectedExistingVarId ? 'Gán vào biến đã có' : 'Tạo biến'}
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Text đã chọn */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 uppercase font-bold text-xs mb-1 flex items-center gap-1.5">
            <Info size={14} /> {editingVariable ? 'Văn bản gốc của biến trên biểu mẫu:' : 'Đoạn văn bản vừa bôi đen trên biểu mẫu:'}
          </p>
          <p className="text-amber-200 font-medium break-words italic">
            "{selectedText || editingVariable?.originalText || '(Chưa chọn text)'}"
          </p>
        </div>

        {/* Thông báo nếu đã chọn liên kết với biến có sẵn */}
        {selectedExistingVar && !editingVariable && (
          <div className="p-3 bg-blue-500/15 border border-blue-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-blue-400 shrink-0" />
              <span className="text-xs text-blue-200">
                Đang liên kết với biến: <strong className="font-mono text-white">{`{{${selectedExistingVar.name}}}`}</strong> ({selectedExistingVar.label})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedExistingVarId('')}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline shrink-0 ml-2"
            >
              Đổi thành biến mới độc lập
            </button>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className={labelClass}>Tên biến (viết liền không dấu) *</label>
              <input
                value={name}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '_');
                  setName(val);
                }}
                placeholder="vd: ten_du_an, dia_chi_nha_thau"
                className={inputClass}
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                Mã tag trên biểu mẫu: {`{{${name || 'ten_bien'}}}`}
              </p>

              {/* Gợi ý biến đã có khớp từ khóa đang nhập */}
              {matchingSuggestions.length > 0 && (
                <div className="mt-2 p-2.5 bg-[#0b1329] border border-blue-500/40 rounded-xl shadow-2xl animate-fadeIn">
                  <p className="text-xs text-blue-400 font-bold mb-1.5 flex items-center gap-1.5">
                    <Link2 size={14} className="text-blue-400 shrink-0" />
                    <span>Biến đã có khớp từ đang nhập (bấm để gán nhanh):</span>
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {matchingSuggestions.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectExistingVar(v)}
                        className="w-full text-left p-2 rounded-lg bg-[#131d36] hover:bg-blue-600/30 border border-blue-500/20 hover:border-blue-400 transition-all flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-blue-300 group-hover:text-blue-100">
                            {`{{${v.name}}}`}
                          </span>
                          <span className="text-xs text-slate-300 group-hover:text-white truncate">
                            {v.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono border border-blue-800/40 shrink-0">
                            {v.type}
                          </span>
                        </div>
                        <span className="text-xs text-blue-400 group-hover:text-blue-300 font-semibold shrink-0">
                          Gán biến này ↵
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Nhãn hiển thị</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="vd: Địa chỉ nhà thầu"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">Tiêu đề hiển thị cho người dùng khi soạn thảo</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Loại biến / Kiểu dữ liệu</label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as TemplateVariable['type'])}
              className={inputClass}
            >
              <optgroup label="Dữ liệu nhập tay cơ bản">
                <option value="text">Văn bản ngắn (1 dòng)</option>
                <option value="long_text">Đoạn văn bản dài (nhiều dòng, thụt lề)</option>
                <option value="number">Số tiền / Số lượng (định dạng 1.000.000)</option>
                <option value="date">Ngày tháng (chuẩn Việt Nam dd/mm/yyyy)</option>
                <option value="dropdown">Danh sách chọn (cố định)</option>
              </optgroup>
              <optgroup label="Tự động lấy từ Dự án / Gói thầu / Nhà thầu">
                <option value="project">Chọn Tên Dự án (từ cơ sở dữ liệu)</option>
                <option value="project_dependent">Thông tin Dự án (tên, mã, địa điểm, tổng mức...)</option>
                <option value="cost_package">Chọn Gói thầu / Nội dung chi phí (từ dự án)</option>
                <option value="cost_package_dependent">Trích xuất từ Gói thầu (tên nhà thầu, giá trị, hình thức...)</option>
                <option value="contractor">Chọn Nhà thầu (danh mục đối tác)</option>
                <option value="contractor_dependent">Trích xuất từ Nhà thầu (MST, địa chỉ, người ĐD, chức vụ...)</option>
                <option value="legal_doc">Hồ sơ pháp lý (tích chọn nhiều hồ sơ có tìm kiếm)</option>
              </optgroup>
              <optgroup label="Tự động nâng cao">
                <option value="number_to_words">Đọc số thành chữ (tiền tệ VNĐ tự động)</option>
                <option value="formula">Công thức tính toán (ví dụ: VAT, tỷ lệ %)</option>
                <option value="dependent_dropdown">Danh sách chọn phụ thuộc</option>
                <option value="joint_venture">Trường thông tin Liên danh nhà thầu</option>
                <option value="table">Bảng dữ liệu lặp dòng (Docxtemplater)</option>
              </optgroup>
            </select>
          </div>

          {/* project */}
          {type === 'project' && (
            <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-center gap-2">
              <span className="text-base shrink-0">🏛️</span>
              <span>
                Biến này sẽ hiển thị danh sách tất cả các <strong>Dự án</strong> từ cơ sở dữ liệu để chọn khi soạn thảo văn bản.
              </span>
            </div>
          )}

          {/* project_dependent */}
          {type === 'project_dependent' && (
            <div>
              <label className={labelClass}>Chọn thông tin dự án cần trích xuất</label>
              <select
                value={dependentConfig}
                onChange={(e) => setDependentConfig(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn trường thông tin --</option>
                <option value="name">Tên dự án (Chọn dự án từ CSDL)</option>
                <option value="code">Mã dự án</option>
                <option value="location">Địa điểm xây dựng</option>
                <option value="totalInvestment">Tổng mức đầu tư</option>
                <option value="status">Trạng thái dự án</option>
                <option value="scale">Quy mô đầu tư</option>
                <option value="approvalDecision">Quyết định phê duyệt</option>
                <option value="group">Nhóm dự án</option>
                <option value="type">Loại công trình</option>
                <option value="level">Cấp công trình</option>
              </select>
            </div>
          )}

          {/* cost_package_dependent */}
          {type === 'cost_package_dependent' && (
            <div className="space-y-3 p-3 bg-[#0c1424] border border-[#232f4e] rounded-xl">
              <div>
                <label className={labelClass}>Lấy dữ liệu từ gói thầu nào?</label>
                <select
                  value={sourceVariableId}
                  onChange={(e) => setSourceVariableId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Tự động lấy gói thầu đã chọn của dự án --</option>
                  {highCompat.length > 0 && (
                    <optgroup label={highLabel}>
                      {highCompat.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Các biến khác">
                      {others.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>Trường thông tin cần trích xuất</label>
                <select
                  value={dependentConfig}
                  onChange={(e) => setDependentConfig(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Chọn trường --</option>
                  <option value="contractor">Tên nhà thầu trúng thầu</option>
                  <option value="contractValue">Giá trị trúng thầu / Hợp đồng</option>
                  <option value="estimateValue">Giá trị dự toán gói thầu</option>
                  <option value="contractNumber">Số hợp đồng</option>
                  <option value="contractDate">Ngày ký hợp đồng</option>
                  <option value="biddingForm">Hình thức lựa chọn nhà thầu</option>
                  <option value="biddingMethod">Phương thức đấu thầu</option>
                  <option value="executionTime">Thời gian thực hiện hợp đồng</option>
                  <option value="contractType">Loại hợp đồng</option>
                  <option value="discountRate">Tỷ lệ giảm giá (%)</option>
                  <option value="biddingTime">Thời gian tổ chức LCNT</option>
                  <option value="status">Trạng thái gói thầu</option>
                  <option value="category">Phân loại chi phí</option>
                </select>
              </div>
            </div>
          )}

          {/* contractor_dependent */}
          {type === 'contractor_dependent' && (
            <div className="space-y-3 p-3 bg-[#0c1424] border border-[#232f4e] rounded-xl">
              <div>
                <label className={labelClass}>Lấy thông tin từ nhà thầu nào?</label>
                <select
                  value={sourceVariableId}
                  onChange={(e) => setSourceVariableId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Tự động tìm từ nhà thầu đã trúng thầu / đã chọn --</option>
                  {highCompat.length > 0 && (
                    <optgroup label={highLabel}>
                      {highCompat.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label} ({v.type})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Các biến khác">
                      {others.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className={labelClass}>Thông tin cần trích xuất từ nhà thầu</label>
                <select
                  value={dependentConfig}
                  onChange={(e) => setDependentConfig(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Chọn thông tin --</option>
                  <option value="taxCode">Mã số thuế</option>
                  <option value="address">Địa chỉ trụ sở chính</option>
                  <option value="representative">Người đại diện pháp luật</option>
                  <option value="position">Chức vụ người đại diện</option>
                  <option value="phone">Số điện thoại</option>
                  <option value="email">Email liên hệ</option>
                  <option value="bankAccount">Số tài khoản ngân hàng</option>
                  <option value="bankName">Tên ngân hàng</option>
                  <option value="shortName">Tên viết tắt</option>
                </select>
              </div>
            </div>
          )}

          {/* number_to_words */}
          {type === 'number_to_words' && (
            <div className="space-y-3 p-3 bg-[#0c1424] border border-[#232f4e] rounded-xl">
              <div>
                <label className={labelClass}>Đọc số tiền thành chữ từ biến nào?</label>
                <select
                  value={sourceVariableId}
                  onChange={(e) => setSourceVariableId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Tự động tìm biến tiền tệ / giá trị --</option>
                  {highCompat.length > 0 && (
                    <optgroup label={highLabel}>
                      {highCompat.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Các biến khác">
                      {others.map((v) => (
                        <option key={v.id} value={v.id}>
                          {`{{${v.name}}}`} — {v.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* formula */}
          {type === 'formula' && (
            <div className="space-y-2 p-3 bg-[#0c1424] border border-[#232f4e] rounded-xl">
              <label className={labelClass}>Biểu thức tính toán toán học</label>
              <input
                value={formulaExpression}
                onChange={(e) => setFormulaExpression(e.target.value)}
                placeholder="vd: {{gia_truoc_vat}} * 0.08"
                className={inputClass}
              />
              <p className="text-xs text-slate-500">
                Sử dụng cú pháp <code>{`{{ten_bien}}`}</code> và các phép toán <code>+ - * / ( )</code>.
              </p>
            </div>
          )}

          {/* dropdown */}
          {type === 'dropdown' && (
            <div>
              <label className={labelClass}>Các tùy chọn (phân cách bằng dấu phẩy)</label>
              <input
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="vd: Lựa chọn A, Lựa chọn B, Lựa chọn C"
                className={inputClass}
              />
            </div>
          )}

          {/* dependent_dropdown */}
          {type === 'dependent_dropdown' && (
            <div className="space-y-3 p-3 bg-[#0c1424] border border-[#232f4e] rounded-xl">
              <div>
                <label className={labelClass}>Biến danh sách chọn cha</label>
                <select
                  value={sourceVariableId}
                  onChange={(e) => setSourceVariableId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">-- Chọn biến dropdown cha --</option>
                  {highCompat.map((v) => (
                    <option key={v.id} value={v.id}>
                      {`{{${v.name}}}`} — {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cấu hình tùy chọn theo JSON</label>
                <textarea
                  rows={3}
                  value={optionsStr}
                  onChange={(e) => setOptionsStr(e.target.value)}
                  placeholder={`{\n  "Cha A": ["Con 1", "Con 2"],\n  "Cha B": ["Con 3"]\n}`}
                  className={`${inputClass} font-mono text-xs`}
                />
              </div>
            </div>
          )}

          {/* joint_venture */}
          {type === 'joint_venture' && (
            <div>
              <label className={labelClass}>Trường liên danh</label>
              <select
                value={jvField}
                onChange={(e) => setJvField(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn trường liên danh --</option>
                <option value="name">Tên thành viên liên danh</option>
                <option value="taxCode">Mã số thuế</option>
                <option value="address">Địa chỉ trụ sở</option>
                <option value="representative">Người đại diện</option>
                <option value="position">Chức vụ đại diện</option>
                <option value="role">Vai trò (Đứng đầu / Thành viên)</option>
                <option value="rate">Tỷ lệ đảm nhận (%)</option>
              </select>
            </div>
          )}

          {/* long_text */}
          {type === 'long_text' && (
            <div>
              <label className={labelClass}>Thụt đầu dòng mỗi đoạn khi xuất Word (cm)</label>
              <input
                type="number"
                step="0.2"
                value={paragraphIndent}
                onChange={(e) => setParagraphIndent(e.target.value)}
                placeholder="1.0"
                className={inputClass}
              />
              <p className="text-xs text-slate-500 mt-1">Mặc định văn bản hành chính Việt Nam thụt 1.0 cm hoặc 1.27 cm.</p>
            </div>
          )}

          {/* table */}
          {type === 'table' && (
            <div>
              <label className={labelClass}>Cấu hình cột bảng (cột1, cột2:number, ...)</label>
              <input
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder="stt, noi_dung, khoi_luong:number, don_gia:number, thanh_tien:number"
                className={inputClass}
              />
            </div>
          )}
        </div>
      </div>
    </AppModal>
  );
};
