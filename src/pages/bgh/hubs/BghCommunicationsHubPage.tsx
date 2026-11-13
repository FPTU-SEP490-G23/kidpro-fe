import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Megaphone, ShieldAlert } from 'lucide-react';
import BghAnnouncementsPage from '../BghAnnouncementsPage';
import BghEmergencyBroadcastPage from '../BghEmergencyBroadcastPage';

export type CommunicationsTabKey = 'announcements' | 'emergency';

interface TabItem {
  key: CommunicationsTabKey;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: 'announcements',
    label: 'Thông Báo Toàn Trường',
    description: 'Soạn thảo & ban hành các bản tin, công văn hành chính đến toàn thể giáo viên và phụ huynh.',
    icon: Megaphone,
  },
  {
    key: 'emergency',
    label: 'Tin Nhắn Khẩn Cấp',
    description: 'Phát sóng cảnh báo tức thời đa kênh (App Push, SMS) trong các tình huống khẩn cấp hoặc thiên tai.',
    icon: ShieldAlert,
  },
];

interface Props {
  initialTab?: CommunicationsTabKey;
}

export const BghCommunicationsHubPage: React.FC<Props> = ({ initialTab = 'announcements' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: CommunicationsTabKey = useMemo(() => {
    const param = searchParams.get('tab');
    if (param === 'announcements' || param === 'emergency') {
      return param;
    }
    return initialTab;
  }, [searchParams, initialTab]);

  const handleTabChange = (key: CommunicationsTabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-2 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Hub Master Navigation Bar */}
      <div className="px-6 pt-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Hub Truyền Thông
                </span>
                <span className="text-[11px] text-slate-500 font-medium">BGH • Ban Giám Hiệu</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Truyền Thông & Cảnh Báo Khẩn Cấp
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
                  
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content Renderer */}
      <div>
        {activeTab === 'announcements' && <BghAnnouncementsPage />}
        {activeTab === 'emergency' && <BghEmergencyBroadcastPage />}
      </div>
    </div>
  );
};

export default BghCommunicationsHubPage;
