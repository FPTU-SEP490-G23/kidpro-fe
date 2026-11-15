import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { calculateBmi, getBmiStatus, getBmiBadge, getBmiStatusBadgeColor, formatDate } from '../../utils/formatters';
import healthApi from '../../api/healthApi';
import { supabase } from '../../config/supabase';
import {
  DevelopmentDomain,
  DevelopmentEvaluation,
  NapRecord,
  MealRecord,
  MealType,
  MealConsumptionLevel,
} from '../../types/health.types';
import {
  HeartPulse,
  Scale,
  Sparkles,
  Camera,
  Award,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Inbox,
  RefreshCw,
  Moon,
  Utensils,
  Trash2,
  Pencil,
  X,
  Upload,
  Pill,
} from 'lucide-react';
import { MedicationAdministrationTab } from './tabs/MedicationAdministrationTab';
import { ClassroomJournalTab } from './tabs/ClassroomJournalTab';
import { academicApi } from '../../api/academicApi';
import { parentApi } from '../../api/parentApi';
import { ClassHealthMetricsTab } from './tabs/ClassHealthMetricsTab';
import { MedicalIncidentsTab } from './tabs/MedicalIncidentsTab';
import { EarlyChildhoodEvaluationTab } from '../academic/tabs/EarlyChildhoodEvaluationTab';

interface StudentHealthRow {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  heightCm: number;
  weightKg: number;
  recordedAt: string;
}

interface StudentOption {
  id: string;
  fullName: string;
  className: string;
  classId?: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface JournalPostItem {
  id: string;
  classId?: string;
  className?: string;
  caption: string;
  photoUrl?: string;
  date: string;
}

type HealthTabType = 'incidents' | 'medication' | 'journal' | 'metrics' | 'care' | 'evaluations';

interface HealthTabMeta {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  specialColor?: 'alert';
}

const HEALTH_TAB_META: Record<HealthTabType, HealthTabMeta> = {
  incidents: {
    title: 'Sự Vụ Y Tế Học Đường & Sơ Cứu Ban Đầu',
    description: 'Quy trình tiếp nhận, sơ cấp cứu và lập biên bản sự vụ y tế học đường (sốt cao, dị ứng, trầy xước), đồng bộ thông báo khẩn cấp tới phụ huynh.',
    icon: HeartPulse,
    badge: 'An Toàn Sơ Cứu',
    specialColor: 'alert',
  },
  medication: {
    title: 'Cho Trẻ Uống Thuốc & Chụp Ảnh Xác Thực (14:00)',
    description: 'Giáo viên thực hiện cho uống thuốc đúng liều lượng theo đơn phụ huynh gửi, chụp ảnh xác thực thời gian thực và gửi báo cáo về phụ huynh.',
    icon: Pill,
    badge: 'Y Tế Học Đường',
  },
  journal: {
    title: 'Nhật Ký & Album Ảnh Hoạt Động Lớp Học',
    description: 'Đăng tải hình ảnh học tập, vui chơi, trải nghiệm dã ngoại của cả lớp hoặc từng nhóm trẻ vào sổ liên lạc điện tử của phụ huynh.',
    icon: Camera,
    badge: 'Nhật Ký Học Đường',
  },
  metrics: {
    title: 'Ghi Nhận Chỉ Số Thể Trạng Định Kỳ (WHO BMI)',
    description: 'Đo lường định kỳ chiều cao, cân nặng, tự động tính toán chỉ số BMI theo biểu đồ phát triển tiêu chuẩn của Tổ chức Y Tế Thế Giới (WHO).',
    icon: Scale,
    badge: 'Chuẩn WHO',
  },
  care: {
    title: 'Sổ Theo Dõi Sinh Hoạt, Ăn Uống & Giấc Ngủ Trưa',
    description: 'Ghi nhận mức độ tiêu thụ suất ăn từng bữa (hết suất/nửa suất/bỏ bữa) và chất lượng giấc ngủ trưa bán trú của từng bé.',
    icon: Moon,
    badge: 'Chăm Sóc Bán Trú',
  },
  evaluations: {
    title: 'Đánh Giá Phát Triển Mầm Non (Thông Tư 28 & 51/BGDĐT)',
    description: 'Đánh giá định kỳ 5 lĩnh vực phát triển GD mầm non: Thể chất, Nhận thức, Ngôn ngữ, Tình cảm - KN xã hội, Thẩm mỹ.',
    icon: Award,
    badge: 'Chuẩn TT 28/51',
  },
};

export const HealthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const resolveTab = (param: string | null): HealthTabType => {
    if (param === 'medications' || param === 'medication') return 'medication';
    if (param === 'journals' || param === 'journal') return 'journal';
    if (param === 'metrics') return 'metrics';
    if (param === 'care') return 'care';
    if (param === 'evaluations') return 'evaluations';
    return 'incidents';
  };

