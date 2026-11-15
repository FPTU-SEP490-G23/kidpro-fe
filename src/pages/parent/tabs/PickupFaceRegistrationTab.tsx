import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  UserCheck,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Info,
  Clock,
  Eye,
  Trash2,
  Send,
  Loader2,
  FileCheck2
} from 'lucide-react';
import parentApi from '../../../api/parentApi';

interface PickupFaceRegistrationTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const PickupFaceRegistrationTab: React.FC<PickupFaceRegistrationTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePersonType, setActivePersonType] = useState<'PARENT' | 'GUARDIAN' | 'EMERGENCY'>('PARENT');
  const [selectedGuardianId, setSelectedGuardianId] = useState<string>('');
  const [emergencyAuthId, setEmergencyAuthId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [consentDecree13, setConsentDecree13] = useState<boolean>(true);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch Danh sách người đón
  const { data: pickupPersons = [], refetch: refetchPersons, isLoading } = useQuery({
    queryKey: ['pickup-persons', studentId],
    queryFn: () => parentApi.getPickupPersonsForRegistration(studentId),
  });

  // 2. Fetch danh sách người giám hộ
  const { data: guardians = [] } = useQuery({
    queryKey: ['authorized-guardians', studentId],
    queryFn: async () => {
      const res = await parentApi.getAuthorizedGuardians(studentId);
      return (res as any)?.data || [];
    },
  });

  // 3. File select handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Vui lòng chọn tệp định dạng hình ảnh (.jpg, .jpeg, .png).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'Dung lượng ảnh tối đa là 10MB.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // 4. Mutation đăng ký mặt phụ huynh
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Vui lòng chọn file ảnh chân dung.');
      if (!consentDecree13) throw new Error('Cần xác nhận đồng thuận xử lý dữ liệu sinh trắc học theo Nghị định 13/2023/NĐ-CP.');

      const formData = new FormData();
      formData.append('photo', selectedFile);
      formData.append('consent', 'true');

      if (activePersonType === 'PARENT') {
        return await parentApi.registerParentPickupFace(formData);
      } else if (activePersonType === 'GUARDIAN') {
        if (!selectedGuardianId && guardians.length > 0) {
          return await parentApi.registerGuardianPickupFace(guardians[0].id, formData);
        }
        return await parentApi.registerGuardianPickupFace(selectedGuardianId, formData);
      } else {
        return await parentApi.attachEmergencyPickupFace(emergencyAuthId || 'AUTH-01', formData);
      }
    },
    onSuccess: () => {
      showToast('success', 'Đã tải lên và trích xuất vector khuôn mặt người đón thành công! Hệ thống camera cổng và giáo viên trả trẻ đã sẵn sàng nhận diện.');
      refetchPersons();
      setSelectedFile(null);
      setPreviewUrl('');
    },
    onError: (err: any) => {
      showToast('error', err?.response?.data?.message || err?.message || 'Không thể đăng ký khuôn mặt người đón.');
    },
  });

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sinh Trắc Học Nhận Diện Người Đón Trẻ AI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Đăng Ký Khuôn Mặt Phụ Huynh / Người Đón Bé {studentName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Phụ huynh chọn file ảnh chân dung rõ mặt để hệ thống AI nhận diện khi quét mặt đón trẻ vào giờ tan trường.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Bảo mật theo Nghị định 13/2023/NĐ-CP</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Upload bên trái */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Tải Lên Ảnh Chân Dung Người Đón</span>
          </h3>

          {/* Chọn đối tượng đăng ký */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 text-xs block">Chọn Người Cần Đăng Ký Khuôn Mặt *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePersonType('PARENT')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  activePersonType === 'PARENT'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Bố / Mẹ Ruột
              </button>
              <button
                type="button"
                onClick={() => setActivePersonType('GUARDIAN')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  activePersonType === 'GUARDIAN'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Người Giám Hộ
              </button>
              <button
                type="button"
                onClick={() => setActivePersonType('EMERGENCY')}
                className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                  activePersonType === 'EMERGENCY'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Đón Khẩn Cấp
              </button>
            </div>
          </div>

          {activePersonType === 'GUARDIAN' && (
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Chọn Người Giám Hộ Trong Danh Sách *</label>
              <select
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
              >
                {guardians.map((g: any) => (
                  <option key={g.id || g.guardianId} value={g.id || g.guardianId}>
                    {g.fullName} ({g.relationship}) — SĐT: {g.phone}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activePersonType === 'EMERGENCY' && (
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">Mã Phiếu Ủy Quyền Khẩn Cấp *</label>
              <input
                type="text"
                placeholder="VD: EMG-20261014-998"
                value={emergencyAuthId}
                onChange={(e) => setEmergencyAuthId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
              />
            </div>
          )}

          {/* Vùng chọn file ảnh từ máy tính */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 text-xs block">Chọn File Ảnh Chân Dung Từ Máy Tính *</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-400 bg-slate-900 group">
                <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 transition"
                  >
                    Đổi ảnh khác
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                    }}
                    className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-44 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30 flex flex-col items-center justify-center cursor-pointer transition p-4 text-center space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-700">Bấm vào đây để chọn file ảnh chân dung</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
                </div>
              </div>
            )}
          </div>

          {/* Tiêu chuẩn ảnh hợp lệ */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> Tiêu chuẩn ảnh quét mặt AI:
            </p>
            <p>• Chụp chính diện khuôn mặt, nhìn thẳng vào camera, đủ ánh sáng.</p>
            <p>• Không đeo kính râm, không đội mũ che khuất trán, không đeo khẩu trang.</p>
            <p>• Ảnh rõ nét, không bị nhòe mờ hay rung lắc.</p>
          </div>

          {/* Điều khoản Nghị định 13 */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              checked={consentDecree13}
              onChange={(e) => setConsentDecree13(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              Tôi đồng thuận để nhà trường trích xuất vector khuôn mặt phục vụ đối chiếu an ninh khi đón trả trẻ theo <strong>Nghị định 13/2023/NĐ-CP</strong>.
            </span>
          </label>

          <button
            type="button"
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !selectedFile || !consentDecree13}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Tải Lên & Trích Xuất Vector Nhận Diện</span>
          </button>
        </div>

        {/* Danh sách người đón đã có vector AI bên phải */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Danh Sách Người Đón Được Phép Nhận Diện</span>
            </h3>
            <button
              onClick={() => refetchPersons()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Làm mới
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-xs">Đang tải danh sách người đón...</p>
            </div>
          ) : pickupPersons.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-slate-500 text-sm font-semibold">Chưa có người đón nào đăng ký khuôn mặt.</p>
              <p className="text-xs text-slate-400">Phụ huynh hãy chọn file ảnh chân dung phía bên trái để đăng ký ngay.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pickupPersons.map((p: any, idx: number) => (
                <div key={p.id || idx} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 text-sm truncate">{p.name || 'Người đón'}</span>
                      {p.isRegistered && (
                        <span title="Đã có vector AI">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-700 font-semibold">{p.relationship || 'Người thân'}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.isRegistered ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {p.isRegistered ? 'Đã kích hoạt AI' : 'Chưa có ảnh'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
