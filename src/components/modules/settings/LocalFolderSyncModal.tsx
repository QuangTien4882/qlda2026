import React, { useState, useRef, useEffect } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { useData } from '../../../context/DataContext';
import { 
  FolderSync, 
  FolderCheck, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Unlink, 
  FolderPlus,
  ShieldCheck,
  FileJson,
  Download,
  Upload,
  Database
} from 'lucide-react';

interface LocalFolderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalFolderSyncModal: React.FC<LocalFolderSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    localFolderSyncStatus,
    detectedFolderFiles,
    connectLocalFolderSync,
    disconnectLocalFolderSync,
    syncNowToLocalFolder,
    verifyLocalFolderPermission,
    reloadFromLocalFolder,
    scanConnectedFolder,
    importDatabaseFromJson,
    inspectBackupPackage,
    applyRestoreBackupPackage,
    projects,
    lastSavedTime,
  } = useData();

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tự động quét lại thư mục khi mở modal
  useEffect(() => {
    if (isOpen && localFolderSyncStatus.isConnected) {
      scanConnectedFolder();
    }
  }, [isOpen, localFolderSyncStatus.isConnected]);

  const handleConnect = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await connectLocalFolderSync();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Không thể kết nối thư mục.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await syncNowToLocalFolder();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await scanConnectedFolder();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi trong quá trình đồng bộ.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReloadFromFolder = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await reloadFromLocalFolder();
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Không thể nạp dữ liệu từ thư mục.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPermission = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const ok = await verifyLocalFolderPermission();
      if (ok) {
        setFeedback({ type: 'success', message: 'Đã kích hoạt lại quyền thành công!' });
        await scanConnectedFolder();
        await reloadFromLocalFolder();
      } else {
        setFeedback({ type: 'error', message: 'Chưa được cấp quyền truy cập thư mục.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnectLocalFolderSync();
    setFeedback({ type: 'success', message: 'Đã ngắt kết nối thư mục tự động đồng bộ.' });
  };

  // Khôi phục thủ công khi người dùng chọn trực tiếp file .json hoặc .projectm
  const handleManualFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setFeedback(null);
    try {
      if (file.name.endsWith('.projectm') || file.name.endsWith('.zip')) {
        const inspected = await inspectBackupPackage(file);
        if (inspected.isValid) {
          const res = await applyRestoreBackupPackage(inspected);
          if (res.success) {
            setFeedback({ type: 'success', message: `Đã khôi phục thành công gói sao lưu "${file.name}"!` });
          } else {
            setFeedback({ type: 'error', message: res.message });
          }
        } else {
          setFeedback({ type: 'error', message: inspected.errorMessage || 'Tệp sao lưu không hợp lệ.' });
        }
      } else {
        const res = await importDatabaseFromJson(file);
        if (res.success) {
          setFeedback({ type: 'success', message: `Đã nạp thành công dữ liệu từ tệp "${file.name}"!` });
          if (localFolderSyncStatus.isConnected) {
            await syncNowToLocalFolder();
          }
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Lỗi đọc tệp: ${err?.message || 'Không xác định'}` });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const { isConnected, folderName, lastSyncTime, status } = localFolderSyncStatus;
  const bestFile = detectedFolderFiles.find((f) => f.projectCount > 0) || detectedFolderFiles[0];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Đồng Bộ Trực Tiếp Ra Thư Mục Ổ Đĩa Máy Tính"
      subtitle="Tự động ghi dữ liệu ra máy tính theo thời gian thực (Zero-download popup)"
      level={1}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-mono">
            {isConnected ? `Thư mục hiện tại: ${folderName}` : 'Chưa kết nối thư mục máy tính'}
          </span>
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Đóng cửa sổ
          </AppButton>
        </div>
      }
    >
      <div className="flex flex-col space-y-4 max-h-[72vh] overflow-y-auto pr-1">
        {/* BANNER GIỚI THIỆU TÍNH NĂNG */}
        <div className="p-3.5 rounded-xl bg-[#091326] border border-[#1e2f52]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950/80 border border-blue-600/60 text-blue-400 shrink-0">
              <FolderSync size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Cơ chế Auto-Sync trực tiếp ổ cứng (File System Access)</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cho phép chọn một thư mục bất kỳ trên máy tính (ví dụ: <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">D:\1. BQL Ban Thach\1. Du an</code> hoặc thư mục Google Drive / OneDrive). Mỗi khi tạo, sửa hoặc xóa dữ liệu, hệ thống sẽ <strong>tự động lưu ngầm</strong> vào file <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">projectm_data.json</code> mà không bao giờ bật popup tải về phiền phức!
              </p>
            </div>
          </div>
        </div>

        {/* THÔNG BÁO PHẢN HỒI */}
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-300'
                : 'bg-rose-950/70 border-rose-700/80 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* THÔNG BÁO NẾU PHÁT HIỆN TỆP DỮ LIỆU CŨ VÀ BỘ NHỚ ĐANG RỖNG */}
        {bestFile && bestFile.projectCount > 0 && projects.length === 0 && (
          <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/70 shadow-lg space-y-2.5">
            <div className="flex items-start gap-3">
              <Database size={20} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Phát hiện tệp dữ liệu có sẵn trong thư mục máy tính!</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono">
                    {bestFile.projectCount} dự án
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Tìm thấy tệp <code className="text-blue-300 font-mono font-semibold">{bestFile.fileName}</code> (dung lượng {(bestFile.sizeBytes / 1024).toFixed(1)} KB, cập nhật {bestFile.lastModified}). Bạn có thể bấm nạp ngay bên dưới để đưa toàn bộ 2 dự án vào phần mềm:
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <AppButton
                size="sm"
                variant="primary"
                icon={<Download size={14} className={isLoading ? 'animate-spin' : ''} />}
                onClick={handleReloadFromFolder}
                disabled={isLoading}
              >
                {isLoading ? 'Đang nạp...' : `Nạp ngay ${bestFile.projectCount} dự án từ tệp "${bestFile.fileName}"`}
              </AppButton>
            </div>
          </div>
        )}

        {/* KHỐI TRẠNG THÁI HIỆN TẠI */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2840] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Trạng thái thư mục:
            </span>
            {isConnected ? (
              status === 'permission_needed' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-medium">
                  <AlertCircle size={12} />
                  <span>Cần kích hoạt lại quyền</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Đang tự động đồng bộ</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
                <span>Chưa kết nối</span>
              </span>
            )}
          </div>

          {isConnected ? (
            <div className="space-y-3 bg-[#0c1424] p-3.5 rounded-lg border border-[#232f4e]">
              <div className="flex items-center justify-between gap-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderCheck size={18} className="text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Thư mục máy tính đã kết nối:</div>
                    <div className="font-mono font-bold text-slate-100 truncate text-sm">
                      {folderName}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-400">Số dự án hiện có trong máy:</div>
                  <div className="font-bold text-blue-400 text-sm">{projects.length} dự án</div>
                </div>
              </div>

              {/* Danh sách tệp CSDL phát hiện được trong thư mục */}
              {detectedFolderFiles.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Các tệp CSDL tìm thấy trong thư mục này:
                  </span>
                  <div className="space-y-1.5">
                    {detectedFolderFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileJson size={15} className="text-blue-400 shrink-0" />
                          <span className="font-mono font-medium text-slate-200 truncate">{f.fileName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-blue-300">
                            {f.projectCount} dự án
                          </span>
                          <span className="text-[11px] text-slate-400">({(f.sizeBytes / 1024).toFixed(1)} KB)</span>
                        </div>
                        <span className="text-[11px] text-slate-400">{f.lastModified}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Tệp lưu ngầm tự động:</span>{' '}
                  <span className="font-mono text-emerald-300 font-semibold">projectm_data.json</span>
                </div>
                <div>
                  <span className="text-slate-400">Lần đồng bộ gần nhất:</span>{' '}
                  <span className="font-mono text-blue-300 font-semibold">{lastSyncTime || lastSavedTime}</span>
                </div>
              </div>

              {/* Nếu cần quyền */}
              {status === 'permission_needed' && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs flex items-center justify-between gap-2">
                  <span>Trình duyệt yêu cầu xác nhận lại quyền truy cập thư mục khi mở tab mới.</span>
                  <button
                    onClick={handleVerifyPermission}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0 transition-colors"
                  >
                    Kích hoạt quyền
                  </button>
                </div>
              )}

              {/* Nút thao tác khi đã kết nối */}
              <div className="flex items-center gap-2 pt-2 flex-wrap sm:flex-nowrap">
                <AppButton
                  size="sm"
                  variant="primary"
                  icon={<Download size={13} className={isLoading ? 'animate-spin' : ''} />}
                  onClick={handleReloadFromFolder}
                  disabled={isLoading}
                  title="Nạp lại dữ liệu từ tệp trong thư mục vào phần mềm"
                >
                  Nạp Dữ Liệu Từ Thư Mục
                </AppButton>
                <AppButton
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
                  onClick={handleSyncNow}
                  disabled={isLoading}
                  title="Ghi đè số liệu hiện tại ra tệp trong thư mục"
                >
                  Ghi Ra Thư Mục
                </AppButton>
                <AppButton
                  size="sm"
                  variant="secondary"
                  icon={<FolderPlus size={13} />}
                  onClick={handleConnect}
                  disabled={isLoading}
                >
                  Đổi Thư Mục
                </AppButton>
                <AppButton
                  size="sm"
                  variant="danger"
                  icon={<Unlink size={13} />}
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  title="Ngắt kết nối thư mục tự động đồng bộ"
                >
                  Ngắt Kết Nối
                </AppButton>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 px-4 space-y-3 bg-[#0c1424] rounded-lg border border-dashed border-slate-700">
              <FolderPlus size={36} className="text-blue-400/80 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs text-slate-200 font-medium">
                  Chưa có thư mục máy tính nào được chỉ định tự động đồng bộ.
                </p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Hãy bấm nút dưới đây để chọn thư mục chứa dữ liệu của bạn trên ổ đĩa (ví dụ: <code className="text-blue-300">D:\1. BQL Ban Thach\1. Du an</code>). Hệ thống sẽ tự động quét và nạp dữ liệu cũ vào phần mềm ngay lập tức!
                </p>
              </div>
              <AppButton
                size="md"
                variant="primary"
                icon={<FolderPlus size={16} />}
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? 'Đang kết nối...' : 'Chọn Thư Mục Chứa Dữ Liệu Trên Máy Tính'}
              </AppButton>
            </div>
          )}
        </div>

        {/* NÚT KHÔI PHỤC THỦ CÔNG TỪ FILE BẤT KỲ */}
        <div className="p-3.5 rounded-xl bg-[#080d1a] border border-[#1e2840] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Upload size={18} className="text-purple-400 shrink-0" />
            <div>
              <span className="font-semibold text-slate-200 block">Chọn trực tiếp tệp dữ liệu trên máy tính:</span>
              <span className="text-[11px] text-slate-400">Nếu bạn đã có sẵn file <code className="text-blue-300">Duan_Data.json</code> hoặc gói <code className="text-blue-300">.projectm</code></span>
            </div>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,.projectm,.zip"
              className="hidden"
              onChange={handleManualFileSelect}
            />
            <AppButton
              size="sm"
              variant="secondary"
              icon={<Upload size={13} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Chọn Tệp Dữ Liệu
            </AppButton>
          </div>
        </div>

        {/* LỢI ÍCH & HƯỚNG DẪN */}
        <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2840] space-y-2 text-xs">
          <span className="font-semibold text-slate-200 block">Ưu điểm của Local Folder Auto-Sync:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-start gap-2 bg-[#0d1527] p-2.5 rounded-lg border border-[#232f4e]">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Bảo vệ dữ liệu 100%:</strong> Dữ liệu nằm trực tiếp trong ổ cứng máy tính, không bao giờ mất ngay cả khi xóa toàn bộ lịch sử duyệt web.
              </div>
            </div>
            <div className="flex items-start gap-2 bg-[#0d1527] p-2.5 rounded-lg border border-[#232f4e]">
              <FileJson size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Dễ dàng sao lưu lên Cloud:</strong> Chọn thư mục trong Google Drive để tự động đồng bộ dữ liệu liên tục lên đám mây của bạn.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};
