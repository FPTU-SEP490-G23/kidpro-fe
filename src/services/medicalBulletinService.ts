import { axiosClient } from '../api/axiosClient';
import {
  MedicalBulletinItem,
  CreateBulletinPayload,
  BulletinCategory,
  BulletinPriority,
} from '../types/medicalBulletin.types';

export const medicalBulletinService = {
  getBulletins: async (params?: {
    category?: BulletinCategory;
    priority?: BulletinPriority;
    page?: number;
    size?: number;
  }): Promise<{ content: MedicalBulletinItem[]; totalElements: number; totalPages: number }> => {
    const res: any = await axiosClient.get('/medical-bulletins', { params });
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

  getBulletinById: async (id: string): Promise<MedicalBulletinItem> => {
    const res: any = await axiosClient.get(`/medical-bulletins/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createBulletin: async (payload: CreateBulletinPayload): Promise<MedicalBulletinItem> => {
    const res: any = await axiosClient.post('/medical-bulletins', payload);
    return res?.data !== undefined ? res.data : res;
  },

  deleteBulletin: async (id: string): Promise<void> => {
    await axiosClient.delete(`/medical-bulletins/${id}`);
  },
};

export default medicalBulletinService;
