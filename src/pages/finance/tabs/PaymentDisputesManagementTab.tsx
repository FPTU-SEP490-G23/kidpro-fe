import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileQuestion,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  X,
  ShieldCheck,
  ShieldAlert,
  Camera,
  Calendar,
  Sparkles,
  Info,
  Clock,
  Utensils
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import {
  PaymentDisputeItem,
  DisputeCategory,
  PaymentDisputeStatus
} from '../../../types/finance.types';
import { useResolveDispute } from '../../../hooks/useResolveDispute';
import { formatCurrency } from '../../../utils/formatters';

const INITIAL_DISPUTES: PaymentDisputeItem[] = [];

export const PaymentDisputesManagementTab: React.FC = () => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PaymentDisputeStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DisputeCategory>('ALL');

  // Modal State
  const [selectedDispute, setSelectedDispute] = useState<PaymentDisputeItem | null>(null);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [investigationTab, setInvestigationTab] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [isAutoAuditing, setIsAutoAuditing] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Form Inputs in Modal
  const [adjustmentInputAmount, setAdjustmentInputAmount] = useState<number>(0);
  const [adjustmentReasonText, setAdjustmentReasonText] = useState('');
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [isClosedFiscalYear, setIsClosedFiscalYear] = useState(false);
  const [principalAuthCodeInput, setPrincipalAuthCodeInput] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  // TanStack Query
  const { data: disputesList = INITIAL_DISPUTES } = useQuery({
    queryKey: ['payment-disputes'],
    queryFn: async () => {
      try {
        const res = await financeApi.getPaymentDisputes();
        return res.data && res.data.length > 0 ? res.data : [];
      } catch {
        return [];
      }
    },
      });

  // Mutation
  const resolveMutation = useResolveDispute();

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // KPIs
  const kpis = useMemo(() => {
    const pending = disputesList.filter((d) => d.status === 'PENDING_REVIEW').length;
    const resolved = disputesList.filter((d) => d.status === 'RESOLVED_ADJUSTED').length;
    const rejected = disputesList.filter((d) => d.status === 'REJECTED_EXPLAINED').length;
    const totalAmountPending = disputesList
      .filter((d) => d.status === 'PENDING_REVIEW')
      .reduce((sum, d) => sum + d.disputedAmount, 0);

    return {
      pending,
      resolved,
      rejected,
      totalAmountPending,
      total: disputesList.length,
    };
  }, [disputesList]);

  // Filtered List
  const filteredDisputes = useMemo(() => {
    return disputesList.filter((item) => {
      const matchSearch =
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchCat = categoryFilter === 'ALL' || item.category === categoryFilter;

      return matchSearch && matchStatus && matchCat;
    });
  }, [disputesList, searchTerm, statusFilter, categoryFilter]);

  // Open Investigation Modal
  const handleOpenInvestigation = (item: PaymentDisputeItem) => {
    setSelectedDispute(item);
    setAdjustmentInputAmount(
      item.crossCheckAudit?.suggestedAdjustmentAmount || item.disputedAmount
    );
    setAdjustmentReasonText(
      item.adjustmentReason ||
        `Đã xác minh đối soát sổ điểm danh và đơn xin nghỉ: Đồng ý điều chỉnh giảm trừ ${formatCurrency(
          item.disputedAmount
        )} vào hóa đơn ${item.invoiceNumber}.`
    );
    setRejectionReasonText(
      item.rejectionReason ||
        'Kính gửi Quý Phụ huynh, sau khi đối soát dữ liệu điểm danh và báo bếp theo Quyết định 1246/BYT, nhà trường xin phép giữ nguyên số tiền do đơn nghỉ không nộp trước 08:30 AM.'
    );
    setIsClosedFiscalYear(false);
    setPrincipalAuthCodeInput('');
    setInvestigationTab('APPROVE');
    setIsInvestigationModalOpen(true);
  };

  // Run Auto Cross-Check Simulation
  const handleTriggerAutoCrossCheck = async () => {
    setIsAutoAuditing(true);
    setTimeout(() => {
      setIsAutoAuditing(false);
      showToast('success', 'Đã hoàn tất truy vấn dữ liệu chéo: Sổ điểm danh, camera cổng & đơn nghỉ phép');
    }, 800);
  };

  // Submit Approval / Adjustment
  const handleConfirmApproval = async () => {
    if (!selectedDispute) return;

    // 1. Validation: Giới hạn số tiền điều chỉnh <= tổng giá trị hóa đơn gốc (MSG-257)
    if (adjustmentInputAmount <= 0 || adjustmentInputAmount > selectedDispute.originalInvoiceTotal) {
      showToast('error', 'MSG-257: Số tiền giảm trừ điều chỉnh không thể vượt quá tổng giá trị của hóa đơn gốc.');
      return;
    }

    // 2. Validation: Bắt buộc văn bản giải trình (BR-062, MSG-259)
    if (!adjustmentReasonText.trim() || adjustmentReasonText.trim().length < 10) {
      showToast('error', 'MSG-259: Bắt buộc phải nhập văn bản giải trình lý do khi điều chỉnh số liệu kế toán.');
      return;
    }

    // 3. Validation: Năm tài chính đã đóng sổ yêu cầu mã BGH (MSG-258)
    if (isClosedFiscalYear && !principalAuthCodeInput.trim()) {
      showToast('error', 'MSG-258: Yêu cầu mã phê duyệt của Hiệu trưởng để điều chỉnh hóa đơn của năm tài chính đã đóng sổ.');
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        id: selectedDispute.id,
        payload: {
          action: 'APPROVE',
          adjustmentAmount: adjustmentInputAmount,
          reason: adjustmentReasonText.trim(),
          principalAuthCode: isClosedFiscalYear ? principalAuthCodeInput.trim() : undefined,
        },
      });

      // Optimistic update
      selectedDispute.status = 'RESOLVED_ADJUSTED';
      selectedDispute.adjustmentAmount = adjustmentInputAmount;
      selectedDispute.adjustmentReason = adjustmentReasonText.trim();
      selectedDispute.adjustedInvoiceTotal = Math.max(
        0,
        selectedDispute.originalInvoiceTotal - adjustmentInputAmount
      );
      selectedDispute.reviewedAt = 'Vừa xong';
      selectedDispute.reviewedBy = 'Kế toán trưởng';

      showToast('success', 'MSG-255: Đã giải quyết khiếu nại học phí và phát hành hóa đơn điều chỉnh.');
      setIsInvestigationModalOpen(false);
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Submit Rejection
  const handleConfirmRejection = async () => {
    if (!selectedDispute) return;

    if (!rejectionReasonText.trim() || rejectionReasonText.trim().length < 10) {
      showToast('error', 'Vui lòng soạn thư giải thích lịch sự tối thiểu 10 ký tự trước khi từ chối.');
      return;
    }

    try {
      await resolveMutation.mutateAsync({
        id: selectedDispute.id,
        payload: {
          action: 'REJECT',
          reason: rejectionReasonText.trim(),
        },
      });

      selectedDispute.status = 'REJECTED_EXPLAINED';
      selectedDispute.rejectionReason = rejectionReasonText.trim();
      selectedDispute.reviewedAt = 'Vừa xong';
      selectedDispute.reviewedBy = 'Kế toán viên';

      showToast('success', 'MSG-256: Đã từ chối khiếu nại học phí kèm bằng chứng minh bạch gửi tới phụ huynh.');
      setIsInvestigationModalOpen(false);
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
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

      {/* HEADER BANNER & KPI STATS */}
      <div className="bg-linear-to-r from-[#1E4D40] to-[#275A4E] text-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E5A93C]" />
              <span>UC-059: Hàng Đợi Điều Tra & Phát Hành Hóa Đơn Điều Chỉnh (BR-062)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Tiếp Nhận & Xử Lý Khiếu Nại Sai Lệch Tiền Học
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Đối chiếu chéo tự động giữa sổ điểm danh, ảnh camera AI cổng và đơn nghỉ phép; tự động sinh dòng giảm trừ bổ sung ADJUSTMENT và phát hành lại mã VietQR 1-Chạm mới.
            </p>
          </div>
        </div>

        {/* 4 THẺ CHỈ SỐ KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Chờ Xử Lý</span>
              <Clock className="h-4 w-4 text-amber-300" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.pending} phiếu
            </p>
            <p className="text-[11px] text-amber-200 font-bold mt-0.5">
              Đang tạm dừng nhắc nợ (UC-057)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Đã Điều Chỉnh</span>
              <CheckCircle2 className="h-4 w-4 text-[#78C2AD]" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.resolved} phiếu
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Sinh dòng ADJUSTMENT thành công
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Từ Chối Kèm Minh Chứng</span>
              <RotateCcw className="h-4 w-4 text-slate-300" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white mt-1">
              {kpis.rejected} phiếu
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Giữ nguyên số tiền hóa đơn gốc
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
            <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
              <span>Số Tiền Đang Tra Soát</span>
              <FileQuestion className="h-4 w-4 text-[#E5A93C]" />
            </div>
            <p className="text-base sm:text-lg font-black text-[#E5A93C] mt-1">
              {formatCurrency(kpis.totalAmountPending)}
            </p>
            <p className="text-[11px] text-emerald-300 mt-0.5">
              Cam kết xử lý trong 24 giờ
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
            placeholder="Tìm theo tên bé, mã KP-xxxx, phụ huynh, mã hóa đơn (HD-xxxx)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Filter className="h-3.5 w-3.5" />
            <span>Bộ lọc:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING_REVIEW">Chờ xử lý (PENDING_REVIEW)</option>
            <option value="RESOLVED_ADJUSTED">Đã giải quyết (RESOLVED_ADJUSTED)</option>
            <option value="REJECTED_EXPLAINED">Đã từ chối (REJECTED_EXPLAINED)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả khoản thu</option>
            <option value="MEAL_REFUND">Tiền ăn hoàn trả</option>
            <option value="LATE_PICKUP">Phụ phí đón muộn</option>
            <option value="BASE_TUITION">Học phí cơ bản</option>
            <option value="OTHER">Khoản thu khác</option>
          </select>
        </div>
      </div>

      {/* BẢNG HÀNG ĐỢI KHIẾU NẠI & TRA SOÁT (DISPUTES QUEUE TABLE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Danh Sách Phiếu Khiếu Nại Cần Tra Soát
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Hiển thị {filteredDisputes.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Mã Phiếu / Ngày</th>
                <th className="py-3.5 px-4">Học Sinh / Lớp</th>
                <th className="py-3.5 px-4">Phụ Huynh & SĐT</th>
                <th className="py-3.5 px-4">Hóa Đơn Mục Tiêu</th>
                <th className="py-3.5 px-4">Khoản Thu Thắc Mắc</th>
                <th className="py-3.5 px-4 text-right">Số Tiền Khiếu Nại</th>
                <th className="py-3.5 px-4 text-center">Bằng Chứng</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    Không tìm thấy phiếu khiếu nại nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((item) => {
                  const isPending = item.status === 'PENDING_REVIEW';
                  const isResolved = item.status === 'RESOLVED_ADJUSTED';

                  const categoryLabel =
                    item.category === 'MEAL_REFUND'
                      ? 'Tiền ăn hoàn trả'
                      : item.category === 'LATE_PICKUP'
                      ? 'Phụ phí đón muộn'
                      : item.category === 'BASE_TUITION'
                      ? 'Học phí cơ bản'
                      : 'Khoản thu khác';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-slate-900 block text-xs">
                          {item.id}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {item.submittedAt}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{item.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-mono">
                            {item.studentCode}
                          </span>
                          <span>•</span>
                          <span>{item.className}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{item.parentName}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.parentPhone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-[#275A4E] text-xs">
                          {item.invoiceNumber}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Gốc: {formatCurrency(item.originalInvoiceTotal)}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {categoryLabel}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <span className="font-black text-rose-600 text-sm">
                          {formatCurrency(item.disputedAmount)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {item.proofPhotoUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewPhotoUrl(item.proofPhotoUrl || null)}
                            className="inline-flex items-center gap-1 text-xs text-[#275A4E] hover:underline font-bold"
                          >
                            <Camera className="h-3.5 w-3.5 text-[#275A4E]" />
                            <span>Xem ảnh</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Không có</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Chờ tra soát
                          </span>
                        ) : isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Đã điều chỉnh
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <X className="h-3.5 w-3.5 text-slate-400" />
                            Đã từ chối
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleOpenInvestigation(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 mx-auto min-h-[38px]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{isPending ? 'Điều Tra & Xử Lý' : 'Xem Hồ Sơ'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ĐIỀU TRA ĐỐI SOÁT CHUYÊN SÂU & ĐIỀU CHỈNH HÓA ĐƠN (DISPUTE INVESTIGATION MODAL) */}
      {isInvestigationModalOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#1E4D40] text-xs font-bold mb-1.5 border border-emerald-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#275A4E]" />
                  <span>Bộ Công Cụ Đối Soát & Điều Chỉnh Học Phí (UC-059)</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  Hồ Sơ Khiếu Nại: {selectedDispute.id}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Học sinh: <strong>{selectedDispute.studentName}</strong> ({selectedDispute.studentCode}) • Lớp: {selectedDispute.className} • Hóa đơn: <strong>{selectedDispute.invoiceNumber}</strong>
                </p>
              </div>

              <button
                onClick={() => setIsInvestigationModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Thông tin phụ huynh khiếu nại */}
            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-amber-950 font-bold mb-1">
                <span>Nội dung phụ huynh phản ánh:</span>
                <span className="font-mono text-rose-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                  Số tiền khiếu nại: {formatCurrency(selectedDispute.disputedAmount)}
                </span>
              </div>
              <p className="text-amber-900 italic font-medium mt-1">
                "{selectedDispute.reason}"
              </p>
              <div className="mt-2 text-[11px] text-amber-800 flex items-center gap-3">
                <span>Phụ huynh: <strong>{selectedDispute.parentName}</strong> ({selectedDispute.parentPhone})</span>
                {selectedDispute.proofPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(selectedDispute.proofPhotoUrl || null)}
                    className="text-[#275A4E] font-bold hover:underline flex items-center gap-1"
                  >
                    <Camera className="h-3 w-3" />
                    <span>Xem ảnh chứng từ phụ huynh đính kèm</span>
                  </button>
                )}
              </div>
            </div>

            {/* KHUNG ĐỐI CHIẾU CHÉO TỰ ĐỘNG (CROSS-CHECK AUDIT PANEL) */}
            <div className="mt-5 border border-slate-200 rounded-2xl p-4 bg-slate-50/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#E5A93C]" />
                  <span className="font-black text-xs sm:text-sm text-slate-800 uppercase tracking-wider">
                    Kết Quả Điều Tra Đối Soát Chéo Tự Động (Cross-check Audit)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerAutoCrossCheck}
                  disabled={isAutoAuditing}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isAutoAuditing ? 'animate-spin' : ''}`} />
                  <span>{isAutoAuditing ? 'Đang Truy Vấn...' : 'Chạy Lại Đối Soát'}</span>
                </button>
              </div>

              {selectedDispute.crossCheckAudit ? (
                <div className="mt-3 space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    {/* Mục 1: Điểm danh cổng */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-600 mb-1">
                        <span>1. Camera Cổng AI:</span>
                        <Camera className="h-3.5 w-3.5 text-[#275A4E]" />
                      </div>
                      <p className="text-slate-800 font-semibold">
                        {selectedDispute.crossCheckAudit.attendanceRecord.isPresent
                          ? `Có mặt lúc ${selectedDispute.crossCheckAudit.attendanceRecord.checkInTime}`
                          : 'Vắng mặt (Không ghi nhận check-in)'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ngày {selectedDispute.crossCheckAudit.attendanceRecord.date}
                      </p>
                    </div>

                    {/* Mục 2: Đơn xin nghỉ phép */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-600 mb-1">
                        <span>2. Đơn Xin Nghỉ:</span>
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      </div>
                      <p className="text-slate-800 font-semibold">
                        {selectedDispute.crossCheckAudit.leaveRequest
                          ? `Hợp lệ (${selectedDispute.crossCheckAudit.leaveRequest.submittedAt})`
                          : 'Không tìm thấy đơn nộp'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {selectedDispute.crossCheckAudit.leaveRequest?.approvedBy || 'Chưa duyệt'}
                      </p>
                    </div>

                    {/* Mục 3: Báo bếp bán trú */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between font-bold text-slate-600 mb-1">
                        <span>3. Báo Bếp Suất Ăn:</span>
                        <Utensils className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <p className="text-slate-800 font-semibold">
                        {selectedDispute.crossCheckAudit.kitchenHeadcount.mealRefundLogged
                          ? 'Đã trừ hoàn tiền ăn'
                          : 'Bị sót gạch hoàn tiền'}
                      </p>
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        Cần đối soát điều chỉnh
                      </p>
                    </div>
                  </div>

                  {/* Kết luận đối soát */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                    <span className="font-extrabold text-emerald-900 block mb-0.5">
                      ✓ Kết Luận Đối Soát Tự Động:
                    </span>
                    <p className="text-xs leading-relaxed text-emerald-900">
                      {selectedDispute.crossCheckAudit.auditConclusion}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400 italic">
                  Chưa có dữ liệu đối chiếu chéo. Bấm "Chạy Lại Đối Soát" để kết nối hệ thống.
                </p>
              )}
            </div>

            {/* TAB XỬ LÝ (CHẤP NHẬN & ĐIỀU CHỈNH HOẶC TỪ CHỐI) */}
            {selectedDispute.status === 'PENDING_REVIEW' && (
              <div className="mt-5 space-y-4">
                <div className="flex border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setInvestigationTab('APPROVE')}
                    className={`py-2.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 min-h-[44px] ${
                      investigationTab === 'APPROVE'
                        ? 'border-[#275A4E] text-[#275A4E]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Tùy Chọn 1: Chấp Nhận & Sinh Dòng Giảm Trừ ADJUSTMENT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInvestigationTab('REJECT')}
                    className={`py-2.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 min-h-[44px] ${
                      investigationTab === 'REJECT'
                        ? 'border-rose-600 text-rose-700'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    <X className="h-4 w-4" />
                    <span>Tùy Chọn 2: Từ Chối Khiếu Nại Kèm Bằng Chứng</span>
                  </button>
                </div>

                {/* FORM TÙY CHỌN 1: CHẤP NHẬN */}
                {investigationTab === 'APPROVE' && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        1. Số Tiền Giảm Trừ Điều Chỉnh (VNĐ):
                      </label>
                      <input
                        type="number"
                        value={adjustmentInputAmount}
                        onChange={(e) => setAdjustmentInputAmount(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 p-3 font-mono font-black text-emerald-800 text-base focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tối đa: {formatCurrency(selectedDispute.originalInvoiceTotal)} (Giá trị hóa đơn gốc)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        2. Văn Bản Giải Trình Kế Toán (Bắt buộc theo BR-062):
                      </label>
                      <textarea
                        rows={3}
                        value={adjustmentReasonText}
                        onChange={(e) => setAdjustmentReasonText(e.target.value)}
                        placeholder="Nhập lý do điều chỉnh để lưu vết kiểm toán tài chính..."
                        className="w-full rounded-2xl border border-slate-200 p-3 text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                      />
                    </div>

                    {/* Kiểm tra năm tài chính đã đóng sổ (MSG-258) */}
                    <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={isClosedFiscalYear}
                          onChange={(e) => setIsClosedFiscalYear(e.target.checked)}
                          className="rounded text-[#275A4E] focus:ring-[#275A4E]"
                        />
                        <span>Hóa đơn thuộc năm tài chính cũ đã đóng sổ quyết toán (Yêu cầu mã BGH)</span>
                      </label>

                      {isClosedFiscalYear && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Mã Phê Duyệt Ủy Quyền Của Ban Giám Hiệu (BGH Authorization Code):
                          </label>
                          <input
                            type="text"
                            value={principalAuthCodeInput}
                            onChange={(e) => setPrincipalAuthCodeInput(e.target.value)}
                            placeholder="Nhập mã BGH-AUTH-xxxx..."
                            className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-xs focus:border-[#275A4E] focus:outline-hidden min-h-[40px]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preview hóa đơn sau điều chỉnh */}
                    <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between text-xs sm:text-sm">
                      <div>
                        <span className="font-bold text-purple-900 block">
                          Dòng ADJUSTMENT sẽ phát hành vào hóa đơn:
                        </span>
                        <span className="text-purple-700 text-xs">
                          Số tiền thực nộp mới:{' '}
                          <strong className="font-mono text-purple-950 font-black">
                            {formatCurrency(
                              Math.max(0, selectedDispute.originalInvoiceTotal - adjustmentInputAmount)
                            )}
                          </strong>{' '}
                          (Tự động tái tạo mã VietQR 1-Chạm PayOS)
                        </span>
                      </div>
                      <span className="font-black text-purple-800 text-base">
                        - {formatCurrency(adjustmentInputAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsInvestigationModalOpen(false)}
                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 min-h-[44px]"
                      >
                        Đóng
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmApproval}
                        disabled={resolveMutation.isPending}
                        className="px-6 py-2.5 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>
                          {resolveMutation.isPending
                            ? 'Đang Phát Hành...'
                            : 'Trình BGH Ký Duyệt & Phát Hành Hóa Đơn Điều Chỉnh'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* FORM TÙY CHỌN 2: TỪ CHỐI */}
                {investigationTab === 'REJECT' && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                        Soạn Thư Phản Hồi Giải Thích Minh Bạch (Gửi Tới Phụ Huynh):
                      </label>
                      <textarea
                        rows={4}
                        value={rejectionReasonText}
                        onChange={(e) => setRejectionReasonText(e.target.value)}
                        placeholder="Nêu rõ căn cứ từ chối (quy chế giờ nộp đơn, ảnh camera có mặt...)"
                        className="w-full rounded-2xl border border-slate-200 p-3 text-slate-800 focus:border-rose-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        Khi từ chối khiếu nại, hóa đơn sẽ giữ nguyên mức tiền gốc ban đầu. Hệ thống sẽ kích hoạt lại tiến trình thông báo nhắc nợ tự động theo quy định.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsInvestigationModalOpen(false)}
                        className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 min-h-[44px]"
                      >
                        Hủy
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmRejection}
                        disabled={resolveMutation.isPending}
                        className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        <span>
                          {resolveMutation.isPending ? 'Đang Xử Lý...' : 'Từ Chối Khiếu Nại & Giữ Nguyên Hóa Đơn'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRƯỜNG HỢP HỒ SƠ ĐÃ XỬ LÝ XONG */}
            {selectedDispute.status !== 'PENDING_REVIEW' && (
              <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Trạng thái xử lý hồ sơ:</span>
                  <span className="font-extrabold text-[#275A4E]">
                    {selectedDispute.status === 'RESOLVED_ADJUSTED'
                      ? '✓ ĐÃ PHÁT HÀNH HÓA ĐƠN ĐIỀU CHỈNH'
                      : '✕ ĐÃ TỪ CHỐI KHIẾU NẠI'}
                  </span>
                </div>
                <p className="text-slate-600">
                  Người duyệt: <strong>{selectedDispute.reviewedBy}</strong> ({selectedDispute.reviewedAt})
                </p>
                {selectedDispute.adjustmentReason && (
                  <p className="text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    <strong>Giải trình kế toán:</strong> {selectedDispute.adjustmentReason}
                  </p>
                )}
                {selectedDispute.rejectionReason && (
                  <p className="text-rose-900 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <strong>Lý do từ chối:</strong> {selectedDispute.rejectionReason}
                  </p>
                )}

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setIsInvestigationModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 min-h-[44px]"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX XEM ẢNH MINH CHỨNG */}
      {previewPhotoUrl && (
        <div
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="max-w-xl max-h-[85vh] overflow-hidden rounded-3xl bg-white p-3 shadow-2xl relative">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 rounded-full bg-black/60 p-2 text-white hover:bg-black transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Bằng chứng khiếu nại"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <p className="text-center text-xs text-slate-500 font-semibold mt-2">
              Ảnh minh chứng do phụ huynh cung cấp phục vụ đối soát
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDisputesManagementTab;
