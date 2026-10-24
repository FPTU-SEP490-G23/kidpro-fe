export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'VERIFY' | string;

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  ipAddress: string;
  userAgent?: string;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  hashChain?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  tableName?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  page?: number;
  size?: number;
}
