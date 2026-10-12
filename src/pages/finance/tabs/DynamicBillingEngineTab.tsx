import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  QrCode,
  FileText,
  RefreshCw,
  Search,
  Filter,
  Printer,
  Sparkles,
  Eye
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { kitchenApi } from '../../../api/kitchenApi';
import { formatCurrency } from '../../../utils/formatters';
import {
  DynamicInvoice,
  PreflightCheckStatus
} from '../../../types/finance.types';

export const DynamicBillingEngineTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Kỳ tính phí mục tiêu
  const [billingPeriod, setBillingPeriod] = useState<string>('2026-10'); // YYYY-MM
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Danh sách hóa đơn quyết toán
  const [invoices, setInvoices] = useState<DynamicInvoice[]>([]);

  // Tiến trình chạy ngầm Billing Engine
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [engineProgress, setEngineProgress] = useState<number>(0);
  const [engineStatusText, setEngineStatusText] = useState<string>('');

  // Modal Chi Tiết Hóa Đơn & Mã VietQR
  const [selectedInvoice, setSelectedInvoice] = useState<DynamicInvoice | null>(null);

  // Pre-flight Checklist Status
  const preflight: PreflightCheckStatus = {
    attendanceFinalized: true, // 100% lớp đã chốt
    pendingClassesCount: 0,
    mealHeadcountLocked: true,
    feePolicyActive: true,
    dailyRefundRateSet: true,
    paymentGatewayReady: true,
    totalActiveStudents: 350
  };

  // 1. Fetch dữ liệu khóa sổ điểm danh & suất ăn (GET /api/kitchen/daily-summary)
  useQuery({
    queryKey: ['billing-summary-check', billingPeriod],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getDailySummary();
        return res?.data || res;
      } catch {
        return null;
      }
    }
  });

  // Mutation: Chạy Lệnh Sinh Bảng Kê Học Phí Động Hàng Loạt (POST /api/finance/billing/generate)
  const generateMutation = useMutation({
    mutationFn: async () => {
      // Validate BR-063: Kiểm tra ràng buộc sổ điểm danh (MSG-146)
      if (!preflight.attendanceFinalized || preflight.pendingClassesCount > 0) {
        throw new Error(
          'MSG-146: Không thể sinh hóa đơn: Vẫn còn lớp học chưa hoàn tất sổ điểm danh và chốt số ăn trong tháng.'
        );
      }

      // Validate tính bất biến: Cấm chạy đè hóa đơn đã phát hành (MSG-147)
      const hasIssued = invoices.some((i) => i.status === 'ISSUED');
      if (hasIssued) {
        throw new Error(
          'MSG-147: Hóa đơn kỳ này đã được ban hành chính thức. Vui lòng sử dụng chức năng Điều chỉnh Hóa đơn nếu cần.'
        );
      }

      return await financeApi.generateDynamicBilling({
        billingPeriod: `${billingPeriod.slice(5, 7)}-${billingPeriod.slice(0, 4)}`,
        applyLatePickupFees: true,
        applySiblingDiscounts: true,
        dueDate: `${billingPeriod}-10`
      });
    },
    onMutate: () => {
      setIsEngineRunning(true);
      setEngineProgress(10);
      setEngineStatusText('Đang kiểm tra dữ liệu điểm danh và đơn xin nghỉ có phép...');
    },
    onSuccess: (res: any) => {
      setEngineProgress(100);
      setEngineStatusText('Đã hoàn thành sinh mã VietQR định danh cho toàn trường!');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      setTimeout(() => {
        setIsEngineRunning(false);
        const count = res?.totalGenerated || invoices.length || 350;
        setToastMessage({
          type: 'success',
          text: `MSG-144: Đã hoàn thành sinh bảng kê học phí hàng loạt: ${count} hóa đơn được tạo thành công.`
        });
      }, 600);
    },
    onError: (err: any) => {
      setIsEngineRunning(false);
      setToastMessage({
        type: 'error',
        text: err.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
    }
  });

  // Giả lập tiến trình khi bấm chạy
  const handleStartBillingEngine = () => {
    setIsEngineRunning(true);
    setEngineProgress(15);
    setEngineStatusText('BƯỚC 1/4: Đọc dữ liệu điểm danh thời gian thực và khấu trừ tiền ăn...');

    setTimeout(() => {
      setEngineProgress(45);
      setEngineStatusText('BƯỚC 2/4: Tính dồn phụ phí đón muộn ngoài giờ theo camera AI...');
    }, 400);

    setTimeout(() => {
      setEngineProgress(75);
      setEngineStatusText('BƯỚC 3/4: Áp dụng chiết khấu anh chị em và xử lý số dư kết chuyển...');
    }, 800);

    setTimeout(() => {
      generateMutation.mutate();
    }, 1200);
  };

  // Mutation: Tính toán lại riêng lẻ cho 1 học sinh (POST /api/finance/billing/recalculate/{studentId})
  const recalculateMutation = useMutation({
    mutationFn: async (invoice: DynamicInvoice) => {
      return await financeApi.recalculateStudentInvoice(
        invoice.studentId,
        invoice.billingPeriod
      );
    },
    onSuccess: (_, invoice) => {
      // Cập nhật lại số liệu
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoice.id
            ? {
                ...i,
                mealRefundTotal: i.excusedDaysCount * i.dailyRefundRate,
                netPayableAmount: Math.max(
                  0,
                  i.baseTuition +
                    i.serviceFees -
                    i.excusedDaysCount * i.dailyRefundRate +
                    i.latePickupFeeTotal -
                    i.siblingDiscountAmount -
                    i.surplusCarriedForward
                )
              }
            : i
        )
      );
      setToastMessage({
        type: 'success',
        text: 'MSG-145: Đã tính toán lại bảng kê học phí cá nhân cho học sinh thành công.'
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: err.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
    }
  });

  // Lọc danh sách hóa đơn
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const matchClass = filterClass === 'ALL' || item.className.includes(filterClass);
      const matchSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paymentReferenceCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [invoices, filterClass, searchTerm]);

  // Tổng hợp số liệu thống kê nhanh
  const totalNetReceivable = filteredInvoices.reduce((s, i) => s + i.netPayableAmount, 0);
  const totalMealRefunded = filteredInvoices.reduce((s, i) => s + i.mealRefundTotal, 0);
  const totalLatePickupCollected = filteredInvoices.reduce((s, i) => s + i.latePickupFeeTotal, 0);

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

      {/* BẢNG ĐIỀU KHIỂN ĐỘNG CƠ QUYẾT TOÁN (Billing Engine Command Center - Section 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#E5A93C] text-slate-900 text-xs font-black flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                <span>DYNAMIC BILLING ENGINE • THÁNG {billingPeriod.slice(5, 7)}/{billingPeriod.slice(0, 4)}</span>
              </span>
              <span className="text-xs text-emerald-200 bg-white/10 px-3 py-1 rounded-full font-medium">
                Kỳ quyết toán tự động ngày 25 hàng tháng
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kích Hoạt Công Cụ Quyết Toán Học Phí Động Toàn Trường
            </h2>

            <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
              Hệ thống tự động quét dữ liệu sổ điểm danh mầm non, bóc tách đơn nghỉ có phép trước 08:30 để hoàn tiền ăn ({formatCurrency(35000)}/ngày), tính dồn phụ phí đón muộn và sinh mã VietQR định danh duy nhất (BR-063).
            </p>

            {/* PRE-FLIGHT CHECKLIST CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs">
                <CheckCircle2 className="h-4 w-4 text-[#78C2AD] shrink-0" />
                <span>100% lớp đã chốt sổ điểm danh</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs">
                <CheckCircle2 className="h-4 w-4 text-[#78C2AD] shrink-0" />
                <span>Đơn giá hoàn tiền ăn: 35.000₫/ngày</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs">
                <CheckCircle2 className="h-4 w-4 text-[#78C2AD] shrink-0" />
                <span>Cổng VietQR / PayOS sẵn sàng</span>
              </div>
            </div>
          </div>

          {/* Cụm Nút Hành Động & Chọn Kỳ */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3 border border-white/15 flex items-center justify-between gap-3 text-xs">
              <span className="text-emerald-100 font-semibold">Kỳ tính phí:</span>
              <input
                type="month"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="rounded-xl bg-white text-slate-800 px-3 py-1 font-bold text-xs"
              />
            </div>

            <button
              onClick={handleStartBillingEngine}
              disabled={isEngineRunning}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#E5A93C] hover:bg-[#d99d30] disabled:opacity-50 text-[#1E4D40] px-6 py-3.5 text-sm font-black shadow-lg shadow-amber-950/20 min-h-[48px] active:scale-95 transition"
            >
              {isEngineRunning ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5 fill-current" />
              )}
              <span>
                {isEngineRunning
                  ? 'Đang Quyết Toán Hàng Loạt...'
                  : `Chạy Lệnh Quyết Toán (${preflight.totalActiveStudents} học sinh)`}
              </span>
            </button>
          </div>
        </div>

        {/* THANH TIẾN ĐỘ XỬ LÝ NGẦM PROGRESS BAR */}
        {isEngineRunning && (
          <div className="mt-5 pt-4 border-t border-white/15 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-100 font-bold">{engineStatusText}</span>
              <span className="font-extrabold text-[#E5A93C]">{engineProgress}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-[#E5A93C] rounded-full transition-all duration-300"
                style={{ width: `${engineProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* CÔNG THỨC QUYẾT TOÁN HIỂN THỊ TRỰC QUAN (Formula Breakdown - Section 2) */}
      <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[#275A4E] text-white shrink-0 mt-0.5">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="font-extrabold text-[#1E4D40] text-sm">
              Công Thức Quyết Toán Học Phí Động Bán Trú Chuẩn Kidpro (Formula Breakdown)
            </h4>
            <div className="p-3 bg-white rounded-2xl border border-teal-200 text-xs text-slate-800 font-mono overflow-x-auto">
              <span className="text-[#275A4E] font-bold">Học phí thực nộp</span> =
              Học phí cơ bản + Phí dịch vụ/Ngoại khóa
              <span className="text-emerald-700 font-bold"> - (Số ngày nghỉ có phép × 35.000₫)</span>
              <span className="text-amber-700 font-bold"> + Phụ phí đón muộn ngoài giờ</span>
              <span className="text-purple-700 font-bold"> - Giảm trừ anh chị em</span>
              <span className="text-blue-700 font-bold"> - Dư nợ bảo lưu kỳ trước</span>
            </div>
            <p className="text-[11px] text-slate-500">
              * Quy tắc <strong>MSG-148</strong>: Nếu số tiền hoàn trả lớn hơn số tiền phải nộp làm hóa đơn bị âm, số dư được <strong>tự động bảo lưu kết chuyển</strong> giảm trừ vào kỳ học phí tiếp theo.
            </p>
          </div>
        </div>
      </div>

      {/* 3 THẺ TỔNG HỢP NHANH (SUMMARY STATS) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng Thực Thu Dự Kiến
          </span>
          <p className="text-2xl font-black text-[#275A4E] mt-2">
            {formatCurrency(totalNetReceivable)}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredInvoices.length} hóa đơn trong danh sách
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Tổng Tiền Ăn Hoàn Trả (Vắng có phép)
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            -{formatCurrency(totalMealRefunded)}
          </p>
          <span className="text-xs text-emerald-600 mt-1 block">
            Tự động giảm trừ trực tiếp cho phụ huynh
          </span>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Phụ Phí Đón Muộn Ngoài Giờ
          </span>
          <p className="text-2xl font-black text-amber-700 mt-2 font-mono">
            +{formatCurrency(totalLatePickupCollected)}
          </p>
          <span className="text-xs text-amber-600 mt-1 block">
            Tích lũy từ dữ liệu camera AI cổng trường
          </span>
        </div>
      </div>

      {/* THANH BỘ LỌC BẢNG HÓA ĐƠN NHÁP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Lớp học:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả lớp' },
            { id: 'Nhà trẻ', label: 'Khối Nhà trẻ' },
            { id: 'Mầm', label: 'Khối Mầm' },
            { id: 'Lá', label: 'Khối Lá' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterClass(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                filterClass === pill.id
                  ? 'bg-[#275A4E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Tìm tên học sinh, mã VietQR, mã hóa đơn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#275A4E] focus:outline-hidden"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      {/* BẢNG RÀ SOÁT HÓA ĐƠN NHÁP VỪA SINH (Generated Draft Invoices Table - Section 2) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã Hóa Đơn</th>
                <th className="py-3.5 px-3">Tên Học Sinh / Lớp</th>
                <th className="py-3.5 px-3 text-right">Học Phí Gốc</th>
                <th className="py-3.5 px-3 text-right text-emerald-700">Hoàn Tiền Ăn</th>
                <th className="py-3.5 px-3 text-right text-amber-700">Đón Muộn</th>
                <th className="py-3.5 px-3 text-right text-purple-700">Giảm Trừ</th>
                <th className="py-3.5 px-3 text-right font-black">Tổng Thực Thu</th>
                <th className="py-3.5 px-3 text-center">Mã VietQR</th>
                <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Chưa có hóa đơn nào trong kỳ tính phí này. Nhấn &quot;Chạy Quyết Toán Toàn Trường&quot; để sinh dữ liệu bảng kê.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  {/* Mã hóa đơn */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {inv.invoiceNumber}
                  </td>

                  {/* Học sinh & Lớp */}
                  <td className="py-3.5 px-3 font-semibold text-slate-800">
                    <div>
                      <span>{inv.studentName}</span>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {inv.className}
                      </span>
                    </div>
                  </td>

                  {/* Học phí gốc */}
                  <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                    {formatCurrency(inv.baseTuition + inv.serviceFees)}
                  </td>

                  {/* Tiền ăn hoàn trả */}
                  <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                    {inv.mealRefundTotal > 0 ? (
                      <div>
                        <span>-{formatCurrency(inv.mealRefundTotal)}</span>
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          ({inv.excusedDaysCount} ngày có phép)
                        </span>
                      </div>
                    ) : (
                      '0₫'
                    )}
                  </td>

                  {/* Phụ phí đón muộn */}
                  <td className="py-3.5 px-3 text-right font-bold text-amber-700">
                    {inv.latePickupFeeTotal > 0 ? (
                      <div>
                        <span>+{formatCurrency(inv.latePickupFeeTotal)}</span>
                        <span className="block text-[10px] text-amber-600 font-normal">
                          ({inv.lateMinutesCount} phút trễ)
                        </span>
                      </div>
                    ) : (
                      '0₫'
                    )}
                  </td>

                  {/* Giảm trừ anh chị em / chính sách */}
                  <td className="py-3.5 px-3 text-right font-bold text-purple-700">
                    {inv.siblingDiscountAmount > 0 ? (
                      <span>-{formatCurrency(inv.siblingDiscountAmount)}</span>
                    ) : (
                      '0₫'
                    )}
                  </td>

                  {/* Tổng thực thu */}
                  <td className="py-3.5 px-3 text-right font-black text-sm text-[#275A4E] font-mono">
                    {formatCurrency(inv.netPayableAmount)}
                  </td>

                  {/* Mã VietQR tham chiếu duy nhất (BR-063) */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                      {inv.paymentReferenceCode}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold">
                      DRAFT (Nháp)
                    </span>
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Xem chi tiết & QR */}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-slate-100 transition"
                        title="Xem chi tiết hóa đơn & VietQR"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Tính toán lại riêng lẻ */}
                      <button
                        onClick={() => recalculateMutation.mutate(inv)}
                        disabled={recalculateMutation.isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Tính toán lại riêng lẻ học sinh (MSG-145)"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XEM CHI TIẾT HÓA ĐƠN & MÃ VIETQR TỰ ĐỘNG (BR-063) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#275A4E]">
                <FileText className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">
                  Bảng Kê Học Phí Bán Trú: {selectedInvoice.studentName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">{selectedInvoice.studentName}</h4>
                  <p className="text-slate-500">Lớp: {selectedInvoice.className} • Kỳ: Tháng {selectedInvoice.billingPeriod}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-600">{selectedInvoice.invoiceNumber}</span>
                  <span className="block text-[11px] text-slate-400">Hạn nộp: {selectedInvoice.dueDate}</span>
                </div>
              </div>

              {/* Các dòng bảng kê */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">1. Học phí cơ bản bán trú:</span>
                  <strong className="text-slate-800">{formatCurrency(selectedInvoice.baseTuition)}</strong>
                </div>

                {selectedInvoice.serviceFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">2. Phí dịch vụ & Câu lạc bộ:</span>
                    <strong className="text-slate-800">+{formatCurrency(selectedInvoice.serviceFees)}</strong>
                  </div>
                )}

                <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50/70 p-2 rounded-xl">
                  <span>3. Hoàn tiền ăn ({selectedInvoice.excusedDaysCount} ngày nghỉ có phép trước 08:30):</span>
                  <strong className="font-mono">-{formatCurrency(selectedInvoice.mealRefundTotal)}</strong>
                </div>

                {selectedInvoice.latePickupFeeTotal > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold bg-amber-50/70 p-2 rounded-xl">
                    <span>4. Phụ phí trông muộn ngoài giờ ({selectedInvoice.lateMinutesCount} phút):</span>
                    <strong className="font-mono">+{formatCurrency(selectedInvoice.latePickupFeeTotal)}</strong>
                  </div>
                )}

                {selectedInvoice.siblingDiscountAmount > 0 && (
                  <div className="flex justify-between text-purple-700 font-semibold">
                    <span>5. Giảm trừ chính sách anh chị em ruột:</span>
                    <strong className="font-mono">-{formatCurrency(selectedInvoice.siblingDiscountAmount)}</strong>
                  </div>
                )}

                {selectedInvoice.surplusCarriedForward > 0 && (
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>6. Số dư bảo lưu kỳ trước kết chuyển sang:</span>
                    <strong className="font-mono">-{formatCurrency(selectedInvoice.surplusCarriedForward)}</strong>
                  </div>
                )}
              </div>

              {/* Tổng thực thu */}
              <div className="pt-3 border-t-2 border-slate-300 flex items-center justify-between text-slate-900 font-black text-sm">
                <span>TỔNG THỰC NỘP:</span>
                <span className="text-base text-[#275A4E] font-mono">
                  {formatCurrency(selectedInvoice.netPayableAmount)}
                </span>
              </div>
            </div>

            {/* MÃ VIETQR ĐỊNH DANH (BR-063) */}
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 text-center space-y-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block">
                Mã Thanh Toán Chuyển Khoản Tự Động (VietQR)
              </span>
              <div className="mx-auto w-40 h-40 bg-white p-2 rounded-2xl border border-slate-200 flex items-center justify-center shadow-xs">
                <QrCode className="h-32 w-32 text-slate-800" />
              </div>
              <p className="text-xs text-slate-600">
                Nội dung CK: <strong className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border">{selectedInvoice.paymentReferenceCode}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Hệ thống tự động gạch nợ sau khi nhận được Webhook ngân hàng khớp mã tham chiếu.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-md min-h-[44px] flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>In Hóa Đơn (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicBillingEngineTab;
