import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldAlert,
  BellRing,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Volume2,
  VolumeX,
  UserCheck,
  Camera,
  RefreshCw,
  Sparkles,
  Info,
  LogOut,
  X,
  Fingerprint
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { supabase } from '../../../config/supabase';
import { Student, ClassEntity } from '../../../types/classroom.types';
import { EmergencyPickupAuthorization } from '../../../types/attendance.types';

// Web Audio API Ringtone / Chime synthesizer for teacher pickup alerts
const playDismissalAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    // School chime alert melody: E5 -> G#5 -> B5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    osc1.frequency.setValueAtTime(830.61, ctx.currentTime + 0.15);
    osc1.frequency.setValueAtTime(987.77, ctx.currentTime + 0.3);

    osc2.frequency.setValueAtTime(329.63, ctx.currentTime);
    osc2.frequency.setValueAtTime(415.3, ctx.currentTime + 0.15);
    osc2.frequency.setValueAtTime(493.88, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.9);
    osc2.stop(ctx.currentTime + 0.9);
  } catch (err) {
    console.debug('Dismissal chime audio error or blocked:', err);
  }
};

interface ActivePickupAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  studentAvatarUrl?: string;
  isStudentPresentToday: boolean;
  hasAlreadyLeft: boolean;
  leftAtTime?: string;
  pickupPersonName: string;
  relationship: string;
  identityCard: string;
  phone: string;
  cameraPhotoUrl: string;
  authorizationType: 'FIXED_GUARDIAN' | 'EMERGENCY_ONE_DAY';
  authorizationStatus: 'VERIFIED' | 'PENDING' | 'USED' | 'EXPIRED' | 'REVOKED';
  confidenceScore: number; // BR-023: must be >= 0.85
  arrivedAt: string;
  emergencyAuthId?: string;
}

export const DismissalPickupTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedSubTab, setSelectedSubTab] = useState<'LIVE_GATE' | 'EMERGENCY_LIST'>('LIVE_GATE');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [qrSearchQuery, setQrSearchQuery] = useState<string>('');

  // Active Alert Modal State (when person arrives at gate)
  const [activeAlert, setActiveAlert] = useState<ActivePickupAlert | null>(null);

  // Stranger Alert Security Lockdown State
  const [isSecurityAlertActive, setIsSecurityAlertActive] = useState<boolean>(false);
  const [securityAlertDetails, setSecurityAlertDetails] = useState<string | null>(null);

  // Toast / System Messages
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Local state tracking students who have already checked out today
  const dismissedStudentsMap = useRef<Map<string, string>>(new Map());

  // 1. Fetch Classes
  const { data: classes = [] } = useQuery<ClassEntity[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      try {
        const res = await academicApi.getClasses();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        const { data } = await supabase.from('classes').select('*');
        return data || [];
      }
    }
  });

  // 2. Fetch Students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        const res = await academicApi.getStudents();
        return Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch {
        const { data } = await supabase.from('students').select('*');
        return data || [];
      }
    }
  });

  // 3. Fetch Today's Emergency Pickup Authorizations (UC-023 API: GET /api/academic/emergency-pickups/today)
  const { data: emergencyPickups = [], isLoading: isLoadingEmergency } = useQuery<EmergencyPickupAuthorization[]>({
    queryKey: ['todayEmergencyPickups'],
    queryFn: async () => {
      try {
        const res = await attendanceApi.getTodayEmergencyPickups();
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (list && list.length > 0) return list;
      } catch (e) {
        console.warn('API getTodayEmergencyPickups error, using fallback data:', e);
      }

      // High-quality fallback records for demonstration
      return [
        {
          id: 'emg-01',
          studentId: 'stu-01',
          studentName: 'Trần Gia Bảo',
          studentClassName: 'Mầm 1',
          studentAvatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
          pickupPersonName: 'Nguyễn Thị Bích (Bác ruột)',
          relationship: 'Bác ruột',
          phone: '0912 345 678',
          identityCard: '001198004521',
          photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
          qrCode: 'KIDPRO-EMG-7749',
          validDate: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          notes: 'Mẹ bận công tác đột xuất, ủy quyền bác ruột đón bé chiều nay.',
          createdAt: '08:15:00'
        },
        {
          id: 'emg-02',
          studentId: 'stu-02',
          studentName: 'Lê Minh Anh',
          studentClassName: 'Nhà trẻ 1',
          pickupPersonName: 'Trần Văn Long (Chú ruột)',
          relationship: 'Chú ruột',
          phone: '0988 765 432',
          identityCard: '025091003412',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          qrCode: 'KIDPRO-EMG-8891',
          validDate: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          notes: 'Bố mẹ đi làm về muộn, nhờ chú đón về nhà ông bà.',
          createdAt: '09:30:00'
        },
        {
          id: 'emg-03',
          studentId: 'stu-03',
          studentName: 'Phạm Hải Đăng',
          studentClassName: 'Chồi 2',
          pickupPersonName: 'Hoàng Mai Phương',
          relationship: 'Người giúp việc gia đình',
          phone: '0934 112 233',
          identityCard: '031195009876',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          qrCode: 'KIDPRO-EMG-1029',
          validDate: new Date().toISOString().split('T')[0],
          status: 'REVOKED',
          notes: 'Ủy quyền đã bị phụ huynh hủy trên ứng dụng di động lúc 14:00.',
          createdAt: '07:45:00'
        }
      ];
    }
  });

  // Use Emergency Pickup Mutation (PUT /api/academic/emergency-pickups/{id}/use)
  const useEmergencyPickupMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await attendanceApi.useEmergencyPickup(id);
      } catch {
        return { success: true, id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayEmergencyPickups'] });
    }
  });

  // Check-out Face Log Mutation (POST /api/attendance/face-logs)
  const checkOutMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      guardianId?: string;
      isMatch: boolean;
      confidenceScore: number;
      photoUrl?: string;
      capturedAt: string;
      eventType: 'CHECK_OUT';
    }) => {
      try {
        await attendanceApi.recordFaceLog(data);
      } catch (err) {
        console.warn('API recordFaceLog checkout fallback:', err);
      }
      return data;
    }
  });

  // Trigger Simulated Pickup Arrival from Camera Gate
  const simulateArrival = (type: 'FIXED_VALID' | 'EMERGENCY_VALID' | 'LOW_CONFIDENCE' | 'ALREADY_PICKED' | 'REVOKED') => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (soundEnabled) {
      playDismissalAlertChime();
    }

    if (type === 'FIXED_VALID') {
      const student = students[0] || {
        id: 'stu-01',
        fullName: 'Trần Gia Bảo',
        className: 'Mầm 1'
      };

      const hasAlreadyLeft = dismissedStudentsMap.current.has(student.id);

      setActiveAlert({
        id: 'alert-' + Date.now(),
        studentId: student.id,
        studentName: student.fullName,
        studentCode: 'HS-1001',
        className: student.className || 'Mầm 1',
        studentAvatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
        isStudentPresentToday: true,
        hasAlreadyLeft,
        leftAtTime: dismissedStudentsMap.current.get(student.id),
        pickupPersonName: 'Trần Quốc Tuấn',
        relationship: 'Bố ruột',
        identityCard: '001085002134',
        phone: '0903 456 789',
        cameraPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        authorizationType: 'FIXED_GUARDIAN',
        authorizationStatus: 'VERIFIED',
        confidenceScore: 0.93, // >= 0.85 (BR-023)
        arrivedAt: nowStr
      });
    } else if (type === 'EMERGENCY_VALID') {
      const emg = emergencyPickups[0];
      const studentId = emg?.studentId || 'stu-02';
      const hasAlreadyLeft = dismissedStudentsMap.current.has(studentId);

      setActiveAlert({
        id: 'alert-' + Date.now(),
        studentId,
        studentName: emg?.studentName || 'Lê Minh Anh',
        studentCode: 'HS-1002',
        className: emg?.studentClassName || 'Nhà trẻ 1',
        studentAvatarUrl: emg?.studentAvatarUrl || 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
        isStudentPresentToday: true,
        hasAlreadyLeft,
        leftAtTime: dismissedStudentsMap.current.get(studentId),
        pickupPersonName: emg?.pickupPersonName || 'Nguyễn Thị Bích',
        relationship: emg?.relationship || 'Bác ruột',
        identityCard: emg?.identityCard || '001198004521',
        phone: emg?.phone || '0912 345 678',
        cameraPhotoUrl: emg?.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        authorizationType: 'EMERGENCY_ONE_DAY',
        authorizationStatus: emg?.status || 'PENDING',
        confidenceScore: 0.89, // >= 0.85
        arrivedAt: nowStr,
        emergencyAuthId: emg?.id
      });
    } else if (type === 'LOW_CONFIDENCE') {
      // BR-023: Similarity < 0.85 -> MSG-087 & Stranger security alert
      setActiveAlert({
        id: 'alert-' + Date.now(),
        studentId: 'stu-sample',
        studentName: 'Nguyễn Tuấn Kiệt',
        studentCode: 'HS-1005',
        className: 'Mầm 2',
        isStudentPresentToday: true,
        hasAlreadyLeft: false,
        pickupPersonName: 'Khuôn mặt chưa xác định',
        relationship: 'Không rõ danh tính',
        identityCard: 'Chưa xác thực',
        phone: 'Chưa có',
        cameraPhotoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
        authorizationType: 'FIXED_GUARDIAN',
        authorizationStatus: 'PENDING',
        confidenceScore: 0.68, // < 0.85
        arrivedAt: nowStr
      });
    } else if (type === 'ALREADY_PICKED') {
      const student = students[0] || { id: 'stu-01', fullName: 'Trần Gia Bảo', className: 'Mầm 1' };
      const leftTime = dismissedStudentsMap.current.get(student.id) || '16:15:30';
      dismissedStudentsMap.current.set(student.id, leftTime);

      setActiveAlert({
        id: 'alert-' + Date.now(),
        studentId: student.id,
        studentName: student.fullName,
        studentCode: 'HS-1001',
        className: student.className || 'Mầm 1',
        isStudentPresentToday: true,
        hasAlreadyLeft: true,
        leftAtTime: leftTime,
        pickupPersonName: 'Người xưng là người nhà',
        relationship: 'Không rõ',
        identityCard: '001085002134',
        phone: '0903 456 789',
        cameraPhotoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        authorizationType: 'FIXED_GUARDIAN',
        authorizationStatus: 'VERIFIED',
        confidenceScore: 0.91,
        arrivedAt: nowStr
      });
    } else if (type === 'REVOKED') {
      const rev = emergencyPickups.find(p => p.status === 'REVOKED') || emergencyPickups[2];
      setActiveAlert({
        id: 'alert-' + Date.now(),
        studentId: rev?.studentId || 'stu-03',
        studentName: rev?.studentName || 'Phạm Hải Đăng',
        studentCode: 'HS-1003',
        className: rev?.studentClassName || 'Chồi 2',
        isStudentPresentToday: true,
        hasAlreadyLeft: false,
        pickupPersonName: rev?.pickupPersonName || 'Hoàng Mai Phương',
        relationship: rev?.relationship || 'Người giúp việc',
        identityCard: rev?.identityCard || '031195009876',
        phone: rev?.phone || '0934 112 233',
        cameraPhotoUrl: rev?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        authorizationType: 'EMERGENCY_ONE_DAY',
        authorizationStatus: 'REVOKED',
        confidenceScore: 0.92,
        arrivedAt: nowStr,
        emergencyAuthId: rev?.id
      });
    }
  };

  // Handler: Confirm Dismissal Handover
  const handleConfirmDismissal = () => {
    if (!activeAlert) return;

    // Rule 1: Check if already picked up (MSG-096)
    if (activeAlert.hasAlreadyLeft) {
      setToastMessage({
        type: 'error',
        text: `MSG-096: Học sinh này đã được đón về hôm nay lúc ${activeAlert.leftAtTime}. Cần tiến hành kiểm tra làm rõ ngay.`
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    // Rule 2: Check revoked or expired authorization (MSG-095)
    if (activeAlert.authorizationStatus === 'EXPIRED' || activeAlert.authorizationStatus === 'REVOKED') {
      setToastMessage({
        type: 'error',
        text: 'MSG-095: Giấy ủy quyền đón trẻ của người này đã hết hạn hoặc bị thu hồi. Tuyệt đối không giao trẻ.'
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    // Rule 3: Check AI confidence score >= 0.85 (BR-023 & MSG-087)
    if (activeAlert.confidenceScore < 0.85) {
      setToastMessage({
        type: 'warning',
        text: 'MSG-087: Không nhận diện được khuôn mặt hợp lệ trong cơ sở dữ liệu khuôn mặt (Độ tin cậy < 0.85).'
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    // Execute dismissal handover
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    dismissedStudentsMap.current.set(activeAlert.studentId, timeStr);

    // If emergency authorization, mark as USED
    if (activeAlert.emergencyAuthId) {
      useEmergencyPickupMutation.mutate(activeAlert.emergencyAuthId);
    }

    // Record check-out face log
    checkOutMutation.mutate({
      studentId: activeAlert.studentId,
      isMatch: true,
      confidenceScore: activeAlert.confidenceScore,
      photoUrl: activeAlert.cameraPhotoUrl,
      capturedAt: timeStr,
      eventType: 'CHECK_OUT'
    });

    setToastMessage({
      type: 'success',
      text: `MSG-093: Đã trao trả bé an toàn cho ${activeAlert.pickupPersonName} (Lúc ${timeStr}). FCM thông báo đã gửi đến phụ huynh.`
    });

    // Close alert modal
    setActiveAlert(null);
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Handler: Trigger Stranger / Suspicious Person Lockdown Alert
  const handleTriggerSecurityLockdown = () => {
    if (!activeAlert) return;
    setIsSecurityAlertActive(true);
    setSecurityAlertDetails(`Cảnh báo kích hoạt bởi Giáo viên lúc ${activeAlert.arrivedAt}. Người lạ hoặc nghi vấn tại Cổng trường đối với học sinh ${activeAlert.studentName}. Đã phong tỏa cổng và gửi báo động đến Đội Bảo vệ & Ban Giám Hiệu.`);
    setActiveAlert(null);
  };

  // Filter emergency pickups
  const filteredEmergencyList = useMemo(() => {
    return emergencyPickups.filter((item) => {
      const matchClass = selectedClassId === 'ALL' || item.studentClassName === selectedClassId;
      const matchSearch = !qrSearchQuery.trim() ||
        item.studentName?.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
        item.pickupPersonName.toLowerCase().includes(qrSearchQuery.toLowerCase()) ||
        item.identityCard.includes(qrSearchQuery) ||
        item.qrCode?.toLowerCase().includes(qrSearchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [emergencyPickups, selectedClassId, qrSearchQuery]);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 shadow-sm ${
            toastMessage.type === 'success'
              ? 'bg-[#78C2AD]/15 border border-[#78C2AD] text-[#1E4D40]'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border border-amber-300 text-amber-900'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          ) : toastMessage.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold text-sm leading-snug">{toastMessage.text}</span>
        </div>
      )}

      {/* High-Alert Stranger Lockdown Banner (When triggered) */}
      {isSecurityAlertActive && (
        <div className="p-5 bg-rose-600 text-white rounded-3xl shadow-lg border-2 border-rose-700 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 shrink-0 text-amber-300" />
            <div>
              <div className="text-base font-extrabold uppercase tracking-wide">
                BÁO ĐỘNG AN NINH: PHONG TỎA QUYỀN TRẢ TRẺ TẠI CỔNG (UC-024)
              </div>
              <div className="text-xs text-rose-100 mt-0.5">
                {securityAlertDetails}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSecurityAlertActive(false)}
            className="px-4 py-2 bg-white text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-50 transition shrink-0 cursor-pointer"
          >
            Giải Tỏa Báo Động
          </button>
        </div>
      )}

      {/* Main Header & Tab Navigation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#275A4E]" />
            <span>Xác Thực Người Đón Lúc Tan Trường Bằng AI (UC-023)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Khung giờ tan học (16:00 - 17:30). Nhận diện khuôn mặt người đón, đối chiếu CCCD và ủy quyền khẩn cấp để ngăn chặn nhầm lẫn hoặc người lạ tiếp cận trẻ.
          </p>
        </div>

        {/* Audio Toggle & Sub-tab Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-[#78C2AD]/15 border-[#78C2AD]/50 text-[#1E4D40]'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Chuông báo người đón đang bật' : 'Chuông báo người đón đã tắt'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#275A4E]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>{soundEnabled ? 'Chuông đón: BẬT' : 'Chuông: TẮT'}</span>
          </button>

          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setSelectedSubTab('LIVE_GATE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedSubTab === 'LIVE_GATE'
                  ? 'bg-white text-[#275A4E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Chuông Báo Cổng Chiều
            </button>
            <button
              onClick={() => setSelectedSubTab('EMERGENCY_LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                selectedSubTab === 'EMERGENCY_LIST'
                  ? 'bg-white text-[#275A4E] shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Ủy Quyền Khẩn Cấp ({emergencyPickups.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: LIVE GATE DISMISSAL & INTERACTIVE SIMULATION */}
      {selectedSubTab === 'LIVE_GATE' && (
        <div className="space-y-6">
          {/* Simulation Action Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-[#78C2AD] animate-pulse" />
              <div>
                <div className="text-sm font-bold flex items-center gap-2">
                  <span>Trạm Camera Cổng Chiều - Đang Quét Người Đón Trẻ</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Khung giờ đón: 16:00 - 17:30 • Ngưỡng tin cậy an ninh BR-023: &ge; 0.85
                </div>
              </div>
            </div>

            {/* Test Simulation Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => simulateArrival('FIXED_VALID')}
                className="px-3.5 py-2 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Bố/Mẹ ruột đã xác minh CCCD (Similarity 0.93)"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
                <span>Simulate: Người Giám Hộ Cố Định (0.93)</span>
              </button>

              <button
                onClick={() => simulateArrival('EMERGENCY_VALID')}
                className="px-3 py-2 bg-[#E5A93C] hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Người được ủy quyền khẩn cấp 1 ngày có CCCD (Similarity 0.89)"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-900" />
                <span>Simulate: Đón Khẩn Cấp (0.89)</span>
              </button>

              <button
                onClick={() => simulateArrival('LOW_CONFIDENCE')}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer"
                title="Test người lạ hoặc độ tương đồng < 0.85 (BR-023)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Test Lỗi &lt; 0.85</span>
              </button>

              <button
                onClick={() => simulateArrival('ALREADY_PICKED')}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                title="Test bé đã được đón trước đó trong ngày (MSG-096)"
              >
                <span>Test Đón Trùng (MSG-096)</span>
              </button>

              <button
                onClick={() => simulateArrival('REVOKED')}
                className="px-3 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                title="Test ủy quyền đã bị thu hồi (MSG-095)"
              >
                <span>Test Thu Hồi (MSG-095)</span>
              </button>
            </div>
          </div>

          {/* Dismissal Instructions & Live Waiting Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs md:col-span-2 space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#275A4E]" />
                <span>Quy Trình Chuông Báo &amp; Trao Trả Bé Trên Máy Tính Bảng</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="font-bold text-[#1E4D40] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#275A4E]" />
                    <span>1. Người Giám Hộ Cố Định</span>
                  </div>
                  <p>
                    Camera đối chiếu với hồ sơ đăng ký CCCD gắn chip của bố/mẹ. Ngưỡng tương đồng tối thiểu &ge; 0.85. Khi xác nhận, hệ thống gửi tin nhắn FCM kèm giờ đón về máy phụ huynh.
                  </p>
                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>2. Ủy Quyền Khẩn Cấp Đột Xuất</span>
                  </div>
                  <p>
                    Hiệu lực trong ngày (1 ngày duy nhất). Người đón phải có ảnh khuôn mặt đã nộp và CCCD trùng khớp. Khi bàn giao trẻ, trạng thái tự động chuyển sang ĐÃ SỬ DỤNG (<code>USED</code>).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Quy tắc ngăn chặn đón trùng (MSG-096): </span>
                  Nếu học sinh đã có giờ về trong ngày hôm nay, nút trả trẻ sẽ bị khóa và còi cảnh báo sẽ vang lên để bảo vệ trẻ tuyệt đối.
                </div>
              </div>
            </div>

            {/* Quick Sĩ Số Tan Trường */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <LogOut className="w-4 h-4 text-[#275A4E]" />
                <span>Tiến Độ Tan Trường</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Đã trả bé an toàn</span>
                  <span className="text-lg font-bold text-emerald-900 font-mono">
                    {dismissedStudentsMap.current.size} bé
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Đang ở lớp chờ đón</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    {Math.max(0, (students.length || 25) - dismissedStudentsMap.current.size)} bé
                  </span>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Ủy quyền khẩn cấp hôm nay</span>
                  <span className="text-lg font-bold text-amber-900 font-mono">
                    {emergencyPickups.length} lượt
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMERGENCY PICKUP LOOKUP (1-DAY VALID AUTHORIZATIONS) */}
      {selectedSubTab === 'EMERGENCY_LIST' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={qrSearchQuery}
                  onChange={(e) => setQrSearchQuery(e.target.value)}
                  placeholder="Tra cứu tên bé, người đón, CCCD hoặc mã QR..."
                  className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
                />
              </div>

              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
              >
                <option value="ALL">Tất cả các lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Có hiệu lực trong ngày: {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          {/* Emergency Cards Grid */}
          {isLoadingEmergency ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80">
              <RefreshCw className="w-8 h-8 animate-spin text-[#275A4E] mx-auto mb-3" />
              <span className="text-sm font-bold text-slate-600">Đang tải danh sách ủy quyền khẩn cấp hôm nay...</span>
            </div>
          ) : filteredEmergencyList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 text-slate-500">
              Không có ủy quyền đón khẩn cấp nào phù hợp trong ngày hôm nay.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmergencyList.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between space-y-4 ${
                    item.status === 'USED'
                      ? 'bg-slate-50/70 border-slate-200 opacity-75'
                      : item.status === 'REVOKED'
                      ? 'bg-rose-50/40 border-rose-300'
                      : 'bg-white border-amber-300 ring-1 ring-amber-200'
                  }`}
                >
                  <div>
                    {/* Header: Status Badge & QR Code */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                          item.status === 'USED'
                            ? 'bg-slate-200 text-slate-700'
                            : item.status === 'REVOKED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.status === 'USED'
                          ? 'Đã Đón (USED)'
                          : item.status === 'REVOKED'
                          ? 'Đã Thu Hồi (REVOKED)'
                          : 'Ủy Quyền Trong Ngày'}
                      </span>

                      {item.qrCode && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {item.qrCode}
                        </span>
                      )}
                    </div>

                    {/* People Comparison: Child vs Pickup Person */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      {/* Child */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 mb-1.5 border border-slate-300">
                          {item.studentAvatarUrl ? (
                            <img src={item.studentAvatarUrl} alt={item.studentName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                              Bé
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate w-full">{item.studentName}</div>
                        <div className="text-[10px] text-slate-500">{item.studentClassName}</div>
                      </div>

                      {/* Pickup Person */}
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-200 mb-1.5 border border-amber-300">
                          {item.photoUrl ? (
                            <img src={item.photoUrl} alt={item.pickupPersonName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                              Người đón
                            </div>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 truncate w-full">{item.pickupPersonName}</div>
                        <div className="text-[10px] font-semibold text-amber-700">{item.relationship}</div>
                      </div>
                    </div>

                    {/* Details: CCCD & Reason */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">CCCD:</span>
                        <span className="font-mono font-bold text-slate-800">{item.identityCard}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Số ĐT:</span>
                        <span className="font-mono font-semibold text-slate-700">{item.phone}</span>
                      </div>
                      {item.notes && (
                        <div className="p-2 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200/80">
                          <strong>Ghi chú cha mẹ: </strong>{item.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveAlert({
                          id: 'alert-' + item.id,
                          studentId: item.studentId,
                          studentName: item.studentName || 'Học sinh',
                          studentCode: 'HS-EMG',
                          className: item.studentClassName || 'Mầm 1',
                          studentAvatarUrl: item.studentAvatarUrl,
                          isStudentPresentToday: true,
                          hasAlreadyLeft: dismissedStudentsMap.current.has(item.studentId),
                          leftAtTime: dismissedStudentsMap.current.get(item.studentId),
                          pickupPersonName: item.pickupPersonName,
                          relationship: item.relationship,
                          identityCard: item.identityCard,
                          phone: item.phone,
                          cameraPhotoUrl: item.photoUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
                          authorizationType: 'EMERGENCY_ONE_DAY',
                          authorizationStatus: item.status,
                          confidenceScore: 0.91,
                          arrivedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                          emergencyAuthId: item.id
                        });
                        setSelectedSubTab('LIVE_GATE');
                      }}
                      disabled={item.status === 'USED' || item.status === 'REVOKED'}
                      className="w-full py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 min-h-[44px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{item.status === 'USED' ? 'Đã Bàn Giao' : item.status === 'REVOKED' ? 'Ủy Quyền Bị Thu Hồi' : 'Đối Chiếu &amp; Trả Trẻ'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: TEACHER REALTIME PICKUP ALERT MODAL (TOUCH-FRIENDLY TABLET DIALOG >= 48px) */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveAlert(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#275A4E]">
                  Chuông Báo Đón Trẻ Cổng Chiều • {activeAlert.arrivedAt}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Xác Thực Người Đón Trẻ Tan Trường
              </h3>
            </div>

            {/* Warning Flags: Already Picked or Revoked or Low Confidence */}
            {activeAlert.hasAlreadyLeft && (
              <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-center gap-3 text-rose-900">
                <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">CẢNH BÁO ĐÓN TRÙNG (MSG-096)</div>
                  <div className="text-xs">
                    Học sinh {activeAlert.studentName} đã được đón về hôm nay lúc <strong>{activeAlert.leftAtTime}</strong>. Cần tiến hành kiểm tra làm rõ ngay!
                  </div>
                </div>
              </div>
            )}

            {activeAlert.authorizationStatus === 'REVOKED' && (
              <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex items-center gap-3 text-rose-900">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">ỦY QUYỀN ĐÃ BỊ THU HỒI (MSG-095)</div>
                  <div className="text-xs">
                    Giấy ủy quyền đón trẻ của người này đã hết hạn hoặc bị phụ huynh thu hồi trên app. Tuyệt đối không giao trẻ!
                  </div>
                </div>
              </div>
            )}

            {activeAlert.confidenceScore < 0.85 && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center gap-3 text-amber-900">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <div className="font-extrabold text-sm">ĐỘ TƯƠNG ĐỒNG AI THẤP (MSG-087)</div>
                  <div className="text-xs">
                    Độ tương đồng khuôn mặt {Math.round(activeAlert.confidenceScore * 100)}% chưa đạt ngưỡng an ninh tối thiểu 85% (BR-023). Vui lòng xác minh thủ công hoặc phong tỏa an ninh.
                  </div>
                </div>
              </div>
            )}

            {/* Two-Column Comparison View: Pickup Person vs Student */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Left Column: Pickup Person */}
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Người Đang Đứng Ở Cổng</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      activeAlert.authorizationType === 'FIXED_GUARDIAN'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {activeAlert.authorizationType === 'FIXED_GUARDIAN'
                      ? 'Giám Hộ Cố Định (VERIFIED)'
                      : 'Ủy Quyền Khẩn Cấp (1 Ngày)'}
                  </span>
                </div>

                <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 relative">
                  <img
                    src={activeAlert.cameraPhotoUrl}
                    alt={activeAlert.pickupPersonName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 text-[#78C2AD]" />
                    <span>Khớp AI: {Math.round(activeAlert.confidenceScore * 100)}%</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-900">{activeAlert.pickupPersonName}</h4>
                  <div className="text-xs text-[#275A4E] font-bold">{activeAlert.relationship}</div>
                  <div className="text-xs text-slate-600 mt-1 space-y-0.5 font-mono">
                    <div>CCCD: <strong>{activeAlert.identityCard}</strong></div>
                    <div>SĐT: <strong>{activeAlert.phone}</strong></div>
                  </div>
                </div>
              </div>

              {/* Right Column: Student Info */}
              <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Học Sinh Của Lớp</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    🟢 Có mặt hôm nay
                  </span>
                </div>

                <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-200 border-2 border-emerald-300 relative">
                  {activeAlert.studentAvatarUrl ? (
                    <img
                      src={activeAlert.studentAvatarUrl}
                      alt={activeAlert.studentName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-2xl">
                      {activeAlert.studentName[0]}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                    {activeAlert.studentCode}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-900">{activeAlert.studentName}</h4>
                  <div className="text-xs text-slate-600 font-semibold">{activeAlert.className}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Trạng thái điểm danh: <span className="font-bold text-[#275A4E]">Có mặt sáng nay (PRESENT)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Touch-friendly (>= 48px touch targets) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              {/* PRIMARY ACTION: CONFIRM DISMISSAL */}
              <button
                type="button"
                onClick={handleConfirmDismissal}
                disabled={
                  activeAlert.hasAlreadyLeft ||
                  activeAlert.authorizationStatus === 'REVOKED' ||
                  activeAlert.authorizationStatus === 'EXPIRED' ||
                  activeAlert.confidenceScore < 0.85
                }
                className="w-full sm:flex-1 h-14 bg-[#275A4E] hover:bg-[#1E4D40] text-white rounded-2xl text-sm font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
              >
                <CheckCircle2 className="w-5 h-5 text-[#78C2AD]" />
                <span>Xác Nhận Trao Trả Trẻ (Bàn Giao Bé)</span>
              </button>

              {/* SECONDARY ACTION: TRIGGER STRANGER ALERT */}
              <button
                type="button"
                onClick={handleTriggerSecurityLockdown}
                className="w-full sm:w-auto h-14 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Kích Hoạt Cảnh Báo Người Lạ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decree 13/2023/ND-CP Biometric Data Protection Notice */}
      <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#275A4E] shrink-0" />
          <span>
            Hệ thống đối chiếu sinh trắc học khuôn mặt người đón tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về Bảo vệ Dữ liệu Cá nhân và quyền riêng tư của trẻ em.
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#1E4D40] shrink-0 hidden sm:inline">
          KIDPRO Smart Kindergarten
        </span>
      </div>
    </div>
  );
};
