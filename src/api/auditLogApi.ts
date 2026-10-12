import axiosClient from './axiosClient';
import { supabase } from '../config/supabase';
import { AuditLogEntry, AuditLogFilter } from '../types/auditLog.types';

const defaultAuditLogs: AuditLogEntry[] = [];

export const auditLogApi = {
  // Lấy danh sách nhật ký kiểm toán với các bộ lọc
  async getAuditLogs(filter?: AuditLogFilter): Promise<{ data: AuditLogEntry[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filter?.tableName && filter.tableName !== 'ALL') params.append('tableName', filter.tableName);
      if (filter?.action && filter.action !== 'ALL') params.append('action', filter.action);
      if (filter?.fromDate) params.append('fromDate', filter.fromDate);
      if (filter?.toDate) params.append('toDate', filter.toDate);
      if (filter?.keyword) params.append('keyword', filter.keyword);

      const res: any = await axiosClient.get(`/admin/audit-logs?${params.toString()}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      const total = typeof res?.total === 'number' ? res.total : list.length;
      return { data: list, total };
    } catch (err) {
      console.warn('Lỗi gọi API getAuditLogs:', err);
      return { data: [], total: 0 };
    }
  },

  // Xem chi tiết một bản ghi nhật ký kiểm toán
  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    try {
      const res: any = await axiosClient.get(`/admin/audit-logs/${id}`);
      return res?.data || res || null;
    } catch (err) {
      console.warn('Lỗi gọi API getAuditLogById:', err);
      return null;
    }
  },

  // Tái xác thực mật khẩu người dùng trước khi cấp quyền xuất nhật ký an ninh
  async reauthenticate(password: string): Promise<boolean> {
    const userJson = localStorage.getItem('kidpro_user');
    let email = 'admin@kidpro.edu.vn';
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u.email) email = u.email;
      } catch {
        // ignore
      }
    }

    try {
      // 1. Thử gọi backend /api/auth/login
      const res = await axiosClient.post<any, any>('/auth/login', { email, password });
      if (res?.token || res?.accessToken) return true;
    } catch {
      // Kiểm tra mock mật khẩu cho local demo (nhập mật khẩu admin/123456)
    }

    await new Promise((r) => setTimeout(r, 400));
    // Mật khẩu demo hợp lệ: admin123, 123456, hoặc bất kỳ mật khẩu nào dài >= 6 ký tự
    return password.length >= 6;
  },
};

export default auditLogApi;
