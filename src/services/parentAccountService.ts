import { axiosClient } from '../api/axiosClient';
import {
  ParentAccountItem,
  LinkedStudentItem,
  ProvisionParentAccountPayload,
  ProvisionAccountResponse,
  LinkStudentPayload,
  StudentParentOverviewItem
} from '../types/parentAccount.types';

export const parentAccountService = {
  getStudentsOverview: async (search?: string, filter?: string): Promise<StudentParentOverviewItem[]> => {
    const params: any = {};
    if (search && search.trim()) params.search = search.trim();
    if (filter && filter !== 'ALL') params.filter = filter;
    const res: any = await axiosClient.get('/parent-accounts/students-overview', { params });
    const payload = res?.data !== undefined ? res.data : res;
    return Array.isArray(payload) ? payload : [];
  },

  getAccounts: async (search?: string): Promise<ParentAccountItem[]> => {
    const params = search && search.trim() ? { search: search.trim() } : {};
    const res: any = await axiosClient.get('/parent-accounts', { params });
    const payload = res?.data !== undefined ? res.data : res;
    return Array.isArray(payload) ? payload : [];
  },

  provisionAccount: async (payload: ProvisionParentAccountPayload): Promise<ProvisionAccountResponse> => {
    const res: any = await axiosClient.post('/parent-accounts/provision', payload);
    return res?.data !== undefined ? res.data : res;
  },

  resendActivation: async (userId: string): Promise<any> => {
    const res: any = await axiosClient.post(`/parent-accounts/${userId}/resend-activation`);
    return res?.data !== undefined ? res.data : res;
  },

  getLinkedChildren: async (userId: string): Promise<LinkedStudentItem[]> => {
    const res: any = await axiosClient.get(`/parent-accounts/${userId}/children`);
    const payload = res?.data !== undefined ? res.data : res;
    return Array.isArray(payload) ? payload : [];
  },

  linkStudent: async (userId: string, payload: LinkStudentPayload): Promise<ParentAccountItem> => {
    const res: any = await axiosClient.post(`/parent-accounts/${userId}/link-student`, payload);
    return res?.data !== undefined ? res.data : res;
  },

  unlinkStudent: async (userId: string, studentId: string): Promise<any> => {
    const res: any = await axiosClient.delete(`/parent-accounts/${userId}/children/${studentId}`);
    return res?.data !== undefined ? res.data : res;
  }
};
