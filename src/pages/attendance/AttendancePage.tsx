import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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
import { BusAttendanceTab } from './tabs/BusAttendanceTab';
import { ClassroomEquipmentIncidentTab } from './tabs/ClassroomEquipmentIncidentTab';
import { TeacherChatTab } from './tabs/TeacherChatTab';
import { Bus, Wrench, MessageSquare } from 'lucide-react';

type AttendanceTabType =
  | 'gate-ai'
  | 'manual-tablet'
  | 'dismissal-pickup'
  | 'stranger-security'
  | 'late-pickup'
  | 'leave-requests'
  | 'bus-attendance'
  | 'equipment-incidents'
  | 'teacher-chat';

interface TabMeta {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  specialColor?: 'alert';
}

const TAB_META: Record<AttendanceTabType, TabMeta> = {
  'gate-ai': {
    title: 'Điểm Danh AI Trạm Cổng (Live Camera Trực Tiếp)',
    description: 'Nhận diện tự động học sinh và phụ huynh khi qua cổng trường bằng webcam máy tính, kích hoạt viền xanh Mint Green (< 2s) và gửi thông báo tức thì.',
    icon: Camera,
    badge: 'Live Webcam AI',
  },
  'manual-tablet': {
    title: 'Điểm Danh Thủ Công Dự Phòng Trên Tablet',
    description: 'Dành cho giáo viên chủ nhiệm tại lớp: điểm danh có mặt/vắng mặt, ghi chú lý do và đồng bộ tức thời tới báo bếp lúc 08:30.',
    icon: ClipboardCheck,
    badge: 'Chuyên Cần Lớp',
  },
  'dismissal-pickup': {
    title: 'Xác Thực Người Đón Tan Trường AI (Live Camera Trực Tiếp)',
    description: 'Xác thực danh tính người đón trẻ bằng live camera máy tính đối chiếu hồ sơ người giám hộ hoặc mã QR ủy quyền hợp lệ.',
    icon: ShieldCheck,
    badge: 'Live Camera Người Đón',
  },
  'bus-attendance': {
    title: 'Điểm Danh Xe Buýt & Chốt Khoang Xe Rỗng An Toàn',
    description: 'Quản lý học sinh đón/trả tại từng trạm xe buýt và thực hiện quy trình bắt buộc xác nhận khoang xe rỗng tránh bỏ quên trẻ.',
    icon: Bus,
    badge: 'Xe Buýt Đưa Đón',
  },
  'equipment-incidents': {
    title: 'Báo Cáo Hư Hỏng Thiết Bị & Cơ Sở Vật Chất Phòng Học',
    description: 'Ghi nhận và tải ảnh hiện trạng thiết bị hư hỏng (quạt, điều hòa, bóng đèn...) để bộ phận kỹ thuật kịp thời sửa chữa.',
    icon: Wrench,
    badge: 'CSVC Phòng Học',
  },
  'teacher-chat': {
    title: 'Kênh Trao Đổi Tin Nhắn Với Phụ Huynh & Lớp Học',
    description: 'Giao tiếp hai chiều tức thời: Nhóm chat toàn lớp và Hội thoại riêng 1-1 với phụ huynh của từng học sinh.',
    icon: MessageSquare,
    badge: 'Chat Trực Tuyến',
  },
  'stranger-security': {
    title: 'Quy Trình Xử Lý Cảnh Báo Người Lạ Tại Cổng',
    description: 'Kích hoạt còi báo động bảo vệ, chụp ảnh lưu vết và yêu cầu xuất trình CCCD đối với đối tượng lạ mặt chưa đăng ký ủy quyền.',
    icon: ShieldAlert,
    badge: 'An Ninh Báo Động',
    specialColor: 'alert',
  },
  'late-pickup': {
    title: 'Ghi Nhận Mốc Giờ Trẻ Đón Muộn & Tính Phụ Phí',
    description: 'Tự động tính thời gian đón muộn sau 17:30, áp dụng khung lũy tiến theo chính sách tài chính và gửi thông báo tới phụ huynh.',
    icon: Clock,
    badge: 'Phụ Phí Ngoài Giờ',
  },
  'leave-requests': {
    title: 'Tiếp Nhận & Duyệt Đơn Xin Nghỉ Học',
    description: 'Giáo viên chủ nhiệm xét duyệt đơn xin nghỉ học của phụ huynh, tự động cập nhật trạng thái điểm danh và báo bếp hoàn tiền ăn.',
    icon: FileText,
    badge: 'Xét Duyệt Nghỉ Học',
  },
};

export const AttendancePage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { role } = useAuth();

  const resolveTab = (param: string | null): AttendanceTabType => {
    if (param && param in TAB_META) {
      return param as AttendanceTabType;
    }
    if (location.pathname === '/teacher/dismissal') return 'dismissal-pickup';
    if (location.pathname === '/teacher/attendance' || role === 'GIAO_VIEN') return 'manual-tablet';
    return 'gate-ai';
  };

  const [activeTab, setActiveTab] = useState<AttendanceTabType>(() => {
    return resolveTab(searchParams.get('tab'));
  });

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get('tab')));
  }, [location.pathname, searchParams, role]);

  const currentMeta = TAB_META[activeTab] || TAB_META['gate-ai'];
  const MetaIcon = currentMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ ĐIỂM DANH (ĐỘNG THEO USE CASE, HOÀN TOÀN KHÔNG CÓ THANH SCROLL NGANG) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentMeta.specialColor === 'alert'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#E5A93C] text-slate-950'
              } shadow-xs`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Điểm Danh & Đón Trả</span>
            </span>
            {currentMeta.badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
                {currentMeta.badge}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-100 border border-white/15">
              Bếp Ăn Chốt 08:30
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-[#78C2AD] shrink-0">
              <MetaIcon className="h-5 w-5" />
            </div>
            <span>{currentMeta.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl">
            {currentMeta.description}
          </p>
        </div>
      </div>

      {/* Tab Panels (Render trực tiếp không còn thanh scroll ngang làm rối mắt) */}
      <div className="transition-all">
        <ErrorBoundary
          fallbackTitle="Đã xảy ra sự cố tại phân hệ Điểm danh"
          fallbackMessage="Tab điểm danh này gặp lỗi hiển thị dữ liệu tạm thời. Bạn có thể chuyển sang tab khác hoặc bấm thử lại."
        >
          {activeTab === 'gate-ai' && <GateAiAttendanceTab />}
          {activeTab === 'manual-tablet' && <ManualAttendanceTab />}
          {activeTab === 'dismissal-pickup' && <DismissalPickupTab />}
          {activeTab === 'bus-attendance' && <BusAttendanceTab />}
          {activeTab === 'equipment-incidents' && <ClassroomEquipmentIncidentTab />}
          {activeTab === 'teacher-chat' && <TeacherChatTab />}
          {activeTab === 'stranger-security' && <StrangerAlertHandlingTab />}
          {activeTab === 'late-pickup' && <LatePickupTrackingTab />}
          {activeTab === 'leave-requests' && <LeaveRequestReviewTab />}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default AttendancePage;

