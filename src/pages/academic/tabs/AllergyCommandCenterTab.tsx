import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Plus,
  Search,
  Upload,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  Pill,
  UtensilsCrossed,
  Sparkles,
  PhoneCall,
  RefreshCw,
  Check
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';
import {
  StudentAllergyProfile,
  UpdateAllergyPayload,
} from '../../../types/classroom.types';
import { AllergyShieldBadge } from '../../../components/common/AllergyShieldBadge';

// System Messages
const MSG_220 = 'Đã kích hoạt huy hiệu cảnh báo dị ứng trên toàn hệ thống';
const MSG_221 = 'Phác đồ sơ cứu và vị trí thuốc cấp cứu là bắt buộc đối với dị ứng sốc phản vệ nặng.';
const MSG_222 = 'Cảnh báo dị ứng cho chất này đã tồn tại trên hồ sơ của bé.';

// Zod Schema for Allergy Alert Registration / Update
const allergyFormSchema = z
  .object({
    studentId: z.string().min(1, 'Vui lòng chọn học sinh'),
    category: z.enum(['FOOD', 'MEDICATION', 'ENVIRONMENT'] as const),
    allergyTags: z
      .string()
      .min(2, 'Vui lòng nhập ít nhất 1 dị nguyên cụ thể (vd: peanuts, tôm cua)'),
    severity: z.enum(['SEVERE_ANAPHYLAXIS', 'MILD_MODERATE'] as const),
    emergencyProtocol: z.string().optional(),
    medicationLocation: z.string().optional(),
    doctorCertificateUrl: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // MSG-221: Severe anaphylaxis requires protocol & medication location
    if (data.severity === 'SEVERE_ANAPHYLAXIS') {
      if (!data.emergencyProtocol || data.emergencyProtocol.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['emergencyProtocol'],
          message: MSG_221,
        });
      }
      if (!data.medicationLocation || data.medicationLocation.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['medicationLocation'],
          message: 'Vui lòng chỉ định vị trí cất giữ thuốc cấp cứu (vd: Tủ thuốc y tế tầng 1, Bút EpiPen ngăn 2)',
        });
      }
    }
  });

type AllergyFormData = z.infer<typeof allergyFormSchema>;

// Mock Initial Profiles
const MOCK_ALLERGY_PROFILES: StudentAllergyProfile[] = [
  {
    id: 'alg-01',
    studentId: 'stu-01',
    studentName: 'Trần Gia Bảo',
    studentCode: 'KID-2024-001',
    className: 'Mầm 1',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    category: 'FOOD',
    allergyTags: ['peanuts', 'lạc', 'hạt điều'],
    severity: 'SEVERE_ANAPHYLAXIS',
    firstAidProtocol: 'Tiêm bắp ngay EpiPen 0.15mg vào mặt ngoài đùi, cho bé nằm ngửa nâng cao chân và gọi ngay cấp cứu 115.',
    medicationLocation: 'Hộp y tế cấp cứu đỏ - Ngăn 1 tủ thuốc y tế trung tâm',
    doctorCertificateUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    parentPhone: '0912345678',
    activatedAt: '2026-09-05',
    lastReviewedAt: '2026-10-01',
    notes: 'Bé từng bị sưng phù thanh quản năm 2 tuổi sau khi ăn kẹo bơ đậu phộng.',
  },
  {
    id: 'alg-02',
    studentId: 'stu-02',
    studentName: 'Lê Minh Anh',
    studentCode: 'KID-2024-002',
    className: 'Nhà trẻ 1',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
    category: 'FOOD',
    allergyTags: ['seafood', 'tôm', 'cua'],
    severity: 'MILD_MODERATE',
    firstAidProtocol: 'Rửa sạch khoang miệng, theo dõi mề đay, uống 1 gói dung dịch kháng histamin nếu nổi mẩn nhiều.',
    medicationLocation: 'Ngăn thuốc lớp Nhà trẻ 1',
    doctorCertificateUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    parentPhone: '0987654321',
    activatedAt: '2026-09-10',
    lastReviewedAt: '2026-10-02',
    notes: 'Bếp cần nấu riêng cháo thịt nạc những ngày thực đơn toàn trường ăn cháo tôm/chả cua.',
  },
  {
    id: 'alg-03',
    studentId: 'stu-04',
    studentName: 'Phạm Hoàng Yến',
    studentCode: 'KID-2024-004',
    className: 'Lá 1',
    avatarUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&auto=format&fit=crop&q=80',
    category: 'MEDICATION',
    allergyTags: ['penicillin', 'amoxicillin'],
    severity: 'SEVERE_ANAPHYLAXIS',
    firstAidProtocol: 'Tuyệt đối không cấp thuốc nhóm beta-lactam. Nếu nghi nhiễm khuẩn cần chuyển viện nhi đồng.',
    medicationLocation: 'Sổ bệnh án điện tử học đường',
    doctorCertificateUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    isActive: true,
    parentPhone: '0934567890',
    activatedAt: '2026-08-20',
    lastReviewedAt: '2026-09-15',
    notes: 'Bệnh viện Nhi Đồng 1 xác nhận tiền sử sốc phản vệ độ 2.',
  },
];

