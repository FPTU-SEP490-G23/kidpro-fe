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
  CalendarDays,
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
            Hồ Sơ Giáo Viên
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
            Thông Tin Tài Khoản & Phân Công
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Thông tin định danh và quản lý quyền truy cập
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Thẻ định danh giáo viên */}
        <div className="md:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user?.fullName ? user.fullName.charAt(0) : 'GV'}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Giáo Viên Chủ Nhiệm
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{user?.fullName || 'Cô Giáo'}</h2>
              <p className="text-xs text-slate-500 font-medium">{user?.email || 'giaovien@kidpro.edu.vn'}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Trạng thái tài khoản:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Đang hoạt động</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Tiêu chuẩn nghiệp vụ:</span>
              <span className="font-semibold text-slate-800">Thông tư 28/2020/TT-BGDĐT</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 active:scale-98 text-rose-600 font-bold text-xs rounded-2xl border border-rose-200 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Đăng Xuất Khỏi Hệ Thống
          </button>
        </div>

        {/* Thông tin trường học & Phân công */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Phân Công Chuyên Môn & Đơn Vị Công Tác
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <School className="w-4 h-4 text-blue-500" /> Cơ sở trường mầm non:
              </span>
              <span className="font-bold text-slate-800">{user?.schoolName || 'Mầm Non Thực Nghiệm KIDPRO'}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <Shield className="w-4 h-4 text-indigo-500" /> Vai trò hệ thống:
              </span>
              <span className="font-bold text-slate-800">GIAO_VIEN (Giáo viên Chủ nhiệm)</span>
            </div>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
              <span className="flex items-center gap-2 text-slate-500 font-medium">
                <Mail className="w-4 h-4 text-teal-500" /> Mã định danh trường:
              </span>
              <span className="font-bold text-slate-800">{user?.schoolCode || 'KIDPRO-01'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
