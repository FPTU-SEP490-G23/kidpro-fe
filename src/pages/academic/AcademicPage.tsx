import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import {
  GraduationCap,
  ArrowRightLeft,
  Users,
  Calendar,
  CalendarDays,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  BookOpen,
  Award,
  CheckCircle2,
  Boxes,
  FileSpreadsheet,
  Archive,
  Star,
  Sparkles,
  School,
  FileCheck2,
  UserCheck,
  HeartPulse,
  Megaphone,
  ClipboardList,
  Bus,
  Utensils,
} from 'lucide-react';
import AcademicYearsPage from './years/AcademicYearsPage';
import { BusRegistrationApprovalTab } from './tabs/BusRegistrationApprovalTab';
import { MealRegistrationApprovalTab } from './tabs/MealRegistrationApprovalTab';
import { StudentAdmissionTab } from './tabs/StudentAdmissionTab';
import { ClassManagementTab } from './tabs/ClassManagementTab';
import { TimetableManagementTab } from './tabs/TimetableManagementTab';
import { ClassTransferTab } from './tabs/ClassTransferTab';
import { GuardianVerificationTab } from './tabs/GuardianVerificationTab';
import { AllergyCommandCenterTab } from './tabs/AllergyCommandCenterTab';
import { WeeklyLessonPlanTab } from './tabs/WeeklyLessonPlanTab';
import { EarlyChildhoodEvaluationTab } from './tabs/EarlyChildhoodEvaluationTab';
import { LessonPlanApprovalsTab } from './tabs/LessonPlanApprovalsTab';
import { ClassroomEquipmentTab } from './tabs/ClassroomEquipmentTab';
import { MoetAttendanceReportTab } from './tabs/MoetAttendanceReportTab';
import { YearEndArchivalTab } from './tabs/YearEndArchivalTab';
import { StudentWithdrawalTab } from './tabs/StudentWithdrawalTab';
import { ParentAccountManagementTab } from './tabs/ParentAccountManagementTab';
import { ServiceSurveyTab } from '../parent/tabs/ServiceSurveyTab';
import { HealthReportTab } from './tabs/HealthReportTab';
import { ClubAssignmentTab } from './tabs/ClubAssignmentTab';
import { AnnouncementManagementTab } from './tabs/AnnouncementManagementTab';
import { SurveyManagementTab } from './tabs/SurveyManagementTab';
import { MedicalBulletinTab } from './tabs/MedicalBulletinTab';
import { EquipmentWithIncidentsTab } from './tabs/EquipmentWithIncidentsTab';

export type AcademicTabKey =
  | 'lesson_plans'
  | 'evaluations'
  | 'classroom_equipment'
  | 'allergies'
  | 'timetable'
  | 'conflicts'
  | 'classes'
  | 'students'
  | 'transfers'
  | 'guardians'
  | 'withdrawals'
  | 'parent_accounts'
  | 'lesson_plan_approvals'
  | 'moet_attendance'
  | 'year_archival'
  | 'quality_surveys'
  | 'academic_years'
  | 'health_reports'
  | 'club_assignments'
  | 'equipment'
  | 'announcements'
  | 'surveys'
  | 'medical_bulletins'
  | 'bus_registrations'
  | 'meal_registrations';

interface TabMeta {
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  specialColor?: 'allergy' | 'gold';
}

