import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  DollarSign,
  User,
  Power,
  RefreshCw,
  X,
  Layers,
  Edit3,
} from 'lucide-react';
import extracurricularApi, {
  ExtracurricularClassDto,
  ExtracurricularClassCreatePayload,
  ExtracurricularClassUpdatePayload,
} from '../../api/extracurricularApi';
import { facilityClassroomApi, FacilityClassroom } from '../../api/facilityClassroomApi';
import academicYearApi from '../../api/academicYearApi';
import { busManagementApi } from '../../api/busManagementApi';
import { TeacherOption } from '../../types/bus.types';
import type { AcademicYear } from '../../types/academicYear.types';

const CLUB_DAYS = [
  { value: '2', label: 'Thứ 2' },
  { value: '3', label: 'Thứ 3' },
  { value: '4', label: 'Thứ 4' },
  { value: '5', label: 'Thứ 5' },
  { value: '6', label: 'Thứ 6' },
  { value: '7', label: 'Thứ 7' },
  { value: 'SUNDAY', label: 'Chủ nhật' },
];

const toScheduleDescription = (days: string[], startTime: string, endTime: string): string => {
  const dayLabels = CLUB_DAYS.filter((day) => days.includes(day.value)).map((day) => day.label);
  return `${dayLabels.join(', ')} (${startTime} - ${endTime})`;
};

const parseScheduleDescription = (value: string) => {
  const dayValues: Record<string, string> = {
    '2': '2', hai: '2', '3': '3', ba: '3', '4': '4', tư: '4', bốn: '4',
    '5': '5', năm: '5', '6': '6', sáu: '6', '7': '7', bảy: '7',
  };
  const days = new Set<string>();
  const dayPattern = /thứ\s*(2|3|4|5|6|7|hai|ba|tư|bốn|năm|sáu|bảy)/gi;
  let dayMatch: RegExpExecArray | null;
  while ((dayMatch = dayPattern.exec(value)) !== null) {
    const day = dayValues[dayMatch[1].toLowerCase()];
    if (day) days.add(day);
  }
  if (/chủ\s*nhật/i.test(value)) days.add('SUNDAY');

  const timeMatch = value.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  return {
    days: CLUB_DAYS.filter((day) => days.has(day.value)).map((day) => day.value),
    startTime: timeMatch?.[1] || '16:00',
    endTime: timeMatch?.[2] || '17:00',
  };
};

interface ScheduleEditorProps {
  days: string[];
  onDaysChange: (days: string[]) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
}

