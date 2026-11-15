import React, { useState, useEffect } from 'react';
import {
  Camera,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Save,
  RotateCcw,
} from 'lucide-react';
import { FaceAttendanceCamera } from '../../components/camera/FaceAttendanceCamera';
import { attendanceApi } from '../../api/attendanceApi';

interface StudentAttendanceItem {
  id: string;
  studentCode: string;
  fullName: string;
  avatarUrl?: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'PENDING';
  checkInTime?: string;
  note?: string;
}

export const TeacherAttendancePage: React.FC = () => {
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [classId, setClassId] = useState('class-demo-01');
  const [className, setClassName] = useState('Lớp Mầm 1');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const classes = await attendanceApi.getTeacherMyClasses();
        let targetClassId = 'class-demo-01';
        if (classes && classes.length > 0) {
          targetClassId = classes[0].classId || classes[0].id;
          setClassId(targetClassId);
          setClassName(classes[0].className || classes[0].name || 'Lớp Mầm 1');
        }

        const data = await attendanceApi.getClassStudents(targetClassId);
        if (data && data.length > 0) {
          const mapped: StudentAttendanceItem[] = data.map((s: any, idx: number) => ({
            id: s.studentId || s.id || `stu-${idx}`,
            studentCode: s.studentCode || `HS${1000 + idx}`,
            fullName: s.fullName || s.name || `Học sinh ${idx + 1}`,
            avatarUrl: s.photoUrl || s.avatarUrl,
            status: s.attendanceStatus || (idx < 18 ? 'PRESENT' : idx === 18 ? 'EXCUSED' : 'PENDING'),
            checkInTime: idx < 18 ? '07:45' : undefined,
          }));
          setStudents(mapped);
        } else {
          // Fallback danh sách mẫu
          const fallback: StudentAttendanceItem[] = Array.from({ length: 22 }).map((_, i) => ({
            id: `stu-${i + 1}`,
            studentCode: `HS${1001 + i}`,
            fullName: [
              'Nguyễn Minh Khang',
              'Trần Bảo An',
              'Lê Gia Huy',
              'Phạm Quỳnh Anh',
              'Võ Tuấn Kiệt',
              'Hoàng Mai Chi',
              'Đỗ Đức Trí',
              'Bùi Thảo Vy',
            ][i % 8] + ` (${i + 1})`,
            status: i < 16 ? 'PRESENT' : i === 16 ? 'EXCUSED' : i === 17 ? 'ABSENT' : 'PENDING',
            checkInTime: i < 16 ? '07:40' : undefined,
          }));
          setStudents(fallback);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách học sinh:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Đổi trạng thái điểm danh thủ công
  const handleToggleStatus = (studentId: string, nextStatus: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: nextStatus,
            checkInTime: nextStatus === 'PRESENT' ? (s.checkInTime || '08:00') : undefined,
          };
        }
        return s;
      })
    );
  };

  const filteredStudents = students.filter((s) => {
    const matchesFilter = filterStatus === 'ALL' || s.status === filterStatus;
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT' || s.status === 'EXCUSED').length;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Sổ Điểm Danh Lớp</h1>
          <p className="text-xs text-slate-500 font-medium">{className}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Có mặt: {presentCount}/{students.length}
          </span>
        </div>
      </div>

      {/* Nút mở Camera AI Điểm Danh (Toàn màn hình) */}
      <button
        onClick={() => setShowFaceCamera(true)}
        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 touch-target transition-all"
      >
        <Camera className="w-5 h-5 text-white" /> Mở Camera Điểm Danh Khuôn Mặt
      </button>

      {/* Thanh tìm kiếm & lọc */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm tên hoặc mã học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Tab lọc */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: `Tất cả (${students.length})` },
            { id: 'PRESENT', label: `Có mặt (${presentCount})` },
            { id: 'ABSENT', label: `Vắng (${students.filter((s) => s.status === 'ABSENT').length})` },
            { id: 'EXCUSED', label: `Có phép (${students.filter((s) => s.status === 'EXCUSED').length})` },
            { id: 'PENDING', label: `Chưa đến (${students.filter((s) => s.status === 'PENDING').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all touch-target ${
                filterStatus === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách học sinh */}
      <div className="space-y-2">
        {filteredStudents.map((s) => (
          <div
            key={s.id}
            className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 flex-shrink-0">
                {s.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">{s.fullName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-slate-400 font-mono">{s.studentCode}</span>
                  {s.checkInTime && (
                    <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                      <Clock className="w-3 h-3 inline" /> {s.checkInTime}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nút bấm chọn trạng thái 1-chạm */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleStatus(s.id, 'PRESENT')}
                className={`p-1.5 rounded-lg text-xs font-semibold touch-target ${
                  s.status === 'PRESENT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
                title="Có mặt"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleStatus(s.id, 'EXCUSED')}
                className={`p-1.5 rounded-lg text-xs font-semibold touch-target ${
                  s.status === 'EXCUSED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
                title="Có phép"
              >
                Phép
              </button>
              <button
                onClick={() => handleToggleStatus(s.id, 'ABSENT')}
                className={`p-1.5 rounded-lg text-xs font-semibold touch-target ${
                  s.status === 'ABSENT'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-400 hover:text-slate-600'
                }`}
                title="Vắng mặt"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Camera Điểm Danh Toàn Màn Hình */}
      {showFaceCamera && (
        <FaceAttendanceCamera
          classId={classId}
          className={className}
          onClose={() => setShowFaceCamera(false)}
          onSuccessCheckIn={(res) => {
            if (res.student_id) {
              setStudents((prev) =>
                prev.map((st) =>
                  st.id === res.student_id || st.studentCode === res.student_code
                    ? {
                        ...st,
                        status: 'PRESENT',
                        checkInTime: res.checkin_time || '07:50',
                      }
                    : st
                )
              );
            }
          }}
        />
      )}
    </div>
  );
};
