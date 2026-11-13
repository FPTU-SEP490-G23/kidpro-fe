import React from 'react';
import { Calendar, RefreshCw, Radio, CheckCircle2, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../../../../contexts/AuthContext';

interface ExecutiveToolbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
  isFetching: boolean;
  isCacheData?: boolean;
}

export const ExecutiveToolbar: React.FC<ExecutiveToolbarProps> = ({
  selectedDate,
  onDateChange,
  onRefresh,
  isFetching,
  isCacheData,
}) => {
  const { user } = useAuth();
  const schoolName = user?.schoolName;
  const schoolCode = user?.schoolCode;

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
            Executive Dashboard
          </span>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-slate-500">Ban Giám Hiệu & Quản Trị</span>
          {schoolName && (
            <>
              <span className="text-xs text-slate-300">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#275A4E] text-xs font-bold border border-emerald-200">
                <Building2 className="w-3.5 h-3.5 text-[#275A4E]" />
                {schoolName} {schoolCode ? `(${schoolCode})` : ''}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1 flex items-center gap-2 flex-wrap">
          Bảng Điều Hành {schoolName ? `Trường ${schoolName}` : 'Toàn Trường Thời Gian Thực'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {schoolName ? (
            <span className="font-semibold text-slate-700">
              Cơ sở: {schoolName} {schoolCode ? `[${schoolCode}]` : ''} —{' '}
            </span>
          ) : null}
          Giám sát sĩ số chuyên cần, snapshot suất ăn bếp đã chốt 08:30 AM, tiến độ học phí và an ninh camera cổng
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Bộ chọn ngày */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-[#275A4E]" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
          />
        </div>

        {/* Nút làm mới */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới (30s)</span>
        </button>

        {/* Badge trạng thái đồng bộ MSG-046 / MSG-047 */}
        <div className="w-full sm:w-auto">
          {isCacheData ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300">
              <Clock className="w-3 h-3 text-[#E5A93C]" />
              Đang hiển thị bộ nhớ đệm. Đang đồng bộ...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              Dữ liệu đã đồng bộ với Camera & Kế toán
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveToolbar;
