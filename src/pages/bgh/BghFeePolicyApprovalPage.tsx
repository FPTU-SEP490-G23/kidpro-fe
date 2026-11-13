import React, { useState } from 'react';
import {
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { FeePolicyManagementTab } from '../finance/tabs/FeePolicyManagementTab';

export const BghFeePolicyApprovalPage: React.FC = () => {
  const [approvalStatus, setApprovalStatus] = useState<'PENDING' | 'APPROVED'>('APPROVED');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleApprove = () => {
    setApprovalStatus('APPROVED');
    setToastMessage('Hiệu trưởng đã phê duyệt ban hành biểu phí học phí niên khóa mới thành công.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ DÀNH RIÊNG CHO BGH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-[#1E4D40] text-white p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ban Giám Hiệu • Phân Hệ Quản Trị &amp; Quyết Định</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Receipt className="h-8 w-8 text-[#78C2AD]" />
            <span>Phê Duyệt Chính Sách Biểu Phí Học Phí</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
            Thẩm định cấu trúc danh mục khoản thu, định mức hoàn tiền ăn vắng phép, khung phạt đón muộn và chính sách miễn giảm trước khi ban hành toàn trường.
          </p>
        </div>

        {/* NÚT HÀNH ĐỘNG PHÊ DUYỆT CỦA HIỆU TRƯỞNG */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleApprove}
            className="px-5 py-3 bg-[#E5A93C] hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>{approvalStatus === 'APPROVED' ? 'Đã Ký Phê Duyệt Biểu Phí' : 'Ký Phê Duyệt Ban Hành'}</span>
          </button>
        </div>
      </div>

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-[#78C2AD] rounded-2xl flex items-center gap-3 text-[#1E4D40] text-sm font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* THÔNG TIN TRẠNG THÁI PHÁP LÝ & DUYỆT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Trạng Thái Thẩm Định</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#1E4D40]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#275A4E]" />
              <span>Đã Thẩm Định Pháp Lý &amp; BGD</span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Niên Khóa Áp Dụng</span>
          <span className="text-base font-bold text-slate-800 mt-1 block">Năm học 2026 - 2027</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cán Bộ Lập Biểu Phí</span>
          <span className="text-base font-bold text-slate-800 mt-1 block">Phòng Kế Toán &amp; Tài Chính</span>
        </div>
      </div>

      {/* NỘI DUNG BIỂU PHÍ (FeePolicyManagementTab ĐÃ LOẠI BỎ TOÀN BỘ CÁC TAB KHÔNG LIÊN QUAN) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <FeePolicyManagementTab />
      </div>
    </div>
  );
};

export default BghFeePolicyApprovalPage;
