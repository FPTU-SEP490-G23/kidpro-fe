import React from 'react';
import { BghRevenueReportPage } from '../../bgh/BghRevenueReportPage';

export const RevenueReportTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-800">
        <div>
          <span className="font-bold">Màn hình Dùng chung:</span> Báo cáo Doanh thu & Quản lý Công nợ Quá hạn (Dành cho Ban Giám hiệu & Bộ phận Kế toán).
        </div>
        <span className="font-mono text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg">
          API: /api/bgh/finance/revenue-report & /api/finance/revenue-report
        </span>
      </div>
      <BghRevenueReportPage />
    </div>
  );
};

export default RevenueReportTab;
