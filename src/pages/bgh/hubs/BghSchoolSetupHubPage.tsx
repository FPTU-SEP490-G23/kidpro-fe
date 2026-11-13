import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, CalendarDays, Layers, School } from 'lucide-react';
import AcademicYearsPage from '../../academic/years/AcademicYearsPage';
import BghGradeQuotasPage from '../BghGradeQuotasPage';
import BghClassroomsPage from '../BghClassroomsPage';

export type SchoolSetupTabKey = 'years' | 'quotas' | 'classrooms';

interface TabItem {
  key: SchoolSetupTabKey;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: 'years',
    label: 'Kế Hoạch Năm Học & Học Kỳ',
    description: 'Thiết lập khung thời gian năm học mới, chia kỳ học và cấu hình trạng thái tuyển sinh toàn trường.',
    icon: CalendarDays,
  },
  {
    key: 'quotas',
    label: 'Khối Lớp & Định Mức Sĩ Số',
    description: 'Cấu hình định mức sĩ số tối đa theo quy chuẩn Bộ GD&ĐT cho từng khối lớp mầm non.',
    icon: Layers,
  },
  {
    key: 'classrooms',
    label: 'Danh Mục Phòng Học & Chức Năng',
    description: 'Quản lý cơ sở vật chất, hệ thống phòng học tiêu chuẩn và phòng học chức năng chuyên đề.',
    icon: School,
  },
];

interface Props {
  initialTab?: SchoolSetupTabKey;
}

export const BghSchoolSetupHubPage: React.FC<Props> = ({ initialTab = 'years' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: SchoolSetupTabKey = useMemo(() => {
    const param = searchParams.get('tab');
    if (param === 'years' || param === 'quotas' || param === 'classrooms') {
      return param;
    }
    return initialTab;
  }, [searchParams, initialTab]);

  const handleTabChange = (key: SchoolSetupTabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-2 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Hub Master Navigation Bar */}
      <div className="px-6 pt-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Hub Cơ Sở Vật Chất
                </span>
                <span className="text-[11px] text-slate-500 font-medium">BGH • Ban Giám Hiệu</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Thiết Lập Trường & Cơ Sở Vật Chất
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
        {activeTab === 'years' && <AcademicYearsPage />}
        {activeTab === 'quotas' && <BghGradeQuotasPage />}
        {activeTab === 'classrooms' && <BghClassroomsPage />}
      </div>
    </div>
  );
};

export default BghSchoolSetupHubPage;
