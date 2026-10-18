import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import healthMonitoringApi, {
  setSimulatedIssue,
  clearSimulatedIssues,
} from '../../../api/healthMonitoringApi';
import {
  SystemHealthResponse,
  SystemMetricsResponse,
} from '../../../types/healthMonitoring.types';
import StatusBanner from './components/StatusBanner';
import HealthCardsGrid from './components/HealthCardsGrid';
import PerformanceCharts from './components/PerformanceCharts';
import { useToast } from '../../../contexts/ToastContext';
import { RefreshCw } from 'lucide-react';

export const HealthMonitoringPage: React.FC = () => {
  const { info, success } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // TanStack React Query cho trạng thái hệ thống, tự động polling mỗi 30s khi autoRefresh = true
  const {
    data: healthData,
    isLoading: isHealthLoading,
    refetch: refetchHealth,
    isFetching: isHealthFetching,
  } = useQuery<SystemHealthResponse>({
    queryKey: ['admin-system-health'],
    queryFn: () => healthMonitoringApi.getSystemStatus(),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Query cho đồ thị chỉ số hiệu năng
  const {
    data: metricsData,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery<SystemMetricsResponse>({
    queryKey: ['admin-system-metrics'],
    queryFn: () => healthMonitoringApi.getSystemMetrics(),
    refetchInterval: autoRefresh ? 60000 : false,
  });

  const handleRefreshNow = async () => {
    await Promise.all([refetchHealth(), refetchMetrics()]);
    info('Đã cập nhật trạng thái hạ tầng hệ thống mới nhất');
  };

  const handleSimulate = async (issue: 'dbOverload' | 'faceAiDown' | 'queueClogged') => {
    setSimulatedIssue(issue, true);
    await refetchHealth();
    info(`Đã kích hoạt mô phỏng: ${issue}`);
  };

  const handleClearSimulation = async () => {
    clearSimulatedIssues();
    await refetchHealth();
    success('Đã khôi phục trạng thái hoạt động bình thường');
  };

  if (isHealthLoading || isMetricsLoading || !healthData || !metricsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#275A4E]" />
        <p className="text-sm font-medium">Đang thu thập thông số sức khỏe hệ thống theo thời gian thực...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
              UC-008 Infrastructure Monitoring
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">Uptime & Latency Real-time</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1">
            Giám Sát Sức Khỏe & Uptime Nền Tảng
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Theo dõi tình trạng máy chủ, độ sẵn sàng (uptime 99.9%), cơ sở dữ liệu 7 schemas, Redis và các dịch vụ nền tảng
          </p>
        </div>
      </div>

      {/* 1. Status Banner tổng quan & Auto-refresh */}
      <StatusBanner
        status={healthData.status}
        uptimePercentage={healthData.uptimePercentage}
        overallLatencyMs={healthData.overallLatencyMs}
        lastCheckedAt={healthData.lastCheckedAt}
        incidentAlert={healthData.incidentAlert}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onRefreshNow={handleRefreshNow}
        isFetching={isHealthFetching}
        onSimulate={handleSimulate}
        onClearSimulation={handleClearSimulation}
      />

      {/* 2. Lưới thẻ chỉ số sức khỏe 5 core components */}
      <HealthCardsGrid
        database={healthData.components.database}
        redis={healthData.components.redis}
        aiService={healthData.components.aiService}
        minio={healthData.components.minio}
        fcm={healthData.components.fcm}
        onRefreshNeeded={() => refetchHealth()}
      />

      {/* 3. Biểu đồ Hiệu năng & Lưu lượng Điểm danh */}
      <PerformanceCharts
        latencyHistory={metricsData.latencyHistory}
        trafficHistory={metricsData.trafficHistory}
      />
    </div>
  );
};

export default HealthMonitoringPage;
