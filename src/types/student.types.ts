import { GradeLevel } from './classAffairs.types';

export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'STUDYING'
  | 'RESERVED'
  | 'GRADUATED'
  | 'WITHDRAWN'
  | 'WAITING_PLACEMENT'
  | 'ENROLLED'
  | 'TRANSFERRED';

export interface GuardianInfo {
  guardianId?: number;
  fullName: string;
  relationship: string;
  phoneNumber?: string;
  email?: string;
  isPrimary?: boolean;
  isAllowedPickup?: boolean;
  note?: string;
}

export interface StudentItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  ageMonths: number;
  gender: 'MALE' | 'FEMALE';
  gradeLevel?: GradeLevel;
  classId?: string;
  className?: string;
  academicYearId?: string;
  academicYearName?: string;
  status: StudentStatus;
  primaryGuardianName?: string;
  primaryGuardianPhone?: string;
  admissionDate?: string;
  avatarFileId?: string;
  createdAt?: string;
}

export interface StudentDetail extends StudentItem {
  ethnicity?: string;
  address?: string;
  notes?: string;
  updatedAt?: string;
  guardians: GuardianInfo[];
}

export interface CreateStudentPayload {
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  ethnicity?: string;
  address?: string;
  admissionDate?: string;
  gradeLevel?: GradeLevel;
  classId?: string;
  academicYearId?: string;
  notes?: string;
  avatarFileId?: string;
  existingParentId?: string;
  guardians: GuardianInfo[];
}

export interface UpdateStudentPayload {
  fullName?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
  ethnicity?: string;
  address?: string;
  admissionDate?: string;
  gradeLevel?: GradeLevel;
  classId?: string;
  academicYearId?: string;
  status?: StudentStatus;
  notes?: string;
  avatarFileId?: string;
  guardians?: GuardianInfo[];
}
