import React, { useState, useEffect } from 'react';
import { Settings2, Info } from 'lucide-react';
import { TemplateVariable } from '../../../../types/drafting';
import { AppModal } from '../../../common/AppModal';
import { AppButton } from '../../../common/AppButton';

interface VariableConfigDialogProps {
  isOpen: boolean;
  selectedText: string;
  existingVariables?: TemplateVariable[];
  onSave: (variable: Partial<TemplateVariable>) => void;
  onClose: () => void;
}

export const VariableConfigDialog: React.FC<VariableConfigDialogProps> = ({
  isOpen,
  selectedText,
  existingVariables = [],
  onSave,
  onClose,
}) => {
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
      setName('');
      setLabel(selectedText.substring(0, 50));
      setType('text');
      setOptionsStr('');
      setSourceVariableId('');
      setDependentConfig('');
      setFormulaExpression('');
      setJvField('');
      setParagraphIndent('1.0');
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

  const inputClass =
    'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors';
  const labelClass = 'block text-slate-400 font-semibold mb-1 text-sm';

  // Lọc biến cha phù hợp
  const compatibleSourceVars = existingVariables.filter((v) => {
    if (type === 'number_to_words') return v.type === 'number' || v.type === 'formula';
    if (type === 'cost_package_dependent') return v.type === 'cost_package';
    if (type === 'legal_doc_dependent') return v.type === 'legal_doc';
    if (type === 'contractor_dependent') return v.type === 'contractor';
    if (type === 'dependent_dropdown') return v.type === 'dropdown';
    return true;
  });

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      level={2}
      title={
        <div className="flex items-center gap-2">
          <Settings2 size={20} className="text-blue-400" />
          <span>Cấu hình biến văn bản mới</span>
        </div>
      }
      subtitle="Gán biến động vào vị trí đoạn văn bản đang chọn trên biểu mẫu"
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
            Tạo biến
          </AppButton>
        </div>
      }
    >
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* Text đã chọn */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-amber-400 uppercase font-bold text-xs mb-1 flex items-center gap-1.5">
            <Info size={14} /> Đoạn văn bản đã bôi đen trên biểu mẫu:
          </p>
          <p className="text-amber-200 font-medium break-words italic">
            "{selectedText || '(Chưa chọn text)'}"
          </p>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tên biến (viết liền không dấu) *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, '_'))}
              placeholder="vd: ten_du_an, gia_goi_thau"
              className={inputClass}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-1">Dùng làm mã tag trong biểu mẫu: {`{{${name || 'ten_bien'}}}`}</p>
          </div>

          <div>
            <label className={labelClass}>Nhãn hiển thị</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="vd: Tên dự án, Giá gói thầu"
              className={inputClass}
            />
            <p className="text-xs text-slate-500 mt-1">Tiêu đề hiển thị cho người dùng khi soạn thảo</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Loại biến</label>
          <select
            value={type}
            onChange={(e) => {
              const newType = e.target.value as TemplateVariable['type'];
              setType(newType);
              setDependentConfig('');
              setSourceVariableId('');
            }}
            className={inputClass}
          >
            <optgroup label="── 1. Dữ liệu Cơ bản ──">
              <option value="text">Văn bản ngắn (1 dòng)</option>
              <option value="long_text">Đoạn văn bản (nhiều dòng, có thụt lề)</option>
              <option value="number">Số tiền / Khối lượng (định dạng VN: 1.000.000)</option>
              <option value="number_to_words">Đọc số thành chữ tự động (Ví dụ: Một triệu đồng)</option>
              <option value="date">Ngày tháng (dd/mm/yyyy)</option>
            </optgroup>
            <optgroup label="── 2. Danh sách & Công thức ──">
              <option value="dropdown">Danh sách chọn tĩnh (Dropdown)</option>
              <option value="dependent_dropdown">Danh sách chọn phụ thuộc (Cascading Dropdown)</option>
              <option value="formula">Công thức tính toán (∑ Tự động cộng/trừ/nhân/chia)</option>
            </optgroup>
            <optgroup label="── 3. Dữ liệu Dự án ──">
              <option value="project">Chọn dự án từ cơ sở dữ liệu</option>
              <option value="project_dependent">Tự động trích xuất từ Thông tin dự án</option>
            </optgroup>
            <optgroup label="── 4. Dữ liệu Nhà thầu ──">
              <option value="contractor">Chọn nhà thầu từ cơ sở dữ liệu</option>
              <option value="contractor_dependent">Tự động trích xuất từ Nhà thầu đã chọn</option>
            </optgroup>
            <optgroup label="── 5. Dữ liệu Nội dung chi phí & Gói thầu ──">
              <option value="cost_package">Chọn gói thầu / nội dung chi phí từ dự án</option>
              <option value="cost_package_dependent">Tự động trích xuất từ Gói thầu đã chọn</option>
            </optgroup>
            <optgroup label="── 6. Dữ liệu Hồ sơ pháp lý ──">
              <option value="legal_doc">Chọn hồ sơ pháp lý từ dự án</option>
              <option value="legal_doc_dependent">Tự động trích xuất từ Hồ sơ pháp lý đã chọn</option>
            </optgroup>
            <optgroup label="── 7. Nâng cao ──">
              <option value="joint_venture">Khối Nhà thầu Liên danh (Tự nhân bản block)</option>
              <option value="table">Bảng biểu động (Vòng lặp bảng biểu Word)</option>
            </optgroup>
          </select>
        </div>

        {/* ================= CONDITIONAL CONFIG FIELDS ================= */}
        {type === 'dropdown' && (
          <div>
            <label className={labelClass}>Danh sách lựa chọn (cách nhau bởi dấu phẩy)</label>
            <input
              value={optionsStr}
              onChange={(e) => setOptionsStr(e.target.value)}
              placeholder="Chỉ định thầu rút gọn, Đấu thầu rộng rãi, Chào hàng cạnh tranh"
              className={inputClass}
            />
          </div>
        )}

        {/* Biến nguồn cho các loại phụ thuộc */}
        {(type === 'number_to_words' ||
          type === 'dependent_dropdown' ||
          type === 'contractor_dependent' ||
          type === 'cost_package_dependent' ||
          type === 'legal_doc_dependent') && (
          <div>
            <label className={labelClass}>Biến nguồn liên kết</label>
            {compatibleSourceVars.length > 0 ? (
              <select
                value={sourceVariableId}
                onChange={(e) => setSourceVariableId(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Chọn biến nguồn cha --</option>
                {compatibleSourceVars.map((v) => (
                  <option key={v.id} value={v.id}>
                    {`{{${v.name}}}`} - {v.label} ({v.type})
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={sourceVariableId}
                onChange={(e) => setSourceVariableId(e.target.value)}
                placeholder="Nhập tên mã biến cha (VD: goi_thau, nha_thau)"
                className={inputClass}
              />
            )}
            <p className="text-xs text-slate-500 mt-1">
              Biến này sẽ tự động cập nhật giá trị dựa theo biến cha được chọn ở trên.
            </p>
          </div>
        )}

        {/* project_dependent */}
        {type === 'project_dependent' && (
          <div>
            <label className={labelClass}>Trường dữ liệu từ Dự án</label>
            <select
              value={dependentConfig}
              onChange={(e) => setDependentConfig(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn trường dữ liệu cần lấy --</option>
              <option value="name">Tên dự án</option>
              <option value="code">Mã hiệu dự án</option>
              <option value="location">Địa điểm thực hiện</option>
              <option value="totalInvestment">Tổng mức đầu tư (đồng)</option>
              <option value="status">Trạng thái dự án</option>
              <option value="scale">Quy mô đầu tư</option>
              <option value="approvalDecision">Quyết định phê duyệt dự án</option>
              <option value="group">Nhóm dự án (A, B, C)</option>
              <option value="type">Loại công trình</option>
              <option value="level">Cấp công trình</option>
            </select>
          </div>
        )}

        {/* contractor_dependent */}
        {type === 'contractor_dependent' && (
          <div>
            <label className={labelClass}>Trường dữ liệu từ Nhà thầu</label>
            <select
              value={dependentConfig}
              onChange={(e) => setDependentConfig(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn trường thông tin nhà thầu --</option>
              <option value="representative">Người đại diện pháp luật</option>
              <option value="position">Chức vụ đại diện</option>
              <option value="address">Địa chỉ trụ sở</option>
              <option value="taxCode">Mã số thuế</option>
              <option value="bankAccount">Số tài khoản ngân hàng</option>
              <option value="bankName">Tên ngân hàng</option>
              <option value="phone">Số điện thoại</option>
              <option value="email">Email liên hệ</option>
            </select>
          </div>
        )}

        {/* cost_package_dependent */}
        {type === 'cost_package_dependent' && (
          <div>
            <label className={labelClass}>Trường dữ liệu từ Gói thầu / Nội dung chi phí</label>
            <select
              value={dependentConfig}
              onChange={(e) => setDependentConfig(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn trường cần lấy từ gói thầu --</option>
              <option value="content">Tên gói thầu / Nội dung chi phí</option>
              <option value="contractor">Đơn vị thực hiện / Nhà thầu</option>
              <option value="estimateValue">Giá trị dự toán gói thầu (đồng)</option>
              <option value="contractValue">Giá trị hợp đồng (đồng)</option>
              <option value="discountRate">Tỷ lệ giảm thầu (%)</option>
              <option value="biddingTime">Thời gian lựa chọn nhà thầu</option>
              <option value="biddingForm">Hình thức lựa chọn nhà thầu</option>
              <option value="biddingMethod">Phương thức LCNT</option>
              <option value="contractNumber">Số hợp đồng</option>
              <option value="contractDate">Ngày ký hợp đồng</option>
              <option value="contractType">Loại hợp đồng</option>
              <option value="executionTime">Thời gian thực hiện hợp đồng</option>
              <option value="status">Trạng thái gói thầu</option>
              <option value="category">Khoản mục chi phí (TVXD / XD / K)</option>
              <option value="costType">Loại chi phí (Chi phí / Phí)</option>
            </select>
          </div>
        )}

        {/* legal_doc_dependent */}
        {type === 'legal_doc_dependent' && (
          <div>
            <label className={labelClass}>Trường dữ liệu từ Hồ sơ pháp lý</label>
            <select
              value={dependentConfig}
              onChange={(e) => setDependentConfig(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn trường thông tin hồ sơ --</option>
              <option value="content">Nội dung hồ sơ pháp lý / Tên quyết định</option>
              <option value="fileName">Tên file đính kèm</option>
              <option value="note">Ghi chú</option>
            </select>
          </div>
        )}

        {/* dependent_dropdown */}
        {type === 'dependent_dropdown' && (
          <div>
            <label className={labelClass}>Cấu hình tùy chọn con (Cha1:Con1,Con2 | Cha2:Con3,Con4)</label>
            <input
              value={dependentConfig}
              onChange={(e) => setDependentConfig(e.target.value)}
              placeholder="Hà Nội:Ba Đình,Cầu Giấy | TP.HCM:Quận 1,Quận 3"
              className={inputClass}
            />
          </div>
        )}

        {/* formula */}
        {type === 'formula' && (
          <div>
            <label className={labelClass}>Biểu thức công thức toán học</label>
            <input
              value={formulaExpression}
              onChange={(e) => setFormulaExpression(e.target.value)}
              placeholder="{{gia_hop_dong}} * 0.1"
              className={inputClass}
            />
            <p className="text-xs text-slate-500 mt-1">
              Hỗ trợ +, -, *, /, và mã các biến dạng {`{{ten_bien}}`}.
            </p>
          </div>
        )}

        {/* joint_venture */}
        {type === 'joint_venture' && (
          <div>
            <label className={labelClass}>Trường thành viên Liên danh (JV Field)</label>
            <select
              value={jvField}
              onChange={(e) => setJvField(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Chọn trường dữ liệu liên danh --</option>
              <option value="company_name">Tên nhà thầu thành viên</option>
              <option value="representative">Người đại diện</option>
              <option value="position">Chức vụ</option>
              <option value="address">Địa chỉ</option>
              <option value="tax_code">Mã số thuế</option>
              <option value="bank_account">Số tài khoản</option>
              <option value="bank_name">Ngân hàng</option>
              <option value="phone">Số điện thoại</option>
              <option value="email">Email</option>
              <option value="_custom_text">Trường tùy chỉnh (chữ)</option>
              <option value="_custom_number">Trường tùy chỉnh (số)</option>
              <option value="_custom_date">Trường tùy chỉnh (ngày)</option>
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
    </AppModal>
  );
};
