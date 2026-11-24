import axiosClient from './axiosClient';

export interface BusRegistrationItem {
  registerId: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  parentName: string;
  parentPhone: string;
  busId: string;
  busNumber: string;
  routeName: string;
  stopId?: number;
  stopName?: string;
  pickupAddress: string;
  pickupType: 'ONE_WAY_PICKUP' | 'ONE_WAY_DROPOFF' | 'TWO_WAY';
  startDate: string;
  endDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  note?: string;
  createdAt: string;
}

export const busRegistrationApprovalApi = {
  getAllRegistrations: async (status?: string, busId?: string): Promise<BusRegistrationItem[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    if (busId) params.busId = busId;

    const res = await axiosClient.get<{ data: BusRegistrationItem[] }>('/academic/bus-registrations', { params });
    if (res && (res as any).data && Array.isArray((res as any).data)) {
      return (res as any).data;
    }
    return Array.isArray(res) ? (res as any) : [];
  },

  approveRegistration: async (id: number, note?: string): Promise<BusRegistrationItem> => {
    const res = await axiosClient.post<{ data: BusRegistrationItem }>(`/academic/bus-registrations/${id}/approve`, { note });
    return (res as any)?.data || (res as any);
  },

  rejectRegistration: async (id: number, reason: string): Promise<BusRegistrationItem> => {
    const res = await axiosClient.post<{ data: BusRegistrationItem }>(`/academic/bus-registrations/${id}/reject`, { reason });
    return (res as any)?.data || (res as any);
  },
};

