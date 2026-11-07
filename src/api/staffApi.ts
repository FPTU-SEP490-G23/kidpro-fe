import axiosClient from './axiosClient';

export interface StaffMember {
  staffId: string;
  staffCode: string;
  fullName: string;
  department: 'ACADEMIC' | 'ACCOUNTING' | 'KITCHEN' | 'MEDICAL' | 'MANAGEMENT';
  qualification?: string;
  hireDate?: string;
  accountId?: string;
  username?: string;
  phoneNumber?: string;
  email?: string;
  role?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED';
  tempPassword?: string;
}

export interface CreateStaffInput {
  fullName: string;
  phoneNumber: string;
  email: string;
  department: string;
  qualification?: string;
  hireDate?: string;
  role?: string;
  password?: string;
}

export interface UpdateStaffInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
  department: string;
  qualification?: string;
  hireDate?: string;
}

export const staffApi = {
  // Lấy danh sách nhân sự
  getAllStaff: async (): Promise<StaffMember[]> => {
    const res: any = await axiosClient.get('/staff');
    return Array.isArray(res) ? res : (res?.data || []);
  },

  // Chi tiết 1 nhân sự
  getStaffById: async (id: string): Promise<StaffMember> => {
    const res: any = await axiosClient.get(`/staff/${id}`);
    return res?.data || res;
  },

  // Thêm mới hồ sơ (UC-008)
  createStaff: async (data: CreateStaffInput): Promise<{ message: string; data: StaffMember }> => {
    const res: any = await axiosClient.post('/staff', data);
    return res?.data || res;
  },

  // Sửa hồ sơ nhân sự (Rẽ nhánh A1)
  updateStaff: async (id: string, data: UpdateStaffInput): Promise<{ message: string; data: StaffMember }> => {
    const res: any = await axiosClient.put(`/staff/${id}`, data);
    return res?.data || res;
  },

  // Khóa tài khoản nhân sự (Rẽ nhánh A2)
  lockStaff: async (id: string, reason: string): Promise<{ message: string; data: StaffMember }> => {
    const res: any = await axiosClient.patch(`/staff/${id}/lock`, { reason });
    return res?.data || res;
  },

  // Mở khóa tài khoản nhân sự (Rẽ nhánh A3)
  unlockStaff: async (id: string): Promise<{ message: string; data: StaffMember }> => {
    const res: any = await axiosClient.patch(`/staff/${id}/unlock`);
    return res?.data || res;
  },

  // Phân quyền vai trò nhân sự (UC-009)
  updateStaffRole: async (id: string, role: string): Promise<{ message: string; data: StaffMember }> => {
    const res: any = await axiosClient.patch(`/staff/${id}/role`, { role });
    return res?.data || res;
  },
};

export default staffApi;
