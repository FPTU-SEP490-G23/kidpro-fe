import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, Phone, Stethoscope, X } from 'lucide-react';

interface AllergyShieldBadgeProps {
  studentName?: string;
  allergyTags?: string[] | string;
  severity?: 'SEVERE_ANAPHYLAXIS' | 'MILD_MODERATE';
  firstAidProtocol?: string;
  parentPhone?: string;
  medicationLocation?: string;
  compact?: boolean;
}

export const AllergyShieldBadge: React.FC<AllergyShieldBadgeProps> = ({
  studentName = 'Học sinh',
  allergyTags,
  severity = 'SEVERE_ANAPHYLAXIS',
  firstAidProtocol = 'Cách ly dị nguyên, theo dõi nhịp thở. Nếu sốc phản vệ dùng bút tiêm Epipen tại tủ y tế lớp và gọi 115.',
  parentPhone = '0912345678',
  medicationLocation = 'Ngăn 1 - Tủ thuốc cấp cứu phòng Y Tế',
  compact = false,
}) => {
  const [showPopover, setShowPopover] = useState(false);

  // Chuẩn hóa tags
  const tagsList: string[] = Array.isArray(allergyTags)
    ? allergyTags
    : typeof allergyTags === 'string' && allergyTags.trim().length > 0
    ? allergyTags.split(',').map((t) => t.trim())
    : ['Dị ứng thực phẩm nặng'];

  if (!allergyTags || tagsList.length === 0) return null;

  const isSevere = severity === 'SEVERE_ANAPHYLAXIS';

  return (
    <div className="relative inline-flex items-center">
      {/* Nút Huy hiệu Khiên Đỏ Nhấp Nháy (Universal UI Shield Badge) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowPopover((prev) => !prev);
        }}
        title="Bấm để xem phác đồ sơ cứu và dị nguyên nguy hiểm của bé"
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold transition shadow-xs cursor-pointer ${
          isSevere
            ? 'bg-rose-600 text-white animate-pulse hover:bg-rose-700 ring-2 ring-rose-400/50'
            : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
        }`}
      >
        <ShieldAlert className="h-3 w-3 shrink-0" />
        {!compact && (
          <span>{isSevere ? 'DỊ ỨNG NGUY HIỂM' : 'DỊ ỨNG'}</span>
        )}
      </button>

      {/* Popover Chi Tiết Cảnh Báo Sơ Cứu Khẩn Cấp */}
      {showPopover && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-0 mb-2 z-50 w-72 sm:w-80 rounded-2xl bg-white p-4 shadow-2xl border-2 border-rose-500 text-xs text-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-rose-100">
            <div className="flex items-center gap-1.5 text-rose-700 font-extrabold">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>CẢNH BÁO DỊ ỨNG: {studentName}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowPopover(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Danh sách dị nguyên */}
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-semibold block">Dị nguyên cần cách ly:</span>
            <div className="flex flex-wrap gap-1">
              {tagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-[10px]"
                >
                  ⚠️ {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Phác đồ sơ cứu & Vị trí thuốc */}
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] space-y-1.5 text-rose-950">
            <div className="flex items-center gap-1 font-bold text-rose-800">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
              <span>Phác đồ sơ cứu & Vị trí thuốc:</span>
            </div>
            <p className="leading-relaxed font-medium">{firstAidProtocol}</p>
            <p className="text-[10px] text-rose-700 font-bold">
              Vị trí: {medicationLocation}
            </p>
          </div>

          {/* Liên hệ phụ huynh khẩn cấp */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">SĐT Phụ huynh:</span>
            <a
              href={`tel:${parentPhone}`}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-xs transition"
            >
              <Phone className="h-3 w-3" />
              <span>Gọi: {parentPhone}</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllergyShieldBadge;
