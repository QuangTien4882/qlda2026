import React, { useState } from 'react';
import { Plus, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { JVMember } from '../../../../types/drafting';
import { ContractorItem } from '../../../../types/project';
import { generateId } from '../../../../utils/docxUtils';

interface JointVenturePickerProps {
  jvMembers: JVMember[];
  companies: ContractorItem[];
  onMembersChange: (members: JVMember[]) => void;
}

/** Tên thứ tự bằng chữ tiếng Việt */
const JV_STT_WORDS = ['thứ nhất', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'thứ tám', 'thứ chín', 'thứ mười'];

function createEmptyMember(): JVMember {
  return {
    id: generateId('jvm'),
    company_name: '',
    representative: '',
    position: '',
    address: '',
    tax_code: '',
    bank_account: '',
    bank_name: '',
    registration_date: '',
    phone: '',
    email: '',
    _custom_fields: {},
  };
}

export const JointVenturePicker: React.FC<JointVenturePickerProps> = ({
  jvMembers,
  companies,
  onMembersChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMemberIdx, setExpandedMemberIdx] = useState<number | null>(null);

  const handleAddMember = () => {
    onMembersChange([...jvMembers, createEmptyMember()]);
  };

  const handleRemoveMember = (idx: number) => {
    onMembersChange(jvMembers.filter((_, i) => i !== idx));
  };

  const handleSelectCompany = (idx: number, companyName: string) => {
    const company = companies.find(c => c.name === companyName);
    const updated = [...jvMembers];

    if (company) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cAny = company as any;
      updated[idx] = {
        ...updated[idx],
        company_name: company.name || '',
        representative: cAny.representative || cAny.nguoiDaiDien || '',
        position: cAny.position || cAny.chucVu || '',
        address: cAny.address || cAny.diaChi || '',
        tax_code: cAny.tax_code || cAny.maSoThue || '',
        bank_account: cAny.bank_account || cAny.soTaiKhoan || '',
        bank_name: cAny.bank_name || cAny.nganHang || '',
        phone: cAny.phone || cAny.soDienThoai || '',
        email: cAny.email || '',
      };
    } else {
      updated[idx] = { ...updated[idx], company_name: companyName };
    }

    onMembersChange(updated);
  };

  const handleFieldChange = (idx: number, field: keyof JVMember, value: string) => {
    const updated = [...jvMembers];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[idx] as any)[field] = value;
    onMembersChange(updated);
  };

  const handleCustomFieldChange = (idx: number, fieldKey: string, value: string) => {
    const updated = [...jvMembers];
    updated[idx] = {
      ...updated[idx],
      _custom_fields: { ...updated[idx]._custom_fields, [fieldKey]: value },
    };
    onMembersChange(updated);
  };

  const inputClass = 'w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500';

  const fields: { key: keyof JVMember; label: string }[] = [
    { key: 'representative', label: 'Người đại diện' },
    { key: 'position', label: 'Chức vụ' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'tax_code', label: 'MST' },
    { key: 'bank_account', label: 'Số tài khoản' },
    { key: 'bank_name', label: 'Ngân hàng' },
    { key: 'phone', label: 'Điện thoại' },
    { key: 'email', label: 'Email' },
  ];

  return (
    <div className="p-3 bg-[#0b1222] border border-[#232f4e] rounded-xl">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-1.5">
          <Users size={13} className="text-purple-400" />
          <span className="text-[10px] text-slate-500 uppercase font-bold">
            Liên danh
          </span>
          {jvMembers.length > 0 && (
            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full font-bold">
              {jvMembers.length} thành viên
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {jvMembers.map((member, idx) => (
            <div
              key={member.id}
              className="border border-[#232f4e] rounded-lg bg-[#080d1a] overflow-hidden"
            >
              {/* Member header */}
              <div className="flex items-center gap-2 px-2.5 py-2 bg-[#0c1424] border-b border-[#232f4e]">
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                  #{idx + 1}
                </span>

                <select
                  value={member.company_name}
                  onChange={e => handleSelectCompany(idx, e.target.value)}
                  className="flex-1 bg-[#080d1a] border border-[#232f4e] rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Chọn nhà thầu --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => setExpandedMemberIdx(expandedMemberIdx === idx ? null : idx)}
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                  title="Chi tiết"
                >
                  {expandedMemberIdx === idx ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <button
                  onClick={() => handleRemoveMember(idx)}
                  className="text-red-500/60 hover:text-red-400 p-0.5"
                  title="Xóa thành viên"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Member details (expandable) */}
              {expandedMemberIdx === idx && (
                <div className="px-2.5 py-2 space-y-1.5">
                  <p className="text-[9px] text-purple-400 font-semibold">
                    Thứ tự: {JV_STT_WORDS[idx] || `thứ ${idx + 1}`}
                  </p>
                  {fields.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="w-24 text-[9px] text-slate-500 font-medium shrink-0">{label}</label>
                      <input
                        value={(member[key] as string) || ''}
                        onChange={e => handleFieldChange(idx, key, e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            onClick={handleAddMember}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 text-xs font-semibold text-purple-300 transition-colors"
          >
            <Plus size={13} /> Thêm thành viên
          </button>
        </div>
      )}
    </div>
  );
};

export { JV_STT_WORDS };

