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
} from 'lucide-react';

export const BghTimetableApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PUBLISHED' | 'NEEDS_REVISION'>('PENDING');
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

  const currentSlots = detailData?.slots || [];

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
            Xem xét chi tiết lịch sinh hoạt tuần, kiểm soát xung đột giờ học và ký duyệt ban hành công khai tới Giáo viên và Phụ huynh (BR-011, BR-013).
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
            { id: 'PUBLISHED' as const, label: 'Đã ban hành (PUBLISHED)' },
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
            const isPublished = item.status === 'PUBLISHED';
            const isRevision = item.status === 'NEEDS_REVISION';
            const isPending = item.status === 'PENDING';

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
                      {isPublished && (
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
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingDetail(item)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lịch học</span>
                  </button>

                  {!isPublished && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(item.classId)}
                      disabled={approveMutation.isPending}
                      className="flex-1 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt & Ban hành</span>
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
                      <div key={day.key} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 flex flex-col gap-2">
                        <div className="text-center pb-2 border-b border-slate-200">
                          <span className="text-xs font-extrabold text-[#275A4E] uppercase">{day.label}</span>
                        </div>

                        <div className="space-y-2 flex-1">
                          {daySlots.length === 0 ? (
                            <p className="text-[11px] text-slate-400 text-center py-4">Nghỉ / Tự do</p>
                          ) : (
                            daySlots.map((s) => (
                              <div
                                key={s.timetableId}
                                className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs"
                              >
                                <span className="font-mono text-[10px] text-slate-400 block font-semibold">
                                  {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                                </span>
                                <strong className="text-slate-800 text-[11px] block mt-0.5 leading-snug">
                                  {s.activityName}
                                </strong>
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

            {/* Footer Modal với nút Phê duyệt / Yêu cầu sửa */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Trạng thái hiện tại:{' '}
                <strong className="text-slate-800 uppercase">{viewingDetail.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRevisionModal(viewingDetail)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                >
                  Yêu cầu chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(viewingDetail.classId)}
                  disabled={approveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ký duyệt & Ban hành</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Chỉnh Sửa Thời Khóa Biểu (Rẽ nhánh A1) */}
      {revisingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Yêu cầu chỉnh sửa thời khóa biểu</h3>
                  <p className="text-xs text-slate-500">Lớp: {revisingClass.className}</p>
                </div>
              </div>
              <button onClick={closeRevisionModal} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy tắc <strong>BR-011</strong>, khi yêu cầu sửa đổi, bắt buộc phải nêu rõ nội dung góp ý chuyên môn gửi về Cán bộ Giáo vụ (MSG-033).
            </p>

            <form onSubmit={handleConfirmRevision} className="space-y-3">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội dung góp ý & Chỉ đạo chuyên môn *
                </label>
                <textarea
                  rows={3}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Ví dụ: Giảm tải hoạt động thể chất ngoài trời vào giờ trưa thứ Tư, chuyển tiết Âm nhạc sang sáng thứ Sáu..."
                  className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:border-[#275A4E] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeRevisionModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={revisionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {revisionMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu chỉnh sửa'}
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
