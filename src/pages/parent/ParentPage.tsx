import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import {
  Baby,
  Receipt,
  QrCode,
  RefreshCw,
  Camera,
  Users,
  Calendar,
  Pill,
  CheckCircle2,
  AlertCircle,
  Bell,
  FileCheck2,
  Star,
  ShieldAlert,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import parentApi from '../../api/parentApi';
import { StudentFaceBiometricTab } from './tabs/StudentFaceBiometricTab';
import { AuthorizedGuardiansTab } from './tabs/AuthorizedGuardiansTab';
import { EmergencyPickupTab } from './tabs/EmergencyPickupTab';
import { LeaveRequestTab } from './tabs/LeaveRequestTab';
import { MedicationRequestTab } from './tabs/MedicationRequestTab';
import { GateNotificationsTab } from './tabs/GateNotificationsTab';
import { TuitionInvoicesTab } from './tabs/TuitionInvoicesTab';
import { StudentAffairsPetitionTab } from './tabs/StudentAffairsPetitionTab';
import { ServiceSurveyTab } from './tabs/ServiceSurveyTab';
import { BiometricPurgeDecree13Tab } from './tabs/BiometricPurgeDecree13Tab';

interface StudentOption {
  id: string;
  fullName: string;
  className: string;
}

export type ParentTabKey =
  | 'gate-notifications'
  | 'leave'
  | 'emergency-pickup'
  | 'medication'
  | 'face-biometric'
  | 'guardians'
  | 'invoice'
  | 'petitions'
  | 'survey'
  | 'privacy-decree13';

export const ParentPage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<ParentTabKey>(() => {
    if (location.pathname === '/parent/children') return 'face-biometric';
    if (location.pathname === '/parent/daily-care') return 'gate-notifications';
    if (location.pathname === '/parent/tuition') return 'invoice';
    if (location.pathname === '/parent/interactions') return 'petitions';
    return 'gate-notifications';
  });

  useEffect(() => {
    if (location.pathname === '/parent/children') {
      setActiveTab('face-biometric');
    } else if (location.pathname === '/parent/daily-care') {
      setActiveTab('gate-notifications');
    } else if (location.pathname === '/parent/tuition') {
      setActiveTab('invoice');
    } else if (location.pathname === '/parent/interactions') {
      setActiveTab('petitions');
    }
  }, [location.pathname]);
  const [students, setStudents] = useState<StudentOption[]>([
    {
      id: 'STU-001',
      fullName: 'Nguyễn Minh Khang',
      className: 'Mầm 1 (3-4 Tuổi)',
    },
    {
      id: 'STU-002',
      fullName: 'Nguyễn Thảo Linh',
      className: 'Chồi 2 (4-5 Tuổi)',
    },
  ]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('STU-001');
  const [isLoading, setIsLoading] = useState(true);

  // Trạng thái điểm danh hôm nay của bé (phục vụ đối soát UC-043)
  const [isStudentPresentToday, setIsStudentPresentToday] = useState(true);

  // 1. Tải danh sách học sinh
  const loadParentData = async () => {
    setIsLoading(true);
    try {
      let studentsData: any[] | null = null;
      try {
        const { data, error } = await supabase
          .schema('academic')
          .from('students')
          .select('id, full_name, class_id');
        if (!error && data && data.length > 0) studentsData = data;
        else {
          const { data: pubData } = await supabase.from('students').select('id, full_name, class_id');
          if (pubData && pubData.length > 0) studentsData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase.from('students').select('id, full_name, class_id');
        if (pubData && pubData.length > 0) studentsData = pubData;
      }

      let classesData: any[] | null = null;
      try {
        const { data, error } = await supabase.schema('core').from('classes').select('id, name');
        if (!error && data) classesData = data;
        else {
          const { data: pubData } = await supabase.from('classes').select('id, name');
          if (pubData) classesData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase.from('classes').select('id, name');
        if (pubData) classesData = pubData;
      }

      if (studentsData && studentsData.length > 0) {
        const mappedStu: StudentOption[] = studentsData.map((s: any) => {
          const matchedClass = classesData?.find((c: any) => c.id === s.class_id);
          return {
            id: s.id,
            fullName: s.full_name || 'Học sinh',
            className: matchedClass?.name || 'Mầm 1 (3-4 Tuổi)',
          };
        });
        setStudents(mappedStu);
        setSelectedStudentId((prev) => (mappedStu.some((s) => s.id === prev) ? prev : mappedStu[0].id));
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu phụ huynh:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, []);

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Lấy số lượng thông báo cổng chưa đọc (UC-046 badge)
  const { data: notifications = [] } = useQuery({
    queryKey: ['gate-notifications', currentStudent?.id],
    queryFn: () => parentApi.getGateNotifications(currentStudent?.id),
    staleTime: 5000,
  });

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header trang & Thông tin Con (Hệ màu thương hiệu: #275A4E -> #1E4D40) */}
      <div className="rounded-3xl bg-linear-to-r from-[#275A4E] via-[#1E4D40] to-[#14382F] p-6 md:p-8 text-white shadow-lg shadow-[#275A4E]/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2 border border-white/20">
            <Baby className="h-3.5 w-3.5 text-[#E5A93C]" />
            <span>Cổng Phụ Huynh Học Sinh • Hệ Thống Mầm Non KidPro</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {currentStudent ? `Bé ${currentStudent.fullName}` : 'Cổng Phụ Huynh Trực Tuyến'}
          </h2>
          <p className="mt-1 text-xs text-emerald-100/90 max-w-xl">
            Lớp <strong>{currentStudent?.className}</strong> • Quản lý điểm danh cổng AI, xin nghỉ học, dặn thuốc, đón hộ khẩn cấp và thanh toán VietQR 1-chạm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn con nếu có nhiều bé */}
          {students.length > 1 && (
            <div className="rounded-xl bg-white/15 backdrop-blur-md px-3 py-1.5 border border-white/20 text-xs">
              <label className="text-[11px] text-emerald-200 block mb-0.5 font-medium">Chọn con:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-hidden cursor-pointer"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.fullName} ({s.className})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trạng thái có mặt hôm nay (Toggle kiểm thử UC-043) */}
          <button
            type="button"
            onClick={() => setIsStudentPresentToday((prev) => !prev)}
            title="Nhấp để chuyển trạng thái kiểm thử có mặt / vắng mặt cho UC-043"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold backdrop-blur-md transition border ${
              isStudentPresentToday
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 hover:bg-emerald-500/35'
                : 'bg-rose-500/25 border-rose-400 text-rose-100 hover:bg-rose-500/35'
            }`}
          >
            {isStudentPresentToday ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#78C2AD]" />
                <span>Bé đang có mặt (07:45 AM)</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-rose-300" />
                <span>Bé vắng mặt hôm nay</span>
              </>
            )}
          </button>

          <button
            onClick={loadParentData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-semibold backdrop-blur-md hover:bg-white/25 transition text-white border border-white/20"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Tabs Điều Hướng (Hệ màu #275A4E, viền và badge rõ nét) */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1 bg-white p-1 rounded-2xl shadow-2xs">
        {/* Tab 1: UC-046 */}
        <button
          onClick={() => setActiveTab('gate-notifications')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] relative ${
            activeTab === 'gate-notifications'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>UC-046: Thông Báo Cổng</span>
          {unreadNotifCount > 0 && (
            <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[10px] font-extrabold shadow-xs">
              {unreadNotifCount}
            </span>
          )}
        </button>

        {/* Tab 2: UC-044 */}
        <button
          onClick={() => setActiveTab('leave')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'leave'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>UC-044: Xin Nghỉ Học Trực Tuyến</span>
        </button>

        {/* Tab 3: UC-043 */}
        <button
          onClick={() => setActiveTab('emergency-pickup')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'emergency-pickup'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>UC-043: Đón Hộ Đột Xuất (QR)</span>
        </button>

        {/* Tab 4: UC-045 */}
        <button
          onClick={() => setActiveTab('medication')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'medication'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Pill className="h-4 w-4" />
          <span>UC-045: Dặn Thuốc Điện Tử</span>
        </button>

        {/* Tab 5: UC-041 */}
        <button
          onClick={() => setActiveTab('face-biometric')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'face-biometric'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Camera className="h-4 w-4" />
          <span>UC-041: Mặt Bé AI</span>
        </button>

        {/* Tab 6: UC-042 */}
        <button
          onClick={() => setActiveTab('guardians')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'guardians'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>UC-042: Người Thân Đón Bé</span>
        </button>

        {/* Tab 7: UC-047 & UC-048 */}
        <button
          onClick={() => setActiveTab('invoice')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'invoice'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>UC-047/048/049: Học Phí & Biên Lai</span>
        </button>

        {/* Tab 8: UC-050 */}
        <button
          onClick={() => setActiveTab('petitions')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'petitions'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>UC-050: Đơn Sự Vụ Học Đường</span>
        </button>

        {/* Tab 9: UC-068 */}
        <button
          onClick={() => setActiveTab('survey')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'survey'
              ? 'bg-[#275A4E] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Star className="h-4 w-4 text-[#E5A93C]" />
          <span>UC-068: Khảo Sát Dịch Vụ</span>
        </button>

        {/* Tab 10: UC-069 */}
        <button
          onClick={() => setActiveTab('privacy-decree13')}
          className={`py-3 px-4 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'privacy-decree13'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />
          <span>UC-069: Quyền Xóa Sinh Trắc Học (NĐ 13)</span>
        </button>
      </div>

      {/* ================= NỘI DUNG TỪNG TAB ================= */}

      {/* Tab 1: UC-046 - Nhận Thông Báo Điểm Danh & Đón Trả Kèm Ảnh */}
      {activeTab === 'gate-notifications' && (
        <GateNotificationsTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 2: UC-044 - Nộp Đơn Xin Nghỉ Học Trực Tuyến */}
      {activeTab === 'leave' && (
        <LeaveRequestTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 3: UC-043 - Ủy Quyền Đón Hộ Đột Xuất Trong Ngày */}
      {activeTab === 'emergency-pickup' && (
        <EmergencyPickupTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
          isStudentPresentToday={isStudentPresentToday}
        />
      )}

      {/* Tab 4: UC-045 - Gửi Đơn Dặn Thuốc Điện Tử */}
      {activeTab === 'medication' && (
        <MedicationRequestTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 5: UC-041 - Đăng Ký Sinh Trắc Học Khuôn Mặt Bé */}
      {activeTab === 'face-biometric' && (
        <StudentFaceBiometricTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
        />
      )}

      {/* Tab 6: UC-042 - Đăng Ký Danh Sách Người Thân Đón Bé */}
      {activeTab === 'guardians' && (
        <AuthorizedGuardiansTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
        />
      )}

      {/* Tab 7: UC-047, UC-048 & UC-049 - Xem Bảng Kê Học Phí, Khấu Trừ & Thanh Toán VietQR, Tải Biên Lai */}
      {activeTab === 'invoice' && (
        <TuitionInvoicesTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 8: UC-050 - Nộp Đơn Yêu Cầu Sự Vụ Học Sinh (Giấy xác nhận, đổi tuyến buýt, trích lục...) */}
      {activeTab === 'petitions' && (
        <StudentAffairsPetitionTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 9: UC-068 - Khảo Sát Ý Kiến & Đánh Giá Dịch Vụ Mầm Non */}
      {activeTab === 'survey' && (
        <ServiceSurveyTab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}

      {/* Tab 10: UC-069 - Quyền Xóa Dữ Liệu Sinh Trắc Học (Điều 16 Nghị định 13/2023/NĐ-CP) */}
      {activeTab === 'privacy-decree13' && (
        <BiometricPurgeDecree13Tab
          studentId={currentStudent?.id || 'STU-001'}
          studentName={currentStudent?.fullName || 'Nguyễn Minh Khang'}
          className={currentStudent?.className || 'Mầm 1 (3-4 Tuổi)'}
        />
      )}
    </div>
  );
};

export default ParentPage;
