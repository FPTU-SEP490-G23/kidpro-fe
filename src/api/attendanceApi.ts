import axiosClient from './axiosClient';
import {
  Attendance,
  BatchAttendancePayload,
  BatchAttendanceRequest,
  CreateLeaveRequestDto,
  LeaveRequest,
  FaceLog,
  EmergencyPickupAuthorization
} from '../types/attendance.types';

export const attendanceApi = {
  // UC-021 & Ghi nhận kết quả quét camera cổng (Check-in & Check-out)
  recordFaceLog: (data: {
    studentId?: string;
    guardianId?: string;
    isMatch: boolean;
    confidenceScore: number;
    photoUrl?: string;
    capturedAt: string;
    eventType?: 'CHECK_IN' | 'CHECK_OUT';
    gateName?: string;
  }) => {
    return axiosClient.post<FaceLog>('/attendance/face-logs', data);
  },

  // Giám sát cảnh báo người lạ / quét thất bại tại cổng
  getUnresolvedAlerts: () => {
    return axiosClient.get<FaceLog[]>('/attendance/face-logs/unresolved-alerts');
  },

  // Điểm danh hàng loạt (Dành cho Giáo viên trên Tablet)
  recordBatchAttendance: (data: BatchAttendancePayload | BatchAttendanceRequest | any) => {
    return axiosClient.post<Attendance[]>('/teachers/attendance/batch', data);
  },

  // Lấy danh sách điểm danh theo ngày & lớp
  getAttendanceByDate: (date: string, classId?: string) => {
    const query = classId ? `?date=${date}&classId=${classId}` : `?date=${date}`;
    return axiosClient.get<Attendance[]>(`/teachers/attendance${query}`);
  },

  // Lấy dữ liệu khóa sổ báo bếp 08:30
  getMealHeadcounts: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return axiosClient.get<any>(`/kitchen/meal-headcounts${query}`);
  },

  // Lấy danh sách ủy quyền đón khẩn cấp trong ngày
  getTodayEmergencyPickups: () => {
    return axiosClient.get<EmergencyPickupAuthorization[]>('/academic/emergency-pickups/today');
  },

  // Xác nhận trao trả trẻ bằng ủy quyền khẩn cấp (chuyển sang USED)
  useEmergencyPickup: (id: string) => {
    return axiosClient.put<EmergencyPickupAuthorization>(`/academic/emergency-pickups/${id}/use`);
  },

  // Phụ huynh nộp đơn xin nghỉ học (Hạn chót 08:00 AM)
  submitLeaveRequest: (data: CreateLeaveRequestDto) => {
    return axiosClient.post<LeaveRequest>('/parents/leave-requests', data);
  },

  // Giải tỏa cảnh báo người lạ tại cổng (ghi nhận alert_resolved_at & mở khóa)
  resolveStrangerAlert: (id: string, data: { notes: string; strangerName?: string; idCard?: string; outcome?: string }) => {
    return axiosClient.put<FaceLog>(`/attendance/face-logs/${id}/resolve-alert`, data);
  },

  // Lấy danh sách quy tắc khung phạt đón muộn
  getLatePickupRules: () => {
    return axiosClient.get<any[]>('/admin/late-pickup-rules');
  },

  // Phê duyệt / Từ chối đơn xin nghỉ học của phụ huynh
  reviewLeaveRequest: (id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNotes?: string; mealRefundApplied?: boolean }) => {
    return axiosClient.put<LeaveRequest>(`/parents/leave-requests/${id}`, data);
  },

  // Lấy danh sách đơn xin nghỉ phép của học sinh
  getStudentLeaveRequests: (studentId: string) => {
    return axiosClient.get<LeaveRequest[]>(`/parents/leave-requests?studentId=${studentId}`);
  },

  // Lấy danh sách tất cả đơn xin nghỉ phép của phụ huynh
  getMyLeaveRequests: () => {
    return axiosClient.get<LeaveRequest[]>('/parents/leave-requests');
  },

  // Cập nhật đơn xin nghỉ
  updateLeaveRequest: (id: string, data: Partial<CreateLeaveRequestDto>) => {
    return axiosClient.put<LeaveRequest>(`/parents/leave-requests/${id}`, data);
  },

  // Hủy/xóa đơn xin nghỉ
  deleteLeaveRequest: (id: string) => {
    return axiosClient.delete(`/parents/leave-requests/${id}`);
  },
};

export default attendanceApi;

