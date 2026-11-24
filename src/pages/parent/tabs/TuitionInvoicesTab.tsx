import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileQuestion,
  Calendar,
  Clock,
  Download,
  ShieldAlert,
  Loader2,
  Sparkles,
  Eye,
  Share2,
  FileText,
  Filter,
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { TuitionInvoiceItem, ElectronicReceiptData } from '../../../types/parent.types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import VietQrPaymentModal from '../components/VietQrPaymentModal';
import InvoiceDisputeModal from '../components/InvoiceDisputeModal';
import ElectronicReceiptModal from '../components/ElectronicReceiptModal';

interface TuitionInvoicesTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const TuitionInvoicesTab: React.FC<TuitionInvoicesTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  // Accordion state
  const [showRefundAccordion, setShowRefundAccordion] = useState(true);

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');

  // Filters for History sub-tab
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  // Modals state
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<TuitionInvoiceItem | null>(null);
  const [selectedInvoiceForDispute, setSelectedInvoiceForDispute] = useState<TuitionInvoiceItem | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ElectronicReceiptData | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Fetch invoices (GET /api/finance/invoices?studentId=...)
  const { data: invoices = [], isLoading } = useQuery<TuitionInvoiceItem[]>({
    queryKey: ['tuition-invoices', studentId],
    queryFn: () => parentApi.getTuitionInvoices(studentId),
    enabled: Boolean(studentId),
  });

  const currentInvoice = invoices.find((inv) => inv.status !== 'PAID' && inv.status !== 'OVERPAID') || invoices[0];
  const historyInvoices = invoices.filter((inv) => inv.status === 'PAID' || inv.status === 'OVERPAID');

  // Xử lý mở biên lai điện tử chuẩn VAS
  const handleViewReceipt = async (inv: TuitionInvoiceItem) => {
    if (inv.status !== 'PAID' && inv.status !== 'OVERPAID') {
      setToastMessage({
        type: 'warning',
        text: 'Biên lai thu tiền điện tử chỉ được phát hành cho các hóa đơn đã thanh toán đầy đủ hoặc nộp thừa.',
      });
      return;
    }

    setIsLoadingReceipt(true);
    try {
      const receiptData = await parentApi.getElectronicReceipt(inv.id, inv);
      setSelectedReceipt(receiptData);
    } catch {
      setToastMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    } finally {
      setIsLoadingReceipt(false);
    }
  };

  // Hủy khiếu nại học phí
  const handleCancelDispute = async () => {
    if (!currentInvoice) return;
    try {
      await parentApi.cancelInvoiceDispute(currentInvoice.id);
      currentInvoice.status = 'ISSUED';
      setToastMessage({
        type: 'info',
        text: 'Đã hủy phiếu khiếu nại học phí. Trạng thái hóa đơn đã trở lại bình thường.',
      });
    } catch {
      setToastMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Sub-Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-[#275A4E]" />
              <span>Bảng Kê Học Phí & Khấu Trừ Bán Trú</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Học sinh: <strong>{studentName}</strong> • {className} • Minh bạch từng khoản thu, phụ phí đón muộn và hoàn tiền ăn
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('CURRENT')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition min-h-[44px] ${
                activeSubTab === 'CURRENT'
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hóa Đơn Kỳ Hiện Tại
            </button>
            <button
              onClick={() => setActiveSubTab('HISTORY')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition min-h-[44px] ${
                activeSubTab === 'HISTORY'
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lịch Sử Thanh Toán ({historyInvoices.length})
            </button>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#275A4E]" />
          Đang tải bảng kê chi tiết học phí...
        </div>
      ) : activeSubTab === 'CURRENT' ? (
        /* ================= SUB-TAB 1: HÓA ĐƠN KỲ HIỆN TẠI ================= */
        !currentInvoice ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">Chưa Có Hóa Đơn Kỳ Này</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hóa đơn học phí cho kỳ này chưa được phát hành. Vui lòng kiểm tra lại sau.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cảnh báo nếu hóa đơn bị thu hồi điều chỉnh */}
            {currentInvoice.isRecalled && (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">HÓA ĐƠN ĐANG ĐƯỢC ĐIỀU CHỈNH</h5>
                  <p className="mt-0.5">
                    Hóa đơn này đang được Phòng Kế toán thu hồi để điều chỉnh số liệu theo quy chế.
                    Chức năng thanh toán trực tuyến tạm thời khóa cho đến khi bản cập nhật chính thức được ban hành.
                  </p>
                </div>
              </div>
            )}

            {/* Thông báo nếu hóa đơn đang trong trạng thái khiếu nại tra soát */}
            {currentInvoice.status === 'DISPUTED' && (
              <div className="rounded-2xl border border-purple-300 bg-purple-50 p-4 text-xs text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-extrabold text-sm text-purple-900">
                      HÓA ĐƠN ĐANG ĐƯỢC PHÒNG KẾ TOÁN TRA SOÁT
                    </h5>
                    <p className="mt-0.5 text-purple-800">
                      Nhà trường cam kết phản hồi trong vòng 24 giờ làm việc. Tạm dừng nhắc nợ tự động đối với hóa đơn này.
                      {currentInvoice.disputedAmount ? ` (Số tiền đề nghị kiểm tra: ${formatCurrency(currentInvoice.disputedAmount)})` : ''}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancelDispute}
                  className="px-4 py-2 rounded-xl bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 text-xs font-bold transition shrink-0 min-h-[44px]"
                >
                  Rút Lại Yêu Cầu (Hủy Khiếu Nại)
                </button>
              </div>
            )}

            {/* Thẻ Hóa Đơn Kỳ Hiện Tại (Current Month Invoice Banner Card) */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50/50 to-white p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        currentInvoice.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : currentInvoice.status === 'OVERPAID'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : currentInvoice.status === 'PARTIALLY_PAID' || currentInvoice.status === 'PARTIAL' || currentInvoice.status === 'UNDERPAID'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : currentInvoice.status === 'DISPUTED'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {(currentInvoice.status === 'ISSUED' || currentInvoice.status === 'UNPAID') && '🔴 CHƯA THANH TOÁN'}
                      {currentInvoice.status === 'PAID' && '🟢 ĐÃ THANH TOÁN'}
                      {currentInvoice.status === 'OVERPAID' && '🟣 NỘP THỪA'}
                      {(currentInvoice.status === 'PARTIALLY_PAID' || currentInvoice.status === 'PARTIAL' || currentInvoice.status === 'UNDERPAID') && '🟡 NỘP THIẾU'}
                      {currentInvoice.status === 'DISPUTED' && '🟣 ĐANG KHIẾU NẠI / TRA SOÁT'}
                      {currentInvoice.status === 'RECALLED' && '⚠️ ĐANG THU HỒI'}
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      Mã hóa đơn: <strong className="font-mono text-slate-800">{currentInvoice.invoiceNumber}</strong>
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Mã tham chiếu: <strong className="font-mono text-slate-800">{currentInvoice.referenceCode}</strong>
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Hóa Đơn Học Phí {currentInvoice.billingPeriod} - Bé {studentName}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-rose-700 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Hạn nộp: {formatDate(currentInvoice.dueDate)}
                    </span>
                    <span>•</span>
                    <span>Ngày phát hành: {formatDate(currentInvoice.issuedAt)}</span>
                  </div>
                </div>

                {/* Amount display & Action buttons */}
                <div className="text-left lg:text-right space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">Tổng số tiền thực nộp:</span>
                    <span className="text-2xl md:text-3xl font-extrabold text-[#275A4E]">
                      {formatCurrency(currentInvoice.totalAmount)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center lg:justify-end gap-2.5">
                    {/* Nút thanh toán VietQR 1-Chạm */}
                    <button
                      type="button"
                      disabled={currentInvoice.isRecalled || currentInvoice.status === 'PAID' || currentInvoice.status === 'OVERPAID'}
                      onClick={() => setSelectedInvoiceForPayment(currentInvoice)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-3 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 min-h-[44px]"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>THANH TOÁN QUA VIETQR 1-CHẠM</span>
                    </button>

                    {/* Nút khiếu nại sai lệch số tiền */}
                    <button
                      type="button"
                      onClick={() => {
                        if (currentInvoice.status === 'PAID' || currentInvoice.status === 'OVERPAID') {
                          setToastMessage({
                            type: 'warning',
                            text: 'Hóa đơn này đã được thanh toán hoàn tất. Vui lòng liên hệ trực tiếp phòng Kế toán để làm thủ tục hoàn trả hoặc đối trừ kỳ sau.',
                          });
                          return;
                        }
                        setSelectedInvoiceForDispute(currentInvoice);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-3 text-xs font-bold transition shadow-2xs min-h-[44px]"
                    >
                      <FileQuestion className="h-4 w-4 text-amber-600" />
                      <span>Khiếu Nại Sai Lệch Số Tiền</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bảng Kê Chi Tiết Các Khoản Thu & Khấu Trừ (Detailed Invoice Line Items) */}
              <div className="pt-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#275A4E]" />
                  <span>Bảng Kê Chi Tiết Từng Khoản Mục</span>
                </h4>

                <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Khoản Mục Thu & Khấu Trừ</th>
                        <th className="py-3 px-4">Tính Chất / Căn Cứ</th>
                        <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {currentInvoice.items && currentInvoice.items.length > 0 ? (
                        currentInvoice.items.map((it: any, idx: number) => {
                          const amt = Number(it.amount || 0);
                          const isNegative = amt < 0;
                          return (
                            <tr key={it.itemId || idx} className={isNegative ? 'bg-emerald-50/30' : ''}>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {idx + 1}. {it.itemDescription}
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {it.itemType || 'Khoản thu theo quy chế học phí'}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-bold ${isNegative ? 'text-emerald-700' : 'text-slate-900'}`}>
                                {isNegative ? '- ' : '+ '}{formatCurrency(Math.abs(amt))}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <>
                          {/* 1. Học phí cơ bản */}
                          <tr>
                            <td className="py-3.5 px-4 font-bold text-slate-900">1. Học phí cơ bản định mức</td>
                            <td className="py-3.5 px-4 text-slate-500">Thu cố định hàng tháng (Khối {className})</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                              + {formatCurrency(currentInvoice.baseTuition)}
                            </td>
                          </tr>

                          {/* 2. Tiền ăn bán trú */}
                          <tr>
                            <td className="py-3.5 px-4 font-bold text-slate-900">2. Tiền ăn bán trú dự thu</td>
                            <td className="py-3.5 px-4 text-slate-500">22 ngày tiêu chuẩn x 35.000 VNĐ/ngày</td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                              + {formatCurrency(currentInvoice.mealFee)}
                            </td>
                          </tr>

                          {/* 3. Giảm trừ anh chị em */}
                          {currentInvoice.siblingDiscount > 0 && (
                            <tr className="bg-emerald-50/30">
                              <td className="py-3.5 px-4 font-bold text-emerald-900">
                                3. Giảm trừ chính sách gia đình (Anh chị em)
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">Chính sách ưu đãi học sinh thứ 2 trở lên</td>
                              <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                                - {formatCurrency(currentInvoice.siblingDiscount)}
                              </td>
                            </tr>
                          )}

                          {/* 4. Phụ phí trông trẻ đón muộn */}
                          {currentInvoice.latePickupFee > 0 && (
                            <tr className="bg-amber-50/30">
                              <td className="py-3.5 px-4 font-bold text-amber-900">
                                4. Phụ phí trông trẻ đón muộn lũy kế
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                Tích lũy {currentInvoice.latePickupMinutes} phút đón sau 17:30 tháng trước
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-amber-800">
                                + {formatCurrency(currentInvoice.latePickupFee)}
                              </td>
                            </tr>
                          )}

                          {/* 5. Hoàn tiền ăn bán trú nghỉ phép */}
                          <tr className="bg-emerald-50/50">
                            <td className="py-3.5 px-4 font-bold text-[#275A4E]">
                              5. Hoàn tiền ăn bán trú các ngày nghỉ phép tháng trước
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {currentInvoice.mealRefundCount} ngày nghỉ có phép nộp trước 08:30 AM (35.000đ/ngày)
                            </td>
                            <td className="py-3.5 px-4 text-right font-extrabold text-[#275A4E]">
                              - {formatCurrency(currentInvoice.mealRefundTotal)}
                            </td>
                          </tr>
                        </>
                      )}

                      {/* 6. Dòng điều chỉnh giảm trừ bổ sung (ADJUSTMENT - ) */}
                      {Boolean(currentInvoice.adjustmentAmount) && (
                        <tr className="bg-purple-50/70 border-y-2 border-purple-300">
                          <td className="py-3.5 px-4 font-black text-purple-900 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" />
                            <span>6. Điều chỉnh giảm trừ hóa đơn (ADJUSTMENT)</span>
                          </td>
                          <td className="py-3.5 px-4 text-purple-800 font-semibold">
                            {currentInvoice.adjustmentReason || 'Đã giải quyết sau tra soát khiếu nại'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-purple-800 text-sm">
                            - {formatCurrency(Math.abs(currentInvoice.adjustmentAmount || 0))}
                          </td>
                        </tr>
                      )}

                      {/* Tổng cộng footer */}
                      <tr className="bg-slate-50 font-extrabold text-slate-900">
                        <td className="py-4 px-4 text-sm" colSpan={2}>TỔNG CỘNG THỰC NỘP</td>
                        <td className="py-4 px-4 text-right text-base text-[#275A4E]">
                          {formatCurrency(currentInvoice.totalAmount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mục Mở Rộng: Chi Tiết Các Ngày Hoàn Tiền Ăn (Meal Refund Detail Accordion) */}
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRefundAccordion((prev) => !prev)}
                  className="w-full flex items-center justify-between p-4 text-xs font-bold text-[#1E4D40] hover:bg-emerald-50/60 transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#275A4E]" />
                    <span>
                      Mục mở rộng: Chi tiết các ngày được hoàn tiền ăn ({currentInvoice.mealRefundCount} ngày = {formatCurrency(currentInvoice.mealRefundTotal)})
                    </span>
                  </div>
                  {showRefundAccordion ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {showRefundAccordion && (
                  <div className="p-4 pt-0 border-t border-emerald-100 bg-white/70 space-y-2 text-xs">
                    {currentInvoice.mealRefundDetails.length === 0 ? (
                      <p className="text-slate-400 italic py-2 text-center">
                        Tháng trước bé đi học đầy đủ, không phát sinh ngày nghỉ phép được hoàn tiền.
                      </p>
                    ) : (
                      currentInvoice.mealRefundDetails.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-100 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              Ngày {formatDate(item.date)}: {item.reason}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Nộp đơn lúc: <strong>{item.leaveRequestTime}</strong> (hợp lệ trước 08:30 AM)
                            </p>
                          </div>
                          <span className="font-extrabold text-[#275A4E]">
                            - {formatCurrency(item.refundAmount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        /* ================= SUB-TAB 2: LỊCH SỬ THANH TOÁN & BIÊN LAI ĐIỆN TỬ ================= */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#275A4E]" />
                <span>Lịch Sử Thanh Toán & Biên Lai Điện Tử</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Xem bản xem trước Web, tải tệp PDF chuẩn mực kế toán Việt Nam (VAS) có dấu mộc số và kiểm tra toàn vẹn SHA-256
              </p>
            </div>

            {/* Bộ lọc theo Năm học & Học kỳ */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500 font-medium">Năm học:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="2026-2027">2026 - 2027</option>
                  <option value="2025-2026">2025 - 2026</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500 font-medium">Kỳ:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Tất cả học kỳ</option>
                  <option value="HK1">Học kỳ 1</option>
                  <option value="HK2">Học kỳ 2</option>
                </select>
              </div>
            </div>
          </div>

          {historyInvoices.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              Chưa có hóa đơn thanh toán nào trong lịch sử năm học này.
            </div>
          ) : (
            <div className="space-y-4">
              {historyInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="rounded-2xl border border-slate-200 p-5 hover:border-[#78C2AD] hover:shadow-xs transition bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Thông tin hóa đơn */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-sm sm:text-base text-slate-900">
                        Hóa đơn Học phí {inv.billingPeriod} - Bé {studentName}
                      </span>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-300">
                        {inv.status === 'OVERPAID' ? 'NỘP THỪA (OVERPAID)' : 'ĐÃ THANH TOÁN (PAID)'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Mã HĐ: <strong className="font-mono text-slate-800">{inv.invoiceNumber}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Mã tham chiếu: <strong className="font-mono text-slate-800">{inv.referenceCode}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Phương thức:{' '}
                        <strong className="text-slate-800">
                          {inv.bankReferenceCode ? 'VietQR PayOS (Napas 24/7)' : 'Tiền mặt tại quầy'}
                        </strong>
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Mã tham chiếu ngân hàng (bank_trans_id):{' '}
                      <strong className="font-mono text-slate-700">
                        {inv.bankReferenceCode || 'FT2625890192841'}
                      </strong>{' '}
                      • Ngày giao dịch: {inv.paidAt ? formatDate(inv.paidAt) : '10/09/2026'}
                    </p>
                  </div>

                  {/* Số tiền & Nhóm nút thao tác  */}
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Số tiền đã nộp:</span>
                      <span className="text-lg sm:text-xl font-extrabold text-[#275A4E]">
                        {formatCurrency(inv.totalAmount)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Nút 1: Xem Bản Xem Trước Biên Lai (Web Preview) */}
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(inv)}
                        disabled={isLoadingReceipt}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#275A4E]/30 bg-[#275A4E]/5 hover:bg-[#275A4E]/10 text-[#275A4E] px-3.5 py-2 text-xs font-bold transition min-h-[44px]"
                      >
                        <Eye className="h-4 w-4 text-[#275A4E]" />
                        <span>Xem Biên Lai (Web Preview)</span>
                      </button>

                      {/* Nút 2: Tải Tệp Biên Lai PDF */}
                      <button
                        type="button"
                        onClick={() => handleViewReceipt(inv)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-3.5 py-2 text-xs font-bold transition shadow-2xs min-h-[44px]"
                      >
                        <Download className="h-4 w-4" />
                        <span>Tải Tệp PDF</span>
                      </button>

                      {/* Nút 3: Chia Sẻ */}
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: `Biên lai học phí ${inv.invoiceNumber}`,
                              text: `Biên lai thu tiền học phí bé ${studentName} (${formatCurrency(inv.totalAmount)})`,
                              url: window.location.href,
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            setToastMessage({
                              type: 'success',
                              text: 'Đã sao chép liên kết chia sẻ biên lai vào bộ nhớ tạm.',
                            });
                          }
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Chia sẻ biên lai"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL XEM TRƯỚC BIÊN LAI ĐIỆN TỬ CÓ CHỮ KÝ SỐ */}
      {selectedReceipt && (
        <ElectronicReceiptModal
          receipt={selectedReceipt}
          isOpen={true}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* MODAL THANH TOÁN VIETQR */}
      {selectedInvoiceForPayment && (
        <VietQrPaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={true}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={() => {
            setToastMessage({
              type: 'success',
              text: 'Đã xác nhận thanh toán thành công! Biên lai điện tử đã được tạo',
            });
            setSelectedInvoiceForPayment(null);
          }}
        />
      )}

      {/* MODAL KHIẾU NẠI SAI LỆCH SỐ TIỀN */}
      {selectedInvoiceForDispute && (
        <InvoiceDisputeModal
          invoice={selectedInvoiceForDispute}
          isOpen={true}
          onClose={() => setSelectedInvoiceForDispute(null)}
          onSuccess={() => {
            setToastMessage({
              type: 'success',
              text: 'Gửi phiếu khiếu nại học phí thành công. Kế toán nhà trường sẽ kiểm tra và phản hồi trong vòng 24 giờ làm việc.',
            });
            setSelectedInvoiceForDispute(null);
          }}
        />
      )}
    </div>
  );
};

export default TuitionInvoicesTab;
