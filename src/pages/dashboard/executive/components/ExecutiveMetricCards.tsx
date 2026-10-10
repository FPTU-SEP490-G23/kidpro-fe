import React from 'react';
import {
  ExecutiveAttendanceMetrics,
  ExecutiveKitchenMetrics,
  ExecutiveFinanceMetrics,
  ExecutiveSecurityMetrics,
} from '../../../../types/executiveDashboard.types';
import { formatCurrency } from '../../../../utils/formatters';
import {
  Users,
  UtensilsCrossed,
  Receipt,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Radio,
  ArrowUpRight,
  Clock,
} from 'lucide-react';

interface ExecutiveMetricCardsProps {
  attendance: ExecutiveAttendanceMetrics;
  kitchen: ExecutiveKitchenMetrics;
  finance: ExecutiveFinanceMetrics;
  security: ExecutiveSecurityMetrics;
}

export const ExecutiveMetricCards: React.FC<ExecutiveMetricCardsProps> = ({
  attendance,
  kitchen,
  finance,
  security,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Sĩ số & Chuyên cần */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sĩ Số & Chuyên Cần
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#275A4E]">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {attendance.presentCount}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              / {attendance.totalStudents} trẻ
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tỷ lệ chuyên cần:</span>
            <span className="font-extrabold text-[#275A4E] bg-emerald-50 px-2 py-0.5 rounded-md border border-[#78C2AD]/50">
              {attendance.attendanceRate}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-[#275A4E] h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, attendance.attendanceRate)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Vắng có phép: <strong className="text-slate-700">{attendance.absentWithLeave}</strong></span>
          <span>Không phép: <strong className="text-rose-600">{attendance.absentWithoutLeave}</strong></span>
        </div>
      </div>

      {/* 2. Báo Cáo Suất Ăn Bếp (Khóa Chốt 08:30) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Khóa Suất Ăn 08:30 AM
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-[#E5A93C]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {kitchen.totalMeals}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-700" />
              ĐÃ CHỐT SỐ
            </span>
          </div>

          {/* Phân tách cơm - cháo - dị ứng */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-medium">Cơm thường</span>
              <span className="text-sm font-bold text-slate-800">{kitchen.regularRiceCount} suất</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 block font-medium">Cháo dinh dưỡng</span>
              <span className="text-sm font-bold text-slate-800">{kitchen.porridgeCount} suất</span>
            </div>
          </div>
        </div>

        {/* Cảnh báo suất ăn tránh dị ứng đỏ rực */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200 w-full justify-between">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Suất Tránh Dị Ứng:
            </span>
            <span className="text-sm">{kitchen.allergyDietCount} suất</span>
          </div>
        </div>
      </div>

      {/* 3. Tài Chính & Tiến Độ Học Phí */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thu Học Phí Tháng Này
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <span className="text-2xl font-extrabold text-[#275A4E] tracking-tight block">
              {formatCurrency(finance.collectedAmount)}
            </span>
            <span className="text-xs text-slate-400 mt-0.5 block">
              Tổng kê: {formatCurrency(finance.totalBilledAmount)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tỷ lệ đã thu:</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
              {finance.collectionRate}%
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, finance.collectionRate)}%` }}
            ></div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Còn nợ: <strong className="text-slate-700">{formatCurrency(finance.pendingAmount)}</strong></span>
          <span className="text-amber-700 font-semibold">{finance.overdueCount} quá hạn</span>
        </div>
      </div>

      {/* 4. An Ninh Cổng Căn Bản & Cảnh Báo Người Lạ */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
          security.unresolvedAlertsCount > 0
            ? 'bg-rose-50/70 border-rose-300 shadow-rose-900/10'
            : 'bg-white border-slate-200/90 shadow-2xs'
        }`}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              An Ninh Cổng Trường
            </span>
            <div
              className={`p-2.5 rounded-2xl ${
                security.unresolvedAlertsCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-teal-50 text-[#275A4E]'
              }`}
            >
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold tracking-tight ${
                security.unresolvedAlertsCount > 0 ? 'text-rose-700' : 'text-slate-800'
              }`}
            >
              {security.unresolvedAlertsCount}
            </span>
            <span className="text-xs font-bold text-slate-500">
              cảnh báo chưa duyệt
            </span>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Lượt quét cổng hôm nay:</span>
              <strong className="text-slate-800">{security.totalScansToday}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Nhận diện khớp (Mint Green):</span>
              <strong className="text-[#275A4E]">{security.recognizedCount}</strong>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
            <Radio className="w-3 h-3 text-[#10B981] animate-pulse" />
            Camera AI Online (3 Trạm)
          </span>
          <span className="text-[10px] text-slate-400">Nghị định 13</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveMetricCards;
