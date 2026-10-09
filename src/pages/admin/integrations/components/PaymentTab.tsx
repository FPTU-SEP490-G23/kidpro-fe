import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PaymentIntegrationConfig } from '../../../../types/integration.types';
import { useToast } from '../../../../contexts/ToastContext';
import integrationApi from '../../../../api/integrationApi';
import {
  CreditCard,
  KeyRound,
  ShieldCheck,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  Lock,
} from 'lucide-react';

interface PaymentTabProps {
  initialConfig: PaymentIntegrationConfig;
  onUpdateSuccess: (updated: PaymentIntegrationConfig) => void;
}

interface FormValues {
  provider: 'VIETQR' | 'PAYOS' | 'SEPAY';
  merchantId: string;
  secretKey: string;
  checksumKey: string;
  webhookUrl: string;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({ initialConfig, onUpdateSuccess }) => {
  const { showToast, success, error } = useToast();
  const [showSecret, setShowSecret] = useState(false);
  const [showChecksum, setShowChecksum] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      provider: initialConfig.provider || 'VIETQR',
      merchantId: initialConfig.merchantId || '',
      secretKey: initialConfig.secretKey || '',
      checksumKey: initialConfig.checksumKey || '',
      webhookUrl: initialConfig.webhookUrl || '',
    },
  });

  const currentValues = watch();

  const handleTestWebhook = async () => {
    const url = currentValues.webhookUrl;
    if (!url || !/^https?:\/\/.+/i.test(url)) {
      showToast('MSG-028: Không thể kết nối đến URL Webhook từ bên ngoài. Vui lòng kiểm tra lại tên miền DNS và tường lửa.', 'error');
      setTestResult({
        success: false,
        message: 'MSG-028: Không thể kết nối đến URL Webhook từ bên ngoài. Vui lòng kiểm tra lại tên miền DNS và tường lửa.',
      });
      return;
    }

    setIsTestingWebhook(true);
    setTestResult(null);

    try {
      const res = await integrationApi.testPaymentWebhook(url, currentValues.secretKey);
      if (res.success) {
        success('MSG-025: Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công');
        setTestResult({
          success: true,
          message: res.message,
        });
      } else {
        error('MSG-026: Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.');
        setTestResult({
          success: false,
          message: 'MSG-026: Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.',
        });
      }
    } catch {
      showToast('MSG-028: Không thể kết nối đến URL Webhook từ bên ngoài. Vui lòng kiểm tra lại tên miền DNS và tường lửa.', 'error');
      setTestResult({
        success: false,
        message: 'MSG-028: Không thể kết nối đến URL Webhook từ bên ngoài. Vui lòng kiểm tra lại tên miền DNS và tường lửa.',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const updated = await integrationApi.updatePaymentConfig(data);
      onUpdateSuccess(updated);
      success('MSG-025: Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công');
    } catch {
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  const isConnected = initialConfig.status === 'CONNECTED';

  return (
    <div className="space-y-6">
      {/* Header trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-50 text-[#275A4E]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Cổng Thanh Toán Tự Động & Đối Soát Trực Tuyến</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ tạo mã VietQR động, webhook gạch nợ học phí tức thời qua PayOS / SePay
            </p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              HOẠT ĐỘNG BÌNH THƯỜNG
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              MẤT KẾT NỐI
            </span>
          )}
        </div>
      </div>

      {/* Form Cấu hình */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Cổng dịch vụ */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nhà cung cấp dịch vụ thanh toán
            </label>
            <select
              {...register('provider')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
            >
              <option value="VIETQR">VietQR Chuẩn NAPAS 24/7 (Khuyên dùng)</option>
              <option value="PAYOS">PayOS Open Banking Gateway</option>
              <option value="SEPAY">SePay Webhook Chuyển khoản Tự động</option>
            </select>
          </div>

          {/* Client ID / Merchant ID */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Mã Kết Nối (Client ID / Merchant ID) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('merchantId', { required: 'Vui lòng nhập Client ID / Merchant ID' })}
              placeholder="VD: MCH-KIDPRO-2026 hoặc client_id..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
            />
            {errors.merchantId && <p className="text-xs text-rose-600 mt-1">{errors.merchantId.message}</p>}
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Khóa Bảo Mật (Secret Key) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                {...register('secretKey', { required: 'Vui lòng nhập Secret Key' })}
                placeholder="Nhập Secret Key bảo mật..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.secretKey && <p className="text-xs text-rose-600 mt-1">{errors.secretKey.message}</p>}
          </div>

          {/* Checksum Key */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Khóa Checksum (Checksum Key) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showChecksum ? 'text' : 'password'}
                {...register('checksumKey', { required: 'Vui lòng nhập Checksum Key' })}
                placeholder="Nhập Checksum Key mã hóa HMAC..."
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
              <button
                type="button"
                onClick={() => setShowChecksum(!showChecksum)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showChecksum ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.checksumKey && <p className="text-xs text-rose-600 mt-1">{errors.checksumKey.message}</p>}
          </div>
        </div>

        {/* Webhook URL */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            URL Nhận Webhook Đối Soát (/api/payments/webhook) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              {...register('webhookUrl', {
                required: 'Vui lòng nhập Webhook URL',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'URL Webhook bắt buộc phải có định dạng HTTP hoặc HTTPS hợp lệ',
                },
              })}
              placeholder="https://api.kidpro.edu.vn/api/payments/webhook"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
            />
          </div>
          {errors.webhookUrl && <p className="text-xs text-rose-600 mt-1">{errors.webhookUrl.message}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            Endpoint này sẽ tiếp nhận các sự kiện thông báo giao dịch chuyển khoản thành công từ ngân hàng và tự động gạch nợ hóa đơn.
          </p>
        </div>

        {/* Feedback box */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
              testResult.success
                ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#275A4E] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={isTestingWebhook}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isTestingWebhook ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#275A4E]" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#275A4E]" />
            )}
            <span>Kiểm tra Webhook & Chữ ký mật mã (HMAC-SHA256)</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#78C2AD]" />}
            <span>Lưu Cấu Hình Thanh Toán</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentTab;
