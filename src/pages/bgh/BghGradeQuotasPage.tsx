import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import gradeLevelApi, { GradeLevelQuota } from '../../api/gradeLevelApi';
import { useToast } from '../../contexts/ToastContext';
import {
  Edit3,
  Users,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const BghGradeQuotasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [selectedQuota, setSelectedQuota] = useState<GradeLevelQuota | null>(null);
  const [newCapacity, setNewCapacity] = useState<number>(25);
  const [validationError, setValidationError] = useState<string>('');

  const { data: quotas = [], isLoading, isFetching, refetch } = useQuery<GradeLevelQuota[]>({
    queryKey: ['grade-level-quotas'],
    queryFn: gradeLevelApi.getAllQuotas,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuota) return;
      return await gradeLevelApi.updateQuota(selectedQuota.gradeLevel, Number(newCapacity));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grade-level-quotas'] });
      success(data?.message || 'MSG-015: Cập nhật định mức sĩ số cho khối lớp thành công.');
      setSelectedQuota(null);
      setValidationError('');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'MSG-016: Sĩ số định mức vượt quá giới hạn tối đa cho phép theo quy định chuẩn của Bộ GD&ĐT (Nhà trẻ ≤ 26 trẻ, Mẫu giáo ≤ 35 trẻ).';
      setValidationError(msg);
      error(msg);
    },
  });

  const handleOpenEdit = (quota: GradeLevelQuota) => {
    setSelectedQuota(quota);
    setNewCapacity(quota.maxCapacity);
    setValidationError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuota) return;

    // Client-side BR-006 validation
    const isNhaTre = selectedQuota.gradeLevel === 'INFANT' || selectedQuota.gradeLevel === 'TODDLER';
    const limit = isNhaTre ? 26 : 35;

    if (newCapacity <= 0) {
      setValidationError('Sĩ số định mức phải lớn hơn 0.');
      return;
    }

    if (newCapacity > limit) {
      const msg = 'MSG-016: Sĩ số định mức vượt quá giới hạn tối đa cho phép theo quy định chuẩn của Bộ GD&ĐT (Nhà trẻ ≤ 26 trẻ, Mẫu giáo ≤ 35 trẻ).';
      setValidationError(msg);
      error(msg);
      return;
    }

    updateMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 p-8 text-white shadow-xl shadow-teal-700/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UC-006 • Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Khối lớp & Định mức Sĩ số</h1>
          <p className="mt-2 text-teal-100 max-w-2xl text-sm leading-relaxed">
            Xem và cấu hình định mức sĩ số tối đa cho từng khối lớp (Nhà trẻ, Mầm, Chồi, Lá) theo quy chuẩn Bộ GD&ĐT (BR-006).
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-center inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Quy chuẩn Bộ GD&ĐT Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Quy chuẩn định mức sĩ số của Bộ GD&ĐT (Quy tắc BR-006):</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-700">
            <li><strong>Khối Nhà trẻ</strong> (từ 3 đến 36 tháng): Tối đa 24 - 26 trẻ/nhóm.</li>
            <li><strong>Khối Mẫu giáo</strong> (Mầm 3-4 tuổi, Chồi 4-5 tuổi, Lá 5-6 tuổi): Tối đa 30 - 35 trẻ/lớp.</li>
          </ul>
        </div>
      </div>

      {/* Grid danh sách các khối lớp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">Đang tải dữ liệu khối lớp...</div>
        ) : quotas.map((quota) => {
          const isNhaTre = quota.gradeLevel === 'INFANT' || quota.gradeLevel === 'TODDLER';
          return (
            <div
              key={quota.quotaId || quota.gradeLevel}
              className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isNhaTre ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {isNhaTre ? 'Nhóm Nhà Trẻ' : 'Khối Mẫu Giáo'}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400 text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>Tỷ lệ: {quota.teacherRatio}</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{quota.gradeName}</h3>
                <p className="text-xs text-slate-500 mb-4">Độ tuổi: {quota.ageRange}</p>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 mb-6">
                  <div className="text-xs text-slate-500 mb-1">Sĩ số định mức tối đa</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-800">{quota.maxCapacity}</span>
                    <span className="text-xs text-slate-500">trẻ / lớp</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Giới hạn Bộ GD&ĐT: &le; {quota.standardLimit} trẻ
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenEdit(quota)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white py-2.5 px-4 text-xs font-semibold transition-all shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Cập nhật định mức</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Cập nhật định mức */}
      {selectedQuota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cập nhật định mức sĩ số</h3>
                <p className="text-xs text-slate-500">{selectedQuota.gradeName}</p>
              </div>
              <button
                onClick={() => setSelectedQuota(null)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sĩ số tối đa / lớp (Hiện hành: {selectedQuota.maxCapacity})
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newCapacity}
                  onChange={(e) => {
                    setNewCapacity(Number(e.target.value));
                    setValidationError('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Chuẩn quy định Bộ GD&ĐT: Tối đa <strong>{selectedQuota.standardLimit}</strong> trẻ/lớp đối với khối này.
                </p>
              </div>

              {validationError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedQuota(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu định mức mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghGradeQuotasPage;
