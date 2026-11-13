import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  Search,
  Check,
  X,
  ShieldAlert
} from 'lucide-react';
import { academicYearApi } from '../../../api/academicYearApi';
import { studentPromotionService } from '../../../services/studentPromotionService';
import { PromotionPreviewItem, PromotionAction, ExecutePromotionPayload } from '../../../types/studentPromotion.types';
import { GradeLevel } from '../../../types/classAffairs.types';
import { useToast } from '../../../contexts/ToastContext';

const GRADE_LABELS: Record<GradeLevel, string> = {
  INFANT: 'Nhà trẻ nhỏ (3 - 12 tháng)',
  TODDLER: 'Nhà trẻ (12 - 36 tháng)',
  NURSERY: 'Khối Mầm (3 - 4 tuổi)',
  KINDERGARTEN: 'Khối Chồi (4 - 5 tuổi)',
  PRE_K: 'Khối Lá (5 - 6 tuổi)',
};

const GRADE_SHORT: Record<GradeLevel, string> = {
  INFANT: 'Nhà trẻ nhỏ',
  TODDLER: 'Nhà trẻ',
  NURSERY: 'Khối Mầm',
  KINDERGARTEN: 'Khối Chồi',
  PRE_K: 'Khối Lá',
};

export const StudentPromotionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [fromYearId, setFromYearId] = useState<string>('');
  const [toYearId, setToYearId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Local state lưu trữ hành động kết chuyển từng học sinh: studentId -> { action, retentionReason }
  const [promotionDecisions, setPromotionDecisions] = useState<
    Record<string, { action: PromotionAction; retentionReason: string }>
  >({});

  // Modal giữ lại lớp cũ
  const [retainModalStudent, setRetainModalStudent] = useState<PromotionPreviewItem | null>(null);
  const [tempReason, setTempReason] = useState<string>('');
  const [retainError, setRetainError] = useState<string>('');

  // Confirm execution dialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  // 1. Lấy danh sách niên khóa
  const { data: academicYears = [], isLoading: isLoadingYears } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const res = await academicYearApi.getAcademicYears();
      return Array.isArray(res) ? res : [];
    },
  });

  // Tự động set niên khóa mặc định (năm cũ là năm hiện tại, năm mới là năm tiếp theo)
  useEffect(() => {
    if (academicYears.length > 0 && !fromYearId) {
      const sorted = [...academicYears].sort((a: any, b: any) => (a.startDate > b.startDate ? 1 : -1));
      const active = sorted.find((y: any) => y.status === 'ACTIVE') || sorted[0];
      setFromYearId(active.id);

      const nextYear = sorted.find((y: any) => y.id !== active.id && y.startDate > active.startDate) || sorted[sorted.length - 1];
      if (nextYear && nextYear.id !== active.id) {
        setToYearId(nextYear.id);
      } else if (sorted.length > 1) {
        setToYearId(sorted[1].id);
      }
    }
  }, [academicYears, fromYearId]);

  // 2. Lấy danh sách preview kết chuyển
  const {
    data: previewList = [],
    isLoading: isLoadingPreview,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['promotionPreview', fromYearId, toYearId, selectedGrade],
    queryFn: async () => {
      if (!fromYearId || !toYearId || fromYearId === toYearId) return [];
      return await studentPromotionService.getPreview(fromYearId, toYearId, selectedGrade !== 'ALL' ? selectedGrade : undefined);
    },
    enabled: Boolean(fromYearId && toYearId && fromYearId !== toYearId),
  });

  // Khởi tạo quyết định mặc định (tất cả là PROMOTE)
  useEffect(() => {
    if (previewList.length > 0) {
      const initial: Record<string, { action: PromotionAction; retentionReason: string }> = {};
      previewList.forEach((st) => {
        if (!promotionDecisions[st.studentId]) {
          initial[st.studentId] = { action: 'PROMOTE', retentionReason: '' };
        }
      });
      setPromotionDecisions((prev) => ({ ...initial, ...prev }));
    }
  }, [previewList]);

  // Mutation thực thi kết chuyển
  const executeMutation = useMutation({
    mutationFn: async (payload: ExecutePromotionPayload) => {
      return await studentPromotionService.executePromotion(payload);
    },
    onSuccess: () => {
      success('Lập kế hoạch kết chuyển học sinh vào năm học mới thành công.');
      setIsConfirmDialogOpen(false);
      refetchPreview();
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi thực thi kết chuyển học sinh.';
      error(msg);
    },
  });

  // Xử lý bật modal giữ lại khối cũ
  const handleOpenRetainModal = (student: PromotionPreviewItem) => {
    setRetainModalStudent(student);
    const current = promotionDecisions[student.studentId];
    setTempReason(current?.retentionReason || '');
    setRetainError('');
  };

  // Lưu lý do giữ lại khối cũ
  const handleSaveRetain = () => {
    if (!tempReason.trim()) {
      setRetainError('Vui lòng nhập lý do giữ học sinh học lại khối cũ.');
      return;
    }
    if (retainModalStudent) {
      setPromotionDecisions((prev) => ({
        ...prev,
        [retainModalStudent.studentId]: {
          action: 'RETAIN',
          retentionReason: tempReason.trim(),
        },
      }));
    }
    setRetainModalStudent(null);
  };

  // Đổi lại sang PROMOTE
  const handleRevertToPromote = (studentId: string) => {
    setPromotionDecisions((prev) => ({
      ...prev,
      [studentId]: { action: 'PROMOTE', retentionReason: '' },
    }));
  };

  // Submit toàn bộ kết chuyển
  const handleConfirmExecute = () => {
    // Validate trước khi submit: nếu có retain mà lý do trống
    for (const st of previewList) {
      const dec = promotionDecisions[st.studentId];
      if (dec?.action === 'RETAIN' && (!dec.retentionReason || !dec.retentionReason.trim())) {
        error(`Học sinh ${st.fullName} chưa có lý do giữ lại khối cũ.`);
        return;
      }
    }

    const payload: ExecutePromotionPayload = {
      fromAcademicYearId: fromYearId,
      toAcademicYearId: toYearId,
      promotions: previewList.map((st) => ({
        studentId: st.studentId,
        action: promotionDecisions[st.studentId]?.action || 'PROMOTE',
        retentionReason: promotionDecisions[st.studentId]?.retentionReason || undefined,
      })),
    };

    executeMutation.mutate(payload);
  };

  // Lọc theo từ khóa tìm kiếm
  const filteredList = previewList.filter((s) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return s.fullName.toLowerCase().includes(kw) || s.studentCode.toLowerCase().includes(kw);
  });

  const totalStudents = previewList.length;
  const graduatingCount = previewList.filter((s) => s.graduating && promotionDecisions[s.studentId]?.action === 'PROMOTE').length;
  const promotingCount = previewList.filter((s) => !s.graduating && promotionDecisions[s.studentId]?.action === 'PROMOTE').length;
  const retainedCount = previewList.filter((s) => promotionDecisions[s.studentId]?.action === 'RETAIN').length;

  return (
    <div className="space-y-6">
      {/* 1. THANH CHỌN NIÊN KHÓA & BỘ LỌC KHỐI */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Quy Trình Kết Chuyển Học Sinh Đầu Năm</h2>
              <p className="text-xs text-slate-500">
                Lũy tiến khối theo niên khóa: Nhà trẻ $\rightarrow$ Mầm $\rightarrow$ Chồi $\rightarrow$ Lá $\rightarrow$ Tốt nghiệp
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-bold border border-blue-100">
              <Users className="w-3.5 h-3.5" /> Tổng số: {totalStudents}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
              <ArrowRight className="w-3.5 h-3.5" /> Lên khối: {promotingCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-100">
              <GraduationCap className="w-3.5 h-3.5" /> Tốt nghiệp: {graduatingCount}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-100">
              <RotateCcw className="w-3.5 h-3.5" /> Học lại: {retainedCount}
            </span>
          </div>
        </div>

        {/* Dropdowns Niên khóa */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              1. Niên Khóa Cần Kết Chuyển (Năm Cũ) <span className="text-rose-500">*</span>
            </label>
            <select
              value={fromYearId}
              onChange={(e) => setFromYearId(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition-colors"
            >
              <option value="">-- Chọn năm học cũ --</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>
                  {y.name} {y.status === 'ACTIVE' ? '(Đang hoạt động)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              2. Niên Khóa Tiếp Nhận (Năm Mới) <span className="text-rose-500">*</span>
            </label>
            <select
              value={toYearId}
              onChange={(e) => setToYearId(e.target.value)}
              className="w-full text-sm font-semibold rounded-xl border border-emerald-300 bg-emerald-50/30 p-2.5 text-emerald-950 focus:border-emerald-600 focus:bg-white focus:outline-hidden transition-colors"
            >
              <option value="">-- Chọn năm học mới tiếp nhận --</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id} disabled={y.id === fromYearId}>
                  {y.name} {y.id === fromYearId ? '(Trùng năm cũ)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Tìm kiếm học sinh
            </label>
            <input
              type="text"
              placeholder="Nhập họ tên hoặc mã học sinh..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full text-sm rounded-xl border border-slate-200 p-2.5 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Khối lớp Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {['ALL', 'TODDLER', 'NURSERY', 'KINDERGARTEN', 'PRE_K'].map((gKey) => {
            const isSelected = selectedGrade === gKey;
            return (
              <button
                key={gKey}
                onClick={() => setSelectedGrade(gKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {gKey === 'ALL' ? 'Tất Cả Khối' : GRADE_SHORT[gKey as GradeLevel] || gKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BẢNG DANH SÁCH ĐỀ XUẤT KẾT CHUYỂN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Danh Sách Học Sinh Thuộc Diện Kết Chuyển ({filteredList.length})
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={filteredList.length === 0 || executeMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-sm transition-all"
            >
              {executeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý kết chuyển...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác Nhận Kết Chuyển Toàn Khối
                </>
              )}
            </button>
          </div>
        </div>

        {isLoadingPreview ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin mx-auto text-emerald-600 mb-2" />
            <p className="text-sm font-semibold">Đang tải danh sách học sinh đề xuất kết chuyển...</p>
          </div>
        ) : !fromYearId || !toYearId || fromYearId === toYearId ? (
          <div className="p-12 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">Vui lòng chọn 2 niên khóa khác nhau để lập kế hoạch kết chuyển</p>
            <p className="text-xs text-slate-400 mt-1">Chọn năm học cũ cần kết chuyển và năm học mới tiếp nhận học sinh.</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy học sinh cần kết chuyển trong khối này</p>
            <p className="text-xs text-slate-400 mt-1">Tất cả học sinh có thể đã hoàn tất kết chuyển hoặc không có dữ liệu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-4">Mã HS</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Ngày Sinh</th>
                  <th className="py-3 px-4">Khối Lớp Hiện Tại</th>
                  <th className="py-3 px-4">Lớp Học Hiện Tại</th>
                  <th className="py-3 px-4 text-center">Đề Xuất Kết Chuyển</th>
                  <th className="py-3 px-4 text-center">Quyết Định</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredList.map((st) => {
                  const decision = promotionDecisions[st.studentId] || { action: 'PROMOTE', retentionReason: '' };
                  const isRetain = decision.action === 'RETAIN';

                  return (
                    <tr key={st.studentId} className={`hover:bg-slate-50/80 transition-colors ${isRetain ? 'bg-amber-50/30' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{st.studentCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{st.fullName}</div>
                        <div className="text-[10px] text-slate-400">{st.gender === 'MALE' ? 'Nam' : 'Nữ'}</div>
                      </td>
                      <td className="py-3 px-4">{st.dateOfBirth}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {GRADE_SHORT[st.currentGradeLevel] || st.currentGradeLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{st.currentClassName}</td>
                      
                      {/* Đề xuất kết chuyển */}
                      <td className="py-3 px-4 text-center">
                        {st.graduating ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold border border-purple-200">
                            <GraduationCap className="w-3.5 h-3.5" /> Tốt Nghiệp / Ra Trường
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
                            <ArrowRight className="w-3.5 h-3.5" /> Lên {GRADE_SHORT[st.suggestedGradeLevel as GradeLevel] || st.suggestedGradeLevel}
                          </span>
                        )}
                      </td>

                      {/* Trạng thái quyết định */}
                      <td className="py-3 px-4 text-center">
                        {isRetain ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold border border-amber-300">
                              <RotateCcw className="w-3.5 h-3.5" /> Giữ lại khối cũ
                            </span>
                            <span className="text-[10px] text-amber-700 italic max-w-[150px] truncate mt-0.5" title={decision.retentionReason}>
                              "{decision.retentionReason}"
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                            <Check className="w-3 h-3 text-emerald-600" /> Kết chuyển tự động
                          </span>
                        )}
                      </td>

                      {/* Nút hành động */}
                      <td className="py-3 px-4 text-right">
                        {isRetain ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRetainModal(st)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors"
                            >
                              Sửa lý do
                            </button>
                            <button
                              onClick={() => handleRevertToPromote(st.studentId)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                              title="Hủy giữ lại, chuyển sang lên khối"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenRetainModal(st)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600 hover:text-amber-800 bg-slate-100 hover:bg-amber-100 border border-slate-200 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Giữ lại khối cũ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MODAL NHẬP LÝ DO GIỮ LẠI KHỐI CŨ */}
      {retainModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <RotateCcw className="w-5 h-5" />
                <h3 className="text-base font-extrabold">Giữ Học Sinh Học Lại Khối Cũ</h3>
              </div>
              <button
                onClick={() => setRetainModalStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div>
                  Học sinh: <span className="font-bold">{retainModalStudent.fullName}</span> ({retainModalStudent.studentCode})
                </div>
                <div>
                  Khối hiện tại:{' '}
                  <span className="font-bold">
                    {GRADE_LABELS[retainModalStudent.currentGradeLevel] || retainModalStudent.currentGradeLevel}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  Lý do giữ lại khối cũ theo nguyện vọng gia đình <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={tempReason}
                  onChange={(e) => {
                    setTempReason(e.target.value);
                    if (retainError) setRetainError('');
                  }}
                  placeholder="Ví dụ: Gia đình có nguyện vọng rèn thêm kỹ năng vận động và ngôn ngữ..."
                  className={`w-full text-xs rounded-xl border p-3 focus:outline-hidden transition-colors ${
                    retainError ? 'border-rose-500 bg-rose-50/30' : 'border-slate-300 focus:border-amber-500'
                  }`}
                />
                {retainError && <p className="text-xs text-rose-600 font-bold mt-1.5">{retainError}</p>}
                <p className="text-[11px] text-slate-500 mt-1 italic">
                  * Theo quy tắc BR-009 & Bắt buộc nhập lý do giữ học sinh học lại khối cũ.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRetainModalStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveRetain}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all"
                >
                  Lưu Quyết Định Giữ Lại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL XÁC NHẬN KẾT CHUYỂN TOÀN KHỐI (CONFIRM DIALOG) */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-slate-900">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Xác Nhận Thực Thi Kết Chuyển Đầu Năm</h3>
                <p className="text-xs text-slate-500">Quy tắc nghiệp vụ BR-009 & Thông báo MSG-042</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span>Tổng số học sinh kết chuyển:</span>
                  <span className="text-emerald-700 font-mono text-sm">{totalStudents}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>- Tự động nâng khối (sang Chờ xếp lớp):</span>
                  <span className="font-bold text-emerald-600">{promotingCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>- Tốt nghiệp / Ra trường (GRADUATED):</span>
                  <span className="font-bold text-purple-600">{graduatingCount}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>- Giữ lại khối cũ (có lý do hợp lệ):</span>
                  <span className="font-bold text-amber-600">{retainedCount}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Lưu ý nghiệp vụ:
                </p>
                <p>
                  Toàn bộ học sinh được nâng khối sẽ được reset lớp học cũ (<code className="bg-amber-100 px-1 py-0.5 rounded">class_id = null</code>)
                  và đưa về danh sách <strong>"Chờ xếp lớp (WAITING_PLACEMENT)"</strong> của khối mới trong niên khóa tiếp nhận.
                  Lịch sử kết chuyển sẽ được ghi nhận vào hệ thống.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmExecute}
                  disabled={executeMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-md transition-all"
                >
                  {executeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Đồng Ý & Thực Thi Kết Chuyển
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPromotionTab;
