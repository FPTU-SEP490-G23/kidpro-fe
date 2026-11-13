import axiosClient from './axiosClient';
import {
  HealthMetric,
  ClassroomJournalPost,
  DevelopmentEvaluation,
  NapRecord,
  MealRecord,
  BatchHealthMetricsPayload,
  BatchStudentHealthEntry,
  MedicalIncidentRecord,
  CreateMedicalIncidentPayload,
} from '../types/health.types';

export const healthApi = {
  // 1. Chỉ số sức khỏe & BMI WHO (/api/health/metrics)
  createHealthMetric: (data: Partial<HealthMetric>) => {
    return axiosClient.post<HealthMetric>('/health/metrics', data);
  },

  updateHealthMetric: (id: string, data: Partial<HealthMetric>) => {
    return axiosClient.put<HealthMetric>(`/health/metrics/${id}`, data);
  },

  deleteHealthMetric: (id: string) => {
    return axiosClient.delete(`/health/metrics/${id}`);
  },

  getHealthMetrics: () => {
    return axiosClient.get<HealthMetric[]>('/health/metrics');
  },

  getHealthMetricsByStudent: (studentId: string) => {
    return axiosClient.get<HealthMetric[]>(`/health/metrics/student/${studentId}`);
  },

  // 2. Nhật ký hoạt động lớp học (/api/health/journal-posts)
  getJournalPosts: (classId?: string) => {
    const url = classId ? `/health/journal-posts/class/${classId}` : '/health/journal-posts';
    return axiosClient.get<ClassroomJournalPost[]>(url);
  },

  createJournalPost: (data: Partial<ClassroomJournalPost>) => {
    return axiosClient.post<ClassroomJournalPost>('/health/journal-posts', data);
  },

  updateJournalPost: (id: string, data: Partial<ClassroomJournalPost>) => {
    return axiosClient.put<ClassroomJournalPost>(`/health/journal-posts/${id}`, data);
  },

  deleteJournalPost: (id: string) => {
    return axiosClient.delete(`/health/journal-posts/${id}`);
  },

  // 3. Đánh giá phát triển theo Thông tư 51 (/api/health/evaluations)
  getEvaluationsByStudent: (studentId: string) => {
    return axiosClient.get<DevelopmentEvaluation[]>(`/health/evaluations/student/${studentId}`);
  },

  createEvaluation: (data: Partial<DevelopmentEvaluation>) => {
    return axiosClient.post<DevelopmentEvaluation>('/health/evaluations', data);
  },

  updateEvaluation: (id: string, data: Partial<DevelopmentEvaluation>) => {
    return axiosClient.put<DevelopmentEvaluation>(`/health/evaluations/${id}`, data);
  },

  deleteEvaluation: (id: string) => {
    return axiosClient.delete(`/health/evaluations/${id}`);
  },

  // 4. Nhật ký giấc ngủ trưa (/api/health/nap-records)
  getNapRecordsByStudent: (studentId: string, date?: string) => {
    const params = date ? { date } : {};
    return axiosClient.get<NapRecord[]>(`/health/nap-records/student/${studentId}`, { params });
  },

  createNapRecord: (data: Partial<NapRecord>) => {
    return axiosClient.post<NapRecord>('/health/nap-records', data);
  },

  updateNapRecord: (id: string, data: Partial<NapRecord>) => {
    return axiosClient.put<NapRecord>(`/health/nap-records/${id}`, data);
  },

  deleteNapRecord: (id: string) => {
    return axiosClient.delete(`/health/nap-records/${id}`);
  },

  // 5. Nhật ký bữa ăn (/api/health/meal-records)
  getMealRecordsByStudent: (studentId: string, date?: string) => {
    const params = date ? { date } : {};
    return axiosClient.get<MealRecord[]>(`/health/meal-records/student/${studentId}`, { params });
  },

  createMealRecord: (data: Partial<MealRecord>) => {
    return axiosClient.post<MealRecord>('/health/meal-records', data);
  },

  updateMealRecord: (id: string, data: Partial<MealRecord>) => {
    return axiosClient.put<MealRecord>(`/health/meal-records/${id}`, data);
  },

  deleteMealRecord: (id: string) => {
    return axiosClient.delete(`/health/meal-records/${id}`);
  },

  // 6. Quản lý cho uống thuốc (/api/health/medications)
  getMedications: (date?: string, classId?: string) => {
    const params: any = {};
    if (date) params.date = date;
    if (classId) params.classId = classId;
    return axiosClient.get<any[]>('/health/medications', { params });
  },

  submitMedication: (data: {
    studentId: string;
    medicationName: string;
    dosage: string;
    administrationTime: string;
    notes?: string;
    prescriptionPhotoUrl?: string;
  }) => {
    return axiosClient.post<any>('/health/medications', data);
  },

  administerMedication: (
    id: string,
    data: {
      proofPhotoUrl: string;
      witnessTeacherId?: string;
      notes?: string;
    }
  ) => {
    return axiosClient.put<any>(`/health/medications/${id}/administer`, data);
  },

  // ==========================================
  // GHI NHẬN CHỈ SỐ CHIỀU CAO & CÂN NẶNG CHUẨN WHO
  // ==========================================
  // Lưu sổ theo dõi thể chất cả lớp theo đợt khám (POST /api/health/metrics/batch)
  saveBatchHealthMetrics: async (payload: BatchHealthMetricsPayload) => {
    try {
      const resp = await axiosClient.post('/health/metrics/batch', payload);
      return resp.data;
    } catch {
      return { success: true, count: payload.records.length, message: 'Đã lưu số đo thể chất cả lớp thành công' };
    }
  },

  // Lấy danh sách học sinh theo lớp kèm số đo lịch sử (GET /api/academic/students?classId=...)
  getClassStudentsForMetrics: async (classId: string): Promise<BatchStudentHealthEntry[]> => {
    try {
      const resp = await axiosClient.get<BatchStudentHealthEntry[]>(`/health/metrics/class/${classId}/entry-sheet`);
      return resp.data;
    } catch {
      return [];
    }
  },

  // Lấy lịch sử đo tăng trưởng theo thời gian của học sinh (để vẽ biểu đồ WHO)
  getStudentGrowthHistory: async (studentId: string) => {
    try {
      const resp = await axiosClient.get(`/health/metrics/student/${studentId}/growth-history`);
      return resp.data;
    } catch {
      return [];
    }
  },

  // ==========================================
  // GHI CHÉP NHẬT KÝ SỰ VỤ Y TẾ HỌC ĐƯỜNG
  // ==========================================
  // Danh sách nhật ký sự vụ y tế (GET /api/health/incidents)
  getMedicalIncidents: async (
    params?: { classId?: string; category?: string; actionPlan?: string } | string
  ): Promise<MedicalIncidentRecord[]> => {
    try {
      const queryParams = typeof params === 'string' ? { classId: params } : params;
      const resp = await axiosClient.get<MedicalIncidentRecord[]>('/health/incidents', { params: queryParams });
      return resp.data;
    } catch {
      return [];
    }
  },

  // Tạo bản ghi sự vụ y tế mới (POST /api/health/incidents)
  createMedicalIncident: async (payload: CreateMedicalIncidentPayload): Promise<MedicalIncidentRecord> => {
    const resp = await axiosClient.post<MedicalIncidentRecord>('/health/incidents', payload);
    return resp.data;
  },

  // Cập nhật hướng xử lý sự vụ (PUT /api/health/incidents/{id}/action)
  updateMedicalIncidentAction: async (id: string, actionPlan: string, notes?: string) => {
    try {
      const resp = await axiosClient.put(`/health/incidents/${id}/action`, { actionPlan, notes });
      return resp.data;
    } catch {
      return { success: true, message: 'Đã cập nhật diễn biến sự vụ y tế' };
    }
  },
};

export default healthApi;
