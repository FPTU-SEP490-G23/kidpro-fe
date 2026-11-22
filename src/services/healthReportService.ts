import { axiosClient } from '../api/axiosClient';
import {
  HealthDashboardResponse,
  MeasurementRoundResponse,
  PhysicalRegisterExportParams,
  PhysicalRegisterResponse
} from '../types/healthReport.types';

export const healthReportService = {
  getMeasurementRounds: async (academicYearId?: string): Promise<MeasurementRoundResponse[]> => {
    const params = academicYearId ? { academicYearId } : {};
    const res: any = await axiosClient.get('/health-reports/measurement-rounds', { params });
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  getDashboardData: async (params?: {
    academicYearId?: string;
    roundId?: string;
    classId?: string;
    gradeLevel?: string;
  }): Promise<HealthDashboardResponse> => {
    const res: any = await axiosClient.get('/health-reports/dashboard', { params });
    return res?.data !== undefined ? res.data : res;
  },

  exportPhysicalRegister: async (params: PhysicalRegisterExportParams): Promise<PhysicalRegisterResponse> => {
    const res: any = await axiosClient.get('/health-reports/physical-register/data', { params });
    return res?.data !== undefined ? res.data : res;
  },

  downloadPhysicalRegisterFile: async (params: {
    classId?: string;
    measurementRoundId: string;
    format: 'PDF' | 'EXCEL';
  }): Promise<Blob> => {
    const cleanParams: any = {
      measurementRoundId: params.measurementRoundId,
      format: params.format
    };
    if (params.classId && params.classId !== 'ALL') {
      cleanParams.classId = params.classId;
    }
    const response = await axiosClient.get('/health-reports/physical-register/export', {
      params: cleanParams,
      responseType: 'blob'
    });
    return response as unknown as Blob;
  },

  createMeasurementRound: async (payload: {
    roundName: string;
    academicYearId?: string;
    startDate: string;
    endDate: string;
  }): Promise<MeasurementRoundResponse> => {
    const res: any = await axiosClient.post('/health-reports/rounds', payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateMeasurementRound: async (id: string, payload: {
    roundName?: string;
    startDate?: string;
    endDate?: string;
    academicYearId?: string;
  }): Promise<MeasurementRoundResponse> => {
    const res: any = await axiosClient.put(`/health-reports/rounds/${id}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  lockMeasurementRound: async (id: string): Promise<MeasurementRoundResponse> => {
    const res: any = await axiosClient.patch(`/health-reports/rounds/${id}/lock`);
    return res?.data !== undefined ? res.data : res;
  }
};
