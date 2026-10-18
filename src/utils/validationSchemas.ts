import { z } from 'zod';

// Regex chuẩn số điện thoại Việt Nam (10 chữ số, các đầu số hợp lệ của Viettel, Vina, Mobi, Vietnamobile, Gmobile)
export const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

// Chuẩn hóa loại bỏ khoảng trắng, dấu chấm, dấu gạch nối
export const normalizePhoneNumber = (phone: string): string => phone.replace(/[\s.-]/g, '');

// Kiểm tra số điện thoại hợp lệ (chấp nhận cả định dạng có dấu cách như 0388 765 433)
export const isValidVietnamPhone = (phone: string): boolean => {
  if (!phone) return false;
  const cleaned = normalizePhoneNumber(phone);
  return VIETNAM_PHONE_REGEX.test(cleaned);
};

// Regex mật khẩu: Tối thiểu 8 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

// Regex mã trường school_code: Cho phép chữ in hoa, thường, số, dấu gạch nối và gạch dưới (VD: SM-03, MNMM-2012, KIDPRO_HN)
export const SCHOOL_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

// ==================== UC-004 SCHEMAS ====================

export const profileInfoSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống (BR-008)')
    .email('Vui lòng nhập đúng định dạng Email'),
  phone: z
    .string()
    .min(1, 'Số điện thoại không được để trống (BR-008)')
    .refine(isValidVietnamPhone, 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08, 09'),
});

export type ProfileInfoFormValues = z.infer<typeof profileInfoSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
    newPassword: z
      .string()
      .min(8, 'Mật khẩu mới phải có tối thiểu 8 ký tự (BR-006)')
      .regex(
        PASSWORD_REGEX,
        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*)'
      ),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới và Xác nhận mật khẩu không trùng khớp (BR-006)',
    path: ['confirmPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

// Validate file avatar client-side (< 5MB, JPG/PNG)
export const validateAvatarFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tệp ảnh đại diện phải có định dạng JPG/PNG.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Dung lượng tệp ảnh không được vượt quá 5MB.',
    };
  }

  return { valid: true };
};

// ==================== UC-005 SCHEMAS ====================

export const createTenantSchema = z.object({
  schoolCode: z
    .string()
    .min(1, 'Mã trường học không được để trống (BR-076)')
    .regex(SCHOOL_CODE_REGEX, 'Mã trường gồm chữ, số, dấu gạch nối hoặc gạch dưới (VD: SM-03, MNMM-2012)'),
  name: z.string().min(3, 'Tên trường học tối thiểu 3 ký tự'),
  taxCode: z.string().min(1, 'Mã số thuế không được để trống (BR-076)'),
  address: z.string().min(5, 'Địa chỉ trường học là bắt buộc'),
  hotline: z
    .string()
    .min(1, 'Hotline không được để trống')
    .regex(/^[0-9+() .-]{8,20}$/, 'Hotline không đúng định dạng'),
  email: z
    .string()
    .min(1, 'Email công vụ không được để trống (BR-076)')
    .email('Email công vụ không hợp lệ'),
  licenseNumber: z
    .string()
    .min(1, 'Số giấy phép hoạt động giáo dục mầm non là bắt buộc (MSG-020)'),
  adminName: z.string().min(2, 'Họ tên Hiệu trưởng / Quản trị viên là bắt buộc'),
  adminEmail: z.string().min(1, 'Email quản trị là bắt buộc').email('Email quản trị không hợp lệ'),
  adminPhone: z
    .string()
    .min(1, 'Số điện thoại quản trị là bắt buộc')
    .refine(isValidVietnamPhone, 'Số điện thoại phải gồm 10 chữ số (đầu 03, 05, 07, 08, 09)'),
  subscriptionPackage: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).default('STANDARD'),
});

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

export const editTenantSchema = z.object({
  name: z.string().min(3, 'Tên trường học tối thiểu 3 ký tự'),
  address: z.string().min(5, 'Địa chỉ trường học là bắt buộc'),
  hotline: z.string().min(1, 'Hotline không được để trống'),
  email: z.string().min(1, 'Email công vụ không được để trống').email('Email công vụ không hợp lệ'),
  adminName: z.string().min(2, 'Họ tên người đại diện là bắt buộc'),
  logoUrl: z.string().optional(),
});

export type EditTenantFormValues = z.infer<typeof editTenantSchema>;

// ==================== UC-006 SCHEMAS ====================

export const createUserAccountSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên tối thiểu 2 ký tự (BR-076)'),
  email: z.string().min(1, 'Email không được để trống (BR-076)').email('Email không đúng định dạng'),
  phone: z
    .string()
    .min(1, 'Số điện thoại không được để trống (BR-076)')
    .refine(isValidVietnamPhone, 'Số điện thoại phải gồm 10 chữ số (đầu 03, 05, 07, 08, 09)'),
  tenantId: z.string().min(1, 'Vui lòng chọn cơ sở trường học trực thuộc (BR-076)'),
  role: z.enum([
    'SYSTEM_ADMIN',
    'BGH',
    'GIAO_VU',
    'KE_TOAN',
    'GIAO_VIEN',
    'BEP',
    'PHU_HUYNH',
  ]),
});

export type CreateUserAccountFormValues = z.infer<typeof createUserAccountSchema>;
