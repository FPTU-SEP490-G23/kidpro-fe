import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Camera,
  LogOut,
  MessageSquare,
  User,
  ShieldCheck,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TeacherShell: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      to: '/teacher',
      label: 'Trang chủ',
      icon: Home,
      exact: true,
    },
    {
      to: '/teacher/attendance',
      label: 'Điểm danh',
      icon: ClipboardCheck,
    },
    {
      to: '/teacher/dismissal',
      label: 'Tan học',
      icon: ShieldCheck,
    },
    {
      to: '/teacher/chat',
      label: 'Nhóm lớp',
      icon: MessageSquare,
    },
    {
      to: '/teacher/profile',
      label: 'Tài khoản',
      icon: User,
    },
  ];

  const isActiveRoute = (to: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === to;
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-dvh bg-slate-100 flex flex-col justify-between text-slate-800">
      {/* Vùng nội dung chính cuộn độc lập */}
      <main className="flex-1 pb-20 md:pb-6 overflow-y-auto">
        <Outlet />
      </main>

      {/* Thanh Bottom Navigation Bar cố định ở đáy (Mobile-first HIG) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-lg">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const active = isActiveRoute(item.to, item.exact);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center flex-1 py-1 touch-target rounded-xl transition-all ${
                  active ? 'text-blue-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`relative p-1 rounded-full ${active ? 'bg-blue-50' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
