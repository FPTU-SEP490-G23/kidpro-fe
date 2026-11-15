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
  ShieldCheck,
  CalendarDays,
  UserCheck,
  ArrowRight,
  ExternalLink,
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
      desc: 'Sổ điểm danh có mặt / vắng',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      to: '/teacher/attendance',
      badge: `${stats.present}/${stats.total}`,
    },
    {
      title: 'Tan học & Trả trẻ',
      desc: 'Xác thực người đón tan trường',
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      to: '/teacher/dismissal',
    },
    {
      title: 'Đơn xin nghỉ',
      desc: 'Xét duyệt đơn từ phụ huynh',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      to: '/teacher/leave-requests',
      badge: stats.pendingLeaves > 0 ? `${stats.pendingLeaves} chờ` : undefined,
    },
    {
      title: 'Cho uống thuốc',
      desc: 'Đơn dặn thuốc & ảnh chụp',
      icon: Pill,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      to: '/teacher/medication',
      badge: stats.pendingMeds > 0 ? `${stats.pendingMeds} bé` : undefined,
    },
    {
      title: 'Nhật ký sinh hoạt',
      desc: 'Ăn uống, ngủ trưa, vệ sinh',
      icon: FileText,
      color: 'bg-teal-50 text-teal-600 border-teal-200',
      to: '/teacher/daily-activity',
    },
    {
      title: 'Chỉ số WHO',
      desc: 'Chiều cao, cân nặng, z-score',
      icon: HeartPulse,
      color: 'bg-rose-50 text-rose-600 border-rose-200',
      to: '/teacher/health-metrics',
    },
    {
      title: 'Sự cố y tế',
      desc: 'Sơ cứu & theo dõi thân nhiệt',
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      to: '/teacher/health-incidents',
    },
    {
      title: 'Xe buýt đưa đón',
      desc: 'Điểm danh trạm & chốt khoang',
      icon: Bus,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      to: '/teacher/bus',
    },
    {
      title: 'Kế hoạch bài dạy',
      desc: 'Giáo án & phân phối GDMN',
      icon: BookOpen,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      to: '/teacher/lesson-plans',
    },
    {
      title: 'Đánh giá phát triển',
      desc: 'Theo chuẩn phát triển 5 lĩnh vực',
      icon: Award,
      color: 'bg-violet-50 text-violet-600 border-violet-200',
      to: '/teacher/evaluations',
    },
    {
      title: 'Nhật ký lớp',
      desc: 'Đăng ảnh & chia sẻ khoảnh khắc',
      icon: Sparkles,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      to: '/teacher/journal',
    },
    {
      title: 'Báo hỏng CSVC',
      desc: 'Báo cáo hư hỏng phòng học',
      icon: Wrench,
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      to: '/teacher/equipment',
    },
  ];

  const todayStr = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="w-full space-y-6">
      {/* 1. Header Giáo viên & Lớp (Responsive Desktop Banner) */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0">
            {user?.fullName ? user.fullName.charAt(0) : 'GV'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                Giáo Viên Chủ Nhiệm
              </span>
              <span className="text-xs text-slate-500 font-medium capitalize flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {todayStr}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1">
              Xin chào, {user?.fullName || 'Cô Giáo'}!
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              Phụ trách: <span className="font-semibold text-slate-800">{currentClass.name}</span> • Năm học 2026 - 2027
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition"
          >
            <Users className="w-4 h-4 text-blue-600" /> Sổ Điểm Danh
          </button>
          <button
            onClick={() => setShowFaceCamera(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Camera className="w-4 h-4" /> Quét Mặt AI
          </button>
        </div>
      </div>

      {/* 2. Hàng trên: Thẻ Camera AI & Thẻ Thống Kê Sĩ Số (Grid 12 cột trên Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NÚT ĐIỂM DANH KHUÔN MẶT AI NỔI BẬT (7 cols) */}
        <div className="lg:col-span-7 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-600/15 flex flex-col justify-between">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide border border-white/20">
              <Sparkles className="w-4 h-4 text-amber-300" /> Nhận Diện AI 100% Nội Bộ
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold leading-tight">
                Điểm Danh & Xác Thực Khuôn Mặt AI
              </h2>
              <p className="text-xs md:text-sm text-blue-100/90 mt-2 leading-relaxed max-w-xl">
                Tích hợp thử thách chớp mắt và quay đầu liveness chống giả mạo hình ảnh. Máy chủ xử lý nhận diện tức thời dưới 1 giây, tự động chuyển bé tiếp theo mượt mà.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setShowFaceCamera(true)}
                className="py-3.5 px-6 bg-white text-blue-700 hover:bg-blue-50 active:scale-98 font-bold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Camera className="w-5 h-5 text-blue-600" /> Bắt Đầu Quét Mặt Học Sinh
              </button>
              <button
                onClick={() => navigate('/teacher/dismissal')}
                className="py-3.5 px-5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" /> Xác Thực Người Đón Tan Học
              </button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Thẻ thống kê Sĩ số lớp (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Sĩ Số Lớp Hôm Nay ({stats.total} Học Sinh)
              </h3>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {Math.round((stats.present / (stats.total || 1)) * 100)}% có mặt
              </span>
            </div>

            {/* 3 khối thống kê lớn */}
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-emerald-700 block">Có mặt</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">{stats.present}</span>
              </div>
              <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-rose-700 block">Vắng mặt</span>
                <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{stats.absent}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200/80 p-3.5 rounded-2xl">
                <span className="text-xs font-bold text-amber-700 block">Chưa đến</span>
                <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{stats.pending}</span>
              </div>
            </div>
          </div>

          {/* Các chỉ số công việc chờ xử lý */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Đơn xin nghỉ cần xét duyệt:
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                stats.pendingLeaves > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.pendingLeaves} đơn
              </span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 flex items-center gap-2">
                <Pill className="w-4 h-4 text-purple-500" /> Đơn dặn thuốc buổi trưa:
              </span>
              <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                stats.pendingMeds > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {stats.pendingMeds} học sinh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Lưới chức năng nghiệp vụ mầm non (Responsive Desktop Grid 4-6 cột) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-wide">
              Nghiệp Vụ Giảng Dạy & Chăm Sóc Lớp
            </h3>
            <p className="text-xs text-slate-500">Mọi tác vụ quản lý học sinh và phối hợp chuyên môn</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                onClick={() => navigate(act.to)}
                className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 active:scale-98 flex flex-col justify-between h-36 text-left transition-all relative group cursor-pointer"
              >
                {act.badge && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                    {act.badge}
                  </span>
                )}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${act.color} transition-transform group-hover:scale-105`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                    {act.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Lịch trình trong ngày của Giáo viên mầm non (Desktop Helper Card) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Tiến Độ Sinh Hoạt & Chăm Sóc Trong Ngày
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="font-bold text-blue-600 text-[11px] block">07:30 - 08:30</span>
            <span className="font-bold text-slate-800 block">Đón Trẻ & Điểm Danh</span>
            <span className="text-slate-500 text-[11px] block">Quét khuôn mặt AI tại trạm cổng hoặc cửa lớp.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="font-bold text-indigo-600 text-[11px] block">08:30 - 09:30</span>
            <span className="font-bold text-slate-800 block">Ăn Sáng & Uống Thuốc</span>
            <span className="text-slate-500 text-[11px] block">Kiểm tra đơn dặn thuốc và chụp ảnh lưu hồ sơ.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="font-bold text-teal-600 text-[11px] block">09:30 - 11:00</span>
            <span className="font-bold text-slate-800 block">Hoạt Động Học Tập</span>
            <span className="text-slate-500 text-[11px] block">Thực hiện kế hoạch bài dạy, ghi nhật ký ảnh lớp.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="font-bold text-amber-600 text-[11px] block">11:30 - 14:30</span>
            <span className="font-bold text-slate-800 block">Bán Trú & Giờ Ngủ</span>
            <span className="text-slate-500 text-[11px] block">Bữa trưa dinh dưỡng, giám sát trẻ ngủ trưa an toàn.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
            <span className="font-bold text-emerald-600 text-[11px] block">16:30 - 17:30</span>
            <span className="font-bold text-slate-800 block">Tan Học & Trả Trẻ</span>
            <span className="text-slate-500 text-[11px] block">Xác thực người đón, phát cảnh báo nếu có người lạ.</span>
          </div>
        </div>
      </div>

      {/* Modal Toàn Màn Hình Camera Điểm Danh */}
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

export default TeacherDashboardPage;
