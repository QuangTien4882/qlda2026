import React, { useState, useEffect, useCallback } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { AppBadge } from '../../common/AppBadge';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useData } from '../../../context/DataContext';
import { BackupSnapshotItem } from '../../../services/storage/idbService';
import { 
  Database, 
  RotateCcw, 
  Download, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Clock, 
  FileCheck,
  AlertTriangle,
  HardDrive
} from 'lucide-react';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({ isOpen, onClose }) => {
  const { getBackupList, createManualBackup, restoreFromBackup, deleteBackup, storageSizeKb } = useData();

  const [backups, setBackups] = useState<BackupSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringItem, setRestoringItem] = useState<BackupSnapshotItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBackups = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await getBackupList();
      setBackups(list);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách sao lưu:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getBackupList]);

  useEffect(() => {
    if (isOpen) {
      fetchBackups();
      setFeedbackMsg(null);
    }
  }, [isOpen, fetchBackups]);

  // Tạo sao lưu thủ công
  const handleCreate = async () => {
    setIsCreating(true);
    setFeedbackMsg(null);
    try {
      const ok = await createManualBackup(newNote.trim() || undefined);
      if (ok) {
        setNewNote('');
        setFeedbackMsg({ text: 'Đã tạo bản sao lưu dữ liệu mới thành công!', type: 'success' });
        await fetchBackups();
      } else {
        setFeedbackMsg({ text: 'Không thể tạo bản sao lưu. Vui lòng thử lại!', type: 'error' });
      }
    } catch {
      setFeedbackMsg({ text: 'Có lỗi xảy ra khi tạo sao lưu.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  // Khôi phục dữ liệu
  const handleConfirmRestore = async () => {
    if (!restoringItem) return;
    try {
      const ok = await restoreFromBackup(restoringItem);
      if (ok) {
        setFeedbackMsg({ 
          text: `Đã khôi phục thành công toàn bộ dữ liệu về thời điểm ${restoringItem.dateStr}!`, 
          type: 'success' 
        });
        setRestoringItem(null);
      } else {
        setFeedbackMsg({ text: 'Khôi phục không thành công.', type: 'error' });
      }
    } catch {
      setFeedbackMsg({ text: 'Lỗi trong quá trình khôi phục dữ liệu.', type: 'error' });
    }
  };

  // Xóa bản sao lưu
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteBackup(deletingId);
      setDeletingId(null);
      await fetchBackups();
    } catch {
      setFeedbackMsg({ text: 'Không thể xóa bản sao lưu này.', type: 'error' });
    }
  };

  // Tải file JSON về máy
  const handleDownload = (item: BackupSnapshotItem) => {
    try {
      const jsonStr = JSON.stringify(item.data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTime = item.dateStr.replace(/[/:\s]/g, '_');
      link.href = url;
      link.download = `projectm_backup_${safeTime}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Lỗi khi tải file sao lưu:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title="Trung tâm Quản lý Sao lưu & Phục hồi Dữ liệu"
        subtitle="Tự động snapshot hàng ngày (IndexedDB), duy trì 7 bản gần nhất và an toàn tuyệt đối"
        level={1}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-mono">
              Tổng số bản sao lưu: <strong className="text-blue-300">{backups.length} bản</strong> • CSDL hiện tại: <strong className="text-emerald-400">{storageSizeKb} KB</strong>
            </span>
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              Đóng cửa sổ
            </AppButton>
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-4 max-h-[72vh]">
          {/* BANNER THÔNG TIN LƯU TRỮ VÀ BẢO MẬT */}
          <div className="p-3.5 rounded-xl bg-[#091326] border border-[#1e2f52] shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-600/60 text-emerald-400 shrink-0 mt-0.5">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Cơ chế bảo vệ dữ liệu Offline đa tầng (IndexedDB + Auto-backup)</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Hệ thống tự động chụp một bản snapshot cơ sở dữ liệu mỗi ngày khi bạn mở ứng dụng, lưu trữ cục bộ trong trình duyệt không giới hạn dung lượng và duy trì xoay vòng 7 ngày gần nhất.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* THANH TẠO BẢN SAO LƯU NHANH */}
          <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2840] shrink-0 space-y-2">
            <span className="text-xs font-semibold text-slate-200 block">Tạo bản sao lưu ngay lập tức:</span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Nhập ghi chú (VD: Trước khi cập nhật hợp đồng, chốt hồ sơ tháng 11...)"
                className="flex-1 w-full bg-[#0b1424] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
              <AppButton
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full sm:w-auto shrink-0"
              >
                {isCreating ? 'Đang sao lưu...' : 'Sao Lưu Ngay'}
              </AppButton>
            </div>
          </div>

          {feedbackMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 shrink-0 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-700/80 text-rose-300'
              }`}
            >
              <FileCheck size={14} />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* BẢNG DANH SÁCH CÁC BẢN SAO LƯU */}
          <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-[#060b14] relative shadow-inner">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                Đang nạp danh sách sao lưu từ IndexedDB...
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Database size={36} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Chưa có bản sao lưu nào được lưu trong máy.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bấm nút "Sao Lưu Ngay" ở trên để tạo bản lưu đầu tiên!
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse table-data-grid">
                <thead className="bg-[#111c33] text-slate-200 uppercase font-semibold text-xs border-b border-slate-700 sticky top-0 z-10 select-none">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-3">Thời gian sao lưu</th>
                    <th className="py-2.5 px-3 text-center">Loại</th>
                    <th className="py-2.5 px-3">Ghi chú</th>
                    <th className="py-2.5 px-3 text-center">Dung lượng</th>
                    <th className="py-2.5 px-3 text-center">Dữ liệu lưu</th>
                    <th className="py-2.5 px-3 text-center w-48">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {backups.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-mono font-bold text-slate-100 flex items-center gap-1.5">
                          <Clock size={13} className="text-blue-400" />
                          <span>{item.dateStr}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.type === 'auto' ? (
                          <AppBadge variant="blue">Tự động</AppBadge>
                        ) : (
                          <AppBadge variant="purple">Thủ công</AppBadge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-slate-300 italic">{item.note || '—'}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-300">
                        {item.sizeKb} KB
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-slate-300">
                        <span className="text-emerald-400 font-semibold">{item.projectCount}</span> dự án •{' '}
                        <span className="text-blue-400 font-semibold">{item.contractCount || 0}</span> HĐ
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setRestoringItem(item)}
                            title="Khôi phục toàn bộ dữ liệu từ bản sao lưu này"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0b1e38] hover:bg-emerald-900/60 border border-blue-500/40 hover:border-emerald-500 text-blue-300 hover:text-emerald-300 text-xs transition-colors font-medium"
                          >
                            <RotateCcw size={12} />
                            <span>Khôi phục</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(item)}
                            title="Tải file JSON về máy tính"
                            className="p-1 rounded bg-[#0b1424] hover:bg-slate-700/60 border border-[#232f4e] text-slate-300 hover:text-white transition-colors"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            title="Xóa bản sao lưu này"
                            className="p-1 rounded bg-[#0b1424] hover:bg-rose-950/60 border border-[#232f4e] hover:border-rose-600/60 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </AppModal>

      {/* Xác nhận khôi phục dữ liệu */}
      <ConfirmDialog
        isOpen={!!restoringItem}
        title="Xác nhận khôi phục cơ sở dữ liệu"
        message={`Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu hệ thống về thời điểm [${restoringItem?.dateStr}] không? Toàn bộ các thay đổi sau thời điểm này sẽ được hoàn nguyên về bản sao lưu đã chọn.`}
        confirmLabel="Đồng ý Khôi phục"
        cancelLabel="Hủy bỏ"
        variant="warning"
        onConfirm={handleConfirmRestore}
        onClose={() => setRestoringItem(null)}
      />

      {/* Xác nhận xóa bản sao lưu */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Xác nhận xóa bản sao lưu"
        message="Bạn có chắc chắn muốn xóa bản sao lưu này khỏi IndexedDB không? Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  );
};
