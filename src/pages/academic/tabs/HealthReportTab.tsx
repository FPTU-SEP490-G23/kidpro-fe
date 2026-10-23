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
      st.fullName.toLowerCase().includes(term) ||
      st.studentCode.toLowerCase().includes(term) ||
      st.className.toLowerCase().includes(term) ||
      st.alertReason.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-900/90 border-rose-500/50 text-rose-100'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900/40 via-cyan-900/30 to-blue-900/40 border border-teal-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                Báo cáo Tổng hợp Sức khỏe Lớp & Toàn trường
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                G7-UC-04 • TTLT 13/2016
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Phân tích cơ cấu dinh dưỡng WHO Z-score, danh sách trẻ cần can thiệp dinh dưỡng đặc biệt và kết xuất Sổ theo dõi thể lực định kỳ chuẩn mẫu Bộ Y tế - Bộ GD&ĐT.
            </p>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleExport('PDF')}
              disabled={exporting || !selectedRound}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-medium text-sm shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              {exporting ? 'Đang kết xuất...' : 'Xuất Sổ Thể Lực (PDF)'}
            </button>
            <button
              onClick={() => handleExport('EXCEL')}
              disabled={exporting || !selectedRound}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-medium text-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Round Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Đợt Cân Đo / Khám Thể Lực
            </label>
            <select
              value={selectedRoundId}
              onChange={(e) => setSelectedRoundId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Khối Lớp
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedClassId('ALL');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
            >
              <option value="ALL">Toàn trường (Tất cả các khối)</option>
              <option value="MAM">Khối Mầm (3-4 tuổi)</option>
              <option value="CHOI">Khối Chồi (4-5 tuổi)</option>
              <option value="LA">Khối Lá (5-6 tuổi)</option>
            </select>
          </div>

          {/* Class Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Lớp Học
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
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
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Trạng thái dữ liệu chuyên môn
            </span>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80">
              {selectedRound?.status === 'LOCKED' ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    Đã khóa sổ dữ liệu (Hợp lệ để xuất sổ)
                  </span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-sm">{errorMsg}</div>
        </div>
      )}

      {/* KPI Cards Row */}
      {dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Tổng số trẻ */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Học sinh đã đo</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {dashboardData.totalStudentsMeasured}
            </div>
            <div className="text-xs text-slate-400">100% tỷ lệ hoàn thành đo đạc</div>
          </div>

          {/* Card 2: Bình thường */}
          <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Bình thường</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {dashboardData.normalCount}{' '}
              <span className="text-xs text-emerald-400 font-semibold">
                ({dashboardData.totalStudentsMeasured > 0
                  ? ((dashboardData.normalCount / dashboardData.totalStudentsMeasured) * 100).toFixed(1)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-xs text-slate-400">Thể trạng phát triển chuẩn WHO</div>
          </div>

          {/* Card 3: Thấp còi */}
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">SDD Thấp còi</span>
              <TrendingDown className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {dashboardData.stuntedCount}{' '}
              <span className="text-xs text-amber-400 font-semibold">
                ({dashboardData.totalStudentsMeasured > 0
                  ? ((dashboardData.stuntedCount / dashboardData.totalStudentsMeasured) * 100).toFixed(1)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-xs text-slate-400">Cần bổ sung vi chất & chiều cao</div>
          </div>

          {/* Card 4: Nhẹ cân */}
          <div className="bg-slate-900/60 border border-orange-500/20 rounded-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-orange-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Nhẹ cân</span>
              <TrendingDown className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {dashboardData.underweightCount}{' '}
              <span className="text-xs text-orange-400 font-semibold">
                ({dashboardData.totalStudentsMeasured > 0
                  ? ((dashboardData.underweightCount / dashboardData.totalStudentsMeasured) * 100).toFixed(1)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-xs text-slate-400">Tăng khẩu phần bữa phụ & sữa</div>
          </div>

          {/* Card 5: Thừa cân & Béo phì */}
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-purple-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Thừa cân / Béo phì</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {dashboardData.overweightCount + dashboardData.obeseCount}{' '}
              <span className="text-xs text-purple-400 font-semibold">
                ({dashboardData.totalStudentsMeasured > 0
                  ? (
                      ((dashboardData.overweightCount + dashboardData.obeseCount) /
                        dashboardData.totalStudentsMeasured) *
                      100
                    ).toFixed(1)
                  : 0}
                %)
              </span>
            </div>
            <div className="text-xs text-slate-400">Cân đối calo & vận động thể chất</div>
          </div>
        </div>
      )}

      {/* Nutrition Breakdown & Visual Distribution */}
      {dashboardData && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-400" />
            Cơ cấu Dinh dưỡng & Thể trạng Học sinh (Chuẩn WHO Z-Score)
          </h2>

          <div className="space-y-4">
            {/* Visual stacked bar */}
            <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex">
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
                    className={`${colorMap[item.status] || 'bg-slate-500'} transition-all duration-500`}
                    title={`${item.label}: ${item.count} trẻ (${item.percentage}%)`}
                  />
                );
              })}
            </div>

            {/* Legend cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {dashboardData.nutritionBreakdown.map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        item.status === 'NORMAL'
                          ? 'bg-emerald-400'
                          : item.status === 'STUNTED'
                          ? 'bg-amber-400'
                          : item.status === 'UNDERWEIGHT'
                          ? 'bg-orange-400'
                          : item.status === 'OVERWEIGHT'
                          ? 'bg-indigo-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className="text-xs text-slate-300 font-medium truncate">{item.label}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-white">{item.count}</span>
                    <span className="text-xs font-semibold text-slate-400">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Special Care Students List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              <h2 className="text-base font-semibold text-white">
                Danh sách Học sinh Cần Can thiệp Dinh dưỡng Đặc biệt
              </h2>
              {dashboardData && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {filteredSpecialCare.length} học sinh
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
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
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
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
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-400" />
                    Đang tải dữ liệu dinh dưỡng học sinh...
                  </td>
                </tr>
              ) : filteredSpecialCare.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    Không có học sinh nào cần can thiệp dinh dưỡng đặc biệt trong phạm vi lọc đã chọn.
                  </td>
                </tr>
              ) : (
                filteredSpecialCare.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-800/40 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{st.fullName}</div>
                      <div className="text-xs text-slate-400 font-mono">{st.studentCode}</div>
                    </td>

                    {/* Class & Grade */}
                    <td className="py-3.5 px-3">
                      <div className="text-white font-medium">{st.className}</div>
                      <div className="text-xs text-slate-400">{st.gradeLevel}</div>
                    </td>

                    {/* Height */}
                    <td className="py-3.5 px-3 font-medium text-white">{st.heightCm} cm</td>

                    {/* Weight */}
                    <td className="py-3.5 px-3 font-medium text-white">{st.weightKg} kg</td>

                    {/* BMI */}
                    <td className="py-3.5 px-3 font-semibold text-teal-300">{st.bmi}</td>

                    {/* Z-Scores */}
                    <td className="py-3.5 px-3 text-xs text-slate-300">
                      <div>WFA: {st.zScoreWfa != null ? st.zScoreWfa : '-'}</div>
                      <div>HFA: {st.zScoreHfa != null ? st.zScoreHfa : '-'}</div>
                    </td>

                    {/* Growth status badge */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          st.growthStatus === 'STUNTED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : st.growthStatus === 'UNDERWEIGHT'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                            : st.growthStatus === 'OBESE'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {st.growthStatus === 'STUNTED'
                          ? 'SDD Thấp còi'
                          : st.growthStatus === 'UNDERWEIGHT'
                          ? 'Nhẹ cân'
                          : st.growthStatus === 'OBESE'
                          ? 'Béo phì'
                          : 'Thừa cân'}
                      </span>
                    </td>

                    {/* Alert reason */}
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-xs">{st.alertReason}</td>

                    {/* Guardian contact */}
                    <td className="py-3.5 px-3 text-right">
                      {st.guardianPhone ? (
                        <a
                          href={`tel:${st.guardianPhone}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-medium border border-teal-500/30 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {st.guardianPhone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Chưa cập nhật</span>
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
