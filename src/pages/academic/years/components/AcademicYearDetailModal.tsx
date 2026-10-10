import React from 'react';
import { AcademicYear } from '../../../../types/academicYear.types';
import { formatDate } from '../../../../utils/formatters';
import { calculateWeeksBetween } from './AcademicYearModal';
import {
  GraduationCap,
  Calendar,
  Layers,
  Users,
  CheckCircle2,
  X,
  Clock,
  Building,
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
  const enrolled = year.enrolledCount || 0;
  const fillRate = year.totalQuota > 0 ? Math.round((enrolled / year.totalQuota) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#275A4E]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">Niên Khóa {year.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    year.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                      : year.status === 'PLANNING'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {year.status === 'ACTIVE'
                    ? 'ĐANG ÁP DỤNG'
                    : year.status === 'PLANNING'
                    ? 'CHUẨN BỊ'
                    : 'ĐÃ LƯU TRỮ'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Chi tiết kế hoạch đào tạo & tuyển sinh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 text-xs text-slate-700">
          {/* Mốc thời gian */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-[#275A4E]">
              <Calendar className="w-4 h-4" />
              Khung Thời Gian ({weeks} Tuần Thực Học)
            </h4>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block">Thời gian toàn năm:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {formatDate(year.startDate)} → {formatDate(year.endDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tiêu chuẩn thực học:</span>
                <span className="font-bold text-[#275A4E] text-sm">
                  {weeks} tuần (≥ 35 tuần Bộ GD&ĐT)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-slate-500 font-semibold block">Học kỳ I:</span>
                <span className="text-slate-700">
                  {formatDate(year.term1Start)} → {formatDate(year.term1End)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">Học kỳ II:</span>
                <span className="text-slate-700">
                  {formatDate(year.term2Start)} → {formatDate(year.term2End)}
                </span>
              </div>
            </div>
          </div>

          {/* Phân bổ chỉ tiêu */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider text-[#275A4E]">
              <Layers className="w-4 h-4" />
              Cơ Cấu Chỉ Tiêu & Tuyển Sinh
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Nhà trẻ (18-36th)</span>
                <span className="text-sm font-bold text-slate-800">{year.nurseryQuota} trẻ</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Khối Mầm (3-4t)</span>
                <span className="text-sm font-bold text-slate-800">{year.mamQuota} trẻ</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Khối Chồi (4-5t)</span>
                <span className="text-sm font-bold text-slate-800">{year.choiQuota} trẻ</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Khối Lá (5-6t)</span>
                <span className="text-sm font-bold text-slate-800">{year.laQuota} trẻ</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600">Đã tuyển / Tổng chỉ tiêu:</span>
              <span className="font-bold text-slate-800">
                {enrolled} / {year.totalQuota} trẻ ({fillRate}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#275A4E] h-2 rounded-full"
                style={{ width: `${Math.min(100, fillRate)}%` }}
              ></div>
            </div>
          </div>

          {/* Ghi chú */}
          {year.notes && (
            <div className="p-3 rounded-xl bg-white border border-slate-200">
              <span className="text-slate-400 block mb-0.5 text-[10px] uppercase font-bold">
                Ghi chú kế hoạch:
              </span>
              <p className="text-slate-700 italic">{year.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearDetailModal;
