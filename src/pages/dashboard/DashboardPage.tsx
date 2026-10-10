import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/common/StatCard';
import { getRoleDisplayName, formatCurrency } from '../../utils/formatters';
import { supabase } from '../../config/supabase';
import {
  Users,
  ClipboardCheck,
  UtensilsCrossed,
  Receipt,
  HeartPulse,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    presentToday: 0,
    leaveToday: 0,
    kitchenPortions: 0,
    paidRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra thời gian chốt bếp 08:30 AM
  const now = new Date();
  const cutoffTime = new Date();
  cutoffTime.setHours(8, 30, 0, 0);
  const isKitchenLocked = now > cutoffTime;

  // Tải số liệu thống kê thật từ Database Supabase
  const loadDashboardStats = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Tổng số học sinh (academic.students & public)
      let studentCount: number | null = null;
      try {
        const { count, error } = await supabase.schema('academic').from('students').select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') studentCount = count;
        else {
          const { count: pubCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
          studentCount = pubCount;
        }
      } catch {
        const { count: pubCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
        studentCount = pubCount;
      }

      // 2. Tổng số lớp học (core.classes & public)
      let classCount: number | null = null;
      try {
        const { count, error } = await supabase.schema('core').from('classes').select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') classCount = count;
        else {
          const { count: pubCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
          classCount = pubCount;
        }
      } catch {
        const { count: pubCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
        classCount = pubCount;
      }

      // 3. Điểm danh hôm nay (attendance.attendances & public)
      let presentCount: number | null = null;
      try {
        const { count, error } = await supabase
          .schema('attendance')
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'PRESENT');
        if (!error && typeof count === 'number') presentCount = count;
        else {
          const { count: pubCount } = await supabase
            .from('attendances')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .eq('status', 'PRESENT');
          presentCount = pubCount;
        }
      } catch {
        const { count: pubCount } = await supabase
          .from('attendances')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'PRESENT');
        presentCount = pubCount;
      }

      // 4. Đơn xin nghỉ được duyệt hôm nay (attendance.leave_requests & public)
      let leaveCount: number | null = null;
      try {
        const { count, error } = await supabase
          .schema('attendance')
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'APPROVED');
        if (!error && typeof count === 'number') leaveCount = count;
        else {
          const { count: pubCount } = await supabase
            .from('leave_requests')
            .select('*', { count: 'exact', head: true })
            .eq('date', today)
            .eq('status', 'APPROVED');
          leaveCount = pubCount;
        }
      } catch {
        const { count: pubCount } = await supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'APPROVED');
        leaveCount = pubCount;
      }

      // 5. Tổng học phí đã thu (finance.invoices & public)
      let paidInv: any[] | null = null;
      try {
        const { data, error } = await supabase
          .schema('finance')
          .from('invoices')
          .select('total_amount, paid_amount')
          .eq('status', 'PAID');
        if (!error && data) paidInv = data;
        else {
          const { data: pubData } = await supabase
            .from('invoices')
            .select('total_amount, paid_amount')
            .eq('status', 'PAID');
          paidInv = pubData;
        }
      } catch {
        const { data: pubData } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount')
          .eq('status', 'PAID');
        paidInv = pubData;
      }

      const sumPaid = paidInv?.reduce(
        (acc: number, curr: any) => acc + Number(curr.paid_amount || curr.total_amount || 0),
        0
      ) || 0;

      const totalStu = studentCount || 0;
      const present = presentCount || 0;
      const leaves = leaveCount || 0;

      setStats({
        totalStudents: totalStu,
        totalClasses: classCount || 0,
        presentToday: present,
        leaveToday: leaves,
        kitchenPortions: present > 0 ? present : Math.max(0, totalStu - leaves),
        paidRevenue: sumPaid,
      });
    } catch (err: any) {
      console.warn('Lỗi khi tải thống kê Dashboard:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const attendanceRatio =
    stats.totalStudents > 0
      ? `${((stats.presentToday / stats.totalStudents) * 100).toFixed(1)}%`
      : '0%';

  return (
    <div className="space-y-6">
      {/* Banner Chào mừng & Vai trò */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-6 md:p-8 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Vai trò hiện tại: {role ? getRoleDisplayName(role) : 'Khách'}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.fullName || 'Người dùng'}! 👋
          </h2>
          <p className="mt-1 text-sm text-indigo-100 max-w-xl">
            Chào mừng bạn đến với Cổng thông tin Quản lý Mầm non KIDPRO. Hệ thống tích hợp toàn diện Điểm danh, Bếp ăn, Học vụ, Kế toán và Phụ huynh.
          </p>
        </div>

        {/* Trạng thái Bếp ăn 08:30 AM Rule */}
        <div className="flex flex-col gap-2 items-start md:items-end">
          <button
            onClick={loadDashboardStats}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/30 transition shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Cập nhật số liệu</span>
          </button>

          <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200">
              <Clock className="h-4 w-4 text-amber-300" />
              <span>Quy tắc Bếp ăn 08:30 AM</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                  isKitchenLocked
                    ? 'bg-rose-500 text-white'
                    : 'bg-emerald-500 text-white animate-pulse'
                }`}
              >
                {isKitchenLocked ? '🔒 ĐÃ ĐÓNG BĂNG SUẤT ĂN' : '🟢 ĐANG MỞ ĐIỂM DANH'}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-indigo-200">
              {isKitchenLocked
                ? 'Số suất ăn ngày hôm nay đã được khóa cứng.'
                : 'Dữ liệu học sinh nghỉ học sẽ chốt vào đúng 08:30 AM.'}
            </p>
          </div>
        </div>
      </div>

      {/* Thẻ Thống kê Tổng quan Số liệu Thật */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng học sinh"
          value={isLoading ? '...' : `${stats.totalStudents}`}
          subtitle={`Đang theo học ${stats.totalClasses} lớp`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Điểm danh hôm nay"
          value={isLoading ? '...' : `${stats.presentToday} / ${stats.totalStudents}`}
          subtitle={`Tỉ lệ có mặt ${attendanceRatio}`}
          icon={ClipboardCheck}
          color="emerald"
        />
        <StatCard
          title="Suất ăn cần nấu"
          value={isLoading ? '...' : `${stats.kitchenPortions}`}
          subtitle={`Đã trừ ${stats.leaveToday} đơn xin nghỉ`}
          icon={UtensilsCrossed}
          color="amber"
        />
        <StatCard
          title="Học phí đã thu"
          value={isLoading ? '...' : formatCurrency(stats.paidRevenue)}
          subtitle="Doanh thu thực tế đã ghi nhận"
          icon={Receipt}
          color="cyan"
        />
      </div>

      {/* Lối tắt chức năng nhanh theo Vai trò */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phím tắt thao tác */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
            <span>Tác vụ nhanh cho bạn</span>
            <span className="text-xs font-normal text-slate-400">Chọn chức năng bên dưới</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phím tắt cho Giáo viên / BGH */}
            {(role === 'GIAO_VIEN' || role === 'BGH' || role === 'SYSTEM_ADMIN') && (
              <>
                <button
                  onClick={() => navigate('/attendance')}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">Điểm danh lớp</p>
                      <p className="text-xs text-slate-500">Ghi nhận có mặt & giờ đón</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
                </button>

                <button
                  onClick={() => navigate('/health')}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-emerald-400 hover:bg-emerald-50/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <HeartPulse className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600">Nhật ký & Sức khỏe</p>
                      <p className="text-xs text-slate-500">Đo BMI WHO & ảnh hoạt động</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                </button>
              </>
            )}

            {/* Phím tắt cho Bếp */}
            {(role === 'BEP' || role === 'BGH' || role === 'SYSTEM_ADMIN') && (
              <button
                onClick={() => navigate('/kitchen')}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-amber-400 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <UtensilsCrossed className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-amber-600">Báo suất ăn bếp</p>
                    <p className="text-xs text-slate-500">Xem chốt suất & dị ứng học sinh</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
              </button>
            )}

            {/* Phím tắt cho Kế toán */}
            {(role === 'KE_TOAN' || role === 'BGH' || role === 'SYSTEM_ADMIN') && (
              <button
                onClick={() => navigate('/finance')}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-cyan-400 hover:bg-cyan-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-cyan-600">Quyết toán học phí</p>
                    <p className="text-xs text-slate-500">Tính tự động theo ngày vắng</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-600 group-hover:translate-x-1 transition" />
              </button>
            )}

            {/* Phím tắt cho Phụ huynh */}
            {(role === 'PHU_HUYNH' || role === 'SYSTEM_ADMIN') && (
              <button
                onClick={() => navigate('/parent')}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-purple-400 hover:bg-purple-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-600">Xin nghỉ học</p>
                    <p className="text-xs text-slate-500">Quy tắc nộp trước 08:00 AM</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
              </button>
            )}

            {/* Phím tắt cho Giáo vụ */}
            {(role === 'GIAO_VU' || role === 'BGH' || role === 'SYSTEM_ADMIN') && (
              <button
                onClick={() => navigate('/academic')}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50/50 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">Học vụ & Lớp học</p>
                    <p className="text-xs text-slate-500">Thời khóa biểu & Chuyển lớp</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
              </button>
            )}
          </div>
        </div>

        {/* Cảnh báo an toàn mầm non & Quy tắc nghiệp vụ */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
              <ShieldAlert className="h-5 w-5" />
              <span>Quy tắc Nghiệp vụ Trọng yếu</span>
            </div>

            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 shrink-0">1.</span>
                <span>
                  <strong>Hạn chót xin nghỉ học (08:00 AM):</strong> Phụ huynh nộp đơn xin nghỉ trong ngày sau 08:00 AM sẽ bị hệ thống tự động từ chối.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 shrink-0">2.</span>
                <span>
                  <strong>Khóa chốt báo suất ăn bếp (08:30 AM):</strong> Bếp chốt số lượng suất ăn cố định vào 08:30 AM hàng ngày để nhập thực phẩm và đảm bảo an toàn VSTP.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 shrink-0">3.</span>
                <span>
                  <strong>Quyết toán học phí động:</strong> Tiền học tháng = Tiền cố định - (Số ngày vắng có phép × Tiền ăn/ngày) + Phí đón muộn.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-amber-600 shrink-0">4.</span>
                <span>
                  <strong>Chuẩn thể trạng WHO & Thông tư 51:</strong> Tự động tính chỉ số BMI và phân loại Suy dinh dưỡng / Thừa cân / Béo phì.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-200/60 text-[11px] text-amber-800">
            Hệ thống tuân thủ quy chuẩn giáo dục Mầm non Bộ GD&ĐT.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
