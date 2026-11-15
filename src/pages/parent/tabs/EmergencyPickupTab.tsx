import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  ShieldAlert,
  QrCode,
  UserCheck,
  Clock,
  Download,
  Share2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Camera,
  Lock,
  KeyRound,
  Trash2,
  Loader2,
  Info,
  Calendar,
  Check,
  Sparkles
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { EmergencyPickupPayload, EmergencyPickupRecord } from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';

interface EmergencyPickupTabProps {
  studentId: string;
  studentName: string;
  className?: string;
  isStudentPresentToday?: boolean; // Trạng thái điểm danh hôm nay
}

export const EmergencyPickupTab: React.FC<EmergencyPickupTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
  isStudentPresentToday = true,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  // Form State
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState('Chú ruột');
  const [phone, setPhone] = useState('');
  const [citizenId, setCitizenId] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [pinCode, setPinCode] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Status & Notifications
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    code?: string;
    text: string;
  } | null>(null);

  const [activePickupRecord, setActivePickupRecord] = useState<EmergencyPickupRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Current Time Checks
  const now = new Date();
  const todayFormatted = formatDate(now.toISOString());
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isPast1730 = currentHour > 17 || (currentHour === 17 && currentMinute > 30);
  const isNearCutoff = currentHour >= 16 && (currentHour === 16 ? currentMinute >= 30 : true);

  // Fetch today's emergency pickups
  const { data: pickupList = [], isLoading } = useQuery<EmergencyPickupRecord[]>({
    queryKey: ['emergency-pickups', studentId],
    queryFn: () => parentApi.getTodayEmergencyPickups(studentId),
  });

  // Query Client Revalidation Mutation
  const createMutation = useMutation({
    mutationFn: (payload: EmergencyPickupPayload) => parentApi.createEmergencyPickup(payload),
    onSuccess: (newRecord: EmergencyPickupRecord) => {
      queryClient.invalidateQueries({ queryKey: ['emergency-pickups'] });
      setActivePickupRecord(newRecord);
      setShowPinModal(false);
      setPinCode('');

      if (isNearCutoff) {
        setToastMessage({
          type: 'warning',
          code: 'MSG-176',
          text: 'Ủy quyền nộp sát giờ. Nhà trường sẽ gọi điện thoại xác nhận trực tiếp với cha mẹ.',
        });
      } else {
        setToastMessage({
          type: 'success',
          code: 'MSG-175',
          text: 'Đã tạo ủy quyền đón hộ thành công. Vui lòng chia sẻ mã QR cho người đón',
        });
      }

      // Reset form fields
      setGuardianName('');
      setPhone('');
      setCitizenId('');
      setPhotoPreview('');
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        code: 'MSG-004',
        text: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // Revoke Mutation
  const revokeMutation = useMutation({
    mutationFn: (id: string) => parentApi.revokeEmergencyPickup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-pickups'] });
      if (activePickupRecord) {
        setActivePickupRecord(null);
      }
      setToastMessage({
        type: 'info',
        text: 'Đã hủy ủy quyền đón khẩn cấp thành công.',
      });
    },
  });

  // Use Pickup Mutation (Teacher / Gate Guard simulation)
  const usePickupMutation = useMutation({
    mutationFn: (id: string) => parentApi.useEmergencyPickup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-pickups'] });
      setToastMessage({
        type: 'success',
        text: 'Xác nhận đón trẻ tại cổng thành công! Đơn ủy quyền đã chuyển sang trạng thái ĐÃ SỬ DỤNG.',
      });
    },
  });

  // Client-side Image Compression (< 5MB)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage({
        type: 'error',
        text: 'Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh khác.',
      });
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const maxWidth = 1000;
        const maxHeight = 1000;
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

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPhotoPreview(compressedDataUrl);
      };
    };
  };

  // Pre-validate before PIN Prompt
  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Check student attendance status
    if (!isStudentPresentToday) {
      setToastMessage({
        type: 'error',
        code: 'MSG-096',
        text: 'Học sinh đã rời trường hôm nay hoặc vắng mặt. Không thể tạo ủy quyền đón hộ.',
      });
      return;
    }

    // 2. Check time cutoff (17:30)
    if (isPast1730) {
      setToastMessage({
        type: 'error',
        text: 'Đã quá 17:30 chiều. Khung giờ trả trẻ tiêu chuẩn đã kết thúc. Vui lòng liên hệ trực tiếp BGH.',
      });
      return;
    }

    // 3. Validate Inputs
    if (!guardianName.trim() || guardianName.trim().length < 2) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ họ và tên người đón hộ (tối thiểu 2 ký tự).',
      });
      return;
    }

    const phoneClean = phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(03|05|07|08|09)[0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      setToastMessage({
        type: 'error',
        text: 'Số điện thoại người đón không hợp lệ. Phải gồm 10 chữ số chuẩn di động Việt Nam.',
      });
      return;
    }

    const citizenClean = citizenId.trim().replace(/\s+/g, '');
    const cccdRegex = /^[0-9]{12}$/;
    if (!cccdRegex.test(citizenClean)) {
      setToastMessage({
        type: 'error',
        text: 'Số Căn cước công dân (CCCD) phải gồm đúng 12 chữ số theo quy định Bộ Công An.',
      });
      return;
    }

    if (!photoPreview) {
      setToastMessage({
        type: 'error',
        text: 'Bắt buộc tải ảnh chân dung rõ mặt của người đón hộ để camera AI đối chiếu danh tính.',
      });
      return;
    }

    // Pass preliminary checks -> Open PIN verification modal
    setShowPinModal(true);
  };

  // Confirm PIN & Send API
  const handleConfirmPinAndCreate = () => {
    // PIN rule: must be exactly 6 digits. Default test PIN accepted: "123456"
    if (!/^\d{6}$/.test(pinCode)) {
      setToastMessage({
        type: 'error',
        code: 'MSG-177',
        text: 'Mã PIN bảo mật không chính xác (phải gồm 6 chữ số). Chưa thể xác nhận ủy quyền đón hộ.',
      });
      return;
    }

    // Simulate PIN check
    if (pinCode !== '123456' && pinCode !== '000000' && pinCode !== '999999') {
      setToastMessage({
        type: 'error',
        code: 'MSG-177',
        text: 'Mã PIN bảo mật không chính xác. Chưa thể xác nhận ủy quyền đón hộ.',
      });
      return;
    }

    const payload: EmergencyPickupPayload = {
      studentId,
      guardianName: guardianName.trim(),
      relationship,
      phone: phone.trim(),
      citizenId: citizenId.trim(),
      photoUrl: photoPreview,
      faceEmbedding: '[512-dim AI Vector JSONB Generated]',
      pinCode,
    };

    createMutation.mutate(payload);
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
        downloadLink.download = `QR_DonHo_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Copy share message
  const handleCopyShare = () => {
    const textToShare = `[KIDPRO] MÃ ĐÓN BÉ ĐỘT XUẤT HÔM NAY (${todayFormatted})\nBé: ${studentName} - Lớp: ${className}\nNgười đón: ${activePickupRecord?.guardianName || guardianName}\nCCCD: ${activePickupRecord?.citizenId || citizenId}\nHiệu lực: Trước 18:00 hôm nay. Vui lòng xuất trình CCCD gốc tại cổng trường.`;
    navigator.clipboard.writeText(textToShare);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const activeRecord = activePickupRecord || pickupList.find((p) => p.status === 'PENDING') || null;

  return (
    <div className="space-y-6">
      {/* 1. Cảnh Báo An Toàn Cấp Cao (Security Notice Banner) */}
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-4 md:p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-700 shrink-0">
            <ShieldAlert className="h-6 w-6 text-[#E5A93C]" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2">
              <span>ỦY QUYỀN ĐÓN HỘ ĐỘT XUẤT TRONG NGÀY</span>
              <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                Hiệu lực 1 ngày duy nhất
              </span>
            </h4>
            <p className="text-xs text-amber-900 leading-relaxed">
              Ủy quyền đón hộ đột xuất chỉ có hiệu lực duy nhất trong ngày hôm nay{' '}
              <strong>{todayFormatted}</strong> trước khung giờ tan trường (<strong>17:30</strong>).
              Người đón hộ <strong>bắt buộc phải mang theo CCCD gốc</strong> để giáo viên và bảo vệ đối soát tại cổng trường.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-amber-800/80 pt-1">
              <Sparkles className="h-3.5 w-3.5 text-[#E5A93C]" />
              <span>
                Hệ thống tự động trích xuất vector khuôn mặt AI (512-dim) bảo đảm quyền riêng tư theo{' '}
                <strong>Nghị định 13/2023/NĐ-CP</strong>.
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
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
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

      {/* Grid: Form bên trái / QR code & Kết quả bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Biểu Mẫu Tạo Đơn Ủy Quyền Khẩn Cấp */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#275A4E]" />
                <span>Biểu Mẫu Ủy Quyền Đón Khẩn Cấp</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Điền thông tin người được nhờ đón con hôm nay
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isStudentPresentToday
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isStudentPresentToday ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                {isStudentPresentToday ? 'Bé đang có mặt tại trường' : 'Bé đã rời trường / Vắng'}
              </span>
            </div>
          </div>

          <form onSubmit={handleStartSubmit} className="space-y-4">
            {/* Học sinh nhận diện */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Bé được ủy quyền đón:
              </label>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{studentName}</p>
                  <p className="text-[11px] text-slate-500">Lớp: {className} • Mã ID: {studentId}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#275A4E] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {todayFormatted}
                </span>
              </div>
            </div>

            {/* Thông tin người đón hộ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ tên người đón hộ <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Hoàng"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mối quan hệ với bé <span className="text-rose-500">*</span>:
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E] focus:outline-hidden bg-white"
                >
                  <option value="Bác ruột">Bác ruột</option>
                  <option value="Chú ruột">Chú ruột</option>
                  <option value="Cô / Dì ruột">Cô / Dì ruột</option>
                  <option value="Ông nội / Ông ngoại">Ông nội / Ông ngoại</option>
                  <option value="Bà nội / Bà ngoại">Bà nội / Bà ngoại</option>
                  <option value="Tài xế riêng">Tài xế riêng</option>
                  <option value="Hàng xóm gia đình">Hàng xóm gia đình</option>
                  <option value="Đồng nghiệp bố/mẹ">Đồng nghiệp bố/mẹ</option>
                  <option value="Khác">Người thân khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10 chữ số (09xxxxxxxx)"
                  maxLength={10}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số CCCD người đón <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={citizenId}
                  onChange={(e) => setCitizenId(e.target.value)}
                  placeholder="12 chữ số trên thẻ CCCD"
                  maxLength={12}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E] focus:outline-hidden"
                  required
                />
              </div>
            </div>

            {/* Tải ảnh chân dung người đón hộ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ảnh chân dung người đón hộ <span className="text-rose-500">*</span>:
              </label>
              <div className="mt-1 rounded-2xl border-2 border-dashed border-slate-200 p-4 hover:border-[#275A4E] transition bg-slate-50/50">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={photoPreview}
                      alt="Chân dung người đón"
                      className="h-20 w-20 rounded-xl object-cover border border-slate-300 shadow-xs"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Ảnh đã sẵn sàng & nén tối ưu (&lt; 5MB)</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Đã sẵn sàng trích xuất vector AI 512 chiều để đối chiếu camera cổng.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#275A4E] hover:underline"
                      >
                        Đổi ảnh khác
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center cursor-pointer py-3 text-center"
                  >
                    <div className="rounded-full bg-slate-100 p-3 mb-2 text-slate-600">
                      <Camera className="h-6 w-6 text-[#275A4E]" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Chụp ảnh hoặc Chọn ảnh chân dung từ máy
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                      Bắt buộc ảnh rõ nét, nhìn thẳng, không đeo kính râm hay khẩu trang để camera AI tại cổng nhận diện.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cảnh báo nộp sát giờ (16:30 - 17:30) */}
            {isNearCutoff && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Cảnh báo:</strong> Thời gian nộp đơn sau 16:30 là sát khung giờ tan trường.
                  Nhà trường sẽ gọi điện thoại xác nhận trực tiếp với cha mẹ trước khi mở cổng cho người đón.
                </span>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !isStudentPresentToday || isPast1730}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-3.5 px-4 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                <span>TẠO ỦY QUYỀN & SINH MÃ QR ĐÓN BÉ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Cột 2: Thẻ Kết Quả & Chia Sẻ Mã QR Động (Dynamic Pickup QR Card) */}
        <div className="lg:col-span-5 space-y-6">
          {activeRecord ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#275A4E] via-[#78C2AD] to-[#E5A93C]" />

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-3">
                <Clock className="h-3.5 w-3.5 text-emerald-600" />
                <span>MÃ QR ĐÓN BÉ HIỆU LỰC HÔM NAY (ĐẾN 18:00)</span>
              </div>

              <h4 className="text-base font-extrabold text-slate-900">
                Ủy Quyền Cho: {activeRecord.guardianName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Mối quan hệ: {activeRecord.relationship} • SĐT: {activeRecord.phone}
              </p>

              {/* Dynamic QR Code display */}
              <div className="my-5 flex flex-col items-center justify-center">
                <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-md inline-block relative">
                  <QRCodeSVG
                    ref={qrRef}
                    value={activeRecord.qrCodeData}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  {/* Digital Stamp Overlay */}
                  <div className="absolute -bottom-2 -right-2 bg-[#275A4E] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md shadow-xs border border-white">
                    KIDPRO VERIFIED
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Dấu mộc điện tử KIDPRO • Mã ủy quyền: <strong>{activeRecord.id}</strong>
                </p>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    activeRecord.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : activeRecord.status === 'USED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeRecord.status === 'PENDING' && 'Chờ người đón xuất trình tại cổng'}
                  {activeRecord.status === 'USED' && 'Đã hoàn tất trao trả trẻ'}
                  {activeRecord.status === 'REVOKED' && 'Ủy quyền đã bị phụ huynh hủy'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-2.5 px-3 text-xs font-bold transition shadow-2xs min-h-[44px]"
                >
                  <Download className="h-4 w-4 text-slate-600" />
                  <span>Tải Ảnh QR</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-2.5 px-3 text-xs font-bold transition shadow-2xs min-h-[44px]"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-300" />
                      <span>Đã Sao Chép!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Chia Sẻ Zalo</span>
                    </>
                  )}
                </button>
              </div>

              {/* Cancel Button */}
              {activeRecord.status === 'PENDING' && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn hủy đơn ủy quyền khẩn cấp này?')) {
                        revokeMutation.mutate(activeRecord.id);
                      }
                    }}
                    disabled={revokeMutation.isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hủy Ủy Quyền Khẩn Cấp Này</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
              <QrCode className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">Chưa có mã QR đón khẩn cấp</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                Sau khi điền biểu mẫu và xác thực mã PIN, mã QR động dùng một lần kèm dấu mộc điện tử sẽ hiển thị tại đây.
              </p>
            </div>
          )}

          {/* Hộp Thông Tin Quy Trình Đối Soát */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 text-xs text-slate-600">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-[#275A4E]" />
              <span>Quy trình trao trả trẻ an toàn tại cổng:</span>
            </h5>
            <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
              <li>Người đón đưa ảnh mã QR cho bảo vệ hoặc giáo viên quét tại kiosk cổng.</li>
              <li>Camera AI tự động đối chiếu khuôn mặt với vector ảnh đã đăng ký.</li>
              <li>Người đón xuất trình CCCD gốc để giáo viên kiểm tra số CCCD khớp với đơn.</li>
              <li>Khi trao bé thành công, phụ huynh nhận thông báo đẩy tức thì trên ứng dụng.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 3. Danh Sách Lịch Sử Ủy Quyền Hôm Nay & Mô Phỏng Thao Tác Cổng */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#275A4E]" />
              <span>Danh Sách Người Được Ủy Quyền Hôm Nay ({pickupList.length})</span>
            </h4>
            <p className="text-[11px] text-slate-500">Tra cứu nhanh trạng thái đối chiếu tại cổng trường</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[#275A4E]" />
            Đang tải danh sách ủy quyền...
          </div>
        ) : pickupList.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Hôm nay chưa có lượt ủy quyền đón hộ nào được tạo cho bé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Người Đón Hộ</th>
                  <th className="py-2.5 px-3">Quan Hệ</th>
                  <th className="py-2.5 px-3">SĐT & CCCD</th>
                  <th className="py-2.5 px-3">Hiệu Lực</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác Cổng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pickupList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={item.photoUrl}
                          alt={item.guardianName}
                          className="h-9 w-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{item.guardianName}</p>
                          <p className="text-[10px] text-slate-400">Mã: {item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{item.relationship}</td>
                    <td className="py-3 px-3">
                      <p>{item.phone}</p>
                      <p className="text-[11px] text-slate-400">CCCD: {item.citizenId}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      Hết hạn {item.qrExpiresAt || '18:00'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : item.status === 'USED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status === 'PENDING' && 'Chờ đón'}
                        {item.status === 'USED' && 'Đã đón'}
                        {item.status === 'REVOKED' && 'Đã hủy'}
                        {item.status === 'EXPIRED' && 'Hết hạn'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.status === 'PENDING' ? (
                        <button
                          onClick={() => usePickupMutation.mutate(item.id)}
                          disabled={usePickupMutation.isPending}
                          title="Mô phỏng thao tác giáo viên/bảo vệ cổng xác nhận trao trả trẻ"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-semibold shadow-2xs transition"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Xác nhận trả trẻ</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Hoàn tất</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Modal Nhập Mã PIN 2 Lớp Bảo Mật */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="rounded-full bg-amber-100 p-3 w-12 h-12 mx-auto text-amber-700 flex items-center justify-center">
              <Lock className="h-6 w-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-900">Xác Thực Bảo Mật 2 Lớp</h4>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng nhập mã PIN tài khoản phụ huynh để xác nhận cấp quyền đón bé đột xuất
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Nhập 6 số PIN (VD: 123456)"
                className="w-full text-center tracking-widest text-lg font-bold rounded-xl border border-slate-300 py-3 px-4 focus:border-[#275A4E] focus:outline-hidden"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">
                Gợi ý thử nghiệm: Nhập mã PIN mặc định <strong>123456</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinCode('');
                }}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmPinAndCreate}
                disabled={createMutation.isPending || pinCode.length !== 6}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white py-2.5 text-xs font-bold transition disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>Xác Nhận PIN</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyPickupTab;
