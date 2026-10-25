import { axiosClient } from '../api/axiosClient';
import {
  AnnouncementItem,
  CreateAnnouncementPayload,
  AnnouncementScope,
  AnnouncementStatus,
} from '../types/announcement.types';

export const announcementService = {
  getAnnouncements: async (params?: {
    scope?: AnnouncementScope;
    status?: AnnouncementStatus;
    page?: number;
    size?: number;
  }): Promise<{ content: AnnouncementItem[]; totalElements: number; totalPages: number }> => {
    const res: any = await axiosClient.get('/announcements', { params });
    const payload = res?.data !== undefined ? res.data : res;
    if (payload?.content && Array.isArray(payload.content)) {
      return {
        content: payload.content,
        totalElements: payload.totalElements || payload.content.length,
        totalPages: payload.totalPages || 1,
      };
    }
    if (Array.isArray(payload)) {
      return { content: payload, totalElements: payload.length, totalPages: 1 };
    }
    return { content: [], totalElements: 0, totalPages: 0 };
  },

  getAnnouncementById: async (id: number): Promise<AnnouncementItem> => {
    const res: any = await axiosClient.get(`/announcements/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createAnnouncement: async (payload: CreateAnnouncementPayload): Promise<AnnouncementItem> => {
    const res: any = await axiosClient.post('/announcements', payload);
    return res?.data !== undefined ? res.data : res;
  },

  updateAnnouncement: async (id: number, payload: CreateAnnouncementPayload): Promise<AnnouncementItem> => {
    const res: any = await axiosClient.put(`/announcements/${id}`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteAnnouncement: async (id: number): Promise<void> => {
    await axiosClient.delete(`/announcements/${id}`);
  },
};

export default announcementService;
