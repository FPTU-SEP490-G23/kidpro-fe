import React, { useState, useEffect } from 'react';
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
  Palette
} from 'lucide-react';
import {
  developmentQualityReportApi,
  DevelopmentQualityReportDto,
  DomainScoreStatsDto,
  ClassQualityStatsDto
} from '../../api/developmentQualityReportApi';

const PERIOD_OPTIONS = [
  { value: 'START_YEAR', label: 'Khảo sát Đầu năm' },
  { value: 'MID_TERM_1', label: 'Đánh giá Giữa Học kỳ I' },
  { value: 'END_TERM_1', label: 'Tổng kết Học kỳ I' },
  { value: 'MID_TERM_2', label: 'Đánh giá Giữa Học kỳ II' },
  { value: 'END_YEAR', label: 'Tổng kết Cuối năm học' },
];

export const BghDevelopmentQualityReportPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('MID_TERM_1');
  const [report, setReport] = useState<DevelopmentQualityReportDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res: any = await developmentQualityReportApi.getReport({ period: selectedPeriod });
      const data: DevelopmentQualityReportDto = res?.data || res;
      setReport(data);

      if (data && data.totalClasses > 0 && data.completedClasses < data.totalClasses) {
        setToastMsg({
          type: 'warning',
          text: `MSG-274: Còn ${data.totalClasses - data.completedClasses} lớp chưa hoàn tất đánh giá kỳ này. Dữ liệu báo cáo mang tính tổng hợp tạm thời.`
        });
      } else {
        setToastMsg({
          type: 'success',
          text: 'MSG-273: Báo cáo đánh giá chất lượng phát triển của trẻ đã được tải thành công.'
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
  }, [selectedPeriod]);

  const handleExport = async (format: string = 'CSV') => {
    try {
      setExporting(true);
      const res: any = await developmentQualityReportApi.exportReport({
        period: selectedPeriod,
        format
      });

      // Tạo Blob và tải file UTF-8 BOM
      const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Chat_Luong_Tre_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setToastMsg({
        type: 'success',
        text: 'Xuất file báo cáo thành công theo định dạng chuẩn Bộ GD&ĐT (BR-117).'
      });
    } catch (err: any) {
      console.error('Lỗi xuất báo cáo:', err);
      setToastMsg({
        type: 'error',
        text: 'Xuất file thất bại. Vui lòng kiểm tra lại kết nối.'
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
      default: return <Award className="w-5 h-5 text-primary-500" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Hoàn tất 100%</span>
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Đang đánh giá</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
            <span>Chưa bắt đầu</span>
          </span>
        );
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
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : toastMsg.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                UC-078
              </span>
              <h1 className="text-xl font-bold text-gray-900">
                Báo Cáo Đánh Giá Chất Lượng Phát Triển Của Trẻ
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Tổng hợp & phân tích 5 lĩnh vực phát triển chuẩn GD&ĐT • Khóa sổ & xuất báo cáo (BR-116, BR-117)
            </p>
          </div>
        </div>

        {/* Toolbar & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
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
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleExport('CSV')}
            disabled={exporting || loading}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exporting ? 'Đang xuất...' : 'Xuất File Excel (CSV)'}</span>
          </button>
        </div>
      </div>

      {loading && !report ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Đang tổng hợp dữ liệu chất lượng từ các khối lớp...</span>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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
              <div className="mt-2 text-xs text-blue-600 font-medium flex items-center">
                <span>Năm học: {report?.academicYearName || '2026-2027'}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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
                <span className="text-xs text-gray-500">lớp hoàn tất 100%</span>
              </div>
              <div className="mt-2 text-xs text-emerald-600 font-medium">
                {report && report.totalClasses > 0
                  ? Math.round((report.completedClasses / report.totalClasses) * 100)
                  : 0}% lớp đã phê duyệt
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
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

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase">Trạng thái khóa sổ (BR-116)</span>
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
                {report?.isLockedAndApproved ? 'Bảo lưu số liệu chính thức' : 'Giáo viên vẫn có thể cập nhật'}
              </div>
            </div>
          </div>

          {/* 5 Domains Development Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary-600" />
                  <span>Phân Tích 5 Trục Phát Triển Của Trẻ Chuẩn Bộ GD&ĐT</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đánh giá toàn diện: Thể chất, Nhận thức, Ngôn ngữ, Xã hội, Thẩm mỹ
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
              {report?.domainStats?.map((dom) => (
                <div
                  key={dom.domainKey}
                  className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
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

          {/* Classes Breakdown Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Chi Tiết Chất Lượng Theo Từng Lớp Học</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đối soát tỷ lệ hoàn thành hồ sơ & tỷ lệ đạt chuẩn từng đơn vị lớp
                </p>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Tổng cộng: <strong className="text-gray-900">{report?.classStats?.length ?? 0}</strong> lớp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">Lớp Học</th>
                    <th className="py-3 px-6">Khối Lớp</th>
                    <th className="py-3 px-6">Đã Đánh Giá / Sĩ Số</th>
                    <th className="py-3 px-6">Tiến Độ Hoàn Thành</th>
                    <th className="py-3 px-6">Tỷ Lệ Đạt Chuẩn</th>
                    <th className="py-3 px-6">Trạng Thái Lớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {report?.classStats?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        Chưa có dữ liệu lớp học cho kỳ đánh giá này
                      </td>
                    </tr>
                  ) : (
                    report?.classStats?.map((cls) => {
                      const completionRate = cls.totalStudents > 0
                        ? Math.round((cls.evaluatedStudents / cls.totalStudents) * 100)
                        : 0;
                      return (
                        <tr key={cls.classId} className="hover:bg-gray-50/80 transition">
                          <td className="py-4 px-6 font-bold text-gray-900">{cls.className}</td>
                          <td className="py-4 px-6">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">
                              {cls.gradeLevel || 'Khối Mẫu Giáo'}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold">
                            {cls.evaluatedStudents} / {cls.totalStudents} trẻ
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full ${
                                    completionRate >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, completionRate)}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-gray-700">{completionRate}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-black text-primary-700">
                            {(cls.overallPassRate ?? 0).toFixed(1)}%
                          </td>
                          <td className="py-4 px-6">
                            {renderStatusBadge(cls.status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BghDevelopmentQualityReportPage;
