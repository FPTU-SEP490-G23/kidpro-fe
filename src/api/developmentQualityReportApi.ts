import axiosClient from './axiosClient';

export interface DomainScoreStatsDto {
  domainName: string;
  domainKey: string; // PHYSICAL, COGNITIVE, LANGUAGE, SOCIAL_EMOTIONAL, AESTHETIC
  totalAssessed: number;
  passedCount: number;
  needsImprovementCount: number;
  passRate: number; // %
}

export interface ClassQualityStatsDto {
  classId: string;
  className: string;
  gradeLevel: string;
  totalStudents: number;
  evaluatedStudents: number;
  overallPassRate: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

export interface DevelopmentQualityReportDto {
  period: string;
  periodName: string;
  academicYearName: string;
  totalEvaluatedStudents: number;
  totalClasses: number;
  completedClasses: number;
  overallPassRate: number;
  isLockedAndApproved: boolean;
  generatedAt?: string;
  generatedBy?: string;
  domainStats: DomainScoreStatsDto[];
  classStats: ClassQualityStatsDto[];
}

export const developmentQualityReportApi = {
  getReport: async (params?: { period?: string; classId?: string }) => {
    return axiosClient.get<DevelopmentQualityReportDto>('/bgh/reports/development-quality', { params });
  },

  exportReport: async (params?: { period?: string; classId?: string; format?: string }) => {
    return axiosClient.get('/bgh/reports/development-quality/export', {
      params,
      responseType: 'blob',
    });
  },
};

export default developmentQualityReportApi;
