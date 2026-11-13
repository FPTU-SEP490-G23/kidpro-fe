import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Send,
  Loader2,
  X,
  FileQuestion,
  Upload,
  CheckCircle2,
  Trash2,
  Info
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { TuitionInvoiceItem, DisputeCategoryType } from '../../../types/parent.types';

// System Messages
const MSG_248 = 'Hóa đơn này đã được thanh toán hoàn tất. Vui lòng liên hệ trực tiếp phòng Kế toán để làm thủ tục hoàn trả hoặc đối trừ kỳ sau.';
const MSG_014 = 'Tệp ảnh minh chứng phải có định dạng JPG/PNG và dung lượng dưới 5MB.';
const MSG_004 = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';

interface InvoiceDisputeModalProps {
  invoice: TuitionInvoiceItem;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceDisputeModal: React.FC<InvoiceDisputeModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [category, setCategory] = useState<DisputeCategoryType>('MEAL_REFUND');
  const [disputedAmount, setDisputedAmount] = useState<string>('105000');
  const [reason, setReason] = useState(
    'Bé nghỉ 3 ngày có phép từ ngày 10/10 đến 12/10 cô giáo đã duyệt đơn trước 08:30 nhưng bảng kê tháng này chưa thấy trừ 105.000đ tiền ăn'
  );
  const [parentContact, setParentContact] = useState('0912345678');
  const [proofPhotoUrl, setProofPhotoUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1584697964190-705b893e150a?w=500'
  );
  const [proofFileName, setProofFileName] = useState<string>('don_xin_nghi_da_duyet.png');
  const [errorText, setErrorText] = useState('');

