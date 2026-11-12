import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
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
  Users,
  Eye,
  Award,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import developmentEvaluationApi, {
  DevelopmentEvaluationDto,
} from '../../api/developmentEvaluationApi';
import classApprovalApi, { ClassApprovalItem } from '../../api/classApprovalApi';
import { formatGradeLevel } from '../../utils/formatters';

export const BghEvaluationApprovalsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<DevelopmentEvaluationDto[]>([]);
  const [classes, setClasses] = useState<ClassApprovalItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [period, setPeriod] = useState<string>('Tháng 10/2026');
  const [loading, setLoading] = useState<boolean>(true);

  // Detail & Action Modals
  const [selectedEval, setSelectedEval] = useState<DevelopmentEvaluationDto | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [actionEval, setActionEval] = useState<DevelopmentEvaluationDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Alert toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchClasses = async () => {
    try {
      const res = await classApprovalApi.getApprovals('ALL');
      const data = Array.isArray(res) ? res : ((res as any)?.data || []);
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].classId);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp:', err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const res = await developmentEvaluationApi.getEvaluations({
        classId: selectedClassId || undefined,
        period: period || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setEvaluations(Array.isArray(res) ? res : ((res as any)?.data || []));
    } catch (err) {
      console.error('Lỗi khi tải danh sách đánh giá trẻ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchEvaluations();
  }, [selectedClassId, statusFilter, period]);

  const handleApprove = async (ev: DevelopmentEvaluationDto) => {
    try {
      const res = await developmentEvaluationApi.approve(ev.evaluationId);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Phiếu đánh giá sự phát triển của trẻ đã được phê duyệt và công bố thành công lên Sổ liên lạc điện tử (MSG-251).',
      });
      fetchEvaluations();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt đánh giá.',
      });
    }
  };

  const handleBatchApprove = async () => {
    try {
      setSubmitting(true);
      const res = await developmentEvaluationApi.batchApprove({
        classId: selectedClassId,
        period: period,
      });
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã phê duyệt toàn bộ phiếu đánh giá của lớp thành công và công bố cho phụ huynh.',
      });
      fetchEvaluations();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Lỗi khi duyệt hàng loạt phiếu đánh giá.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!actionEval) return;
    if (!rejectReason.trim()) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-253: Vui lòng nhập đầy đủ lý do và định hướng chỉnh sửa nhận xét sư phạm khi từ chối phê duyệt.',
      });
      return;
    }
    try {
      setSubmitting(true);
      const res = await developmentEvaluationApi.reject(actionEval.evaluationId, rejectReason.trim());
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã gửi yêu cầu chỉnh sửa nhận xét sư phạm tới Giáo viên chủ nhiệm thành công.',
      });
      setRejectModalOpen(false);
      setRejectReason('');
      fetchEvaluations();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Lỗi khi từ chối phiếu đánh giá.' });
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
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                [UC-072] Phê Duyệt Phiếu Đánh Giá Trẻ Định Kỳ
              </h1>
              <p className="text-sm text-slate-500">
                Thẩm định nhận xét chuẩn mực sư phạm 5 lĩnh vực phát triển theo Thông tư Bộ GD&ĐT & công bố Sổ liên lạc điện tử (BR-103, BR-104)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBatchApprove}
            disabled={evaluations.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40] transition-colors shadow-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Duyệt Cả Lớp & Công Bố
          </button>
          <button
            onClick={fetchEvaluations}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
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
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Lớp học:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            >
              {classes.map((cls) => (
                <option key={cls.classId} value={cls.classId}>
                  {cls.className} ({formatGradeLevel(cls.gradeLevel)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Kỳ đánh giá:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700"
            >
              <option value="Tháng 10/2026">Tháng 10/2026</option>
              <option value="Học kỳ 1">Học kỳ 1 (2025-2026)</option>
              <option value="Học kỳ 2">Học kỳ 2 (2025-2026)</option>
            </select>
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
              <option value="NEEDS_REVISION">Cần chỉnh sửa</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị <strong>{evaluations.length}</strong> phiếu đánh giá
        </div>
      </div>

      {/* Evaluations Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Mã & Họ Tên Trẻ</th>
                <th className="px-6 py-4">Lớp Học</th>
                <th className="px-6 py-4">Giáo Viên Nhận Xét</th>
                <th className="px-6 py-4">5 Lĩnh Vực Phát Triển (Tóm Tắt)</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Đang tải danh sách phiếu đánh giá...
                  </td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Không có phiếu đánh giá nào trong điều kiện lọc này
                  </td>
                </tr>
              ) : (
                evaluations.map((ev) => (
                  <tr key={ev.evaluationId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 block">{ev.studentName}</span>
                      <span className="text-slate-400 font-mono">{ev.studentCode}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{ev.className}</td>
                    <td className="px-6 py-4 text-slate-700">{ev.teacherName}</td>
                    <td className="px-6 py-4 max-w-xs text-slate-600 truncate">
                      <span className="block truncate font-medium">TC: {ev.physicalScore}</span>
                      <span className="block truncate text-slate-400">NT: {ev.cognitiveScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      {ev.status === 'APPROVED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Đã Phê Duyệt
                        </span>
                      ) : ev.status === 'NEEDS_REVISION' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                          Cần Chỉnh Sửa
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                          Chờ BGH Duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedEval(ev);
                            setDetailModalOpen(true);
                          }}
                          className="p-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"
                          title="Xem chi tiết 5 lĩnh vực"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {ev.status !== 'APPROVED' && (
                          <>
                            <button
                              onClick={() => handleApprove(ev)}
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              title="Phê duyệt ngay"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActionEval(ev);
                                setRejectModalOpen(true);
                              }}
                              className="p-1.5 border border-rose-300 text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Yêu cầu sửa nhận xét"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Xem Chi Tiết 5 Lĩnh Vực Phát Triển */}
      {detailModalOpen && selectedEval && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Phiếu Đánh Giá: {selectedEval.studentName} ({selectedEval.studentCode})
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp: {selectedEval.className} • Kỳ: {selectedEval.evaluationPeriod} • GV: {selectedEval.teacherName}
                </p>
              </div>
              <button onClick={() => setDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#275A4E] block">1. Lĩnh Vực Phát Triển Thể Chất:</span>
                <p className="text-slate-700 leading-relaxed">{selectedEval.physicalScore}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#275A4E] block">2. Lĩnh Vực Phát Triển Nhận Thức:</span>
                <p className="text-slate-700 leading-relaxed">{selectedEval.cognitiveScore}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#275A4E] block">3. Lĩnh Vực Phát Triển Ngôn Ngữ:</span>
                <p className="text-slate-700 leading-relaxed">{selectedEval.languageScore}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#275A4E] block">4. Lĩnh Vực Tình Cảm & Kỹ Năng Xã Hội:</span>
                <p className="text-slate-700 leading-relaxed">{selectedEval.socialEmotionalScore}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="font-bold text-[#275A4E] block">5. Lĩnh Vực Phát Triển Thẩm Mỹ:</span>
                <p className="text-slate-700 leading-relaxed">{selectedEval.aestheticScore}</p>
              </div>

              {selectedEval.reviewNote && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="font-bold block">Góp ý chỉnh sửa của Ban Giám hiệu:</span>
                  <p>{selectedEval.reviewNote}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Đóng
              </button>
              {selectedEval.status !== 'APPROVED' && (
                <button
                  onClick={() => {
                    handleApprove(selectedEval);
                    setDetailModalOpen(false);
                  }}
                  className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
                >
                  Phê Duyệt Ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Chỉnh Sửa */}
      {rejectModalOpen && actionEval && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-rose-700">
              Yêu Cầu Chỉnh Sửa Nhận Xét Sư Phạm
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định <strong>BR-103 & BR-104</strong>, lời nhận xét phải tích cực, mang tính xây dựng. Vui lòng nêu rõ định hướng điều chỉnh cho Giáo viên chủ nhiệm.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nội dung góp ý & Định hướng sư phạm <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Cần điều chỉnh từ ngữ mang tính động viên; Cụ thể hóa kỹ năng vận động tinh của trẻ..."
                rows={4}
                className="w-full text-sm p-3 border border-rose-200 rounded-xl focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleReject}
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

export default BghEvaluationApprovalsPage;
