import { axiosClient } from '../api/axiosClient';
import {
  WithdrawalRequestItem,
  CreateWithdrawalPayload,
  FinancialCheckResult,
  DossierExportData,
  WithdrawalStatus
} from '../types/withdrawal.types';

export const withdrawalService = {
  getRequests: async (params?: {
    status?: WithdrawalStatus | string;
    page?: number;
    size?: number;
  }): Promise<{ content: WithdrawalRequestItem[]; totalElements: number }> => {
    const cleanParams: any = {};
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;

    const res: any = await axiosClient.get('/student-withdrawals', { params: cleanParams });
    const payload = res?.data !== undefined ? res.data : res;
    if (payload && Array.isArray(payload.content)) {
      return payload;
    }
    if (Array.isArray(payload)) {
      return { content: payload, totalElements: payload.length };
    }
    return { content: [], totalElements: 0 };
  },

  getRequestDetail: async (id: string): Promise<WithdrawalRequestItem> => {
    const res: any = await axiosClient.get(`/student-withdrawals/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  createRequest: async (payload: CreateWithdrawalPayload): Promise<WithdrawalRequestItem> => {
    const res: any = await axiosClient.post('/student-withdrawals', payload);
    return res?.data !== undefined ? res.data : res;
  },

  checkDebt: async (id: string): Promise<FinancialCheckResult> => {
    const res: any = await axiosClient.get(`/student-withdrawals/${id}/financial-check`);
    return res?.data !== undefined ? res.data : res;
  },

  completeWithdrawal: async (id: string): Promise<WithdrawalRequestItem> => {
    const res: any = await axiosClient.put(`/student-withdrawals/${id}/complete`);
    return res?.data !== undefined ? res.data : res;
  },

  exportDossier: async (id: string): Promise<DossierExportData> => {
    const res: any = await axiosClient.get(`/student-withdrawals/${id}/export-dossier`);
    return res?.data !== undefined ? res.data : res;
  }
};
