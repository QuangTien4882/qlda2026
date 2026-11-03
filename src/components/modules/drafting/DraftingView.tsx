import React, { useState, useEffect } from 'react';
import { AppCard } from '../../common/AppCard';
import { AppButton } from '../../common/AppButton';
import { FileEdit, Printer, Download, Sparkles, Copy, Check } from 'lucide-react';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';

export const DraftingView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { projects, costPackages } = useData();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : ''
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>('bien_ban_nghiem_thu');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHeaderTitle('SOẠN THẢO VĂN BẢN THEO BIỂU MẪU');
  }, [setHeaderTitle]);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const currentCosts = currentProject ? costPackages[currentProject.id] || [] : [];
  const primaryContract = currentCosts.length > 0 ? currentCosts[0] : null;

  // Mẫu văn bản tự động điền biến từ dự án
  const templates = [
    {
      id: 'bien_ban_nghiem_thu',
      name: 'Biên bản nghiệm thu công việc xây dựng',
      type: 'Nghiệm thu',
    },
    {
      id: 'to_trinh_du_toan',
      name: 'Tờ trình xin phê duyệt dự toán xây dựng công trình',
      type: 'Phê duyệt',
    },
    {
      id: 'don_doc_tien_do',
      name: 'Công văn đôn đốc tiến độ thi công gửi Nhà thầu',
      type: 'Hành chính',
    },
  ];

  // Nội dung văn bản với các biến đã được tự động thay thế bằng dữ liệu thật của dự án được chọn
  const generatedContent = currentProject
    ? `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
----------------------
Tp. Hồ Chí Minh, ngày 18 tháng 3 năm 2026

BIÊN BẢN NGHIỆM THU CÔNG VIỆC XÂY DỰNG
Số: 01/BBNT-${currentProject.code.replace(/[^a-zA-Z0-9]/g, '')}

1. Công trình/Dự án: ${currentProject.name}
2. Mã hiệu dự án: ${currentProject.code}
3. Địa điểm xây dựng: ${currentProject.location}
4. Thành phần trực tiếp nghiệm thu:
   a) Đại diện Chủ đầu tư:
      - Cơ quan: Ban Quản lý Dự án Đầu tư Xây dựng Chuyên ngành
   b) Đại diện Đơn vị Tư vấn Giám sát:
      - Đơn vị: Công ty TNHH Tư vấn Quản lý Dự án & Giám sát Delta
      - Ông/Bà: Lê Hoàng Long - Chức vụ: Giám đốc Điều hành
   c) Đại diện Nhà thầu thi công xây dựng:
      - Đơn vị: ${primaryContract ? primaryContract.contractor : 'Công ty Cổ phần Xây dựng'}
      - Hợp đồng số: ${primaryContract?.contractNumber || '18/2026/HĐ-XD'} ký ngày ${primaryContract?.contractDate || '18/01/2026'}
      - Giá trị hợp đồng: ${primaryContract ? formatVnNumber(primaryContract.contractValue) : formatVnNumber(currentProject.totalInvestment)} VNĐ
5. Thời gian nghiệm thu:
   - Bắt đầu: 08 giờ 30 ngày 18/3/2026
   - Kết thúc: 11 giờ 00 ngày 18/3/2026
6. Đánh giá công việc xây dựng đã thực hiện:
   - Các tài liệu làm căn cứ nghiệm thu: Hồ sơ thiết kế BVTC và dự toán đã được phê duyệt.
   - Chất lượng công việc xây dựng: Đạt yêu cầu thiết kế và quy chuẩn, tiêu chuẩn kỹ thuật hiện hành.
7. Kết luận:
   - Chấp nhận nghiệm thu hoàn thành công việc để chuyển bước thi công tiếp theo.`
    : 'Chưa có dự án nào trong hệ thống.';

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <FileEdit className="text-blue-400" /> Soạn Thảo Văn Bản Theo Biểu Mẫu
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Tự động điền các trường dữ liệu dự án, mã số, địa điểm, nhà thầu, số hợp đồng vào biểu mẫu chuẩn
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm" icon={<Printer size={15} />} onClick={handlePrint}>
            In văn bản
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            icon={copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            onClick={handleCopy}
          >
            {copied ? 'Đã sao chép!' : 'Sao chép văn bản'}
          </AppButton>
        </div>
      </div>

      {/* Bộ chọn Dự án & Biểu mẫu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            1. Chọn dự án cần trích xuất dữ liệu:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className={`w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 font-medium text-xs focus:outline-none focus:border-blue-500 ${
              !selectedProjectId ? 'text-slate-500 italic' : 'text-slate-100'
            }`}
          >
            <option value="" disabled hidden>Click để chọn dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-3.5 bg-[#0b1222] border border-[#232f4e] rounded-xl space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            2. Chọn biểu mẫu văn bản:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className={`w-full bg-[#080d1a] border border-[#232f4e] rounded-lg px-3 py-2 font-medium text-xs focus:outline-none focus:border-blue-500 ${
              !selectedTemplate ? 'text-slate-500 italic' : 'text-slate-100'
            }`}
          >
            <option value="" disabled hidden>Click để chọn biểu mẫu</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                [{t.type}] {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor Preview */}
      <AppCard
        title={
          <div className="flex items-center gap-2 text-white">
            <Sparkles size={16} className="text-amber-400" />
            <span>Nội Dung Văn Bản Đã Điền Tự Động (Realtime Preview)</span>
          </div>
        }
      >
        <div className="bg-[#070b14] p-4 sm:p-6 rounded-xl border border-[#1e2a4a] shadow-inner font-mono text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
          {generatedContent}
        </div>
      </AppCard>
    </div>
  );
};
