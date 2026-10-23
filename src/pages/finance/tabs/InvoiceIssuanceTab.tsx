import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Send,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  X,
  Copy,
  Download,
  ShieldCheck,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { InvoiceDto, PublishInvoicesRequestDto } from '../../../types/finance.types';

export const InvoiceIssuanceTab: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [dueDate, setDueDate] = useState<string>(
    new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split('T')[0]
  );
  const [customMessage, setCustomMessage] = useState<string>(
    'Kính gửi Quý phụ huynh, nhà trường xin gửi thông báo học phí tháng này. Quý phụ huynh vui lòng quét mã VietQR để hoàn tất thanh toán đúng hạn.'
  );

  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [viewingQrInvoice, setViewingQrInvoice] = useState<InvoiceDto | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getInvoices({
        month: selectedMonth,
        year: selectedYear,
      });
      const data = (res as any)?.data || res || [];
      setInvoices(data);
      setSelectedInvoiceIds([]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải danh sách hóa đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth, selectedYear]);

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(invoices.map((i) => i.invoiceId));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(selectedInvoiceIds.filter((item) => item !== id));
    } else {
      setSelectedInvoiceIds([...selectedInvoiceIds, id]);
    }
  };

  const handlePublish = async () => {
    if (!dueDate) {
      showToast('error', 'Vui lòng thiết lập hạn chót nộp học phí.');
      return;
    }

    try {
      setPublishing(true);
      const payload: PublishInvoicesRequestDto = {
        month: selectedMonth,
        year: selectedYear,
        dueDate,
        customMessage,
        invoiceIds: selectedInvoiceIds.length > 0 ? selectedInvoiceIds : undefined,
      };

      const res = await financeApi.publishInvoices(payload);
      const data = (res as any)?.data || res;
      showToast(
        'success',
        data?.message || 'MSG-173: Phát hành thành công thông báo học phí kèm mã VietQR tới phụ huynh.'
      );
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi phát hành thông báo học phí.');
    } finally {
      setPublishing(false);
    }
  };

  const filteredInvoices = invoices.filter((i) => {
    const term = searchTerm.toLowerCase();
    return (
      (i.invoiceCode || '').toLowerCase().includes(term) ||
      (i.studentName || '').toLowerCase().includes(term) ||
      (i.studentCode || '').toLowerCase().includes(term) ||
      (i.className || '').toLowerCase().includes(term)
    );
  });

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

      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-700/80 text-indigo-200 border border-indigo-500/30">
            G8-UC-07 & Chuẩn VietQR Napas 24/7
          </span>
          <h2 className="text-xl font-bold mt-2">Phát hành Thông báo Học phí & Mã VietQR Tự động</h2>
          <p className="text-indigo-200 text-xs mt-1 leading-relaxed">
            Hệ thống tự động kích hoạt thông báo đẩy trên ứng dụng di động của Phụ huynh kèm mã QR Napas PayOS đã điền sẵn số tiền và nội dung chuyển khoản để gạch nợ tức thì.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-700/60 text-xs">
            <div>
              <label className="block text-indigo-300 font-semibold mb-1">Kỳ phát hành:</label>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-indigo-950/60 border border-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-indigo-950/60 border border-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-indigo-300 font-semibold mb-1">Hạn chót nộp học phí:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-indigo-950/60 border border-indigo-600 text-white px-2.5 py-1.5 rounded-lg text-xs w-full"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handlePublish}
                disabled={publishing || invoices.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all text-xs disabled:opacity-50"
              >
                {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {selectedInvoiceIds.length > 0
                  ? `Phát hành (${selectedInvoiceIds.length}) phiếu đã chọn`
                  : 'Phát hành Toàn trường'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm theo học sinh, mã hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={toggleSelectAll}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            {selectedInvoiceIds.length === invoices.length && invoices.length > 0
              ? 'Bỏ chọn tất cả'
              : 'Chọn tất cả'}
          </button>
        </div>

        <div className="text-xs text-slate-500">
          Tổng số: <strong className="text-slate-800">{invoices.length}</strong> phiếu | Đã chọn:{' '}
          <strong className="text-indigo-600">{selectedInvoiceIds.length}</strong>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                </th>
                <th className="py-3.5 px-4">Mã hóa đơn</th>
                <th className="py-3.5 px-4">Học sinh & Lớp</th>
                <th className="py-3.5 px-4">Phụ huynh nhận tin</th>
                <th className="py-3.5 px-4">Số tiền nộp (VNĐ)</th>
                <th className="py-3.5 px-4">Hạn nộp</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Xem mã QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy hóa đơn nào trong kỳ phí {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.invoiceId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      selectedInvoiceIds.includes(inv.invoiceId) ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoiceIds.includes(inv.invoiceId)}
                        onChange={() => toggleSelectOne(inv.invoiceId)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{inv.studentName}</p>
                      <p className="text-xs text-slate-500">{inv.className || 'Chưa phân lớp'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-700">{inv.parentName || 'Chưa liên kết'}</p>
                      <p className="text-slate-400">{inv.parentPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatCurrency(inv.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{inv.dueDate}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {inv.status === 'PAID' ? 'Đã thu' : 'Chờ nộp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setViewingQrInvoice(inv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/50"
                      >
                        <QrCode className="w-4 h-4" />
                        Mã VietQR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewingQrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-b from-indigo-800 to-indigo-900 text-white p-5 relative">
              <button
                onClick={() => setViewingQrInvoice(null)}
                className="absolute right-4 top-4 text-indigo-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Học Phí Trực Tuyến 24/7</p>
              <h3 className="text-lg font-bold mt-1">HỆ THỐNG MẦM NON KIDPRO</h3>
              <p className="text-xs text-indigo-200">Ngân hàng TMCP Quân Đội (MB Bank)</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-white p-3 rounded-2xl shadow-inner border border-slate-200 inline-block">
                <img
                  src={
                    viewingQrInvoice.paymentQrCode ||
                    `https://img.vietqr.io/image/970422-KIDPRO8888-compact2.png?amount=${viewingQrInvoice.finalAmount}&addInfo=${viewingQrInvoice.invoiceCode}&accountName=TRUONG%20MAM%20NON%20KIDPRO`
                  }
                  alt="VietQR Code"
                  className="w-56 h-56 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã hóa đơn:</span>
                  <span className="font-bold text-indigo-700">{viewingQrInvoice.invoiceCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Học sinh:</span>
                  <span className="font-semibold text-slate-800">{viewingQrInvoice.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lớp:</span>
                  <span className="font-semibold text-slate-800">{viewingQrInvoice.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền cần đóng:</span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(viewingQrInvoice.finalAmount)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Sử dụng app ngân hàng hoặc ví điện tử bất kỳ quét mã QR trên để hoàn tất thanh toán.
              </p>

              <button
                onClick={() => setViewingQrInvoice(null)}
                className="w-full py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceIssuanceTab;
