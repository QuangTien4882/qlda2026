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
  Database
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
              {/* Thẻ trạng thái lưu trữ trực tiếp */}
              <div className="p-3.5 bg-[#091428] border-2 border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-emerald-400 text-xs sm:text-sm uppercase">
                      Hệ thống Lưu trữ Offline & Tự động ghi nhớ
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700">
                    Lần lưu gần nhất: <strong className="text-emerald-400">{lastSavedTime}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-300 text-xs">
                  <div className="p-2 bg-[#060c18] rounded-lg border border-[#1e2c4c]">
                    <span className="text-slate-500 block text-[11px]">Tổng số dự án:</span>
                    <strong className="text-sm font-mono text-blue-300">{projects.length} dự án</strong>
                  </div>
                  <div className="p-2 bg-[#060c18] rounded-lg border border-[#1e2c4c]">
                    <span className="text-slate-500 block text-[11px]">Dung lượng CSDL:</span>
                    <strong className="text-sm font-mono text-emerald-300">{storageSizeKb} KB</strong>
                  </div>
                  <div className="p-2 bg-[#060c18] rounded-lg border border-[#1e2c4c]">
                    <span className="text-slate-500 block text-[11px]">Chế độ mạng:</span>
                    <strong className="text-sm text-cyan-300">100% Offline</strong>
                  </div>
                  <div className="p-2 bg-[#060c18] rounded-lg border border-[#1e2c4c]">
                    <span className="text-slate-500 block text-[11px]">Đồng bộ đĩa:</span>
                    <strong className={`text-sm ${isDirectFileConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isDirectFileConnected ? 'Đã kích hoạt' : 'Chưa gắn thư mục'}
                    </strong>
                  </div>
                </div>

                {isDirectFileConnected && (
                  <div className="p-2 bg-emerald-950/60 border border-emerald-600/50 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCheck size={15} className="text-emerald-400 shrink-0" />
                      <span>Đang tự động ghi thẳng vào: <strong>{connectedFileName}</strong></span>
                    </div>
                    <button
                      onClick={disconnectDirectFile}
                      className="px-2 py-0.5 rounded bg-rose-900/50 hover:bg-rose-800 text-rose-300 border border-rose-700 text-[11px] shrink-0"
                    >
                      Hủy kết nối
                    </button>
                  </div>
                )}
              </div>

              {/* KHỐI 1: CHỌN ĐƯỜNG DẪN & THƯ MỤC LƯU FILE TRỰC TIẾP */}
              <div className="p-3.5 bg-[#0b1222] border-2 border-blue-500/50 rounded-xl space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs sm:text-sm uppercase tracking-wide">
                    <FolderOpen size={18} />
                    <span>Chọn Thư Mục & Vị Trí Lưu File Dữ Liệu</span>
                  </div>
                  <span className="text-[11px] text-slate-400 italic">
                    * Mở hộp thoại chọn thư mục/file của Windows
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">
                  Bạn có thể bấm <strong>"Chọn thư mục lưu..."</strong> để chọn trực tiếp thư mục Google Drive (ví dụ: <code className="text-blue-300 font-mono">D:\Google Drive\ProjectM\</code>) hoặc bấm <strong>"Lưu vị trí mới (Save As)"</strong> để tự do đặt tên và chọn nơi lưu file:
                </p>

                {/* Thanh chọn đường dẫn kèm các nút hành động */}
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={drivePath}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDrivePath(val);
                          updateGoogleDrivePath(val);
                        }}
                        placeholder="Chọn thư mục hoặc nhập đường dẫn lưu file..."
                        className="w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Nút 1: Chọn thư mục Windows */}
                      <AppButton
                        size="sm"
                        variant="primary"
                        icon={<FolderOpen size={15} />}
                        onClick={handleSelectDirectory}
                      >
                        Chọn thư mục lưu...
                      </AppButton>

                      {/* Nút 2: Lưu dưới dạng Save As */}
                      <AppButton
                        size="sm"
                        variant="success"
                        icon={<Save size={15} />}
                        onClick={handleSaveAs}
                      >
                        Lưu vị trí mới (Save As)
                      </AppButton>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[11px] text-slate-400">
                      {isDirectFileConnected ? (
                        <span className="text-emerald-400">✓ Đang đồng bộ tự động với {connectedFileName}</span>
                      ) : (
                        <span>Mẹo: Hãy bấm nút <strong>"Chọn thư mục lưu..."</strong> để chọn thư mục Google Drive trên máy tính của bạn.</span>
                      )}
                    </span>
                    <button
                      onClick={handleSaveDrivePath}
                      className="text-blue-400 hover:text-blue-300 text-[11px] underline shrink-0"
                    >
                      {savePathSuccess ? '✓ Đã lưu đường dẫn' : 'Lưu đường dẫn đã nhập'}
                    </button>
                  </div>
                </div>
              </div>

              {/* KHỐI 2: SAO LƯU & NẠP FILE JSON THỦ CÔNG */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs sm:text-sm">
                  <HardDrive size={18} className="text-emerald-400" />
                  <span>Các Thao Tác Sao Lưu & Phục Hồi Khác</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Dành cho trường hợp bạn muốn tải file sao lưu về máy để gửi email, hoặc nạp file backup từ máy khác:
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {/* Mở Trung tâm Quản lý Sao lưu IndexedDB */}
                  <AppButton
                    size="sm"
                    variant="primary"
                    icon={<Database size={15} />}
                    onClick={() => setIsBackupModalOpen(true)}
                  >
                    Mở Quản Lý Sao Lưu (Auto-backup 7 ngày)
                  </AppButton>

                  {/* Tải file về máy */}
                  <AppButton
                    size="sm"
                    variant="outline"
                    icon={<Download size={15} />}
                    onClick={() => exportDatabaseToJson('du_lieu_du_an.json')}
                  >
                    Tải file du_lieu_du_an.json về máy
                  </AppButton>

                  {/* Mở file JSON */}
                  <AppButton
                    size="sm"
                    variant="secondary"
                    icon={<Upload size={15} />}
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

                  {/* Kết nối file đĩa có sẵn */}
                  <AppButton
                    size="sm"
                    variant="ghost"
                    icon={<Link2 size={15} />}
                    onClick={handleConnectDirect}
                  >
                    Mở file có sẵn để đồng bộ tiếp
                  </AppButton>
                </div>
              </div>

              {/* Nút khôi phục dữ liệu gốc mẫu */}
              <div className="p-3.5 bg-[#140f1a] border border-rose-950/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

              {/* Hướng dẫn trên điện thoại */}
              <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-semibold">
                  <Smartphone size={17} />
                  <span>Đồng bộ tự động lên Điện thoại di động (Mobile)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Khi bạn chọn thư mục lưu file là thư mục Google Drive trên máy tính (`D:\Google Drive\ProjectM\du_lieu_du_an.json`), ứng dụng Google Drive for Desktop sẽ tự động đẩy file này lên mây. Bạn có thể mở Google Drive trên điện thoại xem trực tiếp số liệu dự án, hợp đồng, chi phí mọi lúc mọi nơi kể cả khi mất mạng.
                </p>
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
