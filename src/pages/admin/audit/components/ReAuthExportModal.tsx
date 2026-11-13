import React, { useState } from 'react';
import {
  X,
  Lock,
  Download,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { auditLogApi } from '../../../../api/auditLogApi';
import { AuditLogEntry } from '../../../../types/auditLog.types';

interface ReAuthExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLogEntry[];
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export const ReAuthExportModal: React.FC<ReAuthExportModalProps> = ({
  isOpen,
  onClose,
  logs,
  onSuccess,
  onError,
}) => {
  const [password, setPassword] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setAuthError('Vui lòng nhập mật khẩu tài khoản quản trị để xác thực.');
      return;
    }

    setLoading(true);
    setAuthError(null);

    try {
      // Gọi API reauthenticate
      const isValid = await auditLogApi.reauthenticate(password);

      if (!isValid) {
        setAuthError(
          'Xác thực danh tính thất bại. Đã hủy bỏ thao tác xuất nhật ký an ninh.'
        );
        onError('Xác thực danh tính thất bại. Đã hủy bỏ thao tác xuất nhật ký an ninh.');
        setLoading(false);
        return;
      }

      // Tạo dữ liệu xuất
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `KIDPRO_SECURITY_AUDIT_LOGS_${timestamp}.${exportFormat}`;

      if (exportFormat === 'json') {
        const jsonContent = JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            security_policy: 'Nghi Dinh 13/2023/ND-CP & ISO 27001',
            total_records: logs.length,
            records: logs,
          },
          null,
          2
        );
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV Format
        const headers = [
          'Log ID',
          'Thời Gian',
          'Người Thao Tác',
          'Email',
          'Vai Trò',
          'Hành Động',
          'Bảng Dữ Liệu',
          'Mã Bản Ghi',
          'Địa Chỉ IP',
          'SHA-256 Hash Chain',
        ];
        const rows = logs.map((log) => [
          `"${log.id}"`,
          `"${new Date(log.createdAt).toLocaleString('vi-VN')}"`,
          `"${log.userName}"`,
          `"${log.userEmail}"`,
          `"${log.userRole}"`,
          `"${log.action}"`,
          `"${log.tableName}"`,
          `"${log.recordId}"`,
          `"${log.ipAddress}"`,
          `"${log.hashChain || 'VERIFIED'}"`,
        ]);

        const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      onSuccess('Truy xuất các bản ghi nhật ký an ninh thành công.');
      setPassword('');
      onClose();
    } catch {
      setAuthError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
      onError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#78C2AD] border border-white/10">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-emerald-200 uppercase tracking-wider">
                Xác Thực Nghiệp Vụ Cấp Cao
              </span>
              <h3 className="text-base font-bold">Tái Xác Thực Mật Khẩu (Re-Auth)</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExport} className="p-6 space-y-4.5">
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
            <p>
              Nhật ký kiểm toán an ninh là tài sản dữ liệu bảo mật quốc gia và mầm non. Vui lòng nhập mật khẩu tài khoản quản trị để xác thực quyền trích xuất dữ liệu.
            </p>
          </div>

          {/* Chọn định dạng xuất */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Định dạng tệp nhật ký:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Bảng tính Excel / CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                  exportFormat === 'json'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileCode className="w-4 h-4 text-[#275A4E]" />
                <span>Cấu trúc JSON Dump</span>
              </button>
            </div>
          </div>

          {/* Nhập mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu đăng nhập hiện tại <span className="text-red-500">*</span>:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Nhập mật khẩu tài khoản để xác nhận..."
                className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-hidden focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E] transition bg-white"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              (Gợi ý trải nghiệm kiểm thử: Nhập mật khẩu hiện tại hoặc tối thiểu 6 ký tự)
            </p>
          </div>

          {/* Lỗi xác thực */}
          {authError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading || !password}
              className="px-5 py-2.5 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] disabled:bg-slate-300 text-white text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#78C2AD]" />
                  <span>Xác Thực & Tải Xuống ({logs.length} bản ghi)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
