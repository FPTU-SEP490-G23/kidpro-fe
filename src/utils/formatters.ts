import { UserRole } from '../types/auth.types';
import { BmiStatus } from '../types/health.types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatTime = (timeStr?: string): string => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5); // HH:mm
};

export const calculateBmi = (weightKg: number, heightCm: number): number => {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBmiStatus = (bmi: number): BmiStatus => {
  if (bmi < 14.0) return 'UNDERWEIGHT';
  if (bmi <= 17.0) return 'NORMAL';
  if (bmi <= 19.0) return 'OVERWEIGHT';
  return 'OBESE';
};

export const getBmiBadge = (status: BmiStatus) => {
  switch (status) {
    case 'UNDERWEIGHT':
      return { label: 'Thiếu cân', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    case 'NORMAL':
      return { label: 'Bình thường', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'OVERWEIGHT':
      return { label: 'Nguy cơ béo phì', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'OBESE':
      return { label: 'Béo phì', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { label: 'Chưa xác định', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
};

export const getBmiStatusBadgeColor = (status: BmiStatus): string => {
  return getBmiBadge(status).color;
};

export const getRoleDisplayName = (role: UserRole): string => {
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'Quản trị viên',
    SUPER_ADMIN: 'Quản trị Nền tảng',
    BGH: 'Ban giám hiệu',
    GIAO_VU: 'Giáo vụ',
    KE_TOAN: 'Kế toán',
    GIAO_VIEN: 'Giáo viên',
    BEP: 'Nhân viên Bếp',
    PHU_HUYNH: 'Phụ huynh',
  };
  return map[role] || role;
};

export const getRoleBadgeColor = (role: UserRole): string => {
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    SUPER_ADMIN: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    BGH: 'bg-blue-100 text-blue-700 border-blue-200',
    GIAO_VU: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    KE_TOAN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    GIAO_VIEN: 'bg-amber-100 text-amber-700 border-amber-200',
    BEP: 'bg-rose-100 text-rose-700 border-rose-200',
    PHU_HUYNH: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  };
  return map[role] || 'bg-slate-100 text-slate-700 border-slate-200';
};
