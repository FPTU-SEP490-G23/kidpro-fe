import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Loader2,
  Inbox,
  Clock,
  FileText,
  X,
  School,
  Check,
  User,
  Filter,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { classTransferService, ClassTransferRequestItem } from '../../../services/classTransferService';
import { useToast } from '../../../contexts/ToastContext';
import { formatDate } from '../../../utils/formatters';

export const ClassTransferTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals
  const [selectedRequest, setSelectedRequest] = useState<ClassTransferRequestItem | null>(null);
  const [modalMode, setModalMode] = useState<'NONE' | 'APPROVE' | 'REJECT' | 'DETAIL'>('NONE');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // 1. Fetch Transfer Requests from Backend API
  const { data: requests = [], isLoading: isLoadingRequests, refetch } = useQuery<ClassTransferRequestItem[]>({
    queryKey: ['class-transfers', statusFilter],
    queryFn: async () => {
      return await classTransferService.getRequests({
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
    }
  });

  // Filtered requests by search keyword
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const matchName = (r.studentName || '').toLowerCase().includes(kw);
        const matchCode = (r.studentCode || '').toLowerCase().includes(kw);
        const matchFrom = (r.fromClassName || '').toLowerCase().includes(kw);
        const matchTo = (r.toClassName || '').toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchFrom && !matchTo) return false;
      }
      return true;
    });
  }, [requests, searchKeyword]);

  // Mutation: Approve
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return await classTransferService.approveRequest(id);
    },
    onSuccess: (data: any) => {
      const msg = data?.message || 'MSG-037: Phê duyệt chuyển lớp cho học sinh thành công.';
      success(msg);
      setModalMode('NONE');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['class-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi phê duyệt chuyển lớp.';
      error(msg);
    }
  });

  // Mutation: Reject
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      if (!reason || reason.trim().length === 0) {
        throw new Error('MSG-029: Vui lòng nhập lý do từ chối.');
      }
      return await classTransferService.rejectRequest(id, { rejectionReason: reason.trim() });
    },
    onSuccess: (data: any) => {
      const msg = data?.message || 'MSG-038: Đã từ chối đề xuất chuyển lớp của học sinh.';
      warning(msg);
      setModalMode('NONE');
      setSelectedRequest(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['class-transfers'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi từ chối chuyển lớp.';
      error(msg);
    }
  });

  const onOpenApproveModal = (req: ClassTransferRequestItem) => {
    setSelectedRequest(req);
    setModalMode('APPROVE');
  };

  const onOpenRejectModal = (req: ClassTransferRequestItem) => {
    setSelectedRequest(req);
    setRejectionReason('');
    setModalMode('REJECT');
  };

  const onOpenDetailModal = (req: ClassTransferRequestItem) => {
    setSelectedRequest(req);
    setModalMode('DETAIL');
  };

  // Destination class capacity check
  const isDestinationFull = useMemo(() => {
    if (!selectedRequest) return false;
    const cur = selectedRequest.toClassCurrentEnrollment || 0;
    const max = selectedRequest.toClassCapacity || 35;
    return cur >= max;
  }, [selectedRequest]);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PENDING' ? 'bg-[#1E4D40] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Chờ Phê Duyệt</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'APPROVED' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã Phê Duyệt</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('REJECTED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Đã Từ Chối</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ALL' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>Tất Cả</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tên bé, mã số, tên lớp..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-emerald-700" />
              <span>Danh Sách Phiếu Đề Xuất Chuyển Lớp (G3-UC-08)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Duyệt hoặc từ chối phiếu đề xuất chuyển lớp cho học sinh theo quy tắc định mức sĩ số (BR-005, BR-007)
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
            {filteredRequests.length} phiếu
          </span>
        </div>

        {isLoadingRequests ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            <span className="text-xs font-semibold">Đang tải danh sách đề xuất chuyển lớp...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center p-6">
            <Inbox className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">Không có phiếu đề xuất nào</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {statusFilter === 'PENDING'
                ? 'Tuyệt vời! Hiện tại không còn phiếu đề xuất chuyển lớp nào đang chờ duyệt.'
                : 'Không tìm thấy phiếu đề xuất phù hợp với bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <th className="py-3.5 px-4">Học Sinh</th>
                  <th className="py-3.5 px-4">Lớp Hiện Tại</th>
                  <th className="py-3.5 px-4">Lớp Tiếp Nhận (Đích)</th>
                  <th className="py-3.5 px-4">Lý Do Chuyển</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isPending = req.status === 'PENDING' || req.status === 'PENDING_APPROVAL';
                  const isApproved = req.status === 'APPROVED';
                  const isRejected = req.status === 'REJECTED';
                  const destCurrent = req.toClassCurrentEnrollment || 0;
                  const destMax = req.toClassCapacity || 35;
                  const destIsFull = destCurrent >= destMax;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                            {req.studentName ? req.studentName.charAt(0) : 'E'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-emerald-700 transition cursor-pointer" onClick={() => onOpenDetailModal(req)}>
                              {req.studentName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>Mã: <strong className="text-slate-700">{req.studentCode}</strong></span>
                              {req.studentAgeMonths ? <span>• {req.studentAgeMonths} tháng</span> : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Source Class */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{req.fromClassName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Khối: {req.fromClassGrade || 'N/A'}
                        </div>
                      </td>

                      {/* Destination Class with Capacity Badge */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{req.toClassName}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${destIsFull ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {destCurrent}/{destMax}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {destIsFull ? (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Đã đủ sĩ số tối đa
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">
                              Còn trống {Math.max(0, destMax - destCurrent)} slot
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2" title={req.reason}>
                          {req.reason || 'Không có lý do cụ thể'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Chờ duyệt</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã duyệt</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/70" title={req.rejectionReason}>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Từ chối</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenApproveModal(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-xs transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Phê duyệt</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onOpenRejectModal(req)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Từ chối</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenDetailModal(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: APPROVE CONFIRMATION */}
      {modalMode === 'APPROVE' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-800 font-extrabold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Xác Nhận Phê Duyệt Chuyển Lớp</span>
              </div>
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Student info box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{selectedRequest.studentName}</div>
                <div className="text-slate-500">Mã học sinh: <strong>{selectedRequest.studentCode}</strong></div>
                <div className="text-slate-600 mt-1">
                  Lý do chuyển: <span className="italic">"{selectedRequest.reason || 'Nguyện vọng phụ huynh'}"</span>
                </div>
              </div>

              {/* Class Transfer Comparison Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lớp Chuyển Đi</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedRequest.fromClassName}</div>
                  <div className="text-[11px] text-slate-500">Sĩ số hiện tại: {selectedRequest.fromClassCurrentEnrollment}</div>
                </div>

                <div className={`p-3.5 rounded-2xl border space-y-1 ${isDestinationFull ? 'border-rose-300 bg-rose-50/50' : 'border-emerald-200 bg-emerald-50/30'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lớp Chuyển Đến</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedRequest.toClassName}</div>
                  <div className="text-[11px] font-semibold flex items-center justify-between">
                    <span>Sĩ số:</span>
                    <span className={isDestinationFull ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {selectedRequest.toClassCurrentEnrollment} / {selectedRequest.toClassCapacity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning if destination class is full (BR-005) */}
              {isDestinationFull && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>MSG-035: Lớp chuyển đến đã đủ sĩ số tối đa ({selectedRequest.toClassCapacity} trẻ). Không thể phê duyệt tiếp nhận.</span>
                </div>
              )}

              {!isDestinationFull && (
                <p className="text-slate-600 text-[11px]">
                  Sau khi phê duyệt, hệ thống sẽ tự động cập nhật phân lớp của trẻ sang <strong>{selectedRequest.toClassName}</strong>, tăng sĩ số lớp mới lên 1 và giảm sĩ số lớp cũ đi 1 (BR-007).
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={approveMutation.isPending || isDestinationFull}
                onClick={() => approveMutation.mutate(selectedRequest.id)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Xác Nhận Phê Duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT WITH MANDATORY REASON */}
      {modalMode === 'REJECT' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-700 font-extrabold text-base">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Từ Chối Đề Xuất Chuyển Lớp</span>
              </div>
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                Học sinh: <strong className="text-slate-900">{selectedRequest.studentName}</strong> (Mã: {selectedRequest.studentCode})
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Lý do từ chối <span className="text-rose-600">* (Bắt buộc theo BR-007)</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Vui lòng nhập lý do từ chối (ví dụ: Lớp đích không còn chỗ trống, chưa phù hợp với chương trình học...)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 placeholder-slate-400 font-medium"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Lý do này sẽ được lưu vào lịch sử phiếu đề xuất và thông báo trực tiếp đến Phụ huynh.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                onClick={() => rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason })}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span>Xác Nhận Từ Chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL VIEW */}
      {modalMode === 'DETAIL' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-base">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>Chi Tiết Phiếu Chuyển Lớp</span>
              </div>
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedRequest.studentName}</div>
                <div className="text-slate-500">Mã: {selectedRequest.studentCode} • Phụ huynh: {selectedRequest.parentName || 'N/A'} ({selectedRequest.parentPhone || 'Chưa có SĐT'})</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Lớp Ban Đầu</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedRequest.fromClassName}</div>
                </div>
                <div className="p-3 rounded-2xl border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Lớp Đích</span>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{selectedRequest.toClassName}</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-100 space-y-1 bg-white">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Lý Do Chuyển</span>
                <p className="text-slate-700 font-medium">{selectedRequest.reason || 'Nguyện vọng phụ huynh'}</p>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 space-y-1">
                  <span className="text-[10px] text-rose-600 font-bold uppercase">Lý Do Từ Chối (Giáo vụ)</span>
                  <p className="text-rose-900 font-semibold">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode('NONE')}
                className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};