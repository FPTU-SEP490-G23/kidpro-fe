import axiosClient from './axiosClient';
import {
  Student,
  ClassEntity,
  Timetable,
  StudentAllergyProfile,
  UpdateAllergyPayload,
  WeeklyLessonPlan,
  CreateLessonPlanPayload,
  SaveClassEvaluationPayload,
  ReviewLessonPlanPayload,
  ClassroomEquipmentItem,
  TransferEquipmentPayload,
  EquipmentRequisitionItem,
} from '../types/classroom.types';

export const academicApi = {
  // Tiếp nhận Học sinh
  getStudents: (params?: { classId?: string; status?: string; keyword?: string }) => {
    return axiosClient.get<Student[]>('/academic/students', { params });
  },
  createStudentAndEnroll: (data: any) => {
    return axiosClient.post<Student>('/academic/students', data);
  },
  updateAllergyTags: (id: string, data: { allergyTags: string }) => {
    return axiosClient.patch(`/academic/students/${id}/allergy-tags`, data);
  },
  registerGuardian: (studentId: string, data: any) => {
    return axiosClient.post(`/parents/students/${studentId}/guardians`, data);
  },
  getActiveAcademicYear: () => {
    return axiosClient.get<any>('/academic-years/active');
  },

  // Phân công Giáo viên Phụ trách Lớp
  getClasses: (params?: { academicYearId?: string; ageGroup?: string }) => {
    return axiosClient.get<ClassEntity[]>('/classes', { params });
  },
  getClassById: (id: string) => {
    return axiosClient.get<ClassEntity>(`/classes/${id}`);
  },
  createClass: (data: any) => {
    return axiosClient.post<ClassEntity>('/classes', data);
  },
  updateClass: (id: string, data: any) => {
    return axiosClient.put<ClassEntity>(`/classes/${id}`, data);
  },
  deleteClass: (id: string) => {
    return axiosClient.delete(`/classes/${id}`);
  },
  // Phê duyệt Cơ cấu Lớp học (BGH)
  approveClass: (id: string, status?: string) => {
    return axiosClient.put<ClassEntity>(`/classes/${id}/approve`, { status: status || 'APPROVED' });
  },
  approveAllClasses: (academicYearId?: string) => {
    return axiosClient.put<ClassEntity[]>('/classes/approve-all', null, { params: academicYearId ? { academicYearId } : {} });
  },
  getActiveTeachers: () => {
    return axiosClient.get<any[]>('/admin/users', { params: { role: 'GIAO_VIEN', status: 'ACTIVE' } });
  },

  // UC-017 & Xếp Thời khóa biểu & Kiểm tra Xung đột Lịch
  getTimetables: (params?: { classId?: string }) => {
    return axiosClient.get<Timetable[]>('/academic/timetables', { params });
  },
  getAllTimetables: () => {
    return axiosClient.get<Timetable[]>('/academic/timetables');
  },
  createTimetable: (data: any) => {
    return axiosClient.post<Timetable>('/academic/timetables', data);
  },
  updateTimetable: (id: string, data: any) => {
    return axiosClient.put<Timetable>(`/academic/timetables/${id}`, data);
  },
  deleteTimetable: (id: string) => {
    return axiosClient.delete(`/academic/timetables/${id}`);
  },

  // Xử lý Đơn Chuyển lớp & Bảo lưu
  getTransferRequests: (params?: { status?: string; classId?: string; keyword?: string }) => {
    return axiosClient.get<any[]>('/academic/transfer-requests', { params });
  },
  reviewTransferRequest: (id: string, data: { status: 'APPROVED' | 'REJECTED'; reviewNotes: string }) => {
    return axiosClient.put(`/academic/transfer-requests/${id}/review`, data);
  },

  // Thẩm định Hồ sơ Người đón Ủy quyền & Face Vector
  getGuardians: (params?: { status?: string; keyword?: string; studentId?: string }) => {
    return axiosClient.get<any[]>('/academic/guardians', { params });
  },
  verifyGuardian: (id: string, data: { status: 'VERIFIED' | 'REJECTED'; notes: string }) => {
    return axiosClient.put(`/academic/guardians/${id}/verify`, data);
  },
  updateGuardianFaceEmbedding: (id: string, data: { faceEmbedding: string | number[] }) => {
    return axiosClient.put(`/academic/guardians/${id}/face-embedding`, data);
  },

  // Hiển thị Cảnh báo Dị ứng Toàn hệ thống (System-wide Allergy Alert Broadcasting)
  getAllergyAlerts: (params?: { category?: string; severity?: string; classId?: string; keyword?: string }) => {
    return axiosClient.get<StudentAllergyProfile[]>('/academic/students/by-allergy', { params });
  },
  updateStudentAllergyAlert: (studentId: string, data: UpdateAllergyPayload) => {
    return axiosClient.patch(`/academic/students/${studentId}/allergy-tags`, data);
  },
  dismissAllergyAlert: (studentId: string, data: { doctorCertificateUrl: string; reason: string }) => {
    return axiosClient.post(`/academic/students/${studentId}/dismiss-allergy`, data);
  },

  // UC-054 & Gửi & Thẩm định, Phê duyệt Giáo án Tuần (Lesson Plan Review & Approval)
  getWeeklyLessonPlans: (params?: { weekNumber?: number; academicYear?: string; classId?: string; status?: string }) => {
    return axiosClient.get<WeeklyLessonPlan[]>('/academic/lesson-plans', { params });
  },
  saveLessonPlan: (data: CreateLessonPlanPayload) => {
    return axiosClient.post<WeeklyLessonPlan>('/academic/lesson-plans', data);
  },
  reviewLessonPlan: (id: string, data: ReviewLessonPlanPayload | { status: 'APPROVED' | 'REVISION_REQUESTED'; reviewNotes?: string }) => {
    return axiosClient.put<WeeklyLessonPlan>(`/academic/lesson-plans/${id}/review`, data);
  },
  sendLessonPlanNotification: (data: { title: string; content: string; targetRole: string; classId?: string }) => {
    return axiosClient.post('/comms/announcements', data);
  },

  // Đánh giá 5 Lĩnh vực Phát triển Mầm non theo Thông tư 28/2016/TT-BGDĐT
  getEvaluations: (params?: { classId?: string; academicYearId?: string; term?: string }) => {
    return axiosClient.get<any[]>('/health/evaluations', { params });
  },
  saveStudentEvaluation: (data: {
    studentId: string;
    academicYearId: string;
    term: string;
    physicalScore: number;
    cognitiveScore: number;
    languageScore: number;
    emotionalScore: number;
    aestheticScore: number;
    teacherNotes: string;
    status?: 'DRAFT' | 'SUBMITTED';
  }) => {
    return axiosClient.post('/health/evaluations', data);
  },
  saveClassEvaluationsBatch: (data: SaveClassEvaluationPayload) => {
    return axiosClient.post('/health/evaluations/batch', data);
  },

  // Quản lý Đồ dùng & Thiết bị Dạy học Lớp (Thông tư 34/2013/TT-BGDĐT)
  getClassroomEquipment: (params?: { classId?: string; roomNumber?: string }) => {
    return axiosClient.get<ClassroomEquipmentItem[]>('/admin/equipment', { params });
  },
  saveClassroomEquipmentInventory: (classId: string, items: ClassroomEquipmentItem[]) => {
    return axiosClient.put<ClassroomEquipmentItem[]>(`/classes/${classId}/equipment`, { items });
  },
  transferClassroomEquipment: (data: TransferEquipmentPayload) => {
    return axiosClient.post<{ success: boolean; message: string }>('/classes/equipment/transfer', data);
  },
  createEquipmentRequisition: (requisition: EquipmentRequisitionItem) => {
    return axiosClient.post('/admin/equipment/requisitions', requisition);
  },

  // Xuất Sổ Điểm danh theo Mẫu Phòng/Bộ GD&ĐT
  getMoetAttendanceReport: (params: { classId: string; month: number; year: number; academicYearId?: string }) => {
    return axiosClient.get<any>('/academic/reports/attendance-moet', { params });
  },
  exportMoetAttendanceExcel: (params: { classId: string; month: number; year: number }) => {
    return axiosClient.get('/academic/reports/attendance-moet/export/excel', { params, responseType: 'blob' });
  },
  exportMoetAttendanceZip: (params: { academicYearId: string; month: number; year: number }) => {
    return axiosClient.get('/academic/reports/attendance-moet/export/zip', { params, responseType: 'blob' });
  },

  // Tra cứu & trích lục hồ sơ học bạ đã đóng sổ
  getArchivedDossiers: (params?: { academicYearId?: string; keyword?: string }) => {
    return axiosClient.get<any[]>('/academic/students/archived-dossiers', { params });
  },
};



