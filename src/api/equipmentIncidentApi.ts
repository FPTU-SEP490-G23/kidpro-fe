import axiosClient from './axiosClient';

export type EquipmentIncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
/** UC-67: Bình thường / Khẩn cấp (nguy hiểm cho trẻ). */
export type IncidentSeverity = 'NORMAL' | 'URGENT';

export interface EquipmentIncidentItem {
  incidentId: string;
  classroomId: string;
  classroomName: string;
  equipmentId?: string;
  equipmentCode?: string;
  equipmentName: string;
  damagedQuantity?: number;
  severity: string;
  photoUrl?: string;
  description: string;
  status: EquipmentIncidentStatus;
  reportedByName?: string;
  reportedAt: string;
  handledByName?: string;
  handlerNote?: string;
  resolvedAt?: string;
}

/** Thiết bị trong danh mục tài sản của phòng học (UC-67 bước 2). */
export interface ClassEquipmentOption {
  equipmentId: string;
  equipmentCode: string;
  name: string;
  unit?: string;
  goodQuantity: number;
  damagedQuantity: number;
}

export type ProposalType = 'REPAIR' | 'PURCHASE';
export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Kế hoạch sửa chữa / mua sắm (UC-66 A1, BR-052). */
export interface MaintenanceProposalItem {
  proposalId: string;
  proposalType: ProposalType;
  title: string;
  equipmentName: string;
  quantity: number;
  estimatedCost: number;
  reason: string;
  incidentId?: string;
  incidentClassroomName?: string;
  status: ProposalStatus;
  autoApproved?: boolean;
  createdByName?: string;
  createdAt: string;
  reviewedByName?: string;
  reviewNote?: string;
  reviewedAt?: string;
}

export interface CreateProposalPayload {
  proposalType: ProposalType;
  title: string;
  equipmentName: string;
  quantity: number;
  estimatedCost: number;
  reason: string;
  incidentId?: string;
}

/** BR-052: sửa chữa trên mức này bắt buộc BGH phê duyệt. */
export const BGH_APPROVAL_THRESHOLD = 10_000_000;
/** BR-052: sự cố nguy hiểm cho trẻ phải được tiếp nhận xử lý trong 2 giờ. */
export const URGENT_RESPONSE_MS = 2 * 60 * 60 * 1000;
/** UC-67 E2 (MSG-195): ảnh hiện trường JPG/PNG, tối đa 10MB. */
export const INCIDENT_PHOTO_MAX_BYTES = 10 * 1024 * 1024;
export const INCIDENT_PHOTO_TYPES = ['image/jpeg', 'image/png'];

const unwrapList = <T,>(res: any): T[] => {
  if (res && Array.isArray(res.data)) return res.data;
  return Array.isArray(res) ? res : [];
};
const unwrapOne = <T,>(res: any): T => (res?.data || res) as T;

/** Phiếu báo hỏng CSVC (UC-67) và kế hoạch sửa chữa / mua sắm (UC-66 A1). */
export const equipmentIncidentApi = {
  getAll: async (status?: string): Promise<EquipmentIncidentItem[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    return unwrapList(await axiosClient.get('/academic/equipment/incidents', { params }));
  },

  /** Giáo viên: phiếu của lớp (nhận mã lớp hoặc mã phòng học). */
  getByClass: async (classId: string): Promise<EquipmentIncidentItem[]> =>
    unwrapList(await axiosClient.get(`/academic/equipment/incidents/class/${classId}`)),

  /** Danh mục thiết bị của lớp để chọn khi báo hỏng. */
  getClassEquipment: async (classId: string): Promise<ClassEquipmentOption[]> =>
    unwrapList(await axiosClient.get(`/academic/equipment/incidents/class/${classId}/equipment`)),

  /** Giáo viên gửi phiếu: chọn equipmentId trong danh mục, hoặc nhập equipmentName khi thiết bị chưa có trong danh mục. */
  report: async (payload: {
    classroomId: string;
    equipmentId?: string;
    equipmentName?: string;
    damagedQuantity?: number;
    description: string;
    severity: IncidentSeverity;
    photoUrl: string;
  }): Promise<{ message?: string; data: EquipmentIncidentItem }> => {
    const res: any = await axiosClient.post('/academic/equipment/incidents', payload);
    return { message: res?.message, data: unwrapOne(res) };
  },

  /** Tải ảnh hiện trường lên cloud, trả về link ảnh. */
  uploadPhoto: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('photo', file);
    const res = await axiosClient.post('/teachers/uploads/photo', form, {
      params: { folder: 'facility' },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = (res as any)?.data?.url;
    if (!url) throw new Error('Không tải được ảnh lên máy chủ.');
    return url;
  },

  updateStatus: async (
    incidentId: string,
    status: EquipmentIncidentStatus,
    note?: string,
  ): Promise<EquipmentIncidentItem> =>
    unwrapOne(await axiosClient.patch(`/academic/equipment/incidents/${incidentId}/status`, { status, note })),

  // ── Kế hoạch sửa chữa / mua sắm ──
  getProposals: async (status?: string): Promise<MaintenanceProposalItem[]> => {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    return unwrapList(await axiosClient.get('/academic/equipment/proposals', { params }));
  },

  createProposal: async (payload: CreateProposalPayload): Promise<{ message?: string; data: MaintenanceProposalItem }> => {
    const res: any = await axiosClient.post('/academic/equipment/proposals', payload);
    return { message: res?.message, data: unwrapOne(res) };
  },

  approveProposal: async (proposalId: string, note?: string): Promise<{ message?: string; data: MaintenanceProposalItem }> => {
    const res: any = await axiosClient.patch(`/academic/equipment/proposals/${proposalId}/approve`, { note });
    return { message: res?.message, data: unwrapOne(res) };
  },

  rejectProposal: async (proposalId: string, note: string): Promise<{ message?: string; data: MaintenanceProposalItem }> => {
    const res: any = await axiosClient.patch(`/academic/equipment/proposals/${proposalId}/reject`, { note });
    return { message: res?.message, data: unwrapOne(res) };
  },
};

export const formatVnd = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export const formatDateTime = (value?: string) =>
  value
    ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

/** Phiếu khẩn cấp chưa được tiếp nhận quá 2 giờ (BR-052). */
export const isUrgentOverdue = (item: EquipmentIncidentItem, now = Date.now()) =>
  item.severity === 'URGENT' && item.status === 'PENDING' && now - new Date(item.reportedAt).getTime() > URGENT_RESPONSE_MS;

export const apiErrorMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;
