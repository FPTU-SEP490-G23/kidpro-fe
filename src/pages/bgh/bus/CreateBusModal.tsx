import React, { useState } from 'react';
import { Bus, X, Loader2 } from 'lucide-react';
import { BusCreateRequest } from '../../../types/bus.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BusCreateRequest) => Promise<void>;
}

export const CreateBusModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                SĐT tài xế *
              </label>
              <input
                type="tel"
                required
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                placeholder="0912345678"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
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

