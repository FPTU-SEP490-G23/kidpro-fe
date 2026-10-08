export interface ClassPortionSummaryDto {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  regularMealCount: number;
  porridgeCount: number;
  allergySafeCount: number;
  allergies: string;
}

export interface KitchenDailySummary {
  date: string;
  isLocked: boolean;
  lockedAt?: string | null;
  cutoffTimeMessage: string;
  totalStudents: number;
  totalActiveStudents: number;
  presentCount: number;
  absentPermitted: number;
  absentUnpermitted: number;
  absentWithLeave: number;
  absentWithoutLeave: number;
  totalAbsent: number;
  totalMealsToPrepare: number;
  totalPortionsToCook: number;
  specialDietCount: number;
  classSummaries: ClassPortionSummaryDto[];
}

export interface WeeklyMenu {
  id?: string;
  weekStartDate?: string;
  dayOfWeek: number; // 1 = Thứ 2 ... 7 = Chủ Nhật
  mealType: 'BREAKFAST' | 'LUNCH' | 'SNACK';
  dishName: string;
  nutritionNotes?: string;
  allergyTags?: string;
  calories?: number;
}
