import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Tenant, TENANT_MESSAGES } from '../../../../types/tenant.types';
import { tenantApi } from '../../../../api/tenantApi';
import { useToast } from '../../../../contexts/ToastContext';
import { editTenantSchema, EditTenantFormValues } from '../../../../utils/validationSchemas';
import { X, Lock, Building2, Save, Loader2, Upload } from 'lucide-react';

interface EditTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdated: (updated: Tenant) => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onTenantUpdated,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditTenantFormValues>({
    defaultValues: {
      name: tenant?.name || '',
      address: tenant?.address || '',
      hotline: tenant?.hotline || '',
      email: tenant?.email || '',
      adminName: tenant?.adminName || '',
      logoUrl: tenant?.logoUrl || '',
    },
  });

  if (!isOpen || !tenant) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  const onSubmit = async (values: EditTenantFormValues) => {
    const validation = editTenantSchema.safeParse(values);
    if (!validation.success) {
      toast.error('Vui lòng kiểm tra lại thông tin cơ sở trường học.');
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await tenantApi.updateTenant(tenant.id, {
        ...values,
        logoUrl: logoPreview || tenant.logoUrl,
      });

      toast.success(TENANT_MESSAGES.MSG_017);
      onTenantUpdated(updated);
      onClose();
    } catch {
      toast.error(TENANT_MESSAGES.MSG_004);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#275A4E]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Cập nhật Hồ sơ Trường học</h2>
              <p className="text-xs text-slate-500">Chỉnh sửa thông tin liên hệ và cơ sở chi nhánh</p>
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
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Mã trường (school_code) - Cố định bị khóa */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Mã định danh trường (`school_code`)</span>
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                Khóa cố định
              </span>
            </div>
            <input
              type="text"
              value={tenant.schoolCode}
              disabled
              readOnly
              className="w-full bg-transparent font-mono text-sm font-bold text-slate-700 cursor-not-allowed select-none"
            />
            <p className="text-[11px] text-slate-400">
              Mã phân vùng hệ thống không thể thay đổi sau khi khởi tạo để bảo toàn liên kết cơ sở dữ liệu.
            </p>
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
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
            </div>

            {/* Đại diện / Hiệu trưởng */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Người đại diện / Hiệu trưởng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('adminName', { required: true })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              />
            </div>

            {/* Hotline */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Hotline liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('hotline', { required: true })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              />
            </div>

            {/* Email */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Email công vụ <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                {...register('email', { required: true })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              />
            </div>

            {/* Địa chỉ */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-700">
                Địa chỉ cơ sở <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('address', { required: true })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-medium focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/40"
              />
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">Logo trường</label>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <img
                  src={logoPreview || tenant.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <input
                  type="file"
                  id="edit-logo-upload"
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="edit-logo-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Thay logo</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
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
                  <span>Đang lưu...</span>
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

export default EditTenantModal;
