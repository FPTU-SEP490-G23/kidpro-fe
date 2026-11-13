import React, { useState, useEffect } from 'react';
import {
  Banknote,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileCheck2,
  Building,
  User,
  ShieldCheck,
  Calendar,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import {
  InvoiceDto,
  RecordCashPaymentRequestDto,
  ReceiptDto,
} from '../../../types/finance.types';

export const CashReceiptsTab: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('UNPAID');

  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [payerName, setPayerName] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Nộp tiền mặt trực tiếp tại văn phòng kế toán');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<ReceiptDto | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState<boolean>(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.keyword = searchTerm.trim();

      const res = await financeApi.getInvoices(params);
      setInvoices((res as any)?.data || res || []);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const openCashPayModal = (inv: InvoiceDto) => {
    setSelectedInvoice(inv);
    setAmountPaid(inv.finalAmount);
    setPayerName(inv.parentName || 'Phụ huynh học sinh');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setNotes('Thu tiền mặt trực tiếp tại văn phòng kế toán trường');
    setIsPayModalOpen(true);
  };

  const handleConfirmCashPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (amountPaid <= 0) {
      showToast('error', 'Số tiền thu phải lớn hơn 0 VNĐ.');
      return;
    }

    const payload: RecordCashPaymentRequestDto = {
      amountPaid,
      paymentDate,
      payerName: payerName.trim(),
      notes: notes.trim(),
    };

    try {
      setSubmittingPayment(true);
      const res = await financeApi.recordCashPayment(selectedInvoice.invoiceId, payload);
      const receipt = (res as any)?.data || res;
      showToast('success', 'Ghi nhận thu học phí tiền mặt và gạch nợ thành công.');
      setIsPayModalOpen(false);
      fetchInvoices();

      setReceiptData(receipt);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi ghi nhận thu tiền mặt.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleViewReceipt = async (inv: InvoiceDto) => {
    try {
      setLoadingReceipt(true);
      const res = await financeApi.getReceiptByInvoiceId(inv.invoiceId);
      setReceiptData((res as any)?.data || res);
      setIsReceiptModalOpen(true);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải biên lai điện tử.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white transition-all transform animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phiếu chờ thu tiền</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIAL').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Banknote className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Đã thanh toán (Sẵn sàng in biên lai)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {invoices.filter((i) => i.status === 'PAID').length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FileCheck2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quy chuẩn chứng từ</p>
            <p className="text-sm font-semibold text-indigo-600 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Chuẩn BR-041 & BR-042: Hóa đơn VAT / Biên lai
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ReceiptIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tra cứu theo mã học sinh, họ tên, mã hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700"
          >
            <option value="UNPAID">Chờ thanh toán (UNPAID)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PARTIAL">Nộp một phần (PARTIAL)</option>
            <option value="ALL">Tất cả trạng thái</option>
          </select>
        </div>

        <button
          onClick={fetchInvoices}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tìm kiếm & Làm mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã hóa đơn</th>
                <th className="py-3.5 px-4">Học sinh</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4">Phụ huynh</th>
                <th className="py-3.5 px-4">Kỳ phí</th>
                <th className="py-3.5 px-4">Số tiền phải nộp</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác thu & in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải dữ liệu thu ngân...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy hóa đơn nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {inv.studentName}
                      <span className="block text-xs font-normal text-slate-400">Mã: {inv.studentCode}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{inv.className || 'Chưa phân lớp'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-700">{inv.parentName || '—'}</p>
                      <p className="text-slate-400">{inv.parentPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      Tháng {inv.billingMonth}/{inv.billingYear}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatCurrency(inv.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'PAID' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => openCashPayModal(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
                            title="Xác nhận thu tiền mặt và gạch nợ"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Thu tiền mặt
                          </button>
                        ) : (
                          <button
                            onClick={() => handleViewReceipt(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/50"
                            title="Xuất hóa đơn điện tử & in biên lai"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            In biên lai
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Xác Nhận Thu Tiền Mặt Trực Tiếp</h3>
                <p className="text-xs text-slate-500">Mã phiếu: {selectedInvoice.invoiceCode} — Học sinh: {selectedInvoice.studentName}</p>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCashPayment} className="p-6 space-y-4">
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Tổng công nợ cần đóng:</span>
                  <span className="font-bold text-emerald-900 text-sm">{formatCurrency(selectedInvoice.finalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Kỳ học phí:</span>
                  <span className="font-semibold text-emerald-900">Tháng {selectedInvoice.billingMonth}/{selectedInvoice.billingYear}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Số tiền thực thu (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-base font-bold text-emerald-600 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Họ tên người nộp tiền
                </label>
                <input
                  type="text"
                  required
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Ngày ghi nhận thu tiền
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Ghi chú chứng từ
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md"
                >
                  {submittingPayment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Xác nhận gạch nợ & In biên lai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <ReceiptIcon className="w-4 h-4" /> Biên lai Thu tiền Điện tử
              </span>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt" className="p-8 space-y-5 text-slate-800 bg-white">
              <div className="text-center border-b pb-4 border-slate-200">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {receiptData.schoolName || 'HỆ THỐNG TRƯỜNG MẦM NON QUỐC TẾ KIDPRO'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Mã số thuế: {receiptData.schoolTaxCode || '0108992345'}</p>
                <p className="text-xs text-slate-500">{receiptData.schoolAddress || 'Khu Công Nghệ Cao Hòa Lạc, Thạch Thất, Hà Nội'}</p>

                <h1 className="text-lg font-black text-indigo-900 mt-3 uppercase tracking-wider">
                  BIÊN LAI THU TIỀN HỌC PHÍ
                </h1>
                <p className="text-xs font-mono text-slate-600 mt-0.5">Số: <strong>{receiptData.receiptId}</strong></p>
                <p className="text-xs text-slate-500">Thời gian giao dịch: {receiptData.paymentTime}</p>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Họ và tên học sinh:</span>
                  <span className="font-bold text-slate-900">{receiptData.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã số học sinh:</span>
                  <span className="font-mono font-semibold text-slate-800">{receiptData.studentCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lớp học:</span>
                  <span className="font-semibold text-slate-800">{receiptData.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Người nộp tiền:</span>
                  <span className="font-semibold text-slate-800">{receiptData.payerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hình thức thanh toán:</span>
                  <span className="font-bold text-indigo-700">
                    {receiptData.paymentMethod === 'CASH' ? 'Tiền mặt tại quỹ' : 'Chuyển khoản VietQR 24/7'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hóa đơn liên kết:</span>
                  <span className="font-mono text-slate-700">{receiptData.invoiceCode}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-600">SỐ TIỀN ĐÃ THU:</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {formatCurrency(receiptData.amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Công nợ còn lại sau thanh toán:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(receiptData.remainingDebt || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center text-xs pt-4 border-t border-slate-200">
                <div>
                  <p className="font-semibold text-slate-700">Người nộp tiền</p>
                  <p className="text-slate-400 italic text-[10px] mt-1">(Ký, ghi rõ họ tên)</p>
                  <div className="h-12"></div>
                  <p className="font-medium text-slate-800">{receiptData.payerName}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Thủ quỹ / Kế toán</p>
                  <p className="text-slate-400 italic text-[10px] mt-1">(Đã xác nhận & gạch nợ)</p>
                  <div className="h-12 flex items-center justify-center">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-[11px] rotate-[-5deg]">
                      ĐÃ THU TIỀN
                    </span>
                  </div>
                  <p className="font-medium text-slate-800">Bộ phận Kế toán KidPro</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <p className="text-[10px] font-mono text-slate-400">
                  Mã xác thực số: {receiptData.verificationCode || 'VER-KIDPRO-2026'} | Tra cứu trực tuyến tại kidpro.edu.vn/verify
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex justify-between items-center print:hidden">
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                In biên lai / Lưu PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashReceiptsTab;
