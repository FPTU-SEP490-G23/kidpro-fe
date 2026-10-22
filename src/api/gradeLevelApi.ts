import axiosClient from './axiosClient';

export interface GradeLevelQuota {
  quotaId: string;
  gradeLevel: 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN';
  gradeName: string;
  ageRange: string;
  maxCapacity: number;
  teacherRatio: string;
  standardLimit: number;
  description?: string;
  message?: string;
}

export const gradeLevelApi = {
  getAllQuotas: async (): Promise<GradeLevelQuota[]> => {
    const res: any = await axiosClient.get('/grade-levels');
    return Array.isArray(res) ? res : (res?.data || []);
  },

  getQuotaByGradeLevel: async (gradeLevel: string): Promise<GradeLevelQuota> => {
    const res: any = await axiosClient.get('/grade-levels/' + gradeLevel);
    return res?.data || res;
  },

  updateQuota: async (gradeLevel: string, maxCapacity: number): Promise<GradeLevelQuota> => {
    const res: any = await axiosClient.put('/grade-levels/' + gradeLevel + '/quota', {
      maxCapacity,
    });
    return res?.data || res;
  },
};

export default gradeLevelApi;
