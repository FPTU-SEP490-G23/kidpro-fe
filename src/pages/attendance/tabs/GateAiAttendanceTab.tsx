import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Check,
  UserCheck,
  Volume2,
  VolumeX,
  BellRing
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { supabase } from '../../../config/supabase';
import { Student, ClassEntity } from '../../../types/classroom.types';
import { FaceLog } from '../../../types/attendance.types';

// Web Audio API Synthesizer Chime
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone cheerful chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.debug('Audio play blocked or unavailable:', err);
  }
};

export const GateAiAttendanceTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Mode Switch: Kiosk View vs Teacher Gate Monitor
  const [viewMode, setViewMode] = useState<'KIOSK' | 'MONITOR'>('KIOSK');
  const [selectedGate, setSelectedGate] = useState<string>('Cổng Chính 01');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedMonitorClass, setSelectedMonitorClass] = useState<string>('ALL');

  // Kiosk Scan States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [welcomeStudent, setWelcomeStudent] = useState<{
    student: Student;
    confidence: number;
    timestamp: string;
    isLate: boolean;
  } | null>(null);

  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Scan tracking for duplicate prevention within 15 minutes
  const recentScanMap = useRef<Map<string, number>>(new Map());

  // 1. Fetch Students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const res = await academicApi.getStudents();
        const raw = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (raw.length > 0) return raw;
        throw new Error('Fallback');
      } catch {
        try {
          const { data } = await supabase.from('students').select('*');
          if (data && data.length > 0) {
            return data.map((s: any) => ({
              id: s.id,
              fullName: s.fullName || s.full_name || s.name || 'Học sinh',
              studentCode: s.studentCode || s.student_code || `HS-${s.id.slice(0, 4)}`,
              allergyInfo: s.allergyInfo || s.allergy_info,
              status: s.status || 'ACTIVE'
            }));
          }
        } catch {
          // ignore error
        }
        return [];
      }
    }
  });

  // 2. Fetch Classes
  const { data: classes = [] } = useQuery<ClassEntity[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const res = await academicApi.getClasses();
        const raw = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (raw.length > 0) return raw;
        throw new Error('Fallback');
      } catch {
        try {
          const { data } = await supabase.from('classes').select('*');
          if (data && data.length > 0) return data;
        } catch {
          // ignore error
        }
        return [
          { id: 'class-mam-1', name: 'Lớp Mầm 1' },
          { id: 'class-choi-1', name: 'Lớp Chồi 1' },
          { id: 'class-la-1', name: 'Lớp Lá 1' },
        ];
      }
    }
  });

  // 3. Recent Face Logs Feed
  const [localLogs, setLocalLogs] = useState<FaceLog[]>([]);

  // 4. Fetch Unresolved Alerts (Strangers / failed matches)
  const { data: unresolvedAlerts = [] } = useQuery<FaceLog[]>({
    queryKey: ['unresolved-alerts'],
    queryFn: async () => {
      try {
        const res = await attendanceApi.getUnresolvedAlerts();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        return [];
      }
    }
  });

  // Auto hide welcome popover after 3 seconds
  useEffect(() => {
    if (welcomeStudent) {
      const timer = setTimeout(() => {
        setWelcomeStudent(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [welcomeStudent]);

  // Face Log Mutation
  const faceLogMutation = useMutation({
    mutationFn: async (data: {
      studentId?: string;
      isMatch: boolean;
      confidenceScore: number;
      photoUrl?: string;
      capturedAt: string;
      eventType?: 'CHECK_IN' | 'CHECK_OUT';
      gateName?: string;
    }) => {
      try {
        await attendanceApi.recordFaceLog(data);
      } catch {
        // Fallback Supabase
        await supabase.from('attendances').insert([
          {
            student_id: data.studentId,
            date: new Date().toISOString().split('T')[0],
            status: 'PRESENT',
            check_in_time: data.capturedAt
          }
        ]);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
    }
  });

  // Simulate Camera Scan Action
  const triggerSimulatedScan = (forcedStudent?: Student, customConfidence?: number) => {
    setIsScanning(true);
    setScanWarning(null);

    setTimeout(() => {
      setIsScanning(false);

      // Random or selected student
      const student = forcedStudent || (students.length > 0 ? students[Math.floor(Math.random() * students.length)] : {
        id: 'stu-sample',
        fullName: 'Học sinh',
        className: 'Mầm 1',
        status: 'ACTIVE' as any
      });

      // Cosine similarity confidence score (Default 0.75 - 0.96)
      const confidence = customConfidence !== undefined ? customConfidence : +(0.72 + Math.random() * 0.24).toFixed(2);
      const now = new Date();
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // BR-026: Check time window (06:30 - 08:30)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 8 || (hours === 8 && minutes > 30);

      // 1. Validation: Confidence Score >= 0.72
      if (confidence < 0.72) {
        setScanWarning('Không nhận diện được khuôn mặt hợp lệ trong cơ sở dữ liệu khuôn mặt. Vui lòng đứng gần hơn hoặc chuyển sang hỗ trợ thủ công.');
        setToastMessage({ type: 'warning', text: 'Không nhận diện được khuôn mặt hợp lệ trong cơ sở dữ liệu khuôn mặt.' });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      // 2. Validation: Prevent Duplicate Scan within 15 minutes
      const lastScanTime = recentScanMap.current.get(student.id);
      const nowMs = Date.now();
      if (lastScanTime && (nowMs - lastScanTime) < 15 * 60 * 1000) {
        const lastFormatted = new Date(lastScanTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setScanWarning(`Học sinh đã điểm danh có mặt hôm nay lúc ${lastFormatted}.`);
        setToastMessage({ type: 'warning', text: `Học sinh đã điểm danh có mặt hôm nay lúc ${lastFormatted}.` });
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      // Record successful scan
      recentScanMap.current.set(student.id, nowMs);

      // Play Chime Audio if enabled
      if (soundEnabled) {
        playChimeSound();
      }

      // Set Welcome Popover
      setWelcomeStudent({
        student,
        confidence,
        timestamp: timeStr,
        isLate
      });

      // Append to live feed
      const newLog: FaceLog = {
        id: `log-${Date.now()}`,
        studentId: student.id,
        studentName: student.fullName,
        className: student.className || 'Khối Mầm',
        isMatch: true,
        confidenceScore: confidence,
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        capturedAt: timeStr,
        eventType: 'CHECK_IN',
        gateName: selectedGate
      };

      setLocalLogs(prev => [newLog, ...prev.slice(0, 19)]);

      // Call API
      faceLogMutation.mutate({
        studentId: student.id,
        isMatch: true,
        confidenceScore: confidence,
        capturedAt: timeStr,
        eventType: 'CHECK_IN',
        gateName: selectedGate
      });

      setToastMessage({
        type: 'success',
        text: `Chào mừng bé ${student.fullName}! Điểm danh thành công (${timeStr})${isLate ? ' - [Ghi nhận Đi muộn]' : ''}`
      });
      setTimeout(() => setToastMessage(null), 4000);
    }, 700);
  };

  // Stats calculation
  const totalStudents = students.length || 35;
  const presentCount = localLogs.length;
  const permittedLeaveCount = 2; // Demo count
  const pendingCount = Math.max(0, totalStudents - presentCount - permittedLeaveCount);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 shadow-sm ${
          toastMessage.type === 'success' ? 'bg-[#78C2AD]/15 border border-[#78C2AD] text-[#1E4D40]' : 
          toastMessage.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
          'bg-rose-50 border border-rose-300 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" /> : 
           toastMessage.type === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" /> :
           <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span className="font-semibold text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & View Mode Switcher */}
      <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#275A4E]" />
            <span>Điểm Danh Đón Trẻ Bằng AI Khuôn Mặt</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Camera AI trạm cổng tự động nhận diện học sinh (06:30 - 08:30 sáng), phát thông báo FCM tức thì cho phụ huynh
          </p>
        </div>

        {/* Mode Toggle & Gate Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedGate}
            onChange={e => setSelectedGate(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
          >
            <option value="Cổng Chính 01">Trạm: Cổng Chính 01</option>
            <option value="Cổng Chính 02">Trạm: Cổng Chính 02</option>
            <option value="Cổng Phụ Sau">Trạm: Cổng Phụ Sau</option>
          </select>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-[#78C2AD]/15 border-[#78C2AD]/40 text-[#1E4D40]'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Chuông âm thanh đang bật' : 'Chuông âm thanh đã tắt'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#275A4E]" /> : <VolumeX className="w-4 h-4" />}
            <span>Âm thanh</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('KIOSK')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'KIOSK'
                  ? 'bg-white text-[#275A4E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Màn Hình Kiosk Cổng
            </button>
            <button
              onClick={() => setViewMode('MONITOR')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'MONITOR'
                  ? 'bg-white text-[#275A4E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Giám Sát Của Giáo Viên
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: KIOSK DISPLAY VIEW */}
      {viewMode === 'KIOSK' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Viewport (Camera Stream) */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl overflow-hidden shadow-xl border-4 border-slate-800 relative flex flex-col min-h-[480px]">
            {/* Camera Top Bar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI Camera LIVE: {selectedGate}</span>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-[#78C2AD]" />
                <span>{new Date().toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            {/* Video Canvas Simulation */}
            <div className="relative flex-1 flex items-center justify-center p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
              {/* Background school gate backdrop */}
              <div 
                className="absolute inset-0 opacity-20 bg-cover bg-center"
                style={{ backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80')` }}
              />

              {/* Face Guide Oval Target Box */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-64 h-80 rounded-[50%] border-4 transition-all duration-300 flex items-center justify-center relative ${
                  welcomeStudent
                    ? 'border-[#78C2AD] shadow-[0_0_50px_rgba(120,194,173,0.5)] scale-105'
                    : scanWarning
                    ? 'border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)]'
                    : 'border-white/40 border-dashed animate-pulse shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                }`}>
                  {/* Scanning Crosshairs */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/40 rounded-full" />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/40 rounded-full" />

                  {isScanning && (
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="w-10 h-10 animate-spin text-[#78C2AD]" />
                      <span className="text-xs font-bold tracking-wider uppercase text-[#78C2AD]">Đang trích xuất đặc trưng...</span>
                    </div>
                  )}

                  {!isScanning && !welcomeStudent && (
                    <div className="text-center p-4 text-white/70">
                      <UserCheck className="w-12 h-12 mx-auto mb-2 text-white/50" />
                      <p className="text-xs font-medium">Vui lòng đứng vào giữa khung hình</p>
                      <p className="text-[10px] text-white/40 mt-1">Giữ thẳng mặt trong 1 giây</p>
                    </div>
                  )}
                </div>

                {/* Status caption under oval */}
                <div className="mt-4 text-center">
                  {welcomeStudent && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#78C2AD] text-[#1E4D40] text-xs font-bold rounded-full shadow-lg">
                      <Check className="w-4 h-4" /> Đã xác thực danh tính ({Math.round(welcomeStudent.confidence * 100)}%)
                    </span>
                  )}
                  {scanWarning && (
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg">
                      <AlertTriangle className="w-4 h-4" /> {scanWarning}
                    </span>
                  )}
                </div>
              </div>

              {/* WELCOME POPOVER */}
              {welcomeStudent && (
                <div className="absolute bottom-6 left-6 right-6 z-30 bg-white/95 backdrop-blur-md rounded-3xl p-5 border-2 border-[#78C2AD] shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#78C2AD] shadow-md bg-slate-100 shrink-0">
                        <img 
                          src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80" 
                          alt="Học sinh" 
                          className="w-full h-full object-cover" 
                        />
                      </div>

                      {/* Greeting info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/40">
                            Khớp AI: {Math.round(welcomeStudent.confidence * 100)}%
                          </span>
                          {welcomeStudent.isLate && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Sau 08:30 (Đi muộn)
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-[#1E4D40] mt-0.5">
                          Chào mừng bé {welcomeStudent.student.fullName}!
                        </h3>
                        <p className="text-xs text-slate-600 font-medium">
                          {welcomeStudent.student.className || 'Khối Mầm'} • Quét mặt lúc <span className="font-mono font-bold text-[#275A4E]">{welcomeStudent.timestamp}</span>
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-end">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#275A4E] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <BellRing className="w-4 h-4 text-[#78C2AD] animate-bounce" />
                        <span>Đã phát thông báo FCM cho bố mẹ</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">Đồng bộ sĩ số sang Bếp ăn</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Simulation Action Bar */}
            <div className="p-4 bg-slate-950/80 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-white/60">
                Thao tác mô phỏng AI Camera:
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => triggerSimulatedScan(undefined, 0.94)}
                  disabled={isScanning}
                  className="px-4 py-2 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
                  <span>Quét Thành Công (0.94)</span>
                </button>

                <button
                  onClick={() => triggerSimulatedScan(undefined, 0.65)}
                  disabled={isScanning}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Thử nghiệm trường hợp không đạt ngưỡng 0.72"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Test Lỗi &lt; 0.72</span>
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel: Kiosk Quick Stats & Live Stream Log */}
          <div className="space-y-4">
            {/* Quick Sĩ Số Stats */}
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#275A4E]" />
                  <span>Sĩ Số Hôm Nay</span>
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#78C2AD]/20 text-[#1E4D40]">
                  Khung 06:30 - 08:30
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-xl font-bold text-emerald-700">{presentCount}</span>
                  <span className="text-[11px] font-bold text-emerald-800 block mt-0.5">Đã đến</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <span className="text-xl font-bold text-slate-700">{pendingCount}</span>
                  <span className="text-[11px] font-semibold text-slate-600 block mt-0.5">Chờ đến</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <span className="text-xl font-bold text-amber-700">{permittedLeaveCount}</span>
                  <span className="text-[11px] font-semibold text-amber-800 block mt-0.5">Có phép</span>
                </div>
              </div>
            </div>

            {/* Live Feed Stream */}
            <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col h-[340px]">
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-[#275A4E]" />
                  <span>Lượt Quét Gần Nhất</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{localLogs.length} sự kiện</span>
              </div>

              <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
                {localLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">Chưa có lượt quét nào tại cổng hôm nay</div>
                ) : (
                  localLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        {log.photoUrl ? (
                          <img src={log.photoUrl} alt={log.studentName} className="w-full h-full object-cover" />
                        ) : (
                          <UserCheck className="w-5 h-5 text-slate-400 m-auto mt-2.5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{log.studentName}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{log.className} • {log.gateName}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#275A4E] block">{log.capturedAt}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {Math.round(log.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: TEACHER GATE DASHBOARD MONITOR VIEW */}
      {viewMode === 'MONITOR' && (
        <div className="space-y-6">
          {/* Class Filter & Monitor Header */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#1E4D40] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#275A4E]" />
                <span>Bảng Giám Sát Cổng Đón Trẻ Theo Lớp</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Theo dõi sĩ số thời gian thực và đối chiếu lượt quét đón trẻ buổi sáng
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Lớp học:</span>
              <select
                value={selectedMonitorClass}
                onChange={e => setSelectedMonitorClass(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
              >
                <option value="ALL">Toàn trường (Tất cả các lớp)</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Realtime Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Tổng sĩ số trường</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalStudents} bé</span>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Đã quét có mặt</span>
              <span className="text-2xl font-bold text-emerald-800 mt-1 block">{presentCount} bé ({Math.round((presentCount / (totalStudents || 1)) * 100)}%)</span>
            </div>

            <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">Chưa đến cổng</span>
              <span className="text-2xl font-bold text-amber-800 mt-1 block">{pendingCount} bé</span>
            </div>

            <div className="bg-blue-50/70 p-5 rounded-3xl border border-blue-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">Xin nghỉ có phép</span>
              <span className="text-2xl font-bold text-blue-800 mt-1 block">{permittedLeaveCount} bé</span>
            </div>
          </div>

          {/* Unresolved Stranger Alert Watcher Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>Giám Sát Cảnh Báo Người Lạ / Nhận Diện Thất Bại (Cổng Trường)</span>
              </h3>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {unresolvedAlerts.length} cảnh báo chưa giải quyết
              </span>
            </div>

            {unresolvedAlerts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Khu vực cổng an toàn</p>
                <p className="text-xs text-slate-400 mt-0.5">Không phát hiện người lạ hoặc sự cố quét nhận diện bất thường</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {unresolvedAlerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
                    <div className="w-12 h-12 bg-rose-100 rounded-xl overflow-hidden shrink-0">
                      {alert.photoUrl ? (
                        <img src={alert.photoUrl} alt="Stranger" className="w-full h-full object-cover" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-rose-600 m-auto mt-3" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-rose-900 block">Nghi vấn người lạ tại {alert.gateName || 'Cổng'}</span>
                      <span className="text-[11px] text-rose-700 block font-mono">{alert.capturedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
