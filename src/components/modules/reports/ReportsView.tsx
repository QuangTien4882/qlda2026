import React, { useEffect, useMemo } from 'react';
import { AppCard } from '../../common/AppCard';
import { AppButton } from '../../common/AppButton';
import { AppBadge } from '../../common/AppBadge';
import { BarChart3, Download, Printer, PieChart, HardDrive } from 'lucide-react';
import { formatVnNumber } from '../../../utils/numberUtils';
import { useSettings } from '../../../context/SettingsContext';
import { useData } from '../../../context/DataContext';

export const ReportsView: React.FC = () => {
  const { setHeaderTitle } = useSettings();
  const { projects, costPackages, inspections, exportDatabaseToJson } = useData();

  useEffect(() => {
    setHeaderTitle('BÁO CÁO TỔNG HỢP SỐ LIỆU DỰ ÁN');
  }, [setHeaderTitle]);

  // Tính toán số liệu tổng hợp động từ DataContext
  const { totalTmdt, totalContractValue, totalPaymentValue, allPackages } = useMemo(() => {
    const tmdt = projects.reduce((sum, p) => sum + (p.totalInvestment || 0), 0);

    const pkgs: Array<{
      projectId: string;
      projectName: string;
      content: string;
      contractor: string;
      contractValue: number;
      inspectionValue: number;
      paymentValue: number;
    }> = [];

    let totalContract = 0;
    let totalPayment = 0;

    projects.forEach((proj) => {
      const projCosts = costPackages[proj.id] || [];
      const projInsps = inspections[proj.id] || [];

      projCosts.forEach((cost) => {
        totalContract += cost.contractValue || 0;

        // Tìm nghiệm thu tương ứng (nếu có)
        const matchInsps = projInsps.filter((i) => i.packageName.includes(cost.content) || cost.content.includes(i.packageName));
        const inspVal = matchInsps.reduce((s, i) => s + (i.inspectionValue || 0), 0);
        const payVal = matchInsps.reduce((s, i) => s + (i.paymentValue || 0), 0);

        totalPayment += payVal;

        pkgs.push({
          projectId: proj.id,
          projectName: proj.name,
          content: cost.content,
          contractor: cost.contractor || 'Chưa chỉ định',
          contractValue: cost.contractValue || 0,
          inspectionValue: inspVal,
          paymentValue: payVal,
        });
      });
    });

    return {
      totalTmdt: tmdt,
      totalContractValue: totalContract,
      totalPaymentValue: totalPayment,
      allPackages: pkgs,
    };
  }, [projects, costPackages, inspections]);

  const disbursementRate =
    totalContractValue > 0
      ? Number(((totalPaymentValue / totalContractValue) * 100).toFixed(1))
      : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-blue-400" /> Báo Cáo Tổng Hợp Số Liệu Dự Án
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Tổng hợp dữ liệu số liệu từ tất cả các dự án đầu tư xây dựng đang quản lý trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <AppButton variant="outline" size="sm" icon={<Printer size={15} />} onClick={handlePrint}>
            In báo cáo
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            icon={<Download size={15} />}
            onClick={() => exportDatabaseToJson('bao_cao_du_an.json')}
          >
            Xuất dữ liệu báo cáo
          </AppButton>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#232f4e]">
          <span className="text-xs text-slate-400">Tổng TMĐT các dự án đang quản lý</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatVnNumber(totalTmdt)} VNĐ
          </div>
          <span className="text-[11px] text-blue-400 mt-1 block">
            {projects.length} dự án trong danh mục
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#232f4e]">
          <span className="text-xs text-slate-400">Tổng giá trị hợp đồng đã ký kết</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatVnNumber(totalContractValue)} VNĐ
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {allPackages.length} gói thầu / hợp đồng
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-[#232f4e]">
          <span className="text-xs text-slate-400">Tổng giá trị đã giải ngân lũy kế</span>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">
            {formatVnNumber(totalPaymentValue)} VNĐ
          </div>
          <span className="text-[11px] text-purple-300 mt-1 block">
            Tỷ lệ giải ngân: {disbursementRate}% so với hợp đồng
          </span>
        </div>
      </div>

      {/* Report Breakdown */}
      <AppCard title="Bảng theo dõi kế hoạch vốn và tỷ lệ giải ngân theo gói thầu" icon={<PieChart size={16} />}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#111a2e] border-b border-[#232f4e] text-slate-300 font-semibold">
                <th className="py-3 px-4">Tên gói thầu / Dự án</th>
                <th className="py-3 px-4">Nhà thầu</th>
                <th className="py-3 px-4 text-right">Giá trị hợp đồng (VNĐ)</th>
                <th className="py-3 px-4 text-right">Giá trị nghiệm thu (VNĐ)</th>
                <th className="py-3 px-4 text-right">Đã thanh toán (VNĐ)</th>
                <th className="py-3 px-4 text-center">Tỷ lệ giải ngân</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2a4a]/60">
              {allPackages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có gói thầu nào được tạo trong các dự án.
                  </td>
                </tr>
              ) : (
                allPackages.map((pkg, idx) => {
                  const rate =
                    pkg.contractValue > 0
                      ? Number(((pkg.paymentValue / pkg.contractValue) * 100).toFixed(1))
                      : 0;

                  return (
                    <tr key={idx} className="hover:bg-[#131c33]">
                      <td className="py-3 px-4 font-medium text-slate-100">
                        <div>{pkg.content}</div>
                        <div className="text-[11px] text-slate-400 font-normal">{pkg.projectName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{pkg.contractor}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        {formatVnNumber(pkg.contractValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatVnNumber(pkg.inspectionValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-purple-400 font-bold">
                        {formatVnNumber(pkg.paymentValue)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <AppBadge variant={rate > 50 ? 'emerald' : rate > 0 ? 'blue' : 'slate'}>
                          {rate}%
                        </AppBadge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
};
