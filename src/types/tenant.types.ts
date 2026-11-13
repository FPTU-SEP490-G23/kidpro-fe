export type TenantStatus = 'ACTIVE' | 'DEACTIVATED' | 'INACTIVE';
export type SubscriptionPackage = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface Tenant {
  id: string;
  schoolCode: string; // Viết liền không dấu, in hoa (VD: KIDPRO_HANOI)
  name: string;
  taxCode: string;
  address: string;
  hotline: string;
  email: string;
  licenseNumber: string; // Số giấy phép hoạt động GDMN (Bắt buộc)
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  logoUrl?: string;
  licenseDocumentUrl?: string;
  subscriptionPackage: SubscriptionPackage;
  status: TenantStatus;
  deactivatedReason?: string;
  totalStudents?: number;
  totalClasses?: number;
  totalTeachers?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTenantPayload {
  schoolCode: string;
  name: string;
  taxCode: string;
  address: string;
  hotline: string;
  email: string;
  licenseNumber: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  logoUrl?: string;
  licenseDocumentUrl?: string;
  subscriptionPackage?: SubscriptionPackage;
}

export interface UpdateTenantPayload {
  name: string;
  address: string;
  adminName: string;
  hotline: string;
  email: string;
  logoUrl?: string;
}

export interface DeactivateTenantPayload {
  status: 'DEACTIVATED';
  reason: string;
}

export interface TenantListParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
}

// Danh mục mã thông báo hệ thống theo đặc tả 
export const TENANT_MESSAGES = {
  MSG_016: 'Khởi tạo phân vùng trường học thành công',
  MSG_017: 'Cập nhật trạng thái hoạt động của trường học thành công.',
  MSG_018: 'Mã trường học hoặc Mã số thuế đã tồn tại trên hệ thống. Vui lòng chọn định danh duy nhất.',
  MSG_019: 'Địa chỉ email đã được đăng ký. Vui lòng chỉ định một email công vụ khác.',
  MSG_020: 'Số giấy phép hoạt động giáo dục mầm non là thông tin bắt buộc khi khởi tạo trường.',
  MSG_004: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
} as const;
