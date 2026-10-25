export type GrowthStatus = 'NORMAL' | 'UNDERWEIGHT' | 'STUNTED' | 'OVERWEIGHT' | 'OBESE';
export type MeasurementRoundStatus = 'DRAFT' | 'LOCKED';

export interface MeasurementRoundResponse {
  id: string;
  roundName: string;
  academicYearId: string;
  academicYearName: string;
  status: MeasurementRoundStatus;
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
  growthStatus: GrowthStatus;
  alertReason: string;
  guardianPhone?: string;
}

export interface HealthDashboardResponse {
  academicYearId?: string;
  measurementRoundId?: string;
  measurementRoundName?: string;
  isLocked: boolean;
  totalStudentsMeasured: number;
  normalCount: number;
  stuntedCount: number;
  underweightCount: number;
  overweightCount: number;
  obeseCount: number;
  nutritionBreakdown: NutritionCategoryStat[];
  specialCareStudents: SpecialCareStudentDto[];
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
