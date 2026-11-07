import { UserRole } from '../types/auth.types';

export interface NavItem {
  id: string;
  title: string;
  path: string;
  icon: string; // Tên icon Lucide
  badgeKey?: 'unresolvedAlerts' | 'pendingMeals' | 'overdueInvoices' | 'pendingDisputes' | 'unreadLeaves';
  roles: UserRole[];
  useCases: string[]; // Danh sách mã UC (ví dụ: ['UC-010'])
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
  // Các Use Cases: UC-005, UC-006, UC-007, UC-008
  // ==========================================
  {
    groupTitle: 'Hạ Tầng & Nền Tảng Đa Trường',
    roles: ['SYSTEM_ADMIN'],
    items: [
      {
        id: 'admin-schools',
        title: '[UC-005] Quản Trị Trường Học (Tenants)',
        path: '/admin/schools',
        icon: 'Building2',
        roles: ['SYSTEM_ADMIN'],
        useCases: ['UC-005'],
      },
      {
        id: 'admin-rbac',
        title: '[UC-006] Quản Trị Tài Khoản & Phân Quyền (Super Admin)',
        path: '/admin/users-rbac',
        icon: 'ShieldCheck',
        roles: ['SYSTEM_ADMIN'],
        useCases: ['UC-006'],
      },
      {
        id: 'admin-integrations',
        title: '[UC-007] Tích Hợp Dịch Vụ Ngoại Vi',
        path: '/admin/integrations',
        icon: 'Cable',
        roles: ['SYSTEM_ADMIN'],
        useCases: ['UC-007'],
      },
      {
        id: 'admin-health',
        title: '[UC-008] Giám Sát Sức Khỏe & Uptime',
        path: '/admin/system-health',
        icon: 'Activity',
        roles: ['SYSTEM_ADMIN'],
        useCases: ['UC-008'],
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
        id: 'bgh-dashboard',
        title: '[UC-012] Dashboard Điều Hành Toàn Trường',
        path: '/dashboard/executive',
        icon: 'LayoutDashboard',
        badgeKey: 'unresolvedAlerts',
        roles: ['BGH'],
        useCases: ['UC-012'],
      },
      {
        id: 'bgh-school-setup',
        title: '[UC-005-007] Thiết Lập Trường & CSVC',
        path: '/bgh/school-setup',
        icon: 'Building2',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-005', 'UC-006', 'UC-007'],
      },
      {
        id: 'bgh-academic-approvals',
        title: '[UC-013-077] Duyệt Học Vụ & Giảng Dạy',
        path: '/bgh/academic-approvals',
        icon: 'BookOpenCheck',
        roles: ['BGH'],
        useCases: ['UC-013', 'UC-015', 'UC-020', 'UC-077', 'UC-067'],
      },
      {
        id: 'bgh-childcare',
        title: '[UC-041-078] Bán Trú & Phát Triển Trẻ',
        path: '/bgh/childcare-hub',
        icon: 'HeartHandshake',
        roles: ['BGH'],
        useCases: ['UC-041', 'UC-072', 'UC-078'],
      },
      {
        id: 'bgh-finance',
        title: '[UC-011-066] Tài Chính & Học Phí',
        path: '/bgh/finance-hub',
        icon: 'Calculator',
        roles: ['BGH'],
        useCases: ['UC-011', 'UC-060', 'UC-066'],
      },
      {
        id: 'bgh-staff',
        title: '[UC-008-009] Quản Lý Nhân Sự Toàn Trường',
        path: '/bgh/staff',
        icon: 'Users',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-008', 'UC-009'],
      },
      {
        id: 'bgh-bus-management',
        title: '[G5-UC-08] Quản Lý Xe Buýt & Đưa Đón',
        path: '/bgh/bus-management',
        icon: 'Bus',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['G5-UC-08', 'UC-041'],
      },
      {
        id: 'bgh-user-accounts',
        title: '[UC-006] Cấp Tài Khoản Người Dùng',
        path: '/admin/users-rbac',
        icon: 'ShieldCheck',
        roles: ['BGH'],
        useCases: ['UC-006'],
      },
      {
        id: 'bgh-communications',
        title: '[UC-079-081] Truyền Thông & Cảnh Báo',
        path: '/bgh/communications',
        icon: 'Megaphone',
        roles: ['BGH'],
        useCases: ['UC-079', 'UC-081'],
      },
      {
        id: 'bgh-security-audit',
        title: '[UC-010] Nhật Ký Thao Tác Quản Trị',
        path: '/bgh/security-audit',
        icon: 'ScrollText',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-010'],
      },
    ],
  },

