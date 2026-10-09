export type AcademicYearStatus = 'PLANNING' | 'ACTIVE' | 'CLOSED';

export interface AcademicYear {
  id: string;
  name: string; // Ví dụ: "2026-2027"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  term1Start: string;
  term1End: string;
  term2Start: string;
  term2End: string;
  nurseryQuota: number; // 18 - 36 tháng
  mamQuota: number; // 3 - 4 tuổi
  choiQuota: number; // 4 - 5 tuổi
  laQuota: number; // 5 - 6 tuổi
  totalQuota: number; // Tự động cộng tổng
  enrolledCount?: number; // Đã tiếp nhận thực tế
  maxSchoolCapacity?: number; // Công suất cấp phép tối đa cơ sở
  status: AcademicYearStatus;
  notes?: string;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  term1Start: string;
  term1End: string;
  term2Start: string;
  term2End: string;
  nurseryQuota: number;
  mamQuota: number;
  choiQuota: number;
  laQuota: number;
  maxSchoolCapacity?: number;
  notes?: string;
}

export interface UpdateAcademicYearInput extends Partial<CreateAcademicYearInput> {
  status?: AcademicYearStatus;
}
