export type BmiStatus = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
export type DevelopmentDomain = 'PHYSICAL' | 'COGNITIVE' | 'LANGUAGE' | 'SOCIO_EMOTIONAL' | 'AESTHETIC';
export type MealConsumptionLevel = 'FINISHED' | 'HALF' | 'SKIPPED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK';

export interface HealthMetric {
  id?: string;
  studentId: string;
  studentName?: string;
  measuredDate: string;
  heightCm: number;
  weightKg: number;
  bmi?: number;
  bmiStatus?: BmiStatus;
}

export interface ClassroomJournalPost {
  id?: string;
  classId: string;
  className?: string;
  date: string;
  caption: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface DevelopmentEvaluation {
  id?: string;
  studentId: string;
  studentName?: string;
  academicYearId?: string;
  evaluationPeriod: string;
  domain: DevelopmentDomain;
  scoreLevel: string;
  notes?: string;
}

export interface NapRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  date: string;
  napStart: string;
  napEnd: string;
  qualityNote?: string;
}

export interface MealRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  date: string;
  mealType: MealType;
  consumptionLevel: MealConsumptionLevel;
}
