import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  ShieldCheck,
  Eye,
  X,
  Loader2,
  Calendar,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import {
  MedicationCategory,
  ParentMedicationItem,
  SubmitMedicationPayload
} from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';

interface MedicationRequestTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const MedicationRequestTab: React.FC<MedicationRequestTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [medicationName, setMedicationName] = useState('');
  const [category, setCategory] = useState<MedicationCategory>('REGULAR');
  const [dosage, setDosage] = useState('');
  const [timingOption, setTimingOption] = useState<'11:30' | '14:00' | '15:30' | 'CUSTOM'>('14:00');
  const [customTime, setCustomTime] = useState('14:00');
  const [storageInstructions, setStorageInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptionPreview, setPrescriptionPreview] = useState<string>('');
  const [courseDays, setCourseDays] = useState<number>(3);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);

  // Lightbox State
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    code?: string;
    text: string;
  } | null>(null);

  // 1. Fetch Medications of student (GET /api/health/medications/student/{studentId})
  const { data: medicationList = [], isLoading } = useQuery<ParentMedicationItem[]>({
    queryKey: ['medications', studentId],
    queryFn: () => parentApi.getStudentMedications(studentId),
  });

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (payload: SubmitMedicationPayload) => parentApi.submitMedicationRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      setToastMessage({
        type: 'success',
        code: 'MSG-181',
        text: 'Đã gửi đơn dặn thuốc thành công. Vui lòng bàn giao gói thuốc dán nhãn tên bé cho cô giáo vào buổi sáng',
      });

      // Reset form
      setMedicationName('');
      setDosage('');
      setStorageInstructions('');
      setNotes('');
      setPrescriptionPreview('');
      setAgreedConsent(false);
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        code: 'MSG-004',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // Client-side image compress (< 5MB)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng đính kèm tệp hình ảnh đơn thuốc hợp lệ (JPG, PNG).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({
        type: 'error',
        text: 'Dung lượng ảnh vượt quá 5MB. Vui lòng nén bớt trước khi tải.',
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setPrescriptionPreview(compressed);
      };
    };
  };

  // Form Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: Tên thuốc
    if (!medicationName.trim() || medicationName.trim().length < 2) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ tên thuốc hoặc sản phẩm y tế cần cho bé dùng.',
      });
      return;
    }

    // 2. Validation: Liều lượng
    if (!dosage.trim()) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng nhập liều lượng cụ thể (VD: 5ml, 1 gói, 1 viên).',
      });
      return;
    }

    // 3. Validation: Khung giờ hoạt động tại trường (07:30 - 17:00)
    const selectedTime = timingOption === 'CUSTOM' ? customTime : timingOption;
    const [h, m] = selectedTime.split(':').map(Number);
    const timeMinutes = h * 60 + m;
    const startMinutes = 7 * 60 + 30; // 07:30
    const endMinutes = 17 * 60; // 17:00

    if (timeMinutes < startMinutes || timeMinutes > endMinutes) {
      setToastMessage({
        type: 'error',
        code: 'MSG-183',
        text: 'Nhà trường chỉ hỗ trợ cho trẻ uống thuốc trong khung giờ sinh hoạt tại trường (07:30 - 17:00).',
      });
      return;
    }

    // 4. Validation: Thuốc kháng sinh / kê đơn bắt buộc có ảnh đơn thuốc
    if (category === 'PRESCRIPTION_ANTIBIOTIC' && !prescriptionPreview) {
      setToastMessage({
        type: 'error',
        code: 'MSG-182',
        text: 'Ảnh chụp đơn thuốc của bác sĩ là bắt buộc đối với thuốc kê đơn theo quy định y tế học đường.',
      });
      return;
    }

    // 5. Validation: Cam kết y tế
    if (!agreedConsent) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng tích chọn cam kết điện tử chịu trách nhiệm y tế trước khi gửi đơn.',
      });
      return;
    }

    const payload: SubmitMedicationPayload = {
      studentId,
      medicationName: medicationName.trim(),
      category,
      dosage: dosage.trim(),
      administrationTime: selectedTime,
      storageInstructions: storageInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
      prescriptionPhotoUrl: prescriptionPreview || undefined,
      courseDays: isMultiDay ? courseDays : 1,
      agreedElectronicConsent: true,
    };

    submitMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quy Định Y Tế Học Đường (Medical Policy Disclaimer) */}
      <div className="rounded-2xl border border-blue-200 bg-linear-to-r from-blue-50 via-indigo-50/40 to-white p-4 md:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-blue-600/10 p-2.5 text-blue-700 shrink-0">
            <HeartPulse className="h-6 w-6 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
              <span>QUY ĐỊNH Y TẾ HỌC ĐƯỜNG & AN TOÀN DÙNG THUỐC</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                07:30 - 17:00
              </span>
            </h4>
            <p className="text-xs text-blue-900 leading-relaxed">
              Nhà trường chỉ tiếp nhận cho trẻ uống thuốc trong khung giờ sinh hoạt (<strong>07:30 - 17:00</strong>).
              Thuốc kháng sinh và thuốc kê đơn <strong>bắt buộc phải có ảnh chụp đơn thuốc có chữ ký bác sĩ</strong>.
              Phụ huynh vui lòng <strong>dán nhãn tên bé và liều dùng lên bao bì thuốc</strong> rồi bàn giao trực tiếp cho cô giáo vào buổi sáng.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-800/80 pt-1 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>
                Giáo viên sẽ cho uống thuốc đúng giờ, chụp ảnh minh chứng lúc <strong>14:00</strong> và cập nhật ngay lên ứng dụng.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`rounded-xl p-4 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
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

      {/* Grid: Form bên trái / Danh sách thuốc bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Biểu Mẫu Dặn Thuốc Điện Tử */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-[#275A4E]" />
                <span>Biểu Mẫu Dặn Thuốc Điện Tử</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gửi hướng dẫn uống thuốc chi tiết cho cô giáo
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Học sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bé dùng thuốc:</label>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{studentName}</p>
                  <p className="text-[11px] text-slate-500">Lớp: {className} • ID: {studentId}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#275A4E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Học sinh
                </span>
              </div>
            </div>

            {/* Phân loại thuốc */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phân loại thuốc <span className="text-rose-500">*</span>:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('REGULAR')}
                  className={`rounded-xl p-2.5 text-xs font-bold border transition text-left ${
                    category === 'REGULAR'
                      ? 'border-[#275A4E] bg-emerald-50/50 text-[#275A4E]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold">Thuốc Thông Thường</p>
                  <p className="text-[10px] font-normal text-slate-500">Siro, men vi sinh, xịt mũi...</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('PRESCRIPTION_ANTIBIOTIC')}
                  className={`rounded-xl p-2.5 text-xs font-bold border transition text-left ${
                    category === 'PRESCRIPTION_ANTIBIOTIC'
                      ? 'border-rose-500 bg-rose-50/60 text-rose-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-rose-700">Kháng Sinh / Kê Đơn</p>
                  <p className="text-[10px] font-normal text-slate-500">Bắt buộc có ảnh đơn thuốc</p>
                </button>
              </div>
            </div>

            {/* Tên thuốc */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên thuốc & Nồng độ <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                placeholder="VD: Siro ho Prospan 100ml / Kháng sinh Augmentin 250mg"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
                required
              />
            </div>

            {/* Liều lượng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Liều lượng sử dụng mỗi lần <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="VD: 5ml / 1 gói pha 30ml nước ấm / 1 viên"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
                required
              />
            </div>

            {/* Khung giờ uống tại trường */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khung giờ uống tại lớp (07:30 - 17:00) <span className="text-rose-500">*</span>:
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { id: '11:30', label: 'Bữa trưa', time: '~11:30' },
                  { id: '14:00', label: 'Sau ngủ trưa', time: '~14:00' },
                  { id: '15:30', label: 'Bữa xế', time: '~15:30' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTimingOption(item.id as any)}
                    className={`rounded-xl py-2 px-2 text-center text-xs font-bold border transition ${
                      timingOption === item.id
                        ? 'border-[#275A4E] bg-emerald-50 text-[#275A4E]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p>{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{item.time}</p>
                  </button>
                ))}
              </div>

              {/* Tùy chọn giờ tùy chỉnh */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="radio"
                  id="custom-timing"
                  name="timing"
                  checked={timingOption === 'CUSTOM'}
                  onChange={() => setTimingOption('CUSTOM')}
                  className="text-[#275A4E] focus:ring-[#275A4E]"
                />
                <label htmlFor="custom-timing" className="text-xs text-slate-700 font-semibold">
                  Giờ khác:
                </label>
                <input
                  type="time"
                  value={customTime}
                  disabled={timingOption !== 'CUSTOM'}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 disabled:opacity-40"
                />
                <span className="text-[11px] text-slate-400">(07:30 - 17:00)</span>
              </div>
            </div>

            {/* Lưu ý bảo quản */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lưu ý bảo quản & Hướng dẫn đặc biệt:
              </label>
              <textarea
                rows={2}
                value={storageInstructions}
                onChange={(e) => setStorageInstructions(e.target.value)}
                placeholder="VD: Để ngăn mát tủ lạnh của lớp / Uống sau khi ăn 15 phút"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            {/* Dặn dò cô giáo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dặn dò thêm cô giáo:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Bé hơi khó uống, nhờ cô dỗ nhẹ và cho bé uống chút nước ấm sau đó"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            {/* Tải lên ảnh đơn thuốc / bao bì */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Ảnh đơn thuốc bác sĩ & bao bì thuốc:
                </label>
                {category === 'PRESCRIPTION_ANTIBIOTIC' && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                    Bắt buộc
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {prescriptionPreview ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <img
                    src={prescriptionPreview}
                    alt="Toa thuốc"
                    onClick={() =>
                      setLightboxImg({
                        url: prescriptionPreview,
                        title: 'Ảnh đơn thuốc bác sĩ tải lên',
                      })
                    }
                    className="h-14 w-14 rounded-lg object-cover border border-slate-300 cursor-pointer shadow-2xs"
                  />
                  <div className="flex-1 space-y-0.5 text-xs">
                    <p className="font-bold text-emerald-900">Toa thuốc đã sẵn sàng</p>
                    <p className="text-[11px] text-slate-500">Đã nén tối ưu &lt; 5MB</p>
                    <button
                      type="button"
                      onClick={() => setPrescriptionPreview('')}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-dashed border-slate-300 p-3.5 text-center cursor-pointer hover:border-[#275A4E] transition bg-slate-50/50"
                >
                  <Camera className="h-5 w-5 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    Chụp ảnh hoặc tải lên đơn thuốc của bác sĩ
                  </p>
                  <p className="text-[10px] text-slate-400">Định dạng JPG, PNG dung lượng dưới 5MB</p>
                </div>
              )}
            </div>

            {/* Tùy chọn lặp lại liệu trình nhiều ngày */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMultiDay}
                  onChange={(e) => setIsMultiDay(e.target.checked)}
                  className="rounded text-[#275A4E] focus:ring-[#275A4E] h-4 w-4"
                />
                <span>Áp dụng liệu trình liên tục trong nhiều ngày</span>
              </label>

              {isMultiDay && (
                <div className="flex items-center gap-2 pt-1 pl-6">
                  <span className="text-xs text-slate-600">Số ngày cho uống liên tục:</span>
                  <select
                    value={courseDays}
                    onChange={(e) => setCourseDays(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 bg-white"
                  >
                    <option value={2}>2 ngày</option>
                    <option value={3}>3 ngày</option>
                    <option value={4}>4 ngày</option>
                    <option value={5}>5 ngày (Kháng sinh chuẩn)</option>
                    <option value={7}>7 ngày</option>
                  </select>
                </div>
              )}
            </div>

            {/* Cam kết trách nhiệm y tế điện tử */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer leading-relaxed">
                <input
                  type="checkbox"
                  checked={agreedConsent}
                  onChange={(e) => setAgreedConsent(e.target.checked)}
                  className="mt-0.5 rounded text-[#275A4E] focus:ring-[#275A4E] h-4 w-4 shrink-0"
                />
                <span>
                  <strong>Cam kết điện tử:</strong> Tôi xác nhận thông tin đơn thuốc là chính xác theo chỉ định của bác sĩ và đồng ý ủy quyền cho giáo viên hỗ trợ cho bé uống thuốc tại lớp.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitMutation.isPending || !agreedConsent}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3.5 px-4 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 min-h-[44px]"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                <span>GỬI ĐƠN DẶN THUỐC ĐIỆN TỬ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Cột 2: Danh Sách Đơn Dặn Thuốc Đang Áp Dụng */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#275A4E]" />
                <span>Đơn Thuốc Của Bé ({medicationList.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi cô giáo nhận thuốc và minh chứng uống thuốc lúc 14:00
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#275A4E]" />
              Đang tải danh sách đơn thuốc...
            </div>
          ) : medicationList.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Pill className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              Bé hiện chưa có đơn thuốc nào cần uống tại lớp hôm nay.
            </div>
          ) : (
            <div className="space-y-3.5">
              {medicationList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 p-4 hover:shadow-xs transition bg-white space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {item.medicationName}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'PRESCRIPTION_ANTIBIOTIC'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.category === 'PRESCRIPTION_ANTIBIOTIC'
                            ? 'Kháng Sinh / Kê Đơn'
                            : 'Thông Thường'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Liều dùng: <strong className="text-slate-900">{item.dosage}</strong> • Khung giờ: <strong>{item.administrationTime}</strong>
                        {item.courseDays && item.courseDays > 1 && ` • Liệu trình: ${item.courseDays} ngày`}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        item.status === 'ADMINISTERED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.status === 'RECEIVED_WAITING'
                          ? 'bg-blue-100 text-blue-800'
                          : item.status === 'MISSED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'ADMINISTERED' && '✓ Đã uống xong'}
                      {item.status === 'RECEIVED_WAITING' && 'Đã nhận thuốc • Chờ giờ uống'}
                      {item.status === 'PENDING_RECEIPT' && 'Chờ cô nhận thuốc sáng nay'}
                      {item.status === 'MISSED' && 'Quá giờ'}
                    </span>
                  </div>

                  {/* Lưu ý & Dặn dò */}
                  {(item.storageInstructions || item.notes) && (
                    <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 space-y-1 border border-slate-100">
                      {item.storageInstructions && (
                        <p>
                          <span className="font-bold text-slate-700">Bảo quản:</span> {item.storageInstructions}
                        </p>
                      )}
                      {item.notes && (
                        <p>
                          <span className="font-bold text-slate-700">Dặn dò:</span> {item.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Minh chứng đã uống thuốc lúc 14:00 */}
                  {item.status === 'ADMINISTERED' && item.proofPhotoUrl && (
                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 text-xs">
                        <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Đã cho uống lúc: {item.administeredAt ? formatDate(item.administeredAt) : '14:05'}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Người thực hiện: {item.witnessTeacherName || 'Cô giáo phụ trách'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: item.proofPhotoUrl || '',
                            title: `Ảnh minh chứng uống thuốc lúc 14:00 - ${item.medicationName}`,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem ảnh minh chứng 14:00</span>
                      </button>
                    </div>
                  )}

                  {/* Xem ảnh đơn thuốc bác sĩ đính kèm */}
                  {item.prescriptionPhotoUrl && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setLightboxImg({
                            url: item.prescriptionPhotoUrl || '',
                            title: `Ảnh toa thuốc bác sĩ - ${item.medicationName}`,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#275A4E] hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem ảnh đơn thuốc bác sĩ</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal phóng to ảnh */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <p className="text-center text-xs font-bold text-slate-700 py-2">
              {lightboxImg.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationRequestTab;
