import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  RefreshCw,
  UserCheck,
  Calendar,
  School,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  XCircle,
  Baby,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { classService } from '../../../services/classService';
import { academicYearApi } from '../../../api/academicYearApi';
import { useToast } from '../../../contexts/ToastContext';
import {
  StudentItem,
  StudentDetail,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentStatus,
  GuardianInfo,
} from '../../../types/student.types';
import { GradeLevel, ClassSummary } from '../../../types/classAffairs.types';

// =========================================================================
// Hằng số nhãn & màu sắc
// =========================================================================

const GRADE_LABELS: Record<GradeLevel, string> = {
  INFANT: 'Nhà trẻ nhỏ (3 - 12 tháng)',
  TODDLER: 'Khối Nhà trẻ (12 - 36 tháng)',
  NURSERY: 'Khối Mầm (3 - 4 tuổi)',
  KINDERGARTEN: 'Khối Chồi (4 - 5 tuổi)',
  PRE_K: 'Khối Lá (5 - 6 tuổi)',
};

const STATUS_LABELS: Record<StudentStatus, { text: string; bg: string; textCol: string }> = {
  WAITING_PLACEMENT: {
    text: 'Chờ xếp lớp',
    bg: 'bg-amber-50 border-amber-200',
    textCol: 'text-amber-700',
  },
  ENROLLED: {
    text: 'Đang theo học',
    bg: 'bg-emerald-50 border-emerald-200',
    textCol: 'text-emerald-700',
  },
  ACTIVE: {
    text: 'Đang hoạt động',
    bg: 'bg-emerald-50 border-emerald-200',
    textCol: 'text-emerald-700',
  },
  STUDYING: {
    text: 'Đang học',
    bg: 'bg-emerald-50 border-emerald-200',
    textCol: 'text-emerald-700',
  },
  GRADUATED: {
    text: 'Đã tốt nghiệp (Ra trường)',
    bg: 'bg-purple-50 border-purple-200',
    textCol: 'text-purple-700',
  },
  TRANSFERRED: {
    text: 'Đã chuyển trường',
    bg: 'bg-sky-50 border-sky-200',
    textCol: 'text-sky-700',
  },
  WITHDRAWN: {
    text: 'Thôi học / Nghỉ học',
    bg: 'bg-rose-50 border-rose-200',
    textCol: 'text-rose-700',
  },
  INACTIVE: {
    text: 'Ngừng hoạt động',
    bg: 'bg-slate-100 border-slate-200',
    textCol: 'text-slate-600',
  },
  RESERVED: {
    text: 'Bảo lưu',
    bg: 'bg-orange-50 border-orange-200',
    textCol: 'text-orange-700',
  },
};

/**
 * Tính tuổi theo tháng giữa ngày sinh và ngày nhập học
 */
function calculateAgeInMonths(dobStr: string, admissionDateStr?: string): number {
  if (!dobStr) return 0;
  const dob = new Date(dobStr);
  const target = admissionDateStr ? new Date(admissionDateStr) : new Date();
  let months = (target.getFullYear() - dob.getFullYear()) * 12 + (target.getMonth() - dob.getMonth());
  if (target.getDate() < dob.getDate()) {
    months--;
  }
  return Math.max(0, months);
}

/**
 * Gợi ý khối lớp dựa trên số tháng tuổi (Quy tắc mầm non)
 */
function suggestGradeFromAge(months: number): GradeLevel | undefined {
  if (months >= 12 && months < 36) return 'TODDLER';
  if (months >= 36 && months < 48) return 'NURSERY';
  if (months >= 48 && months < 60) return 'KINDERGARTEN';
  if (months >= 60 && months <= 72) return 'PRE_K';
  return undefined;
}

