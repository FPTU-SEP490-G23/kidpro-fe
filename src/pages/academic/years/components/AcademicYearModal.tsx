import React, { useEffect, useMemo } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { AcademicYear, CreateAcademicYearInput } from '../../../../types/academicYear.types';
import {
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

// Hàm tính số tuần thực học giữa 2 mốc ngày
export const calculateWeeksBetween = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  return Math.floor(diffDays / 7);
};

// Zod Schema Validation theo đúng DB academic.academic_years
const academicYearSchema = z
  .object({
    name: z
      .string()
      .min(3, 'Tên niên khóa phải có ít nhất 3 ký tự (VD: 2026-2027)')
      .regex(/^\d{4}[-–—]\d{4}$/, 'Định dạng niên khóa phải là YYYY-YYYY (VD: 2026-2027)'),
    startDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu năm học'),
    endDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc năm học'),
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
  );

type AcademicYearFormData = z.infer<typeof academicYearSchema>;

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAcademicYearInput) => Promise<void>;
  initialData?: AcademicYear | null;
  isLoading?: boolean;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AcademicYearFormData>({
    resolver: async (values) => {
      const result = academicYearSchema.safeParse(values);
      if (result.success) {
        return { values: result.data, errors: {} };
      }
      const formattedErrors: Record<string, { type: string; message: string }> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!formattedErrors[path]) {
          formattedErrors[path] = { type: 'manual', message: issue.message };
        }
      });
      return { values: {}, errors: formattedErrors };
    },
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
    },
  });

  const startDateWatch = watch('startDate');
  const endDateWatch = watch('endDate');

  // Tính số tuần thực học
  const calculatedWeeks = useMemo(() => {
    return calculateWeeksBetween(startDateWatch, endDateWatch);
  }, [startDateWatch, endDateWatch]);

  const isWeeksValid = calculatedWeeks >= 35;

  // Điền dữ liệu khi sửa
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
      });
    } else {
      reset({
        name: '2026-2027',
        startDate: '2026-09-05',
        endDate: '2027-05-31',
      });
    }
  }, [initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (values: AcademicYearFormData) => {
    await onSubmit({
      name: values.name,
      startDate: values.startDate,
      endDate: values.endDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <GraduationCap className="w-5 h-5 text-[#78C2AD]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {isEditing ? 'Cập Nhật Niên Khóa' : 'Thiết Lập Niên Khóa Mới'}
              </h3>
              <p className="text-xs text-[#78C2AD]">
                UC-005 • Ban Giám Hiệu • Đồng bộ cơ sở dữ liệu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* Tên niên khóa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tên Niên Khóa <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="2026-2027"
                {...register('name')}
                className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold transition outline-none ${
                  errors.name
                    ? 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500'
                    : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E]'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                Định dạng YYYY-YYYY
              </span>
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Khung ngày Bắt đầu - Kết thúc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ngày Bắt Đầu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('startDate')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition outline-none ${
                    errors.startDate
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E]'
                  }`}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ngày Kết Thúc <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  {...register('endDate')}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition outline-none ${
                    errors.endDate
                      ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                      : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E]'
                  }`}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Thẻ kiểm tra số tuần thực học tự động (BR-005) */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isWeeksValid
                ? 'bg-emerald-50/60 border-emerald-200'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isWeeksValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Thời lượng năm học: <span className="text-sm font-extrabold">{calculatedWeeks} tuần</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isWeeksValid
                      ? 'Đạt tiêu chuẩn tối thiểu 35 tuần theo quy định Bộ GD&ĐT.'
                      : 'Chưa đủ 35 tuần thực học theo quy định chuẩn Bộ GD&ĐT.'}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isWeeksValid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isWeeksValid ? 'ĐẠT CHUẨN' : 'CHƯA ĐỦ'}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || !isWeeksValid}
              className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo niên khóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearModal;
