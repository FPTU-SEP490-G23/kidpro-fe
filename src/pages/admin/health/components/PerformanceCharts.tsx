import React, { useState } from 'react';
import { LatencyPoint, TrafficPoint } from '../../../../types/healthMonitoring.types';
import { Activity, BarChart3, TrendingUp, Users } from 'lucide-react';

interface PerformanceChartsProps {
  latencyHistory: LatencyPoint[];
  trafficHistory: TrafficPoint[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  latencyHistory,
  trafficHistory,
}) => {
  const [hoveredLatency, setHoveredLatency] = useState<LatencyPoint | null>(null);
  const [hoveredTraffic, setHoveredTraffic] = useState<TrafficPoint | null>(null);

  // Tính toán scale Line Chart
  const maxLatency = Math.max(...latencyHistory.map((d) => d.latencyMs), 50);
  const chartHeight = 160;
  const chartWidth = 500;
  const paddingX = 30;
  const paddingY = 20;

  const points = latencyHistory.map((pt, idx) => {
    const x = paddingX + (idx / (latencyHistory.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (pt.latencyMs / maxLatency) * (chartHeight - paddingY * 2);
    return { ...pt, x, y };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${
    chartHeight - paddingY
  } Z`;

  // Tính toán scale Bar Chart
  const maxTraffic = Math.max(...trafficHistory.map((d) => d.total), 200);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Biểu đồ Độ trễ phản hồi (Line Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#275A4E]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Độ Trễ Phản Hồi Toàn Hệ Thống (24h)</h3>
              <p className="text-xs text-slate-500">Mức biến thiên Response Latency (ms)</p>
            </div>
          </div>

          {hoveredLatency ? (
            <span className="text-xs font-bold font-mono text-[#275A4E] bg-emerald-50 px-2.5 py-1 rounded-lg border border-[#78C2AD]/50">
              {hoveredLatency.timeLabel}: {hoveredLatency.latencyMs}ms
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-400">Trung bình 24h: ~16ms</span>
          )}
        </div>

        {/* SVG Line Chart */}
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-44 select-none">
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#78C2AD" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#275A4E" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94A3B8"
                    fontFamily="sans-serif"
                  >
                    {Math.round(ratio * maxLatency)}ms
                  </text>
                </g>
              );
            })}

            {/* Area fill */}
            <path d={areaD} fill="url(#latencyGradient)" />

            {/* Main Path */}
            <path d={pathD} fill="none" stroke="#275A4E" strokeWidth="2.5" strokeLinecap="round" />

            {/* Points & Hover targets */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredLatency?.timeLabel === pt.timeLabel ? 5 : 3}
                  fill="#ffffff"
                  stroke="#275A4E"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredLatency(pt)}
                  onMouseLeave={() => setHoveredLatency(null)}
                />
              </g>
            ))}

            {/* X-axis labels */}
            {points
              .filter((_, i) => i % 3 === 0 || i === points.length - 1)
              .map((pt, idx) => (
                <text
                  key={idx}
                  x={pt.x}
                  y={chartHeight - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748B"
                  fontWeight="500"
                >
                  {pt.timeLabel}
                </text>
              ))}
          </svg>
        </div>
      </div>

      {/* 2. Biểu đồ Lưu lượng Điểm danh Cổng theo Khung giờ (Bar Chart) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-[#E5A93C]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Lưu Lượng Điểm Danh Cổng Trường</h3>
              <p className="text-xs text-slate-500">Cao điểm sáng (07h00 - 08h30) & chiều (16h00 - 17h30)</p>
            </div>
          </div>

          {hoveredTraffic && (
            <span className="text-xs font-bold text-slate-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-[#E5A93C]/50">
              {hoveredTraffic.timeSlot}: {hoveredTraffic.total} lượt
            </span>
          )}
        </div>

        {/* Bar chart container */}
        <div className="h-44 flex items-end gap-2 pt-4 px-2 border-b border-slate-200">
          {trafficHistory.map((slot, idx) => {
            const heightPercent = Math.max(8, (slot.total / maxTraffic) * 100);
            const isPeakMorning = slot.timeSlot.includes('07:') || slot.timeSlot.includes('08:');
            const isPeakAfternoon = slot.timeSlot.includes('16:') || slot.timeSlot.includes('17:');

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredTraffic(slot)}
                onMouseLeave={() => setHoveredTraffic(null)}
              >
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 relative ${
                    isPeakMorning
                      ? 'bg-[#275A4E] group-hover:bg-[#1E4D40]'
                      : isPeakAfternoon
                      ? 'bg-[#E5A93C] group-hover:bg-[#CF9127]'
                      : 'bg-slate-200 group-hover:bg-slate-300'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Tooltip con */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none transition whitespace-nowrap z-10 shadow-md">
                    {slot.total} trẻ
                  </div>
                </div>

                <span className="text-[9px] text-slate-400 mt-1.5 truncate max-w-full font-mono">
                  {slot.timeSlot.split(' - ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#275A4E]"></span> Đón sáng (Vào)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#E5A93C]"></span> Trả chiều (Ra)
            </span>
          </div>
          <span>Tổng lưu lượng ngày: <strong>818 lượt</strong></span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
