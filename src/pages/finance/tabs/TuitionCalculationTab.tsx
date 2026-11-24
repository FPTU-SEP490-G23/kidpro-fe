import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Pencil,
  Trash2,
  AlertTriangle,
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
  Lock,
  Calculator,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import tuitionSummaryApi from '../../../api/tuitionSummaryApi';
import axiosClient from '../../../api/axiosClient';
import { formatCurrency } from '../../../utils/formatters';
import {
  InvoiceDto,
  ServiceDto,
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
  const [summaryStatus, setSummaryStatus] = useState<string>('DRAFT');

  const isPeriodApproved = summaryStatus === 'APPROVED';

  const [viewingInvoice, setViewingInvoice] = useState<InvoiceDto | null>(null);

  const [isIncidentalModalOpen, setIsIncidentalModalOpen] = useState<boolean>(false);
  const [voluntaryServices, setVoluntaryServices] = useState<ServiceDto[]>([]);
  const [feeMode, setFeeMode] = useState<'VOLUNTARY' | 'CUSTOM'>('VOLUNTARY');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [targetInvoiceForFee, setTargetInvoiceForFee] = useState<InvoiceDto | null>(null);
  const [feeDescription, setFeeDescription] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [feeReason, setFeeReason] = useState<string>('');
  const [submittingFee, setSubmittingFee] = useState<boolean>(false);

  // States for CRUD incidental fees
  const [editingItem, setEditingItem] = useState<{ invoice: InvoiceDto; item: any } | null>(null);
  const [editFeeDescription, setEditFeeDescription] = useState<string>('');
  const [editFeeAmount, setEditFeeAmount] = useState<number>(0);
  const [editFeeReason, setEditFeeReason] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const openEditFeeModal = (invoice: InvoiceDto, item: any) => {
    if (isPeriodApproved) {
      showToast('error', `Bảng học phí tháng ${selectedMonth}/${selectedYear} đã được Ban Giám hiệu phê duyệt và khóa sổ dữ liệu. Không thể chỉnh sửa phụ phí.`);
      return;
    }
    setEditingItem({ invoice, item });
    let desc = item.itemDescription || '';
    let reason = '';
    if (desc.includes(' - Lý do: ')) {
      const parts = desc.split(' - Lý do: ');
      desc = parts[0];
      reason = parts.slice(1).join(' - Lý do: ');
    } else if (desc.includes(' (')) {
      const parts = desc.split(' (');
      desc = parts[0];
      reason = parts[1].replace(/\)$/, '');
    }
    setEditFeeDescription(desc);
    setEditFeeAmount(item.amount || 0);
    setEditFeeReason(reason);
    setIsEditModalOpen(true);
  };

  const handleUpdateIncidentalFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.item.itemId) return;
    if (!editFeeDescription.trim()) {
      showToast('error', 'Bỏ trống mô tả khoản phụ phí.');
      return;
    }
    if (editFeeAmount <= 0) {
      showToast('error', 'Số tiền phát sinh phải lớn hơn 0 VNĐ.');
      return;
    }

    const payload: AddInvoiceItemRequestDto = {
      itemDescription: editFeeDescription.trim(),
      amount: editFeeAmount,
      reason: editFeeReason.trim() || undefined,
    };

    try {
      setSubmittingFee(true);
      await financeApi.updateIncidentalFee(editingItem.invoice.invoiceId, editingItem.item.itemId, payload);
      showToast('success', 'Cập nhật khoản phụ phí thành công.');
      setIsEditModalOpen(false);
      setEditingItem(null);
      if (viewingInvoice && viewingInvoice.invoiceId === editingItem.invoice.invoiceId) {
        // Refresh viewing invoice details
        const refreshed = await financeApi.getInvoiceById(editingItem.invoice.invoiceId);
        setViewingInvoice((refreshed as any)?.data || refreshed);
      }
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể cập nhật phụ phí.');
    } finally {
      setSubmittingFee(false);
    }
  };

  const handleDeleteFee = async (invoice: InvoiceDto, item: any) => {
    if (isPeriodApproved) {
      showToast('error', `Bảng học phí tháng ${selectedMonth}/${selectedYear} đã được Ban Giám hiệu phê duyệt và khóa sổ dữ liệu. Không thể xóa phụ phí.`);
      return;
    }
    if (!item.itemId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khoản phụ phí "${item.itemDescription}" (${formatCurrency(item.amount)}) của học sinh ${invoice.studentName}?\n\nSố tiền này sẽ được khấu trừ ra khỏi tổng hóa đơn.`)) {
      return;
    }

    try {
      await financeApi.deleteIncidentalFee(invoice.invoiceId, item.itemId);
      showToast('success', 'Đã xóa khoản phụ phí và cập nhật lại hóa đơn thành công.');
      if (viewingInvoice && viewingInvoice.invoiceId === invoice.invoiceId) {
        const refreshed = await financeApi.getInvoiceById(invoice.invoiceId);
        setViewingInvoice((refreshed as any)?.data || refreshed);
      }
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể xóa phụ phí.');
    }
  };

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

  const fetchSummaryStatus = async () => {
    try {
      const res = await tuitionSummaryApi.getTuitionSummary({ month: selectedMonth, year: selectedYear });
      const data = (res as any)?.data || res;
      if (!data || data.status === 'NOT_INITIALIZED' || data.status === 'REJECTED' || data.status === 'PENDING_APPROVAL') {
        setSummaryStatus(data?.status || 'DRAFT');
      } else {
        setSummaryStatus(data.status || 'DRAFT');
      }
    } catch (e) {
      setSummaryStatus('DRAFT');
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    // Reset immediately to DRAFT on period switch to avoid holding obsolete APPROVED state
    setSummaryStatus('DRAFT');
    fetchInvoices();
    fetchSummaryStatus();
  }, [selectedMonth, selectedYear, selectedClassId, statusFilter]);

  useEffect(() => {
    financeApi.getServices().then((res: any) => {
      const list: ServiceDto[] = Array.isArray(res) ? res : (res?.data || []);
      const voluntary = list.filter(s => !s.isMandatory || s.serviceName.includes('CLB') || s.serviceName.toLowerCase().includes('buýt') || s.serviceName.toLowerCase().includes('xe'));
      setVoluntaryServices(voluntary);
    }).catch(() => {});
  }, []);

  const handleGenerateBilling = async () => {
    if (isPeriodApproved) {
      showToast('error', `Bảng học phí tháng ${selectedMonth}/${selectedYear} đã được Ban Giám hiệu phê duyệt và khóa sổ dữ liệu. Không thể khởi tạo lại.`);
      return;
    }
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
        data.message || `Lập bảng tính học phí tháng ${selectedMonth}/${selectedYear} thành công.`
      );
      fetchInvoices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi lập bảng tính học phí.');
    } finally {
      setGenerating(false);
    }
  };

  const openIncidentalModal = (inv: InvoiceDto) => {
    if (isPeriodApproved) {
      showToast('error', `Bảng học phí tháng ${selectedMonth}/${selectedYear} đã được Ban Giám hiệu phê duyệt và khóa sổ dữ liệu. Không thể thêm phụ phí.`);
      return;
    }
    setTargetInvoiceForFee(inv);
    setFeeMode('VOLUNTARY');
    setSelectedServiceId('');
    setFeeDescription('');
    setFeeAmount(0);
    setFeeReason('');
    setIsIncidentalModalOpen(true);
  };

  const handleSelectVoluntaryService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const found = voluntaryServices.find(s => s.serviceId === serviceId);
    if (found) {
      setFeeDescription(found.serviceName);
      setFeeAmount(found.unitPrice || 0);
      setFeeReason('Đăng ký tự nguyện theo biểu phí hệ thống');
    } else {
      setFeeDescription('');
      setFeeAmount(0);
      setFeeReason('');
    }
  };

  const handleSaveIncidentalFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForFee) return;

    if (!feeDescription.trim()) {
      showToast('error', 'Bỏ trống mô tả hoặc không có căn cứ phát sinh.');
      return;
    }
    if (feeAmount <= 0) {
      showToast('error', 'Số tiền phát sinh không hợp lệ.');
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
      showToast('success', 'Thêm khoản phụ phí/phạt phát sinh thành công.');
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

      {isPeriodApproved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 text-emerald-900 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700 flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Học phí Tháng {selectedMonth}/{selectedYear} đã được Ban Giám hiệu phê duyệt</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/80 text-emerald-800">
                  ĐÃ KHÓA SỔ DỮ LIỆU
                </span>
              </div>
              <p className="text-xs text-emerald-700/90 mt-0.5">
                Bảng tính đã được chốt chính thức và phê duyệt bởi Ban Giám hiệu. Mọi thao tác tính lại học phí, thêm, chỉnh sửa hoặc xóa phụ phí đều bị vô hiệu hóa để bảo đảm nguồn thu không bị sai lệch.
              </p>
            </div>
          </div>
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
          <p className="text-xs text-slate-400 mt-1">Theo chính sách quy định</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng thực thu dự kiến</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalNet)}</p>
          <p className="text-xs text-slate-400 mt-1">Trình BGH phê duyệt</p>
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
            <option value="PARTIAL">Nộp thiếu (PARTIAL)</option>
            <option value="OVERPAID">Nộp thừa (OVERPAID)</option>
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
            disabled={generating || isPeriodApproved}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-sm transition-all ${
              isPeriodApproved
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50'
            }`}
            title={isPeriodApproved ? `Học phí tháng ${selectedMonth}/${selectedYear} đã được BGH phê duyệt và khóa sổ dữ liệu` : 'Khởi tạo Bảng tính Học phí Tháng'}
          >
            {generating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isPeriodApproved ? (
              <Lock className="w-4 h-4 text-slate-400" />
            ) : (
              <Cpu className="w-4 h-4" />
            )}
            {isPeriodApproved ? 'Học phí đã khóa sổ' : 'Khởi tạo Bảng tính Học phí Tháng'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Mã thông báo</th>
                <th className="py-3.5 px-4 min-w-[200px] max-w-[280px]">Học sinh & Lớp</th>
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
                    <td className="py-3.5 px-4 min-w-[200px] max-w-[280px]">
                      <p className="font-semibold text-slate-800">{inv.studentName}</p>
                      <p className="text-xs text-slate-500">Mã: {inv.studentCode} | Lớp: {inv.className || 'Chưa phân lớp'}</p>
                      {/* Hiển thị chi tiết phụ phí phát sinh & các khoản tự nguyện ở màn hình chính */}
                      {(() => {
                        const isCoreMandatory = (desc: string) => {
                          const d = (desc || '').toLowerCase();
                          return (d.includes('học phí') && !d.includes('đón muộn')) ||
                                 (d.includes('tiền ăn') && !d.includes('giảm trừ') && !d.includes('nghỉ')) ||
                                 (d.includes('bán trú') && !d.includes('giảm trừ') && !d.includes('nghỉ') && !d.includes('buýt')) ||
                                 d.includes('chăm sóc');
                        };

                        const incidentalItems = (inv.items || []).filter(item => {
                          const desc = item.itemDescription || '';
                          return !isCoreMandatory(desc);
                        });
                        if (incidentalItems.length === 0) return null;
                        return (
                          <div className="mt-2 space-y-1.5">
                            {incidentalItems.map((itm, itmIdx) => {
                              const isRefund = itm.amount < 0 || itm.itemDescription.toLowerCase().includes('giảm trừ');
                              const isPolicyDiscount = itm.amount < 0 && (itm.itemDescription.toLowerCase().includes('miễn giảm') || itm.itemDescription.toLowerCase().includes('ưu đãi'));
                              const isVoluntary = !isRefund && (itm.itemDescription.includes('CLB') || itm.itemDescription.includes('buýt') || itm.itemDescription.includes('tự nguyện'));
                              
                              let cardClass = 'bg-amber-50/90 border border-amber-200/90 text-amber-900';
                              let textClass = 'text-amber-800';
                              if (isPolicyDiscount) {
                                cardClass = 'bg-amber-50/90 border border-amber-200/90 text-amber-900';
                                textClass = 'text-amber-800';
                              } else if (isRefund) {
                                cardClass = 'bg-emerald-50/90 border border-emerald-200/90 text-emerald-900';
                                textClass = 'text-emerald-800';
                              } else if (isVoluntary) {
                                cardClass = 'bg-purple-50/90 border border-purple-200/90 text-purple-900';
                                textClass = 'text-purple-800';
                              }

                              return (
                                <div
                                  key={itm.itemId || itmIdx}
                                  className={`p-2 rounded-lg text-xs group shadow-2xs ${cardClass}`}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      {isRefund ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                      ) : isVoluntary ? (
                                        <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                                      ) : (
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                      )}
                                      <span>{itm.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(itm.amount))}</span>
                                    </div>
                                    {!isPeriodApproved && itm.amount > 0 && !itm.itemDescription.toLowerCase().includes('đón muộn') && (
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openEditFeeModal(inv, itm)}
                                          className="p-1 hover:bg-slate-200/80 text-indigo-700 rounded transition"
                                          title="Sửa khoản này"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteFee(inv, itm)}
                                          className="p-1 hover:bg-rose-200/80 text-rose-700 rounded transition"
                                          title="Xóa khoản ghi nhầm"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className={`mt-1 text-[11px] leading-snug break-words whitespace-normal pl-5 ${textClass}`}
                                  >
                                    {itm.itemDescription}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-700">{inv.parentName || '—'}</p>
                      <p className="text-slate-400">{inv.parentPhone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-amber-600">
                      {inv.discountAmount > 0 ? (
                        <div>
                          <p className="font-semibold text-sm">-{formatCurrency(inv.discountAmount)}</p>
                          {(() => {
                            const pName = inv.discountPolicyName || (() => {
                              const pItem = (inv.items || []).find(
                                i => i.amount < 0 && (i.itemDescription.toLowerCase().includes('miễn giảm') || i.itemDescription.toLowerCase().includes('ưu đãi'))
                              );
                              return pItem ? pItem.itemDescription.replace(/^(Miễn giảm chính sách:\s*|Miễn giảm:\s*)/i, '') : null;
                            })();
                            if (pName) {
                              return <p className="text-[11px] text-amber-700/80 font-normal leading-tight mt-0.5">{pName}</p>;
                            }
                            return null;
                          })()}
                        </div>
                      ) : '—'}
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
                      {inv.status === 'OVERPAID' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Nộp thừa
                        </span>
                      )}
                      {(inv.status === 'PARTIAL' || inv.status === 'UNDERPAID') && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Nộp thiếu
                        </span>
                      )}
                      {inv.status === 'UNPAID' && (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ thanh toán
                        </span>
                      )}
                      {!['PAID', 'OVERPAID', 'PARTIAL', 'UNDERPAID', 'UNPAID'].includes(inv.status) && (
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
                          disabled={isPeriodApproved}
                          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                            isPeriodApproved
                              ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-50'
                              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200/50'
                          }`}
                          title={isPeriodApproved ? 'BGH đã phê duyệt bảng học phí, không thể thêm phụ phí' : 'Thêm phụ phí hoặc phạt phát sinh'}
                        >
                          {isPeriodApproved ? <Lock className="w-3 h-3 text-slate-400" /> : <FilePlus2 className="w-3.5 h-3.5" />}
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
                    viewingInvoice.items.map((item, idx) => {
                      const isNegative = item.amount < 0;
                      const isRefundOrDiscount = isNegative || item.itemDescription.toLowerCase().includes('giảm trừ') || item.itemDescription.toLowerCase().includes('miễn giảm');
                      const isIncidental = !isRefundOrDiscount && item.amount > 0 && !item.itemDescription.toLowerCase().includes('đón muộn') && (
                        item.itemDescription.includes('Lý do:') ||
                        item.itemDescription.includes('Phụ phí') ||
                        item.itemDescription.includes('Phạt') ||
                        item.itemDescription.includes('Đền bù') ||
                        item.itemDescription.includes('CLB') ||
                        (!item.itemDescription.includes('Học phí') && !item.itemDescription.includes('Tiền ăn'))
                      );

                      return (
                        <div key={idx} className={`flex justify-between items-center p-2.5 rounded-xl text-sm border ${
                          isNegative 
                            ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900' 
                            : 'bg-white border-slate-200/80 text-slate-700'
                        }`}>
                          <div className="flex-1 mr-3">
                            <span className="font-medium block">{item.itemDescription}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isNegative ? 'text-emerald-700' : 'text-slate-900'}`}>
                              {item.amount < 0 ? `-${formatCurrency(Math.abs(item.amount))}` : formatCurrency(item.amount)}
                            </span>
                            {!isPeriodApproved && isIncidental && item.itemId && (
                              <div className="flex items-center gap-1 ml-2 border-l pl-2 border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => openEditFeeModal(viewingInvoice, item)}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                  title="Chỉnh sửa phụ phí"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFee(viewingInvoice, item)}
                                  className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                                  title="Xóa phụ phí"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                {(() => {
                  const policyItems = (viewingInvoice.items || []).filter(
                    i => i.amount < 0 && (i.itemDescription.toLowerCase().includes('miễn giảm') || i.itemDescription.toLowerCase().includes('ưu đãi'))
                  );
                  const refundItems = (viewingInvoice.items || []).filter(
                    i => i.amount < 0 && (i.itemDescription.toLowerCase().includes('tiền ăn') || i.itemDescription.toLowerCase().includes('nghỉ'))
                  );

                  const policyName = viewingInvoice.discountPolicyName || (policyItems.length > 0
                    ? policyItems.map(p => p.itemDescription.replace(/^(Miễn giảm chính sách:\s*|Miễn giảm:\s*)/i, '')).join(', ')
                    : '');

                  if (policyItems.length > 0 || refundItems.length > 0) {
                    return (
                      <>
                        {policyItems.length > 0 ? (
                          policyItems.map((p, pIdx) => {
                            const cleanName = p.itemDescription.replace(/^(Miễn giảm chính sách:\s*|Miễn giảm:\s*)/i, '');
                            return (
                              <div key={pIdx} className="flex justify-between text-amber-600">
                                <span>Miễn giảm chính sách ({cleanName}):</span>
                                <span className="font-medium">-{formatCurrency(Math.abs(p.amount))}</span>
                              </div>
                            );
                          })
                        ) : (
                          viewingInvoice.discountAmount > 0 && refundItems.length > 0 && (
                            <div className="flex justify-between text-amber-600">
                              <span>Miễn giảm chính sách{policyName ? ` (${policyName})` : ''}:</span>
                              <span className="font-medium">
                                -{formatCurrency(Math.max(0, viewingInvoice.discountAmount - refundItems.reduce((acc, r) => acc + Math.abs(r.amount), 0)))}
                              </span>
                            </div>
                          )
                        )}
                        {refundItems.map((r, rIdx) => (
                          <div key={rIdx} className="flex justify-between text-emerald-600">
                            <span>Giảm trừ tiền ăn nghỉ phép:</span>
                            <span className="font-medium">-{formatCurrency(Math.abs(r.amount))}</span>
                          </div>
                        ))}
                      </>
                    );
                  }

                  if (viewingInvoice.discountAmount > 0) {
                    return (
                      <div className="flex justify-between text-amber-600">
                        <span>Miễn giảm chính sách{policyName ? ` (${policyName})` : ''}:</span>
                        <span className="font-medium">-{formatCurrency(viewingInvoice.discountAmount)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
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
                <h3 className="text-base font-bold text-slate-800">Thêm Khoản Thu / Phạt Phát Sinh</h3>
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
              {/* Chọn chế độ khoản thu */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setFeeMode('VOLUNTARY');
                    setFeeDescription('');
                    setFeeAmount(0);
                    setFeeReason('');
                    setSelectedServiceId('');
                  }}
                  className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                    feeMode === 'VOLUNTARY'
                      ? 'bg-white text-indigo-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ⭐ Khoản tự nguyện có sẵn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeeMode('CUSTOM');
                    setFeeDescription('');
                    setFeeAmount(0);
                    setFeeReason('');
                    setSelectedServiceId('');
                  }}
                  className={`flex-1 py-2 rounded-lg transition text-center cursor-pointer ${
                    feeMode === 'CUSTOM'
                      ? 'bg-white text-indigo-700 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ⚠️ Phụ phí / Phạt phát sinh
                </button>
              </div>

              {feeMode === 'VOLUNTARY' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Chọn dịch vụ tự nguyện / CLB Ngoại khóa <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => handleSelectVoluntaryService(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn dịch vụ tự nguyện từ biểu phí --</option>
                      {voluntaryServices.map((svc) => (
                        <option key={svc.serviceId} value={svc.serviceId}>
                          {svc.serviceName} ({formatCurrency(svc.unitPrice)})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Hệ thống tự động tra cứu từ danh mục dịch vụ tự nguyện & lớp CLB ngoại khóa sẵn có.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Đơn giá tự động cộng vào hóa đơn (VNĐ)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formatCurrency(feeAmount)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-100 font-bold text-indigo-700 border border-slate-200 rounded-xl cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Ghi chú / Căn cứ đăng ký
                    </label>
                    <input
                      type="text"
                      value={feeReason}
                      onChange={(e) => setFeeReason(e.target.value)}
                      placeholder="Ví dụ: Đăng ký tự nguyện theo phiếu thỏa thuận phụ huynh"
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Tên / Mô tả khoản phát sinh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Đền bù hỏng bàn học / Phí phạt đón muộn sau 18h"
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
                      min={0}
                      step="any"
                      placeholder="Ví dụ: 150000"
                      value={feeAmount || ''}
                      onChange={(e) => setFeeAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                      Lý do chi tiết & Căn cứ chứng từ <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Ví dụ: Biên bản xử lý tài sản lớp Mầm 1 ngày 22/10/2026"
                      value={feeReason}
                      onChange={(e) => setFeeReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Quy tắc:</strong> Khoản phát sinh sẽ được cộng dồn trực tiếp vào tổng công nợ tháng của học sinh và cập nhật lại mã VietQR.
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
      {/* Modal Chỉnh Sửa Phụ Phí */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">Chỉnh Sửa Phụ Phí / Phạt Phát Sinh</h3>
                <p className="text-xs text-slate-500">Học sinh: {editingItem.invoice.studentName} ({editingItem.invoice.invoiceCode})</p>
              </div>
              <button
                onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateIncidentalFee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tên / Mô tả khoản phát sinh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đền bù hỏng bàn học / Mua thêm đồng phục"
                  value={editFeeDescription}
                  onChange={(e) => setEditFeeDescription(e.target.value)}
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
                  min={0}
                  step="any"
                  placeholder="Ví dụ: 150000"
                  value={editFeeAmount || ''}
                  onChange={(e) => setEditFeeAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Lý do chi tiết & Căn cứ chứng từ
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Biên bản xử lý tài sản lớp Mầm 1 ngày 22/10/2026"
                  value={editFeeReason}
                  onChange={(e) => setEditFeeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
                <strong>Chỉnh sửa trường hợp ghi nhầm:</strong> Số tiền chênh lệch sẽ được tự động cộng/trừ vào tổng hóa đơn và cập nhật lại mã VietQR tương ứng.
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingFee}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm"
                >
                  {submittingFee ? 'Đang lưu...' : 'Lưu thay đổi'}
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
