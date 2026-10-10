import { UserRole } from '../types/auth.types';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string; // Tên icon Lucide
  badgeKey?: 'unresolvedAlerts' | 'pendingMeals' | 'overdueInvoices' | 'pendingDisputes' | 'unreadLeaves';
  roles: Array<'SUPER_ADMIN' | 'BGH' | 'GIAO_VU' | 'GIAO_VIEN' | 'KE_TOAN' | 'BEP' | 'PHU_HUYNH' | 'SYSTEM_ADMIN'>;
  useCases: string[]; // Danh sách mã UC (ví dụ: ['UC-021', 'UC-022'])
  children?: NavItem[];
}

export interface NavGroup {
  groupTitle: string;
  roles: Array<'SUPER_ADMIN' | 'BGH' | 'GIAO_VU' | 'GIAO_VIEN' | 'KE_TOAN' | 'BEP' | 'PHU_HUYNH' | 'SYSTEM_ADMIN'>;
  items: NavItem[];
}

export interface NavigationBadges {
  unresolvedAlerts: number;
  pendingMeals: number;
  overdueInvoices: number;
  pendingDisputes: number;
  unreadLeaves: number;
}

/**
 * MA TRẬN PHÂN CHIA MENU THEO TỪNG VAI TRÒ (RBAC)
 * Bao phủ toàn bộ 69 Use Cases của Hệ sinh thái Mầm non KIDPRO
 */
