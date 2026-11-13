import axiosClient from '../api/axiosClient';
import {
  TeacherAssignmentRequest,
  TeacherAssignmentDetail,
  AvailableTeacher,
  ApiResponse
} from '../types/classAffairs.types';

export const assignmentService = {
  // =========================================================================
  // Lập Kế hoạch Phân công Giáo viên Chủ nhiệm & Phụ tá
  // =========================================================================

  /**
   * Xem lịch sử và dự thảo phân công hiện tại của một lớp học
   */
  getAssignmentsByClass: async (classId: string): Promise<TeacherAssignmentDetail[]> => {
    const res: any = await axiosClient.get(`/teacher-assignments/classes/${classId}`);
    return Array.isArray(res) ? res : (res?.data || []);
  },

  /**
   * Lập dự thảo phân công giáo viên (BR-006 -> MSG-019, BR-008 -> MSG-031, MSG-030)
   */
  createDraftAssignment: async (payload: TeacherAssignmentRequest): Promise<ApiResponse<TeacherAssignmentDetail>> => {
    const res: any = await axiosClient.post('/teacher-assignments/draft', payload);
    return res;
  },

  /**
   * Lấy danh sách giáo viên khả dụng để phân công
   */
  getAvailableTeachers: async (academicYearId?: string): Promise<AvailableTeacher[]> => {
    const params: any = {};
    if (academicYearId && academicYearId !== 'ALL') params.academicYearId = academicYearId;
    const res: any = await axiosClient.get('/teacher-assignments/available-teachers', { params });
    return Array.isArray(res) ? res : (res?.data || []);
  },
};

export default assignmentService;