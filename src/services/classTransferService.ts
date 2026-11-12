import { axiosClient } from '../api/axiosClient';

export interface ClassTransferRequestItem {
  id: number;
  requestId: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  dateOfBirth?: string;
  gender?: string;
  studentAgeMonths?: number;
  parentName?: string;
  parentPhone?: string;
  fromClassId: string;
  fromClassName: string;
  fromClassGrade: string;
  fromClassCurrentEnrollment: number;
  toClassId: string;
  toClassName: string;
  toClassGrade: string;
  toClassCapacity: number;
  toClassCurrentEnrollment: number;
  toClassRemainingSlots: number;
  reason: string;
  status: 'PENDING' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  processedById?: string;
  processedAt?: string;
  createdAt?: string;
  effectiveDate?: string;
  hasUnpaidTuition?: boolean;
  allergies?: string[];
}

export interface RejectTransferPayload {
  rejectionReason: string;
}

export const classTransferService = {
  getRequests: async (params?: { status?: string; academicYearId?: string }): Promise<ClassTransferRequestItem[]> => {
    const res: any = await axiosClient.get('/class-transfers', { params });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  getRequestDetail: async (id: number | string): Promise<ClassTransferRequestItem> => {
    const res: any = await axiosClient.get(`/class-transfers/${id}`);
    return res?.data !== undefined ? res.data : res;
  },

  approveRequest: async (id: number | string, note?: string): Promise<any> => {
    const res: any = await axiosClient.put(`/class-transfers/${id}/approve`, note ? { note } : undefined);
    return res?.data !== undefined ? res.data : res;
  },

  rejectRequest: async (id: number | string, data: RejectTransferPayload): Promise<any> => {
    const res: any = await axiosClient.put(`/class-transfers/${id}/reject`, data);
    return res?.data !== undefined ? res.data : res;
  }
};