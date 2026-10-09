import React, { useState, useRef } from 'react';
import { FirebaseIntegrationConfig } from '../../../../types/integration.types';
import { useToast } from '../../../../contexts/ToastContext';
import integrationApi from '../../../../api/integrationApi';
import {
  BellRing,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Send,
  Eye,
  EyeOff,
  Key,
  FileText,
  RefreshCw,
  Power,
  ShieldAlert,
} from 'lucide-react';

interface FirebaseTabProps {
  initialConfig: FirebaseIntegrationConfig;
  onUpdateSuccess: (updated: FirebaseIntegrationConfig) => void;
}

export const FirebaseTab: React.FC<FirebaseTabProps> = ({ initialConfig, onUpdateSuccess }) => {
  const { showToast, success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [fcmServerKey, setFcmServerKey] = useState(initialConfig.fcmServerKey || '');
  const [showServerKey, setShowServerKey] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [uploadedFileDetails, setUploadedFileDetails] = useState<{
    name: string;
    projectId?: string;
    clientEmail?: string;
  } | null>(
    initialConfig.projectId
      ? {
          name: initialConfig.uploadedFileName || 'firebase-service-account.json',
          projectId: initialConfig.projectId,
          clientEmail: initialConfig.clientEmail,
        }
      : null
  );

  // Xử lý đọc và kiểm tra tệp Firebase Service Account JSON
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng .json
    if (!file.name.endsWith('.json')) {
      showToast('MSG-027: Định dạng tệp chứng chỉ Firebase không hợp lệ. Thiếu các trường khóa bắt buộc.', 'error');
      return;
    }

    // Kiểm tra dung lượng < 2MB
    if (file.size > 2 * 1024 * 1024) {
      showToast('Tệp chứng chỉ vượt quá dung lượng tối đa 2MB.', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Client-side validation: bắt buộc phải có project_id, private_key, client_email
        if (!json.project_id || !json.private_key || !json.client_email) {
          showToast('MSG-027: Định dạng tệp chứng chỉ Firebase không hợp lệ. Thiếu các trường khóa bắt buộc.', 'error');
          setIsUploading(false);
          return;
        }

        // Upload hợp lệ
        const updated = await integrationApi.uploadFirebaseCertificate(json, file.name);
        setUploadedFileDetails({
          name: file.name,
          projectId: json.project_id,
          clientEmail: json.client_email,
        });
        onUpdateSuccess(updated);
        success('MSG-025: Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công');
      } catch {
        showToast('MSG-027: Định dạng tệp chứng chỉ Firebase không hợp lệ. Thiếu các trường khóa bắt buộc.', 'error');
      } finally {
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  // Bật/tắt trạng thái Push Notification
  const handleToggle = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    try {
      const updated = await integrationApi.toggleFirebasePush(nextState, fcmServerKey);
      onUpdateSuccess(updated);
      success(`Đã ${nextState ? 'kích hoạt' : 'tạm ngắt'} dịch vụ Push Notification (app.fcm.enabled)`);
    } catch {
      setEnabled(!nextState);
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Gửi thông báo thử nghiệm
  const handleTestPing = async () => {
    if (!enabled) {
      showToast('Vui lòng kích hoạt công tắc Push Notification trước khi gửi thông báo thử nghiệm.', 'warning');
      return;
    }

    setIsTestingPing(true);
    try {
      const res = await integrationApi.testFirebasePing();
      if (res.success) {
        success(`MSG-025: Gửi thông báo thử nghiệm thành công! (Độ trễ: ${res.latencyMs}ms)`);
      }
    } catch {
      error('MSG-026: Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.');
    } finally {
      setIsTestingPing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-50 text-[#E5A93C]">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Dịch Vụ Thông Báo Đẩy Di Động (Firebase FCM)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gửi thông báo tức thì đến App Phụ huynh khi con điểm danh đến lớp, nhận thuốc và phát hành học phí
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Trạng thái phát tin:</span>
          <button
            type="button"
            onClick={handleToggle}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border ${
              enabled
                ? 'bg-emerald-50 text-[#1E4D40] border-[#78C2AD]'
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <Power className={`w-3.5 h-3.5 ${enabled ? 'text-[#10B981]' : 'text-slate-400'}`} />
            <span>{enabled ? 'ĐÃ KÍCH HOẠT (ACTIVE)' : 'ĐÃ TẮT'}</span>
          </button>
        </div>
      </div>

      {/* Upload File Certificate Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Tải lên tệp chứng chỉ dịch vụ Firebase (Service Account JSON) <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-3">
            Tệp chứng chỉ tải từ Google Cloud Console (`firebase-service-account.json`), bắt buộc chứa các trường `project_id`, `private_key`, `client_email`.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-[#275A4E] bg-slate-50/70 hover:bg-emerald-50/20 rounded-2xl p-6 text-center cursor-pointer transition group"
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 mx-auto flex items-center justify-center text-slate-500 group-hover:text-[#275A4E] transition mb-3">
              {isUploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-[#275A4E]" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Kéo thả hoặc nhấp chuột để chọn tệp <span className="font-mono text-[#275A4E]">.json</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Định dạng JSON, dung lượng tối đa 2MB</p>
          </div>
        </div>

        {/* Thông tin file đã upload */}
        {uploadedFileDetails && (
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-[#78C2AD] flex items-start gap-3">
            <FileCheck2 className="w-5 h-5 text-[#275A4E] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{uploadedFileDetails.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#78C2AD]/30 text-[#1E4D40] text-[10px] font-bold">
                  HỢP LỆ
                </span>
              </div>
              <p className="text-slate-600">
                <span className="font-semibold">Project ID:</span> {uploadedFileDetails.projectId}
              </p>
              <p className="text-slate-600 break-all">
                <span className="font-semibold">Client Email:</span> {uploadedFileDetails.clientEmail}
              </p>
            </div>
          </div>
        )}

        {/* FCM Server Key bổ sung */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            FCM Server Key (Khóa dự phòng Legacy - Tùy chọn)
          </label>
          <div className="relative">
            <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type={showServerKey ? 'text' : 'password'}
              value={fcmServerKey}
              onChange={(e) => setFcmServerKey(e.target.value)}
              placeholder="Nhập FCM Server Key nếu sử dụng giao thức HTTP v1..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
            />
            <button
              type="button"
              onClick={() => setShowServerKey(!showServerKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showServerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Mã hóa chứng chỉ chuẩn PKCS#8 & lưu trữ bảo mật</span>
          </div>

          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTestingPing}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {isTestingPing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-[#78C2AD]" />}
            <span>Gửi Thông Báo Thử Nghiệm (Test Ping)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTab;
