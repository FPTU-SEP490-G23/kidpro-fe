import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Send,
  Upload,
  FileText,
  Sparkles,
  Layers,
  Edit3,
  RefreshCw,
  Award,
  AlertCircle,
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';
import {
  WeeklyLessonPlan,
  DevelopmentObjectives,
  DayActivities,
  CreateLessonPlanPayload,
} from '../../../types/classroom.types';
import { useDeadlineTimer } from '../../../hooks/useDeadlineTimer';

// System Message Codes
const MSG_301 = 'Nộp kế hoạch giáo án tuần thành công. Đang chờ Cán bộ Giáo vụ phê duyệt.';
const MSG_302 = 'Giáo án nộp quá thời hạn quy định (17:00 Thứ Sáu). Hệ thống đã ghi nhận nộp trễ.';
const MSG_303 = 'Vui lòng hoàn thiện đầy đủ các mục tiêu giáo dục bắt buộc trong kế hoạch tuần.';

// Zod Schema for Lesson Plan
const lessonPlanSchema = z.object({
  weekNumber: z.number().min(1).max(52),
  weekRange: z.string().min(1),
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  themeTopic: z.string().min(3, 'Chủ đề tuần phải có ít nhất 3 ký tự'),
  objectives: z.object({
    physical: z.string().min(1, 'Mục tiêu thể chất không được để trống'),
    cognitive: z.string().min(1, 'Mục tiêu nhận thức không được để trống'),
    language: z.string().min(1, 'Mục tiêu ngôn ngữ không được để trống'),
    socialEmotional: z.string().min(1, 'Mục tiêu tình cảm & KN xã hội không được để trống'),
    aesthetic: z.string().min(1, 'Mục tiêu thẩm mỹ không được để trống'),
  }),
  scheduleMatrix: z.object({
    monday: z.object({
      morningWarmup: z.string().min(1),
      focusedLearning: z.string().min(1),
      cornerPlay: z.string().min(1),
      outdoorActivity: z.string().min(1),
      afternoonRoutine: z.string().min(1),
    }),
    tuesday: z.object({
      morningWarmup: z.string().min(1),
      focusedLearning: z.string().min(1),
      cornerPlay: z.string().min(1),
      outdoorActivity: z.string().min(1),
      afternoonRoutine: z.string().min(1),
    }),
    wednesday: z.object({
      morningWarmup: z.string().min(1),
      focusedLearning: z.string().min(1),
      cornerPlay: z.string().min(1),
      outdoorActivity: z.string().min(1),
      afternoonRoutine: z.string().min(1),
    }),
    thursday: z.object({
      morningWarmup: z.string().min(1),
      focusedLearning: z.string().min(1),
      cornerPlay: z.string().min(1),
      outdoorActivity: z.string().min(1),
      afternoonRoutine: z.string().min(1),
    }),
    friday: z.object({
      morningWarmup: z.string().min(1),
      focusedLearning: z.string().min(1),
      cornerPlay: z.string().min(1),
      outdoorActivity: z.string().min(1),
      afternoonRoutine: z.string().min(1),
    }),
  }),
  attachmentUrls: z.array(z.string()).optional(),
});

type LessonPlanFormData = z.infer<typeof lessonPlanSchema>;

// Mock Sample Plan
const DEFAULT_OBJECTIVES: DevelopmentObjectives = {
  physical: 'Rèn luyện kỹ năng bật xa 35-40cm, phối hợp tay mắt trong trò chơi chuyền bóng qua đầu.',
  cognitive: 'Nhận biết, gọi tên và phân biệt đặc điểm sinh sống của động vật nuôi trong gia đình và động vật hoang dã.',
  language: 'Đọc diễn cảm bài thơ "Đàn gà con", trả lời câu hỏi mạch lạc và kể lại câu chuyện "Cáo, Thỏ và Gà trống".',
  socialEmotional: 'Biết yêu thương, chăm sóc vật nuôi; chia sẻ đồ chơi cùng bạn bè trong giờ hoạt động góc.',
  aesthetic: 'Tạo hình xé dán con thỏ trắng, hát và vận động nhịp nhàng theo giai điệu bài hát "Gà trống thổi kèn".',
};

const DEFAULT_DAY_ACTIVITIES: DayActivities = {
  morningWarmup: 'Đón trẻ, trò chuyện chủ đề con vật nuôi, tập bài thể dục sáng với bóng.',
  focusedLearning: 'Khám phá khoa học: Tìm hiểu cấu tạo và tập tính của chú mèo con.',
  cornerPlay: 'Góc phân vai: Bác sĩ thú y; Góc xây dựng: Xây trang trại chăn nuôi.',
  outdoorActivity: 'Quan sát vườn chim cảnh trong sân trường; Trò chơi vận động: Mèo đuổi chuột.',
  afternoonRoutine: 'Ôn thơ "Mèo con đi học", vệ sinh cá nhân, nêu gương bé ngoan cuối ngày.',
};

