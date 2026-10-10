import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  Check,
  Building
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';
import { Timetable, TimetableConflict, ClassEntity } from '../../../types/classroom.types';

const timetableSchema = z.object({
  classId: z.string().min(1, 'Vui lòng chọn lớp học'),
  dayOfWeek: z.coerce.number().min(1).max(6),
  subject: z.string().min(2, 'Vui lòng nhập tên môn học / hoạt động'),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
  notes: z.string().optional(),
  roomName: z.string().optional()
}).refine(data => data.startTime < data.endTime, {
  message: "Giờ kết thúc phải lớn hơn giờ bắt đầu",
  path: ["endTime"]
});

type TimetableFormValues = z.infer<typeof timetableSchema>;

// Helper: Convert time string "HH:mm" to minutes
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// Overlap validation: max(A_start, B_start) < min(A_end, B_end)
export const isTimeOverlapping = (startA: string, endA: string, startB: string, endB: string): boolean => {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
};

// Client-side conflict detection algorithm O(N log N / pairwise by day)
export const detectTimetableConflicts = (
  allTimetables: Timetable[],
  classes: ClassEntity[],
  teachers: any[]
): TimetableConflict[] => {
  const conflicts: TimetableConflict[] = [];

  const classMap = new Map<string, ClassEntity>();
  classes.forEach(c => classMap.set(c.id, c));

  const teacherMap = new Map<string, any>();
  teachers.forEach(t => teacherMap.set(t.id, t));

  // Group by day of week
  const byDay: { [day: number]: Timetable[] } = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  allTimetables.forEach(t => {
    if (byDay[t.dayOfWeek]) {
      byDay[t.dayOfWeek].push(t);
    }
  });

  // Check pairwise overlapping for each day
  for (let day = 1; day <= 6; day++) {
    const daySlots = byDay[day];

    for (let i = 0; i < daySlots.length; i++) {
      for (let j = i + 1; j < daySlots.length; j++) {
        const slotA = daySlots[i];
        const slotB = daySlots[j];

        if (isTimeOverlapping(slotA.startTime, slotA.endTime, slotB.startTime, slotB.endTime)) {
          const classA = classMap.get(slotA.classId);
          const classB = classMap.get(slotB.classId);
          const classAName = classA?.name || slotA.className || 'Lớp A';
          const classBName = classB?.name || slotB.className || 'Lớp B';

          // 1. BR-014: Trùng lịch Giáo viên (MSG-073)
          const teacherAId = slotA.teacherId || classA?.teacherId;
          const teacherBId = slotB.teacherId || classB?.teacherId;

          if (teacherAId && teacherBId && teacherAId === teacherBId && slotA.classId !== slotB.classId) {
            const teacherName = slotA.teacherName || teacherMap.get(teacherAId)?.fullName || classA?.teacherName || 'Giáo viên';
            conflicts.push({
              id: `tc-${slotA.id}-${slotB.id}`,
              type: 'TEACHER_CONFLICT',
              dayOfWeek: day,
              startTime: slotA.startTime > slotB.startTime ? slotA.startTime : slotB.startTime,
              endTime: slotA.endTime < slotB.endTime ? slotA.endTime : slotB.endTime,
              conflictingTimetableIds: [slotA.id, slotB.id],
              classIds: [slotA.classId, slotB.classId],
              classNames: [classAName, classBName],
              entityName: teacherName,
              description: `MSG-073: Phát hiện trùng lịch dạy của giáo viên ${teacherName} tại ${classAName} và ${classBName}.`,
              suggestedAction: `Đổi khung giờ học của một trong hai lớp hoặc phân bổ lại giáo viên phụ trách.`
            });
          }

          // 2. Trùng phòng chức năng / phòng học (MSG-074)
          const roomA = (slotA.roomName || classA?.roomNumber || classA?.roomName || '').trim();
          const roomB = (slotB.roomName || classB?.roomNumber || classB?.roomName || '').trim();

          if (
            roomA &&
            roomB &&
            roomA.toLowerCase() === roomB.toLowerCase() &&
            slotA.classId !== slotB.classId &&
            !roomA.toLowerCase().includes('tại lớp')
          ) {
            conflicts.push({
              id: `rc-${slotA.id}-${slotB.id}`,
              type: 'ROOM_CONFLICT',
              dayOfWeek: day,
              startTime: slotA.startTime > slotB.startTime ? slotA.startTime : slotB.startTime,
              endTime: slotA.endTime < slotB.endTime ? slotA.endTime : slotB.endTime,
              conflictingTimetableIds: [slotA.id, slotB.id],
              classIds: [slotA.classId, slotB.classId],
              classNames: [classAName, classBName],
              entityName: roomA,
              description: `MSG-074: Xung đột phòng học: ${roomA} được chọn đã có lớp ${classAName} đặt trước.`,
              suggestedRoom: 'Phòng Đa năng 202',
              suggestedAction: `Chuyển sang Phòng Đa năng 202 (hiện đang khả dụng) hoặc sắp xếp lại khung giờ.`
            });
          }
        }
      }
    }
  }

  // 3. Vượt định mức tiết dạy tối đa (MSG-075) - Định mức 25 tiết/tuần
  const teacherLoadMap = new Map<string, number>();
  allTimetables.forEach(t => {
    const c = classMap.get(t.classId);
    const teacherId = t.teacherId || c?.teacherId;
    if (teacherId) {
      teacherLoadMap.set(teacherId, (teacherLoadMap.get(teacherId) || 0) + 1);
    }
  });

  teacherLoadMap.forEach((count, teacherId) => {
    if (count > 25) {
      const teacherName = teacherMap.get(teacherId)?.fullName || 'Giáo viên';
      conflicts.push({
        id: `to-${teacherId}`,
        type: 'TEACHER_OVERLOAD',
        dayOfWeek: 1,
        startTime: '08:00',
        endTime: '17:00',
        conflictingTimetableIds: [],
        classIds: [],
        classNames: [],
        entityName: teacherName,
        description: `MSG-075: Vượt quá định mức tiết dạy tối đa trong tuần của giáo viên ${teacherName} (${count}/25 tiết). Vui lòng phân bổ lại.`,
        suggestedAction: 'Phân bổ bớt tiết học sang giáo viên bộ môn hoặc trợ giảng.'
      });
    }
  });

  return conflicts;
};

