export type RelationshipType = 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';

export interface LinkedStudentItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  classId?: string;
  className?: string;
  currentGradeLevel?: string;
  relationshipType: string;
  isPrimary?: boolean;
  enrollmentDate?: string;
}

export interface ParentAccountItem {
  accountId: string;
  parentId: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  identityCardNumber?: string;
  address?: string;
  occupation?: string;
  status: string;
  linkedChildrenCount: number;
  linkedChildren: LinkedStudentItem[];
  createdAt?: string;
}

export interface ProvisionParentAccountPayload {
  studentId: string;
  phoneNumber: string;
  fullName: string;
  email?: string;
  relationshipType: RelationshipType;
  isPrimary?: boolean;
  identityCardNumber?: string;
  address?: string;
  occupation?: string;
}

export interface ProvisionAccountResponse {
  accountId: string;
  parentId: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: string;
  status: string;
  tempPassword: string;
  linkedChildrenCount: number;
  createdAt: string;
  message: string;
}

export interface LinkStudentPayload {
  studentId: string;
  relationshipType: RelationshipType;
  isPrimary?: boolean;
  forceConfirm?: boolean;
  notes?: string;
}

export interface GuardianOverviewItem {
  guardianId: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  relationshipToStudent: string;
  isPrimary?: boolean;
  isAllowedPickup?: boolean;
}

export interface StudentParentOverviewItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  classId?: string;
  className?: string;
  currentGradeLevel?: string;
  hasParentAccount: boolean;
  primaryParentId?: string;
  primaryParentAccountId?: string;
  parentFullName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentAccountStatus?: string;
  suggestedGuardianName?: string;
  suggestedGuardianPhone?: string;
  suggestedGuardianEmail?: string;
  suggestedRelationship?: string;
  guardians?: GuardianOverviewItem[];
}
