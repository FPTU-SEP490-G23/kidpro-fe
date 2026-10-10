import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Phone,
  Trash2,
  X,
  Camera,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import {
  AuthorizedGuardian,
  RegisterGuardianPayload
} from '../../../types/parent.types';

interface AuthorizedGuardiansTabProps {
  studentId: string;
  studentName: string;
}

export const AuthorizedGuardiansTab: React.FC<AuthorizedGuardiansTabProps> = ({
  studentId,
  studentName,
}) => {
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Modal đăng ký người đón mới
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Bà nội');
  const [phone, setPhone] = useState<string>('');
  const [citizenId, setCitizenId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [idCardFrontUrl, setIdCardFrontUrl] = useState<string>('');
  const [idCardBackUrl, setIdCardBackUrl] = useState<string>('');

  // Modal thu hồi quyền đón
  const [showRevokeModal, setShowRevokeModal] = useState<boolean>(false);
  const [selectedGuardianForRevoke, setSelectedGuardianForRevoke] = useState<AuthorizedGuardian | null>(null);
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState<string>('');

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Tải danh sách người đón được ủy quyền của học sinh
  const { data: guardians, isLoading, refetch, isFetching } = useQuery<AuthorizedGuardian[]>({
    queryKey: ['guardians', studentId],
    queryFn: async () => {
      try {
        const res = await parentApi.getAuthorizedGuardians(studentId);
        return res.data;
      } catch {
        showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
        throw new Error('Network error');
      }
    },
  });

  const guardianList = guardians || [];

  // Helper che mờ CCCD (Privacy-by-Design)
  const maskCitizenId = (id: string) => {
    if (id.length < 12) return id;
    return `${id.slice(0, 6)}****${id.slice(-2)}`;
  };

  // Mutation thêm người đón mới
  const addGuardianMutation = useMutation({
    mutationFn: async (payload: RegisterGuardianPayload) => {
      return parentApi.registerAuthorizedGuardian(payload);
    },
    onSuccess: () => {
      setShowAddModal(false);
      resetAddForm();
      showToast(
        'success',
        'MSG-171: Đã gửi hồ sơ người đón ủy quyền. Nhà trường sẽ thẩm định và kích hoạt trong vòng 24 giờ'
      );
      queryClient.invalidateQueries({ queryKey: ['guardians', studentId] });
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    },
  });

  // Mutation thu hồi quyền đón
  const revokeMutation = useMutation({
    mutationFn: async ({ guardianId, password }: { guardianId: string; password: string }) => {
      return parentApi.revokeAuthorizedGuardian(studentId, guardianId, password);
    },
    onSuccess: () => {
      setShowRevokeModal(false);
      setSelectedGuardianForRevoke(null);
      setParentPasswordConfirm('');
      showToast(
        'success',
        'MSG-172: Đã xóa người được ủy quyền và thu hồi quyền nhận diện đón trẻ thành công.'
      );
      queryClient.invalidateQueries({ queryKey: ['guardians', studentId] });
    },
    onError: () => {
      showToast('error', 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    },
  });

  const resetAddForm = () => {
    setFullName('');
    setRelationship('Bà nội');
    setPhone('');
    setCitizenId('');
    setPhotoUrl('');
    setIdCardFrontUrl('');
    setIdCardBackUrl('');
  };

  // Submit form đăng ký người đón
  const handleAddGuardianSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // BR-022: Tối đa 5 người
    if (guardianList.length >= 5) {
      showToast(
        'error',
        'MSG-084: Đã đạt giới hạn tối đa 5 người đón ủy quyền cho một học sinh. Vui lòng thu hồi người đón cũ trước.'
      );
      return;
    }

    // Validate CCCD: đúng 12 chữ số
    const cleanCccd = citizenId.trim();
    if (!/^\d{12}$/.test(cleanCccd)) {
      showToast(
        'error',
        'MSG-173: Số Căn cước công dân (CCCD) không hợp lệ. Vui lòng kiểm tra lại 12 chữ số.'
      );
      return;
    }

    // Validate SĐT: 10 chữ số chuẩn VN
    const cleanPhone = phone.trim();
    if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(cleanPhone)) {
      showToast('warning', 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số).');
      return;
    }

    // Validate ảnh 2 mặt CCCD và ảnh chân dung
    if (!idCardFrontUrl || !idCardBackUrl || !photoUrl) {
      showToast(
        'error',
        'MSG-174: Ảnh chụp 2 mặt thẻ CCCD là thông tin bắt buộc để nhà trường thẩm định an toàn.'
      );
      return;
    }

    addGuardianMutation.mutate({
      studentId,
      fullName: fullName.trim(),
      relationship,
      phone: cleanPhone,
      citizenId: cleanCccd,
      photoUrl,
      idCardFrontUrl,
      idCardBackUrl,
    });
  };

  // Xác nhận thu hồi
  const handleConfirmRevoke = () => {
    if (!selectedGuardianForRevoke) return;
    if (!parentPasswordConfirm.trim()) {
      showToast('warning', 'Vui lòng nhập mật khẩu tài khoản phụ huynh để xác thực quyền thu hồi.');
      return;
    }

    revokeMutation.mutate({
      guardianId: selectedGuardianForRevoke.id,
      password: parentPasswordConfirm,
    });
  };

  // Giả lập chọn ảnh demo
  const handleSetSampleImages = () => {
    setPhotoUrl('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300');
    setIdCardFrontUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');
    setIdCardBackUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400');
    showToast('info', 'Đã tải ảnh chân dung và 2 mặt thẻ CCCD mẫu.');
  };

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border shadow-md animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-[#DC2626]'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />}
          {toastMessage.type === 'error' && <AlertTriangle className="h-5 w-5 shrink-0 text-[#DC2626]" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />}
          {toastMessage.type === 'info' && <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />}
          <div className="flex-1 font-semibold text-sm">{toastMessage.text}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HEADER PHÂN HỆ UC-042 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#78C2AD]/15 text-[#1E4D40]">
            <Users className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>UC-042 • Danh Sách Người Đón Được Ủy Quyền (Authorized Guardians)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1E4D40] tracking-tight">
            Quản Lý Danh Sách Người Thân Đón Bé
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
            Đăng ký tối đa <strong>5 người đón cố định</strong> cho bé <strong>{studentName}</strong> kèm ảnh chân dung và 2 mặt CCCD.
            Nhà trường thẩm định danh tính và kích hoạt nhận diện AI tại cổng trường.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bộ đếm người đón */}
          <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-700 font-extrabold text-xs">
            Đã đăng ký: <span className="text-[#275A4E] text-sm">{guardianList.length}</span>/5 người
          </div>

          <button
            type="button"
            onClick={() => {
              if (guardianList.length >= 5) {
                showToast(
                  'error',
                  'MSG-084: Đã đạt giới hạn tối đa 5 người đón ủy quyền cho một học sinh. Vui lòng thu hồi người đón cũ trước.'
                );
              } else {
                setShowAddModal(true);
              }
            }}
            disabled={guardianList.length >= 5}
            className="h-11 px-5 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm Người Đón Mới</span>
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 w-11 rounded-2xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* DANH SÁCH THẺ NGƯỜI ĐÓN (GRID VIEW) */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="h-8 w-8 text-[#275A4E] animate-spin mx-auto" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Đang tải danh sách người đón ủy quyền...</p>
        </div>
      ) : guardianList.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-white rounded-3xl border border-slate-200">
          <Users className="h-12 w-12 mx-auto opacity-30 text-slate-400" />
          <h4 className="text-sm font-black text-slate-700">Chưa có người đón ủy quyền nào được đăng ký</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Vui lòng nhấn &quot;Thêm Người Đón Mới&quot; để bổ sung người thân (Bố, Mẹ, Ông, Bà,...) được phép đón bé tại cổng trường.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {guardianList.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header thẻ: Avatar & Trạng thái */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={g.photoUrl}
                      alt={g.fullName}
                      className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
                    />
                    <div>
                      <h4 className="font-black text-slate-800 text-sm sm:text-base group-hover:text-[#275A4E] transition">
                        {g.fullName}
                      </h4>
                      <span className="inline-block text-xs font-bold text-[#275A4E] bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 border border-emerald-200">
                        {g.relationship}
                      </span>
                    </div>
                  </div>

                  {/* Badge thẩm định */}
                  {g.status === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="h-3 w-3" />
                      <span>ĐÃ DUYỆT</span>
                    </span>
                  )}
                  {g.status === 'PENDING_VERIFICATION' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3" />
                      <span>CHỜ DUYỆT</span>
                    </span>
                  )}
                  {g.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-50 text-[#DC2626] border border-red-200">
                      <AlertTriangle className="h-3 w-3" />
                      <span>TỪ CHỐI</span>
                    </span>
                  )}
                </div>

                {/* Thông tin chi tiết */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Số CCCD (Che mờ):</span>
                    <strong className="font-mono text-slate-800 font-bold tracking-wider">
                      {g.maskedCitizenId || maskCitizenId(g.citizenId)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" /> Số điện thoại:
                    </span>
                    <strong className="font-mono text-slate-800 font-bold">{g.phone}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>AI Nhận diện cổng:</span>
                    {g.aiFaceEmbeddingReady ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã đồng bộ
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Chờ kích hoạt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Tạo ngày: {new Date(g.createdAt).toLocaleDateString('vi-VN')}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuardianForRevoke(g);
                    setShowRevokeModal(true);
                  }}
                  className="h-8 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-[#DC2626] font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Thu hồi quyền</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL ĐĂNG KÝ NGƯỜI ĐÓN MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#275A4E] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">
                    Đăng Ký Người Đón Được Ủy Quyền
                  </h3>
                  <p className="text-xs text-white/80">Ủy quyền đón bé {studentName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddGuardianSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Họ và tên người đón *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Thị Mai..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Mối quan hệ với bé *</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  >
                    <option value="Bố ruột">Bố ruột</option>
                    <option value="Mẹ ruột">Mẹ ruột</option>
                    <option value="Ông nội">Ông nội</option>
                    <option value="Bà nội">Bà nội</option>
                    <option value="Ông ngoại">Ông ngoại</option>
                    <option value="Bà ngoại">Bà ngoại</option>
                    <option value="Chú/Bác/Cô/Dì">Chú / Bác / Cô / Dì</option>
                    <option value="Người giúp việc/Tài xế">Người giúp việc / Tài xế gia đình</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Số Căn cước công dân (12 số) *</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="001094012345"
                    value={citizenId}
                    onChange={(e) => setCitizenId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 font-mono font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Upload ảnh bắt buộc */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-black text-slate-800 text-xs uppercase tracking-wider block">
                    Hình ảnh xác minh bắt buộc (3 ảnh)
                  </label>
                  <button
                    type="button"
                    onClick={handleSetSampleImages}
                    className="text-xs text-[#275A4E] font-bold hover:underline"
                  >
                    Dùng ảnh mẫu test
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Ảnh chân dung */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">1. Ảnh chân dung</span>
                    {photoUrl ? (
                      <img src={photoUrl} alt="Chân dung" className="h-20 w-full object-cover rounded-xl" />
                    ) : (
                      <div className="h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Mặt trước CCCD */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">2. Mặt trước CCCD</span>
                    {idCardFrontUrl ? (
                      <img src={idCardFrontUrl} alt="Mặt trước" className="h-20 w-full object-cover rounded-xl" />
                    ) : (
                      <div className="h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {/* Mặt sau CCCD */}
                  <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">3. Mặt sau CCCD</span>
                    {idCardBackUrl ? (
                      <img src={idCardBackUrl} alt="Mặt sau" className="h-20 w-full object-cover rounded-xl" />
                    ) : (
                      <div className="h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <Camera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={addGuardianMutation.isPending}
                  className="h-11 px-6 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-black flex items-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  {addGuardianMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>Gửi Đăng Ký Ủy Quyền</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY QUYỀN ĐÓN (REVOKE) */}
      {showRevokeModal && selectedGuardianForRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black">Xác Nhận Hủy Quyền Đón Bé</h3>
                  <p className="text-xs text-white/80">Khóa nhận diện AI tức thì tại cổng trường</p>
                </div>
              </div>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-slate-700">
              <p>
                Bạn có chắc chắn muốn hủy quyền đón bé của{' '}
                <strong className="text-slate-900">{selectedGuardianForRevoke.fullName}</strong> (
                {selectedGuardianForRevoke.relationship}) không?
              </p>

              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-[#DC2626] font-bold text-xs space-y-1">
                <p>• Người này sẽ lập tức bị khóa quyền nhận diện AI tại trạm camera cổng trường.</p>
                <p>• Bảo vệ cổng sẽ từ chối giao trẻ nếu người này xuất hiện.</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-800 block">
                  Nhập mật khẩu tài khoản phụ huynh để xác thực:
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="Mật khẩu của bạn..."
                    value={parentPasswordConfirm}
                    onChange={(e) => setParentPasswordConfirm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-900 focus:border-red-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-white transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={revokeMutation.isPending}
                className="h-11 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black flex items-center gap-2 shadow-md transition disabled:opacity-50"
              >
                {revokeMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Xác Nhận Thu Hồi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorizedGuardiansTab;
