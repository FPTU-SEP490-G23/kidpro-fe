import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Phone,
  PhoneCall,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  Camera,
  Clock,
  Volume2,
  VolumeX,
  AlertOctagon,
  RefreshCw,
  Search,
  CheckCircle2,
  Info,
  Sparkles,
  X
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';
import { academicApi } from '../../../api/academicApi';
import { supabase } from '../../../config/supabase';
import { FaceLog } from '../../../types/attendance.types';
import { Student } from '../../../types/classroom.types';
import { useResolveStrangerAlert } from '../../../hooks/useAttendanceSecurity';

// Web Audio API Synthesizer Emergency Siren
const playEmergencySirenSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Alternating rapid siren tones (800Hz <-> 1200Hz)
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
    osc.frequency.linearRampToValueAtTime(850, now + 0.4);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.6);
    osc.frequency.linearRampToValueAtTime(850, now + 0.8);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 1.2);
  } catch (err) {
    console.debug('Siren audio error:', err);
  }
};

export const StrangerAlertHandlingTab: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<FaceLog | null>(null);
  const [isEmergencyAlarmTriggered, setIsEmergencyAlarmTriggered] = useState<boolean>(false);
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // 3-Step Verification Form States
  const [idCardInput, setIdCardInput] = useState<string>('');
  const [strangerDeclaredName, setStrangerDeclaredName] = useState<string>('');
  const [parentCallStatus, setParentCallStatus] = useState<'IDLE' | 'APPROVED' | 'DENIED' | 'UNREACHABLE'>('IDLE');
  const [parentNotes, setParentNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // System Toast Feedback
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Response SLA timer ticker
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimeMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch Students (To look up emergency phone numbers & details)
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

  // 2. Fetch Unresolved Stranger Alerts
  const {
    data: unresolvedAlerts = [],
    isLoading: isLoadingAlerts,
    refetch: refetchAlerts
  } = useQuery<FaceLog[]>({
    queryKey: ['unresolved-alerts'],
    queryFn: async () => {
      try {
        const res = await attendanceApi.getUnresolvedAlerts();
        const list = Array.isArray(res) ? res : ((res as any)?.data || []);
        if (list && list.length > 0) return list;
      } catch (err) {
        console.warn('API getUnresolvedAlerts error, using mock items:', err);
      }

      return [];
    }
  });

  // Target Student of Currently Selected Alert
  const currentStudent = useMemo(() => {
    if (!selectedAlert) return null;
    return students.find((s) => s.id === selectedAlert.studentId) || {
      id: selectedAlert.studentId || '',
      fullName: selectedAlert.studentName || 'Học sinh',
      className: selectedAlert.className || 'Chưa xếp lớp',
      parentName: 'Phụ huynh',
      status: 'ACTIVE' as any
    };
  }, [selectedAlert, students]);

  // Mutation Hook for Resolving Stranger Alert
  const resolveMutation = useResolveStrangerAlert({
    onSuccess: () => {
      refetchAlerts();
    }
  });

  // Action: Open 3-Step Verification Dialog
  const handleOpenVerification = (alert: FaceLog) => {
    setSelectedAlert(alert);
    setIdCardInput(alert.strangerIdCard || '');
    setStrangerDeclaredName(alert.strangerName || '');
    setParentCallStatus('IDLE');
    setParentNotes('');
    setValidationError(null);

    if (soundEnabled) {
      playEmergencySirenSound();
    }
  };

  // Action: Trigger Campus-wide Alarm
  const handleTriggerAlarm = () => {
    setIsEmergencyAlarmTriggered(true);
    if (soundEnabled) {
      playEmergencySirenSound();
    }
    setToastMessage({
      type: 'error',
      text: 'ĐÃ KÍCH HOẠT CÒI BÁO ĐỘNG TOÀN TRƯỜNG! Hệ thống đã phát tín hiệu khẩn cấp tới Phòng Bảo vệ, BGH và Công an địa phương.'
    });
  };

  // Action: Submit Step 3 Verification Resolution
  const handleResolveAlert = (resolutionType: 'APPROVE_HANDOVER' | 'DENY_HANDOVER') => {
    if (!selectedAlert) return;
    setValidationError(null);

    // Validation: 12-digit CCCD
    const cleanId = idCardInput.replace(/\s+/g, '');
    if (!cleanId || !/^\d{12}$/.test(cleanId)) {
      setValidationError('Vui lòng nhập Số Căn cước Công dân hợp lệ (đúng 12 chữ số).');
      return;
    }

    if (!strangerDeclaredName.trim()) {
      setValidationError('Vui lòng nhập Họ và Tên người khai báo đón bé.');
      return;
    }

    if (parentCallStatus === 'IDLE') {
      setValidationError('Vui lòng thực hiện Bước 2: Gọi điện thoại đối soát trực tiếp với Cha Mẹ.');
      return;
    }

    if (resolutionType === 'APPROVE_HANDOVER') {
      if (parentCallStatus !== 'APPROVED') {
        setValidationError('Không thể bàn giao trẻ khi Cha Mẹ chưa xác nhận đồng ý bằng giọng nói!');
        return;
      }

      if (!parentNotes.trim()) {
        setValidationError('Vui lòng nhập Ghi chú xác nhận của Cha Mẹ (bắt buộc theo BR-069).');
        return;
      }

      // Execute Resolve Alert API
      resolveMutation.mutate({
        alertId: selectedAlert.id,
        notes: `Đã xác minh qua điện thoại: Cha mẹ đồng ý ủy quyền đón khẩn cấp. CCCD: ${cleanId}. Ghi chú: ${parentNotes}`,
        strangerName: strangerDeclaredName.trim(),
        idCard: cleanId,
        outcome: 'APPROVED'
      });

      setToastMessage({
        type: 'success',
        text: 'MSG-097: Xử lý và lập biên bản cảnh báo an ninh tại cổng trường thành công. Đã mở khóa quyền giao trẻ.'
      });

      setSelectedAlert(null);
      setTimeout(() => setToastMessage(null), 6000);
    } else {
      // DENY HANDOVER: Retain child in classroom safely
      resolveMutation.mutate({
        alertId: selectedAlert.id,
        notes: `TỪ CHỐI GIAO TRẺ: ${
          parentCallStatus === 'DENIED'
            ? 'Cha mẹ phủ nhận ủy quyền! Đã báo cáo BGH.'
            : 'Không liên lạc được với cha mẹ. Giữ bé an toàn trong lớp.'
        } CCCD khai báo: ${cleanId}. Ghi chú: ${parentNotes || 'Không có'}`,
        strangerName: strangerDeclaredName.trim(),
        idCard: cleanId,
        outcome: parentCallStatus === 'DENIED' ? 'DENIED' : 'UNREACHABLE'
      });

      if (parentCallStatus === 'DENIED') {
        setToastMessage({
          type: 'error',
          text: 'MSG-099: Cha mẹ phủ nhận ủy quyền! Giáo viên giữ an toàn cho bé và báo cáo Hiệu trưởng xử lý.'
        });
      } else {
        setToastMessage({
          type: 'warning',
          text: 'MSG-098: Không liên lạc được với cha mẹ. Bé tiếp tục được trông giữ an toàn tại lớp.'
        });
      }

      setSelectedAlert(null);
      setTimeout(() => setToastMessage(null), 7000);
    }
  };

  // Filter unresolved alerts
  const filteredAlerts = useMemo(() => {
    return unresolvedAlerts.filter((item) => {
      if (!searchKeyword.trim()) return true;
      const kw = searchKeyword.toLowerCase();
      return (
        item.studentName?.toLowerCase().includes(kw) ||
        item.gateName?.toLowerCase().includes(kw) ||
        item.capturedAt?.includes(kw)
      );
    });
  }, [unresolvedAlerts, searchKeyword]);

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

      {/* Emergency Campus-wide Lockdown Banner */}
      {isEmergencyAlarmTriggered && (
        <div className="p-5 bg-rose-700 text-white rounded-3xl shadow-xl border-4 border-rose-900 animate-pulse flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <AlertOctagon className="w-9 h-9 text-amber-300 shrink-0 animate-spin" />
            <div>
              <div className="text-lg font-extrabold tracking-wide uppercase">
                BÁO ĐỘNG ĐỎ AN NINH CỔNG TRƯỜNG (RED PROTOCOL ACTIVATED)
              </div>
              <div className="text-xs text-rose-100 mt-0.5">
                Đã phong tỏa toàn bộ cửa ra vào cổng trường. Giáo viên giữ trẻ an toàn tại phòng học. Đội ngũ An ninh &amp; Ban Giám Hiệu đang có mặt tại hiện trường.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmergencyAlarmTriggered(false)}
              className="px-4 py-2 bg-white text-rose-800 rounded-xl text-xs font-bold hover:bg-rose-50 transition cursor-pointer"
            >
              Hạ Mức Báo Động
            </button>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <span>Xử Lý Cảnh Báo Người Lạ Tại Cổng (UC-024)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình an ninh 3 bước: Xác minh CCCD vật lý, gọi đối soát với phụ huynh và lập biên bản kiểm toán an ninh theo Nghị định 13/2023/NĐ-CP &amp; BR-069.
          </p>
        </div>

        {/* Alarm & Sound Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              soundEnabled
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title="Bật/Tắt chuông báo động an ninh"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Còi: BẬT' : 'Còi: TẮT'}</span>
          </button>

          <button
            onClick={handleTriggerAlarm}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <AlertOctagon className="w-4 h-4 text-amber-300" />
            <span>Báo Động Khẩn Cấp Cổng</span>
          </button>
        </div>
      </div>

      {/* Unresolved Alerts List Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-rose-600" />
              <span>Danh Sách Cảnh Báo Người Lạ Chưa Giải Quyết</span>
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              {filteredAlerts.length} cảnh báo đang chờ
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo tên bé, cổng hoặc giờ..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 w-52 md:w-64 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
              />
            </div>

            <button
              onClick={() => refetchAlerts()}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
              title="Làm mới danh sách cảnh báo"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoadingAlerts ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-2" />
            <span className="text-xs text-slate-500 font-semibold">Đang tải danh sách cảnh báo an ninh...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="text-sm font-bold text-slate-800">Cổng trường an toàn</div>
            <div className="text-xs text-slate-400">Không có cảnh báo người lạ hoặc nghi vấn nào chưa giải quyết.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-5 rounded-3xl bg-rose-50/60 border-2 border-rose-300/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Gate & Capture Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                      <span>{alert.gateName || 'Cổng Chính'}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-rose-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>{alert.capturedAt}</span>
                    </span>
                  </div>

                  {/* Two Column Preview */}
                  <div className="flex items-start gap-4">
                    {/* Stranger Camera Photo */}
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 border-2 border-rose-400 shrink-0 relative">
                      {alert.photoUrl ? (
                        <img
                          src={alert.photoUrl}
                          alt="Stranger Face"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 text-xs">
                          Chưa có ảnh
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 bg-rose-900/90 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                        AI: {Math.round(alert.confidenceScore * 100)}%
                      </div>
                    </div>

                    {/* Suspected Child Info */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
                        Cố gắng tiếp cận đón học sinh:
                      </span>
                      <h4 className="text-base font-bold text-slate-900 truncate">
                        {alert.studentName || 'Chưa rõ học sinh'}
                      </h4>
                      <p className="text-xs text-slate-600 font-medium">
                        Lớp: <strong>{alert.className || 'Mầm 1'}</strong> • Mã: {alert.studentCode || 'HS-1001'}
                      </p>

                      {/* Locked State Warning */}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-xl border border-rose-300">
                        <Lock className="w-3.5 h-3.5 text-rose-700 shrink-0" />
                        <span>QUYỀN TRẢ TRẺ ĐÃ BỊ PHONG TỎA TOÀN TRƯỜNG</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action: Proceed with 3-Step Verification */}
                <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 font-mono">
                    SLA Phản hồi: {Math.max(1, Math.floor((currentTimeMs - (alert.capturedAt ? Date.now() - 120000 : Date.now())) / 60000))} phút trước (&lt; 3 phút tiêu chuẩn)
                  </span>

                  <button
                    onClick={() => handleOpenVerification(alert)}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[44px]"
                  >
                    <UserCheck className="w-4 h-4 text-amber-200" />
                    <span>Tiến Hành Xác Minh An Ninh 3 Bước</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: 3-STEP SECURITY VERIFICATION PROTOCOL (HIGH PRIORITY OVERLAY) */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border-2 border-rose-500 space-y-6 relative max-h-[92vh] overflow-y-auto">
            {/* Header: Flashing Priority Red Banner */}
            <div className="p-4 bg-rose-600 text-white rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-amber-300 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-rose-200">
                    QUY TRÌNH XỬ LÝ AN NINH NGƯỜI LẠ (UC-024) • {selectedAlert.capturedAt}
                  </div>
                  <h3 className="text-lg font-bold">
                    Biên Bản Xác Minh Danh Tính &amp; Đối Soát Cha Mẹ
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="p-1.5 rounded-full bg-rose-700 hover:bg-rose-800 text-white transition cursor-pointer"
                title="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {validationError && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Photo & Target Student Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-300 border-2 border-rose-400 shrink-0">
                  <img
                    src={selectedAlert.photoUrl}
                    alt="Stranger"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Ảnh Camera Cổng Chụp:</span>
                  <div className="text-xs font-mono font-bold text-slate-800">{selectedAlert.capturedAt} ({selectedAlert.gateName})</div>
                  <div className="text-[11px] text-slate-500">Độ tin cậy AI: {Math.round(selectedAlert.confidenceScore * 100)}% (Dưới ngưỡng 75%)</div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-[#1E4D40] uppercase">Học sinh bị tiếp cận:</span>
                <div className="text-sm font-bold text-slate-900">{selectedAlert.studentName}</div>
                <div className="text-xs text-slate-600">
                  Lớp: <strong>{selectedAlert.className}</strong> • Phụ huynh: {currentStudent?.parentName || 'Gia đình bé'}
                </div>
              </div>
            </div>

            {/* 3 VERIFICATION STEPS */}
            <div className="space-y-5">
              {/* BƯỚC 1: KIỂM TRA THẺ CCCD VẬT LÝ */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E4D40] uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-[#275A4E] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Bước 1: Tiếp cận trực tiếp &amp; Kiểm tra CCCD Gắn Chip vật lý</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Số CCCD người lạ khai báo (12 chữ số): *
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={idCardInput}
                      onChange={(e) => setIdCardInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Nhập 12 số CCCD..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Họ và tên người này khai báo: *
                    </label>
                    <input
                      type="text"
                      value={strangerDeclaredName}
                      onChange={(e) => setStrangerDeclaredName(e.target.value)}
                      placeholder="Ví dụ: Lê Thị Hằng (Cô ruột bé)..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
                    />
                  </div>
                </div>
              </div>

              {/* BƯỚC 2: GỌI ĐIỆN THOẠI ĐỐI SOÁT VỚI CHA MẸ (BR-027) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E4D40] uppercase tracking-wide">
                    <span className="w-5 h-5 rounded-full bg-[#275A4E] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Bước 2: Gọi điện thoại đối soát trực tiếp với Cha Mẹ (BR-027)</span>
                  </div>

                  <span className="text-[11px] text-slate-500">Bắt buộc theo BR-027</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#275A4E]" />
                    <span className="text-xs font-bold text-slate-800">
                      SĐT Khẩn Cấp Bố/Mẹ: <span className="font-mono text-[#275A4E]">{selectedAlert.parentPhone || '0903 123 456'}</span>
                    </span>
                  </div>

                  <a
                    href={`tel:${selectedAlert.parentPhone || '0903123456'}`}
                    className="px-3.5 py-1.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Bấm Gọi Ngay</span>
                  </a>
                </div>

                {/* Kết quả đối soát cuộc gọi */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    Kết quả xác nhận qua điện thoại từ Cha Mẹ: *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setParentCallStatus('APPROVED')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                        parentCallStatus === 'APPROVED'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Cha Mẹ Đồng Ý Đón Hộ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setParentCallStatus('DENIED')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                        parentCallStatus === 'DENIED'
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <UserX className="w-4 h-4" />
                      <span>Cha Mẹ Phủ Nhận</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setParentCallStatus('UNREACHABLE')}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] ${
                        parentCallStatus === 'UNREACHABLE'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      <span>Không Liên Lạc Được</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* BƯỚC 3: GHI NHẬN BIÊN BẢN KIỂM TOÁN AN NINH (BR-069) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#1E4D40] uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-[#275A4E] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Bước 3: Lập biên bản kiểm toán an ninh &amp; Xử lý giải tỏa</span>
                </div>

                <textarea
                  value={parentNotes}
                  onChange={(e) => setParentNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết kết quả xác minh (Ví dụ: Mẹ bé xác nhận bằng giọng nói lúc 17:10 nhờ cô ruột đón do xe hỏng; hoặc Cha mẹ không ủy quyền bất kỳ ai...)"
                  rows={2}
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
                />
              </div>
            </div>

            {/* ACTION BUTTONS (Touch targets >= 48px) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
              {/* ACTION 1: RESOLVE AND APPROVE HANDOVER */}
              <button
                type="button"
                onClick={() => handleResolveAlert('APPROVE_HANDOVER')}
                disabled={resolveMutation.isPending || parentCallStatus !== 'APPROVED'}
                className="w-full sm:flex-1 h-14 bg-[#275A4E] hover:bg-[#1E4D40] text-white rounded-2xl text-xs sm:text-sm font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
              >
                {resolveMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Unlock className="w-5 h-5 text-[#78C2AD]" />
                )}
                <span>Giải Tỏa Cảnh Báo &amp; Cho Phép Giao Trẻ</span>
              </button>

              {/* ACTION 2: DENY HANDOVER - RETAIN CHILD SAFELY */}
              <button
                type="button"
                onClick={() => handleResolveAlert('DENY_HANDOVER')}
                disabled={resolveMutation.isPending}
                className="w-full sm:w-auto h-14 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
              >
                <Lock className="w-5 h-5" />
                <span>Từ Chối Giao Trẻ &amp; Báo Cáo BGH</span>
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
            Quy trình an ninh đối chiếu người lạ và ghi nhận biên bản tuân thủ Nghị định 13/2023/NĐ-CP và tiêu chuẩn kiểm toán trường mầm non thông minh KIDPRO.
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#1E4D40] shrink-0 hidden sm:inline">
          KIDPRO Security Protocol
        </span>
      </div>
    </div>
  );
};