// Dữ liệu mẫu chuẩn hóa 5 lĩnh vực mầm non cho các lớp và tuần học
const INITIAL_MOCK_PLANS: WeeklyLessonPlan[] = [
  {
    id: 'wlp-001',
    weekNumber: 9,
    weekRange: '19/10/2026 - 23/10/2026',
    academicYear: '2026-2027',
    classId: 'cls-01',
    className: 'Mầm 1 (3-4 Tuổi)',
    ageGroup: 'Mầm (3-4 Tuổi)',
    themeTopic: 'Động vật sống dưới nước - Thế giới đại dương kỳ thú',
    teacherId: 'tch-01',
    teacherName: 'Cô Nguyễn Thu Trang',
    status: 'APPROVED',
    objectives: {
      physical: 'Rèn luyện kỹ năng bật xa 35-40cm, phối hợp tay mắt trong trò chơi chuyền bóng qua đầu.',
      cognitive: 'Nhận biết, gọi tên và phân biệt đặc điểm sinh sống của cá, tôm, cua và rùa biển.',
      language: 'Đọc diễn cảm bài thơ "Rong và cá", trả lời câu hỏi mạch lạc và kể lại câu chuyện "Cá Cầu Vồng".',
      socialEmotional: 'Biết yêu quý và bảo vệ môi trường biển, không vứt rác bừa bãi khi đi tắm biển cùng gia đình.',
      aesthetic: 'Tạo hình xé dán đàn cá bơi lội, hát và vận động nhịp nhàng theo giai điệu "Cá vàng bơi".',
    },
    scheduleMatrix: {
      monday: {
        morningWarmup: 'Đón trẻ, trò chuyện về sinh vật biển, tập bài thể dục sáng với dải lụa xanh.',
        focusedLearning: 'Khám phá khoa học: Khám phá bí mật về các loài cá và sinh vật dưới đáy đại dương.',
        cornerPlay: 'Góc phân vai: Bể cá đại dương; Góc xây dựng: Xây công viên thủy cung.',
        outdoorActivity: 'Quan sát bể cá cảnh tại sảnh mầm non; Trò chơi vận động: Cá bơi tôm nhảy.',
        afternoonRoutine: 'Ôn thơ "Rong và cá", rửa tay xà phòng, nêu gương bé ngoan cuối ngày.',
      },
      tuesday: {
        morningWarmup: 'Đón trẻ, kiểm tra thân nhiệt, thể dục sáng kết hợp nhạc nhịp điệu vui nhộn.',
        focusedLearning: 'Làm quen với toán: Đếm số lượng cá trong phạm vi 5, so sánh nhiều hơn - ít hơn.',
        cornerPlay: 'Góc tạo hình: Nặn hình con tôm, con cua; Góc sách truyện: Xem tranh ảnh thế giới biển.',
        outdoorActivity: 'Tắm nắng sớm trên sân cỏ; Trò chơi dân gian: Rồng rắn lên mây.',
        afternoonRoutine: 'Làm quen chữ cái O - Ô - Ơ qua thẻ flashcard tương tác.',
      },
      wednesday: {
        morningWarmup: 'Thể dục sáng theo bài hát "Cá vàng bơi", tập thở sâu hít thở không khí trong lành.',
        focusedLearning: 'Văn học: Kể chuyện sáng tạo theo tranh "Hành trình dũng cảm của chú rùa con".',
        cornerPlay: 'Góc âm nhạc: Gõ nhạc cụ maracas theo tiết tấu; Góc toán: Phân loại vỏ sò theo màu.',
        outdoorActivity: 'Dạo chơi vườn cây trường; Thí nghiệm vật nổi vật chìm trong thau nước.',
        afternoonRoutine: 'Nghe kể chuyện radio mầm non, rèn luyện kỹ năng tự gấp chăn gối sau giờ ngủ trưa.',
      },
      thursday: {
        morningWarmup: 'Đón trẻ với nụ cười thân thiện, khởi động khớp cổ tay cổ chân cùng âm nhạc.',
        focusedLearning: 'Giáo dục thể chất: Bò chui qua cổng hẹp mang thức ăn cho cá đại dương.',
        cornerPlay: 'Góc thiên nhiên: Tưới nước chậu cảnh; Góc phân vai: Siêu thị hải sản sạch.',
        outdoorActivity: 'Chơi với cát nước: Đúc khuôn hình sao biển và lâu đài cát.',
        afternoonRoutine: 'Luyện phát âm rõ ràng bài đồng dao "Gánh gánh gồng gồng".',
      },
      friday: {
        morningWarmup: 'Tập thể dục đồng diễn toàn trường, duyệt đội ngũ trước sân cờ.',
        focusedLearning: 'Hoạt động tạo hình: Xé dán giấy màu tạo bức tranh đàn cá đại dương nhiều màu sắc.',
        cornerPlay: 'Góc học tập: Nối các chấm tạo hình chú cá voi; Góc biểu diễn: Hát múa văn nghệ cuối tuần.',
        outdoorActivity: 'Vui chơi tự do với đồ chơi liên hoàn ngoài trời dưới sự giám sát an toàn.',
        afternoonRoutine: 'Tổng kết tuần học, phát phiếu bé ngoan, dặn dò phụ huynh chuẩn bị tuần mới.',
      },
    },
    attachmentUrls: ['https://example.com/giao-an-tuan-9-mam-1.pdf'],
    submittedAt: '16/10/2026 15:30',
    isSubmittedLate: false,
    reviewedAt: '16/10/2026 16:45',
    reviewerName: 'Cô Hoàng Minh Nguyệt (Giáo Vụ)',
    reviewerFeedback: 'Kế hoạch chi tiết, mục tiêu 5 lĩnh vực bám sát chuẩn Thông tư Bộ GD&ĐT. Đã phê duyệt ban hành cho lớp Mầm 1.',
  },
  {
    id: 'wlp-002',
    weekNumber: 9,
    weekRange: '19/10/2026 - 23/10/2026',
    academicYear: '2026-2027',
    classId: 'cls-02',
    className: 'Chồi 1 (4-5 Tuổi)',
    ageGroup: 'Chồi (4-5 Tuổi)',
    themeTopic: 'Thế giới côn trùng có ích - Ong mật chăm chỉ',
    teacherId: 'tch-02',
    teacherName: 'Cô Lê Bích Ngọc',
    status: 'PENDING_APPROVAL',
    objectives: {
      physical: 'Phát triển sức bền và thăng bằng qua bài tập đi trên ghế thể dục đầu đội túi cát.',
      cognitive: 'Tìm hiểu quy trình làm mật của đàn ong, phân biệt ong mật và ong vò vẽ để giữ an toàn.',
      language: 'Kể lại trôi chảy truyện "Chị Ong Nâu và em bé", mở rộng vốn từ miêu tả hành vi cần cù.',
      socialEmotional: 'Giáo dục tính siêng năng, biết tự giác cất dọn đồ chơi sau khi học xong như đàn ong chăm chỉ.',
      aesthetic: 'Hát đúng giai điệu và thể hiện điệu bộ dễ thương bài hát "Chị ong nâu nâu".',
    },
    scheduleMatrix: {
      monday: DEFAULT_DAY_ACTIVITIES,
      tuesday: DEFAULT_DAY_ACTIVITIES,
      wednesday: DEFAULT_DAY_ACTIVITIES,
      thursday: DEFAULT_DAY_ACTIVITIES,
      friday: DEFAULT_DAY_ACTIVITIES,
    },
    submittedAt: '16/10/2026 16:15',
    isSubmittedLate: false,
  },
  {
    id: 'wlp-003',
    weekNumber: 9,
    weekRange: '19/10/2026 - 23/10/2026',
    academicYear: '2026-2027',
    classId: 'cls-03',
    className: 'Lá 1 (5-6 Tuổi)',
    ageGroup: 'Lá (5-6 Tuổi)',
    themeTopic: 'Phương tiện giao thông và Biển báo an toàn đường bộ',
    teacherId: 'tch-03',
    teacherName: 'Cô Vũ Hải Yến',
    status: 'REVISION_REQUESTED',
    objectives: DEFAULT_OBJECTIVES,
    scheduleMatrix: {
      monday: DEFAULT_DAY_ACTIVITIES,
      tuesday: DEFAULT_DAY_ACTIVITIES,
      wednesday: DEFAULT_DAY_ACTIVITIES,
      thursday: DEFAULT_DAY_ACTIVITIES,
      friday: DEFAULT_DAY_ACTIVITIES,
    },
    submittedAt: '16/10/2026 17:40',
    isSubmittedLate: true,
    reviewedAt: '17/10/2026 09:00',
    reviewerName: 'ThS. Nguyễn Thu Trang (BGH)',
    reviewerFeedback: 'Kế hoạch nộp sau 17:00 Thứ Sáu (bị gắn cờ nộp trễ). Cần bổ sung hoạt động thực hành đội mũ bảo hiểm đúng quy cách cho trẻ vào sáng Thứ Tư trước khi ban hành.',
  },
];

