import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  HeartPulse,
  AlertTriangle,
  Flame,
  PhoneCall,
  Clock,
  Plus,
  CheckCircle2,
  X,
  Ambulance,
  Home,
  Bed,
  Check,
  Search,
  RefreshCw,
  Send,
  Lock,
  Thermometer
} from 'lucide-react';
import { healthApi } from '../../../api/healthApi';
import { academicApi } from '../../../api/academicApi';
import {
  MedicalIncidentRecord,
  MedicalIncidentCategory,
  IncidentActionPlan,
} from '../../../types/health.types';
import { AllergyShieldBadge } from '../../../components/common/AllergyShieldBadge';

// System Messages
const MSG_216 = 'Đã lưu sự vụ sức khỏe và thông báo cho phụ huynh';
const MSG_217 = 'Phụ huynh từ chối cam kết cho trẻ dùng thuốc tại trường. Chỉ được áp dụng các biện pháp sơ cứu vật lý (chườm mát).';
const MSG_218 = 'Cảnh báo Sốt Cao Kịch Phát: Bắt buộc liên hệ phụ huynh đón trẻ đi khám cơ sở y tế ngay.';
const MSG_219 = 'Ghi chép triệu chứng lâm sàng và biện pháp sơ cấp cứu là thông tin pháp lý bắt buộc (tối thiểu 10 ký tự).';

// Schema Validation (Client-side)
const incidentFormSchema = z.object({
  studentId: z.string().min(1, 'Vui lòng chọn học sinh'),
  category: z.enum([
    'FEVER',
    'SCRATCH_FALL',
    'NOSEBLEED',
    'VOMITING',
    'ALLERGIC_REACTION',
    'STOMACH_ACHE',
    'OTHER',
  ] as const),
  temperatureCelsius: z
    .number()
    .min(34.0, 'Thân nhiệt tối thiểu 34°C')
    .max(43.0, 'Thân nhiệt tối đa 43°C'),
  symptomsDescription: z
    .string()
    .min(10, MSG_219),
  firstAidMeasures: z
    .array(z.string())
    .min(1, 'Vui lòng chọn ít nhất 1 biện pháp sơ cấp cứu ban đầu'),
  customFirstAidNotes: z.string().optional(),
  actionPlan: z.enum([
    'RETURN_TO_CLASS',
    'REST_IN_INFIRMARY',
    'PARENT_EARLY_PICKUP',
    'HOSPITAL_EMERGENCY_115',
  ] as const),
  notes: z.string().optional(),
});

type IncidentFormData = z.infer<typeof incidentFormSchema>;

// Mock Presets for First Aid
const FIRST_AID_OPTIONS = [
  { id: 'saline_clean', label: 'Sát trùng vết thương bằng nước muối sinh lý NaCl 0.9%' },
  { id: 'physical_cool', label: 'Chườm mát / lau ấm trán, nách và bẹn hạ sốt' },
  { id: 'rest_bed', label: 'Nằm nghỉ ngơi cố định tại giường phòng y tế' },
  { id: 'hydration_oresol', label: 'Uống nước ấm / Oresol bù điện giải từng ngụm nhỏ' },
  { id: 'pressure_bandage', label: 'Băng ép vô trùng / kẹp cánh mũi cầm máu cam' },
  {
    id: 'fever_medicine',
    label: 'Uống thuốc hạ sốt Paracetamol (10-15mg/kg)',
    isMedication: true,
  },
];

const MOCK_STUDENTS: any[] = [];