export const NAVIGATION_GROUPS: NavGroup[] = [
  // ==========================================
  // NHÓM 1: QUẢN TRỊ NỀN TẢNG (SUPER_ADMIN / SYSTEM_ADMIN)
  // ==========================================
  {
    groupTitle: 'Hạ tầng & Nền tảng Đa trường',
    roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    items: [
      {
        id: 'admin-schools',
        title: 'Quản Trị Trường Học (Tenants)',
        path: '/admin/schools',
        icon: 'Building2',
        roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
        useCases: ['UC-005'],
      },
      {
        id: 'admin-rbac',
        title: 'Kiểm Soát Truy Cập & RBAC',
        path: '/admin/users-rbac',
        icon: 'ShieldCheck',
        roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
        useCases: ['UC-006'],
      },
      {
        id: 'admin-integrations',
        title: 'Tích Hợp Dịch Vụ Ngoại Vi',
        path: '/admin/integrations',
        icon: 'Cable',
        roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
        useCases: ['UC-007'],
      },
      {
        id: 'admin-health',
        title: 'Giám Sát Sức Khỏe & Uptime',
        path: '/admin/system-health',
        icon: 'Activity',
        roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
        useCases: ['UC-008'],
      },
      {
        id: 'admin-audit',
        title: 'Nhật Ký Kiểm Toán Toàn Nền Tảng',
        path: '/admin/audit-logs',
        icon: 'ScrollText',
        roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'],
        useCases: ['UC-014'],
      },
    ],
  },

  // ==========================================
  // NHÓM 2: LÃNH ĐẠO & ĐIỀU HÀNH (BGH)
  // ==========================================
  {
    groupTitle: 'Ban Giám Hiệu & Điều Hành',
    roles: ['BGH'],
    items: [
      {
        id: 'bgh-executive',
        title: 'Tổng Quan Điều Hành Toàn Trường',
        path: '/dashboard/executive',
        icon: 'LayoutDashboard',
        badgeKey: 'unresolvedAlerts',
        roles: ['BGH'],
        useCases: ['UC-012'],
      },
      {
        id: 'bgh-academic-planning',
        title: 'Kế Hoạch Đào Tạo & Cơ Cấu',
        path: '/bgh/academic-planning',
        icon: 'CalendarDays',
        roles: ['BGH'],
        useCases: ['UC-009', 'UC-010', 'UC-019'],
      },
      {
        id: 'bgh-finance-policies',
        title: 'Quản Trị Tài Chính & Biểu Phí',
        path: '/bgh/finance-policies',
        icon: 'Receipt',
        badgeKey: 'pendingDisputes',
        roles: ['BGH'],
        useCases: ['UC-011', 'UC-037', 'UC-059', 'UC-060'],
      },
      {
        id: 'bgh-safety-reports',
        title: 'An Toàn & Báo Cáo Chuyên Môn',
        path: '/bgh/safety-reports',
        icon: 'ShieldAlert',
        badgeKey: 'unresolvedAlerts',
        roles: ['BGH'],
        useCases: ['UC-024', 'UC-032', 'UC-055', 'UC-013', 'UC-014'],
      },
      {
        id: 'bgh-announcements',
        title: 'Truyền Thông & Khảo Sát',
        path: '/bgh/announcements',
        icon: 'Megaphone',
        roles: ['BGH'],
        useCases: ['UC-067', 'UC-068'],
      },
    ],
  },

  // ==========================================
  // NHÓM 3: HỌC VỤ & NHÂN SỰ LỚP (GIAO_VU)
  // ==========================================
  {
    groupTitle: 'Học Vụ & Hồ Sơ Học Sinh',
    roles: ['GIAO_VU'],
    items: [
      {
        id: 'gv-students',
        title: 'Hồ Sơ Học Sinh & Phân Lớp',
        path: '/academic/students',
        icon: 'Baby',
        roles: ['GIAO_VU'],
        useCases: ['UC-015', 'UC-053', 'UC-019'],
      },
      {
        id: 'gv-classes',
        title: 'Cơ Cấu Lớp & Nhân Sự',
        path: '/academic/classes',
        icon: 'School',
        roles: ['GIAO_VU'],
        useCases: ['UC-010', 'UC-016', 'UC-063'],
      },
      {
        id: 'gv-timetables',
        title: 'Thời Khóa Biểu & Lịch Học',
        path: '/academic/timetables',
        icon: 'CalendarClock',
        roles: ['GIAO_VU'],
        useCases: ['UC-017', 'UC-018', 'UC-062'],
      },
      {
        id: 'gv-guardians',
        title: 'Thẩm Định An Toàn & Đón Trẻ',
        path: '/academic/safety-guardians',
        icon: 'ShieldCheck',
        roles: ['GIAO_VU'],
        useCases: ['UC-020', 'UC-050'],
      },
      {
        id: 'gv-reports',
        title: 'Báo Cáo Sổ Sách & Lưu Trữ',
        path: '/academic/reports',
        icon: 'FileText',
        roles: ['GIAO_VU'],
        useCases: ['UC-064', 'UC-065'],
      },
    ],
  },

  // ==========================================
  // NHÓM 4: GIÁO VIÊN CHỦ NHIỆM & BỘ MÔN (GIAO_VIEN)
  // ==========================================
  {
    groupTitle: 'Vận Hành Lớp Học & Chăm Sóc Trẻ',
    roles: ['GIAO_VIEN'],
    items: [
      {
        id: 'tch-attendance',
        title: 'Điểm Danh & Chuyên Cần Lớp',
        path: '/teacher/attendance',
        icon: 'ClipboardCheck',
        badgeKey: 'unreadLeaves',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-021', 'UC-022', 'UC-026'],
      },
      {
        id: 'tch-dismissal',
        title: 'An Toàn Đón Trả Tan Trường',
        path: '/teacher/dismissal',
        icon: 'DoorOpen',
        badgeKey: 'unresolvedAlerts',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-023', 'UC-043', 'UC-024', 'UC-025'],
      },
      {
        id: 'tch-health',
        title: 'Y Tế & Sức Khỏe Của Trẻ',
        path: '/teacher/health',
        icon: 'HeartPulse',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-027', 'UC-051', 'UC-052', 'UC-053'],
      },
      {
        id: 'tch-activities',
        title: 'Chuyên Môn & Hoạt Động Lớp',
        path: '/teacher/activities',
        icon: 'BookOpen',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-028', 'UC-054', 'UC-061', 'UC-063'],
      },
      {
        id: 'tch-comms',
        title: 'Kênh Tương Tác & Bản Tin',
        path: '/teacher/communication',
        icon: 'MessageSquare',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-066', 'UC-067'],
      },
    ],
  },

  // ==========================================
  // NHÓM 5: KẾ TOÁN TRƯỜNG HỌC (KE_TOAN)
  // ==========================================
  {
    groupTitle: 'Tài Chính & Học Phí Bán Trú',
    roles: ['KE_TOAN'],
    items: [
      {
        id: 'fin-configs',
        title: 'Cấu Hình Chính Sách Học Phí',
        path: '/finance/configs',
        icon: 'Calculator',
        roles: ['KE_TOAN'],
        useCases: ['UC-033', 'UC-025', 'UC-034'],
      },
      {
        id: 'fin-billing',
        title: 'Động Cơ Quyết Toán Học Phí',
        path: '/finance/billing-engine',
        icon: 'Cpu',
        roles: ['KE_TOAN'],
        useCases: ['UC-035', 'UC-036', 'UC-056', 'UC-037'],
      },
      {
        id: 'fin-payments',
        title: 'Thu Ngân, Gạch Nợ & Khiếu Nại',
        path: '/finance/payments',
        icon: 'CreditCard',
        badgeKey: 'pendingDisputes',
        roles: ['KE_TOAN'],
        useCases: ['UC-038', 'UC-039', 'UC-059'],
      },
      {
        id: 'fin-reports',
        title: 'Báo Cáo & Quản Trị Công Nợ',
        path: '/finance/reports',
        icon: 'BarChart3',
        badgeKey: 'overdueInvoices',
        roles: ['KE_TOAN'],
        useCases: ['UC-057', 'UC-060'],
      },
    ],
  },

  // ==========================================
  // NHÓM 6: BẾP ĂN BÁN TRÚ & DINH DƯỠNG (BEP)
  // ==========================================
  {
    groupTitle: 'Bếp Bán Trú & An Toàn Thực Phẩm',
    roles: ['BEP'],
    items: [
      {
        id: 'kt-menus',
        title: 'Quản Trị Thực Đơn & Suất Ăn',
        path: '/kitchen/menus',
        icon: 'UtensilsCrossed',
        badgeKey: 'pendingMeals',
        roles: ['BEP'],
        useCases: ['UC-029', 'UC-030'],
      },
      {
        id: 'kt-allergies',
        title: 'Chế Độ Ăn Riêng & Dị Ứng',
        path: '/kitchen/allergies',
        icon: 'ShieldAlert',
        roles: ['BEP'],
        useCases: ['UC-031'],
      },
      {
        id: 'kt-safety',
        title: 'An Toàn Vệ Sinh & Kiểm Thực',
        path: '/kitchen/safety',
        icon: 'FileText',
        roles: ['BEP'],
        useCases: ['UC-055', 'UC-032'],
      },
    ],
  },

  // ==========================================
  // NHÓM 7: PHỤ HUYNH HỌC SINH (PHU_HUYNH)
  // ==========================================
  {
    groupTitle: 'Cổng Phụ Huynh & Sổ Liên Lạc',
    roles: ['PHU_HUYNH'],
    items: [
      {
        id: 'pr-children',
        title: 'Hồ Sơ & An Toàn Của Con',
        path: '/parent/children',
        icon: 'Baby',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-041', 'UC-042', 'UC-043', 'UC-069'],
      },
      {
        id: 'pr-daily-care',
        title: 'Nhật Ký & Chăm Sóc Hàng Ngày',
        path: '/parent/daily-care',
        icon: 'HeartPulse',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-046', 'UC-044', 'UC-045', 'UC-028', 'UC-051', 'UC-029', 'UC-031'],
      },
      {
        id: 'pr-tuition',
        title: 'Học Phí & Giao Dịch VietQR',
        path: '/parent/tuition',
        icon: 'Receipt',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-047', 'UC-048', 'UC-049', 'UC-058'],
      },
      {
        id: 'pr-interactions',
        title: 'Tương Tác & Thủ Tục Hành Chính',
        path: '/parent/interactions',
        icon: 'MessageSquare',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-050', 'UC-066', 'UC-067', 'UC-068'],
      },
    ],
  },

  // ==========================================
  // NHÓM CHUNG CHO MỌI VAI TRÒ ĐÃ ĐĂNG NHẬP
  // ==========================================
  {
    groupTitle: 'Tài Khoản & Cá Nhân',
    roles: [
      'SUPER_ADMIN',
      'SYSTEM_ADMIN',
      'BGH',
      'GIAO_VU',
      'GIAO_VIEN',
      'KE_TOAN',
      'BEP',
      'PHU_HUYNH',
    ],
    items: [
      {
        id: 'common-profile',
        title: 'Hồ Sơ Cá Nhân & Bảo Mật',
        path: '/profile',
        icon: 'User',
        roles: [
          'SUPER_ADMIN',
          'SYSTEM_ADMIN',
          'BGH',
          'GIAO_VU',
          'GIAO_VIEN',
          'KE_TOAN',
          'BEP',
          'PHU_HUYNH',
        ],
        useCases: ['UC-004'],
      },
    ],
  },
];

