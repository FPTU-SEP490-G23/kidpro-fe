import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Printer,
  ShieldCheck,
  User,
  Phone,
  Receipt,
  RotateCcw,
  RefreshCw,
  X,
  FileCheck2
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import { academicApi } from '../../../api/academicApi';
import {
  DynamicInvoice,
  CashPaymentReceipt,
  PaymentMethod
} from '../../../types/finance.types';
import { useManualCashClearance } from '../../../hooks/useManualCashClearance';

export const CashCollectionTab: React.FC = () => {
  // Tìm kiếm học sinh
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Học sinh đang chọn
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    code: string;
    className: string;
    parentName: string;
    parentPhone: string;
    prepaidCredit: number;
    avatarUrl?: string;
  } | null>(null);

  // Hóa đơn đang chọn để gạch nợ
  const [selectedInvoice, setSelectedInvoice] = useState<DynamicInvoice | null>(null);

  // Form thu tiền
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('Phụ huynh nộp trực tiếp tại phòng tài vụ');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);

  // Modal Biên lai điện tử
  const [activeReceipt, setActiveReceipt] = useState<CashPaymentReceipt | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Modal Kiểm quỹ cuối ngày (Daily Cash Audit)
  const [isCashAuditModalOpen, setIsCashAuditModalOpen] = useState<boolean>(false);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [countedPos, setCountedPos] = useState<number>(0);
  const [auditNotes, setAuditNotes] = useState<string>('');

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Danh sách học sinh để tìm kiếm
  const { data: studentsList = [] } = useQuery({
    queryKey: ['academic-students-for-cash-collection'],
    queryFn: async () => {
      try {
        const resp = await academicApi.getStudents();
        const data = resp.data || [];
        return data.map((s: any) => ({
          id: s.id,
          name: s.fullName || s.name || 'Học sinh',
          code: s.studentCode || s.code || s.id,
          className: s.className || 'Chưa xếp lớp',
          parentName: s.parentName || 'Phụ huynh',
          parentPhone: s.parentPhone || '',
          prepaidCredit: 0,
        }));
      } catch {
        return [];
      }
    },
  });

  // Tìm kiếm học sinh tự động
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return studentsList.filter(
      (s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.parentPhone && s.parentPhone.includes(searchQuery))
    );
  }, [searchQuery, studentsList]);

  // Tải danh sách hóa đơn mở của học sinh đang chọn
  const { data: studentInvoices, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['student-open-invoices', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      try {
        const resp = await financeApi.getOverdueInvoices({ search: selectedStudent.name });
        return (resp.data || []) as unknown as DynamicInvoice[];
      } catch {
        return [];
      }
    },
    enabled: !!selectedStudent,
  });

  // Khi chọn học sinh hoặc danh sách hóa đơn load xong, tự chọn hóa đơn đầu tiên
  useEffect(() => {
    if (studentInvoices && studentInvoices.length > 0) {
      setSelectedInvoice(studentInvoices[0]);
      setAmountReceived(studentInvoices[0].netPayableAmount);
    } else {
      setSelectedInvoice(null);
      setAmountReceived(0);
    }
  }, [studentInvoices]);

  // Hook gạch nợ bằng Custom Mutation Hook
  const cashClearanceMutation = useManualCashClearance();

  // Xử lý nộp tiền & Gạch nợ
  const handleConfirmPayment = async () => {
    if (!selectedInvoice || !selectedStudent) {
      showToast('warning', 'Vui lòng chọn một hóa đơn đang mở để thanh toán.');
      return;
    }

    if (amountReceived <= 0) {
      showToast('warning', 'Số tiền thanh toán phải lớn hơn 0 VNĐ.');
      return;
    }

    try {
      // BƯỚC 1: KIỂM TRA ĐỒNG BỘ CONCURRENT RACE CONDITION (BR TRÙNG LẶP VIETQR)
      const statusCheck = await financeApi.checkInvoicePaymentStatus(selectedInvoice.paymentReferenceCode);
      if (statusCheck.data.status === 'PAID' || statusCheck.data.isPaidViaVietQr) {
        showToast(
          'error',
          'MSG-159: Hóa đơn này đã được thanh toán thành công qua chuyển khoản VietQR. Vui lòng không thu tiền mặt.'
        );
        refetchInvoices();
        return;
      }

      // BƯỚC 2: TÍNH TOÁN DƯ NỢ & TIỀN NỘP THỪA
      const debt = selectedInvoice.netPayableAmount;
      const isExcess = amountReceived > debt;
      const excessAmount = isExcess ? amountReceived - debt : 0;
      const isPartial = amountReceived < debt;
      const remainingDebt = isPartial ? debt - amountReceived : 0;

      // BƯỚC 3: GỌI API GẠCH NỢ
      const receiptRes = await cashClearanceMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        payload: {
          invoiceId: selectedInvoice.id,
          studentId: selectedStudent.id,
          amount: amountReceived,
          paymentMethod,
          paymentDate,
          notes,
          receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          cashierId: 'EMP-ACC-01',
          cashierName: 'Nguyễn Thị Thu (Kế toán)',
        },
      });

      const receiptData: CashPaymentReceipt = {
        ...receiptRes,
        studentName: selectedStudent.name,
        studentCode: selectedStudent.code,
        className: selectedStudent.className,
        payerName: selectedStudent.parentName,
        payerPhone: selectedStudent.parentPhone,
        originalDebt: debt,
        remainingDebt,
        excessAmount,
      };

      setActiveReceipt(receiptData);

      // BƯỚC 4: THÔNG BÁO THEO KỊCH BẢN BUSINESS RULES
      if (isExcess) {
        showToast(
          'info',
          `MSG-158: Số tiền nộp lớn hơn dư nợ hóa đơn. Hệ thống sẽ ghi nhận khoản thừa ${formatCurrency(
            excessAmount
          )} vào số dư đặt cọc trả trước.`
        );
      } else {
        showToast('success', 'MSG-157: Gạch nợ học phí thủ công và xuất biên lai điện tử thành công.');
      }

      if (autoPrintReceipt) {
        setIsReceiptModalOpen(true);
      }

      refetchInvoices();
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Xử lý gửi báo cáo kiểm quỹ cuối ngày (MSG-160)
  const handleSubmitCashAudit = async () => {
    try {
      const systemRecorded = 3430000; // Tổng hệ thống ghi nhận trong ngày
      const totalCounted = countedCash + countedPos;
      const discrepancy = totalCounted - systemRecorded;

      await financeApi.submitDailyCashAudit({
        auditDate: paymentDate,
        cashierId: 'EMP-ACC-01',
        cashierName: 'Nguyễn Thị Thu (Kế toán)',
        systemRecordedAmount: systemRecorded,
        actualCountedAmount: totalCounted,
        discrepancy,
        notes: auditNotes,
      });

      setIsCashAuditModalOpen(false);
      showToast('info', 'MSG-160: Ghi nhận chênh lệch kiểm quỹ tiền mặt cuối ngày để kế toán trưởng kiểm tra.');
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // In biên lai
  const handlePrintReceipt = () => {
    window.print();
  };

  // Hỗ trợ phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsReceiptModalOpen(false);
        setIsCashAuditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
          {toastMessage.type === 'info' && <FileCheck2 className="h-5 w-5 shrink-0 text-blue-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER PHÂN HỆ UC-038 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C]/15 text-[#1E4D40]">
            <Banknote className="h-3.5 w-3.5 text-[#E5A93C]" />
            <span>UC-038 • Quầy Thu Ngân Trực Tiếp & Gạch Nợ Hóa Đơn</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Gạch Nợ Thủ Công & Thu Tiền Mặt / Quẹt Thẻ POS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Tiếp nhận tiền học phí tại phòng tài vụ, kiểm tra chống trùng lặp chuyển khoản VietQR trong thời gian thực,
            in biên lai điện tử chuẩn A5/A4 và đẩy thông báo FCM về điện thoại phụ huynh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCashAuditModalOpen(true)}
            className="h-11 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 transition"
          >
            <RotateCcw className="h-4 w-4 text-slate-500" />
            <span>Kiểm Quỹ Cuối Ngày</span>
          </button>
        </div>
      </div>

      {/* GIAO DIỆN QUẦY THU NGÂN CHÍNH (2 CỘT RESPONSIVE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: TÌM KIẾM HỌC SINH & DANH SÁCH HÓA ĐƠN ĐANG NỢ (5 CỘT) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Khung tìm kiếm học sinh nhanh */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-black uppercase text-slate-500 tracking-wider block">
              Tìm Kiếm Học Sinh / Phụ Huynh
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập tên bé, mã KP hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#275A4E] focus:outline-hidden transition"
              />
            </div>

            {/* Dropdown kết quả tìm kiếm nếu có */}
            {searchResults.length > 0 && (
              <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {searchResults.map((s: any) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudent(s);
                      setSearchQuery('');
                    }}
                    className="w-full p-2.5 text-left hover:bg-white rounded-xl transition flex items-center justify-between group"
                  >
                    <div>
                      <strong className="text-xs font-black text-slate-800 block group-hover:text-[#275A4E]">
                        {s.name} ({s.code})
                      </strong>
                      <span className="text-[11px] text-slate-400">
                        {s.className} • PH: {s.parentName} ({s.parentPhone})
                      </span>
                    </div>
                    <span className="text-xs text-[#275A4E] font-bold">Chọn</span>
                  </button>
                ))}
              </div>
            )}

            {/* Thẻ học sinh được chọn */}
            {selectedStudent && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1E4D40]/5 to-[#275A4E]/10 border border-[#275A4E]/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#275A4E] text-white flex items-center justify-center font-black text-lg">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm sm:text-base">
                      {selectedStudent.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Mã: {selectedStudent.code} • {selectedStudent.className}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>PH: {selectedStudent.parentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedStudent.parentPhone}</span>
                  </div>
                </div>

                {selectedStudent.prepaidCredit > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-between">
                    <span>Số dư đặt cọc/trả trước:</span>
                    <span>{formatCurrency(selectedStudent.prepaidCredit)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danh sách hóa đơn chưa thanh toán của học sinh */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Hóa Đơn Đang Mở Chờ Gạch Nợ
              </label>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {studentInvoices?.length || 0} khoản nợ
              </span>
            </div>

            {isLoadingInvoices ? (
              <div className="p-6 text-center text-slate-400">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#275A4E]" />
                <p className="text-xs mt-2">Đang nạp công nợ học sinh...</p>
              </div>
            ) : studentInvoices && studentInvoices.length > 0 ? (
              <div className="space-y-2.5">
                {studentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedInvoice(inv);
                      setAmountReceived(inv.netPayableAmount);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${
                      selectedInvoice?.id === inv.id
                        ? 'border-[#275A4E] bg-[#275A4E]/5 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-500 block">
                          {inv.invoiceNumber}
                        </span>
                        <h5 className="font-black text-slate-800 text-sm mt-0.5">
                          Học phí kỳ {inv.billingPeriod}
                        </h5>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Số tiền cần nộp:</span>
                        <strong className="text-base font-mono font-black text-[#275A4E]">
                          {formatCurrency(inv.netPayableAmount)}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Mã VietQR: <strong className="font-mono">{inv.paymentReferenceCode}</strong></span>
                      <span className="text-amber-700 font-bold">Hạn nộp: {inv.dueDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                Học sinh này hiện không có hóa đơn quá hạn hoặc đang nợ.
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: FORM GHI NHẬN THU TIỀN TRỰC TIẾP (7 CỘT) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#275A4E]/10 text-[#275A4E] flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    Phiếu Thu Tiền Tại Quầy Tài Vụ
                  </h3>
                  <p className="text-xs text-slate-400">Nhập số tiền và gạch nợ tức thời</p>
                </div>
              </div>

              {selectedInvoice && (
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  Đang chọn: {selectedInvoice.invoiceNumber}
                </span>
              )}
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 block">
                Phương Thức Thanh Toán Trực Tiếp:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`h-12 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-xs sm:text-sm transition ${
                    paymentMethod === 'CASH'
                      ? 'border-[#275A4E] bg-[#275A4E]/10 text-[#275A4E]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  <span>Tiền Mặt (CASH)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('POS')}
                  className={`h-12 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-black text-xs sm:text-sm transition ${
                    paymentMethod === 'POS'
                      ? 'border-[#275A4E] bg-[#275A4E]/10 text-[#275A4E]'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Quẹt Thẻ Tại Quầy (POS)</span>
                </button>
              </div>
            </div>

            {/* Nhập số tiền thực nhận */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700">
                  Số Tiền Thực Nhận Từ Phụ Huynh (VNĐ):
                </label>
                {selectedInvoice && (
                  <button
                    type="button"
                    onClick={() => setAmountReceived(selectedInvoice.netPayableAmount)}
                    className="text-xs font-bold text-[#275A4E] hover:underline"
                  >
                    Thu đủ toàn bộ: {formatCurrency(selectedInvoice.netPayableAmount)}
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  className="w-full pl-4 pr-16 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-mono font-black text-slate-900 focus:bg-white focus:border-[#275A4E] focus:outline-hidden transition"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                  VNĐ
                </span>
              </div>

              {/* Báo cáo chênh lệch nộp thừa hoặc thu 1 phần */}
              {selectedInvoice && amountReceived > selectedInvoice.netPayableAmount && (
                <p className="text-xs font-bold text-blue-600 bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  * Nộp thừa{' '}
                  <strong>{formatCurrency(amountReceived - selectedInvoice.netPayableAmount)}</strong>. Số tiền thừa
                  sẽ được tự động kết chuyển vào số dư đặt cọc/trả trước (MSG-158).
                </p>
              )}

              {selectedInvoice && amountReceived < selectedInvoice.netPayableAmount && amountReceived > 0 && (
                <p className="text-xs font-bold text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                  * Thu một phần. Dư nợ còn lại{' '}
                  <strong>{formatCurrency(selectedInvoice.netPayableAmount - amountReceived)}</strong> sẽ chuyển sang
                  trạng thái PARTIALLY_PAID (MSG-157).
                </p>
              )}
            </div>

            {/* Ngày nộp & Ghi chú */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Ngày nộp tiền:</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Thu ngân phụ trách:</label>
                <input
                  type="text"
                  disabled
                  value="Nguyễn Thị Thu (Kế toán)"
                  className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-extrabold text-slate-700 block mb-1">Ghi chú phiếu thu:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="rounded-md border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <span className="text-xs font-bold text-slate-700">
                  Mở bản in biên lai điện tử ngay sau khi gạch nợ thành công
                </span>
              </label>
            </div>

            {/* Nút hành động chính */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedInvoice) setAmountReceived(selectedInvoice.netPayableAmount);
                }}
                className="h-11 px-4 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs sm:text-sm transition"
              >
                Đặt lại
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={cashClearanceMutation.isPending || !selectedInvoice}
                className="h-12 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition min-w-[240px] justify-center disabled:opacity-50"
              >
                {cashClearanceMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <span>Xác Nhận Thu Tiền & Gạch Nợ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL BẢN XEM TRƯỚC BIÊN LAI ĐIỆN TỬ (PRINT READY A5/A4) */}
      {isReceiptModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in print:p-0 print:bg-white">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-w-none print:h-auto print:border-none print:shadow-none">
            {/* Header Modal - Ẩn khi In */}
            <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-[#78C2AD]" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Biên Lai Thu Tiền Điện Tử Chuẩn Kế Toán (A5)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="h-8 px-3 rounded-lg bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>In Phiếu Thu</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* MẪU BIÊN LAI CHUẨN IN KHỔ GIẤY A5 */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 font-serif text-slate-900 bg-white print:p-6 print:m-0">
              {/* Tiêu đề & Thông tin Trường */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight font-sans text-slate-900">
                    {activeReceipt.schoolName}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 font-sans">
                    Địa chỉ: {activeReceipt.schoolAddress}
                  </p>
                  <p className="text-xs text-slate-600 font-sans">
                    Mã số thuế: <strong>{activeReceipt.schoolTaxCode}</strong>
                  </p>
                </div>
                <div className="text-right font-sans">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Mẫu số: 01-TT</span>
                  <span className="text-xs font-mono font-black text-slate-900 block mt-0.5">
                    {activeReceipt.receiptNumber}
                  </span>
                  <span className="text-[11px] text-slate-500">Ngày: {activeReceipt.paymentDate}</span>
                </div>
              </div>

              {/* Tên biên lai */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black uppercase tracking-wider font-sans text-slate-900">
                  BIÊN LAI THU TIỀN HỌC PHÍ
                </h2>
                <p className="text-xs italic text-slate-500 font-sans">
                  (Liên 2: Giao cho người nộp tiền)
                </p>
              </div>

              {/* Thông tin học sinh & nộp tiền */}
              <div className="space-y-2 text-xs sm:text-sm font-sans divide-y divide-slate-100">
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Họ và tên học sinh:</span>
                  <strong className="text-slate-900 uppercase">{activeReceipt.studentName}</strong>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Mã học sinh / Lớp:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeReceipt.studentCode} ({activeReceipt.className})
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Người nộp tiền:</span>
                  <span className="font-bold text-slate-900">{activeReceipt.payerName}</span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Lý do thu / Hóa đơn:</span>
                  <span className="text-slate-900">
                    Học phí kỳ 10-2026 ({activeReceipt.invoiceNumber})
                  </span>
                </div>
                <div className="py-1.5 flex justify-between">
                  <span className="text-slate-600">Hình thức thanh toán:</span>
                  <span className="font-bold text-slate-900">
                    {activeReceipt.paymentMethod === 'CASH' ? 'Tiền mặt tại quầy' : 'Quẹt thẻ máy POS'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center bg-slate-50 px-3 rounded-xl">
                  <span className="font-bold text-slate-800 text-sm">Số tiền thực nộp:</span>
                  <span className="font-mono font-black text-lg text-slate-900">
                    {formatCurrency(activeReceipt.amountPaid)}
                  </span>
                </div>
                {activeReceipt.excessAmount > 0 && (
                  <div className="py-1 flex justify-between text-xs text-blue-700">
                    <span>Tiền thừa kết chuyển đặt cọc:</span>
                    <strong>{formatCurrency(activeReceipt.excessAmount)}</strong>
                  </div>
                )}
                {activeReceipt.remainingDebt > 0 && (
                  <div className="py-1 flex justify-between text-xs text-amber-700">
                    <span>Dư nợ còn lại kỳ này:</span>
                    <strong>{formatCurrency(activeReceipt.remainingDebt)}</strong>
                  </div>
                )}
              </div>

              {/* Chữ ký hai bên */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs font-sans">
                <div>
                  <p className="font-bold text-slate-700">Người nộp tiền</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    {activeReceipt.payerName}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-slate-700">Người lập phiếu / Thủ quỹ</p>
                  <p className="text-[10px] text-slate-400 italic">(Ký điện tử & đóng dấu)</p>
                  <div className="h-16 flex flex-col items-center justify-end">
                    <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      <span>ĐÃ XÁC THỰC SỐ</span>
                    </div>
                    <span className="font-bold text-slate-800 mt-1">{activeReceipt.cashierName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal - Ẩn khi In */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500 font-medium">
                Biên lai đã được lưu vào hệ thống và gửi thông báo FCM.
              </span>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KIỂM QUỸ TIỀN MẶT CUỐI NGÀY (CASH AUDIT) */}
      {isCashAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#1E4D40] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Kiểm Kê Sổ Quỹ Tiền Mặt Cuối Ngày</h3>
                  <p className="text-xs text-white/80">Đối soát thực tế két tiền với số liệu phần mềm</p>
                </div>
              </div>
              <button
                onClick={() => setIsCashAuditModalOpen(false)}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span>Hệ thống ghi nhận trong ngày:</span>
                  <strong className="font-mono text-slate-900">{formatCurrency(3430000)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân chốt ca:</span>
                  <strong>Nguyễn Thị Thu (Kế toán)</strong>
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Số tiền mặt đếm thực tế trong két (VNĐ):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={countedCash}
                  onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">
                  Số tiền quẹt thẻ máy POS thực tế (VNĐ):
                </label>
                <input
                  type="number"
                  step="1000"
                  value={countedPos}
                  onChange={(e) => setCountedPos(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              {countedCash + countedPos > 0 && countedCash + countedPos !== 3430000 && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  Phát hiện chênh lệch kiểm quỹ:{' '}
                  <strong>{formatCurrency(countedCash + countedPos - 3430000)}</strong>. Hệ thống sẽ ghi nhận
                  chênh lệch để Kế toán trưởng đối soát (MSG-160).
                </div>
              )}

              <div>
                <label className="font-extrabold text-slate-800 block mb-1">Ghi chú giải trình chênh lệch:</label>
                <textarea
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Vd: Khớp 100% tiền mặt và biên lai POS..."
                  className="w-full px-3 py-2 rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsCashAuditModalOpen(false)}
                className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSubmitCashAudit}
                className="h-11 px-6 rounded-2xl bg-[#1E4D40] hover:bg-[#275A4E] text-white font-black flex items-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Lưu Chốt Sổ Quỹ Cuối Ngày</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashCollectionTab;