export const MedicalIncidentsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [actionPlanFilter, setActionPlanFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncidentForUpdate, setSelectedIncidentForUpdate] = useState<MedicalIncidentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Fetch Incidents
  const { data: incidentList = [], isLoading, refetch } = useQuery({
    queryKey: ['medical-incidents', categoryFilter, actionPlanFilter],
    queryFn: async () => {
      try {
        const res = await healthApi.getMedicalIncidents({
          category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
          actionPlan: actionPlanFilter !== 'ALL' ? actionPlanFilter : undefined,
        });
        return (res as unknown as MedicalIncidentRecord[]) || [];
      } catch {
        return [];
      }
    },
  });

  // Query Students List
  const { data: studentsList = [] } = useQuery({
    queryKey: ['academic-students-list'],
    queryFn: async () => {
      try {
        const res = await academicApi.getStudents();
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        return list;
      } catch {
        return [];
      }
    },
  });

  // React Hook Form for Medical Incident
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IncidentFormData>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      studentId: '',
      category: 'FEVER',
      temperatureCelsius: 37.5,
      symptomsDescription: '',
      firstAidMeasures: ['Chườm mát / lau ấm trán, nách và bẹn hạ sốt'],
      customFirstAidNotes: '',
      actionPlan: 'REST_IN_INFIRMARY',
      notes: '',
    },
  });

  const selectedStudentId = watch('studentId');
  const watchedTemp = watch('temperatureCelsius');
  const watchedFirstAid = watch('firstAidMeasures') || [];

  // Find Selected Student Info
  const selectedStudent = (studentsList as typeof MOCK_STUDENTS).find((s) => s.id === selectedStudentId);

  // Mutation to Create Incident
  const createIncidentMutation = useMutation({
    mutationFn: async (formData: IncidentFormData) => {
      const payload = {
        studentId: formData.studentId,
        category: formData.category,
        temperatureCelsius: formData.temperatureCelsius,
        symptomsDescription: formData.symptomsDescription,
        firstAidMeasures: [
          ...formData.firstAidMeasures,
          ...(formData.customFirstAidNotes ? [formData.customFirstAidNotes] : []),
        ],
        actionPlan: formData.actionPlan,
        notes: formData.notes,
      };
      return await healthApi.createMedicalIncident(payload);
    },
    onSuccess: () => {
      setToastMessage({
        type: 'success',
        text: `MSG-216: ${MSG_216}`,
      });
      queryClient.invalidateQueries({ queryKey: ['medical-incidents'] });
      setIsModalOpen(false);
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

  // Handle Form Submission
  const onFormSubmit = (data: IncidentFormData) => {
    // Check if fever medicine selected but no parental consent (BR-054)
    if (selectedStudent && !selectedStudent.medicalConsentAgreed) {
      const hasMed = data.firstAidMeasures.some((m) => m.includes('thuốc'));
      if (hasMed) {
        setToastMessage({
          type: 'warning',
          text: `MSG-217: ${MSG_217}`,
        });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
    }

    createIncidentMutation.mutate(data);
  };

  // Filtered List
  const filteredIncidents = (incidentList as MedicalIncidentRecord[]).filter((item: MedicalIncidentRecord) => {
    const matchSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.incidentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Calculate Statistics
  const totalToday = incidentList.length;
  const highFeverCount = (incidentList as MedicalIncidentRecord[]).filter((i: MedicalIncidentRecord) => i.isHighFever).length;
  const extremeFeverCount = (incidentList as MedicalIncidentRecord[]).filter((i: MedicalIncidentRecord) => i.isExtremeFever).length;
  const emergencyPickups = (incidentList as MedicalIncidentRecord[]).filter(
    (i: MedicalIncidentRecord) => i.actionPlan === 'PARENT_EARLY_PICKUP' || i.actionPlan === 'HOSPITAL_EMERGENCY_115'
  ).length;

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
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
            {toastMessage.type === 'error' && <Flame className="h-5 w-5 text-rose-600" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header & KPI Summary Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2">
            <HeartPulse className="h-6 w-6 text-[#275A4E]" />
            <span>Nhật Ký Sự Vụ Y Tế Học Đường (UC-052)</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận thân nhiệt, sơ cấp cứu ban đầu, đối chiếu cam kết y tế & tự động phát thông báo đẩy khẩn cấp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Làm mới danh sách"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-semibold text-sm shadow-sm transition min-h-[44px] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi Nhận Sự Vụ Y Tế Mới</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sự Vụ Hôm Nay</div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-800">{totalToday} ca</span>
            <span className="text-xs text-slate-400 font-medium">Toàn trường</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-xs">
          <div className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5" />
            <span>Sốt Cao ({'>'}38.5°C)</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600">{highFeverCount} ca</span>
            {extremeFeverCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                {extremeFeverCount} ca kịch phát
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <Ambulance className="h-3.5 w-3.5" />
            <span>Đón Sớm / Chuyển Viện</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600">{emergencyPickups} ca</span>
            <span className="text-xs text-amber-600/70 font-medium">Cần hỗ trợ</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs">
          <div className="text-xs font-semibold text-[#275A4E] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>Đã Xử Lý Ổn Định</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[#275A4E]">
              {(incidentList as MedicalIncidentRecord[]).filter((i: MedicalIncidentRecord) => i.actionPlan === 'RETURN_TO_CLASS').length} ca
            </span>
            <span className="text-xs text-[#275A4E]/70 font-medium">Trở lại lớp</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên bé, mã sự vụ, lớp học..."
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
            <option value="ALL">Tất cả nhóm sự vụ</option>
            <option value="FEVER">Sốt cao</option>
            <option value="SCRATCH_FALL">Trầy xước / Ngã</option>
            <option value="NOSEBLEED">Chảy máu cam</option>
            <option value="VOMITING">Nôn trớ / Tiêu hóa</option>
            <option value="ALLERGIC_REACTION">Dị ứng</option>
            <option value="STOMACH_ACHE">Đau bụng</option>
            <option value="OTHER">Khác</option>
          </select>

          <select
            value={actionPlanFilter}
            onChange={(e) => setActionPlanFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#275A4E]"
          >
            <option value="ALL">Tất cả hướng xử lý</option>
            <option value="RETURN_TO_CLASS">Bé ổn định, trở lại lớp</option>
            <option value="REST_IN_INFIRMARY">Nằm phòng y tế</option>
            <option value="PARENT_EARLY_PICKUP">Phụ huynh đón sớm</option>
            <option value="HOSPITAL_EMERGENCY_115">Cấp cứu 115</option>
          </select>
        </div>
      </div>

      {/* Incident Records Table / Cards */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#275A4E]" />
            <span>Dòng Thời Gian Sự Vụ Y Tế Hôm Nay ({filteredIncidents.length})</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Đang tải dữ liệu sự vụ y tế...</div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center">
            <HeartPulse className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">Không có sự vụ y tế nào trong ngày</p>
            <p className="text-xs text-slate-400 mt-1">Các bé trong trường hiện đều có thể trạng ổn định và an toàn.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3.5 px-4">Thời Gian & Mã</th>
                  <th className="py-3.5 px-4">Học Sinh</th>
                  <th className="py-3.5 px-4">Nhóm Sự Vụ</th>
                  <th className="py-3.5 px-4">Thân Nhiệt</th>
                  <th className="py-3.5 px-4">Biện Pháp Sơ Cứu</th>
                  <th className="py-3.5 px-4">Hướng Xử Lý</th>
                  <th className="py-3.5 px-4">Thông Báo PH</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncidents.map((incident: MedicalIncidentRecord) => {
                  const isExtreme = incident.temperatureCelsius > 39.5;
                  const isHigh = incident.temperatureCelsius > 38.5;

                  return (
                    <tr key={incident.id} className="hover:bg-slate-50/70 transition">
                      {/* Thời Gian & Mã */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{incident.recordedAt.split(' ')[1] || incident.recordedAt}</span>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{incident.incidentCode}</div>
                      </td>

                      {/* Học Sinh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={incident.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                            alt={incident.studentName}
                            className="h-10 w-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                              <span>{incident.studentName}</span>
                              {incident.allergyTags && incident.allergyTags.length > 0 && (
                                <AllergyShieldBadge
                                  studentName={incident.studentName}
                                  allergyTags={incident.allergyTags}
                                  severity="SEVERE_ANAPHYLAXIS"
                                  parentPhone={incident.parentEmergencyPhone}
                                />
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {incident.className} • {incident.studentCode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Nhóm sự vụ */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            incident.category === 'FEVER'
                              ? 'bg-rose-100 text-rose-700'
                              : incident.category === 'ALLERGIC_REACTION'
                              ? 'bg-amber-100 text-amber-800'
                              : incident.category === 'SCRATCH_FALL'
                              ? 'bg-blue-100 text-blue-700'
                              : incident.category === 'NOSEBLEED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {incident.categoryLabel || incident.category}
                        </span>
                      </td>

                      {/* Thân nhiệt */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className={`h-4 w-4 ${isHigh ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span
                            className={`font-bold text-sm ${
                              isExtreme
                                ? 'text-rose-600 animate-pulse'
                                : isHigh
                                ? 'text-rose-500'
                                : 'text-slate-700'
                            }`}
                          >
                            {incident.temperatureCelsius}°C
                          </span>
                        </div>
                        {isExtreme && (
                          <div className="text-[11px] font-bold text-rose-600 mt-0.5">
                            Sốt kịch phát!
                          </div>
                        )}
                      </td>

                      {/* Biện pháp sơ cứu */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="text-xs text-slate-700 line-clamp-2">
                          {incident.firstAidMeasures.join('; ')}
                        </div>
                        {incident.medicationGiven && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Đã cấp thuốc hạ sốt
                          </span>
                        )}
                      </td>

                      {/* Hướng xử lý */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            incident.actionPlan === 'RETURN_TO_CLASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : incident.actionPlan === 'REST_IN_INFIRMARY'
                              ? 'bg-blue-100 text-blue-800'
                              : incident.actionPlan === 'PARENT_EARLY_PICKUP'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {incident.actionPlan === 'RETURN_TO_CLASS' && <Check className="h-3.5 w-3.5" />}
                          {incident.actionPlan === 'REST_IN_INFIRMARY' && <Bed className="h-3.5 w-3.5" />}
                          {incident.actionPlan === 'PARENT_EARLY_PICKUP' && <Home className="h-3.5 w-3.5" />}
                          {incident.actionPlan === 'HOSPITAL_EMERGENCY_115' && <Ambulance className="h-3.5 w-3.5" />}
                          <span>{incident.actionPlanLabel}</span>
                        </span>
                      </td>

                      {/* Trạng thái Thông báo PH */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Đã gửi FCM</span>
                        </div>
                        <a
                          href={`tel:${incident.parentEmergencyPhone}`}
                          className="text-[11px] text-[#275A4E] hover:underline flex items-center gap-1 mt-0.5 font-medium"
                        >
                          <PhoneCall className="h-3 w-3" />
                          <span>{incident.parentEmergencyPhone}</span>
                        </a>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedIncidentForUpdate(incident)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          Diễn biến
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL GHI NHẬN SỰ VỤ Y TẾ MỚI (UC-052) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#275A4E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartPulse className="h-6 w-6 text-[#78C2AD]" />
                <div>
                  <h3 className="text-lg font-bold">Ghi Nhận Sự Vụ Y Tế Mới</h3>
                  <p className="text-xs text-white/80">
                    Kích hoạt ghi nhận chỉ số sinh tồn và thông báo đẩy khẩn cấp
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* 1. Chọn học sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Chọn Học Sinh Gặp Sự Vụ <span className="text-rose-500">*</span>
                </label>
                <select
                  {...register('studentId')}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                >
                  <option value="">-- Chọn học sinh trong lớp --</option>
                  {(studentsList as typeof MOCK_STUDENTS).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.studentCode} - {s.className})
                    </option>
                  ))}
                </select>
                {errors.studentId && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{errors.studentId.message}</p>
                )}

                {/* Banner Thông Tin Bé & Cảnh Báo Dị Ứng / Cam Kết Y Tế */}
                {selectedStudent && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedStudent.avatarUrl}
                          alt={selectedStudent.fullName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-800">{selectedStudent.fullName}</div>
                          <div className="text-xs text-slate-500">
                            Phụ huynh: {selectedStudent.parentName}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`tel:${selectedStudent.parentEmergencyPhone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        <span>Gọi Ngay ({selectedStudent.parentEmergencyPhone})</span>
                      </a>
                    </div>

                    {/* Cảnh báo dị ứng tự động */}
                    {selectedStudent.allergyTags && selectedStudent.allergyTags.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                        <div className="text-xs text-rose-800">
                          <span className="font-bold">CẢNH BÁO DỊ ỨNG:</span> Bé có tiền sử dị ứng với{' '}
                          <span className="font-bold underline">{selectedStudent.allergyTags.join(', ')}</span>.
                          Tuyệt đối không để tiếp xúc với dị nguyên!
                        </div>
                      </div>
                    )}

                    {/* Kiểm tra Cam kết Y tế Phụ huynh (BR-054) */}
                    {!selectedStudent.medicalConsentAgreed ? (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                          <span className="font-bold">MSG-217 (BR-054):</span> {MSG_217}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Phụ huynh ĐÃ KÝ CAM KẾT cho phép cấp thuốc hạ sốt khi sốt cao khẩn cấp.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Nhóm sự vụ & Thân nhiệt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Nhóm Sự Vụ Y Tế <span className="text-rose-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                  >
                    <option value="FEVER">Sốt cao</option>
                    <option value="SCRATCH_FALL">Trầy xước / Té ngã</option>
                    <option value="NOSEBLEED">Chảy máu cam</option>
                    <option value="VOMITING">Nôn trớ / Rối loạn tiêu hóa</option>
                    <option value="ALLERGIC_REACTION">Dị ứng thuốc / Thức ăn</option>
                    <option value="STOMACH_ACHE">Đau bụng quằn quại</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thân Nhiệt Đo Thực Tế (°C) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      {...register('temperatureCelsius', { valueAsNumber: true })}
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                      placeholder="vd: 38.5"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                      °C
                    </span>
                  </div>
                  {errors.temperatureCelsius && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {errors.temperatureCelsius.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Cảnh báo Sốt Cao Kịch Phát MSG-218 */}
              {watchedTemp > 39.5 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-400 animate-pulse flex items-start gap-3">
                  <Flame className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-rose-700">
                      MSG-218: Cảnh báo Sốt Cao Kịch Phát ({watchedTemp}°C)
                    </div>
                    <p className="text-xs text-rose-600 mt-0.5">{MSG_218}</p>
                  </div>
                </div>
              )}

              {/* 3. Mô tả triệu chứng lâm sàng */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Triệu Chứng Lâm Sàng <span className="text-rose-500">*</span>
                  <span className="text-slate-400 font-normal lowercase ml-1">(tối thiểu 10 ký tự - MSG-219)</span>
                </label>
                <textarea
                  rows={3}
                  {...register('symptomsDescription')}
                  placeholder="Mô tả cụ thể biểu hiện của bé: Mắt lờ đờ, co giật nhẹ, phát ban đỏ, trầy xước kích thước..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
                {errors.symptomsDescription && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {errors.symptomsDescription.message}
                  </p>
                )}
              </div>

              {/* 4. Biện pháp sơ cấp cứu ban đầu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  4. Biện Pháp Sơ Cấp Cứu Đã Áp Dụng <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  {FIRST_AID_OPTIONS.map((opt) => {
                    const isMedDisabled =
                      opt.isMedication && selectedStudent && !selectedStudent.medicalConsentAgreed;

                    return (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                          isMedDisabled
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                            : 'bg-white border-slate-200 hover:bg-slate-50 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          value={opt.label}
                          disabled={Boolean(isMedDisabled)}
                          checked={watchedFirstAid.includes(opt.label)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('firstAidMeasures', [...watchedFirstAid, opt.label]);
                            } else {
                              setValue(
                                'firstAidMeasures',
                                watchedFirstAid.filter((item) => item !== opt.label)
                              );
                            }
                          }}
                          className="mt-0.5 rounded text-[#275A4E] focus:ring-[#275A4E]"
                        />
                        <div className="text-xs text-slate-700">
                          <span className="font-medium">{opt.label}</span>
                          {isMedDisabled && (
                            <span className="block text-[11px] text-amber-700 font-semibold mt-0.5">
                              [Bị khóa theo BR-054: Phụ huynh không đồng thuận dùng thuốc]
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.firstAidMeasures && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {errors.firstAidMeasures.message}
                  </p>
                )}
              </div>

              {/* 5. Hướng xử lý tiếp theo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  5. Hướng Xử Lý Tiếp Theo <span className="text-rose-500">*</span>
                </label>
                <Controller
                  control={control}
                  name="actionPlan"
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          id: 'RETURN_TO_CLASS',
                          label: 'Bé ổn định, trở lại lớp',
                          desc: 'Sơ cứu xong, bé tỉnh táo bình thường',
                          icon: Check,
                          color: 'text-emerald-700 border-emerald-200 bg-emerald-50/50',
                        },
                        {
                          id: 'REST_IN_INFIRMARY',
                          label: 'Nằm theo dõi tại phòng y tế',
                          desc: 'Cần nghỉ ngơi 30-60 phút theo dõi',
                          icon: Bed,
                          color: 'text-blue-700 border-blue-200 bg-blue-50/50',
                        },
                        {
                          id: 'PARENT_EARLY_PICKUP',
                          label: 'Liên hệ phụ huynh đón sớm',
                          desc: 'Sốt cao, nôn trớ, phụ huynh đưa đi khám',
                          icon: Home,
                          color: 'text-amber-700 border-amber-200 bg-amber-50/50',
                        },
                        {
                          id: 'HOSPITAL_EMERGENCY_115',
                          label: 'Cấp cứu 115 - Chuyển viện',
                          desc: 'Sốt co giật hoặc sốc phản vệ khẩn cấp',
                          icon: Ambulance,
                          color: 'text-rose-700 border-rose-300 bg-rose-50/60',
                        },
                      ].map((item) => (
                        <label
                          key={item.id}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                            field.value === item.id
                              ? `ring-2 ring-[#275A4E] ${item.color}`
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            value={item.id}
                            checked={field.value === item.id}
                            onChange={() => field.onChange(item.id)}
                            className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">{item.label}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Ghi chú thêm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Ghi Chú Thêm Của Cán Bộ Y Tế / Giáo Viên
                </label>
                <input
                  type="text"
                  {...register('notes')}
                  placeholder="Ghi chú người đưa bé vào phòng y tế, phụ huynh phản hồi..."
                  className="w-full px-4 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition min-h-[44px]"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || createIncidentMutation.isPending}
                  className="px-6 py-2.5 text-sm font-bold rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-md transition flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {createIncidentMutation.isPending ? (
                    <span>Đang phát thông báo khẩn cấp...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Lưu Hồ Sơ Y Tế & Phát Thông Báo Khẩn Cấp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CẬP NHẬT DIỄN BIẾN SỰ VỤ ================= */}
      {selectedIncidentForUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Cập Nhật Diễn Biến Sự Vụ ({selectedIncidentForUpdate.incidentCode})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedIncidentForUpdate.studentName} - {selectedIncidentForUpdate.className}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncidentForUpdate(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="text-xs text-slate-500">Triệu chứng ban đầu:</div>
                <div className="text-xs font-semibold text-slate-800">
                  {selectedIncidentForUpdate.symptomsDescription}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cập nhật Thân nhiệt (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={selectedIncidentForUpdate.temperatureCelsius}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#275A4E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Diễn biến sức khỏe sau xử lý
                </label>
                <textarea
                  rows={2}
                  defaultValue={selectedIncidentForUpdate.notes || ''}
                  placeholder="Ghi nhận: Bé đã hạ sốt, mẹ đã đến đón lúc 10:15..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#275A4E]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedIncidentForUpdate(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setToastMessage({
                    type: 'success',
                    text: 'Đã cập nhật diễn biến y tế cho học sinh thành công.',
                  });
                  setSelectedIncidentForUpdate(null);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#275A4E] text-white hover:bg-[#1E4D40]"
              >
                Lưu Diễn Biến
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalIncidentsTab;
