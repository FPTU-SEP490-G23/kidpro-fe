import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QrCode,
  Copy,
  Check,
  Download,
  CheckCircle2,
  Loader2,
  X,
  Smartphone,
  Sparkles,
  CreditCard
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { TuitionInvoiceItem, VietQrPaymentInfo } from '../../../types/parent.types';
import { formatCurrency } from '../../../utils/formatters';

interface VietQrPaymentModalProps {
  invoice: TuitionInvoiceItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const VietQrPaymentModal: React.FC<VietQrPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [qrMode, setQrMode] = useState<'DYNAMIC' | 'STATIC'>('DYNAMIC');

  // Copy states
  const [copiedField, setCopiedField] = useState<'acc' | 'amount' | 'desc' | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Check if Mobile Device
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);

  // Fetch VietQR Data (GET /api/finance/invoices/{id}/vietqr)
  const { data: qrData, isLoading: isLoadingQr } = useQuery<VietQrPaymentInfo>({
    queryKey: ['vietqr-data', invoice.id],
    queryFn: () => parentApi.getInvoiceVietQrData(invoice.id, invoice.totalAmount, invoice.referenceCode),
    enabled: isOpen,
  });

  // Polling Invoice Status (every 3000ms until PAID)
  const { data: updatedInvoice } = useQuery<TuitionInvoiceItem | null>({
    queryKey: ['poll-invoice-status', invoice.referenceCode],
    queryFn: () => parentApi.getInvoiceByReference(invoice.referenceCode),
    enabled: isOpen && invoice.status !== 'PAID',
    refetchInterval: (query) => {
      // Stop polling once paid
      if (query.state.data?.status === 'PAID') return false;
      return 3000;
    },
  });

  const isNowPaid = invoice.status === 'PAID' || updatedInvoice?.status === 'PAID';

  // Trigger success callback once paid
  useEffect(() => {
    if (isNowPaid && isOpen) {
      queryClient.invalidateQueries({ queryKey: ['tuition-invoices'] });
      onSuccess();
    }
  }, [isNowPaid, isOpen]);

  // Simulate Webhook Payment Mutation
  const simulateWebhookMutation = useMutation({
    mutationFn: () => parentApi.simulatePaymentWebhook(invoice.referenceCode, invoice.totalAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tuition-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['poll-invoice-status', invoice.referenceCode] });
      setToastMessage({
        type: 'success',
        text: 'MSG-192: Đã xác nhận thanh toán thành công! Biên lai điện tử đã được tạo',
      });
    },
  });

  if (!isOpen) return null;

  // Handle Copy to Clipboard
  const handleCopy = (text: string, field: 'acc' | 'amount' | 'desc') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const paymentDesc = qrData?.description || `KIDPRO ${invoice.referenceCode}`;
  const accountNumber = '666619092005';
  const bankName = qrData?.bankName || 'MBBank (Ngân hàng TMCP Quân Đội)';
  const accountName = qrData?.accountName || 'TRUONG MAM NON KIDPRO';

  const dynamicQrUrl = (
    qrData?.qrImageUrl ||
    (invoice.paymentQrCode ? invoice.paymentQrCode.replace(/KIDPRO8888/g, '666619092005') : '') ||
    `https://img.vietqr.io/image/970422-666619092005-compact2.png?amount=${invoice.totalAmount}&addInfo=${encodeURIComponent(paymentDesc)}&accountName=TRUONG%20MAM%20NON%20KIDPRO`
  ).replace(/KIDPRO8888/g, '666619092005');

  const staticQrUrl = 'https://img.vietqr.io/image/970422-666619092005-compact2.png?accountName=TRUONG%20MAM%20NON%20KIDPRO';

  const activeQrUrl = qrMode === 'DYNAMIC' ? dynamicQrUrl : staticQrUrl;

  // Handle Deep-link to Mobile Banking App (1-Chạm)
  const handleOpenBankApp = () => {
    const deepLink = qrMode === 'DYNAMIC'
      ? (qrData?.deepLinkUrl || `vietqr://transfer?bankCode=970422&accNo=666619092005&amount=${invoice.totalAmount}&memo=${encodeURIComponent(invoice.referenceCode)}`)
      : 'vietqr://transfer?bankCode=970422&accNo=666619092005';
    
    // Attempt deep-link launch
    const start = Date.now();
    window.location.href = deepLink;

    // Fallback if app not installed (MSG-193)
    setTimeout(() => {
      if (Date.now() - start < 1500) {
        setToastMessage({
          type: 'warning',
          text: 'MSG-193: Không tìm thấy app ngân hàng. Vui lòng quét mã QR hoặc sao chép thông tin chuyển khoản.',
        });
      }
    }, 1200);
  };

  // Download QR Code image
  const handleDownloadQr = () => {
    window.open(activeQrUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* MÀN HÌNH XÁC NHẬN THANH TOÁN THÀNH CÔNG THỜI GIAN THỰC */}
        {isNowPaid ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
              <CheckCircle2 className="h-12 w-12" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                Giao Dịch Thành Công! (MSG-192)
              </h3>
              <p className="text-xs text-slate-500">
                Hệ thống ngân hàng MB Bank đã xác nhận khoản thanh toán học phí của bạn.
              </p>
            </div>

            {/* Chi Tiết Giao Dịch Đã Khớp Nợ */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-600">Mã hóa đơn:</span>
                <strong className="font-mono text-slate-900">{invoice.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Số tiền đã nộp:</span>
                <strong className="text-emerald-700 font-bold">{formatCurrency(invoice.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Kênh thanh toán:</span>
                <strong className="text-slate-900">VietQR Napas 24/7 (MB Bank)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Thời gian xác thực:</span>
                <strong className="text-slate-900">{new Date().toLocaleString('vi-VN')}</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3 px-4 text-xs font-bold transition shadow-md shadow-[#275A4E]/20"
              >
                Xác Nhận & Đóng Cửa Sổ
              </button>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH CHỜ THANH TOÁN VIETQR */
          <div className="space-y-4">
            {/* Header Modal */}
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#275A4E] uppercase tracking-wider">
                <QrCode className="h-5 w-5" />
                <span>Thanh Toán Học Phí Trực Tuyến - VietQR MB Bank</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Hóa Đơn {invoice.invoiceNumber}
              </h3>
              <p className="text-xs text-slate-500">
                Bé <strong>{invoice.studentName}</strong> • {invoice.className} • Kỳ {invoice.billingPeriod}
              </p>
            </div>

            {/* Chuyển Đổi Loại Mã QR: Có Tiền vs Không Tiền */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setQrMode('DYNAMIC')}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrMode === 'DYNAMIC'
                    ? 'bg-white text-[#275A4E] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Mã QR Theo Hóa Đơn (Điền sẵn tiền)</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode('STATIC')}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrMode === 'STATIC'
                    ? 'bg-white text-[#275A4E] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Mã QR Chung (Không kèm tiền)</span>
              </button>
            </div>

            {/* Toast Message Alert */}
            {toastMessage && (
              <div
                className={`rounded-xl p-3 text-xs flex items-center justify-between ${
                  toastMessage.type === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : toastMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{toastMessage.text}</span>
                <button
                  onClick={() => setToastMessage(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold ml-2 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            {/* Khung Hiển Thị Mã QR VietQR MB Bank */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1E4D40] text-[11px] font-bold mb-3">
                <Sparkles className="h-3 w-3 text-[#275A4E]" />
                <span>
                  {qrMode === 'DYNAMIC'
                    ? `Số Tiền Thực Nộp: ${formatCurrency(invoice.totalAmount)}`
                    : 'Mã QR Tĩnh Nhà Trường (Tự nhập số tiền)'}
                </span>
              </div>

              {isLoadingQr ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#275A4E] mb-2" />
                  <p className="text-xs text-slate-500">Đang tải mã VietQR chuẩn MB Bank...</p>
                </div>
              ) : (
                <div className="relative inline-block p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                  <img
                    src={activeQrUrl}
                    alt="VietQR MB Bank"
                    className="w-56 h-56 mx-auto object-contain rounded-xl"
                  />
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#275A4E] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs border border-white whitespace-nowrap">
                    {qrMode === 'DYNAMIC' ? 'NAPAS 24/7 • TỰ ĐỘNG GẠCH NỢ' : 'NAPAS 24/7 • MB BANK 666619092005'}
                  </div>
                </div>
              )}

              {/* Pulsing indicator */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-slate-600">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#78C2AD] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#275A4E]"></span>
                </span>
                <span>Đang chờ thanh toán từ ứng dụng ngân hàng...</span>
              </div>
            </div>

            {/* Thông Tin Chuyển Khoản Khóa Cố Định & Nút Sao Chép */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs bg-white">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <strong className="text-slate-900">{bankName}</strong>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <strong className="text-slate-900 font-mono">{accountName}</strong>
              </div>

              {/* Số tài khoản + Copy */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-sm text-[#275A4E] font-bold">{accountNumber}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountNumber, 'acc')}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    {copiedField === 'acc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'acc' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Số tiền + Copy */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Số tiền cần nộp:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-extrabold text-[#275A4E]">
                    {formatCurrency(invoice.totalAmount)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(invoice.totalAmount), 'amount')}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                  >
                    {copiedField === 'amount' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Nội dung chuyển khoản duy nhất + Copy */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500">Nội dung chuyển tiền:</span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {paymentDesc}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentDesc, 'desc')}
                    className="inline-flex items-center gap-1 rounded-md bg-[#275A4E]/10 hover:bg-[#275A4E]/20 px-2 py-1 text-[11px] font-bold text-[#275A4E] transition cursor-pointer"
                  >
                    {copiedField === 'desc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'desc' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Nút Hành Động 1-Chạm Trên Thiết Bị Di Động & Lưu ảnh */}
            <div className="space-y-2 pt-1">
              {isMobile ? (
                <button
                  type="button"
                  onClick={handleOpenBankApp}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3.5 px-4 text-xs font-bold shadow-lg shadow-[#275A4E]/20 transition min-h-[48px] cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>MỞ ỨNG DỤNG NGÂN HÀNG (1-CHẠM)</span>
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 transition min-h-[44px] cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Mở / Tải Ảnh Mã QR</span>
                </button>

                {/* Nút Test Mô Phỏng Gạch Nợ Webhook (Demo Simulator) */}
                <button
                  type="button"
                  onClick={() => simulateWebhookMutation.mutate()}
                  disabled={simulateWebhookMutation.isPending}
                  title="Mô phỏng ngân hàng chuyển tiền thành công để kiểm thử chuyển sang trạng thái PAID"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 py-2.5 px-3 text-xs font-bold transition shadow-xs min-h-[44px] cursor-pointer"
                >
                  {simulateWebhookMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Mô Phỏng Gạch Nợ Webhook</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VietQrPaymentModal;