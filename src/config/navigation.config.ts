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
        title: '[UC-006] Phân Quyền Vai Trò RBAC',
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
  // NHÓM 3: HIỆU TRƯỞNG TRƯỜNG HỌC (BGH)
  // Các Use Cases: UC-012, UC-009, UC-010, UC-011, UC-013, UC-014, UC-067
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
        id: 'bgh-academic-year',
        title: '[UC-005] Kế Hoạch Năm Học & Học Kỳ',
        path: '/bgh/academic-planning',
        icon: 'CalendarDays',
        roles: ['BGH'],
        useCases: ['UC-005'],
      },
      {
        id: 'bgh-grade-quotas',
        title: '[UC-006] Khối Lớp & Định Mức Sĩ Số',
        path: '/bgh/grade-quotas',
        icon: 'Layers',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-006'],
      },
      {
        id: 'bgh-classrooms',
        title: '[UC-007] Danh Mục Phòng Học',
        path: '/bgh/classrooms',
        icon: 'Building2',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-007'],
      },
      {
        id: 'bgh-staff',
        title: '[UC-008] Quản Lý Hồ Sơ & Nhân Sự',
        path: '/bgh/staff',
        icon: 'Users',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-008', 'UC-009'],
      },
      {
        id: 'bgh-security-audit',
        title: '[UC-010] Nhật Ký Thao Tác Quản Trị',
        path: '/bgh/security-audit',
        icon: 'ScrollText',
        roles: ['BGH', 'SYSTEM_ADMIN'],
        useCases: ['UC-010'],
      },
      {
        id: 'bgh-class-approval',
        title: '[UC-013] Phê Duyệt Mở Lớp Học Mới',
        path: '/bgh/class-approvals',
        icon: 'School',
        roles: ['BGH'],
        useCases: ['UC-013'],
      },
      {
        id: 'bgh-teaching-assignments',
        title: '[UC-015] Duyệt Phân Công Giảng Dạy',
        path: '/bgh/teaching-assignments',
        icon: 'UserCheck',
        roles: ['BGH'],
        useCases: ['UC-015'],
      },
      {
        id: 'bgh-timetable-approvals',
        title: '[UC-020] Duyệt & Ban Hành TKB Tuần',
        path: '/bgh/timetable-approvals',
        icon: 'CalendarClock',
        roles: ['BGH'],
        useCases: ['UC-020'],
      },
      {
        id: 'bgh-menu-approvals',
        title: '[UC-041] Phê Duyệt Thực Đơn Tuần',
        path: '/bgh/menu-approvals',
        icon: 'UtensilsCrossed',
        roles: ['BGH'],
        useCases: ['UC-041'],
      },
      {
        id: 'bgh-tuition-summary',
        title: '[UC-060] Duyệt Tổng Hợp Học Phí',
        path: '/bgh/tuition-summary',
        icon: 'Calculator',
        roles: ['BGH'],
        useCases: ['UC-060'],
      },
      {
        id: 'bgh-revenue-report',
        title: '[UC-066] Báo Cáo Doanh Thu & Công Nợ',
        path: '/bgh/revenue-report',
        icon: 'TrendingUp',
        roles: ['BGH'],
        useCases: ['UC-066'],
      },
      {
        id: 'bgh-extracurricular-classes',
        title: '[UC-067] Mở Lớp CLB Ngoại Khóa',
        path: '/bgh/extracurricular-classes',
        icon: 'Sparkles',
        roles: ['BGH'],
        useCases: ['UC-067'],
      },
      {
        id: 'bgh-evaluation-approvals',
        title: '[UC-072] Duyệt Đánh Giá Trẻ Định Kỳ',
        path: '/bgh/evaluation-approvals',
        icon: 'ClipboardCheck',
        roles: ['BGH'],
        useCases: ['UC-072'],
      },
      {
        id: 'bgh-lesson-plan-approvals',
        title: '[UC-077] Phê Duyệt Kế Hoạch Giáo Án',
        path: '/bgh/lesson-plan-approvals',
        icon: 'BookOpenCheck',
        roles: ['BGH'],
        useCases: ['UC-077'],
      },
      {
        id: 'bgh-development-quality-report',
        title: '[UC-078] Báo Cáo Chất Lượng Trẻ',
        path: '/bgh/development-quality-report',
        icon: 'Award',
        roles: ['BGH'],
        useCases: ['UC-078'],
      },
      {
        id: 'bgh-announcements',
        title: '[UC-079] Thông Báo Toàn Trường',
        path: '/bgh/announcements',
        icon: 'Megaphone',
        roles: ['BGH'],
        useCases: ['UC-079'],
      },
      {
        id: 'bgh-emergency-broadcast',
        title: '[UC-081] Phát Tin Nhắn Khẩn Cấp',
        path: '/bgh/emergency-broadcast',
        icon: 'ShieldAlert',
        roles: ['BGH'],
        useCases: ['UC-081'],
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
  // NHÓM 7: KẾ TOÁN TRƯỜNG HỌC (KE_TOAN)
  // Các Use Cases: UC-033, UC-034, UC-035, UC-036, UC-037, UC-038, UC-039, UC-056, UC-057, UC-059, UC-060
  // Bao gồm đầy đủ các trang cấu hình: Danh mục thu, Miễn giảm, Phạt đón muộn, Hoàn tiền ăn
  // ==========================================
  {
    groupTitle: 'Biểu Phí & Quyết Toán Học Phí',
    roles: ['KE_TOAN'],
    items: [
      {
        id: 'fin-configs',
        title: '[UC-033] Cấu Hình Danh Mục Khoản Thu',
        path: '/finance?tab=fee-configs',
        icon: 'Calculator',
        roles: ['KE_TOAN'],
        useCases: ['UC-033'],
      },
      {
        id: 'fin-discounts',
        title: '[UC-033] Chính Sách Giảm Trừ & Học Bổng',
        path: '/finance?tab=discounts',
        icon: 'Percent',
        roles: ['KE_TOAN'],
        useCases: ['UC-033'],
      },
      {
        id: 'fin-late-pickup',
        title: '[UC-033] Biểu Phí Phạt Đón Muộn',
        path: '/finance?tab=late-pickup',
        icon: 'Timer',
        roles: ['KE_TOAN'],
        useCases: ['UC-033'],
      },
      {
        id: 'fin-refund-rate',
        title: '[UC-034] Đơn Giá Hoàn Tiền Ăn Nghỉ Phép',
        path: '/finance?tab=meal-refund',
        icon: 'Coins',
        roles: ['KE_TOAN'],
        useCases: ['UC-034'],
      },
      {
        id: 'fin-billing',
        title: '[UC-035] Động Cơ Quyết Toán Học Phí',
        path: '/finance?tab=billing-engine',
        icon: 'Cpu',
        roles: ['KE_TOAN'],
        useCases: ['UC-035'],
      },
      {
        id: 'fin-refund-audit',
        title: '[UC-036] Kiểm Toán & Hoàn Tiền Ăn Tự Động',
        path: '/finance?tab=meal-refund-audit',
        icon: 'FileCheck2',
        roles: ['KE_TOAN'],
        useCases: ['UC-036'],
      },
      {
        id: 'fin-bulk-issuance',
        title: '[UC-037] Duyệt & Phát Hành Bảng Kê VietQR',
        path: '/finance?tab=bulk-issuance',
        icon: 'QrCode',
        roles: ['KE_TOAN'],
        useCases: ['UC-037'],
      },
      {
        id: 'fin-deposit',
        title: '[UC-056] Khấu Trừ Tiền Cọc Nhập Học',
        path: '/finance?tab=deposit-deduction',
        icon: 'Coins',
        roles: ['KE_TOAN'],
        useCases: ['UC-056'],
      },
    ],
  },
  {
    groupTitle: 'Thu Ngân, Đối Soát & Báo Cáo',
    roles: ['KE_TOAN'],
    items: [
      {
        id: 'fin-cash',
        title: '[UC-038] Gạch Nợ Thủ Công & Tiền Mặt',
        path: '/finance?tab=cash-collection',
        icon: 'Banknote',
        roles: ['KE_TOAN'],
        useCases: ['UC-038'],
      },
      {
        id: 'fin-webhook',
        title: '[UC-039] Đối Soát Webhook VietQR PayOS',
        path: '/finance?tab=webhook-reconcile',
        icon: 'Webhook',
        roles: ['KE_TOAN'],
        useCases: ['UC-039'],
      },
      {
        id: 'fin-reminders',
        title: '[UC-057] Tự Động Nhắc Nợ Quá Hạn',
        path: '/finance?tab=overdue-reminders',
        icon: 'Bell',
        badgeKey: 'overdueInvoices',
        roles: ['KE_TOAN'],
        useCases: ['UC-057'],
      },
      {
        id: 'fin-disputes',
        title: '[UC-059] Xử Lý Khiếu Nại Tiền Học',
        path: '/finance?tab=disputes-mgmt',
        icon: 'FileQuestion',
        badgeKey: 'pendingDisputes',
        roles: ['KE_TOAN'],
        useCases: ['UC-059'],
      },
      {
        id: 'fin-reports',
        title: '[UC-060] Bảng Tổng Hợp Thu Chi & Công Nợ (VAS)',
        path: '/finance?tab=financial-reports',
        icon: 'BarChart3',
        roles: ['KE_TOAN'],
        useCases: ['UC-060'],
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
