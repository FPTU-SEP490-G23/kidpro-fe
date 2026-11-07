import React, { useState, useEffect } from 'react';
import { UserAccount, UpdateUserPayload } from '../../../../types/rbac.types';
import { Tenant } from '../../../../types/tenant.types';
import { UserRole } from '../../../../types/auth.types';
import { rbacApi } from '../../../../api/rbacApi';
import { useAuth } from '../../../../contexts/AuthContext';
import { useToast } from '../../../../contexts/ToastContext';
import { getRoleDisplayName } from '../../../../utils/formatters';
import {
  X,
  Pencil,
  Mail,
  Phone,
  Building2,
  Shield,
  Loader2,
  Lock,
  KeyRound,
  GraduationCap,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

interface EditUserModalProps {
  isOpen: boolean;
  user: UserAccount | null;
  tenants: Tenant[];
  onClose: () => void;
  onUserUpdated: (updatedUser: UserAccount) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  tenants,
  onClose,
  onUserUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [role, setRole] = useState<UserRole>('GIAO_VIEN');
  const [status, setStatus] = useState<'ACTIVE' | 'LOCKED'>('ACTIVE');
  const [newPassword, setNewPassword] = useState('');
  const [department, setDepartment] = useState('ACADEMIC');
  const [qualification, setQualification] = useState('');
  const [position, setPosition] = useState('');

  const isBgh = currentUser?.role === 'BGH';
  const isTargetSuperAdmin = user?.role === 'SYSTEM_ADMIN';
  const isForbiddenForBgh = isBgh && isTargetSuperAdmin;

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setTenantId(user.tenantId || tenants[0]?.id || 'tnt_001');
      setRole(user.role || 'GIAO_VIEN');
      setStatus(user.status || 'ACTIVE');
      setNewPassword('');
    }
  }, [user, tenants]);

  if (!isOpen || !user) return null;

  const isStaffRole =
    role === 'GIAO_VIEN' ||
    role === 'GIAO_VU' ||
    role === 'KE_TOAN' ||
    role === 'BEP';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForbiddenForBgh) {
      toast.error('Ban Giám Hiệu không có quyền chỉnh sửa tài khoản Quản trị viên hệ thống (Super Admin).');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    if (!phone.trim()) {
      toast.error('Số điện thoại không được để trống.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: UpdateUserPayload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/[\s.-]/g, ''),
        tenantId,
        role,
        status,
        newPassword: newPassword.trim() ? newPassword.trim() : undefined,
        department: isStaffRole ? department : undefined,
        qualification: isStaffRole ? qualification : undefined,
        position: !isStaffRole ? position : undefined,
      };

      const updated = await rbacApi.updateUser(user.id, payload);
      toast.success('Cập nhật tài khoản người dùng thành công!');
      onUserUpdated(updated);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Cập nhật tài khoản thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-[#275A4E]">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Chỉnh sửa Tài khoản Người dùng</h2>
              <p className="text-xs text-slate-500">ID: {user.id} ({user.email || user.phone})</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cảnh báo BGH */}
        {isForbiddenForBgh && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-semibold text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Tài khoản này thuộc Quản trị viên hệ thống (Super Admin). Ban Giám Hiệu chỉ có thể xem, không có quyền chỉnh sửa.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Họ và tên */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Họ và tên người dùng *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isForbiddenForBgh}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isForbiddenForBgh}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Số điện thoại *</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isForbiddenForBgh}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
                  required
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Vai trò RBAC */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Vai trò tài khoản (Role) *</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isForbiddenForBgh}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
              >
                {!isBgh && (
                  <option value="SYSTEM_ADMIN">{getRoleDisplayName('SYSTEM_ADMIN')}</option>
                )}
                <option value="BGH">{getRoleDisplayName('BGH')}</option>
                <option value="GIAO_VIEN">{getRoleDisplayName('GIAO_VIEN')}</option>
                <option value="GIAO_VU">{getRoleDisplayName('GIAO_VU')}</option>
                <option value="KE_TOAN">{getRoleDisplayName('KE_TOAN')}</option>
                <option value="BEP">{getRoleDisplayName('BEP')}</option>
                <option value="PHU_HUYNH">{getRoleDisplayName('PHU_HUYNH')}</option>
              </select>
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Trạng thái tài khoản */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Trạng thái tài khoản</label>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'LOCKED')}
                disabled={isForbiddenForBgh}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
              >
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="LOCKED">Bị khóa (LOCKED)</option>
              </select>
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Đổi mật khẩu (Optional) */}
          <div className="space-y-1 pt-1">
            <label className="font-semibold text-slate-700">Đặt lại mật khẩu mới (Bỏ trống nếu không đổi)</label>
            <div className="relative">
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isForbiddenForBgh}
                placeholder="Nhập mật khẩu mới nếu muốn reset..."
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden disabled:bg-slate-100"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Thông tin Staff mở rộng */}
          {isStaffRole && (
            <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-3">
              <p className="font-bold text-teal-800 text-[11px] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                <span>Hồ sơ Cán bộ Nhân sự (Đồng bộ bảng Staff)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-medium text-slate-600 text-[11px]">Phòng ban</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={isForbiddenForBgh}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100"
                  >
                    <option value="ACADEMIC">Chuyên môn Sư phạm (ACADEMIC)</option>
                    <option value="ACCOUNTING">Kế toán Tài chính (ACCOUNTING)</option>
                    <option value="KITCHEN">Bếp Bán trú (KITCHEN)</option>
                    <option value="MEDICAL">Y tế Học đường (MEDICAL)</option>
                    <option value="MANAGEMENT">Ban Quản lý (MANAGEMENT)</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-600 text-[11px]">Trình độ / Chuyên môn</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    disabled={isForbiddenForBgh}
                    placeholder="VD: Cử nhân ĐH Sư phạm"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-800 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isForbiddenForBgh}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Lưu Thay Đổi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

