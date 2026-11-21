import axiosClient from '../api/axiosClient';
import {
  PromotionPreviewItem,
  ExecutePromotionPayload,
} from '../types/studentPromotion.types';
import { ApiResponse, GradeLevel } from '../types/classAffairs.types';

export const studentPromotionService = {
  /**
   * Xem trước danh sách đề xuất kết chuyển học sinh sang năm học mới
   */
  getPreview: async (
    fromYearId: string,
    toYearId?: string,
    gradeLevel?: GradeLevel | string
  ): Promise<PromotionPreviewItem[]> => {
    const params: any = { fromYearId };
    if (toYearId) {
      params.toYearId = toYearId;
    }
    if (gradeLevel && gradeLevel !== 'ALL') {
      params.gradeLevel = gradeLevel;
    }
    const res: any = await axiosClient.get('/students/promotions/preview', { params });
    return res?.data || (Array.isArray(res) ? res : []);
  },

  /**
   * Thực thi kết chuyển học sinh vào năm học mới
   * BR-009, MSG-010, MSG-042
   */
  executePromotion: async (payload: ExecutePromotionPayload): Promise<ApiResponse<void>> => {
    const res: any = await axiosClient.post('/students/promotions/execute', payload);
    return res;
  },
};

export default studentPromotionService;