const ScheduleEditor: React.FC<ScheduleEditorProps> = ({
  days,
  onDaysChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
}) => (
  <>
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">
        Thứ học <span className="text-rose-500">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {CLUB_DAYS.map((day) => (
          <label key={day.value} className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs">
            <input
              type="checkbox"
              checked={days.includes(day.value)}
              onChange={(event) => onDaysChange(
                event.target.checked
                  ? [...days, day.value]
                  : days.filter((value) => value !== day.value)
              )}
            />
            {day.label}
          </label>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Giờ bắt đầu <span className="text-rose-500">*</span>
        </label>
        <input
          type="time"
          required
          value={startTime}
          onChange={(event) => onStartTimeChange(event.target.value)}
          className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-700 block mb-1">
          Giờ kết thúc <span className="text-rose-500">*</span>
        </label>
        <input
          type="time"
          required
          value={endTime}
          onChange={(event) => onEndTimeChange(event.target.value)}
          className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
        />
      </div>
    </div>
  </>
);

export const BghExtracurricularClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ExtracurricularClassDto[]>([]);
  const [classrooms, setClassrooms] = useState<FacilityClassroom[]>([]);
  const [activeAcademicYear, setActiveAcademicYear] = useState<AcademicYear | null>(null);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Create
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ExtracurricularClassCreatePayload>({
    className: '',
    academicYearId: '',
    classroomId: '',
    scheduleDescription: '',
    maxCapacity: 20,
    externalInstructorName: '',
    tuitionFee: 500000,
  });
  const [createScheduleDays, setCreateScheduleDays] = useState<string[]>([]);
  const [createScheduleStart, setCreateScheduleStart] = useState('16:30');
  const [createScheduleEnd, setCreateScheduleEnd] = useState('17:30');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Full Edit Class
  const [editingClass, setEditingClass] = useState<ExtracurricularClassDto | null>(null);
  const [editFormData, setEditFormData] = useState<ExtracurricularClassUpdatePayload>({
    className: '',
    classroomId: '',
    scheduleDescription: '',
    maxCapacity: 20,
    externalInstructorName: '',
    tuitionFee: 500000,
  });
  const [editScheduleDays, setEditScheduleDays] = useState<string[]>([]);
  const [editScheduleStart, setEditScheduleStart] = useState('16:30');
  const [editScheduleEnd, setEditScheduleEnd] = useState('17:30');
  const [updating, setUpdating] = useState<boolean>(false);

  // Toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, roomRes, activeYear, teachersRes] = await Promise.all([
        extracurricularApi.getClasses(),
        facilityClassroomApi.getAllClassrooms(),
        academicYearApi.getActiveAcademicYear(),
        busManagementApi.getTeacherOptions(),
      ]);
      setClasses(Array.isArray(clsRes) ? clsRes : ((clsRes as any)?.data || []));
      setClassrooms(roomRes || []);
      setActiveAcademicYear(activeYear);
      setFormData((prev) => ({ ...prev, academicYearId: activeYear?.id || '' }));
      setTeachers(Array.isArray(teachersRes) ? teachersRes : []);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu CLB ngoại khóa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      setAlertInfo({ type: 'error', message: 'Vui lòng nhập tên lớp câu lạc bộ năng khiếu.' });
      return;
    }
    if (!activeAcademicYear?.id) {
      setAlertInfo({ type: 'error', message: 'Chưa có năm học đang hoạt động (is_active = true, status = ACTIVE).' });
      return;
    }
    if (createScheduleDays.length === 0 || !createScheduleStart || !createScheduleEnd || createScheduleStart >= createScheduleEnd) {
      setAlertInfo({ type: 'error', message: 'Vui lòng chọn thứ học và khung giờ hợp lệ.' });
      return;
    }
    if (formData.maxCapacity < 10 || formData.maxCapacity > 30) {
      setAlertInfo({
        type: 'error',
        message: 'Sĩ số tối đa vượt quá quy chuẩn phòng học chức năng (tối đa không quá 30 trẻ/lớp).',
      });
      return;
    }
    if (formData.tuitionFee <= 0) {
      setAlertInfo({
        type: 'error',
        message: 'Mức học phí câu lạc bộ năng khiếu phải lớn hơn 0 VNĐ.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: ExtracurricularClassCreatePayload = {
        ...formData,
        academicYearId: activeAcademicYear.id,
        scheduleDescription: toScheduleDescription(createScheduleDays, createScheduleStart, createScheduleEnd),
        classroomId: formData.classroomId && formData.classroomId.trim() !== '' ? formData.classroomId : undefined,
      };
      const res = await extracurricularApi.createAndApproveClass(payload);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Lớp câu lạc bộ năng khiếu ngoại khóa đã được phê duyệt mở thành công và kích hoạt nhận đăng ký.',
      });
      setCreateModalOpen(false);
      setFormData({
        className: '',
        academicYearId: activeAcademicYear.id,
        classroomId: '',
        scheduleDescription: '',
        maxCapacity: 20,
        externalInstructorName: '',
        tuitionFee: 500000,
      });
      setCreateScheduleDays([]);
      setCreateScheduleStart('16:30');
      setCreateScheduleEnd('17:30');
      fetchData();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Lỗi khi khởi tạo lớp câu lạc bộ ngoại khóa.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await extracurricularApi.toggleStatus(id);
      fetchData();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Lỗi đổi trạng thái mở đăng ký.' });
    }
  };

  const handleOpenEditModal = (cls: ExtracurricularClassDto) => {
    setEditingClass(cls);
    const schedule = parseScheduleDescription(cls.scheduleDescription || '');
    setEditScheduleDays(schedule.days);
    setEditScheduleStart(schedule.startTime);
    setEditScheduleEnd(schedule.endTime);
    setEditFormData({
      className: cls.className || '',
      classroomId: cls.classroomId || '',
      scheduleDescription: cls.scheduleDescription || '',
      maxCapacity: cls.maxCapacity || 20,
      externalInstructorName: cls.externalInstructorName || '',
      tuitionFee: cls.tuitionFee || 500000,
    });
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    if (!editFormData.className.trim()) {
      setAlertInfo({ type: 'error', message: 'Vui lòng nhập tên lớp câu lạc bộ.' });
      return;
    }
    if (editScheduleDays.length === 0 || !editScheduleStart || !editScheduleEnd || editScheduleStart >= editScheduleEnd) {
      setAlertInfo({ type: 'error', message: 'Vui lòng chọn thứ học và khung giờ hợp lệ.' });
      return;
    }
    if (editFormData.maxCapacity < 10 || editFormData.maxCapacity > 30) {
      setAlertInfo({
        type: 'error',
        message: 'Sĩ số tối đa vượt quá quy chuẩn phòng học chức năng (10 - 30 trẻ/lớp).',
      });
      return;
    }
    if (editFormData.tuitionFee <= 0) {
      setAlertInfo({ type: 'error', message: 'Mức học phí phải lớn hơn 0 VNĐ.' });
      return;
    }

    try {
      setUpdating(true);
      const payload: ExtracurricularClassUpdatePayload = {
        ...editFormData,
        scheduleDescription: toScheduleDescription(editScheduleDays, editScheduleStart, editScheduleEnd),
        classroomId: editFormData.classroomId && editFormData.classroomId.trim() !== '' ? editFormData.classroomId : undefined,
      };
      await extracurricularApi.updateClass(editingClass.extracurricularClassId, payload);
      setAlertInfo({ type: 'success', message: 'Cập nhật thông tin lớp câu lạc bộ ngoại khóa thành công.' });
      setEditingClass(null);
      fetchData();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Lỗi khi cập nhật thông tin lớp ngoại khóa.',
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertInfo && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#1E4D40] text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ban Giám Hiệu • Phê Duyệt Mở Lớp & Quản Trị CLB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Quản Lý & Phê Duyệt Lớp Ngoại Khóa
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
            Khởi tạo & phê duyệt các lớp năng khiếu (Vẽ, Võ, Múa, Tiếng Anh, STEAM), cấu hình biểu phí học phí và kích hoạt nhận đăng ký trực tuyến.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/10"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-3 bg-[#E5A93C] hover:bg-[#d6982b] text-slate-900 font-bold rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm Lớp Năng Khiếu</span>
          </button>
        </div>
      </div>

      {/* Grid Danh Sách Lớp Ngoại Khóa */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 text-[#275A4E] animate-spin" />
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Chưa có lớp câu lạc bộ ngoại khóa nào</h3>
          <p className="text-sm text-slate-500 mt-1">
            Bấm nút "Thêm Lớp Năng Khiếu" để khởi tạo và phê duyệt mở lớp mới.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div
              key={cls.extracurricularClassId}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{cls.className}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cls.academicYearName || 'Niên khóa hiện hành'}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      cls.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cls.isActive ? 'Đang mở đăng ký' : 'Tạm ngừng'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">Phòng:</span>
                    <span>{cls.classroomName || 'Chưa bố trí'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">Lịch học:</span>
                    <span>{cls.scheduleDescription}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">Sĩ số tối đa:</span>
                    <span className="font-bold text-slate-800">{cls.maxCapacity} trẻ</span>
                    <span className="text-[10px] text-slate-400">(BR-090: 10-30 trẻ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">Giáo viên/HLV:</span>
                    <span>{cls.externalInstructorName || 'Chưa chỉ định'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <DollarSign className="w-4 h-4 text-[#275A4E]" /> Học phí / Tháng:
                  </span>
                  <span className="font-extrabold text-sm text-[#275A4E]">{formatVND(cls.tuitionFee)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleStatus(cls.extracurricularClassId)}
                  title={cls.isActive ? 'Nhấp để tạm ngừng nhận đăng ký' : 'Nhấp để mở nhận đăng ký'}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    cls.isActive
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{cls.isActive ? 'Ngừng nhận' : 'Mở nhận'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(cls)}
                  className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#275A4E]/10 border border-slate-200 text-[#275A4E] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Chỉnh sửa toàn bộ thông tin lớp học năng khiếu"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa thông tin</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Lớp Năng Khiếu Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Khởi Tạo & Phê Duyệt Mở Lớp CLB Năng Khiếu</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên lớp câu lạc bộ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hội Họa Sáng Tạo, Võ Thuật Vovinam, Aerobic Mầm Non, Tiếng Anh Giao Tiếp..."
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Năm học áp dụng
                  </label>
                  <div className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700">
                    {activeAcademicYear?.name || 'Chưa có năm học đang hoạt động'}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phòng học chức năng
                  </label>
                  <select
                    value={formData.classroomId}
                    onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                  >
                    <option value="">-- Chưa chỉ định phòng --</option>
                    {classrooms.map((c) => (
                      <option key={c.classroomId} value={c.classroomId}>
                        {c.roomName} ({c.building ? `${c.building} - ` : ''}Sức chứa {c.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ScheduleEditor
                days={createScheduleDays}
                onDaysChange={setCreateScheduleDays}
                startTime={createScheduleStart}
                onStartTimeChange={setCreateScheduleStart}
                endTime={createScheduleEnd}
                onEndTimeChange={setCreateScheduleEnd}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sĩ số tối đa (10-30 trẻ - BR-090) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                      max={100}
                    required
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Học phí / Tháng (VNĐ - BR-092) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] font-bold text-[#275A4E]"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                    Hiển thị: {formatVND(formData.tuitionFee)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Giáo viên / Huấn luyện viên phụ trách <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.externalInstructorName || ''}
                  onChange={(e) => setFormData({ ...formData, externalInstructorName: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] bg-white font-medium"
                  required
                >
                  <option value="">-- Chọn giáo viên phụ trách CLB --</option>
                  {teachers.map((t) => (
                    <option key={t.staffId || t.fullName} value={t.fullName}>
                      {t.fullName} {t.phoneNumber ? `(${t.phoneNumber})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Mỗi giáo viên chỉ được phụ trách tối đa 01 lớp (lớp chính khóa hoặc CLB) trong cùng năm học.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#275A4E] text-white rounded-xl text-sm font-bold hover:bg-[#1E4D40] cursor-pointer disabled:opacity-50 transition shadow-sm"
                >
                  {submitting ? 'Đang tạo...' : 'Phê Duyệt Mở Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Toàn Bộ Thông Tin Lớp Năng Khiếu */}
      {editingClass && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Chỉnh Sửa Thông Tin Lớp CLB Năng Khiếu</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mã lớp: {editingClass.extracurricularClassId}</p>
              </div>
              <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên lớp câu lạc bộ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.className}
                  onChange={(e) => setEditFormData({ ...editFormData, className: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phòng học chức năng
                </label>
                <select
                  value={editFormData.classroomId}
                  onChange={(e) => setEditFormData({ ...editFormData, classroomId: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                >
                  <option value="">-- Chưa chỉ định phòng --</option>
                  {classrooms.map((c) => (
                    <option key={c.classroomId} value={c.classroomId}>
                      {c.roomName} ({c.building ? `${c.building} - ` : ''}Sức chứa {c.capacity})
                    </option>
                  ))}
                </select>
              </div>

              <ScheduleEditor
                days={editScheduleDays}
                onDaysChange={setEditScheduleDays}
                startTime={editScheduleStart}
                onStartTimeChange={setEditScheduleStart}
                endTime={editScheduleEnd}
                onEndTimeChange={setEditScheduleEnd}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sĩ số tối đa (10-30 trẻ - BR-090) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                      max={100}
                    required
                    value={editFormData.maxCapacity}
                    onChange={(e) => setEditFormData({ ...editFormData, maxCapacity: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mức học phí / Tháng (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    required
                    value={editFormData.tuitionFee}
                    onChange={(e) => setEditFormData({ ...editFormData, tuitionFee: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] font-bold text-[#275A4E]"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block font-medium">
                    Hiển thị: {formatVND(editFormData.tuitionFee)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Giáo viên / Huấn luyện viên phụ trách <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editFormData.externalInstructorName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, externalInstructorName: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] bg-white font-medium"
                  required
                >
                  <option value="">-- Chọn giáo viên phụ trách CLB --</option>
                  {teachers.map((t) => (
                    <option key={t.staffId || t.fullName} value={t.fullName}>
                      {t.fullName} {t.phoneNumber ? `(${t.phoneNumber})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Mỗi giáo viên chỉ được phụ trách tối đa 01 lớp (lớp chính khóa hoặc CLB) trong cùng năm học.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2.5 bg-[#275A4E] text-white rounded-xl text-sm font-bold hover:bg-[#1E4D40] cursor-pointer disabled:opacity-50 transition shadow-sm"
                >
                  {updating ? 'Đang lưu...' : 'Lưu Thay Đổi (Cập Nhật)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghExtracurricularClassesPage;
