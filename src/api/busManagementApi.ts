import axiosClient from './axiosClient';
import {
  BusItem,
  BusCreateRequest,
  BusUpdateRequest,
  BusStopItem,
  BusStopCreateRequest,
  TeacherOption,
  TeacherBusAssignmentItem,
  TeacherBusAssignmentRequest,
  DriverAccountCheckResponse,
} from '../types/bus.types';

export const busManagementApi = {
  // === BUS APIS ===
  getAllBuses: async (): Promise<BusItem[]> => {
    const res: any = await axiosClient.get('/bgh/buses');
    return Array.isArray(res) ? res : (res?.data ?? res ?? []);
  },

  checkDriverAccount: async (phone: string): Promise<DriverAccountCheckResponse> => {
    const res: any = await axiosClient.get('/bgh/buses/check-driver', { params: { phone } });
    return res?.data ?? res;
  },

  getBusById: async (busId: string): Promise<BusItem> => {
    const res: any = await axiosClient.get(`/bgh/buses/${busId}`);
    return res?.data ?? res;
  },

  createBus: async (data: BusCreateRequest): Promise<BusItem> => {
    const res: any = await axiosClient.post('/bgh/buses', data);
    return res?.data ?? res;
  },

  updateBus: async (busId: string, data: BusUpdateRequest): Promise<BusItem> => {
    const res: any = await axiosClient.put(`/bgh/buses/${busId}`, data);
    return res?.data ?? res;
  },

  toggleBusStatus: async (busId: string): Promise<void> => {
    await axiosClient.patch(`/bgh/buses/${busId}/toggle-status`);
  },

  deleteBus: async (busId: string): Promise<void> => {
    await axiosClient.delete(`/bgh/buses/${busId}`);
  },

  // === BUS STOP APIS ===
  getStopsByBusId: async (busId: string): Promise<BusStopItem[]> => {
    const res: any = await axiosClient.get(`/bgh/buses/${busId}/stops`);
    return Array.isArray(res) ? res : (res?.data ?? res ?? []);
  },

  addBusStop: async (busId: string, data: BusStopCreateRequest): Promise<BusStopItem> => {
    const res: any = await axiosClient.post(`/bgh/buses/${busId}/stops`, data);
    return res?.data ?? res;
  },

  updateBusStop: async (busId: string, stopId: number, data: BusStopCreateRequest): Promise<BusStopItem> => {
    const res: any = await axiosClient.put(`/bgh/buses/${busId}/stops/${stopId}`, data);
    return res?.data ?? res;
  },

  deleteBusStop: async (busId: string, stopId: number): Promise<void> => {
    await axiosClient.delete(`/bgh/buses/${busId}/stops/${stopId}`);
  },

  // === TEACHER ASSIGNMENT APIS ===
  getTeacherOptions: async (): Promise<TeacherOption[]> => {
    const res: any = await axiosClient.get('/bgh/buses/teacher-options');
    return Array.isArray(res) ? res : (res?.data ?? res ?? []);
  },

  getAssignments: async (busId?: string, date?: string): Promise<TeacherBusAssignmentItem[]> => {
    const params: Record<string, string> = {};
    if (busId) params.busId = busId;
    if (date) params.date = date;
    const res: any = await axiosClient.get('/bgh/buses/assignments', { params });
    return Array.isArray(res) ? res : (res?.data ?? res ?? []);
  },

  assignTeacher: async (data: TeacherBusAssignmentRequest): Promise<TeacherBusAssignmentItem> => {
    const res: any = await axiosClient.post('/bgh/buses/assignments', data);
    return res?.data ?? res;
  },

  removeAssignment: async (assignmentId: number): Promise<void> => {
    await axiosClient.delete(`/bgh/buses/assignments/${assignmentId}`);
  },
};

export default busManagementApi;

