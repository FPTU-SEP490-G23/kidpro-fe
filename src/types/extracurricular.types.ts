export interface ClubAssignmentDetailResponse {
  classId: string;
  name: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  academicYearId?: string;
  academicYearName?: string;
  status: string;
  leadTeacherId?: string;
  leadTeacherName?: string;
  assistantTeacherId?: string;
  assistantTeacherName?: string;
  assigned: boolean;
}

export interface AvailableClubTeacherResponse {
  teacherId: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  active: boolean;
  hasScheduleConflict: boolean;
  conflictDetail?: string;
  currentClubHours: number;
  maxWeeklyClubHours: number;
  availableForAssignment: boolean;
}

export interface ExtracurricularAssignmentPayload {
  leadTeacherId: string;
  assistantTeacherId?: string;
}
