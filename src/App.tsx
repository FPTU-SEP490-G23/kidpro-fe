import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/guard/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AttendancePage from './pages/attendance/AttendancePage';
import KitchenPage from './pages/kitchen/KitchenPage';
import FinancePage from './pages/finance/FinancePage';
import HealthPage from './pages/health/HealthPage';
import AcademicPage from './pages/academic/AcademicPage';
import ParentPage from './pages/parent/ParentPage';
import AnnouncementsPage from './pages/comms/AnnouncementsPage';
import ProfilePage from './pages/profile/ProfilePage';
import TenantsPage from './pages/admin/tenants/TenantsPage';
import RbacPage from './pages/admin/rbac/RbacPage';
import IntegrationsPage from './pages/admin/integrations/IntegrationsPage';
import HealthMonitoringPage from './pages/admin/health/HealthMonitoringPage';
import AcademicYearsPage from './pages/academic/years/AcademicYearsPage';
import ExecutiveDashboardPage from './pages/dashboard/executive/ExecutiveDashboardPage';
import StudentAnalyticsPage from './pages/academic/analytics/StudentAnalyticsPage';
import AuditLogsPage from './pages/admin/audit/AuditLogsPage';
import BghFeePolicyApprovalPage from './pages/bgh/BghFeePolicyApprovalPage';
import BghClassApprovalsPage from './pages/bgh/BghClassApprovalsPage';
import BghGradeQuotasPage from './pages/bgh/BghGradeQuotasPage';
import BghClassroomsPage from './pages/bgh/BghClassroomsPage';
import BghStaffManagementPage from './pages/bgh/BghStaffManagementPage';
import BghTeachingAssignmentsPage from './pages/bgh/BghTeachingAssignmentsPage';
import BghTimetableApprovalsPage from './pages/bgh/BghTimetableApprovalsPage';
import BghWeeklyMenuApprovalsPage from './pages/bgh/BghWeeklyMenuApprovalsPage';
import BghTuitionSummaryPage from './pages/bgh/BghTuitionSummaryPage';
import BghRevenueReportPage from './pages/bgh/BghRevenueReportPage';
import BghExtracurricularClassesPage from './pages/bgh/BghExtracurricularClassesPage';
import BghEvaluationApprovalsPage from './pages/bgh/BghEvaluationApprovalsPage';
import BghLessonPlanApprovalsPage from './pages/bgh/BghLessonPlanApprovalsPage';
import BghDevelopmentQualityReportPage from './pages/bgh/BghDevelopmentQualityReportPage';
import BghAnnouncementsPage from './pages/bgh/BghAnnouncementsPage';
import BghEmergencyBroadcastPage from './pages/bgh/BghEmergencyBroadcastPage';
import BghSchoolSetupHubPage from './pages/bgh/hubs/BghSchoolSetupHubPage';
import BghAcademicApprovalsHubPage from './pages/bgh/hubs/BghAcademicApprovalsHubPage';
import BghChildcareHubPage from './pages/bgh/hubs/BghChildcareHubPage';
import BghFinanceHubPage from './pages/bgh/hubs/BghFinanceHubPage';
import BghCommunicationsHubPage from './pages/bgh/hubs/BghCommunicationsHubPage';
import BghBusManagementPage from './pages/bgh/BghBusManagementPage';

import NotFoundPage from './pages/error/NotFoundPage';
import ForbiddenPage from './pages/error/ForbiddenPage';
import { useAuth } from './contexts/AuthContext';
import { getRoleHomePath } from './utils/formatters';

