import React, { useState } from 'react';
import {
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { FeePolicyManagementTab } from '../finance/tabs/FeePolicyManagementTab';

export const BghFeePolicyApprovalPage: React.FC = () => {
  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ DÀNH RIÊNG CHO BGH */}
      <div className="bg-gradient-to-r from-emerald-900 to-[#1E4D40] text-white p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ban Giám Hiệu • Phân Hệ Quản Trị &amp; Quyết Định</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Receipt className="h-8 w-8 text-[#78C2AD]" />
            <span>Phê Duyệt Chính Sách Biểu Phí &amp; Miễn Giảm Học Phí</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
            Thẩm định toàn bộ danh mục khoản thu do bộ phận Kế toán trình duyệt: Phê duyệt ban hành, Từ chối kèm ý kiến chỉ đạo, hoặc Thu hồi phê duyệt về Dự thảo.
          </p>
        </div>
      </div>

      {/* NỘI DUNG BIỂU PHÍ (BGH View: Chỉ xem, Phê duyệt tất cả, Từ chối ghi lý do, Thu hồi về dự thảo; Học sinh miễn giảm thao tác bình thường) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <FeePolicyManagementTab isBgh={true} />
      </div>
    </div>
  );
};

export default BghFeePolicyApprovalPage;
