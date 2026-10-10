import axiosClient from './axiosClient';
import { Announcement } from '../types/comms.types';

export const commsApi = {
  getAnnouncements: () => {
    return axiosClient.get<Announcement[]>('/comms/announcements');
  },

  createAnnouncement: (data: Partial<Announcement>) => {
    return axiosClient.post<Announcement>('/comms/announcements', data);
  },

  updateAnnouncement: (id: string, data: Partial<Announcement>) => {
    return axiosClient.put<Announcement>(`/comms/announcements/${id}`, data);
  },

  deleteAnnouncement: (id: string) => {
    return axiosClient.delete(`/comms/announcements/${id}`);
  },

  revokeAnnouncement: (id: string) => {
    return axiosClient.post(`/comms/announcements/${id}/revoke`);
  },

  recordAnnouncementView: (id: string) => {
    return axiosClient.post(`/comms/announcements/${id}/views`);
  },

  getAudienceUserCount: (params?: { targetAudience?: string }) => {
    return axiosClient.get<{ total: number; teachers: number; parents: number }>('/admin/users/count', { params });
  },

  getNotifications: () => {
    return axiosClient.get<any[]>('/notifications');
  },
};

export default commsApi;

