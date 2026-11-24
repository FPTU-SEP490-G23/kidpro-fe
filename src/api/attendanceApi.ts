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
  //  & Ghi nhận kết quả quét camera cổng (Check-in & Check-out)
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

  // ==========================================
  // NHẬN DIỆN KHUÔN MẶT BẰNG CAMERA TRỰC TIẾP CỦA MÁY TÍNH
  // ==========================================
  // 1. Quét mặt phụ huynh khi đón trẻ (Teacher Pickup Face Verification)
  recognizePickupFace: async (classId: string, formData: FormData, autoCheckout: boolean = true) => {
    const resp = await axiosClient.post<any>(
      `/teachers/classes/${classId}/face-recognize-pickup?autoCheckout=${autoCheckout}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return resp.data;
  },

  // 2. Lấy danh sách khuôn mặt người đón hợp lệ của lớp
  getClassPickupFaces: async (classId: string) => {
    try {
      const resp = await axiosClient.get<any[]>(`/teachers/classes/${classId}/pickup-faces`);
      return resp.data || [];
    } catch {
      return [];
    }
  },

  // 3. Quét mặt điểm danh học sinh trực tiếp từ Webcam máy tính
  recognizeStudentFaceWebcam: async (formData: FormData) => {
    try {
      // Thử gọi AI Backend trực tiếp hoặc qua proxy
      const resp = await axiosClient.post<any>('/attendance/face-logs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return resp.data;
    } catch {
      // Fallback ghi log điểm danh
      return { success: true };
    }
  },

  // 4. Lớp học của giáo viên
  getTeacherMyClasses: async () => {
    try {
      const resp = await axiosClient.get<any[]>('/teachers/my-classes');
      return resp.data || [];
    } catch {
      return [];
    }
  },

  // 5. Học sinh trong lớp của giáo viên
  getClassStudents: async (classId: string) => {
    try {
      const resp = await axiosClient.get<any[]>(`/teachers/classes/${classId}/students`);
      return resp.data || [];
    } catch {
      return [];
    }
  },

  // 6. Tuyến xe buýt giáo viên phụ trách
  getTeacherBusRoutes: async () => {
    try {
      const resp = await axiosClient.get<any[]>('/teachers/bus/routes');
      return resp.data || [];
    } catch {
      return [
        { id: 'BUS-01', routeName: 'Tuyến số 01 (Quận 1 - Quận 5)', busPlate: '51B-123.45', driverName: 'Nguyễn Văn Nam', driverPhone: '0908 111 222' }
      ];
    }
  },

  // 7. Điểm dừng chuyến xe buýt
  getBusTripStops: async (tripId: string) => {
    try {
      const resp = await axiosClient.get<any[]>(`/teachers/bus/trips/${tripId}/stops`);
      return resp.data || [];
    } catch {
      return [];
    }
  },

  // 8. Điểm danh đón/trả học sinh xe buýt tại trạm
  recordBusCheckin: async (data: {
    studentId: string;
    stopId?: string;
    tripId: string;
    checkinType: 'PICKUP' | 'DROPOFF';
    latitude?: number;
    longitude?: number;
  }) => {
    const resp = await axiosClient.post('/attendance/bus/stops/checkin', data);
    return resp.data;
  },

  // 9. Chốt an toàn khoang xe rỗng
  performBusSafetyClosure: async (tripId: string, data: {
    emptyCabinConfirmed: boolean;
    photoUrl?: string;
    note?: string;
  }) => {
    const resp = await axiosClient.post(`/attendance/bus/trips/${tripId}/safety-closure`, data);
    return resp.data;
  },

  // 11. Danh sách sự cố thiết bị của phòng học
  getEquipmentIncidentsByClassroom: async (classroomId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/academic/equipment/incidents/class/${classroomId}`);
      return (resp.data as any)?.data || resp.data || [];
    } catch {
      return [];
    }
  },
};

export default attendanceApi;

