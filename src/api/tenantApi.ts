import axiosClient from './axiosClient';
import {
  Tenant,
  CreateTenantPayload,
  UpdateTenantPayload,
  DeactivateTenantPayload,
  TenantListParams,
  TENANT_MESSAGES,
} from '../types/tenant.types';

// Dữ liệu mẫu khởi tạo chuẩn môi trường mầm non KIDPRO
const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tnt_001',
    schoolCode: 'KIDPRO_CAUGIAY',
    name: 'Trường Mầm Non Quốc Tế KIDPRO - Cầu Giấy',
    taxCode: '0109887766',
    address: 'Số 15 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
    hotline: '024 3788 9901',
    email: 'caugiay@kidpro.edu.vn',
    licenseNumber: 'GDMN-2024/089-HN',
    adminName: 'Đặng Mai Phương',
    adminEmail: 'phuong.dm@kidpro.edu.vn',
    adminPhone: '0912345678',
    logoUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&h=100&fit=crop',
    subscriptionPackage: 'PREMIUM',
    status: 'ACTIVE',
    totalStudents: 185,
    totalTeachers: 24,
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'tnt_002',
    schoolCode: 'KIDPRO_BADINH',
    name: 'Trường Mầm Non KIDPRO Smile - Ba Đình',
    taxCode: '0109887777',
    address: 'Số 42 Liễu Giai, Ba Đình, Hà Nội',
    hotline: '024 3822 5566',
    email: 'badinh@kidpro.edu.vn',
    licenseNumber: 'GDMN-2023/112-HN',
    adminName: 'Trần Hoài Nam',
    adminEmail: 'nam.th@kidpro.edu.vn',
    adminPhone: '0988776655',
    logoUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=100&h=100&fit=crop',
    subscriptionPackage: 'STANDARD',
    status: 'ACTIVE',
    totalStudents: 140,
    totalTeachers: 18,
    createdAt: '2024-06-15T09:30:00Z',
  },
  {
    id: 'tnt_003',
    schoolCode: 'KIDPRO_HACHIEU',
    name: 'Cơ Sở Mầm Non KIDPRO - Hà Đông',
    taxCode: '0109887788',
    address: 'Khu Đô Thị Văn Quán, Hà Đông, Hà Nội',
    hotline: '024 3311 2233',
    email: 'hadong@kidpro.edu.vn',
    licenseNumber: 'GDMN-2025/044-HN',
    adminName: 'Lê Thanh Bình',
    adminEmail: 'binh.lt@kidpro.edu.vn',
    adminPhone: '0934567890',
    logoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=100&h=100&fit=crop',
    subscriptionPackage: 'BASIC',
    status: 'DEACTIVATED',
    deactivatedReason: 'Bảo trì cải tạo cơ sở vật chất phòng học chống thấm dột theo quy chuẩn PCCC',
    totalStudents: 95,
    totalTeachers: 12,
    createdAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'tnt_004',
    schoolCode: 'KIDPRO_THUDUC',
    name: 'Hệ Thống Mầm Non KIDPRO - Thủ Đức TP.HCM',
    taxCode: '0309998877',
    address: 'Đường Song Hành, Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
    hotline: '028 3999 8888',
    email: 'thuduc@kidpro.edu.vn',
    licenseNumber: 'GDMN-2025/203-HCM',
    adminName: 'Phạm Quỳnh Anh',
    adminEmail: 'anh.pq@kidpro.edu.vn',
    adminPhone: '0909123456',
    subscriptionPackage: 'PREMIUM',
    status: 'INACTIVE',
    totalStudents: 0,
    totalTeachers: 5,
    createdAt: '2026-02-01T14:00:00Z',
  },
];

const LOCAL_STORAGE_KEY = 'kidpro_tenants_db';

const getStoredTenants = (): Tenant[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TENANTS));
      return INITIAL_TENANTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TENANTS;
  }
};

const saveStoredTenants = (data: Tenant[]): void => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

