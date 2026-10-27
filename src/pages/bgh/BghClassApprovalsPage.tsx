import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import classApprovalApi, { ClassApprovalItem } from '../../api/classApprovalApi';
import { useToast } from '../../contexts/ToastContext';
import {
  School,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Building,
  RefreshCw,
  Filter,
  Users,
  Calendar,
  X,
  RotateCcw,
} from 'lucide-react';

export const BghClassApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_APPROVAL');
  const [rejectingClass, setRejectingClass] = useState<ClassApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch approvals list
  const { data: classes = [], isLoading, isFetching, refetch } = useQuery<ClassApprovalItem[]>({
    queryKey: ['class-approvals-bgh', statusFilter],
    queryFn: () => classApprovalApi.getApprovals(statusFilter),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (classId: string) => classApprovalApi.approveClass(classId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-approvals-bgh'] });
      success(res?.message || 'MSG-031: Kế hoạch mở lớp học mới đã được phê duyệt thành công. Lớp học chính thức được thành lập.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể phê duyệt kế hoạch mở lớp');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ classId, reason }: { classId: string; reason: string }) =>
      classApprovalApi.rejectClass(classId, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-approvals-bgh'] });
      success(res?.message || 'MSG-032: Đã từ chối kế hoạch mở lớp học. Thông báo và lý do từ chối đã được gửi về Cán bộ Giáo vụ.');
      closeRejectModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể từ chối kế hoạch mở lớp';
      setValidationError(msg);
      error(msg);
    },
  });

  // Reset to pending mutation
  const resetMutation = useMutation({
    mutationFn: (classId: string) => classApprovalApi.resetPendingClass(classId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-approvals-bgh'] });
      success(res?.message || 'Đã khôi phục kế hoạch mở lớp về trạng thái Chờ phê duyệt (PENDING) thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể khôi phục trạng thái lớp');
    },
  });

  const openRejectModal = (c: ClassApprovalItem) => {
    setRejectingClass(c);
    setRejectionReason('');
    setValidationError('');
  };

  const closeRejectModal = () => {
    setRejectingClass(null);
    setRejectionReason('');
    setValidationError('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setValidationError('MSG-033: Vui lòng nhập lý do từ chối/yêu cầu điều chỉnh. Nội dung này không được phép để trống.');
      return;
    }
    if (!rejectingClass) return;
    rejectMutation.mutate({ classId: rejectingClass.classId, reason: rejectionReason.trim() });
  };

  const formatGradeLevel = (lvl?: string) => {
    switch (lvl) {
      case 'INFANT': return 'Nhà trẻ nhỏ (3 - 12 tháng)';
      case 'TODDLER': return 'Nhà trẻ (12 - 36 tháng)';
      case 'NURSERY': return 'Khối Mầm (3 - 4 tuổi)';
      case 'KINDERGARTEN': return 'Khối Chồi & Lá (4 - 6 tuổi)';
      default: return lvl || 'Mẫu giáo';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>UC-013 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt Mở Lớp Học Mới</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Xem xét và ký duyệt hoặc từ chối kế hoạch mở lớp học do Cán bộ Giáo vụ trình duyệt theo quy chuẩn BR-011. Dữ liệu được lưu trực tiếp vào bảng academic.classes.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-center inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-[#275A4E]" />
          <span>Lọc danh sách kế hoạch:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'PENDING_APPROVAL' as const, label: 'Chờ phê duyệt (PENDING)' },
            { id: 'APPROVED' as const, label: 'Đã phê duyệt (APPROVED)' },
            { id: 'REJECTED' as const, label: 'Bị từ chối (REJECTED)' },
            { id: 'ALL' as const, label: 'Tất cả kế hoạch' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Danh Sách Kế Hoạch Mở Lớp */}
      {classes.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <School className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Không có kế hoạch mở lớp nào phù hợp</p>
          <p className="text-xs mt-1">Cán bộ Giáo vụ sẽ gửi đề xuất mở lớp học khi có năm học mới</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((c) => {
            const isApproved = c.status === 'APPROVED';
            const isRejected = c.status === 'REJECTED';
            const isPending = c.status === 'PENDING_APPROVAL' || (c.status as string) === 'PENDING';

            return (
              <div
                key={c.classId}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ DUYỆT</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>TỪ CHỐI</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>CHỜ DUYỆT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {c.className}
                  </h3>

                  <p className="text-xs font-semibold text-[#275A4E] mt-0.5">
                    {formatGradeLevel(c.gradeLevel)}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Sĩ số định mức:</span>
                      <strong className="text-slate-800 font-bold">{c.maxCapacity || 25} trẻ</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phòng học chỉ định:</span>
                      <strong className="text-slate-800 font-bold">{c.roomName || 'Chưa xếp'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Niên khóa:</span>
                      <strong className="text-slate-800 font-bold">{c.academicYearName || '2025-2026'}</strong>
                    </div>
                  </div>

                  {/* Lý do từ chối nếu có */}
                  {isRejected && c.rejectionReason && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Lý do từ chối:</strong> {c.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Nút Phê duyệt / Từ chối / Khôi phục Chờ duyệt */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(c.classId)}
                      disabled={approveMutation.isPending}
                      className="flex-1 min-w-[100px] py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Phê duyệt</span>
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => openRejectModal(c)}
                      className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Từ chối
                    </button>
                  )}

                  {/* Nút Khôi phục Chờ duyệt khi đã phê duyệt hoặc từ chối */}
                  {(isApproved || isRejected) && (
                    <button
                      type="button"
                      onClick={() => resetMutation.mutate(c.classId)}
                      disabled={resetMutation.isPending}
                      title="Khôi phục trạng thái về Chờ phê duyệt (PENDING) trong trường hợp duyệt nhầm"
                      className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục Chờ duyệt</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Từ Chối Kế Hoạch Mở Lớp (Rẽ nhánh A1) */}
      {rejectingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Từ Chối Kế Hoạch Mở Lớp</h3>
                  <p className="text-xs text-slate-500">Lớp: {rejectingClass.className} • BR-011</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do từ chối & Yêu cầu Cán bộ Giáo vụ điều chỉnh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ví dụ: Phòng học 201 hiện đang sửa chữa chưa đủ điều kiện an toàn, đề nghị chuyển lớp sang phòng 104..."
                  className="w-full text-sm p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#275A4E] focus:ring-2 focus:ring-[#78C2AD]/20"
                />
                {validationError && (
                  <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối (MSG-032)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghClassApprovalsPage;
