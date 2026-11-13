import React, { useState } from 'react';
import {
  UserAccount,
  PermissionModule,
  PermissionAction,
  RBAC_MESSAGES,
} from '../../../../types/rbac.types';
import { rbacApi, SYSTEM_PERMISSION_MODULES } from '../../../../api/rbacApi';
import { useToast } from '../../../../contexts/ToastContext';
import { getRoleDisplayName, getRoleBadgeColor } from '../../../../utils/formatters';
import {
  X,
  CheckSquare,
  Square,
  Lock,
  Save,
  Loader2,
  Layers,
} from 'lucide-react';

interface PermissionsMatrixModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated: (updated: UserAccount) => void;
}

const ACTION_LABELS: Record<PermissionAction, { label: string; color: string }> = {
  VIEW: { label: 'Xem (View)', color: 'text-sky-700 bg-sky-50 border-sky-200' },
  CREATE: { label: 'Thêm (Create)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  EDIT: { label: 'Sửa (Edit)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  DELETE: { label: 'Xóa (Delete)', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  APPROVE: { label: 'Duyệt (Approve)', color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

export const PermissionsMatrixModal: React.FC<PermissionsMatrixModalProps> = ({
  user,
  isOpen,
  onClose,
  onPermissionsUpdated,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user?.permissions || []
  );

  if (!isOpen || !user) return null;

  const isSuperAdmin = user.role === 'SYSTEM_ADMIN';

  // Kiểm tra quyền có được chọn không
  const hasPermission = (featureCode: string, action: PermissionAction) => {
    return selectedPermissions.includes(`${featureCode}_${action}`);
  };

  // Toggle quyền kèm ràng buộc phụ thuộc
  const handleTogglePermission = (featureCode: string, action: PermissionAction) => {
    if (isSuperAdmin) {
      toast.warning(RBAC_MESSAGES.MSG_022);
      return;
    }

    const permKey = `${featureCode}_${action}`;
    const viewKey = `${featureCode}_VIEW`;
    const isCurrentlyChecked = selectedPermissions.includes(permKey);

    // 1. Trường hợp bỏ chọn quyền VIEW
    if (action === 'VIEW' && isCurrentlyChecked) {
      // Kiểm tra xem có bất kỳ quyền con (CREATE, EDIT, DELETE, APPROVE) nào đang được chọn không
      const childActions: PermissionAction[] = ['CREATE', 'EDIT', 'DELETE', 'APPROVE'];
      const hasActiveChild = childActions.some((child) =>
        selectedPermissions.includes(`${featureCode}_${child}`)
      );

      if (hasActiveChild) {
        toast.error(RBAC_MESSAGES.MSG_023);
        return;
      }

      // Hợp lệ để bỏ chọn VIEW
      setSelectedPermissions((prev) => prev.filter((p) => p !== permKey));
      return;
    }

    // 2. Trường hợp chọn một quyền con (CREATE, EDIT, DELETE, APPROVE)
    if (action !== 'VIEW' && !isCurrentlyChecked) {
      // Tự động tick thêm quyền VIEW nếu chưa có
      setSelectedPermissions((prev) => {
        const next = [...prev, permKey];
        if (!next.includes(viewKey)) {
          next.push(viewKey);
        }
        return next;
      });
      return;
    }

    // 3. Trường hợp bỏ chọn quyền con hoặc chọn quyền VIEW
    if (isCurrentlyChecked) {
      setSelectedPermissions((prev) => prev.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions((prev) => [...prev, permKey]);
    }
  };

  // Chọn tất cả quyền của 1 phân hệ
  const handleToggleModule = (module: PermissionModule) => {
    if (isSuperAdmin) {
      toast.warning(RBAC_MESSAGES.MSG_022);
      return;
    }

    const allModulePerms: string[] = [];
    module.features.forEach((feat) => {
      feat.availableActions.forEach((act) => {
        allModulePerms.push(`${feat.code}_${act}`);
      });
    });

    const isAllChecked = allModulePerms.every((p) => selectedPermissions.includes(p));

    if (isAllChecked) {
      // Bỏ chọn tất cả
      setSelectedPermissions((prev) => prev.filter((p) => !allModulePerms.includes(p)));
    } else {
      // Chọn tất cả
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...allModulePerms])));
    }
  };

  // Lưu cấu hình phân quyền
  const handleSave = async () => {
    if (isSuperAdmin) {
      toast.warning(RBAC_MESSAGES.MSG_022);
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await rbacApi.updateUserPermissions(
        user.id,
        selectedPermissions,
        user.updatedAt
      );

      toast.success(RBAC_MESSAGES.MSG_021);
      onPermissionsUpdated(updated);
      onClose();
    } catch (err: any) {
      if (err.message === RBAC_MESSAGES.MSG_024) {
        toast.error(RBAC_MESSAGES.MSG_024);
      } else if (err.message === RBAC_MESSAGES.MSG_022) {
        toast.error(RBAC_MESSAGES.MSG_022);
      } else {
        toast.error(err.message || RBAC_MESSAGES.MSG_004);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-[#275A4E]">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Ma Trận Phân Quyền Vai Trò (RBAC Matrix)
                </h2>
                <span
                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập quyền truy cập cho nhân sự:{' '}
                <strong className="text-slate-800">{user.fullName}</strong> ({user.email})
              </p>
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

        {/* Thông báo bảo vệ Super Admin */}
        {isSuperAdmin && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Bảo vệ Cấp cao:</strong> Toàn bộ quyền hạn của Super Admin được khóa cố định, không thể chỉnh sửa hoặc thu hồi.
            </span>
          </div>
        )}

        {/* Ma trận phân quyền theo phân hệ */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          {SYSTEM_PERMISSION_MODULES.map((module) => {
            return (
              <div
                key={module.id}
                className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs"
              >
                {/* Module Header */}
                <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{module.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{module.description}</p>
                  </div>

                  {!isSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => handleToggleModule(module)}
                      className="text-xs font-semibold text-[#275A4E] hover:underline px-2 py-1 rounded-lg hover:bg-emerald-50 transition"
                    >
                      Bật/Tắt cả phân hệ
                    </button>
                  )}
                </div>

                {/* Danh sách tính năng và Checkbox */}
                <div className="divide-y divide-slate-100">
                  {module.features.map((feature) => {
                    return (
                      <div
                        key={feature.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">{feature.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            Mã: {feature.code}
                          </p>
                        </div>

                        {/* Nhóm Checkbox 5 quyền hạn */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'] as PermissionAction[])
                            .filter((act) => feature.availableActions.includes(act))
                            .map((action) => {
                              const checked = hasPermission(feature.code, action);
                              const disabled = isSuperAdmin;

                              return (
                                <button
                                  type="button"
                                  key={action}
                                  disabled={disabled}
                                  onClick={() => handleTogglePermission(feature.code, action)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                                    checked
                                      ? 'bg-emerald-50 border-[#275A4E] text-[#275A4E] shadow-2xs font-bold'
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  {checked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-[#275A4E]" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                  <span>{ACTION_LABELS[action].label}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{selectedPermissions.length}</strong> quyền đã được kích hoạt
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Đóng
            </button>

            {!isSuperAdmin && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] active:scale-[0.98] transition shadow-sm hover:shadow disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#78C2AD]" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#78C2AD]" />
                    <span>Lưu Cấu hình Quyền</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsMatrixModal;
