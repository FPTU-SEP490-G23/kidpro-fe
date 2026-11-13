import React, { useState, useEffect } from 'react';
import {
  Percent,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Users,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import axiosClient from '../../../api/axiosClient';
import { formatCurrency } from '../../../utils/formatters';
import {
  DiscountPolicyDto,
  DiscountPolicyRequestDto,
  StudentDiscountDto,
  AssignStudentDiscountRequestDto,
} from '../../../types/finance.types';

export const DiscountPolicyTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'policies' | 'students'>('policies');

  const [policies, setPolicies] = useState<DiscountPolicyDto[]>([]);
  const [studentDiscounts, setStudentDiscounts] = useState<StudentDiscountDto[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);
  const [editingPolicy, setEditingPolicy] = useState<DiscountPolicyDto | null>(null);
  const [policyName, setPolicyName] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('');
  const [appliedDate, setAppliedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [policiesRes, studentDiscountsRes] = await Promise.all([
        financeApi.getDiscountPolicies(),
        financeApi.getStudentDiscounts(),
      ]);
      setPolicies((policiesRes as any)?.data || policiesRes || []);
      setStudentDiscounts((studentDiscountsRes as any)?.data || studentDiscountsRes || []);

      try {
        const stRes = await axiosClient.get('/students');
        setStudentsList((stRes as any)?.data || stRes || []);
      } catch (e) {
        // fallback
      }
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải dữ liệu chính sách miễn giảm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openCreatePolicyModal = () => {
    setEditingPolicy(null);
    setPolicyName('');
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setIsPolicyModalOpen(true);
  };

  const openEditPolicyModal = (policy: DiscountPolicyDto) => {
    setEditingPolicy(policy);
    setPolicyName(policy.policyName);
    setDiscountPercentage(policy.discountPercentage || 0);
    setDiscountAmount(policy.discountAmount || 0);
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim()) {
      showToast('error', 'Tên chính sách không được để trống.');
      return;
    }
    if (discountPercentage < 0 || discountPercentage > 100) {
      showToast('error', 'Tỷ lệ miễn giảm phải từ 0% đến 100%.');
      return;
    }

    const payload: DiscountPolicyRequestDto = {
      policyName: policyName.trim(),
      discountPercentage,
      discountAmount,
    };

    try {
      if (editingPolicy) {
        await financeApi.updateDiscountPolicy(editingPolicy.policyId, payload);
        showToast('success', 'Cập nhật chính sách miễn giảm thành công.');
      } else {
        await financeApi.createDiscountPolicy(payload);
        showToast('success', 'Thiết lập chính sách miễn giảm thành công.');
      }
      setIsPolicyModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi lưu chính sách.');
    }
  };

  const handleDeletePolicy = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chính sách "${name}"?`)) return;
    try {
      await financeApi.deleteDiscountPolicy(id);
      showToast('success', 'Đã xóa chính sách miễn giảm.');
      fetchAllData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể xóa chính sách đang được áp dụng.');
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedPolicyId) {
      showToast('error', 'Vui lòng chọn học sinh và chính sách áp dụng.');
      return;
    }

    const payload: AssignStudentDiscountRequestDto = {
      studentId: selectedStudentId,
      policyId: selectedPolicyId,
      appliedDate,
    };

    try {
      await financeApi.assignDiscountToStudent(payload);
      showToast('success', 'Gán chính sách miễn giảm cho học sinh thành công.');
      setIsAssignModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi gán chính sách.');
    }
  };

  const handleRemoveStudentDiscount = async (id: number, studentName: string) => {
    if (!window.confirm(`Hủy áp dụng chính sách miễn giảm cho học sinh "${studentName}"?`)) return;
    try {
      await financeApi.removeStudentDiscount(id);
      showToast('success', 'Đã hủy miễn giảm của học sinh.');
      fetchAllData();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi hủy miễn giảm.');
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white transition-all transform animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chính sách hiệu lực</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{policies.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Học sinh hưởng ưu đãi</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{studentDiscounts.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quy chuẩn miễn giảm</p>
            <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Chuẩn BR-034: Ưu đãi cao nhất
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('policies')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'policies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          1. Danh mục Chính sách Miễn giảm ({policies.length})
        </button>
        <button
          onClick={() => setActiveSubTab('students')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'students'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          2. Học sinh Hưởng Ưu đãi & Miễn giảm ({studentDiscounts.length})
        </button>
      </div>

      {activeSubTab === 'policies' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm kiếm chính sách miễn giảm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              onClick={openCreatePolicyModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Thêm chính sách miễn giảm
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tên chính sách ưu đãi</th>
                  <th className="py-3.5 px-4">Tỷ lệ miễn giảm (%)</th>
                  <th className="py-3.5 px-4">Số tiền giảm cố định</th>
                  <th className="py-3.5 px-4">Phạm vi áp dụng</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      Đang tải danh sách chính sách...
                    </td>
                  </tr>
                ) : policies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      Chưa có chính sách miễn giảm nào được thiết lập.
                    </td>
                  </tr>
                ) : (
                  policies
                    .filter((p) => p.policyName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((p) => (
                      <tr key={p.policyId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{p.policyName}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-600">
                          {p.discountPercentage > 0 ? `${p.discountPercentage}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-emerald-600">
                          {p.discountAmount > 0 ? formatCurrency(p.discountAmount) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          Khấu trừ vào Học phí chính khóa & Bán trú
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditPolicyModal(p)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePolicy(p.policyId, p.policyName)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {activeSubTab === 'students' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm học sinh theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              onClick={() => {
                setSelectedStudentId('');
                setSelectedPolicyId(policies[0]?.policyId || '');
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
            >
              <UserCheck className="w-4 h-4" />
              Gán ưu đãi cho học sinh
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã học sinh</th>
                  <th className="py-3.5 px-4">Họ và tên học sinh</th>
                  <th className="py-3.5 px-4">Lớp học</th>
                  <th className="py-3.5 px-4">Chính sách miễn giảm</th>
                  <th className="py-3.5 px-4">Mức ưu đãi</th>
                  <th className="py-3.5 px-4">Ngày áp dụng</th>
                  <th className="py-3.5 px-4 text-right">Hủy gán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {studentDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Chưa có học sinh nào được gán chính sách miễn giảm.
                    </td>
                  </tr>
                ) : (
                  studentDiscounts
                    .filter((sd) =>
                      (sd.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (sd.studentCode || '').toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((sd) => (
                      <tr key={sd.studentDiscountId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-600">
                          {sd.studentCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{sd.studentName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{sd.className}</td>
                        <td className="py-3.5 px-4 font-medium text-indigo-700">{sd.policyName}</td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          {sd.discountPercentage > 0
                            ? `Giảm ${sd.discountPercentage}%`
                            : formatCurrency(sd.discountAmount)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{sd.appliedDate}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleRemoveStudentDiscount(sd.studentDiscountId, sd.studentName)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Hủy ưu đãi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tạo/Sửa Chính Sách */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingPolicy ? 'Chỉnh sửa chính sách' : 'Thiết lập chính sách miễn giảm mới'}
              </h3>
              <button
                onClick={() => setIsPolicyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tên chính sách miễn giảm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giảm trừ con thứ 2 cùng học tại trường"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tỷ lệ miễn giảm (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  placeholder="Ví dụ: 10 (tương đương giảm 10%)"
                  value={discountPercentage || ''}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Hoặc Số tiền miễn giảm cố định (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Ví dụ: 500000"
                  value={discountAmount || ''}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  {editingPolicy ? 'Lưu thay đổi' : 'Lưu chính sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gán Ưu Đãi Cho Học Sinh */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Gán chính sách miễn giảm cho học sinh</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">-- Chọn học sinh áp dụng --</option>
                  {studentsList.map((st) => (
                    <option key={st.studentId} value={st.studentId}>
                      {st.studentCode} - {st.fullName} ({st.className || 'Chưa phân lớp'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Chính sách miễn giảm áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">-- Chọn chính sách --</option>
                  {policies.map((p) => (
                    <option key={p.policyId} value={p.policyId}>
                      {p.policyName} ({p.discountPercentage > 0 ? `${p.discountPercentage}%` : formatCurrency(p.discountAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Ngày bắt đầu hiệu lực
                </label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Xác nhận gán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountPolicyTab;
