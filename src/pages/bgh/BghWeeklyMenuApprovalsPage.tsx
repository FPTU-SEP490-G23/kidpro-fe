import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Check,
  X,
  Flame,
  PieChart,
  Calendar,
  Layers,
} from 'lucide-react';
import weeklyMenuApprovalApi, {
  WeeklyMenuApprovalDto,
} from '../../api/weeklyMenuApprovalApi';

export const BghWeeklyMenuApprovalsPage: React.FC = () => {
  const [menus, setMenus] = useState<WeeklyMenuApprovalDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenuApprovalDto | null>(null);

  // Modals
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [actionMenu, setActionMenu] = useState<WeeklyMenuApprovalDto | null>(null);
  const [note, setNote] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Toast alert
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await weeklyMenuApprovalApi.getMenus({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      const data = Array.isArray(res) ? res : (res?.data || []);
      setMenus(data);
      if (data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0]);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách thực đơn:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!actionMenu) return;
    try {
      setSubmitting(true);
      const res = await weeklyMenuApprovalApi.approveMenu(actionMenu.menuId, note);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Thực đơn tuần đã được phê duyệt và ban hành thành công lên ứng dụng toàn trường.',
      });
      setApproveModalOpen(false);
      setNote('');
      fetchMenus();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt thực đơn.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!actionMenu) return;
    if (!rejectReason.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-111: Vui lòng nhập lý do từ chối phê duyệt thực đơn để bộ phận Bếp có căn cứ chỉnh sửa.',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await weeklyMenuApprovalApi.rejectMenu(actionMenu.menuId, rejectReason.trim());
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã từ chối thực đơn tuần. Lý do và yêu cầu điều chỉnh đã được chuyển đến bộ phận Bếp bán trú.',
      });
      setRejectModalOpen(false);
      setRejectReason('');
      fetchMenus();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi từ chối thực đơn.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const dayOfWeekNames: Record<string, string> = {
    MONDAY: 'Thứ Hai',
    TUESDAY: 'Thứ Ba',
    WEDNESDAY: 'Thứ Tư',
    THURSDAY: 'Thứ Năm',
    FRIDAY: 'Thứ Sáu',
  };

  const mealTypeNames: Record<string, string> = {
    BREAKFAST: 'Bữa Sáng (07:30)',
    LUNCH: 'Bữa Trưa (11:00)',
    SNACK: 'Bữa Xế (14:30)',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                [UC-041] Phê Duyệt & Ban Hành Thực Đơn Tuần
              </h1>
              <p className="text-sm text-slate-500">
                Thẩm định cơ cấu dinh dưỡng P-L-G, định mức Kcal và ban hành thực đơn bán trú toàn trường (BR-041, BR-042)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMenus}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Alert toast */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Nutrition Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Chờ BGH Phê Duyệt</p>
              <p className="text-xl font-bold text-slate-800">
                {menus.filter((m) => m.status === 'DRAFT').length} Tuần
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Đã Ban Hành Toàn Trường</p>
              <p className="text-xl font-bold text-slate-800">
                {menus.filter((m) => m.status === 'APPROVED').length} Tuần
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-xl text-orange-700">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Năng Lượng TB / Ngày</p>
              <p className="text-xl font-bold text-slate-800">
                {selectedMenu?.totalCalories || 720} Kcal
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#275A4E]/10 rounded-xl text-[#275A4E]">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tỷ Lệ Đạm - Béo - Đường</p>
              <p className="text-xs font-bold text-slate-800 mt-1">
                15% P - 25% L - 60% G
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Menu List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Danh Sách Tuần Thực Đơn</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Chờ duyệt (Dự thảo)</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
            </select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">Đang tải danh sách...</div>
            ) : menus.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Không có thực đơn nào</div>
            ) : (
              menus.map((m) => {
                const isSelected = selectedMenu?.menuId === m.menuId;
                return (
                  <div
                    key={m.menuId}
                    onClick={() => setSelectedMenu(m)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#275A4E] bg-[#275A4E]/5 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">Tuần {m.weekNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          m.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : m.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {m.status === 'APPROVED'
                          ? 'Đã Duyệt'
                          : m.status === 'REJECTED'
                          ? 'Từ Chối'
                          : 'Chờ Duyệt'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {m.startDate} - {m.endDate}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Menu Detail & Daily Matrix */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMenu ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Chi Tiết Thực Đơn Tuần {selectedMenu.weekNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Thời gian: {selectedMenu.startDate} đến {selectedMenu.endDate} • {selectedMenu.academicYearName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedMenu.status !== 'APPROVED' ? (
                    <>
                      <button
                        onClick={() => {
                          setActionMenu(selectedMenu);
                          setApproveModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40] transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Phê Duyệt Thực Đơn
                      </button>
                      <button
                        onClick={() => {
                          setActionMenu(selectedMenu);
                          setRejectModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Từ Chối
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-sm font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Đã Ban Hành Chính Thức
                    </span>
                  )}
                </div>
              </div>

              {selectedMenu.rejectionReason && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                  <span className="font-bold">Lý do từ chối trước đó: </span>
                  {selectedMenu.rejectionReason}
                </div>
              )}

              {/* Day-by-Day Nutrition Matrix */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-[#275A4E]" />
                  Cơ Cấu Các Bữa Ăn Trong Tuần (Sáng - Trưa - Xế)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((dayKey) => {
                    const dayItems = (selectedMenu.items || []).filter((i) => i.dayOfWeek === dayKey);
                    return (
                      <div key={dayKey} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="font-bold text-sm text-[#275A4E] border-b border-slate-200 pb-2">
                          {dayOfWeekNames[dayKey] || dayKey}
                        </div>

                        {dayItems.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">Thực đơn chuẩn bị cập nhật...</div>
                        ) : (
                          <div className="space-y-2">
                            {dayItems.map((item) => (
                              <div
                                key={item.itemId}
                                className="flex items-start justify-between bg-white p-2.5 rounded-lg border border-slate-100 text-xs"
                              >
                                <div>
                                  <span className="font-semibold text-slate-700 block">
                                    {mealTypeNames[item.mealType] || item.mealType}
                                  </span>
                                  <span className="text-slate-600">{item.dishName}</span>
                                </div>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">
                                  {item.calories} Kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400">
              Vui lòng chọn một tuần thực đơn để xem chi tiết
            </div>
          )}
        </div>
      </div>

      {/* Modal Phê Duyệt */}
      {approveModalOpen && actionMenu && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Xác Nhận Phê Duyệt Thực Đơn Tuần {actionMenu.weekNumber}
            </h3>
            <p className="text-sm text-slate-600">
              Sau khi phê duyệt, thực đơn sẽ chính thức được công bố trên ứng dụng cho Phụ huynh và Giáo viên theo dõi (BR-041, BR-042).
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Ghi chú chỉ đạo cho bộ phận Bếp (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập lưu ý hoặc dặn dò vệ sinh an toàn thực phẩm..."
                rows={3}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
              >
                {submitting ? 'Đang duyệt...' : 'Đồng Ý Phê Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ Chối */}
      {rejectModalOpen && actionMenu && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-700">
              Từ Chối Thực Đơn Tuần {actionMenu.weekNumber}
            </h3>
            <p className="text-sm text-slate-600">
              Theo quy định BR-047, quyết định từ chối bắt buộc phải đi kèm nội dung giải trình chỉ đạo điều chỉnh chi tiết.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Lý do từ chối & Yêu cầu chỉnh sửa <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Cơ cấu món chính bị trùng lặp; Tỷ lệ đạm chưa đạt định mức; Chi phí vượt ngân sách..."
                rows={4}
                className="w-full text-sm p-3 border border-rose-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Đóng
              </button>
              <button
                onClick={handleReject}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
              >
                {submitting ? 'Đang gửi...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghWeeklyMenuApprovalsPage;
