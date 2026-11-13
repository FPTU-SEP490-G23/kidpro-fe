import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AiServiceIntegrationConfig, AiPingResult } from '../../../../types/integration.types';
import { useToast } from '../../../../contexts/ToastContext';
import integrationApi from '../../../../api/integrationApi';
import {
  ScanFace,
  Server,
  KeyRound,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface FaceAiTabProps {
  initialConfig: AiServiceIntegrationConfig;
  onUpdateSuccess: (updated: AiServiceIntegrationConfig) => void;
}

interface FormValues {
  baseUrl: string;
  apiKey: string;
  threshold: number;
}

export const FaceAiTab: React.FC<FaceAiTabProps> = ({ initialConfig, onUpdateSuccess }) => {
  const { success, error } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pingResult, setPingResult] = useState<AiPingResult | null>(
    initialConfig.latencyMs
      ? {
          status: initialConfig.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
          latencyMs: initialConfig.latencyMs,
          message: `Đã kết nối ổn định (${initialConfig.latencyMs}ms)`,
        }
      : null
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      baseUrl: initialConfig.baseUrl || 'https://ai-face.kidpro.edu.vn/api/v1',
      apiKey: initialConfig.apiKey || '',
      threshold: initialConfig.threshold ?? 0.75,
    },
  });

  const thresholdValue = watch('threshold');
  const baseUrlValue = watch('baseUrl');
  const apiKeyValue = watch('apiKey');

  // Ping kiểm tra độ trễ mạng thời gian thực
  const handlePing = async () => {
    if (!baseUrlValue) {
      error('Vui lòng nhập địa chỉ máy chủ AI Base URL');
      return;
    }

    setIsPinging(true);
    setPingResult(null);

    try {
      const res = await integrationApi.pingAiService(baseUrlValue, apiKeyValue);
      setPingResult(res);
      success(`Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công (${res.latencyMs}ms)`);
    } catch {
      setPingResult({
        status: 'DISCONNECTED',
        latencyMs: 0,
        message: 'Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.',
      });
      error('Xác thực với dịch vụ bên thứ ba thất bại. Vui lòng kiểm tra lại thông tin API.');
    } finally {
      setIsPinging(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const updated = await integrationApi.updateAiConfig({
        ...data,
        threshold: Number(data.threshold),
      });
      onUpdateSuccess(updated);
      success('Cấu hình và kiểm tra kết nối dịch vụ ngoại vi thành công');
    } catch {
      error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trạng thái */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal-50 text-[#275A4E]">
            <ScanFace className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Vi Dịch Vụ Nhận Diện AI Khuôn Mặt (Face AI Microservice)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Phân tích vector đặc trưng khuôn mặt tại cổng trường để tự động hóa điểm danh đón/trả trẻ
            </p>
          </div>
        </div>

        <div>
          {pingResult?.status === 'CONNECTED' ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
              {pingResult.latencyMs}ms - ĐÃ KẾT NỐI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
              CHƯA KIỂM TRA
            </span>
          )}
        </div>
      </div>

      {/* Cam kết tuân thủ Nghị định 13/2023/NĐ-CP */}
      <div className="p-4 rounded-2xl bg-[#EAF4F1] border border-[#78C2AD]/60 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#275A4E] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <p className="font-bold text-[#1E4D40] mb-0.5">
            Quy định bảo vệ dữ liệu cá nhân & sinh trắc học trẻ em (Nghị định 13/2023/NĐ-CP):
          </p>
          <p>
            Hệ thống chỉ lưu trữ các vector embedding đã mã hóa 512-chiều nhằm phục vụ đối chiếu điểm danh nội bộ tại cổng trường. Tuyệt đối không chia sẻ hoặc lưu ảnh gốc công khai.
          </p>
        </div>
      </div>

      {/* Form Cấu hình */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Base URL */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Địa Chỉ Máy Chủ AI (Base URL Endpoint) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Server className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                {...register('baseUrl', {
                  required: 'Vui lòng nhập URL máy chủ AI',
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: 'URL phải bắt đầu bằng http:// hoặc https://',
                  },
                })}
                placeholder="https://ai-face.kidpro.edu.vn/api/v1"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              />
            </div>
            {errors.baseUrl && <p className="text-xs text-rose-600 mt-1">{errors.baseUrl.message}</p>}
          </div>

          {/* API Key */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Khóa API / Secret Token <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showApiKey ? 'text' : 'password'}
                {...register('apiKey', { required: 'Vui lòng nhập API Key' })}
                placeholder="Nhập khóa API nhận diện khuôn mặt..."
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
            {errors.apiKey && <p className="text-xs text-rose-600 mt-1">{errors.apiKey.message}</p>}
          </div>

          {/* Ngưỡng tin cậy (Threshold) */}
          <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#275A4E]" />
                Ngưỡng Tin Cậy Tối Thiểu (Recognition Threshold)
              </label>
              <span className="text-sm font-bold text-[#275A4E] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-[#78C2AD]/50">
                {Math.round((thresholdValue || 0.75) * 100)}% ({thresholdValue || 0.75})
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Mặc định khuyến nghị: **75% (0.75)**. Ngưỡng cao hơn giúp tránh nhận diện nhầm nhưng có thể yêu cầu góc chụp rõ hơn; ngưỡng thấp hơn tăng độ nhạy trong điều kiện ánh sáng yếu.
            </p>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={thresholdValue || 0.75}
                onChange={(e) => setValue('threshold', parseFloat(e.target.value))}
                className="flex-1 accent-[#275A4E] h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex gap-1.5">
                {[0.65, 0.75, 0.85].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setValue('threshold', preset)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition cursor-pointer ${
                      thresholdValue === preset
                        ? 'bg-[#275A4E] text-white border-[#275A4E]'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {Math.round(preset * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handlePing}
            disabled={isPinging}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium transition flex items-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {isPinging ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[#275A4E]" />
            ) : (
              <Zap className="w-4 h-4 text-[#E5A93C]" />
            )}
            <span>Kiểm tra Kết nối (Ping AI Endpoint)</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-2xs disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#78C2AD]" />}
            <span>Lưu Cấu Hình AI</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default FaceAiTab;
