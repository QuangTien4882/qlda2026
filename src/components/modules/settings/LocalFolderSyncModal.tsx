import React, { useState } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { useData } from '../../../context/DataContext';
import { 
  FolderSync, 
  FolderCheck, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive, 
  RefreshCw, 
  Unlink, 
  FolderPlus,
  ShieldCheck,
  FileJson
} from 'lucide-react';

interface LocalFolderSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalFolderSyncModal: React.FC<LocalFolderSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    localFolderSyncStatus,
    connectLocalFolderSync,
    disconnectLocalFolderSync,
    syncNowToLocalFolder,
    verifyLocalFolderPermission,
    projects,
    lastSavedTime,
  } = useData();

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Lỗi trong quá trình đồng bộ.' });
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
        setFeedback({ type: 'success', message: 'Đã kích hoạt lại quyền ghi thành công!' });
        await syncNowToLocalFolder();
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

  if (!isOpen) return null;

  const { isConnected, folderName, lastSyncTime, status, isSupported } = localFolderSyncStatus;

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
      <div className="flex flex-col space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
                Cho phép chọn một thư mục bất kỳ trên máy tính của bạn (ví dụ: <code className="text-blue-300 bg-slate-900 px-1 py-0.5 rounded">D:\DuAn_QLDA\Data</code> hoặc thư mục đồng bộ Google Drive / OneDrive). Mỗi khi bạn tạo, sửa hoặc xóa dữ liệu, hệ thống sẽ <strong>tự động lưu ngầm</strong> vào file <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">projectm_data.json</code> mà không bao giờ bật hộp thoại tải về phiền phức!
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
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* KHỐI TRẠNG THÁI HIỆN TẠI */}
        <div className="p-4 rounded-xl bg-[#080d1a] border border-[#1e2840] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Trạng thái đồng bộ thư mục:
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
              <div className="flex items-center gap-2.5 text-xs text-slate-200">
                <FolderCheck size={18} className="text-emerald-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-slate-400">Thư mục đã kết nối:</div>
                  <div className="font-mono font-bold text-slate-100 truncate text-sm">
                    {folderName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Tệp lưu trữ tự động:</span>{' '}
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
                  <span>Trình duyệt yêu cầu xác nhận lại quyền ghi thư mục khi mở tab mới.</span>
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
                  icon={<RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />}
                  onClick={handleSyncNow}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Đồng Bộ Ngay Bây Giờ
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
                  Hãy bấm nút dưới đây để chọn một thư mục trên ổ cứng (C:, D:, E:...). Hệ thống sẽ lưu giữ liên kết này an toàn trong bộ nhớ nội bộ.
                </p>
              </div>
              <AppButton
                size="md"
                variant="primary"
                icon={<FolderPlus size={16} />}
                onClick={handleConnect}
                disabled={isLoading}
              >
                {isLoading ? 'Đang kết nối...' : 'Chọn Thư Mục Máy Tính Để Tự Động Đồng Bộ'}
              </AppButton>
            </div>
          )}
        </div>

        {/* LỢI ÍCH & HƯỚNG DẪN */}
        <div className="p-3 rounded-xl bg-[#080d1a] border border-[#1e2840] space-y-2 text-xs">
          <span className="font-semibold text-slate-200 block">Ưu điểm vượt trội của Local Folder Auto-Sync:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-start gap-2 bg-[#0d1527] p-2.5 rounded-lg border border-[#232f4e]">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Bảo vệ dữ liệu 100%:</strong> Dữ liệu nằm trực tiếp trong ổ cứng máy tính, không bao giờ mất ngay cả khi bạn xóa sạch toàn bộ lịch sử và cache của trình duyệt.
              </div>
            </div>
            <div className="flex items-start gap-2 bg-[#0d1527] p-2.5 rounded-lg border border-[#232f4e]">
              <FileJson size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100">Dễ dàng sao lưu lên Cloud:</strong> Chọn thư mục trong Google Drive hoặc OneDrive để tự động đồng bộ dữ liệu liên tục lên đám mây của bạn.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppModal>
  );
};
