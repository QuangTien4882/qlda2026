import React, { useState } from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { useSettings } from '../../../context/SettingsContext';
import { FolderSync, HardDrive, Smartphone, CheckCircle, Download, Upload, ExternalLink } from 'lucide-react';
import { SAMPLE_PROJECT } from '../../../data/sampleProjects';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateGoogleDrivePath } = useSettings();
  const [filePath, setFilePath] = useState(
    settings.googleDrivePath || 'D:\\Google Drive\\ProjectM\\du_lieu_du_an.json'
  );
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    const dataStr = JSON.stringify(
      {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        project: SAMPLE_PROJECT,
      },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'du_lieu_du_an.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cấu Hình Lưu Trữ File Dữ Liệu & Đồng Bộ Google Drive"
      subtitle="Chạy 100% Offline trên Máy tính và hỗ trợ xem dữ liệu trên Điện thoại"
      maxWidth="2xl"
      footer={
        <AppButton variant="secondary" onClick={onClose}>
          Đóng
        </AppButton>
      }
    >
      <div className="space-y-5 text-xs md:text-sm">
        {/* Section 1: PC File Sync */}
        <div className="p-4 rounded-xl bg-[#0b1222] border border-[#232f4e] space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <HardDrive size={18} />
            <span>1. Lưu trữ trên Máy tính (PC / Windows)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Phần mềm hoạt động hoàn toàn offline và tự động ghi trực tiếp vào file{' '}
            <code className="text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded border border-emerald-800/40">
              du_lieu_du_an.json
            </code>{' '}
            nằm trong thư mục Google Drive của bạn trên máy tính:
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="flex-1 bg-[#121c32] border border-[#232f4e] rounded-lg px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
              placeholder="Đường dẫn file Google Drive..."
            />
            <AppButton
              size="sm"
              variant="outline"
              onClick={() => updateGoogleDrivePath(filePath)}
            >
              Lưu cấu hình
            </AppButton>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <AppButton size="sm" variant="success" icon={<Download size={14} />} onClick={handleExport}>
              Tải file du_lieu_du_an.json về máy
            </AppButton>
          </div>
        </div>

        {/* Section 2: Mobile Access */}
        <div className="p-4 rounded-xl bg-[#0b1222] border border-[#232f4e] space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-semibold">
            <Smartphone size={18} />
            <span>2. Cách xem số liệu trên Điện thoại (Mobile)</span>
          </div>
          <div className="space-y-2 text-slate-300 text-xs leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                1
              </span>
              <span>
                File <code className="text-blue-300">du_lieu_du_an.json</code> được ứng dụng Google Drive trên máy tính đồng bộ lên đám mây trong 1-2 giây.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                2
              </span>
              <span>
                Khi ra ngoài công trường, bạn mở ứng dụng Google Drive trên điện thoại, chọn mở file bằng trình xem di động <code className="text-blue-300">ProjectM-Mobile.html</code>.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-900/60 text-blue-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                3
              </span>
              <span>
                Toàn bộ dữ liệu dự án, giá trị nghiệm thu, tiến độ hiển thị ngay tức thì và được lưu vào bộ nhớ máy điện thoại để <strong>khi mất sóng vẫn xem được bình thường</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Desktop packaging */}
        <div className="p-4 rounded-xl bg-[#0b1222] border border-[#232f4e] space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <CheckCircle size={18} />
            <span>3. Bộ cài đặt Desktop (.exe & Portable)</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Sau khi duyệt xong giao diện màn hình chính, hệ thống sẽ đóng gói thành bộ cài đặt{' '}
            <strong className="text-slate-200">ProjectM-Setup.exe</strong> và bản{' '}
            <strong className="text-slate-200">ProjectM-Portable</strong> để bạn copy vào USB hoặc cài đặt lên bất kỳ máy tính Windows nào để sử dụng vĩnh viễn không cần mạng.
          </p>
        </div>
      </div>
    </AppModal>
  );
};

