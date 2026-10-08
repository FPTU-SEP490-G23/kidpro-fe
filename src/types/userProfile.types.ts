import { UserRole } from './auth.types';

export interface UserProfile {
  id: string;
  userCode: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  schoolName: string;
  schoolCode: string;
  avatarUrl?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
}

export interface UpdateProfilePayload {
  email: string;
  phone: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Danh mục mã thông báo hệ thống theo đặc tả UC-004
export const PROFILE_MESSAGES = {
  MSG_011: 'MSG-011: Cập nhật hồ sơ cá nhân thành công',
  MSG_012: 'MSG-012: Đổi mật khẩu tài khoản cá nhân thành công.',
  MSG_013: 'MSG-013: Vui lòng nhập đúng định dạng Email/Số điện thoại hoặc Mật khẩu không được để trống.',
  MSG_014: 'MSG-014: Tệp ảnh đại diện phải có định dạng JPG/PNG và dung lượng dưới 5MB.',
  MSG_015: 'MSG-015: Số điện thoại này đã được liên kết với một tài khoản khác trong hệ thống.',
  MSG_007: 'MSG-007: Mật khẩu mới không đáp ứng chính sách bảo mật hoặc xác nhận mật khẩu không khớp.',
  MSG_004: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
} as const;
