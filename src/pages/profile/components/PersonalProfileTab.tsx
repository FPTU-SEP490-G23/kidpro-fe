import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { UserProfile, PROFILE_MESSAGES } from '../../../types/userProfile.types';
import { userProfileApi } from '../../../api/userProfileApi';
import { useToast } from '../../../contexts/ToastContext';
import {
  profileInfoSchema,
  ProfileInfoFormValues,
  validateAvatarFile,
} from '../../../utils/validationSchemas';
import { getRoleDisplayName, getRoleBadgeColor } from '../../../utils/formatters';
import {
  Camera,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  FileBadge,
} from 'lucide-react';

interface PersonalProfileTabProps {
  profile: UserProfile;
  onProfileUpdated: (updated: UserProfile) => void;
}

export const PersonalProfileTab: React.FC<PersonalProfileTabProps> = ({
  profile,
  onProfileUpdated,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileInfoFormValues>({
    defaultValues: {
      email: profile.email,
      phone: profile.phone,
    },
  });

  // Xử lý chọn file ảnh đại diện
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Validate client-side
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setAvatarError(PROFILE_MESSAGES.MSG_014);
      toast.error(PROFILE_MESSAGES.MSG_014);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingAvatar(true);
      // Tạo preview trước
      const objectUrl = URL.createObjectURL(file);
      setPreviewAvatar(objectUrl);

      // Gọi API tải lên
      const res = await userProfileApi.uploadAvatar(file);
      onProfileUpdated({ ...profile, avatarUrl: res.avatarUrl });
      toast.success('Tải lên ảnh đại diện thành công');
    } catch {
      toast.error(PROFILE_MESSAGES.MSG_004);
      setPreviewAvatar(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Xử lý lưu form thông tin cá nhân
  const onSubmit = async (values: ProfileInfoFormValues) => {
    // Validate bằng Zod schema
    const result = profileInfoSchema.safeParse(values);
    if (!result.success) {
      toast.error(PROFILE_MESSAGES.MSG_013);
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await userProfileApi.updateProfile({
        email: values.email,
        phone: values.phone,
      });

      onProfileUpdated(updated);
      toast.success(PROFILE_MESSAGES.MSG_011);
    } catch (err: any) {
      if (err.message?.includes('Số điện thoại') || err.message?.includes('409')) {
        toast.error(PROFILE_MESSAGES.MSG_015);
      } else {
        toast.error(PROFILE_MESSAGES.MSG_004);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Phần Ảnh đại diện (Avatar Section) */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#275A4E]" />
          <span>Ảnh đại diện người dùng</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-slate-100 overflow-hidden shadow-md bg-slate-100">
              <img
                src={previewAvatar || profile.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop'}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-slate-900/50 rounded-full flex items-center justify-center text-white backdrop-blur-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#78C2AD]" />
              </div>
            )}
          </div>

          <div className="space-y-3 text-center sm:text-left flex-1">
            <div>
              <p className="text-sm font-semibold text-slate-800">Cập nhật ảnh đại diện mới</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Chấp nhận file định dạng JPG, JPEG hoặc PNG. Dung lượng tối đa không quá 5MB.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                id="avatar-file-input"
              />
              <label
                htmlFor="avatar-file-input"
                className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#275A4E] hover:bg-[#1E4D40] transition shadow-xs ${
                  isUploadingAvatar ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Camera className="w-4 h-4 text-[#78C2AD]" />
                <span>{isUploadingAvatar ? 'Đang tải lên...' : 'Tải ảnh mới'}</span>
              </label>

              {previewAvatar && (
                <button
                  type="button"
                  onClick={() => setPreviewAvatar(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Đặt lại ảnh gốc
                </button>
              )}
            </div>

            {avatarError && (
              <div className="flex items-center gap-2 text-xs text-rose-600 font-medium mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Form Thông tin cá nhân */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#275A4E]" />
          <span>Thông tin hồ sơ & Liên hệ</span>
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Họ tên (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Họ và tên
              </label>
              <input
                type="text"
                value={profile.fullName}
                readOnly
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-slate-400">Tên người dùng được đồng bộ từ hồ sơ nhân sự</p>
            </div>

            {/* Vai trò (Read-only with badge) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Vai trò trong hệ thống
              </label>
              <div className="flex items-center gap-2 h-[42px] px-4 rounded-xl border border-slate-200 bg-slate-100/80">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {getRoleDisplayName(profile.role)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Phân quyền theo chuẩn bảo mật RBAC</p>
            </div>

            {/* Cơ sở / Trường học (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cơ sở trường học
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.schoolName}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed select-none"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400">Mã cơ sở: {profile.schoolCode}</p>
            </div>

            {/* Mã định danh người dùng (Read-only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mã định danh người dùng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.userCode}
                  readOnly
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-700 cursor-not-allowed select-none font-mono"
                />
                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400">Định danh duy nhất trên toàn hệ sinh thái</p>
            </div>

            {/* Số điện thoại (Cho phép sửa) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  {...register('phone', { required: true })}
                  placeholder="0988123456"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40 ${
                    errors.phone
                      ? 'border-rose-400 bg-rose-50/50'
                      : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#275A4E]'
                  }`}
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              {errors.phone ? (
                <p className="text-xs text-rose-600 font-medium">{errors.phone.message}</p>
              ) : (
                <p className="text-[11px] text-slate-400">10 chữ số (đầu 03, 05, 07, 08, 09)</p>
              )}
            </div>

            {/* Email liên hệ (Cho phép sửa) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Email liên hệ <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="email@kidpro.edu.vn"
                  className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 transition focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40 ${
                    errors.email
                      ? 'border-rose-400 bg-rose-50/50'
                      : 'border-slate-300 bg-white hover:border-slate-400 focus:border-[#275A4E]'
                  }`}
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              {errors.email ? (
                <p className="text-xs text-rose-600 font-medium">{errors.email.message}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Dùng nhận thông báo trường và đặt lại mật khẩu</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                  <span>Đang lưu thay đổi...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#78C2AD]" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonalProfileTab;
