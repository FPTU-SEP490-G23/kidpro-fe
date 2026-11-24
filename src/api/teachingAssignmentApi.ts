import axiosClient from './axiosClient';

export interface TeachingAssignmentItem {
  assignmentId: number;
  classId?: string;
  className: string;
  gradeLevel: string;
  staffId?: string;
  staffCode: string;
  teacherName: string;
  qualification: string;
  isHeadTeacher: boolean;
  assignedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export const teachingAssignmentApi = {
  // Lấy danh sách phân công giảng dạy cần duyệt
  getApprovals: async (status: string = 'ALL'): Promise<TeachingAssignmentItem[]> => {
    const res: any = await axiosClient.get(`/bgh/teaching-assignments/approvals?status=${status}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  // Phê duyệt phân công giảng dạy
  approveAssignment: async (id: number): Promise<{ message: string; data: TeachingAssignmentItem }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/${id}/approve`);
    return res?.data || res;
  },

  // Từ chối phân công kèm lý do bắt buộc
  rejectAssignment: async (id: number, reason: string): Promise<{ message: string; data: TeachingAssignmentItem }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/${id}/reject`, { reason });
    return res?.data || res;
  },

  // Khôi phục phân công về Chờ phê duyệt (PENDING)
  resetPendingAssignment: async (id: number): Promise<{ message: string; data: TeachingAssignmentItem }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/${id}/reset-pending`);
    return res?.data || res;
  },

  // Phê duyệt phân công cho cả lớp học (duyệt đồng thời GVCN và Phụ tá)
  approveClassAssignments: async (classId: string): Promise<{ message: string; data: TeachingAssignmentItem[] }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/classes/${classId}/approve`);
    return res?.data || res;
  },

  // Phê duyệt tất cả các lớp đủ điều kiện (đủ GVCN và Phụ tá)
  approveAllAssignments: async (): Promise<{ message: string; approvedCount?: number; data?: TeachingAssignmentItem[] }> => {
    const res: any = await axiosClient.post('/bgh/teaching-assignments/approve-all');
    return res;
  },

  // Từ chối phân công cho cả lớp học kèm lý do
  rejectClassAssignments: async (classId: string, reason: string): Promise<{ message: string; data: TeachingAssignmentItem[] }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/classes/${classId}/reject`, { reason });
    return res?.data || res;
  },

  // Khôi phục phân công của cả lớp về Chờ phê duyệt (PENDING)
  resetPendingClassAssignments: async (classId: string): Promise<{ message: string; data: TeachingAssignmentItem[] }> => {
    const res: any = await axiosClient.post(`/bgh/teaching-assignments/classes/${classId}/reset-pending`);
    return res?.data || res;
  },
};

export default teachingAssignmentApi;
