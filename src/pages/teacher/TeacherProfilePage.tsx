import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  User,
  School,
  Mail,
  Shield,
  LogOut,
  ChevronRight,
  Phone,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TeacherProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-lg font-bold text-slate-900">Tài Khoản Giáo Viên</h1>

      {/* Thông tin thẻ cá nhân */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xl flex items-center justify-center shadow-md">
          {user?.fullName ? user.fullName.charAt(0) : 'GV'}
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Giáo Viên Chủ Nhiệm
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-1">{user?.fullName || 'Cô Giáo'}</h2>
          <p className="text-xs text-slate-500">{user?.email || 'giaovien@kidpro.edu.vn'}</p>
        </div>
      </div>

      {/* Thông tin trường học */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thông Tin Trường & Phân Công</h3>
        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="flex items-center gap-2 text-slate-400">
              <School className="w-4 h-4 text-blue-500" /> Trường:
            </span>
            <span className="font-semibold text-slate-800">{user?.schoolName || 'Mầm Non Thực Nghiệm KIDPRO'}</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-slate-50">
            <span className="flex items-center gap-2 text-slate-400">
              <Shield className="w-4 h-4 text-blue-500" /> Vai trò:
            </span>
            <span className="font-semibold text-slate-800">Giáo viên Chủ nhiệm (TT28)</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="flex items-center gap-2 text-slate-400">
              <Mail className="w-4 h-4 text-blue-500" /> Mã trường:
            </span>
            <span className="font-semibold text-slate-800">{user?.schoolCode || 'KIDPRO-01'}</span>
          </div>
        </div>
      </div>

      {/* Đăng xuất */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 touch-target transition-all"
      >
        <LogOut className="w-4 h-4" /> Đăng Xuất Khỏi Tài Khoản
      </button>
    </div>
  );
};
