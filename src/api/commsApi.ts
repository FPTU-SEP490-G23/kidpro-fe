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
};

export default commsApi;
