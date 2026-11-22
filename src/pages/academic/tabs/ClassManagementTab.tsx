import React, { useState, useEffect, useMemo } from 'react';
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
  Eye,
  Send,
  Undo2,
  Trash2,
} from 'lucide-react';
import { classService } from '../../../services/classService';
import { assignmentService } from '../../../services/assignmentService';
import { academicYearApi } from '../../../api/academicYearApi';
import { facilityClassroomApi, FacilityClassroom } from '../../../api/facilityClassroomApi';
import schoolSetupApi, { SchoolSetupDto } from '../../../api/schoolSetupApi';
import { useToast } from '../../../contexts/ToastContext';
import { formatAcademicYear } from '../../../utils/formatters';
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

// Cập nhật thông tin lớp học
const updateClassSchema = z.object({
  name: z.string().min(2, 'Tên lớp học phải có ít nhất 2 ký tự').max(50, 'Tên lớp tối đa 50 ký tự'),
  roomId: z.string().optional(),
  maxCapacity: z.number().min(10, 'Sĩ số tối thiểu là 10 trẻ').max(50, 'Sĩ số tối đa là 50 trẻ'),
});
type UpdateClassFormValues = z.infer<typeof updateClassSchema>;

// Lập kế hoạch mở lớp mới
const createProposalSchema = z.object({
  className: z.string().min(2, 'Tên lớp học phải có ít nhất 2 ký tự').max(50, 'Tên lớp tối đa 50 ký tự'),
  gradeLevel: z.enum(['INFANT', 'TODDLER', 'NURSERY', 'KINDERGARTEN', 'PRE_K']),
  academicYearId: z.string().min(1, 'Vui lòng chọn niên khóa năm học'),
  proposedCapacity: z.number().min(10, 'Sĩ số dự kiến tối thiểu là 10').max(40, 'Sĩ số dự kiến không quá 40'),
  proposedRoomId: z.string().optional(),
});
type CreateProposalFormValues = z.infer<typeof createProposalSchema>;

// Dự thảo phân công giáo viên
const draftAssignmentSchema = z.object({
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  teacherId: z.string().min(1, 'Vui lòng chọn giáo viên'),
  role: z.enum(['HOMEROOM', 'ASSISTANT']),
});
type DraftAssignmentFormValues = z.infer<typeof draftAssignmentSchema>;

