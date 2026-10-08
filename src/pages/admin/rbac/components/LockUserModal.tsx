import React, { useState } from 'react';
import { UserAccount, RBAC_MESSAGES } from '../../../../types/rbac.types';
import { rbacApi } from '../../../../api/rbacApi';
import { useToast } from '../../../../contexts/ToastContext';
import { AlertTriangle, Lock, Unlock, X, Loader2 } from 'lucide-react';

interface LockUserModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged: (updated: UserAccount) => void;
}

export const LockUserModal: React.FC<LockUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onStatusChanged,
}) => {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const isLocked = user.status === 'LOCKED';
  const newStatus = isLocked ? 'ACTIVE' : 'LOCKED';

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const updated = await rbacApi.updateUserStatus(user.id, {
        status: newStatus,
        reason: !isLocked ? reason.trim() : undefined,
      });

      toast.success(
        newStatus === 'LOCKED'
          ? `Đã khóa quyền truy cập tài khoản của ${user.fullName}.`
          : `Đã mở khóa và khôi phục quyền truy cập cho ${user.fullName}.`
      );
      onStatusChanged(updated);
      setReason('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || RBAC_MESSAGES.MSG_004);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            !isLocked
              ? 'bg-rose-50/80 border-rose-100 text-rose-900'
              : 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${
                !isLocked ? 'bg-rose-600' : 'bg-[#275A4E]'
              }`}
            >
              {!isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">
                {!isLocked ? 'Khóa Tài khoản Nhân sự' : 'Mở Khóa Tài khoản'}
              </h2>
              <p className="text-xs opacity-80">
                {!isLocked ? 'Đình chỉ phiên đăng nhập' : 'Khôi phục quyền truy cập'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 opacity-60 hover:opacity-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {!isLocked ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 leading-relaxed font-semibold">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-rose-600" />
              Khóa tài khoản sẽ ngay lập tức thu hồi phiên làm việc của nhân sự{' '}
              <strong>{user.fullName}</strong>. Người dùng sẽ không thể đăng nhập vào hệ thống.
            </div>
          ) : (
            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn mở khóa tài khoản cho <strong>{user.fullName}</strong> ({user.email})? Người dùng sẽ được phép đăng nhập lại bình thường.
            </p>
          )}

          {!isLocked && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Lý do khóa tài khoản (Tùy chọn ghi nhận):
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do (ví dụ: Nhân sự nghỉ việc, Nghi ngờ vi phạm an toàn thông tin...)"
                className="w-full rounded-2xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden focus:ring-2 focus:ring-[#78C2AD]/30 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition text-xs"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-sm ${
              !isLocked
                ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98]'
                : 'bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{!isLocked ? 'Xác nhận Khóa tài khoản' : 'Xác nhận Mở khóa'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockUserModal;
