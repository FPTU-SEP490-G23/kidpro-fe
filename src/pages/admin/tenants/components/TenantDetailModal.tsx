import React from 'react';
import { Tenant } from '../../../../types/tenant.types';
import { formatDate } from '../../../../utils/formatters';
import {
  X,
  School,
  Building2,
  FileText,
  Users,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface TenantDetailModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TenantDetailModal: React.FC<TenantDetailModalProps> = ({
  tenant,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !tenant) return null;

  const isActive = tenant.status === 'ACTIVE';
  const isDeactivated = tenant.status === 'DEACTIVATED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-[#275A4E]">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{tenant.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-xs font-semibold text-slate-500">
                  {tenant.schoolCode}
                </span>
                <span className="text-slate-300">•</span>
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-100 text-[#275A4E]'
                      : isDeactivated
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-[#E5A93C]'
                  }`}
                >
                  {isActive && <CheckCircle2 className="w-3 h-3" />}
                  {isDeactivated && <AlertOctagon className="w-3 h-3" />}
                  {isActive ? 'Đang hoạt động' : isDeactivated ? 'Tạm dừng hoạt động' : 'Chưa kích hoạt'}
                </span>
              </div>
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

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Lý do tạm dừng nếu có */}
          {tenant.deactivatedReason && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Lý do tạm dừng chi nhánh:
              </p>
              <p className="leading-relaxed">{tenant.deactivatedReason}</p>
            </div>
          )}

          {/* Thống kê học sinh & giáo viên */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <Users className="w-5 h-5 text-[#275A4E] mx-auto mb-1" />
              <p className="text-slate-500 font-medium">Tổng học sinh</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                {tenant.totalStudents || 0}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <GraduationCap className="w-5 h-5 text-[#E5A93C] mx-auto mb-1" />
              <p className="text-slate-500 font-medium">Giáo viên</p>
              <p className="text-lg font-extrabold text-slate-800 mt-0.5">
                {tenant.totalTeachers || 0}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <ShieldCheck className="w-5 h-5 text-[#78C2AD] mx-auto mb-1" />
              <p className="text-slate-500 font-medium">Gói đăng ký</p>
              <p className="text-sm font-extrabold text-[#275A4E] mt-1">
                {tenant.subscriptionPackage}
              </p>
            </div>
          </div>

          {/* Chi tiết thông tin */}
          <div className="space-y-3 p-4 rounded-2xl border border-slate-200/80 bg-white">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#275A4E]" />
              <span>Hồ sơ cơ sở & Pháp lý</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
              <p>
                <strong className="text-slate-800">Mã số thuế:</strong> {tenant.taxCode}
              </p>
              <p>
                <strong className="text-slate-800">Số GP GDMN:</strong> {tenant.licenseNumber}
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">Hotline:</strong> {tenant.hotline}
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-800">Email:</strong> {tenant.email}
              </p>
              <p className="md:col-span-2 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-800">Địa chỉ:</strong> {tenant.address}
                </span>
              </p>
            </div>
          </div>

          {/* Thông tin Quản trị viên */}
          <div className="space-y-3 p-4 rounded-2xl border border-slate-200/80 bg-white">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#275A4E]" />
              <span>Đại diện quản trị cơ sở</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600">
              <p>
                <strong className="text-slate-800">Họ tên:</strong> {tenant.adminName}
              </p>
              <p>
                <strong className="text-slate-800">SĐT cá nhân:</strong> {tenant.adminPhone}
              </p>
              <p className="md:col-span-2">
                <strong className="text-slate-800">Email quản trị:</strong> {tenant.adminEmail}
              </p>
              <p className="text-slate-400 text-[11px] md:col-span-2">
                Khởi tạo ngày: {formatDate(tenant.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#275A4E] hover:bg-[#1E4D40] transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailModal;
