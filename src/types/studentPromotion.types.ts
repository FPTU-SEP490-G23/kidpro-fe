import { GradeLevel } from './classAffairs.types';

export type PromotionAction = 'PROMOTE' | 'RETAIN';

export interface PromotionPreviewItem {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  currentGradeLevel: GradeLevel;
  currentClassName: string;
  suggestedGradeLevel?: GradeLevel | null;
  suggestedAction: 'PROMOTE' | 'GRADUATED';
  graduating: boolean;
}

export interface PromotionItemPayload {
  studentId: string;
  action: PromotionAction;
  retentionReason?: string;
}

export interface ExecutePromotionPayload {
  fromAcademicYearId: string;
  toAcademicYearId: string;
  promotions: PromotionItemPayload[];
}
