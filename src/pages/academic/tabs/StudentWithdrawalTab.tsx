import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Download,
  Building,
  Calendar,
  School,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  FileCheck2,
  Receipt,
  UserX,
  Upload,
  Paperclip,
  X
} from 'lucide-react';
import { withdrawalService } from '../../../services/withdrawalService';
import { studentService } from '../../../services/studentService';
import { useToast } from '../../../contexts/ToastContext';
import {
  WithdrawalRequestItem,
  WithdrawalStatus,
  FinancialCheckResult,
  DossierExportData
} from '../../../types/withdrawal.types';

export const StudentWithdrawalTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudentForWithdrawal, setSelectedStudentForWithdrawal] = useState<string>('');
  const [studentSearchQuery, setStudentSearchQuery] = useState<string>('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [destinationSchoolInput, setDestinationSchoolInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');
  const [expectedDateInput, setExpectedDateInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');

  const [financialCheckTarget, setFinancialCheckTarget] = useState<WithdrawalRequestItem | null>(null);
  const [completingTarget, setCompletingTarget] = useState<WithdrawalRequestItem | null>(null);
  const [exportDossierTarget, setExportDossierTarget] = useState<DossierExportData | null>(null);
  const [isLoadingDossier, setIsLoadingDossier] = useState(false);

  // Queries
  const { data: withdrawalData, isLoading: isLoadingRequests } = useQuery({
    queryKey: ['student-withdrawals', selectedStatus],
    queryFn: () =>
      withdrawalService.getRequests({
        status: selectedStatus !== 'ALL' ? (selectedStatus as WithdrawalStatus) : undefined,
        size: 50,
      }),
  });
  const requests: WithdrawalRequestItem[] = withdrawalData?.content || [];

  const { data: studentsData } = useQuery({
    queryKey: ['students-for-withdrawal-select'],
    queryFn: () => studentService.getStudents({ size: 100 }),
    enabled: isCreateModalOpen,
  });
  const studentList = studentsData?.content || [];

  const filteredSearchStudents = studentList.filter((s: any) => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase();
    const name = (s.fullName || s.name || '').toLowerCase();
    const code = (s.studentCode || s.code || '').toLowerCase();
    const cls = (s.className || '').toLowerCase();
    return name.includes(q) || code.includes(q) || cls.includes(q);
  });

  // Financial check query for target modal
  const { data: financialData, isLoading: isLoadingFinancial } = useQuery<FinancialCheckResult>({
    queryKey: ['financial-check', financialCheckTarget?.id],
    queryFn: () => withdrawalService.checkDebt(financialCheckTarget!.id),
    enabled: !!financialCheckTarget,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => withdrawalService.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-withdrawals'] });
      success('Tiếp nhận đơn xin rút học bạ và chuyển trường thành công.');
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || err?.message || 'Lỗi khi tạo đơn rút học bạ.');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => withdrawalService.completeWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['academic-classes'] });
      success('Xử lý hồ sơ rút học bạ và chuyển trường thành công.');
      setCompletingTarget(null);
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code;
      const msg = err?.response?.data?.message || err?.message;
      if (code === 'MSG-054' || msg?.includes('MSG-054') || msg?.includes('công nợ')) {
        error('Học sinh còn công nợ học phí chưa thanh toán, không thể hoàn tất bàn giao học bạ.');
      } else {
        error(msg || 'Lỗi khi hoàn tất thủ tục bàn giao học bạ.');
      }
    },
  });

  const resetCreateForm = () => {
    setSelectedStudentForWithdrawal('');
    setStudentSearchQuery('');
    setIsStudentDropdownOpen(false);
    setAttachedFile(null);
    setDestinationSchoolInput('');
    setReasonInput('');
    setExpectedDateInput('');
    setNotesInput('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForWithdrawal) {
      error('Vui lòng chọn học sinh xin rút học bạ.');
      return;
    }
    if (!destinationSchoolInput.trim()) {
      error('Vui lòng nhập tên trường tiếp nhận.');
      return;
    }
    if (!reasonInput.trim()) {
      error('Vui lòng nhập lý do xin chuyển trường.');
      return;
    }

    let finalNotes = notesInput.trim();
    if (attachedFile) {
      finalNotes = finalNotes ? `${finalNotes} (Tệp đính kèm: ${attachedFile.name})` : `Tệp đính kèm: ${attachedFile.name}`;
    }

    createMutation.mutate({
      studentId: selectedStudentForWithdrawal,
      destinationSchool: destinationSchoolInput.trim(),
      reason: reasonInput.trim(),
      expectedDate: expectedDateInput || undefined,
      notes: finalNotes || undefined,
    });
  };

  const handleOpenExport = async (req: WithdrawalRequestItem) => {
    setIsLoadingDossier(true);
    try {
      const data = await withdrawalService.exportDossier(req.id);
      setExportDossierTarget(data);
    } catch (err: any) {
      error(err?.message || 'Lỗi khi tải thông tin hồ sơ bàn giao.');
    } finally {
      setIsLoadingDossier(false);
    }
  };

  // Filtered requests list
  const filteredRequests = requests.filter((r) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(kw) ||
      r.studentCode.toLowerCase().includes(kw) ||
      r.destinationSchool.toLowerCase().includes(kw) ||
      (r.className && r.className.toLowerCase().includes(kw))
    );
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const completedCount = requests.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Đơn Tiếp Nhận</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{requests.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chờ Kiểm Tra Quyết Toán</p>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Đã Hoàn Tất Bàn Giao</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{completedCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#1E4D40]/10 flex items-center justify-center text-[#1E4D40]">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Xử Lý Hồ Sơ Rút Học Bạ & Chuyển Trường
              </h2>
              <p className="text-xs text-slate-500">
                Đối chiếu quy chuẩn tài chính BR-017, xuất biên bản bàn giao hồ sơ y tế và đóng sĩ số lớp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-[#1E4D40] text-white text-xs font-bold rounded-2xl shadow-sm hover:opacity-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E5A93C]" />
            <span>+ Tiếp Nhận Đơn Chuyển Trường</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Trạng thái hồ sơ</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
            >
              <option value="ALL">-- Tất cả trạng thái --</option>
              <option value="PENDING">Chờ xử lý / Kiểm tra nợ</option>
              <option value="COMPLETED">Đã hoàn tất bàn giao (COMPLETED)</option>
              <option value="CANCELLED">Đã hủy bỏ</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">Tìm kiếm hồ sơ</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nhập tên học sinh, mã định danh, trường tiếp nhận hoặc lớp..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoadingRequests ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#1E4D40] mb-3" />
            <p className="text-slate-500 text-xs font-medium">Đang tải danh sách hồ sơ chuyển trường...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Chưa có hồ sơ rút học bạ nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Không tìm thấy hồ sơ phù hợp. Nhấn nút "+ Tiếp Nhận Đơn Chuyển Trường" để tạo hồ sơ cho học sinh.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Học Sinh</th>
                  <th className="py-3.5 px-4">Lớp Hiện Tại</th>
                  <th className="py-3.5 px-4">Trường Chuyển Đến</th>
                  <th className="py-3.5 px-4">Lý Do Rút Hồ Sơ</th>
                  <th className="py-3.5 px-4">Quyết Toán Tài Chính</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRequests.map((req) => {
                  const fin = req.financialCheck;
                  const hasDebt = fin ? fin.hasOutstandingDebt : false;

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Học sinh */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{req.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{req.studentCode}</div>
                      </td>

                      {/* Lớp */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {req.className || 'Chưa phân lớp'}
                        </span>
                      </td>

                      {/* Trường tiếp nhận */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.destinationSchool}</span>
                        </div>
                        {req.expectedDate && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Dự kiến: {req.expectedDate}
                          </div>
                        )}
                      </td>

                      {/* Lý do */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-slate-600" title={req.reason}>
                          {req.reason}
                        </p>
                      </td>

                      {/* Công nợ tài chính */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => setFinancialCheckTarget(req)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                            hasDebt
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          {hasDebt ? (
                            <span>Còn nợ ({fin?.totalDebtAmount?.toLocaleString('vi-VN')} đ)</span>
                          ) : (
                            <span>Đã tất toán (0 đ)</span>
                          )}
                        </button>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        {req.status === 'COMPLETED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất
                          </span>
                        ) : req.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 text-slate-600">
                            <XCircle className="w-3.5 h-3.5" /> Đã hủy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => setCompletingTarget(req)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-2xs transition cursor-pointer"
                              title="Kiểm tra & Xác nhận hoàn tất thủ tục bàn giao"
                            >
                              Hoàn tất thủ tục
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenExport(req)}
                            disabled={isLoadingDossier}
                            className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
                            title="Xuất phiếu bàn giao học bạ & Sổ sức khỏe"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TIẾP NHẬN ĐƠN RÚT HỌC BẠ MỚI */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 text-[#1E4D40]">
                <FileCheck2 className="w-5 h-5 text-[#E5A93C]" />
                <h3 className="text-base font-extrabold">Tiếp Nhận Đơn Rút Học Bạ & Chuyển Trường</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="relative">
                <label className="block text-slate-600 font-bold mb-1">
                  Chọn học sinh xin chuyển trường <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên hoặc mã học sinh để tìm kiếm nhanh..."
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      setIsStudentDropdownOpen(true);
                      if (!e.target.value) {
                        setSelectedStudentForWithdrawal('');
                      }
                    }}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                    required={!selectedStudentForWithdrawal}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {selectedStudentForWithdrawal && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForWithdrawal('');
                        setStudentSearchQuery('');
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Chọn lại học sinh"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {isStudentDropdownOpen && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                    {filteredSearchStudents.length === 0 ? (
                      <div className="p-3 text-center text-slate-400 text-xs">
                        Không tìm thấy học sinh nào phù hợp
                      </div>
                    ) : (
                      filteredSearchStudents.slice(0, 30).map((s: any) => {
                        const sId = s.id || s.studentId;
                        const sName = s.fullName || s.name;
                        const sCode = s.studentCode || s.code;
                        const sClass = s.className || 'Chưa phân lớp';
                        return (
                          <div
                            key={sId}
                            onMouseDown={() => {
                              setSelectedStudentForWithdrawal(sId);
                              setStudentSearchQuery(`${sName} (${sCode}) - Lớp: ${sClass}`);
                              setIsStudentDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-800">{sName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">Mã: {sCode}</p>
                            </div>
                            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                              {sClass}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Trường tiếp nhận mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Trường Mầm Non Thực Nghiệm Hoa Sen..."
                  value={destinationSchoolInput}
                  onChange={(e) => setDestinationSchoolInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Lý do xin chuyển trường / rút hồ sơ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Nhập lý do chi tiết (chuyển chỗ ở, nguyện vọng gia đình, ra nước ngoài...)"
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Ngày dự kiến bàn giao</label>
                  <input
                    type="date"
                    value={expectedDateInput}
                    onChange={(e) => setExpectedDateInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Ghi chú thêm & Đính kèm</label>
                  <input
                    type="text"
                    placeholder="Ghi chú giấy tờ tiếp nhận..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#78C2AD] focus:outline-none mb-1.5"
                  />
                  {attachedFile ? (
                    <div className="flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="font-bold text-emerald-900 truncate">{attachedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-1.5 px-2.5 py-1 border border-dashed border-slate-300 hover:border-emerald-500 rounded-xl cursor-pointer text-slate-600 hover:text-emerald-700 text-[11px] transition-colors w-fit">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Đính kèm tệp văn bản</span>
                      <input
                        type="file"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setAttachedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Quy tắc:</strong> Sau khi tiếp nhận, hệ thống sẽ đối chiếu dữ liệu công nợ học phí từ phân hệ Kế toán. Chỉ được bàn giao học bạ khi đã hoàn tất nghĩa vụ tài chính.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1E4D40] hover:bg-[#16382E] shadow-sm transition"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu Đơn Tiếp Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: KIỂM TRA QUYẾT TOÁN TÀI CHÍNH */}
      {financialCheckTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 text-slate-900">
                <Receipt className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-extrabold">Kiểm Tra Quyết Toán Tài Chính</h3>
              </div>
              <button
                type="button"
                onClick={() => setFinancialCheckTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {isLoadingFinancial ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-700 mb-2" />
                <p className="text-xs text-slate-500">Đang đối chiếu dữ liệu hóa đơn học phí...</p>
              </div>
            ) : financialData ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div>Học sinh: <span className="font-extrabold text-slate-900">{financialData.studentName}</span> ({financialData.studentCode})</div>
                  <div>Trường chuyển đến: <span className="font-semibold text-slate-700">{financialCheckTarget.destinationSchool}</span></div>
                </div>

                {financialData.hasOutstandingDebt ? (
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>CẢNH BÁO VI PHẠM BR-017 (MÃ LỖI: MSG-054)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-rose-900">
                      Học sinh hiện còn tồn đọng <strong>{financialData.totalDebtAmount.toLocaleString('vi-VN')} đ</strong> học phí chưa thanh toán ({financialData.unpaidInvoicesCount} hóa đơn chưa nộp, {financialData.overdueInvoicesCount} hóa đơn quá hạn).
                    </p>
                    <p className="text-[11px] font-bold text-rose-700">
                      Theo quy định, không thể hoàn tất bàn giao học bạ gốc khi chưa tất toán công nợ.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-800">Đủ điều kiện hoàn tất thủ tục</div>
                      <p className="text-[11px] text-emerald-900 mt-0.5">
                        Toàn bộ các kỳ học phí đã được tất toán (Dư nợ = 0 đ). Đủ điều kiện bàn giao học bạ gốc và sổ theo dõi sức khỏe cho phụ huynh.
                      </p>
                    </div>
                  </div>
                )}

                {/* Danh sách hóa đơn chưa thanh toán nếu có */}
                {financialData.unpaidInvoices && financialData.unpaidInvoices.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-slate-600 text-[11px] uppercase tracking-wider">Chi tiết hóa đơn tồn đọng:</p>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {financialData.unpaidInvoices.map((inv) => (
                        <div key={inv.invoiceId} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{inv.invoiceCode}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">Tháng {inv.billingMonth}/{inv.billingYear}</span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">
                            {inv.finalAmount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setFinancialCheckTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN HOÀN TẤT BÀN GIAO HỌC BẠ */}
      {completingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 mb-4 text-purple-950">
              <div className="h-10 w-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold">Xác Nhận Hoàn Tất Thủ Tục Chuyển Trường</h3>
                <p className="text-xs text-slate-500">Nghiệp vụ rút hồ sơ & Bàn giao hồ sơ gốc</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div>Học sinh: <span className="font-extrabold text-slate-900">{completingTarget.studentName}</span> ({completingTarget.studentCode})</div>
                <div>Lớp hiện tại: <span className="font-bold text-slate-800">{completingTarget.className || 'Chưa phân lớp'}</span></div>
                <div>Trường tiếp nhận: <span className="font-bold text-purple-900">{completingTarget.destinationSchool}</span></div>
              </div>

              {completingTarget.financialCheck?.hasOutstandingDebt ? (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Không thể hoàn tất:</span> Học sinh hiện còn nợ học phí chưa thanh toán ({completingTarget.financialCheck.totalDebtAmount.toLocaleString('vi-VN')} đ). Vui lòng yêu cầu phụ huynh tất toán tại phòng Kế toán trước khi bàn giao.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Đã kiểm tra tài chính:</span> Đủ điều kiện bàn giao học bạ. Sau khi xác nhận:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-emerald-900">
                      <li>Trạng thái học sinh sẽ chuyển thành <strong>Đã chuyển trường (WITHDRAWN)</strong></li>
                      <li>Rút học sinh khỏi lớp hiện tại và giảm sĩ số thực tế của lớp</li>
                      <li>Hồ sơ học vụ được lưu trữ lịch sử và sẵn sàng xuất phiếu bàn giao</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingTarget(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={() => completeMutation.mutate(completingTarget.id)}
                  disabled={completeMutation.isPending || completingTarget.financialCheck?.hasOutstandingDebt}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
                >
                  {completeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác Nhận Hoàn Tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: XEM & IN PHIẾU BÀN GIAO HỌC BẠ (DOSSIER EXPORT) */}
      {exportDossierTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 print:hidden">
              <div className="flex items-center gap-2 text-[#1E4D40]">
                <Printer className="w-5 h-5 text-[#E5A93C]" />
                <h3 className="text-base font-extrabold">Phiếu Bàn Giao Học Bạ & Sổ Theo Dõi Sức Khỏe</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#1E4D40] hover:bg-[#16382E] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> In Phiếu
                </button>
                <button
                  type="button"
                  onClick={() => setExportDossierTarget(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-5 text-xs text-slate-800 print:bg-white print:border-none print:p-0">
              <div className="text-center space-y-1 pb-3 border-b border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">HỆ THỐNG MẦM NON THÔNG MINH KIDPRO</h4>
                <h2 className="text-base font-black text-[#1E4D40] uppercase">
                  BIÊN BẢN BÀN GIAO HỌC BẠ & HỒ SƠ HỌC VỤ
                </h2>
                <p className="text-[11px] text-slate-400">Số biên bản: BG-{exportDossierTarget.studentCode}-{exportDossierTarget.handoverDate.replace(/-/g, '')}</p>
              </div>

              {/* Thông tin học sinh */}
              <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                <div>Họ và tên học sinh: <strong className="text-slate-900">{exportDossierTarget.studentName}</strong></div>
                <div>Mã học sinh duy nhất: <strong className="font-mono text-slate-900">{exportDossierTarget.studentCode}</strong></div>
                <div>Ngày sinh: <strong>{exportDossierTarget.dateOfBirth}</strong></div>
                <div>Giới tính: <strong>{exportDossierTarget.gender === 'MALE' ? 'Nam' : 'Nữ'}</strong></div>
                <div>Lớp trước khi chuyển: <strong>{exportDossierTarget.className}</strong></div>
                <div>Niên khóa: <strong>{exportDossierTarget.academicYear}</strong></div>
              </div>

              {/* Thông tin chuyển trường */}
              <div className="space-y-1.5">
                <p className="font-extrabold text-[#1E4D40] uppercase tracking-wider text-[11px]">I. THÔNG TIN CHUYỂN TRƯỜNG:</p>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div>Trường tiếp nhận: <strong>{exportDossierTarget.destinationSchool}</strong></div>
                  <div>Lý do xin chuyển: <em>{exportDossierTarget.reason}</em></div>
                  <div>Tình trạng tài chính: <strong className="text-emerald-700">Đã tất toán toàn bộ học phí</strong></div>
                </div>
              </div>

              {/* Tóm tắt hồ sơ y tế & học tập */}
              <div className="space-y-1.5">
                <p className="font-extrabold text-[#1E4D40] uppercase tracking-wider text-[11px]">II. DANH MỤC HỒ SƠ BÀN GIAO:</p>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div>✓ <strong>Học bạ mầm non chính quy:</strong> {exportDossierTarget.academicPerformanceSummary}</div>
                  <div>✓ <strong>Sổ theo dõi sức khỏe & tiêm chủng:</strong> {exportDossierTarget.healthSummary}. {exportDossierTarget.immunizationStatus}</div>
                  <div>✓ <strong>Ghi chú bàn giao:</strong> {exportDossierTarget.handoverNote}</div>
                </div>
              </div>

              {/* Chữ ký bàn giao */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div className="space-y-12">
                  <p className="font-bold text-slate-700">ĐẠI DIỆN PHỤ HUYNH HỌC SINH</p>
                  <p className="text-[11px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <div className="space-y-12">
                  <div>
                    <p className="font-bold text-slate-700">CÁN BỘ GIÁO VỤ BÀN GIAO</p>
                    <p className="text-[11px] text-slate-400 italic">{exportDossierTarget.handoverDate}</p>
                  </div>
                  <p className="font-bold text-slate-800">{exportDossierTarget.processedByName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
