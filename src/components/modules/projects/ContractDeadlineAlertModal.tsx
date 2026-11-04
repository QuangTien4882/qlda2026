import React from 'react';
import { AppModal } from '../../common/AppModal';
import { AppButton } from '../../common/AppButton';
import { AppBadge } from '../../common/AppBadge';
import { useData } from '../../../context/DataContext';
import { calculateContractDeadline, ContractDeadlineInfo } from '../../../utils/dateUtils';
import { AlertTriangle, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { CostPackageItem, ProjectListItem } from '../../../types/project';

interface AlertContractItem {
  project: ProjectListItem;
  costPackage: CostPackageItem;
  info: ContractDeadlineInfo;
}

interface ContractDeadlineAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCostPackage?: (projectId: string, costPackageId: string) => void;
}

export const ContractDeadlineAlertModal: React.FC<ContractDeadlineAlertModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCostPackage,
}) => {
  const { projects, costPackages, contractAppendices } = useData();

  if (!isOpen) return null;

  // Lấy toàn bộ các hợp đồng từ tất cả các dự án
  const contractList: AlertContractItem[] = [];

  projects.forEach((proj) => {
    const packages = costPackages[proj.id] || [];
    packages.forEach((pkg) => {
      // Chỉ kiểm tra các gói thầu có hợp đồng, không phải Phí và chưa Hoàn thành
      if (pkg.costType !== 'Phí' && pkg.status !== 'Hoàn thành' && pkg.contractNumber && pkg.contractDate) {
        // Lấy các phụ lục của gói thầu này
        const allProjApps = contractAppendices[proj.id] || [];
        const pkgApps = allProjApps.filter((a) => a.costPackageId === pkg.id);
        const additionalDays = pkgApps.reduce((sum, a) => {
          if (a.adjustmentType === 'Tiến độ' || a.adjustmentType === 'Giá trị & Tiến độ') {
            return sum + (Number(a.adjustmentDays) || 0);
          }
          return sum;
        }, 0);

        const info = calculateContractDeadline(
          pkg.contractDate,
          pkg.executionTime,
          additionalDays,
          false,
          false
        );

        // Chỉ đưa vào danh sách nếu đã quá hạn hoặc còn <= 30 ngày
        if (info.status === 'overdue' || info.status === 'urgent' || info.status === 'warning') {
          contractList.push({
            project: proj,
            costPackage: pkg,
            info,
          });
        }
      }
    });
  });

  // Sắp xếp ưu tiên: Quá hạn lên đầu, sau đó đến số ngày còn lại tăng dần
  contractList.sort((a, b) => a.info.remainingDays - b.info.remainingDays);

  const overdueCount = contractList.filter((c) => c.info.status === 'overdue').length;
  const urgentCount = contractList.filter((c) => c.info.status === 'urgent').length;
  const warningCount = contractList.filter((c) => c.info.status === 'warning').length;

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cảnh báo Tiến độ & Hạn chót Hợp đồng"
      subtitle="Tự động kiểm soát các hợp đồng Quá hạn hoặc Sắp đến hạn nghiệm thu, thanh lý"
      level={1}
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400 font-mono">
            Phát hiện: <strong className="text-rose-400">{overdueCount} quá hạn</strong> •{' '}
            <strong className="text-amber-400">{urgentCount} khẩn cấp (≤15 ngày)</strong> •{' '}
            <strong className="text-yellow-400">{warningCount} lưu ý (≤30 ngày)</strong>
          </span>
          <AppButton variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </AppButton>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-3.5 max-h-[70vh]">
        {/* THỐNG KÊ NHANH TRẠNG THÁI */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-300 uppercase font-semibold block">Đã quá hạn</span>
              <span className="text-2xl font-bold font-mono text-rose-400">{overdueCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-900/60 text-rose-400">
              <AlertTriangle size={24} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-amber-300 uppercase font-semibold block">Khẩn cấp (≤ 15 ngày)</span>
              <span className="text-2xl font-bold font-mono text-amber-400">{urgentCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-900/60 text-amber-400">
              <Clock size={24} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-800/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-yellow-300 uppercase font-semibold block">Cần lưu ý (≤ 30 ngày)</span>
              <span className="text-2xl font-bold font-mono text-yellow-400">{warningCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-yellow-900/60 text-yellow-400">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* DANH SÁCH CHI TIẾT */}
        {contractList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-[#070d1a] border border-slate-800 rounded-xl">
            <CheckCircle2 size={40} className="text-emerald-400 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200">Không có hợp đồng nào sắp hết hạn hoặc quá hạn</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Tất cả các hợp đồng đang thực hiện đều trong giới hạn thời gian an toàn (&gt; 30 ngày) hoặc đã hoàn thành.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-[#070d1a]">
            <table className="w-full text-left border-collapse table-data-grid">
              <thead className="bg-[#111c33] text-slate-200 uppercase font-semibold text-xs border-b border-slate-700 sticky top-0 z-10 select-none">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">STT</th>
                  <th className="py-2.5 px-3">Dự án</th>
                  <th className="py-2.5 px-3">Gói thầu / Nội dung chi phí</th>
                  <th className="py-2.5 px-3">Số HĐ & Nhà thầu</th>
                  <th className="py-2.5 px-3 text-center">Ngày ký</th>
                  <th className="py-2.5 px-3 text-center">Hạn chót HĐ</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái hạn</th>
                  <th className="py-2.5 px-3 text-center w-20">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {contractList.map((item, idx) => (
                  <tr key={`${item.project.id}-${item.costPackage.id}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-blue-300 max-w-[200px] truncate" title={item.project.name}>
                        {item.project.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.project.code}</div>
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-medium text-slate-200 block max-w-[220px] truncate" title={item.costPackage.content}>
                        {item.costPackage.content}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-mono font-bold text-slate-200">{item.costPackage.contractNumber}</div>
                      <div className="text-[11px] text-slate-400 max-w-[180px] truncate">{item.costPackage.contractor || '—'}</div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-slate-300">{item.costPackage.contractDate}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-100">
                      {item.info.deadlineStr}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {item.info.status === 'overdue' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-rose-950/80 text-rose-300 border border-rose-700/80">
                          <AlertTriangle size={12} className="text-rose-400" />
                          Quá hạn {Math.abs(item.info.remainingDays)} ngày
                        </span>
                      )}
                      {item.info.status === 'urgent' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-xs bg-amber-950/80 text-amber-200 border border-amber-600/80 animate-pulse">
                          <Clock size={12} className="text-amber-400" />
                          Còn {item.info.remainingDays} ngày
                        </span>
                      )}
                      {item.info.status === 'warning' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-semibold text-xs bg-yellow-950/60 text-yellow-300 border border-yellow-700/60">
                          <Clock size={12} className="text-yellow-400" />
                          Còn {item.info.remainingDays} ngày
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateToCostPackage) {
                            onNavigateToCostPackage(item.project.id, item.costPackage.id);
                          }
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0b1424] hover:bg-blue-900/50 border border-[#232f4e] text-blue-300 text-xs transition-colors"
                        title="Xem gói thầu và lập Phụ lục gia hạn"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppModal>
  );
};

