import React, { useState, useEffect } from 'react';
import { Bus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BusCreateRequest, DriverAccountCheckResponse, BusItem } from '../../../types/bus.types';
import { busManagementApi } from '../../../api/busManagementApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BusCreateRequest) => Promise<void>;
  existingBuses?: BusItem[];
}

export const CreateBusModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, existingBuses = [] }) => {
  const [formData, setFormData] = useState<BusCreateRequest>({
    busNumber: '',
    driverName: '',
    driverPhone: '',
    capacity: 29,
    startLocation: 'Trường Mầm Non KIDPRO',
    endLocation: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Trạng thái kiểm tra tài khoản tài xế
  const [checkingAccount, setCheckingAccount] = useState(false);
  const [accountCheckResult, setAccountCheckResult] = useState<DriverAccountCheckResponse | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAccountCheckResult(null);
      setErrorMsg('');
      return;
    }
  }, [isOpen]);

  // Debounced check khi số điện thoại thay đổi
  useEffect(() => {
    const rawPhone = formData.driverPhone.trim();
    if (!rawPhone || rawPhone.length < 9) {
      setAccountCheckResult(null);
      return;
    }

    const normalize = (p: string) => p.replace(/[^0-9]/g, '').replace(/^84/, '0');
    if (existingBuses && existingBuses.length > 0) {
      const duplicateBus = existingBuses.find(
        (b) => normalize(b.driverPhone || '') === normalize(rawPhone)
      );
      if (duplicateBus) {
        setAccountCheckResult({
          valid: false,
          message: `Số điện thoại này đã được sử dụng cho tuyến xe buýt khác (Biển số: ${duplicateBus.busNumber}) trong cơ sở dữ liệu.`,
        });
        return;
      }
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingAccount(true);
        const res = await busManagementApi.checkDriverAccount(rawPhone);
        setAccountCheckResult(res);
        if (res.valid && res.fullName && !formData.driverName) {
          setFormData((prev) => ({ ...prev, driverName: res.fullName || '' }));
        }
      } catch (err: any) {
        setAccountCheckResult({
          valid: false,
          message: err?.response?.data?.message || 'Không tìm thấy tài khoản với số điện thoại này.',
        });
      } finally {
        setCheckingAccount(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.driverPhone, existingBuses]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.busNumber.trim()) {
      setErrorMsg('Vui lòng nhập biển số xe buýt.');
      return;
    }
    if (!formData.driverName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên tài xế.');
      return;
    }
    if (!formData.driverPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại tài xế.');
      return;
    }
    const cleanPhone = formData.driverPhone.trim();
    const normalize = (p: string) => p.replace(/[^0-9]/g, '').replace(/^84/, '0');
    if (existingBuses && existingBuses.length > 0) {
      const duplicatePhone = existingBuses.find(
        (b) => normalize(b.driverPhone || '') === normalize(cleanPhone)
      );
      if (duplicatePhone) {
        setErrorMsg(`Số điện thoại '${cleanPhone}' đã được gán cho tuyến xe buýt (Biển số: ${duplicatePhone.busNumber}) trong cơ sở dữ liệu. Mỗi tài xế chỉ phụ trách một tuyến.`);
        return;
      }
      const duplicatePlate = existingBuses.find(
        (b) => b.busNumber.toUpperCase().trim() === formData.busNumber.toUpperCase().trim()
      );
      if (duplicatePlate) {
        setErrorMsg(`Biển số xe '${formData.busNumber.trim()}' đã tồn tại trong hệ thống.`);
        return;
      }
    }
    if (accountCheckResult && !accountCheckResult.valid) {
      setErrorMsg(accountCheckResult.message || 'Số điện thoại tài xế phải khớp với tài khoản người dùng trong hệ thống.');
      return;
    }
    if (!formData.startLocation.trim()) {
      setErrorMsg('Vui lòng nhập điểm khởi hành.');
      return;
    }
    if (!formData.endLocation.trim()) {
      setErrorMsg('Vui lòng nhập điểm kết thúc tuyến.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tạo xe buýt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#275A4E] flex items-center justify-center shrink-0">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Thêm Tuyến Xe Buýt Mới</h3>
            <p className="text-xs text-slate-500">Khai báo thông tin phương tiện, tài xế và lộ trình</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Biển số xe *
              </label>
              <input
                type="text"
                required
                value={formData.busNumber}
                onChange={(e) => setFormData({ ...formData, busNumber: e.target.value.toUpperCase() })}
                placeholder="29B-123.45"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Sức chứa (Chỗ ngồi) *
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 29 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Họ tên tài xế *
              </label>
              <input
                type="text"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="Nguyễn Văn Lái"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  SĐT tài xế (Kiểm tra Account) *
                </label>
                {checkingAccount && (
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin text-[#275A4E]" />
                    Đang tra cứu...
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                placeholder="0908111222"
                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-medium transition focus:outline-none ${
                  accountCheckResult && !accountCheckResult.valid
                    ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:border-rose-500'
                    : accountCheckResult && accountCheckResult.valid
                    ? 'border-emerald-400 bg-emerald-50/50 text-emerald-900 focus:border-emerald-500'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-[#275A4E] focus:bg-white'
                }`}
              />
              {accountCheckResult && accountCheckResult.valid && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Khớp tài khoản: <strong>{accountCheckResult.fullName}</strong> (@{accountCheckResult.username})
                  </span>
                </div>
              )}
              {accountCheckResult && !accountCheckResult.valid && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                  <span>{accountCheckResult.message || 'Không tìm thấy tài khoản với SĐT này.'}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Điểm khởi hành *
            </label>
            <input
              type="text"
              required
              value={formData.startLocation}
              onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
              placeholder="Trường Mầm Non KIDPRO"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Điểm kết thúc tuyến *
            </label>
            <input
              type="text"
              required
              value={formData.endLocation}
              onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
              placeholder="KĐT Ecopark Văn Giang, Hưng Yên"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
            />
            <label htmlFor="isActiveCheck" className="text-xs font-medium text-slate-700">
              Kích hoạt tuyến xe này ngay lập tức
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] px-5 py-2 text-sm font-bold text-white shadow-md shadow-emerald-900/10 hover:bg-[#1E4D40] transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu Tuyến Xe</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

