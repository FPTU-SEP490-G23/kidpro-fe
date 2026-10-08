export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
export type TransferRequestType = 'TRANSFER' | 'DEFERRAL';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClassEntity {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  academicYear?: string;
  ageGroup?: string;
  roomName?: string;
  capacity?: number;
}

export interface Student {
  id: string;
  fullName: string;
  classId?: string;
  className?: string;
  parentId?: string;
  parentName?: string;
  allergyInfo?: string;
  status: StudentStatus;
  dateOfBirth?: string;
  gender?: string;
  enrollmentDate?: string;
}

export interface Timetable {
  id: string;
  classId: string;
  className?: string;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // HH:mm:ss
  endTime: string;
  activityName: string;
  roomName?: string;
}

export interface ClassTransferRequest {
  id: string;
  studentId: string;
  studentName?: string;
  fromClassId: string;
  fromClassName?: string;
  toClassId?: string;
  toClassName?: string;
  requestType: TransferRequestType;
  reason?: string;
  status: TransferStatus;
  reviewedBy?: string;
  reviewNote?: string;
  createdAt?: string;
}
