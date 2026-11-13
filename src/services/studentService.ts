import axiosClient from '../api/axiosClient';
import {
  StudentItem,
  StudentDetail,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentStatus,
} from '../types/student.types';
import { ApiResponse, GradeLevel } from '../types/classAffairs.types';
import { PageResponse } from './classService';

export const studentService = {
  /**
   * Tra cứu, tìm kiếm danh sách học sinh toàn trường có phân trang và bộ lọc
   */
  getStudents: async (params?: {
    keyword?: string;
    gradeLevel?: GradeLevel | string;
    classId?: string;
    status?: StudentStatus | string;
    academicYearId?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<PageResponse<StudentItem>> => {
    const cleanParams: any = {};
    if (params?.keyword) cleanParams.keyword = params.keyword;
    if (params?.gradeLevel && params.gradeLevel !== 'ALL') cleanParams.gradeLevel = params.gradeLevel;
    if (params?.classId && params.classId !== 'ALL') cleanParams.classId = params.classId;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.academicYearId && params.academicYearId !== 'ALL') cleanParams.academicYearId = params.academicYearId;
    if (params?.page !== undefined) cleanParams.page = params.page;
    if (params?.size !== undefined) cleanParams.size = params.size;
    if (params?.sortBy) cleanParams.sortBy = params.sortBy;
    if (params?.sortDir) cleanParams.sortDir = params.sortDir;

    const res: any = await axiosClient.get('/students', { params: cleanParams });
    const payload = res?.data || res;
    if (payload && Array.isArray(payload.content)) {
      return payload;
    }
    if (Array.isArray(payload)) {
      return {
        content: payload,
        totalElements: payload.length,
        totalPages: 1,
        size: payload.length,
        number: 0,
      };
    }
    return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 };
  },

  /**
   * Xem chi tiết toàn bộ hồ sơ học sinh
   */
  getStudentById: async (id: string): Promise<StudentDetail> => {
    const res: any = await axiosClient.get(`/students/${id}`);
    return res?.data || res;
  },

  /**
   * Tiếp nhận tạo mới và cấp mã hồ sơ học sinh
   */
  createStudent: async (payload: CreateStudentPayload): Promise<ApiResponse<StudentDetail>> => {
    const res: any = await axiosClient.post('/students', payload);
    return res;
  },

  /**
   * Cập nhật thông tin lý lịch và giấy tờ học sinh
   */
  updateStudent: async (id: string, payload: UpdateStudentPayload): Promise<ApiResponse<StudentDetail>> => {
    const res: any = await axiosClient.put(`/students/${id}`, payload);
    return res;
  },
};

export default studentService;
