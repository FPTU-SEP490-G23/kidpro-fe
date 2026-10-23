import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Send,
  Building,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { TuitionSummaryDto } from '../../../types/finance.types';

export const TuitionSummaryTab: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<TuitionSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getTuitionSummary({
        month: selectedMonth,
        year: selectedYear,
      });
      setSummary((res as any)?.data || res || null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải bảng tổng hợp học phí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const handleSubmitForApproval = () => {
    showToast('success', 'Đã gửi thông báo yêu cầu Ban Giám hiệu phê duyệt bảng học phí toàn trường (UC-060).');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white transition-all transform animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Selector & Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase">Kỳ báo cáo:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>Năm {y}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSummary}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmitForApproval}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
          >
            <Send className="w-4 h-4" />
            Trình BGH Phê duyệt
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {summary && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between ${
            summary.status === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : summary.status === 'REJECTED'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {summary.status === 'APPROVED' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {summary.status === 'REJECTED' && <XCircle className="w-5 h-5 text-rose-600" />}
            {summary.status === 'DRAFT' && <Clock className="w-5 h-5 text-amber-600" />}
            <div>
              <p className="text-sm font-bold">
                Trạng thái thẩm định của Ban Giám hiệu:{' '}
                {summary.status === 'APPROVED' && 'ĐÃ PHÊ DUYỆT (Ký số hợp lệ)'}
                {summary.status === 'REJECTED' && 'BỊ TỪ CHỐI (Yêu cầu Kế toán chỉnh sửa)'}
                {summary.status === 'DRAFT' && 'DỰ THẢO (Đang chờ BGH ký duyệt)'}
              </p>
              {summary.rejectionReason && (
                <p className="text-xs mt-0.5 text-rose-700">Lý do từ chối: {summary.rejectionReason}</p>
              )}
            </div>
          </div>
          {summary.status === 'APPROVED' && (
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
              Sẵn sàng phát hành (G8-UC-07)
            </span>
          )}
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số trẻ</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.totalStudents} học sinh</p>
            <p className="text-xs text-slate-400 mt-1">Đang theo học toàn trường</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự thu gốc</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(summary.totalGrossAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">Biểu phí chuẩn</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khấu trừ & Miễn giảm</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">-{formatCurrency(summary.totalDiscountAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">Chính sách ưu đãi</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thực thu toàn trường</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalNetAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">Số liệu chính thức kỳ này</p>
          </div>
        </div>
      )}

      {/* Class Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Chi tiết Bảng Tổng hợp Học phí theo Từng Lớp Học (BR-038)
          </h3>
          <span className="text-xs text-slate-500">Khóa sổ dữ liệu khi BGH phê duyệt</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Lớp học</th>
                <th className="py-3.5 px-4">Khối lớp</th>
                <th className="py-3.5 px-4 text-center">Sĩ số tính phí</th>
                <th className="py-3.5 px-4">Tổng dự thu gốc</th>
                <th className="py-3.5 px-4">Tổng miễn giảm</th>
                <th className="py-3.5 px-4 text-right">Tổng thực thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tổng hợp số liệu...
                  </td>
                </tr>
              ) : !summary || !summary.classSummaries || summary.classSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có số liệu tổng hợp cho tháng {selectedMonth}/{selectedYear}. Vui lòng chạy tính học phí tại tab Lập bảng tính học phí.
                  </td>
                </tr>
              ) : (
                summary.classSummaries.map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <Building className="w-4 h-4 text-indigo-500" />
                      {cls.className}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{cls.gradeLevel || 'Mầm non'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">{cls.studentCount} trẻ</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{formatCurrency(cls.grossAmount)}</td>
                    <td className="py-3.5 px-4 font-medium text-amber-600">
                      {cls.discountAmount > 0 ? `-${formatCurrency(cls.discountAmount)}` : '0 đ'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(cls.netAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TuitionSummaryTab;
