import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  Smartphone,
  Send,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  Baby,
  Copy,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  School,
  Lock,
  Phone,
  Mail,
  UserCheck,
  UserPlus,
  GraduationCap,
  Info,
  ExternalLink,
  Layers
} from 'lucide-react';
import { parentAccountService } from '../../../services/parentAccountService';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../contexts/ToastContext';
import {
  ParentAccountItem,
  LinkedStudentItem,
  RelationshipType,
  ProvisionAccountResponse,
  StudentParentOverviewItem
} from '../../../types/parentAccount.types';

export const ParentAccountManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  // Chế độ xem Tab chính
  const [activeMainView, setActiveMainView] = useState<'STUDENTS_LIST' | 'MULTI_CHILD_ACCOUNTS'>('STUDENTS_LIST');

  // State cho Tab 1: Danh sách học sinh & liên kết phụ huynh
  const [studentSearchKeyword, setStudentSearchKeyword] = useState<string>('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'NO_ACCOUNT' | 'HAS_ACCOUNT'>('ALL');

  // State cho Tab 2: Danh sách tài khoản phụ huynh & Đa con
  const [accountSearchKeyword, setAccountSearchKeyword] = useState<string>('');
  const [accountFilterMode, setAccountFilterMode] = useState<'ALL' | 'MULTI_CHILD'>('ALL');

  // Modals & form cấp tài khoản phụ huynh
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentParentOverviewItem | null>(null);
  const [provisionStudentId, setProvisionStudentId] = useState('');
  const [provisionPhone, setProvisionPhone] = useState('');
  const [provisionFullName, setProvisionFullName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionRelationship, setProvisionRelationship] = useState<RelationshipType>('FATHER');
  const [provisionIsPrimary, setProvisionIsPrimary] = useState(true);
  const [provisionIdCard, setProvisionIdCard] = useState('');
  const [provisionAddress, setProvisionAddress] = useState('');
  const [provisionResult, setProvisionResult] = useState<ProvisionAccountResponse | null>(null);

  // Link child modal
  const [linkingParent, setLinkingParent] = useState<ParentAccountItem | null>(null);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [searchChildKeyword, setSearchChildKeyword] = useState('');
  const [linkRelationship, setLinkRelationship] = useState<RelationshipType>('GUARDIAN');
  const [linkIsPrimary, setLinkIsPrimary] = useState(false);
  const [linkForceConfirm, setLinkForceConfirm] = useState(false);
  const [linkNotes, setLinkNotes] = useState('');

  // Unlink child modal
  const [unlinkingTarget, setUnlinkingTarget] = useState<{ parent: ParentAccountItem; child: LinkedStudentItem } | null>(null);

  // Query Tab 1: Danh sách học sinh và trạng thái phụ huynh
  const {
    data: studentsOverview = [],
    isLoading: isLoadingStudents,
    refetch: refetchStudentsOverview
  } = useQuery<StudentParentOverviewItem[]>({
    queryKey: ['students-parent-overview', studentSearchKeyword, studentFilter],
    queryFn: () => parentAccountService.getStudentsOverview(studentSearchKeyword, studentFilter),
  });

  // Query Tab 2: Danh sách tài khoản phụ huynh
  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts
  } = useQuery<ParentAccountItem[]>({
    queryKey: ['parent-accounts', accountSearchKeyword],
    queryFn: () => parentAccountService.getAccounts(accountSearchKeyword),
  });

  // Query phụ trợ: danh sách học sinh để chọn liên kết con
  const { data: studentsData } = useQuery({
    queryKey: ['students-for-parent-linking'],
    queryFn: () => studentService.getStudents({ size: 100 }),
    enabled: isProvisionModalOpen || !!linkingParent,
  });
  const studentsList = studentsData?.content || [];

  const filteredChildrenToLink = React.useMemo(() => {
    if (!searchChildKeyword.trim()) return studentsList;
    const kw = searchChildKeyword.toLowerCase().trim();
    return studentsList.filter((st: any) =>
      (st.fullName && st.fullName.toLowerCase().includes(kw)) ||
      (st.studentCode && st.studentCode.toLowerCase().includes(kw)) ||
      (st.className && st.className.toLowerCase().includes(kw))
    );
  }, [studentsList, searchChildKeyword]);

  // Thống kê nhanh Tab 1
  const totalStudents = studentsOverview.length;
  const studentsWithAccount = studentsOverview.filter(s => s.hasParentAccount).length;
  const studentsWithoutAccount = studentsOverview.filter(s => !s.hasParentAccount).length;

  // Mutations
  const provisionMutation = useMutation({
    mutationFn: (payload: any) => parentAccountService.provisionAccount(payload),
    onSuccess: (res: ProvisionAccountResponse) => {
      queryClient.invalidateQueries({ queryKey: ['students-parent-overview'] });
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('Cấp tài khoản phụ huynh thành công. Mật khẩu mặc định: 123456789. Đã gửi Gmail và phát notification!');
      setProvisionResult(res);
      setIsProvisionModalOpen(false);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-061' || msg?.includes('MSG-061') || msg?.includes('đăng ký')) {
        error('Số điện thoại phụ huynh đã được đăng ký cho một tài khoản khác. Vui lòng chuyển sang Tab Liên kết tài khoản.');
      } else {
        error(msg || 'Lỗi khi cấp tài khoản phụ huynh.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: (userId: string) => parentAccountService.resendActivation(userId),
    onSuccess: () => {
      success('Đã gửi lại thông tin kích hoạt và mật khẩu khởi tạo tới email của phụ huynh.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi gửi lại mã kích hoạt.');
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: any }) =>
      parentAccountService.linkStudent(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-parent-overview'] });
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('Liên kết hồ sơ học sinh vào tài khoản phụ huynh thành công.');
      setLinkingParent(null);
      resetLinkForm();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-063' || msg?.includes('MSG-063') || msg?.includes('khớp')) {
        error('Thông tin định danh cha mẹ không trùng khớp giữa các hồ sơ học sinh. Hãy tích chọn xác nhận đối chiếu hồ sơ.');
      } else {
        error(msg || 'Lỗi khi liên kết học sinh vào tài khoản phụ huynh.');
      }
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ userId, studentId }: { userId: string; studentId: string }) =>
      parentAccountService.unlinkStudent(userId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-parent-overview'] });
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('Hủy liên kết hồ sơ học sinh thành công.');
      setUnlinkingTarget(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi khi hủy liên kết học sinh.');
    },
  });

  const resetLinkForm = () => {
    setLinkStudentId('');
    setSearchChildKeyword('');
    setLinkRelationship('GUARDIAN');
    setLinkIsPrimary(false);
    setLinkForceConfirm(false);
    setLinkNotes('');
  };

  // Mở modal tạo tài khoản phụ huynh cho 1 học sinh cụ thể
  const handleOpenProvisionForStudent = (student: StudentParentOverviewItem) => {
    setSelectedStudent(student);
    setProvisionStudentId(student.studentId);

    // Điền gợi ý từ hồ sơ giám hộ nếu có sẵn
    setProvisionFullName(student.suggestedGuardianName || student.fullName ? `Phụ huynh ${student.fullName}` : '');
    setProvisionPhone(student.suggestedGuardianPhone || '');
    setProvisionEmail(student.suggestedGuardianEmail || '');

    if (student.suggestedRelationship === 'FATHER') setProvisionRelationship('FATHER');
    else if (student.suggestedRelationship === 'MOTHER') setProvisionRelationship('MOTHER');
    else setProvisionRelationship('GUARDIAN');

    setProvisionIsPrimary(true);
    setProvisionIdCard('');
    setProvisionAddress('');
    setIsProvisionModalOpen(true);
  };

  const handleProvisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionStudentId) {
      error('Vui lòng chọn học sinh.');
      return;
    }
    if (!provisionPhone.trim()) {
      error('Vui lòng nhập số điện thoại phụ huynh.');
      return;
    }
    if (!provisionFullName.trim()) {
      error('Vui lòng nhập họ tên phụ huynh.');
      return;
    }
    if (!provisionEmail.trim()) {
      error('Vui lòng nhập tài khoản Gmail của phụ huynh để gửi thông tin đăng nhập.');
      return;
    }

    provisionMutation.mutate({
      studentId: provisionStudentId,
      phoneNumber: provisionPhone.trim(),
      fullName: provisionFullName.trim(),
      email: provisionEmail.trim(),
      relationshipType: provisionRelationship,
      isPrimary: provisionIsPrimary,
      identityCardNumber: provisionIdCard.trim() || undefined,
      address: provisionAddress.trim() || undefined,
    });
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingParent || !linkStudentId) {
      error('Vui lòng chọn học sinh cần liên kết.');
      return;
    }

    linkMutation.mutate({
      userId: linkingParent.parentId || linkingParent.accountId,
      payload: {
        studentId: linkStudentId,
        relationshipType: linkRelationship,
        isPrimary: linkIsPrimary,
        forceConfirm: linkForceConfirm,
        notes: linkNotes.trim() || undefined,
      },
    });
  };

  const multiChildAccounts = accounts.filter((a) => (a.linkedChildrenCount || a.linkedChildren?.length || 0) >= 2);
  const displayAccounts = accountFilterMode === 'MULTI_CHILD' ? multiChildAccounts : accounts;

  return (
    <div className="space-y-6">
      {/* View Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainView('STUDENTS_LIST')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeMainView === 'STUDENTS_LIST'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>Danh Sách Học Sinh & Phụ Huynh</span>
            {studentsWithoutAccount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeMainView === 'STUDENTS_LIST' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
              }`}>
                {studentsWithoutAccount} cần cấp
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainView('MULTI_CHILD_ACCOUNTS')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeMainView === 'MULTI_CHILD_ACCOUNTS'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tài Khoản Phụ Huynh & Đa Con</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              {accounts.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: DANH SÁCH HỌC SINH & PHỤ HUYNH LIÊN KẾT */}
      {/* ========================================================================= */}
      {activeMainView === 'STUDENTS_LIST' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center gap-4 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <Baby className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số học sinh</p>
                <h4 className="text-xl font-black text-slate-800">{totalStudents}</h4>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-emerald-100 bg-emerald-50/20 flex items-center gap-4 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã có tài khoản phụ huynh</p>
                <h4 className="text-xl font-black text-emerald-800">{studentsWithAccount}</h4>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-amber-200 bg-amber-50/40 flex items-center gap-4 shadow-xs">
              <div className="h-11 w-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Chưa có tài khoản phụ huynh</p>
                <h4 className="text-xl font-black text-amber-900">{studentsWithoutAccount}</h4>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm theo Mã HS, Tên học sinh, Lớp, SĐT phụ huynh..."
                value={studentSearchKeyword}
                onChange={(e) => setStudentSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => setStudentFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  studentFilter === 'ALL'
                    ? 'bg-[#275A4E] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({totalStudents})
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter('NO_ACCOUNT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  studentFilter === 'NO_ACCOUNT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Chưa có tài khoản ({studentsWithoutAccount})
              </button>
              <button
                type="button"
                onClick={() => setStudentFilter('HAS_ACCOUNT')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  studentFilter === 'HAS_ACCOUNT'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Đã có tài khoản ({studentsWithAccount})
              </button>
            </div>
          </div>

          {/* Students Table */}
          {isLoadingStudents ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#275A4E] mb-3" />
              <p className="text-slate-500 text-xs font-medium">Đang tải danh sách học sinh và phụ huynh liên kết...</p>
            </div>
          ) : studentsOverview.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
              <Baby className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Không tìm thấy học sinh phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc trạng thái tài khoản.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3.5 px-4">Học Sinh</th>
                      <th className="py-3.5 px-4">Lớp Học</th>
                      <th className="py-3.5 px-4">Trạng Thái Tài Khoản</th>
                      <th className="py-3.5 px-4">Phụ Huynh Liên Kết / Gợi Ý</th>
                      <th className="py-3.5 px-4 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {studentsOverview.map((item) => (
                      <tr key={item.studentId} className="hover:bg-slate-50/60 transition-colors">
                        {/* Học sinh */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#275A4E] flex items-center justify-center font-bold text-xs shrink-0">
                              {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'H'}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{item.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                                <span>{item.studentCode}</span>
                                {item.dateOfBirth && <span>• {item.dateOfBirth}</span>}
                                {item.gender && <span>• {item.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Lớp */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-700 inline-flex items-center gap-1.5">
                              <School className="w-3.5 h-3.5 text-slate-400" />
                              {item.className || 'Chưa xếp lớp'}
                            </span>
                            {item.currentGradeLevel && (
                              <p className="text-[10px] text-slate-400 font-semibold">{item.currentGradeLevel}</p>
                            )}
                          </div>
                        </td>

                        {/* Trạng thái tài khoản */}
                        <td className="py-3.5 px-4">
                          {item.hasParentAccount ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đã có tài khoản
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-700" />
                              Chưa có tài khoản
                            </span>
                          )}
                        </td>

                        {/* Thông tin phụ huynh hoặc gợi ý */}
                        <td className="py-3.5 px-4">
                          {item.hasParentAccount ? (
                            <div className="space-y-1">
                              <p className="font-bold text-slate-800">{item.parentFullName}</p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" /> {item.parentPhone}
                                </span>
                                {item.parentEmail && (
                                  <span className="inline-flex items-center gap-1 font-sans text-slate-400 max-w-[160px] truncate" title={item.parentEmail}>
                                    <Mail className="w-3 h-3 text-slate-400" /> {item.parentEmail}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : item.suggestedGuardianName ? (
                            <div className="space-y-0.5 text-slate-600">
                              <p className="text-[11px] font-semibold text-slate-700">
                                Gợi ý: {item.suggestedGuardianName}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({item.suggestedRelationship === 'FATHER' ? 'Bố' : item.suggestedRelationship === 'MOTHER' ? 'Mẹ' : 'Giám hộ'})
                                </span>
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                {item.suggestedGuardianPhone && <span>{item.suggestedGuardianPhone}</span>}
                                {item.suggestedGuardianEmail && <span>• {item.suggestedGuardianEmail}</span>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa có thông tin người giám hộ</span>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="py-3.5 px-4 text-right">
                          {!item.hasParentAccount ? (
                            <button
                              type="button"
                              onClick={() => handleOpenProvisionForStudent(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-[#275A4E] text-white hover:bg-[#1E4D40] transition shadow-xs cursor-pointer active:scale-95"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>+ Tạo tài khoản phụ huynh</span>
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => resendMutation.mutate(item.primaryParentAccountId || item.primaryParentId || '')}
                                disabled={resendMutation.isPending}
                                title="Gửi lại thông tin kích hoạt / mật khẩu"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-emerald-50 border border-slate-200 transition cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMainView('MULTI_CHILD_ACCOUNTS');
                                  setAccountSearchKeyword(item.parentPhone || item.parentFullName || '');
                                }}
                                title="Xem trong Quản lý Đa con"
                                className="p-1.5 rounded-lg text-purple-700 hover:bg-purple-50 border border-purple-200 transition cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
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

      {/* ========================================================================= */}
      {/* VIEW 2: TÀI KHOẢN PHỤ HUYNH & ĐA CON */}
      {/* ========================================================================= */}
      {activeMainView === 'MULTI_CHILD_ACCOUNTS' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm phụ huynh theo Họ tên, Số điện thoại..."
                value={accountSearchKeyword}
                onChange={(e) => setAccountSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#275A4E]/30 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAccountFilterMode('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  accountFilterMode === 'ALL'
                    ? 'bg-[#275A4E] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả tài khoản ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => setAccountFilterMode('MULTI_CHILD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  accountFilterMode === 'MULTI_CHILD'
                    ? 'bg-purple-800 text-white'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                Phụ huynh có nhiều con ({multiChildAccounts.length})
              </button>
            </div>
          </div>

          {isLoadingAccounts ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#275A4E] mb-3" />
              <p className="text-slate-500 text-xs font-medium">Đang tải danh sách tài khoản phụ huynh...</p>
            </div>
          ) : displayAccounts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản phụ huynh phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Chưa có tài khoản phụ huynh nào phù hợp tiêu chí tìm kiếm.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {displayAccounts.map((account) => {
                const children = account.linkedChildren || [];
                const isMulti = children.length >= 2;

                return (
                  <div
                    key={account.accountId || account.parentId}
                    className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Account Card Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#1E4D40] flex items-center justify-center font-black text-sm shrink-0">
                            {account.fullName ? account.fullName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-extrabold text-slate-900">{account.fullName}</h3>
                              {isMulti && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" /> {children.length} bé
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono font-bold text-slate-600 flex items-center gap-2 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{account.phoneNumber}</span>
                              {account.email && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[11px] text-slate-500 font-sans font-normal truncate max-w-[140px]" title={account.email}>
                                    {account.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => resendMutation.mutate(account.accountId || account.parentId)}
                            disabled={resendMutation.isPending}
                            className="p-2 text-slate-500 hover:text-[#1E4D40] bg-slate-50 hover:bg-emerald-50 rounded-xl transition border border-slate-200/60 cursor-pointer text-xs"
                            title="Gửi lại thông tin kích hoạt qua SMS / Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLinkingParent(account)}
                            className="p-2 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200 cursor-pointer text-xs flex items-center gap-1"
                            title="Liên kết thêm con vào tài khoản này"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-bold">Thêm con</span>
                          </button>
                        </div>
                      </div>

                      {/* Linked Children List */}
                      <div className="pt-3 space-y-2">
                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Baby className="w-3.5 h-3.5 text-[#275A4E]" />
                          <span>Danh Sách Con Đang Liên Kết ({children.length}):</span>
                        </p>

                        {children.length === 0 ? (
                          <p className="text-xs text-slate-400 italic py-2">Chưa liên kết học sinh nào</p>
                        ) : (
                          <div className="space-y-1.5">
                            {children.map((child) => (
                              <div
                                key={child.studentId}
                                className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 hover:bg-slate-100/70 transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="h-7 w-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                    {child.fullName ? child.fullName.charAt(0) : 'K'}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-800">{child.fullName}</span>
                                      <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.2 rounded-sm border border-slate-200">
                                        {child.studentCode}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span>Lớp: {child.className || 'Chưa xếp lớp'}</span>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-600">
                                        {child.relationshipType === 'FATHER'
                                          ? 'Bố'
                                          : child.relationshipType === 'MOTHER'
                                          ? 'Mẹ'
                                          : 'Giám hộ'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => setUnlinkingTarget({ parent: account, child })}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                                  title="Hủy liên kết hồ sơ này"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CẤP / TẠO TÀI KHOẢN PHỤ HUYNH */}
      {/* ========================================================================= */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#275A4E]" />
                  <span>Cấp Tài Khoản Ứng Dụng Phụ Huynh</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tài khoản đăng nhập tự động gửi về Gmail & thông báo đổi mật khẩu, FaceID
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Thông tin học sinh đang liên kết */}
            {selectedStudent ? (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white text-[#275A4E] font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                  <Baby className="w-5 h-5 text-[#275A4E]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Học sinh thụ hưởng</p>
                  <p className="text-xs font-black text-slate-800 truncate">{selectedStudent.fullName}</p>
                  <p className="text-[11px] font-mono text-slate-500">
                    Mã HS: {selectedStudent.studentCode} • Lớp: {selectedStudent.className || 'Chưa xếp lớp'}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={provisionStudentId}
                  onChange={(e) => setProvisionStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30 bg-white"
                  required
                >
                  <option value="">-- Chọn học sinh từ danh sách --</option>
                  {studentsList.map((st: any) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.fullName} ({st.studentCode}) - Lớp {st.className || 'Chưa có lớp'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notice về Mật khẩu mặc định & Gmail */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 space-y-1.5 text-xs text-blue-900">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Quy trình kích hoạt tài khoản tự động:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800 pl-1">
                <li>Mật khẩu mặc định được hệ thống tạo sẵn là: <strong className="font-mono text-blue-950">123456789</strong></li>
                <li>Hệ thống gửi email thông báo tài khoản & mật khẩu tới tài khoản Gmail phụ huynh.</li>
                <li>Tự động tạo notification trên ứng dụng di động: <em className="italic">"yêu cầu đổi mật khẩu và cập nhật FaceID cho trẻ và người giám hộ"</em>.</li>
              </ul>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và tên phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={provisionFullName}
                    onChange={(e) => setProvisionFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    value={provisionPhone}
                    onChange={(e) => setProvisionPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ Gmail phụ huynh (Tên đăng nhập & nhận mật khẩu) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="phuhuynh@gmail.com"
                    value={provisionEmail}
                    onChange={(e) => setProvisionEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quan hệ với trẻ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={provisionRelationship}
                    onChange={(e) => setProvisionRelationship(e.target.value as RelationshipType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30 bg-white"
                  >
                    <option value="FATHER">Bố (Father)</option>
                    <option value="MOTHER">Mẹ (Mother)</option>
                    <option value="GUARDIAN">Người giám hộ hợp pháp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số CCCD / Định danh (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="00120100xxxx"
                    value={provisionIdCard}
                    onChange={(e) => setProvisionIdCard(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Địa chỉ thường trú (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  value={provisionAddress}
                  onChange={(e) => setProvisionAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#275A4E]/30"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-[#275A4E] text-white hover:bg-[#1E4D40] rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {provisionMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tạo tài khoản & gửi Gmail...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tạo Tài Khoản & Gửi Thông Báo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KẾT QUẢ CẤP TÀI KHOẢN THÀNH CÔNG */}
      {/* ========================================================================= */}
      {provisionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">Cấp Tài Khoản Phụ Huynh Thành Công</h3>
              <p className="text-xs text-slate-500">
                Thông tin tài khoản đã được lưu vào hệ thống và gửi email thông báo tới phụ huynh
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Họ tên phụ huynh:</span>
                <span className="font-bold text-slate-800">{provisionResult.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tên đăng nhập (Email):</span>
                <span className="font-mono font-bold text-slate-800">{provisionResult.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mật khẩu mặc định:</span>
                <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {provisionResult.tempPassword || '123456789'}
                </span>
              </div>
              {provisionResult.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gmail đã thông báo:</span>
                  <span className="font-semibold text-slate-700">{provisionResult.email}</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Đã tự động gửi notification: <strong>"yêu cầu đổi mật khẩu và cập nhật FaceID cho trẻ và người giám hộ"</strong> cho tài khoản này.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setProvisionResult(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-[#275A4E] text-white hover:bg-[#1E4D40] transition cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LIÊN KẾT CON VÀO TÀI KHOẢN PHỤ HUYNH */}
      {/* ========================================================================= */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-purple-700" />
                  <span>Liên Kết Thêm Con Vào Tài Khoản Phụ Huynh</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phụ huynh: <strong>{linkingParent.fullName}</strong> ({linkingParent.phoneNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkingParent(null);
                  resetLinkForm();
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn học sinh cần liên kết thêm <span className="text-rose-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Gõ chữ cái hoặc tên bé / mã học sinh để tìm nhanh..."
                    value={searchChildKeyword}
                    onChange={(e) => setSearchChildKeyword(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 text-slate-800 placeholder-slate-400"
                  />
                  {searchChildKeyword && (
                    <button
                      type="button"
                      onClick={() => setSearchChildKeyword('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600/30 bg-white"
                  required
                >
                  <option value="">-- Chọn học sinh ({filteredChildrenToLink.length} kết quả) --</option>
                  {filteredChildrenToLink.map((st: any) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.fullName} ({st.studentCode}) - Lớp {st.className || 'Chưa xếp lớp'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quan hệ với học sinh này
                  </label>
                  <select
                    value={linkRelationship}
                    onChange={(e) => setLinkRelationship(e.target.value as RelationshipType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="FATHER">Bố</option>
                    <option value="MOTHER">Mẹ</option>
                    <option value="GUARDIAN">Người giám hộ</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkIsPrimary}
                      onChange={(e) => setLinkIsPrimary(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Đặt làm phụ huynh chính</span>
                  </label>
                </div>
              </div>

              {/* Tùy chọn force confirm khi thông tin không khớp */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 space-y-1 text-xs text-amber-900">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkForceConfirm}
                    onChange={(e) => setLinkForceConfirm(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    <strong>Xác nhận đối chiếu hồ sơ thực tế:</strong> Tích chọn nếu thông tin họ tên cha mẹ ở các hồ sơ có sự sai lệch nhỏ nhưng đã được đối chiếu CCCD/sổ hộ khẩu.
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú hồ sơ liên kết (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Lý do đối chiếu, biên bản xác nhận..."
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setLinkingParent(null);
                    resetLinkForm();
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={linkMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {linkMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang liên kết...</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Xác Nhận Liên Kết</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL XÁC NHẬN HỦY LIÊN KẾT */}
      {/* ========================================================================= */}
      {unlinkingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="h-11 w-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900">Xác Nhận Hủy Liên Kết Học Sinh</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn hủy liên kết học sinh <strong>{unlinkingTarget.child.fullName}</strong> khỏi tài khoản của phụ huynh <strong>{unlinkingTarget.parent.fullName}</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnlinkingTarget(null)}
                className="w-1/2 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() =>
                  unlinkMutation.mutate({
                    userId: unlinkingTarget.parent.parentId || unlinkingTarget.parent.accountId,
                    studentId: unlinkingTarget.child.studentId,
                  })
                }
                disabled={unlinkMutation.isPending}
                className="w-1/2 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {unlinkMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Xác Nhận Hủy</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentAccountManagementTab;
