import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Percent,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  XCircle,
  HelpCircle,
  MessageSquare,
  X
} from 'lucide-react';
import { FeeCatalogTab } from './FeeCatalogTab';
import { DiscountPolicyTab } from './DiscountPolicyTab';
import feePolicyApi, { FeePolicyStatusDto } from '../../../api/feePolicyApi';

interface FeePolicyManagementTabProps {
  isBgh?: boolean;
}

export const FeePolicyManagementTab: React.FC<FeePolicyManagementTabProps> = ({ isBgh = false }) => {
  const [subTab, setSubTab] = useState<'catalog' | 'discounts'>('catalog');
  const [policyStatus, setPolicyStatus] = useState<FeePolicyStatusDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Modal Từ chối của BGH
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res: any = await feePolicyApi.getStatus();
      setPolicyStatus(res?.data || res);
    } catch (err: any) {
      console.error('Lỗi khi tải trạng thái phê duyệt biểu phí:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // 1. Kế toán: Gửi toàn bộ cho BGH duyệt
  const handleSubmitForApproval = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn gửi toàn bộ Danh mục khoản thu và Chính sách miễn giảm lên Ban Giám Hiệu phê duyệt?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res: any = await feePolicyApi.submitForApproval();
      const updated = res?.data || res;
      setPolicyStatus(updated);
      showToast('success', updated.message || 'Đã gửi toàn bộ biểu phí và chính sách miễn giảm lên Ban Giám Hiệu thành công.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi gửi phê duyệt biểu phí.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. BGH: Phê duyệt tất cả
  const handleApproveAll = async () => {
    if (!window.confirm('Ban Giám Hiệu xác nhận phê duyệt toàn bộ danh mục khoản thu và chính sách miễn giảm năm học mới?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res: any = await feePolicyApi.approveAll();
      const updated = res?.data || res;
      setPolicyStatus(updated);
      showToast('success', updated.message || 'Đã phê duyệt toàn bộ biểu phí thành công.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi phê duyệt biểu phí.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. BGH: Từ chối kèm lý do
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('warning', 'Vui lòng nhập lý do từ chối để Kế toán có căn cứ chỉnh sửa.');
      return;
    }
    try {
      setActionLoading(true);
      const res: any = await feePolicyApi.rejectPolicy({ reason: rejectReason.trim() });
      const updated = res?.data || res;
      setPolicyStatus(updated);
      setIsRejectModalOpen(false);
      setRejectReason('');
      showToast('warning', updated.message || 'Đã từ chối biểu phí và gửi yêu cầu chỉnh sửa tới Kế toán.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi từ chối biểu phí.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. BGH: Thu hồi phê duyệt (chuyển thẳng về PENDING, thu hồi thoải mái, không báo lỗi)
  const handleRevoke = async () => {
    if (!window.confirm('BGH có chắc chắn muốn thu hồi phê duyệt biểu phí? Dữ liệu sẽ chuyển về trạng thái Dự thảo (PENDING) để Kế toán chỉnh sửa lại.')) {
      return;
    }
    try {
      setActionLoading(true);
      const res: any = await feePolicyApi.revokeApproval();
      const updated = res?.data || res;
      setPolicyStatus(updated);
      showToast('success', updated.message || 'Đã thu hồi phê duyệt thành công. Dữ liệu đã chuyển về Dự thảo.');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi thu hồi phê duyệt.');
    } finally {
      setActionLoading(false);
    }
  };

  const status = policyStatus?.status || 'PENDING';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMsg.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3 text-xs font-semibold">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-75 ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* BANNER TƯƠNG TÁC PHÊ DUYỆT BIỂU PHÍ GIỮA KẾ TOÁN VÀ BGH */}
      <div className="p-5 rounded-2xl border bg-white shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Quy Trình Phê Duyệt Biểu Phí &amp; Miễn Giảm
              </span>
              {/* Badge trạng thái */}
              {status === 'PENDING' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Dự thảo (Chưa gửi duyệt)
                </span>
              )}
              {status === 'PENDING_APPROVAL' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  Chờ Ban Giám Hiệu phê duyệt
                </span>
              )}
              {status === 'APPROVED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Đã phê duyệt chính thức
                </span>
              )}
              {status === 'REJECTED' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Ban Giám Hiệu yêu cầu sửa đổi
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600">
              {policyStatus?.message || 'Quy trình thẩm định và ban hành biểu phí học phí, suất ăn và các chính sách ưu đãi năm học.'}
            </p>
          </div>

          {/* Các nút hành động tương tác */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loading || actionLoading}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Làm mới trạng thái"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* A. Role KẾ TOÁN */}
            {!isBgh && (
              <>
                {(status === 'PENDING' || status === 'REJECTED') && (
                  <button
                    type="button"
                    onClick={handleSubmitForApproval}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{status === 'REJECTED' ? 'Gửi Lại BGH Phê Duyệt' : 'Gửi BGH Phê Duyệt Toàn Bộ'}</span>
                  </button>
                )}
              </>
            )}

            {/* B. Role BAN GIÁM HIỆU */}
            {isBgh && (
              <>
                {status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      type="button"
                      onClick={handleApproveAll}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Phê Duyệt Tất Cả</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      disabled={actionLoading}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ Chối Phê Duyệt</span>
                    </button>
                  </>
                )}

                {/* BGH được quyền thu hồi phê duyệt thoải mái, không báo lỗi */}
                {(status === 'APPROVED' || status === 'PENDING_APPROVAL') && (
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                    title="Thu hồi toàn bộ phê duyệt và chuyển về Dự thảo để Kế toán sửa"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>Thu Hồi Phê Duyệt</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Cảnh báo lý do từ chối nếu có */}
        {status === 'REJECTED' && policyStatus?.rejectionReason && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Ý kiến chỉ đạo từ Ban Giám Hiệu:
            </span>
            <p className="italic pl-5">"{policyStatus.rejectionReason}"</p>
          </div>
        )}
      </div>

      {/* BGH: Nếu Kế toán chưa gửi duyệt (status === PENDING), BGH không thấy data */}
      {isBgh && status === 'PENDING' ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Dữ Liệu Đang Ở Trạng Thái Dự Thảo
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Bộ phận Kế toán đang chuẩn bị hoặc đã được Ban Giám Hiệu thu hồi phê duyệt để chỉnh sửa lại biểu phí. Dữ liệu sẽ tự động hiển thị khi Kế toán gửi trình duyệt chính thức.
          </p>
        </div>
      ) : (
        <>
          {/* TAB ĐI ĐÔI VỚI NHAU: 1. Khoản Thu | 2. Chính Sách Miễn Giảm */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setSubTab('catalog')}
              className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                subTab === 'catalog'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>1. Danh Mục Biểu Phí &amp; Khoản Thu</span>
            </button>
            <button
              onClick={() => setSubTab('discounts')}
              className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                subTab === 'discounts'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>2. Chính Sách Miễn Giảm Học Phí</span>
            </button>
          </div>

          {subTab === 'catalog' ? (
            <FeeCatalogTab isBgh={isBgh} approvalStatus={status} />
          ) : (
            <DiscountPolicyTab isBgh={isBgh} approvalStatus={status} />
          )}
        </>
      )}

      {/* Modal BGH Từ Chối Phê Duyệt */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Từ Chối Phê Duyệt Biểu Phí</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Vui lòng nhập lý do từ chối và yêu cầu điều chỉnh để bộ phận Kế toán cập nhật lại danh mục khoản thu hoặc chính sách miễn giảm:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lý do từ chối / Nội dung cần sửa *
                </label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Giảm định mức phí CLB năng khiếu 10%, bổ sung chính sách học bổng học sinh khó khăn..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePolicyManagementTab;
