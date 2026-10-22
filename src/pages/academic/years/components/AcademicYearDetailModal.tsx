import React from 'react';
import { AcademicYear } from '../../../../types/academicYear.types';
import { formatDate } from '../../../../utils/formatters';
import { calculateWeeksBetween } from './AcademicYearModal';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  X,
  Clock,
} from 'lucide-react';

interface AcademicYearDetailModalProps {
  isOpen: boolean;
  year: AcademicYear | null;
  onClose: () => void;
}

export const AcademicYearDetailModal: React.FC<AcademicYearDetailModalProps> = ({
  isOpen,
  year,
  onClose,
}) => {
  if (!isOpen || !year) return null;

  const weeks = calculateWeeksBetween(year.startDate, year.endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#275A4E] uppercase tracking-wider">
                Chi tiết Niên Khóa
              </span>
              <h3 className="text-xl font-extrabold text-slate-800">Năm Học {year.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Ngày Bắt Đầu</span>
              <span className="text-sm font-bold text-slate-800">{formatDate(year.startDate)}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Ngày Kết Thúc</span>
              <span className="text-sm font-bold text-slate-800">{formatDate(year.endDate)}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Thời lượng thực học</span>
                <span className="text-xs text-emerald-700">Khung chuẩn Bộ GD&ĐT (BR-005)</span>
              </div>
            </div>
            <span className="text-base font-extrabold text-emerald-800">{weeks} tuần</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-semibold text-slate-600">Trạng thái vận hành</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                year.status === 'ACTIVE'
                  ? 'bg-[#78C2AD] text-[#1E4D40]'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {year.status}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearDetailModal;
