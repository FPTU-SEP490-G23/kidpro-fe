import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Bell,
  Search,
  Filter,
  RefreshCw,
  Send,
  X,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import financialReportApi, {
  RevenueReportDto,
  OverdueDebtDto,
} from '../../api/financialReportApi';

export const BghRevenueReportPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [report, setReport] = useState<RevenueReportDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selection for batch reminders
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debtLevelFilter, setDebtLevelFilter] = useState<string>('ALL');

  // Modal Send Reminders
  const [reminderModalOpen, setReminderModalOpen] = useState<boolean>(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  // Alert Toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await financialReportApi.getRevenueReport({
        month: selectedMonth,
        year: selectedYear,
      });
      setReport((res as any)?.data || res);
      setSelectedInvoices([]);
    } catch (err: any) {
      console.error('Lỗi khi tải báo cáo doanh thu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && report) {
      setSelectedInvoices(filteredDebts.map((d) => d.invoiceId));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleToggleSelect = (invId: string) => {
    if (selectedInvoices.includes(invId)) {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invId));
    } else {
      setSelectedInvoices([...selectedInvoices, invId]);
    }
  };

  const handleExportExcel = () => {
    try {
      const headers = ['Kỳ Học Phí', 'Mã Hóa Đơn', 'Học Sinh', 'Lớp', 'Phụ Huynh', 'Số Điện Thoại', 'Tuổi Nợ (Ngày)', 'Mức Độ Cảnh Báo'];
      const rows = filteredDebts.map((d) => [
        `"Tháng ${selectedMonth}/${selectedYear}"`,
        `"${d.invoiceCode || ''}"`,
        `"${d.studentName}"`,
        `"${d.className}"`,
        `"${d.parentName}"`,
        `"${d.parentPhone}"`,
        `"${d.daysOverdue}"`,
        `"${d.debtLevel === 'WARNING_2' ? 'Cảnh Báo Cấp 2 (>7 ngày)' : d.debtLevel === 'WARNING_1' ? 'Cảnh Báo Cấp 1 (4-7 ngày)' : 'Nhắc Nhở Nhẹ (1-3 ngày)'}"`
      ]);
      const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Cong_No_Qua_Han_T${selectedMonth}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setAlertInfo({
        type: 'success',
        message: 'Xuất file Excel báo cáo công nợ quá hạn thành công.',
      });
    } catch (e) {
      setAlertInfo({
        type: 'error',
        message: 'Lỗi khi xuất file Excel báo cáo công nợ.',
      });
    }
  };

  const handleSendReminders = async () => {
    if (selectedInvoices.length === 0) return;
    try {
      setSending(true);
      const res = await financialReportApi.sendReminders(selectedInvoices, customMessage);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Đã phát thông báo nhắc nợ học phí thành công tới danh sách phụ huynh được chọn.',
      });
      setReminderModalOpen(false);
      setCustomMessage('');
      fetchReport();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Lỗi gửi nhắc nợ.',
      });
    } finally {
      setSending(false);
    }
  };

  const formatVND = (amt?: number) => {
    if (!amt) return '0 ₫';
    return amt.toLocaleString('vi-VN') + ' ₫';
  };

  const filteredDebts = (report?.overdueDebts || []).filter((d) => {
    const matchSearch =
      d.studentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.parentName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.className.toLowerCase().includes(searchKeyword.toLowerCase());
    const matchLevel = debtLevelFilter === 'ALL' || d.debtLevel === debtLevelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Báo Cáo Doanh Thu & Công Nợ Quá Hạn
              </h1>
              <p className="text-sm text-slate-500">
                Theo dõi tỷ lệ hoàn thành thu học phí, phân loại tuổi nợ và gửi nhắc nợ phụ huynh
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Tháng {i + 1}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2 py-1 bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchReport}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Alert toast */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Số Phải Thu</p>
              <p className="text-xl font-bold text-slate-800">
                {formatVND(report?.totalReceivable)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Tiền Đã Thu</p>
              <p className="text-xl font-bold text-emerald-700">
                {formatVND(report?.totalCollected)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 rounded-xl text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng Công Nợ Quá Hạn</p>
              <p className="text-xl font-bold text-rose-600">
                {formatVND(report?.totalOverdue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#275A4E]/10 rounded-xl text-[#275A4E]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tỷ Lệ Hoàn Thành Thu</p>
              <p className="text-xl font-bold text-[#275A4E]">
                {report?.completionRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Debt Table Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Danh Sách Học Sinh Nợ Học Phí Quá Hạn
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Phân loại tuổi nợ tự động theo quy định: Nhắc nhở nhẹ (1-3 ngày), Cảnh báo Cấp 1 (4-7 ngày), Cảnh báo Cấp 2 (&gt;7 ngày)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Xuất Excel
            </button>

            <button
              disabled={selectedInvoices.length === 0}
              onClick={() => setReminderModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#275A4E] text-white rounded-xl text-xs font-bold hover:bg-[#1E4D40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-4 h-4" />
              Gửi Nhắc Nợ Hàng Loạt ({selectedInvoices.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, phụ huynh, lớp..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
            />
          </div>

          <select
            value={debtLevelFilter}
            onChange={(e) => setDebtLevelFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Tất cả mức độ tuổi nợ</option>
            <option value="MILD">Quá hạn 1-3 ngày (Nhắc nhở nhẹ)</option>
            <option value="WARNING_1">Quá hạn 4-7 ngày (Cảnh báo Cấp 1)</option>
            <option value="WARNING_2">Quá hạn &gt;7 ngày (Cảnh báo Cấp 2)</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={filteredDebts.length > 0 && selectedInvoices.length === filteredDebts.length}
                    className="rounded border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                  />
                </th>
                <th className="px-4 py-3">Học Sinh</th>
                <th className="px-4 py-3">Lớp Học</th>
                <th className="px-4 py-3">Phụ Huynh &amp; SĐT</th>
                <th className="px-4 py-3">Tuổi Nợ</th>
                <th className="px-4 py-3">Phân Loại Mức Độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Đang tải dữ liệu công nợ...
                  </td>
                </tr>
              ) : filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    Không có học sinh nào nợ học phí quá hạn trong kỳ này
                  </td>
                </tr>
              ) : (
                filteredDebts.map((item) => {
                  const isChecked = selectedInvoices.includes(item.invoiceId);
                  return (
                    <tr
                      key={item.invoiceId}
                      className={`hover:bg-slate-50/70 transition-colors ${isChecked ? 'bg-emerald-50/30' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(item.invoiceId)}
                          className="rounded border-slate-300 text-[#275A4E] focus:ring-[#275A4E]"
                        />
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{item.studentName}</td>
                      <td className="px-4 py-3 text-slate-600">{item.className}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-700 block">{item.parentName}</span>
                        <span className="text-slate-500">{item.parentPhone}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{item.daysOverdue} ngày</td>
                      <td className="px-4 py-3">
                        {item.debtLevel === 'WARNING_2' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            Cảnh Báo Cấp 2 (&gt;7 ngày)
                          </span>
                        ) : item.debtLevel === 'WARNING_1' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            Cảnh Báo Cấp 1 (4-7 ngày)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            Nhắc Nhở Nhẹ (1-3 ngày)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Send Debt Reminder */}
      {reminderModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-800">
              Phát Lệnh Nhắc Nợ Tới {selectedInvoices.length} Phụ Huynh
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Theo quy định, hệ thống tự động giới hạn tối đa chỉ phát thông báo nhắc nợ 01 lần/ngày cho mỗi học sinh để tránh làm phiền phụ huynh.
            </p>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Nội dung lời nhắn gửi kèm (Tùy chọn)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Nhà trường trân trọng thông báo phụ huynh hoàn tất đóng học phí cho bé..."
                rows={3}
                className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setReminderModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSendReminders}
                disabled={sending}
                className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
              >
                {sending ? 'Đang gửi...' : 'Gửi Thông Báo Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghRevenueReportPage;
