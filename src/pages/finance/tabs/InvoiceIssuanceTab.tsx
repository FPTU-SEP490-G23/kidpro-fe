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
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { InvoiceDto, PublishInvoicesRequestDto, TuitionSummaryDto } from '../../../types/finance.types';

export const InvoiceIssuanceTab: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Hạn chốt nộp tiền để là ngày 15 tháng sau (so với tháng học phí)
  const calculateDefaultDueDate = (month: number, year: number) => {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const padMonth = String(nextMonth).padStart(2, '0');
    return `${nextYear}-${padMonth}-15`;
  };

  const [dueDate, setDueDate] = useState<string>(
    calculateDefaultDueDate(now.getMonth() + 1, now.getFullYear())
  );
  const [customMessage, setCustomMessage] = useState<string>(
    'Kính gửi Quý phụ huynh, nhà trường xin gửi thông báo học phí tháng này. Quý phụ huynh vui lòng quét mã VietQR để hoàn tất thanh toán đúng hạn.'
  );

  const [summary, setSummary] = useState<TuitionSummaryDto | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [viewingQrInvoice, setViewingQrInvoice] = useState<InvoiceDto | null>(null);
  const [qrModalMode, setQrModalMode] = useState<'DYNAMIC' | 'STATIC'>('DYNAMIC');
  const [showGeneralQrModal, setShowGeneralQrModal] = useState<boolean>(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Kiểm tra trạng thái thẩm định & phê duyệt BGH của Bảng tổng hợp học phí kỳ này
      const summaryRes: any = await financeApi.getTuitionSummary({
        month: selectedMonth,
        year: selectedYear,
      });
      const summaryData: TuitionSummaryDto = summaryRes?.data || summaryRes;
      setSummary(summaryData);

      // 2. Chỉ khi BGH đã APPROVED thì mới tải và hiển thị danh sách hóa đơn để phát hành
      if (summaryData?.status === 'APPROVED') {
        const res = await financeApi.getInvoices({
          month: selectedMonth,
          year: selectedYear,
        });
        const data = (res as any)?.data || res || [];
        setInvoices(data);
      } else {
        setInvoices([]);
      }
      setSelectedInvoiceIds([]);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải dữ liệu kỳ học phí.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setDueDate(calculateDefaultDueDate(selectedMonth, selectedYear));
    fetchData();
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
    if (summary?.status !== 'APPROVED') {
      showToast('error', 'Bảng tổng hợp học phí chưa được Ban Giám hiệu phê duyệt (APPROVED). Không thể phát hành.');
      return;
    }

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
        data?.message || 'Phát hành thành công thông báo học phí kèm mã VietQR tới phụ huynh.'
      );
      fetchData();
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-700/80 text-indigo-200 border border-indigo-500/30">
              Chuẩn VietQR Napas 24/7
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              summary?.status === 'APPROVED'
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                : summary?.status === 'SUBMITTED'
                ? 'bg-blue-500/30 text-blue-200 border-blue-400/50'
                : summary?.status === 'REJECTED'
                ? 'bg-rose-500/30 text-rose-200 border-rose-400/50'
                : 'bg-amber-500/30 text-amber-200 border-amber-400/50'
            }`}>
              {summary?.status === 'APPROVED' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : summary?.status === 'SUBMITTED' ? (
                <Clock className="w-3.5 h-3.5" />
              ) : summary?.status === 'REJECTED' ? (
                <XCircle className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>
                Thẩm định BGH: {
                  summary?.status === 'APPROVED'
                    ? 'ĐÃ PHÊ DUYỆT (Hợp lệ phát hành)'
                    : summary?.status === 'SUBMITTED'
                    ? 'ĐÃ TRÌNH BGH (Chờ ký duyệt)'
                    : summary?.status === 'REJECTED'
                    ? 'BỊ TỪ CHỐI'
                    : 'DỰ THẢO (Chưa trình duyệt)'
                }
              </span>
            </span>
          </div>

          <h2 className="text-xl font-bold mt-2">Phát hành Thông báo Học phí & Mã VietQR Tự động</h2>
          <p className="text-indigo-200 text-xs mt-1 leading-relaxed">
            Hệ thống tự động kích hoạt thông báo đẩy trên ứng dụng di động của Phụ huynh kèm mã QR Napas MB Bank (STK 666619092005) đã điền sẵn số tiền và nội dung chuyển khoản để gạch nợ tức thì.
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

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setShowGeneralQrModal(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-700/80 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xs transition-all text-xs cursor-pointer border border-indigo-500/50"
                title="Xem mã VietQR tĩnh MB Bank trỏ đến STK 666619092005 (không kèm số tiền)"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Chung (Không tiền)</span>
                <span className="sm:hidden">QR Chung</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={publishing || summary?.status !== 'APPROVED' || invoices.length === 0}
                title={summary?.status !== 'APPROVED' ? 'Chỉ có thể phát hành khi BGH đã phê duyệt bảng tổng hợp học phí tại Bảng Tổng Hợp Học Phí' : ''}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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

      {/* Thông báo hướng dẫn khi chưa được BGH APPROVED */}
      {summary && summary.status !== 'APPROVED' && !loading && (
        <div className={`p-6 rounded-3xl border shadow-sm ${
          summary.status === 'SUBMITTED'
            ? 'bg-blue-50/90 border-blue-200 text-blue-950'
            : summary.status === 'REJECTED'
            ? 'bg-rose-50/90 border-rose-200 text-rose-950'
            : 'bg-amber-50/90 border-amber-200 text-amber-950'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              summary.status === 'SUBMITTED'
                ? 'bg-blue-100 text-blue-700'
                : summary.status === 'REJECTED'
                ? 'bg-rose-100 text-rose-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {summary.status === 'SUBMITTED' ? (
                <Clock className="w-6 h-6 animate-pulse" />
              ) : summary.status === 'REJECTED' ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold">
                {summary.status === 'SUBMITTED' && `Bảng tổng hợp học phí tháng ${selectedMonth}/${selectedYear} đang chờ Ban Giám hiệu phê duyệt`}
                {summary.status === 'REJECTED' && `Bảng tổng hợp học phí tháng ${selectedMonth}/${selectedYear} bị Ban Giám hiệu từ chối phê duyệt`}
                {(summary.status === 'DRAFT' || summary.status === 'NOT_INITIALIZED') && `Bảng tổng hợp học phí tháng ${selectedMonth}/${selectedYear} chưa được trình BGH phê duyệt`}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {summary.status === 'SUBMITTED' &&
                  'Kế toán đã gửi trình hồ sơ học phí kỳ này lên Ban Giám hiệu. Theo quy định, chỉ sau khi BGH thẩm định và chuyển trạng thái sang "ĐÃ PHÊ DUYỆT", hệ thống mới mở dữ liệu để kế toán phát hành thông báo đóng tiền tới phụ huynh.'}
                {summary.status === 'REJECTED' &&
                  `Ban Giám hiệu đã từ chối bảng tính này với lý do: "${summary.rejectionReason || 'Cần kiểm tra lại phụ phí/miễn giảm'}". Kế toán vui lòng sang tab [Lập Bảng tính Học phí] để cập nhật số liệu và gửi trình duyệt lại.`}
                {(summary.status === 'DRAFT' || summary.status === 'NOT_INITIALIZED') &&
                  'Hiện tại bảng tổng hợp học phí đang ở trạng thái DỰ THẢO (Draft). Để đảm bảo tính chính xác và minh bạch tài chính trường học, bạn cần chuyển sang tab [Bảng Tổng hợp Học phí] để nhấn "Trình BGH Phê duyệt" trước khi phát hành.'}
              </p>
            </div>
            <a
              href="/finance?tab=tuition-summary"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                summary.status === 'SUBMITTED'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : summary.status === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <span>Xem Bảng Tổng Hợp </span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Khu vực danh sách hóa đơn (Chỉ hiển thị khi BGH đã APPROVED) */}
      {summary?.status === 'APPROVED' && (
        <>
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
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-200/50 cursor-pointer"
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
        </>
      )}

      {/* Modal hiển thị mã VietQR thanh toán học phí */}
      {viewingQrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-b from-indigo-800 to-indigo-900 text-white p-5 relative">
              <button
                onClick={() => setViewingQrInvoice(null)}
                className="absolute right-4 top-4 text-indigo-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Học Phí Trực Tuyến 24/7</p>
              <h3 className="text-lg font-bold mt-1">HỆ THỐNG MẦM NON KIDPRO</h3>
              <p className="text-xs text-indigo-200">Ngân hàng TMCP Quân Đội (MB Bank)</p>
            </div>

            <div className="p-5 space-y-3">
              {/* Toggle chế độ QR */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setQrModalMode('DYNAMIC')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    qrModalMode === 'DYNAMIC' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mã QR Có Tiền
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalMode('STATIC')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    qrModalMode === 'STATIC' ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mã QR Không Tiền
                </button>
              </div>

              <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-200 inline-block">
                <img
                  src={
                    qrModalMode === 'DYNAMIC'
                      ? (viewingQrInvoice.paymentQrCode
                          ? viewingQrInvoice.paymentQrCode.replace(/KIDPRO8888/g, '666619092005')
                          : `https://img.vietqr.io/image/970422-666619092005-compact2.png?amount=${viewingQrInvoice.finalAmount}&addInfo=${viewingQrInvoice.invoiceCode}&accountName=TRUONG%20MAM%20NON%20KIDPRO`)
                      : 'https://img.vietqr.io/image/970422-666619092005-compact2.png?accountName=TRUONG%20MAM%20NON%20KIDPRO'
                  }
                  alt="VietQR Code"
                  className="w-52 h-52 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-semibold text-slate-800">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-indigo-700">666619092005</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-800">TRUONG MAM NON KIDPRO</span>
                </div>
                {qrModalMode === 'DYNAMIC' ? (
                  <>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
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
                  </>
                ) : (
                  <div className="pt-1 border-t border-slate-200 text-slate-600 text-[11px] leading-relaxed italic">
                    * Mã QR chung không kèm số tiền. Phụ huynh quét mã sẽ tự động trỏ đến STK MB Bank của trường và tự điền số tiền nộp.
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Sử dụng app ngân hàng hoặc ví điện tử bất kỳ quét mã QR trên để hoàn tất thanh toán.
              </p>

              <button
                onClick={() => setViewingQrInvoice(null)}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị mã VietQR Chung Nhà Trường (Không kèm số tiền) */}
      {showGeneralQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 text-center animate-in fade-in zoom-in duration-150">
            <div className="bg-gradient-to-b from-indigo-800 to-indigo-900 text-white p-5 relative">
              <button
                onClick={() => setShowGeneralQrModal(false)}
                className="absolute right-4 top-4 text-indigo-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-xs font-semibold text-indigo-200 uppercase tracking-widest">Tài Khoản Thu Học Phí</p>
              <h3 className="text-lg font-bold mt-1">MÃ VIETQR CHUNG NHÀ TRƯỜNG</h3>
              <p className="text-xs text-indigo-200">Không kèm tiền • Phụ huynh tự nhập</p>
            </div>

            <div className="p-5 space-y-3">
              <div className="bg-white p-2 rounded-2xl shadow-inner border border-slate-200 inline-block">
                <img
                  src="https://img.vietqr.io/image/970422-666619092005-compact2.png?accountName=TRUONG%20MAM%20NON%20KIDPRO"
                  alt="VietQR Code General"
                  className="w-52 h-52 mx-auto object-contain rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                  <span className="font-semibold text-slate-800">MB Bank (Quân Đội)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">666619092005</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-semibold text-slate-800">TRUONG MAM NON KIDPRO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã ngân hàng (BIN):</span>
                  <span className="font-mono text-slate-700">970422</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                Mã QR này dùng chung cho toàn bộ phụ huynh chuyển khoản đóng tiền học phí và các khoản thu tại trường.
              </p>

              <button
                onClick={() => setShowGeneralQrModal(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
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
