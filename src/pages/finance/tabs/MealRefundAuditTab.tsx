import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  FileText,
  Building,
  X,
  AlertCircle
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import {
  MealRefundAuditRecord,
  MealRefundAuditSummary,
  AbsenceDetailItem
} from '../../../types/finance.types';

export const MealRefundAuditTab: React.FC = () => {
  const queryClient = useQueryClient();

  // State bộ lọc
  const [selectedPeriod, setSelectedPeriod] = useState<string>('10-2026');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // State Drawer chi tiết học sinh
  const [activeRecord, setActiveRecord] = useState<MealRefundAuditRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // State chỉnh sửa ngoại lệ thủ công
  const [selectedAbsenceDay, setSelectedAbsenceDay] = useState<AbsenceDetailItem | null>(null);
  const [manualReason, setManualReason] = useState<string>('');
  const [overrideEligibility, setOverrideEligibility] = useState<boolean>(true);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Tải dữ liệu kiểm toán từ Backend API (GET /api/finance/refunds/audit)
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['meal-refund-audit', selectedPeriod, selectedClassId, searchKeyword],
    queryFn: async () => {
      try {
        const res = await financeApi.getMealRefundAudit({
          billingPeriod: selectedPeriod,
          classId: selectedClassId === 'ALL' ? undefined : selectedClassId,
          keyword: searchKeyword.trim() || undefined,
        });
        return res.data;
      } catch {
        showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
        throw new Error('Network error');
      }
    },
  });

  const records: MealRefundAuditRecord[] = useMemo(() => (data?.records as MealRefundAuditRecord[]) || [], [data?.records]);
  const summary: MealRefundAuditSummary = useMemo(() => (data?.summary as MealRefundAuditSummary) || {
    billingPeriod: selectedPeriod,
    totalEligibleDays: 6,
    totalRefundAmount: 210000,
    totalAbsentStudents: 3,
    totalIneligibleDays: 3,
    campusWideClosureDays: 0,
  }, [data?.summary, selectedPeriod]);

  // Mutation cập nhật ngoại lệ thủ công
  const adjustMutation = useMutation({
    mutationFn: async ({
      studentId,
      absenceId,
      isEligible,
      reason,
    }: {
      studentId: string;
      absenceId: string;
      isEligible: boolean;
      reason: string;
    }) => {
      return financeApi.adjustMealRefundRecord(studentId, {
        absenceId,
        isEligible,
        reason,
      });
    },
    onSuccess: (_, variables) => {
      // Cập nhật lại state cục bộ của drawer
      if (activeRecord) {
        const updatedAbsences = activeRecord.absenceDetails.map((item) => {
          if (item.id === variables.absenceId) {
            return {
              ...item,
              status: variables.isEligible ? ('ELIGIBLE' as const) : ('LATE_SUBMISSION' as const),
              refundAmount: variables.isEligible ? activeRecord.dailyRefundRate : 0,
              manualOverride: true,
              overrideReason: variables.reason,
            };
          }
          return item;
        });

        const newEligibleDays = updatedAbsences.filter((d) => d.status === 'ELIGIBLE').length;
        const newTotalRefund = newEligibleDays * activeRecord.dailyRefundRate;

        const updatedRecord: MealRefundAuditRecord = {
          ...activeRecord,
          eligibleDays: newEligibleDays,
          ineligibleDays: updatedAbsences.length - newEligibleDays,
          totalRefundAmount: newTotalRefund,
          absenceDetails: updatedAbsences,
        };

        setActiveRecord(updatedRecord);
        showToast(
          'success',
          `MSG-149: Đã tính hoàn tiền ăn: ${newEligibleDays} ngày, tổng tiền: ${formatCurrency(newTotalRefund)}`
        );
      }

      setSelectedAbsenceDay(null);
      setManualReason('');
      queryClient.invalidateQueries({ queryKey: ['meal-refund-audit'] });
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    },
  });

  const handleOpenDetail = (record: MealRefundAuditRecord) => {
    setActiveRecord(record);
    setIsDetailOpen(true);
    setSelectedAbsenceDay(null);
    setManualReason('');
  };

  const handleApplyOverride = () => {
    if (!activeRecord || !selectedAbsenceDay) return;

    // Kiểm tra chéo: nếu trẻ thực tế có mặt (check-in camera cổng hoặc giáo viên chấm có mặt)
    if (selectedAbsenceDay.status === 'ATTENDED_DISQUALIFIED' && overrideEligibility) {
      showToast('error', 'MSG-151: Học sinh thực tế đã có mặt tại trường; hủy bỏ thao tác hoàn trả tiền ăn.');
      return;
    }

    if (!manualReason.trim()) {
      showToast('warning', 'Vui lòng nhập lý do giải trình phê duyệt ngoại lệ.');
      return;
    }

    adjustMutation.mutate({
      studentId: activeRecord.studentId,
      absenceId: selectedAbsenceDay.id,
      isEligible: overrideEligibility,
      reason: manualReason,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border shadow-md animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-[#DC2626]'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <ShieldAlert className="h-5 w-5 shrink-0 text-[#DC2626]" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER PHÂN HỆ UC-036 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#78C2AD]/15 text-[#1E4D40]">
            <UtensilsCrossed className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>UC-036 • Phân Hệ Kiểm Toán Tiền Ăn Bán Trú</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Kiểm Toán & Đối Soát Hoàn Tiền Ăn Nghỉ Phép
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Tự động bóc tách đơn xin nghỉ nộp trước <strong>08:30:00 AM</strong>, đối chiếu chéo camera cổng và sổ báo bếp
            để khấu trừ chính xác vào kỳ hóa đơn tiếp theo (BR-029, BR-054).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Đối soát lại</span>
          </button>
        </div>
      </div>

      {/* THẺ TỔNG KẾT TOÀN TRƯỜNG */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Số ngày hợp lệ</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#1E4D40]">
              {summary.totalEligibleDays} <span className="text-sm font-semibold text-slate-500">ngày</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Nộp trước 08:30 AM</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#275A4E]/20 bg-gradient-to-br from-white to-[#275A4E]/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#275A4E]">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng tiền hoàn trả</span>
            <div className="h-8 w-8 rounded-xl bg-[#275A4E]/10 text-[#275A4E] flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#275A4E]">
              {formatCurrency(summary.totalRefundAmount)}
            </div>
            <p className="text-[11px] text-[#275A4E]/80 mt-0.5">Đơn giá định mức 35.000₫/ngày</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Học sinh được hoàn</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {summary.totalAbsentStudents} <span className="text-sm font-semibold text-slate-500">bé</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Phát sinh vắng có phép</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Không đủ điều kiện</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-800">
              {summary.totalIneligibleDays} <span className="text-sm font-semibold text-slate-500">ngày</span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Nộp sau 08:30 hoặc không phép</p>
          </div>
        </div>
      </div>

      {/* THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC KỲ */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Chọn Kỳ Tháng */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Kỳ đối soát:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-[#1E4D40] outline-hidden cursor-pointer"
            >
              <option value="10-2026">Tháng 10/2026</option>
              <option value="09-2026">Tháng 09/2026</option>
              <option value="08-2026">Tháng 08/2026</option>
            </select>
          </div>

          {/* Lọc theo Lớp */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <span className="text-xs font-bold text-slate-600">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="ALL">Toàn Trường (Tất cả các lớp)</option>
              <option value="CLASS-001">Mầm 1 (3-4 Tuổi)</option>
              <option value="CLASS-002">Chồi 2 (4-5 Tuổi)</option>
              <option value="CLASS-003">Lá 1 (5-6 Tuổi)</option>
            </select>
          </div>
        </div>

        {/* Ô Tìm Kiếm Học Sinh */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé hoặc mã..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#275A4E] focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* BẢNG KIỂM TOÁN HOÀN TIỀN ĂN TỪNG HỌC SINH */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Bảng Danh Sách Học Sinh Vắng & Chi Tiết Khấu Trừ Tiền Ăn
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Hiển thị {records.length} hồ sơ đối soát
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#275A4E] animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Đang đối soát dữ liệu điểm danh, báo bếp và đơn nghỉ phép...
            </p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <UtensilsCrossed className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">Không tìm thấy dữ liệu hoàn tiền ăn cho kỳ này</p>
            <p className="text-xs text-slate-400">Tất cả các bé đi học đầy đủ hoặc chưa phát sinh đơn nghỉ phép.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Mã Bé</th>
                  <th className="py-3.5 px-4">Họ & Tên Trẻ</th>
                  <th className="py-3.5 px-4">Lớp Học</th>
                  <th className="py-3.5 px-4 text-center">Tổng Vắng</th>
                  <th className="py-3.5 px-4 text-center">Đủ ĐK (Trước 08:30)</th>
                  <th className="py-3.5 px-4 text-center">Không Đủ ĐK</th>
                  <th className="py-3.5 px-4 text-right">Đơn Giá Hoàn</th>
                  <th className="py-3.5 px-4 text-right">Tổng Tiền Hoàn</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {records.map((r: MealRefundAuditRecord) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {r.studentCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#1E4D40] block">{r.studentName}</span>
                      <span className="text-[11px] text-slate-400">ID: {r.studentId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {r.className}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {r.totalAbsentDays} ngày
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        {r.eligibleDays} ngày
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.ineligibleDays > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          {r.ineligibleDays} ngày
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600">
                      {formatCurrency(r.dailyRefundRate)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-lg text-[#275A4E]">
                      {formatCurrency(r.totalRefundAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.auditStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/40">
                          Đã Đối Soát
                        </span>
                      )}
                      {r.auditStatus === 'FLAGGED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-red-50 text-[#DC2626] border border-red-200">
                          <AlertTriangle className="h-3 w-3" />
                          Cần Kiểm Tra
                        </span>
                      )}
                      {r.auditStatus === 'PENDING_REVIEW' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ Duyệt
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(r)}
                        className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-[#275A4E] text-slate-700 hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER / MODAL CHI TIẾT LỊCH TRÌNH NGHỈ CỦA HỌC SINH */}
      {isDetailOpen && activeRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-[#78C2AD] text-xs font-bold uppercase tracking-wider mb-1">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>Đối Soát Chi Tiết Nghỉ Phép & Hoàn Tiền Ăn</span>
                </div>
                <h3 className="text-xl font-black">
                  {activeRecord.studentName} ({activeRecord.studentCode})
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Lớp: {activeRecord.className} • Kỳ đối soát: {activeRecord.billingPeriod}
                </p>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nội dung danh sách từng ngày vắng */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Thẻ tóm tắt tính toán */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <span>Tổng ngày nghỉ: <strong className="text-slate-900">{activeRecord.totalAbsentDays}</strong></span>
                  <span>Đủ điều kiện: <strong className="text-emerald-700">{activeRecord.eligibleDays}</strong></span>
                  <span>Nộp muộn/Không phép: <strong className="text-amber-700">{activeRecord.ineligibleDays}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Số tiền trừ vào kỳ tiếp theo:</span>
                  <span className="text-lg font-black text-[#275A4E]">
                    {formatCurrency(activeRecord.totalRefundAmount)}
                  </span>
                </div>
              </div>

              {/* Danh sách ngày vắng chi tiết */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Nhật Ký Từng Ngày Vắng & Mốc Thời Gian Nộp Đơn
                </h4>

                {activeRecord.absenceDetails.map((day) => (
                  <div
                    key={day.id}
                    className={`p-4 rounded-2xl border transition ${
                      day.status === 'ELIGIBLE'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : day.status === 'ATTENDED_DISQUALIFIED'
                        ? 'border-red-200 bg-red-50/40'
                        : 'border-amber-200 bg-amber-50/30'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                            day.status === 'ELIGIBLE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : day.status === 'ATTENDED_DISQUALIFIED'
                              ? 'bg-red-100 text-[#DC2626]'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {day.status === 'ELIGIBLE' && <CheckCircle2 className="h-5 w-5" />}
                          {day.status === 'ATTENDED_DISQUALIFIED' && <AlertTriangle className="h-5 w-5" />}
                          {day.status === 'LATE_SUBMISSION' && <Clock className="h-5 w-5" />}
                        </div>

                        <div>
                          <div className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                            <span>Ngày {day.date}</span>
                            {day.manualOverride && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                                Đã điều chỉnh tay
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            {day.leaveRequestTime ? (
                              <span>Nộp đơn lúc: <strong>{day.leaveRequestTime}</strong></span>
                            ) : (
                              <span className="text-red-500 font-semibold">Không nộp đơn qua App</span>
                            )}
                            <span>•</span>
                            <span>Camera Cổng: {day.gateCameraVerified ? 'Không xuất hiện (Hợp lệ)' : 'Phát hiện có mặt'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        <div className="text-right">
                          <span
                            className={`text-xs font-black block ${
                              day.status === 'ELIGIBLE' ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {day.status === 'ELIGIBLE' ? `+ ${formatCurrency(day.refundAmount)}` : '0 VNĐ'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {day.status === 'ELIGIBLE'
                              ? 'Đủ điều kiện hoàn'
                              : day.status === 'ATTENDED_DISQUALIFIED'
                              ? 'Có mặt tại trường'
                              : 'Nộp sau 08:30'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedAbsenceDay(day);
                            setOverrideEligibility(day.status !== 'ELIGIBLE');
                            setManualReason(day.overrideReason || '');
                          }}
                          className="h-8 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs"
                        >
                          Sửa
                        </button>
                      </div>
                    </div>

                    {/* Lý do điều chỉnh trước đó nếu có */}
                    {day.overrideReason && (
                      <div className="mt-2 text-xs text-purple-800 bg-purple-50 p-2 rounded-xl flex items-start gap-1.5 border border-purple-100">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-purple-600" />
                        <span><strong>Ghi chú ngoại lệ:</strong> {day.overrideReason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* KHUNG ĐIỀU CHỈNH NGOẠI LỆ THỦ CÔNG KHI CHỌN 1 NGÀY */}
              {selectedAbsenceDay && (
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <span>Phê Duyệt Ngoại Lệ Thủ Công (Ngày {selectedAbsenceDay.date})</span>
                    </h5>
                    <button
                      onClick={() => setSelectedAbsenceDay(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Trạng thái áp dụng:</label>
                      <select
                        value={overrideEligibility ? 'ELIGIBLE' : 'INELIGIBLE'}
                        onChange={(e) => setOverrideEligibility(e.target.value === 'ELIGIBLE')}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                      >
                        <option value="ELIGIBLE">Chấp thuận hoàn tiền (Đủ điều kiện 35.000₫)</option>
                        <option value="INELIGIBLE">Từ chối hoàn tiền (Nộp muộn / Không hợp lệ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Lý do giải trình (Bắt buộc):
                      </label>
                      <input
                        type="text"
                        placeholder="Vd: Phụ huynh nộp giấy tại văn phòng trước 08:00..."
                        value={manualReason}
                        onChange={(e) => setManualReason(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={handleApplyOverride}
                      disabled={adjustMutation.isPending}
                      className="h-9 px-4 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                    >
                      {adjustMutation.isPending ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      <span>Lưu Điều Chỉnh & Tính Lại</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Dữ liệu được lưu trữ bất biến phục vụ kiểm toán quyết toán học phí.
              </span>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealRefundAuditTab;
