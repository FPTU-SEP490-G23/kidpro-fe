export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishedAt: string;
  publishedBy?: string;
  authorRole?: string;
  targetRole?: string;
  targetAudience?: string[]; // ['ALL', 'NURSERY', 'MAM', 'CHOI', 'LA', 'TEACHERS', 'PARENTS']
  targetAudienceLabel?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSizeMb?: number; // < 20MB (MSG-288)
  isScheduled?: boolean;
  scheduledAt?: string;
  readCount?: number;
  totalTargetCount?: number;
  readRate?: number; // % đã đọc
  isRevoked?: boolean;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  priority: 'NORMAL' | 'URGENT';
  targetAudience: string[];
  attachmentUrl?: string;
  attachmentName?: string;
  scheduledAt?: string;
}

export interface AnnouncementViewLog {
  id: string;
  announcementId: string;
  userId: string;
  userName: string;
  userRole: string;
  viewedAt: string;
}

