export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'BGH'
  | 'GIAO_VU'
  | 'KE_TOAN'
  | 'GIAO_VIEN'
  | 'BEP'
  | 'PHU_HUYNH';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: string;
  avatarUrl?: string;
  schoolId?: string;
  schoolCode?: string;
  schoolName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
