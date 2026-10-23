import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getNavigationForRole,
  getDefaultBadgeCounts,
  NavItem,
  NavGroup,
} from '../../config/navigation.config';
import {
  getRoleDisplayName,
  getRoleBadgeColor,
  getRoleDescription,
} from '../../utils/formatters';
import {
  Building2,
  ShieldCheck,
  Cable,
  Activity,
  ScrollText,
  LayoutDashboard,
  CalendarDays,
  Receipt,
  ShieldAlert,
  Megaphone,
  Baby,
  School,
  CalendarClock,
  FileText,
  ClipboardCheck,
  DoorOpen,
  HeartPulse,
  BookOpen,
  MessageSquare,
  Calculator,
  Cpu,
  CreditCard,
  BarChart3,
  UtensilsCrossed,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Info,
  Camera,
  Clock,
  Pill,
  Coins,
  FileCheck2,
  QrCode,
  Banknote,
  Webhook,
  Bell,
  FileQuestion,
  UserCheck,
  Star,
  Lock,
  CheckCircle2,
  Boxes,
  FileSpreadsheet,
  Archive,
  Calendar,
  ArrowRightLeft,
  Award,
  Percent,
  Timer,
  Moon,
  Users,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  ShieldCheck,
  Cable,
  Activity,
  ScrollText,
  LayoutDashboard,
  CalendarDays,
  Receipt,
  ShieldAlert,
  Megaphone,
  Baby,
  School,
  CalendarClock,
  FileText,
  ClipboardCheck,
  DoorOpen,
  HeartPulse,
  BookOpen,
  MessageSquare,
  Calculator,
  Cpu,
  CreditCard,
  BarChart3,
  UtensilsCrossed,
  User,
  LogOut,
  Camera,
  Clock,
  Pill,
  Coins,
  FileCheck2,
  QrCode,
  Banknote,
  Webhook,
  Bell,
  FileQuestion,
  UserCheck,
  Star,
  Lock,
  CheckCircle2,
  Boxes,
  FileSpreadsheet,
  Archive,
  Calendar,
  ArrowRightLeft,
  Award,
  Percent,
  Timer,
  Moon,
  Users,
  Sparkles,
};

