import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import schoolSetupApi, { SchoolSetupDto } from '../../api/schoolSetupApi';
import { academicYearApi } from '../../api/academicYearApi';
import { AcademicYear } from '../../types/academicYear.types';
import { useToast } from '../../contexts/ToastContext';
import {
  Edit3,
  Plus,
  X,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  Calendar,
  Layers,
  GraduationCap,
  Building,
  CheckCircle2,
} from 'lucide-react';

type GradeLevelType = 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';

interface GradeDefinition {
  gradeLevel: GradeLevelType;
  name: string;
  defaultCapacity: number;
  maxLimit: number;
}

const ALL_GRADE_DEFINITIONS: GradeDefinition[] = [
  { gradeLevel: 'INFANT', name: 'Nhũ Nhi (1 tuổi)', defaultCapacity: 15, maxLimit: 26 },
  { gradeLevel: 'TODDLER', name: 'Khối Hạt (2 tuổi)', defaultCapacity: 25, maxLimit: 26 },
  { gradeLevel: 'NURSERY', name: 'Khối Mầm (3 tuổi)', defaultCapacity: 30, maxLimit: 35 },
  { gradeLevel: 'KINDERGARTEN', name: 'Khối Chồi (4 tuổi)', defaultCapacity: 30, maxLimit: 35 },
  { gradeLevel: 'PRE_K', name: 'Khối Lá (5 tuổi)', defaultCapacity: 32, maxLimit: 35 },
];

