import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import lessonPlanApprovalApi, { LessonPlanApprovalDto } from '../../api/lessonPlanApprovalApi';
import { useToast } from '../../contexts/ToastContext';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  School,
  Eye,
  RefreshCw,
  Filter,
  X,
  RotateCcw,
  User,
  Layers,
} from 'lucide-react';

export const BghLessonPlanApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'>('PENDING');
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanApprovalDto | null>(null);
  const [revisingPlan, setRevisingPlan] = useState<LessonPlanApprovalDto | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch lesson plans list
  const { data: plansResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['lesson-plan-approvals-bgh', statusFilter],
    queryFn: () => lessonPlanApprovalApi.getLessonPlans({ status: statusFilter }),
  });

  const plans: LessonPlanApprovalDto[] = Array.isArray(plansResponse)
    ? plansResponse
    : ((plansResponse as any)?.data || []);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => lessonPlanApprovalApi.approve(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plan-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'MSG-270: Kế hoạch giáo án đã được thẩm định và phê duyệt thành công.');
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể phê duyệt giáo án');
    },
  });

  // Request revision mutation
  const revisionMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      lessonPlanApprovalApi.requestRevision(id, reason),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plan-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'Đã gửi yêu cầu chỉnh sửa bài giảng tới giáo viên bộ môn thành công.');
      closeRevisionModal();
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể yêu cầu chỉnh sửa giáo án';
      setValidationError(msg);
      error(msg);
    },
  });

  // Reset to pending mutation
  const resetMutation = useMutation({
    mutationFn: (id: string) => lessonPlanApprovalApi.resetPending(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-plan-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'Đã khôi phục kế hoạch giáo án về trạng thái Chờ phê duyệt (PENDING) thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể khôi phục trạng thái giáo án');
    },
  });

  const openRevisionModal = (p: LessonPlanApprovalDto) => {
    setRevisingPlan(p);
    setRevisionNotes('');
    setValidationError('');
  };

  const closeRevisionModal = () => {
    setRevisingPlan(null);
    setRevisionNotes('');
    setValidationError('');
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      setValidationError('MSG-272: Vui lòng nhập đầy đủ nội dung góp ý chuyên môn hoặc yêu cầu điều chỉnh khi trả lại giáo án.');
      return;
    }
    if (!revisingPlan) return;
    revisionMutation.mutate({ id: revisingPlan.id, reason: revisionNotes.trim() });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>UC-077 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt Kế Hoạch Giáo Án Tháng</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Thẩm định tính sư phạm, mục tiêu phát triển và đồ dùng học liệu của giáo án tuần/tháng (BR-114, BR-115). Dữ liệu được lưu trực tiếp vào bảng academic.lesson_plan.
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
          <span>Lọc danh sách giáo án:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'PENDING' as const, label: 'Chờ phê duyệt (PENDING)' },
            { id: 'APPROVED' as const, label: 'Đã phê duyệt (APPROVED)' },
            { id: 'REVISION_REQUESTED' as const, label: 'Cần chỉnh sửa (REVISION_REQUESTED)' },
            { id: 'ALL' as const, label: 'Tất cả giáo án' },
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

      {/* Grid Danh Sách Giáo Án */}
      {plans.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Chưa có kế hoạch giáo án nào cần thẩm định</p>
          <p className="text-xs mt-1">Giáo viên phụ trách lớp sẽ nộp giáo án tuần trước khi bắt đầu hoạt động</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((p) => {
            const isApproved = p.status === 'APPROVED';
            const isRevision = p.status === 'REVISION_REQUESTED';
            const isPending = p.status === 'PENDING';

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ DUYỆT</span>
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
                          <span>CHỜ DUYỆT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {p.title}
                  </h3>

                  <p className="text-xs font-semibold text-[#275A4E] mt-0.5">
                    {p.topic}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Giáo viên soạn:</span>
                      <strong className="text-slate-800 font-bold">{p.teacherName}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lớp học:</span>
                      <strong className="text-slate-800 font-bold">{p.className}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hạn phê duyệt:</span>
                      <strong className="text-slate-800 font-bold">{p.deadlineDate}</strong>
                    </div>
                  </div>

                  {/* Nhận xét chỉ đạo nếu có */}
                  {isRevision && p.reviewNotes && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Góp ý chuyên môn:</strong> {p.reviewNotes}
                    </div>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(p)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem giáo án</span>
                  </button>

                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(p.id)}
                      disabled={approveMutation.isPending}
                      className="py-2 px-3 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt</span>
                    </button>
                  )}

                  {!isRevision && (
                    <button
                      type="button"
                      onClick={() => openRevisionModal(p)}
                      className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Cần chỉnh sửa
                    </button>
                  )}

                  {/* Nút Khôi phục Chờ duyệt khi đã duyệt hoặc yêu cầu chỉnh sửa */}
                  {(isApproved || isRevision) && (
                    <button
                      type="button"
                      onClick={() => resetMutation.mutate(p.id)}
                      disabled={resetMutation.isPending}
                      title="Khôi phục giáo án về trạng thái Chờ phê duyệt (PENDING)"
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

      {/* Modal Chi Tiết Kế Hoạch Giáo Án */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#78C2AD]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedPlan.title}</h3>
                  <p className="text-xs text-[#78C2AD]">Giáo viên: {selectedPlan.teacherName} • Lớp: {selectedPlan.className}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlan(null)} className="p-1 rounded-full text-white/80 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-[#275A4E] uppercase tracking-wider mb-1">Chủ đề bài học</h4>
                <p className="text-sm font-semibold text-slate-800">{selectedPlan.topic}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">1. Mục tiêu đào tạo (Objectives)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedPlan.objectives}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">2. Tiến trình hoạt động (Activities)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedPlan.activities}</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">3. Đồ dùng & Học liệu chuẩn bị (Materials)</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{selectedPlan.materials}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Trạng thái: <strong className="text-slate-800">{selectedPlan.status}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRevisionModal(selectedPlan)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                >
                  Yêu cầu chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(selectedPlan.id)}
                  disabled={approveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-sm"
                >
                  {approveMutation.isPending ? 'Đang duyệt...' : 'Phê duyệt giáo án (MSG-270)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Chỉnh Sửa Giáo Án */}
      {revisingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Yêu Cầu Chỉnh Sửa Giáo Án</h3>
                  <p className="text-xs text-slate-500">Giáo viên: {revisingPlan.teacherName} • BR-115</p>
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
                  Nội dung góp ý chuyên môn hoặc yêu cầu điều chỉnh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => {
                    setRevisionNotes(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ví dụ: Hoạt động tạo hình cần bổ sung hướng dẫn an toàn khi sử dụng kéo, thời lượng tiết âm nhạc kéo dài 35 phút là quá sức với trẻ 3 tuổi..."
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
                  {revisionMutation.isPending ? 'Đang gửi...' : 'Gửi chỉ đạo chỉnh sửa (MSG-272)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghLessonPlanApprovalsPage;
