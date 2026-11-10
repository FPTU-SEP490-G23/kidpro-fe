import React, { useState, useEffect } from 'react';
import {
  Activity,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
  Search,
  Filter,
  RefreshCw,
  HeartPulse,
  Phone,
  ShieldAlert,
  ChevronRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { healthReportService } from '../../../services/healthReportService';
import {
  HealthDashboardResponse,
  MeasurementRoundResponse,
  SpecialCareStudentDto
} from '../../../types/healthReport.types';
import { academicApi } from '../../../api/academicApi';
import { ClassEntity } from '../../../types/classroom.types';

export const HealthReportTab: React.FC = () => {
  // Filters
  const [rounds, setRounds] = useState<MeasurementRoundResponse[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [classes, setClasses] = useState<ClassEntity[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');

  // Data & State
  const [loading, setLoading] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<HealthDashboardResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load initial rounds and classes
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const roundsData = await healthReportService.getMeasurementRounds();
      const classesRes = await academicApi.getClasses().catch(() => ({ data: [] }));
      const classesData: ClassEntity[] = Array.isArray(classesRes?.data) ? classesRes.data : [];

      setRounds(roundsData);
      setClasses(classesData || []);

      if (roundsData.length > 0) {
        // Ưu tiên chọn round đã LOCKED để demo xem và xuất sổ
        const lockedRound = roundsData.find((r: MeasurementRoundResponse) => r.status === 'LOCKED');
        setSelectedRoundId(lockedRound ? lockedRound.id : roundsData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load initial health rounds:', err);
      setErrorMsg('Không thể tải danh sách đợt khám sức khỏe');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard when round, grade or class changes
  useEffect(() => {
    if (selectedRoundId) {
      loadDashboard();
    }
  }, [selectedRoundId, selectedGrade, selectedClassId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params: any = { roundId: selectedRoundId };
      if (selectedGrade !== 'ALL') params.gradeLevel = selectedGrade;
      if (selectedClassId !== 'ALL') params.classId = selectedClassId;

      const data = await healthReportService.getDashboardData(params);
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      const backendMsg = err.response?.data?.message || err.message;
      if (backendMsg && backendMsg.includes('MSG-007')) {
        setErrorMsg('MSG-007: Không tìm thấy dữ liệu sức khỏe trong khoảng thời gian đã chọn.');
      } else {
        setErrorMsg(backendMsg || 'MSG-007: Không tìm thấy dữ liệu sức khỏe trong khoảng thời gian đã chọn.');
      }
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Handle Export Sổ theo dõi thể lực (Thông tư 13/2016)
  const handleExport = async (format: 'PDF' | 'EXCEL') => {
    const activeRound = rounds.find((r) => r.id === selectedRoundId);
    if (!activeRound) return;

    // BR-032 / MSG-143: Đợt đo phải được LOCKED mới cho phép xuất sổ
    if (activeRound.status !== 'LOCKED') {
      showToast(
        'error',
        'MSG-143: Lớp học được chọn chưa có dữ liệu cân đo được khóa sổ để xuất sổ.'
      );
      return;
    }

    try {
      setExporting(true);
      const res = await healthReportService.exportPhysicalRegister({
        classId: selectedClassId === 'ALL' ? '' : selectedClassId,
        measurementRoundId: selectedRoundId,
        format
      });

      // Tạo tải về từ Base64 hoặc CSV content
      if (res.contentBase64) {
        const link = document.createElement('a');
        link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(res.contentBase64)}`;
        link.download = res.fileName || 'So_Theo_Doi_The_Luc_TT13.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      showToast('success', 'MSG-142: Kết xuất Sổ theo dõi thể lực thành công.');
    } catch (err: any) {
      console.error('Export error:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg && msg.includes('MSG-143')) {
        showToast('error', 'MSG-143: Lớp học được chọn chưa có dữ liệu cân đo được khóa sổ để xuất sổ.');
      } else {
        showToast('error', 'MSG-144: Lỗi hệ thống trong quá trình kết xuất file tài liệu.');
      }
    } finally {
      setExporting(false);
    }
  };

  const selectedRound = rounds.find((r) => r.id === selectedRoundId);

  // Filter special care students by search term
  const filteredSpecialCare = (dashboardData?.specialCareStudents || []).filter((st) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (st.fullName && st.fullName.toLowerCase().includes(term)) ||
      (st.studentCode && st.studentCode.toLowerCase().includes(term)) ||
      (st.className && st.className.toLowerCase().includes(term)) ||
      (st.alertReason && st.alertReason.toLowerCase().includes(term)) ||
      (st.interventionPlan && st.interventionPlan.toLowerCase().includes(term)) ||
      (st.zScoreLabel && st.zScoreLabel.toLowerCase().includes(term))
    );
  });

  // Computed KPI Metrics (Hỗ trợ fallback cả format Spring Boot backend lẫn mockup)
  const totalMeasured =
    dashboardData?.measuredCount ??
    dashboardData?.totalStudentsMeasured ??
    dashboardData?.totalStudents ??
    0;

  const totalStudents = dashboardData?.totalStudents ?? totalMeasured;
  const measuredRate =
    dashboardData?.measuredRate ??
    (totalStudents > 0 ? Math.round((totalMeasured / totalStudents) * 100) : 100);

  const normalCount = dashboardData?.normalCount ?? 0;
  const normalPct =
    dashboardData?.normalPercentage ??
    (totalMeasured > 0 ? (normalCount / totalMeasured) * 100 : 0);

  const stuntedCount =
    dashboardData?.malnutritionCount ?? dashboardData?.stuntedCount ?? 0;
  const stuntedPct =
    dashboardData?.malnutritionPercentage ??
    (totalMeasured > 0 ? (stuntedCount / totalMeasured) * 100 : 0);

  const underweightCount = dashboardData?.underweightCount ?? 0;
  const underweightPct =
    dashboardData?.underweightPercentage ??
    (totalMeasured > 0 ? (underweightCount / totalMeasured) * 100 : 0);

  const overweightObeseCount =
    (dashboardData?.obeseCount || 0) + (dashboardData?.overweightCount || 0);
  const overweightObesePct =
    dashboardData?.obesePercentage != null && dashboardData?.overweightPercentage != null
      ? dashboardData.obesePercentage + dashboardData.overweightPercentage
      : dashboardData?.obesePercentage ??
        (totalMeasured > 0 ? (overweightObeseCount / totalMeasured) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner / Action Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">
              Báo cáo Tổng hợp Sức khỏe Lớp & Toàn trường
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              G7-UC-04 • TTLT 13/2016
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
            Phân tích cơ cấu dinh dưỡng WHO Z-score, danh sách trẻ cần can thiệp dinh dưỡng đặc biệt và kết xuất Sổ theo dõi thể lực định kỳ chuẩn mẫu Bộ Y tế - Bộ GD&ĐT.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExport('PDF')}
            disabled={exporting || !selectedRound}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            {exporting ? 'Đang kết xuất...' : 'Xuất Sổ Thể Lực (PDF)'}
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            disabled={exporting || !selectedRound}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Round Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Đợt Cân Đo / Khám Thể Lực
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roundName} {r.status === 'LOCKED' ? '(ĐÃ KHÓA SỔ)' : '(ĐANG DIỄN RA)'}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Khối Lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassId('ALL');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="ALL">Toàn trường (Tất cả các khối)</option>
              <option value="MAM">Khối Mầm (3-4 tuổi)</option>
              <option value="CHOI">Khối Chồi (4-5 tuổi)</option>
              <option value="LA">Khối Lá (5-6 tuổi)</option>
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Lớp Học
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="ALL">Tất cả các lớp trong khối</option>
              {classes
                .filter((c: ClassEntity) => selectedGrade === 'ALL' || c.ageGroup === selectedGrade)
                .map((c: ClassEntity) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Round Status Info */}
          <div className="flex flex-col justify-end pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Trạng thái dữ liệu chuyên môn
            </span>
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
              selectedRound?.status === 'LOCKED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              {selectedRound?.status === 'LOCKED' ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-800">
                    Đã khóa sổ dữ liệu (Hợp lệ để xuất sổ)
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">
                    Bản nháp (Cần khóa sổ trước khi xuất tài liệu)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error / Warning Alert */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-sm font-medium">{errorMsg}</div>
        </div>
      )}

      {/* KPI Cards Row */}
      {dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
          {/* Card 1: Tổng số trẻ */}
          <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group">
            <div className="h-1 bg-blue-500 absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[28px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 truncate" title="Học sinh đã đo">
                Học sinh đã đo
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {totalMeasured}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {totalStudents} trẻ
              </span>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center min-h-[34px] text-[11px] leading-snug font-medium text-slate-500">
              <span className="font-semibold text-blue-700">{measuredRate}%</span>
              <span className="ml-1 text-slate-400">tỷ lệ hoàn thành đo đạc</span>
            </div>
          </div>

          {/* Card 2: Bình thường */}
          <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group">
            <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[28px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 truncate" title="Bình thường">
                Bình thường
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-emerald-700 tracking-tight">
                {normalCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                {Number(normalPct).toFixed(1)}%
              </span>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center min-h-[34px] text-[11px] leading-snug font-medium text-slate-500">
              Thể trạng phát triển chuẩn WHO
            </div>
          </div>

          {/* Card 3: Thấp còi */}
          <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group">
            <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[28px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 truncate" title="SDD Thấp còi">
                SDD Thấp còi
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-amber-700 tracking-tight">
                {stuntedCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60">
                {Number(stuntedPct).toFixed(1)}%
              </span>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center min-h-[34px] text-[11px] leading-snug font-medium text-slate-500">
              Cần bổ sung vi chất & chiều cao
            </div>
          </div>

          {/* Card 4: Nhẹ cân */}
          <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group">
            <div className="h-1 bg-orange-500 absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[28px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 truncate" title="Nhẹ cân">
                Nhẹ cân
              </span>
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-orange-700 tracking-tight">
                {underweightCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200/60">
                {Number(underweightPct).toFixed(1)}%
              </span>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center min-h-[34px] text-[11px] leading-snug font-medium text-slate-500">
              Tăng khẩu phần bữa phụ & sữa
            </div>
          </div>

          {/* Card 5: Thừa cân & Béo phì */}
          <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group">
            <div className="h-1 bg-indigo-500 absolute top-0 left-0 right-0" />
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[28px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 truncate" title="Thừa cân / Béo phì">
                Thừa cân / Béo phì
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-indigo-700 tracking-tight">
                {overweightObeseCount}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                {Number(overweightObesePct).toFixed(1)}%
              </span>
            </div>
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center min-h-[34px] text-[11px] leading-snug font-medium text-slate-500">
              Cân đối calo & vận động thể chất
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Breakdown & Visual Distribution */}
      {dashboardData && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Cơ cấu Dinh dưỡng & Thể trạng Học sinh (Chuẩn WHO Z-Score)
          </h2>

          <div className="space-y-4">
            {/* Visual stacked bar */}
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              {dashboardData.nutritionBreakdown.map((item, idx) => {
                const colorMap: Record<string, string> = {
                  NORMAL: 'bg-emerald-500',
                  STUNTED: 'bg-amber-500',
                  UNDERWEIGHT: 'bg-orange-500',
                  OVERWEIGHT: 'bg-indigo-500',
                  OBESE: 'bg-rose-500'
                };
                return (
                  <div
                    key={idx}
                    style={{ width: `${item.percentage}%` }}
                    className={`${colorMap[item.status] || 'bg-slate-400'} transition-all duration-500`}
                    title={`${item.label}: ${item.count} trẻ (${item.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Legend cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {dashboardData.nutritionBreakdown.map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'NORMAL'
                          ? 'bg-emerald-500'
                          : item.status === 'STUNTED'
                          ? 'bg-amber-500'
                          : item.status === 'UNDERWEIGHT'
                          ? 'bg-orange-500'
                          : item.status === 'OVERWEIGHT'
                          ? 'bg-indigo-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-xs text-slate-600 font-semibold truncate">{item.label}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900">{item.count}</span>
                    <span className="text-xs font-semibold text-slate-500">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Special Care Students List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-slate-900">
                Danh sách Học sinh Cần Can thiệp Dinh dưỡng Đặc biệt
              </h2>
              {dashboardData && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  {filteredSpecialCare.length} học sinh
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Các trường hợp có chỉ số Z-score lệch chuẩn (Suy dinh dưỡng, thấp còi hoặc béo phì) cần phối hợp chế độ ăn cùng phụ huynh.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã trẻ, lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Học sinh</th>
                <th className="py-3.5 px-3">Lớp & Khối</th>
                <th className="py-3.5 px-3">Chiều cao</th>
                <th className="py-3.5 px-3">Cân nặng</th>
                <th className="py-3.5 px-3">BMI</th>
                <th className="py-3.5 px-3">Chỉ số Z-Score</th>
                <th className="py-3.5 px-3">Phân loại thể trạng</th>
                <th className="py-3.5 px-4">Đề xuất can thiệp</th>
                <th className="py-3.5 px-3 text-right">Liên hệ PH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Đang tải dữ liệu dinh dưỡng học sinh...
                  </td>
                </tr>
              ) : filteredSpecialCare.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                    Không có học sinh nào cần can thiệp dinh dưỡng đặc biệt trong phạm vi lọc đã chọn.
                  </td>
                </tr>
              ) : (
                filteredSpecialCare.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{st.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{st.studentCode}</div>
                    </td>

                    {/* Class & Grade */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-medium">{st.className}</div>
                      <div className="text-xs text-slate-400">{st.gradeLevel}</div>
                    </td>

                    {/* Height */}
                    <td className="py-3.5 px-3 font-medium text-slate-800">{st.heightCm} cm</td>

                    {/* Weight */}
                    <td className="py-3.5 px-3 font-medium text-slate-800">{st.weightKg} kg</td>

                    {/* BMI */}
                    <td className="py-3.5 px-3 font-bold text-emerald-700">{st.bmi}</td>

                    {/* Z-Scores */}
                    <td className="py-3.5 px-3 text-xs text-slate-600">
                      <div>WFA: {st.zScoreWfa != null ? st.zScoreWfa : '-'}</div>
                      <div>HFA: {st.zScoreHfa != null ? st.zScoreHfa : '-'}</div>
                    </td>

                    {/* Growth status badge */}
                    <td className="py-3.5 px-3">
                      {(() => {
                        const status = st.growthStatus || st.zScoreStatus;
                        const label =
                          st.zScoreLabel ||
                          (status === 'STUNTED' || status === 'MALNUTRITION'
                            ? 'SDD Thấp còi'
                            : status === 'UNDERWEIGHT'
                            ? 'Nhẹ cân'
                            : status === 'OBESE'
                            ? 'Béo phì'
                            : 'Thừa cân');
                        return (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              status === 'STUNTED' || status === 'MALNUTRITION'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : status === 'UNDERWEIGHT'
                                ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                : status === 'OBESE'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Alert reason / Intervention plan */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                      {st.alertReason || st.interventionPlan || '-'}
                    </td>

                    {/* Guardian contact */}
                    <td className="py-3.5 px-3 text-right">
                      {st.guardianPhone ? (
                        <a
                          href={`tel:${st.guardianPhone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium border border-emerald-200 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {st.guardianPhone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa cập nhật</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
