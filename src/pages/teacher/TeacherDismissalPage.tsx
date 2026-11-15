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
} from 'lucide-react';
import { DismissalPickupTab } from '../attendance/tabs/DismissalPickupTab';
import { LatePickupTrackingTab } from '../attendance/tabs/LatePickupTrackingTab';
import { StrangerAlertHandlingTab } from '../attendance/tabs/StrangerAlertHandlingTab';

export const TeacherDismissalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pickup' | 'late' | 'security'>('pickup');

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Quản Lý Tan Học & Trả Trẻ</h1>
          <p className="text-xs text-slate-500 font-medium">Xác thực người đón & giám sát giờ về</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pickup')}
          className={`py-2 rounded-xl transition-all touch-target ${
            activeTab === 'pickup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Xác thực đón
        </button>
        <button
          onClick={() => setActiveTab('late')}
          className={`py-2 rounded-xl transition-all touch-target ${
            activeTab === 'late' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Đón muộn
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 rounded-xl transition-all touch-target ${
            activeTab === 'security' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'
          }`}
        >
          Người lạ
        </button>
      </div>

      {/* Nội dung tab */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        {activeTab === 'pickup' && <DismissalPickupTab />}
        {activeTab === 'late' && <LatePickupTrackingTab />}
        {activeTab === 'security' && <StrangerAlertHandlingTab />}
      </div>
    </div>
  );
};