export const AllergyCommandCenterTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StudentAllergyProfile | null>(null);
  const [dismissingProfile, setDismissingProfile] = useState<StudentAllergyProfile | null>(null);
  const [dismissReason, setDismissReason] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Fetch Allergy Profiles
  const { data: allergyProfiles = MOCK_ALLERGY_PROFILES, isLoading, refetch } = useQuery({
    queryKey: ['by-allergy', categoryFilter, severityFilter],
    queryFn: async () => {
      try {
        const res = await academicApi.getAllergyAlerts({
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        });
        return (res.data && res.data.length > 0) ? res.data : MOCK_ALLERGY_PROFILES;
      } catch {
        return MOCK_ALLERGY_PROFILES;
      }
    },
  });

  // Query All Students for selection
  const { data: studentsList = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const res = await academicApi.getStudents();
        return res.data || [];
      } catch {
        return [
          { id: 'stu-01', fullName: 'Trần Gia Bảo', className: 'Mầm 1' },
          { id: 'stu-02', fullName: 'Lê Minh Anh', className: 'Nhà trẻ 1' },
          { id: 'stu-03', fullName: 'Nguyễn Đăng Khoa', className: 'Chồi 2' },
          { id: 'stu-04', fullName: 'Phạm Hoàng Yến', className: 'Lá 1' },
          { id: 'stu-05', fullName: 'Vũ Hoàng Quân', className: 'Mầm 2' },
        ];
      }
    },
  });

  // React Hook Form for Allergy Alert
  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<AllergyFormData>({
    resolver: zodResolver(allergyFormSchema),
    defaultValues: {
      studentId: '',
      category: 'FOOD',
      allergyTags: '',
      severity: 'SEVERE_ANAPHYLAXIS',
      emergencyProtocol: '',
      medicationLocation: '',
      doctorCertificateUrl: '',
      notes: '',
    },
  });

  const watchedSeverity = watch('severity');

  // Mutation to Save / Update Allergy Alert
  const updateAllergyMutation = useMutation({
    mutationFn: async (data: AllergyFormData) => {
      const payload: UpdateAllergyPayload = {
        category: data.category,
        allergyTags: data.allergyTags,
        severity: data.severity,
        firstAidProtocol: data.emergencyProtocol || '',
        medicationLocation: data.medicationLocation,
        doctorCertificateUrl: data.doctorCertificateUrl,
        notes: data.notes,
      };
      return await academicApi.updateStudentAllergyAlert(data.studentId, payload);
    },
    onSuccess: () => {
      setToastMessage({
        type: 'success',
        text: `MSG-220: ${MSG_220}`,
      });
      // System-wide Invalidations: attendance, kitchen, health, student list!
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['by-allergy'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setIsModalOpen(false);
      setEditingProfile(null);
      reset();
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
      setTimeout(() => setToastMessage(null), 5000);
    },
  });

  // Handle Form Submit with Duplicate Allergen Check (MSG-222)
  const onSubmit = (formData: AllergyFormData) => {
    // Duplicate allergen check
    const existingProfile = allergyProfiles.find(
      (p) => p.studentId === formData.studentId && p.id !== editingProfile?.id
    );
    if (existingProfile) {
      const newTags = formData.allergyTags.split(',').map((t) => t.trim().toLowerCase());
      const hasDuplicate = newTags.some((tag) =>
        existingProfile.allergyTags.some((ex) => ex.toLowerCase() === tag)
      );
      if (hasDuplicate) {
        setToastMessage({
          type: 'warning',
          text: `MSG-222: ${MSG_222}`,
        });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
    }

    updateAllergyMutation.mutate(formData);
  };

  // Mutation to Dismiss Allergy Alert (with Doctor Certificate)
  const dismissMutation = useMutation({
    mutationFn: async ({ studentId, reason }: { studentId: string; reason: string }) => {
      return await academicApi.dismissAllergyAlert(studentId, {
        doctorCertificateUrl: 'https://storage.kidpro.vn/medical-certs/discharge-test.pdf',
        reason,
      });
    },
    onSuccess: () => {
      setToastMessage({
        type: 'success',
        text: 'Đã hủy huy hiệu cảnh báo dị ứng theo chỉ định y khoa thành công.',
      });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['by-allergy'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setDismissingProfile(null);
      setDismissReason('');
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // Filter List
  const filteredProfiles = allergyProfiles.filter((item) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.allergyTags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchSeverity = severityFilter === 'ALL' || item.severity === severityFilter;

    return matchSearch && matchCategory && matchSeverity;
  });

  // Stats
  const totalAllergies = allergyProfiles.length;
  const severeCount = allergyProfiles.filter((p) => p.severity === 'SEVERE_ANAPHYLAXIS').length;
  const mildCount = allergyProfiles.filter((p) => p.severity === 'MILD_MODERATE').length;
  const foodCount = allergyProfiles.filter((p) => p.category === 'FOOD').length;

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
            {toastMessage.type === 'error' && <ShieldAlert className="h-5 w-5 text-rose-600" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
            <span>Trung Tâm Quản Lý Dị Ứng Học Đường (UC-053)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Phát sóng huy hiệu khiên đỏ cảnh báo dị ứng tới Sổ điểm danh, Bếp ăn và Hồ sơ y tế theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditingProfile(null);
              reset({
                studentId: '',
                category: 'FOOD',
                allergyTags: '',
                severity: 'SEVERE_ANAPHYLAXIS',
                emergencyProtocol: '',
                medicationLocation: '',
                doctorCertificateUrl: '',
                notes: '',
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-semibold text-sm shadow-sm transition min-h-[44px] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Cảnh Báo Dị Ứng Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Bé Dị Ứng</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalAllergies} học sinh</span>
            <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
              Kích hoạt toàn trường
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>Sốc Phản Vệ Nặng</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600">{severeCount} ca</span>
            <span className="text-xs text-rose-600 font-semibold">Cần EpiPen sẵn sàng</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Dị Ứng Nhẹ / Mề Đay</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">{mildCount} ca</span>
            <span className="text-xs text-amber-600/80 font-medium">Theo dõi thực đơn</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
          <div className="text-xs font-semibold text-[#275A4E] uppercase tracking-wider flex items-center gap-1.5">
            <UtensilsCrossed className="h-4 w-4 text-[#275A4E]" />
            <span>Đồng Bộ Bếp Ăn (08:30)</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#275A4E]">{foodCount} suất cách ly</span>
            <span className="text-xs text-emerald-600 font-medium">Khay ăn riêng biệt</span>
          </div>
        </div>
      </div>

      {/* Synchronized Notice Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Đồng bộ tự động thời gian thực:</strong> Mọi thẻ dị ứng kích hoạt tại đây sẽ tự động hiển thị biểu tượng khiên đỏ <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">🛡️ DỊ ỨNG</span> cạnh tên bé trên màn hình Điểm danh giáo viên, Bảng điều khiển nhà bếp và Hồ sơ y tế.
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã số, dị nguyên (lạc, tôm, penicillin)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#275A4E]"
          >
            <option value="ALL">Tất cả nhóm dị ứng</option>
            <option value="FOOD">Thực phẩm (Hải sản, đậu phộng, trứng, sữa)</option>
            <option value="MEDICATION">Thuốc / Dược phẩm (Kháng sinh Penicillin)</option>
            <option value="ENVIRONMENT">Môi trường / Nọc côn trùng</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#275A4E]"
          >
            <option value="ALL">Tất cả mức độ nguy hiểm</option>
            <option value="SEVERE_ANAPHYLAXIS">Sốc phản vệ nặng (Cần cấp cứu)</option>
            <option value="MILD_MODERATE">Dị ứng nhẹ / Tiêu hóa</option>
          </select>
        </div>
      </div>

      {/* Allergy Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-600" />
            <span>Danh Sách Học Sinh Có Cảnh Báo Dị Ứng Toàn Trường ({filteredProfiles.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Đang tải hồ sơ dị ứng...</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldAlert className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Không tìm thấy hồ sơ dị ứng phù hợp bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Học Sinh & Lớp</th>
                  <th className="py-3.5 px-4">Huy Hiệu Toàn Hệ Thống</th>
                  <th className="py-3.5 px-4">Nhóm & Dị Nguyên</th>
                  <th className="py-3.5 px-4">Mức Độ Nguy Hiểm</th>
                  <th className="py-3.5 px-4">Phác Đồ & Vị Trí Thuốc</th>
                  <th className="py-3.5 px-4">Giấy Xác Nhận</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((item) => {
                  const isSevere = item.severity === 'SEVERE_ANAPHYLAXIS';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Học sinh & Lớp */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                            alt={item.studentName}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800">{item.studentName}</div>
                            <div className="text-xs text-slate-500">
                              {item.className} • {item.studentCode}
                            </div>
                            <a
                              href={`tel:${item.parentPhone || '0912345678'}`}
                              className="text-[11px] text-[#275A4E] hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <PhoneCall className="h-3 w-3" />
                              <span>{item.parentPhone || 'Chưa cập nhật SĐT'}</span>
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Huy Hiệu Toàn Hệ Thống */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <AllergyShieldBadge
                          studentName={item.studentName}
                          allergyTags={item.allergyTags}
                          severity={item.severity}
                          firstAidProtocol={item.firstAidProtocol}
                          medicationLocation={item.medicationLocation}
                          parentPhone={item.parentPhone}
                        />
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          <span>ACTIVE: Phát sóng toàn trường</span>
                        </div>
                      </td>

                      {/* Nhóm & Dị Nguyên */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                          {item.category === 'FOOD' && <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600" />}
                          {item.category === 'MEDICATION' && <Pill className="h-3.5 w-3.5 text-rose-600" />}
                          <span>
                            {item.category === 'FOOD'
                              ? 'Thực phẩm'
                              : item.category === 'MEDICATION'
                              ? 'Dược phẩm/Thuốc'
                              : 'Môi trường'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.allergyTags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Mức độ */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isSevere
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>{isSevere ? 'Sốc phản vệ nặng' : 'Dị ứng nhẹ / Mề đay'}</span>
                        </span>
                      </td>

                      {/* Phác đồ & Vị trí thuốc */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 font-medium line-clamp-2">
                          {item.firstAidProtocol || 'Chưa ghi nhận phác đồ'}
                        </div>
                        {item.medicationLocation && (
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <span className="font-semibold text-slate-700">Vị trí thuốc:</span>
                            <span>{item.medicationLocation}</span>
                          </div>
                        )}
                      </td>

                      {/* Giấy xác nhận y tế */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.doctorCertificateUrl ? (
                          <a
                            href={item.doctorCertificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Bệnh viện xác nhận</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa đính kèm</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProfile(item);
                              reset({
                                studentId: item.studentId,
                                category: (['FOOD', 'MEDICATION', 'ENVIRONMENT'].includes(item.category)
                                  ? item.category
                                  : 'FOOD') as 'FOOD' | 'MEDICATION' | 'ENVIRONMENT',
                                allergyTags: item.allergyTags.join(', '),
                                severity: item.severity,
                                emergencyProtocol: item.firstAidProtocol || '',
                                medicationLocation: item.medicationLocation || '',
                                doctorCertificateUrl: item.doctorCertificateUrl || '',
                                notes: item.notes || '',
                              });
                              setIsModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            Cập nhật
                          </button>
                          <button
                            onClick={() => setDismissingProfile(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
                          >
                            Hủy cảnh báo
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

      {/* ================= MODAL THÊM / CẬP NHẬT CẢNH BÁO DỊ ỨNG (UC-053) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="h-6 w-6 text-rose-200" />
                <div>
                  <h3 className="text-lg font-bold">
                    {editingProfile ? 'Cập Nhật Hồ Sơ Dị Ứng' : 'Kích Hoạt Cảnh Báo Dị Ứng Toàn Hệ Thống'}
                  </h3>
                  <p className="text-xs text-white/80">
                    Phát sóng huy hiệu chiếc khiên đỏ tới Điểm danh, Bếp ăn và Y tế học đường
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProfile(null);
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Chọn học sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  1. Chọn Học Sinh Cần Gắn Cảnh Báo <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('studentId')}
                  disabled={Boolean(editingProfile)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 bg-white"
                >
                  <option value="">-- Chọn học sinh từ danh sách --</option>
                  {(studentsList as { id: string; fullName: string; className?: string }[]).map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.fullName} ({stu.className || 'Toàn trường'})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.studentId.message}</p>
                )}
              </div>

              {/* Nhóm dị nguyên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  2. Nhóm Dị Nguyên <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 bg-white"
                >
                  <option value="FOOD">Thực phẩm (Hải sản, tôm cua, đậu phộng, trứng gà, sữa bò)</option>
                  <option value="MEDICATION">Dược phẩm / Thuốc (Kháng sinh Penicillin, Aspirin)</option>
                  <option value="ENVIRONMENT">Môi trường / Côn trùng (Nọc ong, phấn hoa, mủ cao su)</option>
                </select>
              </div>

              {/* Thẻ dị ứng cụ thể */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  3. Dị Nguyên Cụ Thể (Phân cách bởi dấu phẩy) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('allergyTags')}
                  placeholder="vd: peanuts, tôm cua, penicillin, sữa bò tươi"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nhập các từ khóa giúp phân hệ Bếp ăn tự động cách ly thực đơn hàng ngày.
                </p>
                {errors.allergyTags && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.allergyTags.message}</p>
                )}
              </div>

              {/* Mức độ nghiêm trọng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Mức Độ Nghiêm Trọng Của Dị Ứng <span className="text-rose-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="severity"
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                          field.value === 'SEVERE_ANAPHYLAXIS'
                            ? 'ring-2 ring-rose-500 bg-rose-50/70 border-rose-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          value="SEVERE_ANAPHYLAXIS"
                          checked={field.value === 'SEVERE_ANAPHYLAXIS'}
                          onChange={() => field.onChange('SEVERE_ANAPHYLAXIS')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-rose-700">Sốc Phản Vệ Nặng</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Nguy hiểm tính mạng, co thắt khí quản, cần cấp cứu ngay
                          </div>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border cursor-pointer flex items-start gap-2.5 transition ${
                          field.value === 'MILD_MODERATE'
                            ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          value="MILD_MODERATE"
                          checked={field.value === 'MILD_MODERATE'}
                          onChange={() => field.onChange('MILD_MODERATE')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-amber-700">Dị Ứng Nhẹ / Tiêu Hóa</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Mề đay, mẩn ngứa da, nôn trớ tiêu chảy nhẹ
                          </div>
                        </div>
                      </label>
                    </div>
                  )}
                />
              </div>

              {/* Phác đồ sơ cứu & Vị trí thuốc (Bắt buộc nếu Sốc phản vệ nặng - MSG-221) */}
              <div
                className={`p-3.5 rounded-xl border space-y-3 ${
                  watchedSeverity === 'SEVERE_ANAPHYLAXIS'
                    ? 'bg-rose-50/50 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-rose-600" />
                  <span>
                    Phác Đồ Sơ Cứu Khẩn Cấp & Vị Trí Thuốc
                    {watchedSeverity === 'SEVERE_ANAPHYLAXIS' && (
                      <span className="text-rose-600 ml-1 font-bold">(BẮT BUỘC - MSG-221)</span>
                    )}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Phác đồ sơ cứu khẩn cấp:
                  </label>
                  <textarea
                    rows={2}
                    {...register('emergencyProtocol')}
                    placeholder="vd: Tiêm EpiPen ngay vào mặt ngoài đùi khi bé khó thở, gọi cấp cứu 115..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-rose-500 bg-white"
                  />
                  {errors.emergencyProtocol && (
                    <p className="text-xs text-rose-600 mt-0.5 font-medium">
                      {errors.emergencyProtocol.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Vị trí lưu trữ thuốc cấp cứu tại trường:
                  </label>
                  <input
                    type="text"
                    {...register('medicationLocation')}
                    placeholder="vd: Ngăn 1 tủ thuốc y tế trung tâm, phòng y tế tầng 1"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-rose-500 bg-white"
                  />
                  {errors.medicationLocation && (
                    <p className="text-xs text-rose-600 mt-0.5 font-medium">
                      {errors.medicationLocation.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Tải lên kết quả xét nghiệm / Giấy chứng nhận */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đính Kèm Giấy Chứng Nhận Y Tế / Kết Quả Xét Nghiệm Dị Ứng
                </label>
                <div className="p-3 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                  <Upload className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs text-slate-600 font-medium">
                    Tải lên file ảnh kết quả xét nghiệm (JPG, PNG, PDF &lt; 10MB)
                  </span>
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ghi Chú Thêm Cho Giáo Viên & Bếp
                </label>
                <input
                  type="text"
                  {...register('notes')}
                  placeholder="Ghi chú chế độ nấu nướng riêng, biểu hiện nhận biết sớm..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProfile(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 min-h-[44px]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateAllergyMutation.isPending}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-md transition flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {updateAllergyMutation.isPending ? (
                    <span>Đang phát sóng toàn trường...</span>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4" />
                      <span>Kích Hoạt Huy Hiệu Cảnh Báo Toàn Hệ Thống</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL HỦY CẢNH BÁO THEO CHỈ ĐỊNH BÁC SĨ ================= */}
      {dismissingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold">Hủy Cảnh Báo Dị Ứng Học Sinh</h3>
              </div>
              <button onClick={() => setDismissingProfile(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Quy trình an toàn: Chỉ được phép gỡ bỏ huy hiệu khi có kết quả thử nghiệm dung nạp thực phẩm mới nhất do bác sĩ chuyên khoa ký duyệt.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div>
                Học sinh: <span className="font-bold text-slate-800">{dismissingProfile.studentName}</span>
              </div>
              <div>
                Dị nguyên đang cảnh báo:{' '}
                <span className="font-bold text-rose-700">{dismissingProfile.allergyTags.join(', ')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Lý Do Hủy & Số Hồ Sơ Y Khoa Của Bác Sĩ <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Nhập kết quả xét nghiệm dung nạp âm tính và họ tên bác sĩ chỉ định..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#275A4E]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setDismissingProfile(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                disabled={!dismissReason.trim() || dismissMutation.isPending}
                onClick={() => {
                  dismissMutation.mutate({
                    studentId: dismissingProfile.studentId,
                    reason: dismissReason,
                  });
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
              >
                {dismissMutation.isPending ? 'Đang cập nhật...' : 'Xác Nhận Hủy Cảnh Báo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllergyCommandCenterTab;
