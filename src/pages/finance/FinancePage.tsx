import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calculator,
  Percent,
  Timer,
  Receipt,
  FileCheck2,
  QrCode,
  Banknote,
  Webhook,
  Bell,
  Coins,
  FileQuestion,
  BarChart3,
  Cpu,
  Sparkles
} from 'lucide-react';
import { DynamicBillingEngineTab } from './tabs/DynamicBillingEngineTab';
import { FeePolicyManagementTab } from './tabs/FeePolicyManagementTab';
import { MealRefundRateTab } from './tabs/MealRefundRateTab';
import { DiscountPolicyTab } from './tabs/DiscountPolicyTab';
import { LatePickupRuleTab } from './tabs/LatePickupRuleTab';
import { MealRefundAuditTab } from './tabs/MealRefundAuditTab';
import { BulkInvoiceIssuanceTab } from './tabs/BulkInvoiceIssuanceTab';
import { CashCollectionTab } from './tabs/CashCollectionTab';
import { WebhookTransactionReconciliationTab } from './tabs/WebhookTransactionReconciliationTab';
import { StudentDepositDeductionTab } from './tabs/StudentDepositDeductionTab';
import { OverdueDebtRemindersTab } from './tabs/OverdueDebtRemindersTab';
import { PaymentDisputesManagementTab } from './tabs/PaymentDisputesManagementTab';
import { FinancialReportsTab } from './tabs/FinancialReportsTab';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export type FinanceTabKey =
  | 'disputes-mgmt'
  | 'financial-reports'
  | 'deposit-deduction'
  | 'overdue-reminders'
  | 'billing-engine'
  | 'meal-refund-audit'
  | 'bulk-issuance'
  | 'cash-collection'
  | 'webhook-reconcile'
  | 'fee-configs'
  | 'meal-refund'
  | 'discounts'
  | 'late-pickup';

