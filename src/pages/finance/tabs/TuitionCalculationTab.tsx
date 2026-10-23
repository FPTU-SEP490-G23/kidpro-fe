import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  FilePlus2,
  Calendar,
  DollarSign,
  User,
  Sparkles,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import axiosClient from '../../../api/axiosClient';
import { formatCurrency } from '../../../utils/formatters';
import {
  InvoiceDto,
  GenerateBillingRequestDto,
  AddInvoiceItemRequestDto,
} from '../../../types/finance.types';

export const TuitionCalculationTab: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);

  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDto | null>(null);

  const [isIncidentalModalOpen, setIsIncidentalModalOpen] = useState<boolean>(false);
  const [targetInvoiceForFee, setTargetInvoiceForFee] = useState<InvoiceDto | null>(null);
  const [feeDescription, setFeeDescription] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [feeReason, setFeeReason] = useState<string>('');
  const [submittingFee, setSubmittingFee] = useState<boolean>(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchClasses = async () => {
    try {
      const res = await axiosClient.get('/classes');
      setClassesList((res as any)?.data || res || []);
    } catch (e) {
      // fallback
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        month: selectedMonth,
        year: selectedYear,
      };
      if (selectedClassId !== 'ALL') params.classId = selectedClassId;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm.trim()) params.keyword = searchTerm.trim();

      const res = await financeApi.getInvoices(params);
      setInvoices((res as any)?.data || res || []);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải danh sách học phí.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [selectedMonth, selectedYear, selectedClassId, statusFilter]);

  const handleGenerateBilling = async () => {
    try {
      setGenerating(true);
      const payload: GenerateBillingRequestDto = {
        month: selectedMonth,
        year: selectedYear,
        classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
      };
      const res = await financeApi.generateBilling(payload);
      const data = (res as any)?.data || res;
      showToast(
        'success',
        data.message || `Lập bảng tính học phí tháng ${selectedMonth}/${selectedYear} thành công (MSG-158).`
      );
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'MSG-155: Lỗi khi lập bảng tính học phí.');
    } finally {
      setGenerating(false);
    }
  };

  const openIncidentalModal = (inv: InvoiceDto) => {
    setTargetInvoiceForFee(inv);
    setFeeDescription('');
    setFeeAmount(0);
    setFeeReason('');
    setIsIncidentalModalOpen(true);
  };

  const handleSaveIncidentalFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForFee) return;

    if (!feeDescription.trim()) {
      showToast('error', 'MSG-165: Bỏ trống mô tả hoặc không có căn cứ phát sinh.');
      return;
    }
    if (feeAmount <= 0) {
      showToast('error', 'MSG-164: Số tiền phát sinh không hợp lệ.');
      return;
    }

    const payload: AddInvoiceItemRequestDto = {
      itemDescription: feeDescription.trim(),
      amount: feeAmount,
      reason: feeReason.trim() || undefined,
    };

    try {
      setSubmittingFee(true);
      await financeApi.addIncidentalFee(targetInvoiceForFee.invoiceId, payload);
      showToast('success', 'MSG-145: Thêm khoản phụ phí/phạt phát sinh thành công.');
      setIsIncidentalModalOpen(false);
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể thêm phụ phí.');
    } finally {
      setSubmittingFee(false);
    }
  };

  const totalGross = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalDiscounts = invoices.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
  const totalNet = invoices.reduce((sum, i) => sum + (i.finalAmount || 0), 0);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số phiếu học phí</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{invoices.length} học sinh</p>
          <p className="text-xs text-slate-400 mt-1">Kỳ phí {selectedMonth}/{selectedYear}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự thu gốc</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(totalGross)}</p>
          <p className="text-xs text-slate-400 mt-1">Chưa trừ miễn giảm</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng miễn giảm & ưu đãi</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">-{formatCurrency(totalDiscounts)}</p>
          <p className="text-xs text-slate-400 mt-1">Theo chính sách BR-034</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng thực thu dự kiến</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalNet)}</p>
          <p className="text-xs text-slate-400 mt-1">Trình BGH phê duyệt (G8-UC-06)</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">Toàn trường (Tất cả lớp)</option>
            {classesList.map((c) => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="UNPAID">Chờ thanh toán (UNPAID)</option>
            <option value="PAID">Đã thanh toán (PAID)</option>
            <option value="PARTIAL">Thanh toán một phần (PARTIAL)</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo học sinh, mã..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
              className="pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchInvoices}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleGenerateBilling}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
            [G8-UC-04] Khởi tạo Bảng tính Học phí Tháng
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã thông báo</th>
                <th className="py-3.5 px-4">Học sinh & Lớp</th>
                <th className="py-3.5 px-4">Phụ huynh</th>
                <th className="py-3.5 px-4">Tổng gốc</th>
                <th className="py-3.5 px-4">Miễn giảm</th>
                <th className="py-3.5 px-4">Thực thu</th>
                <th className="py-3.5 px-4">Hạn nộp</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải dữ liệu học phí...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không có thông báo học phí nào cho tháng {selectedMonth}/{selectedYear}.
                    Hãy nhấn <strong>"Khởi tạo Bảng tính Học phí Tháng"</strong> để sinh hóa đơn dự thu tự động.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{inv.studentName}</p>
                      <p className="text-xs text-slate-500">Mã: {inv.studentCode} | Lớp: {inv.className || 'Chưa phân lớp'}</p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-700">{inv.parentName || '—'}</p>
                      <p className="text-slate-400">{inv.parentPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-amber-600">
                      {inv.discountAmount > 0 ? `-${formatCurrency(inv.discountAmount)}` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      {formatCurrency(inv.finalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {inv.dueDate}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === 'PAID' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã thanh toán
                        </span>
                      )}
                      {inv.status === 'UNPAID' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ thanh toán
                        </span>
                      )}
                      {inv.status === 'PARTIAL' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Nộp một phần
                        </span>
                      )}
                      {!['PAID', 'UNPAID', 'PARTIAL'].includes(inv.status) && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                          {inv.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Xem chi tiết khoản mục"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openIncidentalModal(inv)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200/50"
                          title="Thêm phụ phí hoặc phạt phát sinh (G8-UC-05)"
                        >
                          <FilePlus2 className="w-3.5 h-3.5" />
                          + Phụ phí
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

      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Chi tiết thông báo học phí</h3>
                <p className="text-xs text-slate-500">Mã: {viewingInvoice.invoiceCode} — Học sinh: {viewingInvoice.studentName}</p>
              </div>
              <button
                onClick={() => setViewingInvoice(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Lớp:</span>
                  <span className="font-semibold text-slate-800">{viewingInvoice.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phụ huynh:</span>
                  <span className="font-semibold text-slate-800">{viewingInvoice.parentName} ({viewingInvoice.parentPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kỳ tính phí:</span>
                  <span className="font-semibold text-slate-800">Tháng {viewingInvoice.billingMonth}/{viewingInvoice.billingYear}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-600 uppercase mb-2">Các khoản mục chi tiết</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {viewingInvoice.items && viewingInvoice.items.length > 0 ? (
                    viewingInvoice.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-slate-200/80 rounded-xl text-sm">
                        <span className="text-slate-700 font-medium">{item.itemDescription}</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Chưa có chi tiết khoản mục.</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền dự thu gốc:</span>
                  <span>{formatCurrency(viewingInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>Miễn giảm chính sách:</span>
                  <span>-{formatCurrency(viewingInvoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-emerald-700 pt-1 border-t border-slate-200">
                  <span>Tổng thực thu cần đóng:</span>
                  <span>{formatCurrency(viewingInvoice.finalAmount)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-5 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isIncidentalModalOpen && targetInvoiceForFee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">[G8-UC-05] Thêm Khoản Thu / Phạt Phát Sinh</h3>
                <p className="text-xs text-slate-500">Học sinh: {targetInvoiceForFee.studentName} ({targetInvoiceForFee.invoiceCode})</p>
              </div>
              <button
                onClick={() => setIsIncidentalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncidentalFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tên / Mô tả khoản phát sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đền bù hỏng bàn học / Mua thêm đồng phục"
                  value={feeDescription}
                  onChange={(e) => setFeeDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Số tiền phát sinh (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  placeholder="Ví dụ: 150000"
                  value={feeAmount || ''}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Lý do chi tiết & Căn cứ chứng từ (BR-037)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Biên bản xử lý tài sản lớp Mầm 1 ngày 22/10/2026"
                  value={feeReason}
                  onChange={(e) => setFeeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Quy tắc BR-037:</strong> Khoản phát sinh sẽ được cộng dồn trực tiếp vào tổng công nợ tháng của học sinh và cập nhật lại mã VietQR.
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIncidentalModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingFee}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {submittingFee ? 'Đang lưu...' : 'Ghi nhận phát sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TuitionCalculationTab;
