import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Scale,
  Sparkles,
  Calendar,
  Save,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Loader2,
  X,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import healthApi from '../../../api/healthApi';
import {
  BatchStudentHealthEntry,
  MeasurementPeriodType,
  BatchHealthMetricsPayload,
} from '../../../types/health.types';
import { calculateBmi, getBmiStatus, getBmiBadge, formatDate } from '../../../utils/formatters';

interface ClassHealthMetricsTabProps {
  initialClassId?: string;
}

// Bảng số liệu chuẩn WHO Z-Scores (Bé 24 - 72 tháng tuổi)
const WHO_GROWTH_STANDARDS = [
  { ageMonths: 24, minus2SD_H: 82.5, median_H: 87.1, plus2SD_H: 91.9, minus2SD_W: 10.1, median_W: 12.0, plus2SD_W: 14.3 },
  { ageMonths: 30, minus2SD_H: 87.2, median_H: 91.9, plus2SD_H: 96.9, minus2SD_W: 11.2, median_W: 13.3, plus2SD_W: 16.0 },
  { ageMonths: 36, minus2SD_H: 91.4, median_H: 96.1, plus2SD_H: 101.4, minus2SD_W: 12.2, median_W: 14.3, plus2SD_W: 17.6 },
  { ageMonths: 42, minus2SD_H: 95.2, median_H: 100.0, plus2SD_H: 105.7, minus2SD_W: 13.1, median_W: 15.3, plus2SD_W: 19.1 },
  { ageMonths: 48, minus2SD_H: 98.7, median_H: 103.7, plus2SD_H: 109.8, minus2SD_W: 14.0, median_W: 16.3, plus2SD_W: 20.7 },
  { ageMonths: 54, minus2SD_H: 102.1, median_H: 107.2, plus2SD_H: 113.6, minus2SD_W: 14.9, median_W: 17.3, plus2SD_W: 22.4 },
  { ageMonths: 60, minus2SD_H: 105.3, median_H: 110.4, plus2SD_H: 117.2, minus2SD_W: 15.8, median_W: 18.3, plus2SD_W: 24.2 },
  { ageMonths: 66, minus2SD_H: 108.3, median_H: 113.5, plus2SD_H: 120.7, minus2SD_W: 16.7, median_W: 19.4, plus2SD_W: 26.1 },
  { ageMonths: 72, minus2SD_H: 111.2, median_H: 116.5, plus2SD_H: 123.9, minus2SD_W: 17.6, median_W: 20.5, plus2SD_W: 27.9 },
];

interface FormValues {
  records: {
    studentId: string;
    studentCode: string;
    studentName: string;
    avatarUrl?: string;
    birthDate: string;
    ageMonths: number;
    previousHeightCm?: number;
    previousWeightKg?: number;
    heightCm: number;
    weightKg: number;
    notes?: string;
  }[];
}