export const WeeklyLessonPlanTab: React.FC = () => {
  const queryClient = useQueryClient();
  const deadlineTimer = useDeadlineTimer();

  const [selectedWeek, setSelectedWeek] = useState<number>(9);
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-01');
  const [activeDayTab, setActiveDayTab] = useState<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'>('monday');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<WeeklyLessonPlan | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [autoSavedTime, setAutoSavedTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Fetch Lesson Plans với fallback an toàn
  const { data: lessonPlans = INITIAL_MOCK_PLANS, refetch } = useQuery<WeeklyLessonPlan[]>({
    queryKey: ['academic-lesson-plans', selectedWeek, selectedClassId],
    queryFn: async () => {
      // 1. Kiểm tra cache localStorage
      try {
        const localSaved = localStorage.getItem('kidpro_weekly_lesson_plans');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (_) {}

      // 2. Thử gọi backend API
      try {
        const res = await academicApi.getWeeklyLessonPlans({
          weekNumber: selectedWeek,
          classId: selectedClassId,
        });
        const raw = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (raw && raw.length > 0) {
          return raw;
        }
      } catch (_) {}

      // 3. Fallback mock plans
      localStorage.setItem('kidpro_weekly_lesson_plans', JSON.stringify(INITIAL_MOCK_PLANS));
      return INITIAL_MOCK_PLANS;
    },
  });

  // Tìm giáo án của tuần và lớp hiện tại (hoặc giáo án đầu tiên)
  const currentPlan: WeeklyLessonPlan | undefined =
    lessonPlans.find((p: WeeklyLessonPlan) => p.weekNumber === selectedWeek && p.classId === selectedClassId) ||
    lessonPlans.find((p: WeeklyLessonPlan) => p.weekNumber === selectedWeek) ||
    lessonPlans[0];

  // React Hook Form for Composer
  const {
    register,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LessonPlanFormData>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: {
      weekNumber: selectedWeek,
      weekRange: '19/10/2026 - 23/10/2026',
      classId: selectedClassId,
      themeTopic: 'Động vật sống dưới nước - Thế giới đại dương kỳ thú',
      objectives: DEFAULT_OBJECTIVES,
      scheduleMatrix: {
        monday: DEFAULT_DAY_ACTIVITIES,
        tuesday: DEFAULT_DAY_ACTIVITIES,
        wednesday: DEFAULT_DAY_ACTIVITIES,
        thursday: DEFAULT_DAY_ACTIVITIES,
        friday: DEFAULT_DAY_ACTIVITIES,
      },
      attachmentUrls: [],
    },
  });

  // Tự động lưu bản nháp vào LocalStorage mỗi 30s qua ref (tránh re-create timer liên tục)
  const watchedFormData = watch();
  const formDataRef = useRef(watchedFormData);
  formDataRef.current = watchedFormData;

  useEffect(() => {
    const timer = setInterval(() => {
      if (formDataRef.current?.themeTopic) {
        localStorage.setItem(`kidpro_lesson_plan_draft_${selectedWeek}`, JSON.stringify(formDataRef.current));
        const now = new Date();
        setAutoSavedTime(now.toLocaleTimeString('vi-VN'));
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [selectedWeek]);

  // Mutation Save / Submit Plan
  const submitPlanMutation = useMutation({
    mutationFn: async ({ payload, isDraft }: { payload: LessonPlanFormData; isDraft: boolean }) => {
      const data: CreateLessonPlanPayload = {
        weekNumber: payload.weekNumber,
        weekRange: payload.weekRange,
        classId: payload.classId,
        themeTopic: payload.themeTopic,
        objectives: payload.objectives,
        scheduleMatrix: payload.scheduleMatrix,
        attachmentUrls: payload.attachmentUrls,
        isDraft,
      };

      try {
        await academicApi.saveLessonPlan(data);
      } catch (_) {
        // Fallback local update
      }

      // Cập nhật vào danh sách cục bộ
      const savedPlansStr = localStorage.getItem('kidpro_weekly_lesson_plans');
      let currentList: WeeklyLessonPlan[] = savedPlansStr ? JSON.parse(savedPlansStr) : [...INITIAL_MOCK_PLANS];

      const existingIndex = currentList.findIndex(
        (p) => p.weekNumber === payload.weekNumber && p.classId === payload.classId
      );

      const newPlan: WeeklyLessonPlan = {
        id: existingIndex >= 0 ? currentList[existingIndex].id : `wlp-${Date.now()}`,
        weekNumber: payload.weekNumber,
        weekRange: payload.weekRange,
        academicYear: '2026-2027',
        classId: payload.classId,
        className: payload.classId === 'cls-01' ? 'Mầm 1 (3-4 Tuổi)' : payload.classId === 'cls-02' ? 'Chồi 1 (4-5 Tuổi)' : 'Lá 1 (5-6 Tuổi)',
        ageGroup: 'Mầm non',
        themeTopic: payload.themeTopic,
        teacherId: 'tch-current',
        teacherName: 'Giáo viên phụ trách',
        status: isDraft ? 'DRAFT' : 'PENDING_APPROVAL',
        objectives: payload.objectives,
        scheduleMatrix: payload.scheduleMatrix,
        attachmentUrls: payload.attachmentUrls,
        submittedAt: isDraft ? undefined : new Date().toLocaleString('vi-VN'),
        isSubmittedLate: !isDraft && deadlineTimer.isExpired,
      };

      if (existingIndex >= 0) {
        currentList[existingIndex] = newPlan;
      } else {
        currentList.push(newPlan);
      }

      localStorage.setItem('kidpro_weekly_lesson_plans', JSON.stringify(currentList));
      return newPlan;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['academic-lesson-plans'] });
      setIsComposerOpen(false);

      if (variables.isDraft) {
        setToastMessage({
          type: 'success',
          text: 'Đã lưu bản nháp giáo án tuần thành công vào hệ thống.',
        });
      } else {
        if (deadlineTimer.isExpired) {
          setToastMessage({
            type: 'warning',
            text: `${MSG_302}`,
          });
        } else {
          setToastMessage({
            type: 'success',
            text: `${MSG_301}`,
          });
        }
      }
      setTimeout(() => setToastMessage(null), 6000);
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Mutation Review Plan (Academic Staff)
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: 'APPROVED' | 'REVISION_REQUESTED'; notes: string }) => {
      try {
        await academicApi.reviewLessonPlan(id, {
          status,
          reviewNotes: notes,
        });
      } catch (_) {
        // Fallback local update
      }

      const savedPlansStr = localStorage.getItem('kidpro_weekly_lesson_plans');
      let currentList: WeeklyLessonPlan[] = savedPlansStr ? JSON.parse(savedPlansStr) : [...INITIAL_MOCK_PLANS];
      const target = currentList.find((p) => p.id === id);
      if (target) {
        target.status = status;
        target.reviewedAt = new Date().toLocaleString('vi-VN');
        target.reviewerName = 'ThS. Nguyễn Thu Trang (BGH / Giáo Vụ)';
        target.reviewerFeedback = notes;
        localStorage.setItem('kidpro_weekly_lesson_plans', JSON.stringify(currentList));
      }
      return target;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['academic-lesson-plans'] });
      setSelectedPlanForReview(null);
      setToastMessage({
        type: 'success',
        text: vars.status === 'APPROVED' ? 'Đã phê duyệt ban hành giáo án thành công!' : 'Đã gửi yêu cầu chỉnh sửa kèm nhận xét chuyên môn.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Handle Form Submit
  const handleFinalSubmit = (isDraft: boolean) => {
    const values = watch();

    // Check 5 objectives if official submission
    if (!isDraft) {
      const obj = values.objectives;
      if (!obj.physical || !obj.cognitive || !obj.language || !obj.socialEmotional || !obj.aesthetic) {
        setToastMessage({
          type: 'error',
          text: `${MSG_303}`,
        });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
    }

    submitPlanMutation.mutate({ payload: values, isDraft });
  };

  const dayLabels = {
    monday: 'Thứ Hai (19/10)',
    tuesday: 'Thứ Ba (20/10)',
    wednesday: 'Thứ Tư (21/10)',
    thursday: 'Thứ Năm (22/10)',
    friday: 'Thứ Sáu (23/10)',
  };

  const currentObjectives = currentPlan?.objectives || DEFAULT_OBJECTIVES;
  const currentDaySchedule = currentPlan?.scheduleMatrix?.[activeDayTab] || DEFAULT_DAY_ACTIVITIES;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Deadline Widget */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[#275A4E]" />
            <span>Kế Hoạch & Phê Duyệt Giáo Án Tuần</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Soạn thảo, nộp kế hoạch bài giảng 5 lĩnh vực mầm non và thẩm định chuyên môn trước 17:00 Thứ Sáu
          </p>
        </div>

        {/* Đồng hồ đếm ngược hạn nộp (Deadline Countdown Widget) */}
        <div
          className={`p-3 rounded-2xl border flex items-center gap-3 shadow-xs ${
            deadlineTimer.isExpired
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : deadlineTimer.isUrgent
              ? 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
          }`}
        >
          <Clock className={`h-6 w-6 ${deadlineTimer.isExpired ? 'text-rose-600' : 'text-[#275A4E]'}`} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider">
              {deadlineTimer.isExpired
                ? 'HẠN NỘP GIÁO ÁN ĐÃ QUÁ HẠN'
                : 'ĐỒNG HỒ ĐẾM NGƯỢC HẠN NỘP (17:00 THỨ SÁU)'}
            </div>
            <div className="text-base font-extrabold flex items-center gap-2">
              <span>{deadlineTimer.formattedCountdown}</span>
              <span className="text-xs font-normal opacity-80">({deadlineTimer.deadlineDisplay})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Week & Class Selectors */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase">Tuần Học:</span>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#275A4E]"
            >
              <option value={7}>Tuần 07: 05/10/2026 - 09/10/2026</option>
              <option value={8}>Tuần 08: 12/10/2026 - 16/10/2026</option>
              <option value={9}>Tuần 09: 19/10/2026 - 23/10/2026 (Hiện tại)</option>
              <option value={10}>Tuần 10: 26/10/2026 - 30/10/2026</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 uppercase">Lớp Học:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-[#275A4E]"
            >
              <option value="cls-01">Mầm 1 (3-4 Tuổi)</option>
              <option value="cls-02">Chồi 1 (4-5 Tuổi)</option>
              <option value="cls-03">Lá 1 (5-6 Tuổi)</option>
              <option value="cls-04">Nhà trẻ 1 (18-24 Tháng)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (currentPlan) {
                setSelectedPlanForReview(currentPlan);
                setReviewNotes(currentPlan.reviewerFeedback || '');
              } else {
                setToastMessage({
                  type: 'warning',
                  text: 'Vui lòng chọn một giáo án tuần đã có để thẩm định chuyên môn.',
                });
              }
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
          >
            <Award className="h-4 w-4 text-[#E5A93C]" />
            <span>Thẩm Định (Giáo Vụ)</span>
          </button>
          <button
            onClick={() => {
              if (currentPlan) {
                reset({
                  weekNumber: currentPlan.weekNumber,
                  weekRange: currentPlan.weekRange,
                  classId: currentPlan.classId,
                  themeTopic: currentPlan.themeTopic,
                  objectives: currentPlan.objectives,
                  scheduleMatrix: currentPlan.scheduleMatrix,
                  attachmentUrls: currentPlan.attachmentUrls || [],
                });
              }
              setIsComposerOpen(true);
            }}
            className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-semibold text-xs shadow-sm transition min-h-[40px] flex items-center gap-1.5 cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
            <span>Soạn Thảo / Nộp Giáo Án</span>
          </button>
        </div>
      </div>

      {/* Status Overview Card */}
      {currentPlan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-slate-800">
                  {currentPlan.className} - {currentPlan.themeTopic}
                </span>
                {/* Status Badges */}
                {currentPlan.status === 'APPROVED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>ĐÃ PHÊ DUYỆT BAN HÀNH</span>
                  </span>
                )}
                {currentPlan.status === 'PENDING_APPROVAL' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>CHỜ GIÁO VỤ PHÊ DUYỆT</span>
                  </span>
                )}
                {currentPlan.status === 'REVISION_REQUESTED' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>YÊU CẦU CHỈNH SỬA</span>
                  </span>
                )}
                {currentPlan.status === 'DRAFT' && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    BẢN NHÁP CHƯA GỬI
                  </span>
                )}
                {currentPlan.isSubmittedLate && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
                    NỘP TRỄ (SUBMITTED_LATE)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Giáo viên phụ trách: <strong>{currentPlan.teacherName}</strong> • Niên khóa:{' '}
                {currentPlan.academicYear} • {currentPlan.weekRange}
              </p>
            </div>

            {currentPlan.attachmentUrls && currentPlan.attachmentUrls.length > 0 && (
              <a
                href={currentPlan.attachmentUrls[0]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold self-start"
              >
                <FileText className="h-4 w-4" />
                <span>Xem Tệp Đính Kèm</span>
              </a>
            )}
          </div>

          {/* Review Feedback Banner if REVISION_REQUESTED */}
          {currentPlan.reviewerFeedback && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Nhận xét chuyên môn của Cán bộ Giáo vụ ({currentPlan.reviewerName}):</span>
              </div>
              <p className="text-amber-900 leading-relaxed pl-5">{currentPlan.reviewerFeedback}</p>
            </div>
          )}

          {/* 5 Educational Objectives Display */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#275A4E]" />
              <span>Mục Tiêu Phát Triển 5 Lĩnh Vực Mầm Non Chuẩn Bộ GD&ĐT</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { label: '1. Thể Chất', content: currentObjectives.physical, color: 'border-blue-200 bg-blue-50/40 text-blue-900' },
                { label: '2. Nhận Thức', content: currentObjectives.cognitive, color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900' },
                { label: '3. Ngôn Ngữ', content: currentObjectives.language, color: 'border-purple-200 bg-purple-50/40 text-purple-900' },
                { label: '4. KN Xã Hội', content: currentObjectives.socialEmotional, color: 'border-amber-200 bg-amber-50/40 text-amber-900' },
                { label: '5. Thẩm Mỹ', content: currentObjectives.aesthetic, color: 'border-rose-200 bg-rose-50/40 text-rose-900' },
              ].map((domain, i) => (
                <div key={i} className={`p-3 rounded-xl border ${domain.color} space-y-1`}>
                  <div className="text-[11px] font-bold uppercase">{domain.label}</div>
                  <div className="text-xs text-slate-700 line-clamp-4 leading-relaxed">{domain.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Activity Matrix Viewer */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-[#275A4E]" />
                <span>Ma Trận Hoạt Động Tuần (Thứ Hai - Thứ Sáu)</span>
              </h4>

              {/* Day Tabs */}
              <div className="flex gap-1">
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDayTab(day)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      activeDayTab === day
                        ? 'bg-[#275A4E] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {day === 'monday'
                      ? 'T2'
                      : day === 'tuesday'
                      ? 'T3'
                      : day === 'wednesday'
                      ? 'T4'
                      : day === 'thursday'
                      ? 'T5'
                      : 'T6'}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Schedule Card */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-[#1E4D40] uppercase">
                Lịch Hoạt Động Chi Tiết: {dayLabels[activeDayTab]}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">1. Đón Trẻ & Thể Dục Sáng</div>
                  <p className="text-slate-600">{currentDaySchedule.morningWarmup}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-emerald-200">
                  <div className="font-bold text-emerald-800 mb-1">2. Hoạt Động Học Có Chủ Đích</div>
                  <p className="text-slate-700 font-medium">
                    {currentDaySchedule.focusedLearning}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">3. Chơi Ở Các Góc</div>
                  <p className="text-slate-600">{currentDaySchedule.cornerPlay}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">4. Hoạt Động Ngoài Trời</div>
                  <p className="text-slate-600">{currentDaySchedule.outdoorActivity}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">5. Chiều & Trả Trẻ</div>
                  <p className="text-slate-600">{currentDaySchedule.afternoonRoutine}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-700">Chưa có kế hoạch giáo án cho tuần {selectedWeek}</div>
          <div className="text-xs text-slate-400 mt-1">Giáo viên có thể nhấn nút &quot;Soạn Thảo / Nộp Giáo Án&quot; ở trên để tạo giáo án mới.</div>
        </div>
      )}

      {/* ================= MODAL TRÌNH SOẠN THẢO KẾ HOẠCH GIÁO ÁN TUẦN ================= */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#275A4E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="h-6 w-6 text-[#78C2AD]" />
                <div>
                  <h3 className="text-lg font-bold">Soạn Thảo Kế Hoạch Giáo Án Tuần {selectedWeek}</h3>
                  <p className="text-xs text-white/80">
                    Hoàn thiện 5 mục tiêu phát triển và ma trận hoạt động 5 ngày mầm non
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {autoSavedTime && (
                  <span className="text-[11px] bg-[#1E4D40] px-2.5 py-1 rounded-full text-[#78C2AD]">
                    Đã tự động lưu nháp: {autoSavedTime}
                  </span>
                )}
                <button
                  onClick={() => setIsComposerOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Thông tin chung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Chủ Đề Tuần <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('themeTopic')}
                    placeholder="vd: Thế giới Động vật - Bé yêu thú cưng"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#275A4E]"
                  />
                  {errors.themeTopic && (
                    <p className="text-xs text-rose-500 mt-1">{errors.themeTopic.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Khoảng Thời Gian Áp Dụng
                  </label>
                  <input
                    type="text"
                    {...register('weekRange')}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-600"
                    readOnly
                  />
                </div>
              </div>

              {/* Mục tiêu phát triển 5 lĩnh vực (BẮT BUỘC) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#275A4E]" />
                    <span>Mục Tiêu Phát Triển 5 Lĩnh Vực Mầm Non (Bắt buộc không được để trống)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-blue-800 mb-1">1. Thể chất</label>
                    <textarea
                      rows={3}
                      {...register('objectives.physical')}
                      placeholder="Kỹ năng vận động cơ bản..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-emerald-800 mb-1">2. Nhận thức</label>
                    <textarea
                      rows={3}
                      {...register('objectives.cognitive')}
                      placeholder="Khám phá khoa học, toán..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-purple-800 mb-1">3. Ngôn ngữ</label>
                    <textarea
                      rows={3}
                      {...register('objectives.language')}
                      placeholder="Thơ, truyện, đàm thoại..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-800 mb-1">4. KN Xã hội</label>
                    <textarea
                      rows={3}
                      {...register('objectives.socialEmotional')}
                      placeholder="Cảm xúc, kỹ năng ứng xử..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-rose-800 mb-1">5. Thẩm mỹ</label>
                    <textarea
                      rows={3}
                      {...register('objectives.aesthetic')}
                      placeholder="Tạo hình, ca hát, vẽ..."
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:border-[#275A4E]"
                    />
                  </div>
                </div>
              </div>

              {/* Ma trận hoạt động 5 ngày */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#275A4E]" />
                    <span>Chi Tiết Hoạt Động Giảng Dạy Từng Ngày (Thứ 2 - Thứ 6)</span>
                  </label>

                  {/* Day Picker */}
                  <div className="flex gap-1">
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setActiveDayTab(day)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          activeDayTab === day
                            ? 'bg-[#275A4E] text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {day === 'monday'
                          ? 'T2'
                          : day === 'tuesday'
                          ? 'T3'
                          : day === 'wednesday'
                          ? 'T4'
                          : day === 'thursday'
                          ? 'T5'
                          : 'T6'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-[#1E4D40]">{dayLabels[activeDayTab]}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        1. Đón Trẻ & Thể Dục Sáng
                      </label>
                      <input
                        type="text"
                        {...register(`scheduleMatrix.${activeDayTab}.morningWarmup`)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-emerald-800 mb-1">
                        2. Hoạt Động Học Có Chủ Đích (Môn Học Chính)
                      </label>
                      <input
                        type="text"
                        {...register(`scheduleMatrix.${activeDayTab}.focusedLearning`)}
                        className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white font-medium text-emerald-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        3. Hoạt Động Chơi Ở Các Góc
                      </label>
                      <input
                        type="text"
                        {...register(`scheduleMatrix.${activeDayTab}.cornerPlay`)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        4. Hoạt Động Ngoài Trời
                      </label>
                      <input
                        type="text"
                        {...register(`scheduleMatrix.${activeDayTab}.outdoorActivity`)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="text-xs">
                    <label className="block font-semibold text-slate-700 mb-1">
                      5. Hoạt Động Chiều & Trả Trẻ
                    </label>
                    <input
                      type="text"
                      {...register(`scheduleMatrix.${activeDayTab}.afternoonRoutine`)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Tải lên học cụ / bài giảng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đính Kèm Slide Bài Giảng / Kế Hoạch Học Cụ Tự Làm
                </label>
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                  <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-600 font-medium">
                    Tải lên file PDF, Slide PowerPoint hoặc Word (&lt; 20MB)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {deadlineTimer.isExpired ? (
                    <span className="text-rose-600 font-bold">
                      Đã qua 17:00 Thứ Sáu. Giáo án khi nộp sẽ bị gắn cờ SUBMITTED_LATE.
                    </span>
                  ) : (
                    <span>Hạn nộp chính thức: 17:00 Thứ Sáu hàng tuần.</span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsComposerOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(true)}
                    disabled={isSubmitting || submitPlanMutation.isPending}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-[#275A4E] text-[#275A4E] hover:bg-[#275A4E]/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Lưu Bản Nháp (Save Draft)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isSubmitting || submitPlanMutation.isPending}
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-[#275A4E] text-white hover:bg-[#1E4D40] shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Gửi Phê Duyệt Giáo Án</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL THẨM ĐỊNH GIÁO ÁN (CÁN BỘ GIÁO VỤ) ================= */}
      {selectedPlanForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Award className="h-6 w-6 text-[#E5A93C]" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Thẩm Định & Phê Duyệt Kế Hoạch Giáo Án Tuần {selectedPlanForReview.weekNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lớp: {selectedPlanForReview.className} • Giáo viên: {selectedPlanForReview.teacherName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForReview(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-slate-500">Chủ đề tuần:</div>
                <div className="text-sm font-bold text-[#1E4D40]">{selectedPlanForReview.themeTopic}</div>
                <div className="text-slate-500 mt-1">
                  Thời gian gửi: {selectedPlanForReview.submittedAt || 'Chưa gửi'}
                  {selectedPlanForReview.isSubmittedLate && (
                    <span className="text-rose-600 font-bold ml-2">[Nộp Trễ]</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nhận Xét Chuyên Môn / Yêu Cầu Chỉnh Sửa Của Giáo Vụ
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Nhập góp ý sư phạm, điều chỉnh độ khó mục tiêu, bổ sung học cụ an toàn..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#275A4E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t">
              <button
                onClick={() => setSelectedPlanForReview(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate({
                      id: selectedPlanForReview.id,
                      status: 'REVISION_REQUESTED',
                      notes: reviewNotes,
                    });
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                >
                  Yêu Cầu Chỉnh Sửa
                </button>
                <button
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate({
                      id: selectedPlanForReview.id,
                      status: 'APPROVED',
                      notes: reviewNotes,
                    });
                  }}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#275A4E] text-white hover:bg-[#1E4D40] shadow-sm cursor-pointer"
                >
                  Phê Duyệt Ban Hành
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyLessonPlanTab;
