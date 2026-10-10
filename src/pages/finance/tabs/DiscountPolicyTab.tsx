import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { DiscountRule } from '../../../types/finance.types';

const DEFAULT_DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'disc-01',
    name: 'Giảm trừ con thứ 2 (Anh/Chị/Em ruột)',
    discountType: 'PERCENTAGE',
    value: 10,
    description: 'Giảm 10% học phí cơ bản cho bé thứ hai cùng học tại trường.',
    isActive: true
  },
  {
    id: 'disc-02',
    name: 'Giảm trừ con thứ 3 trở lên',
    discountType: 'PERCENTAGE',
    value: 20,
    description: 'Giảm 20% học phí cơ bản cho bé thứ ba.',
    isActive: true
  },
  {
    id: 'disc-03',
    name: 'Học bổng con thương binh / chính sách',
    discountType: 'FIXED_AMOUNT',
    value: 500000,
    description: 'Giảm 500.000 VNĐ trừ trực tiếp vào học phí mỗi kỳ.',
    isActive: true
  }
];

export const DiscountPolicyTab: React.FC = () => {
  const queryClient = useQueryClient();

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null);
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState(10);
  const [description, setDescription] = useState('');

  const { data: discountRules = DEFAULT_DISCOUNT_RULES, isLoading } = useQuery<DiscountRule[]>({
    queryKey: ['discount-rules'],
    queryFn: async () => {
      try {
        const res: any = await financeApi.getDiscountRules();
        const list = res?.data || res;
        return Array.isArray(list) && list.length > 0 ? list : DEFAULT_DISCOUNT_RULES;
      } catch {
        return DEFAULT_DISCOUNT_RULES;
      }
    }
  });

  const handleOpenAdd = () => {
    setEditingRule(null);
    setName('');
    setDiscountType('PERCENTAGE');
    setValue(10);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule: DiscountRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setDiscountType(rule.discountType);
    setValue(rule.value);
    setDescription(rule.description || '');
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<DiscountRule> = {
        name: name.trim(),
        discountType,
        value,
        description: description.trim(),
        isActive: true
      };
      if (editingRule) {
        return await financeApi.updateDiscountRule(editingRule.id, payload);
      } else {
        return await financeApi.createDiscountRule(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      setIsModalOpen(false);
      setToastMessage({
        type: 'success',
        text: editingRule
          ? 'Đã cập nhật chính sách miễn giảm thành công.'
          : 'Đã thêm chính sách miễn giảm mới thành công.'
      });
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'Lỗi máy chủ khi lưu chính sách miễn giảm.'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await financeApi.deleteDiscountRule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] });
      setToastMessage({
        type: 'success',
        text: 'Đã xóa chính sách miễn giảm thành công.'
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
            <ShieldCheck className="h-5 w-5 text-[#275A4E]" />
            <span>Chính Sách Miễn Giảm Học Phí & Học Bổng</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập tỷ lệ chiết khấu (%) hoặc mức giảm cố định (VNĐ) tự động khấu trừ vào hóa đơn
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 text-xs font-bold shadow-md min-h-[44px]"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm Chính Sách Mới</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
              <tr>
                <th className="py-3 px-4">Tên Chính Sách</th>
                <th className="py-3 px-3 text-center">Hình Thức Giảm</th>
                <th className="py-3 px-3 text-right">Mức Giảm</th>
                <th className="py-3 px-3">Mô Tả Áp Dụng</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách chính sách...
                  </td>
                </tr>
              ) : discountRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Chưa có chính sách miễn giảm nào.
                  </td>
                </tr>
              ) : (
                discountRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{r.name}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                        {r.discountType === 'PERCENTAGE' ? 'Theo tỷ lệ %' : 'Số tiền cố định'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-[#275A4E] font-mono text-sm">
                      {r.discountType === 'PERCENTAGE' ? `${r.value}%` : formatCurrency(r.value)}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">{r.description || '—'}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          r.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.isActive ? 'Đang áp dụng' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(r)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#275A4E] hover:bg-slate-100 transition"
                          title="Sửa chính sách"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa chính sách "${r.name}"?`)) {
                              deleteMutation.mutate(r.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa chính sách"
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
              {editingRule ? 'Chỉnh Sửa Chính Sách Miễn Giảm' : 'Thêm Chính Sách Miễn Giảm Mới'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên chính sách:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Giảm trừ con thứ 2..."
                  className="w-full rounded-2xl border border-slate-200 p-2.5 text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hình thức giảm:</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 font-semibold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  >
                    <option value="PERCENTAGE">Theo phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền cố định (₫)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {discountType === 'PERCENTAGE' ? 'Tỷ lệ giảm (%):' : 'Số tiền giảm (₫):'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={value}
                    onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-2xl border border-slate-200 p-2.5 font-mono font-bold text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả điều kiện:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Điều kiện chứng minh hồ sơ..."
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
                disabled={saveMutation.isPending || !name.trim()}
                onClick={() => saveMutation.mutate()}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu Chính Sách'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountPolicyTab;
