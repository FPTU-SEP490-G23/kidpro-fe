import axiosClient from './axiosClient';
import {
  Attendance,
  BatchAttendanceRequest,
  CreateLeaveRequestDto,
  LeaveRequest,
} from '../types/attendance.types';

export const attendanceApi = {
  // Điểm danh hàng loạt (Dành cho Giáo viên)
  recordBatchAttendance: (data: BatchAttendanceRequest) => {
    return axiosClient.post<Attendance[]>('/teachers/attendance/batch', data);
  },

  // Lấy danh sách điểm danh theo ngày
  getAttendanceByDate: (date: string) => {
    return axiosClient.get<Attendance[]>(`/teachers/attendance?date=${date}`);
  },

  // Phụ huynh nộp đơn xin nghỉ học (Hạn chót 08:00 AM)
  submitLeaveRequest: (data: CreateLeaveRequestDto) => {
    return axiosClient.post<LeaveRequest>('/parents/leave-requests', data);
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
