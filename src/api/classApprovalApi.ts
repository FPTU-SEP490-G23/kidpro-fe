import axiosClient from './axiosClient';

export interface ClassApprovalItem {
  classId: string;
  className: string;
  gradeLevel: string;
  maxCapacity: number;
  classroomId?: string;
  roomName?: string;
  building?: string;
  academicYearId?: string;
  academicYearName?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  rejectionReason?: string;
}

export const classApprovalApi = {
  // Lấy danh sách lớp cần duyệt
  getApprovals: async (status: string = 'ALL'): Promise<ClassApprovalItem[]> => {
    // Map 'PENDING' → 'PENDING_APPROVAL' để khớp với enum ClassStatus của backend
    const mappedStatus = status === 'PENDING' ? 'PENDING_APPROVAL' : status;
    const res: any = await axiosClient.get(`/bgh/classes/approvals?status=${mappedStatus}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  // Phê duyệt mở lớp
  approveClass: async (classId: string): Promise<{ message: string; data: ClassApprovalItem }> => {
    const res: any = await axiosClient.post(`/bgh/classes/${classId}/approve`);
    return res?.data || res;
  },

  // Từ chối mở lớp kèm lý do bắt buộc
  rejectClass: async (classId: string, reason: string): Promise<{ message: string; data: ClassApprovalItem }> => {
    const res: any = await axiosClient.post(`/bgh/classes/${classId}/reject`, { reason });
    return res?.data || res;
  },

  // Khôi phục trạng thái về Chờ phê duyệt (PENDING) khi duyệt/từ chối nhầm
  resetPendingClass: async (classId: string): Promise<{ message: string; data: ClassApprovalItem }> => {
    const res: any = await axiosClient.post(`/bgh/classes/${classId}/reset-pending`);
    return res?.data || res;
  },
};

export default classApprovalApi;
