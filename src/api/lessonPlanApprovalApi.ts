import axiosClient from './axiosClient';

export interface LessonPlanApprovalDto {
  id: string;
  title: string;
  topic: string;
  weekNumber: number;
  month: number;
  year: number;
  classId: string;
  className: string;
  gradeLevel: string;
  teacherName: string;
  objectives: string;
  activities: string;
  materials: string;
  status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED';
  reviewNotes?: string;
  submittedDate: string;
  deadlineDate: string;
  message?: string;
}

export const lessonPlanApprovalApi = {
  getLessonPlans: async (params?: { classId?: string; weekNumber?: number; status?: string }) => {
    return axiosClient.get<LessonPlanApprovalDto[]>('/bgh/lesson-plans/approvals', { params });
  },

  getDetail: async (id: string) => {
    return axiosClient.get<LessonPlanApprovalDto>(`/bgh/lesson-plans/approvals/${id}`);
  },

  approve: async (id: string, note?: string) => {
    return axiosClient.post<LessonPlanApprovalDto>(`/bgh/lesson-plans/approvals/${id}/approve`, { note });
  },

  requestRevision: async (id: string, reason: string) => {
    return axiosClient.post<LessonPlanApprovalDto>(`/bgh/lesson-plans/approvals/${id}/request-revision`, { reason });
  },
};

export default lessonPlanApprovalApi;
