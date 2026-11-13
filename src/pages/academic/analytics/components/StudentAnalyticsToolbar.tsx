import React from 'react';
import { Download, Filter, Search, ShieldCheck } from 'lucide-react';

interface StudentAnalyticsToolbarProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedClassId: string;
  onClassChange: (classId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  keyword: string;
  onKeywordChange: (kw: string) => void;
  hasAllergyOnly: boolean;
  onToggleAllergy: (val: boolean) => void;
  onExport: () => void;
  classes: { id: string; name: string }[];
}

export const StudentAnalyticsToolbar: React.FC<StudentAnalyticsToolbarProps> = ({
  selectedYear,
  onYearChange,
  selectedClassId,
  onClassChange,
  selectedStatus,
  onStatusChange,
  keyword,
  onKeywordChange,
  hasAllergyOnly,
  onToggleAllergy,
  onExport,
  classes,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
              Student Retention & Mobility
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">BGH & Giáo vụ Học vụ</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1">
            Báo Cáo Biến Động Học Sinh & Chuyển Lớp
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tỷ lệ duy trì sĩ số, đơn xin chuyển lớp / bảo lưu và hồ sơ an toàn dinh dưỡng (Nghị định 13/2023/NĐ-CP)
          </p>
        </div>

        <button
          type="button"
          onClick={onExport}
          className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#78C2AD]" />
          <span>Xuất Báo Cáo An Toàn</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
        {/* Tìm kiếm */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            placeholder="Tìm tên, mã bé, SĐT..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
          />
        </div>

        {/* Niên khóa */}
        <div>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30"
          >
            <option value="2026-2027">Niên khóa 2026-2027 (Hiện hành)</option>
            <option value="2027-2028">Niên khóa 2027-2028 (Kế hoạch)</option>
            <option value="2025-2026">Niên khóa 2025-2026 (Đã lưu trữ)</option>
          </select>
        </div>

        {/* Lớp học */}
        <div>
          <select
            value={selectedClassId}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30"
          >
            <option value="ALL">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Trạng thái */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang theo học (ACTIVE)</option>
            <option value="TRANSFERRED">Đã chuyển lớp (TRANSFERRED)</option>
            <option value="RESERVED">Đang bảo lưu (RESERVED)</option>
            <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
          </select>
        </div>

        {/* Lọc dị ứng */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl border border-slate-200 hover:bg-slate-50 w-full select-none">
            <input
              type="checkbox"
              checked={hasAllergyOnly}
              onChange={(e) => onToggleAllergy(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-rose-700">Chỉ bé có dị ứng</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalyticsToolbar;
