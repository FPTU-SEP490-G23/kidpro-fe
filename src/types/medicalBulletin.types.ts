export type BulletinCategory = 'OUTBREAK_ALERT' | 'HEALTH_AWARENESS' | 'HYGIENE_VACCINATION';

export type BulletinPriority = 'NORMAL' | 'URGENT';

export type BulletinStatus = 'PUBLISHED' | 'ARCHIVED';

export interface MedicalBulletinItem {
  id: string;
  title: string;
  diseaseName?: string | null;
  category: BulletinCategory;
  categoryLabel: string;
  priority: BulletinPriority;
  priorityLabel: string;
  symptomsGuide?: string | null;
  preventionAdvice: string;
  targetGrades: string[];
  status: BulletinStatus;
  statusLabel: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  message?: string;
}

export interface CreateBulletinPayload {
  title: string;
  diseaseName?: string;
  category: BulletinCategory;
  priority: BulletinPriority;
  symptomsGuide?: string;
  preventionAdvice: string;
  targetGrades?: string[];
  attachmentUrl?: string;
  attachmentName?: string;
}
