import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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

interface ParentTabMeta {
  uc: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  specialColor?: 'alert';
}

export const PARENT_TAB_META: Record<ParentTabKey, ParentTabMeta> = {
  'gate-notifications': {
    uc: 'UC-046',
    title: 'Thông Báo Đón Trả Kèm Ảnh (Real-time Gate Timeline)',
    description: 'Nhận thông báo kèm hình ảnh con check-in/check-out qua cổng trường từ camera AI (< 2s) thời gian thực.',
    icon: Bell,
    badge: 'Thông Báo AI',
  },
  leave: {
    uc: 'UC-044',
    title: 'Nộp Đơn Xin Nghỉ Học Trực Tuyến',
    description: 'Phụ huynh gửi đơn xin nghỉ ốm, việc bận trước 08:30 sáng để cô giáo chủ nhiệm duyệt và bếp bán trú hoàn tiền ăn.',
    icon: Calendar,
    badge: 'Đơn Xin Nghỉ',
  },
  'emergency-pickup': {
    uc: 'UC-043',
    title: 'Ủy Quyền Đón Hộ Đột Xuất Bằng Mã QR 1-Lần',
    description: 'Sinh mã QR dùng một lần cấp cho người thân đến đón bé đột xuất trong ngày, xác thực an toàn tuyệt đối tại cổng.',
    icon: QrCode,
    badge: 'QR Đón Hộ',
  },
  medication: {
    uc: 'UC-045',
    title: 'Gửi Đơn Dặn Thuốc Điện Tử Cho Bé',
    description: 'Gửi đơn thuốc, liều dùng, hướng dẫn bảo quản và nhận ảnh chụp xác thực từ cô giáo lúc 14:00 chiều.',
    icon: Pill,
    badge: 'Dặn Thuốc',
  },
  'face-biometric': {
    uc: 'UC-041',
    title: 'Đăng Ký & Quản Lý Khuôn Mặt Của Bé',
    description: 'Cập nhật ảnh chân dung của con để hệ thống trạm AI tại cổng nhận diện tự động khi đón trả trường.',
    icon: Camera,
    badge: 'Sinh Trắc Học AI',
  },
  guardians: {
    uc: 'UC-042',
    title: 'Danh Sách Người Thân Đón Bé Ủy Quyền',
    description: 'Đăng ký thông tin ông bà, bố mẹ, người giám hộ được phép đón trẻ kèm CCCD để giáo vụ phê duyệt.',
    icon: Users,
    badge: 'Người Thân Đón',
  },
  invoice: {
    uc: 'UC-047/048/049',
    title: 'Bảng Kê Học Phí & Thanh Toán VietQR 1-Chạm',
    description: 'Tra cứu hóa đơn học phí chi tiết, chính sách miễn giảm, hoàn tiền ăn và quét mã VietQR PayOS chuyển khoản tức thì.',
    icon: Receipt,
    badge: 'Học Phí VietQR',
  },
  petitions: {
    uc: 'UC-050',
    title: 'Nộp Đơn Yêu Cầu Sự Vụ Học Sinh & Góp Ý',
    description: 'Gửi đơn đề đạt nguyện vọng, kiến nghị hoặc trao đổi các sự vụ học đường trực tiếp tới ban giám hiệu và giáo vụ.',
    icon: FileCheck2,
    badge: 'Sự Vụ Học Sinh',
  },
  survey: {
    uc: 'UC-068',
    title: 'Khảo Sát Ý Kiến & Đánh Giá Chất Lượng Dịch Vụ',
    description: 'Đóng góp ý kiến về chất lượng bữa ăn bán trú, chương trình giảng dạy và dịch vụ chăm sóc mầm non của nhà trường.',
    icon: Star,
    badge: 'Khảo Sát Dịch Vụ',
  },
  'privacy-decree13': {
    uc: 'UC-069',
    title: 'Quyền Xóa Dữ Liệu Sinh Trắc Học (Nghị Định 13/2023/NĐ-CP)',
    description: 'Yêu cầu xóa toàn bộ dữ liệu vector khuôn mặt của trẻ và chuyển đổi sang phương thức thẻ từ/thủ công bảo mật.',
    icon: ShieldAlert,
    badge: 'Nghị Định 13',
    specialColor: 'alert',
  },
};

