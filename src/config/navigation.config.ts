import { UserRole } from '../types/auth.types';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string; // Tên icon Lucide
  badgeKey?: 'unresolvedAlerts' | 'pendingMeals' | 'overdueInvoices' | 'pendingDisputes' | 'unreadLeaves';
  roles: UserRole[];
  useCases: string[]; 
  children?: NavItem[];
}

export interface NavGroup {
  groupTitle: string;
  roles: UserRole[];
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
 * MA TRẬN PHÂN CHIA MENU THEO TỪNG VAI TRÒ (RBAC) CHUẨN XÁC 100%
 * Quy chuẩn phân định rành mạch toàn bộ 69 Use Cases của Hệ sinh thái Mầm non KIDPRO
 */
export const NAVIGATION_GROUPS: NavGroup[] = [
  // ==========================================
  // NHÓM 2: QUẢN TRỊ VIÊN NỀN TẢNG (SYSTEM_ADMIN)
  // Các Use Cases: , , , 
  // ==========================================
  {
    groupTitle: 'Hạ Tầng & Nền Tảng Đa Trường',
    roles: ['SYSTEM_ADMIN'],
    items: [
      {
        id: 'admin-schools',
        title: 'Quản Trị Trường Học (Tenants)',
        path: '/admin/schools',
        icon: 'Building2',
        roles: ['SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'admin-rbac',
        title: 'Quản Trị Tài Khoản & Phân Quyền (Super Admin)',
        path: '/admin/users-rbac',
        icon: 'ShieldCheck',
        roles: ['SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'admin-integrations',
        title: 'Tích Hợp Dịch Vụ Ngoại Vi',
        path: '/admin/integrations',
        icon: 'Cable',
        roles: ['SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'admin-health',
        title: 'Giám Sát Sức Khỏe & Uptime',
        path: '/admin/system-health',
        icon: 'Activity',
        roles: ['SYSTEM_ADMIN'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 3: BAN GIÁM HIỆU & ĐIỀU HÀNH (BGH)
  // Quy hoạch tinh gọn theo Domain Hubs (Option 2: Multi-Tab Consolidated Hubs)
  // Tinh gọn từ 18 mục xuống 8 danh mục trọng tâm
  // ==========================================
  {
    groupTitle: 'Ban Giám Hiệu & Điều Hành',
    roles: ['BGH'],
    items: [
      {
        id: 'bgh-school-setup',
        title: 'Thiết Lập Trường & CSVC',
        path: '/bgh/school-setup',
        icon: 'Building2',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'bgh-academic-approvals',
        title: 'Duyệt Học Vụ & Giảng Dạy',
        path: '/bgh/academic-approvals',
        icon: 'BookOpenCheck',
        roles: ['BGH'],
        useCases: [],
      },
      {
        id: 'bgh-childcare',
        title: 'Bán Trú & Phát Triển Trẻ',
        path: '/bgh/childcare-hub',
        icon: 'HeartHandshake',
        roles: ['BGH'],
        useCases: [],
      },
      {
        id: 'bgh-finance',
        title: 'Tài Chính & Học Phí',
        path: '/bgh/finance-hub',
        icon: 'Calculator',
        roles: ['BGH'],
        useCases: [],
      },
      {
        id: 'bgh-staff',
        title: 'Quản Lý Nhân Sự Toàn Trường',
        path: '/bgh/staff',
        icon: 'Users',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'bgh-bus-management',
        title: 'Quản Lý Xe Buýt & Đưa Đón',
        path: '/bgh/bus-management',
        icon: 'Bus',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'bgh-communications',
        title: 'Truyền Thông & Cảnh Báo',
        path: '/bgh/communications',
        icon: 'Megaphone',
        roles: ['BGH'],
        useCases: [],
      },
      {
        id: 'bgh-security-audit',
        title: 'Nhật Ký Thao Tác Quản Trị',
        path: '/bgh/security-audit',
        icon: 'ScrollText',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 4: CÁN BỘ GIÁO VỤ (GIAO_VU)
  // Các Use Cases: , , , , , 
  // ==========================================
  {
    groupTitle: 'Học Vụ & Hồ Sơ Lớp Học',
    roles: ['GIAO_VU'],
    items: [
      {
        id: 'gv-classes-list',
        title: 'Quản Lý Lớp Học',
        path: '/academic/classes?subtab=classes',
        icon: 'School',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-classes-proposals',
        title: 'Kế Hoạch Mở Lớp',
        path: '/academic/classes?subtab=proposals',
        icon: 'FileCheck2',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-classes-assignments',
        title: 'Phân Công Giáo Viên',
        path: '/academic/classes?subtab=assignments',
        icon: 'UserCheck',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-classes-placement',
        title: 'Xếp Trẻ Vào Lớp',
        path: '/academic/classes?subtab=placement',
        icon: 'Users',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-transfers',
        title: 'Phê Duyệt Chuyển Lớp',
        path: '/academic/transfers',
        icon: 'ArrowRightLeft',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-timetables',
        title: 'Thời Khóa Biểu Tuần',
        path: '/academic/timetables',
        icon: 'CalendarClock',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-promotion',
        title: 'Kết Chuyển Đầu Năm',
        path: '/academic/classes?subtab=promotion',
        icon: 'Sparkles',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-archive',
        title: 'Lưu Trữ Hồ Sơ Lớp',
        path: '/academic/classes?subtab=archive',
        icon: 'Archive',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-students',
        title: 'Hồ Sơ Học Sinh',
        path: '/academic/students',
        icon: 'Baby',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-withdrawals',
        title: 'Rút Hồ Sơ & Chuyển Trường',
        path: '/academic/withdrawals',
        icon: 'School',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-parent-provision',
        title: 'Cấp TK & Liên Kết Phụ Huynh',
        path: '/academic/parent-accounts',
        icon: 'Smartphone',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-health-reports',
        title: 'Báo Cáo Sức Khỏe Lớp & Trường',
        path: '/academic/health-reports',
        icon: 'HeartPulse',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-club-assignments',
        title: 'Phân Công Giáo Viên CLB',
        path: '/academic/club-assignments',
        icon: 'Award',
        roles: ['GIAO_VU'],
        useCases: [],
      },
      {
        id: 'gv-equipment',
        title: 'Danh Mục Thiết Bị & Đồ Chơi',
        path: '/academic/equipment',
        icon: 'Boxes',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-announcements',
        title: 'Soạn Thảo & Đăng Thông Báo',
        path: '/academic/announcements',
        icon: 'Megaphone',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-surveys',
        title: 'Khảo Sát Ý Kiến Phụ Huynh',
        path: '/academic/surveys',
        icon: 'ClipboardList',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-medical-bulletins',
        title: 'Bản Tin Y Tế & Dịch Bệnh',
        path: '/academic/medical-bulletins',
        icon: 'ShieldAlert',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-bus-registrations',
        title: 'Duyệt Đăng Ký Xe Buýt',
        path: '/academic/bus-registrations',
        icon: 'Bus',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
      {
        id: 'gv-meal-registrations',
        title: 'Duyệt Đăng Ký Ăn Sáng',
        path: '/academic/meal-registrations',
        icon: 'Utensils',
        roles: ['GIAO_VU', 'BGH'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 5: GIÁO VIÊN CHỦ NHIỆM (GIAO_VIEN)
  // Các Use Cases: , , , , , , , , , , , 
  // ==========================================
  {
    groupTitle: 'Điểm Danh & Đón Trả Trẻ',
    roles: ['GIAO_VIEN'],
    items: [
      {
        id: 'tch-gate-ai',
        title: 'Điểm Danh AI Trạm Cổng',
        path: '/teacher/attendance?tab=gate-ai',
        icon: 'Camera',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-manual-att',
        title: 'Điểm Danh Thủ Công Tablet',
        path: '/teacher/attendance?tab=manual-tablet',
        icon: 'ClipboardCheck',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-pickup',
        title: 'Xác Thực Người Đón Tan Trường AI',
        path: '/teacher/dismissal?tab=dismissal-pickup',
        icon: 'DoorOpen',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-bus',
        title: 'Điểm Danh Xe Buýt & Chốt Khoang',
        path: '/teacher/attendance?tab=bus-attendance',
        icon: 'Bus',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-stranger',
        title: 'Cảnh Báo Người Lạ Tại Cổng',
        path: '/teacher/dismissal?tab=stranger-security',
        icon: 'ShieldAlert',
        badgeKey: 'unresolvedAlerts',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-late-pickup',
        title: 'Mốc Giờ Trẻ Đón Muộn',
        path: '/teacher/dismissal?tab=late-pickup',
        icon: 'Clock',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-leaves',
        title: 'Duyệt Đơn Xin Nghỉ Học',
        path: '/teacher/dismissal?tab=leave-requests',
        icon: 'FileText',
        badgeKey: 'unreadLeaves',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
    ],
  },
  {
    groupTitle: 'Y Tế, Nhật Ký & Chuyên Môn Lớp',
    roles: ['GIAO_VIEN'],
    items: [
      {
        id: 'tch-meds',
        title: 'Cho Uống Thuốc & Chụp Ảnh',
        path: '/teacher/health?tab=medications',
        icon: 'Pill',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-journal',
        title: 'Nhật Ký & Ảnh Hoạt Động Lớp',
        path: '/teacher/health?tab=journals',
        icon: 'BookOpen',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-bmi',
        title: 'Ghi Nhận Chiều Cao, Cân Nặng',
        path: '/teacher/health?tab=metrics',
        icon: 'HeartPulse',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-medical-incidents',
        title: 'Sự Vụ Y Tế Học Đường',
        path: '/teacher/health?tab=incidents',
        icon: 'ShieldAlert',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-care',
        title: 'Sổ Theo Dõi Ăn & Ngủ Trưa',
        path: '/teacher/health?tab=care',
        icon: 'Moon',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-lesson-plans',
        title: 'Soạn & Gửi Phê Duyệt Giáo Án',
        path: '/teacher/activities?tab=lesson_plans',
        icon: 'FileText',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-evaluations',
        title: 'Đánh Giá 5 Trục Phát Triển',
        path: '/teacher/activities?tab=evaluations',
        icon: 'Award',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-chat',
        title: 'Chat Nhóm Lớp & Phụ Huynh',
        path: '/teacher/attendance?tab=teacher-chat',
        icon: 'MessageSquare',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
      {
        id: 'tch-equipment',
        title: 'Báo Hư Hỏng Thiết Bị Phòng Học',
        path: '/teacher/attendance?tab=equipment-incidents',
        icon: 'ShieldAlert',
        roles: ['GIAO_VIEN'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 6: NHÂN VIÊN BẾP BÁN TRÚ (BEP)
  // Các Use Cases: , , , , 
  // ==========================================
  {
    groupTitle: 'Bếp Bán Trú & Vệ Sinh ATTP',
    roles: ['BEP'],
    items: [
      {
        id: 'kt-menus',
        title: 'Thực Đơn Bán Trú Tuần',
        path: '/kitchen?tab=menu',
        icon: 'UtensilsCrossed',
        roles: ['BEP'],
        useCases: [],
      },
      {
        id: 'kt-portions',
        title: 'Dashboard Khóa Số Suất Ăn 08:30',
        path: '/kitchen?tab=portions',
        icon: 'Clock',
        badgeKey: 'pendingMeals',
        roles: ['BEP'],
        useCases: [],
      },
      {
        id: 'kt-allergies',
        title: 'Dị Ứng Thực Phẩm & Suất Riêng',
        path: '/kitchen?tab=allergies',
        icon: 'ShieldAlert',
        roles: ['BEP'],
        useCases: [],
      },
      {
        id: 'kt-retention',
        title: 'Tiêu Hao Thực Phẩm & Lưu Mẫu',
        path: '/kitchen?tab=retention',
        icon: 'FileText',
        roles: ['BEP'],
        useCases: [],
      },
      {
        id: 'kt-inspection',
        title: 'Sổ Kiểm Thực 3 Bước & Mẫu Thức Ăn',
        path: '/kitchen?tab=three-step-inspection',
        icon: 'CheckCircle2',
        roles: ['BEP'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 7: KẾ TOÁN TRƯỜNG HỌC (KE_TOAN / ACCOUNTANT)
  // Các Use Cases chuẩn theo KeToan.md: , , , , , , , , 
  // ==========================================
  {
    groupTitle: 'Biểu Phí & Quyết Toán Học Phí',
    roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
    items: [
      {
        id: 'fin-catalog',
        title: 'Danh Mục Khoản Thu',
        path: '/finance?tab=fee-catalog',
        icon: 'Calculator',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'fin-discounts',
        title: 'Chính Sách Miễn Giảm',
        path: '/finance?tab=discounts',
        icon: 'Percent',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'fin-tuition-calc',
        title: 'Bảng Tính Học Phí & Phụ Phí',
        path: '/finance?tab=tuition-calc',
        icon: 'Cpu',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'fin-tuition-summary',
        title: 'Tổng Hợp Học Phí Toàn Trường',
        path: '/finance?tab=tuition-summary',
        icon: 'FileCheck2',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
    ],
  },
  {
    groupTitle: 'Thu Ngân, VietQR & Báo Cáo',
    roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
    items: [
      {
        id: 'fin-invoice-issuance',
        title: 'Phát Hành Học Phí & VietQR',
        path: '/finance?tab=invoice-issuance',
        icon: 'QrCode',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'fin-cash-receipts',
        title: 'Thu Tiền Mặt & In Biên Lai',
        path: '/finance?tab=cash-receipts',
        icon: 'Banknote',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
      {
        id: 'fin-revenue-report',
        title: 'Báo Cáo Doanh Thu & Công Nợ',
        path: '/finance?tab=revenue-report',
        icon: 'BarChart3',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 8: PHỤ HUYNH HỌC SINH (PHU_HUYNH)
  // Các Use Cases: , , , , , , , , , , , , , 
  // ==========================================
  {
    groupTitle: 'Cổng Phụ Huynh & Sổ Liên Lạc',
    roles: ['PHU_HUYNH'],
    items: [
      {
        id: 'pr-service-registers',
        title: 'Đăng Ký Dịch Vụ Học Đường',
        path: '/parent?tab=service-registers',
        icon: 'Bus',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-health-profile',
        title: 'Sức Khỏe, BMI & Cảnh Báo Dị Ứng',
        path: '/parent?tab=health-profile',
        icon: 'HeartPulse',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-pickup-faces',
        title: 'Đăng Ký Mặt Người Đón (AI)',
        path: '/parent?tab=pickup-faces',
        icon: 'UserCheck',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-face',
        title: 'Đăng Ký Khuôn Mặt Của Bé',
        path: '/parent?tab=face-biometric',
        icon: 'Camera',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-guardians',
        title: 'Danh Sách Người Thân Đón Bé',
        path: '/parent?tab=guardians',
        icon: 'ShieldCheck',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-emergency-pickup',
        title: 'Ủy Quyền Đón Hộ Đột Xuất',
        path: '/parent?tab=emergency-pickup',
        icon: 'DoorOpen',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-leave',
        title: 'Nộp Đơn Xin Nghỉ Học Trực Tuyến',
        path: '/parent?tab=leave',
        icon: 'FileText',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-meds',
        title: 'Gửi Đơn Dặn Thuốc Điện Tử',
        path: '/parent?tab=medication',
        icon: 'Pill',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-gate-timeline',
        title: 'Thông Báo Đón Trả Kèm Ảnh',
        path: '/parent?tab=gate-notifications',
        icon: 'Bell',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-chat',
        title: 'Chat Nhóm Lớp & Cô Chủ Nhiệm',
        path: '/parent?tab=chat',
        icon: 'MessageSquare',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-invoice',
        title: 'Bảng Kê & Nộp Học Phí VietQR',
        path: '/parent?tab=invoice',
        icon: 'Receipt',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-petition',
        title: 'Nộp Đơn Yêu Cầu Sự Vụ Học Sinh',
        path: '/parent?tab=petitions',
        icon: 'FileQuestion',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-survey',
        title: 'Khảo Sát Ý Kiến & Đánh Giá Dịch Vụ',
        path: '/parent?tab=survey',
        icon: 'Star',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
      {
        id: 'pr-privacy',
        title: 'Xóa Dữ Liệu Sinh Trắc Học (NĐ 13)',
        path: '/parent?tab=privacy-decree13',
        icon: 'Lock',
        roles: ['PHU_HUYNH'],
        useCases: [],
      },
    ],
  },

  // ==========================================
  // NHÓM 1: DÙNG CHUNG CHO MỌI VAI TRÒ ĐÃ ĐĂNG NHẬP
  // Use Case: 
  // ==========================================
  {
    groupTitle: 'Tài Khoản & Cá Nhân',
    roles: [
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
        title: 'Hồ Sơ Cá Nhân & Đổi Mật Khẩu',
        path: '/profile',
        icon: 'User',
        roles: [
          'SYSTEM_ADMIN',
          'BGH',
          'GIAO_VU',
          'GIAO_VIEN',
          'KE_TOAN',
          'BEP',
          'PHU_HUYNH',
        ],
        useCases: [],
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
    unresolvedAlerts: 1, // 1 Báo động người lạ tại cổng trạm AI
    pendingMeals: 1, // Suất ăn bán trú chưa chốt 08:30
    overdueInvoices: 3, // 3 Hóa đơn học phí quá hạn nợ
    pendingDisputes: 1, // 1 Khiếu nại học phí đang chờ giải quyết
    unreadLeaves: 2, // 2 Đơn xin nghỉ học / dặn thuốc chờ duyệt (, )
  };
};
