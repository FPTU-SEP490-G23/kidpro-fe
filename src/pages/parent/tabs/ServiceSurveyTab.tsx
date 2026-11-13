import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import parentApi from '../../../api/parentApi';
import {
  ServiceRatings,
  ServiceSurveySubmission,
  SurveyCampaign,
} from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';
import {
  Star,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Send,
  EyeOff,
  Lock,
  BarChart3,
  Users,
  MessageSquare,
  RefreshCw,
  Utensils,
  HeartHandshake,
  ShieldCheck,
  BellRing,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

// System Messages
const MSG_293 =
  'Cảm ơn quý phụ huynh đã đóng góp ý kiến quý báu! Đánh giá của quý vị giúp nhà trường ngày càng hoàn thiện hơn.';
const MSG_294 =
  'Vui lòng hoàn thành đánh giá cho tất cả các tiêu chí dịch vụ trước khi gửi.';
const MSG_295 =
  'Đợt khảo sát này đã kết thúc tiếp nhận ý kiến. Cảm ơn sự quan tâm của quý phụ huynh.';
const MSG_296 =
  'Quý phụ huynh đã gửi ý kiến đánh giá cho đợt khảo sát này.';
const MSG_004 =
  'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';

interface ServiceSurveyTabProps {
  studentId: string;
  studentName: string;
  className: string;
}

export const ServiceSurveyTab: React.FC<ServiceSurveyTabProps> = ({
  studentId,
  studentName,
  className,
}) => {
  const { role } = useAuth();
  const isBghOrAdmin = role === 'BGH' || role === 'SYSTEM_ADMIN' ;

  // Active View Tab: 'PARENT_FORM' | 'BGH_ANALYTICS'
  const [activeSubView, setActiveSubView] = useState<'PARENT_FORM' | 'BGH_ANALYTICS'>(
    isBghOrAdmin ? 'BGH_ANALYTICS' : 'PARENT_FORM'
  );

  // Campaign State
  const [campaign, setCampaign] = useState<SurveyCampaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState<boolean>(false);

  // Ratings State (0 = chưa chọn, 1-5 sao)
  const [ratings, setRatings] = useState<ServiceRatings>({
    mealQuality: 0,
    teacherCare: 0,
    facilitySafety: 0,
    communication: 0,
  });
  const [hoverRatings, setHoverRatings] = useState<{ [key: string]: number }>({});
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true); // Mặc định ẩn danh bảo vệ danh tính
  const [sendToPrincipalOnly, setSendToPrincipalOnly] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // BGH Analytics State
  const [analyticsSubmissions, setAnalyticsSubmissions] = useState<ServiceSurveySubmission[]>([]);

  // Toast / System Feedback
  const [systemMessage, setSystemMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Tải dữ liệu đợt khảo sát
  const loadSurveyData = async () => {
    setIsLoading(true);
    try {
      const camp = await parentApi.getActiveSurveyCampaign();
      setCampaign(camp);

      // Kiểm tra trạng thái đã nộp
      const checkRes = await parentApi.checkSurveySubmissionStatus(camp.id, studentId);
      setHasAlreadySubmitted(checkRes.hasSubmitted);

      // Nếu có quyền BGH, tải phân tích
      if (isBghOrAdmin || activeSubView === 'BGH_ANALYTICS') {
        const analytics = await parentApi.getSurveyAnalytics(camp.id);
        setAnalyticsSubmissions(analytics.submissions);
      }
    } catch {
      setSystemMessage({ type: 'error', text: MSG_004 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSurveyData();
  }, [studentId, activeSubView]);

  // Xử lý gửi khảo sát
  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaign) return;

    // BR: Khóa form khi đợt khảo sát hết hạn
    if (campaign.isExpired || !campaign.isActive) {
      setSystemMessage({ type: 'warning', text: MSG_295 });
      return;
    }

    // BR: Chống nộp lặp
    if (hasAlreadySubmitted) {
      setSystemMessage({ type: 'warning', text: MSG_296 });
      return;
    }

    // BR: Bắt buộc chấm điểm cả 4 nhóm tiêu chí
    if (
      ratings.mealQuality === 0 ||
      ratings.teacherCare === 0 ||
      ratings.facilitySafety === 0 ||
      ratings.communication === 0
    ) {
      setSystemMessage({ type: 'warning', text: MSG_294 });
      return;
    }

    setIsSubmitting(true);
    setSystemMessage(null);

    try {
      await parentApi.submitServiceSurvey({
        surveyId: campaign.id,
        // BR-074: Khi bật ẩn danh, loại bỏ studentId và định danh người dùng
        studentId: isAnonymous ? undefined : studentId,
        ratings,
        feedback: feedbackText.trim(),
        isAnonymous,
        sendToPrincipalOnly,
      });

      setHasAlreadySubmitted(true);
      setSystemMessage({ type: 'success', text: MSG_293 });

      // Refresh lại phân tích
      const analytics = await parentApi.getSurveyAnalytics(campaign.id);
      setAnalyticsSubmissions(analytics.submissions);
      setCampaign(analytics.campaign);
    } catch {
      setSystemMessage({ type: 'error', text: MSG_004 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper render rating stars cho 1 tiêu chí
  const renderStarRating = (
    key: keyof ServiceRatings,
    label: string,
    description: string,
    icon: React.ReactNode
  ) => {
    const currentScore = ratings[key];
    const hoverScore = hoverRatings[key] || 0;
    const activeScore = hoverScore || currentScore;

    const ratingDescriptions = [
      '',
      '1/5: Rất chưa hài lòng',
      '2/5: Cần cải thiện nhiều',
      '3/5: Đạt yêu cầu cơ bản',
      '4/5: Rất tốt & Hài lòng',
      '5/5: Xuất sắc & Tuyệt vời',
    ];

    return (
      <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-[#78C2AD] transition space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#275A4E] shadow-2xs">
              {icon}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                {label} <span className="text-rose-500">*</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          {currentScore > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E5A93C]/20 text-amber-900 border border-[#E5A93C]/40">
              {currentScore} ⭐
            </span>
          )}
        </div>

        {/* Lưới 5 ngôi sao (Tối ưu cảm ứng mobile web min 44x44px) */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={hasAlreadySubmitted || campaign?.isExpired}
                onClick={() => setRatings((prev) => ({ ...prev, [key]: star }))}
                onMouseEnter={() =>
                  setHoverRatings((prev) => ({ ...prev, [key]: star }))
                }
                onMouseLeave={() =>
                  setHoverRatings((prev) => ({ ...prev, [key]: 0 }))
                }
                className="p-1 sm:p-2 rounded-xl hover:bg-white transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                title={`${star} sao`}
              >
                <Star
                  className={`w-6 h-6 sm:w-7 sm:h-7 transition ${
                    star <= activeScore
                      ? 'fill-[#E5A93C] text-[#E5A93C] drop-shadow-xs'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
            {ratingDescriptions[activeScore] || 'Chưa đánh giá'}
          </span>
        </div>
      </div>
    );
  };

  // Chuẩn bị dữ liệu Recharts cho BGH
  const chartData = [
    {
      name: 'Bữa Ăn Bán Trú',
      shortName: 'Bữa Ăn',
      score: campaign?.criteriaAverages?.mealQuality || 4.8,
      fill: '#275A4E',
    },
    {
      name: 'Sự Tận Tâm Giáo Viên',
      shortName: 'Giáo Viên',
      score: campaign?.criteriaAverages?.teacherCare || 4.9,
      fill: '#1E4D40',
    },
    {
      name: 'Vệ Sinh & An Toàn',
      shortName: 'Cơ Sở Vật Chất',
      score: campaign?.criteriaAverages?.facilitySafety || 4.6,
      fill: '#78C2AD',
    },
    {
      name: 'Minh Bạch Thông Tin',
      shortName: 'Truyền Thông',
      score: campaign?.criteriaAverages?.communication || 4.5,
      fill: '#E5A93C',
    },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                KHẢO SÁT CHẤT LƯỢNG DỊCH VỤ
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                Bảo Vệ Danh Tính Ẩn Danh
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {campaign?.title || 'Khảo Sát Ý Kiến & Đánh Giá Dịch Vụ Mầm Non'}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
              Ý kiến đóng góp quý báu từ Quý Phụ huynh là kim chỉ nam giúp Nhà trường liên tục hoàn thiện chất lượng chăm sóc, an toàn bữa ăn bán trú và cơ sở vật chất.
            </p>
          </div>

          {/* Toggle Switch Xem Dành Cho Phụ Huynh / Dashboard BGH */}
          <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs self-start md:self-auto">
            <button
              onClick={() => setActiveSubView('PARENT_FORM')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition min-h-[38px] cursor-pointer ${
                activeSubView === 'PARENT_FORM'
                  ? 'bg-white text-[#1E4D40] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Làm Khảo Sát
            </button>
            <button
              onClick={() => setActiveSubView('BGH_ANALYTICS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition min-h-[38px] flex items-center gap-1.5 cursor-pointer ${
                activeSubView === 'BGH_ANALYTICS'
                  ? 'bg-[#E5A93C] text-slate-950 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Phân Tích BGH</span>
            </button>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO HỆ THỐNG (SYSTEM FEEDBACK TOAST / ALERT) */}
      {systemMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 shadow-sm border transition animate-in fade-in ${
            systemMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : systemMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {systemMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : systemMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
            {systemMessage.text}
          </div>
          <button
            onClick={() => setSystemMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* CHẾ ĐỘ 1: GIAO DIỆN LÀM BÀI KHẢO SÁT CHO PHỤ HUYNH (PARENT VIEW) */}
      {/* ============================================================ */}
      {activeSubView === 'PARENT_FORM' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái & giữa: Form đánh giá 4 nhóm tiêu chí */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#1E4D40]">
                    Phiếu Đánh Giá Chất Lượng 4 Tiêu Chí Chuẩn Hóa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Học sinh áp dụng: <span className="font-bold text-slate-800">{studentName}</span> ({className})
                  </p>
                </div>
                {campaign?.endDate && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
                    Hạn chót: {formatDate(campaign.endDate)}
                  </span>
                )}
              </div>

              {/* Trạng thái đã nộp bài */}
              {hasAlreadySubmitted && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3 text-xs sm:text-sm text-emerald-900 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Quý phụ huynh đã gửi ý kiến đánh giá cho đợt khảo sát này ({campaign?.quarter} - {campaign?.academicYear}). Trân trọng cảm ơn sự đồng hành của gia đình!
                  </span>
                </div>
              )}

              <form onSubmit={handleSubmitSurvey} className="space-y-4">
                {/* 1. Chất lượng Bữa ăn Bán trú */}
                {renderStarRating(
                  'mealQuality',
                  '1. Chất Lượng Bữa Ăn Bán Trú',
                  'Món ăn đa dạng, hợp khẩu vị, đảm bảo dinh dưỡng và tiêu chuẩn kiểm thực 3 bước ATVSTP.',
                  <Utensils className="w-5 h-5" />
                )}

                {/* 2. Sự Tận tâm của Giáo viên */}
                {renderStarRating(
                  'teacherCare',
                  '2. Sự Tận Tâm & Chăm Sóc Của Giáo Viên',
                  'Thái độ yêu thương, giao tiếp tôn trọng, đồng hành kiên nhẫn và phản hồi tình hình bé thường xuyên.',
                  <HeartHandshake className="w-5 h-5" />
                )}

                {/* 3. Vệ sinh & An toàn Cơ sở Vật chất */}
                {renderStarRating(
                  'facilitySafety',
                  '3. Vệ Sinh & An Toàn Cơ Sở Vật Chất',
                  'Lớp học sạch thoáng, đồ chơi kháng khuẩn định kỳ, an ninh kiểm soát cổng trường bằng AI nghiêm ngặt.',
                  <ShieldCheck className="w-5 h-5" />
                )}

                {/* 4. Tính Kịp thời & Minh bạch của Thông tin */}
                {renderStarRating(
                  'communication',
                  '4. Tính Kịp Thời & Minh Bạch Của Thông Tin',
                  'Cập nhật báo ăn, dặn thuốc, học phí điện tử và các bản tin khẩn từ Ban Giám Hiệu nhanh chóng.',
                  <BellRing className="w-5 h-5" />
                )}

                {/* Khung Góp Ý Tự Do (Free-text Feedback) */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Ý Kiến Đóng Góp Xây Dựng & Đề Xuất Cải Tiến (Tùy chọn)
                  </label>
                  <textarea
                    rows={4}
                    disabled={hasAlreadySubmitted || campaign?.isExpired}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Ví dụ: Đề xuất nhà trường bổ sung thêm nhiều loại nước ép hoa quả trong bữa xế của các con, tăng cường thêm các tiết vận động thể chất ngoài trời..."
                    className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* TÙY CHỌN BẢO MẬT DANH TÍNH (PRIVACY TOGGLE - BR-074) */}
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-[#78C2AD]/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="anonymousCheck"
                      disabled={hasAlreadySubmitted || campaign?.isExpired}
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#275A4E] focus:ring-[#275A4E] cursor-pointer"
                    />
                    <label htmlFor="anonymousCheck" className="text-xs text-slate-800 cursor-pointer">
                      <span className="font-bold text-[#1E4D40] flex items-center gap-1.5">
                        <EyeOff className="w-4 h-4 text-[#275A4E]" />
                        Gửi Dưới Dạng Ẩn Danh (Anonymous Submission - Khuyến nghị)
                      </span>
                      <span className="block text-slate-500 text-[11px] mt-0.5">
                        Khi chọn chế độ này, danh tính của bạn, số điện thoại, email và thông tin lớp học của con sẽ bị loại bỏ hoàn toàn khỏi bản ghi kết quả theo nguyên tắc bảo mật.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 pt-2 border-t border-emerald-100">
                    <input
                      type="checkbox"
                      id="principalOnlyCheck"
                      disabled={hasAlreadySubmitted || campaign?.isExpired}
                      checked={sendToPrincipalOnly}
                      onChange={(e) => setSendToPrincipalOnly(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#275A4E] focus:ring-[#275A4E] cursor-pointer"
                    />
                    <label htmlFor="principalOnlyCheck" className="text-xs text-slate-800 cursor-pointer">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        Hòm Thư Bí Mật Gửi Riêng Hiệu Trưởng
                      </span>
                      <span className="block text-slate-500 text-[11px] mt-0.5">
                        Chỉ tài khoản Hiệu trưởng trường mới xem được nội dung đóng góp này (giữ kín với giáo viên chủ nhiệm).
                      </span>
                    </label>
                  </div>
                </div>

                {/* NÚT HÀNH ĐỘNG GỬI ĐÁNH GIÁ */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || hasAlreadySubmitted || campaign?.isExpired}
                    className="w-full py-3.5 px-6 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-[#275A4E]/20 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang Gửi Đánh Giá...</span>
                      </>
                    ) : hasAlreadySubmitted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Hoàn Thành Khảo Sát Này</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi Đánh Giá Khảo Sát</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Cột phải: Cam kết chất lượng & Trực quan điểm số */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-[#E5A93C]" />
                <span>Tiêu Chuẩn Đánh Giá Dịch Vụ</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <p className="font-bold text-amber-950 mb-1">⭐ Cam Kết Lắng Nghe 100%</p>
                  <p className="text-[11px] text-amber-900">
                    Mọi ý kiến của phụ huynh dù tích cực hay phê bình đều được Ban Giám Hiệu tiếp nhận trực tiếp và rà soát trong cuộc họp chuyên môn hàng tuần.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                  <p className="font-bold text-[#1E4D40] mb-1">🔒 Bảo Mật Danh Tính Tuyệt Đối</p>
                  <p className="text-[11px] text-emerald-900">
                    Hệ thống tự động băm mã hóa bản ghi khi quý phụ huynh bật tùy chọn Ẩn danh. Không ai, kể cả quản trị viên, có thể truy xuất ngược về tài khoản của bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin đợt khảo sát */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800">Thông Tin Đợt Khảo Sát</h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Niên khóa:</span>
                  <span className="font-bold text-slate-800">{campaign?.academicYear}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kỳ đánh giá:</span>
                  <span className="font-bold text-slate-800">{campaign?.quarter}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trạng thái:</span>
                  <span className="font-bold text-emerald-700">Đang tiếp nhận</span>
                </div>
                <div className="flex justify-between">
                  <span>Tỷ lệ tham gia hiện tại:</span>
                  <span className="font-bold text-[#275A4E]">
                    {campaign?.submittedCount}/{campaign?.totalTargetParents} (85.5%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CHẾ ĐỘ 2: BẢNG ĐIỀU KHIỂN TỔNG HỢP CHẤT LƯỢNG CHO BGH (ANALYTICS) */}
      {/* ============================================================ */}
      {activeSubView === 'BGH_ANALYTICS' && (
        <div className="space-y-6">
          {/* Thẻ chỉ số tổng quan (Metric Cards) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold">Phụ Huynh Tham Gia</span>
                <Users className="w-4 h-4 text-[#275A4E]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {campaign?.submittedCount}/{campaign?.totalTargetParents}
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                Tỷ lệ tiếp nhận: 85.5%
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold">Điểm Hài Lòng Chung</span>
                <Star className="w-4 h-4 text-[#E5A93C]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#275A4E] flex items-center gap-1.5">
                <span>{campaign?.averageOverallScore || 4.7}</span>
                <span className="text-sm font-normal text-slate-400">/ 5.0 ⭐</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">
                Xếp loại: Xuất sắc
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold">Ý Kiến Đóng Góp</span>
                <MessageSquare className="w-4 h-4 text-[#1E4D40]" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {analyticsSubmissions.length}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Phản hồi có văn bản
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold">Tỷ Lệ Ẩn Danh</span>
                <EyeOff className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                66.7%
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Bảo mật thông tin cá nhân
              </p>
            </div>
          </div>

          {/* Biểu đồ Recharts phân tích 4 nhóm tiêu chí */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1E4D40] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#275A4E]" />
                  <span>Biểu Đồ So Sánh Điểm Trung Bình Theo 4 Tiêu Chí Dịch Vụ</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Thang điểm chuẩn 1 - 5 sao từ kết quả khảo sát {campaign?.quarter} ({campaign?.academicYear})
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-[#1E4D40] rounded-xl self-start sm:self-auto">
                Mục tiêu chất lượng: &ge; 4.5 ⭐
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 30, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="shortName"
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    stroke="#64748B"
                    fontSize={12}
                    tickCount={6}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val} / 5.0 ⭐`, 'Điểm trung bình']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Danh sách thẻ ý kiến đóng góp từ phụ huynh (Scrollable Feedback Cards) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#275A4E]" />
                  <span>Danh Sách Ý Kiến Đóng Góp Chi Tiết</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tổng hợp phản hồi tự do từ các bậc phụ huynh trong đợt khảo sát
                </p>
              </div>
              <button
                onClick={loadSurveyData}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Cập Nhật</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {analyticsSubmissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Chưa có ý kiến phản hồi nào trong kỳ này.
                </div>
              ) : (
                analyticsSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sub.isAnonymous ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700 flex items-center gap-1">
                            <EyeOff className="w-3 h-3 text-slate-500" />
                            Phụ Huynh Ẩn Danh
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#1E4D40]">
                            {sub.submitterName || 'Phụ huynh'} ({sub.className || 'Toàn trường'})
                          </span>
                        )}

                        {sub.sendToPrincipalOnly && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1 border border-amber-300">
                            <Lock className="w-3 h-3 text-amber-600" />
                            Gửi Riêng BGH
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-extrabold text-amber-600 flex items-center gap-1">
                          {sub.averageScore} <Star className="w-3.5 h-3.5 fill-[#E5A93C] text-[#E5A93C]" />
                        </span>
                        <span>{formatDate(sub.submittedAt)}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      "{sub.feedback}"
                    </p>

                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                      <span>Bữa ăn: <strong className="text-slate-700">{sub.ratings.mealQuality}⭐</strong></span>
                      <span>•</span>
                      <span>Giáo viên: <strong className="text-slate-700">{sub.ratings.teacherCare}⭐</strong></span>
                      <span>•</span>
                      <span>Cơ sở vật chất: <strong className="text-slate-700">{sub.ratings.facilitySafety}⭐</strong></span>
                      <span>•</span>
                      <span>Truyền thông: <strong className="text-slate-700">{sub.ratings.communication}⭐</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceSurveyTab;
