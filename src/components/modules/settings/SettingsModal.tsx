import React, { useState, useRef } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';
import { SupportedFont } from '../../../types/settings';
import { 
  Settings, 
  Type, 
  FolderSync, 
  HardDrive, 
  ShieldCheck, 
  Check, 
  Minus, 
  Plus, 
  Download, 
  Upload, 
  RotateCcw,
  Smartphone, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  FolderOpen,
  Save,
  FileCheck,
  Database,
  HelpCircle,
  RefreshCw,
  FileText,
  AlertTriangle,
  Wifi,
  Copy,
  ExternalLink,
  Layers
} from 'lucide-react';
import { BackupManagerModal } from './BackupManagerModal';
import { getNetworkInfo } from '../../../services/storage/localBridgeService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    settings, 
    setFontFamily, 
    setFontSizePt, 
    increaseFontSize, 
    decreaseFontSize, 
    updateGoogleDrivePath 
  } = useSettings();

  const {
    projects,
    lastSavedTime,
    storageSizeKb,
    isDirectFileConnected,
    connectedFileName,
    diskFilePath,
    setDiskFilePath,
    isBridgeActive,
    lastDiskWriteTime,
    diskFileSize,
    syncNowToDisk,
    reloadFromDisk,
    exportDatabaseToJson,
    importDatabaseFromJson,
    resetDatabaseToDefaults,
    selectSaveDirectory,
    saveDatabaseAs,
    connectDirectFile,
    disconnectDirectFile,
    writeCurrentDataToSelectedFile,
    forceWriteToCurrentFile,
  } = useData();

  const [activeTab, setActiveTab] = useState<'drive' | 'appearance'>('drive');
  const [inputDiskPath, setInputDiskPath] = useState(diskFilePath);
  const [networkInfo, setNetworkInfo] = useState<{ primaryIp: string; port: string; mobileUrl: string } | null>(null);
  const [copiedMobileUrl, setCopiedMobileUrl] = useState(false);
  const [drivePath, setDrivePath] = useState(
    settings.googleDrivePath || 'D:\\Google Drive\\ProjectM\\du_lieu_du_an.json'
  );

  React.useEffect(() => {
    if (diskFilePath) {
      setInputDiskPath(diskFilePath);
    }
  }, [diskFilePath]);

  React.useEffect(() => {
    if (isOpen) {
      getNetworkInfo().then((info) => {
        if (info.success) {
          setNetworkInfo(info);
        }
      });
    }
  }, [isOpen]);

  const handleCopyMobileUrl = () => {
    if (!networkInfo?.mobileUrl) return;
    navigator.clipboard.writeText(networkInfo.mobileUrl);
    setCopiedMobileUrl(true);
    setTimeout(() => setCopiedMobileUrl(false), 2500);
  };

  const handleApplyDiskPath = () => {
    if (!inputDiskPath.trim()) return;
    setDiskFilePath(inputDiskPath.trim());
    setNotification({ type: 'success', message: 'Đã cập nhật đường dẫn lưu trữ ổ cứng.' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSyncToDiskNow = async () => {
    const res = await syncNowToDisk(inputDiskPath.trim());
    if (res.success) {
      setNotification({ type: 'success', message: res.message });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleReloadFromDiskNow = async () => {
    const res = await reloadFromDisk(inputDiskPath.trim());
    if (res.success) {
      setNotification({ type: 'success', message: res.message });
    } else {
      setNotification({ type: 'error', message: res.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  React.useEffect(() => {
    if (settings.googleDrivePath) {
      setDrivePath(settings.googleDrivePath);
    }
  }, [settings.googleDrivePath]);
  const [savePathSuccess, setSavePathSuccess] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fonts: { id: SupportedFont; label: string; desc: string }[] = [
    { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro (Mặc định)', desc: 'Font chữ chuẩn thiết kế tối ưu tiếng Việt' },
    { id: 'Roboto', label: 'Roboto', desc: 'Font chuẩn Google hiện đại, thanh thoát' },
    { id: 'Inter', label: 'Inter', desc: 'Font giao diện sắc nét, độ tương phản cao' },
  ];

  const handleSaveDrivePath = () => {
    updateGoogleDrivePath(drivePath);
    setSavePathSuccess(true);
    setTimeout(() => setSavePathSuccess(false), 2000);
  };

  // Chọn thư mục lưu trữ Windows Explorer
  const handleSelectDirectory = async () => {
    const result = await selectSaveDirectory();
    if (result.success) {
      if (result.dirName) {
        const fullStr = `${result.dirName}\\du_lieu_du_an.json`;
        setDrivePath(fullStr);
        updateGoogleDrivePath(fullStr);
      }
      setNotification({ type: 'success', message: result.message });
    } else if (result.message !== 'Đã hủy chọn thư mục.') {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // Lưu vị trí tùy chọn Save As...
  const handleSaveAs = async () => {
    const result = await saveDatabaseAs();
    if (result.success) {
      if (result.fileName) {
        setDrivePath(result.fileName);
        updateGoogleDrivePath(result.fileName);
      }
      setNotification({ type: 'success', message: result.message });
    } else if (result.message !== 'Đã hủy chọn vị trí lưu file.') {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  // Nạp file JSON từ máy tính
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importDatabaseFromJson(file);
    if (result.success) {
      setNotification({ type: 'success', message: result.message });
    } else {
      setNotification({ type: 'error', message: result.message });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setNotification(null), 4000);
  };

  // Kết nối file có sẵn trên đĩa
  const handleConnectDirect = async () => {
    const result = await connectDirectFile();
    if (result.success) {
      setNotification({ type: 'success', message: result.message });
    } else if (result.message !== 'Đã hủy chọn file.') {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 4000);
  };

  // Chọn file trên máy để Ghi đè dữ liệu hiện tại & kích hoạt tự động đồng bộ
  const handleSyncToSelectedFile = async () => {
    const result = await writeCurrentDataToSelectedFile();
    if (result.success) {
      if (result.fileName) {
        setDrivePath(result.fileName);
        updateGoogleDrivePath(result.fileName);
      }
      setNotification({ type: 'success', message: result.message });
    } else if (result.message !== 'Đã hủy chọn file.') {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 6000);
  };

  // Ép ghi dữ liệu hiện tại vào file đang kết nối
  const handleForceWrite = async () => {
    const result = await forceWriteToCurrentFile();
    if (result.success) {
      setNotification({ type: 'success', message: result.message });
    } else {
      setNotification({ type: 'error', message: result.message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <>
      <AppModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-white">
            <Settings size={20} className="text-blue-400" />
            <span>Cài Đặt Hệ Thống & Lưu Trữ Dữ Liệu</span>
          </div>
        }
        subtitle="Chọn đường dẫn lưu file, Cài đặt Font chữ, Cỡ chữ & Đồng bộ Google Drive"
        level={1}
        footer={
          <AppButton variant="primary" size="sm" onClick={onClose}>
            Đóng cửa sổ
          </AppButton>
        }
      >
        <div className="space-y-4 text-xs md:text-sm">
          {/* Sub-tabs inside Modal */}
          <div className="flex items-center gap-2 border-b border-[#232f4e] pb-2">
            <button
              onClick={() => setActiveTab('drive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'drive'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131e36]'
              }`}
            >
              <FolderSync size={14} /> Đường Dẫn Lưu File & Offline
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'appearance'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131e36]'
              }`}
            >
              <Type size={14} /> Giao diện & Font chữ
            </button>
          </div>

          {/* Toast thông báo nhanh */}
          {notification && (
            <div
              className={`p-3 rounded-xl flex items-center gap-2 text-xs transition-all ${
                notification.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
              }`}
            >
              {notification.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Tab 2: Drive Sync, Local Storage Bridge & Kết nối Điện thoại PWA */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {/* KHỐI 1: GHI TRỰC TIẾP VÀO Ổ CỨNG MÁY TÍNH (WINDOWS LOCAL STORAGE BRIDGE) */}
              <div className="p-4 bg-[#091428] border-2 border-emerald-500/60 rounded-xl space-y-3.5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <HardDrive size={16} />
                      1. Ghi Trực Tiếp Vào File Ổ Cứng Máy Tính (Windows Local Bridge)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700/60 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-400" />
                    Trạng thái: <strong>Đang kết nối & Tự động lưu</strong>
                  </span>
                </div>

                {/* Hộp cấu hình đường dẫn file vật lý trên Windows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <FolderOpen size={14} className="text-emerald-400" />
                      <span>Đường dẫn file JSON trên máy tính (Nhập hoặc chỉnh sửa đường dẫn bất kỳ):</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Lần ghi gần nhất: <strong className="text-emerald-300">{lastDiskWriteTime || lastSavedTime}</strong>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputDiskPath}
                        onChange={(e) => setInputDiskPath(e.target.value)}
                        placeholder="Ví dụ: D:\1. BQL Ban Thach\CSDL (CAM XOA)\du_lieu_du_an.json"
                        className="w-full bg-[#060c18] border border-emerald-600/50 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder:text-slate-600"
                      />
                    </div>
                    <AppButton
                      size="sm"
                      variant="outline"
                      onClick={handleApplyDiskPath}
                      className="shrink-0 text-xs border-emerald-600/60 text-emerald-300 hover:bg-emerald-950/50"
                    >
                      Áp dụng đường dẫn
                    </AppButton>
                  </div>

                  {/* Các nút hành động tức thì với file ổ đĩa */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <AppButton
                      size="sm"
                      variant="primary"
                      icon={<Save size={14} />}
                      onClick={handleSyncToDiskNow}
                      className="shadow-md shadow-blue-950/60 font-semibold"
                    >
                      💾 Ghi đè {projects.length} dự án vào file này ngay
                    </AppButton>

                    <AppButton
                      size="sm"
                      variant="secondary"
                      icon={<RefreshCw size={14} />}
                      onClick={handleReloadFromDiskNow}
                      className="font-medium"
                    >
                      🔄 Nạp lại dữ liệu từ file này
                    </AppButton>

                    <button
                      onClick={handleSyncToSelectedFile}
                      className="px-2.5 py-1.5 rounded-lg bg-[#142038] hover:bg-[#1e2f50] text-slate-200 border border-[#2b3e66] text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Link2 size={13} className="text-blue-400" />
                      <span>Chọn file qua Windows Explorer...</span>
                    </button>
                  </div>
                </div>

                {/* Grid tóm tắt thông số file trên ổ cứng */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-0.5">
                    <span className="text-slate-400 block text-[11px]">Dữ liệu phần mềm:</span>
                    <strong className="text-emerald-300 font-mono text-xs block">
                      {projects.length} dự án ({storageSizeKb} KB)
                    </strong>
                    <span className="text-[10px] text-slate-400 truncate block" title={projects.map((p) => p.name).join(' • ')}>
                      {projects.map((p) => p.name).join(' • ') || 'Chưa có dự án nào'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-0.5">
                    <span className="text-slate-400 block text-[11px]">Dung lượng file trên ổ đĩa:</span>
                    <strong className="text-blue-300 font-mono text-xs block">
                      {diskFileSize ? `${(diskFileSize / 1024).toFixed(1)} KB (${diskFileSize} bytes)` : `${storageSizeKb} KB`}
                    </strong>
                    <span className="text-[10px] text-emerald-400 block">✓ File vật lý Windows</span>
                  </div>

                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-0.5">
                    <span className="text-slate-400 block text-[11px]">Cơ chế bảo vệ:</span>
                    <strong className="text-purple-300 font-mono text-xs block">
                      Zero-Loss Persistence
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Miễn nhiễm 100% khi xóa cache</span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/40 rounded-lg text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    Mỗi khi bạn thêm, sửa, xóa bất kỳ dự án hay chi phí nào, hệ thống <strong>tự động ghi thẳng vào file vật lý trên máy tính sau 0.02 giây</strong>. Dù bạn có xóa sạch lịch sử web, xóa bộ nhớ đệm (cache) hay cài lại trình duyệt, dữ liệu của bạn trên ổ đĩa <code className="text-emerald-300 font-mono">D:\</code> hay <code className="text-emerald-300 font-mono">E:\</code> vẫn nguyên vẹn 100%!
                  </div>
                </div>
              </div>

              {/* KHỐI 2: KẾT NỐI & SỬ DỤNG TRÊN ĐIỆN THOẠI DI ĐỘNG (PWA & WI-FI LAN) */}
              <div className="p-4 bg-[#0b1426] border-2 border-blue-500/60 rounded-xl space-y-3.5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="font-bold text-blue-400 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
                      <Smartphone size={16} />
                      2. Sử Dụng & Cài Đặt Trên Điện Thoại Di Động (PWA Mobile)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-blue-300 bg-blue-950/80 px-2.5 py-1 rounded border border-blue-700/60 flex items-center gap-1">
                    <Wifi size={13} className="text-blue-400" />
                    Mạng Wi-Fi nội bộ
                  </span>
                </div>

                {/* Hộp hiển thị địa chỉ truy cập điện thoại */}
                <div className="p-3 bg-[#060c18] border border-blue-500/40 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-slate-400 text-xs block">Địa chỉ mở trên trình duyệt Điện thoại:</span>
                      <div className="font-mono text-sm sm:text-base font-bold text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-700/60 inline-flex items-center gap-2">
                        <span>{networkInfo?.mobileUrl || 'http://192.168.1.47:3000'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AppButton
                        size="sm"
                        variant={copiedMobileUrl ? 'success' : 'primary'}
                        icon={copiedMobileUrl ? <Check size={14} /> : <Copy size={14} />}
                        onClick={handleCopyMobileUrl}
                        className="text-xs"
                      >
                        {copiedMobileUrl ? '✓ Đã chép link' : 'Sao chép link'}
                      </AppButton>
                    </div>
                  </div>
                </div>

                {/* Hướng dẫn 3 bước cài đặt app trên điện thoại */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 bg-[#081020] rounded-lg border border-[#1e2d4c] space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-mono text-xs">1</span>
                      <span>Kết nối Wi-Fi</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Kết nối điện thoại vào cùng mạng Wi-Fi với máy tính cơ quan hoặc tại nhà.
                    </p>
                  </div>

                  <div className="p-3 bg-[#081020] rounded-lg border border-[#1e2d4c] space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-mono text-xs">2</span>
                      <span>Mở trình duyệt</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Mở <strong>Safari</strong> (iPhone) hoặc <strong>Chrome</strong> (Android) và nhập địa chỉ ở trên.
                    </p>
                  </div>

                  <div className="p-3 bg-[#081020] rounded-lg border border-[#1e2d4c] space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 flex items-center justify-center font-mono text-xs">3</span>
                      <span>Thêm vào màn hình</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Bấm nút <strong>Chia sẻ / Menu 3 chấm</strong> ➔ Chọn <strong>"Thêm vào Màn hình chính" (Add to Home Screen)</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-blue-950/40 border border-blue-600/40 rounded-lg text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                  <Smartphone size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    Sau khi cài, trên màn hình điện thoại của bạn sẽ xuất hiện <strong>biểu tượng ứng dụng ProjectM</strong> độc lập. Giao diện tự động tối ưu màn hình cảm ứng, có thanh điều hướng dưới đáy, cho phép tra cứu số liệu dự án, hợp đồng và nhập liệu trực tiếp ngay tại công trường!
                  </div>
                </div>
              </div>

              {/* KHỐI 3: BẢO VỆ PHỤ TRỢ (INDEXEDDB & SAO LƯU THỦ CÔNG) */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1e2c4c] pb-2">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs sm:text-sm">
                    <Database size={16} className="text-purple-400" />
                    <span>3. Lưu Trữ Phụ Trợ & Sao Lưu Dự Phòng (IndexedDB & Auto-backup 7 ngày)</span>
                  </div>
                  <span className="text-[11px] text-purple-300 font-mono bg-purple-950/70 px-2 py-0.5 rounded border border-purple-800/40">
                    ProjectM_OfflineDB
                  </span>
                </div>

                <p className="text-slate-400 text-xs">
                  Ngoài việc ghi trực tiếp vào file ổ cứng, hệ thống còn lưu trữ một bản song song trong IndexedDB và tự động chụp snapshot xoay vòng 7 ngày gần nhất để bạn có thể khôi phục bất cứ lúc nào.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <AppButton
                    size="sm"
                    variant="ghost"
                    icon={<Database size={14} className="text-purple-400" />}
                    onClick={() => setIsBackupModalOpen(true)}
                    className="border border-purple-700/50 hover:bg-purple-950/50 text-purple-200"
                  >
                    Mở Quản Lý Sao Lưu (Auto-backup 7 ngày)
                  </AppButton>

                  <AppButton
                    size="sm"
                    variant="outline"
                    icon={<Download size={14} />}
                    onClick={() => exportDatabaseToJson('du_lieu_du_an.json')}
                  >
                    Tải ngay file du_lieu_du_an.json về máy ({projects.length} dự án)
                  </AppButton>

                  <AppButton
                    size="sm"
                    variant="secondary"
                    icon={<Upload size={14} />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Mở / Nạp file JSON từ máy tính
                  </AppButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Nút khôi phục dữ liệu gốc mẫu */}
              <div className="p-3 bg-[#140f1a] border border-rose-950/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h5 className="font-semibold text-rose-300 text-xs">Khôi phục dữ liệu demo ban đầu</h5>
                  <p className="text-[11px] text-slate-400">
                    Xóa các thay đổi tùy biến và đưa toàn bộ cơ sở dữ liệu về 8 dự án demo ban đầu.
                  </p>
                </div>
                <AppButton
                  size="sm"
                  variant="danger"
                  icon={<RotateCcw size={14} />}
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  Đặt lại dữ liệu mẫu
                </AppButton>
              </div>
            </div>
          )}

          {/* Tab 1: Appearance (Font & Font Size) */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Font selection */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2.5">
                <label className="block font-bold text-slate-200 uppercase text-xs tracking-wider">
                  1. Tùy chọn Font chữ (Áp dụng toàn bộ phần mềm)
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {fonts.map((f) => {
                    const isSelected = settings.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white'
                            : 'bg-[#0f172a] border-[#232f4e] text-slate-300 hover:bg-[#142038]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            <span>{f.label}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
                        </div>
                        {isSelected && <Check size={18} className="text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font size */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-200 uppercase text-xs tracking-wider">
                    2. Tùy chọn Cỡ chữ (Từ 12pt đến 18pt)
                  </label>
                  <span className="font-mono text-base font-bold text-blue-400 bg-blue-950/70 px-3 py-1 rounded border border-blue-800/40">
                    {settings.fontSizePt} pt
                  </span>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-mono">12pt</span>
                  <input
                    type="range"
                    min={12}
                    max={18}
                    step={1}
                    value={settings.fontSizePt}
                    onChange={(e) => setFontSizePt(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-xs text-slate-400 font-mono">18pt</span>
                </div>

                {/* Quick Stepper Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {[12, 13, 14, 15, 16, 17, 18].map((size) => (
                      <button
                        key={size}
                        onClick={() => setFontSizePt(size)}
                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-colors ${
                          settings.fontSizePt === size
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-[#121c32] text-slate-400 hover:text-slate-100 hover:bg-[#1a2846]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <AppButton
                      size="sm"
                      variant="secondary"
                      icon={<Minus size={14} />}
                      onClick={decreaseFontSize}
                      disabled={settings.fontSizePt <= 12}
                    >
                      Thu nhỏ
                    </AppButton>
                    <AppButton
                      size="sm"
                      variant="secondary"
                      icon={<Plus size={14} />}
                      onClick={increaseFontSize}
                      disabled={settings.fontSizePt >= 18}
                    >
                      Phóng to
                    </AppButton>
                  </div>
                </div>

                {/* Preview text */}
                <div className="p-3 bg-[#080d1a] border border-[#232f4e] rounded-lg">
                  <span className="text-[11px] text-slate-500 block mb-1">
                    Văn bản xem trước (Preview):
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    Dự án: Xây dựng Trung tâm Đào tạo và Chuyển giao Công nghệ cao • Tổng mức đầu tư: 125.000.000.000 đồng • Ngày khởi công: 18/01/2026
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppModal>

      {/* Dialog xác nhận khôi phục dữ liệu gốc */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetDatabaseToDefaults();
          setIsResetConfirmOpen(false);
          setNotification({ type: 'success', message: 'Đã khôi phục dữ liệu demo ban đầu thành công.' });
          setTimeout(() => setNotification(null), 3000);
        }}
        title="Xác nhận khôi phục dữ liệu mẫu ban đầu"
        message={
          <div>
            Bạn có chắc chắn muốn đặt lại cơ sở dữ liệu về <strong>dữ liệu demo ban đầu</strong>?
            <p className="text-amber-400 text-xs mt-2">
              * Lưu ý: Mọi dự án và thông tin bạn đã nhập mới hoặc chỉnh sửa sẽ bị xóa. Bạn nên bấm "Xuất file du_lieu_du_an.json" để sao lưu trước khi thực hiện.
            </p>
          </div>
        }
      />

      {/* Modal Quản lý Sao lưu IndexedDB */}
      <BackupManagerModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </>
  );
};
