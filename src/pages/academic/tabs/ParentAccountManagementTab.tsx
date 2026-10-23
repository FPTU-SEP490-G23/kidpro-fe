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
  UserCheck
} from 'lucide-react';
import { parentAccountService } from '../../../services/parentAccountService';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../contexts/ToastContext';
import {
  ParentAccountItem,
  LinkedStudentItem,
  RelationshipType,
  ProvisionAccountResponse
} from '../../../types/parentAccount.types';

export const ParentAccountManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'MULTI_CHILD'>('ALL');

  // Modals
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [provisionStudentId, setProvisionStudentId] = useState('');
  const [provisionPhone, setProvisionPhone] = useState('');
  const [provisionFullName, setProvisionFullName] = useState('');
  const [provisionEmail, setProvisionEmail] = useState('');
  const [provisionRelationship, setProvisionRelationship] = useState<RelationshipType>('FATHER');
  const [provisionIsPrimary, setProvisionIsPrimary] = useState(true);
  const [provisionIdCard, setProvisionIdCard] = useState('');
  const [provisionAddress, setProvisionAddress] = useState('');
  const [provisionResult, setProvisionResult] = useState<ProvisionAccountResponse | null>(null);

  // Link child modal (G4-UC-09)
  const [linkingParent, setLinkingParent] = useState<ParentAccountItem | null>(null);
  const [linkStudentId, setLinkStudentId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState<RelationshipType>('GUARDIAN');
  const [linkIsPrimary, setLinkIsPrimary] = useState(false);
  const [linkForceConfirm, setLinkForceConfirm] = useState(false);
  const [linkNotes, setLinkNotes] = useState('');

  // Unlink child modal
  const [unlinkingTarget, setUnlinkingTarget] = useState<{ parent: ParentAccountItem; child: LinkedStudentItem } | null>(null);

  // Queries
  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery<ParentAccountItem[]>({
    queryKey: ['parent-accounts', searchKeyword],
    queryFn: () => parentAccountService.getAccounts(searchKeyword),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-parent-linking'],
    queryFn: () => studentService.getStudents({ size: 100 }),
    enabled: isProvisionModalOpen || !!linkingParent,
  });
  const studentsList = studentsData?.content || [];

  // Mutations
  const provisionMutation = useMutation({
    mutationFn: (payload: any) => parentAccountService.provisionAccount(payload),
    onSuccess: (res: ProvisionAccountResponse) => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('MSG-059: Cấp và gửi thông tin kích hoạt tài khoản phụ huynh thành công.');
      setProvisionResult(res);
      setIsProvisionModalOpen(false);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-061' || msg?.includes('MSG-061') || msg?.includes('đã được đăng ký')) {
        error('MSG-061: Số điện thoại phụ huynh đã được đăng ký cho một tài khoản khác. Vui lòng sử dụng chức năng Liên kết tài khoản.');
      } else {
        error(msg || 'Lỗi khi cấp tài khoản phụ huynh.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: (userId: string) => parentAccountService.resendActivation(userId),
    onSuccess: () => {
      success('Đã gửi lại thông tin kích hoạt và mật khẩu khởi tạo qua SMS / Email tới phụ huynh.');
    },
    onError: (err: any) => {
      error(err?.message || 'Lỗi gửi lại mã kích hoạt.');
    },
  });

  const linkMutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: any }) =>
      parentAccountService.linkStudent(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('MSG-060: Liên kết hồ sơ học sinh vào tài khoản phụ huynh thành công.');
      setLinkingParent(null);
      resetLinkForm();
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-063' || msg?.includes('MSG-063') || msg?.includes('không trùng khớp')) {
        error('MSG-063: Thông tin định danh cha mẹ không trùng khớp giữa các hồ sơ học sinh. Hãy tích chọn xác nhận đối chiếu hồ sơ.');
      } else {
        error(msg || 'Lỗi khi liên kết học sinh vào tài khoản phụ huynh.');
      }
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: ({ userId, studentId }: { userId: string; studentId: string }) =>
      parentAccountService.unlinkStudent(userId, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-accounts'] });
      success('MSG-062: Hủy liên kết hồ sơ học sinh thành công.');
      setUnlinkingTarget(null);
    },
    onError: (err: any) => {
      error(err?.message || 'Lỗi khi hủy liên kết học sinh.');
    },
  });

  const resetLinkForm = () => {
    setLinkStudentId('');
    setLinkRelationship('GUARDIAN');
    setLinkIsPrimary(false);
    setLinkForceConfirm(false);
    setLinkNotes('');
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

    provisionMutation.mutate({
      studentId: provisionStudentId,
      phoneNumber: provisionPhone.trim(),
      fullName: provisionFullName.trim(),
      email: provisionEmail.trim() || undefined,
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
  const displayAccounts = filterMode === 'MULTI_CHILD' ? multiChildAccounts : accounts;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Tài Khoản Phụ Huynh</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{accounts.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-purple-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Phụ Huynh Đa Con (G4-UC-09)</p>
            <h3 className="text-2xl font-black text-purple-900 mt-1">{multiChildAccounts.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <LinkIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Tài Khoản Đang Hoạt Động</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">
              {accounts.filter((a) => a.status === 'ACTIVE').length}
            </h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#1E4D40]/10 flex items-center justify-center text-[#1E4D40]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                G4-UC-08 & G4-UC-09: Quản Lý & Kích Hoạt Tài Khoản Phụ Huynh
              </h2>
              <p className="text-xs text-slate-500">
                Cấp tài khoản Mobile App chống trùng SĐT (BR-016), quản lý liên kết nhiều con chuyển đổi hồ sơ liền mạch
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#1E4D40] text-white text-xs font-bold rounded-2xl shadow-sm hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E5A93C]" />
            <span>+ Cấp Tài Khoản Mobile App Mới</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterMode === 'ALL'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả tài khoản ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('MULTI_CHILD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterMode === 'MULTI_CHILD'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Phụ huynh có từ 2 con ({multiChildAccounts.length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[280px]">
            <input
              type="text"
              placeholder="Tìm theo số điện thoại hoặc họ tên phụ huynh..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      {isLoadingAccounts ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1E4D40] mb-3" />
          <p className="text-slate-500 text-xs font-medium">Đang tải danh sách tài khoản phụ huynh...</p>
        </div>
      ) : displayAccounts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Không tìm thấy tài khoản phụ huynh phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Chưa có tài khoản nào phù hợp tiêu chí tìm kiếm. Hãy nhấn "+ Cấp Tài Khoản Mobile App Mới" để cấp tài khoản.
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
                        title="Gửi lại thông tin kích hoạt / mật khẩu qua SMS / Email"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setLinkingParent(account)}
                        className="p-2 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl transition border border-purple-200 cursor-pointer text-xs flex items-center gap-1"
                        title="Liên kết thêm con vào tài khoản này (G4-UC-09)"
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
                              <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                <Baby className="w-4 h-4 text-[#E5A93C]" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                  <span>{child.fullName}</span>
                                  <span className="text-[10px] font-mono text-slate-400">({child.studentCode})</span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span>Lớp: <strong className="text-slate-700">{child.className || 'Chưa phân lớp'}</strong></span>
                                  <span className="text-slate-300">•</span>
                                  <span className="px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-[9px] font-semibold text-slate-600">
                                    {child.relationshipType || 'Học sinh'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Unlink button (G4-UC-09 A1) */}
                            <button
                              type="button"
                              onClick={() => setUnlinkingTarget({ parent: account, child })}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hủy liên kết học sinh khỏi tài khoản này"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer notes */}
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>CCCD: {account.identityCardNumber || 'Chưa cập nhật'}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Sẵn sàng đăng nhập
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: CẤP TÀI KHOẢN MOBILE APP MỚI (G4-UC-08) */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 text-[#1E4D40]">
                <Smartphone className="w-5 h-5 text-[#E5A93C]" />
                <h3 className="text-base font-extrabold">Cấp Tài Khoản Ứng Dụng Phụ Huynh (G4-UC-08)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Chọn học sinh liên kết <span className="text-rose-500">*</span>
                </label>
                <select
                  value={provisionStudentId}
                  onChange={(e) => setProvisionStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  required
                >
                  <option value="">-- Chọn học sinh từ danh sách --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id || s.studentId} value={s.id || s.studentId}>
                      {s.fullName || s.name} ({s.studentCode || s.code}) - Lớp: {s.className || 'Chưa phân lớp'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Số điện thoại phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={provisionPhone}
                    onChange={(e) => setProvisionPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Là tên đăng nhập Mobile App</span>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Họ và tên phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn Tuấn"
                    value={provisionFullName}
                    onChange={(e) => setProvisionFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Email phụ huynh (nếu có)</label>
                  <input
                    type="email"
                    placeholder="parent@example.com"
                    value={provisionEmail}
                    onChange={(e) => setProvisionEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quan hệ với học sinh</label>
                  <select
                    value={provisionRelationship}
                    onChange={(e) => setProvisionRelationship(e.target.value as RelationshipType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  >
                    <option value="FATHER">Bố / Cha</option>
                    <option value="MOTHER">Mẹ</option>
                    <option value="GUARDIAN">Người giám hộ hợp pháp</option>
                    <option value="OTHER">Người thân khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Số CCCD / Định danh</label>
                  <input
                    type="text"
                    placeholder="12 chữ số CCCD..."
                    value={provisionIdCard}
                    onChange={(e) => setProvisionIdCard(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    placeholder="Số nhà, phố, quận/huyện..."
                    value={provisionAddress}
                    onChange={(e) => setProvisionAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkPrimary"
                  checked={provisionIsPrimary}
                  onChange={(e) => setProvisionIsPrimary(e.target.checked)}
                  className="rounded text-[#1E4D40] focus:ring-[#78C2AD]"
                />
                <label htmlFor="chkPrimary" className="text-slate-700 font-medium cursor-pointer">
                  Đặt làm Phụ huynh liên hệ chính của học sinh
                </label>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E4D40] shrink-0 mt-0.5" />
                <span>
                  <strong>Quy tắc BR-016:</strong> Hệ thống tự động sinh mã mật khẩu tạm thời và gửi qua SMS / Email. Nếu số điện thoại đã tồn tại, hệ thống sẽ yêu cầu dùng chức năng <strong>Liên kết đa con</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={provisionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E4D40] hover:bg-[#16382E] shadow-sm transition"
                >
                  {provisionMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Cấp Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HIỂN THỊ KẾT QUẢ CẤP TÀI KHOẢN & MẬT KHẨU TẠM THỜI */}
      {provisionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2 pb-3 border-b border-slate-100 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Cấp Tài Khoản Thành Công!</h3>
              <p className="text-xs text-slate-500">Mã thông báo: MSG-059</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Họ tên phụ huynh:</span>
                  <strong className="text-slate-900">{provisionResult.fullName}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tên đăng nhập (SĐT):</span>
                  <strong className="font-mono text-slate-900">{provisionResult.phoneNumber}</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-emerald-300">
                  <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#E5A93C]" /> Mật khẩu khởi tạo:
                  </span>
                  <strong className="font-mono font-black text-sm text-[#1E4D40] tracking-wider">
                    {provisionResult.tempPassword}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                Thông tin đăng nhập đã được gửi tự động qua SMS tới số điện thoại <strong>{provisionResult.phoneNumber}</strong>. Phụ huynh sẽ đổi mật khẩu tại lần đăng nhập đầu tiên trên app.
              </p>

              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setProvisionResult(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E4D40] hover:bg-[#16382E] shadow-sm transition"
                >
                  Hoàn Tất & Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: LIÊN KẾT THÊM CON VÀO TÀI KHOẢN (G4-UC-09) */}
      {linkingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 text-purple-950">
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-extrabold">Liên Kết Thêm Con Vào Tài Khoản (G4-UC-09)</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLinkingParent(null);
                  resetLinkForm();
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 space-y-1">
                <div>Tài khoản phụ huynh: <strong className="text-purple-950">{linkingParent.fullName}</strong></div>
                <div>Số điện thoại: <strong className="font-mono text-purple-900">{linkingParent.phoneNumber}</strong></div>
                <div>Số con hiện đang liên kết: <strong className="text-purple-700">{linkingParent.linkedChildrenCount} bé</strong></div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Chọn học sinh (con thứ hai/ba) cần liên kết <span className="text-rose-500">*</span>
                </label>
                <select
                  value={linkStudentId}
                  onChange={(e) => setLinkStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn học sinh từ danh sách --</option>
                  {studentsList.map((s: any) => (
                    <option key={s.id || s.studentId} value={s.id || s.studentId}>
                      {s.fullName || s.name} ({s.studentCode || s.code}) - Lớp: {s.className || 'Chưa phân lớp'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quan hệ với học sinh</label>
                  <select
                    value={linkRelationship}
                    onChange={(e) => setLinkRelationship(e.target.value as RelationshipType)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  >
                    <option value="FATHER">Bố / Cha</option>
                    <option value="MOTHER">Mẹ</option>
                    <option value="GUARDIAN">Người giám hộ hợp pháp</option>
                    <option value="OTHER">Người thân khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Ghi chú xác thực</label>
                  <input
                    type="text"
                    placeholder="Giấy khai sinh số, sổ hộ khẩu..."
                    value={linkNotes}
                    onChange={(e) => setLinkNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Force confirm check for BR-016 */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2 text-amber-950">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="chkForce"
                    checked={linkForceConfirm}
                    onChange={(e) => setLinkForceConfirm(e.target.checked)}
                    className="mt-0.5 rounded text-purple-700 focus:ring-purple-600"
                  />
                  <label htmlFor="chkForce" className="text-[11px] font-medium leading-relaxed cursor-pointer">
                    <strong>Xác nhận đối chiếu hồ sơ thực tế (BR-016):</strong> Cán bộ Giáo vụ đã đối chiếu giấy khai sinh hoặc sổ hộ khẩu chứng minh quan hệ phụ huynh - học sinh (bỏ qua cảnh báo MSG-063 nếu SĐT trên hồ sơ có sự sai lệch).
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLinkingParent(null);
                    resetLinkForm();
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={linkMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-sm transition"
                >
                  {linkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác Nhận Liên Kết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: HỦY LIÊN KẾT HỌC SINH (G4-UC-09 A1, MSG-062) */}
      {unlinkingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-rose-950">
              <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Unlink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Hủy Liên Kết Hồ Sơ Học Sinh</h3>
                <p className="text-xs text-slate-500">Nghiệp vụ G4-UC-09 Luồng rẽ nhánh A1</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div>Phụ huynh: <strong className="text-slate-900">{unlinkingTarget.parent.fullName}</strong> ({unlinkingTarget.parent.phoneNumber})</div>
                <div>Học sinh cần ngắt liên kết: <strong className="text-rose-700">{unlinkingTarget.child.fullName}</strong> ({unlinkingTarget.child.studentCode})</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Sau khi hủy liên kết, phụ huynh sẽ không còn quyền truy cập theo dõi học tập và điểm danh của bé này trên Mobile App.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlinkingTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy Bỏ
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
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition"
                >
                  {unlinkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác Nhận Hủy Liên Kết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