const GRADE_LABELS: Record<GradeLevel, string> = {
  INFANT: 'Nhũ Nhi',
  TODDLER: 'Khối Hạt',
  NURSERY: 'Khối Mầm',
  KINDERGARTEN: 'Khối Chồi',
  PRE_K: 'Khối Lá',
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

  // Chế độ hiển thị lớp học (Đang hoạt động vs Đã lưu trữ)
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

  // Danh sách lớp học
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
  const activeClasses = useMemo(() => {
    return classesList.filter((c) => c.status !== 'ARCHIVED');
  }, [classesList]);

  // Danh sách lớp đã lưu trữ theo niên khóa
  const {
    data: archivedClasses = [],
    isLoading: isLoadingArchived,
  } = useQuery<ClassSummary[]>({
    queryKey: ['archived-classes', selectedYearId],
    queryFn: () => classService.getArchivedClasses(selectedYearId !== 'ALL' ? selectedYearId : undefined),
  });

  // Filtered classes list
  const classesToDisplay: ClassSummary[] = classFilterMode === 'ARCHIVED' ? archivedClasses : activeClasses;
  const filteredClasses: ClassSummary[] = classesToDisplay.filter((c: ClassSummary) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      c.name.toLowerCase().includes(kw) ||
      (c.code && c.code.toLowerCase().includes(kw)) ||
      (c.roomName && c.roomName.toLowerCase().includes(kw)) ||
      (c.homeroomTeacherName && c.homeroomTeacherName.toLowerCase().includes(kw))
    );
  });

  // Đóng & Lưu trữ hồ sơ lớp học
  const archiveClassMutation = useMutation({
    mutationFn: (classId: string) => classService.archiveClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['archived-classes'] });
      success('Lưu trữ hồ sơ lớp học thành công.');
      setArchivingClass(null);
      // Tự động chuyển view sang tab Đã lưu trữ
      setClassFilterMode('ARCHIVED');
      const newParams = new URLSearchParams(searchParams);
      newParams.set('subtab', 'archive');
      setSearchParams(newParams);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-044' || msg?.includes('MSG-044') || msg?.includes('chưa đủ điều kiện')) {
        error('Lớp học chưa đủ điều kiện đóng hồ sơ do còn học sinh chưa được xử lý kết chuyển hoặc chuyển trường.');
      } else {
        error(msg || 'Lỗi khi đóng và lưu trữ hồ sơ lớp học.');
      }
    },
  });

  // Danh sách đề xuất mở lớp
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

  // Danh sách giáo viên khả dụng
  const { data: availableTeachers = [] } = useQuery({
    queryKey: ['available-teachers', selectedYearId],
    queryFn: () =>
      assignmentService.getAvailableTeachers(
        selectedYearId !== 'ALL' ? selectedYearId : undefined
      ),
  });

  // Kiểm tra trạng thái đề xuất đợt mở lớp
  const hasPendingProposals = useMemo(() => {
    return proposals.some(p => p.status === 'PENDING_APPROVAL');
  }, [proposals]);

  const hasApprovedProposals = useMemo(() => {
    return proposals.length > 0 && proposals.every(p => p.status === 'APPROVED');
  }, [proposals]);

  const hasRejectedProposals = useMemo(() => {
    return proposals.some(p => p.status === 'REJECTED');
  }, [proposals]);

  // Gửi toàn bộ kế hoạch mở lớp cho BGH phê duyệt
  const submitAllProposalsMutation = useMutation({
    mutationFn: () => classService.submitAllProposals(selectedYearId !== 'ALL' ? selectedYearId : undefined),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'Đã gửi toàn bộ danh sách lớp học cho Ban Giám hiệu phê duyệt.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi khi gửi duyệt kế hoạch mở lớp.');
    }
  });

  // Thu hồi duyệt để chỉnh sửa hoặc tạo thêm lớp
  const recallAllProposalsMutation = useMutation({
    mutationFn: () => classService.recallAllProposals(selectedYearId !== 'ALL' ? selectedYearId : undefined),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'Đã thu hồi kế hoạch mở lớp về trạng thái dự thảo để chỉnh sửa.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi khi thu hồi kế hoạch mở lớp.');
    }
  });

  // State xem chi tiết phân công dự thảo
  const [viewingAssignmentClass, setViewingAssignmentClass] = useState<ClassSummary | null>(null);

  // Fetch chi tiết phân công khi mở modal xem chi tiết
  const { data: classAssignments = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['class-assignments-detail', viewingAssignmentClass?.id],
    queryFn: () => viewingAssignmentClass ? assignmentService.getAssignmentsByClass(viewingAssignmentClass.id) : [],
    enabled: !!viewingAssignmentClass
  });

  // Fetch phân công hiện tại của lớp đang được phân công để chặn trùng vai trò
  const { data: assigningClassAssignments = [] } = useQuery({
    queryKey: ['class-assignments-for-assigning', assigningClass?.id],
    queryFn: () => assigningClass ? assignmentService.getAssignmentsByClass(assigningClass.id) : [],
    enabled: !!assigningClass
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
    watch: watchProposal,
  } = useForm<CreateProposalFormValues>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      gradeLevel: 'INFANT',
      proposedCapacity: 25,
    },
  });

  const proposalAcademicYearId = watchProposal('academicYearId');
  const proposalGradeLevel = watchProposal('gradeLevel');
  const proposalRoomId = watchProposal('proposedRoomId');
  const proposalCapacity = watchProposal('proposedCapacity');

  // Kiểm tra giới hạn sức chứa của phòng học dự kiến so với sĩ số đề xuất
  const selectedProposalRoom = useMemo(() => {
    if (!proposalRoomId) return null;
    return classrooms.find((r) => r.classroomId === proposalRoomId) || null;
  }, [proposalRoomId, classrooms]);

  const isProposalRoomCapacityExceeded = useMemo(() => {
    if (!selectedProposalRoom || !selectedProposalRoom.capacity || !proposalCapacity) return false;
    return proposalCapacity > selectedProposalRoom.capacity;
  }, [selectedProposalRoom, proposalCapacity]);

  // Lấy danh sách cấu hình chỉ tiêu các khối từ bảng school_setup theo năm học chọn trong modal đề xuất
  const { data: proposalYearSetups = [] } = useQuery<SchoolSetupDto[]>({
    queryKey: ['school-setups-proposal', proposalAcademicYearId],
    queryFn: () => schoolSetupApi.getSetupsByYear(proposalAcademicYearId),
    enabled: !!proposalAcademicYearId,
  });

  const ALL_PROPOSAL_GRADES: { gradeLevel: GradeLevel; label: string }[] = useMemo(
    () => [
      { gradeLevel: 'INFANT', label: 'Nhũ Nhi' },
      { gradeLevel: 'TODDLER', label: 'Khối Hạt' },
      { gradeLevel: 'NURSERY', label: 'Khối Mầm' },
      { gradeLevel: 'KINDERGARTEN', label: 'Khối Chồi' },
      { gradeLevel: 'PRE_K', label: 'Khối Lá' },
    ],
    []
  );

  const proposalGradeOptions = useMemo(() => {
    if (proposalYearSetups && proposalYearSetups.length > 0) {
      return ALL_PROPOSAL_GRADES.filter((g) =>
        proposalYearSetups.some((s) => s.gradeLevel === g.gradeLevel)
      );
    }
    return ALL_PROPOSAL_GRADES;
  }, [proposalYearSetups, ALL_PROPOSAL_GRADES]);

  // Tự động gán sĩ số dự kiến từ bảng school_setup khi chọn khối hoặc năm học
  useEffect(() => {
    if (!isProposalModalOpen || editingProposal) return;
    if (proposalGradeLevel && proposalYearSetups.length > 0) {
      const matched = proposalYearSetups.find((s) => s.gradeLevel === proposalGradeLevel);
      if (matched && matched.studentsPerClass) {
        setProposalValue('proposedCapacity', matched.studentsPerClass);
      }
    }
  }, [proposalGradeLevel, proposalYearSetups, isProposalModalOpen, editingProposal, setProposalValue]);

  // Tự động chọn khối đầu tiên nếu khối hiện tại không có trong danh sách của năm học
  useEffect(() => {
    if (!isProposalModalOpen || editingProposal) return;
    if (proposalGradeOptions.length > 0) {
      const exists = proposalGradeOptions.some((g) => g.gradeLevel === proposalGradeLevel);
      if (!exists) {
        setProposalValue('gradeLevel', proposalGradeOptions[0].gradeLevel);
      }
    }
  }, [proposalGradeOptions, proposalGradeLevel, isProposalModalOpen, editingProposal, setProposalValue]);

  // Tính tổng số lớp hiện có của khối đang chọn trong modal đề xuất mở lớp
  const gradeClassQuotaInfo = useMemo(() => {
    if (!proposalGradeLevel) return null;
    const targetYearId = proposalAcademicYearId || (selectedYearId !== 'ALL' ? selectedYearId : '');
    const setup = proposalYearSetups.find((s) => s.gradeLevel === proposalGradeLevel);
    if (!setup) return null;

    const inClasses = classesToDisplay.filter((c) => {
      if (editingProposal && c.id === editingProposal.id) return false;
      const sameGrade = c.gradeLevel === proposalGradeLevel;
      const sameYear = !c.academicYearId || !targetYearId || targetYearId === 'ALL' || c.academicYearId === targetYearId;
      return sameGrade && sameYear && c.status !== 'ARCHIVED';
    }).length;

    const inProposals = proposals.filter((p) => {
      if (editingProposal && p.id === editingProposal.id) return false;
      const sameGrade = p.gradeLevel === proposalGradeLevel;
      const sameYear = !p.academicYearId || !targetYearId || targetYearId === 'ALL' || p.academicYearId === targetYearId;
      return sameGrade && sameYear && p.status !== 'REJECTED';
    }).length;

    const currentCount = inClasses + inProposals;
    const maxClasses = setup.totalClasses || 0;
    const isFull = currentCount >= maxClasses;

    return {
      currentCount,
      maxClasses,
      isFull,
      studentsPerClass: setup.studentsPerClass,
    };
  }, [proposalGradeLevel, proposalAcademicYearId, selectedYearId, proposalYearSetups, classesToDisplay, proposals, editingProposal]);

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

  // Cập nhật thông tin lớp
  const updateClassMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      classService.updateClass(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'Cập nhật thông tin lớp học thành công.');
      setEditingClass(null);
      resetEdit();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-025' || msg?.includes('MSG-025') || msg?.includes('Phòng học đã được phân bổ')) {
        error('Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi cập nhật thông tin lớp học.');
      }
    },
  });

  // Tạo kế hoạch mở lớp mới
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
          'Lập kế hoạch mở lớp học mới thành công (Đã lưu dạng Dự thảo).'
      );
      setIsProposalModalOpen(false);
      resetProposal();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-004' || msg?.includes('MSG-004') || msg?.includes('Tên lớp học đã tồn tại')) {
        error('Tên lớp học đã tồn tại trong cùng khối lớp.');
      } else if (code === 'MSG-025' || msg?.includes('MSG-025') || msg?.includes('Phòng học đã được phân bổ')) {
        error('Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else if (code === 'MSG-035' || msg?.includes('MSG-035') || msg?.includes('sức chứa')) {
        error(msg || 'Sĩ số dự kiến vượt quá giới hạn sức chứa của phòng học.');
      } else {
        error(msg || 'Lỗi khi lập kế hoạch mở lớp mới.');
      }
    },
  });

  // Cập nhật kế hoạch mở lớp
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
        error('Tên lớp học đã tồn tại trong cùng khối lớp.');
      } else if (code === 'MSG-025' || msg?.includes('MSG-025')) {
        error('Phòng học đã được phân bổ cho lớp khác trong cùng năm học.');
      } else if (code === 'MSG-035' || msg?.includes('MSG-035') || msg?.includes('sức chứa')) {
        error(msg || 'Sĩ số dự kiến vượt quá giới hạn sức chứa của phòng học.');
      } else {
        error(msg || 'Lỗi cập nhật kế hoạch mở lớp.');
      }
    },
  });

  // Gửi đề xuất kế hoạch mở lớp cho Ban Giám hiệu phê duyệt
  const submitProposalMutation = useMutation({
    mutationFn: (id: string) => classService.submitProposal(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      success(res?.message || 'Đã gửi kế hoạch mở lớp cho Ban Giám hiệu phê duyệt thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi gửi kế hoạch mở lớp cho BGH.');
    },
  });

  // Xóa kế hoạch mở lớp khi giáo vụ add thừa lớp (ở trạng thái PENDING hoặc REJECTED)
  const deleteProposalMutation = useMutation({
    mutationFn: (id: string) => classService.deleteProposal(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['class-proposals'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success(res?.message || 'Đã xóa kế hoạch mở lớp thừa thành công.');
      setIsProposalModalOpen(false);
      setEditingProposal(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Không thể xóa kế hoạch mở lớp.');
    },
  });

  const handleDeleteProposal = (proposal: ClassProposalResponse) => {
    if (proposal.status === 'PENDING_APPROVAL') {
      error('Kế hoạch mở lớp đang trong đợt gửi Ban Giám hiệu phê duyệt. Vui lòng nhấn "Thu Hồi Duyệt" trước khi xóa lớp.');
      return;
    }
    if (proposal.status === 'APPROVED') {
      error('Kế hoạch mở lớp đã được Ban Giám hiệu phê duyệt chính thức. Không thể xóa.');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa kế hoạch mở lớp "${proposal.className}" không? Lớp học này sẽ được gỡ bỏ khỏi đợt kế hoạch.`)) {
      deleteProposalMutation.mutate(proposal.id);
    }
  };
  // Lập dự thảo phân công giáo viên
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
          'Lập dự thảo phân công giáo viên thành công, đang chờ Ban Giám hiệu phê duyệt.'
      );
      setAssigningClass(null);
      resetAssign();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-019' || msg?.includes('MSG-019') || msg?.includes('tạm khóa')) {
        error('Tài khoản giáo viên đang bị tạm khóa.');
      } else if (code === 'MSG-031' || msg?.includes('MSG-031') || msg?.includes('Giáo viên Chủ nhiệm ở lớp khác')) {
        error('Giáo viên đã là Giáo viên Chủ nhiệm ở lớp khác trong cùng năm học.');
      } else {
        error(msg || 'Lỗi lập dự thảo phân công giáo viên.');
      }
    },
  });

  // Xóa bản phân công giáo viên
  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignmentId: number) => assignmentService.deleteAssignment(assignmentId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['class-assignments-detail'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      queryClient.invalidateQueries({ queryKey: ['available-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['class-assignments-for-assigning'] });
      success(res?.message || 'Đã xóa bản phân công giáo viên thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Không thể xóa bản phân công giáo viên.');
    },
  });

  const handleDeleteAssignment = (assignmentId: number, teacherName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa phân công cho giáo viên "${teacherName}" không?`)) {
      deleteAssignmentMutation.mutate(assignmentId);
    }
  };

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
    const targetName = values.name.trim().toLowerCase();
    const duplicateInClasses = classesToDisplay.some((c) => {
      if (c.id === editingClass.id) return false;
      const sameName = c.name.trim().toLowerCase() === targetName;
      const sameGrade = c.gradeLevel === editingClass.gradeLevel;
      const sameYear = !c.academicYearId || !editingClass.academicYearId || c.academicYearId === editingClass.academicYearId;
      return sameName && sameGrade && sameYear;
    });

    if (duplicateInClasses) {
      error(`Tên lớp "${values.name}" đã tồn tại trong cùng khối lớp và niên khóa.`);
      return;
    }

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
    const activeYear = academicYears.find((y: any) => (y.status || '').toUpperCase() === 'ACTIVE' || y.isActive);
    const defaultYearId = selectedYearId !== 'ALL' ? selectedYearId : (activeYear?.id || academicYears[0]?.id || '');
    resetProposal({
      className: '',
      gradeLevel: 'TODDLER',
      academicYearId: defaultYearId,
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
    const targetYearId = values.academicYearId || (editingProposal ? editingProposal.academicYearId : selectedYearId);
    const targetName = values.className.trim().toLowerCase();
    const targetGrade = values.gradeLevel;

    // Kiểm tra trong danh sách lớp hiện có
    const duplicateInClasses = classesToDisplay.some((c) => {
      if (editingProposal && c.id === editingProposal.id) return false;
      const sameName = c.name.trim().toLowerCase() === targetName;
      const sameGrade = c.gradeLevel === targetGrade;
      const sameYear = !c.academicYearId || !targetYearId || targetYearId === 'ALL' || c.academicYearId === targetYearId;
      return sameName && sameGrade && sameYear;
    });

    // Kiểm tra trong danh sách kế hoạch mở lớp đang có
    const duplicateInProposals = proposals.some((p) => {
      if (editingProposal && p.id === editingProposal.id) return false;
      const sameName = p.className.trim().toLowerCase() === targetName;
      const sameGrade = p.gradeLevel === targetGrade;
      const sameYear = !p.academicYearId || !targetYearId || targetYearId === 'ALL' || p.academicYearId === targetYearId;
      return sameName && sameGrade && sameYear;
    });

    if (duplicateInClasses || duplicateInProposals) {
      error(`Tên lớp "${values.className}" đã tồn tại trong cùng khối lớp và niên khóa.`);
      return;
    }

    // Kiểm tra số lượng lớp tối đa của khối theo chỉ tiêu school_setup
    const matchedSetup = proposalYearSetups.find((s) => s.gradeLevel === targetGrade);
    if (matchedSetup && matchedSetup.totalClasses) {
      const classesCount = classesToDisplay.filter((c) => {
        if (editingProposal && c.id === editingProposal.id) return false;
        const sameGrade = c.gradeLevel === targetGrade;
        const sameYear = !c.academicYearId || !targetYearId || targetYearId === 'ALL' || c.academicYearId === targetYearId;
        return sameGrade && sameYear && c.status !== 'ARCHIVED';
      }).length;

      const proposalsCount = proposals.filter((p) => {
        if (editingProposal && p.id === editingProposal.id) return false;
        const sameGrade = p.gradeLevel === targetGrade;
        const sameYear = !p.academicYearId || !targetYearId || targetYearId === 'ALL' || p.academicYearId === targetYearId;
        return sameGrade && sameYear && p.status !== 'REJECTED';
      }).length;

      const totalCurrent = classesCount + proposalsCount;
      if (totalCurrent >= matchedSetup.totalClasses) {
        error(`Khối ${GRADE_LABELS[targetGrade]} đã đạt số lượng lớp tối đa (${totalCurrent}/${matchedSetup.totalClasses} lớp) theo chỉ tiêu của Ban Giám Hiệu. Không thể tạo thêm lớp.`);
        return;
      }
    }

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

  const currentSelectedYear = academicYears.find((y: any) => y.id === selectedYearId);
  const isSelectedYearReady = currentSelectedYear?.status === 'READY';

  const onOpenAssignModal = (c: ClassSummary) => {
    const classYear = academicYears.find((y: any) => y.id === (c as any).academicYearId || y.id === selectedYearId);
    if (classYear?.status === 'READY') {
      error('Niên khóa đang ở trạng thái Sẵn sàng (READY). Chỉ được phép phân công giáo viên khi Ban Giám hiệu chính thức kích hoạt vận hành (ACTIVE).');
      return;
    }
    setAssigningClass(c);
    setAssignValue('classId', c.id);
    setAssignValue('role', 'HOMEROOM');
    setAssignValue('teacherId', c.homeroomTeacherId || '');
  };

  const onSubmitAssign = (values: DraftAssignmentFormValues) => {
    const isAlreadyInThisClass = assigningClassAssignments.some(
      (a: any) => (a.teacherId === values.teacherId || a.staffId === values.teacherId) && a.status !== 'REJECTED'
    );
    if (isAlreadyInThisClass) {
      error('Giáo viên này đã được phân công trong lớp này. Theo quy định, một giáo viên không thể cùng đảm nhận cả 2 vai trò GVCN và Phụ tá trong cùng một lớp.');
      return;
    }
    draftAssignmentMutation.mutate(values);
  };

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
                {/* ACTIVE VS ARCHIVED TOGGLE */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setClassFilterMode('ACTIVE');
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('subtab', 'classes');
                      setSearchParams(newParams);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      classFilterMode === 'ACTIVE'
                        ? 'bg-white text-emerald-900 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Đang hoạt động ({activeClasses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClassFilterMode('ARCHIVED');
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('subtab', 'archive');
                      setSearchParams(newParams);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
            <div className="flex flex-wrap items-center gap-2">
              {hasApprovedProposals ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-2xl min-h-[44px]">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Kế Hoạch Đã Phê Duyệt (Chỉ Đọc)</span>
                </div>
              ) : hasPendingProposals ? (
                <>
                  <button
                    type="button"
                    onClick={() => recallAllProposalsMutation.mutate()}
                    disabled={recallAllProposalsMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-2xl shadow-sm transition min-h-[44px] cursor-pointer disabled:opacity-50"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span>{recallAllProposalsMutation.isPending ? 'Đang thu hồi...' : 'Thu Hồi Duyệt'}</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    title="Kế hoạch đang trình Ban Giám hiệu phê duyệt. Nhấn 'Thu Hồi Duyệt' nếu muốn thêm hoặc sửa lớp."
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-2xl min-h-[44px] cursor-not-allowed border border-slate-200"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>+ Lập Kế Hoạch Mở Lớp Mới (Đang Chờ Duyệt)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onOpenCreateProposal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#1E4D40] text-white text-sm font-bold rounded-2xl shadow-sm hover:opacity-95 transition min-h-[44px] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#E5A93C]" />
                    <span>+ Lập Kế Hoạch Mở Lớp Mới</span>
                  </button>
                  {proposals.length > 0 && (
                    <button
                      type="button"
                      onClick={() => submitAllProposalsMutation.mutate()}
                      disabled={submitAllProposalsMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-2xl shadow-sm transition min-h-[44px] cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 text-[#78C2AD]" />
                      <span>{submitAllProposalsMutation.isPending ? 'Đang gửi...' : hasRejectedProposals ? 'Gửi Lại Toàn Bộ Lớp Cho BGH Duyệt' : 'Gửi Toàn Bộ Lớp Cho BGH Duyệt'}</span>
                    </button>
                  )}
                </>
              )}
            </div>
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
                const isActive = y.status === 'ACTIVE' || y.isActive;
                return (
                  <option key={yId} value={yId}>
                    {formatAcademicYear(y)} {isActive ? '★ (Hiện tại)' : ''}
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
              <option value="INFANT">Nhũ Nhi</option>
              <option value="TODDLER">Khối Hạt</option>
              <option value="NURSERY">Khối Mầm</option>
              <option value="KINDERGARTEN">Khối Chồi</option>
              <option value="PRE_K">Khối Lá</option>
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
      {/* SUB-TAB 1:  - DANH SÁCH & CẬP NHẬT THÔNG TIN LỚP HỌC        */}
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
              {filteredClasses.map((c: ClassSummary) => {
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
                              {c.gradeLevel ? (GRADE_LABELS[c.gradeLevel as GradeLevel] || c.gradeLevel) : 'Khối lớp'}
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

                        {/* Card Header Tag */}
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
                            onClick={() => {
                              const newParams = new URLSearchParams(searchParams);
                              newParams.set('subtab', 'assignments');
                              setSearchParams(newParams);
                              setActiveSubTab('ASSIGNMENTS');
                            }}
                            className="flex-1 py-2.5 bg-slate-50 hover:bg-[#1E4D40] hover:text-white text-[#1E4D40] text-xs font-bold rounded-xl transition border border-slate-200/80 flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer group"
                            title="Chuyển sang trang Phân công giáo viên"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-[#275A4E] group-hover:text-white" />
                            <span>Phân công GV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchivingClass(c)}
                            className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200 text-xs font-bold rounded-xl transition min-h-[44px] cursor-pointer"
                            title="Đóng & Lưu trữ hồ sơ lớp học"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-center">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-800 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
                            <Lock className="w-3.5 h-3.5 text-purple-600" /> Đã đóng & Lưu trữ (Chỉ đọc)
                          </span>
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
      {/* SUB-TAB 2:  - KẾ HOẠCH MỞ LỚP HỌC MỚI                      */}
      {/* =================================================================== */}
      {activeSubTab === 'PROPOSALS' && (
        <div className="space-y-4">
          {/* Banner khi BGH đã duyệt chính thức toàn bộ kế hoạch */}
          {hasApprovedProposals && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-2xs animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-0.5">
                <p className="font-bold text-sm">Kế hoạch mở lớp đã được Ban Giám hiệu phê duyệt chính thức</p>
                <p>
                  Niên khóa này đã hoàn tất phê duyệt danh sách lớp. Phát hiện sai sót trong khâu chỉnh sửa thì hãy liên hệ riêng với hiệu trưởng để thu hồi phê duyệt.
                </p>
              </div>
            </div>
          )}

          {/* Banner khi BGH từ chối toàn bộ đợt kế hoạch */}
          {hasRejectedProposals && (
            <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-start gap-3 shadow-2xs animate-in fade-in">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900 space-y-0.5">
                <p className="font-bold text-sm">Đợt kế hoạch mở lớp đã bị Ban Giám hiệu từ chối</p>
                <p>
                  Toàn bộ danh sách lớp đã được trả lại để Cán bộ Giáo vụ điều chỉnh. Vui lòng xem lý do cụ thể ở từng lớp bên dưới, nhấn "Sửa kế hoạch" để hoàn thiện và gửi duyệt lại.
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-bold">Quy trình mở lớp chuẩn:</p>
              <p>
                - Giáo vụ tạo toàn bộ danh sách lớp dự thảo, sau đó nhấn "Gửi Toàn Bộ Lớp Cho BGH Duyệt".
                <br />- Khi đang chờ duyệt: Danh sách lớp bị khóa (không sửa/xóa/thêm). Nhấn "Thu Hồi Duyệt" nếu cần điều chỉnh lại.
                <br />- BGH phê duyệt hoặc từ chối tập trung cả đợt kế hoạch. Nếu BGH từ chối, toàn bộ đợt lớp được trả lại cho Giáo vụ.
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
                          {(p.status === 'PENDING_APPROVAL' || p.status === 'PENDING') && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> {p.status === 'PENDING' ? 'Dự thảo (Chưa gửi)' : 'Chờ BGH duyệt'}
                            </span>
                          )}
                          {p.status === 'APPROVED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Đã phê duyệt
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <div>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <XCircle className="w-3 h-3" /> Bị từ chối
                              </span>
                              {p.rejectionReason && (
                                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                                  Lý do: {p.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {p.status === 'PENDING_APPROVAL' ? (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-xs italic">
                              <Lock className="w-3.5 h-3.5" /> Đang chờ duyệt (Khóa)
                            </span>
                          ) : p.status === 'APPROVED' ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-xs">
                              <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt chính thức
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => onOpenEditProposal(p)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-[#1E4D40] hover:text-white text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                                title="Chỉnh sửa thông tin kế hoạch mở lớp"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                              {(p.status === 'PENDING' || p.status === 'REJECTED') && (
                                <button
                                  type="button"
                                  disabled={submitProposalMutation.isPending}
                                  onClick={() => submitProposalMutation.mutate(p.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition inline-flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                                  title="Gửi kế hoạch mở lớp cho Ban Giám hiệu phê duyệt"
                                >
                                  {submitProposalMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                  <span>Gửi BGH</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteProposal(p)}
                                disabled={deleteProposalMutation.isPending}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 border border-rose-200 font-bold rounded-xl transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Xóa kế hoạch mở lớp thừa"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa</span>
                              </button>
                            </div>
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
      {/* SUB-TAB 3:  - PHÂN CÔNG GIÁO VIÊN CHỦ NHIỆM & PHỤ TÁ         */}
      {/* =================================================================== */}
      {activeSubTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          {isSelectedYearReady && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <strong className="block text-sm">Niên khóa đang ở trạng thái Sẵn sàng (READY)</strong>
                Niên khóa này chỉ cho phép giáo vụ mở lớp, tiếp nhận hồ sơ trẻ và kết chuyển đầu năm. Phân công giáo viên tạm thời bị khóa cho đến khi Ban Giám hiệu chính thức kích hoạt vận hành (ACTIVE).
              </div>
            </div>
          )}

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-bold">Quy tắc phân công nhân sự sư phạm:</p>
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
                  {classesList.map((c) => {
                    const isApproved = c.status === 'APPROVED' || c.status === 'ACTIVE';
                    const classYear = academicYears.find((y: any) => y.id === (c as any).academicYearId || y.id === selectedYearId);
                    const isClassYearReady = classYear?.status === 'READY' || isSelectedYearReady;

                    return (
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
                          {c.assignmentStatus === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" /> Đã phân công
                            </span>
                          ) : c.assignmentStatus === 'PENDING_APPROVAL' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Chờ BGH duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              <AlertTriangle className="w-3 h-3" /> Chưa phân công
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingAssignmentClass(c)}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1 min-h-[38px] cursor-pointer"
                              title="Xem chi tiết phân công dự thảo"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Chi tiết</span>
                            </button>

                            {isClassYearReady ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-2 bg-slate-100 text-slate-400 font-bold rounded-xl inline-flex items-center gap-1 min-h-[38px] cursor-not-allowed"
                                title="Năm học ở trạng thái Sẵn sàng (READY). Chưa cho phép phân công giáo viên."
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Khóa phân công</span>
                              </button>
                            ) : isApproved ? (
                              <button
                                type="button"
                                onClick={() => onOpenAssignModal(c)}
                                className="px-3.5 py-2 bg-[#1E4D40] hover:bg-[#16382f] text-white font-bold rounded-xl transition inline-flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-[#78C2AD]" />
                                <span>Phân công GV</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-2 bg-slate-100 text-slate-400 font-bold rounded-xl inline-flex items-center gap-1 min-h-[38px] cursor-not-allowed"
                                title="Lớp học chưa được BGH phê duyệt mở lớp. Cần chờ BGH duyệt trước khi phân công."
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Chờ duyệt</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL CẬP NHẬT THÔNG TIN LỚP HỌC                          */}
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

              {/* Phân bổ phòng học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phòng học phân bổ <span className="text-rose-500">*</span>
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
                        'Lưu Thay Đổi'
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
      {/* MODAL LẬP KẾ HOẠCH MỞ LỚP HỌC MỚI                         */}
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
                  {academicYears
                    .filter((y: any) => (y.status || '').toUpperCase() === 'ACTIVE' || y.isActive === true)
                    .map((y: any) => {
                      const yId = y.id || y.academicYearId;
                      const yName = y.name || y.yearName;
                      const startDate = y.startDate ? new Date(y.startDate).toLocaleDateString('vi-VN') : '';
                      return (
                        <option key={yId} value={yId}>
                          {yName} {startDate ? `(Bắt đầu: ${startDate})` : ''} ★ (Năm hiện tại)
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
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none cursor-pointer"
                >
                  {proposalGradeOptions.map((opt) => {
                    const setup = proposalYearSetups.find((s) => s.gradeLevel === opt.gradeLevel);
                    return (
                      <option key={opt.gradeLevel} value={opt.gradeLevel}>
                        {opt.label} {setup?.totalClasses ? `(Chỉ tiêu BGH: ${setup.totalClasses} lớp)` : ''}
                      </option>
                    );
                  })}
                </select>
                {gradeClassQuotaInfo && (
                  <div
                    className={`mt-2 p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      gradeClassQuotaInfo.isFull
                        ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Tiến độ mở lớp ({GRADE_LABELS[proposalGradeLevel]}):</span>
                    <span className={`font-bold ${gradeClassQuotaInfo.isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {gradeClassQuotaInfo.currentCount} / {gradeClassQuotaInfo.maxClasses} lớp
                      {gradeClassQuotaInfo.isFull
                        ? ' ⚠️ (Đã đạt tối đa chỉ tiêu)'
                        : ` (Còn có thể mở thêm ${gradeClassQuotaInfo.maxClasses - gradeClassQuotaInfo.currentCount} lớp)`}
                    </span>
                  </div>
                )}
                {proposalErrors.gradeLevel?.message && (
                  <p className="text-xs text-rose-500 mt-1">{proposalErrors.gradeLevel.message}</p>
                )}
              </div>

              {/* Tên lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên lớp học đề xuất <span className="text-rose-500">*</span>
                </label>
                <input
                  {...registerProposal('className')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  placeholder="VD: Mầm 2, Chồi 3"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tên lớp không được trùng lặp trong cùng khối lớp và năm học.
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
                  {proposalYearSetups.some((s) => s.gradeLevel === proposalGradeLevel) ? (
                    <span className="text-emerald-600 font-semibold">
                      ✓ Đã tự động áp dụng định mức {proposalYearSetups.find((s) => s.gradeLevel === proposalGradeLevel)?.studentsPerClass} trẻ/lớp từ cấu hình chỉ tiêu của năm học.
                    </span>
                  ) : (
                    'Định mức chuẩn: Khối Nhà trẻ 24 - 26 trẻ, Khối Mẫu giáo 30 - 35 trẻ.'
                  )}
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
                  className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:ring-2 focus:outline-none cursor-pointer ${
                    isProposalRoomCapacityExceeded
                      ? 'border-rose-400 focus:ring-rose-400'
                      : 'border-slate-200 focus:ring-[#78C2AD]'
                  }`}
                >
                  <option value="">-- Chưa chọn phòng học --</option>
                  {classrooms.map((r) => {
                    const roomCap = r.capacity || 30;
                    const isExceeded = Boolean(proposalCapacity && roomCap < proposalCapacity);
                    return (
                      <option key={r.classroomId} value={r.classroomId}>
                        {r.roomName} {r.building ? `(${r.building})` : ''} - Sức chứa: {roomCap} trẻ
                        {isExceeded ? ` ⚠️ (Tối đa ${roomCap} trẻ - Không đủ)` : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Cảnh báo kiểm tra sức chứa phòng học theo BR-011 */}
                {isProposalRoomCapacityExceeded && selectedProposalRoom ? (
                  <div className="mt-2 p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      <strong>Không đủ sức chứa:</strong> Phòng <strong>{selectedProposalRoom.roomName}</strong> chỉ có giới hạn tối đa <strong>{selectedProposalRoom.capacity || 30} học sinh</strong>, không đủ cho sĩ số dự kiến <strong>{proposalCapacity} học sinh</strong> của lớp. Vui lòng chọn phòng khác hoặc điều chỉnh sĩ số.
                    </span>
                  </div>
                ) : selectedProposalRoom ? (
                  <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      Sức chứa phòng {selectedProposalRoom.roomName}: {selectedProposalRoom.capacity || 30} học sinh (Đạt yêu cầu sĩ số {proposalCapacity || 0} học sinh).
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-3">
                {editingProposal && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProposal(editingProposal)}
                    disabled={deleteProposalMutation.isPending}
                    className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition text-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Xóa lớp này</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs min-h-[44px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    createProposalMutation.isPending ||
                    updateProposalMutation.isPending ||
                    (gradeClassQuotaInfo?.isFull && !editingProposal) ||
                    isProposalRoomCapacityExceeded
                  }
                  className="flex-1 py-2.5 bg-[#1E4D40] text-white font-bold rounded-xl hover:bg-[#16382f] transition text-xs flex justify-center items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createProposalMutation.isPending || updateProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : gradeClassQuotaInfo?.isFull && !editingProposal ? (
                    'Khối Đã Đủ Chỉ Tiêu Lớp'
                  ) : isProposalRoomCapacityExceeded ? (
                    'Phòng Học Không Đủ Chỗ'
                  ) : (
                    'Lưu Kế Hoạch (Dự Thảo)'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL LẬP DỰ THẢO PHÂN CÔNG GIÁO VIÊN                     */}
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
                      <div className="text-[10px] text-slate-500">Duy nhất 01 GV/lớp</div>
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
                    const isAlreadyInThisClass = assigningClassAssignments.some(
                      (a: any) => (a.teacherId === t.id || a.staffId === t.id) && a.status !== 'REJECTED'
                    );
                    return (
                      <option
                        key={t.id}
                        value={t.id}
                        disabled={isLocked || isAlreadyInThisClass}
                      >
                        {t.fullName} ({t.staffCode || 'GV'}) - Trạng thái: {t.status}
                        {hasConflict ? ` [Đã làm GVCN: ${t.currentHomeroomClassName}]` : ''}
                        {isAlreadyInThisClass ? ' [⚠️ Đã được phân công trong lớp này]' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Tài khoản bị tạm khóa hoặc đã làm GVCN lớp khác sẽ bị hệ thống cảnh báo và từ chối.
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
                    'Lưu Dự Thảo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN ĐÓNG & LƯU TRỮ HỒ SƠ LỚP HỌC */}
      {archivingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-purple-950">
              <div className="h-10 w-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Đóng & Lưu Trữ Hồ Sơ Lớp Học</h3>
                <p className="text-xs text-slate-500">Quy định đóng và lưu trữ hồ sơ</p>
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
                    <span className="font-bold">Cảnh báo:</span> Lớp học hiện vẫn còn <strong>{archivingClass.currentEnrollment} học sinh</strong> đang liên kết.
                    Theo quy định, chỉ được đóng sổ lưu trữ khi toàn bộ học sinh đã hoàn tất kết chuyển hoặc ra trường (sĩ số = 0).
                    <p className="font-bold text-rose-700 mt-1"></p>
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

      {/* MODAL XEM CHI TIẾT PHÂN CÔNG DỰ THẢO */}
      {viewingAssignmentClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#1E4D40] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#78C2AD]" />
                <div>
                  <h2 className="text-base font-bold">Chi Tiết Phân Công Giáo Viên</h2>
                  <p className="text-xs text-white/80">Lớp: {viewingAssignmentClass.name} ({viewingAssignmentClass.code})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAssignmentClass(null)}
                className="text-white/70 hover:text-white transition cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Khối lớp:</span>{' '}
                  <strong className="text-slate-700">{GRADE_LABELS[viewingAssignmentClass.gradeLevel] || viewingAssignmentClass.gradeLevel}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Phòng học:</span>{' '}
                  <strong className="text-slate-700">{viewingAssignmentClass.roomName || 'Chưa bố trí'}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Sĩ số:</span>{' '}
                  <strong className="text-slate-700">{viewingAssignmentClass.currentEnrollment}/{viewingAssignmentClass.maxCapacity} trẻ</strong>
                </div>
                <div>
                  <span className="text-slate-400">Trạng thái lớp:</span>{' '}
                  <strong className="text-slate-700">
                    {viewingAssignmentClass.status === 'APPROVED' || viewingAssignmentClass.status === 'ACTIVE' ? 'Đã duyệt' : 'Chờ BGH duyệt'}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Danh Sách Giáo Viên Đã Phân Công
                </h4>

                {isLoadingAssignments ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs text-slate-500 mt-2">Đang tải chi tiết phân công...</p>
                  </div>
                ) : classAssignments.length === 0 ? (
                  <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-200 text-center space-y-1">
                    <p className="text-xs font-bold text-amber-800">Chưa có phân công giáo viên nào cho lớp này.</p>
                    <p className="text-[11px] text-amber-600">
                      {viewingAssignmentClass.status === 'APPROVED' || viewingAssignmentClass.status === 'ACTIVE'
                        ? 'Bấm nút "Phân Công Lại / Chỉnh Sửa" bên dưới để tiến hành phân công giáo viên.'
                        : 'Lớp học cần được Ban Giám hiệu phê duyệt mở lớp trước khi có thể phân công giáo viên.'}
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <tr>
                          <th className="py-2.5 px-3">Vai Trò</th>
                          <th className="py-2.5 px-3">Giáo Viên</th>
                          <th className="py-2.5 px-3">Mã GV</th>
                          <th className="py-2.5 px-3">Trạng Thái</th>
                          <th className="py-2.5 px-3 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {classAssignments.map((a: any) => (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-bold text-emerald-800">
                              {a.role === 'HOMEROOM' ? 'Chủ Nhiệm (GVCN)' : 'Phụ Tá'}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                              {a.teacherName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono">
                              {a.staffCode || '-'}
                            </td>
                            <td className="py-2.5 px-3">
                              {a.status === 'APPROVED' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle className="w-3 h-3" /> Đã duyệt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <Clock className="w-3 h-3" /> Dự thảo
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {a.status !== 'APPROVED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssignment(a.id, a.teacherName)}
                                  disabled={deleteAssignmentMutation.isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                                  title="Xóa bản phân công này"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Xóa</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Đã duyệt (bất biến)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setViewingAssignmentClass(null)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition text-xs min-h-[40px] cursor-pointer"
                >
                  Đóng
                </button>
                {(viewingAssignmentClass.status === 'APPROVED' || viewingAssignmentClass.status === 'ACTIVE') && (
                  <button
                    type="button"
                    onClick={() => {
                      const cls = viewingAssignmentClass;
                      setViewingAssignmentClass(null);
                      onOpenAssignModal(cls);
                    }}
                    className="px-4 py-2.5 bg-[#1E4D40] text-white font-bold rounded-xl hover:bg-[#16382f] transition text-xs flex items-center gap-1.5 min-h-[40px] cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#78C2AD]" />
                    <span>Phân Công Lại / Chỉnh Sửa</span>
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

export default ClassManagementTab;