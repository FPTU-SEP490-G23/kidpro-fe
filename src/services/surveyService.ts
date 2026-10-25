import { axiosClient } from '../api/axiosClient';
import {
  SurveySummaryItem,
  SurveyDetailDTO,
  SurveyAnalyticsResponse,
  CreateSurveyPayload,
  SubmitSurveyResponsePayload,
  SurveyStatus,
} from '../types/survey.types';

export const surveyService = {
  getSurveys: async (params?: {
    status?: SurveyStatus;
    page?: number;
    size?: number;
  }): Promise<{ content: SurveySummaryItem[]; totalElements: number; totalPages: number }> => {
    const res: any = await axiosClient.get('/surveys', { params });
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

  getSurveyById: async (id: string): Promise<SurveyDetailDTO> => {
    const res: any = await axiosClient.get(`/surveys/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  getAnalytics: async (id: string): Promise<SurveyAnalyticsResponse> => {
    const res: any = await axiosClient.get(`/surveys/${id}/analytics`);
    return res?.data !== undefined ? res.data : res;
  },

  createSurvey: async (payload: CreateSurveyPayload): Promise<SurveyDetailDTO> => {
    const res: any = await axiosClient.post('/surveys', payload);
    return res?.data !== undefined ? res.data : res;
  },

  closeSurvey: async (id: string): Promise<void> => {
    await axiosClient.put(`/surveys/${id}/close`);
  },

  submitResponse: async (id: string, payload: SubmitSurveyResponsePayload): Promise<void> => {
    await axiosClient.post(`/surveys/${id}/responses`, payload);
  },
};

export default surveyService;