const RoleBasedRedirect: React.FC = () => {
  const { role, user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(role)} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Hệ thống bảo vệ RBAC trong MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<RoleBasedRedirect />} />

          {/* 1. DÙNG CHUNG CHO MỌI ROLE ĐÃ XÁC THỰC ( -> ) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN']}>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'GIAO_VIEN', 'KE_TOAN', 'BEP', 'SYSTEM_ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 2. QUẢN TRỊ VIÊN NỀN TẢNG (SYSTEM_ADMIN -  -> ) */}
          <Route
            path="/admin/schools"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <TenantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <TenantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users-rbac"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'BGH']}>
                <RbacPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rbac"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'BGH']}>
                <RbacPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-health"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <HealthMonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN']}>
                <HealthMonitoringPage />
              </ProtectedRoute>
            }
          />

          {/* ======================================================== */}
          {/* 3. BAN GIÁM HIỆU (BGH) - OPTION 2: MULTI-TAB CONSOLIDATED HUBS */}
          {/* ======================================================== */}
          <Route
            path="/dashboard/executive"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <ExecutiveDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/executive-dashboard"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <ExecutiveDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* HUB 1: Thiết Lập Trường & Cơ Sở Vật Chất */}
          <Route
            path="/bgh/school-setup"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghSchoolSetupHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/academic-planning"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghSchoolSetupHubPage initialTab="years" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/grade-quotas"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghSchoolSetupHubPage initialTab="quotas" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/classrooms"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghSchoolSetupHubPage initialTab="classrooms" />
              </ProtectedRoute>
            }
          />

          {/* HUB 2: Phê Duyệt Học Vụ & Giảng Dạy */}
          <Route
            path="/bgh/academic-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/class-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage initialTab="classes" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/teaching-assignments"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage initialTab="assignments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/timetable-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage initialTab="timetable" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/lesson-plan-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage initialTab="lesson-plans" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/extracurricular-classes"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghAcademicApprovalsHubPage initialTab="extracurricular" />
              </ProtectedRoute>
            }
          />

          {/* HUB 3: Chăm Sóc Bán Trú & Phát Triển Trẻ */}
          <Route
            path="/bgh/childcare-hub"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghChildcareHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/menu-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghChildcareHubPage initialTab="menu" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/evaluation-approvals"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghChildcareHubPage initialTab="evaluations" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/development-quality-report"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghChildcareHubPage initialTab="quality-report" />
              </ProtectedRoute>
            }
          />

          {/* HUB 4: Quản Trị Tài Chính & Học Phí */}
          <Route
            path="/bgh/finance-hub"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghFinanceHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/tuition-summary"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghFinanceHubPage initialTab="tuition-summary" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/revenue-report"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghFinanceHubPage initialTab="revenue-report" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/fee-policy-approval"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghFinanceHubPage initialTab="fee-policy" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/finance-policies"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghFinanceHubPage initialTab="fee-policy" />
              </ProtectedRoute>
            }
          />

          {/* HUB 5: Truyền Thông & Cảnh Báo Khẩn Cấp */}
          <Route
            path="/bgh/communications"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghCommunicationsHubPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/announcements"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghCommunicationsHubPage initialTab="announcements" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/emergency-broadcast"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghCommunicationsHubPage initialTab="emergency" />
              </ProtectedRoute>
            }
          />

          {/* Standalone BGH Routes */}
          <Route
            path="/bgh/staff"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghStaffManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/bus-management"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghBusManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/buses"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <BghBusManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/student-analytics"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/safety-reports"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/security-audit"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* 4. CÁN BỘ GIÁO VỤ (GIAO_VU -  -> , ,  -> ) */}
          <Route
            path="/academic"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/students"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/classes"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/timetables"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/timetable-conflicts"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/transfers"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/withdrawals"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/parent-accounts"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/guardians"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/safety-guardians"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/allergies"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/lesson-plan-approvals"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/health-reports"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/club-assignments"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/equipment"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/announcements"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/surveys"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/medical-bulletins"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/moet-reports"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/year-archival"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/bus-registrations"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/reports"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/years"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicYearsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/student-analytics"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'SYSTEM_ADMIN']}>
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* 5. GIÁO VIÊN CHỦ NHIỆM (GIAO_VIEN -  -> , , , , ) */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dismissal"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <HealthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/health"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <HealthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/activities"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/communication"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* 6. NHÂN VIÊN BẾP BÁN TRÚ (BEP -  -> , ) */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'SYSTEM_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen/menus"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'SYSTEM_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen/allergies"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'SYSTEM_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen/safety"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'SYSTEM_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          {/* 7. KẾ TOÁN TRƯỜNG HỌC (KE_TOAN -  -> , , , , ) */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/configs"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/billing-engine"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/payments"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/reports"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />

          {/* 8. PHỤ HUYNH HỌC SINH (PHU_HUYNH -  -> , , , , ) */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/daily-care"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/tuition"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/interactions"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />

          {/* Trang lỗi */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
