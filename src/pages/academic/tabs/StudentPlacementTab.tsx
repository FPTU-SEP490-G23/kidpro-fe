import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  UserMinus,
  Sparkles,
  School,
  Check,
  Calendar,
  Filter,
  RefreshCw,
  Baby,
  ChevronRight
} from 'lucide-react';
import {
  studentPlacementService,
  UnassignedStudentResponse,
  StudentInClassResponse
} from '../../../services/studentPlacementService';
import { classService } from '../../../services/classService';
import { academicYearApi } from '../../../api/academicYearApi';
import { useToast } from '../../../contexts/ToastContext';
import { ClassSummary, GradeLevel } from '../../../types/classAffairs.types';

const GRADE_LEVEL_LABELS: Record<string, string> = {
  INFANT: 'Nhà trẻ nhỏ (3 - 12 tháng)',
  TODDLER: 'Nhà trẻ (12 - 36 tháng)',
  NURSERY: 'Khối Mầm (3 - 4 tuổi)',
  KINDERGARTEN: 'Khối Chồi/Lá (4 - 6 tuổi)',
};

export const StudentPlacementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error, warning } = useToast();

  // State
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // 1. Fetch Academic Years
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academicYears'],
    queryFn: async () => {
      const res = await academicYearApi.getAcademicYears();
      return Array.isArray(res) ? res : ((res as any)?.data || []);
    }
  });

  // Set default active academic year
  React.useEffect(() => {
    if (academicYears.length > 0 && !selectedAcademicYearId) {
      const active = academicYears.find((y: any) => y.isActive || y.status === 'ACTIVE');
      const firstYear = academicYears[0];
      const targetId = active ? (active.id || active.academicYearId) : (firstYear.id || firstYear.academicYearId);
      if (targetId) {
        setSelectedAcademicYearId(targetId);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  // 2. Fetch Classes
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes-placement', selectedAcademicYearId],
    queryFn: async () => {
      const res = await classService.getClasses({
        academicYearId: (selectedAcademicYearId && selectedAcademicYearId !== 'ALL') ? selectedAcademicYearId : undefined,
        page: 0,
        size: 100
      });
      return res.content || [];
    }
  });

  const classes: ClassSummary[] = classesData || [];

  // Automatically select first class if none selected
  React.useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.find(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = useMemo(() => {
    return classes.find(c => c.id === selectedClassId) || null;
  }, [classes, selectedClassId]);

  // 3. Fetch Unassigned Students
  const { data: unassignedStudents = [], isLoading: isLoadingUnassigned, refetch: refetchUnassigned } = useQuery({
    queryKey: ['unassigned-students', selectedAcademicYearId, gradeFilter],
    queryFn: async () => {
      return await studentPlacementService.getUnassignedStudents({
        academicYearId: (selectedAcademicYearId && selectedAcademicYearId !== 'ALL') ? selectedAcademicYearId : undefined,
        gradeLevel: gradeFilter !== 'ALL' ? gradeFilter : undefined
      });
    }
  });

  // 4. Fetch Students currently in Selected Class
  const { data: classStudents = [], isLoading: isLoadingClassStudents, refetch: refetchClassStudents } = useQuery({
    queryKey: ['class-students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      return await studentPlacementService.getStudentsByClass(selectedClassId);
    },
    enabled: !!selectedClassId
  });

  // Filtered Unassigned Students by search
  const filteredUnassigned = useMemo(() => {
    return unassignedStudents.filter(s => {
      if (searchStudent.trim()) {
        const kw = searchStudent.toLowerCase();
        const matchName = s.fullName.toLowerCase().includes(kw);
        const matchCode = s.studentCode.toLowerCase().includes(kw);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [unassignedStudents, searchStudent]);

  // Checkbox handlers
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedStudentIds.length === filteredUnassigned.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredUnassigned.map(s => s.studentId));
    }
  };

  // Mutation: Assign Students
  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClassId) throw new Error('Vui lòng chọn lớp học tiếp nhận');
      if (selectedStudentIds.length === 0) throw new Error('Vui lòng tích chọn ít nhất 1 học sinh');

      return await studentPlacementService.assignStudents({
        classId: selectedClassId,
        studentIds: selectedStudentIds
      });
    },
    onSuccess: (data: any) => {
      const msg = data?.message || 'MSG-034: Xếp học sinh vào lớp học thành công.';
      success(msg);
      setSelectedStudentIds([]);
      queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-students', selectedClassId] });
      queryClient.invalidateQueries({ queryKey: ['classes-placement'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi xếp học sinh vào lớp.';
      error(msg);
    }
  });

  // Mutation: Remove Student from Class
  const removeMutation = useMutation({
    mutationFn: async (studentId: string) => {
      return await studentPlacementService.removeStudentFromClass(studentId);
    },
    onSuccess: () => {
      success('Đã rút học sinh ra khỏi lớp và chuyển về danh sách chưa phân lớp.');
      queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-students', selectedClassId] });
      queryClient.invalidateQueries({ queryKey: ['classes-placement'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi rút học sinh.';
      error(msg);
    }
  });

  // Mutation: Auto Assign
  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      return await studentPlacementService.autoAssign({
        academicYearId: (selectedAcademicYearId && selectedAcademicYearId !== 'ALL') ? selectedAcademicYearId : undefined,
        gradeLevel: gradeFilter !== 'ALL' ? (gradeFilter as any) : undefined
      });
    },
    onSuccess: (res: any) => {
      success(res?.message || 'Tự động xếp lớp thành công!');
      setSelectedStudentIds([]);
      queryClient.invalidateQueries({ queryKey: ['unassigned-students'] });
      queryClient.invalidateQueries({ queryKey: ['class-students'] });
      queryClient.invalidateQueries({ queryKey: ['classes-placement'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tự động xếp lớp.';
      error(msg);
    }
  });

  // Capacity calculations for selected class
  const classCurrentCount = classStudents.length;
  const classMaxCapacity = selectedClass?.maxCapacity || 30;
  const remainingSlots = Math.max(0, classMaxCapacity - classCurrentCount);
  const fillPercentage = Math.min(100, Math.round((classCurrentCount / classMaxCapacity) * 100));

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Năm Học:</span>
          </div>
          <select
            value={selectedAcademicYearId}
            onChange={(e) => setSelectedAcademicYearId(e.target.value)}
            className="text-sm font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            {academicYears.length > 1 && <option value="ALL">-- Tất cả năm học --</option>}
            {academicYears.map((y: any) => {
              const yId = y.id || y.academicYearId;
              const yName = y.name || y.yearName;
              const isActive = y.status === 'ACTIVE' || y.isActive;
              return (
                <option key={yId} value={yId}>
                  {yName} {isActive ? '★ (Hiện tại)' : ''}
                </option>
              );
            })}
          </select>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Khối:</span>
          </div>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-sm font-semibold border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="ALL">Tất cả các khối độ tuổi</option>
            <option value="INFANT">Nhà trẻ nhỏ (3 - 12 tháng)</option>
            <option value="TODDLER">Nhà trẻ (12 - 36 tháng)</option>
            <option value="NURSERY">Khối Mầm (3 - 4 tuổi)</option>
            <option value="KINDERGARTEN">Khối Chồi/Lá (4 - 6 tuổi)</option>
          </select>
        </div>

        <button
          onClick={() => autoAssignMutation.mutate()}
          disabled={autoAssignMutation.isPending || unassignedStudents.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
        >
          {autoAssignMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>Tự Động Điền Vào Lớp Trống</span>
        </button>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMN LEFT: Unassigned Students (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[750px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-emerald-600" />
                  <span>Trẻ Chưa Phân Lớp</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                    {filteredUnassigned.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Chọn trẻ để xếp vào lớp tiếp nhận</p>
              </div>

              {filteredUnassigned.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  {selectedStudentIds.length === filteredUnassigned.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mã học sinh..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingUnassigned ? (
                <div className="h-48 flex items-center justify-center text-slate-400 gap-2 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Đang tải danh sách trẻ...</span>
                </div>
              ) : filteredUnassigned.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Đã xếp lớp toàn bộ học sinh!</p>
                  <p className="text-xs text-slate-400 mt-1">Không còn học sinh chưa phân lớp theo bộ lọc này.</p>
                </div>
              ) : (
                filteredUnassigned.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.studentId);
                  return (
                    <div
                      key={st.studentId}
                      onClick={() => handleToggleStudent(st.studentId)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">{st.fullName}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${st.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                              {st.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                            <span>Mã: <strong className="text-slate-700">{st.studentCode}</strong></span>
                            <span>•</span>
                            <span>{st.ageInMonths} tháng ({st.ageInYears} tuổi)</span>
                          </div>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                              {st.suggestedGradeName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isChecked ? 'text-emerald-600' : 'text-slate-300'}`} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl flex items-center justify-between gap-3">
              <div className="text-xs text-slate-600">
                Đã chọn: <strong className="text-emerald-700 font-bold">{selectedStudentIds.length}</strong> trẻ
              </div>
              <button
                type="button"
                onClick={() => assignMutation.mutate()}
                disabled={assignMutation.isPending || selectedStudentIds.length === 0 || !selectedClassId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Xác Nhận Xếp Lớp</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMN RIGHT: Destination Class & Enrolled Students (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Class Selector Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span>Chọn Lớp Học Tiếp Nhận</span>
              </h3>
              <span className="text-xs text-slate-500">Tổng cộng: {classes.length} lớp</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
              {classes.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                const cap = cls.maxCapacity || 30;
                const cur = cls.currentEnrollment || 0;
                const isFull = cur >= cap;

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-950 text-white shadow-xs'
                        : isFull
                        ? 'border-slate-200 bg-slate-50 opacity-70 hover:opacity-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {cls.name}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : isFull
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {cur}/{cap}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-1 truncate ${isSelected ? 'text-emerald-200' : 'text-slate-500'}`}>
                      {GRADE_LEVEL_LABELS[cls.gradeLevel] || cls.gradeLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enrolled Students Panel */}
          {selectedClass ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
              {/* Class Header with Capacity Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{selectedClass.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {GRADE_LEVEL_LABELS[selectedClass.gradeLevel] || selectedClass.gradeLevel}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Phòng: <strong className="text-slate-700">{selectedClass.roomName || 'Chưa phân phòng'}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900">
                      Sĩ số: <span className="text-emerald-700 text-sm">{classCurrentCount}</span> / {classMaxCapacity}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Còn trống: <strong className="text-emerald-600">{remainingSlots}</strong> chỗ
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      fillPercentage >= 100
                        ? 'bg-rose-500'
                        : fillPercentage >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* Enrolled Students Table */}
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingClassStudents ? (
                  <div className="h-48 flex items-center justify-center text-slate-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Đang tải danh sách học sinh của lớp...</span>
                  </div>
                ) : classStudents.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                    <Users className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Lớp học chưa có học sinh nào</p>
                    <p className="text-xs text-slate-400 mt-1">Hãy tích chọn học sinh từ cột bên trái và nhấn Xếp Lớp.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classStudents.map((st, idx) => (
                      <div
                        key={st.studentId}
                        className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 text-center text-xs font-extrabold text-slate-400">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">{st.fullName}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${st.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                {st.gender === 'FEMALE' ? 'Nữ' : 'Nam'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                              <span>Mã: <strong className="text-slate-700">{st.studentCode}</strong></span>
                              <span>•</span>
                              <span>{st.ageInMonths} tháng tuổi</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          title="Bỏ phân lớp cho học sinh"
                          onClick={() => removeMutation.mutate(st.studentId)}
                          disabled={removeMutation.isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors cursor-pointer shrink-0"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Rút khỏi lớp</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              Chọn một lớp học để xem danh sách học sinh và phân bổ
            </div>
          )}
        </div>
      </div>
    </div>
  );
};