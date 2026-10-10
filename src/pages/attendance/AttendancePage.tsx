import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import {
  Camera,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
  Clock,
  FileText,
  Sparkles,
  Users
} from 'lucide-react';
import { GateAiAttendanceTab } from './tabs/GateAiAttendanceTab';
import { ManualAttendanceTab } from './tabs/ManualAttendanceTab';
import { DismissalPickupTab } from './tabs/DismissalPickupTab';
import { StrangerAlertHandlingTab } from './tabs/StrangerAlertHandlingTab';
import { LatePickupTrackingTab } from './tabs/LatePickupTrackingTab';
import { LeaveRequestReviewTab } from './tabs/LeaveRequestReviewTab';

type AttendanceTabType =
  | 'gate-ai'
  | 'manual-tablet'
  | 'dismissal-pickup'
  | 'stranger-security'
  | 'late-pickup'
  | 'leave-requests';

export const AttendancePage: React.FC = () => {
  const location = useLocation();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<AttendanceTabType>(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as AttendanceTabType | null;
    if (tabParam) return tabParam;
    if (location.pathname === '/teacher/dismissal') return 'dismissal-pickup';
    // For GIAO_VIEN, the classroom attendance tab UC-022 is the primary view
    if (location.pathname === '/teacher/attendance' || role === 'GIAO_VIEN') return 'manual-tablet';
    return 'gate-ai';
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as AttendanceTabType | null;
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.pathname === '/teacher/dismissal') {
      setActiveTab('dismissal-pickup');
    } else if (location.pathname === '/teacher/attendance') {
      setActiveTab('manual-tablet');
    } else if (location.pathname === '/attendance') {
      setActiveTab(role === 'GIAO_VIEN' ? 'manual-tablet' : 'gate-ai');
    }
  }, [location.pathname, location.search, role]);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-10">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2.5">
            <Users className="h-7 w-7 text-[#275A4E]" />
            <span>Quản Lý Điểm Danh &amp; Đón Trả Trẻ Thông Minh</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hệ sinh thái điểm danh AI trạm cổng, dự phòng tablet, an ninh người lạ, đón muộn và xét duyệt nghỉ học
          </p>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#78C2AD]/15 text-[#1E4D40] border border-[#78C2AD]/40">
            <Sparkles className="w-3.5 h-3.5 text-[#275A4E]" />
            <span>AI Face Biometric v2.4</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <span>Bếp Ăn Chốt 08:30</span>
          </span>
        </div>
      </div>

      {/* Modern Tabs Navigation Bar (Scrollable for tablet & desktop) */}
      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar bg-white rounded-2xl p-1.5 shadow-xs border gap-1">
        {/* TAB 1: GATE AI ATTENDANCE (UC-021) */}
        <button
          onClick={() => setActiveTab('gate-ai')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'gate-ai'
              ? 'bg-[#275A4E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Camera className={`h-4 w-4 ${activeTab === 'gate-ai' ? 'text-[#78C2AD]' : 'text-slate-500'}`} />
          <span>Camera Cổng (UC-021)</span>
        </button>

        {/* TAB 2: FALLBACK MANUAL ATTENDANCE ON TABLET (UC-022) */}
        <button
          onClick={() => setActiveTab('manual-tablet')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'manual-tablet'
              ? 'bg-[#275A4E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ClipboardCheck className={`h-4 w-4 ${activeTab === 'manual-tablet' ? 'text-[#78C2AD]' : 'text-slate-500'}`} />
          <span>Điểm Danh Tablet (UC-022)</span>
        </button>

        {/* TAB 3: DISMISSAL AI PICKUP VERIFICATION (UC-023) */}
        <button
          onClick={() => setActiveTab('dismissal-pickup')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'dismissal-pickup'
              ? 'bg-[#275A4E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className={`h-4 w-4 ${activeTab === 'dismissal-pickup' ? 'text-[#78C2AD]' : 'text-slate-500'}`} />
          <span>Trả Trẻ Tan Trường (UC-023)</span>
        </button>

        {/* TAB 4: STRANGER ALERT SECURITY PROTOCOL (UC-024) */}
        <button
          onClick={() => setActiveTab('stranger-security')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'stranger-security'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className={`h-4 w-4 ${activeTab === 'stranger-security' ? 'text-amber-200' : 'text-rose-500'}`} />
          <span>Cảnh Báo Người Lạ (UC-024)</span>
        </button>

        {/* TAB 5: LATE PICKUP TRACKING & OVERTIME BILLING (UC-025) */}
        <button
          onClick={() => setActiveTab('late-pickup')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'late-pickup'
              ? 'bg-[#275A4E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className={`h-4 w-4 ${activeTab === 'late-pickup' ? 'text-[#78C2AD]' : 'text-slate-500'}`} />
          <span>Trẻ Đón Muộn (UC-025)</span>
        </button>

        {/* TAB 6: LEAVE REQUEST REVIEW & ABSENCE APPROVAL (UC-026) */}
        <button
          onClick={() => setActiveTab('leave-requests')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[48px] ${
            activeTab === 'leave-requests'
              ? 'bg-[#275A4E] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className={`h-4 w-4 ${activeTab === 'leave-requests' ? 'text-[#78C2AD]' : 'text-slate-500'}`} />
          <span>Duyệt Nghỉ Học (UC-026)</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="transition-all">
        <ErrorBoundary
          fallbackTitle="Đã xảy ra sự cố tại phân hệ Điểm danh"
          fallbackMessage="Tab điểm danh này gặp lỗi hiển thị dữ liệu tạm thời. Bạn có thể chuyển sang tab khác hoặc bấm thử lại."
        >
          {activeTab === 'gate-ai' && <GateAiAttendanceTab />}
          {activeTab === 'manual-tablet' && <ManualAttendanceTab />}
          {activeTab === 'dismissal-pickup' && <DismissalPickupTab />}
          {activeTab === 'stranger-security' && <StrangerAlertHandlingTab />}
          {activeTab === 'late-pickup' && <LatePickupTrackingTab />}
          {activeTab === 'leave-requests' && <LeaveRequestReviewTab />}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AttendancePage;
