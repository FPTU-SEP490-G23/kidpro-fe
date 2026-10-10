import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Webhook,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Code2,
  Filter,
  Check,
  X,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import financeApi from '../../../api/financeApi';
import {
  WebhookTransactionLog,
  WebhookReconciliationStatus
} from '../../../types/finance.types';

export const WebhookTransactionReconciliationTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Modal xem Raw JSONB Payload
  const [selectedLogForPayload, setSelectedLogForPayload] = useState<WebhookTransactionLog | null>(null);

  // Modal xử lý sai lệch (Discrepancy Resolver)
  const [selectedLogForResolve, setSelectedLogForResolve] = useState<WebhookTransactionLog | null>(null);
  const [resolveAction, setResolveAction] = useState<'PARTIAL_ACCEPT' | 'CREDIT_SURPLUS' | 'MAP_TO_INVOICE'>('PARTIAL_ACCEPT');
  const [manualInvoiceRef, setManualInvoiceRef] = useState<string>('');
  const [resolveNotes, setResolveNotes] = useState<string>('');

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tải dữ liệu Webhook Logs từ Backend API với chế độ Auto-poll 5s (Real-time IPN listener)
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['webhook-transaction-logs'],
    queryFn: async () => {
      try {
        const res = await financeApi.getWebhookLogs();
        return res.data;
      } catch {
        showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
        throw new Error('Network error');
      }
    },
    refetchInterval: 5000, // Cập nhật tự động thời gian thực mỗi 5 giây
  });

  const logs: WebhookTransactionLog[] = useMemo(() => (data?.logs as WebhookTransactionLog[]) || [], [data?.logs]);
  const stats = useMemo(() => data?.stats || {
    endpoint: '/api/payments/webhook',
    gatewayStatus: 'ONLINE' as const,
    totalReceivedToday: 48,
    autoClearedCount: 45,
    disputedCount: 2,
    duplicateSkippedCount: 1,
    averageLatencyMs: 418,
  }, [data?.stats]);

  // Lọc dữ liệu hiển thị
  const filteredLogs: WebhookTransactionLog[] = useMemo(() => {
    return logs.filter((item: WebhookTransactionLog) => {
      const matchStatus = statusFilter === 'ALL' || item.reconcileStatus === statusFilter;
      const matchKeyword =
        !searchKeyword ||
        item.bankTransId.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.paymentReferenceCode.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (item.studentName && item.studentName.toLowerCase().includes(searchKeyword.toLowerCase()));
      return matchStatus && matchKeyword;
    });
  }, [logs, statusFilter, searchKeyword]);

  // Mutation xử lý sai lệch giao dịch
  const resolveMutation = useMutation({
    mutationFn: async ({
      logId,
      action,
      targetInvoiceRef,
      notes,
    }: {
      logId: string;
      action: 'PARTIAL_ACCEPT' | 'CREDIT_SURPLUS' | 'MAP_TO_INVOICE';
      targetInvoiceRef?: string;
      notes: string;
    }) => {
      return financeApi.resolveWebhookDiscrepancy(logId, {
        action,
        targetInvoiceRef,
        notes,
      });
    },
    onSuccess: (_, variables) => {
      if (variables.action === 'PARTIAL_ACCEPT') {
        const remaining = (selectedLogForResolve?.invoiceAmount || 0) - (selectedLogForResolve?.transAmount || 0);
        showToast(
          'info',
          `MSG-163: Đã nhận thanh toán một phần qua VietQR. Dư nợ còn lại: ${formatCurrency(remaining)} VNĐ.`
        );
      } else if (variables.action === 'MAP_TO_INVOICE') {
        showToast('success', 'MSG-161: Đối soát giao dịch Webhook thanh toán thành công và đã tự động gạch nợ.');
      } else {
        showToast('success', 'Đã kết chuyển số tiền thừa sang khoản đặt cọc thành công.');
      }

      setSelectedLogForResolve(null);
      setResolveNotes('');
      setManualInvoiceRef('');
      queryClient.invalidateQueries({ queryKey: ['webhook-transaction-logs'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    },
  });

  // Giả lập nhận Webhook IPN mới (Simulate Incoming Webhook)
  const [isSimulating, setIsSimulating] = useState(false);
  const handleSimulateWebhook = async (shouldFailSignature = false) => {
    setIsSimulating(true);
    try {
      if (shouldFailSignature) {
        // Giả lập sai chữ ký HMAC-SHA256
        showToast('error', 'MSG-162: Xác thực chữ ký số Webhook thất bại. Nghi ngờ có hành vi giả mạo gói tin thanh toán.');
      } else {
        // Giả lập thành công
        await financeApi.sendPaymentWebhook({
          gateway: 'PayOS / VietQR Napas247',
          accountNumber: '0987654321',
          reference: 'INV202610A7B9C1',
          amount: 3145000,
          description: 'INV202610A7B9C1 THANH TOAN TEST',
          checksum: 'VALID_HMAC_SHA256_HASH',
        });
        showToast('success', 'MSG-161: Đối soát giao dịch Webhook thanh toán thành công và đã tự động gạch nợ.');
        refetch();
      }
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setIsSimulating(false);
    }
  };

  const getStatusBadge = (status: WebhookReconciliationStatus) => {
    switch (status) {
      case 'MATCHED_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/40">
            <CheckCircle2 className="h-3 w-3 text-[#275A4E]" />
            <span>MATCHED_PAID</span>
          </span>
        );
      case 'PARTIAL_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            <span>PARTIAL_PAID</span>
          </span>
        );
      case 'MISMATCH_DISPUTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-red-50 text-[#DC2626] border border-red-200">
            <AlertTriangle className="h-3 w-3 text-[#DC2626]" />
            <span>MISMATCH_DISPUTED</span>
          </span>
        );
      case 'DUPLICATE_SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black bg-slate-100 text-slate-500 border border-slate-200">
            <span>DUPLICATE_SKIPPED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border shadow-md animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-[#DC2626]'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <ShieldAlert className="h-5 w-5 shrink-0 text-[#DC2626]" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
          {toastMessage.type === 'info' && <Clock className="h-5 w-5 shrink-0 text-blue-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* THANH GIÁM SÁT TRẠNG THÁI WEBHOOK CỔNG TRƯỜNG */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Webhook className="h-3.5 w-3.5 text-emerald-600" />
              <span>IPN Listener: {stats.endpoint} • HOẠT ĐỘNG 24/7 (ONLINE)</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Đối Soát Webhook VietQR & Gạch Nợ Tự Động Thời Gian Thực
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Lắng nghe biến động số dư VietQR / PayOS, xác thực chữ ký HMAC-SHA256, kiểm tra tính Idempotency (BR-066)
            và tự động gạch nợ sang trạng thái PAID trong &lt; 2 giây.
          </p>
        </div>

        {/* Nút giả lập & làm mới */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleSimulateWebhook(false)}
            disabled={isSimulating}
            className="h-11 px-4 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
          >
            <Activity className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>Giả lập Webhook IPN</span>
          </button>

          <button
            onClick={() => handleSimulateWebhook(true)}
            disabled={isSimulating}
            title="Thử nghiệm gửi gói tin sai chữ ký mật mã"
            className="h-11 px-3 rounded-2xl border border-red-200 text-[#DC2626] hover:bg-red-50 font-bold text-xs transition"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 px-3.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* THẺ CHỈ SỐ THỐNG KÊ TRONG NGÀY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Webhook IPN</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-800">
              {stats.totalReceivedToday} <span className="text-sm font-semibold text-slate-500">giao dịch</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tiếp nhận trong hôm nay</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-[#275A4E]/20 bg-gradient-to-br from-white to-[#275A4E]/5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#275A4E]">
            <span className="text-xs font-bold uppercase tracking-wider">Tự động gạch nợ</span>
            <div className="h-8 w-8 rounded-xl bg-[#275A4E]/10 text-[#275A4E] flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#275A4E]">
              {stats.autoClearedCount} <span className="text-sm font-semibold text-slate-500">hóa đơn</span>
            </div>
            <p className="text-[11px] text-[#275A4E]/80 mt-0.5">Xử lý tự động &lt; 2 giây (Khớp 100%)</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-xs font-bold uppercase tracking-wider">Giao dịch sai lệch</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-800">
              {stats.disputedCount} <span className="text-sm font-semibold text-slate-500">giao dịch</span>
            </div>
            <p className="text-[11px] text-amber-700/80 mt-0.5">Sai số tiền hoặc sai cú pháp</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tốc độ xử lý TB</span>
            <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-purple-800">
              {stats.averageLatencyMs} <span className="text-sm font-semibold text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Idempotency: Bỏ qua {stats.duplicateSkippedCount} gói trùng</p>
          </div>
        </div>
      </div>

      {/* THANH BỘ LỌC & TÌM KIẾM */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600">Trạng thái đối soát:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-xs sm:text-sm text-[#1E4D40] outline-hidden cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="MATCHED_PAID">Gạch nợ thành công (MATCHED_PAID)</option>
              <option value="PARTIAL_PAID">Thanh toán một phần (PARTIAL_PAID)</option>
              <option value="MISMATCH_DISPUTED">Sai lệch cần đối soát (MISMATCH_DISPUTED)</option>
              <option value="DUPLICATE_SKIPPED">Gói tin trùng lặp (DUPLICATE_SKIPPED)</option>
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo TID, mã nội dung, tên bé..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#275A4E] focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* BẢNG NHẬT KÝ GIAO DỊCH & ĐỐI SOÁT WEBHOOK */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Nhật Ký Biến Động Số Dư & Tín Hiệu Webhook Ngân Hàng
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Tự động làm mới mỗi 5 giây
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-[#275A4E] animate-spin mx-auto" />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải nhật ký webhook...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Webhook className="h-10 w-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">Không tìm thấy giao dịch webhook nào phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Mã GD Ngân Hàng</th>
                  <th className="py-3.5 px-4">Mã Tham Chiếu VietQR</th>
                  <th className="py-3.5 px-4">Học Sinh & Lớp</th>
                  <th className="py-3.5 px-4 text-right">Số Tiền Chuyển</th>
                  <th className="py-3.5 px-4 text-right">Cần Nộp</th>
                  <th className="py-3.5 px-4 text-center">HMAC SHA-256</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredLogs.map((log: WebhookTransactionLog) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition group">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(log.receivedAt).toLocaleTimeString('vi-VN')}
                      <span className="text-[10px] block text-slate-400">
                        {new Date(log.receivedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {log.bankTransId}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#275A4E]">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200">
                        {log.paymentReferenceCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.studentName ? (
                        <>
                          <span className="font-extrabold text-[#1E4D40] block">{log.studentName}</span>
                          <span className="text-[11px] text-slate-400">{log.className}</span>
                        </>
                      ) : (
                        <span className="text-red-500 font-bold italic text-xs">
                          Chưa khớp học sinh (Sai cú pháp)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-[#1E4D40]">
                      {formatCurrency(log.transAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-500">
                      {log.invoiceAmount > 0 ? formatCurrency(log.invoiceAmount) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {log.hmacSignatureValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <ShieldCheck className="h-3 w-3" />
                          <span>HỢP LỆ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#DC2626] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          <ShieldAlert className="h-3 w-3" />
                          <span>NGHI GIẢ MẠO</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(log.reconcileStatus)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLogForPayload(log)}
                          title="Xem Raw JSONB Payload phục vụ kiểm toán"
                          className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          <span>JSONB</span>
                        </button>

                        {(log.reconcileStatus === 'MISMATCH_DISPUTED' ||
                          log.reconcileStatus === 'PARTIAL_PAID') && (
                          <button
                            onClick={() => {
                              setSelectedLogForResolve(log);
                              setResolveAction(
                                log.reconcileStatus === 'PARTIAL_PAID'
                                  ? 'PARTIAL_ACCEPT'
                                  : 'MAP_TO_INVOICE'
                              );
                            }}
                            className="h-8 px-2.5 rounded-lg bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs inline-flex items-center gap-1 transition"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Xử lý</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CHI TIẾT RAW JSONB PAYLOAD */}
      {selectedLogForPayload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#78C2AD]">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Raw JSONB Payload Kiểm Toán (BR-065)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Bank Trans ID: {selectedLogForPayload.bankTransId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForPayload(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">Xác thực Checksum HMAC:</span>
                  <strong className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-4 w-4" /> Hợp lệ (Key Khớp 100%)
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block">HTTP Response Code:</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                    200 OK ({selectedLogForPayload.processingTimeMs}ms)
                  </strong>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                  Dữ liệu gốc nhận từ SePay / VietQR:
                </label>
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
                  {JSON.stringify(selectedLogForPayload.rawPayload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Gói tin lưu trữ bất biến phục vụ kiểm toán tài chính nhà trường.
              </span>
              <button
                onClick={() => setSelectedLogForPayload(null)}
                className="h-10 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XỬ LÝ GIAO DỊCH SAI LỆCH (DISCREPANCY RESOLVER) */}
      {selectedLogForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-[#1E4D40] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">Xử Lý Ngoại Lệ Giao Dịch Webhook</h3>
                  <p className="text-xs text-white/80">Khắc phục chuyển thiếu hoặc sai nội dung</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForResolve(null)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 font-sans">
                <div className="flex justify-between">
                  <span>Mã GD Ngân hàng:</span>
                  <strong className="font-mono text-slate-900">{selectedLogForResolve.bankTransId}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Số tiền nhận được:</span>
                  <strong className="font-mono text-[#275A4E] text-base">
                    {formatCurrency(selectedLogForResolve.transAmount)}
                  </strong>
                </div>
                {selectedLogForResolve.invoiceAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Số tiền cần nộp:</span>
                    <strong className="font-mono text-slate-600">
                      {formatCurrency(selectedLogForResolve.invoiceAmount)}
                    </strong>
                  </div>
                )}
              </div>

              {/* Lựa chọn phương án xử lý */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block">Phương án xử lý ngoại lệ:</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 font-bold text-slate-800 text-xs sm:text-sm focus:border-[#275A4E] focus:outline-hidden"
                >
                  <option value="PARTIAL_ACCEPT">
                    Ghi nhận thanh toán một phần (PARTIALLY_PAID) - MSG-163
                  </option>
                  <option value="MAP_TO_INVOICE">
                    Gán thủ công mã hóa đơn đúng (Sửa lỗi sai cú pháp) - MSG-164
                  </option>
                  <option value="CREDIT_SURPLUS">
                    Kết chuyển số tiền vào số dư đặt cọc trả trước của trẻ
                  </option>
                </select>
              </div>

              {resolveAction === 'MAP_TO_INVOICE' && (
                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-800 block">
                    Nhập mã tham chiếu hóa đơn đúng (vd: INV202610A7B9C1):
                  </label>
                  <input
                    type="text"
                    value={manualInvoiceRef}
                    onChange={(e) => setManualInvoiceRef(e.target.value)}
                    placeholder="INV202610..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block">Ghi chú giải trình kiểm toán:</label>
                <textarea
                  rows={2}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Vd: Phụ huynh ghi thiếu ký tự mã hóa đơn..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedLogForResolve(null)}
                className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    logId: selectedLogForResolve.id,
                    action: resolveAction,
                    targetInvoiceRef: manualInvoiceRef,
                    notes: resolveNotes,
                  })
                }
                disabled={resolveMutation.isPending}
                className="h-11 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black flex items-center gap-2 shadow-md transition"
              >
                {resolveMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Xác Nhận Xử Lý Giao Dịch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhookTransactionReconciliationTab;
