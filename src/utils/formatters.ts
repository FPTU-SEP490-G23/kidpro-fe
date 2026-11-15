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
  return Number((weightKg / (heightM * heightM)).toFixed(2));
};

export const getBmiStatus = (bmi: number): BmiStatus => {
  if (bmi < 14.0) return 'UNDERWEIGHT';
  if (bmi <= 18.0) return 'NORMAL';
  if (bmi <= 20.0) return 'OVERWEIGHT';
  return 'OBESE';
};

export const getBmiBadge = (status: BmiStatus) => {
  switch (status) {
    case 'UNDERWEIGHT':
      return { label: 'Thiếu cân / Suy dinh dưỡng', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'NORMAL':
      return { label: 'Bình thường / Khỏe mạnh', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'OVERWEIGHT':
      return { label: 'Thừa cân / Nguy cơ béo phì', color: 'bg-orange-100 text-orange-800 border-orange-300' };
    case 'OBESE':
      return { label: 'Béo phì', color: 'bg-rose-100 text-rose-800 border-rose-300' };
    default:
      return { label: 'Chưa xác định', color: 'bg-slate-100 text-slate-800 border-slate-300' };
  }
};

export const getBmiStatusBadgeColor = (status: BmiStatus): string => {
  return getBmiBadge(status).color;
};

// Chuyển đổi số tiền thành chữ tiếng Việt chuẩn kế toán Việt Nam (VAS)
export const numberToVietnameseWords = (num: number): string => {
  if (!num || isNaN(num) || num === 0) return 'Không đồng chẵn';

  const defaultNumbers = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readThreeDigits = (threeDigits: number, isHighest: boolean): string => {
    let hundred = Math.floor(threeDigits / 100);
    let ten = Math.floor((threeDigits % 100) / 10);
    let unit = threeDigits % 10;
    let result = '';

    if (hundred > 0 || !isHighest) {
      result += defaultNumbers[hundred] + ' trăm ';
    }

    if (ten > 1) {
      result += defaultNumbers[ten] + ' mươi ';
      if (unit === 1) result += 'mốt ';
      else if (unit === 5) result += 'lăm ';
      else if (unit > 0) result += defaultNumbers[unit] + ' ';
    } else if (ten === 1) {
      result += 'mười ';
      if (unit === 5) result += 'lăm ';
      else if (unit > 0) result += defaultNumbers[unit] + ' ';
    } else if (ten === 0 && unit > 0) {
      if (hundred > 0 || !isHighest) result += 'lẻ ';
      result += defaultNumbers[unit] + ' ';
    }

    return result.trim();
  };

  let cleanNum = Math.floor(Math.abs(num));
  let groups: number[] = [];
  while (cleanNum > 0) {
    groups.push(cleanNum % 1000);
    cleanNum = Math.floor(cleanNum / 1000);
  }

  let words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i];
    if (val > 0) {
      const readVal = readThreeDigits(val, i === groups.length - 1);
      const unitName = units[i];
      words.push(`${readVal} ${unitName}`.trim());
    }
  }

  let finalWords = words.join(' ').replace(/\s+/g, ' ').trim();
  if (!finalWords) return 'Không đồng chẵn';

  finalWords = finalWords.charAt(0).toUpperCase() + finalWords.slice(1) + ' đồng chẵn';
  return finalWords;
};

// ==========================================
// ROLE NORMALIZATION VÀ ĐIỀU HƯỚNG CHUẨN XÁC
// ==========================================

export const normalizeRole = (rawRole?: string | null): UserRole => {
  if (!rawRole) return 'BGH';
  const roleStr = rawRole.replace(/^ROLE_/, '').trim().toUpperCase();

  switch (roleStr) {
    case 'BOARD_OF_DIRECTORS':
    case 'PRINCIPAL':
    case 'VICE_PRINCIPAL':
    case 'BGH':
      return 'BGH';

    case 'SUPER_ADMIN':
    case 'SYSTEM_ADMIN':
    case 'ADMIN':
      return 'SYSTEM_ADMIN';

    case 'TEACHER':
    case 'GIAO_VIEN':
      return 'GIAO_VIEN';

    case 'KITCHEN_STAFF':
    case 'CHEF':
    case 'BEP':
      return 'BEP';

    case 'ACCOUNTANT':
    case 'KE_TOAN':
      return 'KE_TOAN';

    case 'ACADEMIC_STAFF':
    case 'STAFF':
    case 'GIAO_VU':
      return 'GIAO_VU';

    case 'PARENT':
    case 'PHU_HUYNH':
      return 'PHU_HUYNH';

    default:
      return 'BGH';
  }
};

export const getRoleDisplayName = (role?: UserRole | string | null): string => {
  const normalized = normalizeRole(role);
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'Quản trị viên hệ thống (Super Admin)',
    BGH: 'Ban Giám Hiệu (Hiệu trưởng)',
    GIAO_VU: 'Cán bộ Giáo vụ',
    KE_TOAN: 'Kế toán & Học phí',
    GIAO_VIEN: 'Giáo viên Chủ nhiệm',
    BEP: 'Nhân viên Bếp Bán trú',
    PHU_HUYNH: 'Phụ huynh Học sinh',
  };
  return map[normalized] || 'Người dùng';
};

export const getRoleDescription = (role?: UserRole | string | null): string => {
  const normalized = normalizeRole(role);
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'Quản trị hệ thống, đa trường học, phân quyền RBAC & giám sát nền tảng',
    BGH: 'Điều hành toàn trường, chỉ đạo học vụ & giám sát an ninh học đường',
    GIAO_VU: 'Tiếp nhận học sinh, thời khóa biểu, duyệt giáo án & báo cáo MoET',
    KE_TOAN: 'Quản lý biểu phí, phát hành hóa đơn & quyết toán bán trú',
    GIAO_VIEN: 'Điểm danh lớp, soạn giáo án, đánh giá TT28 & nhật ký chăm sóc',
    BEP: 'Chốt suất ăn 08:30, khay dị ứng, lưu mẫu 24h & kiểm thực ATVSTP',
    PHU_HUYNH: 'Sổ liên lạc, báo vắng, dặn thuốc, học phí & khảo sát dịch vụ',
  };
  return map[normalized] || '';
};

export const getRoleBadgeColor = (role?: UserRole | string | null): string => {
  const normalized = normalizeRole(role);
  const map: Record<UserRole, string> = {
    SYSTEM_ADMIN: 'bg-slate-800 text-white border-slate-700',
    BGH: 'bg-[#275A4E] text-white border-[#1E4D40]',
    GIAO_VU: 'bg-teal-50 text-teal-800 border-teal-200',
    KE_TOAN: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    GIAO_VIEN: 'bg-[#78C2AD]/20 text-[#1E4D40] border-[#78C2AD]/60',
    BEP: 'bg-orange-50 text-orange-800 border-orange-200',
    PHU_HUYNH: 'bg-amber-50 text-[#B87A14] border-amber-300',
  };
  return map[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
};

export const getRoleHomePath = (role?: UserRole | string | null): string => {
  if (!role) return '/login';
  const normalized = normalizeRole(role);
  switch (normalized) {
    case 'PHU_HUYNH':
      return '/parent';
    case 'BEP':
      return '/kitchen';
    case 'KE_TOAN':
      return '/finance';
    case 'GIAO_VIEN':
      return '/teacher';
    case 'GIAO_VU':
      return '/academic';
    case 'BGH':
      return '/dashboard/executive';
    case 'SYSTEM_ADMIN':
      return '/admin/schools';
    default:
      return '/dashboard/executive';
  }
};
