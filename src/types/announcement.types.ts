export type AnnouncementScope = 'ALL_SCHOOL' | 'SPECIFIC_GRADES';

export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface AnnouncementAttachment {
  fileId?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  scope: AnnouncementScope;
  scopeLabel: string;
  targetGrades: string[];
  status: AnnouncementStatus;
  statusLabel: string;
  isScheduled: boolean;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  authorStaffId?: string;
  authorName?: string;
  viewsCount: number;
  attachments: AnnouncementAttachment[];
  message?: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  scope: AnnouncementScope;
  targetGrades: string[];
  isScheduled?: boolean;
  scheduledAt?: string | null;
  isDraft?: boolean;
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType?: string;
    fileSize?: number;
  }[];
}
