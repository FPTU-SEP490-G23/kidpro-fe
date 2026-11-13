import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { financeApi } from '../../../api/financeApi';
import { formatCurrency } from '../../../utils/formatters';
import { ServiceDto, ServiceRequestDto } from '../../../types/finance.types';

export const FeeCatalogTab: React.FC = () => {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [cycleFilter, setCycleFilter] = useState<string>('ALL');

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceDto | null>(null);
  const [serviceName, setServiceName] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [chargeCycle, setChargeCycle] = useState<string>('MONTHLY');
  const [isMandatory, setIsMandatory] = useState<boolean>(true);

  // Modal Sao chép từ năm trước
  const [isCopyModalOpen, setIsCopyModalOpen] = useState<boolean>(false);
  const [sourceYear, setSourceYear] = useState<string>('2025-2026');

  // Toast / Thông báo
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await financeApi.getServices();
      setServices((res as any)?.data || res || []);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể tải danh mục khoản thu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setServiceName('');
    setUnitPrice(0);
    setChargeCycle('MONTHLY');
    setIsMandatory(true);
    setIsModalOpen(true);
  };

  const openEditModal = (svc: ServiceDto) => {
    setEditingService(svc);
    setServiceName(svc.serviceName);
    setUnitPrice(svc.unitPrice);
    setChargeCycle(svc.chargeCycle || 'MONTHLY');
    setIsMandatory(svc.isMandatory ?? true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim()) {
      showToast('error', 'Tên khoản thu không được để trống.');
      return;
    }
    if (unitPrice <= 0) {
      showToast('error', 'Đơn giá khoản thu phải là số dương lớn hơn 0 VNĐ.');
      return;
    }

    const payload: ServiceRequestDto = {
      serviceName: serviceName.trim(),
      unitPrice,
      chargeCycle,
      isMandatory,
    };

    try {
      if (editingService) {
        await financeApi.updateService(editingService.serviceId, payload);
        showToast('success', 'Cập nhật khoản thu thành công.');
      } else {
        await financeApi.createService(payload);
        showToast('success', 'Thiết lập khoản thu mới vào biểu phí năm học thành công.');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Lỗi khi lưu khoản thu.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa khoản thu "${name}"?`)) return;
    try {
      await financeApi.deleteService(id);
      showToast('success', 'Đã xóa khoản thu khỏi danh mục.');
      fetchServices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể xóa khoản thu đã phát sinh dữ liệu.');
    }
  };

  const handleCopyFromYear = async () => {
    try {
      const res = await financeApi.copyServicesFromYear(sourceYear);
      const msg = (res as any)?.data?.message || (res as any)?.message || 'Kế thừa biểu phí năm trước thành công.';
      showToast('success', msg);
      setIsCopyModalOpen(false);
      fetchServices();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Không thể sao chép biểu phí.');
    }
  };

  const filteredServices = services.filter((s) => {
    const matchSearch = (s.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCycle = cycleFilter === 'ALL' || s.chargeCycle === cycleFilter;
    return matchSearch && matchCycle;
  });

  const totalMandatory = services.filter((s) => s.isMandatory).reduce((sum, s) => sum + (s.unitPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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

      {/* Header & KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số khoản thu</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{services.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Định mức bắt buộc hàng tháng</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(totalMandatory)}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khoản dịch vụ tự nguyện</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{services.filter((s) => !s.isMandatory).length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-3 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm kiếm khoản thu học phí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Tất cả chu kỳ thu</option>
            <option value="MONTHLY">Thu theo tháng (Monthly)</option>
            <option value="SEMESTER">Thu theo học kỳ (Semester)</option>
            <option value="YEARLY">Thu theo niên khóa (Yearly)</option>
            <option value="ONE_TIME">Thu một lần (One-time)</option>
          </select>
        </div>

        <div className="flex gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsCopyModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Kế thừa danh mục khoản thu từ năm học trước"
          >
            <Copy className="w-4 h-4" />
            Sao chép từ năm trước
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Thêm khoản thu mới
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên khoản thu</th>
                <th className="py-3.5 px-4">Đơn giá định mức</th>
                <th className="py-3.5 px-4">Chu kỳ thu</th>
                <th className="py-3.5 px-4">Tính chất biểu phí</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh mục khoản thu...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Không tìm thấy khoản thu nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredServices.map((svc) => (
                  <tr key={svc.serviceId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {svc.serviceName}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-emerald-600">
                      {formatCurrency(svc.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                        {svc.chargeCycle === 'MONTHLY' && 'Hàng tháng'}
                        {svc.chargeCycle === 'SEMESTER' && 'Theo học kỳ'}
                        {svc.chargeCycle === 'YEARLY' && 'Cả năm'}
                        {svc.chargeCycle === 'ONE_TIME' && 'Thu một lần'}
                        {!['MONTHLY', 'SEMESTER', 'YEARLY', 'ONE_TIME'].includes(svc.chargeCycle) && svc.chargeCycle}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {svc.isMandatory ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                          Tự nguyện
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(svc)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(svc.serviceId, svc.serviceName)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa khoản thu"
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

      {/* Modal Thêm / Chỉnh sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">
                {editingService ? 'Chỉnh sửa khoản thu' : 'Thêm khoản thu mới vào biểu phí'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tên khoản thu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Học phí chính khóa tiêu chuẩn"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Đơn giá định mức (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  placeholder="Ví dụ: 3200000"
                  value={unitPrice || ''}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Chu kỳ thu học phí
                </label>
                <select
                  value={chargeCycle}
                  onChange={(e) => setChargeCycle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="MONTHLY">Thu định kỳ hàng tháng (Monthly)</option>
                  <option value="SEMESTER">Thu theo học kỳ (Semester)</option>
                  <option value="YEARLY">Thu cả năm học (Yearly)</option>
                  <option value="ONE_TIME">Khoản thu một lần (One-time)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Khoản thu bắt buộc</span>
                    <p className="text-xs text-slate-500">Tự động kết xuất vào bảng tính học phí dự thu hàng tháng của học sinh</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  {editingService ? 'Lưu thay đổi' : 'Thiết lập khoản thu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kế thừa từ năm trước */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Sao chép biểu phí năm trước</h3>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Hệ thống sẽ tải toàn bộ danh mục khoản thu và đơn giá từ năm học nguồn để áp dụng cho niên khóa hiện tại.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Năm học nguồn
                </label>
                <input
                  type="text"
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCopyFromYear}
                  className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
                >
                  Xác nhận sao chép
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeCatalogTab;
