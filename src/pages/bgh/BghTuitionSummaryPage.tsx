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
  Send,
  AlertCircle,
  Info,
  Undo2,
} from 'lucide-react';
import tuitionSummaryApi, {
  TuitionSummaryDto,
  ClassTuitionSummaryDto,
} from '../../api/tuitionSummaryApi';
import { formatGradeLevel } from '../../utils/formatters';

export const BghTuitionSummaryPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [summary, setSummary] = useState<TuitionSummaryDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [revokeModalOpen, setRevokeModalOpen] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [revokeReason, setRevokeReason] = useState<string>('');
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

  // Kiểm tra điều kiện dữ liệu
  const hasData = Boolean(
    summary &&
    summary.classSummaries &&
    summary.classSummaries.length > 0 &&
    (summary.totalStudents || 0) > 0
  );
  const isApproved = summary?.status === 'APPROVED';
  const isSubmitted = summary?.status === 'SUBMITTED';
  const isRejected = summary?.status === 'REJECTED';
  const isDraft = !summary || summary?.status === 'DRAFT' || summary?.status === 'NOT_INITIALIZED';

  const handleApprove = async () => {
    if (!hasData) {
      setAlertInfo({
        type: 'error',
        message: `Kỳ ${selectedMonth}/${selectedYear} chưa có số liệu học phí do Kế toán lập. Không thể phê duyệt.`,
      });
      setApproveModalOpen(false);
      return;
    }

    if (!isSubmitted) {
      setAlertInfo({
        type: 'error',
        message: `Bảng tính học phí tháng ${selectedMonth}/${selectedYear} chưa được bộ phận Kế toán gửi trình. Không thể phê duyệt.`,
      });
      setApproveModalOpen(false);
      return;
    }

    try {
      setSubmitting(true);
      const res = await tuitionSummaryApi.approve(
        { month: selectedMonth, year: selectedYear },
        note
      );
      setAlertInfo({
        type: 'success',
        message:
          (res as any)?.message ||
          (res as any)?.data?.message ||
          'Bảng tổng hợp học phí tháng đã được phê duyệt thành công và khóa dữ liệu dự thu.',
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
        message:
          (res as any)?.message ||
          (res as any)?.data?.message ||
          'Đã từ chối bảng học phí và chuyển yêu cầu chỉnh sửa về bộ phận Kế toán.',
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

  const handleRevokeApproval = async () => {
    if (!revokeReason.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'Vui lòng nhập lý do thu hồi phê duyệt để chuyển giao bộ phận Kế toán xử lý.',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await tuitionSummaryApi.revokeApproval(
        { month: selectedMonth, year: selectedYear },
        revokeReason.trim()
      );
      setAlertInfo({
        type: 'success',
        message:
          (res as any)?.message ||
          (res as any)?.data?.message ||
          'Đã thu hồi phê duyệt thành công. Bảng học phí đã được mở khóa và chuyển về trạng thái Dự thảo.',
      });
      setRevokeModalOpen(false);
      setRevokeReason('');
      fetchSummary();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi thu hồi phê duyệt bảng học phí.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatVND = (amt?: number) => {
    if (!amt) return '0 đ';
    return amt.toLocaleString('vi-VN') + ' đ';
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#275A4E]' : ''}`} />
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
                isApproved
                  ? 'bg-emerald-100 text-emerald-800'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800'
                  : isSubmitted
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isApproved ? (
                <Lock className="w-6 h-6" />
              ) : isRejected ? (
                <XCircle className="w-6 h-6" />
              ) : isSubmitted ? (
                <Send className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400">Trạng Thái Bảng Học Phí:</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : isRejected
                      ? 'bg-rose-100 text-rose-800'
                      : isSubmitted
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isApproved
                    ? 'Đã Phê Duyệt & Khóa Sổ'
                    : isRejected
                    ? 'Đã Từ Chối Phê Duyệt'
                    : isSubmitted
                    ? 'Đã Được Kế Toán Trình Duyệt'
                    : !hasData
                    ? 'Chưa Khởi Tạo Học Phí'
                    : 'Dự Thảo (Kế toán chưa gửi trình)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ thu học phí: Tháng {summary.billingMonth}/{summary.billingYear} • Toàn trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isApproved ? (
              <>
                <button
                  onClick={() => setApproveModalOpen(true)}
                  disabled={!hasData || !isSubmitted || submitting}
                  title={
                    !hasData
                      ? 'Kỳ này chưa có dữ liệu học phí do Kế toán lập'
                      : !isSubmitted
                      ? 'Kế toán chưa gửi trình bảng tổng hợp học phí. Cần Kế toán trình trước khi duyệt.'
                      : 'Ký Duyệt & Khóa Sổ Bảng Học Phí'
                  }
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm ${
                    !hasData || !isSubmitted || submitting
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                      : 'bg-[#275A4E] text-white hover:bg-[#1E4D40]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Ký Duyệt & Khóa Sổ Bảng Học Phí
                </button>
                <button
                  onClick={() => setRejectModalOpen(true)}
                  disabled={!hasData || !isSubmitted || submitting}
                  title={
                    !hasData
                      ? 'Kỳ này chưa có dữ liệu học phí để từ chối'
                      : !isSubmitted
                      ? 'Kế toán chưa gửi trình bảng tổng hợp học phí'
                      : 'Từ Chối & Yêu Cầu Sửa'
                  }
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    !hasData || !isSubmitted || submitting
                      ? 'border border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Từ Chối & Yêu Cầu Sửa
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  Dữ Liệu Đã Khóa (Chỉ đọc - Read-only)
                </span>
                <button
                  onClick={() => setRevokeModalOpen(true)}
                  disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                  title="Thu hồi quyết định phê duyệt để mở khóa cho bộ phận Kế toán điều chỉnh sai sót"
                >
                  <Undo2 className="w-4 h-4" />
                  Thu Hồi Phê Duyệt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thông báo hướng dẫn nghiệp vụ */}
      {!hasData && !loading && (
        <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Kỳ học phí Tháng {selectedMonth}/{selectedYear} chưa được Kế toán khởi tạo</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Hệ thống không tự ý tính toán hay phê duyệt khi chưa có hóa đơn được Kế toán tạo ở màn hình <strong>[G8-UC-04] Lập Bảng tính Học phí</strong>. Ban Giám hiệu chưa thể thao tác Ký duyệt hoặc Từ chối kỳ này.
            </p>
          </div>
        </div>
      )}

      {hasData && !isSubmitted && !isApproved && (
        <div className="p-4 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-start gap-3 text-blue-900 text-sm">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Bảng học phí đang ở trạng thái Dự thảo (Kế toán chưa gửi trình)</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Số liệu dự thu đã được tạo nhưng bộ phận Kế toán chưa nhấn <strong>"Trình BGH Phê duyệt"</strong> tại [G8-UC-06]. Để đảm bảo quy trình kiểm soát nội bộ (BR-071), Ban Giám hiệu chỉ phê duyệt sau khi Kế toán đã rà soát và chính thức gửi trình.
            </p>
          </div>
        </div>
      )}

      {hasData && isSubmitted && (
        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Bảng học phí đã được Kế toán gửi trình và sẵn sàng phê duyệt</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Kính mời Ban Giám hiệu kiểm tra tổng dự thu, các khoản miễn giảm và bấm <strong>"Ký Duyệt & Khóa Sổ Bảng Học Phí"</strong> để mở phát hành thông báo thu tiền học phí tới phụ huynh (G8-UC-07).
            </p>
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Miễn Giảm / Ưu Đãi</p>
              <p className="text-xl font-bold text-amber-600">
                -{formatVND(summary?.totalDiscountAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-800">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Thực Thu Dự Kiến</p>
              <p className="text-xl font-bold text-[#275A4E]">
                {formatVND(summary?.totalNetAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class breakdown */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-bold text-slate-800">
              Chi Tiết Bảng Tổng Hợp Học Phí Theo Từng Lớp Học
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Dữ liệu tổng hợp từ các khoản thu & miễn giảm chuẩn (BR-038)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Tên Lớp Học</th>
                <th className="px-6 py-4">Khối Lớp</th>
                <th className="px-6 py-4 text-center">Sĩ Số Tính Phí</th>
                <th className="px-6 py-4">Dự Thu Gốc</th>
                <th className="px-6 py-4">Miễn Giảm</th>
                <th className="px-6 py-4">Thực Thu Dự Kiến</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#275A4E]" />
                    Đang tải dữ liệu tổng hợp...
                  </td>
                </tr>
              ) : !summary?.classSummaries || summary.classSummaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Kỳ học phí Tháng {selectedMonth}/{selectedYear} chưa có số liệu tổng hợp. Bộ phận Kế toán cần tạo bảng tính tại [G8-UC-04] trước.
                  </td>
                </tr>
              ) : (
                summary.classSummaries.map((cls) => (
                  <tr key={cls.classId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{cls.className}</td>
                    <td className="px-6 py-4 text-slate-500">{formatGradeLevel(cls.gradeLevel)}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700">{cls.studentCount} trẻ</td>
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

      {/* Modal Thu Hồi Phê Duyệt */}
      {revokeModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
              <Undo2 className="w-5 h-5 text-amber-600" />
              Thu Hồi Phê Duyệt Bảng Học Phí Tháng {selectedMonth}/{selectedYear}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Khi thu hồi phê duyệt, bảng tổng hợp học phí sẽ được mở khóa và chuyển về trạng thái <strong>Dự thảo</strong> để bộ phận Kế toán điều chỉnh các sai sót phát sinh. Các phiếu báo học phí chưa thu tiền sẽ tạm thời khóa phát hành lại.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Lý do thu hồi & Hướng chỉ đạo điều chỉnh <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Ví dụ: Cần điều chỉnh lại tiền ăn lớp Mầm A1 do nghỉ ốm; Bổ sung miễn giảm cho học sinh chính sách..."
                rows={4}
                className="w-full text-sm p-3 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRevokeModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleRevokeApproval}
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700"
              >
                {submitting ? 'Đang xử lý...' : 'Xác Nhận Thu Hồi Phê Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghTuitionSummaryPage;
