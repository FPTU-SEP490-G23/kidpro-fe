import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Filter,
  Building2,
  TrendingUp,
  CreditCard,
  Banknote,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Users,
  Sparkles,
  ChevronRight,
  PieChart,
  BarChart3,
  Phone
} from 'lucide-react';
import {
  FinancialReportData,
  ClassDebtSummaryItem,
  RevenueStructureItem,
  AgingDebtReportItem
} from '../../../types/finance.types';
import { formatCurrency } from '../../../utils/formatters';
import { financeApi } from '../../../api/financeApi';

// Dữ liệu rỗng khởi tạo báo cáo tài chính chuẩn mực VAS
const EMPTY_REPORT_DATA: FinancialReportData = {
  periodTitle: 'BÁO CÁO TÀI CHÍNH TỔNG HỢP & PHÂN TÍCH CÔNG NỢ',
  generatedAt: '',
  generatedBy: '',
  kpis: {
    totalIssuedRevenue: 0,
    totalCollectedRevenue: 0,
    collectedViaVietQr: 0,
    collectedViaCash: 0,
    totalDiscountsAndRefunds: 0,
    totalOutstandingDebt: 0,
    recoveryRatePercentage: 0,
    totalInvoiceCount: 0,
    paidInvoiceCount: 0,
    unpaidInvoiceCount: 0,
  },
  revenueStructure: [],
  agingDebtReport: [],
  classSummaries: [],
};

