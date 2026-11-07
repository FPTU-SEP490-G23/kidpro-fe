import React, { useState, useEffect } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { BusStopItem, BusStopCreateRequest } from '../../../types/bus.types';

interface Props {
  isOpen: boolean;
  busNumber: string;
  defaultOrder: number;
  editingStop?: BusStopItem | null;
  onClose: () => void;
  onSubmit: (data: BusStopCreateRequest) => Promise<void>;
}

export const CreateBusStopModal: React.FC<Props> = ({
  isOpen,
  busNumber,
  defaultOrder,
  editingStop,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<BusStopCreateRequest>({
    stopName: '',
    stopAddress: '',
    stopOrder: defaultOrder,
    estimatedTime: '06:45',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingStop) {
      setFormData({
        stopName: editingStop.stopName || '',
        stopAddress: editingStop.stopAddress || '',
        stopOrder: editingStop.stopOrder || 1,
        estimatedTime: editingStop.estimatedTime ? editingStop.estimatedTime.substring(0, 5) : '06:45',
        latitude: editingStop.latitude,
        longitude: editingStop.longitude,
      });
      setErrorMsg('');
    } else {
      setFormData({
        stopName: '',
        stopAddress: '',
        stopOrder: defaultOrder,
        estimatedTime: '06:45',
      });
      setErrorMsg('');
    }
  }, [editingStop, defaultOrder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stopName.trim()) {
      setErrorMsg('Vui lòng nhập tên điểm dừng đón/trả.');
      return;
    }
    if (!formData.stopOrder || formData.stopOrder < 1) {
      setErrorMsg('Thứ tự điểm dừng phải từ 1 trở lên.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu điểm dừng');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingStop ? 'Sửa Điểm Dừng Xe Buýt' : 'Thêm Điểm Dừng Mới'}
            </h3>
            <p className="text-xs text-slate-500">
              Tuyến xe: <span className="font-semibold text-teal-800">{busNumber}</span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Tên điểm dừng *
            </label>
            <input
              type="text"
              required
              value={formData.stopName}
              onChange={(e) => setFormData({ ...formData, stopName: e.target.value })}
              placeholder="VD: Điểm đón 1 - Chung cư Vinhomes"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Địa chỉ chi tiết / Điểm đón cụ thể
            </label>
            <input
              type="text"
              value={formData.stopAddress || ''}
              onChange={(e) => setFormData({ ...formData, stopAddress: e.target.value })}
              placeholder="Sảnh tòa S2.05, Khu Đô Thị Vinhomes Ocean Park"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Thứ tự dừng (Trạm số) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.stopOrder}
                onChange={(e) => setFormData({ ...formData, stopOrder: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Giờ đón dự kiến (HH:mm)
              </label>
              <input
                type="time"
                value={formData.estimatedTime || ''}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>
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
                <span>{editingStop ? 'Cập Nhật Điểm Dừng' : 'Lưu Điểm Dừng'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

