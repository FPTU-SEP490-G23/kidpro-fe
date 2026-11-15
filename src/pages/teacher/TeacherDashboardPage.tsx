import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Camera,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Pill,
  Calendar,
  HeartPulse,
  AlertTriangle,
  Bus,
  BookOpen,
  Award,
  Wrench,
  FileText,
  Sparkles,
  ChevronRight,
  Bell,
} from 'lucide-react';
import { FaceAttendanceCamera } from '../../components/camera/FaceAttendanceCamera';
import { attendanceApi } from '../../api/attendanceApi';

export const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [currentClass, setCurrentClass] = useState<any>({
    id: 'class-demo-01',
    name: 'Lớp Mầm 1 (3-4 Tuổi)',
  });

  const [stats, setStats] = useState({
    total: 25,
    present: 20,
    absent: 3,
    pending: 2,
    pendingLeaves: 2,
    pendingMeds: 1,
    latePickups: 0,
  });

  // Tải danh sách lớp và học sinh của giáo viên
  useEffect(() => {
    const loadClassData = async () => {
      try {
        const classes = await attendanceApi.getTeacherMyClasses();
        if (classes && classes.length > 0) {
          const firstCls = classes[0];
          setCurrentClass({
            id: firstCls.classId || firstCls.id || 'class-demo-01',
            name: firstCls.className || firstCls.name || 'Lớp Mầm 1',
          });

          const students = await attendanceApi.getClassStudents(firstCls.classId || firstCls.id);
          if (students && students.length > 0) {
            setStats((prev) => ({
              ...prev,
              total: students.length,
            }));
          }
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu lớp học giáo viên:', err);
      }
    };

    loadClassData();
  }, []);

  // Lưới các chức năng nghiệp vụ của Giáo viên
  const quickActions = [
    {
      title: 'Điểm danh lớp',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      to: '/teacher/attendance',
      badge: `${stats.present}/${stats.total}`,
    },
    {
      title: 'Tan học & Trả trẻ',
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      to: '/teacher/dismissal',
    },
    {
      title: 'Đơn xin nghỉ',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      to: '/teacher/leave-requests',
      badge: stats.pendingLeaves > 0 ? `${stats.pendingLeaves} chờ` : undefined,
    },
    {
      title: 'Cho uống thuốc',
      icon: Pill,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      to: '/teacher/medication',
      badge: stats.pendingMeds > 0 ? `${stats.pendingMeds} bé` : undefined,
    },
    {
      title: 'Nhật ký sinh hoạt',
      icon: FileText,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      to: '/teacher/daily-activity',
    },
    {
      title: 'Chỉ số WHO',
      icon: HeartPulse,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      to: '/teacher/health-metrics',
    },
    {
      title: 'Sự cố y tế',
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      to: '/teacher/health-incidents',
    },
    {
      title: 'Xe buýt đưa đón',
      icon: Bus,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      to: '/teacher/bus',
    },
    {
      title: 'Giáo án bài dạy',
      icon: BookOpen,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      to: '/teacher/lesson-plans',
    },
    {
      title: 'Đánh giá phát triển',
      icon: Award,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      to: '/teacher/evaluations',
    },
    {
      title: 'Nhật ký lớp',
      icon: Sparkles,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      to: '/teacher/journal',
    },
    {
      title: 'Báo hỏng CSVC',
      icon: Wrench,
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      to: '/teacher/equipment',
    },
  ];

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      {/* 1. Header Giáo viên & Lớp */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            Giáo Viên Chủ Nhiệm
          </span>
          <h1 className="text-lg font-bold text-slate-900 mt-1">{user?.fullName || 'Cô Giáo'}</h1>
          <p className="text-xs text-slate-500 font-medium">{currentClass.name}</p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md">
          {user?.fullName ? user.fullName.charAt(0) : 'GV'}
        </div>
      </div>

      {/* 2. NÚT ĐIỂM DANH KHUÔN MẶT AI NỔI BẬT NHẤT */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/20">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Nhận Diện AI 100% Nội Bộ
          </div>
          <h2 className="text-lg font-extrabold leading-snug">
            Điểm Danh Khuôn Mặt AI
          </h2>
          <p className="text-xs text-blue-100 leading-relaxed max-w-xs">
            Nhận diện liveness chớp mắt và quay đầu theo thử thách từ máy chủ. Tự động chuyển bé tiếp theo mượt mà.
          </p>
          <button
            onClick={() => setShowFaceCamera(true)}
            className="w-full py-3.5 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 touch-target transition-all"
          >
            <Camera className="w-5 h-5 text-blue-600" /> Bắt Đầu Quét Mặt Học Sinh
          </button>
        </div>
        <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 3. Thẻ thống kê Sĩ số lớp */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Sĩ Số Lớp Hôm Nay ({stats.total} Học Sinh)
          </h3>
          <span className="text-[11px] font-medium text-slate-400">
            {new Date().toLocaleDateString('vi-VN')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl">
            <span className="text-[11px] font-semibold text-emerald-700 block">Có mặt</span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">{stats.present}</span>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl">
            <span className="text-[11px] font-semibold text-rose-700 block">Vắng mặt</span>
            <span className="text-xl font-extrabold text-rose-600 mt-0.5 block">{stats.absent}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl">
            <span className="text-[11px] font-semibold text-amber-700 block">Chưa đến</span>
            <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">{stats.pending}</span>
          </div>
        </div>
      </div>

      {/* 4. Lưới chức năng nghiệp vụ mầm non */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Nghiệp Vụ Giảng Dạy & Chăm Sóc
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => navigate(act.to)}
                className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md active:scale-95 flex flex-col items-center text-center justify-between h-24 touch-target transition-all relative"
              >
                {act.badge && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-bold">
                    {act.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${act.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-slate-700 line-clamp-2 leading-tight">
                  {act.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Toàn Màn Hình Camera Điểm Danh (Không pushState URL để bảo vệ stream camera) */}
      {showFaceCamera && (
        <FaceAttendanceCamera
          classId={currentClass.id}
          className={currentClass.name}
          onClose={() => setShowFaceCamera(false)}
          onSuccessCheckIn={(res) => {
            setStats((prev) => ({
              ...prev,
              present: prev.present + 1,
              pending: Math.max(0, prev.pending - 1),
            }));
          }}
        />
      )}
    </div>
  );
};
