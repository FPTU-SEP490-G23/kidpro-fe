import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';
import classroomApi from '../../api/classroomApi';
import { supabase } from '../../config/supabase';
import { Timetable } from '../../types/classroom.types';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Inbox,
  Plus,
  Trash2,
  Pencil,
  X,
  Clock,
  MapPin,
  Building,
} from 'lucide-react';

interface ClassTransferRow {
  id: string;
  rawId?: string;
  studentName: string;
  fromClassName: string;
  toClassName: string;
  reason: string;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ClassItem {
  id: string;
  name: string;
  ageGroup: string;
  roomName: string;
  capacity: number;
  currentCount: number;
}

export const AcademicPage: React.FC = () => {
  const [transfers, setTransfers] = useState<ClassTransferRow[]>([]);
  const [classesList, setClassesList] = useState<ClassItem[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableClassId, setSelectedTimetableClassId] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'transfers' | 'classes' | 'timetable'>('transfers');
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { role } = useAuth();
  const canManageClasses = role === 'BGH' || role === 'GIAO_VU' || role === 'SYSTEM_ADMIN';

  // Modal thêm Lớp học mới (Dành cho BGH, Giáo vụ, Admin)
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [classForm, setClassForm] = useState<{
    name: string;
    ageGroup: string;
    roomName: string;
    capacity: number | '';
  }>({
    name: '',
    ageGroup: '3-4 tuổi (Khối Mầm)',
    roomName: '',
    capacity: 25,
  });

  // Modal sửa Lớp học
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassForm, setEditClassForm] = useState<{
    name: string;
    ageGroup: string;
    roomName: string;
    capacity: number | '';
  }>({
    name: '',
    ageGroup: '3-4 tuổi (Khối Mầm)',
    roomName: '',
    capacity: 25,
  });

