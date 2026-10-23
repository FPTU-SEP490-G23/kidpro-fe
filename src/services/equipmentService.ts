import { axiosClient } from '../api/axiosClient';
import {
  EquipmentInventoryResponse,
  CreateEquipmentPayload,
  TransferEquipmentPayload,
  EquipmentTransferLogResponse
} from '../types/equipment.types';

export const equipmentService = {
  getInventories: async (params?: {
    roomId?: string;
    category?: string;
    keyword?: string;
  }): Promise<EquipmentInventoryResponse[]> => {
    const res: any = await axiosClient.get('/equipment-inventories', { params });
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  },

  createEquipment: async (payload: CreateEquipmentPayload): Promise<EquipmentInventoryResponse> => {
    const res: any = await axiosClient.post('/equipment-inventories', payload);
    return res?.data !== undefined ? res.data : res;
  },

  transferEquipment: async (payload: TransferEquipmentPayload): Promise<EquipmentInventoryResponse> => {
    const res: any = await axiosClient.post('/equipment-inventories/transfers', payload);
    return res?.data !== undefined ? res.data : res;
  },

  getTransferLogs: async (equipmentId?: string): Promise<EquipmentTransferLogResponse[]> => {
    const params = equipmentId ? { equipmentId } : {};
    const res: any = await axiosClient.get('/equipment-inventories/transfers/logs', { params });
    const data = res?.data !== undefined ? res.data : res;
    return Array.isArray(data) ? data : [];
  }
};
