import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SmsIntegrationConfig, TestSmsResult } from '../../../../types/integration.types';
import { useToast } from '../../../../contexts/ToastContext';
import integrationApi from '../../../../api/integrationApi';
import {
  MessageSquare,
  KeyRound,
  Building,
  Gauge,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  CheckCircle2,
  X,
  PhoneCall,
} from 'lucide-react';

interface SmsTabProps {
  initialConfig: SmsIntegrationConfig;
  onUpdateSuccess: (updated: SmsIntegrationConfig) => void;
}

interface FormValues {
  provider: 'VIETGUYS' | 'ESMS' | 'ZALO_ZNS';
  providerApiKey: string;
  brandName: string;
  rateLimitPerHour: number;
}

export const SmsTab: React.FC<SmsTabProps> = ({ initialConfig, onUpdateSuccess }) => {
  const { success, error } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('0987654321');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<TestSmsResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      provider: initialConfig.provider || 'VIETGUYS',
      providerApiKey: initialConfig.providerApiKey || '',
      brandName: initialConfig.brandName || 'KIDPRO-MAMNON',
      rateLimitPerHour: initialConfig.rateLimitPerHour || 100,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const updated = await integrationApi.updateSmsConfig({
        ...data,
        rateLimitPerHour: Number(data.rateLimitPerHour),
      });
      onUpdateSuccess(updated);
      success('Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công');
    } catch {
      error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(testPhone.trim())) {
      error('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại di động Việt Nam (10 chữ số).');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await integrationApi.testSmsOtp(testPhone.trim());
      setTestResult(res);
      success('Đã gửi mã OTP thử nghiệm thành công!');
    } catch {
      error('Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.');
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Cổng Tin Nhắn Xác Thực (SMS Gateway / OTP)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Gửi mã OTP khôi phục mật khẩu, xác thực đón trẻ khẩn cấp và cảnh báo an toàn qua Brandname trường
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Đã gửi hôm nay:</span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            {initialConfig.sentTodayCount || 42} tin nhắn
          </span>
        </div>
      </div>

      {/* Form Cấu hình */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Provider */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nhà cung cấp dịch vụ SMS Gateway
            </label>
            <select
              {...register('provider')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
            >
              <option value="VIETGUYS">VietGuys SMS Brandname & OTP Gateway</option>
              <option value="ESMS">eSMS Vietnam Multi-Channel</option>
              <option value="ZALO_ZNS">Zalo Notification Service (ZNS)</option>
            </select>
          </div>

          {/* Brandname */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Brandname Tên Trường (Đã đăng ký) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('brandName', { required: 'Vui lòng nhập tên Brandname trường' })}
                placeholder="VD: KIDPRO-MAMNON"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
            </div>
            {errors.brandName && <p className="text-xs text-rose-600 mt-1">{errors.brandName.message}</p>}
          </div>

          {/* Provider API Key */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              SMS Provider API Key / Secret Token <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showApiKey ? 'text' : 'password'}
                {...register('providerApiKey', { required: 'Vui lòng nhập API Key của nhà cung cấp SMS' })}
                placeholder="Nhập khóa API kết nối dịch vụ SMS..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.providerApiKey && <p className="text-xs text-rose-600 mt-1">{errors.providerApiKey.message}</p>}
          </div>

          {/* Hạn mức gửi tin/giờ */}
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-[#275A4E]" />
                Hạn Mức Gửi Tin / Giờ (BR-003 Rate Limit) <span className="text-rose-500">*</span>
              </label>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Quy tắc: Giới hạn số lượng tin nhắn gửi đi tối đa trong mỗi giờ nhằm phòng chống spam và kiểm soát chi phí viễn thông của cơ sở trường.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="10"
                max="1000"
                {...register('rateLimitPerHour', {
                  required: 'Vui lòng nhập hạn mức',
                  min: { value: 10, message: 'Tối thiểu 10 tin/giờ' },
                })}
                className="w-40 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
              <span className="text-xs font-medium text-slate-600">tin nhắn / giờ</span>
            </div>
            {errors.rateLimitPerHour && (
              <p className="text-xs text-rose-600 mt-1">{errors.rateLimitPerHour.message}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsTestModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#275A4E]" />
            <span>Gửi Thử Nghiệm SMS OTP</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#78C2AD]" />}
            <span>Lưu Cấu Hình SMS</span>
          </button>
        </div>
      </form>

      {/* Modal gửi thử nghiệm SMS OTP */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-[#275A4E]" />
                <h3 className="font-bold text-slate-800 text-base">Gửi Thử Nghiệm SMS OTP</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTestModalOpen(false);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestSms} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Số điện thoại nhận tin
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="0987654321"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Tin nhắn mẫu: `[KIDPRO] Ma xac thuc OTP cua ban la: 492817. Ma co hieu luc trong 5 phut.`
                </p>
              </div>

              {testResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-[#78C2AD] text-xs text-[#1E4D40] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#275A4E] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mã phiên: {testResult.messageId}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestModalOpen(false);
                    setTestResult(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs disabled:opacity-60 cursor-pointer"
                >
                  {isSendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Gửi Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsTab;
