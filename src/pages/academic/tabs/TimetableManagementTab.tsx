import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Copy,
  Send,
  School,
  User,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import {
  timetableService,
  TimetableItemDTO,
  SaveTimetablePayload,
  TimetableResponse
} from '../../../services/timetableService';
import { classService } from '../../../services/classService';
import { academicYearApi } from '../../../api/academicYearApi';
import { assignmentService } from '../../../services/assignmentService';
import { facilityClassroomApi, FacilityClassroom } from '../../../api/facilityClassroomApi';
import { useToast } from '../../../contexts/ToastContext';
import { ClassSummary } from '../../../types/classAffairs.types';
import { formatGradeLevel } from '../../../utils/formatters';

// Standard 5 preschool days (Monday -> Friday)
const DAYS_OF_WEEK = [
  { key: 'MONDAY', label: 'Thứ Hai' },
  { key: 'TUESDAY', label: 'Thứ Ba' },
  { key: 'WEDNESDAY', label: 'Thứ Tư' },
  { key: 'THURSDAY', label: 'Thứ Năm' },
  { key: 'FRIDAY', label: 'Thứ Sáu' },
];

// Standard Preschool Routine Time Slots (07:30 - 17:00)
const STANDARD_TIME_SLOTS = [
  { start: '07:30', end: '08:15', label: 'Đón trẻ & Thể dục sáng', isRoutine: true },
  { start: '08:15', end: '08:45', label: 'Điểm tâm sáng', isRoutine: true },
  { start: '08:45', end: '09:30', label: 'Hoạt động học tập 1 (STEAM/Khám phá)' },
  { start: '09:30', end: '10:15', label: 'Hoạt động ngoài trời / Vui chơi' },
  { start: '10:15', end: '11:00', label: 'Hoạt động góc / Thể chất / Năng khiếu' },
  { start: '11:00', end: '12:00', label: 'Vệ sinh & Bữa ăn trưa', isRoutine: true },
  { start: '12:00', end: '14:00', label: 'Giấc ngủ trưa', isRoutine: true },
  { start: '14:00', end: '14:30', label: 'Thức dậy & Ăn xế chiều', isRoutine: true },
  { start: '14:30', end: '15:30', label: 'Hoạt động chiều (Âm nhạc / Tạo hình)' },
  { start: '15:30', end: '17:00', label: 'Vui chơi tự do & Trả trẻ', isRoutine: true },
];

