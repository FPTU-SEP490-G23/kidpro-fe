import { axiosClient } from '../api/axiosClient';
import {
  ClubAssignmentDetailResponse,
  AvailableClubTeacherResponse,
  ExtracurricularAssignmentPayload
} from '../types/extracurricular.types';

export const extracurricularAssignmentService = {
  getClasses: async (params?: {
    academicYearId?: string;
    status?: string;
  }): Promise<ClubAssignmentDetailResponse[]> => {
    const res: any = await axiosClient.get('/extracurricular-classes', { params });
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  getUnassignedClasses: async (): Promise<ClubAssignmentDetailResponse[]> => {
    const res: any = await axiosClient.get('/extracurricular-classes/unassigned');
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  getAvailableTeachers: async (classId: string): Promise<AvailableClubTeacherResponse[]> => {
    const res: any = await axiosClient.get(`/extracurricular-classes/${classId}/available-teachers`);
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  assignTeachers: async (
    classId: string,
    payload: ExtracurricularAssignmentPayload
  ): Promise<ClubAssignmentDetailResponse> => {
    const res: any = await axiosClient.post(`/extracurricular-classes/${classId}/assignments`, payload);
    return res?.data !== undefined ? res.data : res;
  }
};
