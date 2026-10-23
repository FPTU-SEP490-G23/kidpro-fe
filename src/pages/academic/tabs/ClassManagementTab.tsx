import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  UserCheck,
  XCircle,
  School,
  Calendar,
  Search,
  FileCheck2,
  Clock,
  Layers,
  Info,
  Archive,
  ShieldAlert,
  Sparkles,
  Lock,
} from 'lucide-react';
import { classService } from '../../../services/classService';
import { assignmentService } from '../../../services/assignmentService';
import { academicYearApi } from '../../../api/academicYearApi';
import { facilityClassroomApi, FacilityClassroom } from '../../../api/facilityClassroomApi';
import { useToast } from '../../../contexts/ToastContext';
import { StudentPlacementTab } from './StudentPlacementTab';
import { StudentPromotionTab } from './StudentPromotionTab';
import {
  ClassSummary,
  ClassProposalResponse,
  GradeLevel,
} from '../../../types/classAffairs.types';

// =========================================================================
// Zod Form Validation Schemas
// =========================================================================

// G3-UC-01: Cập nhật thông tin lớp học
const updateClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp học phải có ít nhất 2 ký tự').max(50, 'Tên lớp tối đa 50 ký tự'),
  roomId: z.string().optional(),
  maxCapacity: z.number().min(10, 'Sĩ số tối thiểu là 10 trẻ').max(50, 'Sĩ số tối đa là 50 trẻ'),
});
type UpdateClassFormValues = z.infer<typeof updateClassSchema>;

// G3-UC-02: Lập kế hoạch mở lớp mới
const createProposalSchema = z.object({
  className: z.string().min(2, 'Tên lớp học phải có ít nhất 2 ký tự').max(50, 'Tên lớp tối đa 50 ký tự'),
  gradeLevel: z.enum(['INFANT', 'TODDLER', 'NURSERY', 'KINDERGARTEN', 'PRE_K']),
  academicYearId: z.string().min(1, 'Vui lòng chọn niên khóa năm học'),
  proposedCapacity: z.number().min(10, 'Sĩ số dự kiến tối thiểu là 10').max(40, 'Sĩ số dự kiến không quá 40'),
  proposedRoomId: z.string().optional(),
});
type CreateProposalFormValues = z.infer<typeof createProposalSchema>;

// G3-UC-04: Dự thảo phân công giáo viên
const draftAssignmentSchema = z.object({
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  teacherId: z.string().min(1, 'Vui lòng chọn giáo viên'),
  role: z.enum(['HOMEROOM', 'ASSISTANT']),
});
type DraftAssignmentFormValues = z.infer<typeof draftAssignmentSchema>;

const GRADE_LABELS: Record<GradeLevel, string> = {
  INFANT: 'Nhà trẻ nhỏ (3 - 12 tháng)',
  TODDLER: 'Nhà trẻ (12 - 36 tháng)',
  NURSERY: 'Khối Mầm (3 - 4 tuổi)',
  KINDERGARTEN: 'Khối Chồi (4 - 5 tuổi)',
  PRE_K: 'Khối Lá (5 - 6 tuổi)',
};

