import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  | 'classes'
  | 'students'
  | 'transfers'
  | 'guardians'
  | 'lesson_plan_approvals'
  | 'moet_attendance'
  | 'year_archival'
  | 'quality_surveys'
  | 'academic_years';

interface AcademicTabConfig {
  id: AcademicTabKey;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
  specialColor?: 'allergy' | 'gold';
}

const allAcademicTabs: AcademicTabConfig[] = [
  {
    id: 'lesson_plans',
    label: 'Soạn Giáo Án (UC-054)',
    icon: BookOpen,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'evaluations',
    label: 'Đánh Giá 5 Trục TT28 (UC-061)',
    icon: Award,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'classroom_equipment',
    label: 'Kiểm Kê Thiết Bị Lớp (UC-063)',
    icon: Boxes,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'allergies',
    label: 'Trung Tâm Dị Ứng (UC-053)',
    icon: ShieldAlert,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
    specialColor: 'allergy',
  },
  {
    id: 'timetable',
    label: 'Thời khóa biểu (UC-017 & UC-018)',
    icon: Calendar,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'classes',
    label: 'Danh sách Lớp học (UC-016)',
    icon: Users,
    roles: ['GIAO_VIEN', 'GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'students',
    label: 'Tiếp nhận Học sinh (UC-015)',
    icon: UserPlus,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'transfers',
    label: 'Đơn xin chuyển lớp (UC-019)',
    icon: ArrowRightLeft,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'guardians',
    label: 'Người đón Ủy quyền (UC-020)',
    icon: ShieldCheck,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'lesson_plan_approvals',
    label: 'Phê Duyệt Giáo Án (UC-062)',
    icon: CheckCircle2,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'moet_attendance',
    label: 'Sổ Điểm Danh MoET (UC-064)',
    icon: FileSpreadsheet,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'year_archival',
    label: 'Khóa Sổ Niên Khóa (UC-065)',
    icon: Archive,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'quality_surveys',
    label: 'Khảo Sát Chất Lượng (UC-068)',
    icon: Star,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'academic_years',
    label: 'Kế hoạch Năm học (UC-009)',
    icon: CalendarDays,
    roles: ['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
    specialColor: 'gold',
  },
];

const getDefaultTabForRole = (role?: UserRole | null): AcademicTabKey => {
  if (role === 'GIAO_VIEN') return 'lesson_plans';
  if (role === 'GIAO_VU') return 'students';
  return 'students';
};

export const AcademicPage: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();

  const permittedTabs = allAcademicTabs.filter((tab) => {
    if (!tab.roles) return true;
    if (!role) return true;
    return tab.roles.includes(role);
  });

  const [activeTab, setActiveTab] = useState<AcademicTabKey>(() => {
    if (location.pathname === '/academic/students') return 'students';
    if (location.pathname === '/academic/classes') return 'classes';
    if (location.pathname === '/academic/timetables') return 'timetable';
    if (location.pathname === '/academic/safety-guardians') return 'guardians';
    if (location.pathname === '/academic/reports') return 'moet_attendance';
    if (location.pathname === '/teacher/activities') return 'lesson_plans';
    return getDefaultTabForRole(role);
  });

  // Đồng bộ tab khi đường dẫn thay đổi
  useEffect(() => {
    if (location.pathname === '/academic/students') setActiveTab('students');
    else if (location.pathname === '/academic/classes') setActiveTab('classes');
    else if (location.pathname === '/academic/timetables') setActiveTab('timetable');
    else if (location.pathname === '/academic/safety-guardians') setActiveTab('guardians');
    else if (location.pathname === '/academic/reports') setActiveTab('moet_attendance');
    else if (location.pathname === '/teacher/activities') setActiveTab('lesson_plans');
  }, [location.pathname]);

  // Tự động đồng bộ tab hợp lệ khi thay đổi vai trò trải nghiệm
  useEffect(() => {
    const isCurrentTabValid = permittedTabs.some((t) => t.id === activeTab);
    if (!isCurrentTabValid && permittedTabs.length > 0) {
      setActiveTab(permittedTabs[0].id);
    }
  }, [role, permittedTabs, activeTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-[#275A4E]" />
            <span>Học vụ & Quản lý Lớp học</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tiếp nhận học sinh, cơ cấu lớp học, thời khóa biểu, cảnh báo dị ứng và kế hoạch giáo án tuần
          </p>
        </div>
      </div>

      {/* Thanh Taskbar / Tabs phân hệ Học vụ được cá nhân hóa theo vai trò */}
      <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar gap-1 bg-white/50 p-1 rounded-xl">
        {permittedTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          let colorClasses = '';
          if (tab.specialColor === 'allergy') {
            colorClasses = isActive
              ? 'border-rose-600 text-rose-700 bg-rose-50/60 font-bold'
              : 'border-transparent text-rose-600/80 hover:text-rose-700 hover:bg-rose-50/30';
          } else if (tab.specialColor === 'gold') {
            colorClasses = isActive
              ? 'border-[#E5A93C] text-[#B87A14] bg-[#E5A93C]/10 font-bold'
              : 'border-transparent text-[#B87A14]/80 hover:text-[#B87A14] hover:bg-[#E5A93C]/5';
          } else {
            colorClasses = isActive
              ? 'border-[#275A4E] text-[#275A4E] bg-emerald-50/50 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50';
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-xs sm:text-sm border-b-2 rounded-t-lg transition flex items-center gap-2 whitespace-nowrap cursor-pointer min-h-[44px] ${colorClasses}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>


      <div className="pt-2">
        {activeTab === 'students' && <StudentAdmissionTab />}
        {activeTab === 'classes' && <ClassManagementTab />}
        {activeTab === 'timetable' && <TimetableManagementTab />}
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
