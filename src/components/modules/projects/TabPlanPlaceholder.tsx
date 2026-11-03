import React from 'react';
import { AppCard } from '../../common/AppCard';
import { Clock, AlertCircle } from 'lucide-react';

export const TabPlanPlaceholder: React.FC = () => {
  return (
    <div className="space-y-4">
      <AppCard
        title="TAB KẾ HOẠCH TIẾN ĐỘ & PHÂN TÁCH TASK NHỎ (WBS)"
        icon={<Clock size={18} className="text-blue-400" />}
      >
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-400 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <h3 className="text-base font-semibold text-slate-200">
            Chưa triển khai tab Kế hoạch
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            Theo lộ trình đã thống nhất, tab Kế hoạch (phân tách tiến độ 3 giai đoạn thành các task nhỏ) sẽ được triển khai chi tiết ở bước tiếp theo sau khi hoàn tất các tab số liệu.
          </p>
        </div>
      </AppCard>
    </div>
  );
};