  // Mutation
  const disputeMutation = useMutation({
    mutationFn: (payload: any) => parentApi.submitInvoiceDispute(payload),
    onSuccess: () => {
      // Optimistically update invoice state
      invoice.status = 'DISPUTED';
      invoice.disputeCategory = category;
      invoice.disputedAmount = Number(disputedAmount) || 0;
      invoice.disputeNotes = reason;
      invoice.proofPhotoUrl = proofPhotoUrl || undefined;

      queryClient.invalidateQueries({ queryKey: ['tuition-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess();
    },
    onError: () => {
      setErrorText(MSG_004);
    },
  });

  if (!isOpen) return null;

  // File Upload Handler (JPG/PNG < 5MB)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check format
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setErrorText(MSG_014);
      return;
    }

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorText(MSG_014);
      return;
    }

    setErrorText('');
    setProofFileName(file.name);

    // Read as Base64 for instant preview
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setProofPhotoUrl(uploadEvent.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProofPhotoUrl(null);
    setProofFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Business Rule: Không cho phép khiếu nại hóa đơn đã thanh toán hoàn tất
    if (invoice.status === 'PAID') {
      setErrorText(MSG_248);
      return;
    }

    // 2. Reason min 10 characters
    if (reason.trim().length < 10) {
      setErrorText('Lý do khiếu nại chi tiết bắt buộc tối thiểu 10 ký tự để kế toán có đủ dữ liệu tra soát.');
      return;
    }

    // 3. Parent contact
    if (!parentContact.trim()) {
      setErrorText('Vui lòng nhập số điện thoại hoặc email phụ huynh để tiếp nhận kết quả tra soát.');
      return;
    }

    setErrorText('');

    disputeMutation.mutate({
      invoiceId: invoice.id,
      referenceCode: invoice.referenceCode,
      studentId: invoice.studentId,
      category,
      disputedAmount: Number(disputedAmount) || 0,
      reason: reason.trim(),
      proofPhotoUrl: proofPhotoUrl || undefined,
      parentContact: parentContact.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl relative space-y-4 my-8 border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-amber-50 p-2.5 text-amber-700">
              <FileQuestion className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                Gửi Phiếu Yêu Cầu Tra Soát & Khiếu Nại Học Phí
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Mã hóa đơn: <strong className="text-slate-800">{invoice.invoiceNumber}</strong> ({invoice.billingPeriod})
              </p>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {errorText && (
          <div className="rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-800 border border-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* 1. Khoản thu nghi vấn */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              1. Khoản Thu Nghi Vấn Sai Lệch:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                  category === 'MEAL_REFUND'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40] font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="dispute_cat"
                  checked={category === 'MEAL_REFUND'}
                  onChange={() => setCategory('MEAL_REFUND')}
                  className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <div>
                  <span className="text-xs font-extrabold block">Tiền ăn hoàn trả</span>
                  <span className="text-[11px] text-slate-500">Bé nghỉ có phép chưa trừ tiền ăn</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                  category === 'LATE_PICKUP'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40] font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="dispute_cat"
                  checked={category === 'LATE_PICKUP'}
                  onChange={() => setCategory('LATE_PICKUP')}
                  className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <div>
                  <span className="text-xs font-extrabold block">Phụ phí đón muộn</span>
                  <span className="text-[11px] text-slate-500">Tính sai số phút đón ngoài giờ</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                  category === 'BASE_TUITION'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40] font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="dispute_cat"
                  checked={category === 'BASE_TUITION'}
                  onChange={() => setCategory('BASE_TUITION')}
                  className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <div>
                  <span className="text-xs font-extrabold block">Học phí cơ bản</span>
                  <span className="text-[11px] text-slate-500">Tiền cơ sở vật chất / Bán trú</span>
                </div>
              </label>

              <label
                className={`p-3 rounded-2xl border flex items-start gap-2.5 cursor-pointer transition ${
                  category === 'OTHER'
                    ? 'border-[#275A4E] bg-emerald-50/50 text-[#1E4D40] font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="dispute_cat"
                  checked={category === 'OTHER'}
                  onChange={() => setCategory('OTHER')}
                  className="mt-0.5 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <div>
                  <span className="text-xs font-extrabold block">Khoản thu khác</span>
                  <span className="text-[11px] text-slate-500">Phí ngoại khóa, đồng phục...</span>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Số tiền chênh lệch dự kiến */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              2. Số Tiền Chênh Lệch Ước Tính (VNĐ):
            </label>
            <input
              type="number"
              value={disputedAmount}
              onChange={(e) => setDisputedAmount(e.target.value)}
              placeholder="Ví dụ: 105000"
              className="w-full rounded-2xl border border-slate-200 p-3 font-mono font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
            />
          </div>

          {/* 3. Lý do khiếu nại chi tiết */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              3. Lý Do Khiếu Nại Chi Tiết (Tối thiểu 10 ký tự):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả cụ thể ngày giờ, số tiền và bằng chứng..."
              className="w-full rounded-2xl border border-slate-200 p-3 text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
            />
          </div>

          {/* 4. Tải lên hình ảnh bằng chứng (Evidence Dropzone) */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              4. Bằng Chứng Đính Kèm (Ảnh đơn duyệt, tin nhắn giáo viên, giấy khám):
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />

            {!proofPhotoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-[#275A4E] rounded-2xl p-4 text-center cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <Upload className="h-6 w-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">
                  Bấm để tải ảnh lên (JPG / PNG &lt; 5MB)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chụp màn hình đơn nghỉ học, tin nhắn xác nhận hoặc giấy bác sĩ
                </p>
              </div>
            ) : (
              <div className="relative border border-slate-200 rounded-2xl p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={proofPhotoUrl}
                    alt="Bằng chứng"
                    className="h-12 w-12 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {proofFileName || 'Ảnh bằng chứng đã tải'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Định dạng hợp lệ &lt; 5MB</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* 5. Số điện thoại liên hệ */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              5. Số Điện Thoại Phụ Huynh Để Nhận Phản Hồi:
            </label>
            <input
              type="tel"
              value={parentContact}
              onChange={(e) => setParentContact(e.target.value)}
              placeholder="0912345678"
              className="w-full rounded-2xl border border-slate-200 p-3 font-mono text-slate-900 focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
            />
          </div>

          {/* Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Sau khi gửi khiếu nại, hóa đơn sẽ tự động chuyển sang trạng thái <strong>DISPUTED</strong>. Nhà trường sẽ tạm dừng quy trình nhắc nợ tự động trong suốt thời gian tra soát.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition min-h-[44px]"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={disputeMutation.isPending}
              className="rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] px-6 py-2.5 font-extrabold text-white shadow-md transition flex items-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {disputeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang Gửi Phiếu...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Gửi Phiếu Khiếu Nại</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceDisputeModal;
