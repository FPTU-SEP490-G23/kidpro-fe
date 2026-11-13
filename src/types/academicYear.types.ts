export type AcademicYearStatus = 'PLANNING' | 'ACTIVE' | 'CLOSED';

export interface AcademicYear {
  id: string;
  name: string; // Tên niên khóa (VD: "2026-2027")
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive?: boolean;
  status: AcademicYearStatus;
  statusMessage?: string;
  isLocked?: boolean;
  // Optional legacy fields for backward compatibility
  term1Start?: string;
  term1End?: string;
  term2Start?: string;
  term2End?: string;
  nurseryQuota?: number;
  mamQuota?: number;
  choiQuota?: number;
  laQuota?: number;
  totalQuota?: number;
  enrolledCount?: number;
  maxSchoolCapacity?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  // Optional for backward compatibility
  term1Start?: string;
  term1End?: string;
  term2Start?: string;
  term2End?: string;
  nurseryQuota?: number;
  mamQuota?: number;
  choiQuota?: number;
  laQuota?: number;
  maxSchoolCapacity?: number;
  notes?: string;
}

export interface UpdateAcademicYearInput extends Partial<CreateAcademicYearInput> {
  status?: AcademicYearStatus;
}

//  Archival types
export interface ArchivalPreflightChecklist {
  evaluationsCompleted: boolean;
  incompleteEvaluationCount: number;
  attendanceLocked: boolean;
  unlockedMonthAttendanceCount: number;
  financialSettled: boolean;
  outstandingDebtCount: number;
  graduatesPrepared: boolean;
  nurseryToMamCount: number;
  mamToChoiCount: number;
  choiToLaCount: number;
  laGraduatedCount: number;
  diskSpaceAvailableGb: number;
  sha256Checksum?: string;
  isReadyToArchive: boolean;
}

export interface YearEndArchivalPayload {
  academicYearId: string;
  principalAuthCode: string;
  archivedDate: string;
  notes?: string;
}

export interface ArchivedStudentDossier {
  studentId: string;
  studentName: string;
  studentCode: string;
  gender: string;
  dateOfBirth: string;
  academicYearName: string;
  graduatedClassName: string;
  certificateNumber: string;
  finalEvaluationSummary: string;
  attendanceRate: number;
  archivedPdfUrl?: string;
}
