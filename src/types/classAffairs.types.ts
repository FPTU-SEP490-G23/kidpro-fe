/**
 * Types and Interfaces for Academic Affairs (Cán bộ Giáo vụ)
 * , , 
 */

export type GradeLevel = 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';

export type ClassStatus = 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type TeacherRole = 'HOMEROOM' | 'ASSISTANT';

export type AssignmentStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'CLOSED';

// =========================================================================
// Quản lý Danh sách & Cập nhật Thông tin Lớp học
// =========================================================================

export interface ClassSummary {
  id: string;
  code: string;
  name: string;
  gradeLevel: GradeLevel;
  academicYearId: string;
  academicYearName?: string;
  roomId?: string;
  roomName?: string;
  building?: string;
  maxCapacity: number;
  currentEnrollment: number;
  status: ClassStatus;
  assignmentStatus?: 'NOT_ASSIGNED' | 'PENDING_APPROVAL' | 'APPROVED' | string;
  assignmentLocked?: boolean;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  createdAt?: string;
  updatedAt?: string;
  archivedAt?: string;
  archivedById?: string;
}

export interface ClassDetail extends ClassSummary {
  roomCapacity?: number;
  assignments?: TeacherAssignmentDetail[];
}

export interface UpdateClassPayload {
  name: string;
  roomId?: string;
  maxCapacity?: number;
}

// =========================================================================
// Lập Kế hoạch Mở Lớp học Mới
// =========================================================================

export type ProposalStatus = ClassStatus;

export interface CreateClassProposalPayload {
  className: string;
  gradeLevel: GradeLevel;
  academicYearId: string;
  proposedCapacity: number;
  proposedRoomId?: string;
}

export interface UpdateClassProposalPayload {
  className?: string;
  gradeLevel?: GradeLevel;
  proposedCapacity?: number;
  proposedRoomId?: string;
}

export interface ClassProposalResponse {
  id: string;
  className: string;
  code?: string;
  gradeLevel: GradeLevel;
  academicYearId: string;
  academicYearName?: string;
  proposedCapacity: number;
  proposedRoomId?: string;
  proposedRoomName?: string;
  status: ProposalStatus;
  createdById?: string;
  createdAt?: string;
  rejectionReason?: string;
}

// =========================================================================
// Lập Kế hoạch Phân công Giáo viên Chủ nhiệm & Phụ tá
// =========================================================================

export interface TeacherAssignmentRequest {
  classId: string;
  teacherId: string;
  role: TeacherRole;
  academicYearId?: string;
}

export interface TeacherAssignmentDetail {
  id: number;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  staffCode?: string;
  qualification?: string;
  role: TeacherRole;
  academicYearId?: string;
  academicYearName?: string;
  status: AssignmentStatus;
  assignedDate?: string;
  createdAt?: string;
}

export interface AvailableTeacher {
  id: string;
  staffCode: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'SUSPENDED';
  qualification?: string;
  isAssignedHomeroom?: boolean;
  assignedHomeroom?: boolean;
  currentHomeroomClassName?: string;
  isAssigned?: boolean;
  assigned?: boolean;
  assignedClassName?: string;
  assignedRole?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
  timestamp?: string;
}