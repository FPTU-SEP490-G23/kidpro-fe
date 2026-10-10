import React, { useState } from 'react';
import { Tenant, TENANT_MESSAGES } from '../../../../types/tenant.types';
import { tenantApi } from '../../../../api/tenantApi';
import { useToast } from '../../../../contexts/ToastContext';
import { AlertTriangle, X, Loader2, Ban } from 'lucide-react';

interface DeactivateTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: (updated: Tenant) => void;
}

export const DeactivateTenantModal: React.FC<DeactivateTenantModalProps> = ({
  tenant,
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !tenant) return null;

  const isReasonValid = reason.trim().length > 0;

  const handleConfirmDeactivate = async () => {
    if (!isReasonValid) return;

    try {
      setIsSubmitting(true);
      const updated = await tenantApi.changeTenantStatus(tenant.id, {
        status: 'DEACTIVATED',
        reason: reason.trim(),
      });

      toast.success(TENANT_MESSAGES.MSG_017);
      onStatusChanged(updated);
      setReason('');
      onClose();
    } catch {
      toast.error(TENANT_MESSAGES.MSG_004);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-rose-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header với cảnh báo đỏ */}
        <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/70 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-900">
                Tạm dừng Hoạt động Trường học
              </h2>
              <p className="text-xs text-rose-700 mt-0.5">Xác nhận tạm dừng phân vùng Tenant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-rose-400 hover:bg-rose-100 hover:text-rose-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung chi tiết & Cảnh báo đỏ */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed font-semibold">
            ⚠️ <span className="underline">CẢNH BÁO QUAN TRỌNG:</span> Tạm dừng trường sẽ khóa đăng nhập toàn bộ người dùng thuộc trường này (Bao gồm Ban Giám Hiệu, Giáo viên, Kế toán, Bếp và Phụ huynh học sinh).
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Cơ sở: <strong className="text-slate-900 font-bold">{tenant.name}</strong>
            </p>
            <p>
              Mã phân vùng: <span className="font-mono font-bold text-slate-800">{tenant.schoolCode}</span>
            </p>
          </div>

          {/* Textarea nhập lý do */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Lý do tạm dừng hoạt động <span className="text-rose-500">*</span></span>
              <span className="text-[10px] font-normal text-slate-400">Bắt buộc nhập</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết (ví dụ: Bảo trì cải tạo PCCC, Tạm ngưng theo văn bản chỉ đạo của Phòng GD&ĐT...)"
              className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden focus:ring-2 focus:ring-rose-200 transition resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Hủy thao tác
          </button>
          <button
            type="button"
            disabled={!isReasonValid || isSubmitting}
            onClick={handleConfirmDeactivate}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
              isReasonValid && !isSubmitting
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98] shadow-rose-200'
                : 'bg-rose-300 cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                <span>Xác nhận Tạm dừng Trường</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateTenantModal;