  const [activeTab, setActiveTab] = useState<HealthTabType>(() => {
    return resolveTab(searchParams.get('tab'));
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(resolveTab(tabParam));
    }
  }, [searchParams, location.search]);
  const [healthRecords, setHealthRecords] = useState<StudentHealthRow[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [evaluations, setEvaluations] = useState<DevelopmentEvaluation[]>([]);
  const [napRecords, setNapRecords] = useState<NapRecord[]>([]);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [_journalPosts, setJournalPosts] = useState<JournalPostItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form 1: Chỉ số BMI
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newHeight, setNewHeight] = useState<number>(100);
  const [newWeight, setNewWeight] = useState<number>(15);
  const [isSubmittingMetric, setIsSubmittingMetric] = useState(false);

  // Form 2: Đánh giá Thông tư 51 (Task 14)
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalForm, setEvalForm] = useState<{
    studentId: string;
    domain: DevelopmentDomain;
    scoreLevel: string;
    evaluationPeriod: string;
    notes: string;
  }>({
    studentId: '',
    domain: 'PHYSICAL',
    scoreLevel: 'Đạt yêu cầu',
    evaluationPeriod: 'Học kỳ 1',
    notes: '',
  });

  // Form 3: Nhật ký Ăn & Ngủ (Task 15)
  const [showNapModal, setShowNapModal] = useState(false);
  const [napForm, setNapForm] = useState<{
    studentId: string;
    date: string;
    napStart: string;
    napEnd: string;
    qualityNote: string;
  }>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    napStart: '11:45',
    napEnd: '14:00',
    qualityNote: 'Ngủ ngoan, sâu giấc',
  });

  const [showMealModal, setShowMealModal] = useState(false);
  const [mealForm, setMealForm] = useState<{
    studentId: string;
    date: string;
    mealType: MealType;
    consumptionLevel: MealConsumptionLevel;
  }>({
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    consumptionLevel: 'FINISHED',
  });

  // Form 4: Nhật ký Hoạt động lớp học (Task 16)
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const [journalForm, setJournalForm] = useState<{
    classId: string;
    date: string;
    caption: string;
    photoUrl: string;
  }>({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    caption: '',
    photoUrl: '',
  });

  // State các modal Sửa (Edit)
  const [showEditMetricModal, setShowEditMetricModal] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editMetricForm, setEditMetricForm] = useState<{
    studentName: string;
    heightCm: number;
    weightKg: number;
    measuredDate: string;
  }>({
    studentName: '',
    heightCm: 100,
    weightKg: 15,
    measuredDate: new Date().toISOString().split('T')[0],
  });

  const [showEditNapModal, setShowEditNapModal] = useState(false);
  const [editingNapId, setEditingNapId] = useState<string | null>(null);
  const [editNapForm, setEditNapForm] = useState<{
    studentName: string;
    date: string;
    napStart: string;
    napEnd: string;
    qualityNote: string;
  }>({
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    napStart: '11:45',
    napEnd: '14:00',
    qualityNote: '',
  });

  const [showEditMealModal, setShowEditMealModal] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealForm, setEditMealForm] = useState<{
    studentName: string;
    date: string;
    mealType: MealType;
    consumptionLevel: MealConsumptionLevel;
  }>({
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    consumptionLevel: 'FINISHED',
  });

  const [showEditEvalModal, setShowEditEvalModal] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  const [editEvalForm, setEditEvalForm] = useState<{
    studentName: string;
    domain: DevelopmentDomain;
    scoreLevel: string;
    evaluationPeriod: string;
    notes: string;
  }>({
    studentName: '',
    domain: 'PHYSICAL',
    scoreLevel: 'Đạt yêu cầu',
    evaluationPeriod: 'Học kỳ 1',
    notes: '',
  });

  const [showEditJournalModal, setShowEditJournalModal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [isProcessingEditPhoto, setIsProcessingEditPhoto] = useState(false);
  const [editJournalForm, setEditJournalForm] = useState<{
    classId: string;
    date: string;
    caption: string;
    photoUrl: string;
  }>({
    classId: '',
    date: new Date().toISOString().split('T')[0],
    caption: '',
    photoUrl: '',
  });

  // Nén ảnh chất lượng cao trên client để tối ưu tốc độ và dung lượng khi chụp từ điện thoại / máy tính
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Xử lý chọn tệp hình ảnh từ thiết bị (Điện thoại hoặc Máy tính)
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApiFeedback({ type: 'error', text: '⚠️ Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP...)' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setApiFeedback({ type: 'error', text: '⚠️ Tệp ảnh quá lớn (vui lòng chọn ảnh dưới 20MB)' });
      return;
    }

    setIsProcessingPhoto(true);
    try {
      // 1. Tối ưu nén ảnh trực tiếp trên trình duyệt
      const compressedDataUrl = await compressImage(file);

      // 2. Thử tải lên Supabase Storage nếu bucket classroom-photos tồn tại
      let uploadedUrl = '';
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const cleanFileName = `journal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('classroom-photos')
          .upload(cleanFileName, file, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: pubData } = supabase.storage.from('classroom-photos').getPublicUrl(cleanFileName);
          if (pubData?.publicUrl) {
            uploadedUrl = pubData.publicUrl;
          }
        }
      } catch {
        // Fallback: Nếu Supabase Storage chưa mở bucket, sử dụng trực tiếp chuỗi Base64 đã nén
      }

      const finalUrl = uploadedUrl || compressedDataUrl;
      setJournalForm((prev) => ({ ...prev, photoUrl: finalUrl }));
      setApiFeedback({ type: 'success', text: '📸 Đã tải và tối ưu hóa ảnh từ thiết bị thành công!' });
    } catch (err: any) {
      console.error('Lỗi xử lý ảnh:', err);
      setApiFeedback({ type: 'error', text: '⚠️ Không thể đọc tệp ảnh. Vui lòng thử lại.' });
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Tải toàn bộ dữ liệu thật từ Backend / Supabase
  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // 1. Tải danh sách Lớp & Học sinh ưu tiên từ Backend REST API (tránh 503 Supabase)
      let classesData: any[] = [];
      try {
        const clsRes = await academicApi.getClasses();
        const rawCls = Array.isArray(clsRes) ? clsRes : ((clsRes as any)?.data || []);
        if (rawCls && rawCls.length > 0) {
          classesData = rawCls.map((c: any) => ({ id: c.classId || c.id, name: c.className || c.name }));
        }
      } catch (err) {
        console.warn('Backend getClasses notice:', err);
      }

      if (classesData.length === 0) {
        classesData = [
          { id: 'c5555555-5555-5555-5555-555555555555', name: 'Lớp Chồi B1' },
          { id: 'c1111111-1111-1111-1111-111111111111', name: 'Lớp Mầm 1' },
        ];
      }

      if (classesData && classesData.length > 0) {
        setAvailableClasses(classesData.map((c: any) => ({ id: c.id, name: c.name })));
        if (!journalForm.classId && classesData.length > 0) {
          setJournalForm((prev) => ({ ...prev, classId: classesData[0].id }));
        }
      }

      let studentsData: any[] = [];
      try {
        const stuRes = await parentApi.getMyStudents();
        if (Array.isArray(stuRes) && stuRes.length > 0) {
          studentsData = stuRes.map((s: any) => ({
            id: s.studentId || s.id,
            full_name: s.fullName || s.full_name,
            class_id: s.classId || s.class_id || classesData[0]?.id,
          }));
        }
      } catch (err) {
        console.warn('Backend getStudents notice:', err);
      }

      if (studentsData.length === 0) {
        studentsData = [
          { id: '49b11347-0ea5-4dea-8f4b-c30edeab9c50', full_name: 'Nguyễn Gia Bảo', class_id: classesData[0]?.id },
          { id: 'HS0022-UUID-2222-2222-222222222222', full_name: 'Trần Khánh Linh', class_id: classesData[0]?.id },
        ];
      }

      let mappedStudents: StudentOption[] = [];
      if (studentsData && studentsData.length > 0) {
        mappedStudents = studentsData.map((s: any) => {
          const matchedClass = classesData?.find((c: any) => c.id === s.class_id);
          return {
            id: s.id,
            fullName: s.full_name,
            className: matchedClass?.name || 'Chưa xếp lớp',
            classId: s.class_id,
          };
        });
        setAvailableStudents(mappedStudents);
        setSelectedStudentId((prev) => prev || mappedStudents[0].id);
        setEvalForm((prev) => ({ ...prev, studentId: prev.studentId || mappedStudents[0].id }));
        setNapForm((prev) => ({ ...prev, studentId: prev.studentId || mappedStudents[0].id }));
        setMealForm((prev) => ({ ...prev, studentId: prev.studentId || mappedStudents[0].id }));
      } else {
        setAvailableStudents([]);
      }

      // 2. Tải Chỉ số BMI (health_metrics)
      let dbMetrics: any[] = [];
      try {
        const resp: any = await healthApi.getHealthMetrics();
        if (resp && Array.isArray(resp)) dbMetrics = resp;
      } catch {
        try {
          const { data: metrics, error: mErr } = await supabase
            .schema('health')
            .from('health_metrics')
            .select('*')
            .order('measured_date', { ascending: false });
          if (!mErr && metrics) {
            dbMetrics = metrics;
          } else {
            const { data: pubMetrics } = await supabase
              .from('health_metrics')
              .select('*')
              .order('measured_date', { ascending: false });
            if (pubMetrics) dbMetrics = pubMetrics;
          }
        } catch {
          const { data: pubMetrics } = await supabase
            .from('health_metrics')
            .select('*')
            .order('measured_date', { ascending: false });
          if (pubMetrics) dbMetrics = pubMetrics;
        }
      }

      if (dbMetrics && dbMetrics.length > 0) {
        setHealthRecords(
          dbMetrics.map((m: any) => {
            const stuId = m.student?.id || m.student_id;
            const matchedStu = mappedStudents.find((s) => s.id === stuId);
            return {
              id: m.id,
              studentId: stuId,
              studentName: matchedStu?.fullName || m.student?.fullName || 'Học sinh',
              className: matchedStu?.className || 'Chưa xếp lớp',
              heightCm: Number(m.heightCm || m.height_cm || 0),
              weightKg: Number(m.weightKg || m.weight_kg || 0),
              recordedAt: m.measuredDate || m.measured_date || new Date().toISOString(),
            };
          })
        );
      } else {
        setHealthRecords([]);
      }

      // 3. Tải Đánh giá Thông tư 51 (Task 14)
      let dbEvals: any[] = [];
      try {
        const { data: hEvals, error: eErr } = await supabase
          .schema('health')
          .from('development_evaluations')
          .select('*')
          .order('created_at', { ascending: false });
        if (!eErr && hEvals) {
          dbEvals = hEvals;
        } else {
          const { data: pubEvals } = await supabase
            .from('development_evaluations')
            .select('*')
            .order('created_at', { ascending: false });
          if (pubEvals) dbEvals = pubEvals;
        }
      } catch {
        const { data: pubEvals } = await supabase
          .from('development_evaluations')
          .select('*')
          .order('created_at', { ascending: false });
        if (pubEvals) dbEvals = pubEvals;
      }

      if (dbEvals && dbEvals.length > 0) {
        setEvaluations(
          dbEvals.map((e: any) => {
            const stu = mappedStudents.find((s) => s.id === e.student_id);
            return {
              id: e.id,
              studentId: e.student_id,
              studentName: stu?.fullName || 'Học sinh',
              evaluationPeriod: e.evaluation_period || 'Học kỳ 1',
              domain: e.domain as DevelopmentDomain,
              scoreLevel: e.score_level || 'Đạt',
              notes: e.notes || '',
            };
          })
        );
      } else {
        setEvaluations([]);
      }

      // 4. Tải Nhật ký Giấc ngủ trưa & Bữa ăn (Task 15)
      let dbNaps: any[] = [];
      try {
        const { data: hNaps, error: nErr } = await supabase
          .schema('health')
          .from('nap_records')
          .select('*')
          .order('date', { ascending: false });
        if (!nErr && hNaps) {
          dbNaps = hNaps;
        } else {
          const { data: pubNaps } = await supabase
            .from('nap_records')
            .select('*')
            .order('date', { ascending: false });
          if (pubNaps) dbNaps = pubNaps;
        }
      } catch {
        const { data: pubNaps } = await supabase
          .from('nap_records')
          .select('*')
          .order('date', { ascending: false });
        if (pubNaps) dbNaps = pubNaps;
      }

      if (dbNaps && dbNaps.length > 0) {
        setNapRecords(
          dbNaps.map((n: any) => {
            const stu = mappedStudents.find((s) => s.id === n.student_id);
            return {
              id: n.id,
              studentId: n.student_id,
              studentName: stu?.fullName || 'Học sinh',
              date: n.date,
              napStart: n.nap_start ? String(n.nap_start).substring(11, 16) : '11:45',
              napEnd: n.nap_end ? String(n.nap_end).substring(11, 16) : '14:00',
              qualityNote: n.quality_note || '',
            };
          })
        );
      } else {
        setNapRecords([]);
      }

      let dbMeals: any[] = [];
      try {
        const { data: hMeals, error: mErr } = await supabase
          .schema('health')
          .from('meal_records')
          .select('*')
          .order('date', { ascending: false });
        if (!mErr && hMeals) {
          dbMeals = hMeals;
        } else {
          const { data: pubMeals } = await supabase
            .from('meal_records')
            .select('*')
            .order('date', { ascending: false });
          if (pubMeals) dbMeals = pubMeals;
        }
      } catch {
        const { data: pubMeals } = await supabase
          .from('meal_records')
          .select('*')
          .order('date', { ascending: false });
        if (pubMeals) dbMeals = pubMeals;
      }

      if (dbMeals && dbMeals.length > 0) {
        setMealRecords(
          dbMeals.map((m: any) => {
            const stu = mappedStudents.find((s) => s.id === m.student_id);
            return {
              id: m.id,
              studentId: m.student_id,
              studentName: stu?.fullName || 'Học sinh',
              date: m.date,
              mealType: m.meal_type as MealType,
              consumptionLevel: m.consumption_level as MealConsumptionLevel,
            };
          })
        );
      } else {
        setMealRecords([]);
      }

      // 5. Tải Nhật ký Hoạt động Lớp học (Task 16)
      let dbPosts: any[] = [];
      try {
        const resp: any = await healthApi.getJournalPosts();
        if (resp && Array.isArray(resp)) dbPosts = resp;
      } catch {
        try {
          const { data: posts, error: pErr } = await supabase
            .schema('health')
            .from('classroom_journal_posts')
            .select('*')
            .order('date', { ascending: false });
          if (!pErr && posts) {
            dbPosts = posts;
          } else {
            const { data: pubPosts } = await supabase
              .from('classroom_journal_posts')
              .select('*')
              .order('date', { ascending: false });
            if (pubPosts) dbPosts = pubPosts;
          }
        } catch {
          const { data: pubPosts } = await supabase
            .from('classroom_journal_posts')
            .select('*')
            .order('date', { ascending: false });
          if (pubPosts) dbPosts = pubPosts;
        }
      }

      if (dbPosts && dbPosts.length > 0) {
        setJournalPosts(
          dbPosts.map((p: any) => {
            const matchedClass = classesData?.find((c: any) => c.id === (p.classId || p.class_id));
            let rawCaption = p.caption || '';
            let photoUrl = p.photoUrl || p.photo_url || p.image_url || '';

            // Trích xuất hình ảnh nếu được đóng gói trong caption dạng [IMAGE]...[/IMAGE]
            const imgMatch = rawCaption.match(/\[IMAGE\]([\s\S]*?)\[\/IMAGE\]/);
            if (imgMatch) {
              if (!photoUrl) {
                photoUrl = imgMatch[1];
              }
              rawCaption = rawCaption.replace(/\[IMAGE\][\s\S]*?\[\/IMAGE\]/, '').trim();
            }

            return {
              id: p.id,
              classId: p.classId || p.class_id,
              className: matchedClass?.name || 'Toàn trường',
              caption: rawCaption,
              photoUrl: photoUrl,
              date: p.date || p.created_at?.substring(0, 10) || new Date().toISOString().split('T')[0],
            };
          })
        );
      } else {
        setJournalPosts([]);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu sức khỏe:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  // Xử lý thêm Chỉ số BMI
  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setApiFeedback({ type: 'error', text: 'Vui lòng chọn học sinh.' });
      return;
    }
    setIsSubmittingMetric(true);
    setApiFeedback(null);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      try {
        await healthApi.createHealthMetric({
          studentId: selectedStudentId,
          heightCm: Number(newHeight),
          weightKg: Number(newWeight),
          measuredDate: todayStr,
        });
      } catch {
        const payload = {
          student_id: selectedStudentId,
          height_cm: Number(newHeight),
          weight_kg: Number(newWeight),
          measured_date: todayStr,
        };
        const hRes = await supabase.schema('health').from('health_metrics').insert([payload]);
        if (hRes.error) {
          const pubRes = await supabase.from('health_metrics').insert([payload]);
          if (pubRes.error) throw hRes.error;
        }
      }

      setApiFeedback({ type: 'success', text: '✅ Đã lưu chỉ số thể trạng thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi lưu chỉ số: ${err.message}` });
    } finally {
      setIsSubmittingMetric(false);
    }
  };

  // Xóa chỉ số thể trạng
  const handleDeleteMetric = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi chỉ số thể trạng này?')) return;
    try {
      try {
        await healthApi.deleteHealthMetric(id);
      } catch {
        const hRes = await supabase.schema('health').from('health_metrics').delete().eq('id', id);
        if (hRes.error) {
          const pubRes = await supabase.from('health_metrics').delete().eq('id', id);
          if (pubRes.error) throw hRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa bản ghi thể trạng.' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa chỉ số: ${err.message}` });
    }
  };

  // Mở modal sửa chỉ số thể trạng
  const handleOpenEditMetric = (row: StudentHealthRow) => {
    setEditingMetricId(row.id);
    setEditMetricForm({
      studentName: row.studentName,
      heightCm: row.heightCm,
      weightKg: row.weightKg,
      measuredDate: row.recordedAt.split('T')[0],
    });
    setShowEditMetricModal(true);
  };

  // Lưu sửa chỉ số thể trạng
  const handleUpdateMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMetricId) return;

    try {
      const payload = {
        height_cm: Number(editMetricForm.heightCm),
        weight_kg: Number(editMetricForm.weightKg),
        measured_date: editMetricForm.measuredDate,
      };

      const hRes = await supabase.schema('health').from('health_metrics').update(payload).eq('id', editingMetricId);
      if (hRes.error) {
        const pubRes = await supabase.from('health_metrics').update(payload).eq('id', editingMetricId);
        if (pubRes.error) throw hRes.error;
      }

      setShowEditMetricModal(false);
      setEditingMetricId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật chỉ số thể trạng thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật: ${err.message}` });
    }
  };

  // Mở modal sửa giấc ngủ
  const handleOpenEditNap = (nap: NapRecord) => {
    setEditingNapId(nap.id || null);
    setEditNapForm({
      studentName: nap.studentName || 'Học sinh',
      date: nap.date,
      napStart: nap.napStart || '11:45',
      napEnd: nap.napEnd || '14:00',
      qualityNote: nap.qualityNote || '',
    });
    setShowEditNapModal(true);
  };

  // Lưu cập nhật giấc ngủ
  const handleUpdateNap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNapId) return;

    try {
      const fullNapStart = `${editNapForm.date}T${editNapForm.napStart}:00`;
      const fullNapEnd = `${editNapForm.date}T${editNapForm.napEnd}:00`;
      const payload = {
        date: editNapForm.date,
        nap_start: fullNapStart,
        nap_end: fullNapEnd,
        quality_note: editNapForm.qualityNote,
      };

      const hRes = await supabase.schema('health').from('nap_records').update(payload).eq('id', editingNapId);
      if (hRes.error) {
        const pubRes = await supabase.from('nap_records').update(payload).eq('id', editingNapId);
        if (pubRes.error) throw hRes.error;
      }

      setShowEditNapModal(false);
      setEditingNapId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật giấc ngủ trưa thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi: ${err.message}` });
    }
  };

  // Mở modal sửa bữa ăn
  const handleOpenEditMeal = (meal: MealRecord) => {
    setEditingMealId(meal.id || null);
    setEditMealForm({
      studentName: meal.studentName || 'Học sinh',
      date: meal.date,
      mealType: meal.mealType,
      consumptionLevel: meal.consumptionLevel,
    });
    setShowEditMealModal(true);
  };

  // Lưu cập nhật bữa ăn
  const handleUpdateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealId) return;

    try {
      const payload = {
        date: editMealForm.date,
        meal_type: editMealForm.mealType,
        consumption_level: editMealForm.consumptionLevel,
      };

      const hRes = await supabase.schema('health').from('meal_records').update(payload).eq('id', editingMealId);
      if (hRes.error) {
        const pubRes = await supabase.from('meal_records').update(payload).eq('id', editingMealId);
        if (pubRes.error) throw hRes.error;
      }

      setShowEditMealModal(false);
      setEditingMealId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật bản ghi bữa ăn thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi: ${err.message}` });
    }
  };

  // Mở modal sửa đánh giá TT51
  const handleOpenEditEval = (ev: DevelopmentEvaluation) => {
    setEditingEvalId(ev.id || null);
    setEditEvalForm({
      studentName: ev.studentName || 'Học sinh',
      domain: ev.domain,
      scoreLevel: ev.scoreLevel,
      evaluationPeriod: ev.evaluationPeriod,
      notes: ev.notes || '',
    });
    setShowEditEvalModal(true);
  };

  // Lưu cập nhật đánh giá TT51
  const handleUpdateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvalId) return;

    try {
      const payload = {
        domain: editEvalForm.domain,
        score_level: editEvalForm.scoreLevel,
        evaluation_period: editEvalForm.evaluationPeriod,
        notes: editEvalForm.notes,
      };

      const hRes = await supabase.schema('health').from('development_evaluations').update(payload).eq('id', editingEvalId);
      if (hRes.error) {
        const pubRes = await supabase.from('development_evaluations').update(payload).eq('id', editingEvalId);
        if (pubRes.error) throw hRes.error;
      }

      setShowEditEvalModal(false);
      setEditingEvalId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật đánh giá Thông tư 51 thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi: ${err.message}` });
    }
  };

  // Xử lý đổi ảnh bài nhật ký khi sửa
  const handleEditPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingEditPhoto(true);
    try {
      const compressedDataUrl = await compressImage(file);
      setEditJournalForm((prev) => ({ ...prev, photoUrl: compressedDataUrl }));
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi nén ảnh: ${err.message}` });
    } finally {
      setIsProcessingEditPhoto(false);
    }
  };



  // Lưu cập nhật nhật ký lớp
  const handleUpdateJournalPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJournalId || !editJournalForm.caption.trim()) return;

    try {
      let finalCaption = editJournalForm.caption.trim();
      if (editJournalForm.photoUrl && editJournalForm.photoUrl.trim()) {
        finalCaption += `\n\n[IMAGE]${editJournalForm.photoUrl.trim()}[/IMAGE]`;
      }

      const payload: any = {
        date: editJournalForm.date,
        caption: finalCaption,
      };
      if (editJournalForm.classId) {
        payload.class_id = editJournalForm.classId;
      }

      const hRes = await supabase.schema('health').from('classroom_journal_posts').update(payload).eq('id', editingJournalId);
      if (hRes.error) {
        const pubRes = await supabase.from('classroom_journal_posts').update(payload).eq('id', editingJournalId);
        if (pubRes.error) throw hRes.error;
      }

      setShowEditJournalModal(false);
      setEditingJournalId(null);
      setApiFeedback({ type: 'success', text: '✅ Đã cập nhật bài nhật ký hoạt động lớp học!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật bài nhật ký: ${err.message}` });
    }
  };

  // Xử lý thêm Đánh giá TT 51 (Task 14)
  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.studentId) return;

    try {
      try {
        await healthApi.createEvaluation({
          studentId: evalForm.studentId,
          domain: evalForm.domain,
          scoreLevel: evalForm.scoreLevel,
          evaluationPeriod: evalForm.evaluationPeriod,
          notes: evalForm.notes,
        });
      } catch {
        const payload = {
          student_id: evalForm.studentId,
          domain: evalForm.domain,
          score_level: evalForm.scoreLevel,
          evaluation_period: evalForm.evaluationPeriod,
          notes: evalForm.notes,
        };
        const hRes = await supabase.schema('health').from('development_evaluations').insert([payload]);
        if (hRes.error) {
          const pubRes = await supabase.from('development_evaluations').insert([payload]);
          if (pubRes.error) throw hRes.error;
        }
      }

      setShowEvalModal(false);
      setEvalForm((prev) => ({ ...prev, notes: '' }));
      setApiFeedback({ type: 'success', text: '✅ Đã lưu kết quả đánh giá theo Thông tư 51 thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi lưu đánh giá: ${err.message}` });
    }
  };

  // Xóa đánh giá TT 51
  const handleDeleteEvaluation = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) return;
    try {
      try {
        await healthApi.deleteEvaluation(id);
      } catch {
        const hRes = await supabase.schema('health').from('development_evaluations').delete().eq('id', id);
        if (hRes.error) {
          const pubRes = await supabase.from('development_evaluations').delete().eq('id', id);
          if (pubRes.error) throw hRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa đánh giá.' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa đánh giá: ${err.message}` });
    }
  };

  // Xử lý thêm Giấc ngủ trưa (Task 15)
  const handleAddNap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!napForm.studentId) return;

    try {
      const fullNapStart = `${napForm.date}T${napForm.napStart}:00`;
      const fullNapEnd = `${napForm.date}T${napForm.napEnd}:00`;

      try {
        await healthApi.createNapRecord({
          studentId: napForm.studentId,
          date: napForm.date,
          napStart: fullNapStart,
          napEnd: fullNapEnd,
          qualityNote: napForm.qualityNote,
        });
      } catch {
        const payload = {
          student_id: napForm.studentId,
          date: napForm.date,
          nap_start: fullNapStart,
          nap_end: fullNapEnd,
          quality_note: napForm.qualityNote,
        };
        const hRes = await supabase.schema('health').from('nap_records').insert([payload]);
        if (hRes.error) {
          const pubRes = await supabase.from('nap_records').insert([payload]);
          if (pubRes.error) throw hRes.error;
        }
      }

      setShowNapModal(false);
      setApiFeedback({ type: 'success', text: '✅ Đã ghi nhận giấc ngủ trưa của bé thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi lưu giấc ngủ: ${err.message}` });
    }
  };

  // Xóa giấc ngủ
  const handleDeleteNap = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi ngủ này?')) return;
    try {
      try {
        await healthApi.deleteNapRecord(id);
      } catch {
        const hRes = await supabase.schema('health').from('nap_records').delete().eq('id', id);
        if (hRes.error) {
          const pubRes = await supabase.from('nap_records').delete().eq('id', id);
          if (pubRes.error) throw hRes.error;
        }
      }
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi: ${err.message}` });
    }
  };

  // Xử lý thêm Bữa ăn (Task 15)
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealForm.studentId) return;

    try {
      try {
        await healthApi.createMealRecord({
          studentId: mealForm.studentId,
          date: mealForm.date,
          mealType: mealForm.mealType,
          consumptionLevel: mealForm.consumptionLevel,
        });
      } catch {
        const payload = {
          student_id: mealForm.studentId,
          date: mealForm.date,
          meal_type: mealForm.mealType,
          consumption_level: mealForm.consumptionLevel,
        };
        const hRes = await supabase.schema('health').from('meal_records').insert([payload]);
        if (hRes.error) {
          const pubRes = await supabase.from('meal_records').insert([payload]);
          if (pubRes.error) throw hRes.error;
        }
      }

      setShowMealModal(false);
      setApiFeedback({ type: 'success', text: '✅ Đã ghi nhận bữa ăn của bé thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi lưu bữa ăn: ${err.message}` });
    }
  };

  // Xóa bữa ăn
  const handleDeleteMeal = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi bữa ăn này?')) return;
    try {
      try {
        await healthApi.deleteMealRecord(id);
      } catch {
        const hRes = await supabase.schema('health').from('meal_records').delete().eq('id', id);
        if (hRes.error) {
          const pubRes = await supabase.from('meal_records').delete().eq('id', id);
          if (pubRes.error) throw hRes.error;
        }
      }
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi: ${err.message}` });
    }
  };

  // Xử lý thêm Nhật ký lớp học (Task 16)
  const handleAddJournalPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.classId || !journalForm.caption.trim()) return;

    try {
      // Đóng gói ảnh vào nội dung caption (theo định dạng [IMAGE]...[/IMAGE])
      // Đảm bảo tương thích 100% với schema health.classroom_journal_posts trong PostgreSQL (vốn không có cột photo_url)
      let finalCaption = journalForm.caption.trim();
      if (journalForm.photoUrl && journalForm.photoUrl.trim()) {
        finalCaption += `\n\n[IMAGE]${journalForm.photoUrl.trim()}[/IMAGE]`;
      }

      try {
        // 1. Thử gửi qua Spring Boot API
        await healthApi.createJournalPost({
          classId: journalForm.classId,
          date: journalForm.date,
          caption: finalCaption,
        });
      } catch {
        // 2. Fallback ghi trực tiếp vào Supabase schema 'health'
        // Tuyệt đối không gửi cột photo_url vì schema database không có cột này (tránh lỗi 400 Bad Request)
        const payload: any = {
          class_id: journalForm.classId,
          date: journalForm.date,
          caption: finalCaption,
        };

        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          payload.id = crypto.randomUUID();
        }

        let hRes = await supabase.schema('health').from('classroom_journal_posts').insert([payload]);
        if (hRes.error) {
          // Thử lại nếu DB tự sinh ID
          const { id, ...noIdPayload } = payload;
          hRes = await supabase.schema('health').from('classroom_journal_posts').insert([noIdPayload]);
          if (hRes.error) {
            const pubRes = await supabase.from('classroom_journal_posts').insert([noIdPayload]);
            if (pubRes.error) throw hRes.error;
          }
        }
      }

      setShowJournalModal(false);
      setJournalForm((prev) => ({ ...prev, caption: '', photoUrl: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setApiFeedback({ type: 'success', text: '✅ Đã đăng bài nhật ký hoạt động lớp học thành công!' });
      await loadHealthData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi đăng nhật ký: ${err.message}` });
    }
  };



  const domainNames: { [key in DevelopmentDomain]: string } = {
    PHYSICAL: '1. Thể chất (Vận động thô & tinh)',
    COGNITIVE: '2. Nhận thức (Khám phá & Toán học)',
    LANGUAGE: '3. Ngôn ngữ (Giao tiếp & Kể chuyện)',
    SOCIO_EMOTIONAL: '4. Tình cảm & Kỹ năng xã hội',
    AESTHETIC: '5. Thẩm mỹ (Âm nhạc & Tạo hình)',
  };

  const currentHealthMeta = HEALTH_TAB_META[activeTab] || HEALTH_TAB_META['incidents'];
  const HealthMetaIcon = currentHealthMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ Y TẾ & CHĂM SÓC (ĐỘNG THEO USE CASE, HOÀN TOÀN KHÔNG CÓ THANH SCROLL NGANG) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentHealthMeta.specialColor === 'alert'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#E5A93C] text-slate-950'
              } shadow-xs`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Y Tế & Lớp Học</span>
            </span>
            {currentHealthMeta.badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
                {currentHealthMeta.badge}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-[#78C2AD] shrink-0">
              <HealthMetaIcon className="h-5 w-5" />
            </div>
            <span>{currentHealthMeta.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl">
            {currentHealthMeta.description}
          </p>
        </div>

        <button
          onClick={loadHealthData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 text-xs font-bold backdrop-blur-md hover:bg-white/25 transition text-white border border-white/20 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Thông báo phản hồi */}
      {apiFeedback && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {apiFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{apiFeedback.text}</span>
        </div>
      )}

      {/* ================= TAB: SỰ VỤ Y TẾ & SƠ CẤU ================= */}
      {activeTab === 'incidents' && <MedicalIncidentsTab />}

      {/* ================= TAB: QUẢN LÝ UỐNG THUỐC ================= */}
      {activeTab === 'medication' && <MedicationAdministrationTab />}

      {/* ================= TAB: NHẬT KÝ HOẠT ĐỘNG LỚP ================= */}
      {activeTab === 'journal' && <ClassroomJournalTab />}

      {/* ================= TAB: CHỈ SỐ THỂ TRẠNG WHO ================= */}
      {activeTab === 'metrics' && <ClassHealthMetricsTab />}

      {/* Legacy metrics panel hidden */}
      {false && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <span>Ghi nhận Chỉ số Thể trạng Định kỳ (Đo Chiều cao & Cân nặng)</span>
              </h3>
              {newHeight > 0 && newWeight > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium">Chỉ số BMI dự tính:</span>
                  <span className="font-bold text-slate-800">{calculateBmi(newWeight, newHeight)}</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getBmiBadge(getBmiStatus(calculateBmi(newWeight, newHeight))).color}`}>
                    {getBmiBadge(getBmiStatus(calculateBmi(newWeight, newHeight))).label}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleAddMetric} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chọn học sinh</label>
                <select
                  value={selectedStudentId}
                  disabled={availableStudents.length === 0}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 font-medium focus:border-rose-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {availableStudents.length === 0 ? (
                    <option value="">-- Chưa có học sinh nào trong Database --</option>
                  ) : (
                    availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.className})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chiều cao</label>
                <div className="relative">
                  <input
                    type="number"
                    min="30"
                    max="160"
                    required
                    placeholder="100"
                    value={newHeight || ''}
                    onChange={(e) => setNewHeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 pl-3 pr-9 py-2 text-xs text-slate-800 font-bold focus:border-rose-500 focus:outline-hidden"
                  />
                  <span className="pointer-events-none absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cân nặng</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="3"
                    max="80"
                    required
                    placeholder="15.0"
                    value={newWeight || ''}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 pl-3 pr-8 py-2 text-xs text-slate-800 font-bold focus:border-rose-500 focus:outline-hidden"
                  />
                  <span className="pointer-events-none absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    kg
                  </span>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isSubmittingMetric || availableStudents.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  {isSubmittingMetric ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  <span>{isSubmittingMetric ? 'Đang lưu...' : 'Lưu số đo'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu thể trạng...</p>
              </div>
            ) : healthRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400" />
                <h3 className="text-base font-semibold text-slate-700">Chưa có bản ghi thể trạng</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Cơ sở dữ liệu Supabase hiện chưa có số đo thể trạng nào. Nhập số đo mới ở form phía trên.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Học sinh</th>
                      <th className="py-3 px-4">Lớp</th>
                      <th className="py-3 px-4 text-center">Chiều cao</th>
                      <th className="py-3 px-4 text-center">Cân nặng</th>
                      <th className="py-3 px-4 text-center">Chỉ số BMI</th>
                      <th className="py-3 px-4 text-center">Phân loại thể trạng WHO</th>
                      <th className="py-3 px-4">Ngày ghi nhận</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {healthRecords.map((r) => {
                      const bmi = calculateBmi(r.weightKg, r.heightCm);
                      const status = getBmiStatus(bmi);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{r.studentName}</td>
                          <td className="py-3 px-4 text-slate-600">{r.className}</td>
                          <td className="py-3 px-4 text-center font-medium text-slate-700">{r.heightCm} cm</td>
                          <td className="py-3 px-4 text-center font-medium text-slate-700">{r.weightKg} kg</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800">{bmi}</td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold border ${getBmiStatusBadgeColor(
                                status
                              )}`}
                            >
                              {status === 'NORMAL' && 'Bình thường'}
                              {status === 'UNDERWEIGHT' && 'Suy dinh dưỡng'}
                              {status === 'OVERWEIGHT' && 'Nguy cơ béo phì'}
                              {status === 'OBESE' && 'Béo phì'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">{formatDate(r.recordedAt)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditMetric(r)}
                                className="rounded-lg p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Sửa chỉ số thể trạng"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMetric(r.id)}
                                className="rounded-lg p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Xóa chỉ số"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: NHẬT KÝ ĂN & NGỦ (TASK 15) ================= */}
      {activeTab === 'care' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Ghi nhận giờ giấc ngủ trưa và mức độ hoàn thành suất ăn bán trú theo thời gian thực cho phụ huynh.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNapModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
              >
                <Moon className="h-4 w-4" />
                <span> Ghi nhận Giấc ngủ trưa</span>
              </button>
              <button
                onClick={() => setShowMealModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
              >
                <Utensils className="h-4 w-4" />
                <span> Ghi nhận Bữa ăn</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: Giấc ngủ trưa */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Nhật ký Giấc ngủ trưa</h3>
                    <p className="text-[11px] text-slate-500">{napRecords.length} bản ghi</p>
                  </div>
                </div>
              </div>

              {napRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có bản ghi theo dõi giấc ngủ nào trong database.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {napRecords.map((nap) => (
                    <div key={nap.id} className="py-3 flex items-start justify-between text-xs group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{nap.studentName}</span>
                          <span className="text-[11px] text-slate-400">{formatDate(nap.date)}</span>
                        </div>
                        <p className="text-amber-700 font-semibold mt-1">
                          ⏰ {nap.napStart} — {nap.napEnd}
                        </p>
                        {nap.qualityNote && <p className="text-slate-500 mt-0.5">{nap.qualityNote}</p>}
                      </div>
                      {nap.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEditNap(nap)}
                            className="text-slate-400 hover:text-indigo-600 transition"
                            title="Sửa giấc ngủ"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNap(nap.id!)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột 2: Bữa ăn */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Nhật ký Bữa ăn</h3>
                    <p className="text-[11px] text-slate-500">{mealRecords.length} bản ghi</p>
                  </div>
                </div>
              </div>

              {mealRecords.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có bản ghi theo dõi bữa ăn nào trong database.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {mealRecords.map((meal) => (
                    <div key={meal.id} className="py-3 flex items-start justify-between text-xs group">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{meal.studentName}</span>
                          <span className="text-[11px] text-slate-400">{formatDate(meal.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-slate-600">
                            {meal.mealType === 'BREAKFAST' && 'Bữa sáng'}
                            {meal.mealType === 'LUNCH' && 'Bữa trưa'}
                            {meal.mealType === 'SNACK' && 'Bữa xế'}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              meal.consumptionLevel === 'FINISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : meal.consumptionLevel === 'HALF'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {meal.consumptionLevel === 'FINISHED' && 'Ăn hết suất'}
                            {meal.consumptionLevel === 'HALF' && 'Ăn một nửa'}
                            {meal.consumptionLevel === 'SKIPPED' && 'Bỏ bữa / Ăn rất ít'}
                          </span>
                        </div>
                      </div>
                      {meal.id && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleOpenEditMeal(meal)}
                            className="text-slate-400 hover:text-indigo-600 transition"
                            title="Sửa bữa ăn"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(meal.id!)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: ĐÁNH GIÁ 5 LĨNH VỰC MẦM NON ================= */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <EarlyChildhoodEvaluationTab />
        </div>
      )}

      {false && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Đánh giá Phát triển 5 Lĩnh vực theo Thông tư 51/2020/TT-BGDĐT
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đánh giá định kỳ quá trình trưởng thành của trẻ mầm non trên 5 khía cạnh cốt lõi.
              </p>
            </div>
            <button
              onClick={() => setShowEvalModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span> Thêm Đánh giá Học sinh</span>
            </button>
          </div>

          {/* 5 Thẻ tiêu chí */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { key: 'PHYSICAL', title: '1. Thể chất', desc: 'Vận động tinh, thô, sự dẻo dai' },
              { key: 'COGNITIVE', title: '2. Nhận thức', desc: 'Toán học, khám phá thế giới' },
              { key: 'LANGUAGE', title: '3. Ngôn ngữ', desc: 'Giao tiếp, vốn từ vựng' },
              { key: 'SOCIO_EMOTIONAL', title: '4. Tình cảm & XH', desc: 'Ứng xử, tình cảm, kỷ luật' },
              { key: 'AESTHETIC', title: '5. Thẩm mỹ', desc: 'Cảm thụ âm nhạc, tạo hình' },
            ].map((domain, i) => {
              const count = evaluations.filter((e) => e.domain === domain.key).length;
              return (
                <div key={i} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                  <p className="text-xs font-bold text-indigo-700">{domain.title}</p>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{domain.desc}</p>
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Đã đánh giá:</span>
                    <span className="text-indigo-600 font-bold">{count} bé</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bảng danh sách đánh giá */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {evaluations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Chưa có dữ liệu đánh giá Thông tư 51 trong cơ sở dữ liệu. Nhấn nút "+ Thêm Đánh giá Học sinh" để tạo mới.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Học sinh</th>
                    <th className="py-3 px-4">Kỳ đánh giá</th>
                    <th className="py-3 px-4">Lĩnh vực phát triển</th>
                    <th className="py-3 px-4 text-center">Xếp loại</th>
                    <th className="py-3 px-4">Nhận xét của giáo viên</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {evaluations.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{ev.studentName}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">{ev.evaluationPeriod}</td>
                      <td className="py-3.5 px-4 font-semibold text-indigo-700">{domainNames[ev.domain]}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          {ev.scoreLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{ev.notes || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        {ev.id && (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditEval(ev)}
                              className="text-slate-400 hover:text-indigo-600 transition"
                              title="Sửa đánh giá"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvaluation(ev.id!)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Xóa đánh giá"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

  {/* Ghi chú: Nhật ký hoạt động lớp học đã được chuyển sang ClassroomJournalTab */}

      {/* ================= MODAL ĐÁNH GIÁ THÔNG TƯ 51 (TASK 14) ================= */}
      {showEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Đánh Giá Thông Tư 51</h3>
              <button onClick={() => setShowEvalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvaluation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chọn học sinh</label>
                <select
                  value={evalForm.studentId}
                  onChange={(e) => setEvalForm({ ...evalForm, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kỳ đánh giá</label>
                  <select
                    value={evalForm.evaluationPeriod}
                    onChange={(e) => setEvalForm({ ...evalForm, evaluationPeriod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Học kỳ 1">Học kỳ 1</option>
                    <option value="Học kỳ 2">Học kỳ 2</option>
                    <option value="Cuối năm học">Cuối năm học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Xếp loại</label>
                  <select
                    value={evalForm.scoreLevel}
                    onChange={(e) => setEvalForm({ ...evalForm, scoreLevel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                    <option value="Vượt bậc / Tốt">Vượt bậc / Tốt</option>
                    <option value="Cần cố gắng">Cần cố gắng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lĩnh vực phát triển</label>
                <select
                  value={evalForm.domain}
                  onChange={(e) => setEvalForm({ ...evalForm, domain: e.target.value as DevelopmentDomain })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="PHYSICAL">1. Thể chất</option>
                  <option value="COGNITIVE">2. Nhận thức</option>
                  <option value="LANGUAGE">3. Ngôn ngữ</option>
                  <option value="SOCIO_EMOTIONAL">4. Tình cảm & Kỹ năng xã hội</option>
                  <option value="AESTHETIC">5. Thẩm mỹ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nhận xét chi tiết</label>
                <textarea
                  rows={3}
                  placeholder="Ghi nhận sự tiến bộ, thái độ tham gia của bé..."
                  value={evalForm.notes}
                  onChange={(e) => setEvalForm({ ...evalForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL GIẤC NGỦ TRƯA (TASK 15) ================= */}
      {showNapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Ghi Nhận Giấc Ngủ Trưa</h3>
              <button onClick={() => setShowNapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddNap} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Học sinh</label>
                <select
                  value={napForm.studentId}
                  onChange={(e) => setNapForm({ ...napForm, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-amber-500 focus:outline-hidden"
                >
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày theo dõi</label>
                <input
                  type="date"
                  value={napForm.date}
                  onChange={(e) => setNapForm({ ...napForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ bắt đầu ngủ</label>
                  <input
                    type="time"
                    value={napForm.napStart}
                    onChange={(e) => setNapForm({ ...napForm, napStart: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ thức dậy</label>
                  <input
                    type="time"
                    value={napForm.napEnd}
                    onChange={(e) => setNapForm({ ...napForm, napEnd: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chất lượng giấc ngủ</label>
                <input
                  type="text"
                  placeholder="VD: Ngủ ngon, sâu giấc, trằn trọc..."
                  value={napForm.qualityNote}
                  onChange={(e) => setNapForm({ ...napForm, qualityNote: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNapModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                >
                  Lưu Giấc Ngủ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL BỮA ĂN (TASK 15) ================= */}
      {showMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Ghi Nhận Mức Độ Bữa Ăn</h3>
              <button onClick={() => setShowMealModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Học sinh</label>
                <select
                  value={mealForm.studentId}
                  onChange={(e) => setMealForm({ ...mealForm, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-hidden"
                >
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày</label>
                <input
                  type="date"
                  value={mealForm.date}
                  onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bữa ăn</label>
                  <select
                    value={mealForm.mealType}
                    onChange={(e) => setMealForm({ ...mealForm, mealType: e.target.value as MealType })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="BREAKFAST">Bữa sáng</option>
                    <option value="LUNCH">Bữa trưa chính</option>
                    <option value="SNACK">Bữa phụ xế</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ ăn</label>
                  <select
                    value={mealForm.consumptionLevel}
                    onChange={(e) => setMealForm({ ...mealForm, consumptionLevel: e.target.value as MealConsumptionLevel })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="FINISHED">Ăn hết suất</option>
                    <option value="HALF">Ăn một nửa</option>
                    <option value="SKIPPED">Bỏ bữa / Ăn rất ít</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Lưu Bữa Ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL NHẬT KÝ HOẠT ĐỘNG LỚP (TASK 16) ================= */}
      {showJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Đăng Bài Nhật Ký Lớp Học</h3>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddJournalPost} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lớp học</label>
                  <select
                    value={journalForm.classId}
                    onChange={(e) => setJournalForm({ ...journalForm, classId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-emerald-500 focus:outline-hidden"
                  >
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày hoạt động</label>
                  <input
                    type="date"
                    value={journalForm.date}
                    onChange={(e) => setJournalForm({ ...journalForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung / Mô tả hoạt động</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Hôm nay các con tham gia hoạt động nặn đất sét, múa hát vui vẻ..."
                  value={journalForm.caption}
                  onChange={(e) => setJournalForm({ ...journalForm, caption: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hình ảnh hoạt động (Chọn từ máy tính hoặc điện thoại)
                </label>

                {/* Input chọn tệp ẩn - accept="image/*" tự động kích hoạt camera/thư viện ảnh trên điện thoại */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                />

                {journalForm.photoUrl ? (
                  <div className="relative rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-2 overflow-hidden shadow-xs">
                    <img
                      src={journalForm.photoUrl}
                      alt="Xem trước ảnh hoạt động"
                      className="w-full h-44 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-md hover:bg-white flex items-center gap-1 transition"
                      >
                        <RefreshCw className="h-3 w-3 text-emerald-600" />
                        <span>Đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setJournalForm((prev) => ({ ...prev, photoUrl: '' }));
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="rounded-lg bg-rose-600/90 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-white shadow-md hover:bg-rose-700 flex items-center gap-1 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Xóa</span>
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-emerald-700 font-semibold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Ảnh từ thiết bị đã sẵn sàng để đăng</span>
                      </span>
                      <span className="text-slate-400 font-normal">Đã nén tối ưu</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/30 p-4 text-center transition group"
                  >
                    {isProcessingPhoto ? (
                      <div className="flex flex-col items-center justify-center py-3">
                        <Loader2 className="h-7 w-7 animate-spin text-emerald-600 mb-2" />
                        <p className="text-xs font-semibold text-slate-700">Đang xử lý & tối ưu hóa ảnh...</p>
                        <p className="text-[11px] text-slate-400">Vui lòng chờ trong giây lát</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="rounded-full bg-emerald-100 p-2.5 text-emerald-600 group-hover:scale-110 transition duration-200 mb-2">
                          <Upload className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">
                          Bấm vào đây để chọn ảnh từ thiết bị
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📱 Điện thoại: Mở Camera chụp ngay hoặc Thư viện ảnh • 💻 Máy tính: Chọn tệp ảnh
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tùy chọn dán URL ngoài (phòng khi người dùng có sẵn liên kết) */}
                <div className="mt-2">
                  <details className="text-[11px] text-slate-500">
                    <summary className="cursor-pointer font-medium hover:text-slate-700 select-none">
                      Hoặc dán liên kết URL ảnh ngoài (tùy chọn)
                    </summary>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={journalForm.photoUrl.startsWith('http') ? journalForm.photoUrl : ''}
                        onChange={(e) => setJournalForm({ ...journalForm, photoUrl: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </details>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Đăng Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA CHỈ SỐ THỂ TRẠNG ================= */}
      {showEditMetricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Chỉ Số Thể Trạng</h3>
                <p className="text-xs text-indigo-600 font-semibold">{editMetricForm.studentName}</p>
              </div>
              <button onClick={() => setShowEditMetricModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMetric} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Chiều cao <span className="text-indigo-600 font-bold">(cm)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={50}
                    max={150}
                    value={editMetricForm.heightCm}
                    onChange={(e) => setEditMetricForm({ ...editMetricForm, heightCm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Cân nặng <span className="text-indigo-600 font-bold">(kg)</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min={5}
                    max={60}
                    value={editMetricForm.weightKg}
                    onChange={(e) => setEditMetricForm({ ...editMetricForm, weightKg: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày đo</label>
                <input
                  type="date"
                  required
                  value={editMetricForm.measuredDate}
                  onChange={(e) => setEditMetricForm({ ...editMetricForm, measuredDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Xem trước chỉ số BMI theo WHO */}
              {editMetricForm.heightCm > 0 && editMetricForm.weightKg > 0 && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500">Chỉ số BMI ước tính:</span>{' '}
                    <span className="font-extrabold text-indigo-700">
                      {calculateBmi(editMetricForm.weightKg, editMetricForm.heightCm)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${getBmiStatusBadgeColor(
                      getBmiStatus(calculateBmi(editMetricForm.weightKg, editMetricForm.heightCm))
                    )}`}
                  >
                    {getBmiStatus(calculateBmi(editMetricForm.weightKg, editMetricForm.heightCm))}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditMetricModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Cập Nhật Chỉ Số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA GIẤC NGỦ TRƯA ================= */}
      {showEditNapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Nhật Ký Giấc Ngủ</h3>
                <p className="text-xs text-indigo-600 font-semibold">{editNapForm.studentName}</p>
              </div>
              <button onClick={() => setShowEditNapModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateNap} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày ghi nhận</label>
                <input
                  type="date"
                  required
                  value={editNapForm.date}
                  onChange={(e) => setEditNapForm({ ...editNapForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ bắt đầu ngủ</label>
                  <input
                    type="time"
                    required
                    value={editNapForm.napStart}
                    onChange={(e) => setEditNapForm({ ...editNapForm, napStart: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ thức dậy</label>
                  <input
                    type="time"
                    required
                    value={editNapForm.napEnd}
                    onChange={(e) => setEditNapForm({ ...editNapForm, napEnd: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chất lượng giấc ngủ / Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ngủ ngon giấc, không quấy khóc..."
                  value={editNapForm.qualityNote}
                  onChange={(e) => setEditNapForm({ ...editNapForm, qualityNote: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNapModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA BỮA ĂN ================= */}
      {showEditMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Nhật Ký Bữa Ăn</h3>
                <p className="text-xs text-indigo-600 font-semibold">{editMealForm.studentName}</p>
              </div>
              <button onClick={() => setShowEditMealModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMeal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày ghi nhận</label>
                <input
                  type="date"
                  required
                  value={editMealForm.date}
                  onChange={(e) => setEditMealForm({ ...editMealForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại bữa ăn</label>
                  <select
                    value={editMealForm.mealType}
                    onChange={(e) => setEditMealForm({ ...editMealForm, mealType: e.target.value as MealType })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="BREAKFAST">Bữa sáng</option>
                    <option value="LUNCH">Bữa trưa</option>
                    <option value="SNACK">Bữa xế</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ ăn</label>
                  <select
                    value={editMealForm.consumptionLevel}
                    onChange={(e) => setEditMealForm({ ...editMealForm, consumptionLevel: e.target.value as MealConsumptionLevel })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="FINISHED">Ăn hết suất</option>
                    <option value="HALF">Ăn một nửa</option>
                    <option value="SKIPPED">Bỏ bữa / Ăn rất ít</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditMealModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA ĐÁNH GIÁ THÔNG TƯ 51 ================= */}
      {showEditEvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Đánh Giá Thông Tư 51</h3>
                <p className="text-xs text-indigo-600 font-semibold">{editEvalForm.studentName}</p>
              </div>
              <button onClick={() => setShowEditEvalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvaluation} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lĩnh vực phát triển</label>
                <select
                  value={editEvalForm.domain}
                  onChange={(e) => setEditEvalForm({ ...editEvalForm, domain: e.target.value as DevelopmentDomain })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="PHYSICAL">Phát triển Thể chất</option>
                  <option value="COGNITIVE">Phát triển Nhận thức</option>
                  <option value="LANGUAGE">Phát triển Ngôn ngữ</option>
                  <option value="EMOTIONAL_SOCIAL">Phát triển Tình cảm & Kỹ năng xã hội</option>
                  <option value="AESTHETIC">Phát triển Thẩm mỹ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ đạt được</label>
                  <select
                    value={editEvalForm.scoreLevel}
                    onChange={(e) => setEditEvalForm({ ...editEvalForm, scoreLevel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Đạt yêu cầu">Đạt yêu cầu</option>
                    <option value="Vượt trội">Vượt trội</option>
                    <option value="Cần rèn luyện thêm">Cần rèn luyện thêm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kỳ đánh giá</label>
                  <select
                    value={editEvalForm.evaluationPeriod}
                    onChange={(e) => setEditEvalForm({ ...editEvalForm, evaluationPeriod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="Học kỳ 1">Học kỳ 1</option>
                    <option value="Học kỳ 2">Học kỳ 2</option>
                    <option value="Tổng kết năm học">Tổng kết năm học</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nhận xét chi tiết</label>
                <textarea
                  rows={3}
                  value={editEvalForm.notes}
                  onChange={(e) => setEditEvalForm({ ...editEvalForm, notes: e.target.value })}
                  placeholder="Ghi chú thêm về khả năng hoặc sở thích của trẻ..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditEvalModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Đánh Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA NHẬT KÝ HOẠT ĐỘNG LỚP ================= */}
      {showEditJournalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Chỉnh Sửa Bài Nhật Ký Lớp</h3>
              <button onClick={() => setShowEditJournalModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateJournalPost} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày hoạt động</label>
                <input
                  type="date"
                  value={editJournalForm.date}
                  onChange={(e) => setEditJournalForm({ ...editJournalForm, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung bài viết</label>
                <textarea
                  rows={3}
                  required
                  value={editJournalForm.caption}
                  onChange={(e) => setEditJournalForm({ ...editJournalForm, caption: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Hình ảnh hoạt động (Chọn ảnh mới hoặc giữ nguyên)
                </label>

                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditPhotoFileChange}
                />

                {editJournalForm.photoUrl ? (
                  <div className="relative rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-2 overflow-hidden shadow-xs">
                    <img
                      src={editJournalForm.photoUrl}
                      alt="Xem trước ảnh sửa"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="rounded-lg bg-white/95 backdrop-blur-xs px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-md hover:bg-white flex items-center gap-1 transition"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Đổi ảnh</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditJournalForm((prev) => ({ ...prev, photoUrl: '' }))}
                        className="rounded-lg bg-rose-500/90 text-white px-2 py-1 text-xs font-semibold shadow-md hover:bg-rose-600 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => editFileInputRef.current?.click()}
                    className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition group"
                  >
                    <Upload className="mx-auto h-7 w-7 text-slate-400 group-hover:text-emerald-600 transition mb-1" />
                    {isProcessingEditPhoto ? (
                      <p className="text-xs font-semibold text-emerald-600">Đang tối ưu hình ảnh...</p>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700">
                          Bấm vào đây để chọn ảnh từ thiết bị
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          📱 Điện thoại: Mở Camera / Thư viện ảnh • 💻 Máy tính: Chọn tệp ảnh
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditJournalModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                >
                  Cập Nhật Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthPage;
