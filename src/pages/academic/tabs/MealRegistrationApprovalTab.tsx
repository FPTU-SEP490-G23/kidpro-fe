import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  Phone,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  mealRegistrationApprovalApi,
  MealRegistrationItem,
} from '../../../api/mealRegistrationApprovalApi';
import { useToast } from '../../../contexts/ToastContext';

export const MealRegistrationApprovalTab: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [registrations, setRegistrations] = useState<MealRegistrationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal approve state
  const [approvingItem, setApprovingItem] = useState<MealRegistrationItem | null>(null);
  const [approvalNote, setApprovalNote] = useState<string>('Đã duyệt đơn đăng ký ăn sáng bán trú thành công.');
  const [submittingApprove, setSubmittingApprove] = useState<boolean>(false);

  // Modal reject state
  const [rejectingItem, setRejectingItem] = useState<MealRegistrationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await mealRegistrationApprovalApi.getAllRegistrations(
        filterStatus === 'ALL' ? undefined : filterStatus
      );
      setRegistrations(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Không thể tải danh sách đơn đăng ký ăn sáng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = registrations.length;
    const pending = registrations.filter((r) => r.status === 'PENDING').length;
    const approved = registrations.filter((r) => r.status === 'APPROVED').length;
    const rejected = registrations.filter((r) => r.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [registrations]);

  // Search filter
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return registrations;
    const term = searchTerm.toLowerCase();
    return registrations.filter(
      (r) =>
        r.studentName?.toLowerCase().includes(term) ||
        r.studentCode?.toLowerCase().includes(term) ||
        r.className?.toLowerCase().includes(term) ||
        r.parentName?.toLowerCase().includes(term) ||
        r.parentPhone?.toLowerCase().includes(term) ||
        r.note?.toLowerCase().includes(term)
    );
  }, [registrations, searchTerm]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approvingItem) return;
    setSubmittingApprove(true);
    try {
      await mealRegistrationApprovalApi.approveRegistration(approvingItem.registerId, approvalNote);
      success(`Đã phê duyệt đơn ăn sáng cho học sinh ${approvingItem.studentName}`);
      setApprovingItem(null);
      setApprovalNote('Đã duyệt đơn đăng ký ăn sáng bán trú thành công.');
      fetchRegistrations();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Lỗi khi phê duyệt đơn ăn sáng');
    } finally {
      setSubmittingApprove(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      error('Vui lòng nhập lý do từ chối (MSG-033)');
      return;
    }
    setSubmittingReject(true);
    try {
      await mealRegistrationApprovalApi.rejectRegistration(rejectingItem.registerId, rejectionReason.trim());
      success(`Đã từ chối đơn ăn sáng của học sinh ${rejectingItem.studentName}`);
      setRejectingItem(null);
      setRejectionReason('');
      fetchRegistrations();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Lỗi khi từ chối đơn');
    } finally {
      setSubmittingReject(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Chờ phê duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Đã chấp thuận
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Đã từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Utensils className="w-6 h-6 text-white" />
              </span>
              <h2 className="text-2xl font-bold">Phê Duyệt Đăng Ký Ăn Sáng Bán Trú</h2>
            </div>
            <p className="text-orange-100 text-sm max-w-2xl">
              Quản lý và xét duyệt các đơn đăng ký dịch vụ ăn sáng bán trú tại trường từ phụ huynh. Tự động liên thông biểu phí kế toán và khẩu phần bếp ăn.
            </p>
          </div>
          <button
            onClick={fetchRegistrations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs text-orange-100 block">Tổng số đơn</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs text-amber-200 block flex items-center gap-1">
              <Clock className="w-3 h-3" /> Đang chờ duyệt
            </span>
            <span className="text-2xl font-bold text-amber-200">{stats.pending}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs text-emerald-200 block flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Đã chấp thuận
            </span>
            <span className="text-2xl font-bold text-emerald-200">{stats.approved}</span>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <span className="text-xs text-rose-200 block flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Đã từ chối
            </span>
            <span className="text-2xl font-bold text-rose-200">{stats.rejected}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-gray-400 ml-1 mr-1 shrink-0" />
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'ALL'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Chờ duyệt ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Đã duyệt ({stats.approved})
          </button>
          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Đã từ chối ({stats.rejected})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên bé, mã HS, lớp, SĐT..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Main Table / Data View */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
            <p className="text-sm">Đang tải danh sách đơn đăng ký ăn sáng...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
            <Utensils className="w-12 h-12 text-gray-300" />
            <p className="text-base font-medium text-gray-700">Không tìm thấy đơn đăng ký ăn sáng nào</p>
            <p className="text-sm text-gray-400">
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm của bạn' : 'Chưa có đơn nào trong trạng thái đã chọn.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Học sinh & Lớp</th>
                  <th className="py-3.5 px-4">Phụ huynh liên hệ</th>
                  <th className="py-3.5 px-4">Gói dịch vụ</th>
                  <th className="py-3.5 px-4">Thời gian hiệu lực</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredList.map((item) => (
                  <tr key={item.registerId} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-700 font-bold flex items-center justify-center text-sm border border-orange-100">
                          {item.studentName?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">{item.studentName}</span>
                          <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-[11px]">
                              {item.studentCode}
                            </span>
                            <span>•</span>
                            <span className="text-orange-700 font-medium">{item.className}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Parent */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-medium text-gray-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {item.parentName || 'Chưa cập nhật'}
                        </span>
                        {item.parentPhone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {item.parentPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Service & Note */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                          {item.serviceName || 'Ăn sáng bán trú'}
                        </span>
                        <div className="text-xs font-semibold text-gray-700">
                          {Number(item.unitPrice || 450000).toLocaleString('vi-VN')} đ/tháng
                        </div>
                        {item.note && (
                          <div className="text-xs text-gray-500 italic max-w-xs truncate" title={item.note}>
                            Ghi chú: {item.note}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 text-xs">
                        <div className="text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          Từ: <span className="font-medium">{item.startDate}</span>
                        </div>
                        {item.endDate && (
                          <div className="text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            Đến: <span>{item.endDate}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setApprovingItem(item);
                              setApprovalNote('Đã duyệt đơn đăng ký ăn sáng bán trú thành công.');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                            title="Phê duyệt đơn"
                          >
                            <Check className="w-3.5 h-3.5" /> Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setRejectingItem(item);
                              setRejectionReason('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors"
                            title="Từ chối đơn"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Approve Confirmation */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <span className="p-2 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold text-gray-900">Phê Duyệt Đơn Ăn Sáng</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Học sinh:</span>
                <span className="font-bold text-gray-900">{approvingItem.studentName} ({approvingItem.className})</span>
              </div>
              <div className="flex justify-between">
                <span>Dịch vụ:</span>
                <span className="font-semibold text-orange-700">{approvingItem.serviceName || 'Ăn sáng bán trú'}</span>
              </div>
              <div className="flex justify-between">
                <span>Mức phí:</span>
                <span className="font-bold text-gray-900">{Number(approvingItem.unitPrice || 450000).toLocaleString('vi-VN')} đ/tháng</span>
              </div>
              <div className="flex justify-between">
                <span>Bắt đầu từ:</span>
                <span className="font-medium text-gray-900">{approvingItem.startDate}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">Ghi chú phê duyệt / dặn dò bếp ăn</label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Nhập ghi chú gửi cho phụ huynh và bếp ăn..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                disabled={submittingApprove}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submittingApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {submittingApprove ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Xác nhận phê duyệt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject Confirmation */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2 bg-rose-50 rounded-xl">
                <XCircle className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-bold text-gray-900">Từ Chối Đơn Ăn Sáng</h3>
            </div>
            <p className="text-xs text-gray-500">
              Vui lòng nêu rõ lý do từ chối để hệ thống phản hồi tới phụ huynh học sinh{' '}
              <strong className="text-gray-800">{rejectingItem.studentName}</strong>.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                placeholder="Ví dụ: Lớp hiện đã quá tải suất ăn sáng, xin vui lòng đăng ký vào tháng sau..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                disabled={submittingReject}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {submittingReject ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

