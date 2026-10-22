import axiosClient from './axiosClient';
import {
  UserAccount,
  PermissionModule,
  CreateUserPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
  UserListParams,
  RBAC_MESSAGES,
} from '../types/rbac.types';

// Danh mục ma trận phân quyền 5 phân hệ chuẩn của KIDPRO
export const SYSTEM_PERMISSION_MODULES: PermissionModule[] = [
  {
    id: 'mod_academic',
    code: 'ACADEMIC',
    name: 'Phân hệ Học sinh & Lớp học',
    description: 'Quản lý hồ sơ trẻ mầm non, biên chế lớp học, thời khóa biểu và đơn chuyển lớp',
    features: [
      {
        id: 'feat_students',
        code: 'STUDENTS',
        name: 'Hồ sơ Học sinh & Cảnh báo Y tế',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_classes',
        code: 'CLASSES',
        name: 'Biên chế Lớp học & Giáo viên chủ nhiệm',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_timetables',
        code: 'TIMETABLES',
        name: 'Thời khóa biểu & Kế hoạch hoạt động',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_transfer',
        code: 'TRANSFER_REQUESTS',
        name: 'Đơn xin chuyển lớp / Bảo lưu',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
    ],
  },
  {
    id: 'mod_attendance',
    code: 'ATTENDANCE',
    name: 'Phân hệ Điểm danh & Nhận diện AI',
    description: 'Điểm danh hằng ngày, camera AI cổng trường, nhật ký đón trả bé và quản lý đón muộn',
    features: [
      {
        id: 'feat_att_daily',
        code: 'DAILY_ATTENDANCE',
        name: 'Sổ điểm danh có mặt & Báo nghỉ',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
      {
        id: 'feat_ai_cam',
        code: 'AI_RECOGNITION',
        name: 'Nhận diện AI Camera & Push thông báo con đến trường',
        availableActions: ['VIEW', 'CREATE', 'EDIT'],
      },
      {
        id: 'feat_pickup',
        code: 'PICKUP_MANAGEMENT',
        name: 'Xác thực người đón trẻ & Tính phí đón muộn',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
    ],
  },
  {
    id: 'mod_kitchen',
    code: 'KITCHEN',
    name: 'Phân hệ Bếp ăn & Dinh dưỡng',
    description: 'Chốt suất ăn 08:30, thực đơn tuần, bóc tách dị ứng và kiểm thực ATVSTP 3 bước',
    features: [
      {
        id: 'feat_kitchen_report',
        code: 'MEAL_ORDERS',
        name: 'Báo bếp & Chốt suất ăn sáng 08:30 AM',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
      {
        id: 'feat_menus',
        code: 'WEEKLY_MENUS',
        name: 'Thực đơn tuần & Cảnh báo dị ứng tự động',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_food_safety',
        code: 'FOOD_SAFETY_3STEP',
        name: 'Kiểm thực 3 bước Bộ Y Tế & Lưu mẫu 24h',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
    ],
  },
  {
    id: 'mod_finance',
    code: 'FINANCE',
    name: 'Phân hệ Kế toán & Học phí',
    description: 'Khoản thu theo độ tuổi, miễn giảm chính sách, lập phiếu thu và quyết toán VietQR',
    features: [
      {
        id: 'feat_fee_config',
        code: 'FEE_CONFIG',
        name: 'Cấu hình biểu phí & Chính sách miễn giảm',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_invoices',
        code: 'TUITION_INVOICES',
        name: 'Quyết toán học phí & Hóa đơn VietQR',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'APPROVE'],
      },
      {
        id: 'feat_late_fees',
        code: 'LATE_PICKUP_FEES',
        name: 'Khung phạt đón muộn lũy tiến',
        availableActions: ['VIEW', 'CREATE', 'EDIT'],
      },
    ],
  },
  {
    id: 'mod_system',
    code: 'SYSTEM',
    name: 'Phân hệ Quản trị & Hệ thống',
    description: 'Quản lý trường chi nhánh, nhân sự, ma trận phân quyền và thiết lập bảo mật',
    features: [
      {
        id: 'feat_tenants',
        code: 'TENANT_MANAGEMENT',
        name: 'Quản lý trường học & Phân vùng Tenant',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE'],
      },
      {
        id: 'feat_user_accounts',
        code: 'USER_ACCOUNTS',
        name: 'Tài khoản người dùng & Khóa/Mở khóa',
        availableActions: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
      },
      {
        id: 'feat_rbac_matrix',
        code: 'RBAC_PERMISSIONS',
        name: 'Cấu hình ma trận phân quyền RBAC',
        availableActions: ['VIEW', 'CREATE', 'EDIT'],
      },
    ],
  },
];

// Danh sách người dùng mẫu của hệ thống
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr_001',
    fullName: 'Lê Minh Tuấn (Super Admin)',
    email: 'admin.system@kidpro.edu.vn',
    phone: '0988111222',
    tenantId: 'tnt_001',
    tenantName: 'KIDPRO Cầu Giấy',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    permissions: [
      'STUDENTS_VIEW', 'STUDENTS_CREATE', 'STUDENTS_EDIT', 'STUDENTS_DELETE',
      'CLASSES_VIEW', 'CLASSES_CREATE', 'CLASSES_EDIT', 'CLASSES_DELETE',
      'TIMETABLES_VIEW', 'TIMETABLES_CREATE', 'TIMETABLES_EDIT', 'TIMETABLES_DELETE',
      'TRANSFER_REQUESTS_VIEW', 'TRANSFER_REQUESTS_CREATE', 'TRANSFER_REQUESTS_EDIT', 'TRANSFER_REQUESTS_APPROVE',
      'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_CREATE', 'DAILY_ATTENDANCE_EDIT', 'DAILY_ATTENDANCE_APPROVE',
      'AI_RECOGNITION_VIEW', 'AI_RECOGNITION_CREATE', 'AI_RECOGNITION_EDIT',
      'PICKUP_MANAGEMENT_VIEW', 'PICKUP_MANAGEMENT_CREATE', 'PICKUP_MANAGEMENT_EDIT', 'PICKUP_MANAGEMENT_APPROVE',
      'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_CREATE', 'MEAL_ORDERS_EDIT', 'MEAL_ORDERS_APPROVE',
      'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_CREATE', 'WEEKLY_MENUS_EDIT', 'WEEKLY_MENUS_DELETE',
      'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_CREATE', 'FOOD_SAFETY_3STEP_EDIT', 'FOOD_SAFETY_3STEP_APPROVE',
      'FEE_CONFIG_VIEW', 'FEE_CONFIG_CREATE', 'FEE_CONFIG_EDIT', 'FEE_CONFIG_DELETE',
      'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_CREATE', 'TUITION_INVOICES_EDIT', 'TUITION_INVOICES_APPROVE',
      'LATE_PICKUP_FEES_VIEW', 'LATE_PICKUP_FEES_CREATE', 'LATE_PICKUP_FEES_EDIT',
      'TENANT_MANAGEMENT_VIEW', 'TENANT_MANAGEMENT_CREATE', 'TENANT_MANAGEMENT_EDIT', 'TENANT_MANAGEMENT_DELETE', 'TENANT_MANAGEMENT_APPROVE',
      'USER_ACCOUNTS_VIEW', 'USER_ACCOUNTS_CREATE', 'USER_ACCOUNTS_EDIT', 'USER_ACCOUNTS_DELETE',
      'RBAC_PERMISSIONS_VIEW', 'RBAC_PERMISSIONS_CREATE', 'RBAC_PERMISSIONS_EDIT',
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr_002',
    fullName: 'Đặng Mai Phương (Hiệu trưởng)',
    email: 'phuong.dm@kidpro.edu.vn',
    phone: '0912345678',
    tenantId: 'tnt_001',
    tenantName: 'KIDPRO Cầu Giấy',
    role: 'BGH',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop',
    permissions: [
      'STUDENTS_VIEW', 'STUDENTS_CREATE', 'STUDENTS_EDIT',
      'CLASSES_VIEW', 'CLASSES_CREATE', 'CLASSES_EDIT',
      'TIMETABLES_VIEW', 'TIMETABLES_CREATE', 'TIMETABLES_EDIT',
      'TRANSFER_REQUESTS_VIEW', 'TRANSFER_REQUESTS_APPROVE',
      'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_APPROVE',
      'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_APPROVE',
      'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_APPROVE',
      'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_APPROVE',
      'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_APPROVE',
    ],
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'usr_003',
    fullName: 'Hoàng Thị Lan (Giáo viên Chủ nhiệm)',
    email: 'lan.ht@kidpro.edu.vn',
    phone: '0977223344',
    tenantId: 'tnt_001',
    tenantName: 'KIDPRO Cầu Giấy',
    role: 'GIAO_VIEN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    permissions: [
      'STUDENTS_VIEW', 'STUDENTS_EDIT',
      'TIMETABLES_VIEW',
      'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_CREATE', 'DAILY_ATTENDANCE_EDIT',
      'AI_RECOGNITION_VIEW',
      'PICKUP_MANAGEMENT_VIEW', 'PICKUP_MANAGEMENT_CREATE',
      'WEEKLY_MENUS_VIEW',
      'FOOD_SAFETY_3STEP_VIEW',
    ],
    createdAt: '2024-08-15T09:00:00Z',
  },
  {
    id: 'usr_004',
    fullName: 'Vũ Quốc Toàn (Kế toán trưởng)',
    email: 'toan.vq@kidpro.edu.vn',
    phone: '0933556677',
    tenantId: 'tnt_001',
    tenantName: 'KIDPRO Cầu Giấy',
    role: 'KE_TOAN',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    permissions: [
      'STUDENTS_VIEW',
      'FEE_CONFIG_VIEW', 'FEE_CONFIG_CREATE', 'FEE_CONFIG_EDIT',
      'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_CREATE', 'TUITION_INVOICES_EDIT',
      'LATE_PICKUP_FEES_VIEW', 'LATE_PICKUP_FEES_CREATE',
    ],
    createdAt: '2024-04-01T10:00:00Z',
  },
  {
    id: 'usr_005',
    fullName: 'Nguyễn Thị Bích (Bếp trưởng)',
    email: 'bich.nt@kidpro.edu.vn',
    phone: '0966442211',
    tenantId: 'tnt_001',
    tenantName: 'KIDPRO Cầu Giấy',
    role: 'BEP',
    status: 'ACTIVE',
    avatarUrl: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=100&h=100&fit=crop',
    permissions: [
      'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_CREATE', 'MEAL_ORDERS_EDIT',
      'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_CREATE', 'WEEKLY_MENUS_EDIT',
      'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_CREATE', 'FOOD_SAFETY_3STEP_EDIT',
    ],
    createdAt: '2024-05-10T07:30:00Z',
  },
  {
    id: 'usr_006',
    fullName: 'Trần Văn Dũng (Nhân sự cũ - Tạm khóa)',
    email: 'dung.tv@kidpro.edu.vn',
    phone: '0911223399',
    tenantId: 'tnt_002',
    tenantName: 'KIDPRO Ba Đình',
    role: 'GIAO_VU',
    status: 'LOCKED',
    lockReason: 'Nhân viên đã hoàn tất thủ tục nghỉ việc chuyển công tác',
    permissions: ['STUDENTS_VIEW', 'CLASSES_VIEW'],
    createdAt: '2023-10-10T08:00:00Z',
  },
];

const LOCAL_STORAGE_USERS_KEY = 'kidpro_rbac_users_db';

const getStoredUsers = (): UserAccount[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
  }
};

const saveStoredUsers = (data: UserAccount[]): void => {
  localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(data));
};

// Helper xác định quyền mặc định theo vai trò
export const getDefaultPermissionsForRole = (role: string): string[] => {
  switch (role) {
    case 'SYSTEM_ADMIN':
      return [
        'STUDENTS_VIEW', 'STUDENTS_CREATE', 'STUDENTS_EDIT', 'STUDENTS_DELETE',
        'CLASSES_VIEW', 'CLASSES_CREATE', 'CLASSES_EDIT', 'CLASSES_DELETE',
        'TIMETABLES_VIEW', 'TIMETABLES_CREATE', 'TIMETABLES_EDIT', 'TIMETABLES_DELETE',
        'TRANSFER_REQUESTS_VIEW', 'TRANSFER_REQUESTS_CREATE', 'TRANSFER_REQUESTS_EDIT', 'TRANSFER_REQUESTS_APPROVE',
        'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_CREATE', 'DAILY_ATTENDANCE_EDIT', 'DAILY_ATTENDANCE_APPROVE',
        'AI_RECOGNITION_VIEW', 'AI_RECOGNITION_CREATE', 'AI_RECOGNITION_EDIT',
        'PICKUP_MANAGEMENT_VIEW', 'PICKUP_MANAGEMENT_CREATE', 'PICKUP_MANAGEMENT_EDIT', 'PICKUP_MANAGEMENT_APPROVE',
        'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_CREATE', 'MEAL_ORDERS_EDIT', 'MEAL_ORDERS_APPROVE',
        'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_CREATE', 'WEEKLY_MENUS_EDIT', 'WEEKLY_MENUS_DELETE',
        'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_CREATE', 'FOOD_SAFETY_3STEP_EDIT', 'FOOD_SAFETY_3STEP_APPROVE',
        'FEE_CONFIG_VIEW', 'FEE_CONFIG_CREATE', 'FEE_CONFIG_EDIT', 'FEE_CONFIG_DELETE',
        'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_CREATE', 'TUITION_INVOICES_EDIT', 'TUITION_INVOICES_APPROVE',
        'LATE_PICKUP_FEES_VIEW', 'LATE_PICKUP_FEES_CREATE', 'LATE_PICKUP_FEES_EDIT',
        'TENANT_MANAGEMENT_VIEW', 'TENANT_MANAGEMENT_CREATE', 'TENANT_MANAGEMENT_EDIT', 'TENANT_MANAGEMENT_DELETE', 'TENANT_MANAGEMENT_APPROVE',
        'USER_ACCOUNTS_VIEW', 'USER_ACCOUNTS_CREATE', 'USER_ACCOUNTS_EDIT', 'USER_ACCOUNTS_DELETE',
        'RBAC_PERMISSIONS_VIEW', 'RBAC_PERMISSIONS_CREATE', 'RBAC_PERMISSIONS_EDIT',
      ];
    case 'BGH':
      return [
        'STUDENTS_VIEW', 'STUDENTS_CREATE', 'STUDENTS_EDIT',
        'CLASSES_VIEW', 'CLASSES_CREATE', 'CLASSES_EDIT',
        'TIMETABLES_VIEW', 'TIMETABLES_CREATE', 'TIMETABLES_EDIT',
        'TRANSFER_REQUESTS_VIEW', 'TRANSFER_REQUESTS_APPROVE',
        'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_APPROVE',
        'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_APPROVE',
        'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_APPROVE',
        'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_APPROVE',
        'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_APPROVE',
      ];
    case 'GIAO_VIEN':
      return [
        'STUDENTS_VIEW', 'STUDENTS_EDIT',
        'TIMETABLES_VIEW',
        'DAILY_ATTENDANCE_VIEW', 'DAILY_ATTENDANCE_CREATE', 'DAILY_ATTENDANCE_EDIT',
        'AI_RECOGNITION_VIEW',
        'PICKUP_MANAGEMENT_VIEW', 'PICKUP_MANAGEMENT_CREATE',
        'WEEKLY_MENUS_VIEW',
        'FOOD_SAFETY_3STEP_VIEW',
      ];
    case 'KE_TOAN':
      return [
        'STUDENTS_VIEW',
        'FEE_CONFIG_VIEW', 'FEE_CONFIG_CREATE', 'FEE_CONFIG_EDIT',
        'TUITION_INVOICES_VIEW', 'TUITION_INVOICES_CREATE', 'TUITION_INVOICES_EDIT',
        'LATE_PICKUP_FEES_VIEW', 'LATE_PICKUP_FEES_CREATE',
      ];
    case 'BEP':
      return [
        'MEAL_ORDERS_VIEW', 'MEAL_ORDERS_CREATE', 'MEAL_ORDERS_EDIT',
        'WEEKLY_MENUS_VIEW', 'WEEKLY_MENUS_CREATE', 'WEEKLY_MENUS_EDIT',
        'FOOD_SAFETY_3STEP_VIEW', 'FOOD_SAFETY_3STEP_CREATE', 'FOOD_SAFETY_3STEP_EDIT',
      ];
    default:
      return ['STUDENTS_VIEW', 'CLASSES_VIEW'];
  }
};

