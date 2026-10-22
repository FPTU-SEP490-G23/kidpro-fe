import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import lessonPlanApprovalApi, {
  LessonPlanApprovalDto,
} from '../../api/lessonPlanApprovalApi';
import classApprovalApi, { ClassApprovalItem } from '../../api/classApprovalApi';

export const BghLessonPlanApprovalsPage: React.FC = () => {
  const [plans, setPlans] = useState<LessonPlanApprovalDto[]>([]);
  const [classes, setClasses] = useState<ClassApprovalItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [weekNumber, setWeekNumber] = useState<number>(42);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Detail & Modals
  const [selectedPlan, setSelectedPlan] = useState<LessonPlanApprovalDto | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState<boolean>(false);
  const [actionPlan, setActionPlan] = useState<LessonPlanApprovalDto | null>(null);
  const [note, setNote] = useState<string>('');
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Alert toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await classApprovalApi.getApprovals('ALL');
      setClasses(Array.isArray(res) ? res : ((res as any)?.data || []));
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await lessonPlanApprovalApi.getLessonPlans({
        classId: selectedClassId || undefined,
        weekNumber: weekNumber || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      const data = Array.isArray(res) ? res : ((res as any)?.data || []);
      setPlans(data);
      if (data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0]);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách giáo án:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [selectedClassId, weekNumber, statusFilter]);

  const handleApprove = async () => {
    if (!actionPlan) return;
    try {
      setSubmitting(true);
      const res = await lessonPlanApprovalApi.approve(actionPlan.id, note);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Kế hoạch giáo án đã được thẩm định và phê duyệt thành công. Lịch hoạt động học tập đã được ban hành (MSG-270).',
      });
      setApproveModalOpen(false);
      setNote('');
      fetchPlans();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err?.response?.data?.message || 'Lỗi khi phê duyệt giáo án.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!actionPlan) return;
    if (!revisionReason.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-272: Vui lòng nhập đầy đủ nội dung góp ý chuyên môn hoặc yêu cầu điều chỉnh khi trả lại giáo án.',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await lessonPlanApprovalApi.requestRevision(actionPlan.id, revisionReason.trim());
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã gửi yêu cầu chỉnh sửa bài giảng tới giáo viên bộ môn thành công.',
      });
      setRevisionModalOpen(false);
      setRevisionReason('');
      fetchPlans();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: err?.response?.data?.message || 'Lỗi khi yêu cầu chỉnh sửa.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                [UC-077] Phê Duyệt Kế Hoạch Giáo Án Tháng / Tuần
              </h1>
              <p className="text-sm text-slate-500">
                Thẩm tra mục tiêu đào tạo, hoạt động giảng dạy, giáo cụ sư phạm và ban hành lịch học tập (BR-114, BR-115)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPlans}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Alert toast */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            >
              <option value="">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className} ({cls.gradeLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Tuần:</span>
            <input
              type="number"
              min={1}
              max={52}
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
              className="w-16 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chờ BGH duyệt</option>
              <option value="APPROVED">Đã phê duyệt</option>
              <option value="REVISION_REQUESTED">Cần chỉnh sửa</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Tổng số: <strong>{plans.length}</strong> giáo án tuần
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lesson Plan List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-800 text-sm">Danh Sách Giáo Án Chờ Phê Duyệt</h2>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">Đang tải giáo án...</div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">Không tìm thấy giáo án nào</div>
            ) : (
              plans.map((p) => {
                const isSelected = selectedPlan?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#275A4E] bg-[#275A4E]/5 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-800">{p.className}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'REVISION_REQUESTED'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.status === 'APPROVED'
                          ? 'Đã Duyệt'
                          : p.status === 'REVISION_REQUESTED'
                          ? 'Cần Sửa'
                          : 'Chờ Duyệt'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 line-clamp-1">{p.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{p.topic}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>GV: {p.teacherName}</span>
                      <span>Tuần {p.weekNumber}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Lesson Plan Detail */}
        <div className="lg:col-span-2">
          {selectedPlan ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#275A4E]/10 text-[#275A4E]">
                      {selectedPlan.className}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Mã: {selectedPlan.id}</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mt-1">{selectedPlan.title}</h2>
                  <p className="text-xs text-slate-500">{selectedPlan.topic} • GV: {selectedPlan.teacherName}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedPlan.status !== 'APPROVED' ? (
                    <>
                      <button
                        onClick={() => {
                          setActionPlan(selectedPlan);
                          setApproveModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#275A4E] text-white rounded-xl text-xs font-bold hover:bg-[#1E4D40] transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Phê Duyệt Giáo Án
                      </button>
                      <button
                        onClick={() => {
                          setActionPlan(selectedPlan);
                          setRevisionModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Yêu Cầu Chỉnh Sửa
                      </button>
                    </>
                  ) : (
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      Đã Thẩm Định & Ban Hành
                    </span>
                  )}
                </div>
              </div>

              {selectedPlan.reviewNotes && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <span className="font-bold">Ý kiến chỉ đạo chuyên môn của BGH: </span>
                  {selectedPlan.reviewNotes}
                </div>
              )}

              {/* Detail Content Blocks */}
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-[#275A4E] flex items-center gap-1.5 text-xs">
                    <BookOpen className="w-4 h-4" />
                    1. Mục Tiêu Đào Tạo (Kiến Thức - Kỹ Năng - Thái Độ)
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedPlan.objectives}</p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-[#275A4E] flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4" />
                    2. Nội Dung Hoạt Động & Tiến Trình Giảng Dạy
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedPlan.activities}</p>
                </div>

                <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-[#275A4E] flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4" />
                    3. Giáo Cụ & Phương Tiện Dạy Học
                  </h3>
                  <p className="text-slate-700 leading-relaxed">{selectedPlan.materials}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                <span>Ngày nộp: {selectedPlan.submittedDate}</span>
                <span>Hạn chót thẩm định: {selectedPlan.deadlineDate} (BR-114)</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-400">
              Vui lòng chọn một giáo án để thẩm định nội dung
            </div>
          )}
        </div>
      </div>

      {/* Modal Phê Duyệt */}
      {approveModalOpen && actionPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Phê Duyệt Kế Hoạch Giáo Án: {actionPlan.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định <strong>BR-114</strong>, sau khi Ban Giám hiệu ký duyệt, lịch hoạt động học tập tuần của lớp sẽ chính thức công bố trên Sổ liên lạc điện tử cho Phụ huynh theo dõi.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Ghi chú chỉ đạo sư phạm (Tùy chọn)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú cho giáo viên đứng lớp..."
                rows={3}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
              >
                {submitting ? 'Đang duyệt...' : 'Đồng Ý Phê Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Chỉnh Sửa */}
      {revisionModalOpen && actionPlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-700">
              Yêu Cầu Chỉnh Sửa Giáo Án: {actionPlan.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định <strong>BR-115</strong>, Ban Giám hiệu bắt buộc phải nêu rõ phần chưa đạt (Mục tiêu, Kỹ năng, Hoạt động, Giáo cụ) để giáo viên hoàn thiện trước khi lên lớp.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nội dung yêu cầu điều chỉnh <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
                placeholder="Ví dụ: Cần bổ sung giáo cụ trực quan an toàn; Hoạt động ngoài trời cần phương án dự phòng thời tiết..."
                rows={4}
                className="w-full text-sm p-3 border border-rose-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRevisionModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
              >
                {submitting ? 'Đang gửi...' : 'Gửi Yêu Cầu Sửa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghLessonPlanApprovalsPage;
