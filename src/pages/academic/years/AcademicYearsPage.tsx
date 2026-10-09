import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import academicYearApi from '../../../api/academicYearApi';
import { AcademicYear, CreateAcademicYearInput, AcademicYearStatus } from '../../../types/academicYear.types';
import { useToast } from '../../../contexts/ToastContext';
import { formatDate } from '../../../utils/formatters';
import { calculateWeeksBetween } from './components/AcademicYearModal';
import AcademicYearModal from './components/AcademicYearModal';
import ArchiveYearModal from './components/ArchiveYearModal';
import AcademicYearDetailModal from './components/AcademicYearDetailModal';
import {
  GraduationCap,
  Calendar,
  Plus,
  Filter,
  Eye,
  Pencil,
  Archive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';

export const AcademicYearsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [statusFilter, setStatusFilter] = useState<'ALL' | AcademicYearStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [detailYear, setDetailYear] = useState<AcademicYear | null>(null);
  const [archivingYear, setArchivingYear] = useState<AcademicYear | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // TanStack React Query
  const { data: years = [], isLoading, refetch, isFetching } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years-list', statusFilter],
    queryFn: () => academicYearApi.getAcademicYears(statusFilter),
  });

  const activeYear = years.find((y) => y.status === 'ACTIVE');

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
      success('MSG-033: Thiết lập năm học và kế hoạch tuyển sinh thành công');
      setIsModalOpen(false);
      setEditingYear(null);
    },
    onError: (err: any) => {
      const msg = err?.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
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
      success('Đã đóng và chuyển niên khóa sang trạng thái lưu trữ thành công');
      setArchivingYear(null);
    },
    onError: (err: any) => {
      error(err?.message || 'MSG-004: Không thể kết nối đến máy chủ.');
    },
  });

  // Mutation Kích hoạt (Chuyển sang ACTIVE)
  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicYearApi.updateAcademicYear(id, { status: 'ACTIVE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      success('Đã kích hoạt áp dụng niên khóa mới');
    },
    onError: (err: any) => {
      error(err?.message || 'MSG-004: Không thể kết nối đến máy chủ.');
    },
  });

  // Mutation Xóa
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicYearApi.deleteAcademicYear(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years-list'] });
      success('Đã xóa kế hoạch niên khóa thành công');
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

  const handleDelete = (year: AcademicYear) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa kế hoạch năm học ${year.name}?`)) {
      setDeletingId(year.id);
      deleteMutation.mutate(year.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#1E4D40] text-xs font-bold border border-emerald-300">
              UC-009 Academic Year Planning
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-500">BGH & Giáo vụ School Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 mt-1">
            Thiết Lập Kế Hoạch Năm Học & Tuyển Sinh
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý danh mục niên khóa, thiết lập mốc học kỳ I & II, định mức chỉ tiêu tuyển sinh cho các khối Nhà trẻ, Mầm, Chồi, Lá
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#275A4E] ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#78C2AD]" />
            <span>Thêm Năm Học Mới</span>
          </button>
        </div>
      </div>

      {/* Thẻ nổi bật: Niên khóa hiện hành đang kích hoạt (ACTIVE) */}
      {activeYear && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-[#275A4E]/10 to-teal-500/10 border-2 border-[#78C2AD] shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-[#275A4E] text-white shadow-xs shrink-0">
                <GraduationCap className="w-8 h-8 text-[#78C2AD]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Niên khóa vận hành hiện hành:
                  </span>
                  <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#78C2AD] text-[#1E4D40] shadow-xs flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1E4D40] animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">
                  Năm Học {activeYear.name}
                </h2>

                <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                  <span>
                    <strong>Thời gian:</strong> {formatDate(activeYear.startDate)} đến {formatDate(activeYear.endDate)}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Số tuần thực học:</strong> {calculateWeeksBetween(activeYear.startDate, activeYear.endDate)} tuần (Chuẩn Bộ GD&ĐT)
                  </span>
                </p>
              </div>
            </div>

            {/* Chỉ số nhanh của niên khóa Active */}
            <div className="flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Tổng Chỉ Tiêu</span>
                <span className="text-base font-bold text-slate-800">{activeYear.totalQuota} trẻ</span>
              </div>

              <div className="text-center px-3 border-r border-slate-200">
                <span className="text-[11px] text-slate-400 block font-medium">Đã Nhập Học</span>
                <span className="text-base font-bold text-[#275A4E]">
                  {activeYear.enrolledCount || 0} trẻ
                </span>
              </div>

              <div className="text-center px-3">
                <span className="text-[11px] text-slate-400 block font-medium">Tiến Độ Tuyển Sinh</span>
                <span className="text-base font-bold text-[#E5A93C]">
                  {activeYear.totalQuota > 0
                    ? Math.round(((activeYear.enrolledCount || 0) / activeYear.totalQuota) * 100)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
            { id: 'PLANNING' as const, label: 'Đang chuẩn bị (PLANNING)' },
            { id: 'CLOSED' as const, label: 'Đã lưu trữ (CLOSED)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.id
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
                <th className="py-3.5 px-4">Khung Thời Gian</th>
                <th className="py-3.5 px-4 text-center">Số Tuần Học</th>
                <th className="py-3.5 px-4 text-center">Tổng Chỉ Tiêu</th>
                <th className="py-3.5 px-4">Phân Bổ Từng Khối Lớp</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {years.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">Không tìm thấy niên khóa nào phù hợp với bộ lọc</p>
                  </td>
                </tr>
              ) : (
                years.map((year) => {
                  const weeks = calculateWeeksBetween(year.startDate, year.endDate);
                  const isUnderWeeks = weeks < 35;
                  const isActive = year.status === 'ACTIVE';
                  const isPlanning = year.status === 'PLANNING';
                  const isClosed = year.status === 'CLOSED';

                  return (
                    <tr key={year.id} className="hover:bg-slate-50/60 transition">
                      {/* Tên niên khóa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">{year.name}</span>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                          )}
                        </div>
                        {year.notes && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">{year.notes}</p>
                        )}
                      </td>

                      {/* Khung thời gian */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {formatDate(year.startDate)}
                        </span>
                        <span className="text-slate-400 mx-1.5">→</span>
                        <span className="font-semibold text-slate-800">
                          {formatDate(year.endDate)}
                        </span>
                      </td>

                      {/* Số tuần thực học */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isUnderWeeks
                              ? 'bg-rose-50 text-rose-700 border border-rose-300'
                              : 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                          }`}
                        >
                          {weeks} Tuần
                        </span>
                      </td>

                      {/* Tổng chỉ tiêu */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="text-sm font-extrabold text-slate-800">
                          {year.totalQuota}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Đã tuyển: {year.enrolledCount || 0}
                        </span>
                      </td>

                      {/* Chi tiết từng khối */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium" title="Nhà trẻ">
                            Nhà trẻ: {year.nurseryQuota}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium" title="Khối Mầm">
                            Mầm: {year.mamQuota}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium" title="Khối Chồi">
                            Chồi: {year.choiQuota}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium" title="Khối Lá">
                            Lá: {year.laQuota}
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                              : isPlanning
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {isActive ? 'ĐANG ÁP DỤNG' : isPlanning ? 'CHUẨN BỊ' : 'ĐÃ LƯU TRỮ'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Xem chi tiết */}
                          <button
                            type="button"
                            onClick={() => setDetailYear(year)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#275A4E] hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Chỉnh sửa */}
                          {!isClosed && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(year)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* Kích hoạt thành Active */}
                          {isPlanning && (
                            <button
                              type="button"
                              onClick={() => activateMutation.mutate(year.id)}
                              title="Kích hoạt năm học"
                              className="px-2 py-1 rounded-lg bg-emerald-50 text-[#275A4E] hover:bg-emerald-100 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Kích hoạt
                            </button>
                          )}

                          {/* Đóng & Lưu trữ (Archive) */}
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setArchivingYear(year)}
                              title="Đóng & Lưu trữ niên khóa"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}

                          {/* Xóa (chỉ xóa nếu PLANNING và chưa có học sinh) */}
                          {isPlanning && (
                            <button
                              type="button"
                              onClick={() => handleDelete(year)}
                              disabled={deletingId === year.id}
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

      {/* Modal Tạo/Sửa Niên Khóa */}
      <AcademicYearModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingYear(null);
        }}
        onSubmit={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        initialData={editingYear}
        isSubmitting={saveMutation.isPending}
      />

      {/* Modal Xem Chi Tiết */}
      <AcademicYearDetailModal
        isOpen={!!detailYear}
        year={detailYear}
        onClose={() => setDetailYear(null)}
      />

      {/* Modal Xác Nhận Lưu Trữ (Archive) */}
      <ArchiveYearModal
        isOpen={!!archivingYear}
        year={archivingYear}
        onClose={() => setArchivingYear(null)}
        onConfirm={async (id) => {
          await archiveMutation.mutateAsync(id);
        }}
        isArchiving={archiveMutation.isPending}
      />
    </div>
  );
};

export default AcademicYearsPage;
