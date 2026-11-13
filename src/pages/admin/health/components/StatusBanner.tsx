import React, { useState, useEffect } from 'react';
import { HealthState } from '../../../../types/healthMonitoring.types';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Clock,
  Sparkles,
  Flame,
  Bug,
  RotateCcw,
} from 'lucide-react';

interface StatusBannerProps {
  status: HealthState;
  uptimePercentage: number;
  overallLatencyMs: number;
  lastCheckedAt: string;
  incidentAlert?: string;
  autoRefresh: boolean;
  onToggleAutoRefresh: (val: boolean) => void;
  onRefreshNow: () => void;
  isFetching: boolean;
  onSimulate: (issue: 'dbOverload' | 'faceAiDown' | 'queueClogged') => void;
  onClearSimulation: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  status,
  uptimePercentage,
  overallLatencyMs,
  lastCheckedAt,
  incidentAlert,
  autoRefresh,
  onToggleAutoRefresh,
  onRefreshNow,
  isFetching,
  onSimulate,
  onClearSimulation,
}) => {
  const [countdown, setCountdown] = useState(30);

  // Bộ đếm đếm ngược 30 giây
  useEffect(() => {
    if (!autoRefresh) return;
    setCountdown(30);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onRefreshNow();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefreshNow]);

  const isHealthy = status === 'HEALTHY';
  const isDegraded = status === 'DEGRADED';
  const isDown = status === 'DOWN';

  return (
    <div className="space-y-4">
      {/* Banner chính */}
      <div
        className={`p-6 rounded-3xl border transition-all duration-300 shadow-xs relative overflow-hidden ${
          isHealthy
            ? 'bg-gradient-to-r from-emerald-500/10 via-[#275A4E]/10 to-teal-500/10 border-[#78C2AD] text-slate-800'
            : isDegraded
            ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-[#E5A93C] text-slate-900'
            : 'bg-gradient-to-r from-rose-500/15 to-red-500/10 border-rose-400 text-rose-950'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Trạng thái tổng quan */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl shadow-xs shrink-0 ${
                isHealthy
                  ? 'bg-[#275A4E] text-white'
                  : isDegraded
                  ? 'bg-[#E5A93C] text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {isHealthy && <CheckCircle2 className="w-8 h-8 text-[#78C2AD]" />}
              {isDegraded && <AlertTriangle className="w-8 h-8" />}
              {isDown && <AlertOctagon className="w-8 h-8 animate-pulse" />}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">
                  {isHealthy
                    ? 'Tất cả các dịch vụ cốt lõi đang vận hành bình thường'
                    : isDegraded
                    ? 'Hệ thống đang hoạt động ở chế độ giảm tải (Degraded)'
                    : 'Cảnh báo: Dịch vụ nhận diện cổng trường gặp sự cố (Critical Incident)'}
                </h2>

                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    isHealthy
                      ? 'bg-emerald-100 text-[#1E4D40] border border-emerald-300'
                      : isDegraded
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {isHealthy ? 'VẬN HÀNH TỐT' : isDegraded ? 'CẢNH BÁO GIẢM TẢI' : 'SỰ CỐ KHẨN CẤP'}
                </span>
              </div>

              {incidentAlert ? (
                <p className="text-sm font-semibold text-rose-700 mt-1.5 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{incidentAlert}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-1">
                  Đảm bảo cam kết SLA Uptime 99.9% cho toàn bộ phân hệ Điểm danh Kiosk, Báo bếp, Cổng thanh toán và Mobile Parent App.
                </p>
              )}

              {/* Các thẻ chỉ số nhanh */}
              <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400">Độ sẵn sàng (Uptime):</span>{' '}
                  <span className="font-bold text-[#275A4E]">{uptimePercentage}%</span>
                </div>
                <div className="h-3 w-px bg-slate-300"></div>
                <div>
                  <span className="text-slate-400">Độ trễ trung bình:</span>{' '}
                  <span className="font-bold text-slate-800">{overallLatencyMs}ms</span>
                </div>
                <div className="h-3 w-px bg-slate-300"></div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Kiểm tra lần cuối: {new Date(lastCheckedAt).toLocaleTimeString('vi-VN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Công cụ điều khiển Auto-refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 bg-white/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <input
                id="auto-refresh-toggle"
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onToggleAutoRefresh(e.target.checked)}
                className="w-4 h-4 accent-[#275A4E] cursor-pointer"
              />
              <label htmlFor="auto-refresh-toggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Tự động làm mới (30s)
              </label>
            </div>

            {autoRefresh && (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                còn {countdown}s
              </span>
            )}

            <button
              type="button"
              onClick={onRefreshNow}
              disabled={isFetching}
              className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Làm mới ngay</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thanh kiểm thử mô phỏng sự cố (Test Simulation Controls) */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <Bug className="w-4 h-4 text-[#E5A93C]" />
          <span>Mô phỏng tình huống sự cố (QA Sandbox):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSimulate('dbOverload')}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium transition cursor-pointer"
            title="Kích hoạt cảnh báo MSG-030 độ trễ DB > 1000ms"
          >
            ⚠️ DB Quá tải (&gt;1000ms)
          </button>

          <button
            type="button"
            onClick={() => onSimulate('faceAiDown')}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-medium transition cursor-pointer"
            title="Kích hoạt cảnh báo MSG-031 điểm danh thủ công dự phòng"
          >
            🔴 Face AI Timeout (&gt;5s)
          </button>

          <button
            type="button"
            onClick={() => onSimulate('queueClogged')}
            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 font-medium transition cursor-pointer"
            title="Kích hoạt cảnh báo MSG-032 nghẽn hàng đợi thông báo"
          >
            🟡 Nghẽn Hàng Đợi (Queue &gt; 100)
          </button>

          <button
            type="button"
            onClick={onClearSimulation}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Khôi phục</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBanner;