  // ==========================================
  // NHÓM 4: CÁN BỘ GIÁO VỤ (GIAO_VU)
  // Các Use Cases: G3-UC-01, G3-UC-02, G3-UC-04, G3-UC-06, G3-UC-08, G3-UC-09
  // ==========================================
  {
    groupTitle: 'Học Vụ & Hồ Sơ Lớp Học',
    roles: ['GIAO_VU'],
    items: [
      {
        id: 'gv-classes-list',
        title: '[G3-UC-01] Quản Lý Lớp Học',
        path: '/academic/classes?subtab=classes',
        icon: 'School',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-01'],
      },
      {
        id: 'gv-classes-proposals',
        title: '[G3-UC-02] Kế Hoạch Mở Lớp',
        path: '/academic/classes?subtab=proposals',
        icon: 'FileCheck2',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-02'],
      },
      {
        id: 'gv-classes-assignments',
        title: '[G3-UC-04] Phân Công Giáo Viên',
        path: '/academic/classes?subtab=assignments',
        icon: 'UserCheck',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-04'],
      },
      {
        id: 'gv-classes-placement',
        title: '[G3-UC-06] Xếp Trẻ Vào Lớp',
        path: '/academic/classes?subtab=placement',
        icon: 'Users',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-06'],
      },
      {
        id: 'gv-transfers',
        title: '[G3-UC-08] Phê Duyệt Chuyển Lớp',
        path: '/academic/transfers',
        icon: 'ArrowRightLeft',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-08'],
      },
      {
        id: 'gv-timetables',
        title: '[G3-UC-09] Thời Khóa Biểu Tuần',
        path: '/academic/timetables',
        icon: 'CalendarClock',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-09'],
      },
      {
        id: 'gv-promotion',
        title: '[G3-UC-11] Kết Chuyển Đầu Năm',
        path: '/academic/classes?subtab=promotion',
        icon: 'Sparkles',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-11'],
      },
      {
        id: 'gv-archive',
        title: '[G3-UC-12] Lưu Trữ Hồ Sơ Lớp',
        path: '/academic/classes?subtab=archive',
        icon: 'Archive',
        roles: ['GIAO_VU'],
        useCases: ['G3-UC-12'],
      },
      {
        id: 'gv-students',
        title: '[G4-UC-01] Hồ Sơ Học Sinh',
        path: '/academic/students',
        icon: 'Baby',
        roles: ['GIAO_VU'],
        useCases: ['G4-UC-01'],
      },
      {
        id: 'gv-withdrawals',
        title: '[G4-UC-04] Rút Hồ Sơ & Chuyển Trường',
        path: '/academic/withdrawals',
        icon: 'School',
        roles: ['GIAO_VU'],
        useCases: ['G4-UC-04'],
      },
      {
        id: 'gv-parent-provision',
        title: '[G4-UC-08] Cấp TK Phụ Huynh',
        path: '/academic/parent-accounts',
        icon: 'Smartphone',
        roles: ['GIAO_VU'],
        useCases: ['G4-UC-08'],
      },
      {
        id: 'gv-parent-multichild',
        title: '[G4-UC-09] Liên Kết Đa Con',
        path: '/academic/parent-accounts?mode=multichild',
        icon: 'Link',
        roles: ['GIAO_VU'],
        useCases: ['G4-UC-09'],
      },
      {
        id: 'gv-health-reports',
        title: '[G7-UC-04] Báo Cáo Sức Khỏe Lớp & Trường',
        path: '/academic/health-reports',
        icon: 'HeartPulse',
        roles: ['GIAO_VU', 'BGH'],
        useCases: ['G7-UC-04'],
      },
      {
        id: 'gv-club-assignments',
        title: '[G9-UC-02] Phân Công Giáo Viên CLB',
        path: '/academic/club-assignments',
        icon: 'Award',
        roles: ['GIAO_VU'],
        useCases: ['G9-UC-02'],
      },
      {
        id: 'gv-equipment',
        title: '[G9-UC-06] Danh Mục Thiết Bị & Đồ Chơi',
        path: '/academic/equipment',
        icon: 'Boxes',
        roles: ['GIAO_VU', 'BGH'],
        useCases: ['G9-UC-06'],
      },
      {
        id: 'gv-announcements',
        title: '[G11-UC-01] Soạn Thảo & Đăng Thông Báo',
        path: '/academic/announcements',
        icon: 'Megaphone',
        roles: ['GIAO_VU', 'BGH'],
        useCases: ['G11-UC-01'],
      },
      {
        id: 'gv-surveys',
        title: '[G11-UC-06] Khảo Sát Ý Kiến Phụ Huynh',
        path: '/academic/surveys',
        icon: 'ClipboardList',
        roles: ['GIAO_VU', 'BGH'],
        useCases: ['G11-UC-06'],
      },
      {
        id: 'gv-medical-bulletins',
        title: '[G11-UC-08] Bản Tin Y Tế & Dịch Bệnh',
        path: '/academic/medical-bulletins',
        icon: 'ShieldAlert',
        roles: ['GIAO_VU', 'BGH'],
        useCases: ['G11-UC-08'],
      },
    ],
  },

