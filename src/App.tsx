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

          {/* 1. Dashboard: Nhân sự trường học và Quản trị viên (loại trừ PHU_HUYNH) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'GIAO_VIEN', 'KE_TOAN', 'BEP', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 2. Điểm danh: Giáo viên, BGH, Giáo vụ, Admin */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* 3. Báo bếp & Thực đơn: Bếp, BGH, Giáo vụ, Giáo viên, Admin */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          {/* 4. Kế toán & Học phí: Kế toán, BGH, Admin */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />

          {/* 5. Sức khỏe & Nhật ký ảnh: Giáo viên, BGH, Giáo vụ, Admin */}
          <Route
            path="/health"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <HealthPage />
              </ProtectedRoute>
            }
          />

          {/* 6. Học vụ & Chuyển lớp: BGH, Giáo vụ, Giáo viên, Admin */}
          <Route
            path="/academic"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />

          {/* 7. Cổng Phụ huynh: Phụ huynh, BGH, Giáo vụ, Admin */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />

          {/* 8. Thông báo trường: Mọi vai trò */}
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* 9. UC-004: Hồ sơ cá nhân & Bảo mật tài khoản (Mọi vai trò đã đăng nhập) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* 10. UC-005: Quản lý Trường học & Multi-Tenant (Chỉ Super Admin) */}
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <TenantsPage />
              </ProtectedRoute>
            }
          />

          {/* 11. UC-006: Cấu hình Phân quyền Vai trò RBAC (Chỉ Super Admin) */}
          <Route
            path="/admin/rbac"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <RbacPage />
              </ProtectedRoute>
            }
          />

          {/* 12. UC-007: Cấu hình Dịch vụ & Tích hợp Ngoại vi (Chỉ Platform Super Admin) */}
          <Route
            path="/admin/integrations"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <IntegrationsPage />
              </ProtectedRoute>
            }
          />

          {/* 13. UC-008: Giám sát Sức khỏe & Uptime Nền tảng (Chỉ Platform Super Admin) */}
          <Route
            path="/admin/health"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <HealthMonitoringPage />
              </ProtectedRoute>
            }
          />

          {/* 14. UC-009: Thiết lập Kế hoạch Năm học & Tuyển sinh (BGH, Giáo vụ, Super Admin) */}
          <Route
            path="/academic/years"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicYearsPage />
              </ProtectedRoute>
            }
          />

          {/* 15. UC-012: Xem Dashboard Điều hành Toàn trường (Hiệu trưởng BGH & Admin) */}
          <Route
            path="/executive-dashboard"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ExecutiveDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 16. UC-013: Xem Báo cáo Biến động Học sinh (Hiệu trưởng BGH, Giáo vụ, Admin) */}
          <Route
            path="/academic/student-analytics"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* 17. UC-014: Tra cứu Nhật ký An ninh Hệ thống (Hiệu trưởng BGH, System Admin) */}
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* ========================================================= */}
          {/* CÁC TUYẾN ĐƯỜNG ĐIỀU HƯỚNG THEO VAI TRÒ (69 USE CASES)   */}
          {/* ========================================================= */}
          {/* SUPER_ADMIN / SYSTEM_ADMIN */}
          <Route
            path="/admin/schools"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <TenantsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users-rbac"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <RbacPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/system-health"
            element={
              <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <HealthMonitoringPage />
              </ProtectedRoute>
            }
          />

          {/* BGH (HIỆU TRƯỞNG) */}
          <Route
            path="/dashboard/executive"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ExecutiveDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/academic-planning"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicYearsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/finance-policies"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'KE_TOAN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/safety-reports"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <StudentAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bgh/announcements"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* GIAO_VU (HỌC VỤ) */}
          <Route
            path="/academic/students"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/classes"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/timetables"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/safety-guardians"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/academic/reports"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VU', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />

          {/* GIAO_VIEN (GIÁO VIÊN CHỦ NHIỆM & BỘ MÔN) */}
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dismissal"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/health"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <HealthPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/activities"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/communication"
            element={
              <ProtectedRoute>
                <AnnouncementsPage />
              </ProtectedRoute>
            }
          />

          {/* KE_TOAN (KẾ TOÁN TRƯỜNG HỌC) */}
          <Route
            path="/finance/configs"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/billing-engine"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/payments"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finance/reports"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />

          {/* BEP (BẾP BÁN TRÚ & DINH DƯỠNG) */}
          <Route
            path="/kitchen/menus"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen/allergies"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen/safety"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          {/* PHU_HUYNH (PHỤ HUYNH HỌC SINH) */}
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/daily-care"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/tuition"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
                <ParentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/interactions"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN']}>
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
