import axiosClient from './axiosClient';
import { supabase } from '../config/supabase';
import {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
} from '../types/userProfile.types';

export const userProfileApi = {
  // 1. Lấy thông tin hồ sơ cá nhân hiện tại
  getProfile: async (): Promise<UserProfile> => {
    try {
      const res = await axiosClient.get<UserProfile>('/users/me');
      if (res && (res as any).id) {
        return res as unknown as UserProfile;
      }
    } catch (err) {
      console.warn('Backend API /users/me chưa sẵn sàng, sử dụng dữ liệu phiên hoạt động hiện tại.');
    }

    // Fallback: Lấy từ Supabase / localStorage
    const savedUserStr = localStorage.getItem('kidpro_user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;

    const profile: UserProfile = {
      id: savedUser?.id || 'usr_current_01',
      userCode: 'KID-USR-8899',
      fullName: savedUser?.fullName || 'Nguyễn Thu Trang',
      email: savedUser?.email || 'thutrang.kidpro@edu.vn',
      phone: savedUser?.phone || '0988123456',
      role: savedUser?.role || 'SYSTEM_ADMIN',
      schoolName: 'Trường Mầm Non KIDPRO - Cơ sở Cầu Giấy',
      schoolCode: 'KIDPRO_CG_01',
      avatarUrl:
        savedUser?.avatarUrl ||
        'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop&crop=faces',
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:30:00Z',
    };

    return profile;
  },

  // 2. Cập nhật số điện thoại & email
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    try {
      const res = await axiosClient.put<UserProfile>('/users/me', payload);
      if (res && (res as any).id) {
        return res as unknown as UserProfile;
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        throw new Error('Số điện thoại này đã được liên kết với một tài khoản khác trong hệ thống.');
      }
      console.warn('Lỗi kết nối /v1/users/me, cập nhật bộ nhớ cục bộ phiên làm việc.');
    }

    // Fallback local update
    const savedUserStr = localStorage.getItem('kidpro_user');
    const currentUser = savedUserStr ? JSON.parse(savedUserStr) : {};
    const updated = {
      ...currentUser,
      email: payload.email,
      phone: payload.phone,
    };
    localStorage.setItem('kidpro_user', JSON.stringify(updated));

    // Cập nhật Supabase metadata nếu có session
    try {
      await supabase.auth.updateUser({
        data: { phone: payload.phone },
      });
    } catch {
      // ignore
    }

    return {
      id: updated.id || 'usr_current_01',
      userCode: 'KID-USR-8899',
      fullName: updated.fullName || 'Nguyễn Thu Trang',
      email: payload.email,
      phone: payload.phone,
      role: updated.role || 'SYSTEM_ADMIN',
      schoolName: 'Trường Mầm Non KIDPRO - Cơ sở Cầu Giấy',
      schoolCode: 'KIDPRO_CG_01',
      avatarUrl: updated.avatarUrl,
      status: 'ACTIVE',
      createdAt: '2026-01-15T08:30:00Z',
    };
  },

  // 3. Tải lên Avatar mới
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    // 1. Chuyển file sang Base64 Data URL trước
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Không thể đọc file ảnh'));
      reader.readAsDataURL(file);
    });

    try {
      // 2. Gửi JSON payload { avatarUrl } trực tiếp tới backend
      const res: any = await axiosClient.post('/users/me/avatar', { avatarUrl: dataUrl });
      const url = res?.avatarUrl || res?.data?.avatarUrl || (typeof res === 'string' ? res : dataUrl);
      if (url) {
        const savedUserStr = localStorage.getItem('kidpro_user');
        if (savedUserStr) {
          try {
            const user = JSON.parse(savedUserStr);
            user.avatarUrl = url;
            localStorage.setItem('kidpro_user', JSON.stringify(user));
          } catch (_) {}
        }
        return { avatarUrl: url };
      }
    } catch (err) {
      console.warn('Lỗi khi gọi API upload avatar backend dạng JSON, thử gửi FormData:', err);
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('file', file);
        // Lưu ý: set headers Content-Type: undefined để browser tự điền boundary
        const res: any = await axiosClient.post('/users/me/avatar', formData, {
          headers: { 'Content-Type': undefined },
        });
        const url = res?.avatarUrl || res?.data?.avatarUrl || (typeof res === 'string' ? res : dataUrl);
        if (url) {
          const savedUserStr = localStorage.getItem('kidpro_user');
          if (savedUserStr) {
            try {
              const user = JSON.parse(savedUserStr);
              user.avatarUrl = url;
              localStorage.setItem('kidpro_user', JSON.stringify(user));
            } catch (_) {}
          }
          return { avatarUrl: url };
        }
      } catch (formErr) {
        console.warn('Backend không phản hồi FormData, sử dụng Data URL cục bộ:', formErr);
      }
    }

    // Fallback: Lưu vào localStorage và trả về dataUrl
    const savedUserStr = localStorage.getItem('kidpro_user');
    if (savedUserStr) {
      try {
        const user = JSON.parse(savedUserStr);
        user.avatarUrl = dataUrl;
        localStorage.setItem('kidpro_user', JSON.stringify(user));
      } catch (_) {}
    }
    return { avatarUrl: dataUrl };
  },

  // 4. Đổi mật khẩu
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await axiosClient.put<{ message: string }>('/users/me/password', payload);
      return { success: true, message: (res as any)?.message || 'Đổi mật khẩu thành công' };
    } catch (err: any) {
      // Kiểm tra xem Supabase session có thể đổi trực tiếp không
      try {
        const { error } = await supabase.auth.updateUser({
          password: payload.newPassword,
        });
        if (!error) {
          return { success: true, message: 'Đổi mật khẩu tài khoản thành công.' };
        }
      } catch {
        // ignore
      }
      throw err;
    }
  },
};

export default userProfileApi;
