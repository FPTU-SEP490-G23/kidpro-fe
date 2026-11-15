import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HeartPulse,
  Scale,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Syringe,
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';
import parentApi from '../../../api/parentApi';
import { calculateBmi, getBmiStatus, getBmiStatusBadgeColor, formatDate } from '../../../utils/formatters';

interface HealthAllergyProfileTabProps {
  studentId: string;
  studentName: string;
  className?: string;
}

export const HealthAllergyProfileTab: React.FC<HealthAllergyProfileTabProps> = ({
  studentId,
  studentName,
  className = 'Mầm 1 (3-4 Tuổi)',
}) => {
  const queryClient = useQueryClient();
  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);

  // Form Allergy State
  const [allergen, setAllergen] = useState('');
  const [reactionType, setReactionType] = useState('');
  const [severity, setSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [emergencyAction, setEmergencyAction] = useState('');

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'warning' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch Health Metrics
  const { data: metrics = [] } = useQuery({
    queryKey: ['health-metrics', studentId],
    queryFn: () => parentApi.getStudentHealthMetrics(studentId),
    enabled: !!studentId,
  });

  // 2. Fetch Allergies
  const { data: allergies = [], refetch: refetchAllergies } = useQuery({
    queryKey: ['student-allergies', studentId],
    queryFn: () => parentApi.getStudentAllergies(studentId),
    enabled: !!studentId,
  });

  // Latest metric
  const latestMetric = metrics[0] || {
    heightCm: 102.5,
    weightKg: 16.2,
    bmi: 15.4,
    recordedDate: '2026-10-15',
  };

  const calculatedBmi = calculateBmi(latestMetric.weightKg, latestMetric.heightCm);
  const bmiStatus = getBmiStatus(calculatedBmi);
  const bmiBadgeColor = getBmiStatusBadgeColor(bmiStatus);

  // Mutation: Thêm dị ứng mới
  const addAllergyMutation = useMutation({
    mutationFn: () =>
      parentApi.saveStudentAllergy(studentId, {
        allergen: allergen.trim(),
        reactionType: reactionType.trim() || undefined,
        severity,
        emergencyAction: emergencyAction.trim() || undefined,
      }),
    onSuccess: () => {
      showToast('success', 'Đã lưu thông tin dị ứng vào hồ sơ y tế & báo bếp thành công!');
      refetchAllergies();
      setShowAddAllergyModal(false);
      setAllergen('');
      setReactionType('');
      setEmergencyAction('');
    },
    onError: () => {
      showToast('error', 'Không thể lưu dị ứng. Vui lòng thử lại.');
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700">
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Hồ Sơ Y Tế & Thể Trạng Trẻ Mầm Non</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Hồ Sơ Sức Khỏe & Dị Ứng Của Bé {studentName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Lớp: <strong>{className}</strong> • Theo dõi cân nặng, chiều cao, chỉ số BMI theo chuẩn WHO và cảnh báo dị ứng thực phẩm tới nhà bếp trường.
          </p>
        </div>

        <button
          onClick={() => setShowAddAllergyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Khai Báo Dị Ứng Mới</span>
        </button>
      </div>

      {/* Thể trạng hiện tại & BMI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-500" /> Chiều Cao Hiện Tại
          </p>
          <p className="text-2xl font-black text-slate-800">{latestMetric.heightCm} <span className="text-sm font-semibold text-slate-500">cm</span></p>
          <p className="text-[11px] text-slate-400">Đo ngày {formatDate(latestMetric.recordedDate)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-500" /> Cân Nặng Hiện Tại
          </p>
          <p className="text-2xl font-black text-slate-800">{latestMetric.weightKg} <span className="text-sm font-semibold text-slate-500">kg</span></p>
          <p className="text-[11px] text-slate-400">Đo ngày {formatDate(latestMetric.recordedDate)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Chỉ Số BMI
          </p>
          <p className="text-2xl font-black text-slate-800">{calculatedBmi.toFixed(1)}</p>
          <p className="text-[11px] text-slate-400">Cân nặng (kg) / [Chiều cao (m)]²</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đánh Giá WHO</p>
          <div className="pt-1">
            <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold ${bmiBadgeColor}`}>
              {bmiStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Tiêu chuẩn phát triển trẻ mầm non</p>
        </div>
      </div>

      {/* Grid: Lịch sử thể trạng bên trái / Dị ứng bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lịch sử tăng trưởng */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Biểu Đồ Theo Dõi Thể Trạng Định Kỳ</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">Nhân viên y tế đo định kỳ mỗi tháng</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-2.5 px-3">Thời Gian</th>
                  <th className="py-2.5 px-3">Chiều Cao</th>
                  <th className="py-2.5 px-3">Cân Nặng</th>
                  <th className="py-2.5 px-3">BMI</th>
                  <th className="py-2.5 px-3">Kết Luận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {metrics.map((m: any, idx: number) => {
                  const bVal = calculateBmi(m.weightKg, m.heightCm);
                  return (
                    <tr key={m.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">{formatDate(m.recordedDate)}</td>
                      <td className="py-3 px-3 text-indigo-700 font-bold">{m.heightCm} cm</td>
                      <td className="py-3 px-3 text-emerald-700 font-bold">{m.weightKg} kg</td>
                      <td className="py-3 px-3">{bVal.toFixed(1)}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${getBmiStatusBadgeColor(getBmiStatus(bVal))}`}>
                          {getBmiStatus(bVal)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danh sách cảnh báo dị ứng */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Hồ Sơ Cảnh Báo Dị Ứng (Đồng bộ Bếp)</span>
            </h3>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {allergies.length} dị ứng
            </span>
          </div>

          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <p>
              Mọi dị ứng khai báo tại đây sẽ được <strong>tự động chuyển tới Bếp ăn bán trú</strong> để chuẩn bị khay ăn riêng (khay viền cam đặc biệt) cho bé nhằm phòng tránh sốc phản vệ.
            </p>
          </div>

          {allergies.length === 0 ? (
            <div className="p-8 border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Chưa ghi nhận tiền sử dị ứng</p>
              <p className="text-xs text-slate-400">Nếu bé dị ứng thực phẩm, sữa hoặc phấn hoa, phụ huynh hãy bấm nút khai báo phía trên.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allergies.map((alg: any, idx: number) => (
                <div key={alg.id || idx} className="p-4 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      {alg.allergen}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        alg.severity === 'SEVERE'
                          ? 'bg-rose-600 text-white'
                          : alg.severity === 'MODERATE'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {alg.severity === 'SEVERE' ? 'Nghiêm trọng (Nguy hiểm)' : alg.severity === 'MODERATE' ? 'Trung bình' : 'Nhẹ'}
                    </span>
                  </div>

                  {alg.reactionType && (
                    <p className="text-slate-600">
                      <strong>Triệu chứng phản ứng:</strong> {alg.reactionType}
                    </p>
                  )}

                  {alg.emergencyAction && (
                    <p className="text-rose-800 font-semibold bg-white p-2 rounded-xl border border-rose-100">
                      🚨 <strong>Hướng xử lý khẩn cấp:</strong> {alg.emergencyAction}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lịch sử tiêm chủng và ghi chú y tế */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
          <Syringe className="w-5 h-5 text-emerald-600" />
          <span>Sổ Tiêm Chủng Mầm Non & Khám Sức Khỏe Đầu Năm</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block">✓ Sởi - Quai bị - Rubella (MMR)</span>
            <p className="text-emerald-700">Đã hoàn thành 2 mũi cơ bản trước khi nhập học.</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block">✓ Viêm não Nhật Bản & Cúm Mùa</span>
            <p className="text-emerald-700">Tiêm nhắc lại định kỳ hàng năm theo chỉ đạo Trạm Y Tế phường.</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block">✓ Khám Răng Hàm Mặt & Mắt Học Đường</span>
            <p className="text-emerald-700">Được Bác sĩ chuyên khoa khám tổng quát đầu học kỳ 1 (Thị lực 10/10).</p>
          </div>
        </div>
      </div>

      {/* Modal Khai Báo Dị Ứng */}
      {showAddAllergyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-6 bg-rose-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black">Khai Báo Dị Ứng Mới Cho Bé</h3>
                <p className="text-xs text-rose-100">Bé {studentName} — Lớp {className}</p>
              </div>
              <button onClick={() => setShowAddAllergyModal(false)} className="text-white hover:text-rose-200 text-xl font-bold">
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAllergyMutation.mutate();
              }}
              className="p-6 pt-0 space-y-4 text-xs sm:text-sm"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Dị Nguyên (Món ăn / Thuốc / Phấn hoa) *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hải sản (Tôm, Cua), Sữa tươi bò, Đậu phộng, Kháng sinh Amoxicillin..."
                  value={allergen}
                  onChange={(e) => setAllergen(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mức Độ Nghiêm Trọng *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold bg-white"
                >
                  <option value="MILD">Nhẹ (Nổi mề đay nhẹ, ngứa ngoài da)</option>
                  <option value="MODERATE">Trung bình (Nổi mẩn đỏ quanh miệng, đau bụng, tiêu chảy)</option>
                  <option value="SEVERE">Nghiêm trọng (Khó thở, phù nề thanh quản, sốc phản vệ)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Triệu Chứng Cụ Thể Khi Tiếp Xúc</label>
                <input
                  type="text"
                  placeholder="VD: Bé ăn tôm sau 15 phút sẽ bị sưng môi và ngứa cổ họng..."
                  value={reactionType}
                  onChange={(e) => setReactionType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hướng Xử Lý Khẩn Cấp Cho Cô Giáo & Y Tế Trường</label>
                <textarea
                  rows={2}
                  placeholder="VD: Cho bé uống thuốc dị ứng trong balo và gọi mẹ số 0903... ngay lập tức"
                  value={emergencyAction}
                  onChange={(e) => setEmergencyAction(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAllergyModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={addAllergyMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  {addAllergyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Lưu Khai Báo Dị Ứng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
