import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, X, Loader2, AlertCircle } from 'lucide-react';
import {
  BusItem,
  TeacherOption,
  TeacherBusAssignmentRequest,
  TeacherBusAssignmentItem,
  ShiftType,
} from '../../../types/bus.types';

interface Props {
  isOpen: boolean;
  buses: BusItem[];
  teachers: TeacherOption[];
  preselectedBusId?: string;
  existingAssignments?: TeacherBusAssignmentItem[];
  onClose: () => void;
  onSubmit: (data: TeacherBusAssignmentRequest) => Promise<void>;
}

export const AssignTeacherModal: React.FC<Props> = ({
  isOpen,
  buses,
  teachers,
  preselectedBusId,
  existingAssignments = [],
  onClose,
  onSubmit,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [busId, setBusId] = useState(preselectedBusId || (buses[0]?.busId || ''));
  const [staffId, setStaffId] = useState(teachers[0]?.staffId || '');
  const [assignedDate, setAssignedDate] = useState(todayStr);
  const [shiftType, setShiftType] = useState<ShiftType>('TWO_WAY');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shiftConflict = useMemo(() => {
    if (!staffId || !assignedDate || !existingAssignments || existingAssignments.length === 0) return null;
    const sameTeacherAndDate = existingAssignments.filter(
      (a) => a.staffId === staffId && a.assignedDate === assignedDate
    );
    for (const a of sameTeacherAndDate) {
      if (a.shiftType === 'TWO_WAY') {
        return `Giáo viên này đã được phân công Cả 2 chiều trên xe buýt ${a.busNumber} vào ngày ${assignedDate}. Không thể phân công thêm xe khác.`;
      }
      if (shiftType === 'TWO_WAY') {
        const sName = (a.shiftType as any) === 'MORNING' || a.shiftType === 'MORNING_ONLY' ? 'Chiều đón buổi sáng' : 'Chiều trả buổi chiều';
        return `Giáo viên này đã có ca trực (${sName}) trên xe buýt ${a.busNumber} vào ngày ${assignedDate}. Không thể phân công Cả 2 chiều.`;
      }
      if (a.shiftType === shiftType) {
        const sName = shiftType === 'MORNING_ONLY' ? 'Chiều đón buổi sáng' : 'Chiều trả buổi chiều';
        return `Giáo viên này đã phụ trách ca (${sName}) trên xe buýt ${a.busNumber} vào ngày ${assignedDate}. Một giáo viên chỉ được quản lý 1 xe buýt tại cùng một thời điểm.`;
      }
    }
    return null;
  }, [staffId, assignedDate, shiftType, existingAssignments]);

  useEffect(() => {
    if (preselectedBusId) {
      setBusId(preselectedBusId);
    } else if (buses.length > 0 && !busId) {
      setBusId(buses[0].busId);
    }
  }, [preselectedBusId, buses]);

  useEffect(() => {
    if (teachers.length > 0 && !staffId) {
      setStaffId(teachers[0].staffId);
    }
  }, [teachers]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId) {
      setErrorMsg('Vui lòng chọn xe buýt.');
      return;
    }
    if (!staffId) {
      setErrorMsg('Vui lòng chọn giáo viên phụ trách.');
      return;
    }
    if (!assignedDate) {
      setErrorMsg('Vui lòng chọn ngày phân công.');
      return;
    }
    if (shiftConflict) {
      setErrorMsg(shiftConflict);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmit({
        busId,
        staffId,
        assignedDate,
        shiftType,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể phân công giáo viên');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Phân Công Giáo Viên Đi Xe Buýt</h3>
            <p className="text-xs text-slate-500">Chỉ định giáo viên quản lý học sinh và chốt an toàn</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="mb-4 rounded-xl bg-blue-50/70 p-3 text-xs text-blue-800 border border-blue-200 flex items-start gap-2">
          <span className="font-bold text-blue-900 shrink-0">Lưu ý phân ca:</span>
          <span>
            Một giáo viên chỉ phụ trách 1 xe tại một thời điểm. Nếu giáo viên phụ trách <strong>Cả 2 chiều</strong> thì không thể nhận xe khác. Giáo viên có thể trực ca <strong>Sáng</strong> trên xe này và ca <strong>Chiều</strong> trên xe khác trong cùng ngày.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chọn Tuyến Xe Buýt *
            </label>
            <select
              required
              value={busId}
              onChange={(e) => setBusId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            >
              {buses.map((b) => (
                <option key={b.busId} value={b.busId}>
                  {b.busNumber} - Tài xế: {b.driverName} ({b.startLocation} ➔ {b.endLocation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Chọn Giáo Viên Phụ Trách *
            </label>
            <select
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.staffId} value={t.staffId}>
                  {t.fullName} ({t.staffCode}) {t.phoneNumber ? `- SĐT: ${t.phoneNumber}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ngày phân công *
              </label>
              <input
                type="date"
                required
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ca đưa đón *
              </label>
              <select
                required
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as ShiftType)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              >
                <option value="TWO_WAY">Cả 2 chiều (Đón & Trả)</option>
                <option value="MORNING_ONLY">Chiều đón buổi sáng</option>
                <option value="AFTERNOON_ONLY">Chiều trả buổi chiều</option>
              </select>
            </div>
          </div>

          {shiftConflict && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{shiftConflict}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Ghi chú nhiệm vụ (Tùy chọn)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Nhắc nhở phụ huynh chuẩn bị đồ dùng cá nhân..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!shiftConflict}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-900/10 hover:bg-[#1E4D40] transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang phân công...</span>
                </>
              ) : (
                <span>Lưu Phân Công</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