interface TabMeta {
  uc: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const TAB_META: Record<FinanceTabKey, TabMeta> = {
  'fee-configs': {
    uc: 'UC-033',
    title: 'Cấu Hình Danh Mục Khoản Thu & Tính Chất Biểu Phí',
    description: 'Thiết lập danh mục khoản thu cố định, biến đổi theo ngày, bắt buộc hoặc tự nguyện cho niên khóa.',
    icon: Calculator,
  },
  discounts: {
    uc: 'UC-033',
    title: 'Chính Sách Miễn Giảm Học Phí & Học Bổng',
    description: 'Quản lý chính sách giảm trừ anh chị em, con thương binh chính sách, học bổng phát triển năng khiếu.',
    icon: Percent,
  },
  'late-pickup': {
    uc: 'UC-033',
    title: 'Biểu Phí Phụ Thu Trông Muộn Ngoài Giờ',
    description: 'Khung phạt đón muộn lũy tiến theo mốc 15/30/60 phút sau giờ tan trường (17:00 / 17:30).',
    icon: Timer,
  },
  'meal-refund': {
    uc: 'UC-034',
    title: 'Cấu Hình Đơn Giá Hoàn Tiền Ăn Nghỉ Phép',
    description: 'Định mức hoàn tiền ăn (bữa chính, bữa phụ) khi phụ huynh nộp đơn xin nghỉ học hợp lệ trước 08:30 sáng.',
    icon: Coins,
  },
  'billing-engine': {
    uc: 'UC-035',
    title: 'Động Cơ Quyết Toán Học Phí Động Toàn Trường',
    description: 'Chạy lệnh tổng hợp tự động: Biểu phí gốc (-) Hoàn tiền ăn nghỉ phép (-) Miễn giảm (+) Phụ thu ngoài giờ.',
    icon: Cpu,
  },
  'meal-refund-audit': {
    uc: 'UC-036',
    title: 'Kiểm Toán & Tự Động Tính Tiền Ăn Hoàn Trả',
    description: 'Đối soát chéo dữ liệu điểm danh thực tế, báo vắng hợp lệ và số suất ăn đóng băng lúc 08:30 từ bộ phận Bếp.',
    icon: FileCheck2,
  },
  'bulk-issuance': {
    uc: 'UC-037',
    title: 'Duyệt & Phát Hành Bảng Kê Học Phí Hàng Loạt (VietQR)',
    description: 'Tạo mã VietQR động PayOS kèm thông báo học phí gửi tức thì tới ứng dụng phụ huynh.',
    icon: QrCode,
  },
  'cash-collection': {
    uc: 'UC-038',
    title: 'Gạch Nợ Thủ Công & Quầy Thu Tiền Mặt / POS',
    description: 'Thu tiền trực tiếp tại quầy, xuất biên lai điện tử và ghi nhận gạch nợ tức thời vào hệ thống.',
    icon: Banknote,
  },
  'webhook-reconcile': {
    uc: 'UC-039',
    title: 'Đối Soát Webhook VietQR PayOS Gạch Nợ Tự Động',
    description: 'Giám sát luồng Webhook IPN thời gian thực, tự động gạch nợ ngay khi phụ huynh quét mã thanh toán thành công.',
    icon: Webhook,
  },
  'deposit-deduction': {
    uc: 'UC-056',
    title: 'Tự Động Khấu Trừ Tiền Cọc Nhập Học',
    description: 'Khấu trừ tiền cọc giữ chỗ vào bảng kê học phí kỳ đầu tiên cho các bé nhập học chính thức.',
    icon: Coins,
  },
  'overdue-reminders': {
    uc: 'UC-057',
    title: 'Giám Sát Công Nợ Quá Hạn & Nhắc Nợ Tự Động',
    description: 'Gửi thông báo nhắc nợ tự động đa kênh (Push Notification, SMS) cho các hóa đơn quá hạn nộp học phí.',
    icon: Bell,
  },
  'disputes-mgmt': {
    uc: 'UC-059',
    title: 'Tiếp Nhận & Xử Lý Khiếu Nại Sai Lệch Tiền Học',
    description: 'Thẩm định khiếu nại sai lệch tiền ăn, khoản thu của phụ huynh và thực hiện lệnh điều chỉnh giảm trừ số dư.',
    icon: FileQuestion,
  },
  'financial-reports': {
    uc: 'UC-060',
    title: 'Bảng Tổng Hợp Thu Chi & Giám Sát Tuổi Nợ (VAS)',
    description: 'Phân tích cơ cấu nguồn thu, dòng tiền thực nhận, tuổi nợ 30/60/90 ngày và xuất báo cáo kiểm toán Excel/PDF.',
    icon: BarChart3,
  },
};

export const FinancePage: React.FC = () => {
  const { role } = useAuth();
  const location = useLocation();

  // If user is BGH, redirect directly to BGH's dedicated Fee Policy Approval page (UC-011)
  if (role === 'BGH') {
    return <Navigate to="/bgh/fee-policy-approval" replace />;
  }

  const resolveTab = (param: string | null): FinanceTabKey => {
    if (param && param in TAB_META) {
      return param as FinanceTabKey;
    }
    if (location.pathname === '/finance/configs') return 'fee-configs';
    if (location.pathname === '/finance/billing-engine') return 'billing-engine';
    if (location.pathname === '/finance/payments') return 'cash-collection';
    if (location.pathname === '/finance/reports') return 'financial-reports';
    return 'fee-configs';
  };

  const [activeTab, setActiveTab] = useState<FinanceTabKey>(() => {
    const searchParams = new URLSearchParams(location.search);
    return resolveTab(searchParams.get('tab'));
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setActiveTab(resolveTab(searchParams.get('tab')));
  }, [location.pathname, location.search]);

  const currentMeta = TAB_META[activeTab] || TAB_META['fee-configs'];
  const MetaIcon = currentMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ TÀI CHÍNH (ĐỘNG THEO USE CASE ĐANG CHỌN, HOÀN TOÀN KHÔNG CÓ THANH SCROLL NGANG) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phòng Kế Toán • {currentMeta.uc}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
              Quy Chuẩn VAS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-[#78C2AD] shrink-0">
              <MetaIcon className="h-5 w-5" />
            </div>
            <span>{currentMeta.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl">
            {currentMeta.description}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-emerald-200/90 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#E5A93C]" />
            <span>Kỳ Quyết Toán: 10/2026</span>
          </span>
        </div>
      </div>

      {/* NỘI DUNG TỪNG PHÂN HỆ (RENDER TRỰC TIẾP, KHÔNG CÒN THANH SCROLL NGANG LÀM RỐI MẮT) */}
      <div className="bg-transparent">
        {activeTab === 'disputes-mgmt' && <PaymentDisputesManagementTab />}
        {activeTab === 'financial-reports' && <FinancialReportsTab />}
        {activeTab === 'deposit-deduction' && <StudentDepositDeductionTab />}
        {activeTab === 'overdue-reminders' && <OverdueDebtRemindersTab />}
        {activeTab === 'webhook-reconcile' && <WebhookTransactionReconciliationTab />}
        {activeTab === 'meal-refund-audit' && <MealRefundAuditTab />}
        {activeTab === 'bulk-issuance' && <BulkInvoiceIssuanceTab />}
        {activeTab === 'cash-collection' && <CashCollectionTab />}
        {activeTab === 'billing-engine' && <DynamicBillingEngineTab />}
        {activeTab === 'fee-configs' && <FeePolicyManagementTab />}
        {activeTab === 'meal-refund' && <MealRefundRateTab />}
        {activeTab === 'discounts' && <DiscountPolicyTab />}
        {activeTab === 'late-pickup' && <LatePickupRuleTab />}
      </div>
    </div>
  );
};

export default FinancePage;
