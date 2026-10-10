import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import {
  Baby,
  GraduationCap,
  ClipboardCheck,
  UtensilsCrossed,
  Receipt,
  HeartPulse,
  Megaphone,
  UserCheck,
  LayoutDashboard,
  LineChart,
  Users,
  ShieldCheck,
  School,
  Activity,
} from 'lucide-react';

interface BottomNavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

const getRoleBottomNav = (role?: UserRole | null): BottomNavItem[] => {
  switch (role) {
    case 'PHU_HUYNH':
      return [
        { name: 'Sổ liên lạc', path: '/parent', icon: Baby },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
        { name: 'Tài khoản', path: '/profile', icon: UserCheck },
      ];

    case 'GIAO_VIEN':
      return [
        { name: 'Điểm danh', path: '/attendance', icon: ClipboardCheck },
        { name: 'Giáo án & Lớp', path: '/academic', icon: GraduationCap },
        { name: 'Sức khỏe', path: '/health', icon: HeartPulse },
        { name: 'Báo bếp', path: '/kitchen', icon: UtensilsCrossed },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
      ];

    case 'BEP':
      return [
        { name: 'Bếp ăn', path: '/kitchen', icon: UtensilsCrossed },
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
        { name: 'Tài khoản', path: '/profile', icon: UserCheck },
      ];

    case 'KE_TOAN':
      return [
        { name: 'Học phí', path: '/finance', icon: Receipt },
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
        { name: 'Tài khoản', path: '/profile', icon: UserCheck },
      ];

    case 'GIAO_VU':
      return [
        { name: 'Học vụ', path: '/academic', icon: GraduationCap },
        { name: 'Điểm danh', path: '/attendance', icon: ClipboardCheck },
        { name: 'Biến động HS', path: '/academic/student-analytics', icon: Users },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
        { name: 'Tài khoản', path: '/profile', icon: UserCheck },
      ];

    case 'BGH':
      return [
        { name: 'Điều hành', path: '/executive-dashboard', icon: LineChart },
        { name: 'Học vụ', path: '/academic', icon: GraduationCap },
        { name: 'Tài chính', path: '/finance', icon: Receipt },
        { name: 'Điểm danh', path: '/attendance', icon: ClipboardCheck },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
      ];

    case 'SYSTEM_ADMIN':
    case 'SUPER_ADMIN':
      return [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Học vụ', path: '/academic', icon: GraduationCap },
        { name: 'Trường học', path: '/admin/tenants', icon: School },
        { name: 'RBAC', path: '/admin/rbac', icon: ShieldCheck },
        { name: 'Giám sát', path: '/admin/health', icon: Activity },
      ];

    default:
      return [
        { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Bản tin', path: '/announcements', icon: Megaphone },
        { name: 'Tài khoản', path: '/profile', icon: UserCheck },
      ];
  }
};

export const MobileBottomNav: React.FC = () => {
  const { role } = useAuth();
  const navItems = getRoleBottomNav(role);

  return (
    <nav
      aria-label="Thanh tác vụ di động theo vai trò"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around px-1 py-1 safe-area-bottom"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex-1 min-h-[48px] min-w-[48px] py-1 px-1 flex flex-col items-center justify-center transition-all duration-150 rounded-xl select-none ${
                isActive
                  ? 'text-[#275A4E] font-bold bg-[#275A4E]/8 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#275A4E]' : 'text-slate-500'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-3 rounded-full bg-[#275A4E]" />
                  )}
                </div>
                <span className="text-[10px] tracking-tight leading-tight mt-1 line-clamp-1 truncate max-w-[64px]">
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
