export interface BusItem {
  busId: string;
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  startLocation: string;
  endLocation: string;
  isActive: boolean;
  totalStops: number;
  assignedTeachersCount: number;
  createdAt?: string;
}

export interface BusCreateRequest {
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  startLocation: string;
  endLocation: string;
  isActive?: boolean;
}

export interface BusUpdateRequest {
  busNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
  startLocation: string;
  endLocation: string;
  isActive?: boolean;
}

export interface BusStopItem {
  stopId: number;
  busId: string;
  busNumber?: string;
  stopName: string;
  stopAddress?: string;
  stopOrder: number;
  estimatedTime?: string;
  scheduledTime?: string;
  latitude?: number;
  longitude?: number;
}

export interface BusStopCreateRequest {
  stopName: string;
  stopAddress?: string;
  stopOrder: number;
  estimatedTime?: string; // HH:mm
  latitude?: number;
  longitude?: number;
}

export interface TeacherOption {
  staffId: string;
  staffCode: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  department?: string;
}

export type ShiftType = 'TWO_WAY' | 'MORNING_ONLY' | 'AFTERNOON_ONLY';

export interface TeacherBusAssignmentItem {
  assignmentId: number;
  busId: string;
  busNumber: string;
  staffId: string;
  staffCode: string;
  teacherName: string;
  teacherPhone?: string;
  teacherEmail?: string;
  assignedDate: string;
  shiftType: ShiftType;
  shiftTypeName: string;
  note?: string;
  createdAt?: string;
}

export interface TeacherBusAssignmentRequest {
  busId: string;
  staffId: string;
  assignedDate: string; // yyyy-MM-dd
  shiftType: ShiftType;
  note?: string;
}

