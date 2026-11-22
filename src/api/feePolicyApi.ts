import axiosClient from './axiosClient';

export interface FeePolicyStatusDto {
  status: 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  totalServices: number;
  totalPolicies: number;
  rejectionReason?: string;
  message?: string;
}

export interface RejectFeePolicyRequestDto {
  reason: string;
  serviceIds?: string[];
  policyIds?: string[];
}

export const feePolicyApi = {
  getStatus: async () => {
    return axiosClient.get<FeePolicyStatusDto>('/finance/fee-policy/status');
  },
  submitForApproval: async () => {
    return axiosClient.post<FeePolicyStatusDto>('/finance/fee-policy/submit');
  },
  approveAll: async () => {
    return axiosClient.post<FeePolicyStatusDto>('/finance/fee-policy/approve-all');
  },
  rejectPolicy: async (payload: RejectFeePolicyRequestDto) => {
    return axiosClient.post<FeePolicyStatusDto>('/finance/fee-policy/reject', payload);
  },
  revokeApproval: async () => {
    return axiosClient.post<FeePolicyStatusDto>('/finance/fee-policy/revoke');
  },
};

export default feePolicyApi;
