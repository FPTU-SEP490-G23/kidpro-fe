import React, { useState } from 'react';
import { UnresolvedSecurityAlert } from '../../../../types/executiveDashboard.types';
import { useToast } from '../../../../contexts/ToastContext';
import executiveApi from '../../../../api/executiveApi';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  ShieldCheck,
  Eye,
  Check,
  RefreshCw,
} from 'lucide-react';

interface SecurityGateAlertsWatcherProps {
  alerts: UnresolvedSecurityAlert[];
  onAlertResolved: () => void;
}

export const SecurityGateAlertsWatcher: React.FC<SecurityGateAlertsWatcherProps> = ({
  alerts,
  onAlertResolved,
}) => {
  const { success, error } = useToast();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      await executiveApi.resolveAlert(
        alertId,
        'Bảo vệ và BGH đã kiểm tra CCCD, đối chiếu giấy ủy quyền đón trẻ hợp lệ.'
      );
      success('Đã xác nhận giải quyết cảnh báo an ninh cổng trường!');
      onAlertResolved();
    } catch {
      error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setResolvingId(null);
    }
  };

  const pendingAlerts = alerts.filter((a) => !a.resolved);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Cảnh Báo Nhận Diện Người Lạ Tại Cổng Trường (AI Face Security)
            </h3>
            <p className="text-xs text-slate-500">
              Người đón bé chưa đăng ký sinh trắc học hoặc có độ tương đồng thấp (isMatch=false)
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            pendingAlerts.length > 0
              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
              : 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
          }`}
        >
          {pendingAlerts.length > 0
            ? `${pendingAlerts.length} CẢNH BÁO CẦN XỬ LÝ`
            : 'KHÔNG CÓ CẢNH BÁO MỚI'}
        </span>
      </div>

      {/* Grid danh sách ảnh chụp cảnh báo */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Tất cả luồng ra vào cổng trường an toàn</p>
          <p className="text-xs text-slate-400 mt-1">Không phát hiện người lạ hoặc sai lệch danh tính.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => {
            const isResolved = alert.resolved;

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${
                  isResolved
                    ? 'bg-slate-50 border-slate-200 opacity-75'
                    : 'bg-rose-50/50 border-rose-200 shadow-sm'
                }`}
              >
                {/* Ảnh chụp từ camera AI cổng */}
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-300 shadow-xs">
                  {alert.photoUrl ? (
                    <img
                      src={alert.photoUrl}
                      alt="Ảnh chụp cảnh báo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      Không có ảnh
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 rounded">
                    {Math.round((alert.similarityScore || 0.45) * 100)}%
                  </span>
                </div>

                {/* Thông tin cảnh báo */}
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{alert.gateName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isResolved
                          ? 'bg-emerald-100 text-[#1E4D40]'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {isResolved ? 'ĐÃ GIẢI QUYẾT' : 'CHƯA XỬ LÝ'}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">{alert.notes}</p>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>Thời gian chụp: {new Date(alert.capturedAt).toLocaleTimeString('vi-VN')}</span>
                  </div>

                  {/* Nút thao tác xác nhận */}
                  {!isResolved && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolvingId === alert.id}
                        className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
                      >
                        {resolvingId === alert.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserCheck className="w-3 h-3 text-[#78C2AD]" />
                        )}
                        <span>Xác nhận danh tính & Cho phép đón</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cam kết tuân thủ Nghị định 13/2023/NĐ-CP */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-[#275A4E] shrink-0" />
        <span>
          Ảnh chụp sinh trắc học tại cổng trường được mã hóa lưu trữ tạm thời theo đúng quy định <strong>Nghị định 13/2023/NĐ-CP</strong> và tự động hủy sau 30 ngày.
        </span>
      </div>
    </div>
  );
};

export default SecurityGateAlertsWatcher;