  // Modal thêm thời khóa biểu (Task 19)
  const [showAddTimetableModal, setShowAddTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState<{
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    activityName: string;
    roomName: string;
  }>({
    classId: '',
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '09:30',
    activityName: '',
    roomName: '',
  });

  // Modal sửa thời khóa biểu
  const [showEditTimetableModal, setShowEditTimetableModal] = useState(false);
  const [editingTimetableId, setEditingTimetableId] = useState<string | null>(null);
  const [editTimetableForm, setEditTimetableForm] = useState<{
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    activityName: string;
    roomName: string;
  }>({
    classId: '',
    dayOfWeek: 1,
    startTime: '08:30',
    endTime: '09:30',
    activityName: '',
    roomName: '',
  });

  // Tải dữ liệu thật từ cơ sở dữ liệu Supabase / Spring Boot Backend
  const loadAcademicData = async () => {
    setIsLoading(true);
    try {
      // 1. Tải danh sách lớp và đếm sĩ số thực tế (core.classes & academic.students)
      let classesData: any[] | null = null;
      try {
        const { data, error } = await supabase
          .schema('core')
          .from('classes')
          .select('id, name, age_group, room_name, capacity')
          .order('name', { ascending: true });
        if (!error && data) classesData = data;
        else {
          const { data: pubData } = await supabase
            .from('classes')
            .select('id, name, age_group, room_name, capacity')
            .order('name', { ascending: true });
          if (pubData) classesData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase
          .from('classes')
          .select('id, name, age_group, room_name, capacity')
          .order('name', { ascending: true });
        if (pubData) classesData = pubData;
      }

      let studentsData: any[] | null = null;
      try {
        const { data, error } = await supabase
          .schema('academic')
          .from('students')
          .select('id, full_name, class_id');
        if (!error && data) studentsData = data;
        else {
          const { data: pubData } = await supabase
            .from('students')
            .select('id, full_name, class_id');
          if (pubData) studentsData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase
          .from('students')
          .select('id, full_name, class_id');
        if (pubData) studentsData = pubData;
      }

      if (classesData && classesData.length > 0) {
        const mappedClasses: ClassItem[] = classesData.map((cls: any) => {
          const count = studentsData?.filter((s: any) => s.class_id === cls.id).length || 0;
          return {
            id: cls.id,
            name: cls.name,
            ageGroup: cls.age_group || '3-4 tuổi',
            roomName: cls.room_name || 'Phòng học chính',
            capacity: cls.capacity || 30,
            currentCount: count,
          };
        });
        setClassesList(mappedClasses);
        if (!timetableForm.classId && mappedClasses.length > 0) {
          setTimetableForm((prev) => ({ ...prev, classId: mappedClasses[0].id }));
        }
      } else {
        setClassesList([]);
      }

      // 2. Tải danh sách đơn chuyển lớp (academic.class_transfer_requests)
      let dbTransfers: any[] = [];
      try {
        const resp: any = await classroomApi.getTransferRequests();
        if (resp && Array.isArray(resp)) {
          dbTransfers = resp;
        }
      } catch {
        try {
          const { data: trData, error: trErr } = await supabase
            .schema('academic')
            .from('class_transfer_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (!trErr && trData) {
            dbTransfers = trData;
          } else {
            const { data: pubData } = await supabase
              .from('class_transfer_requests')
              .select('*')
              .order('created_at', { ascending: false });
            if (pubData) dbTransfers = pubData;
          }
        } catch {
          const { data: pubData } = await supabase
            .from('class_transfer_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (pubData) dbTransfers = pubData;
        }
      }

      if (dbTransfers && dbTransfers.length > 0) {
        const rows: ClassTransferRow[] = dbTransfers.map((t: any) => {
          const matchedStu = studentsData?.find((s: any) => s.id === (t.studentId || t.student_id));
          const fromClass = classesData?.find((c: any) => c.id === (t.fromClassId || t.from_class_id));
          const toClass = classesData?.find((c: any) => c.id === (t.toClassId || t.to_class_id));

          return {
            id: t.id ? `TR-${String(t.id).substring(0, 6)}` : 'TR-01',
            rawId: t.id,
            studentName: matchedStu?.full_name || t.studentName || 'Học sinh',
            fromClassName: fromClass?.name || 'Chưa rõ',
            toClassName: toClass?.name || 'Bảo lưu / Lớp mới',
            reason: t.reason || 'Lý do cá nhân',
            requestedDate: t.createdAt || t.created_at || new Date().toISOString().substring(0, 10),
            status: t.status || 'PENDING',
          };
        });
        setTransfers(rows);
      } else {
        setTransfers([]);
      }

      // 3. Tải Thời khóa biểu (Task 19 - academic.timetables)
      let dbTimetables: any[] = [];
      try {
        const resp: any = await classroomApi.getAllTimetables();
        if (resp && Array.isArray(resp)) {
          dbTimetables = resp;
        }
      } catch {
        try {
          const { data: ttData, error: ttErr } = await supabase
            .schema('academic')
            .from('timetables')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });
          if (!ttErr && ttData) {
            dbTimetables = ttData;
          } else {
            const { data: pubData } = await supabase
              .from('timetables')
              .select('*')
              .order('day_of_week', { ascending: true })
              .order('start_time', { ascending: true });
            if (pubData) dbTimetables = pubData;
          }
        } catch {
          const { data: pubData } = await supabase
            .from('timetables')
            .select('*')
            .order('day_of_week', { ascending: true })
            .order('start_time', { ascending: true });
          if (pubData) dbTimetables = pubData;
        }
      }

      if (dbTimetables && dbTimetables.length > 0) {
        const mappedTT: Timetable[] = dbTimetables.map((item: any) => {
          const matchedClass = classesData?.find((c: any) => c.id === (item.classId || item.class_id));
          return {
            id: item.id,
            classId: item.classId || item.class_id,
            className: matchedClass?.name || item.className || 'Toàn trường',
            dayOfWeek: Number(item.dayOfWeek ?? item.day_of_week ?? 1),
            startTime: String(item.startTime || item.start_time || '08:00').substring(0, 5),
            endTime: String(item.endTime || item.end_time || '09:00').substring(0, 5),
            activityName: item.activityName || item.activity_name || 'Hoạt động học',
            roomName: item.roomName || item.room_name || 'Phòng học chính',
          };
        });
        setTimetables(mappedTT);
      } else {
        setTimetables([]);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu học vụ:', err.message);
      setClassesList([]);
      setTransfers([]);
      setTimetables([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicData();
  }, []);

  // Xử lý Duyệt đơn chuyển lớp
  const handleApprove = async (id: string, rawId?: string) => {
    const targetId = rawId || id;
    setProcessingId(id);
    setApiFeedback(null);
    try {
      try {
        await classroomApi.reviewTransferRequest(targetId, {
          status: 'APPROVED',
          reviewNote: 'BGH đã xem xét và đồng ý chuyển lớp',
        });
      } catch {
        const payload = { status: 'APPROVED', review_note: 'BGH đồng ý' };
        const aRes = await supabase.schema('academic').from('class_transfer_requests').update(payload).eq('id', targetId);
        if (aRes.error) {
          await supabase.from('class_transfer_requests').update(payload).eq('id', targetId);
        }
      }
      setTransfers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'APPROVED' } : t))
      );
      setApiFeedback({
        type: 'success',
        text: `✅ Đã phê duyệt đơn ${id} thành công!`,
      });
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi duyệt đơn: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Xử lý Từ chối đơn chuyển lớp
  const handleReject = async (id: string, rawId?: string) => {
    const targetId = rawId || id;
    setProcessingId(id);
    setApiFeedback(null);
    try {
      try {
        await classroomApi.reviewTransferRequest(targetId, {
          status: 'REJECTED',
          reviewNote: 'Sĩ số lớp đích đã đạt mức tối đa',
        });
      } catch {
        const payload = { status: 'REJECTED', review_note: 'Sĩ số lớp đã đầy' };
        const aRes = await supabase.schema('academic').from('class_transfer_requests').update(payload).eq('id', targetId);
        if (aRes.error) {
          await supabase.from('class_transfer_requests').update(payload).eq('id', targetId);
        }
      }
      setTransfers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'REJECTED' } : t))
      );
      setApiFeedback({
        type: 'success',
        text: `✅ Đã từ chối đơn ${id}!`,
      });
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi: ${err.message}`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Thêm mục thời khóa biểu mới (Task 19)
  const handleAddTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timetableForm.classId || !timetableForm.activityName.trim()) return;

    try {
      // 1. Lấy academicYearId thực tế từ cơ sở dữ liệu (core.academic_years hoặc public)
      let validYearId: string | null = null;
      try {
        const { data: yearsCore } = await supabase.schema('core').from('academic_years').select('id').limit(1);
        if (yearsCore && yearsCore.length > 0) {
          validYearId = yearsCore[0].id;
        } else {
          const { data: yearsPub } = await supabase.from('academic_years').select('id').limit(1);
          if (yearsPub && yearsPub.length > 0) validYearId = yearsPub[0].id;
        }
      } catch (e) {
        console.warn('Lỗi đọc academic_years:', e);
      }

      // 2. Nếu chưa có Năm học nào trong database, tự động tạo năm học mặc định "2026-2027"
      if (!validYearId) {
        try {
          const newYearPayload = {
            name: '2026-2027',
            start_date: '2026-09-01',
            end_date: '2027-05-31',
            status: 'ACTIVE',
            enrollment_target: 100,
          };
          const { data: created, error: crErr } = await supabase
            .schema('core')
            .from('academic_years')
            .insert([newYearPayload])
            .select('id')
            .single();
          if (!crErr && created?.id) {
            validYearId = created.id;
          } else {
            const { data: pubCreated } = await supabase
              .from('academic_years')
              .insert([newYearPayload])
              .select('id')
              .single();
            if (pubCreated?.id) validYearId = pubCreated.id;
          }
        } catch (e) {
          console.warn('Không thể tự động tạo năm học:', e);
        }
      }

      const formatTimeString = (t: string) => {
        if (!t) return '08:00:00';
        const parts = t.split(':');
        if (parts.length === 2) return `${t}:00`;
        return t;
      };

      const formattedStart = formatTimeString(timetableForm.startTime);
      const formattedEnd = formatTimeString(timetableForm.endTime);

      const payload = {
        classId: timetableForm.classId,
        dayOfWeek: Number(timetableForm.dayOfWeek),
        startTime: formattedStart,
        endTime: formattedEnd,
        activityName: timetableForm.activityName.trim(),
        roomName: timetableForm.roomName.trim(),
        academicYearId: validYearId,
      };

      try {
        await classroomApi.createTimetable(payload);
      } catch {
        const dbPayload: any = {
          class_id: timetableForm.classId,
          day_of_week: Number(timetableForm.dayOfWeek),
          start_time: formattedStart,
          end_time: formattedEnd,
          activity_name: timetableForm.activityName.trim(),
          room_name: timetableForm.roomName.trim(),
        };
        // Chỉ gán academic_year_id nếu có UUID thật từ DB (tránh lỗi 409 Foreign Key Violation)
        if (validYearId) {
          dbPayload.academic_year_id = validYearId;
        }

        const tRes = await supabase.schema('academic').from('timetables').insert([dbPayload]);
        if (tRes.error) {
          const pubRes = await supabase.from('timetables').insert([dbPayload]);
          if (pubRes.error) throw tRes.error;
        }
      }

      setShowAddTimetableModal(false);
      setTimetableForm((prev) => ({ ...prev, activityName: '' }));
      setApiFeedback({ type: 'success', text: '✅ Đã thêm mục thời khóa biểu vào hệ thống thành công!' });
      await loadAcademicData();
    } catch (err: any) {
      console.error('Lỗi thêm thời khóa biểu:', err);
      const is409 = err.status === 409 || err.code === '23503' || String(err.message).toLowerCase().includes('foreign key');
      setApiFeedback({
        type: 'error',
        text: is409
          ? '⚠️ Lỗi ràng buộc khóa ngoại (409 Conflict): Bảng "core.academic_years" chưa có bản ghi năm học nào để liên kết với thời khóa biểu.'
          : `⚠️ Không thể thêm thời khóa biểu: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Thêm Lớp học mới (Dành cho BGH, Giáo vụ, Admin - core.classes)
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;

    try {
      const payload = {
        name: classForm.name.trim(),
        age_group: classForm.ageGroup,
        room_name: classForm.roomName.trim(),
        capacity: Number(classForm.capacity) || 25,
      };

      const cRes = await supabase.schema('core').from('classes').insert([payload]);
      if (cRes.error) {
        const pubRes = await supabase.from('classes').insert([payload]);
        if (pubRes.error) throw cRes.error;
      }

      setShowAddClassModal(false);
      setClassForm({
        name: '',
        ageGroup: '3-4 tuổi (Khối Mầm)',
        roomName: 'Phòng 101',
        capacity: 25,
      });
      setApiFeedback({ type: 'success', text: `✅ Đã tạo lớp học mới "${classForm.name}" thành công!` });
      await loadAcademicData();
    } catch (err: any) {
      console.error('Lỗi tạo lớp học:', err);
      const isRlsError = err.code === '42501' || err.status === 403 || String(err.message).toLowerCase().includes('row-level security');
      setApiFeedback({
        type: 'error',
        text: isRlsError
          ? `⚠️ Supabase từ chối quyền (403 Forbidden - RLS): Bảng "core.classes" chưa được cấp quyền INSERT hoặc đang bật Row Level Security. Vui lòng vào Supabase Dashboard > Table Editor > classes > Disable RLS hoặc thêm INSERT Policy.`
          : `⚠️ Không thể tạo lớp học: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Xóa lớp học (core.classes)
  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp học "${name}"? Thao tác này sẽ xóa lớp khỏi cơ sở dữ liệu.`)) return;
    try {
      const cRes = await supabase.schema('core').from('classes').delete().eq('id', id);
      if (cRes.error) {
        const pubRes = await supabase.from('classes').delete().eq('id', id);
        if (pubRes.error) throw cRes.error;
      }
      setApiFeedback({ type: 'success', text: `✅ Đã xóa lớp học "${name}" thành công.` });
      await loadAcademicData();
    } catch (err: any) {
      const isRlsError = err.code === '42501' || err.status === 403 || String(err.message).toLowerCase().includes('row-level security');
      setApiFeedback({
        type: 'error',
        text: isRlsError
          ? `⚠️ Supabase từ chối quyền xóa (403 Forbidden - RLS): Bảng "core.classes" chưa được cấp quyền DELETE trên Supabase.`
          : `⚠️ Lỗi xóa lớp học: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Xóa mục thời khóa biểu (Task 19 - academic.timetables)
  const handleDeleteTimetable = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tiết học / hoạt động này khỏi thời khóa biểu?')) return;
    try {
      try {
        await classroomApi.deleteTimetable(id);
      } catch {
        const tRes = await supabase.schema('academic').from('timetables').delete().eq('id', id);
        if (tRes.error) {
          const pubRes = await supabase.from('timetables').delete().eq('id', id);
          if (pubRes.error) throw tRes.error;
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa tiết học thành công.' });
      await loadAcademicData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa thời khóa biểu: ${err.message}` });
    }
  };

  // Mở modal sửa lớp học
  const handleOpenEditClass = (cls: any) => {
    setEditingClassId(cls.id);
    setEditClassForm({
      name: cls.name,
      ageGroup: cls.ageGroup || '3-4 tuổi (Khối Mầm)',
      roomName: cls.roomName || '',
      capacity: cls.capacity || 25,
    });
    setShowEditClassModal(true);
  };

  // Lưu cập nhật lớp học
  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClassId || !editClassForm.name.trim()) return;

