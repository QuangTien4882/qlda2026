import React, { useState, useEffect } from 'react';
import { ContractorItem } from '../../../types/project';
import { AdvancedTable, AdvancedColumn } from '../../common/AdvancedTable';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { ContractorFormModal } from './ContractorFormModal';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';

export const CompaniesView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { companies, addCompany, updateCompany, deleteCompany } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContractorItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ContractorItem | null>(null);

  useEffect(() => {
    setHeaderTitle('BẢNG DANH MỤC NHÀ THẦU & CÔNG TY');
  }, [setHeaderTitle]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ContractorItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSave = (item: ContractorItem) => {
    if (editingItem) {
      updateCompany(item);
    } else {
      addCompany(item);
    }
    setEditingItem(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingItem) {
      deleteCompany(deletingItem.id);
      setDeletingItem(null);
    }
  };

  // Tự động tính STT tiếp theo
  const nextStt =
    companies.length > 0 ? Math.max(...companies.map((c) => Number(c.stt) || 0)) + 1 : 1;

  // Cấu hình đầy đủ 13 cột chuẩn theo yêu cầu nghiệp vụ
  const columns: AdvancedColumn<ContractorItem>[] = [
    {
      id: 'stt',
      title: 'STT',
      width: 60,
      minWidth: 25,
      align: 'center',
      pinned: true,
      render: (item) => <span className="font-mono text-slate-300 font-semibold">{item.stt}</span>,
    },
    {
      id: 'name',
      title: 'Tên nhà thầu',
      width: 320,
      minWidth: 25,
      pinned: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-100">{item.name}</span>
          {item.shortName && (
            <span className="ml-1.5 text-[11px] font-mono text-blue-400 bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-800/40">
              {item.shortName}
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'address',
      title: 'Địa chỉ',
      width: 260,
      minWidth: 25,
      render: (item) => <span className="text-slate-200">{item.address || '—'}</span>,
    },
    {
      id: 'taxCode',
      title: 'Mã số thuế',
      width: 140,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
          {item.taxCode}
        </span>
      ),
    },
    {
      id: 'representative',
      title: 'Người đại diện',
      width: 160,
      minWidth: 25,
      render: (item) => <span className="font-medium text-slate-200">{item.representative || '—'}</span>,
    },
    {
      id: 'position',
      title: 'Chức vụ',
      width: 140,
      minWidth: 25,
      render: (item) => <span className="text-slate-300">{item.position || '—'}</span>,
    },
    {
      id: 'bankAccount',
      title: 'Số tài khoản',
      width: 150,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono font-semibold text-emerald-400">
          {item.bankAccount || '—'}
        </span>
      ),
    },
    {
      id: 'bankName',
      title: 'Tên ngân hàng',
      width: 250,
      minWidth: 25,
      render: (item) => <span className="text-slate-300">{item.bankName || '—'}</span>,
    },
    {
      id: 'registrationPlace',
      title: 'Nơi cấp ĐKKD',
      width: 220,
      minWidth: 25,
      render: (item) => <span className="text-slate-300">{item.registrationPlace || '—'}</span>,
    },
    {
      id: 'registrationDate',
      title: 'Ngày cấp ĐKKD',
      width: 140,
      minWidth: 25,
      align: 'center',
      render: (item) => (
        <span className="font-mono text-slate-300">{item.registrationDate || '—'}</span>
      ),
    },
    {
      id: 'phone',
      title: 'Điện thoại',
      width: 140,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="font-mono text-blue-300">{item.phone || '—'}</span>,
    },
    {
      id: 'fax',
      title: 'Fax',
      width: 130,
      minWidth: 25,
      align: 'center',
      render: (item) => <span className="font-mono text-slate-400">{item.fax || '—'}</span>,
    },
    {
      id: 'email',
      title: 'Email',
      width: 200,
      minWidth: 25,
      render: (item) => (
        <span className="font-mono text-blue-400 hover:underline">{item.email || '—'}</span>
      ),
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
      {/* Bảng Danh mục nhà thầu cao cấp: full chiều cao, kẻ khung sắc nét, ghim cột, resize, search out-of-order */}
      <AdvancedTable
        columns={columns}
        data={companies}
        keyExtractor={(item) => item.id}
        onAdd={handleOpenAdd}
        addLabel="Thêm mới"
        onEdit={handleOpenEdit}
        onDelete={(item) => setDeletingItem(item)}
        emptyMessage="Chưa có nhà thầu nào trong danh mục. Bấm 'Thêm mới' ở góc trên để nhập thông tin nhà thầu."
      />

      {/* Modal Thêm mới / Sửa Nhà thầu - Cấp 1 */}
      <ContractorFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        initialData={editingItem}
        nextStt={nextStt}
      />

      {/* Dialog xác nhận xóa nhà thầu - Cấp 3 */}
      <ConfirmDialog
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa nhà thầu"
        message={
          <div>
            Bạn có chắc chắn muốn xóa nhà thầu{' '}
            <strong className="text-white">
              {deletingItem?.name} (MST: {deletingItem?.taxCode})
            </strong>{' '}
            khỏi danh mục hệ thống?
          </div>
        }
      />
    </div>
  );
};
