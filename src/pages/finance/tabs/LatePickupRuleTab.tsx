import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { LatePickupFeeRule } from '../../../types/finance.types';

const DEFAULT_LATE_RULES: LatePickupFeeRule[] = [
  {
    id: 'late-01',
    minMinutes: 15,
    maxMinutes: 30,
    penaltyAmount: 30000,
    description: 'Đón muộn từ 15 đến 30 phút sau 17:30.'
  },
  {
    id: 'late-02',
    minMinutes: 31,
    maxMinutes: 60,
    penaltyAmount: 50000,
    description: 'Đón muộn từ 31 đến 60 phút (bao gồm sữa lót dạ cho bé).'
  },
  {
    id: 'late-03',
    minMinutes: 61,
    maxMinutes: 120,
    penaltyAmount: 100000,
    description: 'Đón muộn trên 60 phút (phục vụ bữa tối cùng cô giáo trực).'
  }
];

export const LatePickupRuleTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LatePickupFeeRule | null>(null);
  const [minMinutes, setMinMinutes] = useState<number>(15);
  const [maxMinutes, setMaxMinutes] = useState<number>(30);
  const [penaltyAmount, setPenaltyAmount] = useState<number>(30000);
  const [description, setDescription] = useState<string>('');

  const { data: lateRules = DEFAULT_LATE_RULES, isLoading } = useQuery<LatePickupFeeRule[]>({
    queryKey: ['late-pickup-rules'],
    queryFn: async () => {
      try {
        const res: any = await financeApi.getLatePickupRules();
        const list = res?.data || res;
        return Array.isArray(list) && list.length > 0 ? list : DEFAULT_LATE_RULES;
      } catch {
        return DEFAULT_LATE_RULES;
      }
    }
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setMinMinutes(15);
    setMaxMinutes(30);
    setPenaltyAmount(30000);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: LatePickupFeeRule) => {
    setEditingRule(rule);
    setMinMinutes(rule.minMinutes);
    setMaxMinutes(rule.maxMinutes);
    setPenaltyAmount(rule.penaltyAmount);
    setDescription(rule.description || '');
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<LatePickupFeeRule> = {
        minMinutes,
        maxMinutes,
        penaltyAmount,
        description: description.trim()
      };
      if (editingRule) {
        return await financeApi.updateLatePickupRule(editingRule.id, payload);
      } else {
        return await financeApi.createLatePickupRule(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['late-pickup-rules'] });
      setIsModalOpen(false);
      setToastMessage({
        type: 'success',
        text: editingRule
          ? 'Đã cập nhật khung phạt đón muộn thành công.'
          : 'Đã thêm khung phạt đón muộn mới thành công.'
      });
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'Lỗi máy chủ khi lưu khung phạt đón muộn.'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await financeApi.deleteLatePickupRule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['late-pickup-rules'] });
      setToastMessage({
        type: 'success',
        text: 'Đã xóa khung phạt đón muộn thành công.'
      });
    }
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="underline">
            Đóng
          </button>
        </div>
      )}

      {/* Header & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-base font-extrabold text-[#1E4D40] flex items-center gap-2">
            <Timer className="h-5 w-5 text-[#275A4E]" />
            <span>Khung Phạt Trông Muộn Ngoài Giờ (Late Pickup Rules)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Quy định các khung thời gian đón muộn sau 17:30 (tự động cộng dồn vào hóa đơn học phí tháng qua camera AI)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 text-xs font-bold shadow-md min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Khung Phạt Mới</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Khoảng Thời Gian Muộn</th>
                <th className="py-3 px-4 text-right">Mức Phạt Quy Định</th>
                <th className="py-3 px-4">Mô Tả Chế Độ Chăm Sóc</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Đang tải danh sách khung phạt...
                  </td>
                </tr>
              ) : lateRules.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Chưa có khung phạt đón muộn nào.
                  </td>
                </tr>
              ) : (
                lateRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-600" />
                      <span>{r.minMinutes} - {r.maxMinutes} phút</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-amber-700 font-mono text-sm">
                      +{formatCurrency(r.penaltyAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{r.description || '—'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#275A4E] hover:bg-slate-100 transition"
                          title="Sửa khung phạt"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa khung phạt này?')) {
                              deleteMutation.mutate(r.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa khung phạt"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-base font-bold text-slate-800">
              {editingRule ? 'Chỉnh Sửa Khung Phạt Đón Muộn' : 'Thêm Khung Phạt Đón Muộn Mới'}
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Từ phút (Min):</label>
                  <input
                    type="number"
                    min="1"
                    value={minMinutes}
                    onChange={(e) => setMinMinutes(parseInt(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 font-bold font-mono text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đến phút (Max):</label>
                  <input
                    type="number"
                    min="1"
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(parseInt(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 font-bold font-mono text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mức phạt quy định (VNĐ):</label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-slate-200 p-2.5 font-bold font-mono text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Bằng chữ: {formatCurrency(penaltyAmount)}
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả chế độ chăm sóc:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Phục vụ bữa phụ cho bé..."
                  className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Khung Phạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LatePickupRuleTab;
