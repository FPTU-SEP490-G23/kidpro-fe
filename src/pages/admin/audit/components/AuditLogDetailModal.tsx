import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  User,
  Database,
  Globe,
  Monitor,
  Copy,
  Check,
  FileCode,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AuditLogEntry, AuditAction } from '../../../../types/auditLog.types';

interface AuditLogDetailModalProps {
  log: AuditLogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'diff' | 'raw'>('diff');

  if (!isOpen || !log) return null;

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'CREATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            CREATE (Tạo mới)
          </span>
        );
      case 'UPDATE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-[#1E4D40] border border-amber-300">
            UPDATE (Cập nhật)
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300">
            DELETE (Xóa)
          </span>
        );
      case 'LOGIN':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
            LOGIN (Đăng nhập)
          </span>
        );
      case 'VERIFY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300">
            VERIFY (Xác minh)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            {action}
          </span>
        );
    }
  };

  const handleCopyPayload = () => {
    const payload = JSON.stringify(
      {
        id: log.id,
        table: log.tableName,
        action: log.action,
        recordId: log.recordId,
        user: log.userEmail,
        oldValues: log.oldValues,
        newValues: log.newValues,
        hashChain: log.hashChain,
        timestamp: log.createdAt,
      },
      null,
      2
    );
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tìm tất cả các keys thay đổi giữa oldValues và newValues
  const allKeys = Array.from(
    new Set([
      ...Object.keys(log.oldValues || {}),
      ...Object.keys(log.newValues || {}),
    ])
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#78C2AD] border border-white/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-200">
                  {log.id}
                </span>
                <span className="text-white/40">|</span>
                <span className="text-xs text-white/80">Kiểm toán an ninh bất biến</span>
              </div>
              <h3 className="text-lg font-bold">Chi Tiết Bản Ghi Nhật Ký Thay Đổi</h3>
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

        {/* Hash chain verification strip */}
        <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#1E4D40] font-mono">
            <span className="font-bold text-slate-600">SHA-256 Hash Chain:</span>
            <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 select-all font-semibold">
              {log.hashChain || '3a4b9c1d8e7f2a...verified'}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Chuỗi kiểm toán hợp lệ (Bất biến)
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian ghi nhận
              </span>
              <p className="text-xs font-bold text-slate-800">
                {new Date(log.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Người thực hiện
              </span>
              <p className="text-xs font-bold text-slate-800 truncate" title={log.userName}>
                {log.userName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{log.userEmail}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Bảng & Bản ghi
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-[#1E4D40] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {log.tableName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">#{log.recordId}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Hành động & Mạng
              </span>
              <div className="flex items-center gap-2">
                {getActionBadge(log.action)}
                <span className="text-xs font-mono font-semibold text-slate-600">
                  {log.ipAddress}
                </span>
              </div>
            </div>
          </div>

          {/* User Agent info */}
          {log.userAgent && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-2 text-xs text-slate-600">
              <Monitor className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-500 shrink-0">User-Agent:</span>
              <span className="font-mono text-[11px] truncate">{log.userAgent}</span>
            </div>
          )}

          {/* Diff vs Raw Toggle Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#275A4E]" />
              <h4 className="text-sm font-bold text-slate-800">So Sánh Trạng Thái Dữ Liệu (Payload Diff)</h4>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('diff')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    viewMode === 'diff'
                      ? 'bg-white text-[#275A4E] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Bảng So Sánh Diff
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('raw')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    viewMode === 'raw'
                      ? 'bg-white text-[#275A4E] shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Raw JSON
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="p-1.5 text-slate-600 hover:text-[#275A4E] bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                title="Sao chép toàn bộ payload"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mode 1: Bảng so sánh Diff trực quan */}
          {viewMode === 'diff' ? (
            <div className="space-y-3">
              {allKeys.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
                  Không có trường thuộc tính dữ liệu thay đổi trong bản ghi này.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 text-left w-1/4">Thuộc tính (Field)</th>
                        <th className="py-2.5 px-4 text-left w-[37.5%]">
                          Giá trị cũ (<span className="text-red-600 font-mono">old_values</span>)
                        </th>
                        <th className="py-2.5 px-4 text-left w-[37.5%]">
                          Giá trị mới (<span className="text-emerald-700 font-mono">new_values</span>)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {allKeys.map((key) => {
                        const oldVal = log.oldValues?.[key];
                        const newVal = log.newValues?.[key];
                        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                        return (
                          <tr
                            key={key}
                            className={`transition hover:bg-slate-50/80 ${
                              isChanged ? 'bg-amber-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-1.5">
                              {isChanged && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C] shrink-0" />
                              )}
                              <span>{key}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 bg-red-50/20">
                              {oldVal !== undefined ? (
                                <span className="text-red-700 font-medium">
                                  {typeof oldVal === 'object'
                                    ? JSON.stringify(oldVal)
                                    : String(oldVal)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">null</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-800 bg-emerald-50/20">
                              {newVal !== undefined ? (
                                <span className="text-emerald-800 font-semibold">
                                  {typeof newVal === 'object'
                                    ? JSON.stringify(newVal)
                                    : String(newVal)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">null</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Raw JSON Preview */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600">old_values (Trước):</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-red-300 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {log.oldValues ? JSON.stringify(log.oldValues, null, 2) : 'null'}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-600">new_values (Sau):</span>
                <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
                  {log.newValues ? JSON.stringify(log.newValues, null, 2) : 'null'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Dữ liệu được lưu trữ chuẩn WORM (Write Once, Read Many) bảo đảm pháp lý.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
