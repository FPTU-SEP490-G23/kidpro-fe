import axiosClient from './axiosClient';

export interface ClassTuitionSummaryDto {
  classId: string;
  className: string;
  gradeLevel: string;
  studentCount: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface TuitionSummaryDto {
  billingMonth: number;
  billingYear: number;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'NOT_INITIALIZED';
  totalStudents: number;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
  rejectionReason?: string;
  message?: string;
  classSummaries: ClassTuitionSummaryDto[];
}

export const tuitionSummaryApi = {
  getTuitionSummary: async (params?: { month?: number; year?: number }) => {
    return axiosClient.get<TuitionSummaryDto>('/bgh/finance/tuition-summary', { params });
  },

  approve: async (params?: { month?: number; year?: number }, note?: string) => {
    return axiosClient.post<TuitionSummaryDto>('/bgh/finance/tuition-summary/approve', { note }, { params });
  },

  reject: async (params: { month?: number; year?: number }, reason: string) => {
    return axiosClient.post<TuitionSummaryDto>('/bgh/finance/tuition-summary/reject', { reason }, { params });
  },
};

export default tuitionSummaryApi;
