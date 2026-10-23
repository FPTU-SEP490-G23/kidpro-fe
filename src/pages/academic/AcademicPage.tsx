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
} from 'lucide-react';
import AcademicYearsPage from './years/AcademicYearsPage';
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
import { ServiceSurveyTab } from '../parent/tabs/ServiceSurveyTab';

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
  | 'lesson_plan_approvals'
  | 'moet_attendance'
  | 'year_archival'
  | 'quality_surveys'
  | 'academic_years';

interface TabMeta {
  uc: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  specialColor?: 'allergy' | 'gold';
}

const TAB_META: Record<AcademicTabKey, TabMeta> = {
  students: {
    uc: 'UC-015',
    title: 'Tiếp Nhận Học Sinh & Phân Lớp',
    description: 'Quy trình tiếp nhận hồ sơ nhập học của trẻ, kiểm tra độ tuổi và phân bổ vào danh sách khối lớp.',
    icon: UserPlus,
    badge: 'Hồ Sơ Mầm Non',
  },
  classes: {
    uc: 'UC-016',
    title: 'Phân Công Giáo Viên Phụ Trách & Quản Lý Lớp',
    description: 'Thiết lập danh sách cơ cấu lớp học theo khối tuổi, phân công giáo viên chủ nhiệm và giáo viên hỗ trợ.',
    icon: Users,
    badge: 'Đội Ngũ Sư Phạm',
  },
  timetable: {
    uc: 'UC-017',
    title: 'Xếp & Ban Hành Thời Khóa Biểu Tuần',
    description: 'Thiết lập khung giờ học tập, sinh hoạt, vận động thể chất và ngoại khóa cho từng lớp theo tuần.',
    icon: Calendar,
    badge: 'Khung Giảng Dạy',
  },
  conflicts: {
    uc: 'UC-018',
    title: 'Kiểm Tra Xung Đột Lịch Dạy & Phòng Học',
    description: 'Hệ thống tự động phát hiện xung đột lịch dạy của giáo viên bộ môn và chống trùng lặp phòng chức năng.',
    icon: CalendarDays,
    badge: 'Thuật Toán Tự Động',
  },
  transfers: {
    uc: 'UC-019',
    title: 'Xử Lý Đơn Chuyển Lớp & Bảo Lưu Học Phí',
    description: 'Tiếp nhận đơn nguyện vọng của phụ huynh, thẩm định điều kiện sĩ số lớp tiếp nhận và duyệt thủ tục bảo lưu.',
    icon: ArrowRightLeft,
    badge: 'Biến Động Học Sinh',
  },
  guardians: {
    uc: 'UC-020',
    title: 'Thẩm Định Người Đón Ủy Quyền',
    description: 'Thẩm định hồ sơ, giấy tờ định danh và phê duyệt danh sách người thân được phụ huynh ủy quyền đón trẻ.',
    icon: ShieldCheck,
    badge: 'An Toàn Đón Trả',
  },
  allergies: {
    uc: 'UC-053',
    title: 'Cảnh Báo Dị Ứng Toàn Hệ Thống (Allergy Command Center)',
    description: 'Bóc tách cảnh báo đỏ bắt buộc đối với học sinh có tiền sử dị ứng thực phẩm nặng tới điểm danh, lớp học và bếp bán trú.',
    icon: ShieldAlert,
    badge: 'Cảnh Báo Đỏ Bắt Buộc',
    specialColor: 'allergy',
  },
  lesson_plan_approvals: {
    uc: 'UC-062',
    title: 'Phê Duyệt Kế Hoạch Giáo Án Tuần',
    description: 'Tổ chuyên môn và cán bộ giáo vụ kiểm duyệt nội dung giáo án giảng dạy tuần do các giáo viên chủ nhiệm đệ trình.',
    icon: CheckCircle2,
    badge: 'Kiểm Duyệt Chuyên Môn',
  },
  classroom_equipment: {
    uc: 'UC-063',
    title: 'Quản Lý Đồ Dùng & Thiết Bị Lớp Học',
    description: 'Kiểm kê trang thiết bị mầm non, đồ chơi giáo dục và theo dõi tình trạng cấp phát đồ dùng các phòng học.',
    icon: Boxes,
    badge: 'Cơ Sở Vật Chất',
  },
  moet_attendance: {
    uc: 'UC-064',
    title: 'Xuất Sổ Điểm Danh Mẫu Chuẩn MoET',
    description: 'Tổng hợp ngày đi học, vắng có phép, vắng không phép theo biểu mẫu quy chuẩn của Bộ Giáo dục & Đào tạo.',
    icon: FileSpreadsheet,
    badge: 'Mẫu Sổ Bộ GD&ĐT',
  },
  year_archival: {
    uc: 'UC-065',
    title: 'Khóa Sổ & Lưu Trữ Dữ Liệu Học Bạ Niên Khóa',
    description: 'Đóng sổ dữ liệu năm học cũ, kết chuyển học bạ điện tử vào kho lưu trữ số và sẵn sàng khởi tạo năm học mới.',
    icon: Archive,
    badge: 'Lưu Trữ Dữ Liệu',
  },
  lesson_plans: {
    uc: 'UC-054',
    title: 'Soạn & Gửi Phê Duyệt Kế Hoạch Giáo Án',
    description: 'Giáo viên chủ nhiệm soạn thảo giáo án theo chủ đề tuần và gửi trình duyệt lên ban chuyên môn giáo vụ.',
    icon: BookOpen,
    badge: 'Chuyên Môn Lớp',
  },
  evaluations: {
    uc: 'UC-061',
    title: 'Đánh Giá 5 Trục Phát Triển Trẻ (Thông Tư 28 & 51/BGDĐT)',
    description: 'Đánh giá định kỳ thể chất, nhận thức, ngôn ngữ, tình cảm - kỹ năng xã hội và thẩm mỹ của từng trẻ.',
    icon: Award,
    badge: 'Chuẩn TT 28/51',
  },
  quality_surveys: {
    uc: 'UC-068',
    title: 'Khảo Sát Chất Lượng Dịch Vụ',
    description: 'Tổng hợp ý kiến phản hồi và mức độ hài lòng của phụ huynh học sinh đối với các hoạt động trường lớp.',
    icon: Star,
    badge: 'Khảo Sát Đánh Giá',
  },
  academic_years: {
    uc: 'UC-009',
    title: 'Kế Hoạch Năm Học & Tuyển Sinh',
    description: 'Kế hoạch học kỳ và tuyển sinh các khối lớp.',
    icon: CalendarDays,
    badge: 'Kế Hoạch Năm Học',
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

  // If user is BGH, redirect to BGH's dedicated academic planning page (UC-009)
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
      if (param === 'guardians' || param === 'safety-guardians') return 'guardians';
      if (param === 'allergies') return 'allergies';
      if (param === 'lesson_plan_approvals' || param === 'lesson-plan-approvals') return 'lesson_plan_approvals';
      if (param === 'classroom_equipment' || param === 'equipment') return 'classroom_equipment';
      if (param === 'moet_attendance' || param === 'moet-reports' || param === 'reports') return 'moet_attendance';
      if (param === 'year_archival' || param === 'year-archival') return 'year_archival';
      if (param === 'lesson_plans' || param === 'lesson-plans') return 'lesson_plans';
      if (param === 'evaluations') return 'evaluations';
      if (param === 'quality_surveys') return 'quality_surveys';
      if (param === 'academic_years') return 'academic_years';
    }
    if (location.pathname === '/academic/students') return 'students';
    if (location.pathname === '/academic/classes') return 'classes';
    if (location.pathname === '/academic/timetables') return 'timetable';
    if (location.pathname === '/academic/timetable-conflicts') return 'conflicts';
    if (location.pathname === '/academic/transfers') return 'transfers';
    if (location.pathname === '/academic/guardians' || location.pathname === '/academic/safety-guardians') return 'guardians';
    if (location.pathname === '/academic/allergies') return 'allergies';
    if (location.pathname === '/academic/lesson-plan-approvals') return 'lesson_plan_approvals';
    if (location.pathname === '/academic/equipment') return 'classroom_equipment';
    if (location.pathname === '/academic/moet-reports' || location.pathname === '/academic/reports') return 'moet_attendance';
    if (location.pathname === '/academic/year-archival') return 'year_archival';
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
        uc: 'G3-UC-02',
        title: 'Lập Kế Hoạch Mở Lớp Học Mới',
        description: 'Lập dự thảo mở các lớp học mới cho năm học, kiểm tra định mức sĩ số chuẩn Bộ GD&ĐT (BR-005, BR-007) để trình Ban Giám hiệu phê duyệt.',
        icon: FileCheck2,
        badge: 'Đề Xuất Mở Lớp',
      };
    } else if (subtab === 'assignments' || subtab === 'teacher-assignments') {
      currentMeta = {
        uc: 'G3-UC-04',
        title: 'Lập Kế Hoạch Phân Công Giáo Viên Chủ Nhiệm & Phụ Tá',
        description: 'Lập dự thảo phân công nhân sự sư phạm cho từng lớp, kiểm tra tài khoản khả dụng và tuân thủ định mức 1 GVCN/lớp (BR-006, BR-008).',
        icon: UserCheck,
        badge: 'Phân Công Sư Phạm',
      };
    } else if (subtab === 'placement' || subtab === 'placements') {
      currentMeta = {
        uc: 'G3-UC-06',
        title: 'Xếp Trẻ Vào Lớp Học (Student Placement)',
        description: 'Phân bổ học sinh chưa có lớp vào các lớp học phù hợp theo độ tuổi (BR-011) và kiểm soát sĩ số tối đa theo định mức quy định (BR-005).',
        icon: Users,
        badge: 'Xếp Trẻ Vào Lớp',
      };
    } else {
      currentMeta = {
        uc: 'G3-UC-01',
        title: 'Quản Lý Danh Sách & Cập Nhật Thông Tin Lớp Học',
        description: 'Tra cứu danh sách lớp học theo khối tuổi, cập nhật phân bổ phòng học chống trùng lặp (BR-005) và theo dõi sĩ số thực tế.',
        icon: School,
        badge: 'Cơ Cấu Lớp Học',
      };
    }
  } else if (activeTab === 'transfers') {
    currentMeta = {
      uc: 'G3-UC-08',
      title: 'Phê Duyệt Chuyển Lớp Cho Học Sinh (Class Transfer)',
      description: 'Thẩm định điều kiện sĩ số lớp tiếp nhận (BR-005), điều chuyển học sinh sang lớp mới (BR-007) hoặc từ chối có lý do quy định.',
      icon: ArrowRightLeft,
      badge: 'Chuyển Lớp Học Sinh',
    };
  } else if (activeTab === 'timetable' || activeTab === 'conflicts') {
    currentMeta = {
      uc: 'G3-UC-09',
      title: 'Xây Dựng Khung Thời Khóa Biểu Tuần (Weekly Timetable)',
      description: 'Thiết lập khung giờ học tập, sinh hoạt, kiểm tra chống trùng lặp giáo viên & phòng chức năng toàn trường (BR-008) để trình BGH duyệt.',
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
                {role === 'GIAO_VIEN' ? 'Giáo Viên' : 'Cán bộ Giáo vụ'} • {currentMeta.uc}
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
        {activeTab === 'guardians' && <GuardianVerificationTab />}
        {activeTab === 'allergies' && <AllergyCommandCenterTab />}
        {activeTab === 'lesson_plans' && <WeeklyLessonPlanTab />}
        {activeTab === 'evaluations' && <EarlyChildhoodEvaluationTab />}
        {activeTab === 'lesson_plan_approvals' && <LessonPlanApprovalsTab />}
        {activeTab === 'classroom_equipment' && <ClassroomEquipmentTab />}
        {activeTab === 'moet_attendance' && <MoetAttendanceReportTab />}
        {activeTab === 'year_archival' && <YearEndArchivalTab />}
        {activeTab === 'quality_surveys' && (
          <ServiceSurveyTab
            studentId="ALL_CAMPUS"
            studentName="Học Sinh Toàn Trường"
            className="Các Khối Lớp"
          />
        )}
        {activeTab === 'academic_years' && <AcademicYearsPage />}
      </div>
    </div>
  );
};

export default AcademicPage;