export const ClassManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Đồng bộ subtab với URL param `subtab` & `mode`
  const subtabParam = searchParams.get('subtab')?.toLowerCase();
  const modeParam = searchParams.get('mode')?.toLowerCase();

  const getInitialSubTab = (): 'CLASSES' | 'PROPOSALS' | 'ASSIGNMENTS' | 'PLACEMENT' | 'PROMOTION' => {
    if (subtabParam === 'proposals' || subtabParam === 'open-proposals') return 'PROPOSALS';
    if (subtabParam === 'assignments' || subtabParam === 'teacher-assignments') return 'ASSIGNMENTS';
    if (subtabParam === 'placement' || subtabParam === 'placements') return 'PLACEMENT';
    if (subtabParam === 'promotion' || subtabParam === 'promotions') return 'PROMOTION';
    return 'CLASSES';
  };

  const [activeSubTab, setActiveSubTab] = useState<'CLASSES' | 'PROPOSALS' | 'ASSIGNMENTS' | 'PLACEMENT' | 'PROMOTION'>(getInitialSubTab);

  // Filters
  const [selectedYearId, setSelectedYearId] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // G3-UC-12: Chế độ hiển thị lớp học (Đang hoạt động vs Đã lưu trữ)
  const [classFilterMode, setClassFilterMode] = useState<'ACTIVE' | 'ARCHIVED'>(() => {
    if (subtabParam === 'archive' || subtabParam === 'archived' || modeParam === 'archived') return 'ARCHIVED';
    return 'ACTIVE';
  });
  const [archivingClass, setArchivingClass] = useState<ClassSummary | null>(null);

  useEffect(() => {
    if (subtabParam === 'proposals' || subtabParam === 'open-proposals') {
      setActiveSubTab('PROPOSALS');
      setClassFilterMode('ACTIVE');
    } else if (subtabParam === 'assignments' || subtabParam === 'teacher-assignments') {
      setActiveSubTab('ASSIGNMENTS');
      setClassFilterMode('ACTIVE');
    } else if (subtabParam === 'placement' || subtabParam === 'placements') {
      setActiveSubTab('PLACEMENT');
      setClassFilterMode('ACTIVE');
    } else if (subtabParam === 'promotion' || subtabParam === 'promotions') {
      setActiveSubTab('PROMOTION');
      setClassFilterMode('ACTIVE');
    } else if (subtabParam === 'archive' || subtabParam === 'archived' || modeParam === 'archived') {
      setActiveSubTab('CLASSES');
      setClassFilterMode('ARCHIVED');
    } else if (subtabParam === 'classes' || subtabParam === 'class-list') {
      setActiveSubTab('CLASSES');
      setClassFilterMode('ACTIVE');
    }
  }, [subtabParam, modeParam]);

  const handleSubTabChange = (tab: 'CLASSES' | 'PROPOSALS' | 'ASSIGNMENTS' | 'PLACEMENT' | 'PROMOTION') => {
    setActiveSubTab(tab);
    const newParams = new URLSearchParams(searchParams);
    if (tab === 'CLASSES') {
      newParams.set('subtab', 'classes');
    } else if (tab === 'PROPOSALS') {
      newParams.set('subtab', 'proposals');
    } else if (tab === 'ASSIGNMENTS') {
      newParams.set('subtab', 'assignments');
    } else if (tab === 'PROMOTION') {
      newParams.set('subtab', 'promotion');
    } else {
      newParams.set('subtab', 'placement');
    }
    setSearchParams(newParams);
  };

  // Modals
  const [editingClass, setEditingClass] = useState<ClassSummary | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ClassProposalResponse | null>(null);
  const [assigningClass, setAssigningClass] = useState<ClassSummary | null>(null);

  // =========================================================================
  // Queries
  // =========================================================================

  // Danh mục năm học
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years-list'],
    queryFn: () => academicYearApi.getAcademicYears(),
  });

  // Danh mục phòng học vật lý
  const { data: classrooms = [] } = useQuery<FacilityClassroom[]>({
    queryKey: ['facility-classrooms-all'],
    queryFn: () => facilityClassroomApi.getAllClassrooms(),
  });

  // G3-UC-01: Danh sách lớp học
  const {
    data: classesData,
    isLoading: isLoadingClasses,
  } = useQuery({
    queryKey: ['academic-classes', selectedYearId, selectedGrade],
    queryFn: () =>
      classService.getClasses({
        academicYearId: selectedYearId !== 'ALL' ? selectedYearId : undefined,
        gradeLevel: selectedGrade !== 'ALL' ? (selectedGrade as GradeLevel) : undefined,
        size: 50,
      }),
  });
  const classesList: ClassSummary[] = classesData?.content || [];

  // G3-UC-12: Danh sách lớp đã lưu trữ theo niên khóa
  const {
    data: archivedClasses = [],
    isLoading: isLoadingArchived,
  } = useQuery({
    queryKey: ['archived-classes', selectedYearId],
    queryFn: () => classService.getArchivedClasses(selectedYearId !== 'ALL' ? selectedYearId : undefined),
    enabled: classFilterMode === 'ARCHIVED',
  });

  // G3-UC-12: Đóng & Lưu trữ hồ sơ lớp học (BR-010, MSG-043, MSG-044)
  const archiveClassMutation = useMutation({
    mutationFn: (classId: string) => classService.archiveClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['archived-classes'] });
      success('MSG-043: Lưu trữ hồ sơ lớp học thành công.');
      setArchivingClass(null);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-044' || msg?.includes('MSG-044') || msg?.includes('chưa đủ điều kiện')) {
        error('MSG-044: Lớp học chưa đủ điều kiện đóng hồ sơ do còn học sinh chưa được xử lý kết chuyển hoặc chuyển trường.');
      } else {
        error(msg || 'Lỗi khi đóng và lưu trữ hồ sơ lớp học.');
      }
    },
  });

  // G3-UC-02: Danh sách đề xuất mở lớp
  const {
    data: proposals = [],
    isLoading: isLoadingProposals,
  } = useQuery({
    queryKey: ['class-proposals', selectedYearId, selectedGrade],
    queryFn: () =>
      classService.getProposals({
        academicYearId: selectedYearId !== 'ALL' ? selectedYearId : undefined,
        gradeLevel: selectedGrade !== 'ALL' ? (selectedGrade as GradeLevel) : undefined,
      }),
  });

  // G3-UC-04: Danh sách giáo viên khả dụng
  const { data: availableTeachers = [] } = useQuery({
    queryKey: ['available-teachers', selectedYearId],
    queryFn: () =>
      assignmentService.getAvailableTeachers(
        selectedYearId !== 'ALL' ? selectedYearId : undefined
      ),
  });

  // =========================================================================
  // React Hook Forms
  // =========================================================================

  // Edit Class Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors },
    setValue: setEditValue,
    reset: resetEdit,
  } = useForm<UpdateClassFormValues>({
    resolver: zodResolver(updateClassSchema),
  });

  // Create / Edit Proposal Form
  const {
    register: registerProposal,
    handleSubmit: handleProposalSubmit,
    formState: { errors: proposalErrors },
    setValue: setProposalValue,
    reset: resetProposal,
  } = useForm<CreateProposalFormValues>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      gradeLevel: 'INFANT',
      proposedCapacity: 25,
    },
  });

  // Draft Assignment Form
  const {
    register: registerAssign,
    handleSubmit: handleAssignSubmit,
    formState: { errors: assignErrors },
    setValue: setAssignValue,
    reset: resetAssign,
  } = useForm<DraftAssignmentFormValues>({
    resolver: zodResolver(draftAssignmentSchema),
    defaultValues: {
      role: 'HOMEROOM',
    },
  });

  // =========================================================================
  // Mutations
  // =========================================================================

  // G3-UC-01: Cập nhật thông tin lớp
  const updateClassMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      classService.updateClass(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'MSG-024: Cập nhật thông tin lớp học thành công.');
      setEditingClass(null);
      resetEdit();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-025' || msg?.includes('MSG-025') || msg?.includes('Phòng học đã được phân bổ')) {
        error('MSG-025: Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi cập nhật thông tin lớp học.');
      }
    },
  });

  // G3-UC-02: Tạo kế hoạch mở lớp mới
  const createProposalMutation = useMutation({
    mutationFn: (payload: CreateProposalFormValues) =>
      classService.createProposal({
        ...payload,
        proposedRoomId: payload.proposedRoomId || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(
        res?.message ||
          'MSG-026: Lập kế hoạch mở lớp học mới thành công, đang chờ Ban Giám hiệu phê duyệt.'
      );
      setIsProposalModalOpen(false);
      resetProposal();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-004' || msg?.includes('MSG-004') || msg?.includes('Tên lớp học đã tồn tại')) {
        error('MSG-004: Tên lớp học đã tồn tại trong cùng khối lớp.');
      } else if (code === 'MSG-025' || msg?.includes('MSG-025') || msg?.includes('Phòng học đã được phân bổ')) {
        error('MSG-025: Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi khi lập kế hoạch mở lớp mới.');
      }
    },
  });

  // G3-UC-02: Cập nhật kế hoạch mở lớp
  const updateProposalMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      classService.updateProposal(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      success(res?.message || 'Cập nhật kế hoạch mở lớp thành công.');
      setEditingProposal(null);
      resetProposal();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-004' || msg?.includes('MSG-004')) {
        error('MSG-004: Tên lớp học đã tồn tại trong cùng khối lớp.');
      } else if (code === 'MSG-025' || msg?.includes('MSG-025')) {
        error('MSG-025: Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi cập nhật kế hoạch mở lớp.');
      }
    },
  });

  // G3-UC-04: Lập dự thảo phân công giáo viên
  const draftAssignmentMutation = useMutation({
    mutationFn: (payload: DraftAssignmentFormValues) =>
      assignmentService.createDraftAssignment({
        ...payload,
        academicYearId: selectedYearId !== 'ALL' ? selectedYearId : undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['available-teachers'] });
      success(
        res?.message ||
          'MSG-030: Lập dự thảo phân công giáo viên thành công, đang chờ Ban Giám hiệu phê duyệt.'
      );
      setAssigningClass(null);
      resetAssign();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-019' || msg?.includes('MSG-019') || msg?.includes('tạm khóa')) {
        error('MSG-019: Tài khoản giáo viên đang bị tạm khóa.');
      } else if (code === 'MSG-031' || msg?.includes('MSG-031') || msg?.includes('Giáo viên Chủ nhiệm ở lớp khác')) {
        error('MSG-031: Giáo viên đã là Giáo viên Chủ nhiệm ở lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi lập dự thảo phân công giáo viên.');
      }
    },
  });

  // =========================================================================
  // Handlers
  // =========================================================================

  const onOpenEditClass = (c: ClassSummary) => {
    setEditingClass(c);
    setEditValue('name', c.name);
    setEditValue('roomId', c.roomId || '');
    setEditValue('maxCapacity', c.maxCapacity || 25);
  };

  const onSaveEditClass = (values: UpdateClassFormValues) => {
    if (!editingClass) return;
    updateClassMutation.mutate({
      id: editingClass.id,
      payload: {
        name: values.name,
        roomId: values.roomId || undefined,
        maxCapacity: values.maxCapacity,
      },
    });
  };

  const onOpenCreateProposal = () => {
    setEditingProposal(null);
    resetProposal({
      className: '',
      gradeLevel: 'INFANT',
      academicYearId: selectedYearId !== 'ALL' ? selectedYearId : (academicYears[0]?.id || ''),
      proposedCapacity: 25,
      proposedRoomId: '',
    });
    setIsProposalModalOpen(true);
  };

  const onOpenEditProposal = (p: ClassProposalResponse) => {
    setEditingProposal(p);
    setProposalValue('className', p.className);
    setProposalValue('gradeLevel', p.gradeLevel);
    setProposalValue('academicYearId', p.academicYearId);
    setProposalValue('proposedCapacity', p.proposedCapacity);
    setProposalValue('proposedRoomId', p.proposedRoomId || '');
    setIsProposalModalOpen(true);
  };

  const onSubmitProposal = (values: CreateProposalFormValues) => {
    if (editingProposal) {
      updateProposalMutation.mutate({
        id: editingProposal.id,
        payload: {
          className: values.className,
          gradeLevel: values.gradeLevel,
          proposedCapacity: values.proposedCapacity,
          proposedRoomId: values.proposedRoomId || undefined,
        },
      });
    } else {
      createProposalMutation.mutate(values);
    }
  };

  const onOpenAssignModal = (c: ClassSummary) => {
    setAssigningClass(c);
    setAssignValue('classId', c.id);
    setAssignValue('role', 'HOMEROOM');
    setAssignValue('teacherId', c.homeroomTeacherId || '');
  };

  const onSubmitAssign = (values: DraftAssignmentFormValues) => {
    draftAssignmentMutation.mutate(values);
  };

  // Filtered classes list
  const classesToDisplay = classFilterMode === 'ARCHIVED' ? archivedClasses : classesList;
  const filteredClasses = classesToDisplay.filter((c) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      c.name.toLowerCase().includes(kw) ||
      (c.code && c.code.toLowerCase().includes(kw)) ||
      (c.roomName && c.roomName.toLowerCase().includes(kw)) ||
      (c.homeroomTeacherName && c.homeroomTeacherName.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* RENDER PLACEMENT TAB DIRECTLY IF SELECTED */}
      {activeSubTab === 'PLACEMENT' && <StudentPlacementTab />}

      {/* RENDER PROMOTION TAB DIRECTLY IF SELECTED */}
      {activeSubTab === 'PROMOTION' && <StudentPromotionTab />}

      {/* TOOLBAR FOR CLASSES, PROPOSALS & ASSIGNMENTS */}
      {activeSubTab !== 'PLACEMENT' && activeSubTab !== 'PROMOTION' && (
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Title & Quick Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-extrabold text-slate-800">
            {activeSubTab === 'CLASSES' && (
              <>
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-[#275A4E]" />
                  <span>Danh Sách Lớp Học ({filteredClasses.length} lớp)</span>
                </div>
                {/* G3-UC-12: ACTIVE VS ARCHIVED TOGGLE */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setClassFilterMode('ACTIVE')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      classFilterMode === 'ACTIVE'
                        ? 'bg-white text-emerald-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Đang hoạt động ({classesList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassFilterMode('ARCHIVED')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      classFilterMode === 'ARCHIVED'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-500 hover:text-purple-700'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Đã lưu trữ (Chỉ đọc) ({archivedClasses.length})
                  </button>
                </div>
              </>
            )}
            {activeSubTab === 'PROPOSALS' && (
              <>
                <FileCheck2 className="w-4 h-4 text-[#275A4E]" />
                <span>Danh Sách Đề Xuất Mở Lớp ({proposals.length} đề xuất)</span>
              </>
            )}
            {activeSubTab === 'ASSIGNMENTS' && (
              <>
                <UserCheck className="w-4 h-4 text-[#275A4E]" />
                <span>Danh Sách Phân Công Giáo Viên ({classesList.length} lớp)</span>
              </>
            )}
          </div>

          {activeSubTab === 'PROPOSALS' && (
            <button
              type="button"
              onClick={onOpenCreateProposal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#1E4D40] text-white text-sm font-bold rounded-2xl shadow-sm hover:opacity-95 transition min-h-[44px] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E5A93C]" />
              <span>+ Lập Kế Hoạch Mở Lớp Mới</span>
            </button>
          )}
        </div>

        {/* Global Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Năm học filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#275A4E]" /> Niên khóa năm học
            </label>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">-- Tất cả năm học --</option>
              {academicYears.map((y: any) => {
                const yId = y.id || y.academicYearId;
                const yName = y.name || y.yearName;
                const isActive = y.status === 'ACTIVE' || y.isActive;
                return (
                  <option key={yId} value={yId}>
                    {yName} {isActive ? '★ (Hiện tại)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Khối lớp filter */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#275A4E]" /> Khối lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">-- Tất cả khối lớp --</option>
              <option value="INFANT">Nhà trẻ nhỏ (3 - 12 tháng)</option>
              <option value="TODDLER">Nhà trẻ (12 - 36 tháng)</option>
              <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
              <option value="KINDERGARTEN">Khối Chồi & Lá (4 - 6 tuổi)</option>
            </select>
          </div>

          {/* Search keyword */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-[#275A4E]" /> Tìm kiếm theo mã, tên lớp, phòng, GVCN
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên lớp, mã lớp hoặc tên giáo viên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 1: G3-UC-01 - DANH SÁCH & CẬP NHẬT THÔNG TIN LỚP HỌC        */}
      {/* =================================================================== */}
      {activeSubTab === 'CLASSES' && (
        <div className="space-y-4">
          {isLoadingClasses ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E4D40] mb-3" />
              <p className="text-slate-500 text-sm font-medium">Đang tải danh sách lớp học...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
              <School className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Chưa có lớp học nào phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Không tìm thấy lớp học theo tiêu chí tìm kiếm. Hãy chọn năm học khác hoặc tạo kế hoạch mở lớp mới ở tab Kế hoạch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.map((c) => {
                const enrollmentRatio = c.maxCapacity > 0 ? (c.currentEnrollment / c.maxCapacity) * 100 : 0;
                const isOverfilled = c.currentEnrollment > c.maxCapacity;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Class Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1E4D40]/10 text-[#1E4D40]">
                              {c.code || 'MÃ LỚP'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              {c.gradeLevel ? GRADE_LABELS[c.gradeLevel] || c.gradeLevel : 'Khối lớp'}
                            </span>
                            {c.status === 'ARCHIVED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> ĐÃ LƯU TRỮ
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight">
                            {c.name}
                          </h3>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => onOpenEditClass(c)}
                          className="p-2 text-slate-400 hover:text-[#1E4D40] bg-slate-50 hover:bg-emerald-50 rounded-xl transition border border-slate-100 cursor-pointer"
                          title={c.status === 'ARCHIVED' ? 'Xem chi tiết lớp (Chỉ đọc)' : 'Cập nhật thông tin lớp'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Class Details */}
                      <div className="py-4 space-y-3">
                        {/* Phòng học */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Phòng học phân bổ:
                          </span>
                          <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {c.roomName || 'Chưa phân bổ'} {c.building ? `(${c.building})` : ''}
                          </span>
                        </div>

                        {/* GVCN */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Giáo viên chủ nhiệm:
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded-lg ${
                            c.homeroomTeacherName && c.homeroomTeacherName !== 'Chưa phân công'
                              ? 'text-emerald-800 bg-emerald-50'
                              : 'text-amber-800 bg-amber-50'
                          }`}>
                            {c.homeroomTeacherName || 'Chưa phân công'}
                          </span>
                        </div>

                        {/* Sĩ số & Capacity Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                              <Users className="w-3.5 h-3.5 text-slate-400" /> Sĩ số thực tế:
                            </span>
                            <span className={`font-extrabold ${isOverfilled ? 'text-rose-600' : 'text-slate-800'}`}>
                              {c.currentEnrollment} / {c.maxCapacity} trẻ
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isOverfilled
                                  ? 'bg-rose-500'
                                  : enrollmentRatio > 80
                                  ? 'bg-[#E5A93C]'
                                  : 'bg-[#1E4D40]'
                              }`}
                              style={{ width: `${Math.min(enrollmentRatio, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {c.status !== 'ARCHIVED' && classFilterMode === 'ACTIVE' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenAssignModal(c)}
                            className="flex-1 py-2.5 bg-slate-50 hover:bg-[#1E4D40]/10 text-[#1E4D40] text-xs font-bold rounded-xl transition border border-slate-200/60 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-[#275A4E]" />
                            <span>Phân công GV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenEditClass(c)}
                            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition min-h-[44px] cursor-pointer"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchivingClass(c)}
                            className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition min-h-[44px] cursor-pointer"
                            title="Đóng & Lưu trữ hồ sơ lớp học (BR-010)"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                            <Lock className="w-3.5 h-3.5 text-purple-600" /> Đã đóng & Lưu trữ (Chỉ đọc)
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenEditClass(c)}
                            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Xem hồ sơ
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: G3-UC-02 - KẾ HOẠCH MỞ LỚP HỌC MỚI                      */}
      {/* =================================================================== */}
      {activeSubTab === 'PROPOSALS' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold">Quy định lập kế hoạch mở lớp mới (BR-005, BR-007):</p>
              <p>
                - Tên lớp học không được trùng lặp trong cùng khối lớp và niên khóa.
                <br />- Định mức sĩ số theo chuẩn Bộ GD&ĐT: Nhà trẻ tối đa 26 trẻ, Mẫu giáo (Mầm, Chồi, Lá) tối đa 35 trẻ.
                <br />- Đề xuất tạo mới bắt buộc ở trạng thái <strong>Chờ Ban Giám hiệu phê duyệt (PENDING_APPROVAL)</strong>.
              </p>
            </div>
          </div>

          {isLoadingProposals ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#1E4D40] mb-3" />
              <p className="text-slate-500 text-sm font-medium">Đang tải danh sách đề xuất mở lớp...</p>
            </div>
          ) : proposals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Chưa có kế hoạch mở lớp nào</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Nhấn nút "+ Lập Kế Hoạch Mở Lớp Mới" bên trên để tạo dự thảo trình Ban Giám hiệu phê duyệt.
              </p>
              <button
                type="button"
                onClick={onOpenCreateProposal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E4D40] text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-95 transition min-h-[44px] cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#E5A93C]" /> Tạo Kế Hoạch Ngay
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Tên Lớp Đề Xuất</th>
                      <th className="py-3.5 px-4">Khối Lớp</th>
                      <th className="py-3.5 px-4">Niên Khóa</th>
                      <th className="py-3.5 px-4">Sĩ Số Chuẩn</th>
                      <th className="py-3.5 px-4">Phòng Học Dự Kiến</th>
                      <th className="py-3.5 px-4">Trạng Thái</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proposals.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.className}
                          {p.code && <span className="block text-[10px] text-slate-400 font-normal">{p.code}</span>}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {p.gradeLevel ? GRADE_LABELS[p.gradeLevel] || p.gradeLevel : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.academicYearName || '2026-2027'}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.proposedCapacity} trẻ
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {p.proposedRoomName || 'Chưa bố trí'}
                        </td>
                        <td className="py-3.5 px-4">
                          {p.status === 'PENDING_APPROVAL' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> Chờ BGH duyệt
                            </span>
                          )}
                          {p.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Đã phê duyệt
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3" /> Bị từ chối
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status === 'PENDING_APPROVAL' || p.status === 'REJECTED' ? (
                            <button
                              type="button"
                              onClick={() => onOpenEditProposal(p)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-[#1E4D40] hover:text-white text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Sửa kế hoạch</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Đã kích hoạt</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: G3-UC-04 - PHÂN CÔNG GIÁO VIÊN CHỦ NHIỆM & PHỤ TÁ         */}
      {/* =================================================================== */}
      {activeSubTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Quy tắc phân công nhân sự sư phạm (BR-006, BR-008):</p>
              <p>
                - Tài khoản giáo viên bắt buộc ở trạng thái <strong>ACTIVE</strong> (Không bị tạm đình chỉ/khóa).
                <br />- Mỗi lớp học chỉ có duy nhất <strong>01 Giáo viên Chủ nhiệm (GVCN)</strong>.
                <br />- Một giáo viên không được phân công làm Chủ nhiệm 2 lớp trong cùng một năm học.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Lớp Học</th>
                    <th className="py-3.5 px-4">Khối Lớp</th>
                    <th className="py-3.5 px-4">Phòng Học</th>
                    <th className="py-3.5 px-4">Giáo Viên Chủ Nhiệm (GVCN)</th>
                    <th className="py-3.5 px-4">Tình Trạng Phân Công</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classesList.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {c.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{c.code}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {c.gradeLevel ? GRADE_LABELS[c.gradeLevel] || c.gradeLevel : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.roomName || 'Chưa bố trí'}
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        {c.homeroomTeacherName && c.homeroomTeacherName !== 'Chưa phân công' ? (
                          <div className="flex items-center gap-1.5 text-emerald-800">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <span>{c.homeroomTeacherName}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 italic">Chưa có GVCN</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {c.homeroomTeacherName && c.homeroomTeacherName !== 'Chưa phân công' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" /> Đã phân công
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Cần phân công
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenAssignModal(c)}
                          className="px-3.5 py-2 bg-[#1E4D40] hover:bg-[#16382f] text-white font-bold rounded-xl transition inline-flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#78C2AD]" />
                          <span>Phân công GV</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL G3-UC-01: CẬP NHẬT THÔNG TIN LỚP HỌC                          */}
      {/* =================================================================== */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className={`px-6 py-4 border-b border-slate-100 ${editingClass.status === 'ARCHIVED' ? 'bg-purple-900' : 'bg-[#1E4D40]'} text-white flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                {editingClass.status === 'ARCHIVED' && <Lock className="w-4 h-4 text-purple-300" />}
                <h2 className="text-base font-bold">
                  {editingClass.status === 'ARCHIVED' ? 'Chi Tiết Hồ Sơ Lớp Học (Lưu Trữ - Chỉ Đọc)' : 'Cập nhật Thông tin Lớp học'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingClass(null)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit(onSaveEditClass)} className="p-6 space-y-4">
              {editingClass.status === 'ARCHIVED' && (
                <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-purple-950 text-xs font-semibold flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Hồ sơ lớp học đã được đóng và lưu trữ (chế độ chỉ đọc, bất biến). Không thể chỉnh sửa hoặc phân công.</span>
                </div>
              )}

              {/* Tên lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên lớp học <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerEdit('name')}
                  disabled={editingClass.status === 'ARCHIVED'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                  placeholder="VD: Mầm 1, Chồi A"
                />
                {editErrors.name?.message && (
                  <p className="text-xs text-rose-500 mt-1">{editErrors.name.message}</p>
                )}
              </div>

              {/* Phân bổ phòng học (BR-005) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phòng học phân bổ (BR-005) <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerEdit('roomId')}
                  disabled={editingClass.status === 'ARCHIVED'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Chọn phòng học --</option>
                  {classrooms.map((r) => (
                    <option key={r.classroomId} value={r.classroomId}>
                      {r.roomName} {r.building ? `(${r.building})` : ''} - Sức chứa: {r.capacity || 30} trẻ
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hệ thống kiểm tra tự động quy tắc không trùng phòng giữa các lớp trong cùng năm học.
                </p>
                {editErrors.roomId?.message && (
                  <p className="text-xs text-rose-500 mt-1">{editErrors.roomId.message}</p>
                )}
              </div>

              {/* Sĩ số tối đa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sĩ số định mức tối đa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  {...registerEdit('maxCapacity', { valueAsNumber: true })}
                  disabled={editingClass.status === 'ARCHIVED'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                {editErrors.maxCapacity?.message && (
                  <p className="text-xs text-rose-500 mt-1">{editErrors.maxCapacity.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                {editingClass.status === 'ARCHIVED' ? (
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="w-full py-2.5 bg-purple-800 text-white font-bold rounded-xl hover:bg-purple-900 transition text-xs min-h-[44px]"
                  >
                    Đóng (Chỉ đọc)
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditingClass(null)}
                      className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs min-h-[44px] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updateClassMutation.isPending}
                      className="flex-1 py-2.5 bg-[#1E4D40] text-white font-bold rounded-xl hover:bg-[#16382f] transition text-xs flex justify-center items-center gap-2 min-h-[44px] cursor-pointer"
                    >
                      {updateClassMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Lưu Thay Đổi (MSG-024)'
                      )}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL G3-UC-02: LẬP KẾ HOẠCH MỞ LỚP HỌC MỚI                         */}
      {/* =================================================================== */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">
                  {editingProposal ? 'Chỉnh sửa Kế hoạch Mở Lớp' : 'Lập Kế hoạch Mở Lớp học Mới'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleProposalSubmit(onSubmitProposal)} className="p-6 space-y-4">
              {/* Năm học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Niên khóa năm học <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerProposal('academicYearId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                >
                  <option value="">-- Chọn năm học --</option>
                  {academicYears.map((y: any) => {
                    const yId = y.id || y.academicYearId;
                    const yName = y.name || y.yearName;
                    const isActive = y.status === 'ACTIVE' || y.isActive;
                    return (
                      <option key={yId} value={yId}>
                        {yName} {isActive ? '★ (Năm hiện tại)' : ''}
                      </option>
                    );
                  })}
                </select>
                {proposalErrors.academicYearId?.message && (
                  <p className="text-xs text-rose-500 mt-1">{proposalErrors.academicYearId.message}</p>
                )}
              </div>

              {/* Khối lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối lớp áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerProposal('gradeLevel')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                >
                  <option value="INFANT">Nhà trẻ nhỏ (3 - 12 tháng)</option>
                  <option value="TODDLER">Nhà trẻ (12 - 36 tháng)</option>
                  <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
                  <option value="KINDERGARTEN">Khối Chồi & Lá (4 - 6 tuổi)</option>
                </select>
                {proposalErrors.gradeLevel?.message && (
                  <p className="text-xs text-rose-500 mt-1">{proposalErrors.gradeLevel.message}</p>
                )}
              </div>

              {/* Tên lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên lớp học đề xuất (BR-005) <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerProposal('className')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  placeholder="VD: Mầm 2, Chồi 3"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tên lớp không được trùng lặp trong cùng khối lớp và năm học (MSG-004).
                </p>
                {proposalErrors.className?.message && (
                  <p className="text-xs text-rose-500 mt-1">{proposalErrors.className.message}</p>
                )}
              </div>

              {/* Sĩ số dự kiến */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sĩ số dự kiến (Định mức chuẩn Bộ GD&ĐT) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  {...registerProposal('proposedCapacity', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Định mức chuẩn: Khối Nhà trẻ 24 - 26 trẻ, Khối Mẫu giáo 30 - 35 trẻ.
                </p>
                {proposalErrors.proposedCapacity?.message && (
                  <p className="text-xs text-rose-500 mt-1">{proposalErrors.proposedCapacity.message}</p>
                )}
              </div>

              {/* Phòng học dự kiến */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phòng học dự kiến bố trí
                </label>
                <select
                  {...registerProposal('proposedRoomId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                >
                  <option value="">-- Chưa chọn phòng học --</option>
                  {classrooms.map((r) => (
                    <option key={r.classroomId} value={r.classroomId}>
                      {r.roomName} {r.building ? `(${r.building})` : ''} - Sức chứa: {r.capacity || 30} trẻ
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs min-h-[44px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createProposalMutation.isPending || updateProposalMutation.isPending}
                  className="flex-1 py-2.5 bg-[#1E4D40] text-white font-bold rounded-xl hover:bg-[#16382f] transition text-xs flex justify-center items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {createProposalMutation.isPending || updateProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Lưu Kế Hoạch (MSG-026)'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL G3-UC-04: LẬP DỰ THẢO PHÂN CÔNG GIÁO VIÊN                     */}
      {/* =================================================================== */}
      {assigningClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold">Dự thảo Phân công Giáo viên</h2>
              </div>
              <button
                type="button"
                onClick={() => setAssigningClass(null)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit(onSubmitAssign)} className="p-6 space-y-4">
              {/* Lớp học info */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <div className="text-xs text-slate-500 font-medium">Lớp học phân công:</div>
                <div className="text-base font-black text-slate-800 flex items-center gap-2">
                  <span>{assigningClass.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    {assigningClass.roomName || 'Phòng học'}
                  </span>
                </div>
              </div>

              {/* Vai trò */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vai trò phân công <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="radio"
                      value="HOMEROOM"
                      {...registerAssign('role')}
                      className="text-[#1E4D40] focus:ring-[#78C2AD]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Giáo viên Chủ nhiệm</div>
                      <div className="text-[10px] text-slate-500">Duy nhất 01 GV/lớp (BR-008)</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="radio"
                      value="ASSISTANT"
                      {...registerAssign('role')}
                      className="text-[#1E4D40] focus:ring-[#78C2AD]"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Giáo viên Phụ tá</div>
                      <div className="text-[10px] text-slate-500">Hỗ trợ chăm sóc trẻ</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Chọn giáo viên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Giáo viên từ danh sách nhân sự <span className="text-rose-500">*</span>
                </label>
                <select
                  {...registerAssign('teacherId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                >
                  <option value="">-- Chọn giáo viên --</option>
                  {availableTeachers.map((t) => {
                    const isLocked = t.status !== 'ACTIVE';
                    const hasConflict = t.isAssignedHomeroom;
                    return (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={isLocked}
                      >
                        {t.fullName} ({t.staffCode || 'GV'}) - Trạng thái: {t.status}
                        {hasConflict ? ` [Đã làm GVCN: ${t.currentHomeroomClassName}]` : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tài khoản bị tạm khóa (MSG-019) hoặc đã làm GVCN lớp khác (MSG-031) sẽ bị hệ thống cảnh báo và từ chối.
                </p>
                {assignErrors.teacherId?.message && (
                  <p className="text-xs text-rose-500 mt-1">{assignErrors.teacherId.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssigningClass(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs min-h-[44px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={draftAssignmentMutation.isPending}
                  className="flex-1 py-2.5 bg-[#1E4D40] text-white font-bold rounded-xl hover:bg-[#16382f] transition text-xs flex justify-center items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {draftAssignmentMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Lưu Dự Thảo (MSG-030)'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL G3-UC-12: XÁC NHẬN ĐÓNG & LƯU TRỮ HỒ SƠ LỚP HỌC (BR-010, MSG-043, MSG-044) */}
      {archivingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-purple-950">
              <div className="h-10 w-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Đóng & Lưu Trữ Hồ Sơ Lớp Học</h3>
                <p className="text-xs text-slate-500">Nghiệp vụ G3-UC-12 & Quy tắc BR-010</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div>Lớp học: <span className="font-bold text-slate-900">{archivingClass.name}</span> ({archivingClass.code})</div>
                <div>Khối lớp: <span className="font-semibold">{GRADE_LABELS[archivingClass.gradeLevel] || archivingClass.gradeLevel}</span></div>
                <div>Sĩ số hiện diện: <span className={`font-extrabold ${archivingClass.currentEnrollment > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{archivingClass.currentEnrollment} học sinh</span></div>
              </div>

              {archivingClass.currentEnrollment > 0 ? (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs leading-relaxed flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cảnh báo vi phạm BR-010:</span> Lớp học hiện vẫn còn <strong>{archivingClass.currentEnrollment} học sinh</strong> đang liên kết.
                    Theo quy định, chỉ được đóng sổ lưu trữ khi toàn bộ học sinh đã hoàn tất kết chuyển hoặc ra trường (sĩ số = 0).
                    <p className="font-bold text-rose-700 mt-1">Mã lỗi: MSG-044</p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed flex items-start gap-2.5">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Đủ điều kiện lưu trữ:</span> Sĩ số lớp là 0 học sinh. Sau khi đóng, hồ sơ lớp học sẽ chuyển sang trạng thái <strong>Chỉ đọc (Bất biến)</strong>.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setArchivingClass(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => archiveClassMutation.mutate(archivingClass.id)}
                  disabled={archiveClassMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm transition-all"
                >
                  {archiveClassMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác Nhận Đóng Hồ Sơ Lớp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagementTab;