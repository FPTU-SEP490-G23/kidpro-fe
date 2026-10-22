import axiosClient from './axiosClient';

export interface DevelopmentEvaluationDto {
  evaluationId: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  evaluationPeriod: string;
  physicalScore: string;
  cognitiveScore: string;
  languageScore: string;
  socialEmotionalScore: string;
  aestheticScore: string;
  teacherName: string;
  status: 'PENDING' | 'APPROVED' | 'NEEDS_REVISION';
  reviewNote?: string;
  message?: string;
}

export const developmentEvaluationApi = {
  getEvaluations: async (params?: { classId?: string; period?: string; status?: string }) => {
    return axiosClient.get<DevelopmentEvaluationDto[]>('/bgh/evaluations/approvals', { params });
  },

  approve: async (id: number, note?: string) => {
    return axiosClient.post<DevelopmentEvaluationDto>(`/bgh/evaluations/approvals/${id}/approve`, { note });
  },

  batchApprove: async (payload: { evaluationIds?: number[]; classId?: string; period?: string; note?: string }) => {
    return axiosClient.post<{ success: boolean; approvedCount: number; message: string }>(
      '/bgh/evaluations/approvals/batch-approve',
      payload
    );
  },

  reject: async (id: number, reason: string) => {
    return axiosClient.post<DevelopmentEvaluationDto>(`/bgh/evaluations/approvals/${id}/reject`, { reason });
  },
};

export default developmentEvaluationApi;