  // ==========================================
  // NHÓM 5: GIÁO VIÊN CHỦ NHIỆM (GIAO_VIEN)
  // Các Use Cases: UC-021, UC-022, UC-023, UC-024, UC-025, UC-026, UC-027, UC-028, UC-051, UC-052, UC-054, UC-061
  // ==========================================
  {
    groupTitle: 'Điểm Danh & Đón Trả Trẻ',
    roles: ['GIAO_VIEN'],
    items: [
      {
        id: 'tch-gate-ai',
        title: '[UC-021] Điểm Danh AI Trạm Cổng',
        path: '/teacher/attendance?tab=gate-ai',
        icon: 'Camera',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-021'],
      },
      {
        id: 'tch-manual-att',
        title: '[UC-022] Điểm Danh Thủ Công Tablet',
        path: '/teacher/attendance?tab=manual-tablet',
        icon: 'ClipboardCheck',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-022'],
      },
      {
        id: 'tch-pickup',
        title: '[UC-023] Xác Thực Người Đón Tan Trường AI',
        path: '/teacher/dismissal?tab=dismissal-pickup',
        icon: 'DoorOpen',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-023'],
      },
      {
        id: 'tch-stranger',
        title: '[UC-024] Cảnh Báo Người Lạ Tại Cổng',
        path: '/teacher/dismissal?tab=stranger-security',
        icon: 'ShieldAlert',
        badgeKey: 'unresolvedAlerts',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-024'],
      },
      {
        id: 'tch-late-pickup',
        title: '[UC-025] Mốc Giờ Trẻ Đón Muộn',
        path: '/teacher/dismissal?tab=late-pickup',
        icon: 'Clock',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-025'],
      },
      {
        id: 'tch-leaves',
        title: '[UC-026] Duyệt Đơn Xin Nghỉ Học',
        path: '/teacher/dismissal?tab=leave-requests',
        icon: 'FileText',
        badgeKey: 'unreadLeaves',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-026'],
      },
    ],
  },
  {
    groupTitle: 'Y Tế, Nhật Ký & Chuyên Môn Lớp',
    roles: ['GIAO_VIEN'],
    items: [
      {
        id: 'tch-meds',
        title: '[UC-027] Cho Uống Thuốc & Chụp Ảnh',
        path: '/teacher/health?tab=medications',
        icon: 'Pill',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-027'],
      },
      {
        id: 'tch-journal',
        title: '[UC-028] Nhật Ký & Ảnh Hoạt Động Lớp',
        path: '/teacher/health?tab=journals',
        icon: 'BookOpen',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-028'],
      },
      {
        id: 'tch-bmi',
        title: '[UC-051] Ghi Nhận Chiều Cao, Cân Nặng',
        path: '/teacher/health?tab=metrics',
        icon: 'HeartPulse',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-051'],
      },
      {
        id: 'tch-medical-incidents',
        title: '[UC-052] Sự Vụ Y Tế Học Đường',
        path: '/teacher/health?tab=incidents',
        icon: 'ShieldAlert',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-052'],
      },
      {
        id: 'tch-care',
        title: 'Sổ Theo Dõi Ăn & Ngủ Trưa',
        path: '/teacher/health?tab=care',
        icon: 'Moon',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-028'],
      },
      {
        id: 'tch-lesson-plans',
        title: '[UC-054] Soạn & Gửi Phê Duyệt Giáo Án',
        path: '/teacher/activities?tab=lesson_plans',
        icon: 'FileText',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-054'],
      },
      {
        id: 'tch-evaluations',
        title: '[UC-061] Đánh Giá 5 Trục Phát Triển',
        path: '/teacher/activities?tab=evaluations',
        icon: 'Award',
        roles: ['GIAO_VIEN'],
        useCases: ['UC-061'],
      },
    ],
  },

