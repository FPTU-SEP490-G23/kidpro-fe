import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { userProfileApi } from '../../../api/userProfileApi';
import { useToast } from '../../../contexts/ToastContext';
import { PROFILE_MESSAGES } from '../../../types/userProfile.types';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
} from '../../../utils/validationSchemas';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { KeyRound, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

export const SecurityPasswordTab: React.FC = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle ẩn hiện mật khẩu
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword') || '';

  const onSubmit = async (values: ChangePasswordFormValues) => {
    // Validate bằng Zod
    const result = changePasswordSchema.safeParse(values);
    if (!result.success) {
      toast.error(PROFILE_MESSAGES.MSG_007);
      return;
    }

    try {
      setIsSubmitting(true);
      await userProfileApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });

      toast.success(PROFILE_MESSAGES.MSG_012);
      reset(); // Reset form sau khi đổi thành công
    } catch (err: any) {
      if (err.message?.includes('không đáp ứng') || err.message?.includes('khớp')) {
        toast.error(PROFILE_MESSAGES.MSG_007);
      } else {
        toast.error(PROFILE_MESSAGES.MSG_004);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#275A4E]" />
            <span>Bảo mật & Đổi Mật khẩu Tài khoản</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Định kỳ đổi mật khẩu giúp bảo vệ an toàn dữ liệu học sinh và thông tin tài chính nhà trường.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
          {/* Mật khẩu hiện tại */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                {...register('currentPassword', { required: true })}
                placeholder="Nhập mật khẩu đang sử dụng"
                className={`w-full rounded-xl border pl-4 pr-11 py-2.5 text-sm font-medium text-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40 ${
                  errors.currentPassword
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#275A4E]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                {...register('newPassword', { required: true })}
                placeholder="Nhập mật khẩu mới an toàn"
                className={`w-full rounded-xl border pl-4 pr-11 py-2.5 text-sm font-medium text-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40 ${
                  errors.newPassword
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#275A4E]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-rose-600 font-medium">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Thanh đo độ mạnh mật khẩu (Password Strength Meter) theo thời gian thực */}
          <PasswordStrengthMeter password={newPasswordValue} />

          {/* Xác nhận mật khẩu mới */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword', { required: true })}
                placeholder="Nhập lại chính xác mật khẩu mới"
                className={`w-full rounded-xl border pl-4 pr-11 py-2.5 text-sm font-medium text-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40 ${
                  errors.confirmPassword
                    ? 'border-rose-400 bg-rose-50/50'
                    : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#275A4E]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Nút hành động */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#78C2AD]" />
                  <span>Cập nhật Mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecurityPasswordTab;
