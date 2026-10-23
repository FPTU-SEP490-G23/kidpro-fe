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
  }
};
