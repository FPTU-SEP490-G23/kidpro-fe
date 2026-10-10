import axiosClient from './axiosClient';
import {
  ClassEntity,
  Student,
  Timetable,
  ClassTransferRequest,
} from '../types/classroom.types';

export const classroomApi = {
  // Quản lý lớp học
  getClasses: () => {
    return axiosClient.get<ClassEntity[]>('/classes');
  },

  getStudentsByClass: (classId: string) => {
    return axiosClient.get<Student[]>(`/teachers/classes/${classId}/students`);
  },

  getAllStudents: () => {
    return axiosClient.get<Student[]>('/students');
  },

  // Thời khóa biểu (/api/academic/timetables)
  getAllTimetables: () => {
    return axiosClient.get<Timetable[]>('/academic/timetables');
  },

  getTimetablesByClass: (classId: string) => {
    return axiosClient.get<Timetable[]>(`/academic/timetables/by-class/${classId}`);
  },

  createTimetable: (data: Partial<Timetable>) => {
    return axiosClient.post<Timetable>('/academic/timetables', data);
  },

  updateTimetable: (id: string, data: Partial<Timetable>) => {
    return axiosClient.put<Timetable>(`/academic/timetables/${id}`, data);
  },

  deleteTimetable: (id: string) => {
    return axiosClient.delete(`/academic/timetables/${id}`);
  },

  // Đơn xin chuyển lớp / bảo lưu (/api/academic/transfer-requests)
  getTransferRequests: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return axiosClient.get<ClassTransferRequest[]>(`/academic/transfer-requests${query}`);
  },

  createTransferRequest: (data: { studentId: string; fromClassId: string; toClassId?: string; requestType: string; reason?: string }) => {
    return axiosClient.post<ClassTransferRequest>('/academic/transfer-requests', data);
  },

  reviewTransferRequest: (id: string, data: { status: string; reviewNote?: string }) => {
    return axiosClient.put<ClassTransferRequest>(`/academic/transfer-requests/${id}/review`, data);
  },
};

export default classroomApi;
