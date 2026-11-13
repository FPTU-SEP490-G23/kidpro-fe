import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import {
  Calculator,
  Percent,
  Cpu,
  FileCheck2,
  QrCode,
  Banknote,
  BarChart3,
} from 'lucide-react';
import { FeeCatalogTab } from './tabs/FeeCatalogTab';
import { DiscountPolicyTab } from './tabs/DiscountPolicyTab';
import { TuitionCalculationTab } from './tabs/TuitionCalculationTab';
import { TuitionSummaryTab } from './tabs/TuitionSummaryTab';
import { InvoiceIssuanceTab } from './tabs/InvoiceIssuanceTab';
import { CashReceiptsTab } from './tabs/CashReceiptsTab';
import { RevenueReportTab } from './tabs/RevenueReportTab';
import { useAuth } from '../../contexts/AuthContext';

export type FinanceTabKey =
  | 'fee-catalog'
  | 'discounts'
  | 'tuition-calc'
  | 'tuition-summary'
  | 'invoice-issuance'
  | 'cash-receipts'
  | 'revenue-report'
  | 'fee-configs'
  | 'billing-engine'
  | 'bulk-issuance'
  | 'cash-collection'
  | 'financial-reports'
  | 'overdue-reminders';

interface TabMeta {
  title: string;
  description: string;
  icon: React.ElementType;
}

const TAB_META: Record<string, TabMeta> = {
  'fee-catalog': {
    title: 'Danh mục Khoản thu Biểu phí',
    description: 'Thiết lập danh mục các khoản thu trong năm học (học phí, tiền ăn, bán trú, xe buýt, CLB), quy định đơn giá định mức và chu kỳ thu.',
    icon: Calculator,
  },
  discounts: {
    title: 'Chính sách Miễn giảm & Học bổng',
    description: 'Cấu hình quy chế ưu đãi theo nhóm đối tượng (con thứ 2, gia đình chính sách, học bổng) và gán chính sách cho hồ sơ học sinh.',
    icon: Percent,
  },
  'tuition-calc': {
    title: 'Lập Bảng tính Học phí & Phụ phí Phát sinh',
    description: 'Tự động tính toán dự thu hàng tháng, áp dụng miễn giảm và ghi nhận các khoản phụ thu/đền bù/phạt phát sinh cho từng học sinh.',
    icon: Cpu,
  },
  'tuition-summary': {
    title: 'Bảng Tổng hợp Học phí Toàn trường',
    description: 'Xem bảng tổng hợp thu học phí toàn trường và từng lớp học, theo dõi trạng thái thẩm định & ký duyệt chính thức từ Ban Giám hiệu.',
    icon: FileCheck2,
  },
  'invoice-issuance': {
    title: 'Phát hành Thông báo Học phí & VietQR',
    description: 'Phát hành phiếu báo học phí tới ứng dụng phụ huynh kèm mã VietQR Napas PayOS đã điền sẵn số tiền và nội dung chuyển khoản.',
    icon: QrCode,
  },
  'cash-receipts': {
    title: 'Thu Tiền mặt & In Biên lai Điện tử',
    description: 'Ghi nhận thu tiền mặt trực tiếp tại quầy kế toán, gạch nợ tức thì và xuất biên lai thu tiền/hóa đơn điện tử có mã số thuế chuẩn.',
    icon: Banknote,
  },
  'revenue-report': {
    title: 'Báo cáo Doanh thu & Công nợ Quá hạn',
    description: 'Theo dõi tiến độ hoàn thành thu học phí toàn trường, biểu đồ phân tích và danh sách phụ huynh nợ quá hạn (màn hình chung với BGH).',
    icon: BarChart3,
  },
};

const normalizeTabKey = (tabKey: string | null): string => {
  if (!tabKey) return 'fee-catalog';
  switch (tabKey) {
    case 'fee-configs':
    case 'meal-refund':
    case 'late-pickup':
      return 'fee-catalog';
    case 'billing-engine':
    case 'deposit-deduction':
    case 'disputes-mgmt':
      return 'tuition-calc';
    case 'meal-refund-audit':
      return 'tuition-summary';
    case 'bulk-issuance':
    case 'webhook-reconcile':
      return 'invoice-issuance';
    case 'cash-collection':
      return 'cash-receipts';
    case 'financial-reports':
    case 'overdue-reminders':
      return 'revenue-report';
    default:
      return tabKey in TAB_META ? tabKey : 'fee-catalog';
  }
};

export const FinancePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(normalizeTabKey(rawTab));

  useEffect(() => {
    const normalized = normalizeTabKey(rawTab);
    setActiveTab(normalized);
  }, [location.search]);

  const allowedRoles = ['KE_TOAN', 'ACCOUNTANT', 'BGH', 'BOARD_OF_DIRECTORS', 'SYSTEM_ADMIN', 'ADMIN'];
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  const currentMeta = TAB_META[activeTab] || TAB_META['fee-catalog'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              Phân hệ Kế toán & Quản trị Tài chính
            </span>
            
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1 tracking-tight flex items-center gap-2">
            {React.createElement(currentMeta.icon, { className: 'w-7 h-7 text-indigo-600' })}
            {currentMeta.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            {currentMeta.description}
          </p>
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'fee-catalog' && <FeeCatalogTab />}
        {activeTab === 'discounts' && <DiscountPolicyTab />}
        {activeTab === 'tuition-calc' && <TuitionCalculationTab />}
        {activeTab === 'tuition-summary' && <TuitionSummaryTab />}
        {activeTab === 'invoice-issuance' && <InvoiceIssuanceTab />}
        {activeTab === 'cash-receipts' && <CashReceiptsTab />}
        {activeTab === 'revenue-report' && <RevenueReportTab />}
      </div>
    </div>
  );
};

export default FinancePage;
