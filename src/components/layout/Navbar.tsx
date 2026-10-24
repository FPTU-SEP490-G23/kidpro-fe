import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, getRoleBadgeColor } from '../../utils/formatters';
import { LogOut, Bell, User as UserIcon, AlertTriangle, CheckCircle2, Megaphone } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Đóng notification popover khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canManageAnnouncements = ['BGH', 'GIAO_VU', 'SYSTEM_ADMIN'].includes(role || '');

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
        {/* Vai trò người dùng trên Mobile */}
        {role && (
          <div className="md:hidden flex items-center">
            <span
              className={`rounded-lg px-2 py-1 text-[11px] font-bold border ${getRoleBadgeColor(
                role
              )} min-h-[36px] flex items-center`}
            >
              {getRoleDisplayName(role)}
            </span>
          </div>
        )}

        {/* Thông báo Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationOpen((prev) => !prev)}
            aria-label="Thông báo"
            className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#275A4E]" />
                  <span className="text-xs font-bold text-slate-800">Thông Báo & Cảnh Báo</span>
                </div>
                <span className="text-[10px] font-bold bg-[#275A4E]/10 text-[#275A4E] px-2 py-0.5 rounded-full">
                  Hệ thống
                </span>
              </div>

              {/* Danh sách thông báo theo phân hệ vai trò */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                {role === 'BEP' ? (
                  <>
                    <div className="p-3 hover:bg-slate-50 rounded-xl transition text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Khóa suất ăn 08:30 AM
                        </span>
                        <span className="text-[10px] text-slate-400">08:30</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Đã đóng băng số suất ăn có mặt toàn trường để bếp xuất kho và chia định mức bán trú.
                      </p>
                    </div>

                    <div className="p-3 hover:bg-slate-50 rounded-xl transition text-xs space-y-1 bg-amber-50/40">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          Cảnh báo dị ứng thực phẩm
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold">Hôm nay</span>
                      </div>
                      <p className="text-amber-900 text-[11px] leading-relaxed">
                        Phát hiện học sinh có tiền sử dị ứng đậu phộng/hải sản. Vui lòng chế biến suất ăn cách ly an toàn.
                      </p>
                    </div>

                    <div className="p-3 hover:bg-slate-50 rounded-xl transition text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Megaphone className="h-3.5 w-3.5 text-[#275A4E]" />
                          Lưu mẫu thực phẩm 24 giờ
                        </span>
                        <span className="text-[10px] text-slate-400">11:00</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Nhắc nhở niêm phong mẫu thức ăn từng bữa vào tủ lạnh chuyên dụng ở dải nhiệt độ 2°C - 8°C.
                      </p>
                    </div>
                  </>
                ) : role === 'KE_TOAN' ? (
                  <>
                    <div className="p-3 hover:bg-slate-50 rounded-xl transition text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">Quyết toán học phí kỳ</span>
                        <span className="text-[10px] text-slate-400">Tháng này</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Bảng tính học phí tự động đã sẵn sàng đối soát công nợ và phát hành mã VietQR.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 hover:bg-slate-50 rounded-xl transition text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Megaphone className="h-3.5 w-3.5 text-[#275A4E]" />
                          Thông báo điều hành nhà trường
                        </span>
                        <span className="text-[10px] text-slate-400">Mới</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Bản tin kế hoạch hoạt động giảng dạy và an toàn trường mầm non KIDPRO.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Liên kết điều hướng dành riêng cho quyền quản lý thông báo */}
              {canManageAnnouncements && (
                <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                  <Link
                    to="/announcements"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-xs font-bold text-[#275A4E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Mở Trung Tâm Quản Lý Phát Hành Bản Tin</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

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
              <div className="flex items-center gap-1.5">
                <Link
                  to="/profile"
                  className="text-sm font-semibold text-slate-800 leading-tight hover:text-[#275A4E] transition"
                >
                  {user.fullName}
                </Link>
                {user.schoolName && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#275A4E] border border-emerald-200 truncate max-w-[160px]" title={user.schoolName}>
                    {user.schoolName}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {role && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold border ${getRoleBadgeColor(
                      role
                    )}`}
                  >
                    {getRoleDisplayName(role)}
                  </span>
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
