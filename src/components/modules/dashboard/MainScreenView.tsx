import React from 'react';
import { AppCard } from '../../common/AppCard';
import { Building2, Layers, DollarSign, TrendingUp } from 'lucide-react';
import { INITIAL_PROJECT_LIST } from '../../../data/sampleProjects';
import { formatVnNumber } from '../../../utils/numberUtils';

export const MainScreenView: React.FC = () => {
  const totalInvestment = INITIAL_PROJECT_LIST.reduce((a, b) => a + (b.totalInvestment || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-[#0f172a] border border-[#232f4e] rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">
          Tổng quan Dự án Đầu tư Xây dựng
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1">
          Hệ thống Quản lý Dự án Đầu tư Xây dựng Chuẩn Offline
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#0b1222] border border-[#232f4e] rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Tổng số dự án</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {INITIAL_PROJECT_LIST.length}
            </div>
          </div>
          <div className="bg-[#0b1222] border border-[#232f4e] rounded-xl p-3.5">
            <span className="text-xs text-slate-400">Tổng mức đầu tư</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              {formatVnNumber(totalInvestment)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