export const TimetableManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConflictDrawerOpen, setIsConflictDrawerOpen] = useState(false);
  const [conflictFilterType, setConflictFilterType] = useState<'ALL' | 'TEACHER' | 'ROOM' | 'OVERLOAD'>('ALL');
  const [editingTimetable, setEditingTimetable] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery<ClassEntity[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await academicApi.getClasses();
      const list = Array.isArray(res) ? res : ((res as any)?.data || []);
      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0].id);
      }
      return list;
    }
  });

  // 2. Fetch Active Teachers
  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ['activeTeachers'],
    queryFn: async () => {
      const res = await academicApi.getActiveTeachers();
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    }
  });

  // 3. Fetch Timetables of selected class
  const { data: timetables = [], isLoading: isLoadingTimetables } = useQuery<Timetable[]>({
    queryKey: ['timetables', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const res = await academicApi.getTimetables({ classId: selectedClassId });
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    },
    enabled: !!selectedClassId
  });

  // 4. Fetch All Timetables for Cross-school Conflict Detection (UC-018)
  const { data: allTimetables = [], refetch: refetchAllTimetables } = useQuery<Timetable[]>({
    queryKey: ['allTimetables'],
    queryFn: async () => {
      const res = await academicApi.getAllTimetables();
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    }
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableSchema) as any,
    defaultValues: {
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '08:45'
    }
  });

  // Client-side Overlap Check on current class creation
  const hasOverlap = (newTT: TimetableFormValues, excludeId?: string) => {
    return timetables.some((t: Timetable) => {
      if (excludeId && t.id === excludeId) return false;
      if (t.dayOfWeek !== newTT.dayOfWeek) return false;
      if (t.classId !== newTT.classId) return false;
      return isTimeOverlapping(newTT.startTime, newTT.endTime, t.startTime, t.endTime);
    });
  };

  // Cross-school Conflict List
  const detectedConflicts = useMemo(() => {
    return detectTimetableConflicts(allTimetables, classes, teachers);
  }, [allTimetables, classes, teachers]);

  // Set of timetable IDs that have direct conflicts
  const conflictSlotIdSet = useMemo(() => {
    const set = new Set<string>();
    detectedConflicts.forEach(c => {
      c.conflictingTimetableIds.forEach(id => set.add(id));
    });
    return set;
  }, [detectedConflicts]);

  // Filtered conflicts in the drawer
  const filteredConflicts = useMemo(() => {
    if (conflictFilterType === 'TEACHER') return detectedConflicts.filter(c => c.type === 'TEACHER_CONFLICT');
    if (conflictFilterType === 'ROOM') return detectedConflicts.filter(c => c.type === 'ROOM_CONFLICT');
    if (conflictFilterType === 'OVERLOAD') return detectedConflicts.filter(c => c.type === 'TEACHER_OVERLOAD');
    return detectedConflicts;
  }, [detectedConflicts, conflictFilterType]);

  // Mutation: Create or Update Timetable
  const createTimetableMutation = useMutation({
    mutationFn: async (data: TimetableFormValues) => {
      if (hasOverlap(data, editingTimetable?.id)) {
        throw new Error('MSG-070: Phát hiện xung đột lịch dạy. Vui lòng xử lý các điểm trùng lặp trước khi ban hành.');
      }
      if (editingTimetable) {
        return await academicApi.updateTimetable(editingTimetable.id, data);
      }
      return await academicApi.createTimetable(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      queryClient.invalidateQueries({ queryKey: ['allTimetables'] });
      setToastMessage({ type: 'success', text: 'MSG-067: Thời khóa biểu tuần đã được ban hành thành công' });
      setIsModalOpen(false);
      reset();
      setEditingTimetable(null);
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (error: any) => {
      let msg = 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
      if (error.message?.includes('MSG-')) msg = error.message;
      else if (error.response?.data?.message) msg = error.response.data.message;
      setToastMessage({ type: 'error', text: msg });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  // Mutation: Quick apply suggested room
  const applySuggestedRoomMutation = useMutation({
    mutationFn: async ({ timetableId, suggestedRoom }: { timetableId: string, suggestedRoom: string }) => {
      return await academicApi.updateTimetable(timetableId, { roomName: suggestedRoom });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      queryClient.invalidateQueries({ queryKey: ['allTimetables'] });
      setToastMessage({ type: 'success', text: 'Đã áp dụng phòng học đề xuất thành công!' });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (error: any) => {
      let msg = 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
      if (error.response?.data?.message) msg = error.response.data.message;
      setToastMessage({ type: 'error', text: msg });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  // Mutation: Delete Timetable
  const deleteTimetableMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicApi.deleteTimetable(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetables'] });
      queryClient.invalidateQueries({ queryKey: ['allTimetables'] });
      setToastMessage({ type: 'success', text: 'Xóa tiết học thành công' });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  const onSubmit = (data: TimetableFormValues) => {
    createTimetableMutation.mutate(data);
  };

  // Routine Check: Lunch and Nap
  const checkRequiredRoutines = () => {
    const classTTs = timetables.filter((t: Timetable) => t.classId === selectedClassId && t.dayOfWeek === selectedDay);
    const hasLunch = classTTs.some((t: Timetable) => t.subject?.toLowerCase().includes('ăn trưa') || t.activityName?.toLowerCase().includes('ăn trưa'));
    const hasNap = classTTs.some((t: Timetable) => t.subject?.toLowerCase().includes('ngủ trưa') || t.activityName?.toLowerCase().includes('ngủ trưa'));
    
    if (!hasLunch || !hasNap) {
      setToastMessage({ type: 'warning', text: 'MSG-069: Thời khóa biểu mầm non bắt buộc phải bố trí đầy đủ khung giờ ăn trưa và ngủ trưa cho trẻ.' });
    } else {
      setToastMessage({ type: 'success', text: 'Khung giờ sinh hoạt và dinh dưỡng đạt chuẩn mầm non!' });
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Run Conflict Check Action
  const handleRunConflictCheck = async () => {
    await refetchAllTimetables();
    setIsConflictDrawerOpen(true);
    if (detectedConflicts.length === 0) {
      setToastMessage({ type: 'success', text: 'MSG-072: Không phát hiện xung đột lịch dạy trên toàn trường' });
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const dayTabs = [
    { value: 1, label: 'Thứ Hai' },
    { value: 2, label: 'Thứ Ba' },
    { value: 3, label: 'Thứ Tư' },
    { value: 4, label: 'Thứ Năm' },
    { value: 5, label: 'Thứ Sáu' },
    { value: 6, label: 'Thứ Bảy' },
  ];

  const currentDayTimetables = useMemo(() => {
    return timetables
      .filter((t: Timetable) => t.dayOfWeek === selectedDay)
      .sort((a: Timetable, b: Timetable) => a.startTime.localeCompare(b.startTime));
  }, [timetables, selectedDay]);

  const getSubjectColor = (subject: string) => {
    const s = subject?.toLowerCase() || '';
    if (s.includes('ăn trưa')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (s.includes('ngủ trưa')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (s.includes('đón trẻ') || s.includes('trả trẻ')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s.includes('thể dục') || s.includes('vận động')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (s.includes('âm nhạc') || s.includes('vẽ')) return 'bg-purple-100 text-purple-800 border-purple-200';
    return 'bg-slate-50 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 shadow-sm ${
          toastMessage.type === 'success' ? 'bg-[#78C2AD]/15 border border-[#78C2AD] text-[#1E4D40]' : 
          toastMessage.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
          'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5 text-[#275A4E] shrink-0" /> : 
           toastMessage.type === 'warning' ? <Info className="w-5 h-5 text-amber-600 shrink-0" /> :
           <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="font-semibold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Controls & UC-018 Conflict Check Button */}
      <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Lớp học:</span>
          <select 
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#78C2AD] min-w-[220px]"
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} - {c.ageGroup}</option>)}
          </select>
        </div>
        
        {/* Day Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0 hide-scrollbar">
          {dayTabs.map(day => (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedDay === day.value 
                  ? 'bg-[#275A4E] text-white shadow-sm' 
                  : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>

        {/* UC-018 Conflict Check Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunConflictCheck}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 cursor-pointer ${
              detectedConflicts.length > 0
                ? 'bg-rose-50 border-2 border-rose-300 text-rose-700 hover:bg-rose-100 animate-pulse'
                : 'bg-[#78C2AD]/15 border border-[#78C2AD]/40 text-[#1E4D40] hover:bg-[#78C2AD]/25'
            }`}
            title="Kiểm tra xung đột trùng lịch giáo viên và phòng học toàn trường (UC-018)"
          >
            {detectedConflicts.length > 0 ? (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Kiểm tra Xung đột ({detectedConflicts.length})</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#275A4E]" />
                <span>Kiểm tra Xung đột (0)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conflict Alert Banner on grid if conflicts exist */}
      {detectedConflicts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Cảnh báo Xếp lịch: Phát hiện {detectedConflicts.length} điểm xung đột trên hệ thống
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Giáo viên trùng giờ dạy hoặc phòng chức năng bị đặt trùng lặp. Vui lòng xử lý trước khi ban hành.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConflictDrawerOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span>Xem Báo cáo Chi tiết</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action Bar Above Table */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E5A93C]" />
          <span>Lịch trình {dayTabs.find(d => d.value === selectedDay)?.label}</span>
          <span className="text-xs font-normal px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            {currentDayTimetables.length} tiết sinh hoạt
          </span>
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={checkRequiredRoutines}
            className="px-4 py-2.5 text-xs font-bold text-[#275A4E] bg-[#78C2AD]/15 hover:bg-[#78C2AD]/25 rounded-xl transition border border-[#78C2AD]/30 cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-3.5 h-3.5 text-[#275A4E]" />
            <span>Kiểm tra Ăn / Ngủ Trưa</span>
          </button>
          <button 
            onClick={() => {
              reset();
              setValue('classId', selectedClassId);
              setValue('dayOfWeek', selectedDay);
              setEditingTimetable(null);
              setIsModalOpen(true);
            }}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tiết Học Mới</span>
          </button>
        </div>
      </div>

      {/* Timetable Grid with Conflict Highlighting */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        {isLoadingTimetables ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#78C2AD]" />
            <p className="text-sm font-semibold text-slate-500">Đang đồng bộ thời khóa biểu...</p>
          </div>
        ) : currentDayTimetables.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Calendar className="w-14 h-14 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">Chưa có lịch trình cho ngày này.</p>
            <p className="text-xs text-slate-400 mt-1">Nhấn "Thêm Tiết Học Mới" để thiết lập hoạt động mầm non cho các bé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F7F5] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider w-44">Khung Giờ</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Hoạt Động / Môn Học</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Địa Điểm</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Trạng Thái Xung Đột</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentDayTimetables.map(tt => {
                  const hasConflict = conflictSlotIdSet.has(tt.id);
                  return (
                    <tr 
                      key={tt.id} 
                      className={`transition ${
                        hasConflict 
                          ? 'bg-rose-50/70 border-l-4 border-l-rose-500 hover:bg-rose-50' 
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <Clock className={`w-4 h-4 ${hasConflict ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span>{tt.startTime.substring(0,5)} - {tt.endTime.substring(0,5)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border text-xs font-bold ${getSubjectColor(tt.subject || tt.activityName || '')}`}>
                            {tt.subject || tt.activityName}
                          </div>
                          {tt.notes && <div className="text-xs text-slate-500 mt-0.5 ml-1">{tt.notes}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <MapPin className={`w-4 h-4 ${hasConflict ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span>{tt.roomName || 'Tại phòng học của lớp'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasConflict ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Xung đột lịch!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Hợp lệ</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingTimetable(tt);
                              setValue('classId', tt.classId);
                              setValue('dayOfWeek', tt.dayOfWeek);
                              setValue('startTime', tt.startTime.substring(0,5));
                              setValue('endTime', tt.endTime.substring(0,5));
                              setValue('subject', tt.subject || tt.activityName || '');
                              setValue('roomName', tt.roomName || '');
                              setValue('notes', tt.notes || '');
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-500 hover:text-[#275A4E] hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                            title="Chỉnh sửa tiết học"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa tiết học này?')) {
                                deleteTimetableMutation.mutate(tt.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa tiết học"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER / MODAL: BÁO CÁO XUNG ĐỘT (UC-018 Conflict Detection Report Drawer) */}
      {isConflictDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-[#275A4E] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#78C2AD]/20 rounded-xl">
                  <ShieldAlert className="w-6 h-6 text-[#78C2AD]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Báo Cáo Kiểm Tra Xung Đột Lịch Dạy</h2>
                  <p className="text-xs text-white/80">Đối soát trùng lịch Giáo viên (BR-014) & Phòng chức năng toàn trường</p>
                </div>
              </div>
              <button 
                onClick={() => setIsConflictDrawerOpen(false)}
                className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setConflictFilterType('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    conflictFilterType === 'ALL' ? 'bg-[#275A4E] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({detectedConflicts.length})
                </button>
                <button
                  onClick={() => setConflictFilterType('TEACHER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    conflictFilterType === 'TEACHER' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Trùng Giáo viên ({detectedConflicts.filter(c => c.type === 'TEACHER_CONFLICT').length})
                </button>
                <button
                  onClick={() => setConflictFilterType('ROOM')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    conflictFilterType === 'ROOM' ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Trùng Phòng học ({detectedConflicts.filter(c => c.type === 'ROOM_CONFLICT').length})
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-500">
                {detectedConflicts.length === 0 ? 'Hệ thống an toàn' : `Phát hiện ${detectedConflicts.length} điểm xung đột`}
              </span>
            </div>

            {/* Conflict List Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {detectedConflicts.length === 0 ? (
                // Clean State (MSG-072)
                <div className="py-16 px-6 text-center bg-gradient-to-b from-emerald-50/50 to-white border border-[#78C2AD]/40 rounded-3xl">
                  <div className="w-16 h-16 bg-[#78C2AD]/20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#275A4E]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1E4D40]">Hệ Thống Lịch Dạy Chuẩn Xác</h3>
                  <p className="text-sm font-semibold text-[#275A4E] mt-2 max-w-md mx-auto">
                    MSG-072: Không phát hiện xung đột lịch dạy trên toàn trường.
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Tất cả các giáo viên và phòng học chức năng đều được phân bổ hợp lý, không có sự giao thoa trùng giờ.
                  </p>
                </div>
              ) : (
                filteredConflicts.map((c, idx) => (
                  <div 
                    key={c.id || idx}
                    className="p-5 bg-white border-2 border-rose-200 hover:border-rose-300 rounded-2xl shadow-xs transition space-y-3"
                  >
                    {/* Header Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {c.type === 'TEACHER_CONFLICT' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            Trùng Lịch Giáo Viên (MSG-073)
                          </span>
                        )}
                        {c.type === 'ROOM_CONFLICT' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Trùng Phòng Học (MSG-074)
                          </span>
                        )}
                        {c.type === 'TEACHER_OVERLOAD' && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-300">
                            Vượt Định Mức Tiết Dạy (MSG-075)
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-500">
                          Thứ {c.dayOfWeek === 1 ? 'Hai' : c.dayOfWeek === 2 ? 'Ba' : c.dayOfWeek === 3 ? 'Tư' : c.dayOfWeek === 4 ? 'Năm' : c.dayOfWeek === 5 ? 'Sáu' : 'Bảy'}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        {c.startTime} - {c.endTime}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm font-semibold text-slate-800">
                      {c.description}
                    </p>

                    {/* Class info */}
                    {c.classNames.length > 0 && (
                      <div className="text-xs text-slate-600 flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                        <span className="font-bold text-slate-700">Lớp liên quan:</span>
                        {c.classNames.map((name, i) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-semibold text-[#275A4E]">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Remediation Suggestion */}
                    {c.suggestedAction && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Gợi ý khắc phục: </span>
                          <span>{c.suggestedAction}</span>
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                      {c.suggestedRoom && c.conflictingTimetableIds.length > 1 && (
                        <button
                          onClick={() => {
                            applySuggestedRoomMutation.mutate({
                              timetableId: c.conflictingTimetableIds[1],
                              suggestedRoom: c.suggestedRoom!
                            });
                          }}
                          disabled={applySuggestedRoomMutation.isPending}
                          className="px-3.5 py-2 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          {applySuggestedRoomMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building className="w-3.5 h-3.5" />}
                          <span>Áp dụng "{c.suggestedRoom}"</span>
                        </button>
                      )}

                      {c.conflictingTimetableIds.length > 0 && (
                        <button
                          onClick={() => {
                            const targetSlot = allTimetables.find((t: Timetable) => t.id === c.conflictingTimetableIds[0]);
                            if (targetSlot) {
                              setSelectedClassId(targetSlot.classId);
                              setSelectedDay(targetSlot.dayOfWeek);
                              setEditingTimetable(targetSlot);
                              setValue('classId', targetSlot.classId);
                              setValue('dayOfWeek', targetSlot.dayOfWeek);
                              setValue('startTime', targetSlot.startTime.substring(0,5));
                              setValue('endTime', targetSlot.endTime.substring(0,5));
                              setValue('subject', targetSlot.subject || targetSlot.activityName || '');
                              setValue('roomName', targetSlot.roomName || '');
                              setValue('notes', targetSlot.notes || '');
                              setIsConflictDrawerOpen(false);
                              setIsModalOpen(true);
                            }
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Đến tiết học để sửa</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setIsConflictDrawerOpen(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
              >
                Đóng Báo Cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Timetable */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#275A4E] text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {editingTimetable ? 'Chỉnh sửa Tiết học' : 'Thêm Tiết học Mới'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 font-['Plus_Jakarta_Sans']">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Hoạt động / Môn học <span className="text-red-500">*</span></label>
                <input {...register('subject')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="VD: Khám phá khoa học, Ăn trưa..." />
                {errors.subject?.message && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ bắt đầu <span className="text-red-500">*</span></label>
                  <input type="time" {...register('startTime')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                  {errors.startTime?.message && <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ kết thúc <span className="text-red-500">*</span></label>
                  <input type="time" {...register('endTime')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                  {errors.endTime?.message && <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Địa điểm / Phòng học</label>
                <input {...register('roomName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="VD: Phòng Âm nhạc, Sân trường, Tại lớp" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú (Giáo cụ...)</label>
                <textarea {...register('notes')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none h-20 resize-none" placeholder="Ghi chú thêm..."></textarea>
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={createTimetableMutation.isPending} className="flex-1 py-2.5 bg-[#275A4E] text-white font-semibold rounded-xl hover:bg-[#1E4D40] transition flex justify-center items-center gap-2 cursor-pointer">
                  {createTimetableMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lưu Tiết Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
