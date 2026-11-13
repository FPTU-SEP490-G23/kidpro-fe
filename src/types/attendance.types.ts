export type AttendanceStatus = 'PRESENT' | 'ABSENT_PERMITTED' | 'ABSENT_UNEXCUSED' | 'ABSENT_UNPERMITTED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Attendance {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  imageUrl?: string;
  notes?: string;
  latePickupMinutes: number;
}

export interface AttendanceRecordDto {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  imageUrl?: string;
  notes?: string;
  latePickupMinutes?: number;
}

export interface BatchAttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  photoUrl?: string;
}

export interface BatchAttendancePayload {
  classId: string;
  attendanceDate: string;
  items: BatchAttendanceItem[];
  manualReason?: string;
}

export interface BatchAttendanceRequest {
  records?: AttendanceRecordDto[];
  classId?: string;
  attendanceDate?: string;
  items?: BatchAttendanceItem[];
  manualReason?: string;
}

export interface FaceLog {
  id: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  guardianId?: string;
  guardianName?: string;
  className?: string;
  isMatch: boolean;
  confidenceScore: number;
  photoUrl?: string;
  capturedAt: string;
  eventType?: 'CHECK_IN' | 'CHECK_OUT';
  gateName?: string;
  resolved?: boolean;
  alertResolvedAt?: string;
  resolvedNotes?: string;
  resolvedBy?: string;
  strangerName?: string;
  strangerIdCard?: string;
  parentCallOutcome?: 'APPROVED' | 'DENIED' | 'UNREACHABLE';
  parentPhone?: string;
}

export interface LatePickupFeeRule {
  id: string;
  minMinutes: number;
  maxMinutes: number;
  penaltyAmount: number;
  ruleName?: string;
  description?: string;
}

export interface LatePickupStudent {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  avatarUrl?: string;
  parentName: string;
  parentPhone: string;
  emergencyContact?: string;
  checkInTime: string;
  scheduledCutoffTime: string; // "17:30"
  actualPickupTime?: string;
  lateMinutes: number;
  calculatedFee: number;
  isFeeWaived: boolean;
  waivedReason?: string;
  status: 'WAITING' | 'PICKED_UP';
  allergies?: string;
}

export interface EmergencyPickupAuthorization {
  id: string;
  studentId: string;
  studentName?: string;
  studentClassName?: string;
  studentAvatarUrl?: string;
  pickupPersonName: string;
  relationship: string;
  phone: string;
  identityCard: string;
  photoUrl?: string;
  qrCode?: string;
  validDate: string;
  status: 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  notes?: string;
  usedAt?: string;
  createdAt: string;
}

export interface CreateLeaveRequestDto {
  studentId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  reason: string;
  medicalPrescriptionUrl?: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentCode?: string;
  className?: string;
  avatarUrl?: string;
  date?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  submittedAt: string;
  reason: string;
  status: LeaveStatus;
  mealRefundApplied?: boolean;
  isEligibleForMealRefund?: boolean; // Submitted before 08:30 of first day
  medicalPrescriptionUrl?: string;
  isContagiousDisease?: boolean;
  contagiousDiseaseName?: string;
  isOver30Days?: boolean;
  reviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

// ==========================================
// XUẤT SỔ ĐIỂM DANH THEO MẪU BỘ GD&ĐT (MOET ATTENDANCE REPORT)
// ==========================================

export type MoetAttendanceSymbol =
  | 'x' // Có mặt học tại trường
  | 'p' // Nghỉ học có phép
  | 'k' // Nghỉ học không phép
  | 'a' // Có ăn bán trú
  | '/'; // Gạch chéo chưa nhập học (trẻ vào giữa tháng)

export interface MoetStudentAttendanceRow {
  studentId: string;
  studentName: string;
  studentCode: string;
  dateOfBirth: string;
  gender: string;
  enrollmentDate?: string;
  days: Record<number, MoetAttendanceSymbol>; // Day 1..31 -> symbol
  totalSchoolDays: number; // Tổng ngày có mặt (x)
  totalExcusedAbsence: number; // Nghỉ có phép (p)
  totalUnexcusedAbsence: number; // Nghỉ không phép (k)
  totalMealDays: number; // Ngày ăn bán trú (a)
  attendanceRate: number; // Tỷ lệ chuyên cần (%)
}

export interface MoetAttendanceReportData {
  schoolName: string;
  districtName: string; // Phòng GD&ĐT quận/huyện
  classId: string;
  className: string;
  academicYear: string;
  month: number;
  year: number;
  workingDays: number[]; // Các ngày T2 - T6 trong tháng
  students: MoetStudentAttendanceRow[];
  teacherSignature?: string;
  principalDigitalStamp?: string;
  missingAttendanceDates?: string[]; // Danh sách ngày chưa chốt sổ
  isFinalized: boolean;
}

