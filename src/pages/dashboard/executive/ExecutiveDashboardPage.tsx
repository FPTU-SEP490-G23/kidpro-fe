import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import executiveApi from '../../../api/executiveApi';
import { ExecutiveDashboardData } from '../../../types/executiveDashboard.types';
import { useToast } from '../../../contexts/ToastContext';
import ExecutiveToolbar from './components/ExecutiveToolbar';
import ExecutiveMetricCards from './components/ExecutiveMetricCards';
import KitchenMealBreakdownChart from './components/KitchenMealBreakdownChart';
import SecurityGateAlertsWatcher from './components/SecurityGateAlertsWatcher';
import { RefreshCw, Inbox } from 'lucide-react';

export const ExecutiveDashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, info, error } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // TanStack React Query tự động polling mỗi 30s
  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<ExecutiveDashboardData>({
    queryKey: ['executive-operations-dashboard', selectedDate],
    queryFn: async () => {
      const res = await executiveApi.getExecutiveOverview(selectedDate);
      return res;
    },
    refetchInterval: 30000, // 30 giây
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      success('MSG-046: Dữ liệu điều hành đã được đồng bộ với luồng camera cổng và kế toán');
    } catch {
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  if (isLoading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#275A4E]" />
        <p className="text-sm font-medium">Đang tải bảng điều hành toàn trường thời gian thực...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Thanh công cụ Top Toolbar */}
      <ExecutiveToolbar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onRefresh={handleRefresh}
        isFetching={isFetching}
        isCacheData={data.isCacheData}
      />

      {/* 2. 4 Thẻ chỉ số tổng quan (Chuyên cần, Bếp ăn, Học phí, An ninh) */}
      <ExecutiveMetricCards
        attendance={data.attendance}
        kitchen={data.kitchen}
        finance={data.finance}
        security={data.security}
      />

      {/* 3. Chi tiết Bếp ăn & Sĩ số từng lớp */}
      <KitchenMealBreakdownChart classSummaries={data.classSummaries} />

      {/* 4. Cảnh báo người lạ tại cổng trường (Camera AI) */}
      <SecurityGateAlertsWatcher
        alerts={data.unresolvedAlerts}
        onAlertResolved={() => {
          queryClient.invalidateQueries({ queryKey: ['executive-operations-dashboard'] });
        }}
      />
    </div>
  );
};

export default ExecutiveDashboardPage;
