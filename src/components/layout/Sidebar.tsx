import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import {
  LayoutDashboard,
  GraduationCap,
  ClipboardCheck,
  UtensilsCrossed,
  Receipt,
  HeartPulse,
  Baby,
  Megaphone,
  School,
  ShieldCheck,
  UserCheck,
  CalendarDays,
  Cpu,
  Activity,
  LineChart,
  Users,
  Lock,
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Tổng quan',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Điều hành Toàn trường',
    path: '/executive-dashboard',
    icon: LineChart,
    roles: ['BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Học vụ & Lớp học',
    path: '/academic',
    icon: GraduationCap,
    roles: ['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Kế hoạch Năm học',
    path: '/academic/years',
    icon: CalendarDays,
    roles: ['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Biến động Học sinh',
    path: '/academic/student-analytics',
    icon: Users,
    roles: ['BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Điểm danh lớp',
    path: '/attendance',
    icon: ClipboardCheck,
    roles: ['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Báo bếp & Thực đơn',
    path: '/kitchen',
    icon: UtensilsCrossed,
    roles: ['BEP', 'BGH', 'GIAO_VU', 'GIAO_VIEN', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Kế toán & Học phí',
    path: '/finance',
    icon: Receipt,
    roles: ['KE_TOAN', 'BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Sức khỏe & Nhật ký',
    path: '/health',
    icon: HeartPulse,
    roles: ['GIAO_VIEN', 'BGH', 'GIAO_VU', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Cổng Phụ huynh',
    path: '/parent',
    icon: Baby,
    roles: ['PHU_HUYNH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Thông báo trường',
    path: '/announcements',
    icon: Megaphone,
  },
  {
    name: 'Quản lý Trường học',
    path: '/admin/tenants',
    icon: School,
    roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Phân quyền RBAC',
    path: '/admin/rbac',
    icon: ShieldCheck,
    roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Tích hợp & Dịch vụ',
    path: '/admin/integrations',
    icon: Cpu,
    roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Giám sát Hệ thống',
    path: '/admin/health',
    icon: Activity,
    roles: ['SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Nhật ký An ninh',
    path: '/admin/audit-logs',
    icon: Lock,
    roles: ['BGH', 'SYSTEM_ADMIN', 'SUPER_ADMIN'],
  },
  {
    name: 'Hồ sơ cá nhân',
    path: '/profile',
    icon: UserCheck,
  },
];

export const Sidebar: React.FC = () => {
  const { role } = useAuth();

  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4">
        <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Danh mục tính năng
        </div>

        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-[#275A4E] font-bold border-r-4 border-[#275A4E] shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
          <p className="text-xs font-semibold text-slate-700">KIDPRO System v1.0</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Backend: Spring Boot 3.3.4</p>
          <p className="text-[11px] text-slate-500">Auth: Supabase OAuth</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