export const SidebarNavigation: React.FC = () => {
  const { user, role, logout } = useAuth();
  const location = useLocation();

  // 1. Trạng thái thu gọn Sidebar (Collapsed 80px / Expanded 260px) lưu vào LocalStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('kidpro_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // 2. Trạng thái thu gọn/mở rộng từng Nhóm Accordion
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 3. Modal xác nhận Đăng xuất
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 4. Badge đếm sự kiện khẩn thời gian thực
  const badges = getDefaultBadgeCounts();

  // Lưu trạng thái collapse vào LocalStorage
  useEffect(() => {
    localStorage.setItem('kidpro_sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleGroup = (groupTitle: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupTitle]: !prev[groupTitle],
    }));
  };

  // Lọc Menu theo vai trò hiện tại
  const navigationGroups = getNavigationForRole(role);

  // Render Badge theo badgeKey
  const renderBadge = (badgeKey?: NavItem['badgeKey'], compact = false) => {
    if (!badgeKey) return null;
    const count = badges[badgeKey];
    if (!count || count <= 0) return null;

    if (compact) {
      let dotColor = 'bg-rose-500';
      if (badgeKey === 'pendingMeals' || badgeKey === 'pendingDisputes') dotColor = 'bg-amber-500';
      if (badgeKey === 'unreadLeaves') dotColor = 'bg-[#78C2AD]';
      return (
        <span
          className={`absolute top-1 right-1 h-2.5 w-2.5 rounded-full ${dotColor} ring-2 ring-white animate-pulse`}
          title={`${count} mục cần xử lý`}
        />
      );
    }

    if (badgeKey === 'unresolvedAlerts') {
      return (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
          {count} khẩn
        </span>
      );
    }
    if (badgeKey === 'pendingMeals') {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
          Chốt 08:30
        </span>
      );
    }
    if (badgeKey === 'overdueInvoices') {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 text-rose-700 border border-rose-300 px-1.5 py-0.5 text-[10px] font-bold">
          {count} nợ
        </span>
      );
    }
    if (badgeKey === 'pendingDisputes') {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 border border-orange-300 px-1.5 py-0.5 text-[10px] font-bold">
          {count} khiếu nại
        </span>
      );
    }
    if (badgeKey === 'unreadLeaves') {
      return (
        <span className="inline-flex items-center rounded-full bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/50 px-1.5 py-0.5 text-[10px] font-bold">
          {count} đơn
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-white transition-all duration-300 z-20 select-none ${
          isCollapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      >
        {/* PHẦN TRÊN: HEADER VAI TRÒ & DANH MỤC MENU */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {/* Header Thông tin Vai trò (Role Badge) */}
          {role && (
            <div
              className={`mb-3 rounded-2xl transition-all duration-200 border ${
                isCollapsed
                  ? 'p-2 flex flex-col items-center justify-center bg-slate-50 border-slate-200'
                  : 'p-3 bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-slate-50 border-emerald-100/80 shadow-2xs'
              }`}
            >
              {isCollapsed ? (
                <div
                  title={`${getRoleDisplayName(role)} - ${getRoleDescription(role)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#275A4E] text-white font-bold text-xs shadow-xs"
                >
                  <Sparkles className="h-4 w-4 text-[#E5A93C]" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Phân hệ RBAC
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(
                        role
                      )}`}
                    >
                      {role}
                    </span>
                  </div>
                  <p className="text-xs font-extrabold text-[#1E4D40] truncate">
                    {getRoleDisplayName(role)}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                    {getRoleDescription(role)}
                  </p>
                </>
              )}
            </div>
          )}

          {/* DANH SÁCH NHÓM MENU RBAC */}
          <div className="space-y-4">
            {navigationGroups.map((group) => {
              const isGroupCollapsed = collapsedGroups[group.groupTitle];

              return (
                <div key={group.groupTitle} className="space-y-1">
                  {/* TIÊU ĐỀ NHÓM (ACCORDION HEADER) */}
                  {!isCollapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupTitle)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      <span className="truncate">{group.groupTitle}</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                          isGroupCollapsed ? '-rotate-90' : 'rotate-0'
                        }`}
                      />
                    </button>
                  ) : (
                    <div className="my-1 border-t border-slate-100" />
                  )}

                  {/* CÁC MỤC MENU CON TRONG NHÓM */}
                  {!isGroupCollapsed && (
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = ICON_MAP[item.icon] || Info;
                        const currentFullPath = location.pathname + (location.search || '');
                        let isActive = false;

                        if (item.path.includes('?')) {
                          const [itemPath, itemQuery] = item.path.split('?');
                          const isAcademicMatch =
                            (location.pathname === '/academic' || location.pathname === '/academic/classes') &&
                            itemPath === '/academic/classes' &&
                            location.search === `?${itemQuery}`;

                          if (currentFullPath === item.path || isAcademicMatch) {
                            isActive = true;
                          } else if (!location.search) {
                            // Mặc định khi vào trang gốc chưa có query string
                            if (item.path === '/academic/classes?subtab=classes' && (location.pathname === '/academic' || location.pathname === '/academic/classes')) isActive = true;
                            if (item.path === '/finance?tab=fee-configs' && location.pathname === '/finance') isActive = true;
                            if (item.path === '/kitchen?tab=portions' && location.pathname === '/kitchen') isActive = true;
                            if (item.path === '/parent?tab=gate-notifications' && location.pathname === '/parent') isActive = true;
                            if (item.path === '/teacher/attendance?tab=gate-ai' && location.pathname === '/teacher/attendance') isActive = true;
                            if (item.path === '/teacher/dismissal?tab=dismissal-pickup' && location.pathname === '/teacher/dismissal') isActive = true;
                            if (item.path === '/teacher/health?tab=incidents' && location.pathname === '/teacher/health') isActive = true;
                            if (item.path === '/teacher/activities?tab=lesson_plans' && location.pathname === '/teacher/activities') isActive = true;
                          }
                        } else {
                          const isExactActive = location.pathname === item.path;
                          const isPrefixActive =
                            item.path !== '/' &&
                            location.pathname.startsWith(item.path) &&
                            item.path !== '/dashboard' &&
                            item.path !== '/academic';
                          if (item.path === '/academic/classes' && location.pathname === '/academic') {
                            isActive = true;
                          } else {
                            isActive = isExactActive || isPrefixActive;
                          }
                        }

                        return (
                          <div key={item.id} className="relative group">
                            <NavLink
                              to={item.path}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition min-h-[44px] ${
                                isActive
                                  ? 'bg-emerald-50 text-[#275A4E] font-bold border-r-4 border-[#275A4E] shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              } ${isCollapsed ? 'justify-center px-2' : ''}`}
                            >
                              <div className="relative shrink-0">
                                <Icon
                                  className={`h-5 w-5 ${
                                    isActive ? 'text-[#275A4E]' : 'text-slate-500 group-hover:text-slate-800'
                                  }`}
                                />
                                {isCollapsed && renderBadge(item.badgeKey, true)}
                              </div>

                              {!isCollapsed && (
                                <div className="flex-1 min-w-0 flex items-center justify-between gap-1.5">
                                  <span className="truncate">{item.title}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {renderBadge(item.badgeKey, false)}
                                    {item.useCases && item.useCases.length > 0 && (
                                      <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-500 border border-slate-200/60"
                                        title={`Đặc tả SRS: ${item.useCases.join(', ')}`}
                                      >
                                        {item.useCases[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </NavLink>

                            {/* FLOATING TOOLTIP KHI THU GỌN SIDEBAR (COLLAPSED 80PX) */}
                            {isCollapsed && (
                              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 hidden group-hover:flex flex-col gap-1 rounded-xl bg-slate-900 px-3 py-2 text-white shadow-xl pointer-events-none min-w-[180px]">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold leading-tight">{item.title}</p>
                                  {renderBadge(item.badgeKey, false)}
                                </div>
                                {item.useCases && item.useCases.length > 0 && (
                                  <p className="text-[10px] text-slate-400 font-medium">
                                    Use Cases: {item.useCases.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </nav>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PHẦN DƯỚI: THÔNG TIN TÀI KHOẢN, TOGGLE THU GỌN & NÚT ĐĂNG XUẤT */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {/* NÚT THU GỌN / MỞ RỘNG (COLLAPSE BUTTON) */}
          <button
            type="button"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Mở rộng thanh menu (260px)' : 'Thu gọn thanh menu (80px)'}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2 px-2 text-xs font-semibold text-slate-500 hover:bg-slate-200/60 hover:text-slate-800 transition cursor-pointer min-h-[40px]"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-[#275A4E]" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 text-[#275A4E]" />
                <span className="truncate">Thu gọn Menu (80px)</span>
              </>
            )}
          </button>

          {/* KHỐI TÀI KHOẢN & ĐĂNG XUẤT */}
          {user && (
            <div
              className={`flex items-center gap-2 rounded-xl p-2 bg-white border border-slate-200/80 shadow-2xs ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              {!isCollapsed && (
                <NavLink
                  to="/profile"
                  className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-85 transition"
                  title="Xem hồ sơ cá nhân [UC-004]"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-50 border border-[#78C2AD] text-[#275A4E] font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                    ) : (
                      user.fullName?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </NavLink>
              )}

              {/* NÚT ĐĂNG XUẤT (UC-003) */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                title="Đăng xuất tài khoản [UC-003]"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition shrink-0 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MODAL XÁC NHẬN ĐĂNG XUẤT AN TOÀN (UC-003) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 mx-auto">
              <LogOut className="h-6 w-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 text-center">
              Xác Nhận Đăng Xuất Hệ Thống
            </h3>
            <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi Hệ sinh thái KIDPRO? Phiên làm việc bảo mật của bạn sẽ được đóng an toàn [UC-003].
            </p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer min-h-[44px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition cursor-pointer min-h-[44px]"
              >
                Đăng xuất ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarNavigation;