  // ==========================================
  // NHÓM 6: NHÂN VIÊN BẾP BÁN TRÚ (BEP)
  // Các Use Cases: UC-029, UC-030, UC-031, UC-032, UC-055
  // ==========================================
  {
    groupTitle: 'Bếp Bán Trú & Vệ Sinh ATTP',
    roles: ['BEP'],
    items: [
      {
        id: 'kt-menus',
        title: '[UC-029] Thực Đơn Bán Trú Tuần',
        path: '/kitchen?tab=menu',
        icon: 'UtensilsCrossed',
        roles: ['BEP'],
        useCases: ['UC-029'],
      },
      {
        id: 'kt-portions',
        title: '[UC-030] Dashboard Khóa Số Suất Ăn 08:30',
        path: '/kitchen?tab=portions',
        icon: 'Clock',
        badgeKey: 'pendingMeals',
        roles: ['BEP'],
        useCases: ['UC-030'],
      },
      {
        id: 'kt-allergies',
        title: '[UC-031] Dị Ứng Thực Phẩm & Suất Riêng',
        path: '/kitchen?tab=allergies',
        icon: 'ShieldAlert',
        roles: ['BEP'],
        useCases: ['UC-031'],
      },
      {
        id: 'kt-retention',
        title: '[UC-032] Tiêu Hao Thực Phẩm & Lưu Mẫu',
        path: '/kitchen?tab=retention',
        icon: 'FileText',
        roles: ['BEP'],
        useCases: ['UC-032'],
      },
      {
        id: 'kt-inspection',
        title: '[UC-055] Sổ Kiểm Thực 3 Bước & Mẫu Thức Ăn',
        path: '/kitchen?tab=three-step-inspection',
        icon: 'CheckCircle2',
        roles: ['BEP'],
        useCases: ['UC-055'],
      },
    ],
  },

  // ==========================================
  // NHÓM 7: KẾ TOÁN TRƯỜNG HỌC (KE_TOAN / ACCOUNTANT)
  // Các Use Cases chuẩn theo KeToan.md: G8-UC-01, G8-UC-03, G8-UC-04, G8-UC-05, G8-UC-06, G8-UC-07, G8-UC-10, G8-UC-11, G8-UC-12
  // ==========================================
  {
    groupTitle: 'Biểu Phí & Quyết Toán Học Phí',
    roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
    items: [
      {
        id: 'fin-catalog',
        title: '[G8-UC-01] Danh Mục Khoản Thu',
        path: '/finance?tab=fee-catalog',
        icon: 'Calculator',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-01'],
      },
      {
        id: 'fin-discounts',
        title: '[G8-UC-03] Chính Sách Miễn Giảm',
        path: '/finance?tab=discounts',
        icon: 'Percent',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-03'],
      },
      {
        id: 'fin-tuition-calc',
        title: '[G8-UC-04/05] Bảng Tính Học Phí & Phụ Phí',
        path: '/finance?tab=tuition-calc',
        icon: 'Cpu',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-04', 'G8-UC-05'],
      },
      {
        id: 'fin-tuition-summary',
        title: '[G8-UC-06] Tổng Hợp Học Phí Toàn Trường',
        path: '/finance?tab=tuition-summary',
        icon: 'FileCheck2',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-06'],
      },
    ],
  },
  {
    groupTitle: 'Thu Ngân, VietQR & Báo Cáo',
    roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
    items: [
      {
        id: 'fin-invoice-issuance',
        title: '[G8-UC-07] Phát Hành Học Phí & VietQR',
        path: '/finance?tab=invoice-issuance',
        icon: 'QrCode',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-07'],
      },
      {
        id: 'fin-cash-receipts',
        title: '[G8-UC-10/11] Thu Tiền Mặt & In Biên Lai',
        path: '/finance?tab=cash-receipts',
        icon: 'Banknote',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-10', 'G8-UC-11'],
      },
      {
        id: 'fin-revenue-report',
        title: '[G8-UC-12] Báo Cáo Doanh Thu & Công Nợ',
        path: '/finance?tab=revenue-report',
        icon: 'BarChart3',
        roles: ['KE_TOAN', 'SYSTEM_ADMIN'],
        useCases: ['G8-UC-12'],
      },
    ],
  },