export const tenantApi = {
  // 1. Lấy danh sách tenant phân trang & tìm kiếm
  getTenants: async (params?: TenantListParams): Promise<{ data: Tenant[]; total: number }> => {
    try {
      const res: any = await axiosClient.get('/admin/tenants', {
        params,
      });
      const listData = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : null);
      if (listData && listData.length > 0) {
        return {
          data: listData,
          total: typeof res?.total === 'number' ? res.total : listData.length,
        };
      }
    } catch {
      // Tự động chuyển tiếp sang kho lưu trữ cục bộ nếu backend chưa triển khai endpoint
    }

    let list = getStoredTenants();
    const keyword = params?.keyword?.trim().toLowerCase();
    const status = params?.status;

    if (keyword) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(keyword) ||
          t.schoolCode.toLowerCase().includes(keyword) ||
          t.taxCode.includes(keyword) ||
          t.adminName.toLowerCase().includes(keyword)
      );
    }

    if (status && status !== 'ALL') {
      list = list.filter((t) => t.status === status);
    }

    return {
      data: list,
      total: list.length,
    };
  },

  // 2. Chi tiết tenant
  getTenantById: async (id: string): Promise<Tenant> => {
    try {
      const res: any = await axiosClient.get(`/admin/tenants/${id}`);
      const data = res?.data || res;
      if (data && (data.id || data.schoolCode)) {
        return data;
      }
    } catch {
      // fallback
    }

    const list = getStoredTenants();
    const found = list.find((t) => t.id === id);
    if (!found) throw new Error('Không tìm thấy thông tin trường học');
    return found;
  },

  // 3. Khởi tạo trường học / tenant mới
  createTenant: async (payload: CreateTenantPayload): Promise<Tenant> => {
    try {
      const res: any = await axiosClient.post('/admin/tenants', payload);
      const data = res?.data || res;
      if (data && data.id) {
        const list = getStoredTenants();
        list.unshift(data);
        saveStoredTenants(list);
        return data;
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        throw new Error(TENANT_MESSAGES.MSG_018);
      }
    }

    const list = getStoredTenants();

    // Kiểm tra trùng schoolCode hoặc taxCode
    const duplicateCode = list.some(
      (t) =>
        t.schoolCode.toUpperCase() === payload.schoolCode.toUpperCase() ||
        t.taxCode === payload.taxCode
    );
    if (duplicateCode) {
      throw new Error(TENANT_MESSAGES.MSG_018);
    }

    // Kiểm tra trùng email Hiệu trưởng
    const duplicateEmail = list.some(
      (t) => t.adminEmail.toLowerCase() === payload.adminEmail.toLowerCase()
    );
    if (duplicateEmail) {
      throw new Error(TENANT_MESSAGES.MSG_019);
    }

    const newTenant: Tenant = {
      id: `tnt_${Date.now()}`,
      schoolCode: payload.schoolCode.toUpperCase(),
      name: payload.name,
      taxCode: payload.taxCode,
      address: payload.address,
      hotline: payload.hotline,
      email: payload.email,
      licenseNumber: payload.licenseNumber,
      adminName: payload.adminName,
      adminEmail: payload.adminEmail,
      adminPhone: payload.adminPhone,
      logoUrl:
        payload.logoUrl ||
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop',
      subscriptionPackage: payload.subscriptionPackage || 'STANDARD',
      status: 'ACTIVE',
      totalStudents: 0,
      totalTeachers: 1,
      createdAt: new Date().toISOString(),
    };

    list.unshift(newTenant);
    saveStoredTenants(list);
    return newTenant;
  },

  // 4. Chỉnh sửa thông tin trường học
  updateTenant: async (id: string, payload: UpdateTenantPayload): Promise<Tenant> => {
    try {
      const res: any = await axiosClient.put(`/admin/tenants/${id}`, payload);
      const data = res?.data || res;
      if (data && data.id) {
        return data;
      }
    } catch {
      // fallback
    }

    const list = getStoredTenants();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Không tìm thấy trường học');

    const updated: Tenant = {
      ...list[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    list[index] = updated;
    saveStoredTenants(list);
    return updated;
  },

  // 5. Cập nhật trạng thái (Tạm dừng / Mở lại)
  changeTenantStatus: async (
    id: string,
    payload: { status: 'ACTIVE' | 'DEACTIVATED' | 'INACTIVE'; reason?: string }
  ): Promise<Tenant> => {
    try {
      const res: any = await axiosClient.patch(`/admin/tenants/${id}/status`, payload);
      const data = res?.data || res;
      if (data && data.id) {
        return data;
      }
    } catch {
      // fallback
    }

    const list = getStoredTenants();
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Không tìm thấy trường học');

    list[index].status = payload.status;
    if (payload.reason) {
      list[index].deactivatedReason = payload.reason;
    } else if (payload.status === 'ACTIVE') {
      delete list[index].deactivatedReason;
    }

    saveStoredTenants(list);
    return list[index];
  },
};

export default tenantApi;
