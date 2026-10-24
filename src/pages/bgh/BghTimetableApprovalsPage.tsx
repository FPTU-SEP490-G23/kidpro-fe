import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import timetableApprovalApi, { TimetableClassApproval, TimetableSlot } from '../../api/timetableApprovalApi';
import { useToast } from '../../contexts/ToastContext';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  School,
  DoorOpen,
  Eye,
  RefreshCw,
  Filter,
  X,
  Send,
  Calendar,
  Layers,
  RotateCcw,
} from 'lucide-react';

export const BghTimetableApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'NEEDS_REVISION'>('PENDING');
  const [viewingDetail, setViewingDetail] = useState<TimetableClassApproval | null>(null);
  const [revisingClass, setRevisingClass] = useState<TimetableClassApproval | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch approvals list
  const { data: list = [], isLoading, isFetching, refetch } = useQuery<TimetableClassApproval[]>({
    queryKey: ['timetable-approvals-bgh', statusFilter],
    queryFn: () => timetableApprovalApi.getApprovals(statusFilter),
  });

  // Fetch detail query when viewing
  const { data: detailData, isLoading: isDetailLoading } = useQuery<TimetableClassApproval>({
    queryKey: ['timetable-class-detail', viewingDetail?.classId],
    queryFn: () => timetableApprovalApi.getClassTimetableDetail(viewingDetail!.classId),
    enabled: Boolean(viewingDetail?.classId),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (classId: string) => timetableApprovalApi.approveTimetable(classId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['timetable-approvals-bgh'] });
      queryClient.invalidateQueries({ queryKey: ['timetable-class-detail'] });
      success(res?.message || 'MSG-046: Thời khóa biểu tuần đã được phê duyệt và ban hành chính thức thành công tới giáo viên và phụ huynh.');
      setViewingDetail(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể phê duyệt thời khóa biểu');
    },
  });

  // Request revision mutation
  const revisionMutation = useMutation({
    mutationFn: ({ classId, reason }: { classId: string; reason: string }) =>
      timetableApprovalApi.requestRevision(classId, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['timetable-approvals-bgh'] });
      queryClient.invalidateQueries({ queryKey: ['timetable-class-detail'] });
      success(res?.message || 'MSG-047: Đã gửi yêu cầu chỉnh sửa thời khóa biểu về Cán bộ Giáo vụ thành công.');
      closeRevisionModal();
      setViewingDetail(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu chỉnh sửa';
      setValidationError(msg);
      error(msg);
    },
  });

  // Reset to pending mutation
  const resetMutation = useMutation({
    mutationFn: (classId: string) => timetableApprovalApi.resetPendingTimetable(classId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['timetable-approvals-bgh'] });
      queryClient.invalidateQueries({ queryKey: ['timetable-class-detail'] });
      success(res?.message || 'Đã khôi phục thời khóa biểu về trạng thái Chờ phê duyệt (PENDING_APPROVAL) thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể khôi phục trạng thái thời khóa biểu');
    },
  });

  const openRevisionModal = (item: TimetableClassApproval) => {
    setRevisingClass(item);
    setRevisionNotes('');
    setValidationError('');
  };

  const closeRevisionModal = () => {
    setRevisingClass(null);
    setRevisionNotes('');
    setValidationError('');
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      setValidationError('MSG-033: Vui lòng nhập lý do từ chối/yêu cầu điều chỉnh. Nội dung này không được phép để trống.');
      return;
    }
    if (!revisingClass) return;
    revisionMutation.mutate({ classId: revisingClass.classId, reason: revisionNotes.trim() });
  };

  const daysOfWeek = [
    { key: 'MONDAY', label: 'Thứ Hai' },
    { key: 'TUESDAY', label: 'Thứ Ba' },
    { key: 'WEDNESDAY', label: 'Thứ Tư' },
    { key: 'THURSDAY', label: 'Thứ Năm' },
    { key: 'FRIDAY', label: 'Thứ Sáu' },
  ];

  const currentSlots: TimetableSlot[] = detailData?.slots || viewingDetail?.slots || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>UC-020 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt & Ban Hành Thời Khóa Biểu</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Thẩm định khung hoạt động học tập, đảm bảo không xung đột phòng chức năng (BR-013), ký duyệt ban hành hoặc yêu cầu Cán bộ Giáo vụ chỉnh sửa (BR-011). Dữ liệu được lưu vào bảng academic.weekly_timetable.
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
          <span>Lọc danh sách thời khóa biểu:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'PENDING' as const, label: 'Chờ phê duyệt (PENDING)' },
            { id: 'APPROVED' as const, label: 'Đã ban hành (APPROVED / PUBLISHED)' },
            { id: 'NEEDS_REVISION' as const, label: 'Cần chỉnh sửa (NEEDS_REVISION)' },
            { id: 'ALL' as const, label: 'Tất cả lớp học' },
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

      {/* Grid Danh Sách Thời Khóa Biểu Các Lớp */}
      {list.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Chưa có thời khóa biểu nào cần phê duyệt</p>
          <p className="text-xs mt-1">Cán bộ Giáo vụ sẽ thiết lập khung thời khóa biểu tuần và gửi duyệt</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map((item) => {
            const isApproved = item.status === 'APPROVED' || item.status === 'PUBLISHED';
            const isRevision = item.status === 'NEEDS_REVISION';
            const isPending = item.status === 'PENDING' || item.status === 'PENDING_APPROVAL';

            return (
              <div
                key={item.classId}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ BAN HÀNH</span>
                        </span>
                      )}
                      {isRevision && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>CẦN SỬA ĐỔI</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>CHỜ BGH DUYỆT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {item.className}
                  </h3>

                  <p className="text-xs font-semibold text-[#275A4E] mt-0.5">
                    Khối: {item.gradeLevel || 'Mầm non'}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Phòng học:</span>
                      <strong className="text-slate-800 font-bold">{item.roomName}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tổng số tiết học/tuần:</span>
                      <strong className="text-slate-900 font-extrabold">{item.totalSlots} tiết</strong>
                    </div>
                  </div>

                  {/* Ghi chú yêu cầu sửa đổi nếu có */}
                  {isRevision && item.revisionNotes && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Chỉ đạo sửa đổi:</strong> {item.revisionNotes}
                    </div>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDetail(item)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lịch học</span>
                  </button>

                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(item.classId)}
                      disabled={approveMutation.isPending}
                      className="py-2 px-3 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt & Ban hành</span>
                    </button>
                  )}

                  {!isRevision && (
                    <button
                      type="button"
                      onClick={() => openRevisionModal(item)}
                      className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Cần chỉnh sửa
                    </button>
                  )}

                  {/* Nút Khôi phục Chờ duyệt khi đã phê duyệt hoặc yêu cầu chỉnh sửa */}
                  {(isApproved || isRevision) && (
                    <button
                      type="button"
                      onClick={() => resetMutation.mutate(item.classId)}
                      disabled={resetMutation.isPending}
                      title="Khôi phục thời khóa biểu về trạng thái Chờ duyệt (PENDING_APPROVAL)"
                      className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Xem Chi Tiết Thời Khóa Biểu Tuần */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#78C2AD]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Thời Khóa Biểu: {viewingDetail.className}</h3>
                  <p className="text-xs text-[#78C2AD]">Phòng: {viewingDetail.roomName} • UC-020 Ban Giám Hiệu</p>
                </div>
              </div>
              <button onClick={() => setViewingDetail(null)} className="p-1 rounded-full text-white/80 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {isDetailLoading ? (
                <div className="py-12 text-center text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-[#275A4E]" />
                  <p className="text-sm font-semibold">Đang tải chi tiết lịch học tuần...</p>
                </div>
              ) : currentSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                  <p className="text-sm font-semibold">Lớp học này chưa có tiết học nào được thiết lập trong tuần</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {daysOfWeek.map((day) => {
                    const daySlots = currentSlots.filter((s) => s.dayOfWeek === day.key);

                    return (
                      <div key={day.key} className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                        <div className="text-center font-extrabold text-xs text-[#275A4E] pb-2 border-b border-slate-200 mb-2">
                          {day.label}
                        </div>
                        <div className="space-y-2">
                          {daySlots.length === 0 ? (
                            <p className="text-[11px] text-slate-400 text-center py-4 italic">Nghỉ / Tự do</p>
                          ) : (
                            daySlots.map((s, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#78C2AD] transition text-left"
                              >
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#78C2AD]/20 text-[#275A4E] mb-1">
                                  {s.startTime?.substring(0, 5)} - {s.endTime?.substring(0, 5)}
                                </span>
                                <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{s.activityName}</h4>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Trạng thái: <strong className="text-slate-800">{viewingDetail.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRevisionModal(viewingDetail)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                >
                  Yêu cầu chỉnh sửa (Rẽ nhánh A1)
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(viewingDetail.classId)}
                  disabled={approveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-sm"
                >
                  {approveMutation.isPending ? 'Đang duyệt...' : 'Phê duyệt & Ban hành (MSG-046)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Chỉnh Sửa Thời Khóa Biểu (Rẽ nhánh A1) */}
      {revisingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Yêu Cầu Chỉnh Sửa Thời Khóa Biểu</h3>
                  <p className="text-xs text-slate-500">Lớp: {revisingClass.className} • BR-011</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRevisionModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ý kiến chuyên môn & Hướng dẫn điều chỉnh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => {
                    setRevisionNotes(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ví dụ: Tiết Thể chất chiều Thứ 3 bị trùng với lớp Mầm 1 tại phòng đa năng, đề nghị chuyển sang sáng Thứ 4..."
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
                  onClick={closeRevisionModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={revisionMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {revisionMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu điều chỉnh (MSG-047)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghTimetableApprovalsPage;
