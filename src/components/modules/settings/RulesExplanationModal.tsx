import React from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RulesExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesExplanationModal: React.FC<RulesExplanationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const rules = [
    {
      num: '1',
      title: 'Giao diện Tối (Dark Mode) 100%',
      desc: 'Bảng màu Slate/Zinc 900-950 dịu mắt, chống mỏi khi làm việc thời gian dài và phù hợp mọi điều kiện ánh sáng.',
      status: 'Đã hoàn thành',
    },
    {
      num: '2',
      title: 'Phân tách Modul lớn thành các Task nhỏ (WBS)',
      desc: 'Áp dụng tại tab Kế hoạch: chia 3 giai đoạn và phân rã chi tiết thành các task nhỏ với người phụ trách, thời hạn và trạng thái độc lập.',
      status: 'Đã hoàn thành',
    },
    {
      num: '3',
      title: 'Giao diện đồng bộ toàn phần mềm (Design System)',
      desc: 'Sử dụng chung 100% các component: AppButton, AppCard, AppBadge, AppTabs, AppTable, AppModal, VnNumberInput, VnDateInput.',
      status: 'Đã hoàn thành',
    },
    {
      num: '4',
      title: 'Font Be Vietnam Pro mặc định; tùy chọn Roboto, Inter; cỡ 12-18pt',
      desc: 'Bộ chuyển đổi font tức thì và thanh điều chỉnh cỡ chữ 12-18pt nằm ngay trên thanh Header.',
      status: 'Đã hoàn thành',
    },
    {
      num: '5',
      title: 'Định dạng Ngày Tháng chuẩn Việt Nam đặc thù',
      desc: 'Tháng 1, 2 có số 0 (01, 02); Tháng 3-12 không có số 0; Ngày 1-9 có số 0 (01-09); Ngày 10 trở đi không có số 0 (VD: 18/01/2026, 18/02/2026, 18/3/2026, 01/12/2026, 09/12/2026, 18/12/2026).',
      status: 'Đã hoàn thành',
    },
    {
      num: '6',
      title: 'Dữ liệu Số chuẩn Việt Nam & Format Realtime',
      desc: 'Hàng nghìn phân cách bằng dấu chấm (.), thập phân phân cách bằng dấu phẩy (,). Format realtime ngay khi gõ phím không bị nhảy con trỏ.',
      status: 'Đã hoàn thành',
    },
    {
      num: '7',
      title: 'Đa nền tảng PC & Điện thoại, mọi độ phân giải, 100% Offline',
      desc: 'Responsive hoàn hảo trên mọi kích thước màn hình, hoạt động offline và tự động đồng bộ qua file Google Drive trên máy tính.',
      status: 'Đã hoàn thành',
    },
  ];

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bảng Kiểm Định 7 Yêu Cầu Bắt Buộc Của Hệ Thống"
      subtitle="Được quy định vĩnh viễn trong file KE_HOACH_THUC_HIEN.md của dự án"
      maxWidth="2xl"
      footer={
        <AppButton variant="primary" onClick={onClose}>
          Đã hiểu
        </AppButton>
      }
    >
      <div className="space-y-3">
        {rules.map((r) => (
          <div
            key={r.num}
            className="p-3.5 rounded-xl bg-[#0b1222] border border-[#232f4e] flex items-start gap-3"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-900/50 border border-blue-700/50 text-blue-300 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
              {r.num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-100 text-xs md:text-sm">{r.title}</h4>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 shrink-0">
                  <CheckCircle2 size={13} /> {r.status}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppModal>
  );
};

