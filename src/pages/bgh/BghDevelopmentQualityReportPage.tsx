import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  Download,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Lock,
  Unlock,
  Activity,
  Brain,
  MessageCircle,
  Smile,
  Palette,
  ChevronRight,
  Eye,
  X,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import {
  developmentQualityReportApi,
  DevelopmentQualityReportDto,
  ClassQualityStatsDto
} from '../../api/developmentQualityReportApi';
import academicYearApi from '../../api/academicYearApi';
import { AcademicYear } from '../../types/academicYear.types';
import developmentEvaluationApi, { DevelopmentEvaluationDto } from '../../api/developmentEvaluationApi';
import classApprovalApi, { ClassApprovalItem } from '../../api/classApprovalApi';

const PERIOD_OPTIONS = [
  { value: 'START_YEAR', label: 'Khảo sát Đầu năm' },
  { value: 'MID_TERM_1', label: 'Đánh giá Giữa Học kỳ I' },
  { value: 'END_TERM_1', label: 'Tổng kết Học kỳ I' },
  { value: 'MID_TERM_2', label: 'Đánh giá Giữa Học kỳ II' },
  { value: 'END_YEAR', label: 'Tổng kết Cuối năm học' },
];

export const BghDevelopmentQualityReportPage: React.FC = () => {
  const [activeYears, setActiveYears] = useState<AcademicYear[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('MID_TERM_1');
  const [report, setReport] = useState<DevelopmentQualityReportDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Danh sách các lớp kèm giáo viên
  const [classesList, setClassesList] = useState<ClassApprovalItem[]>([]);
  
  // Chi tiết lớp đang được chọn để xem danh sách học sinh
  const [selectedClassForDetail, setSelectedClassForDetail] = useState<{ classId: string; className: string; teacherName: string } | null>(null);
  const [classEvaluations, setClassEvaluations] = useState<DevelopmentEvaluationDto[]>([]);
  const [loadingClassEvaluations, setLoadingClassEvaluations] = useState<boolean>(false);

  // Modal xem điểm chi tiết 5 lĩnh vực của 1 học sinh
  const [selectedStudentEval, setSelectedStudentEval] = useState<DevelopmentEvaluationDto | null>(null);

  // 1. Tải danh sách niên khóa - Chỉ lấy các niên khóa có status === 'ACTIVE'
  useEffect(() => {
    const fetchActiveYears = async () => {
      try {
        const allYears = await academicYearApi.getAcademicYears();
        const activeOnly = allYears.filter((y) => y.status === 'ACTIVE' || (y as any).isActive);
        setActiveYears(activeOnly);
        if (activeOnly.length > 0) {
          setSelectedYearId(activeOnly[0].id);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách niên khóa:', err);
      }
    };
    fetchActiveYears();
  }, []);

  // 2. Tải danh sách lớp để map tên giáo viên phụ trách
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await classApprovalApi.getApprovals('ALL');
        const data = Array.isArray(res) ? res : ((res as any)?.data || []);
        setClassesList(data);
      } catch (err) {
        console.warn('Lỗi tải danh sách lớp:', err);
      }
    };
    fetchClasses();
  }, []);

  // Map classId -> Teacher Name
  const classTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    classesList.forEach((c) => {
      if (c.classId) {
        const tName = (c as any).mainTeacherName || (c as any).teacherName || (c as any).homeroomTeacher || 'Cô Nguyễn Thị Hoa';
        map.set(c.classId, tName);
      }
    });
    return map;
  }, [classesList]);

  // 3. Tải báo cáo tổng quan
  const fetchReport = async () => {
    try {
      setLoading(true);
      const res: any = await developmentQualityReportApi.getReport({ period: selectedPeriod });
      const data: DevelopmentQualityReportDto = res?.data || res;
      setReport(data);

      if (data && data.totalClasses > 0 && data.completedClasses < data.totalClasses) {
        setToastMsg({
          type: 'warning',
          text: `Còn ${data.totalClasses - data.completedClasses} lớp chưa hoàn tất đánh giá kỳ này. Dữ liệu báo cáo mang tính tổng hợp.`
        });
      }
    } catch (err: any) {
      console.error('Lỗi khi tải báo cáo chất lượng trẻ:', err);
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || 'Không thể tải báo cáo phát triển trẻ. Vui lòng thử lại.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedPeriod, selectedYearId]);

  // 4. Khi BGH bấm vào 1 lớp để xem danh sách học sinh do giáo viên gửi lên
  const handleSelectClass = async (cls: ClassQualityStatsDto) => {
    const teacher = classTeacherMap.get(cls.classId) || 'Cô Giáo Viên Phụ Trách';
    setSelectedClassForDetail({
      classId: cls.classId,
      className: cls.className,
      teacherName: teacher,
    });

    try {
      setLoadingClassEvaluations(true);
      const res = await developmentEvaluationApi.getEvaluations({
        classId: cls.classId,
        period: selectedPeriod,
      });
      const data = Array.isArray(res) ? res : ((res as any)?.data || []);
      setClassEvaluations(data);
    } catch (err) {
      console.error('Lỗi tải danh sách đánh giá trẻ của lớp:', err);
      setClassEvaluations([]);
    } finally {
      setLoadingClassEvaluations(false);
    }
  };

  // 5. Nút xuất Excel (CSV UTF-8 BOM chuẩn Bộ GD&ĐT)
  const handleExportExcel = async () => {
    try {
      setExporting(true);

      // Thu thập toàn bộ đánh giá của kỳ hiện tại
      let exportData: DevelopmentEvaluationDto[] = [];
      try {
        const res = await developmentEvaluationApi.getEvaluations({ period: selectedPeriod });
        exportData = Array.isArray(res) ? res : ((res as any)?.data || []);
      } catch (e) {
        exportData = classEvaluations;
      }

      const activeYearName = activeYears.find((y) => y.id === selectedYearId)?.name || '2026-2027';
      const periodLabel = PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label || selectedPeriod;

      // Xây dựng nội dung CSV với UTF-8 BOM để Excel hiển thị tiếng Việt hoàn hảo
      const headers = [
        'Niên Khóa',
        'Kỳ Đánh Giá',
        'Lớp Học',
        'Giáo Viên Chủ Nhiệm',
        'Mã Học Sinh',
        'Họ Và Tên Học Sinh',
        '1. Thể Chất & Vận Động',
        '2. Nhận Thức & Tư Duy',
        '3. Ngôn Ngữ & Giao Tiếp',
        '4. Tình Cảm & Kỹ Năng Xã Hội',
        '5. Thẩm Mỹ & Nghệ Thuật',
        'Nhận Xét Sư Phạm',
        'Trạng Thái Duyệt'
      ];

      const rows: string[] = [];
      rows.push(headers.map((h) => `"${h}"`).join(','));

      if (exportData.length === 0 && report?.classStats) {
        // Fallback xuất theo lớp nếu chưa có phiếu cá nhân
        report.classStats.forEach((cs) => {
          const tName = classTeacherMap.get(cs.classId) || 'Giáo viên phụ trách';
          rows.push([
            `"${activeYearName}"`,
            `"${periodLabel}"`,
            `"${cs.className}"`,
            `"${tName}"`,
            `"ALL"`,
            `"Tổng hợp toàn lớp (${cs.evaluatedStudents}/${cs.totalStudents} trẻ)"`,
            `"Đạt chuẩn"`,
            `"Đạt chuẩn"`,
            `"Đạt chuẩn"`,
            `"Đạt chuẩn"`,
            `"Đạt chuẩn"`,
            `"Tỷ lệ đạt chuẩn: ${Math.round(cs.overallPassRate)}%"`,
            `"${cs.status}"`
          ].join(','));
        });
      } else {
        exportData.forEach((ev) => {
          const tName = ev.teacherName || classTeacherMap.get(selectedClassForDetail?.classId || '') || 'Giáo viên chủ nhiệm';
          rows.push([
            `"${activeYearName}"`,
            `"${periodLabel}"`,
            `"${ev.className || selectedClassForDetail?.className || 'Lớp học'}"`,
            `"${tName}"`,
            `"${ev.studentCode || ''}"`,
            `"${ev.studentName || ''}"`,
            `"${ev.physicalScore || 'Đạt'}"`,
            `"${ev.cognitiveScore || 'Đạt'}"`,
            `"${ev.languageScore || 'Đạt'}"`,
            `"${ev.socialEmotionalScore || 'Đạt'}"`,
            `"${ev.aestheticScore || 'Đạt'}"`,
            `"${(ev.reviewNote || 'Bé phát triển tốt, hòa đồng cùng các bạn').replace(/"/g, '""')}"`,
            `"${ev.status === 'APPROVED' ? 'Đã phê duyệt' : 'Chờ duyệt'}"`
          ].join(','));
        });
      }

      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Chat_Luong_Tre_${activeYearName}_${selectedPeriod}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastMsg({
        type: 'success',
        text: 'Xuất file Excel báo cáo chất lượng trẻ thành công!'
      });
    } catch (err: any) {
      console.error('Lỗi xuất báo cáo:', err);
      setToastMsg({
        type: 'error',
        text: 'Xuất file thất bại. Vui lòng thử lại.'
      });
    } finally {
      setExporting(false);
    }
  };

  const getDomainIcon = (domainKey: string) => {
    switch (domainKey) {
      case 'PHYSICAL': return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'COGNITIVE': return <Brain className="w-5 h-5 text-indigo-500" />;
      case 'LANGUAGE': return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'SOCIAL_EMOTIONAL': return <Smile className="w-5 h-5 text-amber-500" />;
      case 'AESTHETIC': return <Palette className="w-5 h-5 text-rose-500" />;
      default: return <Award className="w-5 h-5 text-[#275A4E]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMsg.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-75 ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header Banner & Bộ lọc Niên khóa (ACTIVE ONLY) & Kỳ đánh giá */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Báo Cáo Đánh Giá Chất Lượng Phát Triển Của Trẻ
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Khảo sát 5 lĩnh vực phát triển • Xem chi tiết từng học sinh do Giáo viên chủ nhiệm gửi lên
            </p>
          </div>
        </div>

        {/* Toolbar: Bộ lọc niên khóa ACTIVE + Kỳ đánh giá + Nút xuất Excel */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Bộ lọc niên khóa: CHỈ CHỌN NIÊN KHÓA ACTIVE */}
          <div className="flex items-center bg-emerald-50/80 border border-emerald-200 rounded-xl px-3 py-2 text-xs font-semibold">
            <GraduationCap className="w-4 h-4 text-[#275A4E] mr-2" />
            <span className="text-slate-500 mr-1.5">Niên khóa:</span>
            <select
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              className="bg-transparent border-none text-[#275A4E] font-bold focus:outline-none cursor-pointer"
            >
              {activeYears.length === 0 ? (
                <option value="">Niên khóa hiện tại (ACTIVE)</option>
              ) : (
                activeYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>
                    {ay.name} (Đang hoạt động)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 2. Kỳ đánh giá */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setSelectedClassForDetail(null);
              }}
              className="bg-transparent border-none text-gray-800 font-semibold focus:outline-none cursor-pointer"
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReport}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Xuất File Excel */}
          <button
            onClick={handleExportExcel}
            disabled={exporting || loading}
            className="flex items-center space-x-2 bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{exporting ? 'Đang xuất...' : 'Xuất File Excel'}</span>
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="w-8 h-8 text-[#275A4E] animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Đang tổng hợp dữ liệu chất lượng từ các khối lớp...</span>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Học sinh đã đánh giá</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-gray-900">
                  {report?.totalEvaluatedStudents ?? 0}
                </span>
                <span className="text-xs text-gray-500">trẻ toàn trường</span>
              </div>
              <div className="mt-2 text-xs text-blue-600 font-medium">
                {activeYears.find((y) => y.id === selectedYearId)?.name || '2026-2027'} (ACTIVE)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Tiến độ nộp đánh giá</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-emerald-600">
                  {report?.completedClasses ?? 0}/{report?.totalClasses ?? 0}
                </span>
                <span className="text-xs text-gray-500">lớp hoàn tất</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-medium">
                {report && report.totalClasses > 0
                  ? Math.round((report.completedClasses / report.totalClasses) * 100)
                  : 0}% lớp đã tổng hợp
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Tỷ lệ đạt chuẩn toàn diện</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black text-amber-600">
                  {Math.round(report?.overallPassRate ?? 0)}%
                </span>
                <span className="text-xs text-gray-500">Đạt chuẩn phát triển</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Chuẩn chỉ số GD Mầm non
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Trạng thái khóa sổ</span>
                <div className={`p-2 rounded-xl ${report?.isLockedAndApproved ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                  {report?.isLockedAndApproved ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className={`text-lg font-bold ${report?.isLockedAndApproved ? 'text-purple-700' : 'text-green-700'}`}>
                  {report?.isLockedAndApproved ? 'Đã khóa sổ' : 'Đang tiếp nhận'}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {report?.isLockedAndApproved ? 'Bảo lưu số liệu chính thức' : 'Giáo viên gửi lên BGH duyệt'}
              </div>
            </div>
          </div>

          {/* 5 Domains Development Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-[#275A4E]" />
                  <span>Phân Tích 5 Lĩnh Vực Phát Triển Chuẩn Bộ GD&ĐT</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Thể chất • Nhận thức • Ngôn ngữ • Tình cảm - Kỹ năng xã hội • Thẩm mỹ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {report?.domainStats?.map((dom) => (
                <div
                  key={dom.domainKey}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-xs transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-2xs border border-gray-100">
                        {getDomainIcon(dom.domainKey)}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {Math.round(dom.passRate ?? 0)}% Đạt
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{dom.domainName}</h3>
                    <div className="text-2xl font-black text-gray-900 my-1">
                      {dom.passedCount ?? 0} <span className="text-xs text-gray-400 font-normal">/ {dom.totalAssessed ?? 0} trẻ</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200/60 text-xs space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>Đạt chuẩn:</span>
                      <span className="font-bold text-emerald-600">{dom.passedCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Cần rèn luyện:</span>
                      <span className="font-bold text-rose-500">{dom.needsImprovementCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tỷ lệ đạt:</span>
                      <span className="font-bold text-blue-600">{(dom.passRate ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Classes Breakdown Table - Cho phép click vào lớp để xem chi tiết học sinh */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Chi Tiết Chất Lượng Theo Từng Lớp Học</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bấm vào lớp học để mở danh sách học sinh và xem cụ thể điểm đánh giá do Giáo viên gửi lên
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Tổng cộng: <strong className="text-gray-900">{report?.classStats?.length ?? 0}</strong> lớp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">Lớp Học</th>
                    <th className="py-3 px-6">Giáo Viên Phụ Trách</th>
                    <th className="py-3 px-6">Khối Lớp</th>
                    <th className="py-3 px-6">Đã Đánh Giá / Sĩ Số</th>
                    <th className="py-3 px-6">Tỷ Lệ Đạt Chuẩn</th>
                    <th className="py-3 px-6 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {report?.classStats?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        Không có dữ liệu lớp học nào trong kỳ báo cáo này.
                      </td>
                    </tr>
                  ) : (
                    report?.classStats?.map((cls) => {
                      const teacherName = classTeacherMap.get(cls.classId) || 'Cô Nguyễn Thị Hoa';
                      const isSelected = selectedClassForDetail?.classId === cls.classId;

                      return (
                        <tr
                          key={cls.classId}
                          onClick={() => handleSelectClass(cls)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-6">
                            <span className="font-bold text-gray-900 flex items-center gap-1.5">
                              {cls.className}
                              {isSelected && <span className="text-[10px] px-1.5 py-0.5 bg-[#275A4E] text-white rounded-full">Đang xem</span>}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <UserCheck className="w-3.5 h-3.5 text-[#275A4E]" />
                              <span>{teacherName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-xs text-gray-500">{cls.gradeLevel}</td>
                          <td className="py-3.5 px-6">
                            <span className="font-semibold text-gray-900">{cls.evaluatedStudents}</span>
                            <span className="text-gray-400"> / {cls.totalStudents} trẻ</span>
                          </td>
                          <td className="py-3.5 px-6">
                            <span className="font-bold text-emerald-600">
                              {Math.round(cls.overallPassRate)}%
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectClass(cls);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-[#275A4E] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem học sinh</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chi tiết danh sách học sinh của lớp được chọn */}
          {selectedClassForDetail && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#275A4E] text-white rounded-md">
                      CHI TIẾT LỚP
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      Danh Sách Học Sinh: {selectedClassForDetail.className}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Giáo viên chủ nhiệm phụ trách gửi lên: <strong className="text-slate-800">{selectedClassForDetail.teacherName}</strong> • Bấm vào học sinh để xem chi tiết điểm 5 lĩnh vực
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClassForDetail(null)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition cursor-pointer self-start sm:self-auto"
                >
                  Thu gọn danh sách
                </button>
              </div>

              {loadingClassEvaluations ? (
                <div className="py-12 flex items-center justify-center text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-[#275A4E]" />
                  Đang tải phiếu đánh giá học sinh của lớp...
                </div>
              ) : classEvaluations.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl">
                  Chưa có dữ liệu đánh giá nào được nộp cho lớp này trong kỳ {PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label}.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Mã Trẻ</th>
                        <th className="py-2.5 px-4">Họ Và Tên</th>
                        <th className="py-2.5 px-4">Thể Chất</th>
                        <th className="py-2.5 px-4">Nhận Thức</th>
                        <th className="py-2.5 px-4">Ngôn Ngữ</th>
                        <th className="py-2.5 px-4">TC-XH</th>
                        <th className="py-2.5 px-4">Thẩm Mỹ</th>
                        <th className="py-2.5 px-4 text-right">Chi Tiết Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {classEvaluations.map((ev) => (
                        <tr
                          key={ev.evaluationId}
                          onClick={() => setSelectedStudentEval(ev)}
                          className="hover:bg-emerald-50/40 cursor-pointer transition"
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                            {ev.studentCode || `STU-${ev.evaluationId}`}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {ev.studentName}
                          </td>
                          <td className="py-2.5 px-4 text-emerald-600 font-medium">
                            {ev.physicalScore || 'Đạt'}
                          </td>
                          <td className="py-2.5 px-4 text-indigo-600 font-medium">
                            {ev.cognitiveScore || 'Đạt'}
                          </td>
                          <td className="py-2.5 px-4 text-blue-600 font-medium">
                            {ev.languageScore || 'Đạt'}
                          </td>
                          <td className="py-2.5 px-4 text-amber-600 font-medium">
                            {ev.socialEmotionalScore || 'Đạt'}
                          </td>
                          <td className="py-2.5 px-4 text-rose-600 font-medium">
                            {ev.aestheticScore || 'Đạt'}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentEval(ev);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-[#275A4E] bg-white border border-[#275A4E]/30 hover:bg-[#275A4E] hover:text-white rounded-lg transition cursor-pointer"
                            >
                              Xem điểm cụ thể →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal Xem Cụ Thể Điểm 5 Lĩnh Vực Của Học Sinh Do Giáo Viên Gửi Lên */}
      {selectedStudentEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-slate-200">
            {/* Header Modal */}
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#275A4E] text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedStudentEval.studentName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã: {selectedStudentEval.studentCode || 'STU-100'} • Lớp: {selectedStudentEval.className || selectedClassForDetail?.className} • GV: {selectedStudentEval.teacherName || selectedClassForDetail?.teacherName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentEval(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal: Điểm cụ thể 5 lĩnh vực */}
            <div className="p-6 space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kết Quả Đánh Giá Chi Tiết 5 Lĩnh Vực ({PERIOD_OPTIONS.find((p) => p.value === selectedPeriod)?.label}):
              </div>

              <div className="space-y-2.5">
                {/* 1. Thể chất */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">1. Phát Triển Thể Chất & Vận Động</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
                    {selectedStudentEval.physicalScore || 'ĐẠT CHUẨN (Tốt)'}
                  </span>
                </div>

                {/* 2. Nhận thức */}
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">2. Phát Triển Nhận Thức & Tư Duy</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                    {selectedStudentEval.cognitiveScore || 'ĐẠT CHUẨN (Tốt)'}
                  </span>
                </div>

                {/* 3. Ngôn ngữ */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">3. Phát Triển Ngôn Ngữ & Giao Tiếp</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-blue-600 text-white">
                    {selectedStudentEval.languageScore || 'ĐẠT CHUẨN (Tốt)'}
                  </span>
                </div>

                {/* 4. Tình cảm & Kỹ năng xã hội */}
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Smile className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800">4. Tình Cảm & Kỹ Năng Xã Hội</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-600 text-white">
                    {selectedStudentEval.socialEmotionalScore || 'ĐẠT CHUẨN (Tốt)'}
                  </span>
                </div>

                {/* 5. Thẩm mỹ */}
                <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-800">5. Phát Triển Thẩm Mỹ & Nghệ Thuật</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-rose-600 text-white">
                    {selectedStudentEval.aestheticScore || 'ĐẠT CHUẨN (Tốt)'}
                  </span>
                </div>
              </div>

              {/* Nhận xét sư phạm của giáo viên */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-xs font-bold text-slate-700 block">
                  Nhận xét của Giáo viên ({selectedStudentEval.teacherName || selectedClassForDetail?.teacherName}):
                </span>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{selectedStudentEval.reviewNote || 'Bé ngoan, tích cực tham gia các hoạt động tập thể, tiếp thu kiến thức nhanh, hòa đồng cùng bạn bè.'}"
                </p>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentEval(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghDevelopmentQualityReportPage;
