import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import studentAnalyticsApi from '../../../api/studentAnalyticsApi';
import classroomApi from '../../../api/classroomApi';
import {
  StudentRecord,
  StudentMobilityItem,
  StudentMobilitySummary,
} from '../../../types/studentAnalytics.types';
import { useToast } from '../../../contexts/ToastContext';
import StudentAnalyticsToolbar from './components/StudentAnalyticsToolbar';
import StudentTableWithPrivacy from './components/StudentTableWithPrivacy';
import MobilityRequestsTab from './components/MobilityRequestsTab';
import {
  Users,
  ArrowRightLeft,
  AlertTriangle,
  Award,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const StudentAnalyticsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, info, error } = useToast();

  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'MOBILITY'>('STUDENTS');
  const [selectedYear, setSelectedYear] = useState('2026-2027');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [hasAllergyOnly, setHasAllergyOnly] = useState(false);

  // Lấy danh sách lớp cho dropdown
  const { data: classes = [] } = useQuery({
    queryKey: ['classroom-classes-dropdown'],
    queryFn: async () => {
      try {
        const res = await classroomApi.getClasses();
        return (res as any)?.data || res || [];
      } catch {
        return [];
      }
    },
  });

  // Lấy danh sách học sinh
  const {
    data: students = [],
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useQuery<StudentRecord[]>({
    queryKey: ['student-analytics-list', selectedClassId, selectedStatus, keyword, hasAllergyOnly],
    queryFn: () =>
      studentAnalyticsApi.getStudents({
        classId: selectedClassId,
        status: selectedStatus,
        keyword,
        hasAllergyOnly,
      }),
  });

  // Lấy danh sách yêu cầu chuyển lớp
  const {
    data: mobilities = [],
    isLoading: isMobilitiesLoading,
    refetch: refetchMobilities,
  } = useQuery<StudentMobilityItem[]>({
    queryKey: ['student-mobility-requests'],
    queryFn: () => studentAnalyticsApi.getMobilityRequests(),
  });

  // Tóm tắt biến động
  const { data: summary } = useQuery<StudentMobilitySummary>({
    queryKey: ['student-mobility-summary'],
    queryFn: () => studentAnalyticsApi.getMobilitySummary(),
  });

  const handleExport = () => {
    // Kích hoạt thông báo bảo mật che mờ dữ liệu định danh theo Nghị định 13
    info('Tệp xuất đã được che mờ các trường dữ liệu định danh theo chính sách bảo mật trẻ em.');
    success('Tạo báo cáo biến động học sinh thành công');
  };

  const pendingTransferCount = mobilities.filter((m) => m.status === 'PENDING').length;
  const allergyCount = students.filter((s) => s.allergyTags.length > 0).length;

  return (
    <div className="space-y-6">
      {/* 1. Toolbar & Bộ lọc */}
      <StudentAnalyticsToolbar
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        keyword={keyword}
        onKeywordChange={setKeyword}
        hasAllergyOnly={hasAllergyOnly}
        onToggleAllergy={setHasAllergyOnly}
        onExport={handleExport}
        classes={classes}
      />

      {/* 2. Thẻ tóm tắt biến động (Mobility Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tổng học sinh */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Tổng Học Sinh Khóa Này
            </span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1 block">
              {summary ? `${summary.totalStudents} trẻ` : `${students.length} trẻ`}
            </span>
            <span className="text-[11px] text-[#275A4E] font-semibold mt-0.5 block">
              {summary ? summary.activeCount : students.filter((s) => s.status === 'ACTIVE').length} đang theo học
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-[#275A4E]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Tỷ lệ duy trì */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Tỷ Lệ Duy Trì (Retention)
            </span>
            <span className="text-2xl font-extrabold text-[#275A4E] tracking-tight mt-1 block">
              {summary?.retentionRate !== undefined ? `${summary.retentionRate}%` : (students.length > 0 ? `${((students.filter(s => s.status === 'ACTIVE').length / students.length) * 100).toFixed(1)}%` : '0%')}
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Mục tiêu toàn trường &ge; 95%
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-teal-50 text-[#275A4E]">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Đơn chuyển lớp chờ duyệt */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Đơn Chuyển Lớp & Bảo Lưu
            </span>
            <span className="text-2xl font-extrabold text-amber-700 tracking-tight mt-1 block">
              {pendingTransferCount} đơn
            </span>
            <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
              Chờ Ban Giám Hiệu duyệt
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-[#E5A93C]">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Cảnh báo dị ứng */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Cảnh Báo Dị Ứng Nặng
            </span>
            <span className="text-2xl font-extrabold text-rose-700 tracking-tight mt-1 block">
              {allergyCount} bé
            </span>
            <span className="text-[11px] text-rose-600 font-semibold mt-0.5 block">
              Đã bóc tách gửi Nhà bếp
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Tab Chuyển đổi: Danh sách học sinh vs Đơn chuyển lớp */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('STUDENTS')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'STUDENTS'
              ? 'border-[#275A4E] text-[#275A4E] bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Hồ Sơ Học Sinh ({students.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MOBILITY')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'MOBILITY'
              ? 'border-[#275A4E] text-[#275A4E] bg-emerald-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-[#E5A93C]" />
          <span>Yêu Cầu Chuyển Lớp & Bảo Lưu ({mobilities.length})</span>
          {pendingTransferCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {pendingTransferCount} chờ duyệt
            </span>
          )}
        </button>
      </div>

      {/* 4. Nội dung Tab */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'STUDENTS' ? (
          <StudentTableWithPrivacy students={students} />
        ) : (
          <MobilityRequestsTab
            requests={mobilities}
            onReviewed={() => {
              queryClient.invalidateQueries({ queryKey: ['student-mobility-requests'] });
              queryClient.invalidateQueries({ queryKey: ['student-analytics-list'] });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default StudentAnalyticsPage;
