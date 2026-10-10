import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import parentApi from '../../../api/parentApi';
import {
  BiometricPurgeCertificate,
  PurgeReason,
} from '../../../types/parent.types';
import { formatDate } from '../../../utils/formatters';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  KeyRound,
  Download,
  Flame,
  ArrowRight,
  RefreshCw,
  Printer,
  Sparkles,
  Clock,
} from 'lucide-react';

// System Messages
const MSG_297 =
  'Toàn bộ dữ liệu vector khuôn mặt và hình ảnh đã được xóa vĩnh viễn theo đúng quy định Nghị định 13/2023/NĐ-CP.';
const MSG_298 =
  'Xác thực danh tính không thành công. Lệnh xóa dữ liệu sinh trắc học bị hủy bỏ.';
const MSG_299 =
  'Tạm dừng yêu cầu xóa dữ liệu do hồ sơ đang có tranh chấp quyền giám hộ pháp lý.';
const MSG_087 =
  'Không nhận diện được khuôn mặt hợp lệ trong cơ sở dữ liệu khuôn mặt.';
const MSG_004 =
  'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';

interface BiometricPurgeDecree13TabProps {
  studentId: string;
  studentName: string;
  className: string;
}

export const BiometricPurgeDecree13Tab: React.FC<BiometricPurgeDecree13TabProps> = ({
  studentId,
  studentName,
  className,
}) => {
  const queryClient = useQueryClient();

  // Step Wizard: 'STEP_1_VERIFY' | 'STEP_2_OTP' | 'STEP_3_CERTIFICATE'
  const [currentStep, setCurrentStep] = useState<'STEP_1_VERIFY' | 'STEP_2_OTP' | 'STEP_3_CERTIFICATE'>(
    'STEP_1_VERIFY'
  );

  // Form State
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [purgeReason, setPurgeReason] = useState<PurgeReason>('PARENT_RIGHT_TO_ERASURE_DECREE13');
  const [notes, setNotes] = useState<string>('');
  const [isSimulateDispute, setIsSimulateDispute] = useState<boolean>(false);

  // Step 2 OTP State
  const [otpCode, setOtpCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(60);
  const [canResendOtp, setCanResendOtp] = useState<boolean>(false);

  // Loading & Processing
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [existingCertificate, setExistingCertificate] = useState<BiometricPurgeCertificate | null>(null);

  // Toast / System Feedback
  const [systemMessage, setSystemMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Kiểm tra xem hồ sơ này đã từng có chứng nhận xóa dữ liệu chưa
  useEffect(() => {
    const checkCertificate = async () => {
      try {
        const cert = await parentApi.getBiometricPurgeCertificate(studentId);
        if (cert) {
          setExistingCertificate(cert);
          setCurrentStep('STEP_3_CERTIFICATE');
        } else {
          setCurrentStep('STEP_1_VERIFY');
          setExistingCertificate(null);
        }
      } catch {
        // Fallback
      }
    };
    checkCertificate();
  }, [studentId]);

  // Bộ đếm ngược 60 giây OTP (Step 2)
  useEffect(() => {
    let timer: any = null;
    if (currentStep === 'STEP_2_OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, countdown]);

  // BƯỚC 1: XÁC THỰC MẬT KHẨU TÀI KHOẢN & YÊU CẦU CẤP MÃ OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountPassword) {
      setSystemMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu tài khoản phụ huynh để xác thực.' });
      return;
    }

    setIsLoading(true);
    setSystemMessage(null);

    try {
      // Giả lập kiểm tra tranh chấp nuôi con nếu người dùng bật cờ test
      const targetId = isSimulateDispute ? 'STU-DISPUTE' : studentId;
      const res = await parentApi.requestBiometricPurgeOtp(targetId, accountPassword);

      if (res.custodyDisputeFlag) {
        setSystemMessage({ type: 'warning', text: MSG_299 });
        setIsLoading(false);
        return;
      }

      setCountdown(60);
      setCanResendOtp(false);
      setCurrentStep('STEP_2_OTP');
      setSystemMessage({
        type: 'success',
        text: res.message || 'Mã xác thực OTP 6 số đã được gửi qua SMS/Email. (Mã kiểm thử: 132023)',
      });
    } catch (err: any) {
      setSystemMessage({
        type: 'error',
        text: err?.message || MSG_298,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // GỬI LẠI MÃ OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setIsLoading(true);
    try {
      await parentApi.requestBiometricPurgeOtp(studentId, accountPassword);
      setCountdown(60);
      setCanResendOtp(false);
      setSystemMessage({
        type: 'success',
        text: 'Đã gửi lại mã xác thực OTP mới. (Mã kiểm thử: 132023)',
      });
    } catch {
      setSystemMessage({ type: 'error', text: MSG_004 });
    } finally {
      setIsLoading(false);
    }
  };

  // BƯỚC 2: XÁC THỰC MÃ OTP & PHÁT LỆNH TIÊU HỦY DỮ LIỆU VĨNH VIỄN
  const handleConfirmPurge = async () => {
    if (otpCode.length !== 6) {
      setSystemMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ mã OTP 6 chữ số.' });
      return;
    }

    setIsLoading(true);
    setSystemMessage(null);

    try {
      const res = await parentApi.executeDecree13BiometricPurge({
        studentId,
        accountPassword,
        otpCode,
        reason: purgeReason,
        notes,
      });

      setExistingCertificate(res.certificate);
      setCurrentStep('STEP_3_CERTIFICATE');

      setSystemMessage({
        type: 'success',
        text: `${MSG_297} Kèm cảnh báo: ${MSG_087} - Hệ thống tự động chuyển sang chế độ đối chiếu danh sách thủ công (BR-023).`,
      });

      // Cơ chế revalidation TanStack Query
      queryClient.invalidateQueries({ queryKey: ['face-logs'] });
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err: any) {
      setSystemMessage({
        type: 'error',
        text: err?.message || MSG_298,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Tải bản sao PDF Giấy Chứng Nhận Tiêu Hủy
  const handleDownloadCertificate = () => {
    if (!existingCertificate) return;

    // Giả lập xuất và in Giấy chứng nhận pháp lý chuẩn Nghị định 13
    const printableWindow = window.open('', '_blank');
    if (!printableWindow) return;

    printableWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Giấy Chứng Nhận Hủy Dữ Liệu Sinh Trắc Học - ${existingCertificate.studentName}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 40px; color: #0F172A; }
            .header { text-align: center; border-bottom: 2px solid #275A4E; padding-bottom: 20px; }
            .national-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
            .national-subtitle { font-size: 11px; font-style: italic; margin-bottom: 16px; }
            .school-title { font-size: 18px; font-weight: 800; color: #1E4D40; }
            .cert-title { font-size: 22px; font-weight: 900; color: #DC2626; margin: 30px 0 10px 0; text-align: center; text-transform: uppercase; }
            .cert-id { text-align: center; font-size: 12px; color: #64748B; margin-bottom: 25px; }
            .content { line-height: 1.8; font-size: 13px; }
            .legal-quote { background: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 15px 0; font-size: 12px; }
            .data-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .data-table th, .data-table td { border: 1px solid #CBD5E1; padding: 8px 12px; font-size: 12px; text-align: left; }
            .data-table th { background: #F8FAFC; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; text-align: center; }
            .seal-box { border: 2px dashed #275A4E; padding: 15px; border-radius: 12px; display: inline-block; background: #F0FDF4; }
            .hash-digest { font-family: monospace; font-size: 10px; word-break: break-all; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="national-title">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="national-subtitle">Độc lập - Tự do - Hạnh phúc</div>
            <div class="school-title">${existingCertificate.schoolName}</div>
          </div>

          <div class="cert-title">GIẤY CHỨNG NHẬN HỦY DỮ LIỆU SINH TRẮC HỌC ĐIỆN TỬ</div>
          <div class="cert-id">Số chứng chỉ: <strong>${existingCertificate.certificateId}</strong> | Mã kiểm toán: <strong>${existingCertificate.auditLogKey}</strong></div>

          <div class="content">
            <div class="legal-quote">
              <strong>CĂN CỨ PHÁP LÝ:</strong> ${existingCertificate.decreeArticle}. Nhà trường xác nhận đã thực hiện quy trình tiêu hủy vĩnh viễn, không thể khôi phục toàn bộ các trường dữ liệu sinh trắc học và hình ảnh chân dung của học sinh theo đúng yêu cầu hợp pháp của phụ huynh.
            </div>

            <p><strong>Họ và tên học sinh:</strong> ${existingCertificate.studentName} | <strong>Mã số:</strong> ${existingCertificate.studentCode} | <strong>Lớp:</strong> ${existingCertificate.className}</p>
            <p><strong>Người đại diện theo pháp luật (Phụ huynh):</strong> ${existingCertificate.guardianName}</p>
            <p><strong>Thời điểm hoàn tất tiêu hủy:</strong> ${formatDate(existingCertificate.purgedAt)} (Hệ thống máy chủ ghi nhận)</p>

            <table class="data-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Hạng Mục Dữ Liệu Tiêu Hủy</th>
                  <th>Trạng Thái Hệ Thống</th>
                </tr>
              </thead>
              <tbody>
                ${existingCertificate.purgedItems
                  .map(
                    (item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item}</td>
                    <td><strong style="color: #DC2626;">ĐÃ TIÊU HỦY VĨNH VIỄN</strong></td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>

            <p>Kể từ thời điểm này, học sinh và người thân khi ra vào trường sẽ sử dụng hình thức đối chiếu hồ sơ đón trả thủ công tại cổng trường.</p>
          </div>

          <div class="footer">
            <div>
              <p><strong>ĐẠI DIỆN PHỤ HUYNH</strong></p>
              <p style="margin-top: 50px;">${existingCertificate.guardianName}</p>
            </div>
            <div>
              <p><strong>ĐẠI DIỆN BAN GIÁM HIỆU & AN NINH DỮ LIỆU</strong></p>
              <div class="seal-box" style="margin-top: 15px;">
                <strong style="color: #275A4E;">[ĐÃ KÝ SỐ ĐIỆN TỬ]</strong><br/>
                <small>${existingCertificate.schoolSigner}</small><br/>
                <span class="hash-digest">SHA-256: ${existingCertificate.sha256Digest}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printableWindow.document.close();
    printableWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden border border-rose-900/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500 text-white flex items-center gap-1.5 shadow-xs">
                <Flame className="w-3.5 h-3.5" />
                UC-069: QUYỀN RIÊNG TƯ & XÓA SINH TRẮC HỌC
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
                Điều 16 Nghị định 13/2023/NĐ-CP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Quyền Xóa Vĩnh Viễn Dữ Liệu Sinh Trắc Học & Vector Khuôn Mặt
            </h2>
            <p className="text-xs sm:text-sm text-rose-100/80 mt-1 max-w-2xl leading-relaxed">
              Thực thi Quyền yêu cầu xóa dữ liệu cá nhân theo quy định pháp luật. Quy trình yêu cầu xác thực 2 lớp (2FA Password + SMS OTP) để xóa bỏ vĩnh viễn vector 512 chiều, ảnh chân dung trên máy chủ lưu trữ và cấp Giấy chứng nhận điện tử.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold border border-white/20 text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Phân Vùng Bảo Mật Cao</span>
            </span>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO HỆ THỐNG (SYSTEM TOAST / FEEDBACK) */}
      {systemMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 shadow-sm border transition animate-in fade-in ${
            systemMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : systemMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {systemMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : systemMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-relaxed">
            {systemMessage.text}
          </div>
          <button
            onClick={() => setSystemMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* QUY ĐỊNH PHÁP LÝ & DANH MỤC DỮ LIỆU HỦY BỎ (DECREE 13 LEGAL DISCLOSURE BANNER) */}
      <div className="p-5 bg-rose-50/70 border-2 border-rose-200 rounded-2xl space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-extrabold text-rose-950 uppercase tracking-wide">
              Căn Cứ Pháp Lý Điều 16 Nghị Định 13/2023/NĐ-CP (Quyền Xóa Dữ Liệu)
            </h3>
            <p className="text-xs text-rose-900 leading-relaxed font-medium">
              "Tuân thủ nghiêm ngặt Điều 16 Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân, phụ huynh có toàn quyền yêu cầu hủy bỏ vĩnh viễn dữ liệu sinh trắc học của con và người đưa đón bất kỳ lúc nào khi học sinh chuyển trường, tốt nghiệp hoặc không còn nhu cầu nhận diện tự động."
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-rose-200/80">
          <h4 className="text-xs font-bold text-rose-900 mb-2">
            Danh Mục Dữ Liệu Sinh Trắc Học Sẽ Bị Xóa Sạch & Hủy Bỏ Vĩnh Viễn:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200 flex items-center gap-2 text-rose-950 font-bold">
              <span className="text-rose-600 font-black">❌</span>
              <span>Vector nhận diện khuôn mặt 512 chiều trong bảng student_face_vectors</span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200 flex items-center gap-2 text-rose-950 font-bold">
              <span className="text-rose-600 font-black">❌</span>
              <span>Vector khuôn mặt của toàn bộ người giám hộ được ủy quyền đón bé</span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200 flex items-center gap-2 text-rose-950 font-bold">
              <span className="text-rose-600 font-black">❌</span>
              <span>Toàn bộ tệp ảnh chân dung gốc lưu trên máy chủ lưu trữ MinIO S3</span>
            </div>
            <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200 flex items-center gap-2 text-rose-950 font-bold">
              <span className="text-rose-600 font-black">❌</span>
              <span>Bộ nhớ đệm nhận diện tại toàn bộ các trạm camera cổng trường</span>
            </div>
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG BƯỚC WIZARD (3 STEPS) */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4 py-2 bg-slate-100 rounded-2xl">
        <div
          className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'STEP_1_VERIFY'
              ? 'text-rose-700'
              : 'text-slate-500'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 'STEP_1_VERIFY'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            1
          </div>
          <span>Mật Khẩu Phụ Huynh</span>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300" />

        <div
          className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'STEP_2_OTP'
              ? 'text-rose-700'
              : 'text-slate-500'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 'STEP_2_OTP'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            2
          </div>
          <span>Xác Thực OTP 2FA</span>
        </div>

        <ArrowRight className="w-4 h-4 text-slate-300" />

        <div
          className={`flex items-center gap-2 text-xs font-bold ${
            currentStep === 'STEP_3_CERTIFICATE'
              ? 'text-emerald-700'
              : 'text-slate-500'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
              currentStep === 'STEP_3_CERTIFICATE'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-300 text-slate-700'
            }`}
          >
            3
          </div>
          <span>Chứng Nhận Tiêu Hủy</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* BƯỚC 1: CHỌN HỒ SƠ & NHẬP MẬT KHẨU TÀI KHOẢN PHỤ HUYNH */}
      {/* ============================================================ */}
      {currentStep === 'STEP_1_VERIFY' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-rose-600" />
              <span>Bước 1: Xác Thực Danh Tính & Chọn Hồ Sơ Tiêu Hủy</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Để bảo vệ quyền lợi hợp pháp của trẻ, hành động này yêu cầu chủ tài khoản phụ huynh nhập mật khẩu.
            </p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            {/* Thông tin học sinh */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block">Học sinh được chọn:</span>
                <span className="font-extrabold text-slate-900 text-sm">{studentName}</span>
                <span className="text-slate-500 ml-2">({className})</span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[11px]">
                Vector 512 Chiều Đang Kích Hoạt
              </span>
            </div>

            {/* Lý do xóa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý Do Yêu Cầu Hủy Dữ Liệu Sinh Trắc Học <span className="text-rose-500">*</span>
              </label>
              <select
                value={purgeReason}
                onChange={(e) => setPurgeReason(e.target.value as PurgeReason)}
                className="w-full h-11 px-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                <option value="PARENT_RIGHT_TO_ERASURE_DECREE13">
                  Thực thi quyền xóa dữ liệu theo Điều 16 Nghị định 13/2023/NĐ-CP
                </option>
                <option value="STUDENT_TRANSFER">Bé chuyển trường học khác</option>
                <option value="GRADUATED">Bé đã tốt nghiệp mầm non (ra trường)</option>
                <option value="OTHER">Lý do cá nhân khác</option>
              </select>
            </div>

            {/* Ghi chú thêm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi Chú Yêu Cầu (Tùy chọn)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập lý do cụ thể nếu cần bộ phận an ninh lưu ý..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Mật khẩu phụ huynh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật Khẩu Tài Khoản Phụ Huynh <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Nhập mật khẩu bạn dùng để đăng nhập Cổng phụ huynh"
                className="w-full h-11 px-3 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Tùy chọn giả lập kiểm thử tranh chấp giám hộ (BR-075 / MSG-299) */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-bold">
                <input
                  type="checkbox"
                  checked={isSimulateDispute}
                  onChange={(e) => setIsSimulateDispute(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>Mô phỏng trường hợp hồ sơ đang có tranh chấp quyền nuôi dưỡng (MSG-299)</span>
              </label>
            </div>

            {/* Nút hành động */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang Xác Thực...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận & Gửi Mã OTP Qua SMS/Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 2: XÁC THỰC MÃ OTP 6 SỐ (2FA HIGH SECURITY BR-075) */}
      {/* ============================================================ */}
      {currentStep === 'STEP_2_OTP' && (
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-300 shadow-xl max-w-xl mx-auto space-y-5 animate-in fade-in">
          <div className="border-b border-slate-100 pb-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-rose-950">
              Bước 2: Xác Thực Mã Bảo Mật 2FA (SMS OTP)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Mã xác thực bảo mật 6 số đã được gửi tới số điện thoại/email đăng ký của Quý phụ huynh.
            </p>
          </div>

          {/* Ô nhập mã OTP */}
          <div className="space-y-3">
            <div className="text-center">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Nhập Mã Xác Thực 6 Số (Mã thử nghiệm: <span className="text-rose-600 font-extrabold">132023</span>)
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                className="w-48 h-12 text-center text-2xl font-black tracking-widest rounded-xl border-2 border-rose-400 focus:outline-hidden focus:ring-4 focus:ring-rose-500/20 text-rose-700 mx-auto block"
              />
            </div>

            {/* Đồng hồ đếm ngược 60s */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-slate-400" />
              {countdown > 0 ? (
                <span>Mã OTP hết hiệu lực sau: <strong className="text-rose-600">{countdown} giây</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                >
                  Gửi lại mã OTP mới
                </button>
              )}
            </div>
          </div>

          {/* CẢNH BÁO AN NINH CẤP CAO (DANGER ZONE WARNING) */}
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-1.5 leading-relaxed font-semibold">
            <div className="flex items-center gap-1.5 text-rose-700 font-black">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>CẢNH BÁO TIÊU HỦY KHÔNG THỂ HOÀN TÁC:</span>
            </div>
            <p>
              • Thao tác này sẽ xóa vĩnh viễn vector 512 chiều và tệp ảnh của bé khỏi CSDL sinh trắc học.
            </p>
            <p>
              • Khi đứng trước camera cổng trường, hệ thống sẽ báo <span className="font-bold text-rose-700">MSG-087</span> và chuyển sang hình thức đối chiếu danh sách thủ công tại lớp (BR-023).
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep('STEP_1_VERIFY')}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer min-h-[44px]"
            >
              Quay Lại
            </button>
            <button
              type="button"
              disabled={isLoading || otpCode.length !== 6}
              onClick={handleConfirmPurge}
              className="flex-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Tiêu Hủy Dữ Liệu...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4" />
                  <span>Xác Nhận Xóa Vĩnh Viễn Sinh Trắc Học</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 3: MÀN HÌNH CHỨNG NHẬN TIÊU HỦY THÀNH CÔNG (CERTIFICATE) */}
      {/* ============================================================ */}
      {currentStep === 'STEP_3_CERTIFICATE' && existingCertificate && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-emerald-300 shadow-xl max-w-3xl mx-auto space-y-6 animate-in fade-in">
          {/* Header Chứng Nhận */}
          <div className="text-center space-y-2 border-b border-slate-100 pb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              GIẤY CHỨNG NHẬN HỦY DỮ LIỆU SINH TRẮC HỌC ĐIỆN TỬ
            </h3>
            <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E5A93C]" />
              <span>Đã hoàn tất theo đúng quy định Điều 16 Nghị định 13/2023/NĐ-CP</span>
            </p>
          </div>

          {/* Chi tiết chứng nhận */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-500 block">Số hiệu chứng chỉ:</span>
                <span className="font-extrabold text-slate-800 text-sm">
                  {existingCertificate.certificateId}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Mã kiểm toán bất biến:</span>
                <span className="font-extrabold text-rose-700 font-mono">
                  {existingCertificate.auditLogKey}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Học sinh:</span>
                <span className="font-bold text-slate-800">
                  {existingCertificate.studentName} ({existingCertificate.className})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Thời điểm hoàn tất:</span>
                <span className="font-bold text-slate-800">
                  {formatDate(existingCertificate.purgedAt)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-600 font-bold block mb-1.5">
                Các hạng mục đã được xóa đè nhị phân và tiêu hủy vĩnh viễn:
              </span>
              <ul className="space-y-1">
                {existingCertificate.purgedItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-slate-500 block text-[11px]">Mã băm toàn vẹn SHA-256 chữ ký số:</span>
              <span className="font-mono text-[10px] text-slate-600 break-all bg-white px-2 py-1 rounded-md border border-slate-200 block mt-0.5">
                {existingCertificate.sha256Digest}
              </span>
            </div>
          </div>

          {/* Cảnh báo trạng thái cổng trường */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-950 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Trạng thái cổng trường hiện tại:</strong> Khuôn mặt của bé và người thân không còn tồn tại trong AI Cache ({MSG_087}). Khi đưa đón bé, phụ huynh vui lòng xuất trình Thẻ học sinh hoặc đối chiếu danh sách lớp thủ công với giáo viên đón trả (BR-023).
            </div>
          </div>

          {/* Nút in & Tải Giấy chứng nhận PDF */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setCurrentStep('STEP_1_VERIFY')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer min-h-[44px]"
            >
              Thực Hiện Lại Yêu Cầu
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDownloadCertificate}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>In Bản Cứng</span>
              </button>

              <button
                onClick={handleDownloadCertificate}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-[#275A4E]/20 cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Tải Giấy Chứng Nhận (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricPurgeDecree13Tab;
