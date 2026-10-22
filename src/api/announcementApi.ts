import axiosClient from './axiosClient';

export interface AnnouncementDto {
  announcementId: number;
  authorStaffId: string;
  authorName: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PARENTS_ONLY' | 'STAFF_ONLY';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: string;
  viewCount: number;
  message?: string;
}

export interface AnnouncementCreateRequestDto {
  staffId?: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'PARENTS_ONLY' | 'STAFF_ONLY';
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  isDraft?: boolean;
}

export const announcementApi = {
  getAnnouncements: async () => {
    return axiosClient.get<AnnouncementDto[]>('/bgh/announcements');
  },

  getAnnouncementById: async (id: number) => {
    return axiosClient.get<AnnouncementDto>(`/bgh/announcements/${id}`);
  },

  createAnnouncement: async (payload: AnnouncementCreateRequestDto) => {
    return axiosClient.post<AnnouncementDto>('/bgh/announcements', payload);
  },

  deleteAnnouncement: async (id: number) => {
    return axiosClient.delete<{ message: string }>(`/bgh/announcements/${id}`);
  },
};

export default announcementApi;
