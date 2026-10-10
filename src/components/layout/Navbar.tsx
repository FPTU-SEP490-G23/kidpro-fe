import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import { getRoleDisplayName, getRoleBadgeColor, getRoleHomePath } from '../../utils/formatters';
import { LogOut, Bell, User as UserIcon } from 'lucide-react';

const allRoles: UserRole[] = [
  'SYSTEM_ADMIN',
  'SUPER_ADMIN',
  'BGH',
  'GIAO_VIEN',
  'GIAO_VU',
  'KE_TOAN',
  'BEP',
  'PHU_HUYNH',
];

export const Navbar: React.FC = () => {
  const { user, role, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    const targetPath = getRoleHomePath(newRole);
    navigate(targetPath);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            <span className="text-[#275A4E]">KIDPRO</span>{' '}
            <span className="hidden sm:inline text-sm font-normal text-slate-500">
              | Hệ sinh thái Mầm non
            </span>
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Bộ chuyển vai trò trải nghiệm trên Mobile */}
        {role && (
          <div className="md:hidden flex items-center">
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              title="Chuyển đổi vai trò trải nghiệm"
              className={`rounded-lg px-2 py-1 text-[11px] font-bold border ${getRoleBadgeColor(
                role
              )} cursor-pointer focus:outline-hidden min-h-[36px]`}
            >
              {allRoles.map((r) => (
                <option key={r} value={r} className="bg-white text-slate-800 text-xs">
                  {getRoleDisplayName(r)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Thông báo */}
        <Link
          to="/announcements"
          aria-label="Thông báo"
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </Link>

        {/* Thông tin người dùng & Role */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-200 pl-2 sm:pl-4">
            <Link
              to="/profile"
              title="Xem hồ sơ cá nhân"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 border border-[#78C2AD] text-[#275A4E] font-semibold overflow-hidden hover:ring-2 hover:ring-[#78C2AD]/50 transition shrink-0"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-5 w-5" />
              )}
            </Link>

            <div className="hidden md:flex flex-col">
              <Link
                to="/profile"
                className="text-sm font-semibold text-slate-800 leading-tight hover:text-[#275A4E] transition"
              >
                {user.fullName}
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                {role && (
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    title="Chuyển đổi vai trò trải nghiệm"
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold border ${getRoleBadgeColor(
                      role
                    )} cursor-pointer focus:outline-hidden hover:opacity-90`}
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r} className="bg-white text-slate-800 text-xs">
                        {getRoleDisplayName(r)}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
            </div>

            {/* Nút Đăng xuất */}
            <button
              onClick={() => logout()}
              title="Đăng xuất"
              className="ml-1 sm:ml-2 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
