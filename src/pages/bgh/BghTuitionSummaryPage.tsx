import React, { useState, useEffect } from 'react';
import {
  Calculator,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  DollarSign,
  Users,
  Building2,
  Lock,
} from 'lucide-react';
import tuitionSummaryApi, {
  TuitionSummaryDto,
  ClassTuitionSummaryDto,
} from '../../api/tuitionSummaryApi';

export const BghTuitionSummaryPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<TuitionSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await tuitionSummaryApi.getTuitionSummary({
        month: selectedMonth,
        year: selectedYear,
      });
      setSummary((res as any)?.data || res);
    } catch (err: any) {
      console.error('Lỗi khi tải bảng tổng hợp học phí:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      const res = await tuitionSummaryApi.approve(
        { month: selectedMonth, year: selectedYear },
        note
      );
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Bảng tổng hợp học phí tháng đã được phê duyệt thành công và khóa dữ liệu dự thu.',
      });
      setApproveModalOpen(false);
      setNote('');
      fetchSummary();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt bảng học phí.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-191: Ban Giám hiệu từ chối phê duyệt nhưng bỏ trống lý do yêu cầu chỉnh sửa.',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await tuitionSummaryApi.reject(
        { month: selectedMonth, year: selectedYear },
        rejectReason.trim()
      );
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã từ chối bảng học phí và chuyển yêu cầu chỉnh sửa về bộ phận Kế toán.',
      });
      setRejectModalOpen(false);
      setRejectReason('');
      fetchSummary();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi từ chối bảng học phí.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (amt?: number) => {
    if (!amt) return '0 ₫';
    return amt.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                [UC-060] Phê Duyệt Bảng Tổng Hợp Học Phí Toàn Trường
              </h1>
              <p className="text-sm text-slate-500">
                Thẩm tra số liệu dự thu, đối soát miễn giảm & hoàn trả tiền ăn, khóa sổ phát hành phiếu thu (BR-071, BR-072)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchSummary}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Alert toast */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Bar & Action Banner */}
      {summary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl ${
                summary.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : summary.status === 'REJECTED'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {summary.status === 'APPROVED' ? (
                <Lock className="w-6 h-6" />
              ) : summary.status === 'REJECTED' ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400">Trạng Thái Bảng Học Phí:</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    summary.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : summary.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {summary.status === 'APPROVED'
                    ? 'Đã Phê Duyệt & Khóa Sổ'
                    : summary.status === 'REJECTED'
                    ? 'Đã Từ Chối Phê Duyệt'
                    : 'Dự Thảo Chờ BGH Duyệt'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ thu học phí: Tháng {summary.billingMonth}/{summary.billingYear} • Toàn trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {summary.status !== 'APPROVED' ? (
              <>
                <button
                  onClick={() => setApproveModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40] transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  Ký Duyệt & Khóa Sổ Bảng Học Phí
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-rose-300 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Từ Chối & Yêu Cầu Sửa
                </button>
              </>
            ) : (
              <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-bold">
                <ShieldCheck className="w-4 h-4" />
                Dữ Liệu Đã Khóa (Chỉ Đọc - Read-only)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Học Sinh Toàn Trường</p>
              <p className="text-xl font-bold text-slate-800">
                {summary?.totalStudents || 0} Trẻ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Tiền Dự Thu (Gốc)</p>
              <p className="text-xl font-bold text-slate-800">
                {formatVND(summary?.totalGrossAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Miễn Giảm & Hoàn Trả Tiền Ăn</p>
              <p className="text-xl font-bold text-slate-800">
                {formatVND(summary?.totalDiscountAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#275A4E]/10 rounded-xl text-[#275A4E]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Số Tiền Thực Thu Dự Kiến</p>
              <p className="text-xl font-bold text-[#275A4E]">
                {formatVND(summary?.totalNetAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#275A4E]" />
            Chi Tiết Dự Thu Theo Từng Khối & Lớp Học
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            BR-072: Đối soát chính xác 100% giữa tổng hợp và chi tiết
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Tên Lớp Học</th>
                <th className="px-6 py-4">Khối Lớp</th>
                <th className="px-6 py-4">Sĩ Số</th>
                <th className="px-6 py-4">Tiền Dự Thu</th>
                <th className="px-6 py-4">Miễn Giảm & Hoàn Ăn</th>
                <th className="px-6 py-4">Thực Thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Đang tính toán số liệu học phí...
                  </td>
                </tr>
              ) : summary?.classSummaries?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Chưa có lớp học nào trong kỳ thu này
                  </td>
                </tr>
              ) : (
                summary?.classSummaries?.map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{cls.className}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {cls.gradeLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{cls.studentCount} trẻ</td>
                    <td className="px-6 py-4 text-slate-700 font-semibold">{formatVND(cls.grossAmount)}</td>
                    <td className="px-6 py-4 text-amber-600 font-medium">{formatVND(cls.discountAmount)}</td>
                    <td className="px-6 py-4 font-bold text-[#275A4E]">{formatVND(cls.netAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ký Duyệt */}
      {approveModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Xác Nhận Ký Duyệt Bảng Học Phí Tháng {selectedMonth}/{selectedYear}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định <strong>BR-071</strong>, sau khi Ban Giám hiệu ký duyệt, toàn bộ số liệu cơ sở sẽ được khóa sổ ở chế độ chỉ đọc và cho phép Kế toán phát hành thông báo thu tiền tới Phụ huynh.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Ghi chú chỉ đạo tài chính (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú cho bộ phận Kế toán..."
                rows={3}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
              >
                {submitting ? 'Đang duyệt...' : 'Đồng Ý Phê Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-700">
              Từ Chối Bảng Học Phí Tháng {selectedMonth}/{selectedYear}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định <strong>BR-071 & BR-072</strong>, trường hợp từ chối bắt buộc phải nhập lý do giải trình để Kế toán đối soát và cân đối lại.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Lý do từ chối & Hướng chỉ đạo điều chỉnh <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Sai lệch số liệu hoàn tiền ăn lớp Mầm 1; Chưa áp dụng chính sách giảm học phí cho con giáo viên..."
                rows={4}
                className="w-full text-sm p-3 border border-rose-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
              >
                {submitting ? 'Đang gửi...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghTuitionSummaryPage;