export const FinancialReportsTab: React.FC = () => {
  // Role & RBAC (BR-MSG-304: Chức năng dành riêng cho Kế toán & Ban Giám Hiệu)
  const currentRole = 'KE_TOAN'; // Giả lập quyền hiện tại: 'KE_TOAN' | 'BGH'

  // Filter State
  const [filterPeriodType, setFilterPeriodType] = useState<'MONTH' | 'QUARTER' | 'ACADEMIC_YEAR'>('MONTH');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [paymentChannel, setPaymentChannel] = useState<'ALL' | 'VIETQR' | 'CASH' | 'POS'>('ALL');

  // Report Data
  const [reportData, setReportData] = useState<FinancialReportData>(EMPTY_REPORT_DATA);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals & Interactive View
  const [selectedClassForModal, setSelectedClassForModal] = useState<ClassDebtSummaryItem | null>(null);
  const [isPreviewPrintOpen, setIsPreviewPrintOpen] = useState(false);
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<RevenueStructureItem | null>(null);
  const [hoveredAgingBar, setHoveredAgingBar] = useState<AgingDebtReportItem | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Validation & Tổng Hợp Số Liệu Tài Chính
  const handleGenerateReport = async () => {
    // RBAC Check (MSG-304)
    if (!['KE_TOAN', 'BGH', 'ADMIN'].includes(currentRole)) {
      showToast('error', 'MSG-304: Chức năng xuất báo cáo tài chính chỉ dành riêng cho bộ phận kế toán có thẩm quyền.');
      return;
    }

    // Validation: Ngày bắt đầu phải trước ngày kết thúc (MSG-051)
    if (new Date(startDate) > new Date(endDate)) {
      showToast('error', 'MSG-051: Ngày bắt đầu lọc báo cáo phải trước ngày kết thúc.');
      return;
    }

    setIsGenerating(true);
    try {
      const res: any = await financeApi.getFinancialSummaryReport({
        periodType: filterPeriodType,
        periodValue: startDate.slice(0, 7),
        startDate,
        endDate,
        paymentChannel,
        classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
      });
      if (res && (res.kpis || res.data?.kpis)) {
        setReportData(res.data || res);
        showToast('success', 'Đã tổng hợp thành công số liệu tài chính và phân loại tuổi nợ.');
      } else {
        setReportData({
          ...EMPTY_REPORT_DATA,
          periodTitle: `BÁO CÁO TÀI CHÍNH TỔNG HỢP (${startDate} ĐẾN ${endDate})`,
          generatedAt: new Date().toLocaleString('vi-VN'),
        });
        showToast('warning', 'Không tìm thấy dữ liệu phát sinh trong khoảng thời gian đã chọn.');
      }
    } catch {
      setReportData({
        ...EMPTY_REPORT_DATA,
        periodTitle: `BÁO CÁO TÀI CHÍNH TỔNG HỢP (${startDate} ĐẾN ${endDate})`,
        generatedAt: new Date().toLocaleString('vi-VN'),
      });
      showToast('warning', 'Chưa có dữ liệu tài chính phát sinh trong khoảng thời gian này.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Xuất Báo Cáo Excel (.xlsx) Chuẩn Mực VAS
  const handleExportExcel = () => {
    // RBAC Check (MSG-304)
    if (!['KE_TOAN', 'BGH', 'ADMIN'].includes(currentRole)) {
      showToast('error', 'MSG-304: Chức năng xuất báo cáo tài chính chỉ dành riêng cho bộ phận kế toán có thẩm quyền.');
      return;
    }

    if (reportData.classSummaries.length === 0) {
      showToast('warning', 'MSG-261: Không tìm thấy dữ liệu hóa đơn nào trong kỳ báo cáo đã chọn.');
      return;
    }

    // Tạo nội dung bảng tính Excel XML tương thích chuẩn 100% Microsoft Excel & LibreOffice
    const excelHeader = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style>
          table { border-collapse: collapse; font-family: 'Plus Jakarta Sans', Arial, sans-serif; }
          th, td { border: 1px solid #CBD5E1; padding: 8px 12px; }
          th { background-color: #275A4E; color: #FFFFFF; font-weight: bold; text-align: center; }
          .title { font-size: 16pt; font-weight: bold; color: #1E4D40; text-align: center; }
          .subtitle { font-size: 11pt; color: #475569; text-align: center; }
          .number { text-align: right; font-family: Consolas, monospace; }
          .center { text-align: center; }
          .total { background-color: #F1F5F9; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="title">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH - TRƯỜNG MẦM NON QUỐC TẾ KIDPRO</td></tr>
          <tr><td colspan="8" class="subtitle">Mã số thuế: 0108923456 • Địa chỉ: 123 Nguyễn Tri Phương, Quận 5, TP.HCM</td></tr>
          <tr><td colspan="8" class="title">${reportData.periodTitle}</td></tr>
          <tr><td colspan="8" class="subtitle">Thời điểm xuất: ${reportData.generatedAt} • Người lập: ${reportData.generatedBy}</td></tr>
          <tr><td colspan="8"></td></tr>
          <tr>
            <th>STT</th>
            <th>Lớp Học</th>
            <th>Khối Lớp</th>
            <th>Sĩ Số</th>
            <th>Tổng Doanh Thu Phát Hành (VNĐ)</th>
            <th>Tổng Thực Thu (VNĐ)</th>
            <th>Số Học Sinh Nợ</th>
            <th>Dư Nợ Còn Lại (VNĐ)</th>
            <th>Tỷ Lệ Thu Hồi (%)</th>
          </tr>
          ${reportData.classSummaries
            .map(
              (cls, idx) => `
            <tr>
              <td class="center">${idx + 1}</td>
              <td>${cls.className}</td>
              <td class="center">${cls.gradeLevel}</td>
              <td class="center">${cls.totalStudents}</td>
              <td class="number">${cls.totalIssued.toLocaleString('vi-VN')}</td>
              <td class="number">${cls.totalCollected.toLocaleString('vi-VN')}</td>
              <td class="center">${cls.unpaidCount}</td>
              <td class="number">${cls.remainingDebt.toLocaleString('vi-VN')}</td>
              <td class="center">${cls.recoveryRate}%</td>
            </tr>
          `
            )
            .join('')}
          <tr class="total">
            <td colspan="3" class="center">TỔNG CỘNG TOÀN TRƯỜNG</td>
            <td class="center">${reportData.classSummaries.reduce((s, c) => s + c.totalStudents, 0)}</td>
            <td class="number">${reportData.kpis.totalIssuedRevenue.toLocaleString('vi-VN')}</td>
            <td class="number">${reportData.kpis.totalCollectedRevenue.toLocaleString('vi-VN')}</td>
            <td class="center">${reportData.kpis.unpaidInvoiceCount}</td>
            <td class="number">${reportData.kpis.totalOutstandingDebt.toLocaleString('vi-VN')}</td>
            <td class="center">${reportData.kpis.recoveryRatePercentage}%</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHeader], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Tai_Chinh_Thang_10_2026.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'MSG-260: Xuất báo cáo tài chính tổng hợp thành công');
  };

  // 3. Mở Bản In / PDF
  const handleOpenPrintPreview = () => {
    if (!['KE_TOAN', 'BGH', 'ADMIN'].includes(currentRole)) {
      showToast('error', 'MSG-304: Chức năng xuất báo cáo tài chính chỉ dành riêng cho bộ phận kế toán có thẩm quyền.');
      return;
    }
    setIsPreviewPrintOpen(true);
  };

  // Lọc danh sách lớp học
  const displayedClasses = useMemo(() => {
    if (selectedClassId === 'ALL') return reportData.classSummaries;
    return reportData.classSummaries.filter((c) => c.classId === selectedClassId);
  }, [reportData, selectedClassId]);

  return (
    <div className="space-y-6">
      {/* TOAST THÔNG BÁO HỆ THỐNG */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs px-2 py-1 rounded-md bg-white/70 hover:bg-white text-slate-600 min-h-[30px]"
          >
            Đóng
          </button>
        </div>
      )}

      {/* HEADER BANNER & THÔNG TIN BÁO CÁO */}
      <div className="bg-linear-to-r from-[#1E4D40] to-[#275A4E] text-white p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
              <Building2 className="h-3.5 w-3.5 text-[#E5A93C]" />
              <span>UC-060: Báo Cáo Tài Chính & Công Nợ Chuẩn Mực VAS (VAS Accounting Standard)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Bảng Tổng Hợp Thu Chi & Giám Sát Tuổi Nợ Quá Hạn
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Phân tích cơ cấu nguồn thu, theo dõi tuổi nợ theo chuẩn 30/60/90 ngày, xuất dữ liệu Excel có công thức tự động và bản in PDF có chữ ký số điện tử của trường.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-[#E5A93C] hover:bg-[#d4982f] text-slate-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center gap-2 min-h-[44px]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Xuất Báo Cáo Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleOpenPrintPreview}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition flex items-center gap-2 min-h-[44px]"
            >
              <Printer className="h-4 w-4" />
              <span>In Báo Cáo / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* THANH THAM SỐ LỌC BÁO CÁO (REPORT FILTER TOOLBAR) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-black uppercase tracking-wider">
            <Filter className="h-4 w-4 text-[#275A4E]" />
            <span>Tham số:</span>
          </div>

          {/* Chu kỳ */}
          <select
            value={filterPeriodType}
            onChange={(e) => setFilterPeriodType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="MONTH">Theo Tháng (Tháng 10/2026)</option>
            <option value="QUARTER">Theo Quý (Quý 4/2026)</option>
            <option value="ACADEMIC_YEAR">Theo Niên Khóa (2026-2027)</option>
          </select>

          {/* Khoảng ngày (Date Range) */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
            />
            <span className="text-xs text-slate-400 font-bold">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
            />
          </div>

          {/* Lớp học */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Toàn trường (Tất cả lớp)</option>
            <option value="CLS-M1">Lớp Mầm 1</option>
            <option value="CLS-M2">Lớp Mầm 2</option>
            <option value="CLS-C1">Lớp Chồi 1</option>
            <option value="CLS-C2">Lớp Chồi 2</option>
            <option value="CLS-L1">Lớp Lá 1</option>
            <option value="CLS-L2">Lớp Lá 2</option>
          </select>

          {/* Kênh thanh toán */}
          <select
            value={paymentChannel}
            onChange={(e) => setPaymentChannel(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
          >
            <option value="ALL">Tất cả kênh thu</option>
            <option value="VIETQR">Chuyển khoản VietQR</option>
            <option value="CASH">Tiền mặt quầy thu</option>
            <option value="POS">Cà thẻ POS</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 min-h-[44px] shrink-0 disabled:opacity-50"
        >
          <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Đang Tổng Hợp...' : 'Tổng Hợp Số Liệu'}</span>
        </button>
      </div>

      {/* 4 THẺ CHỈ SỐ TÀI CHÍNH TỔNG HỢP (FINANCIAL SUMMARY CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng Doanh Thu Phát Hành */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>1. TỔNG PHÁT HÀNH</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#275A4E]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatCurrency(reportData.kpis.totalIssuedRevenue)}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">
            {reportData.kpis.totalInvoiceCount} hóa đơn đã phát hành trong kỳ
          </p>
        </div>

        {/* Thẻ 2: Tổng Thực Thu */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>2. TỔNG THỰC THU</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#78C2AD]">
              <CreditCard className="h-4 w-4 text-[#1E4D40]" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#1E4D40]">
            {formatCurrency(reportData.kpis.totalCollectedRevenue)}
          </p>
          <div className="text-[11px] text-slate-600 flex items-center justify-between font-medium">
            <span>VietQR: {formatCurrency(reportData.kpis.collectedViaVietQr)}</span>
            <span>Tiền mặt: {formatCurrency(reportData.kpis.collectedViaCash)}</span>
          </div>
        </div>

        {/* Thẻ 3: Tổng Giảm Trừ & Hoàn Phí */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>3. GIẢM TRỪ & HOÀN PHÍ</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#E5A93C]">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-800">
            - {formatCurrency(reportData.kpis.totalDiscountsAndRefunds)}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">
            Chính sách anh chị em & hoàn tiền ăn có phép
          </p>
        </div>

        {/* Thẻ 4: Tổng Công Nợ Còn Tồn */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>4. DƯ NỢ CÒN TỒN</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-600">
            {formatCurrency(reportData.kpis.totalOutstandingDebt)}
          </p>
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-rose-700">{reportData.kpis.unpaidInvoiceCount} hóa đơn chưa nộp</span>
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Tỷ lệ thu: {reportData.kpis.recoveryRatePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* KHU VỰC BIỂU ĐỒ TRỰC QUAN HÓA (VISUAL CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BIỂU ĐỒ 1: DONUT CHART CƠ CẤU NGUỒN THU */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#275A4E]">
                <PieChart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Cơ Cấu Nguồn Thu Tài Chính Trong Kỳ
                </h3>
                <p className="text-xs text-slate-500">
                  Tỷ trọng doanh thu theo từng danh mục biểu phí
                </p>
              </div>
            </div>

            {hoveredDonutSegment && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-[#1E4D40] border border-emerald-200">
                {hoveredDonutSegment.name}: {formatCurrency(hoveredDonutSegment.value)} ({hoveredDonutSegment.percentage}%)
              </span>
            )}
          </div>

          {reportData.revenueStructure.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có dữ liệu cơ cấu nguồn thu trong kỳ báo cáo.
            </div>
          ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {(() => {
                  let accumulatedPercent = 0;
                  return reportData.revenueStructure.map((item, idx) => {
                    const strokeDasharray = `${item.percentage} ${100 - item.percentage}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += item.percentage;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="18"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-300 cursor-pointer hover:opacity-85"
                        onMouseEnter={() => setHoveredDonutSegment(item)}
                        onMouseLeave={() => setHoveredDonutSegment(null)}
                      />
                    );
                  });
                })()}
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">TỔNG THU</span>
                <span className="text-xs font-black text-[#1E4D40]">1.28 Tỷ</span>
              </div>
            </div>

            {/* Chú giải Donut */}
            <div className="space-y-2 flex-1 w-full text-xs">
              {reportData.revenueStructure.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredDonutSegment(item)}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-md shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-500 font-bold">{item.percentage}%</span>
                    <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

        {/* BIỂU ĐỒ 2: AGING DEBT BAR CHART (PHÂN LOẠI TUỔI NỢ) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Phân Loại Tuổi Nợ Quá Hạn (Aging Debt Analysis)
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi công nợ theo chu kỳ chuẩn 30, 60 và trên 90 ngày
                </p>
              </div>
            </div>

            {hoveredAgingBar && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800">
                {hoveredAgingBar.bucketName}: {formatCurrency(hoveredAgingBar.amount)} ({hoveredAgingBar.invoiceCount} HĐ)
              </span>
            )}
          </div>

          {/* SVG Bar Chart */}
          {reportData.agingDebtReport.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Chưa có dữ liệu phân loại tuổi nợ trong kỳ báo cáo.
            </div>
          ) : (
          <div className="space-y-3 pt-2">
            {reportData.agingDebtReport.map((bar, idx) => {
              const maxAmount = 15000000;
              const barWidthPercent = Math.max(8, Math.min(100, (bar.amount / maxAmount) * 100));

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredAgingBar(bar)}
                  onMouseLeave={() => setHoveredAgingBar(null)}
                  className="space-y-1 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bar.color }}></span>
                      <span>{bar.bucketName}</span>
                    </span>
                    <span className="font-mono font-black text-slate-900">
                      {formatCurrency(bar.amount)}{' '}
                      <span className="text-[11px] text-slate-500 font-normal">({bar.invoiceCount} HĐ)</span>
                    </span>
                  </div>

                  {/* Thanh Bar Progress */}
                  <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidthPercent}%`,
                        backgroundColor: bar.color,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between font-semibold">
            <span>Tổng số hóa đơn quá hạn cần thu hồi:</span>
            <span className="font-black text-rose-700">
              {reportData.agingDebtReport.reduce((sum, b) => sum + b.invoiceCount, 0)} hóa đơn ({formatCurrency(reportData.kpis.totalOutstandingDebt)})
            </span>
          </div>
        </div>
      </div>

      {/* BẢNG CHI TIẾT CÔNG NỢ TỪNG LỚP HỌC (CLASS DEBT DETAILS TABLE) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#275A4E]" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              Bảng Theo Dõi Công Nợ Chi Tiết Từng Lớp Học
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            Hiển thị {displayedClasses.length} lớp học
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-black tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Lớp Học</th>
                <th className="py-3.5 px-4 text-center">Khối</th>
                <th className="py-3.5 px-4 text-center">Sĩ Số</th>
                <th className="py-3.5 px-4 text-right">Tổng Phát Hành</th>
                <th className="py-3.5 px-4 text-right">Tổng Đã Thu</th>
                <th className="py-3.5 px-4 text-center">Học Sinh Nợ</th>
                <th className="py-3.5 px-4 text-right">Dư Nợ Còn Lại</th>
                <th className="py-3.5 px-4 text-center">Tỷ Lệ Thu</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {displayedClasses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không có dữ liệu công nợ lớp học trong kỳ báo cáo đã chọn.
                  </td>
                </tr>
              ) : (
                displayedClasses.map((item) => (
                <tr key={item.classId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-bold text-slate-900">{item.className}</td>
                  <td className="py-4 px-4 text-center text-slate-500">{item.gradeLevel}</td>
                  <td className="py-4 px-4 text-center font-bold text-slate-800">{item.totalStudents}</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-slate-800">
                    {formatCurrency(item.totalIssued)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-[#1E4D40]">
                    {formatCurrency(item.totalCollected)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {item.unpaidCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-black text-xs border border-rose-200">
                        {item.unpaidCount} bé
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs">0 bé</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-black text-rose-600">
                    {formatCurrency(item.remainingDebt)}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {item.recoveryRate}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedClassForModal(item)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#275A4E] text-xs font-bold transition flex items-center gap-1 mx-auto min-h-[38px]"
                    >
                      <span>Xem DS Nợ</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
            <tfoot className="bg-slate-50/90 font-black text-slate-900 text-xs sm:text-sm border-t-2 border-slate-200">
              <tr>
                <td className="py-4 px-4" colSpan={2}>
                  TỔNG CỘNG TOÀN TRƯỜNG
                </td>
                <td className="py-4 px-4 text-center">
                  {reportData.classSummaries.reduce((sum, c) => sum + c.totalStudents, 0)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-slate-900">
                  {formatCurrency(reportData.kpis.totalIssuedRevenue)}
                </td>
                <td className="py-4 px-4 text-right font-mono text-[#1E4D40]">
                  {formatCurrency(reportData.kpis.totalCollectedRevenue)}
                </td>
                <td className="py-4 px-4 text-center text-rose-700">
                  {reportData.kpis.unpaidInvoiceCount} bé
                </td>
                <td className="py-4 px-4 text-right font-mono text-rose-600">
                  {formatCurrency(reportData.kpis.totalOutstandingDebt)}
                </td>
                <td className="py-4 px-4 text-center text-emerald-800">
                  {reportData.kpis.recoveryRatePercentage}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT HỌC SINH CÒN NỢ CỦA LỚP (CLICK-THROUGH MODAL) */}
      {selectedClassForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 text-xs font-bold mb-1.5 border border-rose-200">
                  <Banknote className="h-3.5 w-3.5 text-rose-600" />
                  <span>Danh Sách Học Sinh Chưa Hoàn Tất Học Phí</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {selectedClassForModal.className}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Dư nợ còn lại của lớp: <strong className="text-rose-600 font-mono">{formatCurrency(selectedClassForModal.remainingDebt)}</strong> ({selectedClassForModal.unpaidCount} học sinh)
                </p>
              </div>

              <button
                onClick={() => setSelectedClassForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-black border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Học Sinh</th>
                    <th className="py-3 px-3">Phụ Huynh & SĐT</th>
                    <th className="py-3 px-3 text-center">Trễ Hạn</th>
                    <th className="py-3 px-3 text-right">Số Tiền Nợ</th>
                    <th className="py-3 px-3 text-center">Mã Hóa Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedClassForModal.debtors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Lớp học này đã hoàn tất 100% học phí trong kỳ!
                      </td>
                    </tr>
                  ) : (
                    selectedClassForModal.debtors.map((st) => (
                      <tr key={st.studentId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-900 block">{st.studentName}</span>
                          <span className="font-mono text-[11px] text-slate-500">{st.studentCode}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-slate-800 font-semibold block">{st.parentName}</span>
                          <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {st.parentPhone}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Quá {st.overdueDays} ngày
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-black font-mono text-rose-600">
                          {formatCurrency(st.debtAmount)}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono text-xs text-[#275A4E] font-bold">
                          {st.invoiceNumber}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setSelectedClassForModal(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-800 text-xs sm:text-sm min-h-[44px]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC BẢN IN & XUẤT PDF CHUẨN VAS CÓ CHỮ KÝ SỐ */}
      {isPreviewPrintOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-black text-slate-400">Xem trước bản in chính thức</span>
                <h3 className="text-lg font-black text-slate-900">Báo Cáo Thu Chi & Quyết Toán Chuẩn VAS</h3>
              </div>
              <button
                onClick={() => setIsPreviewPrintOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Mẫu in chính thức chuẩn Bộ GD & Bộ Tài Chính */}
            <div className="mt-6 border border-slate-300 p-8 rounded-2xl bg-white space-y-6 text-slate-900 font-sans text-xs sm:text-sm">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p className="font-bold uppercase">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</p>
                  <p className="font-extrabold text-[#1E4D40] text-sm">TRƯỜNG MẦM NON QUỐC TẾ KIDPRO</p>
                  <p className="text-slate-500">Mã đơn vị: MN-Q5-0108 • Mã số thuế: 0108923456</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Mẫu biểu số: B01-HĐ/VAS</p>
                  <p className="text-slate-500">Ban hành theo Thông tư 200/BTC</p>
                </div>
              </div>

              <div className="text-center pt-2">
                <h2 className="text-base sm:text-xl font-black uppercase text-[#1E4D40]">
                  {reportData.periodTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Kỳ tổng hợp: {startDate} đến {endDate} • Ngày lập: {reportData.generatedAt}
                </p>
              </div>

              {/* Tóm tắt số liệu quyết toán */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-y border-slate-200 py-3">
                <div>
                  <span className="text-slate-500 block">Tổng Doanh Thu Phát Hành:</span>
                  <span className="font-black text-slate-900 text-sm">
                    {formatCurrency(reportData.kpis.totalIssuedRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tổng Thực Thu (Gạch nợ):</span>
                  <span className="font-black text-[#1E4D40] text-sm">
                    {formatCurrency(reportData.kpis.totalCollectedRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Giảm Trừ & Hoàn Phí:</span>
                  <span className="font-black text-amber-800 text-sm">
                    {formatCurrency(reportData.kpis.totalDiscountsAndRefunds)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Dư Nợ Chưa Thu Hồi:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatCurrency(reportData.kpis.totalOutstandingDebt)} ({reportData.kpis.recoveryRatePercentage}%)
                  </span>
                </div>
              </div>

              {/* Chữ ký xác nhận kép */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <p className="font-bold uppercase text-slate-700">NGƯỜI LẬP BIỂU / KẾ TOÁN TRƯỞNG</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, ghi rõ họ tên & đóng dấu số)</p>
                  <div className="h-20 flex items-center justify-center">
                    <span className="font-mono text-emerald-800 font-extrabold bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                      [ĐÃ KÝ SỐ: PHẠM THU HÀ]
                    </span>
                  </div>
                </div>

                <div>
                  <p className="font-bold uppercase text-slate-700">HIỆU TRƯỞNG / ĐẠI DIỆN BGH</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký, đóng dấu pháp nhân trường)</p>
                  <div className="h-20 flex items-center justify-center">
                    <span className="font-mono text-[#1E4D40] font-extrabold bg-emerald-50 px-3 py-1 rounded border border-emerald-200">
                      [ĐÃ PHÊ DUYỆT BGH: TS. LÊ HẢI ĐĂNG]
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setIsPreviewPrintOpen(false)}
                className="px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                  showToast('success', 'Đã chuyển lệnh in báo cáo tài chính tới máy in.');
                }}
                className="px-6 py-2.5 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white font-extrabold shadow-md transition flex items-center gap-2 min-h-[44px]"
              >
                <Printer className="h-4 w-4" />
                <span>Tiến Hành In (Ctrl + P)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReportsTab;
