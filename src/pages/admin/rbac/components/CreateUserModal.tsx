import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserAccount, CreateUserPayload, RBAC_MESSAGES } from '../../../../types/rbac.types';
import { Tenant } from '../../../../types/tenant.types';
import { UserRole } from '../../../../types/auth.types';
import { rbacApi } from '../../../../api/rbacApi';
import { useToast } from '../../../../contexts/ToastContext';
import {
  createUserAccountSchema,
  CreateUserAccountFormValues,
} from '../../../../utils/validationSchemas';
import { getRoleDisplayName } from '../../../../utils/formatters';
import { X, UserPlus, Mail, Phone, Building2, Shield, Loader2, Sparkles } from 'lucide-react';

interface CreateUserModalProps {
  isOpen: boolean;
  tenants: Tenant[];
  onClose: () => void;
  onUserCreated: (user: UserAccount) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  tenants,
  onClose,
  onUserCreated,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserAccountFormValues>({
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      tenantId: tenants[0]?.id || 'tnt_001',
      role: 'GIAO_VIEN',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: CreateUserAccountFormValues) => {
    const validation = createUserAccountSchema.safeParse(values);
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Vui lòng kiểm tra lại thông tin.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newUser = await rbacApi.createUser({
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        tenantId: values.tenantId,
        role: values.role as UserRole,
      });

      toast.success(
        `Khởi tạo tài khoản thành công! Mật khẩu tạm thời đã gửi đến email ${newUser.email}.`
      );
      onUserCreated(newUser);
      reset();
      onClose();
    } catch (err: any) {
      if (err.message === RBAC_MESSAGES.MSG_019) {
        toast.error(RBAC_MESSAGES.MSG_019);
      } else if (err.message === RBAC_MESSAGES.MSG_015) {
        toast.error(RBAC_MESSAGES.MSG_015);
      } else {
        toast.error(RBAC_MESSAGES.MSG_004);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#275A4E]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Thêm Tài khoản Nhân sự Mới</h2>
              <p className="text-xs text-slate-500">Cấp tài khoản và vai trò RBAC cho cán bộ trường</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 text-xs">
          {/* Họ và tên */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Họ và tên nhân sự <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('fullName', { required: true })}
              placeholder="Ví dụ: Hoàng Thị Lan"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                errors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
              } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
            />
            {errors.fullName && <p className="text-rose-600">{errors.fullName.message}</p>}
          </div>

          {/* Email công vụ */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Email công vụ (Tên đăng nhập) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                {...register('email', { required: true })}
                placeholder="lan.ht@kidpro.edu.vn"
                className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs font-medium ${
                  errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.email && <p className="text-rose-600">{errors.email.message}</p>}
          </div>

          {/* Số điện thoại */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                {...register('phone', { required: true })}
                placeholder="0988123456"
                className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-xs font-medium ${
                  errors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            {errors.phone && <p className="text-rose-600">{errors.phone.message}</p>}
          </div>

          {/* Cơ sở trường học */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Cơ sở trường học trực thuộc <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                {...register('tenantId', { required: true })}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.schoolCode})
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Vai trò RBAC gán */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">
              Vai trò hệ thống gán <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                {...register('role', { required: true })}
                className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs font-medium text-slate-800 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              >
                <option value="BGH">{getRoleDisplayName('BGH')}</option>
                <option value="GIAO_VIEN">{getRoleDisplayName('GIAO_VIEN')}</option>
                <option value="GIAO_VU">{getRoleDisplayName('GIAO_VU')}</option>
                <option value="KE_TOAN">{getRoleDisplayName('KE_TOAN')}</option>
                <option value="BEP">{getRoleDisplayName('BEP')}</option>
                <option value="SYSTEM_ADMIN">{getRoleDisplayName('SYSTEM_ADMIN')}</option>
              </select>
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400">
              Hệ thống sẽ tự động gán ma trận quyền mặc định của vai trò này.
            </p>
          </div>

          {/* Ghi chú mật khẩu tự sinh */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            💡 Hệ thống sẽ tự động sinh mật khẩu tạm thời ngẫu nhiên và gửi thư kích hoạt tài khoản kèm hướng dẫn đến email nhân sự.
          </div>

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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                  <span>Đang cấp quyền...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#78C2AD]" />
                  <span>Lưu & Cấp quyền</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