const TAB_META: Record<AcademicTabKey, TabMeta> = {
  students: {
    title: 'Quản Lý Danh Sách & Hồ Sơ Học Sinh',
    description: 'Tiếp nhận hồ sơ nhập học, tự động cấp mã định danh HS duy nhất, tra cứu tìm kiếm toàn trường và cập nhật lý lịch học sinh.',
    icon: UserPlus,
    badge: 'Hồ Sơ Học Sinh',
  },
  classes: {
    title: 'Phân Công Giáo Viên Phụ Trách & Quản Lý Lớp',
    description: 'Thiết lập danh sách cơ cấu lớp học theo khối tuổi, phân công giáo viên chủ nhiệm và giáo viên hỗ trợ.',
    icon: Users,
    badge: 'Đội Ngũ Sư Phạm',
  },
  timetable: {
    title: 'Xếp & Ban Hành Thời Khóa Biểu Tuần',
    description: 'Thiết lập khung giờ học tập, sinh hoạt, vận động thể chất và ngoại khóa cho từng lớp theo tuần.',
    icon: Calendar,
    badge: 'Khung Giảng Dạy',
  },
  conflicts: {
    title: 'Kiểm Tra Xung Đột Lịch Dạy & Phòng Học',
    description: 'Hệ thống tự động phát hiện xung đột lịch dạy của giáo viên bộ môn và chống trùng lặp phòng chức năng.',
    icon: CalendarDays,
    badge: 'Thuật Toán Tự Động',
  },
  transfers: {
    title: 'Xử Lý Đơn Chuyển Lớp & Bảo Lưu Học Phí',
    description: 'Tiếp nhận đơn nguyện vọng của phụ huynh, thẩm định điều kiện sĩ số lớp tiếp nhận và duyệt thủ tục bảo lưu.',
    icon: ArrowRightLeft,
    badge: 'Biến Động Học Sinh',
  },
  guardians: {
    title: 'Thẩm Định Người Đón Ủy Quyền',
    description: 'Thẩm định hồ sơ, giấy tờ định danh và phê duyệt danh sách người thân được phụ huynh ủy quyền đón trẻ.',
    icon: ShieldCheck,
    badge: 'An Toàn Đón Trả',
  },
  withdrawals: {
    title: 'Xử Lý Hồ Sơ Rút Học Bạ & Chuyển Trường (Student Withdrawal)',
    description: 'Tiếp nhận đơn chuyển trường, đối chiếu quyết toán tài chính công nợ học phí, xuất biên bản bàn giao hồ sơ y tế và rút khỏi sĩ số lớp.',
    icon: School,
    badge: 'Rút Hồ Sơ & Chuyển Trường',
  },
  parent_accounts: {
    title: 'Quản Lý & Kích Hoạt Tài Khoản Phụ Huynh (Parent Mobile App)',
    description: 'Khởi tạo tài khoản Mobile App bằng email, dùng số điện thoại làm thông tin liên hệ và liên kết nhiều con.',
    icon: Users,
    badge: 'Tài Khoản Phụ Huynh',
  },
  allergies: {
    title: 'Cảnh Báo Dị Ứng Toàn Hệ Thống (Allergy Command Center)',
    description: 'Bóc tách cảnh báo đỏ bắt buộc đối với học sinh có tiền sử dị ứng thực phẩm nặng tới điểm danh, lớp học và bếp bán trú.',
    icon: ShieldAlert,
    badge: 'Cảnh Báo Đỏ Bắt Buộc',
    specialColor: 'allergy',
  },
  lesson_plan_approvals: {
    title: 'Phê Duyệt Kế Hoạch Giáo Án Tuần',
    description: 'Tổ chuyên môn và cán bộ giáo vụ kiểm duyệt nội dung giáo án giảng dạy tuần do các giáo viên chủ nhiệm đệ trình.',
    icon: CheckCircle2,
    badge: 'Kiểm Duyệt Chuyên Môn',
  },
  classroom_equipment: {
    title: 'Quản Lý Đồ Dùng & Thiết Bị Lớp Học',
    description: 'Kiểm kê trang thiết bị mầm non, đồ chơi giáo dục và theo dõi tình trạng cấp phát đồ dùng các phòng học.',
    icon: Boxes,
    badge: 'Cơ Sở Vật Chất',
  },
  moet_attendance: {
    title: 'Xuất Sổ Điểm Danh Mẫu Chuẩn MoET',
    description: 'Tổng hợp ngày đi học, vắng có phép, vắng không phép theo biểu mẫu quy chuẩn của Bộ Giáo dục & Đào tạo.',
    icon: FileSpreadsheet,
    badge: 'Mẫu Sổ Bộ GD&ĐT',
  },
  year_archival: {
    title: 'Khóa Sổ & Lưu Trữ Dữ Liệu Học Bạ Niên Khóa',
    description: 'Đóng sổ dữ liệu năm học cũ, kết chuyển học bạ điện tử vào kho lưu trữ số và sẵn sàng khởi tạo năm học mới.',
    icon: Archive,
    badge: 'Lưu Trữ Dữ Liệu',
  },
  lesson_plans: {
    title: 'Soạn & Gửi Phê Duyệt Kế Hoạch Giáo Án',
    description: 'Giáo viên chủ nhiệm soạn thảo giáo án theo chủ đề tuần và gửi trình duyệt lên ban chuyên môn giáo vụ.',
    icon: BookOpen,
    badge: 'Chuyên Môn Lớp',
  },
  evaluations: {
    title: 'Đánh Giá 5 Trục Phát Triển Trẻ (Thông Tư 28 & 51/BGDĐT)',
    description: 'Đánh giá định kỳ thể chất, nhận thức, ngôn ngữ, tình cảm - kỹ năng xã hội và thẩm mỹ của từng trẻ.',
    icon: Award,
    badge: 'Chuẩn TT 28/51',
  },
  quality_surveys: {
    title: 'Khảo Sát Chất Lượng Dịch Vụ',
    description: 'Tổng hợp ý kiến phản hồi và mức độ hài lòng của phụ huynh học sinh đối với các hoạt động trường lớp.',
    icon: Star,
    badge: 'Khảo Sát Đánh Giá',
  },
  academic_years: {
    title: 'Kế Hoạch Năm Học & Tuyển Sinh',
    description: 'Kế hoạch học kỳ và tuyển sinh các khối lớp.',
    icon: CalendarDays,
    badge: 'Kế Hoạch Năm Học',
  },
  health_reports: {
    title: 'Báo Cáo Tổng Hợp Sức Khỏe Lớp & Toàn Trường',
    description: 'Theo dõi dinh dưỡng WHO Z-score, danh sách học sinh cần can thiệp dinh dưỡng đặc biệt và xuất Sổ theo dõi thể lực chuẩn TTLT 13/2016/TTLT-BYT-BGDĐT.',
    icon: HeartPulse,
    badge: 'Sức Khỏe & Thể Lực',
  },
  club_assignments: {
    title: 'Phân Công Giáo Viên Phụ Trách Câu Lạc Bộ Ngoại Khóa',
    description: 'Phân công giáo viên chính & trợ giảng các lớp năng khiếu, tự động kiểm tra chống trùng lịch dạy chính khóa và định mức giờ dạy tối đa theo tuần.',
    icon: Award,
    badge: 'Phân Công CLB',
  },
  equipment: {
    title: 'Quản Lý Danh Mục Thiết Bị & Đồ Chơi Mầm Non',
    description: 'Khai báo mã định danh tài sản duy nhất, phân bổ giáo cụ về phòng học và thực hiện điều chuyển thiết bị an toàn giữa các phòng.',
    icon: Boxes,
    badge: 'Thiết Bị Mầm Non',
  },
  announcements: {
    title: 'Cổng Truyền Thông & Quản Lý Thông Báo Toàn Trường',
    description: 'Soạn thảo, phân loại phạm vi theo khối lớp và lên lịch hẹn giờ phát hành thông báo đẩy FCM tới phụ huynh & giáo viên.',
    icon: Megaphone,
    badge: 'Thông Báo Toàn Trường',
  },
  surveys: {
    title: 'Khởi Tạo Phiếu Khảo Sát & Thu Thập Ý Kiến Phụ Huynh',
    description: 'Xây dựng biểu mẫu khảo sát đa dạng câu hỏi, thu thập phản hồi và theo dõi biểu đồ phân tích tỷ lệ đánh giá theo thời gian thực.',
    icon: ClipboardList,
    badge: 'Khảo Sát Ý Kiến',
  },
  medical_bulletins: {
    title: 'Bản Tin Y Tế Học Đường & Cảnh Báo Dịch Bệnh Theo Mùa',
    description: 'Đăng tải khuyến cáo sức khỏe mầm non, kích hoạt chế độ cảnh báo khẩn cấp kèm âm thanh báo động y tế và hướng dẫn cách ly dịch bệnh.',
    icon: ShieldAlert,
    badge: 'Y Tế & Dịch Bệnh',
    specialColor: 'allergy',
  },
  bus_registrations: {
    title: 'Phê Duyệt Đơn Đăng Ký Xe Buýt Của Phụ Huynh',
    description: 'Tiếp nhận, thẩm định điều kiện tuyến đón trả và phê duyệt hoặc từ chối đơn đăng ký xe buýt đưa đón học sinh.',
    icon: Bus,
    badge: 'Đưa Đón Xe Buýt',
  },
  meal_registrations: {
    title: 'Phê Duyệt Đơn Đăng Ký Ăn Sáng Bán Trú',
    description: 'Tiếp nhận, thẩm định và phê duyệt hoặc từ chối đơn đăng ký dịch vụ ăn sáng bán trú tại trường của phụ huynh.',
    icon: Utensils,
    badge: 'Ăn Sáng Bán Trú',
  },
};