  // ==========================================
  // NHÓM 8: PHỤ HUYNH HỌC SINH (PHU_HUYNH)
  // Các Use Cases: UC-041, UC-042, UC-043, UC-044, UC-045, UC-046, UC-047, UC-048, UC-049, UC-050, UC-058, UC-066, UC-068, UC-069
  // ==========================================
  {
    groupTitle: 'Cổng Phụ Huynh & Sổ Liên Lạc',
    roles: ['PHU_HUYNH'],
    items: [
      {
        id: 'pr-face',
        title: '[UC-041] Đăng Ký Khuôn Mặt Của Bé',
        path: '/parent?tab=face-biometric',
        icon: 'UserCheck',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-041'],
      },
      {
        id: 'pr-guardians',
        title: '[UC-042] Danh Sách Người Thân Đón Bé',
        path: '/parent?tab=guardians',
        icon: 'ShieldCheck',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-042'],
      },
      {
        id: 'pr-emergency-pickup',
        title: '[UC-043] Ủy Quyền Đón Hộ Đột Xuất',
        path: '/parent?tab=emergency-pickup',
        icon: 'DoorOpen',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-043'],
      },
      {
        id: 'pr-leave',
        title: '[UC-044] Nộp Đơn Xin Nghỉ Học Trực Tuyến',
        path: '/parent?tab=leave',
        icon: 'FileText',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-044'],
      },
      {
        id: 'pr-meds',
        title: '[UC-045] Gửi Đơn Dặn Thuốc Điện Tử',
        path: '/parent?tab=medication',
        icon: 'Pill',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-045'],
      },
      {
        id: 'pr-gate-timeline',
        title: '[UC-046] Thông Báo Đón Trả Kèm Ảnh',
        path: '/parent?tab=gate-notifications',
        icon: 'Camera',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-046'],
      },
      {
        id: 'pr-invoice',
        title: '[UC-047/048/049] Bảng Kê & Nộp Học Phí VietQR',
        path: '/parent?tab=invoice',
        icon: 'Receipt',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-047', 'UC-048', 'UC-049', 'UC-058'],
      },
      {
        id: 'pr-petition',
        title: '[UC-050] Nộp Đơn Yêu Cầu Sự Vụ Học Sinh',
        path: '/parent?tab=petitions',
        icon: 'FileQuestion',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-050'],
      },
      {
        id: 'pr-chat',
        title: '[UC-066] Nhắn Tin Bảo Mật Cô - Phụ Huynh',
        path: '/parent?tab=interactions',
        icon: 'MessageSquare',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-066'],
      },
      {
        id: 'pr-survey',
        title: '[UC-068] Khảo Sát Ý Kiến & Đánh Giá Dịch Vụ',
        path: '/parent?tab=survey',
        icon: 'Star',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-068'],
      },
      {
        id: 'pr-privacy',
        title: '[UC-069] Xóa Dữ Liệu Sinh Trắc Học (NĐ 13)',
        path: '/parent?tab=privacy-decree13',
        icon: 'Lock',
        roles: ['PHU_HUYNH'],
        useCases: ['UC-069'],
      },
    ],
  },

  // ==========================================
  // NHÓM 1: DÙNG CHUNG CHO MỌI VAI TRÒ ĐÃ ĐĂNG NHẬP
  // Use Case: UC-004
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
        title: '[UC-004] Hồ Sơ Cá Nhân & Đổi Mật Khẩu',
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
