import axiosClient from './axiosClient';

export interface FacilityClassroom {
  classroomId?: string;
  roomCode?: string;
  roomName: string;
  building?: string;
  capacity: number;
  area?: number;
  status?: string;
  message?: string;
}

export const facilityClassroomApi = {
  getAllClassrooms: async (): Promise<FacilityClassroom[]> => {
    const res: any = await axiosClient.get('/classrooms');
    return Array.isArray(res) ? res : (res?.data || []);
  },

  getClassroomById: async (id: string): Promise<FacilityClassroom> => {
    const res: any = await axiosClient.get('/classrooms/' + id);
    return res?.data || res;
  },

  createClassroom: async (data: Partial<FacilityClassroom>): Promise<FacilityClassroom> => {
    const res: any = await axiosClient.post('/classrooms', data);
    return res?.data || res;
  },

  updateClassroom: async (id: string, data: Partial<FacilityClassroom>): Promise<FacilityClassroom> => {
    const res: any = await axiosClient.put('/classrooms/' + id, data);
    return res?.data || res;
  },

  deleteClassroom: async (id: string): Promise<void> => {
    await axiosClient.delete('/classrooms/' + id);
  },
};

export default facilityClassroomApi;