const getGradeBadge = (gradeLevel: string) => {
  switch (gradeLevel) {
    case 'INFANT':
      return { label: 'Nhũ Nhi', className: 'bg-rose-100 text-rose-800 border border-rose-200' };
    case 'TODDLER':
      return { label: 'Khối Hạt', className: 'bg-amber-100 text-amber-800 border border-amber-200' };
    case 'NURSERY':
      return { label: 'Khối Mầm', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' };
    case 'KINDERGARTEN':
      return { label: 'Khối Chồi', className: 'bg-teal-100 text-teal-800 border border-teal-200' };
    case 'PRE_K':
      return { label: 'Khối Lá', className: 'bg-indigo-100 text-indigo-800 border border-indigo-200' };
    default:
      return { label: 'Khối Lớp', className: 'bg-slate-100 text-slate-800 border border-slate-200' };
  }
};

export const BghGradeQuotasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, info } = useToast();

  const [selectedYearId, setSelectedYearId] = useState<string>('');
  
  // State modal Cập nhật chỉ tiêu
  const [selectedSetup, setSelectedSetup] = useState<SchoolSetupDto | null>(null);
  const [totalClasses, setTotalClasses] = useState<number>(1);
  const [studentsPerClass, setStudentsPerClass] = useState<number>(25);
  const [note, setNote] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  // State modal Thêm chỉ tiêu cho khối mới
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addGradeLevel, setAddGradeLevel] = useState<GradeLevelType>('INFANT');
  const [addTotalClasses, setAddTotalClasses] = useState<number>(3);
  const [addStudentsPerClass, setAddStudentsPerClass] = useState<number>(25);
  const [addNote, setAddNote] = useState<string>('');
  const [addValidationError, setAddValidationError] = useState<string>('');

  // 1. Lấy danh sách các năm học
  const { data: academicYears = [], isLoading: isLoadingYears } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: () => academicYearApi.getAcademicYears(),
  });

  // Tự động chọn năm học Active hoặc năm học đầu tiên khi dữ liệu load xong
  useEffect(() => {
    if (academicYears.length > 0 && !selectedYearId) {
      const activeYear = academicYears.find((y) => y.status === 'ACTIVE');
      if (activeYear) {
        setSelectedYearId(activeYear.id);
      } else {
        setSelectedYearId(academicYears[0].id);
      }
    }
  }, [academicYears, selectedYearId]);

  // 2. Lấy danh sách cấu hình quy mô chỉ tiêu theo năm học đã chọn
  const {
    data: setups = [],
    isLoading: isLoadingSetups,
    isFetching,
    refetch,
  } = useQuery<SchoolSetupDto[]>({
    queryKey: ['school-setups', selectedYearId],
    queryFn: () => schoolSetupApi.getSetupsByYear(selectedYearId),
    enabled: !!selectedYearId,
  });

  // Tìm thông tin năm học đang chọn
  const currentAcademicYear = useMemo(() => {
    return academicYears.find((y) => y.id === selectedYearId);
  }, [academicYears, selectedYearId]);

  // Danh sách các khối chưa được cấu hình chỉ tiêu trong năm học đã chọn
  const availableGradesToAdd = useMemo(() => {
    const existingLevels = new Set<string>(setups.map((s) => s.gradeLevel));
    return ALL_GRADE_DEFINITIONS.filter((g) => !existingLevels.has(g.gradeLevel));
  }, [setups]);

  // Thống kê tổng hợp toàn trường theo năm học
  const summaryStats = useMemo(() => {
    const totalClassesSum = setups.reduce((acc, s) => acc + (s.totalClasses || 0), 0);
    const totalCapacitySum = setups.reduce((acc, s) => acc + (s.totalGradeCapacity || 0), 0);
    const avgPerClass = totalClassesSum > 0 ? (totalCapacitySum / totalClassesSum).toFixed(1) : '0';
    return {
      totalClasses: totalClassesSum,
      totalCapacity: totalCapacitySum,
      avgPerClass,
      totalGradesConfigured: setups.length,
    };
  }, [setups]);

  // Mutation cập nhật chỉ tiêu khối
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSetup) return;
      if (selectedSetup.setupId) {
        return await schoolSetupApi.updateSetup(selectedSetup.setupId, {
          totalClasses: Number(totalClasses),
          studentsPerClass: Number(studentsPerClass),
          note: note.trim(),
        });
      } else {
        return await schoolSetupApi.createOrUpdateSetup({
          academicYearId: selectedYearId,
          gradeLevel: selectedSetup.gradeLevel,
          totalClasses: Number(totalClasses),
          studentsPerClass: Number(studentsPerClass),
          note: note.trim(),
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-setups', selectedYearId] });
      queryClient.invalidateQueries({ queryKey: ['grade-level-quotas'] });
      success(data?.message || 'Cập nhật chỉ tiêu và định mức quy mô khối lớp thành công.');
      setSelectedSetup(null);
      setValidationError('');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Sĩ số định mức vượt quá giới hạn tối đa cho phép theo quy định chuẩn của Bộ GD&ĐT (Nhà trẻ ≤ 26 trẻ, Mẫu giáo ≤ 35 trẻ).';
      setValidationError(msg);
      error(msg);
    },
  });

  // Mutation thêm mới chỉ tiêu khối
  const createMutation = useMutation({
    mutationFn: async () => {
      return await schoolSetupApi.createOrUpdateSetup({
        academicYearId: selectedYearId,
        gradeLevel: addGradeLevel,
        totalClasses: Number(addTotalClasses),
        studentsPerClass: Number(addStudentsPerClass),
        note: addNote.trim(),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-setups', selectedYearId] });
      queryClient.invalidateQueries({ queryKey: ['grade-level-quotas'] });
      success(data?.message || 'Thêm chỉ tiêu khối lớp mới thành công.');
      setIsAddModalOpen(false);
      setAddValidationError('');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể thêm chỉ tiêu cho khối lớp.';
      setAddValidationError(msg);
      error(msg);
    },
  });

  const handleOpenEdit = (setup: SchoolSetupDto) => {
    setSelectedSetup(setup);
    setTotalClasses(setup.totalClasses || 1);
    setStudentsPerClass(setup.studentsPerClass || 25);
    setNote(setup.note || '');
    setValidationError('');
  };

  const handleOpenAddModal = () => {
    if (availableGradesToAdd.length === 0) {
      info('Tất cả các khối lớp đã có chỉ tiêu quy mô trong niên khóa này.');
      return;
    }
    const first = availableGradesToAdd[0];
    setAddGradeLevel(first.gradeLevel);
    setAddTotalClasses(3);
    setAddStudentsPerClass(first.defaultCapacity);
    setAddNote('');
    setAddValidationError('');
    setIsAddModalOpen(true);
  };

  const handleAddGradeChange = (gradeLevel: GradeLevelType) => {
    setAddGradeLevel(gradeLevel);
    const def = ALL_GRADE_DEFINITIONS.find((g) => g.gradeLevel === gradeLevel);
    if (def) {
      setAddStudentsPerClass(def.defaultCapacity);
    }
    setAddValidationError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSetup) return;

    const isNhaTre = selectedSetup.gradeLevel === 'INFANT' || selectedSetup.gradeLevel === 'TODDLER';
    const limit = isNhaTre ? 26 : 35;

    if (totalClasses <= 0) {
      setValidationError('Số lượng lớp của khối phải lớn hơn 0.');
      return;
    }

    if (studentsPerClass <= 0) {
      setValidationError('Sĩ số định mức học sinh/lớp phải lớn hơn 0.');
      return;
    }

    if (studentsPerClass > limit) {
      const msg = `Sĩ số định mức (${studentsPerClass} trẻ) vượt quá giới hạn tối đa theo quy chuẩn Bộ GD&ĐT (${isNhaTre ? 'Nhóm Nhà trẻ ≤ 26 trẻ' : 'Khối Mẫu giáo ≤ 35 trẻ'}).`;
      setValidationError(msg);
      error(msg);
      return;
    }

    updateMutation.mutate();
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addGradeLevel) {
      setAddValidationError('Vui lòng chọn khối lớp.');
      return;
    }

    const isNhaTre = addGradeLevel === 'INFANT' || addGradeLevel === 'TODDLER';
    const limit = isNhaTre ? 26 : 35;

    if (addTotalClasses <= 0) {
      setAddValidationError('Số lượng lớp của khối phải lớn hơn 0.');
      return;
    }

    if (addStudentsPerClass <= 0) {
      setAddValidationError('Sĩ số định mức học sinh/lớp phải lớn hơn 0.');
      return;
    }

    if (addStudentsPerClass > limit) {
      const msg = `Sĩ số định mức (${addStudentsPerClass} trẻ) vượt quá giới hạn tối đa theo quy chuẩn Bộ GD&ĐT (${isNhaTre ? 'Nhóm Nhà trẻ ≤ 26 trẻ' : 'Khối Mẫu giáo ≤ 35 trẻ'}).`;
      setAddValidationError(msg);
      error(msg);
      return;
    }

    createMutation.mutate();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 p-8 text-white shadow-xl shadow-teal-900/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ban Giám Hiệu • Thiết Lập Quy Mô Trường</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản lý Khối lớp & Định mức Sĩ số</h1>
          <p className="mt-2 text-teal-100 max-w-2xl text-sm leading-relaxed">
            Thiết lập chỉ tiêu số lớp và định mức sĩ số học sinh/lớp cho từng khối theo niên khóa học, đảm bảo tuân thủ tiêu chuẩn Bộ GD&ĐT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 text-sm font-bold shadow-md shadow-emerald-950/20 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Thêm chỉ tiêu cho khối</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Thanh Chọn Năm Học & Tổng Quan Chỉ Tiêu */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2.5 text-slate-700 font-bold text-sm">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Chọn Niên Khóa Cấu Hình:</span>
          </div>
          <select
            value={selectedYearId}
            onChange={(e) => setSelectedYearId(e.target.value)}
            disabled={isLoadingYears}
            className="rounded-xl border border-slate-300 bg-slate-50/70 px-4 py-2 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer min-w-[220px]"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                Năm học {year.name} {year.status === 'ACTIVE' ? '(Đang áp dụng)' : year.status === 'PLANNING' ? '(Đang chuẩn bị)' : '(Đã lưu trữ)'}
              </option>
            ))}
          </select>
          {currentAcademicYear && (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                currentAcademicYear.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentAcademicYear.status === 'PLANNING'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{currentAcademicYear.status === 'ACTIVE' ? 'Đang áp dụng' : currentAcademicYear.status === 'PLANNING' ? 'Đang lập kế hoạch' : 'Đã đóng'}</span>
            </span>
          )}
        </div>

        {/* Dashboard tóm tắt quy mô */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 divide-x divide-slate-100 border-t lg:border-t-0 pt-3 lg:pt-0">
          <div className="px-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tổng số lớp</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-800">{summaryStats.totalClasses}</span>
              <span className="text-xs text-slate-500">lớp</span>
            </div>
          </div>
          <div className="px-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Tổng chỉ tiêu trẻ</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-600">{summaryStats.totalCapacity}</span>
              <span className="text-xs text-slate-500">học sinh</span>
            </div>
          </div>
          <div className="px-3 col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Định mức B/Q</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-slate-800">{summaryStats.avgPerClass}</span>
              <span className="text-xs text-slate-500">trẻ / lớp</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quy chuẩn Bộ GD&ĐT Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-emerald-800">Quy chuẩn định mức sĩ số của Bộ GD&ĐT (Quy tắc BR-006):</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-emerald-700">
            <li><strong>Khối Nhà trẻ</strong> (Nhũ Nhi & Khối Hạt): Tối đa 24 - 26 trẻ/nhóm.</li>
            <li><strong>Khối Mẫu giáo</strong> (Khối Mầm, Khối Chồi, Khối Lá): Tối đa 30 - 35 trẻ/lớp.</li>
            <li><em>Lưu ý:</em> Trong cùng 1 năm học, mỗi khối lớp chỉ có 1 chỉ tiêu duy nhất. Tổng chỉ tiêu học sinh khối = Số lớp &times; Sĩ số định mức.</li>
          </ul>
        </div>
      </div>

      {/* Grid danh sách cấu hình chỉ tiêu các khối lớp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {isLoadingSetups ? (
          <div className="col-span-full text-center py-12 text-slate-500 font-medium">
            Đang tải dữ liệu chỉ tiêu khối lớp của năm học...
          </div>
        ) : setups.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
            <p className="text-slate-500 font-medium">Chưa có cấu hình quy mô cho niên khóa này.</p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm chỉ tiêu khối lớp đầu tiên</span>
            </button>
          </div>
        ) : (
          setups.map((setup) => {
            const capacity = setup.totalGradeCapacity || (setup.totalClasses * setup.studentsPerClass);
            const badge = getGradeBadge(setup.gradeLevel);
            return (
              <div
                key={setup.setupId || setup.gradeLevel}
                className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-800 mb-3">{setup.gradeName}</h3>

                  {/* Chi tiết chỉ tiêu số lớp & sĩ số */}
                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100/90 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Số lượng lớp:</span>
                      <span className="text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {setup.totalClasses} lớp
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Sĩ số định mức:</span>
                      <span className="text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                        {setup.studentsPerClass} trẻ/lớp
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Tổng chỉ tiêu:</span>
                      <span className="text-base font-black text-emerald-600">
                        {capacity} <span className="text-[11px] font-medium text-slate-500">trẻ</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 text-right">
                      Giới hạn Bộ GD&ĐT: &le; {setup.standardLimit} trẻ/lớp
                    </div>
                  </div>

                  {setup.note && (
                    <div className="mb-4 text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      💬 {setup.note}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleOpenEdit(setup)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white py-2.5 px-4 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật chỉ tiêu</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Cập nhật chỉ tiêu khối lớp hiện có */}
      {selectedSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Cập nhật chỉ tiêu - Khối {selectedSetup.gradeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Niên khóa: {currentAcademicYear?.name || 'Hiện hành'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSetup(null)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Số lượng lớp học của khối này
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalClasses}
                  onChange={(e) => {
                    setTotalClasses(Math.max(1, Number(e.target.value)));
                    setValidationError('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dự kiến mở bao nhiêu lớp cho khối {selectedSetup.gradeName} trong năm học.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Sĩ số định mức / 1 lớp
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={studentsPerClass}
                  onChange={(e) => {
                    setStudentsPerClass(Number(e.target.value));
                    setValidationError('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Chuẩn Bộ GD&ĐT: Tối đa <strong>{selectedSetup.standardLimit}</strong> trẻ/lớp đối với khối này.
                </p>
              </div>

              {/* Tính toán tự động chỉ tiêu */}
              <div className="rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase">Tổng chỉ tiêu trẻ của khối</div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {totalClasses} lớp &times; {studentsPerClass} trẻ/lớp
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {totalClasses * studentsPerClass} <span className="text-xs font-semibold">trẻ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Ghi chú cấu hình (tùy chọn)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Bố trí 2 cô/lớp, phòng tầng 1 gần sảnh..."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </div>

              {validationError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSetup(null)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {updateMutation.isPending ? 'Đang lưu...' : 'Lưu chỉ tiêu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Thêm chỉ tiêu cho khối lớp mới (chưa có trong năm học) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Thêm Chỉ Tiêu Khối Lớp Mới
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Niên khóa: {currentAcademicYear?.name || 'Hiện hành'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-full p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Chọn khối lớp cần cấu hình <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addGradeLevel}
                  onChange={(e) => handleAddGradeChange(e.target.value as GradeLevelType)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 bg-slate-50 cursor-pointer"
                  required
                >
                  {availableGradesToAdd.map((g) => (
                    <option key={g.gradeLevel} value={g.gradeLevel}>
                      {g.name} (Chuẩn tối đa {g.maxLimit} trẻ)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Chỉ hiển thị các khối lớp chưa được thiết lập chỉ tiêu trong niên khóa này.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Số lượng lớp học dự kiến mở <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addTotalClasses}
                  onChange={(e) => {
                    setAddTotalClasses(Math.max(1, Number(e.target.value)));
                    setAddValidationError('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Sĩ số định mức / 1 lớp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={addStudentsPerClass}
                  onChange={(e) => {
                    setAddStudentsPerClass(Number(e.target.value));
                    setAddValidationError('');
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-base font-bold text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Chuẩn Bộ GD&ĐT: Tối đa{' '}
                  <strong>
                    {ALL_GRADE_DEFINITIONS.find((g) => g.gradeLevel === addGradeLevel)?.maxLimit || 35}
                  </strong>{' '}
                  trẻ/lớp đối với khối này.
                </p>
              </div>

              {/* Tính toán tự động chỉ tiêu */}
              <div className="rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase">Tổng chỉ tiêu trẻ dự kiến</div>
                  <div className="text-xs text-emerald-600 font-medium">
                    {addTotalClasses} lớp &times; {addStudentsPerClass} trẻ/lớp
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700">
                  {addTotalClasses * addStudentsPerClass} <span className="text-xs font-semibold">trẻ</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  4. Ghi chú cấu hình (tùy chọn)
                </label>
                <textarea
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  placeholder="Ví dụ: Bố trí 2 cô/lớp, phòng chức năng..."
                  rows={2}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                />
              </div>

              {addValidationError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{addValidationError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {createMutation.isPending ? 'Đang thêm...' : 'Thêm chỉ tiêu khối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghGradeQuotasPage;
