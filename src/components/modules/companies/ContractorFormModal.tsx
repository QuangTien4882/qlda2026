import React, { useState, useEffect } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { VnDateInput } from '../../common/VnDateInput';
import { ContractorItem } from '../../../types/project';

interface ContractorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ContractorItem) => void;
  initialData?: ContractorItem | null;
  nextStt: number;
}

export const ContractorFormModal: React.FC<ContractorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  nextStt,
}) => {
  const [stt, setStt] = useState<number>(nextStt);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [representative, setRepresentative] = useState('');
  const [position, setPosition] = useState('Giám đốc');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [registrationPlace, setRegistrationPlace] = useState('');
  const [registrationDate, setRegistrationDate] = useState('');
  const [phone, setPhone] = useState('');
  const [fax, setFax] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setStt(initialData.stt || nextStt);
      setName(initialData.name || '');
      setAddress(initialData.address || '');
      setTaxCode(initialData.taxCode || '');
      setRepresentative(initialData.representative || '');
      setPosition(initialData.position || 'Giám đốc');
      setBankAccount(initialData.bankAccount || '');
      setBankName(initialData.bankName || '');
      setRegistrationPlace(initialData.registrationPlace || '');
      setRegistrationDate(initialData.registrationDate || '');
      setPhone(initialData.phone || '');
      setFax(initialData.fax || '');
      setEmail(initialData.email || '');
      setNote(initialData.note || '');
    } else {
      setStt(nextStt);
      setName('');
      setAddress('');
      setTaxCode('');
      setRepresentative('');
      setPosition('');
      setBankAccount('');
      setBankName('');
      setRegistrationPlace('');
      setRegistrationDate('');
      setPhone('');
      setFax('');
      setEmail('');
      setNote('');
    }
    setError('');
  }, [initialData, nextStt, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập Tên nhà thầu');
      return;
    }
    if (!taxCode.trim()) {
      setError('Vui lòng nhập Mã số thuế');
      return;
    }

    const record: ContractorItem = {
      id: initialData ? initialData.id : `comp-${Date.now()}`,
      stt,
      name: name.trim(),
      address: address.trim(),
      taxCode: taxCode.trim(),
      representative: representative.trim(),
      position: position.trim(),
      bankAccount: bankAccount.trim(),
      bankName: bankName.trim(),
      registrationPlace: registrationPlace.trim(),
      registrationDate: registrationDate.trim(),
      phone: phone.trim(),
      fax: fax.trim(),
      email: email.trim(),
      note: note.trim(),
    };

    onSave(record);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Chỉnh Sửa Thông Tin Nhà Thầu' : 'Thêm Mới Nhà Thầu / Công Ty'}
      subtitle="Quản lý đầy đủ 13 thông tin pháp lý, tài khoản ngân hàng và liên hệ của nhà thầu"
      level={1}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Hủy bỏ
          </AppButton>
          <AppButton variant="primary" size="sm" onClick={handleSubmit}>
            {initialData ? 'Lưu cập nhật' : 'Thêm nhà thầu'}
          </AppButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        {error && (
          <div className="p-2.5 bg-rose-950/70 border border-rose-500/50 rounded-lg text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Khối 1: Thông tin pháp nhân */}
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
          <h4 className="font-bold text-blue-400 uppercase text-xs tracking-wider">
            1. Thông tin pháp nhân doanh nghiệp
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">
                STT <span className="text-slate-500">(Tự động)</span>
              </label>
              <input
                type="number"
                value={stt}
                onChange={(e) => setStt(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-300 mb-1">
                Tên nhà thầu / Công ty <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tổng Công ty Xây dựng Số 1 - CTCP"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-semibold placeholder:italic placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 mb-1">Địa chỉ trụ sở chính</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Số 111A Pasteur, Phường Bến Nghé, Quận 1, TP.HCM"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">
                Mã số thuế <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="VD: 0300378779"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono font-bold placeholder:italic placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Nơi cấp ĐKKD</label>
              <input
                type="text"
                value={registrationPlace}
                onChange={(e) => setRegistrationPlace(e.target.value)}
                placeholder="VD: Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <VnDateInput
                label="Ngày cấp ĐKKD"
                value={registrationDate}
                onChange={(formatted) => setRegistrationDate(formatted)}
              />
            </div>
          </div>
        </div>

        {/* Khối 2: Đại diện pháp luật & Tài khoản ngân hàng */}
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
          <h4 className="font-bold text-emerald-400 uppercase text-xs tracking-wider">
            2. Đại diện pháp luật & Tài khoản thanh toán
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Người đại diện</label>
              <input
                type="text"
                value={representative}
                onChange={(e) => setRepresentative(e.target.value)}
                placeholder="VD: Nguyễn Văn Thành"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-medium placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Chức vụ</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Tổng Giám đốc"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Số tài khoản ngân hàng</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="VD: 19028889998888"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono text-emerald-400 font-bold placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Tên ngân hàng & Chi nhánh</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank - CN TP.HCM"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Khối 3: Thông tin liên lạc */}
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
          <h4 className="font-bold text-purple-400 uppercase text-xs tracking-wider">
            3. Thông tin liên lạc & Ghi chú
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 mb-1">Điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 028 3822 2059"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Fax</label>
              <input
                type="text"
                value={fax}
                onChange={(e) => setFax(e.target.value)}
                placeholder="VD: 028 3829 0500"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono placeholder:italic placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: contact@cc1.com.vn"
                className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono placeholder:italic placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhà thầu thi công xây dựng cấp đặc biệt..."
              className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 placeholder:italic placeholder:text-slate-500"
            />
          </div>
        </div>
      </form>
    </AppModal>
  );
};

