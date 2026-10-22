import axiosClient from './axiosClient';

export interface EmergencyBroadcastRequestDto {
  title: string;
  actionPlan: string;
  incidentType: string;
  scope: string;
  authCode: string;
}

export interface EmergencyBroadcastResponseDto {
  broadcastId: string;
  title: string;
  actionPlan: string;
  incidentType: string;
  scope: string;
  totalRecipients: number;
  readCount: number;
  broadcastAt: string;
  broadcastBy: string;
  message?: string;
}

export const emergencyBroadcastApi = {
  getLatestBroadcast: async () => {
    return axiosClient.get<EmergencyBroadcastResponseDto>('/bgh/emergency-broadcasts/latest');
  },

  broadcastEmergency: async (payload: EmergencyBroadcastRequestDto) => {
    return axiosClient.post<EmergencyBroadcastResponseDto>('/bgh/emergency-broadcasts', payload);
  },
};

export default emergencyBroadcastApi;
