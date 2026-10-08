export type AttendanceStatus = 'PRESENT' | 'ABSENT_PERMITTED' | 'ABSENT_UNPERMITTED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Attendance {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  imageUrl?: string;
  latePickupMinutes: number;
}

export interface AttendanceRecordDto {
  studentId: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  imageUrl?: string;
  latePickupMinutes?: number;
}

export interface BatchAttendanceRequest {
  records: AttendanceRecordDto[];
}

export interface CreateLeaveRequestDto {
  studentId: string;
  date: string;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName?: string;
  date: string;
  reason: string;
  status: LeaveStatus;
  mealRefundApplied?: boolean;
}
