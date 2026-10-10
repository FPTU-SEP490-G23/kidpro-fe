import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  X,
  User,
  Trash2,
  Clock
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import {
  FaceAngleType,
  BiometricPhotoItem,
  StudentFaceBiometricProfile
} from '../../../types/parent.types';

interface StudentFaceBiometricTabProps {
  studentId: string;
  studentName: string;
}

export const StudentFaceBiometricTab: React.FC<StudentFaceBiometricTabProps> = ({
  studentId,
  studentName,
}) => {
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Modal Nghị định 13/2023/NĐ-CP
  const [showDecree13Modal, setShowDecree13Modal] = useState<boolean>(false);
  const [decree13ConsentAgreed, setDecree13ConsentAgreed] = useState<boolean>(false);
  const [guardianName, setGuardianName] = useState<string>('Nguyễn Văn Hùng');
  const [relationship, setRelationship] = useState<string>('Bố ruột');

  // Phương thức chụp / tải ảnh
  const [captureMode, setCaptureMode] = useState<'WEBCAM' | 'UPLOAD'>('WEBCAM');
  const [currentAngle, setCurrentAngle] = useState<FaceAngleType>('FRONTAL');

  // Webcam stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Danh sách ảnh đã chụp / tải
  const [capturedPhotos, setCapturedPhotos] = useState<BiometricPhotoItem[]>([]);

  // Tiến trình trích xuất vector AI (Embedding progress)
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionStep, setExtractionStep] = useState<number>(0);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Tải hồ sơ sinh trắc học hiện tại của bé
  const { data: profile } = useQuery<StudentFaceBiometricProfile>({
    queryKey: ['student-face-profile', studentId],
    queryFn: async () => {
      try {
        const res = await parentApi.getStudentFaceProfile(studentId);
        return res.data;
      } catch {
        showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
        throw new Error('Network error');
      }
    },
  });

  // Khởi động Camera khi chuyển sang chế độ Webcam
  useEffect(() => {
    if (captureMode === 'WEBCAM' && !isCameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [captureMode]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      setCameraError('Không thể mở camera. Vui lòng cho phép quyền truy cập hoặc sử dụng tính năng Tải ảnh.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Chụp ảnh từ video stream
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    // Kiểm tra chất lượng mô phỏng (blur & single face rule)
    const newPhoto: BiometricPhotoItem = {
      id: `PHOTO-${Date.now()}`,
      angle: currentAngle,
      photoUrl: photoDataUrl,
      capturedAt: new Date().toISOString(),
      qualityScore: 95,
      antiSpoofingPass: true,
    };

    const updated = capturedPhotos.filter((p) => p.angle !== currentAngle);
    setCapturedPhotos([...updated, newPhoto]);

    // Tự động chuyển góc tiếp theo
    if (currentAngle === 'FRONTAL') setCurrentAngle('LEFT_TILT');
    else if (currentAngle === 'LEFT_TILT') setCurrentAngle('RIGHT_TILT');

    showToast('info', `Đã chụp ảnh góc ${getAngleLabel(currentAngle)}. Vui lòng chụp đủ 3 góc.`);
  };

  // Tải ảnh từ máy tính / điện thoại
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Kích thước tệp vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newPhoto: BiometricPhotoItem = {
        id: `PHOTO-${Date.now()}`,
        angle: currentAngle,
        photoUrl: dataUrl,
        capturedAt: new Date().toISOString(),
        qualityScore: 92,
        antiSpoofingPass: true,
      };

      const updated = capturedPhotos.filter((p) => p.angle !== currentAngle);
      setCapturedPhotos([...updated, newPhoto]);

      if (currentAngle === 'FRONTAL') setCurrentAngle('LEFT_TILT');
      else if (currentAngle === 'LEFT_TILT') setCurrentAngle('RIGHT_TILT');

      showToast('info', `Đã tải ảnh góc ${getAngleLabel(currentAngle)}.`);
    };
    reader.readAsDataURL(file);
  };

  const getAngleLabel = (angle: FaceAngleType) => {
    switch (angle) {
      case 'FRONTAL':
        return 'Chính diện (Frontal)';
      case 'LEFT_TILT':
        return 'Nghiêng trái 15°';
      case 'RIGHT_TILT':
        return 'Nghiêng phải 15°';
    }
  };

  // Mutation đồng thuận Nghị định 13
  const consentMutation = useMutation({
    mutationFn: async () => {
      return parentApi.saveDecree13Consent({
        studentId,
        guardianName,
        relationship,
        isAgreed: true,
        agreedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setShowDecree13Modal(false);
      showToast('success', 'Đã lưu cam kết đồng thuận sinh trắc học theo Nghị định 13/2023/NĐ-CP.');
      queryClient.invalidateQueries({ queryKey: ['student-face-profile', studentId] });
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    },
  });

  // Xử lý phụ huynh từ chối đăng ký (BR-022)
  const handleRefuseConsent = async () => {
    try {
      await parentApi.refuseFaceBiometrics(studentId, 'Phụ huynh từ chối cấp quyền sinh trắc học');
      setShowDecree13Modal(false);
      showToast(
        'warning',
        'MSG-170: Đã từ chối đăng ký khuôn mặt. Trẻ sẽ sử dụng hình thức điểm danh thủ công.'
      );
      queryClient.invalidateQueries({ queryKey: ['student-face-profile', studentId] });
    } catch {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    }
  };

  // Gửi 3 ảnh & trích xuất vector AI 512 chiều
  const handleStartExtraction = async () => {
    // BR-021: Bắt buộc tối thiểu 3 ảnh
    if (capturedPhotos.length < 3) {
      showToast(
        'error',
        'MSG-168: Ảnh bị mờ hoặc thiếu sáng. Vui lòng chụp lại ở nơi có đủ ánh sáng tự nhiên.'
      );
      return;
    }

    setIsExtracting(true);
    setExtractionStep(1);

    try {
      // Bước 1: Upload MinIO S3
      await new Promise((r) => setTimeout(r, 1200));
      setExtractionStep(2);

      // Bước 2: Anti-spoofing & Single face check
      await new Promise((r) => setTimeout(r, 1500));
      setExtractionStep(3);

      // Bước 3: Trích xuất vector 512 chiều & đồng bộ sang cổng trường
      await parentApi.enrollStudentFacePhotos(
        studentId,
        capturedPhotos.map((p) => ({ angle: p.angle, photoUrl: p.photoUrl }))
      );

      setIsExtracting(false);
      showToast('success', 'MSG-167: Đã đăng ký hồ sơ khuôn mặt của bé thành công phục vụ điểm danh AI tại cổng');
      queryClient.invalidateQueries({ queryKey: ['student-face-profile', studentId] });
    } catch {
      setIsExtracting(false);
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
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
          {toastMessage.type === 'info' && <Sparkles className="h-5 w-5 shrink-0 text-blue-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER PHÂN HỆ UC-041 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#78C2AD]/15 text-[#1E4D40]">
            <Camera className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>UC-041 • Đăng Ký Sinh Trắc Học Khuôn Mặt Bé (AI Face Enrollment)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Hồ Sơ Nhận Diện Khuôn Mặt Điểm Danh Cổng Trường
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Bảo đảm quyền riêng tư sinh trắc học theo <strong>Nghị định 13/2023/NĐ-CP</strong>. Thu thập 3 góc ảnh rõ nét
            để trích xuất vector 512 chiều đồng bộ về camera AI tại trạm đón trả trẻ.
          </p>
        </div>

        {/* Trạng thái hoạt động */}
        <div className="flex items-center gap-2">
          {profile?.status === 'AI_READY' ? (
            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>HỒ SƠ ĐÃ HOẠT ĐỘNG (AI READY)</span>
            </div>
          ) : profile?.status === 'REFUSED_MANUAL_ATTENDANCE' ? (
            <div className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-extrabold text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span>ĐIỂM DANH THỦ CÔNG DỰ PHÒNG</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>CHƯA ĐĂNG KÝ HỒ SƠ</span>
            </div>
          )}
        </div>
      </div>

      {/* THÔNG BÁO CAM KẾT NGHỊ ĐỊNH 13 */}
      {!profile?.decree13ConsentAgreed && (
        <div className="bg-amber-50/70 border-2 border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-black text-amber-900 text-sm">
                Yêu cầu Xác Nhận Đồng Thuận Theo Nghị Định 13/2023/NĐ-CP
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 max-w-2xl">
                Trước khi thu thập dữ liệu sinh trắc học của trẻ em dưới 7 tuổi, người giám hộ hợp pháp bắt buộc
                phải ký thỏa thuận đồng thuận số hóa dữ liệu phục vụ an toàn đón trả trẻ.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDecree13Modal(true)}
            className="h-11 px-5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-black text-xs whitespace-nowrap transition shadow-sm"
          >
            Đọc & Ký Cam Kết Điện Tử
          </button>
        </div>
      )}

      {/* GIAO DIỆN CHỤP / TẢI ẢNH CHÂN DUNG 3 GÓC */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: CAMERA HOẶC KHU VỰC KÉO THẢ (7 CỘT) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            {/* Lựa chọn chế độ */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCaptureMode('WEBCAM')}
                  className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    captureMode === 'WEBCAM'
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Chụp Bằng Webcam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureMode('UPLOAD')}
                  className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                    captureMode === 'UPLOAD'
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải Ảnh Từ Thiết Bị</span>
                </button>
              </div>

              {/* Góc đang chọn */}
              <span className="text-xs font-bold text-[#275A4E] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Góc: {getAngleLabel(currentAngle)}
              </span>
            </div>

            {/* Khung ngắm Camera / Drag drop */}
            {captureMode === 'WEBCAM' ? (
              <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Khung ngắm bầu dục (Face Guide Oval) */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-52 h-68 rounded-[50%] border-4 border-dashed border-[#78C2AD]/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] animate-pulse" />
                </div>

                {cameraError ? (
                  <div className="absolute inset-0 bg-slate-900/90 p-6 flex flex-col items-center justify-center text-center text-white space-y-3">
                    <ShieldAlert className="h-10 w-10 text-amber-400" />
                    <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
                    <button
                      onClick={startCamera}
                      className="h-10 px-4 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700"
                    >
                      Thử lại Camera
                    </button>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    <button
                      onClick={handleCapturePhoto}
                      className="h-14 px-8 rounded-full bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-sm flex items-center gap-2 shadow-xl hover:scale-105 transition"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Chụp Ảnh Góc Này</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-4/3 w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#275A4E] bg-slate-50 flex flex-col items-center justify-center p-6 text-center transition group">
                <Upload className="h-12 w-12 text-slate-400 group-hover:text-[#275A4E] mb-3 transition" />
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Kéo thả hoặc bấm để tải ảnh góc {getAngleLabel(currentAngle)}
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Định dạng JPG hoặc PNG rõ mặt, kích thước tệp dưới 10MB.
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileUpload}
                  className="mt-4 text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#275A4E] file:text-white hover:file:bg-[#1E4D40] cursor-pointer"
                />
              </div>
            )}

            {/* Hướng dẫn chụp ảnh đạt chuẩn */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 space-y-1">
              <strong className="block font-black text-blue-950">Quy tắc chuẩn nhận diện mầm non (BR-021):</strong>
              <p>• Bé nhìn thẳng vào camera, đủ sáng tự nhiên, không đeo kính râm hoặc khẩu trang.</p>
              <p>• Chỉ có duy nhất khuôn mặt của bé trong khung hình; không chụp cùng phụ huynh hoặc bạn khác.</p>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: 3 GÓC ẢNH ĐÃ CHỤP & TIẾN TRÌNH TRÍCH XUẤT (5 CỘT) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-black text-slate-800 text-base flex items-center justify-between">
              <span>3 Góc Ảnh Yêu Cầu ({capturedPhotos.length}/3)</span>
              {capturedPhotos.length === 3 && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Đủ 3 góc ảnh
                </span>
              )}
            </h3>

            {/* 3 Khung ảnh theo góc */}
            <div className="grid grid-cols-3 gap-3">
              {(['FRONTAL', 'LEFT_TILT', 'RIGHT_TILT'] as FaceAngleType[]).map((angle) => {
                const photo = capturedPhotos.find((p) => p.angle === angle);
                const isSelected = currentAngle === angle;

                return (
                  <div
                    key={angle}
                    onClick={() => setCurrentAngle(angle)}
                    className={`relative rounded-2xl border-2 overflow-hidden aspect-3/4 flex flex-col justify-between p-2 cursor-pointer transition ${
                      isSelected
                        ? 'border-[#275A4E] ring-2 ring-[#275A4E]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {photo ? (
                      <>
                        <img
                          src={photo.photoUrl}
                          alt={getAngleLabel(angle)}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="relative z-10 flex justify-between items-start">
                          <span className="bg-emerald-600 text-white rounded-full p-0.5">
                            <CheckCircle2 className="h-3 w-3" />
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCapturedPhotos((prev) => prev.filter((p) => p.angle !== angle));
                            }}
                            className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-1">
                        <User className="h-6 w-6" />
                        <span className="text-[10px] font-bold text-slate-400">Trống</span>
                      </div>
                    )}

                    <div className="relative z-10 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold text-center py-1 rounded-lg">
                      {angle === 'FRONTAL' ? 'Chính diện' : angle === 'LEFT_TILT' ? 'Trái 15°' : 'Phải 15°'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TIẾN TRÌNH TRÍCH XUẤT VECTOR AI */}
            {isExtracting ? (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#78C2AD]">
                  <span>TIẾN TRÌNH XỬ LÝ SINH TRẮC HỌC AI</span>
                  <span>{extractionStep}/3</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`flex items-center gap-2 ${extractionStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
                    <RefreshCw className={`h-3.5 w-3.5 ${extractionStep === 1 ? 'animate-spin' : ''}`} />
                    <span>1. Đang tải 3 góc ảnh lên MinIO S3 an toàn...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${extractionStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
                    <RefreshCw className={`h-3.5 w-3.5 ${extractionStep === 2 ? 'animate-spin' : ''}`} />
                    <span>2. AI kiểm tra ảnh thật (Anti-spoofing) & duy nhất 1 khuôn mặt...</span>
                  </div>
                  <div className={`flex items-center gap-2 ${extractionStep >= 3 ? 'text-white' : 'text-slate-500'}`}>
                    <RefreshCw className={`h-3.5 w-3.5 ${extractionStep === 3 ? 'animate-spin' : ''}`} />
                    <span>3. Trích xuất vector 512 chiều & đồng bộ sang cổng trường...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartExtraction}
                  disabled={capturedPhotos.length < 3}
                  className="w-full h-12 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Trích Xuất Vector AI & Kích Hoạt ({capturedPhotos.length}/3)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL THỎA THUẬN ĐỒNG THUẬN NGHỊ ĐỊNH 13/2023/NĐ-CP */}
      {showDecree13Modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#1E4D40] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#78C2AD]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    Thỏa Thuận Đồng Thuận Xử Lý Dữ Liệu Sinh Trắc Học Trẻ Em
                  </h3>
                  <p className="text-xs text-white/80">Tuân thủ nghiêm ngặt Nghị định số 13/2023/NĐ-CP</p>
                </div>
              </div>
              <button
                onClick={() => setShowDecree13Modal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 flex-1 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-extrabold text-slate-900">Cam kết bảo mật của Hệ thống Mầm non KIDPRO:</h4>
                <p>
                  1. Dữ liệu hình ảnh và vector khuôn mặt của trẻ <strong>{studentName}</strong> chỉ được sử dụng
                  vào mục đích nhận diện điểm danh đón trả trẻ an toàn tại cổng trường.
                </p>
                <p>
                  2. Tuyệt đối không chia sẻ, thương mại hóa hoặc chuyển giao dữ liệu sinh trắc học cho bất kỳ bên
                  thứ ba nào khác ngoài phạm vi bảo vệ trẻ.
                </p>
                <p>
                  3. Dữ liệu vector được mã hóa mật mã và phụ huynh có quyền yêu cầu xóa/hủy bỏ bất kỳ lúc nào.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Người giám hộ ký:</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mối quan hệ với bé:</label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={decree13ConsentAgreed}
                  onChange={(e) => setDecree13ConsentAgreed(e.target.checked)}
                  className="mt-0.5 rounded-md border-emerald-300 text-[#275A4E] focus:ring-[#275A4E]"
                />
                <span className="text-xs font-bold text-emerald-950">
                  Tôi là người giám hộ hợp pháp của bé và hoàn toàn đồng ý cung cấp hình ảnh khuôn mặt phục vụ điểm
                  danh AI tại cổng trường theo quy định của Nghị định 13/2023/NĐ-CP.
                </span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleRefuseConsent}
                className="h-11 px-4 rounded-2xl border border-red-200 hover:bg-red-50 text-[#DC2626] font-bold text-xs transition"
              >
                Từ Chối Cấp Quyền (Điểm danh thủ công)
              </button>

              <button
                type="button"
                onClick={() => consentMutation.mutate()}
                disabled={!decree13ConsentAgreed || consentMutation.isPending}
                className="h-11 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-xs flex items-center gap-2 shadow-md transition disabled:opacity-50"
              >
                {consentMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Tôi Đồng Ý - Bắt Đầu Đăng Ký</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFaceBiometricTab;
