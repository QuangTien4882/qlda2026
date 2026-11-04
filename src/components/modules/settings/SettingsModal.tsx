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
  AlertTriangle
} from 'lucide-react';
import { BackupManagerModal } from './BackupManagerModal';

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

  const [activeTab, setActiveTab] = useState<'appearance' | 'drive'>('drive');
  const [drivePath, setDrivePath] = useState(
    settings.googleDrivePath || 'D:\\Google Drive\\ProjectM\\du_lieu_du_an.json'
  );

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

          {/* Tab 2: Drive Sync & Chọn đường dẫn lưu file */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {/* KHỐI 1: VỊ TRÍ LƯU TRỮ CƠ SỞ DỮ LIỆU HIỆN HÀNH (ĐANG HOẠT ĐỘNG CHÍNH) */}
              <div className="p-4 bg-[#091428] border-2 border-emerald-500/50 rounded-xl space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm uppercase tracking-wide">
                      1. Vị trí Lưu trữ Cơ sở Dữ liệu Hiện hành (Trên Máy Bạn)
                    </span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700/60">
                    Trạng thái: <strong>✓ Đang lưu an toàn</strong> (Lúc {lastSavedTime})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-1">
                    <span className="text-slate-400 block text-[11px]">Nơi lưu trữ chính:</span>
                    <div className="font-bold text-blue-300 font-mono text-xs flex items-center gap-1">
                      <Database size={13} className="text-emerald-400 shrink-0" />
                      <span>IndexedDB: ProjectM_OfflineDB</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Bộ nhớ Offline trình duyệt (Không giới hạn)</span>
                  </div>

                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-1">
                    <span className="text-slate-400 block text-[11px]">Dữ liệu phần mềm đang hiển thị:</span>
                    <strong className="text-sm font-mono text-emerald-300 block">
                      {projects.length} dự án ({storageSizeKb} KB)
                    </strong>
                    <span className="text-[10px] text-slate-300 block truncate" title={projects.map((p) => p.name).join(' • ')}>
                      {projects.map((p) => p.name).join(' • ') || 'Chưa có dự án nào'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#060c18] rounded-lg border border-[#1e2c4c] space-y-1">
                    <span className="text-slate-400 block text-[11px]">Bảo vệ & Sao lưu dự phòng:</span>
                    <strong className="text-sm font-mono text-purple-300 block">
                      Auto-backup 7 ngày
                    </strong>
                    <span className="text-[10px] text-slate-400 block">Tự động chụp snapshot mỗi ngày</span>
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/30 border border-emerald-600/30 rounded-lg text-xs text-slate-300 leading-relaxed">
                  ✓ Toàn bộ dữ liệu của bạn được lưu trữ vĩnh viễn trên ổ cứng máy tính qua IndexedDB. Khi bạn tắt máy, đóng trình duyệt hay tải lại trang (F5), dữ liệu <strong>không bao giờ bị mất</strong>.
                </div>
              </div>

              {/* KHỐI 2: ĐỒNG BỘ VÀO FILE .JSON NGOÀI Ổ ĐĨA / GOOGLE DRIVE */}
              <div className="p-4 bg-[#0b1222] border-2 border-blue-500/50 rounded-xl space-y-3.5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#232f4e] pb-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs sm:text-sm uppercase tracking-wide">
                    <FolderOpen size={18} />
                    <span>2. Đồng Bộ Vào File .JSON Ngoài Ổ Đĩa (Google Drive / CSDL)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    File System Access API (Tự động ghi thời gian thực)
                  </span>
                </div>

                {/* Hộp giải thích chi tiết vì sao file ngoài ổ đĩa rỗng */}
                <div className="p-3 bg-[#0d182e] border border-blue-500/30 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <HelpCircle size={15} className="text-amber-400 shrink-0" />
                    <span>Tại sao mở file JSON ngoài ổ đĩa bằng Notepad lại thấy rỗng hoặc khác trên phần mềm?</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Trình duyệt web chạy trong môi trường bảo mật (Sandbox) nên <strong>không thể tự ý ghi vào ổ cứng</strong> của bạn nếu chưa được bạn chỉ định file. File JSON bạn mở bằng Notepad trên máy tính hiện là file cũ chưa được liên kết.
                  </p>
                  <p className="text-blue-300 leading-relaxed font-medium">
                    👉 Để file JSON trên máy tính nhận đầy đủ <strong>{projects.length} dự án</strong> và tự động cập nhật mỗi khi bạn thao tác, hãy bấm nút:
                  </p>
                </div>

                {/* Trạng thái liên kết file hiện tại */}
                {isDirectFileConnected ? (
                  <div className="p-3 bg-emerald-950/70 border border-emerald-500/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400 shrink-0">
                        <FileCheck size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-400 font-bold block text-xs sm:text-sm">
                          ✓ ĐANG TỰ ĐỘNG ĐỒNG BỘ VÀO FILE TRÊN MÁY TÍNH
                        </span>
                        <div className="text-slate-200 font-mono text-xs truncate">
                          File: <strong className="text-white underline">{connectedFileName}</strong>
                        </div>
                        <span className="text-[11px] text-slate-300 mt-0.5 block">
                          Mỗi khi bạn thêm, sửa, xóa bất kỳ dữ liệu nào, file này ngoài ổ đĩa sẽ tự động cập nhật ngay lập tức!
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <AppButton
                        size="sm"
                        variant="success"
                        icon={<RefreshCw size={13} />}
                        onClick={handleForceWrite}
                      >
                        Đồng bộ lại ngay
                      </AppButton>
                      <button
                        onClick={disconnectDirectFile}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 text-xs font-semibold shrink-0 transition-colors"
                      >
                        Hủy liên kết
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-950/40 border border-amber-600/50 rounded-xl space-y-3 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300 text-xs sm:text-sm block">
                          Hiện tại: Chưa liên kết với file JSON nào ngoài ổ đĩa máy tính
                        </span>
                        <p className="text-slate-300 mt-0.5">
                          Dữ liệu {projects.length} dự án hiện mới chỉ lưu trong bộ nhớ IndexedDB của trình duyệt. Hãy chọn một trong các thao tác dưới đây để xuất dữ liệu ra file trên máy tính của bạn:
                        </p>
                      </div>
                    </div>

                    {/* 2 Nút hành động nổi bật */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                      {/* Nút 1: Chọn file trên máy để ghi đè & đồng bộ */}
                      <AppButton
                        size="sm"
                        variant="primary"
                        icon={<Link2 size={16} />}
                        onClick={handleSyncToSelectedFile}
                        className="flex-1 justify-center py-2 text-xs font-bold shadow-md shadow-blue-950/60"
                      >
                        🔗 Chọn file trên máy để Ghi đè {projects.length} dự án & Bật tự động đồng bộ
                      </AppButton>

                      {/* Nút 2: Lưu thành file mới */}
                      <AppButton
                        size="sm"
                        variant="success"
                        icon={<Save size={16} />}
                        onClick={handleSaveAs}
                        className="justify-center py-2 text-xs font-semibold"
                      >
                        💾 Lưu vị trí mới (Save As)...
                      </AppButton>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      * Mẹo: Bạn hãy bấm <strong>"Chọn file trên máy để Ghi đè..."</strong> và chọn file <code className="text-blue-300 font-mono">du_lieu_du_an.json</code> trong thư mục của bạn (ví dụ thư mục CSDL CAM XOA hay Google Drive). Phần mềm sẽ ghi đè toàn bộ dữ liệu hiện tại vào file đó và tự động cập nhật liên tục!
                    </p>
                  </div>
                )}

                {/* Các thao tác tải file và nạp file bổ sung */}
                <div className="pt-2 border-t border-[#1e2a4a] flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium mr-1">Tải về thủ công:</span>
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

                  <AppButton
                    size="sm"
                    variant="ghost"
                    icon={<Database size={14} />}
                    onClick={() => setIsBackupModalOpen(true)}
                  >
                    Mở Quản Lý Sao Lưu (Auto-backup 7 ngày)
                  </AppButton>
                </div>
              </div>

              {/* Hướng dẫn đồng bộ lên Google Drive Desktop */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs sm:text-sm">
                  <Smartphone size={17} />
                  <span>Cách đồng bộ tự động lên Google Drive & Điện thoại di động</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Khi bạn bấm nút <strong>"Lưu vị trí mới (Save As)"</strong> hoặc <strong>"Chọn file trên máy..."</strong> và lưu file vào thư mục Google Drive trên máy tính (ví dụ <code className="text-blue-300 font-mono">G:\My Drive\ProjectM\du_lieu_du_an.json</code>), ứng dụng Google Drive for Desktop sẽ tự động đẩy file này lên mây. Bạn có thể mở Google Drive trên điện thoại xem trực tiếp số liệu dự án, hợp đồng, chi phí mọi lúc mọi nơi kể cả khi mất mạng.
                </p>
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
