import { UserRole } from './auth.types';

export type UserAccountStatus = 'ACTIVE' | 'LOCKED';

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  tenantId: string;
  tenantName: string;
  role: UserRole;
  status: UserAccountStatus;
  avatarUrl?: string;
  lockReason?: string;
  permissions: string[];
  createdAt: string;
  updatedAt?: string;
}

export type PermissionAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'APPROVE';

export interface PermissionFeature {
  id: string;
  code: string;
  name: string;
  availableActions: PermissionAction[];
}

export interface PermissionModule {
  id: string;
  code: string;
  name: string;
  description: string;
  features: PermissionFeature[];
}

export interface CreateUserPayload {
  fullName: string;
  email: string;
  phone: string;
  tenantId: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  tenantId?: string;
}

export interface UpdatePermissionsPayload {
  permissions: string[];
}

export interface UpdateUserStatusPayload {
  status: UserAccountStatus;
  reason?: string;
}

export interface UserListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  role?: string;
  status?: string;
  keyword?: string;
}

// Danh mục mã thông báo hệ thống theo đặc tả UC-006
export const RBAC_MESSAGES = {
  MSG_021: 'MSG-021: Cập nhật ma trận phân quyền vai trò thành công',
  MSG_022: 'MSG-022: Các quyền cốt lõi của Super Admin được bảo vệ tuyệt đối và không thể thu hồi.',
  MSG_023: 'MSG-023: Xung đột phụ thuộc quyền hạn. Quyền Xem là điều kiện tiên quyết bắt buộc.',
  MSG_024: 'MSG-024: Dữ liệu vừa được cập nhật bởi quản trị viên khác. Vui lòng làm mới trang.',
  MSG_015: 'MSG-015: Số điện thoại này đã được liên kết với một tài khoản khác trong hệ thống.',
  MSG_019: 'MSG-019: Địa chỉ email đã được đăng ký. Vui lòng chỉ định một email công vụ khác.',
  MSG_004: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
} as const;
