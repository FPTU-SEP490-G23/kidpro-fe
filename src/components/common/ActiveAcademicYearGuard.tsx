import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { academicYearApi } from '../../api/academicYearApi';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Lock, ArrowRight, Calendar, Sparkles } from 'lucide-react';

interface ActiveAcademicYearGuardProps {
  children: React.ReactNode;
}

export const ActiveAcademicYearGuard: React.FC<ActiveAcademicYearGuardProps> = ({ children }) => {
  const { role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: activeYear, isLoading } = useQuery({
    queryKey: ['active-academic-year'],
    queryFn: () => academicYearApi.getActiveAcademicYear(),
    staleTime: 1000 * 60 * 2, // 2 phút
    refetchOnWindowFocus: true,
  });

  // Danh sách các đường dẫn cho phép truy cập để BGH cấu hình / kích hoạt năm học
  const isYearSetupRoute =
    location.pathname.startsWith('/bgh/academic-planning') ||
    location.pathname.startsWith('/bgh/school-setup') ||
    location.pathname === '/login' ||
    location.pathname === '/profile';

  const hasActiveYear = Boolean(activeYear && (activeYear.status === 'ACTIVE' || (activeYear as any).isActive));

  // Nếu đang tải hoặc đã có niên khóa active, hoặc đang ở trang thiết lập niên khóa
  if (isLoading || hasActiveYear) {
    return <>{children}</>;
  }

  // Nếu chưa có niên khóa hoạt động nhưng đang ở chính trang quản lý niên khóa -> cho phép hiển thị để kích hoạt
  if (isYearSetupRoute) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between text-amber-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Hệ thống chưa có Niên khóa nào đang hoạt động!</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Vui lòng nhấn nút <strong className="text-emerald-700">"Kích hoạt"</strong> ở niên khóa bên dưới để bắt đầu đưa hệ thống vào vận hành.
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Trường hợp chưa có niên khóa hoạt động và truy cập vào các trang nghiệp vụ khác -> CHẶN LẠI VỚI THÔNG BÁO RÕ RÀNG
  const isBghOrAdmin = ['BGH', 'SYSTEM_ADMIN', 'ADMIN'].includes(role || '');

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-rose-50 border-4 border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600 shadow-inner">
          <Lock className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Hệ Thống Tạm Khóa Hoạt Động
          </span>
          <h2 className="text-xl font-black text-slate-900">Chưa Có Niên Khóa Nào Hoạt Động</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Hệ thống KIDPRO yêu cầu phải có ít nhất <strong>01 niên khóa hoạt động (ACTIVE)</strong> để vận hành các nghiệp vụ giảng dạy, xếp lớp, phân công và học phí.
          </p>
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 border border-slate-200 text-left">
            📌 <strong>Quy định:</strong> Mọi hành động thêm mới, chỉnh sửa và phê duyệt của mọi vai trò tạm thời bị vô hiệu hóa cho đến khi Ban Giám hiệu kích hoạt niên khóa mới.
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          {isBghOrAdmin ? (
            <button
              type="button"
              onClick={() => navigate('/bgh/academic-planning')}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-sm shadow-md transition cursor-pointer active:scale-95"
            >
              <Calendar className="w-4 h-4" />
              <span>Đi Tới Kích Hoạt Niên Khóa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-xs font-medium text-slate-400 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800">
              Vui lòng liên hệ <strong>Ban Giám hiệu</strong> để phê duyệt và kích hoạt niên khóa mới trước khi thao tác.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveAcademicYearGuard;