const getDefaultTabForRole = (role?: UserRole | null): AcademicTabKey => {
  if (role === 'GIAO_VIEN') return 'lesson_plans';
  if (role === 'GIAO_VU') return 'classes';
  return 'classes';
};

export const AcademicPage: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // If user is BGH, redirect to BGH's dedicated academic planning page
  if (role === 'BGH') {
    return <Navigate to="/bgh/academic-planning" replace />;
  }

  const resolveTab = (param: string | null): AcademicTabKey => {
    if (param) {
      if (param === 'students') return 'students';
      if (param === 'classes') return 'classes';
      if (param === 'timetable' || param === 'timetables') return 'timetable';
      if (param === 'conflicts' || param === 'timetable-conflicts') return 'conflicts';
      if (param === 'transfers') return 'transfers';
      if (param === 'withdrawals' || param === 'student-withdrawals') return 'withdrawals';
      if (param === 'parent-accounts' || param === 'parent_accounts' || param === 'parents') return 'parent_accounts';
      if (param === 'guardians' || param === 'safety-guardians') return 'guardians';
      if (param === 'allergies') return 'allergies';
      if (param === 'lesson_plan_approvals' || param === 'lesson-plan-approvals') return 'lesson_plan_approvals';
      if (param === 'classroom_equipment') return 'classroom_equipment';
      if (param === 'equipment' || param === 'equipment-inventories') return 'equipment';
      if (param === 'health-reports' || param === 'health_reports' || param === 'health') return 'health_reports';
      if (param === 'club-assignments' || param === 'club_assignments' || param === 'clubs') return 'club_assignments';
      if (param === 'announcements' || param === 'announcement') return 'announcements';
      if (param === 'surveys' || param === 'survey') return 'surveys';
      if (param === 'medical-bulletins' || param === 'medical_bulletins' || param === 'bulletins' || param === 'medical') return 'medical_bulletins';
      if (param === 'moet_attendance' || param === 'moet-reports' || param === 'reports') return 'moet_attendance';
      if (param === 'year_archival' || param === 'year-archival') return 'year_archival';
      if (param === 'lesson_plans' || param === 'lesson-plans') return 'lesson_plans';
      if (param === 'evaluations') return 'evaluations';
      if (param === 'quality_surveys') return 'quality_surveys';
      if (param === 'academic_years') return 'academic_years';
      if (param === 'bus_registrations' || param === 'bus-registrations' || param === 'bus' || param === 'bus-registers') return 'bus_registrations';
      if (param === 'meal_registrations' || param === 'meal-registrations' || param === 'meals' || param === 'meal') return 'meal_registrations';
    }
    if (location.pathname === '/academic/students') return 'students';
    if (location.pathname === '/academic/classes') return 'classes';
    if (location.pathname === '/academic/timetables') return 'timetable';
    if (location.pathname === '/academic/timetable-conflicts') return 'conflicts';
    if (location.pathname === '/academic/transfers') return 'transfers';
    if (location.pathname === '/academic/withdrawals') return 'withdrawals';
    if (location.pathname === '/academic/parent-accounts') return 'parent_accounts';
    if (location.pathname === '/academic/guardians' || location.pathname === '/academic/safety-guardians') return 'guardians';
    if (location.pathname === '/academic/allergies') return 'allergies';
    if (location.pathname === '/academic/lesson-plan-approvals') return 'lesson_plan_approvals';
    if (location.pathname === '/academic/health-reports') return 'health_reports';
    if (location.pathname === '/academic/club-assignments') return 'club_assignments';
    if (location.pathname === '/academic/equipment') return 'equipment';
    if (location.pathname === '/academic/announcements') return 'announcements';
    if (location.pathname === '/academic/surveys') return 'surveys';
    if (location.pathname === '/academic/medical-bulletins') return 'medical_bulletins';
    if (location.pathname === '/academic/moet-reports' || location.pathname === '/academic/reports') return 'moet_attendance';
    if (location.pathname === '/academic/year-archival') return 'year_archival';
    if (location.pathname === '/academic/bus-registrations') return 'bus_registrations';
    if (location.pathname === '/academic/meal-registrations') return 'meal_registrations';
    if (location.pathname === '/teacher/activities') return 'lesson_plans';
    return getDefaultTabForRole(role);
  };

  const [activeTab, setActiveTab] = useState<AcademicTabKey>(() => {
    return resolveTab(searchParams.get('tab'));
  });

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get('tab')));
  }, [location.pathname, searchParams, role]);

  let currentMeta = TAB_META[activeTab] || TAB_META['classes'];
  if (activeTab === 'classes') {
    const subtab = searchParams.get('subtab')?.toLowerCase();
    if (subtab === 'proposals' || subtab === 'open-proposals') {
      currentMeta = {
        title: 'Lập Kế Hoạch Mở Lớp Học Mới',
        description: 'Lập dự thảo mở các lớp học mới cho năm học, kiểm tra định mức sĩ số chuẩn Bộ GD&ĐT để trình Ban Giám hiệu phê duyệt.',
        icon: FileCheck2,
        badge: 'Đề Xuất Mở Lớp',
      };
    } else if (subtab === 'assignments' || subtab === 'teacher-assignments') {
      currentMeta = {
        title: 'Lập Kế Hoạch Phân Công Giáo Viên Chủ Nhiệm & Phụ Tá',
        description: 'Lập dự thảo phân công nhân sự sư phạm cho từng lớp, kiểm tra tài khoản khả dụng và tuân thủ định mức 1 GVCN/lớp.',
        icon: UserCheck,
        badge: 'Phân Công Sư Phạm',
      };
    } else if (subtab === 'placement' || subtab === 'placements') {
      currentMeta = {
        title: 'Xếp Trẻ Vào Lớp Học (Student Placement)',
        description: 'Phân bổ học sinh chưa có lớp vào các lớp học phù hợp theo độ tuổi và kiểm soát sĩ số tối đa theo định mức quy định.',
        icon: Users,
        badge: 'Xếp Trẻ Vào Lớp',
      };
    } else if (subtab === 'promotion' || subtab === 'promotions') {
      currentMeta = {
        title: 'Lập Kế Hoạch Kết Chuyển Học Sinh Đầu Năm (Student Promotion)',
        description: 'Kết chuyển học sinh sang khối lớp mới theo quy tắc lũy tiến hoặc tốt nghiệp (GRADUATED), hỗ trợ lưu ban có lý do theo nguyện vọng gia đình.',
        icon: Sparkles,
        badge: 'Kết Chuyển Đầu Năm',
      };
    } else if (subtab === 'archive' || subtab === 'archived') {
      currentMeta = {
        title: 'Đóng & Lưu Trữ Hồ Sơ Lớp Học (Class Archival)',
        description: 'Đóng hồ sơ lớp học khi kết thúc niên khóa, chuyển toàn bộ dữ liệu lớp sang trạng thái chỉ đọc (ARCHIVED) để lưu trữ lịch sử.',
        icon: Archive,
        badge: 'Lưu Trữ Lớp Học',
      };
    } else {
      currentMeta = {
        title: 'Quản Lý Danh Sách & Cập Nhật Thông Tin Lớp Học',
        description: 'Tra cứu danh sách lớp học theo khối tuổi, cập nhật phân bổ phòng học chống trùng lặp và theo dõi sĩ số thực tế.',
        icon: School,
        badge: 'Cơ Cấu Lớp Học',
      };
    }
  } else if (activeTab === 'transfers') {
    currentMeta = {
      title: 'Phê Duyệt Chuyển Lớp Cho Học Sinh (Class Transfer)',
      description: 'Thẩm định điều kiện sĩ số lớp tiếp nhận, điều chuyển học sinh sang lớp mới hoặc từ chối có lý do quy định.',
      icon: ArrowRightLeft,
      badge: 'Chuyển Lớp Học Sinh',
    };
  } else if (activeTab === 'timetable' || activeTab === 'conflicts') {
    currentMeta = {
      title: 'Xây Dựng Khung Thời Khóa Biểu Tuần (Weekly Timetable)',
      description: 'Thiết lập khung giờ học tập, sinh hoạt, kiểm tra chống trùng lặp giáo viên & phòng chức năng toàn trường để trình BGH duyệt.',
      icon: Calendar,
      badge: 'Thời Khóa Biểu Tuần',
    };
  }
  const MetaIcon = currentMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ HỌC VỤ (ĐỘNG THEO USE CASE, HOÀN TOÀN KHÔNG CÓ THANH SCROLL NGANG) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentMeta.specialColor === 'allergy'
                  ? 'bg-rose-600 text-white'
                  : 'bg-[#E5A93C] text-slate-950'
              } shadow-xs`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {role === 'GIAO_VIEN' ? 'Giáo Viên' : 'Cán bộ Giáo vụ'}
              </span>
            </span>
            {currentMeta.badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
                {currentMeta.badge}
              </span>
            )}
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

      {/* NỘI DUNG TỪNG PHÂN HỆ HỌC VỤ (RENDER TRỰC TIẾP, KHÔNG CÒN THANH SCROLL NGANG LÀM RỐI MẮT) */}
      <div className="bg-transparent">
        {activeTab === 'students' && <StudentAdmissionTab />}
        {activeTab === 'classes' && <ClassManagementTab />}
        {(activeTab === 'timetable' || activeTab === 'conflicts') && <TimetableManagementTab />}
        {activeTab === 'transfers' && <ClassTransferTab />}
        {activeTab === 'withdrawals' && <StudentWithdrawalTab />}
        {activeTab === 'parent_accounts' && <ParentAccountManagementTab />}
        {activeTab === 'guardians' && <GuardianVerificationTab />}
        {activeTab === 'allergies' && <AllergyCommandCenterTab />}
        {activeTab === 'lesson_plans' && <WeeklyLessonPlanTab />}
        {activeTab === 'evaluations' && <EarlyChildhoodEvaluationTab />}
        {activeTab === 'lesson_plan_approvals' && <LessonPlanApprovalsTab />}
        {activeTab === 'classroom_equipment' && <ClassroomEquipmentTab />}
        {activeTab === 'health_reports' && <HealthReportTab />}
        {activeTab === 'club_assignments' && <ClubAssignmentTab />}
        {activeTab === 'equipment' && <EquipmentWithIncidentsTab />}
        {activeTab === 'moet_attendance' && <MoetAttendanceReportTab />}
        {activeTab === 'year_archival' && <YearEndArchivalTab />}
        {activeTab === 'quality_surveys' && (
          <ServiceSurveyTab
            studentId="ALL_CAMPUS"
            studentName="Học Sinh Toàn Trường"
            className="Các Khối Lớp"
          />
        )}
        {activeTab === 'announcements' && <AnnouncementManagementTab />}
        {activeTab === 'surveys' && <SurveyManagementTab />}
        {activeTab === 'medical_bulletins' && <MedicalBulletinTab />}
        {activeTab === 'bus_registrations' && <BusRegistrationApprovalTab />}
        {activeTab === 'meal_registrations' && <MealRegistrationApprovalTab />}
        {activeTab === 'academic_years' && <AcademicYearsPage />}
      </div>
    </div>
  );
};

export default AcademicPage;

