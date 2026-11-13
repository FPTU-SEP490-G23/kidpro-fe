import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Star,
  Users,
  Layers,
  Sparkles,
  Lock,
  ArrowUp,
  ArrowDown,
  Trash2,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { surveyService } from '../../../services/surveyService';
import {
  SurveySummaryItem,
  SurveyDetailDTO,
  SurveyAnalyticsResponse,
  CreateSurveyPayload,
  QuestionType,
  SurveyStatus,
} from '../../../types/survey.types';

const GRADE_LEVEL_OPTIONS = [
  { id: 'ALL', label: 'Phụ huynh toàn trường' },
  { id: 'NHA_TRE', label: 'Khối Nhà trẻ (18 - 36 tháng)' },
  { id: 'MAM', label: 'Khối Mầm (3 - 4 tuổi)' },
  { id: 'CHOI', label: 'Khối Chồi (4 - 5 tuổi)' },
  { id: 'LA', label: 'Khối Lá (5 - 6 tuổi)' },
];

const QUESTION_TYPES: { type: QuestionType; label: string; icon: string }[] = [
  { type: 'SINGLE_CHOICE', label: 'Trắc nghiệm chọn 1 (Radio)', icon: '🔘' },
  { type: 'MULTIPLE_CHOICE', label: 'Chọn nhiều đáp án (Checkbox)', icon: '☑️' },
  { type: 'RATING', label: 'Đánh giá thang điểm (1 - 5 sao)', icon: '⭐' },
  { type: 'TEXT', label: 'Ý kiến đóng góp mở (Tự luận)', icon: '✍️' },
];

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const SurveyManagementTab: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveySummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Form Builder State
  const [showBuilder, setShowBuilder] = useState<boolean>(false);
  const [builderTitle, setBuilderTitle] = useState<string>('');
  const [builderDescription, setBuilderDescription] = useState<string>('');
  const [builderTargetGrade, setBuilderTargetGrade] = useState<string>('ALL');
  const [builderStartDate, setBuilderStartDate] = useState<string>('');
  const [builderEndDate, setBuilderEndDate] = useState<string>('');
  const [builderQuestions, setBuilderQuestions] = useState<
    {
      id: string;
      questionText: string;
      questionType: QuestionType;
      isRequired: boolean;
      options: string[];
    }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Analytics Drawer / Modal State
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<SurveyAnalyticsResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState<boolean>(false);

  // Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState<SurveyDetailDTO | null>(null);

  // Toast / System Feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    code?: string;
  } | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, [filterStatus]);

  const fetchSurveys = async () => {
    setIsLoading(true);
    try {
      const statusParam = filterStatus !== 'ALL' ? (filterStatus as SurveyStatus) : undefined;
      const res = await surveyService.getSurveys({
        status: statusParam,
        page: 0,
        size: 50,
      });
      setSurveys(res.content || []);
    } catch (err: any) {
      console.error('Lỗi nạp danh sách khảo sát:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setBuilderTitle('');
    setBuilderDescription('');
    setBuilderTargetGrade('ALL');
    setBuilderStartDate(today);
    setBuilderEndDate(nextMonth);

    // Initial default question
    setBuilderQuestions([
      {
        id: 'q-1',
        questionText: 'Mức độ hài lòng của phụ huynh về chất lượng bữa ăn và chăm sóc bán trú của trường?',
        questionType: 'SINGLE_CHOICE',
        isRequired: true,
        options: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Chưa hài lòng'],
      },
      {
        id: 'q-2',
        questionText: 'Đánh giá thái độ và sự tận tâm của đội ngũ giáo viên chủ nhiệm (1 - 5 sao)',
        questionType: 'RATING',
        isRequired: true,
        options: [],
      },
    ]);

    setShowBuilder(true);
  };

  const handleAddQuestion = () => {
    const newId = 'q-' + (builderQuestions.length + 1);
    setBuilderQuestions((prev) => [
      ...prev,
      {
        id: newId,
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        isRequired: true,
        options: ['Lựa chọn 1', 'Lựa chọn 2'],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setBuilderQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= builderQuestions.length) return;
    const updated = [...builderQuestions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setBuilderQuestions(updated);
  };

  const handleAddOption = (qIndex: number) => {
    const updated = [...builderQuestions];
    const currentOpts = updated[qIndex].options;
    updated[qIndex].options = [...currentOpts, `Lựa chọn ${currentOpts.length + 1}`];
    setBuilderQuestions(updated);
  };

  const handleRemoveOption = (qIndex: number, optIndex: number) => {
    const updated = [...builderQuestions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
    setBuilderQuestions(updated);
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...builderQuestions];
    updated[qIndex].options[optIndex] = value;
    setBuilderQuestions(updated);
  };

  const handleSubmitSurvey = async (isDraft: boolean = false) => {
    // BR-057 Validation 1: Tiêu đề không rỗng
    if (!builderTitle.trim()) {
      setFeedback({
        type: 'error',
        code: 'MSG-010',
        message: 'Tiêu đề khảo sát không được để trống.',
      });
      return;
    }

    // BR-057 Validation 2: Ít nhất 1 câu hỏi
    if (builderQuestions.length === 0) {
      setFeedback({
        type: 'error',
        code: 'MSG-233',
        message: 'Phiếu khảo sát bắt buộc phải có ít nhất một câu hỏi.',
      });
      return;
    }

    // BR-057 Validation 3: Thời gian kết thúc phải sau bắt đầu
    if (!builderStartDate || !builderEndDate || builderEndDate <= builderStartDate) {
      setFeedback({
        type: 'error',
        code: 'MSG-145',
        message: 'Thời gian kết thúc khảo sát phải sau thời gian bắt đầu.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: CreateSurveyPayload = {
      title: builderTitle.trim(),
      description: builderDescription.trim(),
      targetGradeLevel: builderTargetGrade,
      startDate: builderStartDate,
      endDate: builderEndDate,
      isDraft,
      questions: builderQuestions.map((q, idx) => ({
        questionText: q.questionText.trim() || `Câu hỏi ${idx + 1}`,
        questionType: q.questionType,
        isRequired: q.isRequired,
        orderIndex: idx + 1,
        options: q.options,
      })),
    };

    try {
      await surveyService.createSurvey(payload);
      setFeedback({
        type: 'success',
        code: 'MSG-232',
        message: isDraft
          ? 'Đã lưu bản nháp phiếu khảo sát thành công.'
          : 'Tạo và ban hành phiếu khảo sát thành công. Thông báo mời tham gia đã được gửi tới ứng dụng phụ huynh.',
      });
      setShowBuilder(false);
      fetchSurveys();
    } catch (err: any) {
      const errRes = err.response?.data;
      setFeedback({
        type: 'error',
        code: errRes?.code || 'ERROR',
        message: errRes?.message || 'Có lỗi xảy ra khi tạo phiếu khảo sát.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSurvey = async (id: string, title: string) => {
    if (!window.confirm(`Xác nhận đóng phiếu khảo sát "${title}"? Sau khi đóng, phụ huynh sẽ không thể nộp thêm câu trả lời.`)) {
      return;
    }
    try {
      await surveyService.closeSurvey(id);
      setFeedback({
        type: 'success',
        code: 'MSG-235',
        message: 'Đã đóng phiếu khảo sát và khóa quyền nộp câu trả lời.',
      });
      fetchSurveys();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể đóng khảo sát.',
      });
    }
  };

  const handleOpenAnalytics = async (id: string) => {
    setIsLoadingAnalytics(true);
    setShowAnalytics(true);
    setAnalyticsData(null);
    try {
      const data = await surveyService.getAnalytics(id);
      setAnalyticsData(data);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: 'Không thể tải số liệu thống kê khảo sát.',
      });
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await surveyService.getSurveyById(id);
      setSelectedDetail(detail);
    } catch (err: any) {
      console.error('Lỗi tải chi tiết khảo sát:', err);
    }
  };

  // Filter List
  const filteredSurveys = surveys.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSearch;
  });

  const totalCount = surveys.length;
  const publishedCount = surveys.filter((s) => s.status === 'PUBLISHED').length;
  const closedCount = surveys.filter((s) => s.status === 'CLOSED').length;
  const totalResponsesAll = surveys.reduce((sum, s) => sum + (s.responsesCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border shadow-sm transition-all animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">
            {feedback.code && <span className="font-bold underline mr-1.5">[{feedback.code}]</span>}
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng đợt khảo sát</span>
            <ClipboardList className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Toàn trường & khối lớp</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang mở lấy ý kiến</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{publishedCount}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Phụ huynh đang phản hồi</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã đóng phiếu</span>
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-700">{closedCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Khóa quyền nộp câu trả lời</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lượt phản hồi</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{totalResponsesAll}</div>
          <span className="text-xs text-blue-600 mt-1 block">Ý kiến phụ huynh ghi nhận</span>
        </div>
      </div>

      {/* Control Bar & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phiếu khảo sát ý kiến phụ huynh..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="PUBLISHED">Đang mở khảo sát</option>
              <option value="CLOSED">Đã đóng</option>
              <option value="DRAFT">Bản nháp</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg hover:shadow-emerald-700/30"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Phiếu Khảo Sát Mới</span>
        </button>
      </div>

      {/* Surveys List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm font-medium">Đang tải danh sách khảo sát...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700 mb-1">Chưa có phiếu khảo sát nào</p>
            <p className="text-xs text-slate-400">Nhấn nút "Tạo Phiếu Khảo Sát Mới" để thiết lập biểu mẫu đầu tiên.</p>
          </div>
        ) : (
          filteredSurveys.map((survey) => (
            <div
              key={survey.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        survey.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : survey.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {survey.status === 'PUBLISHED' && <Sparkles className="w-3 h-3 text-emerald-600" />}
                      {survey.status === 'CLOSED' && <Lock className="w-3 h-3 text-slate-500" />}
                      {survey.statusLabel || survey.status}
                    </span>

                    {/* Target Grade Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Layers className="w-3 h-3" />
                      <span>{survey.targetGradeLevelLabel || survey.targetGradeLevel}</span>
                    </span>

                    {/* Question & Response count */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                      <span>{survey.questionsCount} câu hỏi</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Users className="w-3 h-3" />
                      <span>{survey.responsesCount} phụ huynh đã phản hồi</span>
                    </span>
                  </div>

                  <h3
                    onClick={() => handleOpenAnalytics(survey.id)}
                    className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {survey.title}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAnalytics(survey.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Xem Báo Cáo Phân Tích</span>
                  </button>

                  <button
                    onClick={() => handleOpenDetail(survey.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Bộ câu hỏi
                  </button>

                  {survey.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleCloseSurvey(survey.id, survey.title)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Đóng phiếu</span>
                    </button>
                  )}
                </div>
              </div>

              {survey.description && (
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {survey.description}
                </p>
              )}

              {/* Time Range Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Thời hạn khảo sát: <strong>{new Date(survey.startDate).toLocaleDateString('vi-VN')}</strong> đến{' '}
                    <strong>{new Date(survey.endDate).toLocaleDateString('vi-VN')}</strong>
                  </span>
                </div>

                <span className="text-slate-400">
                  Ngày tạo: {new Date(survey.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal / Form Builder: Tạo Phiếu Khảo Sát Mới */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cán bộ Giáo vụ
                </span>
                <h2 className="text-xl font-bold">Khởi Tạo & Ban Hành Phiếu Khảo Sát Mới</h2>
                <p className="text-xs text-emerald-100/80">
                  Thiết lập câu hỏi đánh giá dịch vụ, thời hạn thu thập và phát hành tới Mobile App của phụ huynh.
                </p>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Tiêu đề & Mô tả */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tiêu đề phiếu khảo sát <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={builderTitle}
                    onChange={(e) => setBuilderTitle(e.target.value)}
                    placeholder="Ví dụ: Khảo sát ý kiến Phụ huynh về Chất lượng Dinh dưỡng & Bữa ăn Bán trú Học kỳ I"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Mục đích & Lời ngỏ gửi tới phụ huynh
                  </label>
                  <textarea
                    rows={2}
                    value={builderDescription}
                    onChange={(e) => setBuilderDescription(e.target.value)}
                    placeholder="Nhằm nâng cao chất lượng nuôi dưỡng và chăm sóc các bé, Nhà trường kính mời Quý phụ huynh dành ít phút đánh giá..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Phạm vi & Thời hạn */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Đối tượng tham gia
                    </label>
                    <select
                      value={builderTargetGrade}
                      onChange={(e) => setBuilderTargetGrade(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                    >
                      {GRADE_LEVEL_OPTIONS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ngày bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={builderStartDate}
                      onChange={(e) => setBuilderStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Ngày kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={builderEndDate}
                      onChange={(e) => setBuilderEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Questions Builder */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Cấu hình danh sách câu hỏi</span>
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        {builderQuestions.length} câu hỏi
                      </span>
                    </h4>
                    <span className="text-xs text-slate-400">
                      Bắt buộc có ít nhất 01 câu hỏi hợp lệ. Hỗ trợ Trắc nghiệm, Thang điểm sao, Ý kiến tự do.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Câu Hỏi</span>
                  </button>
                </div>

                {builderQuestions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-4 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl space-y-3 transition-all relative"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <select
                          value={q.questionType}
                          onChange={(e) => {
                            const newType = e.target.value as QuestionType;
                            const updated = [...builderQuestions];
                            updated[qIndex].questionType = newType;
                            if (newType === 'RATING' || newType === 'TEXT') {
                              updated[qIndex].options = [];
                            } else if (updated[qIndex].options.length === 0) {
                              updated[qIndex].options = ['Lựa chọn 1', 'Lựa chọn 2'];
                            }
                            setBuilderQuestions(updated);
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                        >
                          {QUESTION_TYPES.map((t) => (
                            <option key={t.type} value={t.type}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reorder and Delete controls */}
                      <div className="flex items-center gap-1">
                        <label className="flex items-center gap-1.5 mr-2 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={q.isRequired}
                            onChange={(e) => {
                              const updated = [...builderQuestions];
                              updated[qIndex].isRequired = e.target.checked;
                              setBuilderQuestions(updated);
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span>Bắt buộc</span>
                        </label>

                        <button
                          type="button"
                          disabled={qIndex === 0}
                          onClick={() => handleMoveQuestion(qIndex, 'up')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Lên trên"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={qIndex === builderQuestions.length - 1}
                          onClick={() => handleMoveQuestion(qIndex, 'down')}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                          title="Xuống dưới"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                          title="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...builderQuestions];
                        updated[qIndex].questionText = e.target.value;
                        setBuilderQuestions(updated);
                      }}
                      placeholder={`Nội dung câu hỏi ${qIndex + 1} (Ví dụ: Đánh giá chất lượng thực đơn bán trú)...`}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />

                    {/* Options for Single / Multiple Choice */}
                    {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/60">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Các phương án đáp án:
                        </span>
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-4 text-center font-bold">
                                {optIndex + 1}.
                              </span>
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                placeholder={`Đáp án ${optIndex + 1}...`}
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                              />
                              {q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOption(qIndex, optIndex)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold inline-flex items-center gap-1 mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm phương án</span>
                        </button>
                      </div>
                    )}

                    {/* Rating Hint */}
                    {q.questionType === 'RATING' && (
                      <div className="p-2.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>Hệ thống hiển thị thang đánh giá 1 đến 5 sao trực quan cho phụ huynh trên Mobile App.</span>
                      </div>
                    )}

                    {/* Open text Hint */}
                    {q.questionType === 'TEXT' && (
                      <div className="p-2.5 bg-blue-50/60 border border-blue-200/60 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span>Ô nhập văn bản tự do để phụ huynh gửi góp ý hoặc phản ánh chi tiết.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitSurvey(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Lưu Bản Nháp (DRAFT)
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitSurvey(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Phát Hành Phiếu Khảo Sát</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Báo Cáo Phân Tích & Thống Kê Kết Quả Khảo Sát */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Báo Cáo Phân Tích Ý Kiến Phụ Huynh
                </span>
                <h3 className="text-xl font-bold">{analyticsData?.title || 'Đang tổng hợp dữ liệu...'}</h3>
              </div>
              <button
                onClick={() => setShowAnalytics(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {isLoadingAnalytics ? (
                <div className="p-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
                  <p className="text-sm font-semibold">Đang tổng hợp tỷ lệ phần trăm và biểu đồ khảo sát...</p>
                </div>
              ) : !analyticsData ? (
                <div className="p-8 text-center text-slate-400">Chưa có dữ liệu phản hồi.</div>
              ) : (
                <>
                  {/* Summary Metric Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                        Tổng số phụ huynh phản hồi
                      </span>
                      <div className="text-3xl font-extrabold text-emerald-900 mt-1">
                        {analyticsData.totalResponses} lượt
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                        Số lượng câu hỏi
                      </span>
                      <div className="text-3xl font-extrabold text-blue-900 mt-1">
                        {analyticsData.questions.length} câu
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                      <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
                        Trạng thái đợt khảo sát
                      </span>
                      <div className="text-xl font-extrabold text-purple-900 mt-2">
                        {analyticsData.status === 'PUBLISHED' ? 'Đang mở lấy ý kiến' : 'Đã đóng sổ'}
                      </div>
                    </div>
                  </div>

                  {/* Question-by-Question Analytics */}
                  <div className="space-y-6">
                    {analyticsData.questions.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span>{q.questionText}</span>
                          </h4>
                          <span className="text-xs font-semibold text-slate-500 shrink-0">
                            {q.totalAnswers} câu trả lời
                          </span>
                        </div>

                        {/* Chart for Single Choice / Multiple Choice */}
                        {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTIPLE_CHOICE') &&
                          q.optionStats && (
                            <div className="space-y-3">
                              {/* Recharts Bar Chart */}
                              <div className="h-44 w-full bg-white p-3 rounded-xl border border-slate-200">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={q.optionStats}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" unit="%" domain={[0, 100]} />
                                    <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value: any) => [`${value}%`, 'Tỷ lệ']} />
                                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                                      {q.optionStats.map((_, i) => (
                                        <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Breakdown Table */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {q.optionStats.map((opt, i) => (
                                  <div
                                    key={i}
                                    className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1"
                                  >
                                    <div className="text-slate-600 font-medium truncate" title={opt.label}>
                                      {opt.label}
                                    </div>
                                    <div className="flex items-baseline justify-between font-bold">
                                      <span className="text-slate-900">{opt.count} chọn</span>
                                      <span className="text-emerald-700">{opt.percentage}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Rating Display */}
                        {q.questionType === 'RATING' && (
                          <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl font-extrabold text-amber-500 flex items-center gap-1">
                                <span>{q.ratingAverage || 0}</span>
                                <Star className="w-6 h-6 fill-amber-500" />
                              </div>
                              <span className="text-xs text-slate-500">
                                Điểm đánh giá trung bình trên thang 5 sao
                              </span>
                            </div>

                            {/* Distribution Bars */}
                            {q.ratingDistribution && (
                              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                {[5, 4, 3, 2, 1].map((star) => {
                                  const count = q.ratingDistribution?.[star] || 0;
                                  const pct = q.totalAnswers > 0 ? (count * 100) / q.totalAnswers : 0;
                                  return (
                                    <div key={star} className="flex items-center gap-2 text-xs">
                                      <span className="w-10 font-bold text-slate-700 flex items-center gap-0.5">
                                        {star} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      </span>
                                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-400 rounded-full"
                                          style={{ width: `${pct}%` }}
                                        ></div>
                                      </div>
                                      <span className="w-12 text-right font-medium text-slate-500">
                                        {count} lượt
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Open Text Feedbacks */}
                        {q.questionType === 'TEXT' && q.textFeedbackList && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-600 block">
                              Góp ý từ phụ huynh ({q.textFeedbackList.length}):
                            </span>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {q.textFeedbackList.map((txt, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 italic"
                                >
                                  "{txt}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setShowAnalytics(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm rounded-xl"
              >
                Đóng Báo Cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Bộ Câu Hỏi */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold">
                  {selectedDetail.targetGradeLevelLabel} • {selectedDetail.statusLabel}
                </span>
                <h3 className="text-lg font-bold">{selectedDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedDetail.description && (
                <p className="text-sm text-slate-600 italic pb-3 border-b border-slate-100">
                  {selectedDetail.description}
                </p>
              )}

              <div className="space-y-3">
                {selectedDetail.questions.map((q, i) => (
                  <div key={q.id || i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        Câu {i + 1}: {q.questionText}
                      </span>
                      {q.isRequired && <span className="text-rose-500 font-bold">* Bắt buộc</span>}
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="space-y-1 pl-4 text-xs text-slate-600">
                        {q.options.map((opt, oi) => (
                          <div key={oi}>• {opt}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm rounded-xl"
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

export default SurveyManagementTab;
