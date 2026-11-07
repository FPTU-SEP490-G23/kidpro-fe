import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Check,
  X,
  Phone,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  busRegistrationApprovalApi,
  BusRegistrationItem,
} from '../../../api/busRegistrationApprovalApi';
import { useToast } from '../../../contexts/ToastContext';

export const BusRegistrationApprovalTab: React.FC = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [registrations, setRegistrations] = useState<BusRegistrationItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal approve state
  const [approvingItem, setApprovingItem] = useState<BusRegistrationItem | null>(null);
  const [approvalNote, setApprovalNote] = useState<string>('Đã duyệt đơn đăng ký xe buýt thành công.');
  const [submittingApprove, setSubmittingApprove] = useState<boolean>(false);

  // Modal reject state
  const [rejectingItem, setRejectingItem] = useState<BusRegistrationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submittingReject, setSubmittingReject] = useState<boolean>(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await busRegistrationApprovalApi.getAllRegistrations(
        filterStatus === 'ALL' ? undefined : filterStatus
      );
      setRegistrations(data);
    } catch (err: any) {
      error(err?.response?.data?.message || 'Không thể tải danh sách đơn đăng ký xe buýt');
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
        r.busNumber?.toLowerCase().includes(term) ||
        r.pickupAddress?.toLowerCase().includes(term) ||
        r.parentName?.toLowerCase().includes(term) ||
        r.parentPhone?.toLowerCase().includes(term)
    );
  }, [registrations, searchTerm]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!approvingItem) return;
    setSubmittingApprove(true);
    try {
      await busRegistrationApprovalApi.approveRegistration(approvingItem.registerId, approvalNote);
      success(`Đã phê duyệt đơn đăng ký xe buýt cho học sinh ${approvingItem.studentName}!`);
      setApprovingItem(null);
      setApprovalNote('Đã duyệt đơn đăng ký xe buýt thành công.');
      fetchRegistrations();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Phê duyệt thất bại. Vui lòng thử lại.');
    } finally {
      setSubmittingApprove(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      error('Vui lòng nhập lý do từ chối để phản hồi cho phụ huynh.');
      return;
    }
    setSubmittingReject(true);
    try {
      await busRegistrationApprovalApi.rejectRegistration(rejectingItem.registerId, rejectionReason.trim());
      success(`Đã từ chối đơn đăng ký xe buýt của học sinh ${rejectingItem.studentName}!`);
      setRejectingItem(null);
      setRejectionReason('');
      fetchRegistrations();
    } catch (err: any) {
      error(err?.response?.data?.message || 'Từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setSubmittingReject(false);
    }
  };

  const getPickupTypeBadge = (type: string) => {
    switch (type) {
      case 'TWO_WAY':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">Hai chiều</span>;
      case 'ONE_WAY_PICKUP':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">Chiều đón sáng</span>;
      case 'ONE_WAY_DROPOFF':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">Chiều trả chiều</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã Duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Từ Chối
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Chờ Duyệt
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Số Đơn</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/90 shadow-2xs flex items-center justify-between bg-gradient-to-br from-amber-50/40 to-transparent">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Chờ Phê Duyệt</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/90 shadow-2xs flex items-center justify-between bg-gradient-to-br from-emerald-50/40 to-transparent">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Đã Phê Duyệt</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.approved}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200/90 shadow-2xs flex items-center justify-between bg-gradient-to-br from-rose-50/40 to-transparent">
          <div>
            <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Đã Từ Chối</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.rejected}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status filter tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'ALL'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-800 hover:text-amber-950'
            }`}
          >
            Chờ duyệt ({stats.pending})
          </button>
          <button
            onClick={() => setFilterStatus('APPROVED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-800 hover:text-emerald-950'
            }`}
          >
            Đã duyệt ({stats.approved})
          </button>
          <button
            onClick={() => setFilterStatus('REJECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-800 hover:text-rose-950'
            }`}
          >
            Đã từ chối ({stats.rejected})
          </button>
        </div>

        {/* Search input and reload button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên HS, mã, lớp, tuyến xe..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchRegistrations}
            title="Làm mới danh sách"
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm font-medium">Đang tải danh sách đơn đăng ký xe buýt...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Bus className="w-8 h-8" />
            </div>
            <p className="text-base font-bold text-slate-800">Không có đơn đăng ký xe buýt nào</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'Không tìm thấy kết quả phù hợp với từ khóa tìm kiếm.'
                : 'Hiện chưa có đơn đăng ký nào theo trạng thái đã chọn.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Mã Đơn</th>
                  <th className="py-3 px-4">Học Sinh</th>
                  <th className="py-3 px-4">Tuyến Xe & Điểm Đón</th>
                  <th className="py-3 px-4">Phụ Huynh Liên Hệ</th>
                  <th className="py-3 px-4">Thời Gian Áp Dụng</th>
                  <th className="py-3 px-4">Ghi Chú Phụ Huynh</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredList.map((item) => (
                  <tr key={item.registerId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{item.registerId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.studentName}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-600">
                          {item.studentCode || 'Chưa cấp'}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{item.className || 'Chưa gán lớp'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Bus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tuyến {item.busNumber || 'KidPro'}</span>
                        {getPickupTypeBadge(item.pickupType)}
                      </div>
                      <div className="flex items-start gap-1 mt-1 text-[11px] text-slate-600 line-clamp-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span>{item.pickupAddress}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.parentName || 'Phụ huynh'}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.parentPhone || 'Chưa cập nhật'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-[11px] text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Bắt đầu: {item.startDate}</span>
                      </div>
                      {item.endDate && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Đến: {item.endDate}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <p className="text-xs text-slate-600 line-clamp-2 italic">
                        {item.note || 'Không có ghi chú'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setApprovingItem(item);
                              setApprovalNote('Đã duyệt đơn đăng ký xe buýt thành công.');
                            }}
                            title="Phê duyệt đơn đăng ký"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingItem(item);
                              setRejectionReason('');
                            }}
                            title="Từ chối đơn đăng ký"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PHÊ DUYỆT ĐƠN */}
      {approvingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Xác Nhận Phê Duyệt Đơn Xe Buýt</h3>
                <p className="text-xs text-slate-500">
                  Học sinh sẽ được xếp vào danh sách điểm danh tuyến xe tương ứng
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-bold text-slate-900">{approvingItem.studentName} ({approvingItem.className})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tuyến xe buýt:</span>
                <span className="font-bold text-emerald-800">Xe {approvingItem.busNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm đón/trả:</span>
                <span className="font-medium text-slate-800 text-right max-w-[260px]">{approvingItem.pickupAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày bắt đầu:</span>
                <span className="font-semibold text-slate-800">{approvingItem.startDate}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ghi chú phê duyệt / Lời dặn gửi phụ huynh
              </label>
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                rows={3}
                placeholder="Nhập ghi chú hoặc hướng dẫn nếu có..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                disabled={submittingApprove}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submittingApprove}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {submittingApprove ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Xác Nhận Phê Duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI ĐƠN */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Từ Chối Đơn Đăng Ký Xe Buýt</h3>
                <p className="text-xs text-slate-500">
                  Vui lòng cung cấp lý do từ chối để hệ thống phản hồi tới phụ huynh
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-bold text-slate-900">{rejectingItem.studentName} ({rejectingItem.className})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tuyến xe buýt:</span>
                <span className="font-bold text-slate-800">Xe {rejectingItem.busNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Điểm đón:</span>
                <span className="font-medium text-slate-800 text-right max-w-[260px]">{rejectingItem.pickupAddress}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lý do từ chối <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Tuyến xe này đã đủ sức chứa tối đa, hoặc điểm đón nằm ngoài bán kính phục vụ..."
                className="w-full text-xs p-3 rounded-xl border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                disabled={submittingReject}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingReject}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
              >
                {submittingReject ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span>Xác Nhận Từ Chối</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

