import React, { useEffect, useMemo } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { AcademicYear, CreateAcademicYearInput } from '../../../../types/academicYear.types';
import {
  Calendar,
  Layers,
  Building,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  HelpCircle,
  GraduationCap,
} from 'lucide-react';

// Hàm tính số tuần giữa 2 mốc ngày
export const calculateWeeksBetween = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
};

// Zod Schema Validation
const academicYearSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Tên niên khóa phải có ít nhất 3 ký tự (VD: 2026-2027)')
      .regex(/^\d{4}-\d{4}$/, 'Định dạng niên khóa phải là YYYY-YYYY (VD: 2026-2027)'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu năm học'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc năm học'),
    term1Start: z.string().min(1, 'Vui lòng chọn ngày bắt đầu Học kỳ I'),
    term1End: z.string().min(1, 'Vui lòng chọn ngày kết thúc Học kỳ I'),
    term2Start: z.string().min(1, 'Vui lòng chọn ngày bắt đầu Học kỳ II'),
    term2End: z.string().min(1, 'Vui lòng chọn ngày kết thúc Học kỳ II'),
    nurseryQuota: z.coerce.number().min(0, 'Chỉ tiêu không được âm'),
    mamQuota: z.coerce.number().min(0, 'Chỉ tiêu không được âm'),
    choiQuota: z.coerce.number().min(0, 'Chỉ tiêu không được âm'),
    laQuota: z.coerce.number().min(0, 'Chỉ tiêu không được âm'),
    maxSchoolCapacity: z.coerce.number().min(50, 'Công suất tối thiểu 50 trẻ'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      const weeks = calculateWeeksBetween(data.startDate, data.endDate);
      return weeks >= 35;
    },
    {
      message: 'MSG-034: Năm học phải đảm bảo tối thiểu 35 tuần thực học theo đúng khung thời gian của Bộ GD&ĐT.',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      const total = data.nurseryQuota + data.mamQuota + data.choiQuota + data.laQuota;
      return total <= (data.maxSchoolCapacity || 350);
    },
    {
      message: 'MSG-036: Tổng chỉ tiêu tuyển sinh vượt quá công suất cơ sở vật chất được cấp phép của trường.',
      path: ['laQuota'],
    }
  );

type FormValues = z.infer<typeof academicYearSchema>;

