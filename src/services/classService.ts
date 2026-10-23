import axiosClient from '../api/axiosClient';
import {
  ClassSummary,
  ClassDetail,
  UpdateClassPayload,
  CreateClassProposalPayload,
  UpdateClassProposalPayload,
  ClassProposalResponse,
  ApiResponse,
  GradeLevel,
  ClassStatus
} from '../types/classAffairs.types';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const classService = {
  // =========================================================================
  // G3-UC-01: Quản lý Danh sách & Cập nhật Thông tin Lớp học
  // =========================================================================

  /**
   * Tra cứu danh sách lớp học theo bộ lọc: academicYearId, gradeLevel
   */
  getClasses: async (params?: {
    academicYearId?: string;
    gradeLevel?: GradeLevel | string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ClassSummary>> => {
    const cleanParams: any = {};
    if (params?.academicYearId && params.academicYearId !== 'ALL') cleanParams.academicYearId = params.academicYearId;
    if (params?.gradeLevel && params.gradeLevel !== 'ALL') cleanParams.gradeLevel = params.gradeLevel;
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;

    const res: any = await axiosClient.get('/classes', { params: cleanParams });
    if (res && Array.isArray(res.content)) {
      return res;
    }
    if (Array.isArray(res)) {
      return {
        content: res,
        totalElements: res.length,
        totalPages: 1,
        size: res.length,
        number: 0,
      };
    }
    return res?.data || { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };
  },

  /**
   * Xem chi tiết thông tin một lớp học
   */
  getClassById: async (id: string): Promise<ClassDetail> => {
    const res: any = await axiosClient.get(`/classes/${id}`);
    return res?.data || res;
  },

  /**
   * Cập nhật tên lớp hoặc phòng học phân bổ (BR-005, MSG-024, MSG-025)
   */
  updateClass: async (id: string, payload: UpdateClassPayload): Promise<ApiResponse<ClassDetail>> => {
    const res: any = await axiosClient.put(`/classes/${id}`, payload);
    return res;
  },

  // =========================================================================
  // G3-UC-02: Lập Kế hoạch Mở Lớp học Mới
  // =========================================================================

  /**
   * Tạo đề xuất kế hoạch mở lớp mới (status: PENDING_APPROVAL)
   * BR-005 (check trùng tên -> MSG-004), BR-007 (status PENDING_APPROVAL -> MSG-026)
   */
  createProposal: async (payload: CreateClassProposalPayload): Promise<ApiResponse<ClassProposalResponse>> => {
    const res: any = await axiosClient.post('/classes/proposals', payload);
    return res;
  },

  /**
   * Chỉnh sửa kế hoạch mở lớp khi ở trạng thái PENDING_APPROVAL
   */
  updateProposal: async (id: string, payload: UpdateClassProposalPayload): Promise<ApiResponse<ClassProposalResponse>> => {
    const res: any = await axiosClient.put(`/classes/proposals/${id}`, payload);
    return res;
  },

  /**
   * Lấy danh sách kế hoạch mở lớp theo năm học / khối / trạng thái
   */
  getProposals: async (params?: {
    academicYearId?: string;
    gradeLevel?: GradeLevel | string;
    status?: ClassStatus | string;
  }): Promise<ClassProposalResponse[]> => {
    const cleanParams: any = {};
    if (params?.academicYearId && params.academicYearId !== 'ALL') cleanParams.academicYearId = params.academicYearId;
    if (params?.gradeLevel && params.gradeLevel !== 'ALL') cleanParams.gradeLevel = params.gradeLevel;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;

    const res: any = await axiosClient.get('/classes/proposals', { params: cleanParams });
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Xem chi tiết kế hoạch mở lớp
   */
  getProposalById: async (id: string): Promise<ClassProposalResponse> => {
    const res: any = await axiosClient.get(`/classes/proposals/${id}`);
    return res?.data || res;
  },
};

export default classService;