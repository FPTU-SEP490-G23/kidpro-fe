import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Smartphone,
  Sparkles
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
  const qrRef = useRef<SVGSVGElement>(null);

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

  // Handle Deep-link to Mobile Banking App (1-Chạm)
  const handleOpenBankApp = () => {
    const deepLink = qrData?.deepLinkUrl || `vietqr://transfer?bankCode=970422&accNo=0987654321&amount=${invoice.totalAmount}&memo=${encodeURIComponent(invoice.referenceCode)}`;
    
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
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `VietQR_HocPhi_${invoice.referenceCode}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const paymentDesc = qrData?.description || `KIDPRO ${invoice.referenceCode}`;
  const accountNumber = qrData?.accountNumber || '0987654321';
  const bankName = qrData?.bankName || 'MBBank (Ngân hàng Quân Đội)';
  const accountName = qrData?.accountName || 'TRUONG MAM NON KIDPRO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* MÀN HÌNH XÁC NHẬN THANH TOÁN THÀNH CÔNG THỜI GIAN THỰC */}
        {isNowPaid ? (
          <div className="py-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-100 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                THANH TOÁN THÀNH CÔNG!
              </h3>
              <p className="text-xs text-emerald-700 font-bold">
                MSG-192: Đã xác nhận thanh toán thành công! Biên lai điện tử đã được tạo
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 text-xs text-slate-700 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Kỳ học phí:</span>
                <strong className="text-slate-900">{invoice.billingPeriod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền đã gạch nợ:</span>
                <strong className="text-[#275A4E] text-sm">{formatCurrency(invoice.totalAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã tham chiếu:</span>
                <strong className="font-mono text-slate-900">{invoice.referenceCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời điểm thanh toán:</span>
                <span>{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div className="pt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  alert(`Đang mở biên lai điện tử cho hóa đơn ${invoice.invoiceNumber}...`);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition min-h-[44px]"
              >
                <FileText className="h-4 w-4 text-[#275A4E]" />
                <span>Xem Biên Lai (PDF)</span>
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-3 text-xs font-bold transition min-h-[44px]"
              >
                <span>Hoàn Tất</span>
              </button>
            </div>
          </div>
        ) : (
          /* MÀN HÌNH CHỜ THANH TOÁN VIETQR */
          <div className="space-y-4">
            {/* Header */}
            <div className="pr-8">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-emerald-50 p-2 text-[#275A4E]">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Thanh Toán Học Phí Trực Tuyến - VietQR 24/7 (UC-048)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chuẩn Napas247 • Tự động gạch nợ tức thì không cần gửi ảnh sao kê
                  </p>
                </div>
              </div>
            </div>

            {/* Toast notice */}
            {toastMessage && (
              <div
                className={`rounded-xl p-3 text-xs font-medium flex items-center justify-between ${
                  toastMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : toastMessage.type === 'warning'
                    ? 'bg-amber-50 text-amber-900 border border-amber-300'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{toastMessage.text}</span>
                <button
                  onClick={() => setToastMessage(null)}
                  className="font-bold text-sm ml-2"
                >
                  ×
                </button>
              </div>
            )}

            {/* Khung Hiển Thị Mã QR Động (Dynamic VietQR Code Display) */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 text-center relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1E4D40] text-[11px] font-bold mb-3">
                <Sparkles className="h-3 w-3 text-[#275A4E]" />
                <span>Số Tiền Thực Nộp: {formatCurrency(invoice.totalAmount)}</span>
              </div>

              {isLoadingQr ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-[#275A4E] mb-2" />
                  <p className="text-xs text-slate-500">Đang tạo mã VietQR chuẩn Napas...</p>
                </div>
              ) : (
                <div className="relative inline-block p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
                  {/* High Quality Dynamic QR SVG */}
                  <QRCodeSVG
                    ref={qrRef}
                    value={`https://api.vietqr.io/image/970422-0987654321-compact.jpg?amount=${invoice.totalAmount}&addInfo=${encodeURIComponent(paymentDesc)}&accountName=TRUONG%20MAM%20NON%20KIDPRO`}
                    size={210}
                    level="H"
                    includeMargin={true}
                  />

                  {/* Napas / Kidpro Badge */}
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#275A4E] text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs border border-white whitespace-nowrap">
                    NAPAS 24/7 • TỰ ĐỘNG GẠCH NỢ
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
                  <strong className="font-mono text-sm text-slate-900">{accountNumber}</strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(accountNumber, 'acc')}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition"
                  >
                    {copiedField === 'acc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'acc' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Số tiền + Copy */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Số tiền chính xác:</span>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-extrabold text-[#275A4E]">
                    {formatCurrency(invoice.totalAmount)}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(invoice.totalAmount), 'amount')}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 transition"
                  >
                    {copiedField === 'amount' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>

              {/* Nội dung chuyển khoản duy nhất + Copy */}
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-500">Nội dung bắt buộc:</span>
                <div className="flex items-center gap-2">
                  <strong className="font-mono text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    {paymentDesc}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentDesc, 'desc')}
                    className="inline-flex items-center gap-1 rounded-md bg-[#275A4E]/10 hover:bg-[#275A4E]/20 px-2 py-1 text-[11px] font-bold text-[#275A4E] transition"
                  >
                    {copiedField === 'desc' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedField === 'desc' ? 'Đã sao chép' : 'Sao chép'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Nút Hành Động 1-Chạm Trên Thiết Bị Di Động */}
            <div className="space-y-2 pt-1">
              {isMobile ? (
                <button
                  type="button"
                  onClick={handleOpenBankApp}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3.5 px-4 text-xs font-bold shadow-lg shadow-[#275A4E]/20 transition min-h-[48px]"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>MỞ ỨNG DỤNG NGÂN HÀNG (1-CHẠM)</span>
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 transition min-h-[44px]"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Lưu Ảnh Mã QR</span>
                </button>

                {/* Nút Test Mô Phỏng Gạch Nợ Webhook (Demo Simulator) */}
                <button
                  type="button"
                  onClick={() => simulateWebhookMutation.mutate()}
                  disabled={simulateWebhookMutation.isPending}
                  title="Mô phỏng ngân hàng chuyển tiền thành công để kiểm thử chuyển sang trạng thái PAID"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 py-2.5 px-3 text-xs font-bold transition shadow-xs min-h-[44px]"
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
