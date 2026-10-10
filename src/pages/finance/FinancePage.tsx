import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calculator,
  Settings,
  UtensilsCrossed,
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
  BarChart3
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

export const FinancePage: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<
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
    | 'late-pickup'
  >(() => {
    if (location.pathname === '/finance/configs') return 'fee-configs';
    if (location.pathname === '/finance/billing-engine') return 'billing-engine';
    if (location.pathname === '/finance/payments') return 'cash-collection';
    if (location.pathname === '/finance/reports' || location.pathname === '/bgh/finance-policies') return 'financial-reports';
    return 'disputes-mgmt';
  });

  useEffect(() => {
    if (location.pathname === '/finance/configs') {
      setActiveTab('fee-configs');
    } else if (location.pathname === '/finance/billing-engine') {
      setActiveTab('billing-engine');
    } else if (location.pathname === '/finance/payments') {
      setActiveTab('cash-collection');
    } else if (location.pathname === '/finance/reports' || location.pathname === '/bgh/finance-policies') {
      setActiveTab('financial-reports');
    }
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      {/* HEADER PHÂN HỆ TÀI CHÍNH & HỌC PHÍ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E4D40] flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <Receipt className="h-6 w-6" />
            </div>
            <span>Tài Chính, Học Phí & Quyết Toán Bán Trú</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Động cơ quyết toán học phí động, kiểm toán hoàn tiền ăn, phát hành VietQR PayOS, đối soát Webhook IPN và thu ngân gạch nợ trực tiếp
          </p>
        </div>
      </div>

      {/* THANH ĐIỀU HƯỚNG TABS (UC-059, UC-060, UC-056, UC-057, UC-039, UC-036, UC-037, UC-038, UC-035, UC-033, UC-034, DISCOUNTS, LATE-PICKUP) */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        {/* Tab UC-059: Xử lý khiếu nại & điều chỉnh học phí */}
        <button
          onClick={() => setActiveTab('disputes-mgmt')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'disputes-mgmt'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileQuestion className="h-4 w-4" />
          <span>UC-059: Xử Lý Khiếu Nại Học Phí</span>
        </button>

        {/* Tab UC-060: Báo cáo tài chính & tuổi nợ VAS */}
        <button
          onClick={() => setActiveTab('financial-reports')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'financial-reports'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>UC-060: Báo Cáo Tài Chính & Tuổi Nợ (VAS)</span>
        </button>

        {/* Tab UC-056: Khấu trừ tiền cọc nhập học */}
        <button
          onClick={() => setActiveTab('deposit-deduction')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'deposit-deduction'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>UC-056: Khấu Trừ Cọc Nhập Học</span>
        </button>

        {/* Tab UC-057: Nhắc nợ quá hạn đa kênh */}
        <button
          onClick={() => setActiveTab('overdue-reminders')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'overdue-reminders'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>UC-057: Nhắc Nợ Quá Hạn Đa Kênh</span>
        </button>

        {/* Tab UC-039: Đối soát Webhook VietQR thời gian thực */}
        <button
          onClick={() => setActiveTab('webhook-reconcile')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'webhook-reconcile'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Webhook className="h-4 w-4" />
          <span>UC-039: Đối Soát Webhook VietQR</span>
        </button>

        {/* Tab UC-036: Kiểm toán hoàn tiền ăn */}
        <button
          onClick={() => setActiveTab('meal-refund-audit')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'meal-refund-audit'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>UC-036: Kiểm Toán Hoàn Tiền Ăn</span>
        </button>

        {/* Tab UC-037: Duyệt & Phát hành VietQR */}
        <button
          onClick={() => setActiveTab('bulk-issuance')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'bulk-issuance'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>UC-037: Phát Hành VietQR Hàng Loạt</span>
        </button>

        {/* Tab UC-038: Gạch nợ tiền mặt & POS */}
        <button
          onClick={() => setActiveTab('cash-collection')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'cash-collection'
              ? 'border-[#E5A93C] text-[#1E4D40]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Banknote className="h-4 w-4" />
          <span>UC-038: Quầy Thu Tiền & Gạch Nợ</span>
        </button>

        {/* Tab UC-035: Quyết toán học phí động */}
        <button
          onClick={() => setActiveTab('billing-engine')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'billing-engine'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>UC-035: Quyết Toán Học Phí Động</span>
        </button>

        {/* Tab UC-033: Cấu hình biểu phí */}
        <button
          onClick={() => setActiveTab('fee-configs')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'fee-configs'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>UC-033: Cấu Hình Biểu Phí</span>
        </button>

        {/* Tab UC-034: Đơn giá hoàn tiền ăn */}
        <button
          onClick={() => setActiveTab('meal-refund')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'meal-refund'
              ? 'border-[#E5A93C] text-[#1E4D40]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>UC-034: Đơn Giá Hoàn Tiền Ăn</span>
        </button>

        {/* Tab: Miễn giảm & Học bổng */}
        <button
          onClick={() => setActiveTab('discounts')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'discounts'
              ? 'border-[#78C2AD] text-[#1E4D40]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent className="h-4 w-4" />
          <span>Giảm Trừ & Học Bổng</span>
        </button>

        {/* Tab: Đón muộn ngoài giờ */}
        <button
          onClick={() => setActiveTab('late-pickup')}
          className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'late-pickup'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Timer className="h-4 w-4" />
          <span>Khung Phạt Đón Muộn</span>
        </button>
      </div>

      {/* NỘI DUNG TỪNG PHÂN HỆ */}
      <div>
        {/* Phân hệ UC-059: Tiếp nhận & xử lý khiếu nại học phí */}
        {activeTab === 'disputes-mgmt' && <PaymentDisputesManagementTab />}

        {/* Phân hệ UC-060: Báo cáo tài chính tổng hợp & tuổi nợ VAS */}
        {activeTab === 'financial-reports' && <FinancialReportsTab />}

        {/* Phân hệ UC-056: Tự động khấu trừ tiền cọc nhập học */}
        {activeTab === 'deposit-deduction' && <StudentDepositDeductionTab />}

        {/* Phân hệ UC-057: Giám sát công nợ quá hạn & nhắc nợ đa kênh */}
        {activeTab === 'overdue-reminders' && <OverdueDebtRemindersTab />}

        {/* Phân hệ UC-039: Đối soát Webhook VietQR gạch nợ tự động */}
        {activeTab === 'webhook-reconcile' && <WebhookTransactionReconciliationTab />}

        {/* Phân hệ UC-036: Kiểm toán & đối soát hoàn tiền ăn */}
        {activeTab === 'meal-refund-audit' && <MealRefundAuditTab />}

        {/* Phân hệ UC-037: Duyệt & phát hành VietQR hàng loạt */}
        {activeTab === 'bulk-issuance' && <BulkInvoiceIssuanceTab />}

        {/* Phân hệ UC-038: Gạch nợ thủ công & quầy thu ngân */}
        {activeTab === 'cash-collection' && <CashCollectionTab />}

        {/* Phân hệ UC-035: Chạy lệnh sinh bảng kê học phí động */}
        {activeTab === 'billing-engine' && <DynamicBillingEngineTab />}

        {/* Phân hệ UC-033: Cấu hình danh mục khoản thu & tính chất */}
        {activeTab === 'fee-configs' && <FeePolicyManagementTab />}

        {/* Phân hệ UC-034: Cấu hình đơn giá hoàn tiền ăn nghỉ phép */}
        {activeTab === 'meal-refund' && <MealRefundRateTab />}

        {/* Phân hệ: Chính sách miễn giảm & học bổng */}
        {activeTab === 'discounts' && <DiscountPolicyTab />}

        {/* Phân hệ: Khung phạt đón muộn ngoài giờ */}
        {activeTab === 'late-pickup' && <LatePickupRuleTab />}
      </div>
    </div>
  );
};

export default FinancePage;
