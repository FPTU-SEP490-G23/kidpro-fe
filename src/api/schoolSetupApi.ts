import axiosClient from './axiosClient';

export interface SchoolSetupDto {
  setupId: number;
  academicYearId: string;
  academicYearName?: string;
  gradeLevel: 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';
  gradeName: string;
  ageRange: string;
  totalClasses: number;
  studentsPerClass: number;
  totalGradeCapacity: number;
  teacherRatio: string;
  standardLimit: number;
  note?: string;
  updatedAt?: string;
  message?: string;
}

export interface SchoolSetupUpdateRequest {
  totalClasses: number;
  studentsPerClass: number;
  note?: string;
}

export interface SchoolSetupCreateRequest {
  academicYearId: string;
  gradeLevel: string;
  totalClasses: number;
  studentsPerClass: number;
  note?: string;
}

export const schoolSetupApi = {
  getSetupsByYear: async (academicYearId?: string): Promise<SchoolSetupDto[]> => {
    const url = academicYearId ? `/school-setup?academicYearId=${academicYearId}` : '/school-setup';
    const res: any = await axiosClient.get(url);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  getSetupById: async (setupId: number): Promise<SchoolSetupDto> => {
    const res: any = await axiosClient.get(`/school-setup/${setupId}`);
    return res?.data || res;
  },

  updateSetup: async (setupId: number, data: SchoolSetupUpdateRequest): Promise<SchoolSetupDto> => {
    const res: any = await axiosClient.put(`/school-setup/${setupId}`, data);
    return res?.data || res;
  },

  createOrUpdateSetup: async (data: SchoolSetupCreateRequest): Promise<SchoolSetupDto> => {
    const res: any = await axiosClient.post('/school-setup', data);
    return res?.data || res;
  },
};

export default schoolSetupApi;
