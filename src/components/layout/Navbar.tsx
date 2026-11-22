import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName, getRoleBadgeColor } from '../../utils/formatters';
import {
  LogOut,
  Bell,
  User as UserIcon,
  Megaphone,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCheck,
  Calendar,
  Clock,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { notificationApi, AppNotification } from '../../api/notificationApi';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Danh sách thông báo & Phân trang
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 5;

  // Tải danh sách thông báo
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const list = await notificationApi.getNotifications(role, user?.id);
      setNotifications(list);
    } catch (err) {
      console.warn('Lỗi tải thông báo navbar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [role, user?.id]);

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

  // Chỉ BGH và Cán bộ Giáo vụ mới có quyền mở trung tâm phát hành bản tin
  const canManageAnnouncements = role === 'BGH' || role === 'GIAO_VU';

  // Số lượng thông báo chưa đọc
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Phân trang danh sách 5 thông báo / trang
  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const displayedNotifications = notifications.slice(startIndex, startIndex + PAGE_SIZE);

  // Xem chi tiết thông báo và đánh dấu đã đọc
  const handleSelectNotification = async (item: AppNotification) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === item.notificationId ? { ...n, isRead: true } : n))
      );
      await notificationApi.markAsRead(item.notificationId, user?.id);
    }
    setSelectedNotification({ ...item, isRead: true });
  };

  // Xóa 1 thông báo
  const handleDeleteNotification = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
    if (selectedNotification?.notificationId === id) {
      setSelectedNotification(null);
    }
    await notificationApi.deleteNotification(id, user?.id);
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    const allIds = notifications.map((n) => n.notificationId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await notificationApi.markAllAsRead(allIds, user?.id);
  };

  // Điều hướng chuyển trang khi bấm vào nút tác vụ liên kết
  const handleNavigateToAction = (actionUrl?: string) => {
    if (!actionUrl) return;
    setIsNotificationOpen(false);
    setSelectedNotification(null);
    navigate(actionUrl);
  };

  // Mở tệp đính kèm
  const handleOpenAttachment = (url?: string, name?: string) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:'))) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const fallbackContent = `Tài liệu thông báo: ${name || 'Đính kèm'}\nĐơn vị ban hành: KidPro Mầm Non\nThời gian: ${new Date().toLocaleString('vi-VN')}\nTrạng thái: Đã kiểm duyệt an toàn.`;
    const blob = new Blob([fallbackContent], { type: 'application/pdf;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = name || 'tai-lieu-thong-bao.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  // Định dạng thời gian
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
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

          {/* Nút quả chuông Thông Báo Popover */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationOpen((prev) => !prev);
                if (!isNotificationOpen) {
                  loadNotifications();
                }
              }}
              aria-label="Thông báo"
              title={unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Thông báo'}
              className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header danh sách thông báo */}
                <div className="p-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#275A4E]" />
                    <span className="text-xs font-bold text-slate-800">Thông Báo & Cảnh Báo</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                        {unreadCount} mới
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllAsRead}
                      className="text-[11px] font-semibold text-[#275A4E] hover:underline flex items-center gap-1 cursor-pointer"
                      title="Đánh dấu tất cả là đã đọc"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Đọc hết</span>
                    </button>
                  )}
                </div>

                {/* Danh sách thông báo theo phân trang */}
                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 p-1">
                  {loading ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Đang cập nhật thông báo...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-600">Không có thông báo nào</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Bạn đã xem hết các thông báo hệ thống</p>
                    </div>
                  ) : (
                    displayedNotifications.map((n) => {
                      const isUnread = !n.isRead;
                      return (
                        <div
                          key={n.notificationId}
                          onClick={() => handleSelectNotification(n)}
                          className={`p-3 rounded-xl transition text-xs space-y-1 cursor-pointer group relative ${
                            isUnread
                              ? 'bg-emerald-50/70 border-l-4 border-[#275A4E] hover:bg-emerald-100/60'
                              : 'bg-white hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span
                              className={`leading-snug line-clamp-1 flex-1 flex items-center gap-1.5 ${
                                isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                              }`}
                            >
                              {n.type === 'ATTENDANCE' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              ) : n.type === 'REQUEST' ? (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Megaphone className="h-3.5 w-3.5 text-[#275A4E] shrink-0" />
                              )}
                              <span>{n.title}</span>
                            </span>

                            <div className="flex items-center gap-1 shrink-0">
                              {isUnread && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                  Mới
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteNotification(e, n.notificationId)}
                                title="Xóa thông báo này"
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p
                            className={`text-[11px] leading-relaxed line-clamp-2 ${
                              isUnread ? 'text-slate-800 font-medium' : 'text-slate-500'
                            }`}
                          >
                            {n.body}
                          </p>

                          <div className="flex items-center justify-between pt-0.5 text-[10px]">
                            <span className="text-slate-400">{n.authorName || 'Hệ thống'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">{formatTime(n.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Thanh điều hướng phân trang (5 thông báo / trang) */}
                {notifications.length > PAGE_SIZE && (
                  <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-600 px-3">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold text-[11px] shadow-2xs"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>

                    <span className="font-bold text-slate-700 text-[11px]">
                      Trang {safePage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold text-[11px] shadow-2xs"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Nút Mở Trung Tâm Quản Lý Phát Hành Bản Tin: CHỈ HIỂN THỊ KHI ROLE LÀ BGH HOẶC GIÁO VỤ */}
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
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-[#275A4E] border border-emerald-200 truncate max-w-[160px]"
                      title={user.schoolName}
                    >
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

      {/* Modal Xem Chi Tiết Thông Báo Khi Nhấp Vào Item */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#275A4E] flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Chi Tiết Thông Báo</h3>
                  <p className="text-[11px] text-slate-500">
                    Phát hành bởi: <span className="font-semibold text-slate-700">{selectedNotification.authorName || 'Nhà trường'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mb-2">
                  {selectedNotification.type || 'THÔNG BÁO'}
                </span>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {selectedNotification.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(selectedNotification.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(selectedNotification.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {selectedNotification.body}
              </div>

              {selectedNotification.attachmentName && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold truncate">
                    <Paperclip className="w-4 h-4 shrink-0 text-[#275A4E]" />
                    <span className="truncate">{selectedNotification.attachmentName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAttachment(selectedNotification.attachmentUrl, selectedNotification.attachmentName)}
                    className="px-3.5 py-1.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white rounded-xl font-bold transition shrink-0 ml-2 flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <span>Mở tệp / Tải về</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => {
                  handleDeleteNotification(e, selectedNotification.notificationId);
                  setSelectedNotification(null);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa thông báo</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
