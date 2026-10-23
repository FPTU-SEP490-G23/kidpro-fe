import { axiosClient } from '../api/axiosClient';

export interface TimetableItemDTO {
  itemId?: number;
  dayOfWeek: string; // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  activityName: string;
  teacherId?: string;
  teacherName?: string;
  roomId?: string;
  roomName?: string;
  activityType?: string;
}

export interface TimetableResponse {
  timetableId: string;
  classId: string;
  className: string;
  gradeLevel: string;
  academicYearId?: string;
  academicYearName?: string;
  weekNumber: number;
  startDate?: string;
  endDate?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  items: TimetableItemDTO[];
}

export interface SaveTimetablePayload {
  classId: string;
  weekNumber: number;
  academicYearId?: string;
  startDate?: string;
  endDate?: string;
  items: TimetableItemDTO[];
}

export interface CopyPreviousWeekPayload {
  classId: string;
  sourceWeekNumber: number;
  targetWeekNumber: number;
  academicYearId?: string;
}

export const timetableService = {
  getTimetable: async (classId: string, weekNumber: number = 1, academicYearId?: string): Promise<TimetableResponse> => {
    const res: any = await axiosClient.get('/timetables', {
      params: { classId, weekNumber, academicYearId }
    });
    return res?.data !== undefined ? res.data : res;
  },

  saveDraftTimetable: async (payload: SaveTimetablePayload): Promise<TimetableResponse> => {
    const res: any = await axiosClient.post('/timetables/draft', payload);
    return res?.data !== undefined ? res.data : res;
  },

  copyPreviousWeek: async (payload: CopyPreviousWeekPayload): Promise<TimetableResponse> => {
    const res: any = await axiosClient.post('/timetables/copy-previous-week', payload);
    return res?.data !== undefined ? res.data : res;
  }
};