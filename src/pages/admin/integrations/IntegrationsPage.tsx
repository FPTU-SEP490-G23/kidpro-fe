import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import integrationApi from '../../../api/integrationApi';
import { PlatformIntegrations } from '../../../types/integration.types';
import PaymentTab from './components/PaymentTab';
import FirebaseTab from './components/FirebaseTab';
import FaceAiTab from './components/FaceAiTab';
import SmsTab from './components/SmsTab';
import {
  CreditCard,
  BellRing,
  ScanFace,
  MessageSquare,
  Sliders,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'PAYMENT' | 'FIREBASE' | 'FACE_AI' | 'SMS'>('PAYMENT');

  const { data: integrations, isLoading, refetch, isFetching } = useQuery<PlatformIntegrations>({
    queryKey: ['admin-integrations-config'],
    queryFn: () => integrationApi.getIntegrations(),
  });

  const handleUpdatePayment = (updated: any) => {
    queryClient.setQueryData(['admin-integrations-config'], (old: any) => ({
      ...old,
      payment: updated,
    }));
  };

  const handleUpdateFirebase = (updated: any) => {
    queryClient.setQueryData(['admin-integrations-config'], (old: any) => ({
      ...old,
      firebase: updated,
    }));
  };

  const handleUpdateFaceAi = (updated: any) => {
    queryClient.setQueryData(['admin-integrations-config'], (old: any) => ({
      ...old,
      aiService: updated,
    }));
  };

  const handleUpdateSms = (updated: any) => {
    queryClient.setQueryData(['admin-integrations-config'], (old: any) => ({
      ...old,
      sms: updated,
    }));
  };

  if (isLoading || !integrations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#275A4E]" />
        <p className="text-sm font-medium">Đang tải cấu hình kết nối dịch vụ ngoại vi...</p>
      </div>
    );
  }

  const tabs = [
    {
      id: 'PAYMENT' as const,
      name: 'Cổng Thanh Toán Tự Động',
      icon: CreditCard,
      status: integrations.payment.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
      subtext: 'VietQR / PayOS / SePay',
    },
    {
      id: 'FIREBASE' as const,
      name: 'Thông Báo Đẩy Di Động',
      icon: BellRing,
      status: integrations.firebase.enabled ? 'CONNECTED' : 'DISCONNECTED',
      subtext: 'Firebase Cloud Messaging (FCM)',
    },
    {
      id: 'FACE_AI' as const,
      name: 'Nhận Diện AI Khuôn Mặt',
      icon: ScanFace,
      status: integrations.aiService.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
      subtext: 'Python Face AI Microservice',
    },
    {
      id: 'SMS' as const,
      name: 'Cổng Tin Nhắn Xác Thực',
      icon: MessageSquare,
      status: integrations.sms.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED',
      subtext: 'Brandname OTP Gateway',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
              Platform Integrations
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">Super Admin Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1">
            Cấu Hình Dịch Vụ & Tích Hợp Ngoại Vi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Thiết lập tham số API, endpoint webhook, key kết nối bảo mật cho hệ thống thanh toán, thông báo, camera AI và cổng tin nhắn
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start md:self-auto px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#275A4E] ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới kết nối</span>
        </button>
      </div>

      {/* 4 Tabs Điều Hướng Chuyên Biệt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isLive = tab.status === 'CONNECTED';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden cursor-pointer ${
                isActive
                  ? 'bg-white border-[#275A4E] shadow-md ring-2 ring-[#275A4E]/20'
                  : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-2.5 rounded-xl transition ${
                    isActive ? 'bg-[#275A4E] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    isLive
                      ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isLive ? 'bg-[#10B981] animate-pulse' : 'bg-slate-400'
                    }`}
                  ></span>
                  {isLive ? 'SẴN SÀNG' : 'CHƯA BẬT'}
                </span>
              </div>

              <div className="mt-3">
                <h2 className="text-sm font-bold text-slate-800">{tab.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{tab.subtext}</p>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#275A4E]"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Nội dung Tab đang chọn */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'PAYMENT' && (
          <PaymentTab
            initialConfig={integrations.payment}
            onUpdateSuccess={handleUpdatePayment}
          />
        )}
        {activeTab === 'FIREBASE' && (
          <FirebaseTab
            initialConfig={integrations.firebase}
            onUpdateSuccess={handleUpdateFirebase}
          />
        )}
        {activeTab === 'FACE_AI' && (
          <FaceAiTab
            initialConfig={integrations.aiService}
            onUpdateSuccess={handleUpdateFaceAi}
          />
        )}
        {activeTab === 'SMS' && (
          <SmsTab
            initialConfig={integrations.sms}
            onUpdateSuccess={handleUpdateSms}
          />
        )}
      </div>
    </div>
  );
};

export default IntegrationsPage;