export const TimetableManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  // State
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);

  // Local draft items before saving
  const [localItems, setLocalItems] = useState<TimetableItemDTO[]>([]);
  const [isSlotModalOpen, setIsSlotModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<TimetableItemDTO | null>(null);

  // Modal Form State
  const [slotDay, setSlotDay] = useState<string>('MONDAY');
  const [slotStartTime, setSlotStartTime] = useState<string>('08:45');
  const [slotEndTime, setSlotEndTime] = useState<string>('09:30');
  const [slotActivityName, setSlotActivityName] = useState<string>('');
  const [slotTeacherId, setSlotTeacherId] = useState<string>('');
  const [slotRoomId, setSlotRoomId] = useState<string>('');

  // 1. Fetch Academic Years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears-timetable'],
    queryFn: async () => {
      const res = await academicYearApi.getAcademicYears();
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    }
  });

  // Set default active academic year
  React.useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYearId) {
      const active = academicYears.find((y: any) => y.isActive || y.status === 'ACTIVE');
      const firstYear = academicYears[0];
      const targetId = active ? (active.id || active.academicYearId) : (firstYear.id || firstYear.academicYearId);
      if (targetId) {
        setSelectedAcademicYearId(targetId);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  // 2. Fetch Classes
  const { data: classesData } = useQuery({
    queryKey: ['classes-timetable', selectedAcademicYearId],
    queryFn: async () => {
      const res = await classService.getClasses({
        academicYearId: (selectedAcademicYearId && selectedAcademicYearId !== 'ALL') ? selectedAcademicYearId : undefined,
        page: 0,
        size: 100
      });
      return res.content || [];
    }
  });

  const classes: ClassSummary[] = classesData || [];

  // Automatically select first class
  React.useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.find(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // 3. Fetch Teachers
  const { data: availableTeachers = [] } = useQuery({
    queryKey: ['available-teachers-timetable', selectedAcademicYearId],
    queryFn: async () => {
      return await assignmentService.getAvailableTeachers(
        (selectedAcademicYearId && selectedAcademicYearId !== 'ALL') ? selectedAcademicYearId : undefined
      );
    }
  });

  // 4. Fetch Function Rooms / Classrooms
  const { data: classrooms = [] } = useQuery<FacilityClassroom[]>({
    queryKey: ['classrooms-timetable'],
    queryFn: async () => {
      return await facilityClassroomApi.getAllClassrooms();
    }
  });

  // 5. Fetch Weekly Timetable from Backend API
  const { data: serverTimetable, isLoading: isLoadingTimetable } = useQuery<TimetableResponse>({
    queryKey: ['weekly-timetable', selectedClassId, selectedWeekNumber, selectedAcademicYearId],
    queryFn: async () => {
      if (!selectedClassId) return null as any;
      return await timetableService.getTimetable(selectedClassId, selectedWeekNumber, selectedAcademicYearId || undefined);
    },
    enabled: !!selectedClassId
  });

  // Sync server items to local state on fetch
  React.useEffect(() => {
    if (serverTimetable?.items) {
      setLocalItems(serverTimetable.items);
    } else {
      setLocalItems([]);
    }
  }, [serverTimetable]);

  // Mutation: Save Draft & Submit for Approval
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) throw new Error('Vui lòng chọn lớp học');

      // Sanitize items: ensure teacherId and roomId are valid UUIDs, resolving from name if needed
      const sanitizedItems = localItems.map((it) => {
        let validTeacherId: string | undefined = undefined;
        const rawTid = it.teacherId?.trim();
        if (rawTid) {
          const targetTid = rawTid;
          const matchTeacher = availableTeachers.find(
            (t: any) =>
              (t.id && t.id === targetTid) ||
              (t.staffCode && t.staffCode === targetTid) ||
              (t.fullName && (targetTid.includes(t.fullName) || t.fullName.includes(targetTid)))
          );
          if (matchTeacher) {
            validTeacherId = matchTeacher.id;
          } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTid)) {
            validTeacherId = targetTid;
          }
        }

        let validRoomId: string | undefined = undefined;
        const rawRid = it.roomId?.trim();
        if (rawRid) {
          const targetRid = rawRid;
          const matchRoom = classrooms.find(
            (r: FacilityClassroom) =>
              (r.classroomId && r.classroomId === targetRid) ||
              (r.roomName && (targetRid.includes(r.roomName) || r.roomName.includes(targetRid)))
          );
          if (matchRoom && matchRoom.classroomId) {
            validRoomId = matchRoom.classroomId;
          } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRid)) {
            validRoomId = targetRid;
          }
        }

        return {
          ...it,
          teacherId: validTeacherId,
          roomId: validRoomId,
        };
      });

      const validYearId =
        selectedAcademicYearId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAcademicYearId)
          ? selectedAcademicYearId
          : undefined;

      return await timetableService.saveDraftTimetable({
        classId: selectedClassId,
        weekNumber: selectedWeekNumber,
        academicYearId: validYearId,
        items: sanitizedItems,
      });
    },
    onSuccess: (data: any) => {
      success('MSG-039: Lưu dự thảo thời khóa biểu tuần thành công, đang chờ Ban Giám hiệu phê duyệt.');
      queryClient.invalidateQueries({ queryKey: ['weekly-timetable', selectedClassId, selectedWeekNumber] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu thời khóa biểu.';
      error(msg);
    }
  });

  // Mutation: Copy from Previous Week
  const copyPreviousWeekMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) throw new Error('Vui lòng chọn lớp học');
      if (selectedWeekNumber <= 1) throw new Error('Không thể sao chép khi đang ở Tuần 1.');

      const validYearId =
        selectedAcademicYearId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedAcademicYearId)
          ? selectedAcademicYearId
          : undefined;

      return await timetableService.copyPreviousWeek({
        classId: selectedClassId,
        sourceWeekNumber: selectedWeekNumber - 1,
        targetWeekNumber: selectedWeekNumber,
        academicYearId: validYearId,
      });
    },
    onSuccess: (data: any) => {
      success(`Đã sao chép thời khóa biểu từ Tuần ${selectedWeekNumber - 1} sang Tuần ${selectedWeekNumber} thành công!`);
      queryClient.invalidateQueries({ queryKey: ['weekly-timetable', selectedClassId, selectedWeekNumber] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi sao chép thời khóa biểu tuần trước.';
      error(msg);
    }
  });

  // Handlers for Slot Editing
  const onOpenAddSlot = (day: string, slot?: { start: string; end: string; label: string }) => {
    setSlotDay(day);
    setSlotStartTime(slot?.start || '08:45');
    setSlotEndTime(slot?.end || '09:30');
    setSlotActivityName(slot?.label || '');
    setSlotTeacherId(selectedClass?.homeroomTeacherId || '');
    setSlotRoomId(selectedClass?.roomId || '');
    setEditingSlot(null);
    setIsSlotModalOpen(true);
  };

  const onOpenEditSlot = (item: TimetableItemDTO) => {
    setSlotDay(item.dayOfWeek);
    setSlotStartTime(item.startTime);
    setSlotEndTime(item.endTime);
    setSlotActivityName(item.activityName);

    // Resolve teacher ID if stored as name
    let currentTeacherId = item.teacherId || '';
    if (currentTeacherId) {
      const targetTid = currentTeacherId;
      const match = availableTeachers.find(
        (t: any) =>
          (t.id && t.id === targetTid) ||
          (t.staffCode && t.staffCode === targetTid) ||
          (t.fullName && (targetTid.includes(t.fullName) || t.fullName.includes(targetTid)))
      );
      if (match) {
        currentTeacherId = match.id;
      }
    }
    setSlotTeacherId(currentTeacherId);

    // Resolve room ID if stored as name
    let currentRoomId = item.roomId || '';
    if (currentRoomId) {
      const targetRid = currentRoomId;
      const matchR = classrooms.find(
        (r: FacilityClassroom) =>
          (r.classroomId && r.classroomId === targetRid) ||
          (r.roomName && (targetRid.includes(r.roomName) || r.roomName.includes(targetRid)))
      );
      if (matchR && matchR.classroomId) {
        currentRoomId = matchR.classroomId;
      }
    }
    setSlotRoomId(currentRoomId);

    setEditingSlot(item);
    setIsSlotModalOpen(true);
  };

  const onSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotActivityName.trim()) {
      error('Vui lòng nhập tên hoạt động / môn học');
      return;
    }
    if (slotStartTime >= slotEndTime) {
      error('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
      return;
    }

    const rawTeacherId = slotTeacherId && slotTeacherId.trim() !== '' ? slotTeacherId.trim() : undefined;
    let finalTeacherId: string | undefined = undefined;
    let selectedTeacherName: string | undefined = undefined;
    if (rawTeacherId) {
      const targetTid = rawTeacherId;
      const teacher = availableTeachers.find(
        (t: any) =>
          (t.id && t.id === targetTid) ||
          (t.staffCode && t.staffCode === targetTid) ||
          (t.fullName && (targetTid.includes(t.fullName) || t.fullName.includes(targetTid)))
      );
      if (teacher) {
        finalTeacherId = teacher.id;
        selectedTeacherName = teacher.fullName;
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTid)) {
        finalTeacherId = targetTid;
      }
    }

    const rawRoomId = slotRoomId && slotRoomId.trim() !== '' ? slotRoomId.trim() : undefined;
    let finalRoomId: string | undefined = undefined;
    let selectedRoomName: string | undefined = undefined;
    if (rawRoomId) {
      const targetRid = rawRoomId;
      const room = classrooms.find(
        (r: FacilityClassroom) =>
          (r.classroomId && r.classroomId === targetRid) ||
          (r.roomName && (targetRid.includes(r.roomName) || r.roomName.includes(targetRid)))
      );
      if (room && room.classroomId) {
        finalRoomId = room.classroomId;
        selectedRoomName = room.roomName;
      } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRid)) {
        finalRoomId = targetRid;
      }
    }

    const newItem: TimetableItemDTO = {
      itemId: editingSlot?.itemId,
      dayOfWeek: slotDay,
      startTime: slotStartTime,
      endTime: slotEndTime,
      activityName: slotActivityName.trim(),
      teacherId: finalTeacherId,
      teacherName: selectedTeacherName || (editingSlot?.teacherName || undefined),
      roomId: finalRoomId,
      roomName: selectedRoomName || (editingSlot?.roomName || undefined),
    };

    if (editingSlot) {
      setLocalItems(prev => prev.map(it => (it === editingSlot ? newItem : it)));
    } else {
      setLocalItems(prev => [...prev, newItem]);
    }

    setIsSlotModalOpen(false);
  };

  const onDeleteSlot = (item: TimetableItemDTO) => {
    setLocalItems(prev => prev.filter(it => it !== item));
  };

  // Status Badge
  const status = serverTimetable?.status || 'DRAFT';

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Filter and Actions Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Class & Academic Year Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {academicYears.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Năm học:</span>
                </div>
                <select
                  value={selectedAcademicYearId}
                  onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                  className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {academicYears.length > 1 && <option value="ALL">-- Tất cả năm học --</option>}
                  {academicYears.map((y: any) => {
                    const yId = y.id || y.academicYearId;
                    const yName = y.name || y.yearName;
                    const isActive = y.status === 'ACTIVE' || y.isActive;
                    return (
                      <option key={yId} value={yId}>
                        {yName} {isActive ? '★ (Hiện tại)' : ''}
                      </option>
                    );
                  })}
                </select>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              </>
            )}

            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-500 uppercase">Lớp:</span>
            </div>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({formatGradeLevel(cls.gradeLevel)})
                </option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-500 uppercase">Tuần:</span>
            </div>
            <select
              value={selectedWeekNumber}
              onChange={(e) => setSelectedWeekNumber(Number(e.target.value))}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {Array.from({ length: 45 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>

            {/* Status indicator badge */}
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
              status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-slate-100 text-slate-600'
            }`}>
              {status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {status === 'PENDING_APPROVAL' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
              <span>{status === 'APPROVED' ? 'Đã Ban Hành' : status === 'PENDING_APPROVAL' ? 'Chờ BGH Phê Duyệt' : 'Bản Thảo (Chưa Lưu)'}</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={copyPreviousWeekMutation.isPending || selectedWeekNumber <= 1}
              onClick={() => copyPreviousWeekMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
              title={selectedWeekNumber <= 1 ? 'Không thể sao chép cho Tuần 1' : 'Sao chép hoạt động từ tuần trước'}
            >
              {copyPreviousWeekMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>Sao Chép Tuần Trước</span>
            </button>

            <button
              type="button"
              disabled={saveDraftMutation.isPending || !selectedClassId}
              onClick={() => saveDraftMutation.mutate()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {saveDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Lưu & Trình BGH Duyệt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timetable Grid View (Monday to Friday, 5 Columns) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Thời Khóa Biểu Tuần {selectedWeekNumber} • {selectedClass?.name || 'Lớp học'}
            </h3>
          </div>
          <span className="text-xs text-slate-500">Tổng số tiết/hoạt động: {localItems.length}</span>
        </div>

        {isLoadingTimetable ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
            <span className="text-xs font-semibold">Đang tải dữ liệu thời khóa biểu...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-5 min-w-[900px] border-b border-slate-100 bg-slate-50/80 text-center font-bold text-xs text-slate-700">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d.key} className="py-3 px-2 border-r border-slate-100 last:border-r-0 flex items-center justify-between">
                  <span className="mx-auto">{d.label}</span>
                  <button
                    type="button"
                    title="Thêm hoạt động"
                    onClick={() => onOpenAddSlot(d.key)}
                    className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center cursor-pointer transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 min-w-[900px] divide-x divide-slate-100 p-2 min-h-[550px] bg-slate-50/30">
              {DAYS_OF_WEEK.map((day) => {
                const dayItems = localItems
                  .filter((it) => it.dayOfWeek.toUpperCase() === day.key)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div key={day.key} className="p-2 space-y-2">
                    {dayItems.length === 0 ? (
                      <div
                        onClick={() => onOpenAddSlot(day.key)}
                        className="h-36 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-400 hover:text-emerald-700 transition cursor-pointer p-3 text-center"
                      >
                        <Plus className="w-5 h-5 mb-1 opacity-60" />
                        <span className="text-[11px] font-semibold">Chưa có hoạt động</span>
                        <span className="text-[10px] text-slate-400">Nhấn để thêm tiết</span>
                      </div>
                    ) : (
                      dayItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="group p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all relative space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{item.startTime} - {item.endTime}</span>
                            </span>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onOpenEditSlot(item)}
                                className="p-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSlot(item)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="font-bold text-slate-900 text-xs leading-snug">
                            {item.activityName}
                          </div>

                          {(item.teacherName || item.roomName) && (
                            <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
                              {item.teacherName && (
                                <div className="flex items-center gap-1 truncate text-slate-600">
                                  <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{item.teacherName}</span>
                                </div>
                              )}
                              {item.roomName && (
                                <div className="flex items-center gap-1 truncate text-slate-600">
                                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span>{item.roomName}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT TIMETABLE SLOT */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>{editingSlot ? 'Chỉnh Sửa Hoạt Động' : 'Thêm Tiết / Hoạt Động'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSaveSlot} className="space-y-4 text-xs font-medium">
              {/* Day selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Thứ trong tuần</label>
                <select
                  value={slotDay}
                  onChange={(e) => setSlotDay(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 font-bold"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên hoạt động / Môn học <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Khám phá Khoa học (STEAM), Âm nhạc, Thể dục..."
                  value={slotActivityName}
                  onChange={(e) => setSlotActivityName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold"
                  required
                />
              </div>

              {/* Time slots */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-bold font-mono"
                    required
                  />
                </div>
              </div>

              {/* Teacher (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Giáo viên phụ trách</label>
                <select
                  value={slotTeacherId}
                  onChange={(e) => setSlotTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                >
                  <option value="">-- Chọn giáo viên (hoặc GVCN phụ trách) --</option>
                  {availableTeachers.map((t: any) => {
                    const teacherValue = t.id || t.staffId;
                    return (
                      <option key={teacherValue} value={teacherValue}>
                        {t.fullName} ({t.qualification || 'Giáo viên'})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Room (optional) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phòng học / Phòng chức năng</label>
                <select
                  value={slotRoomId}
                  onChange={(e) => setSlotRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
                >
                  <option value="">-- Phòng học của lớp (mặc định) --</option>
                  {classrooms.map((r: FacilityClassroom) => {
                    const roomValue = r.classroomId || '';
                    return (
                      <option key={roomValue} value={roomValue}>
                        {r.roomName} ({r.building || 'Khuôn viên'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
                >
                  {editingSlot ? 'Cập Nhật' : 'Thêm Tiết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};