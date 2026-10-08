import axiosClient from './axiosClient';
import {
  HealthMetric,
  ClassroomJournalPost,
  DevelopmentEvaluation,
  NapRecord,
  MealRecord,
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
};

export default healthApi;
