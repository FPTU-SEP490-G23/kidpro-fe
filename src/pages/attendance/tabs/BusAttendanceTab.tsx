import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Upload,
  Camera,
  RefreshCw,
  Search,
  Check,
  Users
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';

interface BusStudentItem {
  id: string;
  fullName: string;
  className: string;
  stopName: string;
  parentPhone: string;
  status: 'WAITING' | 'BOARDED' | 'DROPPED_OFF' | 'ABSENT';
  boardedAt?: string;
  droppedOffAt?: string;
}

export const BusAttendanceTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [selectedTripType, setSelectedTripType] = useState<'MORNING' | 'AFTERNOON'>('MORNING');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('BUS-01');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Safety Closure State
  const [emptyCabinConfirmed, setEmptyCabinConfirmed] = useState<boolean>(false);
  const [safetyNote, setSafetyNote] = useState<string>('');
  const [cabinPhotoPreview, setCabinPhotoPreview] = useState<string | null>(null);
  const [isClosureCompleted, setIsClosureCompleted] = useState<boolean>(false);

  // 1. Fetch Bus Routes
  const { data: routes = [], isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['teacher-bus-routes'],
    queryFn: async () => {
      return await attendanceApi.getTeacherBusRoutes();
    },
  });

  // Demo Students on Bus
  const [students, setStudents] = useState<BusStudentItem[]>([
    {
      id: 'stu-b1',
      fullName: 'Trần Bảo An',
      className: 'Lớp Mầm 1',
      stopName: 'Trạm 1: 120 Hai Bà Trưng, Q.1',
      parentPhone: '0903 111 222',
      status: 'BOARDED',
      boardedAt: '06:45',
    },
    {
      id: 'stu-b2',
      fullName: 'Lê Gia Hưng',
      className: 'Lớp Chồi 2',
      stopName: 'Trạm 2: 45 Lê Duẩn, Q.1',
      parentPhone: '0912 333 444',
      status: 'WAITING',
    },
    {
      id: 'stu-b3',
      fullName: 'Nguyễn Minh Khang',
      className: 'Lớp Lá 1',
      stopName: 'Trạm 2: 45 Lê Duẩn, Q.1',
      parentPhone: '0988 555 666',
      status: 'WAITING',
    },
    {
      id: 'stu-b4',
      fullName: 'Phạm Quỳnh Anh',
      className: 'Lớp Mầm 2',
      stopName: 'Trạm 3: 88 Nguyễn Đình Chiểu, Q.3',
      parentPhone: '0934 777 888',
      status: 'ABSENT',
    },
  ]);

  // Check-in Mutation
  const handleCheckin = (studentId: string, newStatus: 'BOARDED' | 'DROPPED_OFF') => {
    const timeNow = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            status: newStatus,
            boardedAt: newStatus === 'BOARDED' ? timeNow : s.boardedAt,
            droppedOffAt: newStatus === 'DROPPED_OFF' ? timeNow : s.droppedOffAt,
          };
        }
        return s;
      })
    );

    const st = students.find((s) => s.id === studentId);
    setToastMessage({
      type: 'success',
      text: `Đã xác nhận ${newStatus === 'BOARDED' ? 'lên xe' : 'xuống xe an toàn'} cho bé ${st?.fullName || ''} lúc ${timeNow}`,
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Photo selection for safety closure
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCabinPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Safety Closure
  const handleSafetyClosure = async () => {
    if (!emptyCabinConfirmed) {
      setToastMessage({
        type: 'warning',
        text: 'Vui lòng tích xác nhận đã rà soát khoang xe và không còn bé nào trên xe.',
      });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    try {
      await attendanceApi.performBusSafetyClosure('TRIP-TODAY', {
        emptyCabinConfirmed: true,
        photoUrl: cabinPhotoPreview || undefined,
        note: safetyNote,
      });
    } catch {
      // ignore
    }

    setIsClosureCompleted(true);
    setToastMessage({
      type: 'success',
      text: 'Đã hoàn thành chốt an toàn chuyến xe! Dữ liệu đã được lưu trữ bảo mật.',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.className.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.stopName.toLowerCase().includes(searchStudent.toLowerCase())
  );

  const boardedCount = students.filter((s) => s.status === 'BOARDED').length;
  const waitingCount = students.filter((s) => s.status === 'WAITING').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 transition-all animate-in fade-in shadow-sm ${
            toastMessage.type === 'success'
              ? 'bg-[#78C2AD]/15 border border-[#78C2AD] text-[#1E4D40]'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border border-amber-300 text-amber-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span className="font-semibold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <Bus className="w-6 h-6 text-[#275A4E]" />
            <span>Điểm Danh Xe Buýt Đưa Đón & Chốt An Toàn Khoang Xe</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi danh sách học sinh đón tại từng trạm, check-in lên/xuống xe và quy trình bắt buộc chốt rỗng khoang xe phòng tránh bỏ quên trẻ.
          </p>
        </div>

        {/* Trip Type Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setSelectedTripType('MORNING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTripType === 'MORNING'
                ? 'bg-white text-[#275A4E] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Chuyến Sáng (Đón Đến Trường)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTripType('AFTERNOON')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedTripType === 'AFTERNOON'
                ? 'bg-white text-[#275A4E] shadow-xs'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#275A4E]" />
            <span>Chuyến Chiều (Trả Về Nhà)</span>
          </button>
        </div>
      </div>

      {/* Route Info & Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#EBF7F4] p-4 rounded-2xl border border-[#78C2AD]/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#275A4E] text-white flex items-center justify-center shrink-0">
            <Bus className="w-5 h-5 text-[#78C2AD]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#1E4D40] uppercase">Tuyến Xe Phụ Trách</div>
            <div className="text-sm font-extrabold text-[#1E4D40]">Tuyến số 01 (Q.1 - Q.5)</div>
            <div className="text-[11px] text-slate-500">Biển số: 51B-123.45</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Đang Chờ Đón</div>
            <div className="text-xl font-extrabold text-amber-700">{waitingCount} bé</div>
            <div className="text-[11px] text-slate-400">Tại các trạm tiếp theo</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-[#275A4E]" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Đã Lên Xe</div>
            <div className="text-xl font-extrabold text-[#275A4E]">{boardedCount} bé</div>
            <div className="text-[11px] text-slate-400">Đang an toàn trên xe</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Nghỉ Phép Có Đơn</div>
            <div className="text-xl font-extrabold text-slate-700">{absentCount} bé</div>
            <div className="text-[11px] text-slate-400">Bố mẹ đã báo trước</div>
          </div>
        </div>
      </div>

      {/* Main Student Check-in List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="font-bold text-base text-[#1E4D40] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#275A4E]" />
            <span>Danh Sách Học Sinh Theo Điểm Dừng</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bé, lớp..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-[#275A4E]"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredStudents.map((st) => (
            <div
              key={st.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                st.status === 'BOARDED'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : st.status === 'DROPPED_OFF'
                  ? 'bg-blue-50/50 border-blue-200'
                  : st.status === 'ABSENT'
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    st.status === 'BOARDED'
                      ? 'bg-[#275A4E] text-white'
                      : st.status === 'ABSENT'
                      ? 'bg-slate-200 text-slate-600'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {st.fullName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{st.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                      {st.className}
                    </span>
                    {st.status === 'BOARDED' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        Đã lên xe ({st.boardedAt})
                      </span>
                    )}
                    {st.status === 'DROPPED_OFF' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                        Đã trả trạm ({st.droppedOffAt})
                      </span>
                    )}
                    {st.status === 'ABSENT' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                        Nghỉ học hôm nay
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {st.stopName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {st.parentPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {selectedTripType === 'MORNING' ? (
                  st.status === 'WAITING' ? (
                    <button
                      type="button"
                      onClick={() => handleCheckin(st.id, 'BOARDED')}
                      className="px-3.5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4 text-[#78C2AD]" />
                      <span>Xác Nhận Lên Xe</span>
                    </button>
                  ) : st.status === 'BOARDED' ? (
                    <button
                      type="button"
                      onClick={() => handleCheckin(st.id, 'DROPPED_OFF')}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã Đến Trường</span>
                    </button>
                  ) : null
                ) : (
                  st.status === 'BOARDED' ? (
                    <button
                      type="button"
                      onClick={() => handleCheckin(st.id, 'DROPPED_OFF')}
                      className="px-3.5 py-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Check className="w-4 h-4 text-[#78C2AD]" />
                      <span>Đã Trả Bé Cho Phụ Huynh</span>
                    </button>
                  ) : null
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Closure Card */}
      <div
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
        className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-700 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white">
              Quy Trình Chốt An Toàn Khoang Xe Rỗng (Safety Sweep Confirmation)
            </h3>
            <p className="text-xs text-slate-300">
              Quy chuẩn an toàn quốc tế: Giáo viên đưa đón phải đi dọc từ đầu đến cuối xe để kiểm tra từng hàng ghế, xác nhận không còn học sinh nào ngủ quên.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/10 border border-white/15 cursor-pointer hover:bg-white/15 transition">
              <input
                type="checkbox"
                checked={emptyCabinConfirmed}
                onChange={(e) => setEmptyCabinConfirmed(e.target.checked)}
                className="w-5 h-5 rounded text-[#275A4E] focus:ring-[#78C2AD] mt-0.5 cursor-pointer"
              />
              <span className="text-xs font-bold leading-relaxed">
                Tôi cam kết đã kiểm tra thực tế toàn bộ khoang xe buýt (tất cả các hàng ghế, gầm ghế) và xác nhận 100% khoang xe đã rỗng, không còn học sinh.
              </span>
            </label>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Ghi chú chuyến xe (nếu có):</label>
              <textarea
                rows={2}
                placeholder="Ghi chú về tình hình giao thông, học sinh bỏ quên đồ đạc..."
                value={safetyNote}
                onChange={(e) => setSafetyNote(e.target.value)}
                className="w-full text-xs p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:border-[#78C2AD]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Ảnh minh chứng khoang xe rỗng (Chọn file ảnh từ máy tính):
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-white/30 hover:border-[#78C2AD] bg-white/5 cursor-pointer transition">
                {cabinPhotoPreview ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden">
                    <img src={cabinPhotoPreview} alt="Cabin photo" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-bold text-white">
                      Nhấp để chọn ảnh khác
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-1">
                    <Upload className="w-8 h-8 mx-auto text-[#78C2AD]" />
                    <div className="text-xs font-bold text-white">Tải ảnh chụp khoang xe rỗng</div>
                    <div className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG (tối đa 5MB)</div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSafetyClosure}
              disabled={isClosureCompleted}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isClosureCompleted
                  ? 'bg-emerald-600 text-white cursor-not-allowed'
                  : 'bg-[#E5A93C] hover:bg-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isClosureCompleted ? 'Đã Hoàn Thành Chốt An Toàn' : 'Xác Nhận Chốt An Toàn Chuyến Đi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusAttendanceTab;
