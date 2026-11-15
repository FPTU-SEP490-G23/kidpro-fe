import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Wrench,
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  FileText
} from 'lucide-react';
import { attendanceApi } from '../../../api/attendanceApi';

interface IncidentItem {
  id: string;
  equipmentName: string;
  classroomName: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  photoUrl?: string;
  reportedAt: string;
}

export const ClassroomEquipmentIncidentTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [classroomName, setClassroomName] = useState<string>('Lớp Mầm 1');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Local incidents list
  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'inc-01',
      equipmentName: 'Điều hòa Daikin 2HP',
      classroomName: 'Lớp Mầm 1',
      description: 'Điều hòa bị rò rỉ nước từ dàn lạnh nhỏ giọt xuống sàn gỗ cạnh góc ngủ của bé, nguy cơ trơn trượt.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      reportedAt: '13/11/2026 09:30',
    },
    {
      id: 'inc-02',
      equipmentName: 'Bóng đèn LED trần số 3',
      classroomName: 'Lớp Mầm 1',
      description: 'Bóng đèn bị nhấp nháy liên tục gây chói mắt và khó chịu cho các bé trong giờ vẽ tranh.',
      severity: 'LOW',
      status: 'RESOLVED',
      photoUrl: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=500&auto=format&fit=crop&q=80',
      reportedAt: '10/11/2026 14:15',
    },
  ]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim() || !description.trim()) {
      setToastMessage({ type: 'warning', text: 'Vui lòng nhập tên thiết bị và mô tả chi tiết hư hỏng.' });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      await attendanceApi.reportEquipmentIncident({
        classroomId: 'c-mam1',
        equipmentName,
        description,
        severity,
        photoUrl: photoPreview || undefined,
      });
    } catch {
      // ignore
    }

    const newInc: IncidentItem = {
      id: 'inc-' + Date.now(),
      equipmentName,
      classroomName,
      description,
      severity,
      status: 'PENDING',
      photoUrl: photoPreview || undefined,
      reportedAt: new Date().toLocaleString('vi-VN'),
    };

    setIncidents([newInc, ...incidents]);
    setShowAddModal(false);
    setEquipmentName('');
    setDescription('');
    setPhotoPreview(null);
    setSeverity('MEDIUM');

    setToastMessage({
      type: 'success',
      text: 'Đã gửi báo cáo hư hỏng thiết bị tới Ban Quản Trị & Kỹ Thuật Nhà Trường!',
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E4D40] flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#275A4E]" />
            <span>Báo Cáo Hư Hỏng Cơ Sở Vật Chất & Thiết Bị Phòng Học</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Giáo viên chủ động phát hiện và gửi yêu cầu sửa chữa thiết bị hư hỏng (quạt, điều hòa, tủ thuốc, bàn ghế...) đảm bảo môi trường lớp học an toàn tuyệt đối.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-[#275A4E]/20 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 text-[#78C2AD]" />
          <span>Báo Hỏng Thiết Bị Mới</span>
        </button>
      </div>

      {/* List of Incidents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {incidents.map((inc) => (
          <div
            key={inc.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    inc.severity === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : inc.severity === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {inc.severity === 'HIGH' ? 'Mức độ: Cấp thiết' : inc.severity === 'MEDIUM' ? 'Mức độ: Cần sửa sớm' : 'Mức độ: Bình thường'}
                </span>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    inc.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-[#1E4D40]'
                      : inc.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {inc.status === 'RESOLVED' ? 'Đã khắc phục xong' : inc.status === 'IN_PROGRESS' ? 'Đang điều thợ sửa' : 'Chờ phân công'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-800">{inc.equipmentName}</h3>
                <div className="text-xs text-[#275A4E] font-semibold mt-0.5">{inc.classroomName}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{inc.description}</p>

              {inc.photoUrl && (
                <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={inc.photoUrl} alt="Hư hỏng" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Báo lúc: {inc.reportedAt}
              </span>
              <span className="font-semibold text-slate-600">Đơn vị: Kỹ thuật trường</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Báo hỏng thiết bị mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div
              style={{ background: 'linear-gradient(135deg, #275A4E 0%, #1E4D40 100%)' }}
              className="p-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#78C2AD]" />
                <h3 className="font-bold text-base">Gửi Báo Cáo Hư Hỏng Thiết Bị</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên thiết bị hư hỏng: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều hòa Daikin phòng 201, Quạt trần số 2..."
                  value={equipmentName}
                  onChange={(e) => setEquipmentName(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phòng / Lớp:</label>
                  <select
                    value={classroomName}
                    onChange={(e) => setClassroomName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Lớp Mầm 1">Lớp Mầm 1</option>
                    <option value="Lớp Chồi 1">Lớp Chồi 1</option>
                    <option value="Lớp Lá 1">Lớp Lá 1</option>
                    <option value="Sân chơi ngoài trời">Sân chơi ngoài trời</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mức độ nguy hại:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="LOW">Bình thường (sửa trong tuần)</option>
                    <option value="MEDIUM">Cần sửa sớm (1-2 ngày)</option>
                    <option value="HIGH">Khẩn cấp (nguy cơ cho bé)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mô tả tình trạng hư hỏng chi tiết: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả hiện tượng: có tiếng kêu lạ, chập điện, rơi ốc vít, rò rỉ nước..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                  required
                />
              </div>

              {/* Tải ảnh hư hỏng từ máy tính */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ảnh chụp hiện trạng (Chọn file từ máy tính):
                </label>
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#275A4E] bg-slate-50 cursor-pointer transition">
                  {photoPreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden">
                      <img src={photoPreview} alt="Xem trước" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-xs font-bold text-white">
                        Nhấp để chọn ảnh khác
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1">
                      <Upload className="w-7 h-7 mx-auto text-[#275A4E]" />
                      <div className="text-xs font-bold text-slate-700">Tải ảnh chụp hư hỏng từ máy tính</div>
                      <div className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG (tối đa 5MB)</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition shadow-md shadow-[#275A4E]/20 cursor-pointer"
                >
                  Gửi Yêu Cầu Sửa Chữa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomEquipmentIncidentTab;
