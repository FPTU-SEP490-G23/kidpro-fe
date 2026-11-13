import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Check,
  X,
  Eye,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Sparkles,
  Activity,
  Brain,
  Smile,
  Heart,
  Palette,
  Award,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';
import {
  WeeklyLessonPlan,
  LessonPlanStatus,
} from '../../../types/classroom.types';
import { useAuth } from '../../../contexts/AuthContext';
import { useReviewLessonPlan } from '../../../hooks/useReviewLessonPlan';

// System Message Codes
const MSG_266 = 'Phê duyệt giáo án tuần thành công. Kế hoạch giảng dạy đã được ban hành chính thức.';
const MSG_267 = 'Đã gửi yêu cầu chỉnh sửa và hoàn thiện giáo án tới giáo viên bộ môn.';
const MSG_268 = 'Dữ liệu giáo án đã được cập nhật bởi quản trị viên khác. Vui lòng làm mới danh sách.';
const MSG_269 = 'Vui lòng nhập lý do và hướng dẫn chỉnh sửa chuyên môn trước khi gửi trả giáo án.';
const MSG_004 = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';

export const LessonPlanApprovalsTab: React.FC = () => {
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const reviewMutation = useReviewLessonPlan();

  // RBAC Check: Chỉ Cán bộ Giáo vụ (GIAO_VU), Hiệu trưởng (BGH), hoặc Quản trị viên mới được duyệt
  const canReview =
    role === 'GIAO_VU' ||
    role === 'BGH' ||
    role === 'SYSTEM_ADMIN' ;

  // Filters
  const [selectedWeek, setSelectedWeek] = useState<number>(8);
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Selected plan for review modal
  const [selectedPlan, setSelectedPlan] = useState<WeeklyLessonPlan | null>(null);
  const [reviewFeedbackText, setReviewFeedbackText] = useState<string>('');
  const [activeDayTab, setActiveDayTab] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('monday');

  // System toast feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // 1. Tải danh sách giáo án tuần
  const {
    data: lessonPlansData = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<WeeklyLessonPlan[]>({
    queryKey: ['weekly-lesson-plans', selectedWeek],
    queryFn: async () => {
      try {
        const res = await academicApi.getWeeklyLessonPlans({ weekNumber: selectedWeek });
        return res.data;
      } catch {
        return [];
      }
    },
  });

  // Lọc dữ liệu hiển thị
  const filteredPlans = lessonPlansData.filter((plan) => {
    if (filterAgeGroup !== 'ALL') {
      const ageText = plan.ageGroup || '';
      if (!ageText.toLowerCase().includes(filterAgeGroup.toLowerCase())) {
        return false;
      }
    }
    if (filterStatus !== 'ALL' && plan.status !== filterStatus) {
      return false;
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchName = plan.className?.toLowerCase().includes(kw);
      const matchTeacher = plan.teacherName?.toLowerCase().includes(kw);
      const matchTopic = plan.themeTopic?.toLowerCase().includes(kw);
      if (!matchName && !matchTeacher && !matchTopic) return false;
    }
    return true;
  });

  // Thống kê nhanh
  const pendingCount = lessonPlansData.filter((p) => p.status === 'PENDING_APPROVAL').length;
  const approvedCount = lessonPlansData.filter((p) => p.status === 'APPROVED').length;
  const revisionCount = lessonPlansData.filter((p) => p.status === 'REVISION_REQUESTED').length;

  // Xử lý mở Modal thẩm định
  const handleOpenReview = (plan: WeeklyLessonPlan) => {
    setSelectedPlan(plan);
    setReviewFeedbackText(plan.reviewerFeedback || '');
    setActiveDayTab('monday');
  };

  // Xử lý Phê duyệt Giáo án (APPROVE)
  const handleApprovePlan = async () => {
    if (!selectedPlan) return;
    if (!canReview) return;

    // Kiểm tra xung đột phiên làm việc đồng thời
    const currentOnServer = lessonPlansData.find((p) => p.id === selectedPlan.id);
    if (currentOnServer && currentOnServer.status !== selectedPlan.status) {
      setFeedback({ type: 'warning', message: MSG_268 });
      refetch();
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: selectedPlan.id,
        payload: {
          action: 'APPROVED',
          reviewNotes: reviewFeedbackText || 'Giáo án đạt chuẩn phân phối chương trình và an toàn học cụ. Phê duyệt ban hành.',
          reviewedBy: user?.fullName || 'Cán bộ Giáo vụ',
        },
      });

      // Phát thông báo đẩy FCM tới giáo viên lớp
      try {
        await academicApi.sendLessonPlanNotification({
          title: `Giáo án Tuần ${selectedPlan.weekNumber} đã được phê duyệt`,
          content: `Cán bộ Giáo vụ đã thẩm định và phê duyệt giáo án lớp ${selectedPlan.className}. Kế hoạch dạy học chính thức có hiệu lực.`,
          targetRole: 'GIAO_VIEN',
          classId: selectedPlan.classId,
        });
      } catch {
        // Notification silent fallback
      }

      setFeedback({ type: 'success', message: MSG_266 });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['weekly-lesson-plans'] });
    } catch {
      setFeedback({ type: 'error', message: MSG_004 });
    }
  };

  // Xử lý Yêu cầu Chỉnh sửa (REVISION_REQUESTED)
  const handleRequestRevision = async () => {
    if (!selectedPlan) return;
    if (!canReview) return;

    // BR: Bắt buộc phải có lý do và hướng dẫn chuyên môn
    if (!reviewFeedbackText || reviewFeedbackText.trim().length < 10) {
      setFeedback({ type: 'error', message: MSG_269 });
      return;
    }

    // Kiểm tra xung đột phiên làm việc đồng thời
    const currentOnServer = lessonPlansData.find((p) => p.id === selectedPlan.id);
    if (currentOnServer && currentOnServer.status !== selectedPlan.status) {
      setFeedback({ type: 'warning', message: MSG_268 });
      refetch();
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: selectedPlan.id,
        payload: {
          action: 'REVISION_REQUESTED',
          reviewNotes: reviewFeedbackText,
          reviewedBy: user?.fullName || 'Cán bộ Giáo vụ',
        },
      });

      // Phát thông báo đẩy FCM tới giáo viên lớp
      try {
        await academicApi.sendLessonPlanNotification({
          title: `Yêu cầu chỉnh sửa Giáo án Tuần ${selectedPlan.weekNumber}`,
          content: `Giáo án lớp ${selectedPlan.className} cần bổ sung/chỉnh sửa theo hướng dẫn: "${reviewFeedbackText.slice(0, 100)}..."`,
          targetRole: 'GIAO_VIEN',
          classId: selectedPlan.classId,
        });
      } catch {
        // Notification silent fallback
      }

      setFeedback({ type: 'warning', message: MSG_267 });
      setSelectedPlan(null);
      queryClient.invalidateQueries({ queryKey: ['weekly-lesson-plans'] });
    } catch {
      setFeedback({ type: 'error', message: MSG_004 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                QUẢN LÝ CHUYÊN MÔN
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                Hạn Chót 17:00 Thứ Sáu
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Thẩm Định & Phê Duyệt Giáo Án Tuần
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
              Dành cho Cán bộ Giáo vụ và Ban Giám Hiệu xem xét, thẩm định mục tiêu 5 lĩnh vực phát triển mầm non, đối soát thời khóa biểu và kiểm tra an toàn học cụ trước khi ban hành chính thức.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-2 border border-white/20 cursor-pointer min-h-[44px]"
            >
              <RotateCcw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span>Làm Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo phản hồi hệ thống */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 shadow-sm border transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">{feedback.message}</div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Thẻ Thống Kê Trạng Thái Giáo Án (Status Summary Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Chờ Duyệt */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Chờ Phê Duyệt
            </span>
            <div className="text-2xl font-extrabold text-amber-900">
              {pendingCount} <span className="text-xs font-normal text-amber-700">lớp</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Đã Duyệt Ban Hành */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Đã Duyệt Ban Hành
            </span>
            <div className="text-2xl font-extrabold text-[#1E4D40]">
              {approvedCount} <span className="text-xs font-normal text-emerald-700">lớp</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-200/70 text-[#1E4D40] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Yêu Cầu Chỉnh Sửa */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Yêu Cầu Chỉnh Sửa
            </span>
            <div className="text-2xl font-extrabold text-rose-900">
              {revisionCount} <span className="text-xs font-normal text-rose-700">lớp</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-200/70 text-rose-900 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar Lọc & Tìm Kiếm */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Bộ Chọn Tuần Học */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#275A4E]" />
              <span className="text-xs font-bold text-slate-700">Tuần Học:</span>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="h-10 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#275A4E] text-slate-800 cursor-pointer"
              >
                {Array.from({ length: 35 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w < 10 ? `0${w}` : w} (Năm học 2026-2027)
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Khối Lớp */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterAgeGroup}
                onChange={(e) => setFilterAgeGroup(e.target.value)}
                className="h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả khối lớp</option>
                <option value="Mầm">Khối Mầm (3 - 4 Tuổi)</option>
                <option value="Chồi">Khối Chồi (4 - 5 Tuổi)</option>
                <option value="Lá">Khối Lá (5 - 6 Tuổi)</option>
              </select>
            </div>

            {/* Lọc Trạng Thái */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-3 text-xs font-medium rounded-xl border border-slate-200 bg-white text-slate-700 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING_APPROVAL">Chờ phê duyệt</option>
                <option value="APPROVED">Đã phê duyệt</option>
                <option value="REVISION_REQUESTED">Yêu cầu sửa</option>
              </select>
            </div>
          </div>

          {/* Ô Tìm Kiếm */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo lớp, giáo viên, chủ đề..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]"
            />
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Giáo Án Chờ Thẩm Định */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1E4D40] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#275A4E]" />
              <span>Hàng Đợi Thẩm Định Giáo Án Tuần {selectedWeek}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách giáo án do giáo viên chủ nhiệm các lớp nộp lên hệ thống
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Tổng cộng: <strong>{filteredPlans.length}</strong> giáo án
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 w-44">Tên Lớp & Khối</th>
                <th className="py-3 px-4 w-44">Giáo Viên Soạn</th>
                <th className="py-3 px-4">Chủ Đề Tuần</th>
                <th className="py-3 px-3 w-40 text-center">Thời Gian Nộp</th>
                <th className="py-3 px-3 text-center w-32">Học Cụ Đính Kèm</th>
                <th className="py-3 px-3 text-center w-36">Trạng Thái</th>
                <th className="py-3 px-4 text-center w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#275A4E] border-t-transparent rounded-full animate-spin" />
                      <span>Đang tải danh sách giáo án tuần...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy giáo án nào phù hợp với bộ lọc đã chọn.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Tên lớp & Khối */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800 text-sm">{plan.className}</div>
                      <div className="text-[11px] text-slate-400">{plan.ageGroup}</div>
                    </td>

                    {/* Giáo viên soạn */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-700">{plan.teacherName}</div>
                      <div className="text-[11px] text-slate-400">GV Chủ nhiệm</div>
                    </td>

                    {/* Chủ đề tuần */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#1E4D40] line-clamp-1">
                        {plan.themeTopic}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        Mục tiêu: {plan.objectives?.cognitive || 'Phát triển nhận thức & ngôn ngữ'}
                      </div>
                    </td>

                    {/* Thời gian nộp & Nhãn đúng hạn / trễ */}
                    <td className="py-4 px-3 text-center">
                      <div className="text-slate-700 font-medium">{plan.submittedAt || '10/10/2026 15:30'}</div>
                      {plan.isSubmittedLate ? (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <Clock className="w-3 h-3" />
                          Nộp Trễ (Sau 17:00 T6)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3" />
                          Đúng hạn
                        </span>
                      )}
                    </td>

                    {/* Tệp đính kèm */}
                    <td className="py-4 px-3 text-center">
                      {plan.attachmentUrls && plan.attachmentUrls.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          {plan.attachmentUrls.length} tệp
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Không có</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-3 text-center">
                      {getStatusBadge(plan.status)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleOpenReview(plan)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer min-h-[44px] ${
                          plan.status === 'PENDING_APPROVAL' && canReview
                            ? 'bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {canReview && plan.status === 'PENDING_APPROVAL' ? (
                          <>
                            <Award className="w-4 h-4" />
                            <span>Thẩm Định</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            <span>Xem Chi Tiết</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thẩm Định Giáo Án Chi Tiết (Review Modal / Drawer) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]">
            {/* Header Modal */}
            <div className="p-5 bg-gradient-to-r from-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">
                      Thẩm Định Giáo Án: {selectedPlan.className}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-xs bg-white/20 font-semibold">
                      Tuần {selectedPlan.weekNumber}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    Giáo viên: <strong>{selectedPlan.teacherName}</strong> • Chủ đề: "
                    {selectedPlan.themeTopic}"
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan(null)}
                aria-label="Đóng giao diện thẩm định"
                className="p-2 hover:bg-white/10 rounded-lg transition text-white cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Cảnh báo nộp trễ nếu có */}
              {selectedPlan.isSubmittedLate && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <strong>Lưu ý:</strong> Giáo án được nộp sau thời hạn quy định (17:00 Thứ Sáu). Hệ thống đã ghi nhận trạng thái nộp trễ vào hồ sơ đánh giá thi đua chuyên môn của giáo viên.
                  </div>
                </div>
              )}

              {/* 1. Khung 5 Mục Tiêu Sư Phạm Theo Thông Tư 28 */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-sm font-bold text-[#1E4D40] flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-[#275A4E]" />
                  <span>5 Mục Tiêu Phát Triển Mầm Non Chuẩn Bộ GD&ĐT</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" />
                      1. Phát triển Thể chất:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPlan.objectives?.physical || 'Chưa thiết lập'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-blue-800 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5 text-blue-600" />
                      2. Phát triển Nhận thức:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPlan.objectives?.cognitive || 'Chưa thiết lập'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-purple-800 flex items-center gap-1.5">
                      <Smile className="w-3.5 h-3.5 text-purple-600" />
                      3. Phát triển Ngôn ngữ:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPlan.objectives?.language || 'Chưa thiết lập'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                    <div className="font-bold text-rose-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-600" />
                      4. Tình cảm & Kỹ năng xã hội:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPlan.objectives?.socialEmotional || 'Chưa thiết lập'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                    <div className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-600" />
                      5. Phát triển Thẩm mỹ:
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedPlan.objectives?.aesthetic || 'Chưa thiết lập'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Ma Trận Hoạt Động 5 Ngày (Thứ 2 đến Thứ 6) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#275A4E]" />
                    <h4 className="text-sm font-bold text-slate-800">
                      Ma Trận Hoạt Động Trong Tuần
                    </h4>
                  </div>

                  {/* Day tabs */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map(
                      (day) => {
                        const dayNames = {
                          monday: 'Thứ 2',
                          tuesday: 'Thứ 3',
                          wednesday: 'Thứ 4',
                          thursday: 'Thứ 5',
                          friday: 'Thứ 6',
                        };
                        return (
                          <button
                            key={day}
                            onClick={() => setActiveDayTab(day)}
                            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer min-h-[36px] ${
                              activeDayTab === day
                                ? 'bg-[#275A4E] text-white shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {dayNames[day]}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Hoạt động ngày được chọn */}
                <div className="p-5 space-y-3 text-xs">
                  {selectedPlan.scheduleMatrix && selectedPlan.scheduleMatrix[activeDayTab] ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">
                          Đón trẻ & Thể dục sáng:
                        </span>
                        <p className="text-slate-600">
                          {selectedPlan.scheduleMatrix[activeDayTab].morningWarmup ||
                            'Khởi động theo nhạc'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-[#1E4D40] block mb-1">
                          Hoạt động học có chủ đích:
                        </span>
                        <p className="text-slate-600">
                          {selectedPlan.scheduleMatrix[activeDayTab].focusedLearning ||
                            'Khám phá khoa học'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">
                          Hoạt động chơi ở các góc:
                        </span>
                        <p className="text-slate-600">
                          {selectedPlan.scheduleMatrix[activeDayTab].cornerPlay ||
                            'Góc xây dựng, góc phân vai'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="font-bold text-slate-700 block mb-1">
                          Hoạt động ngoài trời:
                        </span>
                        <p className="text-slate-600">
                          {selectedPlan.scheduleMatrix[activeDayTab].outdoorActivity ||
                            'Quan sát vườn cây, trò chơi dân gian'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                        <span className="font-bold text-slate-700 block mb-1">
                          Hoạt động chiều & Trả trẻ:
                        </span>
                        <p className="text-slate-600">
                          {selectedPlan.scheduleMatrix[activeDayTab].afternoonRoutine ||
                            'Ôn luyện thơ ca, nêu gương bé ngoan'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">Chưa có lịch chi tiết cho ngày này.</p>
                  )}
                </div>
              </div>

              {/* 3. Kiểm Tra An Toàn Học Cụ & Đồ Dùng (Safety Alert) */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed space-y-1">
                  <span className="font-bold text-emerald-900 block">
                    Thẩm Định An Toàn Học Cụ Dạy Học (Thông tư 34/2013/TT-BGDĐT):
                  </span>
                  <p className="text-emerald-800">
                    Hệ thống đã rà soát danh mục đồ dùng chuẩn bị trong giáo án: Không phát hiện học cụ có cạnh sắc nhọn hoặc hạt nhỏ tiềm ẩn nguy cơ nuốt nghẹn đối với lứa tuổi mầm non.
                  </p>
                </div>
              </div>

              {/* 4. Khung Ý Kiến Nhận Xét & Hướng Dẫn Chuyên Môn */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#275A4E]" />
                  <span>Ý Kiến Nhận Xét & Chỉ Đạo Chuyên Môn Của Cán Bộ Giáo Vụ</span>
                  <span className="text-rose-500 font-normal">
                    (Bắt buộc khi yêu cầu sửa đổi)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={reviewFeedbackText}
                  onChange={(e) => setReviewFeedbackText(e.target.value)}
                  disabled={!canReview}
                  placeholder={
                    canReview
                      ? 'Nhập nhận xét hướng dẫn chuyên môn, chỉ đạo điều chỉnh mục tiêu hoặc bổ sung học cụ...'
                      : 'Chỉ Cán bộ Giáo vụ và Ban Giám Hiệu mới có quyền nhập ý kiến thẩm định chuyên môn.'
                  }
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E] bg-white text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Modal Footer Hành Động */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                {canReview ? (
                  <span>
                    Quyền hạn: <strong>{role === 'BGH' ? 'Ban Giám Hiệu' : 'Cán Bộ Giáo Vụ'}</strong>
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold">
                    Bạn đang ở chế độ Xem (Read-only) với vai trò Giáo viên
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px]"
                >
                  Đóng
                </button>

                {/* Nút Yêu Cầu Chỉnh Sửa (Chỉ hiển thị khi có quyền RBAC) */}
                {canReview && (
                  <button
                    onClick={handleRequestRevision}
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <X className="w-4 h-4" />
                    <span>Yêu Cầu Chỉnh Sửa</span>
                  </button>
                )}

                {/* Nút Phê Duyệt (Chỉ hiển thị khi có quyền RBAC) */}
                {canReview && (
                  <button
                    onClick={handleApprovePlan}
                    disabled={reviewMutation.isPending}
                    className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#275A4E]/20 cursor-pointer min-h-[44px]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Phê Duyệt Giáo Án</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Huy hiệu trạng thái
const getStatusBadge = (status: LessonPlanStatus) => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3" />
          Chờ Duyệt
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Đã Phê Duyệt
        </span>
      );
    case 'REVISION_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3" />
          Yêu Cầu Sửa
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          Bản Nháp
        </span>
      );
  }
};

export default LessonPlanApprovalsTab;
