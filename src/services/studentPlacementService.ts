import { axiosClient } from '../api/axiosClient';

export interface UnassignedStudentResponse {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  ageInMonths: number;
  ageInYears: number;
  suggestedGradeLevel: 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';
  suggestedGradeName: string;
  status: string;
  parentName?: string;
  parentPhone?: string;
}

export interface StudentInClassResponse {
  studentId: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  ageInMonths: number;
  status: string;
  enrollmentDate?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface ClassPlacementRequest {
  classId: string;
  studentIds: string[];
}

export interface AutoPlacementRequest {
  academicYearId?: string;
  gradeLevel?: 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';
}

export interface AutoPlacementResultResponse {
  assignedCount: number;
  remainingUnassignedCount: number;
  message: string;
  details: {
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
  }[];
}

export const studentPlacementService = {
  getUnassignedStudents: async (params?: { academicYearId?: string; gradeLevel?: string }): Promise<UnassignedStudentResponse[]> => {
    const res: any = await axiosClient.get('/students/unassigned', { params });
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  getStudentsByClass: async (classId: string): Promise<StudentInClassResponse[]> => {
    const res: any = await axiosClient.get(`/classes/${classId}/students`);
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  assignStudents: async (data: ClassPlacementRequest): Promise<any> => {
    const res: any = await axiosClient.post('/students/class-placements', data);
    return res?.data !== undefined ? res.data : res;
  },

  removeStudentFromClass: async (studentId: string): Promise<any> => {
    const res: any = await axiosClient.delete(`/students/${studentId}/class-placement`);
    return res?.data !== undefined ? res.data : res;
  },

  autoAssign: async (data?: AutoPlacementRequest): Promise<AutoPlacementResultResponse> => {
    const res: any = await axiosClient.post('/students/class-placements/auto', data || {});
    return res?.data !== undefined ? res.data : res;
  }
};