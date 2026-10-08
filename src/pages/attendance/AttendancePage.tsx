import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { attendanceApi } from '../../api/attendanceApi';
import { AttendanceStatus } from '../../types/attendance.types';
import { formatDate } from '../../utils/formatters';
import {
  ClipboardCheck,
  Calendar,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Search,
  Loader2,
  AlertCircle,
  Users,
  RefreshCw,
  PlusCircle,
  Trash2,
} from 'lucide-react';

interface ClassOption {
  id: string;
  name: string;
  ageGroup?: string;
  roomName?: string;
}

interface AttendanceRow {
  studentId: string;
  studentName: string;
  dob: string;
  gender: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

export const AttendancePage: React.FC = () => {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [students, setStudents] = useState<AttendanceRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasExistingAttendance, setHasExistingAttendance] = useState<boolean>(false);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Lấy danh sách lớp học thật từ Supabase
  const loadClasses = async () => {
    try {
      let data: any[] | null = null;
      try {
        const { data: cCore, error: cErr } = await supabase
          .schema('core')
          .from('classes')
          .select('id, name, age_group, room_name')
          .order('name', { ascending: true });
        if (!cErr && cCore) {
          data = cCore;
        } else {
          const { data: cPub, error: pubErr } = await supabase
            .from('classes')
            .select('id, name, age_group, room_name')
            .order('name', { ascending: true });
          if (!pubErr && cPub) data = cPub;
        }
      } catch {
        const { data: cPub } = await supabase
          .from('classes')
          .select('id, name, age_group, room_name')
          .order('name', { ascending: true });
        if (cPub) data = cPub;
      }

      if (data && data.length > 0) {
        const mappedClasses: ClassOption[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          ageGroup: c.age_group,
          roomName: c.room_name,
        }));
        setClasses(mappedClasses);
        setSelectedClass((prev) => prev || mappedClasses[0].id);
      } else {
        setClasses([]);
        setSelectedClass('');
        setStudents([]);
      }
    } catch (err: any) {
      console.warn('Không thể tải danh sách lớp học từ Supabase:', err.message);
      setClasses([]);
      setSelectedClass('');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  // 2. Lấy danh sách học sinh và điểm danh thật theo lớp & ngày được chọn
  const loadStudentsAndAttendance = async (classId: string, date: string) => {
    if (!classId) {
      setStudents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setApiFeedback(null);

    try {
      // Truy vấn học sinh thuộc lớp
      let studentData: any[] | null = null;
      try {
        const { data: sAcad, error: sErr } = await supabase
          .schema('academic')
          .from('students')
          .select('id, full_name, date_of_birth, gender')
          .eq('class_id', classId)
          .order('full_name', { ascending: true });
        if (!sErr && sAcad) {
          studentData = sAcad;
        } else {
          const { data: sPub } = await supabase
            .from('students')
            .select('id, full_name, date_of_birth, gender')
            .eq('class_id', classId)
            .order('full_name', { ascending: true });
          if (sPub) studentData = sPub;
        }
      } catch {
        const { data: sPub } = await supabase
          .from('students')
          .select('id, full_name, date_of_birth, gender')
          .eq('class_id', classId)
          .order('full_name', { ascending: true });
        if (sPub) studentData = sPub;
      }

      // Truy vấn dữ liệu điểm danh ngày hôm đó (ưu tiên attendance.attendances, fallback public.attendances)
      let attData: any[] | null = null;
      try {
        const { data: aAtt, error: aErr } = await supabase
          .schema('attendance')
          .from('attendances')
          .select('student_id, status, check_in_time, check_out_time')
          .eq('date', date);
        if (!aErr && aAtt && aAtt.length > 0) {
          attData = aAtt;
        } else {
          const { data: aPub } = await supabase
            .from('attendances')
            .select('student_id, status, check_in_time, check_out_time')
            .eq('date', date);
          if (aPub && aPub.length > 0) {
            attData = aPub;
          } else if (aAtt) {
            attData = aAtt;
          }
        }
      } catch {
        const { data: aPub } = await supabase
          .from('attendances')
          .select('student_id, status, check_in_time, check_out_time')
          .eq('date', date);
        if (aPub) attData = aPub;
      }

      if (studentData && studentData.length > 0) {
        let hasRecordsInDb = false;
        const rows: AttendanceRow[] = studentData.map((stu: any) => {
          const att = attData?.find((a: any) => a.student_id === stu.id);
          if (att) hasRecordsInDb = true;
          const checkIn = att?.check_in_time ? att.check_in_time.substring(11, 16) : '07:45';
          const checkOut = att?.check_out_time ? att.check_out_time.substring(11, 16) : undefined;

          return {
            studentId: stu.id,
            studentName: stu.full_name || 'Học sinh',
            dob: stu.date_of_birth || '',
            gender: stu.gender || 'Chưa rõ',
            status: (att?.status as AttendanceStatus) || 'PRESENT',
            checkInTime: checkIn,
            checkOutTime: checkOut,
            notes: '',
          };
        });
        setStudents(rows);
        setHasExistingAttendance(hasRecordsInDb);
      } else {
        setStudents([]);
        setHasExistingAttendance(false);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải học sinh/điểm danh từ Supabase:', err.message);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) {
      loadStudentsAndAttendance(selectedClass, attendanceDate);
    } else {
      setStudents([]);
    }
  }, [selectedClass, attendanceDate]);

  // Thống kê nhanh từ dữ liệu thật
  const total = students.length;
  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const permittedAbsent = students.filter((s) => s.status === 'ABSENT_PERMITTED').length;
  const unpermittedAbsent = students.filter((s) => s.status === 'ABSENT_UNPERMITTED').length;

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.studentId === studentId
          ? {
              ...s,
              status: newStatus,
              checkInTime: newStatus === 'PRESENT' ? s.checkInTime || '07:45' : undefined,
            }
          : s
      )
    );
  };

  const handleFieldChange = (
    studentId: string,
    field: 'checkInTime' | 'checkOutTime' | 'notes',
    val: string
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, [field]: val } : s))
    );
  };

  const markAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: 'PRESENT',
        checkInTime: s.checkInTime || '07:45',
      }))
    );
  };

  // Lưu điểm danh thật qua Backend API hoặc Supabase
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      setApiFeedback({
        type: 'error',
        text: 'Chưa có học sinh nào trong lớp để lưu điểm danh.',
      });
      return;
    }

    setIsSaving(true);
    setApiFeedback(null);

    try {
      // 1. Thử gọi API Backend Spring Boot
      await attendanceApi.recordBatchAttendance({
        records: students.map((s) => ({
          studentId: s.studentId,
          date: attendanceDate,
          status: s.status,
          checkInTime: s.checkInTime ? `${attendanceDate}T${s.checkInTime}:00` : undefined,
          checkOutTime: s.checkOutTime ? `${attendanceDate}T${s.checkOutTime}:00` : undefined,
          notes: s.notes,
        })),
      });

      setApiFeedback({
        type: 'success',
        text: '✅ Đã lưu điểm danh thành công lên Database! Dữ liệu đã đồng bộ sang Bếp ăn & Học phí.',
      });
    } catch (backendErr: any) {
      console.warn('Backend API báo lỗi, thử lưu trực tiếp vào Supabase:', backendErr);

      // 2. Fallback: Lưu trực tiếp vào Supabase attendances (Delete cũ rồi Insert mới kèm ID để tránh lỗi 42P10 ON CONFLICT)
      try {
        const studentIds = students.map((s) => s.studentId);

        // Bước 1: Xóa các bản ghi điểm danh cũ của lớp trong ngày này
        try {
          await supabase
            .schema('attendance')
            .from('attendances')
            .delete()
            .in('student_id', studentIds)
            .eq('date', attendanceDate);
        } catch {}

        try {
          await supabase
            .from('attendances')
            .delete()
            .in('student_id', studentIds)
            .eq('date', attendanceDate);
        } catch {}

        // Bước 2: Chuẩn bị các bản ghi mới kèm UUID hợp lệ
        const rowsToInsert = students.map((s) => ({
          id: typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0'),
          student_id: s.studentId,
          date: attendanceDate,
          status: s.status,
          check_in_time: s.status === 'PRESENT' && s.checkInTime ? `${attendanceDate}T${s.checkInTime}:00` : null,
          check_out_time: s.status === 'PRESENT' && s.checkOutTime ? `${attendanceDate}T${s.checkOutTime}:00` : null,
        }));

        let insertSuccess = false;
        let lastError: any = null;

        // Lưu vào schema attendance
        try {
          const aRes = await supabase
            .schema('attendance')
            .from('attendances')
            .insert(rowsToInsert);
          if (!aRes.error) {
            insertSuccess = true;
          } else {
            lastError = aRes.error;
          }
        } catch (e) {
          lastError = e;
        }

        // Lưu đồng bộ vào schema public
        try {
          const pubRes = await supabase
            .from('attendances')
            .insert(rowsToInsert);
          if (!pubRes.error) {
            insertSuccess = true;
          } else if (!insertSuccess) {
            lastError = pubRes.error;
          }
        } catch (e) {
          if (!insertSuccess) lastError = e;
        }

        if (!insertSuccess && lastError) {
          throw lastError;
        }

        setApiFeedback({
          type: 'success',
          text: '✅ Đã lưu điểm danh trực tiếp lên cơ sở dữ liệu Supabase thành công! Dữ liệu đã đồng bộ sang Bếp ăn & Học phí.',
        });

        // Tải lại dữ liệu ngay từ DB để đồng bộ state và cập nhật huy hiệu
        await loadStudentsAndAttendance(selectedClass, attendanceDate);
      } catch (sbErr: any) {
        setApiFeedback({
          type: 'error',
          text: `⚠️ Không thể lưu điểm danh: ${sbErr.message || backendErr.message}`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Xóa / Hủy dữ liệu điểm danh ngày này của lớp
  const handleClearAttendance = async () => {
    if (!selectedClass || students.length === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa toàn bộ dữ liệu điểm danh ngày ${formatDate(attendanceDate)} của lớp này không?`)) return;

    setIsSaving(true);
    setApiFeedback(null);
    try {
      const studentIds = students.map((s) => s.studentId);
      // Xóa trong attendance.attendances và public.attendances
      try {
        await supabase
          .schema('attendance')
          .from('attendances')
          .delete()
          .in('student_id', studentIds)
          .eq('date', attendanceDate);
      } catch {}

      try {
        await supabase
          .from('attendances')
          .delete()
          .in('student_id', studentIds)
          .eq('date', attendanceDate);
      } catch {}

      setApiFeedback({
        type: 'success',
        text: `✅ Đã xóa toàn bộ dữ liệu điểm danh ngày ${formatDate(attendanceDate)}.`,
      });
      await loadStudentsAndAttendance(selectedClass, attendanceDate);
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi khi xóa điểm danh: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Nút tiện ích: Nạp dữ liệu mẫu vào Supabase nếu Database hoàn toàn trống
  const handleSeedSampleData = async () => {
    setIsSeeding(true);
    setApiFeedback(null);
    try {
      // Tạo 2 lớp học thật vào Supabase
      const { data: newClasses, error: classInsertErr } = await supabase
        .from('classes')
        .insert([
          { name: 'Lớp Mầm 1', age_group: '3-4 tuổi', room_name: 'P.101', capacity: 25 },
          { name: 'Lớp Chồi 1', age_group: '4-5 tuổi', room_name: 'P.102', capacity: 30 },
        ])
        .select();

      if (classInsertErr) throw classInsertErr;

      if (newClasses && newClasses.length > 0) {
        const mamClassId = newClasses[0].id;
        // Tạo học sinh thật thuộc Lớp Mầm 1
        const { error: stuInsertErr } = await supabase.from('students').insert([
          { full_name: 'Nguyễn Minh Khôi', date_of_birth: '2021-04-12', gender: 'Nam', class_id: mamClassId, status: 'ACTIVE' },
          { full_name: 'Trần Bảo Anh', date_of_birth: '2021-06-19', gender: 'Nữ', class_id: mamClassId, status: 'ACTIVE' },
          { full_name: 'Lê Gia Huy', date_of_birth: '2021-01-05', gender: 'Nam', class_id: mamClassId, status: 'ACTIVE' },
          { full_name: 'Phạm Quỳnh Chi', date_of_birth: '2021-09-22', gender: 'Nữ', class_id: mamClassId, status: 'ACTIVE' },
        ]);

        if (stuInsertErr) throw stuInsertErr;
      }

      setApiFeedback({
        type: 'success',
        text: '🎉 Đã khởi tạo lớp học và học sinh thật vào database Supabase thành công!',
      });
      await loadClasses();
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi khởi tạo dữ liệu vào Supabase: ${err.message}`,
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredStudents = students.filter((s) =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7 text-indigo-600" />
            <span>Sổ Điểm danh & Báo sĩ số</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi nhận học sinh có mặt, vắng mặt có phép / không phép theo quy chế Mầm non
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedClass) loadStudentsAndAttendance(selectedClass, attendanceDate);
              else loadClasses();
            }}
            disabled={isLoading}
            title="Tải lại từ Database"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {hasExistingAttendance && (
            <button
              onClick={handleClearAttendance}
              disabled={isSaving || isLoading}
              title="Xóa toàn bộ điểm danh ngày này của lớp"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition shadow-xs disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Xóa dữ liệu ngày</span>
            </button>
          )}

          <button
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition shrink-0"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{isSaving ? 'Đang lưu API...' : 'Lưu Điểm danh'}</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả API */}
      {apiFeedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-4 text-sm ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {apiFeedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{apiFeedback.text}</span>
        </div>
      )}

      {/* Bộ lọc Lớp & Ngày & Thao tác nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Chọn Lớp học</label>
          <select
            value={selectedClass}
            disabled={classes.length === 0}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
          >
            {classes.length === 0 ? (
              <option value="">-- Chưa có lớp học trong Database --</option>
            ) : (
              classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.ageGroup ? `(${c.ageGroup})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-500">Ngày điểm danh</label>
            {students.length > 0 && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  hasExistingAttendance
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {hasExistingAttendance ? '● Đã có dữ liệu DB' : '○ Chưa lưu điểm danh'}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium focus:border-indigo-500 focus:outline-hidden"
            />
            <Calendar className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Tìm kiếm học sinh</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Nhập tên học sinh..."
              value={searchTerm}
              disabled={students.length === 0}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
            />
            <Search className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={markAllPresent}
            disabled={students.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-40 disabled:hover:bg-emerald-50"
          >
            <CheckSquare className="h-4 w-4" />
            <span>Tất cả có mặt</span>
          </button>
        </div>
      </div>

      {/* Thẻ Sĩ số trực quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-xs text-slate-500">Tổng sĩ số</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
          <p className="text-xs text-emerald-700 font-medium">Có mặt hôm nay</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-center">
          <p className="text-xs text-amber-700 font-medium">Vắng có phép</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{permittedAbsent}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center">
          <p className="text-xs text-rose-700 font-medium">Vắng không phép</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{unpermittedAbsent}</p>
        </div>
      </div>

      {/* Bảng Điểm danh chi tiết hoặc Trạng thái trống */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu từ Supabase...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
              <Users className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Chưa có dữ liệu học sinh</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {classes.length === 0
                ? 'Hệ thống chưa tìm thấy lớp học nào trong cơ sở dữ liệu Supabase. Nếu muốn tạo nhanh lớp & học sinh mẫu vào Supabase để kiểm thử, bạn có thể bấm nút bên dưới.'
                : 'Lớp học này hiện chưa có học sinh nào được ghi nhận trong cơ sở dữ liệu Supabase.'}
            </p>

            {classes.length === 0 && (
              <button
                onClick={handleSeedSampleData}
                disabled={isSeeding}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                {isSeeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                <span>Khởi tạo nhanh dữ liệu mẫu vào Supabase</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Ngày sinh / Giới tính</th>
                  <th className="py-3 px-4">Trạng thái điểm danh</th>
                  <th className="py-3 px-4">Giờ đến</th>
                  <th className="py-3 px-4">Giờ về</th>
                  <th className="py-3 px-4">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 text-xs font-medium text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{student.studentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Mã: {student.studentId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{student.dob ? formatDate(student.dob) : 'Chưa cập nhật'}</div>
                      <span className="text-[11px] text-slate-400">{student.gender}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'PRESENT')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100'
                          }`}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Có mặt</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT_PERMITTED')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            student.status === 'ABSENT_PERMITTED'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                          }`}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Có phép</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, 'ABSENT_UNPERMITTED')}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            student.status === 'ABSENT_UNPERMITTED'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-100'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Không phép</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={student.checkInTime || ''}
                        disabled={student.status !== 'PRESENT'}
                        onChange={(e) =>
                          handleFieldChange(student.studentId, 'checkInTime', e.target.value)
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={student.checkOutTime || ''}
                        disabled={student.status !== 'PRESENT'}
                        onChange={(e) =>
                          handleFieldChange(student.studentId, 'checkOutTime', e.target.value)
                        }
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Ghi chú đón / lý do..."
                        value={student.notes || ''}
                        onChange={(e) =>
                          handleFieldChange(student.studentId, 'notes', e.target.value)
                        }
                        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-800 placeholder-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
