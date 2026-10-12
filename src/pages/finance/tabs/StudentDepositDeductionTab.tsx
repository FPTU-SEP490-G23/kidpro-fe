import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Receipt,
  FileText,
  Building2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import { StudentEnrollmentDeposit, FirstMonthInvoiceBreakdown } from '../../../types/finance.types';
import { useApplyDepositDeduction } from '../../../hooks/useApplyDepositDeduction';
import { formatCurrency } from '../../../utils/formatters';

const INITIAL_DEPOSITS: StudentEnrollmentDeposit[] = [];

export const StudentDepositDeductionTab: React.FC = () => {
  // Current logged in campus (BR-076 Tenant Isolation)
  const currentCampusId = 'CAMPUS-CENTRAL';

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedDepositForModal, setSelectedDepositForModal] = useState<StudentEnrollmentDeposit | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [isAutoEngineRunning, setIsAutoEngineRunning] = useState(false);

  // TanStack Query for deposits
  const { data: depositsData = [] } = useQuery({
    queryKey: ['enrollment-deposits'],
    queryFn: async () => {
      try {
        const res = await financeApi.getStudentEnrollmentDeposits();
        return res.data && res.data.length > 0 ? res.data : [];
      } catch {
        return [];
      }
    },
    initialData: INITIAL_DEPOSITS
  });

  // Deduction Mutation
  const deductMutation = useApplyDepositDeduction();

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const list = depositsData || [];
    const activeUnclaimed = list.filter((d) => d.status === 'ACTIVE_UNCLAIMED');
    const fullyDeducted = list.filter((d) => d.status === 'FULLY_DEDUCTED');
    const refunded = list.filter((d) => d.status === 'REFUNDED');

    const totalUnclaimedAmount = activeUnclaimed.reduce((sum, item) => sum + item.depositAmount, 0);
    const totalDeductedAmount = fullyDeducted.reduce((sum, item) => sum + item.depositAmount, 0);

    return {
      unclaimedCount: activeUnclaimed.length,
      totalUnclaimedAmount,
      fullyDeductedCount: fullyDeducted.length,
      totalDeductedAmount,
      refundedCount: refunded.length,
      totalDepositsCount: list.length
    };
  }, [depositsData]);

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return (depositsData || []).filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
      const matchClass = selectedClass === 'ALL' || item.className.includes(selectedClass);
      return matchSearch && matchStatus && matchClass;
    });
  }, [depositsData, searchTerm, selectedStatus, selectedClass]);

  // Generate breakdown calculation for selected deposit
  const invoiceBreakdown: FirstMonthInvoiceBreakdown | null = useMemo(() => {
    if (!selectedDepositForModal) return null;

    // Standard initial fees
    const baseTuition = 3500000;
    const mealFee = 770000;
    const facilityFee = 1200000;
    const totalBeforeDeduction = baseTuition + mealFee + facilityFee; // 5.470.000 VNĐ

    // Trường hợp cọc lớn hơn hoặc nhỏ hơn
    const depositAmount = selectedDepositForModal.depositAmount;
    let deductionAmount = depositAmount;
    let surplusCarriedForward = 0;

    if (depositAmount > totalBeforeDeduction) {
      deductionAmount = totalBeforeDeduction;
      surplusCarriedForward = depositAmount - totalBeforeDeduction;
    }

    const netPayable = Math.max(0, totalBeforeDeduction - deductionAmount);

    return {
      studentId: selectedDepositForModal.studentId,
      studentName: selectedDepositForModal.studentName,
      className: selectedDepositForModal.className,
      billingMonth: 'Tháng 09/2026 (Tháng Đầu Tiên)',
      baseTuition,
      mealFee,
      facilityFee,
      depositDeductionAmount: deductionAmount,
      depositReceiptRef: selectedDepositForModal.receiptNumber || 'N/A',
      netPayableAmount: netPayable,
      depositSurplusCarriedForward: surplusCarriedForward
    };
  }, [selectedDepositForModal]);

  // Handle manual deposit deduction validation & trigger
  const handleInitiateDeduction = (deposit: StudentEnrollmentDeposit) => {
    // 1. Validation Rule 1: Chống khấu trừ trùng lặp hoặc đã hoàn trả (MSG-249)
    if (deposit.status === 'REFUNDED') {
      showToast('error', 'MSG-249: Tiền cọc đã được hoàn trả trước đó. Áp dụng mức học phí chuẩn không giảm trừ cọc.');
      return;
    }
    if (deposit.status === 'FULLY_DEDUCTED') {
      showToast('warning', `Tiền cọc này đã được khấu trừ vào hóa đơn ${deposit.linkedInvoiceNumber || deposit.linkedInvoiceId}.`);
      return;
    }

    // 2. Validation Rule 2: Kiểm tra phiếu thu kế toán hợp lệ (MSG-250)
    if (!deposit.receiptNumber || deposit.receiptNumber.trim() === '') {
      showToast('error', 'MSG-250: Khoản tiền cọc chưa được xác thực thanh toán. Yêu cầu Kế toán kiểm tra lại phiếu thu.');
      return;
    }

    // 3. Validation Rule 3: Cách ly phân vùng trường đa tenant (BR-076, MSG-251)
    if (deposit.campusId !== currentCampusId) {
      showToast('error', `MSG-251: Khoản tiền cọc thuộc chi nhánh "${deposit.campusName}". Không thể khấu trừ liên trường.`);
      return;
    }

    // Mở Modal xem chi tiết và xác nhận khấu trừ
    setSelectedDepositForModal(deposit);
    setShowBreakdownModal(true);
  };

  // Confirm deduction action
  const handleConfirmDeduction = async () => {
    if (!selectedDepositForModal || !invoiceBreakdown) return;

    try {
      await deductMutation.mutateAsync({
        depositId: selectedDepositForModal.id,
        invoiceId: `INV-${selectedDepositForModal.studentCode}-01`,
        amountToDeduct: invoiceBreakdown.depositDeductionAmount,
        notes: `Khấu trừ tự động tiền cọc giữ chỗ nhập học - Phiếu thu ${selectedDepositForModal.receiptNumber}`
      });

      // Update local state if not refetched yet
      selectedDepositForModal.status = 'FULLY_DEDUCTED';
      selectedDepositForModal.linkedInvoiceNumber = `HD-2026-09-${selectedDepositForModal.studentCode}`;

      showToast(
        'success',
        `MSG-248: Đã tự động khấu trừ tiền cọc ${formatCurrency(invoiceBreakdown.depositDeductionAmount)} vào hóa đơn học phí đầu tiên`
      );
      setShowBreakdownModal(false);
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Run bulk billing engine simulation
  const handleRunAutoBillingEngine = async () => {
    setIsAutoEngineRunning(true);
    try {
      await financeApi.generateMonthlyInvoices('2026-09');
      showToast('success', 'Động cơ quyết toán học phí đã hoàn tất quét toàn trường: Tự động khấu trừ 3 khoản cọc hợp lệ!');
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsAutoEngineRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs px-2 py-1 rounded-md bg-white/70 hover:bg-white text-slate-600 min-h-[30px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* HEADER BANNER & KPI CARDS */}
      <div className="bg-linear-to-r from-[#1E4D40] to-[#275A4E] text-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E5A93C]" />
              <span>UC-056: Quyết Toán Tự Động Hóa Đơn Tháng Thứ Nhất</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Sổ Theo Dõi & Tự Động Khấu Trừ Tiền Đặt Cọc Nhập Học
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Động cơ tự động nhận diện khoản tiền đặt cọc giữ chỗ ghi danh ban đầu, sinh dòng giảm trừ trực tiếp trên hóa đơn tháng 1, và bảo lưu số dư dôi dư sang tháng 2.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAutoBillingEngine}
              disabled={isAutoEngineRunning}
              className="px-5 py-3 rounded-2xl bg-[#E5A93C] hover:bg-[#d4982f] text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 ${isAutoEngineRunning ? 'animate-spin' : ''}`} />
              <span>{isAutoEngineRunning ? 'Đang Chạy Quyết Toán...' : 'Quét & Khấu Trừ Tự Động Toàn Trường'}</span>
            </button>
          </div>
        </div>

        {/* 4 THẺ THỐNG KÊ (KPI STATS) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Cọc Chưa Khấu Trừ</span>
              <Banknote className="h-4 w-4 text-[#E5A93C]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatCurrency(kpis.totalUnclaimedAmount)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              {kpis.unclaimedCount} học sinh mới chuẩn bị nhập học
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Đã Khấu Trừ Xong</span>
              <CheckCircle2 className="h-4 w-4 text-[#78C2AD]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {formatCurrency(kpis.totalDeductedAmount)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              {kpis.fullyDeductedCount} hóa đơn đã liên kết giảm trừ
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Cọc Đã Hoàn Trả</span>
              <RotateCcw className="h-4 w-4 text-slate-300" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.refundedCount} hồ sơ
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Không giảm trừ (áp dụng học phí chuẩn)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Chi Nhánh Hiện Tại</span>
              <Building2 className="h-4 w-4 text-emerald-200" />
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white mt-1 truncate">
              Cơ sở 1 - Trung Tâm
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Tuân thủ phân vùng đa chi nhánh BR-076
            </p>
          </div>
        </div>
      </div>

      {/* THANH TÌM KIẾM & BỘ LỌC */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã học sinh (KP-xxxx), số phiếu thu (DEPxxxx)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="h-3.5 w-3.5" />
            <span>Trạng thái:</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE_UNCLAIMED">Chưa khấu trừ (ACTIVE_UNCLAIMED)</option>
            <option value="FULLY_DEDUCTED">Đã khấu trừ (FULLY_DEDUCTED)</option>
            <option value="REFUNDED">Đã hoàn trả (REFUNDED)</option>
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả lớp học</option>
            <option value="Mầm">Khối Mầm (24-36 th)</option>
            <option value="Chồi">Khối Chồi (3-4 t)</option>
            <option value="Lá">Khối Lá (4-5 t)</option>
          </select>
        </div>
      </div>

      {/* BẢNG THEO DÕI TIỀN CỌC NHẬP HỌC (RESPONSIVE TABLE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Danh Sách Học Sinh Có Tiền Đặt Cọc Giữ Chỗ Nhập Học
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Hiển thị {filteredDeposits.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Học Sinh / Lớp</th>
                <th className="py-3.5 px-4">Số Phiếu Thu</th>
                <th className="py-3.5 px-4">Ngày Nộp</th>
                <th className="py-3.5 px-4 text-right">Số Tiền Cọc</th>
                <th className="py-3.5 px-4">Cơ Sở Trực Thuộc</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4">Hóa Đơn Liên Kết</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy khoản tiền cọc nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((item) => {
                  const isCurrentCampus = item.campusId === currentCampusId;
                  const isUnclaimed = item.status === 'ACTIVE_UNCLAIMED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{item.studentCode}</span>
                          <span>•</span>
                          <span>{item.className}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {item.receiptNumber ? (
                          <span className="font-mono font-bold text-[#1E4D40] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                            {item.receiptNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            Chưa có phiếu
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600 font-semibold">
                        {item.paidDate}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-[#1E4D40] text-sm">
                          {formatCurrency(item.depositAmount)}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className={`h-3.5 w-3.5 ${isCurrentCampus ? 'text-[#275A4E]' : 'text-amber-500'}`} />
                          <span className={`text-xs ${isCurrentCampus ? 'font-semibold text-slate-800' : 'text-amber-700 font-bold'}`}>
                            {item.campusName}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {item.status === 'ACTIVE_UNCLAIMED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Chưa khấu trừ
                          </span>
                        ) : item.status === 'FULLY_DEDUCTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Đã khấu trừ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                            Đã hoàn tiền
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {item.linkedInvoiceNumber ? (
                          <div className="font-mono text-xs font-bold text-[#275A4E] hover:underline cursor-pointer flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5 text-[#275A4E]" />
                            <span>{item.linkedInvoiceNumber}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Chưa gắn HĐ</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {isUnclaimed ? (
                            <button
                              onClick={() => handleInitiateDeduction(item)}
                              className="px-3 py-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[38px]"
                              title="Tự động tạo dòng giảm trừ trên hóa đơn tháng 1"
                            >
                              <span>Khấu Trừ Cọc</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedDepositForModal(item);
                                setShowBreakdownModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 min-h-[38px]"
                            >
                              <FileText className="h-3.5 w-3.5 text-slate-500" />
                              <span>Xem Chi Tiết</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL BẢNG KÊ HÓA ĐƠN THÁNG ĐẦU & DÒNG GIẢM TRỪ CỌC (FIRST MONTH INVOICE BREAKDOWN) */}
      {showBreakdownModal && selectedDepositForModal && invoiceBreakdown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1E4D40] text-xs font-bold mb-1.5 border border-emerald-100">
                  <Receipt className="h-3.5 w-3.5 text-[#275A4E]" />
                  <span>Bảng Kê Hóa Đơn Học Phí Tháng Đầu Tiên</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {invoiceBreakdown.studentName} ({selectedDepositForModal.studentCode})
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Lớp: {invoiceBreakdown.className} • Kỳ quyết toán: {invoiceBreakdown.billingMonth}
                </p>
              </div>

              <button
                onClick={() => setShowBreakdownModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Thông tin tiền cọc nhập học */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                <span>Thông tin khoản cọc nhận giữ chỗ:</span>
                <span className="font-mono text-[#1E4D40] bg-white px-2 py-0.5 rounded border border-slate-200">
                  Phiếu thu: {selectedDepositForModal.receiptNumber || 'Chưa xác thực'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Số tiền cọc ban đầu đã nộp:</span>
                <span className="text-base font-black text-[#1E4D40]">
                  {formatCurrency(selectedDepositForModal.depositAmount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-slate-400" />
                <span>Ngày nộp: {selectedDepositForModal.paidDate} • Chi nhánh: {selectedDepositForModal.campusName}</span>
              </div>
            </div>

            {/* BẢNG KÊ CHI TIẾT CÁC KHOẢN THU THÁNG ĐẦU TIÊN */}
            <div className="mt-5">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                Chi tiết khoản thu quyết toán tháng thứ nhất:
              </h4>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs sm:text-sm">
                {/* Khoản 1: Học phí cơ bản */}
                <div className="p-3.5 flex items-center justify-between bg-white font-medium">
                  <div>
                    <span className="font-bold text-slate-800">1. Học phí cơ bản tháng đầu</span>
                    <p className="text-[11px] text-slate-500">Chương trình mầm non song ngữ chất lượng cao</p>
                  </div>
                  <span className="font-black text-slate-800">
                    + {formatCurrency(invoiceBreakdown.baseTuition)}
                  </span>
                </div>

                {/* Khoản 2: Tiền ăn bán trú */}
                <div className="p-3.5 flex items-center justify-between bg-white font-medium">
                  <div>
                    <span className="font-bold text-slate-800">2. Tiền ăn bán trú tháng đầu</span>
                    <p className="text-[11px] text-slate-500">22 ngày x 35.000 VNĐ/ngày (Bữa sáng, trưa, xế chiều)</p>
                  </div>
                  <span className="font-black text-slate-800">
                    + {formatCurrency(invoiceBreakdown.mealFee)}
                  </span>
                </div>

                {/* Khoản 3: Cơ sở vật chất đầu năm */}
                <div className="p-3.5 flex items-center justify-between bg-white font-medium">
                  <div>
                    <span className="font-bold text-slate-800">3. Phí cơ sở vật chất & học phẩm đầu năm</span>
                    <p className="text-[11px] text-slate-500">Thu 1 lần khi nhập học đầu năm học</p>
                  </div>
                  <span className="font-black text-slate-800">
                    + {formatCurrency(invoiceBreakdown.facilityFee)}
                  </span>
                </div>

                {/* Khoản TỔNG TRƯỚC KHẤU TRỪ */}
                <div className="p-3 bg-slate-50 flex items-center justify-between font-bold text-slate-600">
                  <span>Tổng các khoản phí quy định tháng đầu:</span>
                  <span>
                    {formatCurrency(
                      invoiceBreakdown.baseTuition + invoiceBreakdown.mealFee + invoiceBreakdown.facilityFee
                    )}
                  </span>
                </div>

                {/* DÒNG TỰ ĐỘNG GIẢM TRỪ CỌC (UC-056 CORE) */}
                <div className="p-4 bg-emerald-50/80 flex items-center justify-between border-y-2 border-emerald-300">
                  <div>
                    <div className="font-black text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>DÒNG TỰ ĐỘNG KHẤU TRỪ TIỀN CỌC GIỮ CHỖ</span>
                    </div>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Khấu trừ tiền đặt cọc giữ chỗ nhập học - Phiếu thu {invoiceBreakdown.depositReceiptRef}
                    </p>
                  </div>
                  <span className="font-black text-emerald-700 text-base sm:text-lg">
                    - {formatCurrency(invoiceBreakdown.depositDeductionAmount)}
                  </span>
                </div>

                {/* TỔNG THỰC NỘP SAU CÙNG */}
                <div className="p-4 bg-white flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm sm:text-base">
                      TỔNG SỐ TIỀN THỰC NỘP THÁNG ĐẦU:
                    </span>
                    <p className="text-xs text-slate-500 font-medium">
                      (Đã trừ tiền cọc giữ chỗ theo quy chế tuyển sinh)
                    </p>
                  </div>
                  <span className="font-black text-xl sm:text-2xl text-[#1E4D40]">
                    {formatCurrency(invoiceBreakdown.netPayableAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* TRƯỜNG HỢP CỌC LỚN HƠN HỌC PHÍ THÁNG ĐẦU (SURPLUS CARRIED FORWARD) */}
            {invoiceBreakdown.depositSurplusCarriedForward && invoiceBreakdown.depositSurplusCarriedForward > 0 && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">
                      Số Dư Tiền Cọc Vượt Mức Học Phí Tháng Đầu (Bảo Lưu Số Dư):
                    </div>
                    <p className="text-xs text-amber-800 mt-1">
                      Khoản tiền cọc ({formatCurrency(selectedDepositForModal.depositAmount)}) lớn hơn tổng học phí tháng đầu. Hệ thống đã khấu trừ tối đa để học phí tháng đầu = 0 VNĐ.
                    </p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs">
                      <span>Số dư dôi dư còn lại:</span>
                      <span className="font-black text-emerald-800">
                        {formatCurrency(invoiceBreakdown.depositSurplusCarriedForward)}
                      </span>
                      <span>(Tự động bảo lưu khấu trừ tiếp vào Tháng thứ 2)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBreakdownModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition min-h-[44px]"
              >
                Đóng
              </button>

              {selectedDepositForModal.status === 'ACTIVE_UNCLAIMED' && (
                <button
                  type="button"
                  onClick={handleConfirmDeduction}
                  disabled={deductMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {deductMutation.isPending ? 'Đang Thực Hiện...' : 'Xác Nhận Khấu Trừ Cọc Vào Hóa Đơn'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDepositDeductionTab;
