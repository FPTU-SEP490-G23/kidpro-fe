import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tenant, TENANT_MESSAGES } from '../../../../types/tenant.types';
import { tenantApi } from '../../../../api/tenantApi';
import { useToast } from '../../../../contexts/ToastContext';
import {
  createTenantSchema,
  CreateTenantFormValues,
} from '../../../../utils/validationSchemas';
import {
  X,
  School,
  Building2,
  FileCheck2,
  UserCheck,
  Upload,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantCreated: (tenant: Tenant) => void;
}

export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onTenantCreated,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTenantFormValues>({
    defaultValues: {
      schoolCode: '',
      name: '',
      taxCode: '',
      address: '',
      hotline: '',
      email: '',
      licenseNumber: '',
      adminName: '',
      adminEmail: '',
      adminPhone: '',
      subscriptionPackage: 'STANDARD',
    },
  });

  const schoolCodeValue = watch('schoolCode');

  if (!isOpen) return null;

  // Tự động chuyển mã trường thành in hoa và loại bỏ ký tự không hợp lệ
  const handleSchoolCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setValue('schoolCode', formatted, { shouldValidate: true });
  };

  // Giả lập chọn ảnh logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const onSubmit = async (values: CreateTenantFormValues) => {
    // Validate BR-076 & MSG-020
    if (!values.licenseNumber?.trim()) {
      toast.error(TENANT_MESSAGES.MSG_020);
      return;
    }

    const validation = createTenantSchema.safeParse(values);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message;
      toast.error(firstError || 'Vui lòng kiểm tra lại thông tin trường học.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTenant = await tenantApi.createTenant({
        ...values,
        schoolCode: values.schoolCode.trim().toUpperCase(),
        adminPhone: values.adminPhone.replace(/[\s.-]/g, ''),
        hotline: values.hotline.replace(/[\s.-]/g, ''),
        logoUrl: logoPreview || undefined,
      });

      toast.success(TENANT_MESSAGES.MSG_016);
      onTenantCreated(newTenant);
      reset();
      setLogoPreview(null);
      onClose();
    } catch (err: any) {
      if (err.message === TENANT_MESSAGES.MSG_018) {
        toast.error(TENANT_MESSAGES.MSG_018);
      } else if (err.message === TENANT_MESSAGES.MSG_019) {
        toast.error(TENANT_MESSAGES.MSG_019);
      } else {
        toast.error(err.message || TENANT_MESSAGES.MSG_004);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#275A4E]">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Khởi tạo Cơ sở Trường Mầm Non Mới</h2>
              <p className="text-xs text-slate-500">Phân vùng dữ liệu Tenant độc lập cho chi nhánh trường</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Nhóm 1: Thông tin cơ sở trường */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-800">
              <Building2 className="w-4 h-4 text-[#275A4E]" />
              <span>1. Thông tin cơ sở & Pháp lý (GDMN)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tên trường */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Tên trường mầm non <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name', { required: true })}
                  placeholder="Ví dụ: Trường Mầm Non Quốc Tế KIDPRO - Cầu Giấy"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                    errors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              {/* Mã trường (school_code) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mã trường (`school_code`) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolCodeValue}
                  onChange={handleSchoolCodeChange}
                  placeholder="KIDPRO_HANOI"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider ${
                    errors.schoolCode ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                <p className="text-[11px] text-slate-400">Viết liền, in hoa, không dấu</p>
                {errors.schoolCode && (
                  <p className="text-xs text-rose-600">{errors.schoolCode.message}</p>
                )}
              </div>

              {/* Mã số thuế */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Mã số thuế (MST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('taxCode', { required: true })}
                  placeholder="0109887766"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                    errors.taxCode ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                {errors.taxCode && (
                  <p className="text-xs text-rose-600">{errors.taxCode.message}</p>
                )}
              </div>

              {/* Số giấy phép GDMN (bắt buộc) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>
                    Số giấy phép hoạt động GDMN <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#E5A93C] uppercase">Bắt buộc</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    {...register('licenseNumber', { required: true })}
                    placeholder="GDMN-2026/188-HN"
                    className={`w-full rounded-xl border pl-9 pr-3.5 py-2.5 text-sm font-medium ${
                      errors.licenseNumber
                        ? 'border-rose-400 bg-rose-50/50'
                        : 'border-slate-300 focus:border-[#275A4E]'
                    } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                  />
                  <FileCheck2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                {errors.licenseNumber && (
                  <p className="text-xs text-rose-600">{errors.licenseNumber.message}</p>
                )}
              </div>

              {/* Gói đăng ký dịch vụ */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Gói bản quyền KIDPRO</label>
                <select
                  {...register('subscriptionPackage')}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
                >
                  <option value="BASIC">Gói Cơ Bản (Dưới 100 học sinh)</option>
                  <option value="STANDARD">Gói Chuẩn (100 - 300 học sinh)</option>
                  <option value="PREMIUM">Gói Cao Cấp (Không giới hạn học sinh + AI Kiosk)</option>
                </select>
              </div>

              {/* Hotline */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Số điện thoại Hotline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('hotline', { required: true })}
                  placeholder="024 3788 9901"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
                />
              </div>

              {/* Email công vụ */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email công vụ trường <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email', { required: true })}
                  placeholder="mamnon.caugiay@kidpro.edu.vn"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                    errors.email ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
              </div>

              {/* Địa chỉ */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">
                  Địa chỉ cơ sở <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('address', { required: true })}
                  placeholder="Số 15 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
                />
              </div>
            </div>
          </div>

          {/* Nhóm 2: Thông tin Admin / Hiệu trưởng */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-sm font-bold text-slate-800">
              <UserCheck className="w-4 h-4 text-[#275A4E]" />
              <span>2. Người đại diện / Quản trị viên cơ sở</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Họ tên Hiệu trưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('adminName', { required: true })}
                  placeholder="Nguyễn Thị Lan Anh"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  SĐT cá nhân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('adminPhone', { required: true })}
                  placeholder="0912345678"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                    errors.adminPhone
                      ? 'border-rose-400 bg-rose-50/50'
                      : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                {errors.adminPhone && (
                  <p className="text-xs text-rose-600">{errors.adminPhone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Email quản trị tiếp nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('adminEmail', { required: true })}
                  placeholder="lananh.nt@kidpro.edu.vn"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-medium ${
                    errors.adminEmail
                      ? 'border-rose-400 bg-rose-50/50'
                      : 'border-slate-300 focus:border-[#275A4E]'
                  } focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40`}
                />
                {errors.adminEmail && (
                  <p className="text-xs text-rose-600">{errors.adminEmail.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Nhóm 3: Logo trường */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">
              Logo nhận diện trường mầm non
            </label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <School className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo-upload-input"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload-input"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn logo trường</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-1">Định dạng PNG/JPG vuông (tối ưu 200x200px)</p>
              </div>
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                  <span>Đang khởi tạo Tenant...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#78C2AD]" />
                  <span>Khởi tạo Trường học</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTenantModal;
