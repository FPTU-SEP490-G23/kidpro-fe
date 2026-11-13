import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  Briefcase,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { extracurricularAssignmentService } from '../../../services/extracurricularAssignmentService';
import {
  ClubAssignmentDetailResponse,
  AvailableClubTeacherResponse,
  ExtracurricularAssignmentPayload
} from '../../../types/extracurricular.types';

export const ClubAssignmentTab: React.FC = () => {
  // State
  const [classes, setClasses] = useState<ClubAssignmentDetailResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Assignment Modal
  const [selectedClass, setSelectedClass] = useState<ClubAssignmentDetailResponse | null>(null);
  const [teachers, setTeachers] = useState<AvailableClubTeacherResponse[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [leadTeacherId, setLeadTeacherId] = useState<string>('');
  const [assistantTeacherId, setAssistantTeacherId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchClubClasses();
  }, []);

  const fetchClubClasses = async () => {
    try {
      setLoading(true);
      const data = await extracurricularAssignmentService.getClasses();
      setClasses(data);
    } catch (err: any) {
      console.error('Failed to load extracurricular classes:', err);
      showToast('error', 'Không thể tải danh sách lớp câu lạc bộ ngoại khóa');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Open modal & load available teachers
  const handleOpenAssignModal = async (clubClass: ClubAssignmentDetailResponse) => {
    setSelectedClass(clubClass);
    setLeadTeacherId(clubClass.leadTeacherId || '');
    setAssistantTeacherId(clubClass.assistantTeacherId || '');
    setValidationError(null);

    try {
      setLoadingTeachers(true);
      const teacherList = await extracurricularAssignmentService.getAvailableTeachers(clubClass.classId);
      setTeachers(teacherList);
    } catch (err: any) {
      console.error('Failed to load available teachers:', err);
      showToast('error', 'Không thể kiểm tra lịch giáo viên khả dụng');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Handle Submit Assignment
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;

    if (!leadTeacherId) {
      setValidationError('Vui lòng chọn Giáo viên chính (Lead Instructor) phụ trách lớp CLB.');
      return;
    }

    // Frontend pre-check: BR-046 checks
    const selectedLead = teachers.find((t) => t.teacherId === leadTeacherId);
    if (selectedLead) {
      if (!selectedLead.active) {
        setValidationError('Hồ sơ giáo viên đang ở trạng thái Tạm nghỉ hoặc Hết hạn hợp đồng.');
        return;
      }
      if (selectedLead.hasScheduleConflict) {
        setValidationError(
          `Giáo viên được chọn bị trùng lịch dạy chính khóa hoặc lớp Năng khiếu khác. (${selectedLead.conflictDetail || ''})`
        );
        return;
      }
      if (selectedLead.currentClubHours >= selectedLead.maxWeeklyClubHours) {
        setValidationError('Giáo viên đã đạt định mức tiết dạy tối đa trong tuần theo quy chế.');
        return;
      }
    }

    if (assistantTeacherId && assistantTeacherId === leadTeacherId) {
      setValidationError('Trợ giảng không thể trùng với Giáo viên chính.');
      return;
    }

    try {
      setSubmitting(true);
      setValidationError(null);

      const payload: ExtracurricularAssignmentPayload = {
        leadTeacherId,
        assistantTeacherId: assistantTeacherId || undefined
      };

      await extracurricularAssignmentService.assignTeachers(selectedClass.classId, payload);
      showToast('success', 'Phân công giáo viên phụ trách câu lạc bộ thành công.');
      setSelectedClass(null);
      fetchClubClasses();
    } catch (err: any) {
      console.error('Assignment error:', err);
      const msg = err.response?.data?.message || err.message;
      setValidationError(msg || 'Lỗi phân công giáo viên');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered classes
  const filteredClasses = classes.filter((c) => {
    if (activeFilter === 'UNASSIGNED' && c.assigned) return false;
    if (activeFilter === 'ASSIGNED' && !c.assigned) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.subject.toLowerCase().includes(term) ||
        (c.leadTeacherName && c.leadTeacherName.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const unassignedCount = classes.filter((c) => !c.assigned).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner / Action Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Phân công Giáo viên Phụ trách Câu lạc bộ Ngoại khóa
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              BR-046
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Phân công Giáo viên chính & Trợ giảng cho các lớp Năng khiếu/CLB (Vẽ, Võ, Múa, Tiếng Anh). Tự động kiểm soát chống trùng lịch chính khóa và định mức giờ dạy ngoại khóa tối đa.
          </p>
        </div>

        {unassignedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-semibold shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Có {unassignedCount} lớp CLB chưa hoàn tất phân công
          </div>
        )}
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Tất cả các lớp ({classes.length})
          </button>
          <button
            onClick={() => setActiveFilter('UNASSIGNED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'UNASSIGNED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Chưa phân công ({unassignedCount})
          </button>
          <button
            onClick={() => setActiveFilter('ASSIGNED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'ASSIGNED'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            Đã phân công ({classes.length - unassignedCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên CLB, môn, giáo viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Class Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
          Đang tải danh sách lớp câu lạc bộ...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          Không tìm thấy lớp câu lạc bộ nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((item) => (
            <div
              key={item.classId}
              className="bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-md rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.subject}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.assigned
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.assigned ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Đã phân công
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Chờ phân công
                      </>
                    )}
                  </span>
                </div>

                {/* Class Title */}
                <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </h3>

                {/* Schedule info */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Thứ trong tuần: <strong className="text-slate-900">{item.dayOfWeek}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Khung giờ: <strong className="text-slate-900">{item.startTime} - {item.endTime}</strong></span>
                  </div>
                </div>

                {/* Assigned Teachers */}
                <div className="space-y-2 mb-5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Đội ngũ phụ trách:
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Giáo viên chính:</span>
                    <span className="font-semibold text-slate-900">
                      {item.leadTeacherName || <span className="text-amber-600 italic">Chưa chỉ định</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Trợ giảng:</span>
                    <span className="font-medium text-slate-700">
                      {item.assistantTeacherName || <span className="text-slate-400 italic">Không có</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleOpenAssignModal(item)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                {item.assigned ? 'Thay đổi phân công' : 'Phân công giáo viên'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Phân công Giáo viên */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  Phân công Giáo viên Phụ trách CLB
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Lớp: <strong className="text-slate-800">{selectedClass.name}</strong> • Lịch:{' '}
                  <strong className="text-slate-800">{selectedClass.dayOfWeek} ({selectedClass.startTime} - {selectedClass.endTime})</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
              {/* Validation alert */}
              {validationError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>{validationError}</div>
                </div>
              )}

              {loadingTeachers ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                  Đang kiểm tra xung đột thời khóa biểu giáo viên...
                </div>
              ) : (
                <>
                  {/* Lead Teacher Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Giáo viên chính (Lead Instructor) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={leadTeacherId}
                      onChange={(e) => {
                        setLeadTeacherId(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      required
                    >
                      <option value="">-- Chọn Giáo viên chính --</option>
                      {teachers.map((t) => (
                        <option
                          key={t.teacherId}
                          value={t.teacherId}
                          disabled={!t.active || t.hasScheduleConflict || t.currentClubHours >= t.maxWeeklyClubHours}
                        >
                          {t.fullName} {t.role ? `(${t.role})` : ''} - {t.currentClubHours}/{t.maxWeeklyClubHours} giờ/tuần
                          {!t.active
                            ? ' [TẠM NGHỈ]'
                            : t.hasScheduleConflict
                            ? ` [TRÙNG LỊCH: ${t.conflictDetail || ''}]`
                            : t.currentClubHours >= t.maxWeeklyClubHours
                            ? ' [HẾT ĐỊNH MỨC]'
                            : ' [KHẢ DỤNG]'}
                        </option>
                      ))}
                    </select>

                    {/* Quick status display for selected lead teacher */}
                    {leadTeacherId && (() => {
                      const selectedLead = teachers.find((t) => t.teacherId === leadTeacherId);
                      if (!selectedLead) return null;
                      return (
                        <div className="mt-2 text-xs space-y-1">
                          {selectedLead.hasScheduleConflict && (
                            <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                              <AlertTriangle className="w-4 h-4" />
                              Cảnh báo: Trùng lịch ({selectedLead.conflictDetail})
                            </div>
                          )}
                          {selectedLead.currentClubHours >= selectedLead.maxWeeklyClubHours && (
                            <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                              <Clock className="w-4 h-4" />
                              Định mức giờ dạy ngoại khóa: Đã đạt trần {selectedLead.maxWeeklyClubHours}h/tuần
                            </div>
                          )}
                          {!selectedLead.hasScheduleConflict && selectedLead.currentClubHours < selectedLead.maxWeeklyClubHours && (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Giáo viên hợp lệ: Khả dụng {selectedLead.maxWeeklyClubHours - selectedLead.currentClubHours} giờ ngoại khóa
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Assistant Teacher Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Trợ giảng (Teaching Assistant) <span className="text-slate-400 font-normal">(Tùy chọn)</span>
                    </label>
                    <select
                      value={assistantTeacherId}
                      onChange={(e) => {
                        setAssistantTeacherId(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    >
                      <option value="">-- Không có trợ giảng --</option>
                      {teachers
                        .filter((t) => t.teacherId !== leadTeacherId)
                        .map((t) => (
                          <option key={t.teacherId} value={t.teacherId}>
                            {t.fullName} {t.role ? `(${t.role})` : ''} - {t.currentClubHours}/{t.maxWeeklyClubHours}h
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedClass(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingTeachers}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  {submitting ? 'Đang lưu...' : 'Lưu phân công'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
