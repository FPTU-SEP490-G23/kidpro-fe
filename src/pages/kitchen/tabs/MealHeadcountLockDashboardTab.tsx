import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Baby,
  ShieldAlert,
  Calendar,
  ArrowRight,
  Filter,
  Search,
  Check,
  Clock
} from 'lucide-react';
import { kitchenApi } from '../../../api/kitchenApi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  MealHeadcountSnapshot,
  AgeGroupType
} from '../../../types/kitchen.types';

interface MealHeadcountLockDashboardTabProps {
  selectedDate?: string;
}

export const MealHeadcountLockDashboardTab: React.FC<MealHeadcountLockDashboardTabProps> = ({
  selectedDate: propDate
}) => {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const isBgh = role === 'BGH' || role === 'SYSTEM_ADMIN';
  const isKitchenOrBgh = isBgh || role === 'BEP';

  const todayDateStr = new Date().toISOString().split('T')[0];
  const date = propDate || todayDateStr;
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal Khóa Thủ Công
  const [isLockConfirmModalOpen, setIsLockConfirmModalOpen] = useState(false);

  // Trạng thái đếm ngược mốc 08:30:00 AM
  const [timeRemaining, setTimeRemaining] = useState<string>('00:00:00');
  const [isPast0830, setIsPast0830] = useState<boolean>(false);

  // Tính toán thời gian đếm ngược đến 08:30 AM (hoặc mốc gia hạn)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const cutoff = new Date();

      cutoff.setHours(8, 30, 0, 0);

      const diff = cutoff.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        setIsPast0830(true);
      } else {
        setIsPast0830(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Query 1: Lấy snapshot báo cáo suất ăn đã chốt (GET /api/kitchen/meal-headcounts)
  const {
    data: snapshotData,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  } = useQuery<MealHeadcountSnapshot>({
    queryKey: ['meal-headcounts', date],
    queryFn: async () => {
      const res: any = await kitchenApi.getMealHeadcounts(date);
      return res?.data ?? res;
    },
    // Tự động làm mới mỗi 30 giây khi trạng thái còn đang nhận điểm danh (OPEN)
    refetchInterval: isPast0830 ? false : 30000,
    refetchOnWindowFocus: true
  });

  // Mutation: Khóa suất ăn thủ công ngay lập tức (POST /api/kitchen/meal-headcounts/lock)
  const lockMutation = useMutation({
    mutationFn: async (forceLock?: boolean) => {
      return await kitchenApi.lockMealHeadcounts({ date, forceLock });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['meal-headcounts'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
      setIsLockConfirmModalOpen(false);
      const response = data?.data || data;
      const totalCount = response?.totalMealsToPrepare ?? snapshotData?.totalMealsToPrepare ?? 0;
      setToastMessage({
        type: 'success',
        text: `Đã khóa số lượng suất ăn bán trú lúc 08:30 thành công. Tổng số suất cần chế biến: ${totalCount} suất.`
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Không thể khóa sổ suất ăn.'
      });
    }
  });

  // Lọc dữ liệu lớp học
  const classBreakdowns = snapshotData?.classBreakdowns || [];

  const filteredClasses = useMemo(() => {
    return classBreakdowns.filter((item) => {
      const matchAge = filterAgeGroup === 'ALL' || item.ageGroup === filterAgeGroup;
      const matchSearch =
        item.className.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.allergyNotes && item.allergyNotes.toLowerCase().includes(searchKeyword.toLowerCase()));
      return matchAge && matchSearch;
    });
  }, [classBreakdowns, filterAgeGroup, searchKeyword]);

  // Kiểm tra xem có lớp nào chưa chốt lúc 08:30 không
  const pendingClasses = classBreakdowns.filter((c) => !c.attendanceFinalized);

  const isActuallyLocked = Boolean(snapshotData?.isLocked);

  return (
    <div className="space-y-6">
      {/* Toast Notification Box */}
      {toastMessage && (
        <div
          className={`flex items-start justify-between p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          Không thể tải số liệu suất ăn: {error instanceof Error ? error.message : 'Lỗi không xác định.'}
        </div>
      )}

      {/* Cảnh báo các lớp chưa chốt điểm danh */}
      {pendingClasses.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 shadow-sm flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold text-sm block">
              Chưa thể khóa số liệu:
            </span>
            {pendingClasses.map((cls) => (
              <p key={cls.classId}>
                Lớp <strong>{cls.className}</strong> chưa có điểm danh đầy đủ. Vui lòng hoàn tất điểm danh trước khi khóa; hệ thống không tự thay bằng sĩ số danh sách.
              </p>
            ))}
          </div>
        </div>
      )}

      {/* TOP COUNTDOWN & STATUS BANNER ( Section 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 text-white shadow-xl">
        {/* Pattern chìm trang trí */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 h-48 w-48 rounded-full bg-[#78C2AD]/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Cụm Trái: Trạng thái chốt sổ & Đồng hồ đếm ngược */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Huy hiệu trạng thái */}
              {isActuallyLocked ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#78C2AD]/20 border border-[#78C2AD] px-3.5 py-1 text-xs font-bold text-[#78C2AD]">
                  <Lock className="h-4 w-4" />
                  <span>ĐÃ KHÓA SỐ SUẤT ĂN (LOCKED)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C] px-3.5 py-1 text-xs font-bold text-[#E5A93C] animate-pulse">
                  <Unlock className="h-4 w-4" />
                  <span>ĐANG NHẬN ĐIỂM DANH (OPEN)</span>
                </span>
              )}

              <span className="text-xs text-emerald-200/80 bg-white/10 px-3 py-1 rounded-full">
                Mốc vận hành: 08:30:00 AM
              </span>

            </div>

            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-[#E5A93C]">
                {timeRemaining}
              </h2>
              <span className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                {isActuallyLocked
                  ? 'Snapshot đã được lưu. Đây không phải khóa tự động theo thời gian.'
                  : 'Thời gian còn lại đến mốc vận hành 08:30.'}
              </span>
            </div>

            <p className="text-xs text-emerald-100/70 max-w-2xl leading-relaxed">
              Cơ sở dữ liệu hiện lưu snapshot theo lớp và số có mặt; hệ thống chưa tự khóa lúc 08:30. Các loại suất cơm/cháo/dị ứng và gia hạn chưa có dữ liệu lưu tương ứng.
            </p>
          </div>

          {/* Cụm Phải: Nút Thao tác Bếp & Ban Giám Hiệu */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Nút Khóa Thủ Công Ngay */}
            {isKitchenOrBgh && !isActuallyLocked && !isLoading && !isError && (
              <button
                onClick={() => setIsLockConfirmModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E5A93C] px-5 py-3 text-sm font-bold text-[#1E4D40] shadow-lg shadow-amber-900/20 hover:bg-[#d99d30] active:scale-95 transition-all min-h-[44px]"
              >
                <Lock className="h-4 w-4" />
                <span>{pendingClasses.length > 0 ? 'Khóa Suất Ăn (Tạm tính)' : 'Khóa Suất Ăn Thủ Công Ngay'}</span>
              </button>
            )}

            {/* Schema hiện tại không lưu thông tin gia hạn */}
            {isBgh && (
              <span className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white/80">
                Gia hạn chưa được hỗ trợ bởi schema hiện tại
              </span>
            )}

            {/* Nút Refresh */}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Làm mới số liệu"
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <RefreshCw className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4 THẺ THỐNG KÊ TỔNG QUAN (HEADCOUNT KPI CARDS - Section 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng Số Suất Ăn Cần Nấu */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Tổng Suất Cần Nấu
            </span>
            <div className="h-10 w-10 rounded-2xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#275A4E]">
              {isLoading ? '...' : snapshotData?.totalMealsToPrepare || 0}
            </span>
            <span className="text-xs font-medium text-slate-500">suất ăn trưa</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            <span>Có mặt thực tế tại trường hôm nay</span>
          </p>
        </div>

        {/* Card 2: Suất Cơm Tiêu Chuẩn */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Suất Cơm Tiêu Chuẩn
            </span>
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Check className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">
              {isLoading ? '...' : snapshotData?.mealPackageBreakdownAvailable ? snapshotData.regularRiceCount : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500">suất cơm</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span>Dành cho các khối Mẫu giáo (Mầm, Chồi, Lá)</span>
          </p>
        </div>

        {/* Card 3: Suất Cháo Dinh Dưỡng (porridge_count) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Cháo Dinh Dưỡng
            </span>
            <div className="h-10 w-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600">
              <Baby className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-700">
              {isLoading ? '...' : snapshotData?.mealPackageBreakdownAvailable ? snapshotData.porridgeCount : '—'}
            </span>
            <span className="text-xs font-medium text-slate-500">suất cháo</span>
          </div>
          <p className="mt-2 text-xs text-teal-700 font-medium flex items-center gap-1.5">
            <span>Tự động bóc tách từ các khối Nhũ nhi, Hạt</span>
          </p>
        </div>

        {/* Card 4: Suất Ăn Tránh Dị Ứng Riêng Biệt */}
        <div className="rounded-3xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              4. Tránh Dị Ứng Riêng
            </span>
            <div className="h-10 w-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#DC2626]">
              {isLoading ? '...' : snapshotData?.mealPackageBreakdownAvailable ? snapshotData.allergySafeCount : '—'}
            </span>
            <span className="text-xs font-medium text-rose-600">trẻ cần nấu riêng</span>
          </div>
          <p className="mt-2 text-xs text-rose-700 font-medium flex items-center gap-1.5">
            <span>Chế biến cách ly khử khuẩn riêng biệt</span>
          </p>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN & BỘ LỌC BẢNG LỚP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" />
            Khối tuổi:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả khối' },
            { id: 'INFANT', label: 'Nhũ nhi' },
            { id: 'TODDLER', label: 'Hạt' },
            { id: 'NURSERY', label: 'Mầm' },
            { id: 'KINDERGARTEN', label: 'Chồi' },
            { id: 'PRE_K', label: 'Lá' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterAgeGroup(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                filterAgeGroup === tab.id
                  ? 'bg-[#275A4E] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên lớp, ghi chú..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#275A4E] focus:outline-hidden"
            />
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="relative">
            <input
              type="date"
              value={date}
              disabled
              readOnly
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold cursor-not-allowed select-none opacity-90"
              title="Cố định ngày hôm nay"
            />
            <Calendar className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* BẢNG PHÂN BỔ SUẤT ĂN TỪNG LỚP HỌC (CLASS BREAKDOWN TABLE) */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Bảng Phân Bổ Suất Ăn Chi Tiết Từng Lớp Học ({filteredClasses.length} lớp)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cập nhật trực tiếp từ điểm danh thời gian thực và đơn xin nghỉ học nộp trước 08:30
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Dữ liệu ngày: {date}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Tên Lớp Học</th>
                <th className="py-3 px-3 text-center">Khối Tuổi</th>
                <th className="py-3 px-3 text-center">Sĩ Số</th>
                <th className="py-3 px-3 text-center text-emerald-700">Có Mặt</th>
                <th className="py-3 px-3 text-center text-slate-600">Nghỉ Phép (Hoàn tiền)</th>
                <th className="py-3 px-3 text-center text-slate-800">Suất Cơm</th>
                <th className="py-3 px-3 text-center text-teal-700">Suất Cháo</th>
                <th className="py-3 px-3 text-center text-rose-600">Dị Ứng Riêng</th>
                <th className="py-3 px-4 text-center">Trạng Thái Lớp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy dữ liệu lớp học phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((cls) => {
                  const ageBadgeMap: Record<string, { label: string; color: string }> = {
                    INFANT: { label: 'Nhũ nhi', color: 'bg-purple-100 text-purple-800' },
                    TODDLER: { label: 'Hạt', color: 'bg-teal-100 text-teal-800' },
                    NURSERY: { label: 'Mầm', color: 'bg-amber-100 text-amber-800' },
                    KINDERGARTEN: { label: 'Chồi', color: 'bg-blue-100 text-blue-800' },
                    PRE_K: { label: 'Lá', color: 'bg-rose-100 text-rose-800' }
                  };
                  const ageBadge = ageBadgeMap[cls.ageGroup] || {
                    label: cls.ageGroup,
                    color: 'bg-slate-100 text-slate-800'
                  };

                  return (
                    <tr
                      key={cls.classId}
                      className={`hover:bg-slate-50/70 transition ${
                        !cls.attendanceFinalized ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <div className="flex flex-col">
                          <span>{cls.className}</span>
                          {cls.allergyNotes && (
                            <span className="text-[11px] text-[#DC2626] font-medium flex items-center gap-1 mt-0.5">
                              ⚠️ {cls.allergyNotes}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${ageBadge.color}`}>
                          {ageBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                        {snapshotData?.attendanceBreakdownAvailable ? cls.totalEnrolled : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-extrabold text-emerald-700">
                        {cls.presentCount}
                      </td>

                      <td className="py-3.5 px-3 text-center font-semibold text-slate-500">
                        {snapshotData?.attendanceBreakdownAvailable ? cls.absentPermitted : '—'}
                        {snapshotData?.attendanceBreakdownAvailable && cls.absentUnpermitted > 0 && (
                          <span className="text-[10px] text-rose-500 ml-1">
                            (+{cls.absentUnpermitted} ko phép)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {snapshotData?.mealPackageBreakdownAvailable ? cls.regularRiceCount : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-teal-700">
                        {snapshotData?.mealPackageBreakdownAvailable && cls.porridgeCount > 0 ? cls.porridgeCount : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-extrabold text-[#DC2626]">
                        {snapshotData?.mealPackageBreakdownAvailable && cls.allergyCount > 0 ? (
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                            {cls.allergyCount}
                          </span>
                        ) : (
                          snapshotData?.mealPackageBreakdownAvailable ? '0' : '—'
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPast0830 || isActuallyLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Đã chốt sổ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold animate-pulse" title="Đang trong khung giờ nhận điểm danh trước 08:30">
                            <Clock className="h-3.5 w-3.5 text-blue-600" />
                            <span>Đang điểm danh</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredClasses.length > 0 && (
              <tfoot className="border-t-2 border-slate-300 bg-slate-50/90 font-bold text-slate-800">
                <tr>
                  <td className="py-3 px-4">TỔNG CỘNG TOÀN TRƯỜNG</td>
                  <td className="py-3 px-3 text-center">—</td>
                  <td className="py-3 px-3 text-center">
                    {snapshotData?.attendanceBreakdownAvailable
                      ? filteredClasses.reduce((s, c) => s + c.totalEnrolled, 0)
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-700">
                    {filteredClasses.reduce((s, c) => s + c.presentCount, 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {snapshotData?.attendanceBreakdownAvailable
                      ? filteredClasses.reduce((s, c) => s + c.absentPermitted, 0)
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-900">
                    {snapshotData?.mealPackageBreakdownAvailable
                      ? filteredClasses.reduce((s, c) => s + c.regularRiceCount, 0)
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-center text-teal-800">
                    {snapshotData?.mealPackageBreakdownAvailable
                      ? filteredClasses.reduce((s, c) => s + c.porridgeCount, 0)
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-center text-[#DC2626]">
                    {snapshotData?.mealPackageBreakdownAvailable
                      ? filteredClasses.reduce((s, c) => s + c.allergyCount, 0)
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-500">
                    {snapshotData?.totalMealsToPrepare || 0} suất
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL XÁC NHẬN KHÓA SUẤT ĂN THỦ CÔNG */}
      {isLockConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 text-rose-700 mb-3">
              <div className="p-2.5 rounded-2xl bg-rose-100">
                <Lock className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {pendingClasses.length > 0 ? 'Khóa Tạm Tính Suất Ăn' : 'Xác Nhận Khóa Suất Ăn'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Hệ thống sẽ lưu số lượng học sinh có mặt và đơn xin nghỉ phép hợp lệ hiện tại vào cơ sở dữ liệu để phục vụ bộ phận Bếp xuất kho chuẩn bị món.
            </p>

            {pendingClasses.length > 0 && (
              <div className="p-3 mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block text-amber-800">Cảnh báo điểm danh chưa hoàn tất:</strong>
                <p>
                  Có <strong>{pendingClasses.length} lớp</strong> chưa hoàn tất điểm danh. Nếu cần Bếp kịp nấu đúng giờ, bạn có thể chọn <strong>Khóa Tạm Tính</strong> (Quy tắc luồng rẽ nhánh A1).
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLockConfirmModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Hủy bỏ
              </button>

              {pendingClasses.length > 0 ? (
                <button
                  type="button"
                  disabled={lockMutation.isPending}
                  onClick={() => lockMutation.mutate(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-md min-h-[44px] flex items-center gap-2"
                >
                  {lockMutation.isPending ? 'Đang khóa...' : 'Khóa Tạm Tính Ngay (A1)'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={lockMutation.isPending}
                  onClick={() => lockMutation.mutate(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#E5A93C] hover:bg-[#d99d30] text-[#1E4D40] text-xs font-extrabold shadow-md min-h-[44px] flex items-center gap-2"
                >
                  {lockMutation.isPending ? 'Đang khóa...' : 'Khóa Ngay'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealHeadcountLockDashboardTab;
