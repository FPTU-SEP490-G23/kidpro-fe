export type GrowthStatus = 'NORMAL' | 'UNDERWEIGHT' | 'STUNTED' | 'OVERWEIGHT' | 'OBESE';
export type MeasurementRoundStatus = 'DRAFT' | 'LOCKED';

export interface MeasurementRoundResponse {
  id: string;
  roundName: string;
  academicYearId: string;
  academicYearName: string;
  status: MeasurementRoundStatus;
  startDate?: string;
  endDate?: string;
  lockedAt?: string;
  createdAt?: string;
}

export interface NutritionCategoryStat {
  status: GrowthStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface SpecialCareStudentDto {
  studentId: string;
  fullName: string;
  studentCode: string;
  className: string;
  gradeLevel: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  zScoreWfa?: number;
  zScoreHfa?: number;
  zScoreWfh?: number;
  growthStatus?: GrowthStatus;
  zScoreStatus?: string;
  zScoreLabel?: string;
  alertReason?: string;
  interventionPlan?: string;
  lastMeasurementDate?: string;
  guardianPhone?: string;
}

export interface HealthDashboardResponse {
  academicYearId?: string;
  measurementRoundId?: string;
  measurementRoundName?: string;
  isLocked?: boolean;
  totalStudents?: number;
  measuredCount?: number;
  measuredRate?: number;
  totalStudentsMeasured?: number;
  normalCount?: number;
  normalPercentage?: number;
  stuntedCount?: number;
  malnutritionCount?: number;
  malnutritionPercentage?: number;
  underweightCount?: number;
  underweightPercentage?: number;
  overweightCount?: number;
  overweightPercentage?: number;
  obeseCount?: number;
  obesePercentage?: number;
  nutritionBreakdown: NutritionCategoryStat[];
  specialCareStudents: SpecialCareStudentDto[];
  recentIncidents?: any[];
}

export interface PhysicalRegisterExportParams {
  classId: string;
  measurementRoundId: string;
  format?: 'PDF' | 'EXCEL';
}

export interface PhysicalRegisterResponse {
  classId: string;
  className: string;
  measurementRoundId: string;
  roundName: string;
  exportDate: string;
  totalStudents: number;
  fileName: string;
  contentBase64: string;
}
