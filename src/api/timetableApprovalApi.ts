import axiosClient from './axiosClient';

export interface TimetableSlot {
  timetableId: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  activityName: string;
}

export interface TimetableClassApproval {
  classId: string;
  className: string;
  gradeLevel: string;
  roomName: string;
  building: string;
  totalSlots: number;
  status: 'PENDING' | 'PUBLISHED' | 'NEEDS_REVISION';
  revisionNotes?: string;
  slots?: TimetableSlot[];
}

export const timetableApprovalApi = {
  // Lấy danh sách thời khóa biểu các lớp cần duyệt
  getApprovals: async (status: string = 'ALL'): Promise<TimetableClassApproval[]> => {
    const res: any = await axiosClient.get(`/bgh/timetables/approvals?status=${status}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  // Xem chi tiết lịch học tuần của lớp
  getClassTimetableDetail: async (classId: string): Promise<TimetableClassApproval> => {
    const res: any = await axiosClient.get(`/bgh/timetables/class/${classId}`);
    return res?.data || res;
  },

  // Phê duyệt & Ban hành thời khóa biểu (BR-011, BR-013)
  approveTimetable: async (classId: string): Promise<{ message: string; data: TimetableClassApproval }> => {
    const res: any = await axiosClient.patch(`/bgh/timetables/class/${classId}/approve`);
    return res?.data || res;
  },

  // Yêu cầu chỉnh sửa kèm góp ý chuyên môn (MSG-033)
  requestRevision: async (classId: string, reason: string): Promise<{ message: string; data: TimetableClassApproval }> => {
    const res: any = await axiosClient.patch(`/bgh/timetables/class/${classId}/request-revision`, { reason });
    return res?.data || res;
  },
};

export default timetableApprovalApi;
