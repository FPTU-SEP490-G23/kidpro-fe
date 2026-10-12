import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Send,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  PauseCircle,
  FileSpreadsheet,
  X,
  CreditCard,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import { DynamicInvoice, VietQrInvoiceData } from '../../../types/finance.types';
import { useBulkIssueInvoices } from '../../../hooks/useBulkIssueInvoices';

export const BulkInvoiceIssuanceTab: React.FC = () => {
  // Bộ lọc
  const [selectedPeriod, setSelectedPeriod] = useState<string>('10-2026');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Hạn thanh toán (Mặc định ngày 15/11/2026 - đảm bảo >= 10 ngày lịch theo BR-044/BR-060)
  const [dueDate, setDueDate] = useState<string>('2026-11-15');

  // Checkbox chọn nhiều hóa đơn
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Modal xác nhận phát hành
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [principalPin, setPrincipalPin] = useState<string>('686868'); // Mặc định mã PIN ký số demo
  const [sendFcmNotification, setSendFcmNotification] = useState<boolean>(true);
  const [createPaperNotices, setCreatePaperNotices] = useState<boolean>(true);
  const [isQueueSimulated, setIsQueueSimulated] = useState<boolean>(false);

  // Modal xem chi tiết hóa đơn & VietQR
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<DynamicInvoice | null>(null);
  const [vietQrData, setVietQrData] = useState<VietQrInvoiceData | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState<boolean>(false);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tải danh sách hóa đơn của kỳ tính phí
  const { data: invoicesData = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dynamic-invoices', selectedPeriod],
    queryFn: async () => {
      try {
        const resp = await financeApi.getOverdueInvoices();
        return (resp.data || []) as unknown as DynamicInvoice[];
      } catch {
        return [];
      }
    },
  });

  const allInvoices = useMemo(() => invoicesData || [], [invoicesData]);

  // Lọc danh sách
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      const matchClass = selectedClassId === 'ALL' || inv.className.includes(selectedClassId);
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchKeyword =
        !searchKeyword ||
        inv.studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        inv.studentId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        inv.paymentReferenceCode.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchClass && matchStatus && matchKeyword;
    });
  }, [allInvoices, selectedClassId, statusFilter, searchKeyword]);

  // Thống kê đợt phát hành
  const stats = useMemo(() => {
    const draftInvoices = allInvoices.filter((i) => i.status === 'DRAFT');
    const issuedInvoices = allInvoices.filter((i) => i.status === 'ISSUED');
    const totalExpectedRevenue = draftInvoices.reduce((acc, i) => acc + i.netPayableAmount, 0);
    const totalDeductions = draftInvoices.reduce(
      (acc, i) => acc + i.mealRefundTotal + i.siblingDiscountAmount + i.otherDiscountAmount,
      0
    );

    return {
      draftCount: draftInvoices.length,
      issuedCount: issuedInvoices.length,
      totalExpectedRevenue,
      totalDeductions,
    };
  }, [allInvoices]);

  // Mutation phát hành hàng loạt qua Custom Hook
  const bulkIssueMutation = useBulkIssueInvoices();

  // Xử lý chọn/bỏ chọn checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const draftIds = filteredInvoices.filter((i) => i.status === 'DRAFT').map((i) => i.id);
      setSelectedIds(draftIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // Kiểm tra tính hợp lệ trước khi mở Modal ký duyệt
  const handleOpenConfirmModal = () => {
    if (selectedIds.length === 0) {
      showToast('warning', 'Vui lòng chọn ít nhất 1 hóa đơn nháp để phát hành.');
      return;
    }

    // BR-044, BR-060: Hạn thanh toán học phí bắt buộc tối thiểu 10 ngày lịch kể từ ngày phát hành (hôm nay)
    const today = new Date();
    const targetDue = new Date(dueDate);
    const diffTime = targetDue.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 10) {
      showToast(
        'error',
        'MSG-155: Hạn nộp học phí bắt buộc phải dành cho phụ huynh tối thiểu 10 ngày lịch để chuẩn bị.'
      );
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Thực hiện Ký duyệt & Phát hành
  const handleExecuteBulkIssuance = async () => {
    if (!principalPin.trim()) {
      showToast('warning', 'Vui lòng nhập mã PIN ký số của Hiệu trưởng / Kế toán trưởng.');
      return;
    }

    try {
      await bulkIssueMutation.mutateAsync({
        invoiceIds: selectedIds,
        dueDate,
        billingPeriod: selectedPeriod,
        principalPin,
        sendFcmNotification,
        createPaperNoticesForOffline: createPaperNotices,
      });

      setIsConfirmModalOpen(false);

      if (isQueueSimulated) {
        showToast(
          'info',
          'MSG-154: Hệ thống đang xếp hàng tạo mã QR ngầm. Hóa đơn sẽ được gửi tới phụ huynh trong ít phút.'
        );
      } else {
        showToast(
          'success',
          `MSG-153: Đã phát hành ${selectedIds.length} hóa đơn thành công. Đã tạo và gửi mã thanh toán VietQR`
        );
      }

      if (createPaperNotices) {
        setTimeout(() => {
          showToast(
            'info',
            'MSG-156: Hóa đơn đã phát hành; đã tạo danh sách in phiếu báo giấy cho 2 học sinh chưa có app.'
          );
        }, 1500);
      }

      setSelectedIds([]);
      refetch();
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Giữ lại hóa đơn để tra soát (On-Hold)
  const handleHoldInvoice = async (invoice: DynamicInvoice) => {
    try {
      await financeApi.holdInvoiceVerification(invoice.id, 'Cần đối soát lại đơn nghỉ phép hoặc phụ phí');
      showToast('info', `Đã chuyển hóa đơn ${invoice.invoiceNumber} sang trạng thái Tạm giữ tra soát.`);
      refetch();
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Xem chi tiết hóa đơn & lấy VietQR
  const handleViewInvoiceDetail = async (invoice: DynamicInvoice) => {
    setSelectedInvoiceForDetail(invoice);
    setIsLoadingQr(true);
    try {
      const res = await financeApi.getInvoiceVietQr(invoice.id);
      setVietQrData(res.data);
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsLoadingQr(false);
    }
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
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-[#DC2626]" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
          {toastMessage.type === 'info' && <Sparkles className="h-5 w-5 shrink-0 text-blue-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER PHÂN HỆ UC-037 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#275A4E]/10 text-[#275A4E]">
            <QrCode className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>UC-037 • Phê Duyệt & Phát Hành VietQR Hàng Loạt</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Ký Duyệt Bảng Kê & Phát Hành Mã Thanh Toán VietQR
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Rà soát hóa đơn dự thảo (DRAFT), ký số điện tử của BGH, nhúng mã tham chiếu Napas247,
            chuyển trạng thái sang ISSUED và đẩy thông báo tức thì về App Phụ huynh (BR-044, BR-060, BR-062).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* THẺ THỐNG KÊ ĐỢT PHÁT HÀNH */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Hóa đơn chờ duyệt</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-800">
              {stats.draftCount} <span className="text-sm font-semibold text-slate-500">hóa đơn</span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Trạng thái DRAFT (Nháp)</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#275A4E]/20 bg-gradient-to-br from-white to-[#275A4E]/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#275A4E]">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng tiền dự thu</span>
            <div className="h-8 w-8 rounded-xl bg-[#275A4E]/10 text-[#275A4E] flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#275A4E]">
              {formatCurrency(stats.totalExpectedRevenue)}
            </div>
            <p className="text-[11px] text-[#275A4E]/80 mt-0.5">Thực thu sau giảm trừ</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Giảm trừ & Hoàn ăn</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              - {formatCurrency(stats.totalDeductions)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Hoàn ăn bán trú + anh chị em</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Đã phát hành</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {stats.issuedCount} <span className="text-sm font-semibold text-slate-500">hóa đơn</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Đã nhúng mã VietQR PayOS</p>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN & HÀNH ĐỘNG PHÁT HÀNH HÀNG LOẠT */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Chọn Kỳ Tháng */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
              <span className="text-xs font-bold text-slate-600">Kỳ học phí:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-[#1E4D40] outline-hidden cursor-pointer"
              >
                <option value="10-2026">Tháng 10/2026</option>
                <option value="09-2026">Tháng 09/2026</option>
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
                <option value="ALL">Toàn Trường</option>
                <option value="Mầm 1">Mầm 1</option>
                <option value="Chồi 2">Chồi 2</option>
                <option value="Lá 1">Lá 1</option>
              </select>
            </div>

            {/* Lọc Trạng thái */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
              <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 outline-hidden cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Chờ duyệt (DRAFT)</option>
                <option value="ISSUED">Đã phát hành (ISSUED)</option>
              </select>
            </div>

            {/* Thiết lập Hạn nộp học phí */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
              <Calendar className="h-4 w-4 text-[#275A4E]" />
              <span className="text-xs font-bold text-slate-600">Hạn nộp (≥ 10 ngày):</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-transparent font-bold text-xs sm:text-sm text-slate-800 outline-hidden cursor-pointer"
              />
            </div>
          </div>

          {/* Ô Tìm Kiếm */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã bé, VietQR..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#275A4E] focus:outline-hidden transition"
            />
          </div>
        </div>

        {/* Cụm Nút Hành Động Phát Hành */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
            <span>
              Đang chọn: <strong className="text-[#275A4E]">{selectedIds.length}</strong> /{' '}
              {filteredInvoices.filter((i) => i.status === 'DRAFT').length} hóa đơn nháp
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
              className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition disabled:opacity-50"
            >
              Bỏ chọn tất cả
            </button>

            <button
              onClick={handleOpenConfirmModal}
              disabled={selectedIds.length === 0 || bulkIssueMutation.isPending}
              className="h-11 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition min-w-[200px] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Ký Duyệt & Phát Hành ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* BẢNG RÀ SOÁT HÓA ĐƠN PHÁT HÀNH */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Bảng Danh Sách Bảng Kê Học Phí Kỳ {selectedPeriod}
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {filteredInvoices.length} bản ghi
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#275A4E] animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải danh sách hóa đơn học phí...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileSpreadsheet className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">Không có hóa đơn nào thỏa mãn điều kiện lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredInvoices.filter((i) => i.status === 'DRAFT').length > 0 &&
                        selectedIds.length === filteredInvoices.filter((i) => i.status === 'DRAFT').length
                      }
                      className="rounded-md border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                    />
                  </th>
                  <th className="py-3.5 px-4">Mã Bé</th>
                  <th className="py-3.5 px-4">Họ & Tên Trẻ</th>
                  <th className="py-3.5 px-4">Lớp Học</th>
                  <th className="py-3.5 px-4 text-right">Học Phí Gốc</th>
                  <th className="py-3.5 px-4 text-right">Hoàn Ăn</th>
                  <th className="py-3.5 px-4 text-right">Chiết Khấu</th>
                  <th className="py-3.5 px-4 text-right">Đón Muộn</th>
                  <th className="py-3.5 px-4 text-right">Thực Nộp</th>
                  <th className="py-3.5 px-4 text-center">Mã VietQR</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-slate-50/60 transition group ${
                      selectedIds.includes(inv.id) ? 'bg-[#275A4E]/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {inv.status === 'DRAFT' ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inv.id)}
                          onChange={() => handleToggleSelectRow(inv.id)}
                          className="rounded-md border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                        />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {inv.studentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-[#1E4D40] block">{inv.studentName}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{inv.invoiceNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-600">
                      {inv.className}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      {formatCurrency(inv.baseTuition + inv.serviceFees)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                      {inv.mealRefundTotal > 0 ? `-${formatCurrency(inv.mealRefundTotal)}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-purple-700">
                      {inv.siblingDiscountAmount + inv.otherDiscountAmount > 0
                        ? `-${formatCurrency(inv.siblingDiscountAmount + inv.otherDiscountAmount)}`
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#E5A93C]">
                      {inv.latePickupFeeTotal > 0 ? `+${formatCurrency(inv.latePickupFeeTotal)}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-base text-[#275A4E]">
                      {formatCurrency(inv.netPayableAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs font-bold text-slate-600">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200">
                        {inv.paymentReferenceCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {inv.status === 'DRAFT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="h-3 w-3" />
                          DRAFT
                        </span>
                      )}
                      {inv.status === 'ISSUED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          ISSUED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewInvoiceDetail(inv)}
                          className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-[#275A4E] text-slate-700 hover:text-white font-bold text-xs inline-flex items-center gap-1 transition"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        {inv.status === 'DRAFT' && (
                          <button
                            onClick={() => handleHoldInvoice(inv)}
                            title="Tách riêng để tra soát thêm"
                            className="h-8 px-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-purple-700 text-xs transition"
                          >
                            <PauseCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN KÝ DUYỆT & PHÁT HÀNH HÀNG LOẠT */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#275A4E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Xác Nhận Ký Duyệt & Phát Hành</h3>
                  <p className="text-xs text-white/80">Quy trình cấp mã VietQR & đẩy thông báo App</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span>Số lượng phát hành:</span>
                  <strong className="text-slate-900">{selectedIds.length} hóa đơn</strong>
                </div>
                <div className="flex justify-between">
                  <span>Kỳ quyết toán:</span>
                  <strong className="text-[#275A4E]">{selectedPeriod}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Hạn thanh toán áp dụng:</span>
                  <strong className="text-slate-900">{dueDate}</strong>
                </div>
              </div>

              {/* Nhập mã PIN ký số */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block">
                  Mã PIN Ký Số Điện Tử (BGH / Kế toán trưởng):
                </label>
                <input
                  type="password"
                  placeholder="Nhập mã PIN 6 số..."
                  value={principalPin}
                  onChange={(e) => setPrincipalPin(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold tracking-widest text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              {/* Các tùy chọn thông báo */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendFcmNotification}
                    onChange={(e) => setSendFcmNotification(e.target.checked)}
                    className="rounded-md border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                  />
                  <span className="font-bold text-slate-800">
                    Gửi thông báo đẩy (FCM Push Notification) về điện thoại phụ huynh
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createPaperNotices}
                    onChange={(e) => setCreatePaperNotices(e.target.checked)}
                    className="rounded-md border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                  />
                  <span className="font-medium text-slate-600">
                    Tạo danh sách in phiếu báo giấy cho phụ huynh chưa kích hoạt App (MSG-156)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isQueueSimulated}
                    onChange={(e) => setIsQueueSimulated(e.target.checked)}
                    className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-500">
                    Mô phỏng hàng đợi cổng thanh toán PayOS xử lý ngầm (MSG-154)
                  </span>
                </label>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Lưu ý: Sau khi phát hành (ISSUED), số tiền trên hóa đơn sẽ bị khóa cứng (BR-062).
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteBulkIssuance}
                disabled={bulkIssueMutation.isPending}
                className="h-11 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black flex items-center gap-2 shadow-md transition"
              >
                {bulkIssueMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Xác Nhận Ký Số & Ban Hành</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT HÓA ĐƠN & MÃ VIETQR */}
      {selectedInvoiceForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#78C2AD] block">
                  Bảng Kê Chi Tiết & Mã Thanh Toán VietQR
                </span>
                <h3 className="text-xl font-black">{selectedInvoiceForDetail.studentName}</h3>
                <p className="text-xs text-white/80">
                  {selectedInvoiceForDetail.className} • Hóa đơn: {selectedInvoiceForDetail.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Thẻ VietQR & Thông tin Napas */}
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                <div className="h-44 w-44 rounded-2xl bg-white p-2 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                  {isLoadingQr ? (
                    <RefreshCw className="h-8 w-8 text-[#275A4E] animate-spin" />
                  ) : vietQrData?.qrCodeUrl ? (
                    <img
                      src={vietQrData.qrCodeUrl}
                      alt="VietQR Napas247"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <QrCode className="h-20 w-20 text-slate-300" />
                  )}
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-700 w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#78C2AD]/20 text-[#1E4D40]">
                    <Sparkles className="h-3.5 w-3.5 text-[#275A4E]" />
                    <span>VietQR Napas247 • PayOS Tự Động Gạch Nợ</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Ngân hàng:</p>
                    <p className="font-extrabold text-slate-800">MB Bank (Ngân hàng Quân Đội)</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Số tài khoản & Tên thụ hưởng:</p>
                    <p className="font-mono font-black text-slate-900">0987654321</p>
                    <p className="text-xs font-bold text-slate-700">TRƯỜNG MẦM NON QUỐC TẾ KIDPRO</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Cú pháp thanh toán duy nhất:</p>
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200 inline-block">
                      {selectedInvoiceForDetail.paymentReferenceCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bảng Chi Tiết Khoản Mục */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Bóc Tách Các Khoản Thu & Khấu Trừ
                </h4>

                <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs sm:text-sm">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Học phí cơ bản khối mầm non:</span>
                    <strong className="font-mono text-slate-800">
                      {formatCurrency(selectedInvoiceForDetail.baseTuition)}
                    </strong>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-600">Phí dịch vụ & Tiền ăn bán trú:</span>
                    <strong className="font-mono text-slate-800">
                      {formatCurrency(selectedInvoiceForDetail.serviceFees)}
                    </strong>
                  </div>
                  <div className="p-3 flex justify-between bg-emerald-50/50">
                    <span className="text-emerald-800 font-bold">
                      Hoàn tiền ăn ({selectedInvoiceForDetail.excusedDaysCount} ngày nghỉ hợp lệ):
                    </span>
                    <strong className="font-mono text-emerald-700">
                      -{formatCurrency(selectedInvoiceForDetail.mealRefundTotal)}
                    </strong>
                  </div>
                  {selectedInvoiceForDetail.latePickupFeeTotal > 0 && (
                    <div className="p-3 flex justify-between bg-amber-50/50">
                      <span className="text-amber-800 font-bold">
                        Phụ phí đón muộn ({selectedInvoiceForDetail.lateMinutesCount} phút):
                      </span>
                      <strong className="font-mono text-amber-700">
                        +{formatCurrency(selectedInvoiceForDetail.latePickupFeeTotal)}
                      </strong>
                    </div>
                  )}
                  {selectedInvoiceForDetail.siblingDiscountAmount > 0 && (
                    <div className="p-3 flex justify-between bg-purple-50/50">
                      <span className="text-purple-800 font-bold">Chiết khấu anh chị em ruột:</span>
                      <strong className="font-mono text-purple-700">
                        -{formatCurrency(selectedInvoiceForDetail.siblingDiscountAmount)}
                      </strong>
                    </div>
                  )}
                  <div className="p-4 flex justify-between bg-slate-50 items-center">
                    <span className="font-extrabold text-slate-800 text-sm">Tổng Số Tiền Thực Nộp:</span>
                    <span className="font-mono font-black text-xl text-[#275A4E]">
                      {formatCurrency(selectedInvoiceForDetail.netPayableAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Hạn chót thanh toán: {dueDate}</span>
              <button
                onClick={() => setSelectedInvoiceForDetail(null)}
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

export default BulkInvoiceIssuanceTab;
