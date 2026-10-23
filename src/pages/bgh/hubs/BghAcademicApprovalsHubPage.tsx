import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpenCheck, School, UserCheck, CalendarClock, FileSpreadsheet, Sparkles } from 'lucide-react';
import BghClassApprovalsPage from '../BghClassApprovalsPage';
import BghTeachingAssignmentsPage from '../BghTeachingAssignmentsPage';
import BghTimetableApprovalsPage from '../BghTimetableApprovalsPage';
import BghLessonPlanApprovalsPage from '../BghLessonPlanApprovalsPage';
import BghExtracurricularClassesPage from '../BghExtracurricularClassesPage';

export type AcademicApprovalTabKey = 'classes' | 'assignments' | 'timetable' | 'lesson-plans' | 'extracurricular';

interface TabItem {
  key: AcademicApprovalTabKey;
  uc: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  {
    key: 'classes',
    uc: 'UC-013',
    label: 'Duyệt Mở Lớp Học',
    description: 'Phê duyệt tờ trình đề xuất mở nhóm lớp học mầm non mới cho năm học hiện hành.',
    icon: School,
  },
  {
    key: 'assignments',
    uc: 'UC-015',
    label: 'Phân Công Giảng Dạy',
    description: 'Xét duyệt danh sách điều động và phân công giáo viên chủ nhiệm, bảo mẫu từng lớp.',
    icon: UserCheck,
  },
  {
    key: 'timetable',
    uc: 'UC-020',
    label: 'Thời Khóa Biểu Tuần',
    description: 'Phê duyệt & ban hành thời khóa biểu sinh hoạt, học tập và hoạt động ngoại khóa.',
    icon: CalendarClock,
  },
  {
    key: 'lesson-plans',
    uc: 'UC-077',
    label: 'Phê Duyệt Giáo Án',
    description: 'Kiểm duyệt kế hoạch bài giảng và giáo án chuyên đề tuần của giáo viên các khối lớp.',
    icon: FileSpreadsheet,
  },
  {
    key: 'extracurricular',
    uc: 'UC-067',
    label: 'Lớp CLB Ngoại Khóa',
    description: 'Phê duyệt mở các lớp năng khiếu, kỹ năng sống và câu lạc bộ ngoại khóa sau giờ học.',
    icon: Sparkles,
  },
];

interface Props {
  initialTab?: AcademicApprovalTabKey;
}

export const BghAcademicApprovalsHubPage: React.FC<Props> = ({ initialTab = 'classes' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: AcademicApprovalTabKey = useMemo(() => {
    const param = searchParams.get('tab');
    if (
      param === 'classes' ||
      param === 'assignments' ||
      param === 'timetable' ||
      param === 'lesson-plans' ||
      param === 'extracurricular'
    ) {
      return param;
    }
    return initialTab;
  }, [searchParams, initialTab]);

  const handleTabChange = (key: AcademicApprovalTabKey) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  return (
    <div className="space-y-2 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Hub Master Navigation Bar */}
      <div className="px-6 pt-4">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-5 h-5 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Hub Học Vụ
                </span>
                <span className="text-[11px] text-slate-500 font-medium">BGH • Ban Giám Hiệu</span>
              </div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Phê Duyệt Học Vụ & Giảng Dạy
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
        {activeTab === 'classes' && <BghClassApprovalsPage />}
        {activeTab === 'assignments' && <BghTeachingAssignmentsPage />}
        {activeTab === 'timetable' && <BghTimetableApprovalsPage />}
        {activeTab === 'lesson-plans' && <BghLessonPlanApprovalsPage />}
        {activeTab === 'extracurricular' && <BghExtracurricularClassesPage />}
      </div>
    </div>
  );
};

export default BghAcademicApprovalsHubPage;
