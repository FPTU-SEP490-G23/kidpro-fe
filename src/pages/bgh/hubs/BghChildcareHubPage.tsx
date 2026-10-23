import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HeartHandshake, UtensilsCrossed, ClipboardCheck, Award } from 'lucide-react';
import BghWeeklyMenuApprovalsPage from '../BghWeeklyMenuApprovalsPage';
import BghEvaluationApprovalsPage from '../BghEvaluationApprovalsPage';
import BghDevelopmentQualityReportPage from '../BghDevelopmentQualityReportPage';

export type ChildcareTabKey = 'menu' | 'evaluations' | 'quality-report';

interface TabItem {
  key: ChildcareTabKey;
  uc: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: 'menu',
    uc: 'UC-041',
    label: 'Thực Đơn Tuần',
    description: 'Thẩm định khẩu phần dinh dưỡng và phê duyệt thực đơn tuần của bộ phận cấp dưỡng.',
    icon: UtensilsCrossed,
  },
  {
    key: 'evaluations',
    uc: 'UC-072',
    label: 'Đánh Giá Trẻ Định Kỳ',
    description: 'Kiểm duyệt phiếu đánh giá sự phát triển 5 lĩnh vực của trẻ theo chuẩn Bộ GD&ĐT.',
    icon: ClipboardCheck,
  },
  {
    key: 'quality-report',
    uc: 'UC-078',
    label: 'Báo Cáo Chất Lượng Trẻ',
    description: 'Thống kê tổng hợp tình hình phát triển thể chất, ngôn ngữ, nhận thức toàn trường.',
    icon: Award,
  },
];

interface Props {
  initialTab?: ChildcareTabKey;
}

export const BghChildcareHubPage: React.FC<Props> = ({ initialTab = 'menu' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: ChildcareTabKey = useMemo(() => {
    const param = searchParams.get('tab');
    if (param === 'menu' || param === 'evaluations' || param === 'quality-report') {
      return param;
    }
    return initialTab;
  }, [searchParams, initialTab]);

  const handleTabChange = (key: ChildcareTabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-2 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Hub Master Navigation Bar */}
      <div className="px-6 pt-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Hub Bán Trú & Phát Triển
                </span>
                <span className="text-[11px] text-slate-500 font-medium">BGH • Ban Giám Hiệu</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Chăm Sóc Bán Trú & Phát Triển Trẻ
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
        {activeTab === 'menu' && <BghWeeklyMenuApprovalsPage />}
        {activeTab === 'evaluations' && <BghEvaluationApprovalsPage />}
        {activeTab === 'quality-report' && <BghDevelopmentQualityReportPage />}
      </div>
    </div>
  );
};

export default BghChildcareHubPage;
