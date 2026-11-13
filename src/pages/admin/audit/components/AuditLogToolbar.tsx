import React from 'react';
import { Filter, Search, Download, ShieldAlert, Calendar } from 'lucide-react';
import { AuditLogFilter } from '../../../../types/auditLog.types';

interface AuditLogToolbarProps {
  filter: AuditLogFilter;
  onFilterChange: (newFilter: AuditLogFilter) => void;
  onOpenExportModal: () => void;
  isDateOver90Days?: boolean;
}

export const AuditLogToolbar: React.FC<AuditLogToolbarProps> = ({
  filter,
  onFilterChange,
  onOpenExportModal,
  isDateOver90Days,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
              Immutable Security Audit Trail
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">Core Schema Audit Logging</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1">
            Tra Cứu Nhật Ký An Ninh & Kiểm Toán Hệ Thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi chuỗi thay đổi dữ liệu bất biến (Immutable Hash-chain), hành vi tài khoản, IP truy cập và lịch sử biến động dữ liệu
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenExportModal}
          className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-2xs self-start md:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#78C2AD]" />
          <span>Xuất Nhật Ký An Ninh (Re-auth)</span>
        </button>
      </div>

      {/* Cảnh báo vùng nóng > 90 ngày */}
      {isDateOver90Days && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E5A93C] shrink-0" />
          <span className="font-semibold">
            Khoảng ngày tra cứu vượt quá 90 ngày (phân vùng nóng). Vui lòng kết nối kho lưu trữ trữ lạnh để trích xuất dữ liệu cũ hơn.
          </span>
        </div>
      )}

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
        {/* Tìm kiếm */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filter.keyword || ''}
            onChange={(e) => onFilterChange({ ...filter, keyword: e.target.value })}
            placeholder="Tìm người, IP, Record ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
          />
        </div>

        {/* Bảng tác động (table_name) */}
        <div>
          <select
            value={filter.tableName || 'ALL'}
            onChange={(e) => onFilterChange({ ...filter, tableName: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30"
          >
            <option value="ALL">Tất cả bảng tác động</option>
            <option value="core.tenants">core.tenants (Cơ sở trường)</option>
            <option value="core.users">core.users (Tài khoản)</option>
            <option value="academic.students">academic.students (Học sinh)</option>
            <option value="academic.timetables">academic.timetables (Thời khóa biểu)</option>
            <option value="attendance.face_logs">attendance.face_logs (Camera Cổng)</option>
            <option value="finance.invoices">finance.invoices (Hóa đơn)</option>
          </select>
        </div>

        {/* Loại hành động (action) */}
        <div>
          <select
            value={filter.action || 'ALL'}
            onChange={(e) => onFilterChange({ ...filter, action: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="CREATE">CREATE (Thêm mới)</option>
            <option value="UPDATE">UPDATE (Cập nhật)</option>
            <option value="DELETE">DELETE (Xóa)</option>
            <option value="LOGIN">LOGIN (Đăng nhập)</option>
            <option value="VERIFY">VERIFY (Xác minh)</option>
          </select>
        </div>

        {/* Từ ngày */}
        <div>
          <input
            type="date"
            value={filter.fromDate || ''}
            onChange={(e) => onFilterChange({ ...filter, fromDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 cursor-pointer"
            title="Từ ngày"
          />
        </div>

        {/* Đến ngày */}
        <div>
          <input
            type="date"
            value={filter.toDate || ''}
            onChange={(e) => onFilterChange({ ...filter, toDate: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 cursor-pointer"
            title="Đến ngày"
          />
        </div>
      </div>
    </div>
  );
};

export default AuditLogToolbar;
