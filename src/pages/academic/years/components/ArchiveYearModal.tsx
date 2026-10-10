import React from 'react';
import { AcademicYear } from '../../../../types/academicYear.types';
import { Archive, AlertOctagon, X, Check } from 'lucide-react';

interface ArchiveYearModalProps {
  isOpen: boolean;
  year: AcademicYear | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isArchiving: boolean;
}

export const ArchiveYearModal: React.FC<ArchiveYearModalProps> = ({
  isOpen,
  year,
  onClose,
  onConfirm,
  isArchiving,
}) => {
  if (!isOpen || !year) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 shrink-0">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Đóng & Lưu Trữ Niên Khóa {year.name}?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Xác nhận chuyển niên khóa sang trạng thái lưu trữ hồ sơ</p>
          </div>
        </div>

        {/* Khung cảnh báo */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0" />
            <span>LƯU Ý QUAN TRỌNG:</span>
          </div>
          <p className="leading-relaxed">
            Đóng niên khóa sẽ chuyển toàn bộ sổ điểm, sổ điểm danh và bảng kê học phí sang trạng thái <strong>Chỉ Đọc (Read-only)</strong> và không thể hoàn tác.
          </p>
          <p className="text-[11px] text-amber-800">
            Vui lòng chắc chắn tất cả giáo viên và kế toán đã hoàn tất kiểm đếm công nợ và sổ đánh giá sự phát triển trẻ cuối năm.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isArchiving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={() => onConfirm(year.id)}
            disabled={isArchiving}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-60"
          >
            <Check className="w-4 h-4" />
            <span>{isArchiving ? 'Đang Lưu Trữ...' : 'Xác Nhận Đóng & Lưu Trữ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveYearModal;
