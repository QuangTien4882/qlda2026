import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { AppBadge } from '../../common/AppBadge';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useData } from '../../../context/DataContext';
import { BackupSnapshotItem } from '../../../services/storage/idbService';
import { PackageInspectionResult } from '../../../services/storage/projectmPackageService';
import { 
  Database, 
  RotateCcw, 
  Download, 
  Upload,
  Trash2, 
  Plus, 
  ShieldCheck, 
  Clock, 
  FileCheck,
  AlertTriangle,
  HardDrive,
  FileText,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({ isOpen, onClose }) => {
  const { 
    getBackupList, 
    createManualBackup, 
    restoreFromBackup, 
    deleteBackup, 
    storageSizeKb,
    exportFullBackupPackage,
    inspectBackupPackage,
    applyRestoreBackupPackage
  } = useData();

  const [backups, setBackups] = useState<BackupSnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringItem, setRestoringItem] = useState<BackupSnapshotItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isExportingPackage, setIsExportingPackage] = useState(false);
  const [isRestoringPackage, setIsRestoringPackage] = useState(false);
  const [inspectedPackage, setInspectedPackage] = useState<PackageInspectionResult | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Tạo sao lưu snapshot nhanh vào IndexedDB
  const handleCreate = async () => {
    setIsCreating(true);
    setFeedbackMsg(null);
    try {
      const ok = await createManualBackup(newNote.trim() || undefined);
      if (ok) {
        setNewNote('');
        setFeedbackMsg({ text: 'Đã tạo bản snapshot CSDL mới thành công!', type: 'success' });
        await fetchBackups();
      } else {
        setFeedbackMsg({ text: 'Không thể tạo bản snapshot. Vui lòng thử lại!', type: 'error' });
      }
    } catch {
      setFeedbackMsg({ text: 'Có lỗi xảy ra khi tạo snapshot.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  // Xuất gói sao lưu toàn vẹn (.projectm kèm toàn bộ tệp đính kèm)
  const handleExportFullPackage = async () => {
    setIsExportingPackage(true);
    setFeedbackMsg(null);
    try {
      const res = await exportFullBackupPackage(newNote.trim() || undefined);
      if (res.success) {
        setFeedbackMsg({ text: res.message, type: 'success' });
      } else {
        setFeedbackMsg({ text: res.message, type: 'error' });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Lỗi đóng gói file sao lưu .projectm.', type: 'error' });
    } finally {
      setIsExportingPackage(false);
    }
  };

  // Chọn file sao lưu (.projectm hoặc .json) để kiểm tra
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const inspected = await inspectBackupPackage(file);
      if (inspected.isValid) {
        setInspectedPackage(inspected);
      } else {
        setFeedbackMsg({
          text: inspected.errorMessage || 'File không hợp lệ hoặc bị hỏng.',
          type: 'error',
        });
      }
    } catch (err) {
      setFeedbackMsg({ text: 'Không thể phân tích file sao lưu.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Xác nhận khôi phục từ gói đã kiểm tra
  const handleConfirmRestorePackage = async () => {
    if (!inspectedPackage) return;
    setIsRestoringPackage(true);
    setFeedbackMsg(null);
    try {
      const res = await applyRestoreBackupPackage(inspectedPackage);
      if (res.success) {
        setFeedbackMsg({ text: res.message, type: 'success' });
        setInspectedPackage(null);
        await fetchBackups();
      } else {
        setFeedbackMsg({ text: res.message, type: 'error' });
      }
    } catch {
      setFeedbackMsg({ text: 'Lỗi trong quá trình khôi phục gói sao lưu.', type: 'error' });
    } finally {
      setIsRestoringPackage(false);
    }
  };

  // Khôi phục dữ liệu từ snapshot IndexedDB
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
  const handleDownloadJson = (item: BackupSnapshotItem) => {
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
        title="Trung Tâm Quản Lý Sao Lưu & Phục Hồi Dữ Liệu"
        subtitle="Snapshot định kỳ IndexedDB & Gói sao lưu toàn vẹn (.projectm kèm toàn bộ tệp đính kèm)"
        level={1}
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-mono">
              Tổng số snapshot: <strong className="text-blue-300">{backups.length} bản</strong> • CSDL hiện tại: <strong className="text-emerald-400">{storageSizeKb} KB</strong>
            </span>
            <AppButton variant="secondary" size="sm" onClick={onClose}>
              Đóng cửa sổ
            </AppButton>
          </div>
        }
      >
        <div className="flex flex-col h-full space-y-4 max-h-[74vh] overflow-y-auto pr-1">
          {/* KHỐI 1: GÓI SAO LƯU TOÀN VẸN (.PROJECTM) */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0d1c3a] to-[#0f172a] border border-blue-600/40 shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-500/60 text-blue-300 shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Gói Sao Lưu Toàn Vẹn Hệ Thống (.projectm)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                      Khuyên dùng
                    </span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Khác với file JSON đơn thuần, gói <strong className="text-blue-300">.projectm</strong> đóng gói nén toàn bộ: Cơ sở dữ liệu dự án, chi phí, hợp đồng + Mẫu văn bản soạn thảo (.docx) + <strong>Toàn bộ tệp PDF/ảnh đính kèm nhị phân</strong>. Giúp chuyển dữ liệu sang máy tính khác an toàn 100% không sợ mất file!
                  </p>
                </div>
              </div>
            </div>

            {/* Input file ẩn */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".projectm,.json,.zip"
              className="hidden"
              onChange={handleFileSelected}
            />

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <AppButton
                size="sm"
                variant="primary"
                icon={<Download size={14} />}
                onClick={handleExportFullPackage}
                disabled={isExportingPackage}
                className="w-full sm:w-auto font-semibold shadow-md shadow-blue-900/40"
              >
                {isExportingPackage ? 'Đang đóng gói...' : 'Xuất Gói Sao Lưu Toàn Vẹn (.projectm)'}
              </AppButton>

              <AppButton
                size="sm"
                variant="secondary"
                icon={<Upload size={14} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Khôi Phục Gói (.projectm / .json)
              </AppButton>
            </div>
          </div>

          {/* KHỐI 2: THANH TẠO SNAPSHOT INDEXEDDB NHANH */}
          <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2840] shrink-0 space-y-2">
            <span className="text-xs font-semibold text-slate-200 block">
              Tạo bản Snapshot CSDL ngay lập tức (Lưu cục bộ trong máy):
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Nhập ghi chú (VD: Chốt số liệu quý 4, trước khi sửa hợp đồng...)"
                className="flex-1 w-full bg-[#0b1424] border border-[#232f4e] rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:italic placeholder:text-slate-500"
              />
              <AppButton
                size="sm"
                variant="secondary"
                icon={<Plus size={14} />}
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full sm:w-auto shrink-0"
              >
                {isCreating ? 'Đang snapshot...' : 'Snapshot Ngay'}
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
              {feedbackMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* KHỐI 3: BẢNG DANH SÁCH CÁC BẢN SAO LƯU SNAPSHOT */}
          <div className="flex-1 min-h-[220px] overflow-auto border border-slate-800 rounded-xl bg-[#060b14] relative shadow-inner">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400">
                Đang nạp danh sách snapshot từ IndexedDB...
              </div>
            ) : backups.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Database size={36} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Chưa có bản snapshot nào trong bộ nhớ máy.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bấm nút "Snapshot Ngay" ở trên để chụp bản lưu đầu tiên!
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
                            title="Khôi phục toàn bộ dữ liệu từ bản snapshot này"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0b1e38] hover:bg-emerald-900/60 border border-blue-500/40 hover:border-emerald-500 text-blue-300 hover:text-emerald-300 text-xs transition-colors font-medium"
                          >
                            <RotateCcw size={12} />
                            <span>Khôi phục</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadJson(item)}
                            title="Tải file JSON về máy tính"
                            className="p-1 rounded bg-[#0b1424] hover:bg-slate-700/60 border border-[#232f4e] text-slate-300 hover:text-white transition-colors"
                          >
                            <Download size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(item.id)}
                            title="Xóa bản snapshot này"
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

      {/* MODAL XÁC NHẬN KHÔI PHỤC GÓI SAO LƯU (.PROJECTM / .JSON) */}
      {inspectedPackage && (
        <AppModal
          isOpen={!!inspectedPackage}
          onClose={() => setInspectedPackage(null)}
          title="Xác Nhận Khôi Phục Gói Sao Lưu"
          subtitle={inspectedPackage.isPackage ? 'Gói đóng gói toàn vẹn (.projectm)' : 'File cơ sở dữ liệu (.json)'}
          level={2}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <AppButton variant="secondary" size="sm" onClick={() => setInspectedPackage(null)} disabled={isRestoringPackage}>
                Hủy bỏ
              </AppButton>
              <AppButton variant="primary" size="sm" onClick={handleConfirmRestorePackage} disabled={isRestoringPackage}>
                {isRestoringPackage ? 'Đang khôi phục...' : 'Đồng Ý Khôi Phục Toàn Bộ'}
              </AppButton>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#0b1424] border border-[#232f4e] space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Thông tin bản sao lưu được tìm thấy:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-[#111c33] p-2 rounded-lg border border-slate-700">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Database size={12} className="text-emerald-400" />
                    <span>Dự án</span>
                  </div>
                  <div className="text-base font-bold font-mono text-emerald-300 mt-0.5">
                    {inspectedPackage.stats.projectsCount}
                  </div>
                </div>

                <div className="bg-[#111c33] p-2 rounded-lg border border-slate-700">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <HardDrive size={12} className="text-blue-400" />
                    <span>Gói thầu / HĐ</span>
                  </div>
                  <div className="text-base font-bold font-mono text-blue-300 mt-0.5">
                    {inspectedPackage.stats.costPackagesCount}
                  </div>
                </div>

                <div className="bg-[#111c33] p-2 rounded-lg border border-slate-700">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <FileText size={12} className="text-purple-400" />
                    <span>Mẫu biểu văn bản</span>
                  </div>
                  <div className="text-base font-bold font-mono text-purple-300 mt-0.5">
                    {inspectedPackage.stats.templatesCount}
                  </div>
                </div>

                <div className="bg-[#111c33] p-2 rounded-lg border border-slate-700 col-span-2 sm:col-span-3">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Paperclip size={12} className="text-amber-400" />
                    <span>Tệp đính kèm nhị phân (PDF, văn bản, bản scan...)</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                    {inspectedPackage.stats.attachmentsCount} tệp đính kèm
                  </div>
                </div>
              </div>

              {inspectedPackage.manifest?.exportedAt && (
                <div className="text-[11px] text-slate-400 pt-1">
                  Thời điểm xuất bản sao lưu:{' '}
                  <span className="text-slate-200 font-mono">
                    {new Date(inspectedPackage.manifest.exportedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}

              {inspectedPackage.manifest?.note && (
                <div className="text-[11px] text-slate-400 italic">
                  Ghi chú: "{inspectedPackage.manifest.note}"
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong>Lưu ý quan trọng:</strong> Khôi phục dữ liệu sẽ ghi đè cơ sở dữ liệu hiện tại bằng dữ liệu trong bản sao lưu này. Hãy đảm bảo bạn đã tạo snapshot hoặc xuất sao lưu hiện tại nếu cần lưu giữ.
              </div>
            </div>
          </div>
        </AppModal>
      )}

      {/* Xác nhận khôi phục dữ liệu snapshot */}
      <ConfirmDialog
        isOpen={!!restoringItem}
        title="Xác nhận khôi phục cơ sở dữ liệu"
        message={`Bạn có chắc chắn muốn khôi phục toàn bộ dữ liệu hệ thống về thời điểm [${restoringItem?.dateStr}] không? Toàn bộ các thay đổi sau thời điểm này sẽ được hoàn nguyên về bản snapshot đã chọn.`}
        confirmLabel="Đồng ý Khôi phục"
        cancelLabel="Hủy bỏ"
        variant="warning"
        onConfirm={handleConfirmRestore}
        onClose={() => setRestoringItem(null)}
      />

      {/* Xác nhận xóa bản snapshot */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Xác nhận xóa bản sao lưu"
        message="Bạn có chắc chắn muốn xóa bản snapshot này khỏi IndexedDB không? Thao tác này không thể hoàn tác."
        confirmLabel="Xác nhận Xóa"
        cancelLabel="Hủy"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />
    </>
  );
};
