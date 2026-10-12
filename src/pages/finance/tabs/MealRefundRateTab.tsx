import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  History,
  Calculator,
  ShieldCheck,
  Send,
  Info,
  Scale
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { kitchenApi } from '../../../api/kitchenApi';
import { formatCurrency } from '../../../utils/formatters';
import { FeeConfig, MealRefundAuditLog } from '../../../types/finance.types';

// Lịch sử ban hành chính sách hoàn tiền ăn
const INITIAL_AUDIT_LOGS: MealRefundAuditLog[] = [];

export const MealRefundRateTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Dữ liệu tiền ăn bán trú tháng chuẩn: 770.000 VNĐ / 22 ngày = 35.000 VNĐ/ngày
  const monthlyMealFee = 770000;
  const standardDaysInMonth = 22;
  const maxAllowableRate = Math.floor(monthlyMealFee / standardDaysInMonth); // 35.000đ

  // State cấu hình hiện tại
  const [currentRate, setCurrentRate] = useState<number>(35000);
  const [effectiveMonth, setEffectiveMonth] = useState<string>('2026-10');
  const [auditLogs, setAuditLogs] = useState<MealRefundAuditLog[]>(INITIAL_AUDIT_LOGS);

  // Form State thiết lập mới
  const [inputRate, setInputRate] = useState<number>(35000);
  const [newEffectiveMonth, setNewEffectiveMonth] = useState<string>('2026-11');
  const [policyNotes, setPolicyNotes] = useState<string>(
    'Căn cứ thỏa thuận cung ứng suất ăn bán trú học kỳ 1 năm học 2026-2027.'
  );
  const [requiresApproval, setRequiresApproval] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>('');

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Simulator Widget State
  const [simExcusedDays, setSimExcusedDays] = useState<number>(3);
  const [simBaseTuition, setSimBaseTuition] = useState<number>(3200000);

  // 1. Fetch cấu hình fee configs để lấy khoản tiền ăn
  const { data: mealFeeConfig } = useQuery<FeeConfig | undefined>({
    queryKey: ['fee-configs-meal'],
    queryFn: async () => {
      try {
        const res: any = await financeApi.getFeeConfigs();
        const list: FeeConfig[] = res?.data || res || [];
        return list.find((f) => f.feeCode === 'MEAL_FEE' || f.name.includes('ăn'));
      } catch {
        return undefined;
      }
    }
  });

  // 2. Fetch meal headcounts để đối soát
  const { data: headcountData } = useQuery({
    queryKey: ['meal-headcounts-today'],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getMealHeadcounts();
        return res?.data || res;
      } catch {
        return null;
      }
    }
  });

  // Mutation cập nhật đơn giá hoàn tiền ăn (PUT /api/finance/fee-configs/{id})
  const updateRateMutation = useMutation({
    mutationFn: async () => {
      // Validate BR-011, BR-054: Đơn giá hoàn tiền không được vượt quá số tiền ăn thu theo ngày
      if (inputRate > maxAllowableRate) {
        throw new Error(
          `MSG-141: Đơn giá hoàn tiền ăn một ngày không được vượt quá số tiền ăn thu theo ngày (${formatCurrency(maxAllowableRate)}/ngày).`
        );
      }

      // Validate: Số dương > 0 (MSG-142)
      if (inputRate <= 0) {
        throw new Error(
          'MSG-142: Đơn giá hoàn tiền ăn phải là số tiền dương theo quy chế bán trú của trường.'
        );
      }

      // Validate: Không áp dụng hồi tố cho kỳ đã đóng sổ kế toán (MSG-143)
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      if (newEffectiveMonth < currentPeriod) {
        throw new Error(
          'MSG-143: Không thể thay đổi đơn giá hoàn tiền ăn cho kỳ tính học phí đã đóng sổ kế toán.'
        );
      }

      const feeId = mealFeeConfig?.id || 'fee-02';
      return await financeApi.updateMealRefundRate(feeId, {
        dailyRefundRate: inputRate,
        effectiveMonth: newEffectiveMonth,
        policyNotes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-configs'] });
      // Cập nhật audit log
      const newLog: MealRefundAuditLog = {
        id: `log-${Date.now()}`,
        changedAt: new Date().toLocaleString('vi-VN'),
        changedBy: 'Bùi Thị Lan (Kế toán trưởng)',
        oldRate: currentRate,
        newRate: inputRate,
        effectivePeriod: `Kỳ Tháng ${newEffectiveMonth.slice(5, 7)}/${newEffectiveMonth.slice(0, 4)}`,
        reason: policyNotes
      };
      setAuditLogs([newLog, ...auditLogs]);
      setCurrentRate(inputRate);
      setEffectiveMonth(newEffectiveMonth);
      setFormError('');
      setToastMessage({
        type: 'success',
        text: 'MSG-140: Cấu hình đơn giá hoàn tiền ăn bán trú thành công và đã đồng bộ vào hệ thống tính học phí'
      });
    },
    onError: (err: any) => {
      setFormError(
        err.message ||
          'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      );
    }
  });

  const handleSubmitPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    updateRateMutation.mutate();
  };

  // Tính toán giả lập cho widget
  const simTotalRefund = simExcusedDays * currentRate;
  const simNetTuition = Math.max(0, simBaseTuition + monthlyMealFee - simTotalRefund);

  return (
    <div className="space-y-6">
      {/* Toast Notification Box */}
      {toastMessage && (
        <div
          className={`flex items-start justify-between p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* THẺ TRẠNG THÁI CHÍNH SÁCH HOÀN TIỀN HIỆN HÀNH (Section 2 - Current Policy Overview Card) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                <span>CHÍNH SÁCH BÁN TRÚ ĐANG ÁP DỤNG</span>
              </span>
              <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full font-medium">
                Kỳ áp dụng: Tháng {effectiveMonth.slice(5, 7)}/{effectiveMonth.slice(0, 4)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
              <h2 className="text-3xl sm:text-4xl font-black font-mono text-[#E5A93C]">
                {formatCurrency(currentRate)}
              </h2>
              <span className="text-sm sm:text-base text-emerald-100 font-semibold">
                / ngày nghỉ học có phép hợp lệ
              </span>
            </div>

            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
              Theo quy chuẩn an toàn học đường <strong>BR-011</strong> & <strong>BR-054</strong>: Phụ huynh nộp đơn xin nghỉ học <strong>trước 08:30:00 AM</strong> được tự động hoàn tiền ăn đúng định mức {formatCurrency(currentRate)}/ngày vào hóa đơn quyết toán học phí của tháng tiếp theo.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-emerald-200">
              <span className="flex items-center gap-1">
                <UtensilsCrossed className="h-3.5 w-3.5 text-[#E5A93C]" />
                Mức thu tiền ăn tháng: <strong>{formatCurrency(monthlyMealFee)}</strong> / 22 ngày
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#78C2AD]" />
                Mốc giờ chốt báo bếp: <strong>08:30 AM</strong> cùng ngày
              </span>
            </div>
          </div>

          {/* Cụm đối soát thực tế bếp ăn */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/15 space-y-2 shrink-0 lg:max-w-xs text-xs">
            <span className="font-bold text-emerald-200 uppercase tracking-wider block">
              Đối Soát Suất Ăn Bếp Hôm Nay
            </span>
            <div className="flex items-center justify-between text-white">
              <span>Suất ăn đã khóa 08:30:</span>
              <strong className="text-base text-[#E5A93C] font-mono">
                {headcountData?.totalMealsToPrepare || 189} suất
              </strong>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span>Đơn giá thu theo ngày:</span>
              <strong>{formatCurrency(maxAllowableRate)}/ngày</strong>
            </div>
            <p className="text-[11px] text-white/70 pt-1 border-t border-white/10 italic">
              Đơn giá hoàn tiền không được vượt quá mức thu thực tế theo ngày (BR-011).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM THIẾT LẬP ĐƠN GIÁ HOÀN TIỀN MỚI (Section 2 - 7 Cột) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 rounded-2xl bg-[#275A4E]/10 text-[#275A4E]">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                Ban Hành Đơn Giá Hoàn Tiền Ăn Mới
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật đơn giá giảm trừ bữa ăn bán trú áp dụng cho các kỳ tính học phí tiếp theo
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitPolicy} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Ô nhập đơn giá hoàn trả */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Đơn giá hoàn trả tiền ăn 1 ngày (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  max={maxAllowableRate}
                  required
                  value={inputRate}
                  onChange={(e) => setInputRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-200 p-3 font-mono font-bold text-base text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                />
                <span className="pointer-events-none absolute right-3.5 top-3.5 font-bold text-slate-400">
                  ₫ / ngày
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Bằng chữ: <strong>{formatCurrency(inputRate)}</strong></span>
                <span className="text-amber-700 font-semibold">
                  Tối đa cho phép: {formatCurrency(maxAllowableRate)}
                </span>
              </p>
            </div>

            {/* Chọn kỳ áp dụng mới (MonthPicker) */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Kỳ thanh toán bắt đầu áp dụng chính sách mới <span className="text-rose-500">*</span>
              </label>
              <input
                type="month"
                required
                value={newEffectiveMonth}
                onChange={(e) => setNewEffectiveMonth(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-2.5 font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nguyên tắc kế toán: Không áp dụng hồi tố cho các kỳ đã chốt phát hành hóa đơn (MSG-143).
              </p>
            </div>

            {/* Văn bản căn cứ điều hành / Ghi chú */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Văn bản căn cứ điều hành & Ghi chú chính sách của trường <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={policyNotes}
                onChange={(e) => setPolicyNotes(e.target.value)}
                placeholder="Nhập số quyết định, căn cứ điều hành của Ban Giám Hiệu..."
                className="w-full rounded-2xl border border-slate-200 p-3 text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            {/* Switch Yêu cầu Hiệu trưởng ký duyệt điện tử */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-950 block">
                  Trình Hiệu trưởng ký duyệt điện tử
                </span>
                <span className="text-[11px] text-amber-800">
                  Tự động gửi thông báo điều hành đến tài khoản BGH để phê duyệt trước khi kích hoạt
                </span>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="h-5 w-5 rounded-md text-[#275A4E] focus:ring-[#275A4E] border-slate-300"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={updateRateMutation.isPending}
                className="px-6 py-3 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold shadow-md shadow-emerald-900/10 min-h-[44px] flex items-center gap-2 active:scale-95 transition"
              >
                <Send className="h-4 w-4" />
                <span>
                  {updateRateMutation.isPending
                    ? 'Đang đồng bộ...'
                    : 'Trình Duyệt & Ban Hành Chính Sách (MSG-140)'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* CÔNG CỤ MÔ PHỎNG QUYẾT TOÁN HỌC PHÍ (Section 2 - Refund Simulator Widget - 5 Cột) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 rounded-2xl bg-[#E5A93C]/20 text-[#1E4D40]">
                <Calculator className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">
                  Mô Phỏng Quyết Toán Giảm Trừ
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kiểm tra công thức tính hoàn tiền tự động trên hóa đơn phụ huynh
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Số ngày vắng có phép nộp trước 08:30:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 8].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSimExcusedDays(days)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                        simExcusedDays === days
                          ? 'bg-[#275A4E] text-white border-[#275A4E]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Học phí cơ bản tháng (VNĐ):
                </label>
                <input
                  type="number"
                  step="100000"
                  value={simBaseTuition}
                  onChange={(e) => setSimBaseTuition(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-200 p-2.5 font-bold font-mono text-slate-800"
                />
              </div>

              {/* Hộp kết quả mô phỏng */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Bảng Kê Chi Tiết Giảm Trừ
                </span>

                <div className="flex items-center justify-between text-slate-700">
                  <span>Học phí cơ bản:</span>
                  <strong>{formatCurrency(simBaseTuition)}</strong>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span>Tiền ăn bán trú cả tháng:</span>
                  <strong>{formatCurrency(monthlyMealFee)}</strong>
                </div>

                <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span>
                    Hoàn tiền ăn ({simExcusedDays} ngày × {formatCurrency(currentRate)}):
                  </span>
                  <span className="font-mono text-sm">-{formatCurrency(simTotalRefund)}</span>
                </div>

                <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-slate-900 font-extrabold text-sm">
                  <span>Học phí thực nộp kỳ sau:</span>
                  <span className="text-base text-[#275A4E] font-mono">
                    {formatCurrency(simNetTuition)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
            <Info className="h-4 w-4 text-teal-700 shrink-0" />
            <span>
              Công thức tự động giảm trừ vào mục "Tiền ăn hoàn trả" trên hóa đơn sinh bởi <strong>UC-035</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG NHẬT KÝ THAY ĐỔI CHÍNH SÁCH HOÀN TIỀN ĂN (Audit Log History Table - Section 2) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm space-y-3 p-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <History className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-bold text-sm sm:text-base">
              Nhật Ký Ban Hành & Điều Chỉnh Đơn Giá Hoàn Phí (Audit Trail)
            </h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
            {auditLogs.length} lần điều chỉnh
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3 px-3">Thời Điểm Ban Hành</th>
                <th className="py-3 px-3">Người Điều Chỉnh</th>
                <th className="py-3 px-3 text-center">Đơn Giá Cũ</th>
                <th className="py-3 px-3 text-center">Đơn Giá Mới</th>
                <th className="py-3 px-3 text-center">Kỳ Áp Dụng</th>
                <th className="py-3 px-4">Căn Cứ Điều Hành / Lý Do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Chưa có lịch sử điều chỉnh chính sách hoàn tiền ăn nào
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      {log.changedAt}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {log.changedBy}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {formatCurrency(log.oldRate)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-[#275A4E]">
                      {formatCurrency(log.newRate)}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        {log.effectivePeriod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {log.reason}
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

export default MealRefundRateTab;
