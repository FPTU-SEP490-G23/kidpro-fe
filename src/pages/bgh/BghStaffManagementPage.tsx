import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import staffApi, { StaffMember, CreateStaffInput, UpdateStaffInput } from '../../api/staffApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getRoleDisplayName, getRoleBadgeColor } from '../../utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Lock,
  Unlock,
  ShieldCheck,
  Pencil,
  Building,
  Phone,
  Mail,
  GraduationCap,
  Sparkles,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Eye,
  EyeOff,
  Send,
  Check,
} from 'lucide-react';

export const BghStaffManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { success, error } = useToast();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [lockingStaff, setLockingStaff] = useState<StaffMember | null>(null);
  const [roleStaff, setRoleStaff] = useState<StaffMember | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('ACADEMIC');
  const [qualification, setQualification] = useState('Đại học Sư phạm Mầm non');
  const [hireDate, setHireDate] = useState('2026-09-01');
  const [initialRole, setInitialRole] = useState('TEACHER');

  // Success summary modal state
  const [createdResult, setCreatedResult] = useState<StaffMember | null>(null);

  // Lock reason
  const [lockReason, setLockReason] = useState('Nghỉ việc');
  const [selectedRole, setSelectedRole] = useState('TEACHER');
  const [formError, setFormError] = useState('');

  // Fetch staff list
  const { data: staffList = [], isLoading, isFetching, refetch } = useQuery<StaffMember[]>({
    queryKey: ['bgh-staff-list'],
    queryFn: staffApi.getAllStaff,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffInput) => staffApi.createStaff(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['bgh-staff-list'] });
      const createdStaff = res?.data || res;
      setCreatedResult(createdStaff);
      success(res?.message || 'MSG-019: Tạo hồ sơ, cấp tài khoản và đã gửi thông báo đến Gmail thành công.');
      closeCreateModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo hồ sơ nhân sự';
      setFormError(msg);
      error(msg);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffInput }) => staffApi.updateStaff(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bgh-staff-list'] });
      success(res?.message || 'Cập nhật thông tin hồ sơ nhân sự thành công.');
      setEditingStaff(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật hồ sơ';
      setFormError(msg);
      error(msg);
    },
  });

  // Lock mutation
  const lockMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => staffApi.lockStaff(id, reason),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bgh-staff-list'] });
      success(res?.message || 'MSG-020: Tài khoản nhân sự đã bị khóa thành công và thu hồi phiên đăng nhập.');
      setLockingStaff(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể khóa tài khoản';
      error(msg);
    },
  });

  // Unlock mutation
  const unlockMutation = useMutation({
    mutationFn: (id: string) => staffApi.unlockStaff(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bgh-staff-list'] });
      success(res?.message || 'MSG-021: Mở khóa tài khoản nhân sự thành công. Nhân sự có thể đăng nhập lại vào hệ thống.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể mở khóa tài khoản');
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => staffApi.updateStaffRole(id, role),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['bgh-staff-list'] });
      success(res?.message || 'MSG-024: Gán vai trò và cập nhật quyền hạn cho nhân sự thành công.');
      setRoleStaff(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể cập nhật vai trò');
    },
  });

  const openCreateModal = () => {
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setDepartment('ACADEMIC');
    setQualification('Đại học Sư phạm Mầm non');
    setHireDate('2026-09-01');
    setInitialRole('TEACHER');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setFormError('');
  };

  const openEditModal = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFullName(staff.fullName);
    setPhoneNumber(staff.phoneNumber || '');
    setEmail(staff.email || '');
    setDepartment(staff.department);
    setQualification(staff.qualification || '');
    setHireDate(staff.hireDate || '2026-09-01');
    setFormError('');
  };

  const openLockModal = (staff: StaffMember) => {
    // Client-side BR-008 pre-check: Không được tự khóa chính mình
    if (user && (user.id === staff.accountId || user.email === staff.email)) {
      error('MSG-023: Không được phép tự khóa tài khoản của chính mình.');
      return;
    }
    setLockingStaff(staff);
    setLockReason('Nghỉ việc');
  };

  const openRoleModal = (staff: StaffMember) => {
    setRoleStaff(staff);
    setSelectedRole(staff.role || 'TEACHER');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) {
      setFormError('Vui lòng điền đầy đủ họ tên và số điện thoại');
      return;
    }
    if (!email.trim()) {
      setFormError('Vui lòng nhập địa chỉ email/Gmail để hệ thống gửi thông báo tài khoản');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Địa chỉ email không đúng định dạng (ví dụ: giaovien@gmail.com)');
      return;
    }

    createMutation.mutate({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim(),
      department,
      qualification: qualification.trim() || undefined,
      hireDate,
      role: initialRole,
      password: password.trim() || undefined,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    updateMutation.mutate({
      id: editingStaff.staffId,
      data: {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        department,
        qualification: qualification.trim() || undefined,
        hireDate,
      },
    });
  };

  const handleConfirmLock = () => {
    if (!lockingStaff) return;
    lockMutation.mutate({ id: lockingStaff.staffId, reason: lockReason });
  };

  const handleConfirmRole = () => {
    if (!roleStaff) return;
    updateRoleMutation.mutate({ id: roleStaff.staffId, role: selectedRole });
  };

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (s.phoneNumber || '').includes(searchKeyword) ||
      (s.email || '').toLowerCase().includes(searchKeyword.toLowerCase());

    const matchDept = departmentFilter === 'ALL' || s.department === departmentFilter;
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>UC-008 & UC-009 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Nhân Sự & Phân Quyền</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Quản lý hồ sơ cán bộ giáo viên, kiểm soát trạng thái hoạt động (khóa/mở khóa) và phân bổ vai trò quyền hạn nhà trường (BR-008, BR-009).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#78C2AD] text-[#1E4D40] hover:bg-[#68b49f] px-5 py-2.5 text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm Nhân Sự Mới</span>
          </button>
        </div>
      </div>

      {/* Toolbar lọc và tìm kiếm */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo họ tên, mã NV, SĐT, email..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#275A4E] outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Lọc theo phòng ban */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Phòng ban:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-[#275A4E]"
            >
              <option value="ALL">Tất cả phòng ban</option>
              <option value="ACADEMIC">Học vụ / Giáo viên (ACADEMIC)</option>
              <option value="ACCOUNTING">Tài chính / Kế toán (ACCOUNTING)</option>
              <option value="KITCHEN">Bếp ăn dinh dưỡng (KITCHEN)</option>
              <option value="MEDICAL">Y tế học đường (MEDICAL)</option>
              <option value="MANAGEMENT">Ban Giám Hiệu (MANAGEMENT)</option>
            </select>
          </div>

          {/* Lọc theo trạng thái */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-[#275A4E]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="BLOCKED">Đã khóa tài khoản (BLOCKED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Nhân Sự */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Mã NV</th>
                <th className="py-3.5 px-4">Họ và Tên</th>
                <th className="py-3.5 px-4">Liên Hệ</th>
                <th className="py-3.5 px-4">Phòng Ban & Bằng Cấp</th>
                <th className="py-3.5 px-4 text-center">Vai Trò (Role)</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#275A4E]" />
                    <p className="text-sm font-semibold">Chưa có cán bộ nhân sự nào phù hợp bộ lọc</p>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isBlocked = staff.status === 'BLOCKED';
                  const isCurrentUser = user && (user.id === staff.accountId || user.email === staff.email);

                  return (
                    <tr key={staff.staffId} className="hover:bg-slate-50/80 transition-colors">
                      {/* Mã NV */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#275A4E]">
                        {staff.staffCode}
                      </td>

                      {/* Họ tên */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block text-sm">{staff.fullName}</span>
                        <span className="text-[11px] text-slate-400">User: {staff.username}</span>
                      </td>

                      {/* Liên hệ */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staff.phoneNumber || 'Chưa cập nhật'}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{staff.email}</span>
                          </div>
                        )}
                      </td>

                      {/* Phòng ban & bằng cấp */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 mb-1">
                          {staff.department}
                        </span>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>{staff.qualification || 'Chuyên môn sư phạm'}</span>
                        </div>
                      </td>

                      {/* Vai trò */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(staff.role as any)}`}>
                          {getRoleDisplayName(staff.role as any)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Lock className="w-3 h-3" />
                            <span>ĐÃ KHÓA</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>HOẠT ĐỘNG</span>
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Phân quyền vai trò (UC-009) */}
                          <button
                            type="button"
                            onClick={() => openRoleModal(staff)}
                            title="Gán vai trò & phân quyền (UC-009)"
                            className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Sửa hồ sơ (Rẽ nhánh A1) */}
                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            title="Chỉnh sửa hồ sơ"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Khóa / Mở khóa (Rẽ nhánh A2, A3) */}
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => unlockMutation.mutate(staff.staffId)}
                              title="Mở khóa tài khoản (MSG-021)"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openLockModal(staff)}
                              disabled={Boolean(isCurrentUser)}
                              title={isCurrentUser ? 'Không thể tự khóa chính mình (MSG-023)' : 'Khóa tài khoản'}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Nhân Sự Mới (UC-008) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-[#78C2AD]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Thêm Hồ Sơ Cán Bộ Mới</h3>
                  <p className="text-xs text-[#78C2AD]">UC-008 • Ban Giám Hiệu</p>
                </div>
              </div>
              <button onClick={closeCreateModal} className="p-1 rounded-full hover:bg-white/10 text-white/80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Send className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <p className="font-bold text-emerald-900">Tạo tài khoản Staff & Gửi thông báo Gmail</p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Hệ thống tự động tạo đồng thời bản ghi <strong>Account</strong> & <strong>Staff</strong> trong database, sau đó gửi thông tin tài khoản và mật khẩu đến Gmail của cán bộ.
                  </p>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và Tên Cán Bộ *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Thị Mai Lan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email / Gmail Nhận Thông Báo *</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="lan.nt@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng Ban *</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                  >
                    <option value="ACADEMIC">Giáo viên / Học vụ</option>
                    <option value="ACCOUNTING">Kế toán & Tài chính</option>
                    <option value="KITCHEN">Bếp ăn bán trú</option>
                    <option value="MEDICAL">Y tế học đường</option>
                    <option value="MANAGEMENT">Ban Giám Hiệu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vai Trò Khởi Tạo</label>
                  <select
                    value={initialRole}
                    onChange={(e) => setInitialRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                  >
                    <option value="TEACHER">Giáo viên Chủ nhiệm</option>
                    <option value="ACADEMIC_STAFF">Cán bộ Giáo vụ</option>
                    <option value="ACCOUNTANT">Kế toán</option>
                    <option value="KITCHEN_STAFF">Nhân viên Bếp</option>
                    <option value="BOARD_OF_DIRECTORS">Ban Giám Hiệu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật Khẩu Khởi Tạo (Tùy chọn)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mặc định: KidPro@2026 (nếu để trống)"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Nếu để trống, mật khẩu khởi tạo mặc định là <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">KidPro@2026</code>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trình Độ Chuyên Môn</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="Cử nhân Giáo dục Mầm non, Cao đẳng Sư phạm..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-60"
                >
                  <Send className={`w-4 h-4 ${createMutation.isPending ? 'animate-bounce' : ''}`} />
                  <span>{createMutation.isPending ? 'Đang tạo & gửi Gmail...' : 'Tạo Tài Khoản & Gửi Gmail'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Hồ Sơ (Rẽ nhánh A1) */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
              <h3 className="text-lg font-bold">Chỉnh Sửa Hồ Sơ: {editingStaff.fullName}</h3>
              <button onClick={() => setEditingStaff(null)} className="p-1 rounded-full hover:bg-white/10 text-white/80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phòng Ban</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                >
                  <option value="ACADEMIC">Giáo viên / Học vụ</option>
                  <option value="ACCOUNTING">Kế toán & Tài chính</option>
                  <option value="KITCHEN">Bếp ăn bán trú</option>
                  <option value="MEDICAL">Y tế học đường</option>
                  <option value="MANAGEMENT">Ban Giám Hiệu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trình Độ Chuyên Môn</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold cursor-pointer"
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khóa Tài Khoản (Rẽ nhánh A2) */}
      {lockingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Xác nhận khóa tài khoản</h3>
                <p className="text-xs text-slate-500">Nhân sự: {lockingStaff.fullName} ({lockingStaff.staffCode})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Theo quy tắc <strong>BR-008</strong>, tài khoản bị khóa sẽ lập tức bị thu hồi quyền đăng nhập vào toàn bộ hệ thống.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Lý do khóa tài khoản *</label>
              <select
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="Nghỉ việc">Nghỉ việc / Thôi việc</option>
                <option value="Nghỉ thai sản">Nghỉ thai sản</option>
                <option value="Tạm đình chỉ">Tạm đình chỉ công tác</option>
                <option value="Chuyển công tác">Chuyển cơ sở khác</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLockingStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                disabled={lockMutation.isPending}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {lockMutation.isPending ? 'Đang khóa...' : 'Xác nhận khóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phân Quyền Vai Trò (UC-009) */}
      {roleStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-teal-700">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-[#275A4E]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Gán Vai Trò & Phân Quyền</h3>
                <p className="text-xs text-slate-500">{roleStaff.fullName} ({roleStaff.staffCode})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi nhân sự bắt buộc gắn với tối thiểu 01 vai trò chức năng hợp lệ theo quy tắc <strong>BR-009</strong>. Thao tác sẽ được lưu vào Audit Log.
            </p>

            <div className="space-y-2">
              {[
                { role: 'TEACHER', title: 'Giáo viên Chủ nhiệm', desc: 'Điểm danh, sổ bé ngoan, báo ăn, đánh giá học tập' },
                { role: 'ACADEMIC_STAFF', title: 'Cán bộ Giáo vụ', desc: 'Tiếp nhận học sinh, xếp lớp, lập thời khóa biểu' },
                { role: 'ACCOUNTANT', title: 'Kế toán & Học phí', desc: 'Quản lý biểu phí, phát hành hóa đơn học phí' },
                { role: 'KITCHEN_STAFF', title: 'Nhân viên Bếp', desc: 'Chốt suất ăn 08:30, thực đơn dinh dưỡng' },
                { role: 'BOARD_OF_DIRECTORS', title: 'Ban Giám Hiệu (Hiệu trưởng)', desc: 'Điều hành toàn trường, phê duyệt mở lớp & TKB' },
              ].map((item) => (
                <label
                  key={item.role}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    selectedRole === item.role
                      ? 'border-[#275A4E] bg-[#78C2AD]/10'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.role}
                    checked={selectedRole === item.role}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRoleStaff(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRole}
                disabled={updateRoleMutation.isPending}
                className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold cursor-pointer"
              >
                {updateRoleMutation.isPending ? 'Đang lưu...' : 'Lưu phân quyền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thông Báo Tạo Tài Khoản & Gửi Gmail Thành Công */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Khởi Tạo & Cấp Tài Khoản Thành Công!</h3>
                <p className="text-xs text-emerald-600 font-medium">Bản ghi Account & Staff đã được lưu trong CSDL</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Mail className="w-4 h-4 text-emerald-700" />
                <span>Đã gửi thông báo kích hoạt tới Gmail:</span>
              </div>
              <p className="font-semibold text-emerald-950 pl-6">{createdResult.email}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mã Cán Bộ:</span>
                <span className="font-mono font-bold text-[#275A4E]">{createdResult.staffCode}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Họ & Tên:</span>
                <span className="font-bold text-slate-900">{createdResult.fullName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Username:</span>
                <span className="font-mono font-semibold text-slate-800">{createdResult.username}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Mật khẩu khởi tạo:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  {createdResult.tempPassword || 'KidPro@2026'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Phòng ban:</span>
                <span className="font-medium text-slate-700">{createdResult.department}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center italic">
              Nhân sự có thể đăng nhập ngay bằng Username hoặc Email trên với mật khẩu khởi tạo đã cấp.
            </p>

            <button
              type="button"
              onClick={() => setCreatedResult(null)}
              className="w-full py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghStaffManagementPage;
