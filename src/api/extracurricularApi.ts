import axiosClient from './axiosClient';

export interface ExtracurricularClassDto {
  extracurricularClassId: string;
  className: string;
  serviceId: string;
  serviceName: string;
  tuitionFee: number;
  classroomId?: string;
  classroomName: string;
  scheduleDescription: string;
  maxCapacity: number;
  externalInstructorName: string;
  academicYearId: string;
  academicYearName: string;
  isActive: boolean;
  message?: string;
}

export interface ExtracurricularClassCreatePayload {
  className: string;
  academicYearId: string;
  classroomId?: string;
  scheduleDescription: string;
  maxCapacity: number;
  externalInstructorName?: string;
  tuitionFee: number;
}

export interface ExtracurricularClassUpdatePayload {
  className: string;
  classroomId?: string;
  scheduleDescription: string;
  maxCapacity: number;
  externalInstructorName?: string;
  tuitionFee: number;
}

export const extracurricularApi = {
  getClasses: async (params?: { academicYearId?: string; activeOnly?: boolean }) => {
    return axiosClient.get<ExtracurricularClassDto[]>('/bgh/extracurricular-classes', { params });
  },

  getDetail: async (id: string) => {
    return axiosClient.get<ExtracurricularClassDto>(`/bgh/extracurricular-classes/${id}`);
  },

  createAndApproveClass: async (payload: ExtracurricularClassCreatePayload) => {
    return axiosClient.post<ExtracurricularClassDto>('/bgh/extracurricular-classes', payload);
  },

  updateClass: async (id: string, payload: ExtracurricularClassUpdatePayload) => {
    return axiosClient.put<ExtracurricularClassDto>(`/bgh/extracurricular-classes/${id}`, payload);
  },

  toggleStatus: async (id: string) => {
    return axiosClient.patch<ExtracurricularClassDto>(`/bgh/extracurricular-classes/${id}/toggle-status`);
  },

  updateTuitionFee: async (id: string, tuitionFee: number) => {
    return axiosClient.patch<ExtracurricularClassDto>(`/bgh/extracurricular-classes/${id}/tuition-fee`, { tuitionFee });
  },
};

export default extracurricularApi;