export const ClassHealthMetricsTab: React.FC<ClassHealthMetricsTabProps> = ({
  initialClassId = 'CLASS-MAM1',
}) => {
  const queryClient = useQueryClient();

  // Toolbar state
  const [selectedClassId, setSelectedClassId] = useState(initialClassId);
  const [measurementRound, setMeasurementRound] = useState<MeasurementPeriodType>('BEGINNING_YEAR');
  const [measurementDate, setMeasurementDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Growth Trend Chart Modal state
  const [selectedStudentForChart, setSelectedStudentForChart] = useState<BatchStudentHealthEntry | null>(null);
  const [growthMetricType, setGrowthMetricType] = useState<'HEIGHT' | 'WEIGHT'>('HEIGHT');

  // Excel Import Modal state
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  // Toast alert messages
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Refs for keyboard navigation between rows
  const heightInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const weightInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 1. Fetch class students and historical metrics
  const { data: studentsEntries = [], isLoading } = useQuery<BatchStudentHealthEntry[]>({
    queryKey: ['class-students-health-entry', selectedClassId],
    queryFn: () => healthApi.getClassStudentsForMetrics(selectedClassId),
  });

  // 2. React Hook Form with useFieldArray for batch editing
  const { control, register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      records: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: 'records',
  });

  // Reset form whenever new student entries arrive
  React.useEffect(() => {
    if (studentsEntries.length > 0) {
      reset({
        records: studentsEntries.map((s) => ({
          studentId: s.studentId,
          studentCode: s.studentCode,
          studentName: s.studentName,
          avatarUrl: s.avatarUrl,
          birthDate: s.birthDate,
          ageMonths: s.ageMonths,
          previousHeightCm: s.previousHeightCm,
          previousWeightKg: s.previousWeightKg,
          heightCm: s.currentHeightCm || (s.previousHeightCm ? s.previousHeightCm + 0.5 : 100),
          weightKg: s.currentWeightKg || (s.previousWeightKg ? s.previousWeightKg + 0.2 : 15),
          notes: s.notes || '',
        })),
      });
    }
  }, [studentsEntries, reset]);

  // Watch watchedRecords for Instant Client-side BMI Calculation
  const watchedRecords = watch('records');

  // Mutation Save Batch Health Metrics
  const saveBatchMutation = useMutation({
    mutationFn: (payload: BatchHealthMetricsPayload) => healthApi.saveBatchHealthMetrics(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-students-health-entry', selectedClassId] });
      setToastMessage({
        type: 'success',
        text: 'MSG-204: Đã lưu số đo thể chất và phân tích theo chuẩn tăng trưởng WHO',
      });
    },
    onError: () => {
      setToastMessage({
        type: 'error',
        text: 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.',
      });
    },
  });

  // Xử lý nộp biểu mẫu kiểm tra sức khỏe cả lớp
  const onFormSubmit = (data: FormValues) => {
    setToastMessage(null);

    // Kiểm tra giới hạn sinh lý theo quy chuẩn (60 - 140 cm, 7 - 45 kg)
    for (let i = 0; i < data.records.length; i++) {
      const r = data.records[i];
      const h = Number(r.heightCm);
      const w = Number(r.weightKg);

      // BR-050 & MSG-205: Giới hạn sinh lý
      if (h < 60.0 || h > 140.0 || w < 7.0 || w > 45.0) {
        setToastMessage({
          type: 'warning',
          text: `MSG-205: Giá trị đo đạc của bé ${r.studentName} (${h}cm, ${w}kg) nằm ngoài khoảng sinh lý bình thường của trẻ mầm non (7 - 45 kg, 60 - 140 cm). Vui lòng kiểm tra lại.`,
        });
        return;
      }

      // MSG-206: Kiểm tra bất thường giảm chiều cao
      if (r.previousHeightCm && h < r.previousHeightCm) {
        setToastMessage({
          type: 'warning',
          text: `MSG-206: Chiều cao hiện tại (${h} cm) của bé ${r.studentName} thấp hơn số đo lần trước (${r.previousHeightCm} cm). Vui lòng đo lại cho bé để đảm bảo chính xác.`,
        });
        // Không chặn hẳn nhưng cảnh báo rõ cho giáo viên
      }
    }

    // Tiến hành lưu lô
    const payload: BatchHealthMetricsPayload = {
      classId: selectedClassId,
      measurementRound,
      measurementDate: measurementDate || new Date().toISOString().split('T')[0],
      records: data.records.map((r) => {
        const bmi = calculateBmi(Number(r.weightKg), Number(r.heightCm));
        const bmiStatus = getBmiStatus(bmi);
        return {
          studentId: r.studentId,
          heightCm: Number(r.heightCm),
          weightKg: Number(r.weightKg),
          notes: r.notes,
          bmi,
          bmiStatus,
        };
      }),
    };

    saveBatchMutation.mutate(payload);
  };

  // Keyboard navigation handler: Nhấn Enter hoặc ArrowDown để nhảy sang ô của bé tiếp theo
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    field: 'HEIGHT' | 'WEIGHT'
  ) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = rowIndex + 1;
      if (field === 'HEIGHT') {
        if (nextIndex < heightInputRefs.current.length && heightInputRefs.current[nextIndex]) {
          heightInputRefs.current[nextIndex]?.focus();
          heightInputRefs.current[nextIndex]?.select();
        }
      } else {
        if (nextIndex < weightInputRefs.current.length && weightInputRefs.current[nextIndex]) {
          weightInputRefs.current[nextIndex]?.focus();
          weightInputRefs.current[nextIndex]?.select();
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = rowIndex - 1;
      if (prevIndex >= 0) {
        if (field === 'HEIGHT') {
          heightInputRefs.current[prevIndex]?.focus();
          heightInputRefs.current[prevIndex]?.select();
        } else {
          weightInputRefs.current[prevIndex]?.focus();
          weightInputRefs.current[prevIndex]?.select();
        }
      }
    } else if (e.key === 'ArrowRight' && field === 'HEIGHT') {
      // Chuyển sang ô Cân nặng cùng hàng
      weightInputRefs.current[rowIndex]?.focus();
    } else if (e.key === 'ArrowLeft' && field === 'WEIGHT') {
      // Chuyển sang ô Chiều cao cùng hàng
      heightInputRefs.current[rowIndex]?.focus();
    }
  };

  // Mô phỏng Import Excel
  const handleSimulateImportExcel = () => {
    setShowExcelImportModal(false);
    setToastMessage({
      type: 'success',
      text: 'Đã nhập thành công 5 bản ghi thể trạng từ tệp DanhSachKham_Mam1.xlsx',
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh Điều Khiển Đợt Đo Định Kỳ (Periodic Measurement Toolbar) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#275A4E]/10 px-3 py-1 text-xs font-bold text-[#275A4E] mb-1.5">
              <Scale className="h-4 w-4" />
              <span>Phân Hệ Sức Khỏe Học Đường • UC-051</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Sổ Theo Dõi Thể Trạng & Chỉ Số BMI Chuẩn WHO</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động tính BMI thời gian thực, nhận diện suy dinh dưỡng / béo phì và cảnh báo chiều cao giảm bất thường
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Nút Import Excel */}
            <button
              type="button"
              onClick={() => setShowExcelImportModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs min-h-[44px]"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
              <span>Nhập Dữ Liệu từ Excel</span>
            </button>

            {/* Nút Lưu Chính (Primary Button) */}
            <button
              type="button"
              onClick={handleSubmit(onFormSubmit)}
              disabled={saveBatchMutation.isPending || fields.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 text-xs font-bold shadow-md shadow-[#275A4E]/20 transition disabled:opacity-50 min-h-[44px]"
            >
              {saveBatchMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang Lưu Sổ Đo...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>LƯU SỔ THỂ CHẤT CẢ LỚP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bộ Lọc Toolbar: Lớp học, Đợt khám, Ngày đo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Chọn Lớp */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Lớp học (classId):</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
            >
              <option value="CLASS-MAM1">Mầm 1 (3-4 Tuổi) - 25 Học sinh</option>
              <option value="CLASS-CHOI2">Chồi 2 (4-5 Tuổi) - 28 Học sinh</option>
              <option value="CLASS-LA3">Lá 3 (5-6 Tuổi) - 30 Học sinh</option>
            </select>
          </div>

          {/* Chọn Đợt khám */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Đợt khám sức khỏe:</label>
            <select
              value={measurementRound}
              onChange={(e) => setMeasurementRound(e.target.value as MeasurementPeriodType)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
            >
              <option value="BEGINNING_YEAR">Đợt 1: Đầu năm học (Tháng 09 - 10)</option>
              <option value="MID_YEAR">Đợt 2: Giữa năm học (Tháng 01 - 02)</option>
              <option value="END_YEAR">Đợt 3: Cuối năm học (Tháng 05)</option>
            </select>
          </div>

          {/* Chọn Ngày đo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#275A4E]" />
              <span>Ngày đo khám thực tế:</span>
            </label>
            <input
              type="date"
              value={measurementDate}
              onChange={(e) => setMeasurementDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Thông báo Toast Alert */}
      {toastMessage && (
        <div
          className={`rounded-2xl p-4 text-xs font-medium flex items-center justify-between shadow-xs transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Bảng Nhập Liệu Thể Trạng Lớp Học (Class Physical Health Metric Grid) */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#275A4E]" />
              <span>Bảng Cân Đo Cả Lớp (Điều hướng bằng phím Enter / Mũi tên xuống)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Nhập chiều cao (cm, 60.0 - 140.0) và cân nặng (kg, 7.0 - 45.0) • Nhấn Enter để tự động nhảy xuống bé tiếp theo
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
              <span>Thiếu cân (&lt;14.0)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              <span>Bình thường (14.0-18.0)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />
              <span>Thừa cân (18.0-20.0)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
              <span>Béo phì (&gt;20.0)</span>
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#275A4E]" />
            Đang tải danh sách học sinh của lớp...
          </div>
        ) : fields.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Chưa có học sinh nào trong lớp này.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 text-center w-12">STT</th>
                  <th className="py-3 px-3 min-w-[180px]">Học Sinh</th>
                  <th className="py-3 px-3 text-center w-24">Tuổi (Tháng)</th>
                  <th className="py-3 px-3 text-center w-28 bg-slate-50">Lần Trước (cm / kg)</th>
                  <th className="py-3 px-3 w-36 text-center bg-emerald-50/40 text-emerald-950">
                    Chiều Cao Mới (cm) *
                  </th>
                  <th className="py-3 px-3 w-36 text-center bg-emerald-50/40 text-emerald-950">
                    Cân Nặng Mới (kg) *
                  </th>
                  <th className="py-3 px-3 text-center w-28">BMI Tính Nhanh</th>
                  <th className="py-3 px-3 min-w-[170px]">Thể Trạng Chuẩn WHO</th>
                  <th className="py-3 px-3 min-w-[140px]">Ghi Chú</th>
                  <th className="py-3 px-3 text-center w-28">Biểu Đồ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {fields.map((field, index) => {
                  const currentWatched = watchedRecords?.[index] || field;
                  const currentH = Number(currentWatched.heightCm) || 0;
                  const currentW = Number(currentWatched.weightKg) || 0;

                  // 1. Instant Client-Side BMI Calculation
                  const calculatedBmi = calculateBmi(currentW, currentH);
                  const currentBmiStatus = getBmiStatus(calculatedBmi);
                  const badgeInfo = getBmiBadge(currentBmiStatus);

                  // 2. Kiểm tra bất thường giảm chiều cao so với lần trước (MSG-206)
                  const prevH = field.previousHeightCm;
                  const isHeightDecreased = Boolean(prevH && currentH > 0 && currentH < prevH);

                  // 3. Tính độ chênh lệch chiều cao và cân nặng
                  const diffH = prevH && currentH ? (currentH - prevH).toFixed(1) : null;
                  const diffW = field.previousWeightKg && currentW ? (currentW - field.previousWeightKg).toFixed(1) : null;

                  return (
                    <tr
                      key={field.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isHeightDecreased ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Cột 1: STT */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Cột 2: Avatar & Tên học sinh */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              field.avatarUrl ||
                              'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=80'
                            }
                            alt={field.studentName}
                            className="h-9 w-9 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {field.studentName}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {field.studentCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Ngày sinh & Tuổi tháng */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-slate-800 block">{field.ageMonths} tháng</span>
                        <span className="text-[10px] text-slate-400">{formatDate(field.birthDate)}</span>
                      </td>

                      {/* Cột 4: Số đo lần trước */}
                      <td className="py-3.5 px-3 text-center bg-slate-50/60 font-mono text-slate-600">
                        {prevH ? (
                          <>
                            <span className="font-bold text-slate-800">{prevH} cm</span>
                            <span className="text-[11px] text-slate-400 block">
                              {field.previousWeightKg} kg
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Lần đầu đo</span>
                        )}
                      </td>

                      {/* Cột 5: Input Chiều cao mới (cm) với Instant Calculation & Keyboard Nav */}
                      <td className="py-3.5 px-3 bg-emerald-50/20">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="60"
                            max="140"
                            {...register(`records.${index}.heightCm`, {
                              valueAsNumber: true,
                            })}
                            ref={(el) => {
                              heightInputRefs.current[index] = el;
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index, 'HEIGHT')}
                            className={`w-full rounded-xl border px-3 py-2 text-center text-xs font-bold text-slate-900 focus:outline-hidden transition ${
                              isHeightDecreased
                                ? 'border-rose-400 bg-rose-50/60 text-rose-900 focus:border-rose-500'
                                : 'border-slate-200 bg-white focus:border-[#275A4E] focus:ring-1 focus:ring-[#275A4E]'
                            }`}
                          />
                        </div>

                        {/* Cảnh báo giảm chiều cao (MSG-206) */}
                        {isHeightDecreased && (
                          <div
                            className="mt-1 flex items-center justify-center gap-1 text-[10px] text-rose-600 font-bold"
                            title="MSG-206: Chiều cao hiện tại thấp hơn số đo lần trước. Vui lòng đo lại cho bé để đảm bảo chính xác."
                          >
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            <span>Giảm {Math.abs(Number(diffH))} cm!</span>
                          </div>
                        )}

                        {diffH && !isHeightDecreased && Number(diffH) > 0 && (
                          <span className="mt-0.5 text-[10px] text-emerald-700 font-semibold block text-center flex items-center justify-center">
                            <ArrowUpRight className="h-2.5 w-2.5" />+{diffH} cm
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Input Cân nặng mới (kg) với Instant Calculation & Keyboard Nav */}
                      <td className="py-3.5 px-3 bg-emerald-50/20">
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="7"
                            max="45"
                            {...register(`records.${index}.weightKg`, {
                              valueAsNumber: true,
                            })}
                            ref={(el) => {
                              weightInputRefs.current[index] = el;
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index, 'WEIGHT')}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-xs font-bold text-slate-900 focus:border-[#275A4E] focus:outline-hidden focus:ring-1 focus:ring-[#275A4E] transition"
                          />
                        </div>

                        {diffW && (
                          <span
                            className={`mt-0.5 text-[10px] font-semibold block text-center flex items-center justify-center ${
                              Number(diffW) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {Number(diffW) > 0 ? (
                              <>
                                <ArrowUpRight className="h-2.5 w-2.5" />+{diffW} kg
                              </>
                            ) : Number(diffW) < 0 ? (
                              <>
                                <ArrowDownRight className="h-2.5 w-2.5" />
                                {diffW} kg
                              </>
                            ) : (
                              <Minus className="h-2.5 w-2.5" />
                            )}
                          </span>
                        )}
                      </td>

                      {/* Cột 7: BMI Tự Động Tính Ngay Lập Tức */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-mono text-sm font-extrabold text-[#1E4D40]">
                          {calculatedBmi > 0 ? calculatedBmi : '--'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">kg/m²</span>
                      </td>

                      {/* Cột 8: Huy Hiệu Thể Trạng Chuẩn WHO (Đổi màu ngay khi gõ) */}
                      <td className="py-3.5 px-3">
                        {calculatedBmi > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-[11px] border ${badgeInfo.color}`}
                          >
                            {currentBmiStatus === 'NORMAL' && '🟢'}
                            {currentBmiStatus === 'UNDERWEIGHT' && '🟡'}
                            {currentBmiStatus === 'OVERWEIGHT' && '🟠'}
                            {currentBmiStatus === 'OBESE' && '🔴'}
                            <span>{badgeInfo.label}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Đang nhập...</span>
                        )}
                      </td>

                      {/* Cột 9: Ghi chú */}
                      <td className="py-3.5 px-3">
                        <input
                          type="text"
                          placeholder="Ăn tốt / Uống ít sữa..."
                          {...register(`records.${index}.notes`)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-300 focus:border-[#275A4E] focus:outline-hidden"
                        />
                      </td>

                      {/* Cột 10: Xem Biểu Đồ Tăng Trưởng WHO */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const entry = studentsEntries.find((s) => s.studentId === field.studentId);
                            if (entry) {
                              setSelectedStudentForChart({
                                ...entry,
                                currentHeightCm: currentH,
                                currentWeightKg: currentW,
                                bmi: calculatedBmi,
                                bmiStatus: currentBmiStatus,
                              });
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-[#275A4E] hover:bg-[#275A4E]/10 transition"
                          title="Xem biểu đồ đường tăng trưởng so sánh chuẩn Z-score WHO"
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span>WHO</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer ghi chú hướng dẫn */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#275A4E]" />
            <span>
              Công thức WHO: BMI = Cân nặng (kg) / (Chiều cao (m))² • Giới hạn mầm non: 60 - 140 cm, 7 - 45 kg
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>Tổng số học sinh trong danh sách: <strong>{fields.length} bé</strong></span>
          </div>
        </div>
      </div>

      {/* ================= MODAL BIỂU ĐỒ XU HƯỚNG TĂNG TRƯỞNG TRỰC QUAN (WHO GROWTH CHART) ================= */}
      {selectedStudentForChart && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedStudentForChart.avatarUrl ||
                    'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=80'
                  }
                  alt={selectedStudentForChart.studentName}
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#275A4E]"
                />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    Biểu Đồ Chuẩn Tăng Trưởng WHO - Bé {selectedStudentForChart.studentName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tuổi hiện tại: <strong>{selectedStudentForChart.ageMonths} tháng</strong> • Số đo: {selectedStudentForChart.currentHeightCm} cm, {selectedStudentForChart.currentWeightKg} kg (BMI {selectedStudentForChart.bmi})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentForChart(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toggle Chỉ số: Chiều Cao vs Cân Nặng */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setGrowthMetricType('HEIGHT')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    growthMetricType === 'HEIGHT'
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Chiều Cao theo Tuổi (cm)
                </button>
                <button
                  type="button"
                  onClick={() => setGrowthMetricType('WEIGHT')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    growthMetricType === 'WEIGHT'
                      ? 'bg-[#275A4E] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Cân Nặng theo Tuổi (kg)
                </button>
              </div>

              {/* Chú giải đường chuẩn WHO */}
              <div className="flex items-center gap-3 text-[11px] font-semibold">
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="h-0.5 w-3 bg-rose-500 inline-block border-b border-dashed" />
                  <span>+2 SD (Cao/Thừa)</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <span className="h-1 w-3 bg-[#275A4E] inline-block" />
                  <span>Median (Chuẩn WHO)</span>
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <span className="h-0.5 w-3 bg-amber-500 inline-block border-b border-dashed" />
                  <span>-2 SD (Thấp/Thiếu)</span>
                </span>
                <span className="flex items-center gap-1 text-purple-700 font-bold">
                  <span className="h-2 w-2 rounded-full bg-purple-700 inline-block" />
                  <span>Số đo của Bé</span>
                </span>
              </div>
            </div>

            {/* SVG Interactive Visual Chart */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <svg viewBox="0 0 600 300" className="w-full h-auto overflow-visible text-xs">
                {/* Lưới tọa độ ngang */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="60"
                    y1={40 + i * 50}
                    x2="560"
                    y2={40 + i * 50}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Trục Y nhãn */}
                {growthMetricType === 'HEIGHT' ? (
                  <>
                    <text x="25" y="45" fill="#64748B" fontSize="10">125 cm</text>
                    <text x="25" y="95" fill="#64748B" fontSize="10">115 cm</text>
                    <text x="25" y="145" fill="#64748B" fontSize="10">105 cm</text>
                    <text x="25" y="195" fill="#64748B" fontSize="10">95 cm</text>
                    <text x="25" y="245" fill="#64748B" fontSize="10">85 cm</text>
                  </>
                ) : (
                  <>
                    <text x="25" y="45" fill="#64748B" fontSize="10">28 kg</text>
                    <text x="25" y="95" fill="#64748B" fontSize="10">23 kg</text>
                    <text x="25" y="145" fill="#64748B" fontSize="10">18 kg</text>
                    <text x="25" y="195" fill="#64748B" fontSize="10">13 kg</text>
                    <text x="25" y="245" fill="#64748B" fontSize="10">8 kg</text>
                  </>
                )}

                {/* Trục X nhãn (Tuổi tháng 24 đến 72) */}
                {WHO_GROWTH_STANDARDS.map((std, idx) => {
                  const x = 60 + idx * 62.5;
                  return (
                    <text key={idx} x={x} y="265" textAnchor="middle" fill="#64748B" fontSize="10">
                      {std.ageMonths} th
                    </text>
                  );
                })}

                {/* Đường cong +2SD (Màu đỏ cam) */}
                <path
                  d={
                    growthMetricType === 'HEIGHT'
                      ? 'M 60,205 Q 185,150 310,105 T 560,45'
                      : 'M 60,195 Q 185,145 310,95 T 560,40'
                  }
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />

                {/* Đường cong Median Chuẩn WHO (Màu xanh đậm #275A4E) */}
                <path
                  d={
                    growthMetricType === 'HEIGHT'
                      ? 'M 60,225 Q 185,170 310,125 T 560,65'
                      : 'M 60,210 Q 185,160 310,115 T 560,60'
                  }
                  fill="none"
                  stroke="#275A4E"
                  strokeWidth="3"
                />

                {/* Đường cong -2SD (Màu vàng cam) */}
                <path
                  d={
                    growthMetricType === 'HEIGHT'
                      ? 'M 60,245 Q 185,190 310,145 T 560,85'
                      : 'M 60,225 Q 185,180 310,135 T 560,80'
                  }
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />

                {/* Vị trí điểm đo thực tế của bé (Màu tím) */}
                {/* Điểm đo lúc 48 tháng (Lần trước) */}
                <circle cx="372" cy={growthMetricType === 'HEIGHT' ? 148 : 130} r="5" fill="#7C3AED" />
                <text x="372" y={growthMetricType === 'HEIGHT' ? 138 : 120} textAnchor="middle" fill="#7C3AED" fontSize="10" fontWeight="bold">
                  Lần trước
                </text>

                {/* Điểm đo hiện tại (53 tháng) */}
                <circle
                  cx="435"
                  cy={
                    growthMetricType === 'HEIGHT'
                      ? 240 - ((selectedStudentForChart.currentHeightCm - 85) / 40) * 195
                      : 240 - ((selectedStudentForChart.currentWeightKg - 8) / 20) * 195
                  }
                  r="7"
                  fill="#7C3AED"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <text
                  x="435"
                  y={
                    (growthMetricType === 'HEIGHT'
                      ? 240 - ((selectedStudentForChart.currentHeightCm - 85) / 40) * 195
                      : 240 - ((selectedStudentForChart.currentWeightKg - 8) / 20) * 195) - 12
                  }
                  textAnchor="middle"
                  fill="#4C1D95"
                  fontSize="11"
                  fontWeight="bold"
                >
                  Hiện tại: {growthMetricType === 'HEIGHT' ? `${selectedStudentForChart.currentHeightCm} cm` : `${selectedStudentForChart.currentWeightKg} kg`}
                </text>
              </svg>
            </div>

            {/* Đánh giá thể trạng chi tiết */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-[#275A4E] shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold">
                  Nhận xét phát triển thể chất: Thể trạng {getBmiBadge(selectedStudentForChart.bmiStatus).label}
                </h5>
                <p className="mt-0.5 text-emerald-900 leading-relaxed">
                  Đường tăng trưởng chiều cao và cân nặng của bé bám sát dải trung vị (Median Z-score) của Tổ chức Y tế Thế giới (WHO). Bé phát triển cân đối và khỏe mạnh.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudentForChart(null)}
                className="rounded-xl bg-[#275A4E] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#1E4D40] transition"
              >
                Đóng Biểu Đồ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL NHẬP DỮ LIỆU TỪ EXCEL ================= */}
      {showExcelImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-700" />
                <h4 className="text-base font-extrabold text-slate-900">
                  Nhập Dữ Liệu Cân Đo Hàng Loạt từ Excel
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowExcelImportModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              <p>
                Tải lên tệp Excel chứa cột: <strong>Mã học sinh</strong>, <strong>Chiều cao (cm)</strong>, <strong>Cân nặng (kg)</strong>, <strong>Ghi chú</strong> để điền nhanh toàn bộ lớp học.
              </p>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition">
                <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Chọn tệp .xlsx hoặc kéo thả tệp vào đây</p>
                <p className="text-[11px] text-slate-400 mt-1">Dung lượng tối đa 10MB</p>
              </div>

              <div className="flex items-center justify-between text-slate-500 pt-2">
                <a
                  href="#download-sample"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Đang tải mẫu file Excel chuẩn: Mau_Can_Do_The_Chat_KidPro.xlsx');
                  }}
                  className="text-[#275A4E] font-bold hover:underline"
                >
                  [Tải tệp mẫu Excel chuẩn]
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExcelImportModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSimulateImportExcel}
                className="rounded-xl bg-[#275A4E] text-white px-5 py-2.5 text-xs font-bold hover:bg-[#1E4D40] transition"
              >
                Nhập Dữ Liệu Vào Bảng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassHealthMetricsTab;
