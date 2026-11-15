import React, { useState } from 'react';
import {
  ShieldCheck,
  Camera,
  QrCode,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { DismissalPickupTab } from '../attendance/tabs/DismissalPickupTab';
import { LatePickupTrackingTab } from '../attendance/tabs/LatePickupTrackingTab';
import { StrangerAlertHandlingTab } from '../attendance/tabs/StrangerAlertHandlingTab';

export const TeacherDismissalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pickup' | 'late' | 'security'>('pickup');

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
              Tan Học & An Ninh Trả Trẻ
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
            Quản Lý Tan Học & Xác Thực Người Đón
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Xác minh danh tính phụ huynh/người giám hộ bằng AI khuôn mặt, ghi nhận giờ trả trẻ và cảnh báo đối tượng lạ
          </p>
        </div>

        {/* Tab Switcher Responsive */}
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold w-full md:w-auto">
          <button
            onClick={() => setActiveTab('pickup')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'pickup'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Xác thực đón</span>
          </button>
          <button
            onClick={() => setActiveTab('late')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'late'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Đón muộn</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'security'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Cảnh báo người lạ</span>
          </button>
        </div>
      </div>

      {/* Nội dung tab */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        {activeTab === 'pickup' && <DismissalPickupTab />}
        {activeTab === 'late' && <LatePickupTrackingTab />}
        {activeTab === 'security' && <StrangerAlertHandlingTab />}
      </div>
    </div>
  );
};

export default TeacherDismissalPage;