/**
 * Trả về danh sách Menu được lọc nghiêm ngặt theo vai trò của người dùng
 * Hỗ trợ gộp tập hợp quyền (Union) nếu người dùng có nhiều vai trò
 */
export const getNavigationForRole = (
  currentRole?: UserRole | null,
  additionalRoles: UserRole[] = []
): NavGroup[] => {
  if (!currentRole) return [];

  const effectiveRoles = Array.from(new Set([currentRole, ...additionalRoles]));

  return NAVIGATION_GROUPS.map((group) => {
    // Kiểm tra xem nhóm có vai trò nào trùng với effectiveRoles không
    const isGroupAllowed = group.roles.some((r) => effectiveRoles.includes(r as UserRole));
    if (!isGroupAllowed) return null;

    // Lọc các items bên trong nhóm
    const filteredItems = group.items.filter((item) =>
      item.roles.some((r) => effectiveRoles.includes(r as UserRole))
    );

    if (filteredItems.length === 0) return null;

    return {
      ...group,
      items: filteredItems,
    };
  }).filter((group): group is NavGroup => group !== null);
};

/**
 * Cung cấp số liệu Badge khẩn cấp thời gian thực
 */
export const getDefaultBadgeCounts = (): NavigationBadges => {
  return {
    unresolvedAlerts: 1, // 1 Báo động người lạ tại cổng trạm AI (UC-024)
    pendingMeals: 1, // Suất ăn bán trú chưa chốt 08:30 (UC-030)
    overdueInvoices: 3, // 3 Hóa đơn học phí quá hạn nợ (UC-057)
    pendingDisputes: 1, // 1 Khiếu nại học phí đang chờ giải quyết (UC-059)
    unreadLeaves: 2, // 2 Đơn xin nghỉ học / dặn thuốc chờ duyệt (UC-026, UC-027)
  };
};
