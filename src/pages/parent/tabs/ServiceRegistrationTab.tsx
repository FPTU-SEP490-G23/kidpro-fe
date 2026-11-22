import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bus,
  Utensils,
  Sparkles,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Plus,
  Calendar,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Send,
  Loader2,
  Info,
  AlertCircle
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface ServiceRegistrationTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const ServiceRegistrationTab: React.FC<ServiceRegistrationTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'BUS' | 'MEAL' | 'CLUB' | 'TRANSFER' | 'HISTORY'>('BUS');

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // ==========================================
  // 1. DATA QUERIES
  // ==========================================
  const { data: buses = [] } = useQuery({
    queryKey: ['available-buses'],
    queryFn: () => parentApi.getAvailableBuses(),
  });

  const { data: clubs = [] } = useQuery({
    queryKey: ['available-clubs'],
    queryFn: () => parentApi.getAvailableExtracurricular(),
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['available-classes'],
    queryFn: () => parentApi.getAvailableClasses(),
  });

  const { data: busRegisters = [], refetch: refetchBus } = useQuery({
    queryKey: ['bus-registers', studentId],
    queryFn: () => parentApi.getBusRegisters(studentId),
    enabled: !!studentId,
  });

  const { data: mealRegisters = [], refetch: refetchMeal } = useQuery({
    queryKey: ['meal-registers', studentId],
    queryFn: () => parentApi.getMealRegisters(studentId),
    enabled: !!studentId,
  });

  const { data: clubRegisters = [], refetch: refetchClub } = useQuery({
    queryKey: ['club-registers', studentId],
    queryFn: () => parentApi.getExtracurricularRegisters(studentId),
    enabled: !!studentId,
  });

  const { data: transferRequests = [], refetch: refetchTransfer } = useQuery({
    queryKey: ['transfer-requests', studentId],
    queryFn: () => parentApi.getClassTransferRequests(studentId),
    enabled: !!studentId,
  });

  const { data: allRequests = [], refetch: refetchAll } = useQuery({
    queryKey: ['all-requests', studentId],
    queryFn: () => parentApi.getAllRequests(studentId),
    enabled: !!studentId,
  });

  // ==========================================
  // 2. FORM STATES
  // ==========================================
  // Form Xe Buýt
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [busPickupAddress, setBusPickupAddress] = useState<string>('');
  const [busPickupType, setBusPickupType] = useState<'ONE_WAY' | 'TWO_WAY'>('TWO_WAY');
  const [busStartDate, setBusStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [busEndDate, setBusEndDate] = useState<string>('');
  const [busNote, setBusNote] = useState<string>('');

  // Form Ăn Sáng Bán Trú
  const [mealStartDate, setMealStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealEndDate, setMealEndDate] = useState<string>('');
  const [mealNotes, setMealNotes] = useState<string>('');

  // Form CLB Ngoại Khóa
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [clubStartDate, setClubStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clubEndDate, setClubEndDate] = useState<string>('');
  const [clubNote, setClubNote] = useState<string>('');

  // Form Chuyển Lớp
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');

  // Tự động chọn giá trị mặc định đầu tiên khi dữ liệu danh mục tải về
  React.useEffect(() => {
    if (buses.length > 0 && (!selectedBusId || !buses.some((b: any) => (b.id === selectedBusId || b.busId === selectedBusId)))) {
      setSelectedBusId(buses[0].busId || buses[0].id);
    }
  }, [buses, selectedBusId]);

  React.useEffect(() => {
    if (clubs.length > 0 && (!selectedClubId || !clubs.some((c: any) => (c.id === selectedClubId || c.classId === selectedClubId)))) {
      setSelectedClubId(clubs[0].classId || clubs[0].id);
    }
  }, [clubs, selectedClubId]);

  React.useEffect(() => {
    if (classes.length > 0 && (!targetClassId || !classes.some((c: any) => (c.id === targetClassId || c.classId === targetClassId)))) {
      setTargetClassId(classes[0].classId || classes[0].id);
    }
  }, [classes, targetClassId]);

  // ==========================================
  // 3. MUTATIONS
  // ==========================================
  const busMutation = useMutation({
    mutationFn: () => {
      const targetBusId = selectedBusId || buses[0]?.busId || buses[0]?.id;
      if (!targetBusId || targetBusId === 'BUS-01') {
        throw new Error('Vui lòng chọn tuyến xe buýt hợp lệ từ danh sách.');
      }
      return parentApi.submitBusRegister({
        studentId,
        busId: targetBusId,
        pickupAddress: busPickupAddress.trim() || 'Đón tại điểm trạm theo tuyến',
        pickupType: busPickupType,
        startDate: busStartDate,
        endDate: busEndDate || undefined,
        note: busNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      showToast('success', 'Nộp đơn đăng ký xe buýt thành công! Giáo vụ sẽ thẩm định lộ trình.');
      refetchBus();
      refetchAll();
      setBusPickupAddress('');
      setBusNote('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi đơn đăng ký xe buýt. Vui lòng thử lại.';
      showToast('error', msg);
    },
  });

  const mealMutation = useMutation({
    mutationFn: () =>
      parentApi.submitMealRegister({
        studentId,
        startDate: mealStartDate,
        endDate: mealEndDate || undefined,
        dietaryNotes: mealNotes.trim() || undefined,
      }),
    onSuccess: () => {
      showToast('success', 'Đăng ký ăn sáng bán trú thành công! Suất ăn sẽ được chuẩn bị từ ngày ' + formatDate(mealStartDate));
      refetchMeal();
      refetchAll();
      setMealNotes('');
    },
    onError: () => showToast('error', 'Không thể gửi đơn đăng ký ăn sáng. Vui lòng thử lại.'),
  });

  const clubMutation = useMutation({
    mutationFn: () =>
      parentApi.submitExtracurricularRegister({
        studentId,
        extracurricularClassId: selectedClubId || (clubs[0]?.id || 'CLUB-01'),
        startDate: clubStartDate,
        endDate: clubEndDate || undefined,
        note: clubNote.trim() || undefined,
      }),
    onSuccess: () => {
      showToast('success', 'Đăng ký lớp ngoại khóa thành công! Học phí sẽ được cộng vào kỳ thanh toán tiếp theo.');
      refetchClub();
      refetchAll();
      setClubNote('');
    },
    onError: () => showToast('error', 'Không thể gửi đăng ký CLB. Vui lòng thử lại.'),
  });

  const transferMutation = useMutation({
    mutationFn: () =>
      parentApi.submitClassTransferRequest({
        studentId,
        targetClassId: targetClassId || (classes[0]?.id || 'class-mam-1'),
        reason: transferReason.trim(),
      }),
    onSuccess: () => {
      showToast('success', 'Gửi đơn xin chuyển lớp thành công! Ban Giám Hiệu và Giáo vụ sẽ xem xét sĩ số.');
      refetchTransfer();
      refetchAll();
      setTransferReason('');
    },
    onError: () => showToast('error', 'Không thể gửi đơn chuyển lớp. Vui lòng thử lại.'),
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Phê Duyệt
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Từ Chối
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Đã Hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ Giáo Vụ Duyệt
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 border shadow-md animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trung Tâm Dịch Vụ Học Đường & Tiện Ích</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Đăng Ký Dịch Vụ Cho Bé {studentName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Lớp: <strong>{className}</strong> • Phụ huynh có thể chủ động đăng ký xe buýt, ăn sáng, CLB năng khiếu hoặc đề nghị chuyển lớp.
          </p>
        </div>

        {/* Thanh chuyển dịch vụ */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('BUS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'BUS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Xe Buýt Đưa Đón</span>
          </button>
          <button
            onClick={() => setActiveSubTab('MEAL')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'MEAL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Ăn Sáng Bán Trú</span>
          </button>
          <button
            onClick={() => setActiveSubTab('CLUB')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'CLUB' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>CLB Ngoại Khóa</span>
          </button>
          <button
            onClick={() => setActiveSubTab('TRANSFER')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'TRANSFER' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Chuyển Lớp</span>
          </button>
          <button
            onClick={() => setActiveSubTab('HISTORY')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'HISTORY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lịch Sử Đơn ({allRequests.length || (busRegisters.length + mealRegisters.length + clubRegisters.length + transferRequests.length)})</span>
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* 1. TAB XE BUÝT ĐƯA ĐÓN */}
      {/* ========================================== */}
      {activeSubTab === 'BUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Đăng Ký Xe Buýt Đưa Đón Mới</h3>
            </div>

            {busRegisters.some((r: any) => r.status === 'PENDING' || r.status === 'APPROVED') && (
              <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 text-amber-800 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Học sinh đã có 01 đơn đăng ký xe buýt</span>
                </div>
                <p className="text-amber-700 leading-relaxed">
                  Quy định nhà trường: Mỗi học sinh chỉ được phép có 01 đơn đăng ký xe buýt đang chờ duyệt hoặc đang hoạt động.
                </p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (busRegisters.some((r: any) => r.status === 'PENDING' || r.status === 'APPROVED')) {
                  showToast('error', 'Mỗi học sinh chỉ được phép có 01 đơn đăng ký xe buýt đang chờ duyệt hoặc đang hoạt động.');
                  return;
                }
                busMutation.mutate();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Tuyến Xe Buýt *</label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                >
                  <option value="">-- Chọn tuyến xe buýt đưa đón --</option>
                  {buses.map((b: any) => {
                    const bId = b.busId || b.id;
                    const bName = b.busName || b.routeName || b.routeDescription || `Tuyến buýt ${b.busNumber || ''}`;
                    const bPlate = b.busNumber || b.licensePlate || 'Xe trường';
                    const bFee = formatCurrency(b.fee || 1200000);
                    return (
                      <option key={bId} value={bId}>
                        {bName} — Biển số: {bPlate} ({bFee}/tháng)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hình Thức Đưa Đón *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBusPickupType('TWO_WAY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      busPickupType === 'TWO_WAY'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Đưa đón 2 chiều (Sáng & Chiều)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusPickupType('ONE_WAY')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      busPickupType === 'ONE_WAY'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    1 chiều (Sáng hoặc Chiều)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa Chỉ Đón / Điểm Trạm Đón *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Số 45 Đường Nguyễn Thị Minh Khai, P. Bến Nghé, Q.1"
                  value={busPickupAddress}
                  onChange={(e) => setBusPickupAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Bắt Đầu *</label>
                  <input
                    type="date"
                    required
                    value={busStartDate}
                    onChange={(e) => setBusStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Kết Thúc (Tùy chọn)</label>
                  <input
                    type="date"
                    value={busEndDate}
                    onChange={(e) => setBusEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Cho Bác Tài & Cô Phụ Xe</label>
                <textarea
                  rows={2}
                  placeholder="VD: Bé dễ say xe, nhờ cô ưu tiên cho bé ngồi hàng ghế đầu..."
                  value={busNote}
                  onChange={(e) => setBusNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={
                  busMutation.isPending ||
                  busRegisters.some((r: any) => r.status === 'PENDING' || r.status === 'APPROVED') ||
                  (buses.length === 0 && !selectedBusId)
                }
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {busMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>
                  {busRegisters.some((r: any) => r.status === 'PENDING' || r.status === 'APPROVED')
                    ? 'Đã Có Đơn Đăng Ký Xe Buýt (Tối đa 1 đơn)'
                    : 'Gửi Đơn Đăng Ký Xe Buýt'}
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Các Đơn Đăng Ký Xe Buýt Của Bé</span>
            </h3>

            {busRegisters.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <Bus className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm">Bé chưa có đơn đăng ký xe buýt nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {busRegisters.map((reg: any, idx: number) => (
                  <div key={reg.id || reg.registerId || idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bus className="w-4 h-4 text-indigo-600" />
                        <span className="font-extrabold text-slate-800 text-sm">
                          {reg.busName || reg.serviceName || 'Dịch vụ xe buýt đưa đón'}
                        </span>
                      </div>
                      {getStatusBadge(reg.status)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>📍 Điểm đón: <strong className="text-slate-700">{reg.pickupAddress || 'Tại điểm dừng'}</strong></p>
                      <p>🗓️ Thời gian: Từ {formatDate(reg.startDate)} {reg.endDate ? `đến ${formatDate(reg.endDate)}` : '(Dài hạn)'}</p>
                      <p>🔄 Hình thức: <strong className="text-slate-700">{reg.pickupType === 'TWO_WAY' ? 'Đưa đón 2 chiều' : '1 chiều'}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. TAB ĂN SÁNG BÁN TRÚ */}
      {/* ========================================== */}
      {activeSubTab === 'MEAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Utensils className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Đăng Ký Suất Ăn Sáng Bán Trú</h3>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                Gói Bữa Sáng Dinh Dưỡng Học Đường:
              </p>
              <p>• Đơn giá: <strong>450.000 VNĐ / tháng</strong> (khoảng 20.000đ / bữa sáng).</p>
              <p>• Thực đơn đổi món hàng ngày: Phở bò, Cháo chim bồ câu hạt sen, Bánh cuốn chả quế, Súp gà ngô non, Sữa chua men sống.</p>
              <p>• Phục vụ từ 06:45 đến 07:45 sáng mỗi ngày tại bếp trường.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                mealMutation.mutate();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Bắt Đầu Ăn Sáng *</label>
                  <input
                    type="date"
                    required
                    value={mealStartDate}
                    onChange={(e) => setMealStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Kết Thúc (Tùy chọn)</label>
                  <input
                    type="date"
                    value={mealEndDate}
                    onChange={(e) => setMealEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Khẩu Vị / Dị Ứng Cho Nhà Bếp</label>
                <textarea
                  rows={3}
                  placeholder="VD: Bé không ăn hành ngò, bé dị ứng sữa bò cần đổi sang sữa hạt organic..."
                  value={mealNotes}
                  onChange={(e) => setMealNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={mealMutation.isPending}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {mealMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi Đăng Ký Ăn Sáng</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Lịch Sử Đăng Ký Ăn Sáng Của Bé</span>
            </h3>

            {mealRegisters.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm">Bé chưa đăng ký ăn sáng bán trú tại trường.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mealRegisters.map((reg: any, idx: number) => (
                  <div key={reg.id || reg.registerId || idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-amber-600" />
                        <span className="font-extrabold text-slate-800 text-sm">
                          {reg.serviceName || 'Gói Dịch Vụ Ăn Sáng Bán Trú'}
                        </span>
                      </div>
                      {getStatusBadge(reg.status)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>🗓️ Áp dụng: Từ {formatDate(reg.startDate)} {reg.endDate ? `đến ${formatDate(reg.endDate)}` : '(Cả năm học)'}</p>
                      {reg.dietaryNotes && <p>🥗 Khẩu vị dặn dò: <span className="text-slate-700">{reg.dietaryNotes}</span></p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. TAB CLB NGOẠI KHÓA */}
      {/* ========================================== */}
      {activeSubTab === 'CLUB' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Đăng Ký CLB Năng Khiếu & Ngoại Khóa</h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clubMutation.mutate();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Câu Lạc Bộ *</label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                >
                  {clubs.length === 0 ? (
                    <option value="">Đang tải danh sách CLB...</option>
                  ) : (
                    clubs.map((c: any) => {
                      const cId = c.classId || c.id;
                      const cName = c.className || c.name || 'CLB';
                      const cFee = formatCurrency(c.fee || 500000);
                      const cSched = c.scheduleDescription || c.schedule || '16:30 - 17:30';
                      return (
                        <option key={cId} value={cId}>
                          {cName} — {cFee}/tháng ({cSched})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Bắt Đầu Học *</label>
                  <input
                    type="date"
                    required
                    value={clubStartDate}
                    onChange={(e) => setClubStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày Kết Thúc (Tùy chọn)</label>
                  <input
                    type="date"
                    value={clubEndDate}
                    onChange={(e) => setClubEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi Chú Cho Thầy Cô Phụ Trách</label>
                <textarea
                  rows={2}
                  placeholder="VD: Bé thuận tay trái, bé có năng khiếu vẽ tranh tĩnh vật..."
                  value={clubNote}
                  onChange={(e) => setClubNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={clubMutation.isPending}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {clubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi Đăng Ký Ngoại Khóa</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>CLB Bé Đang Tham Gia & Đã Đăng Ký</span>
            </h3>

            {clubRegisters.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm">Bé chưa đăng ký tham gia câu lạc bộ nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clubRegisters.map((reg: any, idx: number) => (
                  <div key={reg.id || reg.registerId || idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="font-extrabold text-slate-800 text-sm">
                          {reg.className || reg.clubName || 'Lớp Năng Khiếu Mầm Non'}
                        </span>
                      </div>
                      {getStatusBadge(reg.status)}
                    </div>
                    <div className="text-xs text-slate-500 space-y-1">
                      <p>🗓️ Ngày bắt đầu: <strong className="text-slate-700">{formatDate(reg.startDate)}</strong></p>
                      {reg.note && <p>💬 Ghi chú: {reg.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. TAB CHUYỂN LỚP */}
      {/* ========================================== */}
      {activeSubTab === 'TRANSFER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-slate-800 text-base">Đơn Đề Nghị Chuyển Lớp Học</h3>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <p className="font-bold">Lớp hiện tại: {className}</p>
              <p>Ban Giám Hiệu sẽ xem xét sĩ số tối đa của lớp mới trước khi phê duyệt chuyển lớp.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                transferMutation.mutate();
              }}
              className="space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Lớp Nguyện Vọng Muốn Chuyển Đến *</label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
                >
                  {classes.length === 0 ? (
                    <option value="">Đang tải danh sách lớp học...</option>
                  ) : (
                    classes.map((c: any) => {
                      const clsId = c.classId || c.id;
                      const clsName = c.className || c.name || 'Lớp';
                      const clsRoom = c.roomNumber || c.room || 'Phòng học';
                      return (
                        <option key={clsId} value={clsId}>
                          {clsName} — Phòng: {clsRoom}
                        </option>
                      );
                    })
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý Do Đề Nghị Chuyển Lớp *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Gia đình muốn chuyển bé sang lớp học cùng bạn gần nhà để tiện đưa đón..."
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm transition"
              >
                {transferMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Gửi Đơn Xin Chuyển Lớp</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base">Lịch Sử Đơn Chuyển Lớp</h3>
            {transferRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
                <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-sm">Chưa có đơn xin chuyển lớp nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transferRequests.map((req: any, idx: number) => (
                  <div key={req.id || idx} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-sm">
                        Đến: {req.targetClassName || 'Lớp mới'}
                      </span>
                      {getStatusBadge(req.status)}
                    </div>
                    <p className="text-xs text-slate-600">Lý do: {req.reason}</p>
                    <p className="text-[11px] text-slate-400">Ngày gửi: {formatDate(req.createdAt || new Date().toISOString())}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. TAB TỔNG HỢP LỊCH SỬ TOÀN BỘ ĐƠN TỪ */}
      {/* ========================================== */}
      {activeSubTab === 'HISTORY' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Tổng Hợp Tiến Độ Xét Duyệt Đơn Từ</h3>
              <p className="text-xs text-slate-500">Toàn bộ các đơn đăng ký dịch vụ, xe buýt, ăn sáng, ngoại khóa và chuyển lớp của bé {studentName}</p>
            </div>
            <button
              onClick={() => {
                refetchAll();
                refetchBus();
                refetchMeal();
                refetchClub();
                refetchTransfer();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
            >
              Làm mới
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Loại Đơn Dịch Vụ</th>
                  <th className="py-3 px-4">Nội Dung Đăng Ký</th>
                  <th className="py-3 px-4">Ngày Áp Dụng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {busRegisters.map((b: any, i: number) => (
                  <tr key={`bus-${i}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-indigo-700 flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-indigo-500" /> Xe buýt
                    </td>
                    <td className="py-3 px-4">{b.busName || 'Tuyến đưa đón'} — {b.pickupAddress || 'Tại trạm'}</td>
                    <td className="py-3 px-4">{formatDate(b.startDate)}</td>
                    <td className="py-3 px-4">{getStatusBadge(b.status)}</td>
                  </tr>
                ))}
                {mealRegisters.map((m: any, i: number) => (
                  <tr key={`meal-${i}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-amber-700 flex items-center gap-1.5">
                      <Utensils className="w-4 h-4 text-amber-500" /> Ăn sáng
                    </td>
                    <td className="py-3 px-4">Ăn sáng bán trú tại trường {m.dietaryNotes ? `(${m.dietaryNotes})` : ''}</td>
                    <td className="py-3 px-4">{formatDate(m.startDate)}</td>
                    <td className="py-3 px-4">{getStatusBadge(m.status)}</td>
                  </tr>
                ))}
                {clubRegisters.map((c: any, i: number) => (
                  <tr key={`club-${i}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-purple-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-500" /> CLB Ngoại khóa
                    </td>
                    <td className="py-3 px-4">{c.className || 'CLB Năng khiếu'}</td>
                    <td className="py-3 px-4">{formatDate(c.startDate)}</td>
                    <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                  </tr>
                ))}
                {transferRequests.map((t: any, i: number) => (
                  <tr key={`tr-${i}`} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-blue-700 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4 text-blue-500" /> Chuyển lớp
                    </td>
                    <td className="py-3 px-4">Chuyển đến: {t.targetClassName || 'Lớp mới'} ({t.reason})</td>
                    <td className="py-3 px-4">{formatDate(t.createdAt || new Date().toISOString())}</td>
                    <td className="py-3 px-4">{getStatusBadge(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
