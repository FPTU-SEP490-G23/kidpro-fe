import axiosClient from './axiosClient';

export interface MealRegistrationItem {
  registerId: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  serviceId?: string;
  serviceName?: string;
  unitPrice?: number;
  registeredDate: string;
  startDate: string;
  endDate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  statusLabel?: string;
  note?: string;
  parentName: string;
  parentPhone: string;
  createdAt: string;
  updatedAt?: string;
}

export const mealRegistrationApprovalApi = {
  getAllRegistrations: async (status?: string): Promise<MealRegistrationItem[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;

    const res = await axiosClient.get<{ data: MealRegistrationItem[] }>('/academic/meal-registrations', { params });
    if (res && (res as any).data && Array.isArray((res as any).data)) {
      return (res as any).data;
    }
    return Array.isArray(res) ? (res as any) : [];
  },

  approveRegistration: async (id: number, note?: string): Promise<MealRegistrationItem> => {
    const res = await axiosClient.post<{ data: MealRegistrationItem }>(`/academic/meal-registrations/${id}/approve`, { note });
    return (res as any)?.data || (res as any);
  },

  rejectRegistration: async (id: number, reason: string): Promise<MealRegistrationItem> => {
    const res = await axiosClient.post<{ data: MealRegistrationItem }>(`/academic/meal-registrations/${id}/reject`, { reason });
    return (res as any)?.data || (res as any);
  },
};

