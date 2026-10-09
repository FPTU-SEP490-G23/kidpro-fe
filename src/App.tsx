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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Đường dẫn công khai */}
        <Route path="/login" element={<LoginPage />} />

        {/* Hệ thống bảo vệ RBAC trong MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 1. Dashboard: Mọi người dùng đã đăng nhập */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* 2. Điểm danh: Giáo viên, BGH, Giáo vụ, Admin */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN']}>
                <AttendancePage />
              </ProtectedRoute>
            }
          />

          {/* 3. Báo bếp & Thực đơn: Bếp, BGH, Giáo vụ, Giáo viên, Admin */}
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN']}>
                <KitchenPage />
              </ProtectedRoute>
            }
          />

          {/* 4. Kế toán & Học phí: Kế toán, BGH, Admin */}
          <Route
            path="/finance"
            element={
              <ProtectedRoute allowedRoles={['KE_TOAN', 'BGH', 'SYSTEM_ADMIN']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />

          {/* 5. Sức khỏe & Nhật ký ảnh: Giáo viên, BGH, Giáo vụ, Admin */}
          <Route
            path="/health"
            element={
              <ProtectedRoute allowedRoles={['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN']}>
                <HealthPage />
              </ProtectedRoute>
            }
          />

          {/* 6. Học vụ & Chuyển lớp: BGH, Giáo vụ, Admin */}
          <Route
            path="/academic"
            element={
              <ProtectedRoute allowedRoles={['BGH', 'GIAO_VU', 'SYSTEM_ADMIN']}>
                <AcademicPage />
              </ProtectedRoute>
            }
          />

          {/* 7. Cổng Phụ huynh: Phụ huynh, Admin */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['PHU_HUYNH', 'SYSTEM_ADMIN']}>
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

          {/* Trang lỗi */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
