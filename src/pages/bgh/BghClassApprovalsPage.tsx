import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  School,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { academicApi } from '../../api/academicApi';
import { ClassEntity } from '../../types/classroom.types';

export const BghClassApprovalsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isApprovingAll, setIsApprovingAll] = useState(false);

  // Lấy danh sách lớp trực tiếp từ backend Spring Boot
  const { data: classes = [], isLoading } = useQuery<ClassEntity[]>({
    queryKey: ['classes-approval-bgh'],
    queryFn: async () => {
      try {
        const res = await academicApi.getClasses();
        const raw = Array.isArray(res) ? res : ((res as any)?.data || []);
        return raw;
      } catch (err) {
        console.warn('Lỗi khi tải danh sách lớp học cho BGH:', err);
        return [];
      }
    },
  });

  // Xử lý phê duyệt / hủy ký duyệt từng lớp
  const handleToggleApprove = async (c: ClassEntity) => {
    setLoadingId(c.id);
    const targetStatus = c.status === 'APPROVED' ? 'PENDING' : 'APPROVED';
    try {
      await academicApi.approveClass(c.id, targetStatus);
      await queryClient.invalidateQueries({ queryKey: ['classes-approval-bgh'] });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      setToastMessage(
        targetStatus === 'APPROVED'
          ? `Hiệu trưởng đã phê duyệt cơ cấu lớp "${c.name}".`
          : `Đã chuyển lớp "${c.name}" về trạng thái chờ BGH duyệt.`
      );
    } catch (err) {
      console.error(err);
      setToastMessage('Không thể cập nhật trạng thái phê duyệt. Vui lòng thử lại.');
    } finally {
      setLoadingId(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Xử lý phê duyệt toàn bộ cơ cấu lớp
  const handleApproveAll = async () => {
    if (classes.length === 0) return;
    setIsApprovingAll(true);
    try {
      await academicApi.approveAllClasses();
      await queryClient.invalidateQueries({ queryKey: ['classes-approval-bgh'] });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      setToastMessage('Hiệu trưởng đã phê duyệt hoàn tất toàn bộ cơ cấu lớp học niên khóa 2026-2027.');
    } catch (err) {
      console.error(err);
      setToastMessage('Không thể phê duyệt toàn bộ cơ cấu lớp. Vui lòng thử lại.');
    } finally {
      setIsApprovingAll(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const totalClasses = classes.length;
  const approvedCount = classes.filter((c) => c.status === 'APPROVED').length;
  const totalCapacity = classes.reduce((sum, c) => sum + (c.maxCapacity || c.capacity || 25), 0);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ DÀNH RIÊNG CHO BGH (UC-010) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-[#1E4D40] text-white p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ban Giám Hiệu • Quyền Hạn Phê Duyệt Học Vụ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <School className="h-8 w-8 text-[#78C2AD]" />
            <span>Phê Duyệt Cấu Trúc Lớp Học Mới (UC-010)</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl">
            Thẩm tra phương án quy mô lớp học, chỉ tiêu sĩ số từng độ tuổi, định biên phòng học và phân công Giáo viên Chủ nhiệm do Bộ phận Giáo vụ trình duyệt.
          </p>
        </div>

        {/* NÚT PHÊ DUYỆT TOÀN DIỆN */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApproveAll}
            disabled={isApprovingAll || totalClasses === 0}
            className="px-5 py-3 bg-[#E5A93C] hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-md min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isApprovingAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
            )}
            <span>{isApprovingAll ? 'Đang Xử Lý...' : 'Phê Duyệt Toàn Bộ Cơ Cấu Lớp'}</span>
          </button>
        </div>
      </div>

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-[#78C2AD] rounded-2xl flex items-center gap-3 text-[#1E4D40] text-sm font-bold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#275A4E] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CHỈ SỐ QUY MÔ TRƯỜNG */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Lớp Đề Xuất</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">{totalClasses} lớp</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Đã Ký Duyệt</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">
            {approvedCount} / {totalClasses}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Chỉ Tiêu Sĩ Số</span>
          <span className="text-2xl font-black text-[#275A4E] mt-1 block">{totalCapacity} trẻ</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Tiêu Chuẩn BGD&amp;ĐT</span>
          <span className="text-base font-bold text-amber-800 mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Đạt Chuẩn Mầm Non</span>
          </span>
        </div>
      </div>

      {/* DANH SÁCH LỚP HỌC CHỜ DUYỆT */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#275A4E]" />
            <span>Bảng Đề Xuất Cơ Cấu Lớp Học Niên Khóa 2026 - 2027</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Thẩm quyền: Hiệu trưởng / BGH (Căn cứ Thông tư 52/2020/TT-BGDĐT)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Tên Lớp Học</th>
                <th className="py-3 px-4">Độ Tuổi / Khối</th>
                <th className="py-3 px-4">Phòng Học</th>
                <th className="py-3 px-4">Sĩ Số Tối Đa</th>
                <th className="py-3 px-4">Giáo Viên Chủ Nhiệm (Đề Xuất)</th>
                <th className="py-3 px-4 text-center">Trạng Thái BGH</th>
                <th className="py-3 px-4 text-right">Thao Tác Ký Duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#275A4E] mb-2" />
                    <p className="text-sm font-medium">Đang tải danh sách cơ cấu lớp học...</p>
                  </td>
                </tr>
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Chưa có lớp học nào được đề xuất cho niên khóa này</p>
                  </td>
                </tr>
              ) : (
                classes.map((c) => {
                  const status = c.status || 'PENDING';
                  const isApproved = status === 'APPROVED';
                  const isRowLoading = loadingId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#275A4E] font-extrabold flex items-center justify-center shrink-0">
                          {c.name ? c.name.slice(0, 2).toUpperCase() : 'LH'}
                        </div>
                        <span>{c.name}</span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold">{c.ageGroup || '3-4 tuổi'}</td>
                      <td className="py-4 px-4 text-slate-600 font-mono text-xs">{c.roomNumber || c.roomName || 'Phòng 101'}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{c.maxCapacity || c.capacity || 25} trẻ</td>
                      <td className="py-4 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#275A4E] shrink-0" />
                          <span>{c.teacherName || 'Chưa phân công'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Đã Duyệt</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Chờ BGH Duyệt</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleApprove(c)}
                          disabled={isRowLoading || isApprovingAll}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                            isApproved
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-2xs'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
                        >
                          {isRowLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isApproved ? 'Hủy Ký Duyệt' : 'Phê Duyệt Lớp'}</span>
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
    </div>
  );
};

export default BghClassApprovalsPage;
