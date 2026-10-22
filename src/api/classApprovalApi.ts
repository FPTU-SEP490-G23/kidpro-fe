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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export const classApprovalApi = {
  // Lấy danh sách lớp cần duyệt
  getApprovals: async (status: string = 'ALL'): Promise<ClassApprovalItem[]> => {
    const res: any = await axiosClient.get(`/bgh/classes/approvals?status=${status}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  // Phê duyệt mở lớp (BR-011)
  approveClass: async (classId: string): Promise<{ message: string; data: ClassApprovalItem }> => {
    const res: any = await axiosClient.patch(`/bgh/classes/${classId}/approve`);
    return res?.data || res;
  },

  // Từ chối mở lớp kèm lý do bắt buộc (MSG-033)
  rejectClass: async (classId: string, reason: string): Promise<{ message: string; data: ClassApprovalItem }> => {
    const res: any = await axiosClient.patch(`/bgh/classes/${classId}/reject`, { reason });
    return res?.data || res;
  },
};

export default classApprovalApi;
