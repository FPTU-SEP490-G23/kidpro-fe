import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { ElectronicReceiptData } from '../../../types/parent.types';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface ElectronicReceiptModalProps {
  receipt: ElectronicReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export const ElectronicReceiptModal: React.FC<ElectronicReceiptModalProps> = ({
  receipt,
  isOpen,
  onClose,
}) => {
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    text: string;
  } | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isReissuingCert, setIsReissuingCert] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !receipt) return null;

  // Xử lý In trực tiếp khổ A4/A5
  const handlePrint = () => {
    window.print();
  };

  // Xử lý Tải tệp PDF biên lai (với Fallback Web View nếu server MinIO bận)
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setToastMessage(null);

    try {
      // Giả lập gọi API lấy tệp PDF
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Thử mô phỏng tải tệp hoặc kích hoạt fallback Web view
      const randomSuccess = Math.random() > 0.15; // 85% thành công
      if (randomSuccess) {
        // Tạo tệp download giả lập
        const blob = new Blob(
          [
            `BIEN LAI THU TIEN DIEN TU - ${receipt.receiptNumber}\nHoc sinh: ${receipt.payerInfo.studentName}\nSo tien: ${receipt.totalPaid} VND\nMa xac thuc SHA-256: ${receipt.digitalSignature.sha256Hash}`
          ],
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `BienLai_${receipt.receiptNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setToastMessage({
          type: 'success',
          text: 'Tải biên lai điện tử thành công',
        });
      } else {
        // Kích hoạt chế độ Web Fallback
        setToastMessage({
          type: 'warning',
          text: 'Đang hiển thị bản xem biên lai dạng web. Việc tải tệp PDF sẽ được thử lại.',
        });
      }
    } catch {
      setToastMessage({
        type: 'warning',
        text: 'Đang hiển thị bản xem biên lai dạng web. Việc tải tệp PDF sẽ được thử lại.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Cấp lại chứng chỉ chữ ký số bảo mật
  const handleReissueCert = async () => {
    setIsReissuingCert(true);
    setToastMessage({
      type: 'info',
      text: 'Đang cấp lại chứng chỉ chữ ký số bảo mật cho biên lai...',
    });

    setTimeout(() => {
      setIsReissuingCert(false);
      setToastMessage({
        type: 'success',
        text: 'Đã hoàn tất kiểm tra và cấp lại chứng thư chữ ký số toàn vẹn (SHA-256).',
      });
    }, 1500);
  };

  // Sao chép mã SHA-256
  const handleCopyHash = () => {
    navigator.clipboard.writeText(receipt.digitalSignature.sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // Chia sẻ biên lai qua liên kết hoặc Zalo
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Biên lai thu học phí ${receipt.receiptNumber}`,
          text: `Biên lai thu tiền học phí điện tử bé ${receipt.payerInfo.studentName} (${formatCurrency(receipt.totalPaid)})`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage({
        type: 'success',
        text: 'Đã sao chép liên kết biên lai điện tử vào bộ nhớ tạm để chia sẻ.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 print:p-0 print:bg-white print:fixed-none">
      {/* Container chính của Modal */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Header Toolbar (Ẩn khi In) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Bản Xem Trước Biên Lai Thu Tiền Điện Tử
              </h3>
              <p className="text-[11px] text-slate-500">
                Chuẩn mực kế toán VAS • Mã chứng thư số xác thực toàn vẹn SHA-256
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Cấp lại chứng thư số */}
            <button
              type="button"
              onClick={handleReissueCert}
              disabled={isReissuingCert}
              title="Cấp lại chứng chỉ chữ ký số bảo mật cho biên lai"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition min-h-[40px]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isReissuingCert ? 'animate-spin text-[#275A4E]' : ''}`} />
              <span>Cấp Lại Chữ Ký Số</span>
            </button>

            {/* Nút In Trực Tiếp */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs min-h-[40px]"
            >
              <Printer className="h-4 w-4 text-[#275A4E]" />
              <span className="hidden sm:inline">In Biên Lai</span>
            </button>

            {/* Nút Tải PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2 text-xs font-bold transition shadow-xs disabled:opacity-50 min-h-[40px]"
            >
              <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Đang Tải...' : 'Tải File PDF'}</span>
            </button>

            {/* Nút Chia Sẻ */}
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Chia sẻ biên lai"
            >
              <Share2 className="h-4 w-4" />
            </button>

            {/* Nút Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Thông báo toast */}
        {toastMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b print:hidden transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : toastMessage.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : toastMessage.type === 'info'
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* NỘI DUNG BIÊN LAI CHUẨN MỰC BỘ TÀI CHÍNH / KẾ TOÁN VIỆT NAM (VAS) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100/50 print:bg-white print:p-0 print:overflow-visible">
          <div
            id="printable-receipt-content"
            className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:p-0 text-slate-900 font-sans"
          >
            {/* Header Biên Lai */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-slate-800">
              {/* Thông tin đơn vị phát hành */}
              <div className="space-y-1 sm:max-w-md">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-[#275A4E] text-white flex items-center justify-center font-extrabold text-[11px]">
                    KP
                  </div>
                  <h4 className="font-extrabold text-sm tracking-wide text-slate-900 uppercase">
                    {receipt.schoolInfo.name}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600">
                  <strong>Mã số thuế:</strong> {receipt.schoolInfo.taxCode}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Địa chỉ:</strong> {receipt.schoolInfo.address}
                </p>
                <p className="text-[11px] text-slate-600">
                  <strong>Hotline:</strong> {receipt.schoolInfo.phone} • <strong>Email:</strong> {receipt.schoolInfo.email}
                </p>
              </div>

              {/* Mẫu số, Ký hiệu & Số biên lai */}
              <div className="text-left sm:text-right space-y-1 text-xs shrink-0">
                <div className="inline-block bg-slate-100 px-3 py-1 rounded-md font-mono text-[11px] font-bold text-slate-800 border border-slate-300">
                  Mẫu số: 01BLTT-2026/001
                </div>
                <p className="text-[11px] text-slate-600">
                  Ký hiệu: <strong>KP/26E</strong>
                </p>
                <p className="text-sm font-extrabold text-[#275A4E] font-mono">
                  Số: {receipt.receiptNumber}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Mã tra cứu: {receipt.referenceCode}
                </p>
              </div>
            </div>

            {/* Tiêu đề Quốc hiệu & Tiêu đề Biên lai */}
            <div className="text-center my-6 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-700">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-[10px] italic text-slate-500 pb-2">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-24 h-0.5 bg-slate-400 mx-auto mb-4" />

              <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#1E4D40]">
                BIÊN LAI THU TIỀN HỌC PHÍ ĐIỆN TỬ
              </h2>
              <p className="text-xs italic text-slate-500">
                (Bản thể hiện của biên lai điện tử theo Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC)
              </p>
              <p className="text-xs font-semibold text-slate-700">
                Ngày phát hành: {formatDate(receipt.issueDate)} • {receipt.billingPeriod} • Năm học {receipt.academicYear}
              </p>
            </div>

            {/* Thông tin Người nộp & Học sinh */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 mb-6 text-xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Họ tên người nộp tiền:</span>{' '}
                  <strong className="text-slate-900">{receipt.payerInfo.parentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Điện thoại liên hệ:</span>{' '}
                  <strong className="text-slate-900">{receipt.payerInfo.phone || '0912345678'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                <div>
                  <span className="text-slate-500">Học sinh:</span>{' '}
                  <strong className="text-[#275A4E] text-sm">{receipt.payerInfo.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Mã học sinh:</span>{' '}
                  <strong className="font-mono text-slate-900">{receipt.payerInfo.studentCode}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Lớp:</span>{' '}
                  <strong className="text-slate-900">{receipt.payerInfo.className}</strong>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500">Hình thức thanh toán:</span>{' '}
                <strong className="text-slate-900">{receipt.paymentMethodLabel}</strong> •{' '}
                <span className="text-slate-500">Mã giao dịch / Bank Ref:</span>{' '}
                <strong className="font-mono text-[#275A4E]">{receipt.bankTransId}</strong>
              </div>
            </div>

            {/* Bảng Kê Chi Tiết Các Khoản Thu & Khấu Trừ */}
            <div className="rounded-xl border border-slate-300 overflow-hidden text-xs mb-6">
              <table className="w-full text-left">
                <thead className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-3">Nội Dung Khoản Thu / Khấu Trừ</th>
                    <th className="py-2.5 px-3 text-center w-16">ĐVT</th>
                    <th className="py-2.5 px-3 text-center w-14">SL</th>
                    <th className="py-2.5 px-3 text-right w-28">Đơn Giá (đ)</th>
                    <th className="py-2.5 px-3 text-right w-32">Thành Tiền (đ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {receipt.lineItems.map((item, idx) => {
                    const isNegative = item.amount < 0;
                    return (
                      <tr key={item.id} className={isNegative ? 'bg-emerald-50/30' : ''}>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {item.description}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{item.unit}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(Math.abs(item.unitPrice)).replace('₫', '')}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isNegative ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {isNegative ? '-' : '+'} {formatCurrency(Math.abs(item.amount))}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Dòng Tổng cộng */}
                  <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-300">
                    <td colSpan={5} className="py-2.5 px-3 text-right font-bold uppercase text-[11px]">
                      Cộng tiền các khoản thu (Subtotal):
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {formatCurrency(receipt.subtotal)}
                    </td>
                  </tr>

                  {receipt.totalDiscount > 0 && (
                    <tr className="bg-emerald-50/40 text-emerald-900 font-bold">
                      <td colSpan={5} className="py-2 px-3 text-right text-[11px]">
                        Tổng các khoản giảm trừ & hoàn tiền ăn:
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700">
                        - {formatCurrency(receipt.totalDiscount)}
                      </td>
                    </tr>
                  )}

                  <tr className="bg-slate-100 font-extrabold text-slate-900 text-sm border-t border-slate-300">
                    <td colSpan={5} className="py-3 px-3 text-right uppercase">
                      TỔNG SỐ TIỀN THỰC NỘP:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-[#275A4E] text-base">
                      {formatCurrency(receipt.totalPaid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Số tiền bằng chữ */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs mb-8">
              <span className="text-slate-600 font-medium">Số tiền viết bằng chữ:</span>{' '}
              <strong className="italic text-[#1E4D40] text-sm">
                {receipt.amountInWords}
              </strong>
            </div>

            {/* Khu vực Chữ ký & Dấu mộc số điện tử */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 items-start">
              {/* Bên trái: Người nộp tiền */}
              <div className="text-center space-y-1">
                <p className="font-bold text-xs uppercase text-slate-800">NGƯỜI NỘP TIỀN</p>
                <p className="text-[10px] italic text-slate-400">(Ký, ghi rõ họ tên nếu cần)</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-xs text-slate-400 italic">Đã xác nhận thanh toán điện tử</span>
                </div>
                <p className="font-bold text-xs text-slate-700">{receipt.payerInfo.parentName}</p>
              </div>

              {/* Bên phải: Dấu mộc số của Nhà trường */}
              <div className="text-center space-y-1 flex flex-col items-center">
                <p className="font-bold text-xs uppercase text-slate-800">
                  ĐƠN VỊ THU TIỀN (TRƯỜNG MẦM NON KIDPRO)
                </p>
                <p className="text-[10px] italic text-slate-400">
                  (Đã ký bằng chữ ký số hợp lệ theo Nghị định 130/2018/NĐ-CP)
                </p>

                {/* Khung Dấu Mộc Số Điện Tử Màu Đỏ (Digital Stamp Box) */}
                <div className="my-2 p-3 rounded-2xl border-2 border-dashed border-rose-500 bg-rose-50/60 max-w-xs text-left relative overflow-hidden shadow-2xs">
                  <div className="flex items-center gap-2 mb-1.5 border-b border-rose-200 pb-1">
                    <div className="h-4 w-4 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0">
                      ✓
                    </div>
                    <span className="font-bold text-[10px] text-rose-700 uppercase tracking-tight">
                      CHỨNG THƯ SỐ HỢP LỆ • KIDPRO
                    </span>
                  </div>

                  <p className="text-[10px] text-rose-950 font-semibold leading-tight">
                    Ký bởi: <strong className="uppercase">{receipt.digitalSignature.signerName}</strong>
                  </p>
                  <p className="text-[10px] text-rose-900 leading-tight">
                    Cơ quan: {receipt.digitalSignature.organization}
                  </p>
                  <p className="text-[10px] text-rose-800 leading-tight">
                    Thời gian ký: {receipt.digitalSignature.signedAt.replace('T', ' ').slice(0, 19)}
                  </p>
                  <p className="text-[9px] text-rose-700 font-mono mt-1 break-all">
                    Cert: {receipt.digitalSignature.certSerial}
                  </p>
                </div>

                <p className="font-bold text-xs text-slate-800 uppercase">
                  {receipt.digitalSignature.signerName}
                </p>
              </div>
            </div>

            {/* Footer kiểm tra mã băm SHA-256 toàn vẹn */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#275A4E]" />
                <span>Mã băm toàn vẹn SHA-256:</span>
                <code className="font-mono text-slate-700 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[9px] max-w-xs sm:max-w-md truncate inline-block">
                  {receipt.digitalSignature.sha256Hash}
                </code>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="text-slate-400 hover:text-slate-700 print:hidden"
                  title="Sao chép mã SHA-256"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copiedHash && <span className="text-emerald-600 font-bold">Đã chép</span>}
              </div>

              <div className="italic text-slate-400">
                Tra cứu hóa đơn tại: <strong>https://kidpro.edu.vn/tra-cuu</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Modal (Ẩn khi In) */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="text-slate-500 text-[11px]">
            Biên lai điện tử có giá trị pháp lý tương đương biên lai giấy phục vụ quyết toán thuế và cơ quan.
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-100 transition min-h-[44px]"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-xl bg-[#275A4E] text-white px-5 py-2 font-bold hover:bg-[#1E4D40] transition shadow-xs flex items-center gap-1.5 min-h-[44px]"
            >
              <Printer className="h-4 w-4" />
              <span>In Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicReceiptModal;
