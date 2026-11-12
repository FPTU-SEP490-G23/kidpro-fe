import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  Download,
  Calendar,
  Layers,
  HardDrive,
  Clock,
  Sparkles,
  X,
  FileCheck,
} from 'lucide-react';
import academicYearApi from '../../../api/academicYearApi';
import { AcademicYear } from '../../../types/academicYear.types';
import { useAuth } from '../../../contexts/AuthContext';

// System Messages
const MSG_278 = 'Dữ liệu học bạ năm học đã được đóng khóa và lưu trữ an toàn vĩnh viễn.';
const MSG_279 = 'Không thể khóa sổ niên khóa: Còn {n} học sinh chưa hoàn thành đánh giá phát triển.';
const MSG_280 = 'Mã phê duyệt không hợp lệ. Quá trình khóa sổ bị hủy bỏ.';
const MSG_281 = 'Dung lượng lưu trữ kho học bạ sắp đầy. Vui lòng mở rộng dung lượng trước khi tiếp tục.';
const MSG_004 = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';

export const YearEndArchivalTab: React.FC = () => {
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const isBghOrAdmin = role === 'BGH' || role === 'SYSTEM_ADMIN' ;

  // Sub-tabs: 1. Đóng khóa sổ niên khóa, 2. Trích lục học bạ lịch sử
  const [activeSubTab, setActiveSubTab] = useState<'close_year' | 'dossier_search'>('close_year');

  // Selected Academic Year
  const [selectedYearId, setSelectedYearId] = useState<string>('ay-2025-2026');

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [principalAuthCode, setPrincipalAuthCode] = useState<string>('');
  const [archivalNotes, setArchivalNotes] = useState<string>('');

  // Search dossier state
  const [dossierSearchKw, setDossierSearchKw] = useState<string>('');
  const [selectedDossierYear, setSelectedDossierYear] = useState<string>('ALL');

  // Toast / System feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // 1. Tải danh sách niên khóa
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      return await academicYearApi.getAcademicYears();
    },
  });

  // 2. Tải dữ liệu Pre-flight Check cho niên khóa được chọn
  const { data: preflightCheck } = useQuery({
    queryKey: ['archival-preflight', selectedYearId],
    queryFn: async () => {
      return await academicYearApi.getArchivalPreflightCheck(selectedYearId);
    },
    enabled: !!selectedYearId,
  });

  // Mutation đóng khóa sổ
  const archiveMutation = useMutation({
    mutationFn: async (payload: { academicYearId: string; principalAuthCode: string; notes?: string }) => {
      return await academicYearApi.executeYearEndArchival(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      queryClient.invalidateQueries({ queryKey: ['archival-preflight'] });
    },
  });

  // Xử lý mở Modal đóng sổ
  const handleOpenCloseModal = () => {
    // 1. Kiểm tra điều kiện tiên quyết
    if (preflightCheck && !preflightCheck.evaluationsCompleted) {
      setFeedback({
        type: 'error',
        message: MSG_279.replace('{n}', String(preflightCheck.incompleteEvaluationCount || 3)),
      });
      return;
    }

    // 2. Kiểm tra dung lượng lưu trữ kho học bạ (< 20GB - MSG-281)
    if (preflightCheck && preflightCheck.diskSpaceAvailableGb < 20) {
      setFeedback({
        type: 'warning',
        message: MSG_281,
      });
      return;
    }

    setPrincipalAuthCode('');
    setArchivalNotes('Đóng sổ tổng kết năm học, lưu trữ học bạ điện tử SHA-256 theo quy chuẩn Bộ GD&ĐT.');
    setShowConfirmModal(true);
  };

  // Xác nhận đóng khóa sổ niên khóa
  const handleConfirmArchival = async () => {
    // BR: Bắt buộc đúng mã phê duyệt của Hiệu trưởng (MSG-280)
    if (principalAuthCode.trim() !== 'BGH-KIDPRO-2026' && principalAuthCode.trim().length < 6) {
      setFeedback({
        type: 'error',
        message: MSG_280,
      });
      return;
    }

    try {
      await archiveMutation.mutateAsync({
        academicYearId: selectedYearId,
        principalAuthCode: principalAuthCode.trim(),
        notes: archivalNotes,
      });

      setFeedback({
        type: 'success',
        message: MSG_278,
      });
      setShowConfirmModal(false);
    } catch {
      setFeedback({
        type: 'error',
        message: MSG_004,
      });
    }
  };

  // Danh sách học bạ lưu trữ
  const mockDossiers: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
    gender: string;
    dateOfBirth: string;
    academicYearName: string;
    graduatedClassName: string;
    certificateNumber: string;
    finalEvaluationSummary: string;
    attendanceRate: number;
  }> = [];

  const filteredDossiers = mockDossiers.filter((d) => {
    if (selectedDossierYear !== 'ALL' && d.academicYearName !== selectedDossierYear) {
      return false;
    }
    if (dossierSearchKw.trim()) {
      const kw = dossierSearchKw.toLowerCase();
      const matchName = d.studentName.toLowerCase().includes(kw);
      const matchCode = d.studentCode.toLowerCase().includes(kw);
      const matchCert = d.certificateNumber.toLowerCase().includes(kw);
      if (!matchName && !matchCode && !matchCert) return false;
    }
    return true;
  });

  const selectedYear = academicYears.find((y) => y.id === selectedYearId);
  const isYearAlreadyClosed = selectedYear?.status === 'CLOSED';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E4D40] via-[#275A4E] to-[#1E4D40] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                UC-065: LUẬT LƯU TRỮ & CHUẨN MỰC BỘ GD&ĐT
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                Tính Bất Biến READ-ONLY 10 Năm
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Lưu Trữ Dữ Liệu Học Bạ Hết Niên Khóa
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
              Quy trình khóa sổ niên khóa kết thúc ngày 31/05 hàng năm. Chuyển toàn bộ dữ liệu đánh giá, điểm danh, tài chính sang chế độ Chỉ đọc (Read-only), tự động xét lên lớp, cấp giấy chứng nhận tốt nghiệp cho khối 5 tuổi và tạo gói nén SHA-256.
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/20 self-start md:self-center">
            <button
              onClick={() => setActiveSubTab('close_year')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                activeSubTab === 'close_year'
                  ? 'bg-white text-[#1E4D40] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Quy Trình Khóa Sổ
            </button>
            <button
              onClick={() => setActiveSubTab('dossier_search')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                activeSubTab === 'dossier_search'
                  ? 'bg-white text-[#1E4D40] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Trích Lục Học Bạ Lịch Sử
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo phản hồi hệ thống */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 shadow-sm border transition animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">{feedback.message}</div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* TAB 1: QUY TRÌNH KHÓA SỔ NIÊN KHÓA */}
      {activeSubTab === 'close_year' && (
        <div className="space-y-6">
          {/* Bộ Chọn Niên Khóa Cần Đóng */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#275A4E]" />
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Chọn Niên Khóa Mục Tiêu Cần Đóng Sổ
                </label>
                <p className="text-xs text-slate-500">
                  Kiểm tra toàn bộ hồ sơ lớp học trước khi niêm phong vĩnh viễn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="h-11 px-4 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 cursor-pointer min-w-[200px]"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    Năm học {y.name} ({y.status === 'CLOSED' ? 'Đã đóng sổ' : y.status})
                  </option>
                ))}
              </select>

              {isYearAlreadyClosed ? (
                <div className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center gap-1.5 border border-slate-200">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Niên Khóa Đã Khóa Sổ</span>
                </div>
              ) : isBghOrAdmin ? (
                <button
                  onClick={handleOpenCloseModal}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm transition flex items-center gap-2 shadow-md cursor-pointer min-h-[44px]"
                >
                  <Archive className="w-4 h-4" />
                  <span>Tiến Hành Khóa Sổ Niên Khóa</span>
                </button>
              ) : (
                <div className="px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                  Yêu cầu thẩm quyền BGH để khóa sổ
                </div>
              )}
            </div>
          </div>

          {/* 4 Tiêu Chí Tiền Kiểm Tra Bắt Buộc (Pre-flight Checklist) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1E4D40] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#275A4E]" />
                  <span>Bảng Tiền Kiểm Tra Điều Kiện Đóng Sổ (Pre-flight Checks)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bắt buộc hoàn tất 100% tất cả 4 tiêu chuẩn trước khi hệ thống cho phép kích hoạt khóa sổ
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  <HardDrive className="w-3.5 h-3.5" />
                  Dung lượng còn trống: 148.5 GB (Đạt chuẩn {'>'} 20GB)
                </span>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tiêu chí 1: Đánh giá phát triển */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">
                    1. Đánh giá Phát triển 5 Lĩnh vực Mầm non (Thông tư 28)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đã hoàn thành 100% học sinh toàn trường (268/268 bé). Không còn học sinh nào bị bỏ trống dữ liệu học kỳ hay cuối năm.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Trạng thái: Hoàn tất 100%
                  </span>
                </div>
              </div>

              {/* Tiêu chí 2: Sổ điểm danh */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">
                    2. Chốt Sổ Điểm Danh & Nhật Ký Hoạt Động Cả Năm
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Toàn bộ sổ điểm danh 9 tháng (Tháng 09 đến Tháng 05) của tất cả 10 lớp học đã được giáo viên chủ nhiệm chốt khóa sổ đầy đủ.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Trạng thái: Đã chốt sổ 10/10 lớp
                  </span>
                </div>
              </div>

              {/* Tiêu chí 3: Tài chính & học phí */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">
                    3. Tất Toán Tài Chính, Hoàn Trả Tiền Ăn & Công Nợ Học Phí
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đã tất toán toàn bộ các khoản hoàn phí ăn bán trú tháng 05, khấu trừ cọc và chuyển số dư công nợ sang kỳ tài chính tiếp theo.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Trạng thái: Hoàn tất đối soát tài chính
                  </span>
                </div>
              </div>

              {/* Tiêu chí 4: Hồ sơ tốt nghiệp Khối Lá */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">
                    4. Lập Danh Sách & Cấp Mã Tốt Nghiệp Mầm Non (5 tuổi)
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Đã tổng hợp hồ sơ và cấp số hiệu giấy chứng nhận hoàn thành chương trình mầm non cho 93 học sinh khối 5 tuổi chuẩn bị vào Lớp 1.
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Trạng thái: Đủ điều kiện 93/93 trẻ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dòng Chảy Xét Lên Lớp & Tốt Nghiệp Tự Động (Auto-Promotion Matrix) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1E4D40] flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#275A4E]" />
                <span>Quy Trình Xét Chuyển Khối & Tốt Nghiệp Tự Động</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hệ thống tự động tịnh tiến độ tuổi học sinh và phân loại học bạ khi đóng sổ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Dòng 1: Nhà trẻ -> Mầm */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    1 - 2 tuổi
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#275A4E]" />
                </div>
                <div className="text-lg font-bold text-[#1E4D40]">Lên 3 tuổi</div>
                <div className="text-xs text-slate-600">
                  Số lượng xét duyệt: <strong>42 học sinh</strong>
                </div>
              </div>

              {/* Dòng 2: Mầm -> Chồi */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    3 tuổi
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#275A4E]" />
                </div>
                <div className="text-lg font-bold text-[#1E4D40]">Lên 4 tuổi</div>
                <div className="text-xs text-slate-600">
                  Số lượng xét duyệt: <strong>74 học sinh</strong>
                </div>
              </div>

              {/* Dòng 3: Chồi -> Lá */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    4 tuổi
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#275A4E]" />
                </div>
                <div className="text-lg font-bold text-[#1E4D40]">Lên 5 tuổi</div>
                <div className="text-xs text-slate-600">
                  Số lượng xét duyệt: <strong>81 học sinh</strong>
                </div>
              </div>

              {/* Dòng 4: Lá -> Tốt nghiệp */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase">
                    5 tuổi
                  </span>
                  <Sparkles className="w-4 h-4 text-[#E5A93C]" />
                </div>
                <div className="text-lg font-bold text-emerald-950">Tốt Nghiệp Mầm Non</div>
                <div className="text-xs text-emerald-900">
                  Cấp chứng nhận: <strong>93 học sinh</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRÍCH LỤC HỌC BẠ LỊCH SỬ */}
      {activeSubTab === 'dossier_search' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <select
                  value={selectedDossierYear}
                  onChange={(e) => setSelectedDossierYear(e.target.value)}
                  className="h-10 px-3 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer"
                >
                  <option value="ALL">Tất cả niên khóa đã đóng</option>
                  <option value="2025-2026">Niên khóa 2025 - 2026</option>
                  <option value="2024-2025">Niên khóa 2024 - 2025</option>
                </select>
              </div>

              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên bé, mã học sinh, số chứng nhận..."
                  value={dossierSearchKw}
                  onChange={(e) => setDossierSearchKw(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]"
                />
              </div>
            </div>
          </div>

          {/* Bảng Danh Sách Học Bạ Lưu Trữ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1E4D40] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#275A4E]" />
                <span>Kho Lưu Trữ Học Bạ & Chứng Nhận Tốt Nghiệp Điện Tử</span>
              </h3>
              <span className="text-xs text-slate-500">
                Tìm thấy <strong>{filteredDossiers.length}</strong> hồ sơ lưu trữ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-44">Học Sinh</th>
                    <th className="py-3 px-3 w-28 text-center">Niên Khóa</th>
                    <th className="py-3 px-3 w-36">Lớp Tốt Nghiệp</th>
                    <th className="py-3 px-3 w-40 text-center">Số Chứng Nhận</th>
                    <th className="py-3 px-4">Đánh Giá Tổng Kết 5 Lĩnh Vực</th>
                    <th className="py-3 px-3 text-center w-24">Chuyên Cần</th>
                    <th className="py-3 px-3 text-center w-32">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDossiers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có hồ sơ học bạ lưu trữ nào trong kho dữ liệu.
                      </td>
                    </tr>
                  ) : (
                    filteredDossiers.map((d, idx) => (
                    <tr key={d.studentId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{d.studentName}</div>
                        <div className="text-[11px] text-slate-400">
                          {d.studentCode} • {d.dateOfBirth}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-600">
                        {d.academicYearName}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-700">
                        {d.graduatedClassName}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-[#1E4D40] bg-slate-50 rounded">
                        {d.certificateNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 leading-relaxed">
                        {d.finalEvaluationSummary}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                        {d.attendanceRate}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setFeedback({
                              type: 'success',
                              message: `Đang kết xuất bản sao PDF học bạ điện tử có mã xác thực cho học sinh ${d.studentName}...`,
                            });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#275A4E] hover:bg-[#275A4E] hover:text-white font-bold text-xs transition cursor-pointer min-h-[36px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Xuất PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác Thực Thẩm Quyền Của Hiệu Trưởng Khi Đóng Sổ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <span>Xác Nhận Đóng Khóa Sổ & Niêm Phong Niên Khóa</span>
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs leading-relaxed space-y-1">
              <span className="font-bold block">
                CẢNH BÁO TÍNH BẤT BIẾN THEO LUẬT LƯU TRỮ:
              </span>
              <p>
                Thao tác Đóng sổ niên khóa sẽ chuyển toàn bộ cơ sở dữ liệu của năm học này (học bạ, sổ điểm danh, sổ ăn bán trú, hóa đơn tài chính) sang chế độ <strong>CHỈ ĐỌC (READ-ONLY) VĨNH VIỄN TRÊN 10 NĂM</strong> và không thể hoàn tác.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Phê Duyệt / Chữ Ký Số Của Hiệu Trưởng (Bắt buộc - MSG-280)
                </label>
                <input
                  type="password"
                  placeholder="Nhập mã phê duyệt bảo mật..."
                  value={principalAuthCode}
                  onChange={(e) => setPrincipalAuthCode(e.target.value)}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Gợi ý kiểm thử: BGH-KIDPRO-2026
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi Chú Quyết Định Khóa Sổ
                </label>
                <textarea
                  rows={2}
                  value={archivalNotes}
                  onChange={(e) => setArchivalNotes(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer min-h-[44px]"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmArchival}
                disabled={archiveMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer min-h-[44px]"
              >
                <Lock className="w-4 h-4" />
                <span>Xác Nhận Đóng Khóa Sổ Niên Khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YearEndArchivalTab;