const mapUserDtoToAccount = (dto: any): UserAccount => {
  const localUsers = getStoredUsers();
  const localMatch = localUsers.find(
    (u) => String(u.id) === String(dto.id) || (u.email && u.email.toLowerCase() === dto.email?.toLowerCase())
  );
  const defaultRolePerms = getDefaultPermissionsForRole(dto.role);

  return {
    id: String(dto.id),
    fullName: dto.fullName || 'Người dùng',
    email: dto.email,
    phone: dto.phone || '',
    tenantId: dto.schoolId || localMatch?.tenantId || (dto.role === 'SYSTEM_ADMIN' ? 'all' : 'tnt_001'),
    tenantName: dto.schoolName || localMatch?.tenantName || (dto.role === 'SYSTEM_ADMIN' ? 'Toàn hệ thống' : 'Trường Mầm Sống'),
    role: dto.role,
    status: dto.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE',
    avatarUrl:
      dto.avatarUrl ||
      localMatch?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    lockReason: localMatch?.lockReason,
    permissions: localMatch?.permissions || defaultRolePerms,
    createdAt: dto.createdAt ? new Date(dto.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: localMatch?.updatedAt || (dto.createdAt ? new Date(dto.createdAt).toISOString() : undefined),
  };
};

export const rbacApi = {
  // 1. Lấy danh sách người dùng phân trang & lọc (kết nối Spring Boot /api/admin/users)
  getUsers: async (params?: UserListParams): Promise<{ data: UserAccount[]; total: number }> => {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.keyword?.trim()) queryParams.keyword = params.keyword.trim();
      if (params?.role && params.role !== 'ALL') queryParams.role = params.role;
      if (params?.status && params.status !== 'ALL') queryParams.status = params.status;

      const res: any = await axiosClient.get('/admin/users', {
        params: queryParams,
      });

      const rawList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : null);
      if (rawList && rawList.length > 0) {
        let mapped = rawList.map((u: any) => mapUserDtoToAccount(u));
        if (params?.tenantId && params.tenantId !== 'ALL') {
          mapped = mapped.filter((u: UserAccount) => u.tenantId === params.tenantId);
        }
        return {
          data: mapped,
          total: mapped.length,
        };
      }
    } catch (err) {
      console.warn('Lưu ý: Không thể tải từ backend /api/admin/users, kích hoạt dữ liệu dự phòng:', err);
    }

    let list = getStoredUsers();
    const keyword = params?.keyword?.trim().toLowerCase();
    const tenantId = params?.tenantId;
    const role = params?.role;
    const status = params?.status;

    if (keyword) {
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(keyword) ||
          u.email.toLowerCase().includes(keyword) ||
          u.phone.includes(keyword)
      );
    }

    if (tenantId && tenantId !== 'ALL') {
      list = list.filter((u) => u.tenantId === tenantId);
    }

    if (role && role !== 'ALL') {
      list = list.filter((u) => u.role === role);
    }

    if (status && status !== 'ALL') {
      list = list.filter((u) => u.status === status);
    }

    return {
      data: list,
      total: list.length,
    };
  },

  // 2. Lấy danh mục cây tính năng Ma trận phân quyền
  getPermissionsMatrix: async (): Promise<PermissionModule[]> => {
    return SYSTEM_PERMISSION_MODULES;
  },

  // 3. Thêm tài khoản mới (kết nối Spring Boot /api/admin/users)
  createUser: async (payload: CreateUserPayload): Promise<UserAccount> => {
    try {
      const bePayload = {
        email: payload.email.trim(),
        password: (payload as any).password || 'Kidpro@2026',
        role: payload.role,
        fullName: payload.fullName.trim(),
        phone: payload.phone?.trim() || null,
        schoolId: payload.tenantId && payload.tenantId !== 'ALL' && payload.tenantId.length > 20 ? payload.tenantId : null,
        status: 'ACTIVE',
      };

      const res: any = await axiosClient.post('/admin/users', bePayload);
      const createdDto = res?.data || res;
      if (createdDto && (createdDto.id || createdDto.email)) {
        const newAccount = mapUserDtoToAccount(createdDto);
        if (payload.tenantId) {
          newAccount.tenantId = payload.tenantId;
          newAccount.tenantName = (payload as any).tenantName || createdDto.schoolName || newAccount.tenantName;
        }

        const list = getStoredUsers();
        list.unshift(newAccount);
        saveStoredUsers(list);
        return newAccount;
      }
    } catch (err: any) {
      if (err?.response?.status === 409 || err?.response?.data?.message?.toLowerCase().includes('email')) {
        throw new Error(RBAC_MESSAGES.MSG_019);
      }
      console.warn('Lưu ý: Không thể lưu qua backend, lưu tạm vào bộ nhớ cục bộ:', err);
    }

    const list = getStoredUsers();

    // Check duplicate email
    if (list.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error(RBAC_MESSAGES.MSG_019);
    }

    // Check duplicate phone
    if (list.some((u) => u.phone === payload.phone)) {
      throw new Error(RBAC_MESSAGES.MSG_015);
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}`,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      tenantId: payload.tenantId,
      tenantName: payload.tenantId === 'tnt_001' ? 'KIDPRO Cầu Giấy' : 'KIDPRO Chi Nhánh',
      role: payload.role,
      status: 'ACTIVE',
      permissions: getDefaultPermissionsForRole(payload.role),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(newUser);
    saveStoredUsers(list);
    return newUser;
  },

  // 4. Cập nhật quyền người dùng (Phân quyền RBAC)
  updateUserPermissions: async (
    userId: string,
    permissions: string[],
    clientUpdatedAt?: string
  ): Promise<UserAccount> => {
    const list = getStoredUsers();
    const index = list.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    const targetUser = list[index];

    // BR-010: Bảo vệ Super Admin
    if (targetUser.role === 'SYSTEM_ADMIN') {
      throw new Error(RBAC_MESSAGES.MSG_022);
    }

    // Kiểm tra xung đột đồng thời (Concurrency check - MSG-024)
    if (clientUpdatedAt && targetUser.updatedAt && clientUpdatedAt !== targetUser.updatedAt) {
      throw new Error(RBAC_MESSAGES.MSG_024);
    }

    targetUser.permissions = permissions;
    targetUser.updatedAt = new Date().toISOString();
    list[index] = targetUser;
    saveStoredUsers(list);

    return targetUser;
  },

  // 5. Khóa / Mở khóa tài khoản người dùng (kết nối Spring Boot PUT /api/admin/users/{id}/status)
  updateUserStatus: async (
    userId: string,
    payload: UpdateUserStatusPayload
  ): Promise<UserAccount> => {
    try {
      const res: any = await axiosClient.put(`/admin/users/${userId}/status`, {
        status: payload.status,
      });
      const updatedDto = res?.data || res;
      if (updatedDto && (updatedDto.id || updatedDto.email)) {
        const updatedAccount = mapUserDtoToAccount(updatedDto);
        if (payload.reason) updatedAccount.lockReason = payload.reason;

        const list = getStoredUsers();
        const index = list.findIndex((u) => u.id === userId);
        if (index !== -1) {
          list[index] = updatedAccount;
          saveStoredUsers(list);
        }
        return updatedAccount;
      }
    } catch (err) {
      console.warn('Lưu ý: Không thể cập nhật trạng thái qua backend, thực hiện cục bộ:', err);
    }

    const list = getStoredUsers();
    const index = list.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('Không tìm thấy người dùng');

    // Không cho phép khóa Super Admin
    if (list[index].role === 'SYSTEM_ADMIN') {
      throw new Error('Không thể khóa tài khoản Quản trị viên cấp cao (Super Admin)');
    }

    list[index].status = payload.status;
    if (payload.reason) {
      list[index].lockReason = payload.reason;
    } else if (payload.status === 'ACTIVE') {
      delete list[index].lockReason;
    }

    list[index].updatedAt = new Date().toISOString();
    saveStoredUsers(list);
    return list[index];
  },
};

export default rbacApi;
