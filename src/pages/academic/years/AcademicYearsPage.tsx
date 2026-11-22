import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import academicYearApi from '../../../api/academicYearApi';
import { AcademicYear, CreateAcademicYearInput, AcademicYearStatus } from '../../../types/academicYear.types';
import { useToast } from '../../../contexts/ToastContext';
import { formatDate } from '../../../utils/formatters';
import { calculateWeeksBetween } from './components/AcademicYearModal';
import AcademicYearModal from './components/AcademicYearModal';
import ArchiveYearModal from './components/ArchiveYearModal';
import {
  GraduationCap,
  Calendar,
  Plus,
  Filter,
  Pencil,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AcademicYearsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | AcademicYearStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [archivingYear, setArchivingYear] = useState<AcademicYear | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // TanStack React Query
  const { data: years = [], isLoading, refetch, isFetching } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years-list', statusFilter],
    queryFn: () => academicYearApi.getAcademicYears(statusFilter),
  });

  const activeYear = years.find((y) => y.status === 'ACTIVE');
  const readyYear = years.find((y) => y.status === 'READY');

  // Mutation Cập nhật trạng thái linh hoạt (READY / PLANNING / CLOSED)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AcademicYearStatus }) => {
      return await academicYearApi.updateStatus(id, status);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-academic-year'] });
      queryClient.invalidateQueries({ queryKey: ['academicYears'] });
      success(data?.statusMessage || data?.notes || 'Cập nhật trạng thái niên khóa thành công.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái niên khóa.';
      error(msg);
    },
  });

  // Mutation Tạo/Sửa
  const saveMutation = useMutation({
    mutationFn: async (data: CreateAcademicYearInput) => {
      if (editingYear) {
        return await academicYearApi.updateAcademicYear(editingYear.id, data);
      }
      return await academicYearApi.createAcademicYear(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      success('Thiết lập năm học thành công');
      setIsModalOpen(false);
      setEditingYear(null);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
      error(msg);
    },
  });

  // Mutation Lưu trữ / Đóng
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicYearApi.archiveAcademicYear(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      success('Đã chuyển niên khóa sang trạng thái lưu trữ thành công');
      setArchivingYear(null);
    },
    onError: (err: any) => {
      error(err?.message || 'Không thể kết nối đến máy chủ.');
    },
  });

  // Mutation Kích hoạt (Chuyển sang ACTIVE)
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicYearApi.updateStatus(id, 'ACTIVE');
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      queryClient.invalidateQueries({ queryKey: ['active-academic-year'] });
      success(data?.notes || 'Đã kích hoạt áp dụng niên khóa mới thành công.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể kích hoạt niên khóa.';
      error(msg);
    },
  });

  // Mutation Xóa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicYearApi.deleteAcademicYear(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      success('Đã xóa niên khóa thành công');
      setDeletingId(null);
    },
    onError: (err: any) => {
      error(err?.message || 'Không thể xóa niên khóa');
      setDeletingId(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingYear(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (year: AcademicYear) => {
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateAcademicYearInput) => {
    await saveMutation.mutateAsync(data);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa niên khóa này không? Thao tác này không thể hoàn tác.')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
  };

  const filteredYears = years.filter((y) => {
    if (statusFilter === 'ALL') return true;
    return y.status === statusFilter;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Top Banner Tiêu Đề */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Năm Học</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#78C2AD] text-[#1E4D40] hover:bg-[#68b49f] px-5 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Niên Khóa Mới</span>
          </button>
        </div>
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Filter className="w-4 h-4 text-[#275A4E]" />
          <span>Lọc theo trạng thái:</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'ALL' as const, label: 'Tất cả niên khóa' },
            { id: 'ACTIVE' as const, label: 'Đang áp dụng (ACTIVE)' },
            { id: 'READY' as const, label: 'Sẵn sàng tiếp nhận (READY)' },
            { id: 'PLANNING' as const, label: 'Đang chuẩn bị (PLANNING)' },
            { id: 'CLOSED' as const, label: 'Đã lưu trữ (CLOSED)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${statusFilter === tab.id
                ? 'bg-[#275A4E] text-white shadow-2xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng Danh Sách Niên Khóa (Data Table) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Tên Niên Khóa</th>
                <th className="py-3.5 px-4">Ngày Bắt Đầu</th>
                <th className="py-3.5 px-4">Ngày Kết Thúc</th>
                <th className="py-3.5 px-4 text-center">Số Tuần Học</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredYears.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#275A4E]" />
                    <p className="text-sm font-semibold">Chưa có niên khóa nào phù hợp bộ lọc</p>
                    <p className="text-xs mt-0.5">Bấm nút "Tạo Niên Khóa Mới" để thiết lập năm học</p>
                  </td>
                </tr>
              ) : (
                filteredYears.map((item) => {
                  const weeks = calculateWeeksBetween(item.startDate, item.endDate);
                  const isCurrentActive = item.status === 'ACTIVE';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isCurrentActive ? 'bg-[#78C2AD]/5 font-medium' : ''
                        }`}
                    >
                      {/* Tên niên khóa */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#275A4E]" />
                        <span>Năm học {item.name}</span>
                      </td>

                      {/* Ngày bắt đầu */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{formatDate(item.startDate)}</span>
                      </td>

                      {/* Ngày kết thúc */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{formatDate(item.endDate)}</span>
                      </td>

                      {/* Số tuần học */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${weeks >= 35
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{weeks} tuần</span>
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        {isCurrentActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#78C2AD]/20 text-[#1E4D40] border border-[#78C2AD]/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E4D40] animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : item.status === 'READY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                            READY
                          </span>
                        ) : item.status === 'PLANNING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            PLANNING
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            CLOSED
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút chuyển Sẵn sàng (READY) hoặc Kích hoạt (ACTIVE) nếu đang PLANNING */}
                          {item.status === 'PLANNING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'READY' })}
                                disabled={updateStatusMutation.isPending}
                                title="Chuyển sang trạng thái Sẵn sàng (READY) để giáo vụ mở lớp và kết chuyển"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 mr-1"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Sẵn sàng</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => activateMutation.mutate(item.id)}
                                disabled={activateMutation.isPending}
                                title="Kích hoạt áp dụng chính thức niên khóa này (ACTIVE)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 mr-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Kích hoạt</span>
                              </button>
                            </>
                          )}

                          {/* Nút Kích hoạt (ACTIVE) hoặc Về chuẩn bị nếu đang READY */}
                          {item.status === 'READY' && (
                            <>
                              <button
                                type="button"
                                onClick={() => activateMutation.mutate(item.id)}
                                disabled={activateMutation.isPending}
                                title="Kích hoạt chính thức đưa vào vận hành ACTIVE"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 mr-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Kích hoạt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStatusMutation.mutate({ id: item.id, status: 'PLANNING' })}
                                disabled={updateStatusMutation.isPending}
                                title="Chuyển về trạng thái Đang chuẩn bị (PLANNING)"
                                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50 mr-1"
                              >
                                <span>Về chuẩn bị</span>
                              </button>
                            </>
                          )}

                          {/* Nút Sửa */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Nút Đóng / Lưu trữ */}
                          {item.status !== 'CLOSED' && (
                            <button
                              type="button"
                              onClick={() => setArchivingYear(item)}
                              title="Đóng niên khóa"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Nút Xóa (Chỉ cho phép xóa khi chưa CLOSED hoặc đang PLANNING) */}
                          {item.status !== 'ACTIVE' && item.status !== 'READY' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={deletingId === item.id}
                              title="Xóa niên khóa"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Niên Khóa */}
      <AcademicYearModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingYear(null);
        }}
        onSubmit={handleSave}
        initialData={editingYear}
        isLoading={saveMutation.isPending}
      />

      {/* Modal Đóng / Lưu Trữ Niên Khóa */}
      {archivingYear && (
        <ArchiveYearModal
          isOpen={Boolean(archivingYear)}
          onClose={() => setArchivingYear(null)}
          year={archivingYear}
          onConfirm={async (id: string) => {
            await archiveMutation.mutateAsync(id);
          }}
          isArchiving={archiveMutation.isPending}
        />
      )}
    </div>
  );
};

export default AcademicYearsPage;
