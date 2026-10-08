import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import attendanceApi from '../../api/attendanceApi';
import { supabase } from '../../config/supabase';
import {
  Baby,
  Clock,
  AlertTriangle,
  Send,
  Receipt,
  QrCode,
  FileText,
  Loader2,
  RefreshCw,
  Inbox,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

interface LeaveRequestItem {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
}

interface StudentOption {
  id: string;
  fullName: string;
  className: string;
}

interface ParentInvoiceItem {
  id: string;
  monthYear: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
}

export const ParentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leave' | 'invoice'>('leave');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestItem[]>([]);
  const [invoices, setInvoices] = useState<ParentInvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form xin nghỉ học
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Sửa đơn xin nghỉ
  const [showEditLeaveModal, setShowEditLeaveModal] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0]);
  const [editReason, setEditReason] = useState('');
  const [isUpdatingLeave, setIsUpdatingLeave] = useState(false);

  // Modal QR
  const [selectedInvoiceForQr, setSelectedInvoiceForQr] = useState<ParentInvoiceItem | null>(null);

  // Kiểm tra thời gian 08:00 AM Cut-off
  const now = new Date();
  const isPast8AM = now.getHours() >= 8;
  const isTodaySelected = startDate === now.toISOString().split('T')[0];

  // Tải dữ liệu thật từ cơ sở dữ liệu Supabase
  const loadParentData = async () => {
    setIsLoading(true);
    try {
      // 1. Tải danh sách học sinh & lớp học (academic.students & core.classes)
      let studentsData: any[] | null = null;
      try {
        const { data, error } = await supabase.schema('academic').from('students').select('id, full_name, class_id');
        if (!error && data) studentsData = data;
        else {
          const { data: pubData } = await supabase.from('students').select('id, full_name, class_id');
          if (pubData) studentsData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase.from('students').select('id, full_name, class_id');
        if (pubData) studentsData = pubData;
      }

      let classesData: any[] | null = null;
      try {
        const { data, error } = await supabase.schema('core').from('classes').select('id, name');
        if (!error && data) classesData = data;
        else {
          const { data: pubData } = await supabase.from('classes').select('id, name');
          if (pubData) classesData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase.from('classes').select('id, name');
        if (pubData) classesData = pubData;
      }

      if (studentsData && studentsData.length > 0) {
        const mappedStu: StudentOption[] = studentsData.map((s: any) => {
          const matchedClass = classesData?.find((c: any) => c.id === s.class_id);
          return {
            id: s.id,
            fullName: s.full_name,
            className: matchedClass?.name || 'Chưa xếp lớp',
          };
        });
        setStudents(mappedStu);
        setSelectedStudentId((prev) => prev || mappedStu[0].id);
      } else {
        setStudents([]);
        setSelectedStudentId('');
      }

      // 2. Tải đơn xin nghỉ phép (attendance.leave_requests)
      let dbLeaves: any[] = [];
      try {
        const resp: any = await attendanceApi.getMyLeaveRequests();
        if (resp && Array.isArray(resp)) {
          dbLeaves = resp;
        }
      } catch {
        try {
          const { data, error } = await supabase
            .schema('attendance')
            .from('leave_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data) {
            dbLeaves = data;
          } else {
            const { data: pubData } = await supabase
              .from('leave_requests')
              .select('*')
              .order('created_at', { ascending: false });
            if (pubData) dbLeaves = pubData;
          }
        } catch {
          const { data: pubData } = await supabase
            .from('leave_requests')
            .select('*')
            .order('created_at', { ascending: false });
          if (pubData) dbLeaves = pubData;
        }
      }

      if (dbLeaves && dbLeaves.length > 0) {
        const rows: LeaveRequestItem[] = dbLeaves.map((item: any, idx: number) => {
          const matchedStu = studentsData?.find((s: any) => s.id === (item.student?.id || item.student_id));
          return {
            id: item.id || '',
            code: item.id ? `LR-${String(item.id).substring(0, 6).toUpperCase()}` : `LR-0${idx + 1}`,
            studentId: item.student_id || item.student?.id || '',
            studentName: matchedStu?.full_name || item.student?.fullName || 'Học sinh',
            startDate: item.date || item.start_date || new Date().toISOString().substring(0, 10),
            endDate: item.date || item.end_date || new Date().toISOString().substring(0, 10),
            reason: item.reason || 'Lý do sức khỏe gia đình',
            status: item.status || 'PENDING',
            submittedAt: item.createdAt || item.created_at || new Date().toLocaleString('vi-VN'),
          };
        });
        setLeaveHistory(rows);
      } else {
        setLeaveHistory([]);
      }

      // 3. Tải danh sách hóa đơn (finance.invoices)
      let invData: any[] | null = null;
      try {
        const { data, error } = await supabase
          .schema('finance')
          .from('invoices')
          .select('*')
          .order('month_year', { ascending: false });
        if (!error && data) invData = data;
        else {
          const { data: pubData } = await supabase
            .from('invoices')
            .select('*')
            .order('month_year', { ascending: false });
          if (pubData) invData = pubData;
        }
      } catch {
        const { data: pubData } = await supabase
          .from('invoices')
          .select('*')
          .order('month_year', { ascending: false });
        if (pubData) invData = pubData;
      }

      if (invData && invData.length > 0) {
        setInvoices(
          invData.map((inv: any) => ({
            id: inv.id,
            monthYear: inv.month_year || '10-2026',
            totalAmount: Number(inv.total_amount || 0),
            paidAmount: Number(inv.paid_amount || 0),
            status: inv.status || 'PENDING',
            dueDate: inv.due_date || '2026-10-10',
          }))
        );
      } else {
        setInvoices([]);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu phụ huynh:', err.message);
      setLeaveHistory([]);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParentData();
  }, []);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setSubmitMessage({ type: 'error', text: 'Vui lòng nhập lý do xin nghỉ cho bé' });
      return;
    }

    if (!selectedStudentId) {
      setSubmitMessage({ type: 'error', text: 'Chưa có thông tin học sinh để gửi đơn' });
      return;
    }

    // Backend rule: Không được nộp đơn trong ngày sau 08:00 AM
    if (isTodaySelected && isPast8AM) {
      setSubmitMessage({
        type: 'error',
        text: '❌ Quy chế Mầm non: Đơn xin nghỉ trong ngày sau 08:00 AM không được chấp nhận tự động. Vui lòng gọi điện trực tiếp cho Giáo viên chủ nhiệm để báo ăn!',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      try {
        await attendanceApi.submitLeaveRequest({
          studentId: selectedStudentId,
          date: startDate,
          reason: reason.trim(),
        });
      } catch {
        // Fallback ghi trực tiếp Supabase (hỗ trợ attendance.leave_requests & public)
        const payload = {
          student_id: selectedStudentId,
          date: startDate,
          reason: reason.trim(),
          status: 'PENDING',
        };
        const aRes = await supabase.schema('attendance').from('leave_requests').insert([payload]);
        if (aRes.error) {
          const pubRes = await supabase.from('leave_requests').insert([payload]);
          if (pubRes.error) throw aRes.error;
        }
      }

      setSubmitMessage({
        type: 'success',
        text: '✅ Đã gửi đơn xin nghỉ thành công vào cơ sở dữ liệu Supabase!',
      });
      setReason('');
      await loadParentData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Không thể gửi đơn';
      setSubmitMessage({
        type: 'error',
        text: `⚠️ Lỗi khi gửi: ${errMsg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal sửa đơn xin nghỉ
  const handleOpenEditLeave = (item: LeaveRequestItem) => {
    setEditingLeaveId(item.id);
    setEditStudentName(item.studentName);
    setEditDate(item.startDate);
    setEditReason(item.reason);
    setShowEditLeaveModal(true);
  };

  // Cập nhật đơn xin nghỉ
  const handleUpdateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaveId || !editReason.trim()) return;

    setIsUpdatingLeave(true);
    try {
      const payload = {
        date: editDate,
        reason: editReason.trim(),
      };
      try {
        await attendanceApi.updateLeaveRequest(editingLeaveId, payload);
      } catch {
        const aRes = await supabase.schema('attendance').from('leave_requests').update(payload).eq('id', editingLeaveId);
        if (aRes.error) {
          const pubRes = await supabase.from('leave_requests').update(payload).eq('id', editingLeaveId);
          if (pubRes.error) throw aRes.error;
        }
      }

      setShowEditLeaveModal(false);
      setEditingLeaveId(null);
      setSubmitMessage({
        type: 'success',
        text: '✅ Đã cập nhật đơn xin nghỉ thành công!',
      });
      await loadParentData();
    } catch (err: any) {
      setSubmitMessage({
        type: 'error',
        text: `⚠️ Lỗi cập nhật đơn: ${err.message}`,
      });
    } finally {
      setIsUpdatingLeave(false);
    }
  };

  // Hủy / xóa đơn xin nghỉ
  const handleDeleteLeave = async (id: string) => {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn hủy đơn xin nghỉ này?')) return;

    try {
      try {
        await attendanceApi.deleteLeaveRequest(id);
      } catch {
        const aRes = await supabase.schema('attendance').from('leave_requests').delete().eq('id', id);
        if (aRes.error) {
          const pubRes = await supabase.from('leave_requests').delete().eq('id', id);
          if (pubRes.error) throw aRes.error;
        }
      }

      setSubmitMessage({
        type: 'success',
        text: '✅ Đã hủy đơn xin nghỉ thành công!',
      });
      await loadParentData();
    } catch (err: any) {
      setSubmitMessage({
        type: 'error',
        text: `⚠️ Lỗi hủy đơn: ${err.message}`,
      });
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      {/* Header trang & Thông tin Con */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md mb-2">
            <Baby className="h-3.5 w-3.5 text-pink-300" />
            <span>
              {currentStudent
                ? `Học sinh: ${currentStudent.fullName} • ${currentStudent.className}`
                : 'Cổng Phụ Huynh Học Sinh'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Cổng Phụ Huynh Mầm Non</h2>
          <p className="mt-1 text-xs text-purple-100">
            Theo dõi điểm danh, nộp đơn xin nghỉ có phép và tra cứu quyết toán học phí của con
          </p>
        </div>

        <button
          onClick={loadParentData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-3.5 py-2 text-xs font-semibold backdrop-blur-md hover:bg-white/30 transition text-white self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('leave')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'leave'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Xin nghỉ học (Hạn 08:00 AM) ({leaveHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoice')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'invoice'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>Học phí & VietQR ({invoices.length})</span>
        </button>
      </div>

      {/* Tab 1: Đơn xin nghỉ phép */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột Trái: Form Nộp đơn */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Gửi Đơn Xin Nghỉ Mới</span>
            </h3>

            {/* Banner Cảnh báo Quy tắc 08:00 AM */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-xs text-amber-800">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Quy tắc Hạn chót 08:00 AM:</span>
              </div>
              <p>
                Đơn xin nghỉ cho ngày hôm nay phải được nộp trước <strong>08:00 AM</strong> để được hoàn trừ tiền ăn ngày vào quyết toán học phí tháng.
              </p>
            </div>

            {submitMessage && (
              <div
                className={`rounded-xl p-3 mb-4 text-xs ${
                  submitMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {submitMessage.text}
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chọn con em</label>
                <select
                  value={selectedStudentId}
                  disabled={students.length === 0}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {students.length === 0 ? (
                    <option value="">-- Chưa có học sinh trong Database --</option>
                  ) : (
                    students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.className})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đến hết ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lý do xin nghỉ</label>
                <textarea
                  rows={3}
                  placeholder="vd: Cháu bị sốt nhẹ, gia đình xin nghỉ 1 ngày..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || students.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}</span>
              </button>
            </form>
          </div>

          {/* Cột Phải: Lịch sử đơn xin nghỉ */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Lịch sử Đơn xin nghỉ của Con</h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs text-slate-500">Đang tải lịch sử đơn...</p>
              </div>
            ) : leaveHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2 text-slate-400">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-600">Chưa có đơn xin nghỉ nào</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Bảng leave_requests trên Supabase hiện chưa có bản ghi xin nghỉ nào.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveHistory.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50/50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-500">{item.code}</span>
                        <span className="text-xs font-bold text-slate-800">
                          {formatDate(item.startDate)} {item.startDate !== item.endDate && `→ ${formatDate(item.endDate)}`}
                        </span>
                        <span className="text-xs text-slate-500">({item.studentName})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.status === 'APPROVED' && 'Đã duyệt'}
                          {item.status === 'REJECTED' && 'Từ chối'}
                          {item.status === 'PENDING' && 'Đang chờ duyệt'}
                        </span>

                        {item.id && item.status === 'PENDING' && (
                          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                            <button
                              onClick={() => handleOpenEditLeave(item)}
                              className="text-slate-400 hover:text-indigo-600 transition p-1 rounded-md hover:bg-slate-100"
                              title="Sửa đơn xin nghỉ"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLeave(item.id)}
                              className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-slate-100"
                              title="Hủy đơn xin nghỉ"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2">{item.reason}</p>
                    <p className="text-[11px] text-slate-400 mt-2">Gửi lúc: {formatDate(item.submittedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Hóa đơn & VietQR */}
      {activeTab === 'invoice' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
              <p className="text-sm font-medium text-slate-600">Đang tải hóa đơn học phí...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-200">
              <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <Inbox className="h-7 w-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-700">Chưa có thông báo học phí</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Cơ sở dữ liệu Supabase hiện chưa có hóa đơn học phí nào được tạo cho tài khoản này.
              </p>
            </div>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Thông báo Học phí Tháng {inv.monthYear}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Mã hóa đơn: INV-{inv.id.substring(0, 8)}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {inv.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHỜ ĐÓNG TIỀN'}
                  </span>
                </div>

                <div className="py-4 space-y-3 text-xs">
                  <div className="flex justify-between text-base font-extrabold text-slate-900">
                    <span>Số tiền cần thanh toán:</span>
                    <span className="text-indigo-600">{formatCurrency(inv.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Hạn nộp:</span>
                    <span>{formatDate(inv.dueDate)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <button
                    onClick={() => setSelectedInvoiceForQr(inv)}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Xem Mã VietQR</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal QR của Phụ huynh */}
      {selectedInvoiceForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <h3 className="text-lg font-bold text-slate-800">Mã VietQR Chuyển khoản</h3>
            <p className="text-xs text-slate-500 mt-1">Đơn hàng tự động khớp lệnh không cần gửi sao kê</p>

            <div className="my-5 flex justify-center">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 inline-block">
                <img
                  src={`https://api.vietqr.io/image/970422-0987654321-compact.jpg?amount=${selectedInvoiceForQr.totalAmount}&addInfo=INV-${selectedInvoiceForQr.id.substring(0, 8)}&accountName=TRUONG%20MAM%20NON%20KIDPRO`}
                  alt="VietQR"
                  className="rounded-2xl border border-slate-200 shadow-md max-w-[200px]"
                />
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoiceForQr(null)}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-900 transition"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL SỬA ĐƠN XIN NGHỈ ================= */}
      {showEditLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-indigo-600" />
                  <span>Chỉnh Sửa Đơn Xin Nghỉ Học</span>
                </h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">Học sinh: {editStudentName}</p>
              </div>
              <button
                onClick={() => setShowEditLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày xin nghỉ</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Lý do xin nghỉ</label>
                <textarea
                  rows={3}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Nhập lý do xin nghỉ mới..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditLeaveModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingLeave}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isUpdatingLeave ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>{isUpdatingLeave ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPage;