const createZodResolver = <T extends Record<string, any>>(schema: z.ZodType<any, any, any>): Resolver<T> => {
  return async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const errors: Record<string, any> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString() || 'root';
      if (!errors[field]) {
        errors[field] = {
          type: issue.code,
          message: issue.message,
        };
      }
    }
    return { values: {} as any, errors };
  };
};

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAcademicYearInput) => Promise<void>;
  initialData?: AcademicYear | null;
  isSubmitting: boolean;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: createZodResolver<FormValues>(academicYearSchema),
    defaultValues: {
      name: initialData?.name || '2026-2027',
      startDate: initialData?.startDate || '2026-09-01',
      endDate: initialData?.endDate || '2027-05-31',
      term1Start: initialData?.term1Start || '2026-09-01',
      term1End: initialData?.term1End || '2027-01-15',
      term2Start: initialData?.term2Start || '2027-01-18',
      term2End: initialData?.term2End || '2027-05-31',
      nurseryQuota: initialData?.nurseryQuota ?? 45,
      mamQuota: initialData?.mamQuota ?? 75,
      choiQuota: initialData?.choiQuota ?? 85,
      laQuota: initialData?.laQuota ?? 95,
      maxSchoolCapacity: initialData?.maxSchoolCapacity ?? 350,
      notes: initialData?.notes || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        term1Start: initialData.term1Start,
        term1End: initialData.term1End,
        term2Start: initialData.term2Start,
        term2End: initialData.term2End,
        nurseryQuota: initialData.nurseryQuota,
        mamQuota: initialData.mamQuota,
        choiQuota: initialData.choiQuota,
        laQuota: initialData.laQuota,
        maxSchoolCapacity: initialData.maxSchoolCapacity || 350,
        notes: initialData.notes || '',
      });
    } else {
      reset({
        name: '2027-2028',
        startDate: '2027-09-01',
        endDate: '2028-05-31',
        term1Start: '2027-09-01',
        term1End: '2028-01-14',
        term2Start: '2028-01-17',
        term2End: '2028-05-31',
        nurseryQuota: 50,
        mamQuota: 80,
        choiQuota: 90,
        laQuota: 100,
        maxSchoolCapacity: 350,
        notes: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const currentStartDate = watch('startDate');
  const currentEndDate = watch('endDate');
  const currentNursery = Number(watch('nurseryQuota') || 0);
  const currentMam = Number(watch('mamQuota') || 0);
  const currentChoi = Number(watch('choiQuota') || 0);
  const currentLa = Number(watch('laQuota') || 0);
  const maxCapacity = Number(watch('maxSchoolCapacity') || 350);

  const calculatedWeeks = useMemo(() => {
    return calculateWeeksBetween(currentStartDate, currentEndDate);
  }, [currentStartDate, currentEndDate]);

  const totalQuota = currentNursery + currentMam + currentChoi + currentLa;
  const isOverCapacity = totalQuota > maxCapacity;
  const isUnder35Weeks = calculatedWeeks > 0 && calculatedWeeks < 35;

  if (!isOpen) return null;

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit(values as CreateAcademicYearInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#275A4E]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Chỉnh Sửa Kế Hoạch Năm Học' : 'Thiết Lập Kế Hoạch Năm Học & Tuyển Sinh'}
              </h3>
              <p className="text-xs text-slate-500">Khung thời gian GD&ĐT và phân bổ chỉ tiêu các khối lớp</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-6 space-y-6">
          {/* Nhóm 1: Thông tin Niên khóa & Thời gian */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#275A4E] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              1. Khung Thời Gian Niên Khóa Học (BR-008 Tối Thiểu 35 Tuần)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Niên Khóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="2026-2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày Bắt Đầu Năm Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('startDate')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
                {errors.startDate && <p className="text-xs text-rose-600 mt-1">{errors.startDate.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngày Kết Thúc Năm Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('endDate')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
                />
                {errors.endDate && <p className="text-xs text-rose-600 mt-1">{errors.endDate.message}</p>}
              </div>
            </div>

            {/* Chỉ báo số tuần thực học */}
            <div
              className={`p-3 rounded-xl flex items-center justify-between text-xs ${
                isUnder35Weeks
                  ? 'bg-rose-50 border border-rose-300 text-rose-900'
                  : 'bg-emerald-50 border border-[#78C2AD] text-[#1E4D40]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isUnder35Weeks ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#275A4E] shrink-0" />
                )}
                <span>
                  {isUnder35Weeks
                    ? `MSG-034: Năm học hiện chỉ có ${calculatedWeeks} tuần. Phải đảm bảo tối thiểu 35 tuần thực học theo đúng khung thời gian của Bộ GD&ĐT.`
                    : `Khung thời gian hợp lệ: ${calculatedWeeks} tuần thực học (Đạt chuẩn quy định Bộ GD&ĐT ≥ 35 tuần).`}
                </span>
              </div>
              <span className="font-bold text-sm shrink-0">{calculatedWeeks} Tuần</span>
            </div>

            {/* Mốc thời gian Học kỳ I & Học kỳ II */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700">Mốc thời gian Học kỳ I:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Bắt đầu HK1:</span>
                    <input
                      type="date"
                      {...register('term1Start')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Kết thúc HK1:</span>
                    <input
                      type="date"
                      {...register('term1End')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700">Mốc thời gian Học kỳ II:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Bắt đầu HK2:</span>
                    <input
                      type="date"
                      {...register('term2Start')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Kết thúc HK2:</span>
                    <input
                      type="date"
                      {...register('term2End')}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nhóm 2: Cấu hình Chỉ tiêu Tuyển sinh từng khối */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#275A4E] flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              2. Định Mức Chỉ Tiêu Tuyển Sinh Từng Khối Lớp (Trẻ)
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nhà Trẻ (18-36th)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('nurseryQuota')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Khối Mầm (3-4t)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('mamQuota')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Khối Chồi (4-5t)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('choiQuota')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Khối Lá (5-6t)
                </label>
                <input
                  type="number"
                  min="0"
                  {...register('laQuota')}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Tổng chỉ tiêu & Công suất trường */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Tổng chỉ tiêu tuyển sinh:</span>
                <span
                  className={`text-base font-bold ${
                    isOverCapacity ? 'text-rose-600' : 'text-[#275A4E]'
                  }`}
                >
                  {totalQuota} / {maxCapacity} trẻ ({Math.round((totalQuota / maxCapacity) * 100)}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isOverCapacity ? 'bg-rose-500' : 'bg-[#275A4E]'
                  }`}
                  style={{ width: `${Math.min(100, (totalQuota / maxCapacity) * 100)}%` }}
                ></div>
              </div>

              {isOverCapacity && (
                <p className="text-xs font-semibold text-rose-600 pt-1 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>MSG-036: Tổng chỉ tiêu tuyển sinh vượt quá công suất cơ sở vật chất được cấp phép của trường.</span>
                </p>
              )}
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú / Kế hoạch triển khai đặc thù
              </label>
              <textarea
                {...register('notes')}
                rows={2}
                placeholder="VD: Dự kiến nâng cấp phòng học Montessori, chỉ tiêu theo phê duyệt Phòng GD&ĐT..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#275A4E]/30 focus:border-[#275A4E]"
              ></textarea>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUnder35Weeks || isOverCapacity}
              className="bg-[#275A4E] hover:bg-[#1E4D40] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-[#78C2AD]" />
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Lưu Kế Hoạch Năm Học'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearModal;