export const ParentPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const resolveTab = (tabParam: string | null): ParentTabKey | null => {
    if (!tabParam) return null;
    if (tabParam === 'interactions') return 'petitions';
    if (
      [
        'gate-notifications',
        'leave',
        'emergency-pickup',
        'medication',
        'face-biometric',
        'guardians',
        'invoice',
        'petitions',
        'survey',
        'privacy-decree13'
      ].includes(tabParam)
    ) {
      return tabParam as ParentTabKey;
    }
    return null;
  };

  const [activeTab, setActiveTab] = useState<ParentTabKey>(() => {
    const fromQuery = resolveTab(searchParams.get('tab'));
    if (fromQuery) return fromQuery;
    if (location.pathname === '/parent/children') return 'face-biometric';
    if (location.pathname === '/parent/daily-care') return 'gate-notifications';
    if (location.pathname === '/parent/tuition') return 'invoice';
    if (location.pathname === '/parent/interactions') return 'petitions';
    return 'gate-notifications';
  });

  useEffect(() => {
    const fromQuery = resolveTab(searchParams.get('tab'));
    if (fromQuery) {
      setActiveTab(fromQuery);
    } else if (location.pathname === '/parent/children') {
      setActiveTab('face-biometric');
    } else if (location.pathname === '/parent/daily-care') {
      setActiveTab('gate-notifications');
    } else if (location.pathname === '/parent/tuition') {
      setActiveTab('invoice');
    } else if (location.pathname === '/parent/interactions') {
      setActiveTab('petitions');
    }
  }, [location.pathname, searchParams]);

  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
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
            className: matchedClass?.name || 'Chưa xếp lớp',
          };
        });
        setStudents(mappedStu);
        setSelectedStudentId((prev) => (mappedStu.some((s) => s.id === prev) ? prev : (mappedStu[0]?.id || '')));
      } else {
        setStudents([]);
        setSelectedStudentId('');
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

  // Lấy số lượng thông báo cổng chưa đọc
  const { data: _notifications = [] } = useQuery({
    queryKey: ['gate-notifications', currentStudent?.id],
    queryFn: () => parentApi.getGateNotifications(currentStudent?.id),
    staleTime: 5000,
  });

  const currentMeta = PARENT_TAB_META[activeTab] || PARENT_TAB_META['gate-notifications'];
  const MetaIcon = currentMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Header trang & Thông tin Con (Hệ màu thương hiệu: #275A4E -> #1E4D40) */}
      <div className="rounded-3xl bg-linear-to-r from-[#275A4E] via-[#1E4D40] to-[#14382F] p-6 md:p-8 text-white shadow-lg shadow-[#275A4E]/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentMeta.specialColor === 'alert'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#E5A93C] text-slate-950'
              } shadow-xs`}
            >
              <Baby className="w-3.5 h-3.5" />
              <span>Phụ Huynh</span>
            </span>
            {currentMeta.badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
                {currentMeta.badge}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-emerald-100 border border-white/15">
              Lớp {currentStudent?.className}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-[#78C2AD] shrink-0">
              <MetaIcon className="h-5 w-5" />
            </div>
            <span>{currentMeta.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
            {currentMeta.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Chọn con nếu có nhiều bé */}
          {students.length > 1 && (
            <div className="rounded-2xl bg-white/15 backdrop-blur-md px-3.5 py-2 border border-white/20 text-xs">
              <label className="text-[10px] text-emerald-200 block mb-0.5 font-bold uppercase tracking-wider">Học sinh:</label>
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
            title="Nhấp để chuyển trạng thái kiểm thử có mặt / vắng mặt "
            className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs font-bold backdrop-blur-md transition border ${
              isStudentPresentToday
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-100 hover:bg-emerald-500/35'
                : 'bg-rose-500/25 border-rose-400 text-rose-100 hover:bg-rose-500/35'
            }`}
          >
            {isStudentPresentToday ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#78C2AD]" />
                <span>Bé đang có mặt (07:45)</span>
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
            className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md hover:bg-white/25 transition text-white border border-white/20 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ================= NỘI DUNG TỪNG TAB ================= */}
      {students.length === 0 && !isLoading ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-12 text-center backdrop-blur-xs">
          <Baby className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-base font-bold text-slate-800">Chưa có hồ sơ học sinh liên kết</h3>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto">
            Hệ thống chưa tìm thấy hồ sơ học sinh nào thuộc quyền quản lý của phụ huynh này. Vui lòng liên hệ nhà trường để được hỗ trợ kết nối.
          </p>
        </div>
      ) : (
        <>
          {/* Tab 1: UC-046 - Nhận Thông Báo Điểm Danh & Đón Trả Kèm Ảnh */}
          {activeTab === 'gate-notifications' && (
            <GateNotificationsTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 2: UC-044 - Nộp Đơn Xin Nghỉ Học Trực Tuyến */}
          {activeTab === 'leave' && (
            <LeaveRequestTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 3: UC-043 - Ủy Quyền Đón Hộ Đột Xuất Trong Ngày */}
          {activeTab === 'emergency-pickup' && (
            <EmergencyPickupTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
              isStudentPresentToday={isStudentPresentToday}
            />
          )}

          {/* Tab 4: UC-045 - Gửi Đơn Dặn Thuốc Điện Tử */}
          {activeTab === 'medication' && (
            <MedicationRequestTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 5: UC-041 - Đăng Ký Sinh Trắc Học Khuôn Mặt Bé */}
          {activeTab === 'face-biometric' && (
            <StudentFaceBiometricTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
            />
          )}

          {/* Tab 6: UC-042 - Đăng Ký Danh Sách Người Thân Đón Bé */}
          {activeTab === 'guardians' && (
            <AuthorizedGuardiansTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
            />
          )}

          {/* Tab 7: UC-047, UC-048 & UC-049 - Xem Bảng Kê Học Phí, Khấu Trừ & Thanh Toán VietQR, Tải Biên Lai */}
          {activeTab === 'invoice' && (
            <TuitionInvoicesTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 8: UC-050 - Nộp Đơn Yêu Cầu Sự Vụ Học Sinh (Giấy xác nhận, đổi tuyến buýt, trích lục...) */}
          {activeTab === 'petitions' && (
            <StudentAffairsPetitionTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 9: UC-068 - Khảo Sát Ý Kiến & Đánh Giá Dịch Vụ Mầm Non */}
          {activeTab === 'survey' && (
            <ServiceSurveyTab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}

          {/* Tab 10: UC-069 - Quyền Xóa Dữ Liệu Sinh Trắc Học (Điều 16 Nghị định 13/2023/NĐ-CP) */}
          {activeTab === 'privacy-decree13' && (
            <BiometricPurgeDecree13Tab
              studentId={currentStudent?.id || ''}
              studentName={currentStudent?.fullName || ''}
              className={currentStudent?.className || ''}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ParentPage;