export const StudentAdmissionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  // Filters state
  const [keyword, setKeyword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedYearId, setSelectedYearId] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<StudentDetail | null>(null);

  // =========================================================================
  // Queries
  // =========================================================================

  // Danh mục năm học
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years-list'],
    queryFn: () => academicYearApi.getAcademicYears(),
  });

  // Danh mục tất cả lớp học
  const { data: allClasses = [] } = useQuery<ClassSummary[]>({
    queryKey: ['academic-classes', selectedYearId],
    queryFn: async () => {
      const res = await classService.getClasses(
        selectedYearId !== 'ALL' ? { academicYearId: selectedYearId } : undefined
      );
      return res?.content || (Array.isArray(res) ? res : []);
    },
  });

  // Danh sách học sinh phân trang
  const {
    data: studentPageData,
    isLoading: isLoadingStudents,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: [
      'students-list',
      keyword,
      selectedGrade,
      selectedClassId,
      selectedStatus,
      selectedYearId,
      currentPage,
    ],
    queryFn: () =>
      studentService.getStudents({
        keyword: keyword.trim() || undefined,
        gradeLevel: selectedGrade !== 'ALL' ? selectedGrade : undefined,
        classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
        academicYearId: selectedYearId !== 'ALL' ? selectedYearId : undefined,
        page: currentPage,
        size: pageSize,
      }),
  });

  // Xem chi tiết học sinh
  const { data: viewingStudent, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['student-detail', viewingStudentId],
    queryFn: () => (viewingStudentId ? studentService.getStudentById(viewingStudentId) : null),
    enabled: !!viewingStudentId,
  });

  // =========================================================================
  // Form State: Tạo mới học sinh (G4-UC-01 & BR-011)
  // =========================================================================
  const defaultCreateForm: CreateStudentPayload = {
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    ethnicity: 'Kinh',
    address: '',
    admissionDate: new Date().toISOString().split('T')[0],
    gradeLevel: 'TODDLER',
    classId: '',
    academicYearId: '',
    notes: '',
    guardians: [
      {
        fullName: '',
        relationship: 'Bố',
        phoneNumber: '',
        email: '',
        isPrimary: true,
        isAllowedPickup: true,
      },
    ],
  };

  const [createForm, setCreateForm] = useState<CreateStudentPayload>(defaultCreateForm);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);

  // Tính tuổi cho form tạo mới
  const createAgeMonths = useMemo(() => {
    return calculateAgeInMonths(createForm.dateOfBirth, createForm.admissionDate);
  }, [createForm.dateOfBirth, createForm.admissionDate]);

  // Form State: Chỉnh sửa học sinh
  const [editForm, setEditForm] = useState<UpdateStudentPayload>({});

  // =========================================================================
  // Mutations
  // =========================================================================

  // Tiếp nhận tạo mới học sinh
  const createStudentMutation = useMutation({
    mutationFn: (payload: CreateStudentPayload) => studentService.createStudent(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'Tạo mới và cấp mã hồ sơ học sinh thành công.');
      setIsCreateModalOpen(false);
      setCreateForm(defaultCreateForm);
      setCreateStep(1);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-018' || msg?.includes('MSG-018') || msg?.includes('12') || msg?.includes('72')) {
        error('Độ tuổi của trẻ không thuộc phạm vi tiếp nhận mầm non (từ 12 đến 72 tháng tuổi).');
      } else {
        error(msg || 'Lỗi khi tiếp nhận tạo mới hồ sơ học sinh.');
      }
    },
  });

  // Cập nhật hồ sơ học sinh
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStudentPayload }) =>
      studentService.updateStudent(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      queryClient.invalidateQueries({ queryKey: ['student-detail', editingStudent?.studentId] });
      success(res?.message || 'Cập nhật hồ sơ học sinh thành công.');
      setEditingStudent(null);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-018' || msg?.includes('MSG-018')) {
        error('Độ tuổi của trẻ không thuộc phạm vi tiếp nhận mầm non (từ 12 đến 72 tháng tuổi).');
      } else {
        error(msg || 'Lỗi khi cập nhật hồ sơ học sinh.');
      }
    },
  });

  // Handler mở modal thêm mới
  const handleOpenCreateModal = () => {
    const activeYear = academicYears.find((y: any) => y.isActive) || academicYears[0];
    setCreateForm({
      ...defaultCreateForm,
      academicYearId: activeYear ? activeYear.id : '',
      admissionDate: new Date().toISOString().split('T')[0],
    });
    setCreateStep(1);
    setIsCreateModalOpen(true);
  };

  // Validate Step 1
  const handleNextStep1 = () => {
    if (!createForm.fullName.trim()) {
      error('Vui lòng nhập họ và tên của trẻ.');
      return;
    }
    if (!createForm.dateOfBirth) {
      error('Vui lòng chọn ngày tháng năm sinh của trẻ.');
      return;
    }
    // BR-011: Kiểm tra độ tuổi 12 - 72 tháng
    const months = calculateAgeInMonths(createForm.dateOfBirth, createForm.admissionDate);
    if (months < 12 || months > 72) {
      error('Độ tuổi của trẻ không thuộc phạm vi tiếp nhận mầm non (từ 12 đến 72 tháng tuổi). Hiện tại: ' + months + ' tháng.');
      return;
    }
    if (!createForm.address?.trim()) {
      error('Vui lòng nhập địa chỉ thường trú của trẻ.');
      return;
    }
    if (!createForm.academicYearId) {
      error('Vui lòng chọn niên khóa tiếp nhận.');
      return;
    }
    setCreateStep(2);
  };

  // Validate Step 2
  const handleNextStep2 = () => {
    const primary = createForm.guardians[0];
    if (!primary || !primary.fullName.trim()) {
      error('Vui lòng nhập họ tên người giám hộ chính.');
      return;
    }
    if (!primary.phoneNumber.trim()) {
      error('Vui lòng nhập số điện thoại người giám hộ chính.');
      return;
    }
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(primary.phoneNumber.trim())) {
      error('Số điện thoại không hợp lệ (yêu cầu 10 chữ số chuẩn định dạng Việt Nam).');
      return;
    }
    setCreateStep(3);
  };

  // Submit tạo mới
  const handleSubmitCreate = () => {
    createStudentMutation.mutate(createForm);
  };

  // Handler mở modal sửa
  const handleOpenEditModal = (student: StudentItem) => {
    studentService.getStudentById(student.studentId).then((detail) => {
      setEditingStudent(detail);
      setEditForm({
        fullName: detail.fullName,
        dateOfBirth: detail.dateOfBirth,
        gender: detail.gender,
        ethnicity: detail.ethnicity || 'Kinh',
        address: detail.address || '',
        admissionDate: detail.admissionDate || '',
        gradeLevel: detail.gradeLevel,
        classId: detail.classId || '',
        academicYearId: detail.academicYearId || '',
        status: detail.status,
        notes: detail.notes || '',
        guardians: detail.guardians?.length
          ? detail.guardians
          : [
              {
                fullName: detail.primaryGuardianName || '',
                relationship: 'Phụ huynh',
                phoneNumber: detail.primaryGuardianPhone || '',
                isPrimary: true,
                isAllowedPickup: true,
              },
            ],
      });
    });
  };

  const handleSubmitEdit = () => {
    if (!editingStudent) return;
    if (editForm.dateOfBirth && editForm.admissionDate) {
      const months = calculateAgeInMonths(editForm.dateOfBirth, editForm.admissionDate);
      if (months < 12 || months > 72) {
        error('Độ tuổi của trẻ không thuộc phạm vi tiếp nhận mầm non (từ 12 đến 72 tháng tuổi).');
        return;
      }
    }
    updateStudentMutation.mutate({
      id: editingStudent.studentId,
      payload: editForm,
    });
  };

  const studentsList = studentPageData?.content || [];
  const totalElements = studentPageData?.totalElements || 0;
  const totalPages = studentPageData?.totalPages || 0;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* =================================================================== */}
      {/* HEADER & THANH CÔNG CỤ TÌM KIẾM / LỌC ĐA TIÊU CHÍ                   */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#1E4D40]/10 flex items-center justify-center text-[#1E4D40]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-800">
                  Danh Mục Hồ Sơ Học Sinh
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1E4D40]/10 text-[#1E4D40]">
                  G4-UC-01
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Tiếp nhận hồ sơ mới, cấp mã định danh duy nhất và quản lý tra cứu học sinh toàn trường
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => refetchStudents()}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E4D40] hover:bg-[#16382f] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tiếp Nhận Học Sinh Mới</span>
            </button>
          </div>
        </div>

        {/* Thanh tìm kiếm và bộ lọc */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(0);
              }}
              placeholder="Tìm họ tên, mã HS..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            />
          </div>

          {/* Lọc Niên Khóa */}
          <div>
            <select
              value={selectedYearId}
              onChange={(e) => {
                setSelectedYearId(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">Tất cả niên khóa</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.isActive ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Khối Lớp */}
          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassId('ALL');
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">Tất cả khối lớp</option>
              <option value="TODDLER">Khối Nhà trẻ (12 - 36 tháng)</option>
              <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
              <option value="KINDERGARTEN">Khối Chồi (4 - 5 tuổi)</option>
              <option value="PRE_K">Khối Lá (5 - 6 tuổi)</option>
            </select>
          </div>

          {/* Lọc Lớp Học */}
          <div>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">Tất cả lớp học</option>
              {allClasses
                .filter((c) => selectedGrade === 'ALL' || c.gradeLevel === selectedGrade)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({GRADE_LABELS[c.gradeLevel]?.split(' ')[1] || c.gradeLevel})
                  </option>
                ))}
            </select>
          </div>

          {/* Lọc Trạng Thái */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="WAITING_PLACEMENT">Chờ xếp lớp</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="GRADUATED">Đã tốt nghiệp (Khối Lá)</option>
              <option value="TRANSFERRED">Đã chuyển trường</option>
              <option value="WITHDRAWN">Nghỉ học</option>
            </select>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* BẢNG DANH SÁCH HỒ SƠ HỌC SINH                                       */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoadingStudents ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E4D40]" />
            <span className="text-xs font-semibold">Đang tải danh sách hồ sơ học sinh...</span>
          </div>
        ) : studentsList.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Baby className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-700">Chưa tìm thấy học sinh nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không có dữ liệu học sinh phù hợp với bộ lọc hiện tại. Thử thay đổi điều kiện tìm kiếm hoặc tiếp nhận học sinh mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-4">Mã & Họ Tên Học Sinh</th>
                  <th className="px-4 py-4">Ngày Sinh & Độ Tuổi</th>
                  <th className="px-4 py-4">Giới Tính</th>
                  <th className="px-4 py-4">Khối & Lớp Học</th>
                  <th className="px-4 py-4">Người Giám Hộ Chính</th>
                  <th className="px-4 py-4">Trạng Thái</th>
                  <th className="px-4 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsList.map((s) => {
                  const statusInfo = STATUS_LABELS[s.status] || {
                    text: s.status,
                    bg: 'bg-slate-100 border-slate-200',
                    textCol: 'text-slate-700',
                  };
                  return (
                    <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Cột 1: Mã HS & Tên */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1E4D40] to-[#275A4E] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {s.fullName?.charAt(0) || 'H'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{s.fullName}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-[#1E4D40] bg-[#1E4D40]/10 px-2 py-0.5 rounded-md">
                                {s.studentCode}
                              </span>
                              {s.academicYearName && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  • {s.academicYearName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Ngày sinh & Độ tuổi */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-700">{s.dateOfBirth}</div>
                        <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                          {s.ageMonths} tháng tuổi
                        </div>
                      </td>

                      {/* Cột 3: Giới tính */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            s.gender === 'MALE'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {s.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </span>
                      </td>

                      {/* Cột 4: Khối & Lớp */}
                      <td className="px-4 py-4">
                        {s.className ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-[#1E4D40]/10 text-[#1E4D40] font-bold text-xs">
                              {s.className}
                            </span>
                            {s.gradeLevel && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                ({GRADE_LABELS[s.gradeLevel]?.split(' ')[1] || s.gradeLevel})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-xs">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chưa xếp lớp</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Người giám hộ */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800">
                          {s.primaryGuardianName || 'Chưa cập nhật'}
                        </div>
                        {s.primaryGuardianPhone && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.primaryGuardianPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusInfo.bg} ${statusInfo.textCol}`}
                        >
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* Cột 7: Thao tác */}
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingStudentId(s.studentId)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            title="Xem chi tiết hồ sơ"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 rounded-lg text-[#1E4D40] hover:text-[#16382f] hover:bg-[#1E4D40]/10 transition cursor-pointer"
                            title="Chỉnh sửa hồ sơ"
                          >
                            <Edit2 className="w-4 h-4" />
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

        {/* PHÂN TRANG */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Hiển thị <span className="font-bold text-slate-900">{studentsList.length}</span> /{' '}
            <span className="font-bold text-slate-900">{totalElements}</span> học sinh
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-700 px-2">
              Trang {currentPage + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              type="button"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: TIẾP NHẬN HỒ SƠ HỌC SINH MỚI (G4-UC-01 & BR-011)          */}
      {/* =================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Baby className="w-5 h-5 text-[#E5A93C]" />
                  <span>Tiếp Nhận Hồ Sơ Học Sinh Mới</span>
                </h3>
                <p className="text-xs text-emerald-100/80">
                  Cấp mã học sinh tự động & thẩm định độ tuổi mầm non (BR-011: 12 - 72 tháng)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="flex px-6 py-3 border-b border-slate-100 bg-slate-50 text-xs font-bold">
              <div
                className={`flex-1 flex items-center gap-2 ${
                  createStep >= 1 ? 'text-[#1E4D40]' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                    createStep >= 1 ? 'bg-[#1E4D40]' : 'bg-slate-300'
                  }`}
                >
                  1
                </div>
                <span>Thông tin của trẻ</span>
              </div>
              <div
                className={`flex-1 flex items-center gap-2 ${
                  createStep >= 2 ? 'text-[#1E4D40]' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                    createStep >= 2 ? 'bg-[#1E4D40]' : 'bg-slate-300'
                  }`}
                >
                  2
                </div>
                <span>Người giám hộ</span>
              </div>
              <div
                className={`flex-1 flex items-center gap-2 ${
                  createStep >= 3 ? 'text-[#1E4D40]' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                    createStep >= 3 ? 'bg-[#1E4D40]' : 'bg-slate-300'
                  }`}
                >
                  3
                </div>
                <span>Xếp lớp & Hoàn tất</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* BƯỚC 1: THÔNG TIN TRẺ */}
              {createStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Họ và tên của trẻ <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createForm.fullName}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, fullName: e.target.value })
                        }
                        placeholder="Ví dụ: Nguyễn Gia Huy"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Ngày tháng năm sinh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={createForm.dateOfBirth}
                        onChange={(e) => {
                          const dob = e.target.value;
                          const months = calculateAgeInMonths(dob, createForm.admissionDate);
                          const suggested = suggestGradeFromAge(months);
                          setCreateForm({
                            ...createForm,
                            dateOfBirth: dob,
                            gradeLevel: suggested || createForm.gradeLevel,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Ngày nhập học <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={createForm.admissionDate}
                        onChange={(e) => {
                          const adm = e.target.value;
                          const months = calculateAgeInMonths(createForm.dateOfBirth, adm);
                          const suggested = suggestGradeFromAge(months);
                          setCreateForm({
                            ...createForm,
                            admissionDate: adm,
                            gradeLevel: suggested || createForm.gradeLevel,
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* THÔNG BÁO TÍNH ĐỘ TUỔI TỰ ĐỘNG */}
                  {createForm.dateOfBirth && (
                    <div
                      className={`p-3.5 rounded-xl border flex items-center justify-between ${
                        createAgeMonths >= 12 && createAgeMonths <= 72
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Baby className="w-5 h-5 shrink-0" />
                        <div>
                          <div className="font-extrabold text-xs">
                            Độ tuổi tính toán: {createAgeMonths} tháng tuổi
                          </div>
                          <div className="text-[11px] opacity-80">
                            {createAgeMonths >= 12 && createAgeMonths <= 72
                              ? `Đủ tiêu chuẩn mầm non (12 - 72 tháng) • Gợi ý: ${
                                  suggestGradeFromAge(createAgeMonths)
                                    ? GRADE_LABELS[suggestGradeFromAge(createAgeMonths)!]
                                    : 'Chọn khối'
                                }`
                              : 'Không thuộc phạm vi tiếp nhận mầm non (12 - 72 tháng)!'}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] px-2.5 py-1 rounded-lg bg-white/70">
                        BR-011
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Giới tính <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.gender}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            gender: e.target.value as 'MALE' | 'FEMALE',
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Dân tộc</label>
                      <input
                        type="text"
                        value={createForm.ethnicity}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, ethnicity: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Niên khóa tiếp nhận <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.academicYearId}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, academicYearId: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      >
                        <option value="">-- Chọn năm học --</option>
                        {academicYears.map((y: any) => (
                          <option key={y.id} value={y.id}>
                            {y.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Địa chỉ thường trú <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, address: e.target.value })
                      }
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* BƯỚC 2: NGƯỜI GIÁM HỘ (PHỤ HUYNH) */}
              {createStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                    <span className="font-bold">Quy tắc:</span> Bắt buộc phải có thông tin liên lạc của ít nhất 01 phụ huynh/người giám hộ để liên hệ trong các trường hợp khẩn cấp.
                  </div>

                  {createForm.guardians.map((g, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                        <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#1E4D40]" />
                          <span>
                            {idx === 0
                              ? 'Người giám hộ chính (Bắt buộc)'
                              : `Người giám hộ phụ thứ ${idx + 1}`}
                          </span>
                        </span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = createForm.guardians.filter((_, i) => i !== idx);
                              setCreateForm({ ...createForm, guardians: updated });
                            }}
                            className="text-rose-600 hover:text-rose-800 font-bold text-[11px]"
                          >
                            Xóa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Họ và tên <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={g.fullName}
                            onChange={(e) => {
                              const updated = [...createForm.guardians];
                              updated[idx].fullName = e.target.value;
                              setCreateForm({ ...createForm, guardians: updated });
                            }}
                            placeholder="Họ tên phụ huynh"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Mối quan hệ <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={g.relationship}
                            onChange={(e) => {
                              const updated = [...createForm.guardians];
                              updated[idx].relationship = e.target.value;
                              setCreateForm({ ...createForm, guardians: updated });
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                          >
                            <option value="Bố">Bố</option>
                            <option value="Mẹ">Mẹ</option>
                            <option value="Ông">Ông</option>
                            <option value="Bà">Bà</option>
                            <option value="Người giám hộ">Người giám hộ hợp pháp</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Số điện thoại (10 số) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={g.phoneNumber}
                            onChange={(e) => {
                              const updated = [...createForm.guardians];
                              updated[idx].phoneNumber = e.target.value;
                              setCreateForm({ ...createForm, guardians: updated });
                            }}
                            placeholder="0912345678"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Địa chỉ Email
                          </label>
                          <input
                            type="email"
                            value={g.email || ''}
                            onChange={(e) => {
                              const updated = [...createForm.guardians];
                              updated[idx].email = e.target.value;
                              setCreateForm({ ...createForm, guardians: updated });
                            }}
                            placeholder="phuhuynh@gmail.com"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {createForm.guardians.length < 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreateForm({
                          ...createForm,
                          guardians: [
                            ...createForm.guardians,
                            {
                              fullName: '',
                              relationship: 'Mẹ',
                              phoneNumber: '',
                              email: '',
                              isPrimary: false,
                              isAllowedPickup: true,
                            },
                          ],
                        });
                      }}
                      className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm người giám hộ thứ 2 (Ví dụ: Mẹ hoặc Bố)</span>
                    </button>
                  )}
                </div>
              )}

              {/* BƯỚC 3: XẾP LỚP & HOÀN TẤT */}
              {createStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="font-extrabold text-slate-800 text-xs">
                      Xác nhận thông tin tiếp nhận:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        Học sinh: <span className="font-bold">{createForm.fullName}</span>
                      </div>
                      <div>
                        Độ tuổi: <span className="font-bold text-emerald-700">{createAgeMonths} tháng tuổi</span>
                      </div>
                      <div>
                        Người giám hộ:{' '}
                        <span className="font-bold">{createForm.guardians[0]?.fullName}</span>
                      </div>
                      <div>
                        SĐT: <span className="font-bold">{createForm.guardians[0]?.phoneNumber}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Khối lớp tiếp nhận <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={createForm.gradeLevel}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            gradeLevel: e.target.value as GradeLevel,
                            classId: '',
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      >
                        <option value="TODDLER">Khối Nhà trẻ (12 - 36 tháng)</option>
                        <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
                        <option value="KINDERGARTEN">Khối Chồi (4 - 5 tuổi)</option>
                        <option value="PRE_K">Khối Lá (5 - 6 tuổi)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Lớp học tiếp nhận ban đầu (Tùy chọn)
                      </label>
                      <select
                        value={createForm.classId || ''}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, classId: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      >
                        <option value="">-- Để trống: Đưa vào danh sách "Chờ xếp lớp" (Khuyến nghị) --</option>
                        {allClasses
                          .filter(
                            (c) =>
                              c.gradeLevel === createForm.gradeLevel &&
                              (!createForm.academicYearId || c.academicYearId === createForm.academicYearId)
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (Sĩ số hiện tại: {c.currentEnrollment}/{c.maxCapacity})
                            </option>
                          ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Nếu để trống, học sinh sẽ nhận trạng thái <strong>WAITING_PLACEMENT</strong> để Cán bộ Giáo vụ phân bổ lớp tập trung trong tính năng Xếp Trẻ Vào Lớp.
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Ghi chú đặc biệt / Lưu ý sức khỏe
                      </label>
                      <textarea
                        rows={2}
                        value={createForm.notes || ''}
                        onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                        placeholder="Tiền sử dị ứng, tính cách đặc thù, ghi chú từ gia đình..."
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {createStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCreateStep((s) => (s - 1) as any)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-white text-xs cursor-pointer"
                >
                  Quay lại
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
              )}

              {createStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="px-5 py-2.5 rounded-xl bg-[#1E4D40] text-white font-bold text-xs hover:bg-[#16382f] shadow-sm cursor-pointer"
                >
                  Tiếp Tục (Người Giám Hộ)
                </button>
              )}

              {createStep === 2 && (
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="px-5 py-2.5 rounded-xl bg-[#1E4D40] text-white font-bold text-xs hover:bg-[#16382f] shadow-sm cursor-pointer"
                >
                  Tiếp Tục (Xếp Lớp)
                </button>
              )}

              {createStep === 3 && (
                <button
                  type="button"
                  disabled={createStudentMutation.isPending}
                  onClick={handleSubmitCreate}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1E4D40] text-white font-bold text-xs hover:bg-[#16382f] shadow-md cursor-pointer"
                >
                  {createStudentMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Cấp Mã & Tiếp Nhận Hồ Sơ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: XEM CHI TIẾT TOÀN DIỆN HỒ SƠ HỌC SINH                      */}
      {/* =================================================================== */}
      {viewingStudentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Baby className="w-5 h-5 text-[#E5A93C]" />
                  <span>Hồ Sơ Chi Tiết Học Sinh</span>
                </h3>
                <p className="text-xs text-emerald-100/80">Tra cứu toàn diện thông tin học sinh mầm non</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingStudentId(null)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-4 text-xs">
              {isLoadingDetail || !viewingStudent ? (
                <div className="p-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1E4D40]" />
                  Đang tải thông tin chi tiết...
                </div>
              ) : (
                <>
                  {/* Card tóm tắt học sinh */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#1E4D40] text-white flex items-center justify-center font-extrabold text-xl shadow-sm shrink-0">
                      {viewingStudent.fullName?.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-black text-slate-900">
                        {viewingStudent.fullName}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#1E4D40] bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          {viewingStudent.studentCode}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 bg-white/70 px-2 py-0.5 rounded-md">
                          {viewingStudent.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          {viewingStudent.ageMonths} tháng tuổi
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin học tập & phân lớp */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="font-extrabold text-slate-800 border-b border-slate-200/80 pb-1.5 flex items-center gap-2">
                      <School className="w-4 h-4 text-[#1E4D40]" />
                      <span>Thông tin lớp học & Niên khóa</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="text-slate-500">Khối lớp:</span>{' '}
                        <span className="font-bold text-slate-800">
                          {viewingStudent.gradeLevel ? GRADE_LABELS[viewingStudent.gradeLevel] : 'Chưa xác định'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Lớp hiện tại:</span>{' '}
                        <span className="font-bold text-[#1E4D40]">
                          {viewingStudent.className || 'Chờ xếp lớp (WAITING_PLACEMENT)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Niên khóa:</span>{' '}
                        <span className="font-bold text-slate-800">
                          {viewingStudent.academicYearName || 'Chưa gán'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Trạng thái:</span>{' '}
                        <span className="font-bold text-slate-800">
                          {STATUS_LABELS[viewingStudent.status]?.text || viewingStudent.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ngày nhập học:</span>{' '}
                        <span className="font-semibold text-slate-700">
                          {viewingStudent.admissionDate || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Dân tộc:</span>{' '}
                        <span className="font-semibold text-slate-700">
                          {viewingStudent.ethnicity || 'Kinh'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Địa chỉ thường trú:</span>{' '}
                        <span className="font-semibold text-slate-800">
                          {viewingStudent.address || 'Chưa cập nhật'}
                        </span>
                      </div>
                      {viewingStudent.notes && (
                        <div className="col-span-2 p-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                          <span className="font-bold">Lưu ý / Ghi chú:</span> {viewingStudent.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thông tin Người giám hộ */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="font-extrabold text-slate-800 border-b border-slate-200/80 pb-1.5 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1E4D40]" />
                      <span>Thông tin Phụ huynh / Người giám hộ</span>
                    </div>

                    {viewingStudent.guardians && viewingStudent.guardians.length > 0 ? (
                      <div className="space-y-2.5">
                        {viewingStudent.guardians.map((g, i) => (
                          <div
                            key={i}
                            className="p-3 bg-white rounded-xl border border-slate-200 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">
                                {g.fullName} ({g.relationship})
                              </span>
                              {g.isPrimary && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Người giám hộ chính
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-slate-600 text-[11px] pt-1">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-mono">{g.phoneNumber}</span>
                              </div>
                              {g.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{g.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic">Chưa có thông tin người giám hộ.</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingStudentId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: CẬP NHẬT HỒ SƠ HỌC SINH (G4-UC-01 & MSG-046)               */}
      {/* =================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#E5A93C]" />
                  <span>Cập Nhật Hồ Sơ Học Sinh: {editingStudent.fullName}</span>
                </h3>
                <p className="text-xs text-emerald-100/80">Mã định danh: {editingStudent.studentCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={editForm.fullName || ''}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth || ''}
                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={editForm.gender || 'MALE'}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gender: e.target.value as 'MALE' | 'FEMALE' })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dân tộc</label>
                  <input
                    type="text"
                    value={editForm.ethnicity || ''}
                    onChange={(e) => setEditForm({ ...editForm, ethnicity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={editForm.gradeLevel || 'TODDLER'}
                    onChange={(e) =>
                      setEditForm({ ...editForm, gradeLevel: e.target.value as GradeLevel })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  >
                    <option value="TODDLER">Khối Nhà trẻ (12 - 36 tháng)</option>
                    <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
                    <option value="KINDERGARTEN">Khối Chồi (4 - 5 tuổi)</option>
                    <option value="PRE_K">Khối Lá (5 - 6 tuổi)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái học tập</label>
                  <select
                    value={editForm.status || 'ACTIVE'}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value as StudentStatus })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  >
                    <option value="WAITING_PLACEMENT">Chờ xếp lớp</option>
                    <option value="ACTIVE">Đang hoạt động</option>
                    <option value="GRADUATED">Đã tốt nghiệp (Ra trường)</option>
                    <option value="TRANSFERRED">Đã chuyển trường</option>
                    <option value="WITHDRAWN">Nghỉ học</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Ghi chú hồ sơ</label>
                  <textarea
                    rows={2}
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-100 text-xs cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={updateStudentMutation.isPending}
                onClick={handleSubmitEdit}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1E4D40] text-white font-bold text-xs hover:bg-[#16382f] shadow-md cursor-pointer"
              >
                {updateStudentMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>Lưu Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAdmissionTab;