    try {
      const payload = {
        name: editClassForm.name.trim(),
        age_group: editClassForm.ageGroup,
        room_name: editClassForm.roomName.trim(),
        capacity: Number(editClassForm.capacity) || 25,
      };

      const cRes = await supabase.schema('core').from('classes').update(payload).eq('id', editingClassId);
      if (cRes.error) {
        const pubRes = await supabase.from('classes').update(payload).eq('id', editingClassId);
        if (pubRes.error) throw cRes.error;
      }

      setShowEditClassModal(false);
      setEditingClassId(null);
      setApiFeedback({ type: 'success', text: `✅ Đã cập nhật thông tin lớp học "${editClassForm.name}" thành công!` });
      await loadAcademicData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật lớp học: ${err.message}` });
    }
  };

  // Mở modal sửa thời khóa biểu
  const handleOpenEditTimetable = (item: any) => {
    setEditingTimetableId(item.id);
    setEditTimetableForm({
      classId: item.classId,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime?.substring(0, 5) || '08:30',
      endTime: item.endTime?.substring(0, 5) || '09:30',
      activityName: item.activityName,
      roomName: item.roomName,
    });
    setShowEditTimetableModal(true);
  };

  // Lưu cập nhật thời khóa biểu
  const handleUpdateTimetable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimetableId || !editTimetableForm.activityName.trim()) return;

    try {
      const payload = {
        class_id: editTimetableForm.classId,
        day_of_week: Number(editTimetableForm.dayOfWeek),
        start_time: editTimetableForm.startTime.length === 5 ? `${editTimetableForm.startTime}:00` : editTimetableForm.startTime,
        end_time: editTimetableForm.endTime.length === 5 ? `${editTimetableForm.endTime}:00` : editTimetableForm.endTime,
        activity_name: editTimetableForm.activityName.trim(),
        room_name: editTimetableForm.roomName.trim(),
      };

      const tRes = await supabase.schema('academic').from('timetables').update(payload).eq('id', editingTimetableId);
      if (tRes.error) {
        const pubRes = await supabase.from('timetables').update(payload).eq('id', editingTimetableId);
        if (pubRes.error) throw tRes.error;
      }

      setShowEditTimetableModal(false);
      setEditingTimetableId(null);
      setApiFeedback({ type: 'success', text: `✅ Đã cập nhật tiết học "${editTimetableForm.activityName}" thành công!` });
      await loadAcademicData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi cập nhật tiết học: ${err.message}` });
    }
  };

  // Xóa đơn chuyển lớp
  const handleDeleteTransfer = async (rawId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn chuyển lớp này?')) return;
    try {
      const res = await supabase.schema('academic').from('class_transfer_requests').delete().eq('id', rawId);
      if (res.error) {
        const pubRes = await supabase.from('class_transfer_requests').delete().eq('id', rawId);
        if (pubRes.error) throw res.error;
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa đơn chuyển lớp thành công.' });
      await loadAcademicData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa đơn: ${err.message}` });
    }
  };

  const dayNames: { [key: number]: string } = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
    6: 'Thứ Bảy',
  };

  const filteredTimetables =
    selectedTimetableClassId === 'ALL'
      ? timetables
      : timetables.filter((t) => t.classId === selectedTimetableClassId);

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-indigo-600" />
            <span>Học vụ & Quản lý Lớp học</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách lớp mầm non, thời khóa biểu sinh hoạt và xét duyệt đơn chuyển lớp / bảo lưu
          </p>
        </div>

        <button
          onClick={loadAcademicData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'transfers'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Đơn xin chuyển lớp ({transfers.filter((t) => t.status === 'PENDING').length} chờ duyệt)</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Danh sách Lớp học ({classesList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timetable')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'timetable'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Thời khóa biểu sinh hoạt ({timetables.length} tiết)</span>
        </button>
      </div>

      {/* ================= TAB 1: DUYỆT CHUYỂN LỚP ================= */}
      {activeTab === 'transfers' && (
        <div className="space-y-4">
          {apiFeedback && (
            <div
              className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
                apiFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {apiFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{apiFeedback.text}</span>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tải danh sách đơn...</p>
              </div>
            ) : transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <Inbox className="h-7 w-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-700">Chưa có đơn chuyển lớp nào</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Cơ sở dữ liệu Supabase hiện chưa có bản ghi chuyển lớp nào từ phụ huynh hoặc giáo vụ.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Mã đơn</th>
                      <th className="py-3 px-4">Học sinh</th>
                      <th className="py-3 px-4">Chuyển từ</th>
                      <th className="py-3 px-4">Chuyển đến</th>
                      <th className="py-3 px-4">Lý do của Phụ huynh</th>
                      <th className="py-3 px-4">Ngày gửi</th>
                      <th className="py-3 px-4 text-center">Trạng thái</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400 font-semibold">{t.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{t.studentName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{t.fromClassName}</td>
                        <td className="py-3.5 px-4 font-semibold text-indigo-600">{t.toClassName}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">{t.reason}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">{formatDate(t.requestedDate)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              t.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-700'
                                : t.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {t.status === 'APPROVED' && 'Đã duyệt'}
                            {t.status === 'REJECTED' && 'Từ chối'}
                            {t.status === 'PENDING' && 'Đang chờ BGH'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {t.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleApprove(t.id, t.rawId)}
                                  disabled={processingId === t.id}
                                  className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition"
                                  title="Phê duyệt"
                                >
                                  {processingId === t.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleReject(t.id, t.rawId)}
                                  disabled={processingId === t.id}
                                  className="rounded-lg bg-rose-600 p-1.5 text-white hover:bg-rose-700 disabled:opacity-50 transition"
                                  title="Từ chối"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteTransfer(t.rawId || t.id)}
                              className="rounded-lg text-slate-400 p-1.5 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Xóa yêu cầu"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DANH SÁCH LỚP ================= */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" />
                <span>Cơ cấu Lớp học & Phòng sinh hoạt</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chức năng thiết lập danh sách lớp, nhóm tuổi và phòng học (Quyền hạn: BGH & Giáo vụ)
              </p>
            </div>

            {canManageClasses && (
              <button
                onClick={() => setShowAddClassModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Lớp học mới</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-slate-600">Đang tải danh sách lớp học...</p>
            </div>
          ) : classesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">Chưa có lớp học nào</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Bảng classes trên Supabase hiện chưa có dữ liệu lớp học nào được tạo.
              </p>
              {canManageClasses && (
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tạo lớp học đầu tiên ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {classesList.map((cls) => (
                <div key={cls.id} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      {cls.ageGroup}
                    </span>
                    {canManageClasses && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          className="text-slate-400 hover:text-indigo-600 p-1 rounded-md transition"
                          title="Chỉnh sửa lớp học"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                          title="Xóa lớp học"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h4 className="mt-2 text-base font-bold text-slate-800">{cls.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>Phòng: {cls.roomName}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Sĩ số thực tế:</span>
                    <span className="font-bold text-slate-800">
                      {cls.currentCount} / {cls.capacity} bé
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: THỜI KHÓA BIỂU SINH HOẠT (TASK 19) ================= */}
      {activeTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Lọc theo Lớp học:</label>
              <select
                value={selectedTimetableClassId}
                onChange={(e) => setSelectedTimetableClassId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="ALL">-- Tất cả các lớp --</option>
                {classesList.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.ageGroup})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddTimetableModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Tiết Học / Hoạt Động Mới</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-slate-600">Đang tải dữ liệu thời khóa biểu...</p>
            </div>
          ) : filteredTimetables.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Chưa có mục thời khóa biểu nào</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Cơ sở dữ liệu Supabase (bảng timetables) hiện chưa có bản ghi thời khóa biểu nào cho lớp này. Nhấn nút phía trên để thêm mới!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((dayNum) => {
                const dayItems = filteredTimetables.filter((t) => t.dayOfWeek === dayNum);
                return (
                  <div key={dayNum} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-indigo-700">{dayNames[dayNum]}</span>
                      <span className="text-[11px] text-slate-400 font-semibold">{dayItems.length} tiết</span>
                    </div>

                    {dayItems.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-6 text-center">Không có tiết</p>
                    ) : (
                      <div className="space-y-2">
                        {dayItems.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1.5 relative group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-indigo-600">
                                <Clock className="h-3 w-3" />
                                {item.startTime} - {item.endTime}
                              </span>

                              {item.id && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                  <button
                                    onClick={() => handleOpenEditTimetable(item)}
                                    className="text-slate-400 hover:text-indigo-600 transition"
                                    title="Sửa tiết học"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTimetable(item.id)}
                                    className="text-slate-400 hover:text-rose-600 transition"
                                    title="Xóa tiết học"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="font-bold text-slate-800 leading-snug">{item.activityName}</p>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {item.roomName}
                              </span>
                              {item.className && (
                                <span className="font-semibold text-indigo-500">{item.className}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL THÊM THỜI KHÓA BIỂU (TASK 19) ================= */}
      {showAddTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Tiết Học Vào Thời Khóa Biểu</h3>
              <button onClick={() => setShowAddTimetableModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddTimetable} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lớp học</label>
                  <select
                    value={timetableForm.classId}
                    onChange={(e) => setTimetableForm({ ...timetableForm, classId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Thứ trong tuần</label>
                  <select
                    value={timetableForm.dayOfWeek}
                    onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value={1}>Thứ Hai</option>
                    <option value={2}>Thứ Ba</option>
                    <option value={3}>Thứ Tư</option>
                    <option value={4}>Thứ Năm</option>
                    <option value={5}>Thứ Sáu</option>
                    <option value={6}>Thứ Bảy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.startTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={timetableForm.endTime}
                    onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hoạt động / Môn học</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nhận biết màu sắc & Tạo hình đất nặn..."
                  value={timetableForm.activityName}
                  onChange={(e) => setTimetableForm({ ...timetableForm, activityName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phòng học / Địa điểm</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng học chính, Sân đa năng, Sân bóng..."
                  value={timetableForm.roomName}
                  onChange={(e) => setTimetableForm({ ...timetableForm, roomName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTimetableModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Tiết Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL THÊM LỚP HỌC MỚI (BGH / GIÁO VỤ) ================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Building className="h-5 w-5 text-indigo-600" />
                <span>Thêm Lớp Học Mới</span>
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên lớp học (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lớp Mầm 1, Lớp Chồi 2, Lớp Lá 1..."
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Khối / Độ tuổi</label>
                <select
                  value={classForm.ageGroup}
                  onChange={(e) => setClassForm({ ...classForm, ageGroup: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="18-36 tháng (Nhà trẻ)">18-36 tháng (Nhà Mầm)</option>
                  <option value="3-4 tuổi (Khối Mầm)">3-4 tuổi (Khối Chồi)</option>
                  <option value="4-5 tuổi (Khối Chồi)">4-5 tuổi (Khối Lá)</option>
                  <option value="5-6 tuổi (Khối Lá)">5-6 tuổi (Khối Hoa)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phòng học sinh hoạt</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: P.101"
                    value={classForm.roomName}
                    onChange={(e) => setClassForm({ ...classForm, roomName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sĩ số tối đa (Chỉ tiêu)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Tạo Lớp Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA LỚP HỌC ================= */}
      {showEditClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Pencil className="h-5 w-5" />
                <span>Chỉnh Sửa Thông Tin Lớp Học</span>
              </div>
              <button
                onClick={() => setShowEditClassModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên lớp học (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lớp Mầm 1, Lớp Chồi 2..."
                  value={editClassForm.name}
                  onChange={(e) => setEditClassForm({ ...editClassForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Khối / Độ tuổi</label>
                <select
                  value={editClassForm.ageGroup}
                  onChange={(e) => setEditClassForm({ ...editClassForm, ageGroup: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="18-36 tháng (Nhà trẻ)">18-36 tháng (Nhà Mầm)</option>
                  <option value="3-4 tuổi (Khối Mầm)">3-4 tuổi (Khối Chồi)</option>
                  <option value="4-5 tuổi (Khối Chồi)">4-5 tuổi (Khối Lá)</option>
                  <option value="5-6 tuổi (Khối Lá)">5-6 tuổi (Khối Hoa)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phòng học sinh hoạt</label>
                  <input
                    type="text"
                    required
                    value={editClassForm.roomName}
                    onChange={(e) => setEditClassForm({ ...editClassForm, roomName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sĩ số tối đa</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    required
                    value={editClassForm.capacity}
                    onChange={(e) => setEditClassForm({ ...editClassForm, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA TIẾT HỌC THỜI KHÓA BIỂU ================= */}
      {showEditTimetableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <Pencil className="h-5 w-5" />
                <span>Chỉnh Sửa Tiết Học Thời Khóa Biểu</span>
              </div>
              <button
                onClick={() => setShowEditTimetableModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTimetable} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lớp học áp dụng (*)</label>
                <select
                  required
                  value={editTimetableForm.classId}
                  onChange={(e) => setEditTimetableForm({ ...editTimetableForm, classId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.ageGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Thứ trong tuần</label>
                <select
                  value={editTimetableForm.dayOfWeek}
                  onChange={(e) => setEditTimetableForm({ ...editTimetableForm, dayOfWeek: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value={2}>Thứ Hai</option>
                  <option value={3}>Thứ Ba</option>
                  <option value={4}>Thứ Tư</option>
                  <option value={5}>Thứ Năm</option>
                  <option value={6}>Thứ Sáu</option>
                  <option value={7}>Thứ Bảy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    value={editTimetableForm.startTime}
                    onChange={(e) => setEditTimetableForm({ ...editTimetableForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Giờ kết thúc</label>
                  <input
                    type="time"
                    required
                    value={editTimetableForm.endTime}
                    onChange={(e) => setEditTimetableForm({ ...editTimetableForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hoạt động / Môn học (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tạo hình - Vẽ hoa, Thể dục sáng, Kỹ năng sống..."
                  value={editTimetableForm.activityName}
                  onChange={(e) => setEditTimetableForm({ ...editTimetableForm, activityName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Địa điểm / Phòng học</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Phòng Âm nhạc, Sân trường, Lớp Mầm 1..."
                  value={editTimetableForm.roomName}
                  onChange={(e) => setEditTimetableForm({ ...editTimetableForm, roomName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditTimetableModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Cập Nhật Tiết Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicPage;
