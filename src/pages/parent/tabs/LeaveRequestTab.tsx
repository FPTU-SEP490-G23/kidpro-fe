import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  Coins,
  Loader2,
  Trash2,
  Eye,
  X,
  Filter
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { ParentLeaveItem, SubmitLeaveRequestPayload } from '../../../types/parent.types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface LeaveRequestTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const LeaveRequestTab: React.FC<LeaveRequestTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Form State
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reasonCategory, setReasonCategory] = useState<'ILLNESS' | 'FAMILY' | 'TRAVEL' | 'OTHER'>('ILLNESS');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentPreview, setAttachmentPreview] = useState<string>('');

  // Status Filter & Lightbox
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    code?: string;
    text: string;
  } | null>(null);

  // 1. Fetch daily meal refund rate (GET /api/finance/fee-configs)
  const { data: dailyRefundRate = 35000 } = useQuery<number>({
    queryKey: ['fee-configs', 'refund-rate'],
    queryFn: () => parentApi.getDailyRefundRate(),
  });

  // 2. Fetch leave requests (GET /api/parents/leave-requests)
  const { data: leaveList = [], isLoading } = useQuery<ParentLeaveItem[]>({
    queryKey: ['leave-requests', studentId],
    queryFn: () => parentApi.getLeaveRequests(studentId),
  });

  // Cut-off 08:30 AM logic
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isPast830 = currentHour > 8 || (currentHour === 8 && currentMinute >= 30);
  const isStartToday = startDate === todayStr;

  // Calculate day count
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (e < s) return 0;
    const diffDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  };

  const totalDays = calculateDays(startDate, endDate);

  // Meal refund calculation
  const calculateRefundEligibility = () => {
    if (totalDays <= 0) return { eligible: false, estimatedAmount: 0, notice: '' };
    if (!isStartToday) {
      // Bắt đầu từ ngày mai trở đi -> 100% được hoàn tất cả ngày
      return {
        eligible: true,
        estimatedAmount: totalDays * dailyRefundRate,
        notice: `Đơn nghỉ trước ngày học: Đủ điều kiện hoàn 100% (${totalDays} ngày x ${formatCurrency(dailyRefundRate)} = ${formatCurrency(totalDays * dailyRefundRate)})`,
      };
    }
    // Bắt đầu từ hôm nay
    if (!isPast830) {
      return {
        eligible: true,
        estimatedAmount: totalDays * dailyRefundRate,
        notice: `Nộp trước 08:30 AM: Đủ điều kiện hoàn 100% tiền ăn (${totalDays} ngày x ${formatCurrency(dailyRefundRate)} = ${formatCurrency(totalDays * dailyRefundRate)})`,
      };
    } else {
      // Sau 08:30 AM: Ngày đầu không được hoàn
      const refundableDays = Math.max(0, totalDays - 1);
      return {
        eligible: refundableDays > 0,
        estimatedAmount: refundableDays * dailyRefundRate,
        notice: `Nộp sau 08:30 AM: Không hoàn tiền ăn ngày đầu tiên do bếp đã lên thực đơn. Hoàn ${refundableDays} ngày tiếp theo (${formatCurrency(refundableDays * dailyRefundRate)}).`,
      };
    }
  };

  const refundInfo = calculateRefundEligibility();

  // Mutation to Submit Leave
  const submitMutation = useMutation({
    mutationFn: (payload: SubmitLeaveRequestPayload) => parentApi.submitLeaveRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      setToastMessage({
        type: 'success',
        code: 'MSG-178',
        text: 'Nộp đơn xin nghỉ học thành công. Đang chờ giáo viên xác nhận',
      });
      // Reset form
      setReason('');
      setNotes('');
      setAttachmentPreview('');
      setStartDate(todayStr);
      setEndDate(todayStr);
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        code: 'MSG-004',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // Client-side image compress (< 5MB)
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng đính kèm tệp hình ảnh đơn thuốc hợp lệ (JPG, PNG).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({
        type: 'error',
        text: 'Dung lượng ảnh vượt quá 5MB. Vui lòng nén bớt trước khi tải.',
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setAttachmentPreview(compressed);
      };
    };
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: Ngày trong quá khứ
    if (startDate < todayStr) {
      setToastMessage({
        type: 'error',
        code: 'MSG-179',
        text: 'Không thể nộp đơn xin nghỉ cho các ngày trong quá khứ. Vui lòng trao đổi trực tiếp với cô giáo.',
      });
      return;
    }

    // 2. Validation: Ngày kết thúc trước ngày bắt đầu
    if (endDate < startDate) {
      setToastMessage({
        type: 'error',
        text: 'Ngày kết thúc nghỉ học không thể trước ngày bắt đầu nghỉ.',
      });
      return;
    }

    // 3. Validation: Giới hạn nghỉ liên tục > 30 ngày (MSG-109, BR-035)
    if (totalDays > 30) {
      setToastMessage({
        type: 'error',
        code: 'MSG-109',
        text: 'Nghỉ học trên 30 ngày bắt buộc phải làm thủ tục Bảo lưu học tập chính thức.',
      });
      return;
    }

    // 4. Validation: Kiểm tra trùng lặp khoảng ngày
    const hasOverlap = leaveList.some((existing) => {
      if (existing.status === 'REJECTED') return false;
      const existStart = existing.startDate;
      const existEnd = existing.endDate;
      return startDate <= existEnd && endDate >= existStart;
    });

    if (hasOverlap) {
      setToastMessage({
        type: 'error',
        code: 'MSG-180',
        text: 'Đã có đơn xin nghỉ học được nộp cho khoảng thời gian này.',
      });
      return;
    }

    // 5. Validation: Lý do nghỉ
    if (!reason.trim()) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng nhập chi tiết lý do xin nghỉ học cho bé.',
      });
      return;
    }

    // 6. Validation: Nghỉ ốm >= 3 ngày bắt buộc đính kèm ảnh đơn thuốc
    if (reasonCategory === 'ILLNESS' && totalDays >= 3 && !attachmentPreview) {
      setToastMessage({
        type: 'error',
        text: 'Theo quy định y tế học đường: Nghỉ ốm từ 3 ngày trở lên bắt buộc phải đính kèm ảnh chụp đơn thuốc của bác sĩ.',
      });
      return;
    }

    const payload: SubmitLeaveRequestPayload = {
      studentId,
      startDate,
      endDate,
      reason: `${getReasonCategoryLabel(reasonCategory)}: ${reason.trim()}`,
      notes: notes.trim() || undefined,
      attachmentUrl: attachmentPreview || undefined,
    };

    submitMutation.mutate(payload);
  };

  const getReasonCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ILLNESS':
        return 'Bị ốm / Sốt / Khám bệnh';
      case 'FAMILY':
        return 'Việc gia đình';
      case 'TRAVEL':
        return 'Về quê / Du lịch';
      default:
        return 'Lý do khác';
    }
  };

  // Filtered List
  const filteredList = leaveList.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. Thanh Thông Báo Quyền Lợi Hoàn Tiền Ăn (Refund Eligibility Alert) */}
      <div className="rounded-2xl border border-emerald-300 bg-linear-to-r from-emerald-50 via-teal-50 to-white p-4 md:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-emerald-600/10 p-2.5 text-[#275A4E] shrink-0">
            <Coins className="h-6 w-6 text-[#275A4E]" />
          </div>
          <div className="space-y-1 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <span>QUYỀN LỢI HOÀN TIỀN ĂN BÁN TRÚ (MỐC 08:30 AM)</span>
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-900">
                  {formatCurrency(dailyRefundRate)} / ngày
                </span>
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Hiện tại: <strong>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
              </span>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              {isPast830 ? (
                <>
                  <strong className="text-amber-800">Lưu ý hôm nay (sau 08:30 AM):</strong> Tiền ăn ngày đầu tiên không được hoàn do Bếp đã khóa sổ tiếp phẩm thực phẩm.
                  Tiền ăn các ngày nghỉ tiếp theo (từ ngày thứ 2 trở đi) vẫn được khấu trừ tự động vào hóa đơn học phí tháng sau.
                </>
              ) : (
                <>
                  <strong className="text-emerald-800">Nộp trước 08:30 AM cùng ngày:</strong> Bé đủ điều kiện hoàn <strong>100%</strong> tiền ăn bán trú theo ngày ({formatCurrency(dailyRefundRate)}/ngày).
                  Số tiền thừa sẽ tự động khấu trừ vào quyết toán hóa đơn học phí tháng kế tiếp.
                </>
              )}
            </p>
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
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
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

      {/* Grid: Form bên trái / Lịch sử đơn bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Biểu Mẫu Nộp Đơn Xin Nghỉ Học */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#275A4E]" />
                <span>Nộp Đơn Xin Nghỉ Học Trực Tuyến</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Điền thông tin và thời gian xin nghỉ cho con
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Học sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Học sinh xin nghỉ:</label>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{studentName}</p>
                  <p className="text-[11px] text-slate-500">Lớp: {className} • Mã ID: {studentId}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#275A4E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Học sinh chính thức
                </span>
              </div>
            </div>

            {/* Khoảng ngày nghỉ */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Từ ngày <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đến hết ngày <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayStr}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Thẻ đếm số ngày & dự kiến tiền hoàn */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Tổng số ngày nghỉ:</span>{' '}
                <strong className={`text-sm ${totalDays > 30 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {totalDays} ngày
                </strong>
                {totalDays > 30 && (
                  <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                    Vượt quá 30 ngày! Bắt buộc làm bảo lưu học tập.
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500">Tiền hoàn dự kiến:</span>{' '}
                <strong className="text-[#275A4E] text-sm block">
                  {formatCurrency(refundInfo.estimatedAmount)}
                </strong>
              </div>
            </div>

            {/* Nhắc nhở quyền lợi hoàn tiền */}
            <p className="text-[11px] text-slate-500 italic">
              {refundInfo.notice}
            </p>

            {/* Lý do xin nghỉ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nhóm lý do xin nghỉ <span className="text-rose-500">*</span>:
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#275A4E] focus:outline-hidden bg-white"
              >
                <option value="ILLNESS">Bị ốm / Sốt / Khám bệnh</option>
                <option value="FAMILY">Việc gia đình có tang/hiếu/hỷ</option>
                <option value="TRAVEL">Về quê / Đi du lịch gia đình</option>
                <option value="OTHER">Lý do cá nhân khác</option>
              </select>
            </div>

            {/* Chi tiết lý do */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết lý do <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Bé bị sốt phát ban 38.5 độ, gia đình cho bé đi khám tại viện Nhi"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
                required
              />
            </div>

            {/* Dặn dò cô giáo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dặn dò thêm cô giáo (nếu có):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Nhờ cô gửi phiếu bài tập vẽ của bé để gia đình hướng dẫn"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            {/* Tải tệp đính kèm (Ảnh đơn thuốc / giấy khám) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Đính kèm đơn thuốc / giấy khám bệnh:
                </label>
                {reasonCategory === 'ILLNESS' && totalDays >= 3 && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Bắt buộc (Nghỉ ốm ≥ 3 ngày)
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAttachmentUpload}
                className="hidden"
              />

              {attachmentPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <img
                    src={attachmentPreview}
                    alt="Đơn thuốc"
                    onClick={() => setLightboxImg(attachmentPreview)}
                    className="h-14 w-14 rounded-lg object-cover border border-slate-300 cursor-pointer shadow-2xs"
                  />
                  <div className="flex-1 space-y-0.5 text-xs">
                    <p className="font-bold text-emerald-900">Ảnh đơn thuốc đã sẵn sàng</p>
                    <p className="text-[11px] text-slate-500">Đã nén tối ưu &lt; 5MB</p>
                    <button
                      type="button"
                      onClick={() => setAttachmentPreview('')}
                      className="text-[11px] font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-slate-300 p-3.5 text-center cursor-pointer hover:border-[#275A4E] transition bg-slate-50/50"
                >
                  <Upload className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">Tải lên ảnh toa thuốc / giấy ra viện</p>
                  <p className="text-[10px] text-slate-400">Định dạng JPG, PNG dung lượng dưới 5MB</p>
                </div>
              )}
            </div>

            {/* Action Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitMutation.isPending || totalDays > 30}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3.5 px-4 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 min-h-[44px]"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span>NỘP ĐƠN XIN NGHỈ HỌC</span>
              </button>
            </div>
          </form>
        </div>

        {/* Cột 2: Lịch Sử Đơn Xin Nghỉ Của Con */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#275A4E]" />
                <span>Lịch Sử Đơn Xin Nghỉ Của Con ({leaveList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi tình trạng phê duyệt từ giáo viên chủ nhiệm
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:outline-hidden bg-white"
              >
                <option value="ALL">Tất cả ({leaveList.length})</option>
                <option value="PENDING">Chờ cô duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#275A4E]" />
              Đang tải lịch sử đơn xin nghỉ...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              Chưa có đơn xin nghỉ nào phù hợp với bộ lọc.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 hover:shadow-xs transition bg-white space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-900">
                          {item.code || item.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status === 'PENDING' && 'Chờ cô duyệt'}
                          {item.status === 'APPROVED' && 'Đã duyệt'}
                          {item.status === 'REJECTED' && 'Từ chối'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Nghỉ từ <strong>{formatDate(item.startDate)}</strong> đến{' '}
                        <strong>{formatDate(item.endDate)}</strong> ({item.totalDays} ngày)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-[#275A4E] block">
                        Hoàn tiền ăn: {formatCurrency(item.mealRefundAmount || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Nộp: {formatDate(item.submittedAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700">Lý do:</span> {item.reason}
                    {item.notes && (
                      <span className="block mt-1 text-[11px] text-slate-500">
                        <strong>Dặn dò:</strong> {item.notes}
                      </span>
                    )}
                  </p>

                  {/* Lời nhắn / phản hồi của cô giáo */}
                  {item.reviewNotes && (
                    <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-2.5 text-xs text-blue-900">
                      <strong>Phản hồi từ cô giáo:</strong> {item.reviewNotes}
                    </div>
                  )}

                  {/* Attachment button */}
                  {item.attachmentUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setLightboxImg(item.attachmentUrl || null)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#275A4E] hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem ảnh đơn thuốc đã đính kèm</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox phóng to ảnh đơn thuốc */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImg}
              alt="Ảnh đơn thuốc"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs text-slate-500 py-2">
              Ảnh đơn thuốc / giấy khám bệnh bác sĩ
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequestTab;
