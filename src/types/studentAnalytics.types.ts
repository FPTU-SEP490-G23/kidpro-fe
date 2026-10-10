export type StudentStatus = 'ACTIVE' | 'TRANSFERRED' | 'RESERVED' | 'GRADUATED';
export type TransferRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StudentRecord {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  classId: string;
  className: string;
  ageGroup: string;
  status: StudentStatus;
  enrollmentDate: string;
  guardianName: string;
  guardianPhone: string;
  guardianNationalIdMasked: string; // Đã che mờ theo NĐ 13: 079201******
  addressMasked: string; // Đã che mờ theo NĐ 13
  allergyTags: string[];
  avatarUrl?: string;
  notes?: string;
}

export interface StudentMobilityItem {
  id: string;
  studentId: string;
  studentName: string;
  fromClassId: string;
  fromClassName: string;
  toClassId: string;
  toClassName: string;
  requestType: 'TRANSFER' | 'RESERVATION';
  reason: string;
  requestDate: string;
  status: TransferRequestStatus;
  reviewNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface StudentMobilitySummary {
  totalStudents: number;
  activeCount: number;
  transferredCount: number;
  reservedCount: number;
  allergyCount: number;
  retentionRate: number; // %
  pendingTransferCount: number;
}
