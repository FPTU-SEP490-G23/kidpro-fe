import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import teachingAssignmentApi, { TeachingAssignmentItem } from '../../api/teachingAssignmentApi';
import { useToast } from '../../contexts/ToastContext';
import {
  UserCheck,
  CheckCircle2,
  CheckCheck,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  School,
  GraduationCap,
  RefreshCw,
  Filter,
  X,
  Star,
  Users,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface ClassAssignmentGroup {
  classId: string;
  className: string;
  gradeLevel: string;
  homeroom?: TeachingAssignmentItem;
  assistant?: TeachingAssignmentItem;
  otherAssignments: TeachingAssignmentItem[];
  allAssignments: TeachingAssignmentItem[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

const GRADE_NAME_MAP: Record<string, string> = {
  INFANT: 'Khối Nhũ',
  TODDLER: 'Khối Hạt',
  NURSERY: 'Khối Mầm',
  KINDERGARTEN: 'Khối Chồi',
  PRE_K: 'Khối Lá',
};

export const BghTeachingAssignmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [rejectingClass, setRejectingClass] = useState<ClassAssignmentGroup | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch approvals list from backend
  const { data: assignments = [], isLoading, isFetching, refetch } = useQuery<TeachingAssignmentItem[]>({
    queryKey: ['teaching-assignment-approvals-bgh', statusFilter],
    queryFn: () => teachingAssignmentApi.getApprovals('ALL'), // lấy toàn bộ để gom theo lớp chính xác
  });

  // Gom nhóm phân công theo từng Lớp học
  const classGroups: ClassAssignmentGroup[] = useMemo(() => {
    const map = new Map<string, ClassAssignmentGroup>();

    assignments.forEach((item) => {
      const key = item.classId || item.className;
      if (!map.has(key)) {
        map.set(key, {
          classId: item.classId || key,
          className: item.className,
          gradeLevel: item.gradeLevel || '',
          otherAssignments: [],
          allAssignments: [],
          status: 'PENDING',
        });
      }

      const group = map.get(key)!;
      group.allAssignments.push(item);

      if (item.isHeadTeacher) {
        group.homeroom = item;
      } else {
        if (!group.assistant) {
          group.assistant = item;
        } else {
          group.otherAssignments.push(item);
        }
      }

      if (item.gradeLevel && !group.gradeLevel) {
        group.gradeLevel = item.gradeLevel;
      }
      if (item.rejectionReason) {
        group.rejectionReason = item.rejectionReason;
      }
    });

    // Xác định trạng thái tổng thể của lớp
    const result: ClassAssignmentGroup[] = [];
    map.forEach((group) => {
      const hasRejected = group.allAssignments.some((a) => a.status === 'REJECTED');
      const allApproved = group.allAssignments.length > 0 && group.allAssignments.every((a) => a.status === 'APPROVED');

      if (hasRejected) {
        group.status = 'REJECTED';
      } else if (allApproved) {
        group.status = 'APPROVED';
      } else {
        group.status = 'PENDING';
      }

      result.push(group);
    });

    // Sắp xếp theo tên lớp
    return result.sort((a, b) => a.className.localeCompare(b.className, 'vi'));
  }, [assignments]);

  // Lọc theo bộ lọc trạng thái
  const filteredClassGroups = useMemo(() => {
    if (statusFilter === 'ALL') return classGroups;
    return classGroups.filter((g) => g.status === statusFilter);
  }, [classGroups, statusFilter]);

  // Approve Class Mutation (Phê duyệt cho cả lớp: duyệt đồng thời GVCN và Phụ tá)
  const approveClassMutation = useMutation({
    mutationFn: async (group: ClassAssignmentGroup) => {
      if (group.classId) {
        try {
          return await teachingAssignmentApi.approveClassAssignments(group.classId);
        } catch {
          // Fallback nếu cần
          for (const a of group.allAssignments) {
            await teachingAssignmentApi.approveAssignment(a.assignmentId);
          }
          return { message: 'Đã phê duyệt thành công' };
        }
      } else {
        for (const a of group.allAssignments) {
          await teachingAssignmentApi.approveAssignment(a.assignmentId);
        }
        return { message: 'Đã phê duyệt thành công' };
      }
    },
    onSuccess: (_, group) => {
      queryClient.invalidateQueries({ queryKey: ['teaching-assignment-approvals-bgh'] });
      success(`Đã phê duyệt thành công toàn bộ phân công (cả GVCN và Phụ tá) cho lớp ${group.className}.`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể phê duyệt phân công lớp học';
      error(msg);
    },
  });

  // Reject Class Mutation
  const rejectClassMutation = useMutation({
    mutationFn: async ({ group, reason }: { group: ClassAssignmentGroup; reason: string }) => {
      if (group.classId) {
        try {
          return await teachingAssignmentApi.rejectClassAssignments(group.classId, reason);
        } catch {
          for (const a of group.allAssignments) {
            await teachingAssignmentApi.rejectAssignment(a.assignmentId, reason);
          }
          return { message: 'Đã từ chối thành công' };
        }
      } else {
        for (const a of group.allAssignments) {
          await teachingAssignmentApi.rejectAssignment(a.assignmentId, reason);
        }
        return { message: 'Đã từ chối thành công' };
      }
    },
    onSuccess: (_, { group }) => {
      queryClient.invalidateQueries({ queryKey: ['teaching-assignment-approvals-bgh'] });
      success(`Đã từ chối phân công giảng dạy của lớp ${group.className}.`);
      closeRejectModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể từ chối bản phân công';
      setValidationError(msg);
      error(msg);
    },
  });

  // Reset Class Mutation
  const resetClassMutation = useMutation({
    mutationFn: async (group: ClassAssignmentGroup) => {
      if (group.classId) {
        try {
          return await teachingAssignmentApi.resetPendingClassAssignments(group.classId);
        } catch {
          for (const a of group.allAssignments) {
            await teachingAssignmentApi.resetPendingAssignment(a.assignmentId);
          }
          return { message: 'Đã khôi phục thành công' };
        }
      } else {
        for (const a of group.allAssignments) {
          await teachingAssignmentApi.resetPendingAssignment(a.assignmentId);
        }
        return { message: 'Đã khôi phục thành công' };
      }
    },
    onSuccess: (_, group) => {
      queryClient.invalidateQueries({ queryKey: ['teaching-assignment-approvals-bgh'] });
      success(`Đã khôi phục phân công lớp ${group.className} về trạng thái Chờ phê duyệt (PENDING) thành công.`);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể khôi phục trạng thái phân công');
    },
  });

  const openRejectModal = (group: ClassAssignmentGroup) => {
    setRejectingClass(group);
    setRejectionReason('');
    setValidationError('');
  };

  const closeRejectModal = () => {
    setRejectingClass(null);
    setRejectionReason('');
    setValidationError('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setValidationError('Vui lòng nhập lý do từ chối/yêu cầu điều chỉnh. Nội dung này không được phép để trống.');
      return;
    }
    if (!rejectingClass) return;
    rejectClassMutation.mutate({ group: rejectingClass, reason: rejectionReason.trim() });
  };

  // Số lượng lớp đang chờ duyệt và đủ điều kiện (có đủ GVCN và Phụ tá)
  const pendingEligibleCount = useMemo(() => {
    return classGroups.filter((g) => g.status === 'PENDING' && g.homeroom && g.assistant).length;
  }, [classGroups]);

  // Mutation: Phê duyệt tất cả các lớp đủ điều kiện
  const approveAllMutation = useMutation({
    mutationFn: async () => {
      try {
        return await teachingAssignmentApi.approveAllAssignments();
      } catch {
        // Fallback duyệt từng lớp
        const eligiblePending = classGroups.filter(
          (g) => g.status === 'PENDING' && g.homeroom && g.assistant
        );
        let count = 0;
        for (const g of eligiblePending) {
          await teachingAssignmentApi.approveClassAssignments(g.classId);
          count++;
        }
        return { message: 'Đã phê duyệt thành công', approvedCount: count };
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['teaching-assignment-approvals-bgh'] });
      const count = data?.approvedCount ?? pendingEligibleCount;
      success(`Đã phê duyệt thành công tất cả các lớp học đủ điều kiện (${count} lớp).`);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Không thể phê duyệt tất cả các lớp.');
    },
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt Phân Công Giảng Dạy Theo Lớp</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Thẩm định và ký duyệt danh sách nhân sự giảng dạy theo từng nhóm lớp. Lớp học bắt buộc phải phân công đủ cả Giáo viên Chủ nhiệm (GVCN) và Giáo viên Phụ tá thì BGH mới phê duyệt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => approveAllMutation.mutate()}
            disabled={approveAllMutation.isPending || pendingEligibleCount === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#E5A93C] hover:bg-[#d6982b] text-slate-900 font-bold px-4 py-2.5 text-sm backdrop-blur-md transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title={pendingEligibleCount === 0 ? "Hiện không có lớp nào chờ duyệt đủ điều kiện (cần đủ cả GVCN và Phụ tá)" : "Phê duyệt tất cả các lớp học đang chờ duyệt đủ điều kiện"}
          >
            <CheckCheck className={`w-4 h-4 ${approveAllMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Phê duyệt tất cả ({pendingEligibleCount})</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-[#275A4E]" />
          <span>Lọc danh sách phân công theo lớp:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'PENDING' as const, label: 'Chờ phê duyệt (PENDING)' },
            { id: 'APPROVED' as const, label: 'Đã phê duyệt (APPROVED)' },
            { id: 'REJECTED' as const, label: 'Bị từ chối (REJECTED)' },
            { id: 'ALL' as const, label: 'Tất cả các lớp' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Danh Sách Phân Công Theo Lớp Học */}
      {filteredClassGroups.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <School className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Không có lớp học nào phù hợp bộ lọc</p>
          <p className="text-xs mt-1">Cán bộ Giáo vụ sẽ thiết lập phân công giảng dạy cho các lớp học</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassGroups.map((group) => {
            const isApproved = group.status === 'APPROVED';
            const isRejected = group.status === 'REJECTED';
            const isPending = group.status === 'PENDING';

            const hasHomeroom = Boolean(group.homeroom);
            const hasAssistant = Boolean(group.assistant);
            const isEligible = hasHomeroom && hasAssistant;

            const missingText = !hasHomeroom && !hasAssistant
              ? 'cả Giáo viên Chủ nhiệm (GVCN) và Phụ tá'
              : !hasHomeroom
              ? 'Giáo viên Chủ nhiệm (GVCN)'
              : 'Giáo viên Phụ tá';

            const gradeDisplay = GRADE_NAME_MAP[group.gradeLevel] || group.gradeLevel || 'Mầm non';

            return (
              <div
                key={group.classId}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Class Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                        <School className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                          {group.className}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
                          {gradeDisplay}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ DUYỆT</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>TỪ CHỐI</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          <span>CHỜ DUYỆT</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chi tiết 2 vai trò: GVCN và Phụ tá */}
                  <div className="space-y-3 mt-4">
                    {/* GVCN */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Giáo Viên Chủ Nhiệm (GVCN)</span>
                        </span>
                        {group.homeroom && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            group.homeroom.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : group.homeroom.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {group.homeroom.status === 'APPROVED' ? 'Đã duyệt' : group.homeroom.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                          </span>
                        )}
                      </div>

                      {group.homeroom ? (
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {group.homeroom.teacherName}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Mã GV: <span className="font-semibold text-slate-800">{group.homeroom.staffCode || 'N/A'}</span> • {group.homeroom.qualification || 'Cử nhân GD Mầm non'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Chưa phân công Giáo viên Chủ nhiệm</span>
                        </p>
                      )}
                    </div>

                    {/* Giáo Viên Phụ Tá */}
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#275A4E] flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#275A4E]" />
                          <span>Giáo Viên Phụ Tá (Bảo mẫu)</span>
                        </span>
                        {group.assistant && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            group.assistant.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : group.assistant.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {group.assistant.status === 'APPROVED' ? 'Đã duyệt' : group.assistant.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                          </span>
                        )}
                      </div>

                      {group.assistant ? (
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {group.assistant.teacherName}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Mã GV: <span className="font-semibold text-slate-800">{group.assistant.staffCode || 'N/A'}</span> • {group.assistant.qualification || 'Giáo viên Mầm non'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Chưa phân công Giáo viên Phụ tá</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cảnh báo chưa đủ điều kiện duyệt */}
                  {!isEligible && !isApproved && (
                    <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Chưa đủ điều kiện duyệt:</span> Lớp học còn thiếu {missingText}.
                        Cần phân công đủ cả GVCN và Phụ tá để phê duyệt.
                      </div>
                    </div>
                  )}

                  {/* Lý do từ chối nếu có */}
                  {isRejected && group.rejectionReason && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Lý do từ chối:</strong> {group.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Footer Thao Tác Theo Lớp */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {!isApproved && (
                    <button
                      type="button"
                      disabled={!isEligible || approveClassMutation.isPending}
                      onClick={() => {
                        if (!isEligible) {
                          error(`Không thể phê duyệt: Lớp '${group.className}' hiện còn thiếu ${missingText}. Cần phân công đủ cả GVCN và Phụ tá.`);
                          return;
                        }
                        approveClassMutation.mutate(group);
                      }}
                      title={!isEligible ? 'Lớp chưa đủ GVCN và Phụ tá' : `Phê duyệt phân công cho cả lớp ${group.className}`}
                      className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                        !isEligible
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-[#275A4E] hover:bg-[#1E4D40] active:scale-95'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{approveClassMutation.isPending ? 'Đang duyệt...' : 'Phê duyệt cả lớp'}</span>
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => openRejectModal(group)}
                      className="px-3.5 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Từ chối
                    </button>
                  )}

                  {/* Khôi phục Chờ duyệt */}
                  {(isApproved || isRejected) && (
                    <button
                      type="button"
                      onClick={() => resetClassMutation.mutate(group)}
                      disabled={resetClassMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục chờ duyệt</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Từ Chối Phân Công Của Lớp */}
      {rejectingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Từ Chối Phân Công Lớp {rejectingClass.className}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {GRADE_NAME_MAP[rejectingClass.gradeLevel] || rejectingClass.gradeLevel || 'Mầm non'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do từ chối / Chỉ đạo điều chỉnh nhân sự <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  rows={4}
                  placeholder="Nhập lý do cụ thể gửi Cán bộ Giáo vụ (VD: Giáo viên chưa đủ điều kiện thâm niên, cần đổi phụ tá sang lớp khác...)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                {validationError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={rejectClassMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {rejectClassMutation.isPending ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghTeachingAssignmentsPage;
