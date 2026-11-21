import { axiosClient } from '../api/axiosClient';
import {
  ClubAssignmentDetailResponse,
  AvailableClubTeacherResponse,
  ExtracurricularAssignmentPayload
} from '../types/extracurricular.types';

export const extracurricularAssignmentService = {
  getClasses: async (params?: {
    academicYearId?: string;
    status?: string;
  }): Promise<ClubAssignmentDetailResponse[]> => {
    const res: any = await axiosClient.get('/extracurricular-classes', { params });
    const raw = res?.data !== undefined ? res.data : res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => ({
      classId: item.classId,
      name: item.name || item.className || 'Lớp CLB',
      subject: item.subject || item.serviceName || 'Ngoại khóa mầm non',
      dayOfWeek: item.dayOfWeek || item.scheduleDescription || 'Trong tuần',
      startTime: item.startTime || '16:00',
      endTime: item.endTime || '17:15',
      academicYearId: item.academicYearId,
      academicYearName: item.academicYearName,
      status: item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE'),
      leadTeacherId: item.leadTeacherId,
      leadTeacherName: item.leadTeacherName,
      assistantTeacherId: item.assistantTeacherId,
      assistantTeacherName: item.assistantTeacherName,
      // Chỉ cần phân giáo viên chính là được tính là đã phân công
      assigned: Boolean(item.leadTeacherId || item.leadTeacherName || item.isFullyAssigned || item.assigned),
    }));
  },

  getUnassignedClasses: async (): Promise<ClubAssignmentDetailResponse[]> => {
    const res: any = await axiosClient.get('/extracurricular-classes/unassigned');
    const raw = res?.data !== undefined ? res.data : res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => ({
      classId: item.classId,
      name: item.name || item.className || 'Lớp CLB',
      subject: item.subject || item.serviceName || 'Ngoại khóa mầm non',
      dayOfWeek: item.dayOfWeek || item.scheduleDescription || 'Trong tuần',
      startTime: item.startTime || '16:00',
      endTime: item.endTime || '17:15',
      academicYearId: item.academicYearId,
      academicYearName: item.academicYearName,
      status: item.status || (item.isActive ? 'ACTIVE' : 'INACTIVE'),
      leadTeacherId: item.leadTeacherId,
      leadTeacherName: item.leadTeacherName,
      assistantTeacherId: item.assistantTeacherId,
      assistantTeacherName: item.assistantTeacherName,
      assigned: Boolean(item.leadTeacherId || item.leadTeacherName || item.isFullyAssigned || item.assigned),
    }));
  },

  getAvailableTeachers: async (classId: string): Promise<AvailableClubTeacherResponse[]> => {
    const res: any = await axiosClient.get(`/extracurricular-classes/${classId}/available-teachers`);
    const raw = res?.data !== undefined ? res.data : res;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((item: any) => {
      const active = item.accountStatus ? item.accountStatus === 'ACTIVE' : (item.active !== false);
      const hasConflict = !item.isAvailable || Boolean(item.conflictReason);
      return {
        teacherId: item.staffId || item.teacherId || item.id,
        fullName: item.fullName || 'Giáo viên',
        email: item.email,
        phoneNumber: item.phoneNumber,
        role: item.department || item.qualification || item.role || 'Giáo viên',
        active: active,
        hasScheduleConflict: hasConflict,
        conflictDetail: item.conflictReason || item.conflictDetail,
        currentClubHours: item.currentClubAssignmentsCount ?? item.currentClubHours ?? 0,
        maxWeeklyClubHours: item.maxWeeklyClubHours || 3,
        availableForAssignment: item.isAvailable ?? item.availableForAssignment ?? true,
      };
    });
  },

  assignTeachers: async (
    classId: string,
    payload: ExtracurricularAssignmentPayload
  ): Promise<ClubAssignmentDetailResponse> => {
    const res: any = await axiosClient.post(`/extracurricular-classes/${classId}/assignments`, payload);
    return res?.data !== undefined ? res.data : res;
  }
};
