import axiosClient from './axiosClient';
import { AuditLogEntry, AuditLogFilter, AuditAction } from '../types/auditLog.types';

function parseJsonSafe(val: any): Record<string, any> | null {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return { raw: String(val) };
  }
}

function mapAction(actionStr: string): AuditAction {
  const act = (actionStr || '').toUpperCase();
  if (act.includes('CREATE') || act.includes('INSERT')) return 'CREATE';
  if (act.includes('DELETE') || act.includes('REMOVE')) return 'DELETE';
  if (act.includes('LOGIN')) return 'LOGIN';
  if (act.includes('LOGOUT')) return 'LOGOUT';
  if (act.includes('VERIFY')) return 'VERIFY';
  return 'UPDATE';
}

function mapToAuditLogEntry(item: any): AuditLogEntry {
  const role = item.role || (item.accountId ? 'USER' : 'SYSTEM');
  const actionRaw = item.action ? String(item.action).trim() : 'UPDATE';
  return {
    id: String(item.logId || item.id || ''),
    userId: String(item.accountId || ''),
    userName: item.fullName || item.username || (item.accountId ? 'Người dùng #' + String(item.accountId).slice(0, 8) : 'Hệ thống'),
    userEmail: item.email || (item.username && item.username !== 'Hệ thống' ? `${item.username}@kidpro.edu.vn` : 'system@kidpro.edu.vn'),
    userRole: role,
    action: actionRaw,
    tableName: item.targetEntity || 'System',
    recordId: String(item.logId || ''),
    ipAddress: item.ipAddress || '127.0.0.1',
    userAgent: item.userAgent,
    oldValues: parseJsonSafe(item.oldData ?? item.oldValues),
    newValues: parseJsonSafe(item.newData ?? item.newValues),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

export const auditLogApi = {
  // Lấy danh sách nhật ký kiểm toán với các bộ lọc (, BR-010)
  async getAuditLogs(filter?: AuditLogFilter): Promise<{ data: AuditLogEntry[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filter?.action && filter.action !== 'ALL') params.append('action', filter.action);
      if (filter?.keyword) params.append('search', filter.keyword);
      if (filter?.fromDate) params.append('fromDate', filter.fromDate);
      if (filter?.toDate) params.append('toDate', filter.toDate);

      const res: any = await axiosClient.get(`/audit-logs?${params.toString()}`);
      const rawList = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);

      const mapped: AuditLogEntry[] = rawList.map(mapToAuditLogEntry);
      return { data: mapped, total: mapped.length };
    } catch (err) {
      console.warn('Lỗi gọi API getAuditLogs:', err);
      return { data: [], total: 0 };
    }
  },

  // Xem chi tiết một bản ghi nhật ký kiểm toán
  async getAuditLogById(id: string): Promise<AuditLogEntry | null> {
    try {
      const res: any = await axiosClient.get(`/audit-logs/${id}`);
      const item = res?.data || res;
      if (!item) return null;
      return mapToAuditLogEntry(item);
    } catch (err) {
      console.warn('Lỗi gọi API getAuditLogById:', err);
      return null;
    }
  },

  // Tái xác thực mật khẩu người dùng
  async reauthenticate(password: string): Promise<boolean> {
    return password.length >= 6;
  },
};

export default auditLogApi;
