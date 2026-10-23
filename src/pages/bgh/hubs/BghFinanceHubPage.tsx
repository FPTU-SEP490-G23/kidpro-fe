import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CircleDollarSign, Calculator, TrendingUp, FileCheck } from 'lucide-react';
import BghTuitionSummaryPage from '../BghTuitionSummaryPage';
import BghRevenueReportPage from '../BghRevenueReportPage';
import BghFeePolicyApprovalPage from '../BghFeePolicyApprovalPage';

export type FinanceTabKey = 'tuition-summary' | 'revenue-report' | 'fee-policy';

interface TabItem {
  key: FinanceTabKey;
  uc: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: 'tuition-summary',
    uc: 'UC-060',
    label: 'Duyệt Tổng Hợp Học Phí',
    description: 'Kiểm tra & phê duyệt tổng hợp số liệu học phí từng khối lớp trước khi phát hành hóa đơn.',
    icon: Calculator,
  },
  {
    key: 'revenue-report',
    uc: 'UC-066',
    label: 'Báo Cáo Doanh Thu & Công Nợ',
    description: 'Thống kê tổng thu, số dư công nợ quá hạn và tình hình thanh toán của phụ huynh học sinh.',
    icon: TrendingUp,
  },
  {
    key: 'fee-policy',
    uc: 'UC-011',
    label: 'Chính Sách & Biểu Phí',
    description: 'Phê duyệt cấu trúc các khoản thu, chính sách miễn giảm và biểu phí năm học mới.',
    icon: FileCheck,
  },
];

interface Props {
  initialTab?: FinanceTabKey;
}

export const BghFinanceHubPage: React.FC<Props> = ({ initialTab = 'tuition-summary' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: FinanceTabKey = useMemo(() => {
    const param = searchParams.get('tab');
    if (param === 'tuition-summary' || param === 'revenue-report' || param === 'fee-policy') {
      return param;
    }
    return initialTab;
  }, [searchParams, initialTab]);

  const handleTabChange = (key: FinanceTabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-2 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Hub Master Navigation Bar */}
      <div className="px-6 pt-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0">
              <CircleDollarSign className="w-5 h-5 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Hub Tài Chính
                </span>
                <span className="text-[11px] text-slate-500 font-medium">BGH • Ban Giám Hiệu</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Quản Trị Tài Chính & Học Phí
              </h1>
            </div>
          </div>

          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#78C2AD]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.uc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Renderer */}
      <div>
        {activeTab === 'tuition-summary' && <BghTuitionSummaryPage />}
        {activeTab === 'revenue-report' && <BghRevenueReportPage />}
        {activeTab === 'fee-policy' && <BghFeePolicyApprovalPage />}
      </div>
    </div>
  );
};

export default BghFinanceHubPage;
