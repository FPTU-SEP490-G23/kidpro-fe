import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import weeklyMenuApprovalApi, { WeeklyMenuApprovalDto } from '../../api/weeklyMenuApprovalApi';
import { useToast } from '../../contexts/ToastContext';
import {
  Utensils,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Coffee,
  Eye,
  RefreshCw,
  Filter,
  X,
  Flame,
  Award,
  RotateCcw,
} from 'lucide-react';

export const BghWeeklyMenuApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'APPROVED' | 'REJECTED'>('DRAFT');
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenuApprovalDto | null>(null);
  const [rejectingMenu, setRejectingMenu] = useState<WeeklyMenuApprovalDto | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [validationError, setValidationError] = useState('');

  // Fetch menu approvals
  const { data: menuResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['weekly-menu-approvals-bgh', statusFilter],
    queryFn: () => weeklyMenuApprovalApi.getMenus({ status: statusFilter }),
  });

  const menus: WeeklyMenuApprovalDto[] = Array.isArray(menuResponse)
    ? menuResponse
    : ((menuResponse as any)?.data || []);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (menuId: number) => weeklyMenuApprovalApi.approveMenu(menuId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'MSG-108: Thực đơn tuần đã được phê duyệt và ban hành thành công lên ứng dụng toàn trường.');
      setSelectedMenu(null);
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể phê duyệt thực đơn tuần');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ menuId, reason }: { menuId: number; reason: string }) =>
      weeklyMenuApprovalApi.rejectMenu(menuId, reason),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'MSG-109: Đã từ chối thực đơn tuần. Lý do và yêu cầu điều chỉnh đã được chuyển đến bộ phận Bếp bán trú.');
      closeRejectModal();
      setSelectedMenu(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể từ chối thực đơn';
      setValidationError(msg);
      error(msg);
    },
  });

  // Reset to pending mutation
  const resetMutation = useMutation({
    mutationFn: (menuId: number) => weeklyMenuApprovalApi.resetPendingMenu(menuId),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['weekly-menu-approvals-bgh'] });
      success(res?.data?.message || res?.message || 'Đã khôi phục thực đơn tuần về trạng thái Chờ duyệt (DRAFT).');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể khôi phục trạng thái thực đơn');
    },
  });

  const openRejectModal = (m: WeeklyMenuApprovalDto) => {
    setRejectingMenu(m);
    setRejectionReason('');
    setValidationError('');
  };

  const closeRejectModal = () => {
    setRejectingMenu(null);
    setRejectionReason('');
    setValidationError('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setValidationError('MSG-111: Vui lòng nhập lý do từ chối phê duyệt thực đơn để bộ phận Bếp có căn cứ chỉnh sửa.');
      return;
    }
    if (!rejectingMenu) return;
    rejectMutation.mutate({ menuId: rejectingMenu.menuId, reason: rejectionReason.trim() });
  };

  const daysOfWeek = [
    { key: 'MONDAY', label: 'Thứ Hai' },
    { key: 'TUESDAY', label: 'Thứ Ba' },
    { key: 'WEDNESDAY', label: 'Thứ Tư' },
    { key: 'THURSDAY', label: 'Thứ Năm' },
    { key: 'FRIDAY', label: 'Thứ Sáu' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>UC-041 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Phê Duyệt & Ban Hành Thực Đơn Tuần</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Thẩm định cơ cấu dinh dưỡng (Kcal, tỷ lệ P-L-G) theo chuẩn Bộ GD&ĐT (BR-041), ký duyệt ban hành hoặc gửi chỉ đạo điều chỉnh tới Bếp bán trú. Dữ liệu lưu vào bảng catering.weekly_menus.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-center inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-[#275A4E]" />
          <span>Lọc danh sách thực đơn:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'DRAFT' as const, label: 'Chờ thẩm định (DRAFT)' },
            { id: 'APPROVED' as const, label: 'Đã ban hành (APPROVED)' },
            { id: 'REJECTED' as const, label: 'Yêu cầu sửa đổi (REJECTED)' },
            { id: 'ALL' as const, label: 'Tất cả thực đơn' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#275A4E] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Danh Sách Thực Đơn */}
      {menus.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <Utensils className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Chưa có thực đơn tuần nào cần thẩm định</p>
          <p className="text-xs mt-1">Nhân viên Bếp bán trú sẽ gửi kế hoạch thực đơn tuần lên trước Thứ Sáu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {menus.map((m) => {
            const isApproved = m.status === 'APPROVED';
            const isRejected = m.status === 'REJECTED';
            const isDraft = m.status === 'DRAFT';

            return (
              <div
                key={m.menuId}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ĐÃ DUYỆT BAN HÀNH</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>YÊU CẦU ĐIỀU CHỈNH</span>
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>CHỜ BGH THẨM ĐỊNH</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Thực Đơn Tuần {m.weekNumber}
                  </h3>

                  <p className="text-xs font-semibold text-[#275A4E] mt-0.5">
                    {m.startDate} - {m.endDate}
                  </p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Định mức năng lượng:</span>
                      <strong className="text-slate-800 font-bold flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        {m.totalCalories || 720} Kcal/ngày
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Cơ cấu dinh dưỡng:</span>
                      <strong className="text-slate-800 font-bold truncate max-w-[200px]" title={m.nutrientRatio}>
                        {m.nutrientRatio || '15% P - 25% L - 60% G'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Niên khóa:</span>
                      <strong className="text-slate-800 font-bold">{m.academicYearName || '2025-2026'}</strong>
                    </div>
                  </div>

                  {/* Lý do từ chối nếu có */}
                  {isRejected && m.rejectionReason && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <strong>Chỉ đạo của BGH:</strong> {m.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMenu(m)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết món</span>
                  </button>

                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => approveMutation.mutate(m.menuId)}
                      disabled={approveMutation.isPending}
                      className="py-2 px-3 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Phê duyệt</span>
                    </button>
                  )}

                  {!isRejected && (
                    <button
                      type="button"
                      onClick={() => openRejectModal(m)}
                      className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Từ chối
                    </button>
                  )}

                  {/* Nút Khôi phục Chờ duyệt khi đã duyệt hoặc từ chối */}
                  {(isApproved || isRejected) && (
                    <button
                      type="button"
                      onClick={() => resetMutation.mutate(m.menuId)}
                      disabled={resetMutation.isPending}
                      title="Khôi phục thực đơn về trạng thái Chờ duyệt (DRAFT)"
                      className="py-2 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Chi Tiết Món Ăn Trong Tuần */}
      {selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-[#78C2AD]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Thực Đơn Tuần {selectedMenu.weekNumber}</h3>
                  <p className="text-xs text-[#78C2AD]">{selectedMenu.startDate} - {selectedMenu.endDate} • UC-041</p>
                </div>
              </div>
              <button onClick={() => setSelectedMenu(null)} className="p-1 rounded-full text-white/80 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {daysOfWeek.map((day) => {
                  const dayItems = (selectedMenu.items || []).filter((i) => i.dayOfWeek === day.key);

                  return (
                    <div key={day.key} className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
                      <div className="text-center font-extrabold text-xs text-[#275A4E] pb-2 border-b border-slate-200 mb-2">
                        {day.label}
                      </div>
                      <div className="space-y-2">
                        {dayItems.length === 0 ? (
                          <p className="text-[11px] text-slate-400 text-center py-4 italic">Chưa lên món</p>
                        ) : (
                          dayItems.map((item, idx) => (
                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#78C2AD]/20 text-[#275A4E] mb-1">
                                {item.mealType === 'BREAKFAST' ? 'Bữa Sáng' : item.mealType === 'LUNCH' ? 'Bữa Trưa' : 'Bữa Xế'}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800">{item.dishName}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{item.calories} Kcal</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Tổng calo trung bình: <strong className="text-slate-800">{selectedMenu.totalCalories || 720} Kcal/ngày</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedMenu)}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                >
                  Yêu cầu Bếp điều chỉnh
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(selectedMenu.menuId)}
                  disabled={approveMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-sm"
                >
                  {approveMutation.isPending ? 'Đang duyệt...' : 'Phê duyệt & Công bố (MSG-108)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối & Yêu Cầu Bếp Chỉnh Sửa */}
      {rejectingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Từ Chối Thực Đơn Tuần</h3>
                  <p className="text-xs text-slate-500">Tuần {rejectingMenu.weekNumber} • BR-047</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Lý do từ chối & Yêu cầu Bếp bán trú điều chỉnh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setValidationError('');
                  }}
                  placeholder="Ví dụ: Bữa trưa Thứ 3 và Thứ 5 bị trùng món tôm rim, đề nghị đổi thứ 5 sang thịt kho trứng cút để đảm bảo đa dạng khẩu phần..."
                  className="w-full text-sm p-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#275A4E] focus:ring-2 focus:ring-[#78C2AD]/20"
                />
                {validationError && (
                  <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Đang gửi...' : 'Xác nhận từ chối (MSG-109)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghWeeklyMenuApprovalsPage;
