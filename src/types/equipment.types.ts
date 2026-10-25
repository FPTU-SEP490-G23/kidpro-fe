export type EquipmentCategory = 'STEAM' | 'MUSICAL' | 'TOY' | 'FURNITURE' | 'MEDICAL';
export type EquipmentStatus = 'GOOD' | 'DAMAGED' | 'DISPOSAL_PENDING';

export interface EquipmentInventoryResponse {
  allocationId: string;
  equipmentId: string;
  equipmentCode: string;
  name: string;
  category: EquipmentCategory;
  unit: string;
  roomId?: string;
  roomName?: string;
  quantity: number;
  status: EquipmentStatus;
  updatedAt?: string;
}

export interface CreateEquipmentPayload {
  equipmentCode: string;
  name: string;
  category: EquipmentCategory;
  unit: string;
  roomId: string;
  quantity: number;
  description?: string;
}

export interface TransferEquipmentPayload {
  equipmentId: string;
  fromRoomId: string;
  toRoomId: string;
  quantity: number;
  transferReason: string;
}

export interface EquipmentTransferLogResponse {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  fromRoomId: string;
  fromRoomName: string;
  toRoomId: string;
  toRoomName: string;
  quantityTransferred: number;
  transferReason: string;
  transferredByName?: string;
  transferredAt: string;
}
