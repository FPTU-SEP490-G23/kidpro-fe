import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Calendar,
  Copy,
  Send,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Flame,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  Sparkles,
  X
} from 'lucide-react';
import { kitchenApi } from '../../../api/kitchenApi';
import { studentAnalyticsApi } from '../../../api/studentAnalyticsApi';
import { DayMenuPlan, WeeklyMenuPayload, WeeklyMenu } from '../../../types/kitchen.types';

// Helper to compute Monday of any given date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDayVn(date: Date): string {
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const ALLERGEN_OPTIONS = [
  { id: 'seafood', label: 'Tôm cua / Hải sản', color: '#DC2626' },
  { id: 'peanuts', label: 'Đậu phộng / Lạc', color: '#DC2626' },
  { id: 'dairy', label: 'Sữa & Chế phẩm bơ sữa', color: '#EA580C' },
  { id: 'eggs', label: 'Trứng gà', color: '#D97706' },
  { id: 'gluten', label: 'Gluten / Bột mì', color: '#65A30D' },
  { id: 'soy', label: 'Đậu nành', color: '#059669' }
];

const WEEKDAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
const EMPTY_WEEK_MENU: DayMenuPlan[] = WEEKDAY_NAMES.map((dayName, index) => ({
  dayOfWeek: index + 1,
  dayName,
  breakfast: '',
  morningSnack: '',
  lunchMainProtein: '',
  lunchVegetable: '',
  lunchSoup: '',
  lunchRice: '',
  lunchDessert: '',
  snack: '',
  calories: 0,
  nutritionNotes: '',
  allergyTags: []
}));

export const WeeklyMenuPlanningTab: React.FC = () => {
  const queryClient = useQueryClient();

  // Current Monday anchor
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [menuDays, setMenuDays] = useState<DayMenuPlan[]>(EMPTY_WEEK_MENU);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Edit Day Modal
  const [editingDay, setEditingDay] = useState<DayMenuPlan | null>(null);

  const mondayStr = formatDateISO(currentMonday);

  const showToast = (type: 'success' | 'error' | 'warning', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // 1. Fetch weekly menu from backend (GET /api/kitchen/menus?weekStartDate=...)
  const { data: serverMenus, isLoading: isMenuLoading, isError: isMenuError, error: menuError } = useQuery({
    queryKey: ['weekly-menu', mondayStr],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getWeeklyMenus(mondayStr);
        const data = res?.data ?? res;
        return Array.isArray(data) ? data : [];
      } catch (err: any) {
        console.warn('Failed to fetch weekly menu:', err);
        return [];
      }
    }
  });

  // Map server dishes to 5-day matrix if available
  useEffect(() => {
    if (!serverMenus) return;
    if (Array.isArray(serverMenus) && serverMenus.length > 0) {
      const mapped = EMPTY_WEEK_MENU.map((defaultDay) => {
        const dishes = serverMenus.filter((dish: WeeklyMenu) => {
          const dayNumber = typeof dish.dayOfWeek === 'number'
            ? dish.dayOfWeek
            : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].indexOf(String(dish.dayOfWeek)) + 1;
          return dayNumber === defaultDay.dayOfWeek;
        });
        if (dishes.length === 0) return defaultDay;

        const breakfastDish = dishes.find((d: WeeklyMenu) => d.mealType === 'BREAKFAST');
        const morningSnackDish = dishes.find((d: WeeklyMenu) => d.mealType === 'MORNING_SNACK');
        const lunchDish = dishes.find((d: WeeklyMenu) => d.mealType === 'LUNCH');
        const snackDish = dishes.find((d: WeeklyMenu) =>
          d.mealType === 'SNACK' || d.mealType === 'AFTERNOON_SNACK');

        const totalCalo = lunchDish?.calories || 0;
        const lunchParts = (lunchDish?.dishName || '').split('|').map((part: string) => part.trim());
        const allAllergies = Array.from(
          new Set(
            dishes
              .map((d) => d.allergyTags || '')
              .join(',')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          )
        );

        return {
          ...defaultDay,
          breakfast: breakfastDish ? breakfastDish.dishName : defaultDay.breakfast,
          morningSnack: morningSnackDish ? morningSnackDish.dishName : defaultDay.morningSnack,
          lunchMainProtein: lunchParts[0] || defaultDay.lunchMainProtein,
          lunchVegetable: lunchParts[1] || defaultDay.lunchVegetable,
          lunchSoup: lunchParts[2] || defaultDay.lunchSoup,
          lunchDessert: lunchParts[3] || defaultDay.lunchDessert,
          snack: snackDish ? snackDish.dishName : defaultDay.snack,
          calories: totalCalo,
          allergyTags: allAllergies.length > 0 ? allAllergies : defaultDay.allergyTags
        };
      });
      setMenuDays(mapped);
    } else {
      setMenuDays(EMPTY_WEEK_MENU);
    }
  }, [serverMenus]);

  // 2. Fetch students with allergies to cross-reference
  const { data: rawAllergyStudents, isError: allergyQueryError } = useQuery({
    queryKey: ['kitchen-allergy-students'],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getStudentsByAllergy();
        const data = res?.data ?? res;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('kitchenApi.getStudentsByAllergy error, falling back to studentAnalyticsApi:', err);
      }
      try {
        const res2: any = await studentAnalyticsApi.getStudents({ hasAllergyOnly: true });
        const data2 = res2?.data ?? res2;
        return Array.isArray(data2) ? data2 : [];
      } catch (err2) {
        console.warn('studentAnalyticsApi fallback error:', err2);
        return [];
      }
    }
  });

  const allergicStudents = useMemo(() => {
    if (!rawAllergyStudents || !Array.isArray(rawAllergyStudents)) return [];
    return rawAllergyStudents.map((stu: any) => {
      const tags: string[] = Array.isArray(stu.allergyTags)
        ? stu.allergyTags
        : (typeof stu.allergyTags === 'string' ? stu.allergyTags.split(',').map((t: string) => t.trim()) : []);
      const allergyInfo = tags.length > 0
        ? tags.join(', ')
        : (stu.allergyInfo || stu.parentNotes || stu.notes || 'Dị ứng thực phẩm');
      return {
        id: stu.id || stu.studentId || `stu-${Math.random()}`,
        studentId: stu.studentId,
        fullName: stu.fullName || stu.studentName || 'Học sinh',
        className: stu.className || 'Chưa xếp lớp',
        allergyInfo,
        allergyTags: tags
      };
    });
  }, [rawAllergyStudents]);

  // Calculate Friday deadline check (BR-039)
  const isAfterFridayDeadline = useMemo(() => {
    const now = new Date();
    // Friday deadline at 17:00 of the previous week
    const currentWeekFriday = new Date(currentMonday);
    currentWeekFriday.setDate(currentMonday.getDate() + 4);
    currentWeekFriday.setHours(17, 0, 0, 0);
    return now > currentWeekFriday;
  }, [currentMonday]);

  // Check Duplicate Main Proteins across the 5 days (MSG-122)
  const duplicateProteins = useMemo(() => {
    const countMap: Record<string, number> = {};
    menuDays.forEach((day) => {
      const protein = day.lunchMainProtein.trim().toLowerCase();
      if (protein) {
        countMap[protein] = (countMap[protein] || 0) + 1;
      }
    });
    return Object.keys(countMap).filter((p) => countMap[p] > 2);
  }, [menuDays]);

  const incompleteDays = menuDays.filter((day) =>
    !day.breakfast.trim() ||
    !day.morningSnack.trim() ||
    !day.lunchMainProtein.trim() ||
    !day.lunchVegetable.trim() ||
    !day.lunchSoup.trim() ||
    !day.lunchDessert.trim() ||
    !day.snack.trim()
  );

  // 3. Save & Publish Menu Mutation (POST /api/kitchen/menus)
  const saveWeeklyMenuMutation = useMutation({
    mutationFn: async (payload: WeeklyMenuPayload) => {
      // Run validation rules before sending
      if (duplicateProteins.length > 0) {
        throw new Error('DUPLICATE_PROTEIN');
      }
      if (incompleteDays.length > 0) {
        throw new Error('MENU_INCOMPLETE');
      }

      return await kitchenApi.saveWeeklyMenuPlan(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-menu'] });
      showToast('success', 'MSG-098: Đã gửi thực đơn tuần để Ban Giám hiệu phê duyệt.');
    },
    onError: (err: any) => {
      if (err.message === 'DUPLICATE_PROTEIN') {
        showToast('error', 'MSG-122: Món đạm chính không được lặp lại quá 2 lần trong tuần.');
      } else if (err.message === 'MENU_INCOMPLETE') {
        showToast('error', 'Vui lòng nhập đầy đủ món ăn cho cả 5 ngày trước khi gửi duyệt.');
      } else {
        showToast('error', err.response?.data?.message || err.message || 'Không thể gửi thực đơn. Vui lòng thử lại.');
      }
    }
  });

  // Week navigation
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Clone from Previous Week action
  const handleClonePreviousWeek = async () => {
    try {
      const prevMonday = new Date(currentMonday);
      prevMonday.setDate(prevMonday.getDate() - 7);
      const prevMondayStr = formatDateISO(prevMonday);

      const res: any = await kitchenApi.getWeeklyMenus(prevMondayStr);
      const prevDishes: WeeklyMenu[] = (res?.data ?? res) || [];

      if (!Array.isArray(prevDishes) || prevDishes.length === 0) {
        showToast('warning', `Tuần trước (${formatDayVn(prevMonday)}) chưa có dữ liệu thực đơn để sao chép.`);
        return;
      }

      const cloned = EMPTY_WEEK_MENU.map((defaultDay) => {
        const dishes = prevDishes.filter((dish: WeeklyMenu) => {
          const dayNumber = typeof dish.dayOfWeek === 'number'
            ? dish.dayOfWeek
            : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].indexOf(String(dish.dayOfWeek)) + 1;
          return dayNumber === defaultDay.dayOfWeek;
        });
        if (dishes.length === 0) return defaultDay;

        const breakfastDish = dishes.find((d: WeeklyMenu) => d.mealType === 'BREAKFAST');
        const morningSnackDish = dishes.find((d: WeeklyMenu) => d.mealType === 'MORNING_SNACK');
        const lunchDish = dishes.find((d: WeeklyMenu) => d.mealType === 'LUNCH');
        const snackDish = dishes.find((d: WeeklyMenu) =>
          d.mealType === 'SNACK' || d.mealType === 'AFTERNOON_SNACK');

        const totalCalo = lunchDish?.calories || 0;
        const lunchParts = (lunchDish?.dishName || '').split('|').map((part: string) => part.trim());
        const allAllergies = Array.from(
          new Set(
            dishes
              .map((d) => d.allergyTags || '')
              .join(',')
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          )
        );

        return {
          ...defaultDay,
          breakfast: breakfastDish ? breakfastDish.dishName : defaultDay.breakfast,
          morningSnack: morningSnackDish ? morningSnackDish.dishName : defaultDay.morningSnack,
          lunchMainProtein: lunchParts[0] || defaultDay.lunchMainProtein,
          lunchVegetable: lunchParts[1] || defaultDay.lunchVegetable,
          lunchSoup: lunchParts[2] || defaultDay.lunchSoup,
          lunchDessert: lunchParts[3] || defaultDay.lunchDessert,
          snack: snackDish ? snackDish.dishName : defaultDay.snack,
          calories: totalCalo,
          allergyTags: allAllergies.length > 0 ? allAllergies : defaultDay.allergyTags
        };
      });

      setMenuDays(cloned);
      showToast('success', `Đã sao chép thành công thực đơn tuần trước (${formatDayVn(prevMonday)}). Bạn có thể chỉnh sửa trước khi gửi duyệt.`);
    } catch (err: any) {
      console.warn('Lỗi khi sao chép thực đơn tuần trước:', err);
      showToast('error', 'Không thể sao chép thực đơn tuần trước. Vui lòng thử lại.');
    }
  };

  // Submit Publish
  const handlePublishMenu = () => {
    const payload: WeeklyMenuPayload = {
      weekStartDate: mondayStr,
      days: menuDays.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        breakfast: d.breakfast,
        morningSnack: d.morningSnack,
        lunch: `${d.lunchMainProtein} | ${d.lunchVegetable} | ${d.lunchSoup} | ${d.lunchDessert}`,
        snack: d.snack,
        calories: d.calories,
        nutritionNotes: d.nutritionNotes,
        allergyTags: d.allergyTags
      }))
    };
    saveWeeklyMenuMutation.mutate(payload);
  };

  // Update a single day from modal
  const handleUpdateDay = (updatedDay: DayMenuPlan) => {
    setMenuDays((prev) => prev.map((d) => (d.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : d)));
    setEditingDay(null);
    showToast('success', `Đã cập nhật thực đơn ${updatedDay.dayName} thành công.`);
  };

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all duration-300 animate-slide-down ${toastMessage.type === 'success'
              ? 'bg-[#EBF7F4] text-[#1E4D40] border-[#78C2AD]'
              : toastMessage.type === 'warning'
                ? 'bg-[#FEF9EE] text-[#9A6B1F] border-[#E5A93C]'
                : 'bg-[#FDF2F2] text-[#DC2626] border-[#F87171]'
            }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-[#275A4E] shrink-0" />
          ) : toastMessage.type === 'warning' ? (
            <AlertTriangle className="h-5 w-5 text-[#E5A93C] shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-[#DC2626] shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Header & Week Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-[#EBF7F4] text-[#275A4E]">
              <UtensilsCrossed className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1E4D40]">
                Thiết Lập Thực Đơn Bán Trú Tuần (UC-029)
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Quy chuẩn năng lượng Bộ GD&ĐT • Cảnh báo tự động dị nguyên nguy hiểm • Đối chiếu hồ sơ trẻ em
              </p>
            </div>
          </div>
        </div>

        {/* Week navigation buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-xs transition"
              title="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#1E4D40] hover:bg-white transition"
            >
              Tuần hiện tại
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-xl text-slate-600 hover:bg-white hover:shadow-xs transition"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleClonePreviousWeek}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs min-h-[44px]"
          >
            <Copy className="h-4 w-4 text-amber-600" />
            <span>Sao chép từ Tuần trước</span>
          </button>

          <button
            onClick={handlePublishMenu}
            disabled={saveWeeklyMenuMutation.isPending || isMenuLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#275A4E] text-white text-xs font-bold hover:bg-[#1E4D40] active:scale-95 transition shadow-sm min-h-[44px]"
          >
            <Send className="h-4 w-4 text-[#78C2AD]" />
            <span>{saveWeeklyMenuMutation.isPending ? 'Đang gửi...' : 'Lưu & Ban Hành Thực Đơn'}</span>
          </button>
        </div>
        {isMenuError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Không thể tải thực đơn tuần: {menuError instanceof Error ? menuError.message : 'Vui lòng thử lại.'}
          </div>
        )}
        {allergyQueryError && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Không thể tải danh sách học sinh dị ứng. Không dùng danh sách trống để kết luận thực đơn an toàn.
          </div>
        )}
      </div>

      {/* Week Title & Age Group Standard Toggle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <Calendar className="h-5 w-5 text-[#E5A93C]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1E4D40]">
              Thực đơn Tuần: {formatDayVn(currentMonday)} đến{' '}
              {formatDayVn(new Date(currentMonday.getTime() + 4 * 24 * 60 * 60 * 1000))}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">
                Hạn duyệt: 17:00 Thứ Sáu (BR-039)
              </span>
              {isAfterFridayDeadline ? (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  Đã quá hạn
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Trong hạn
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Menu variety and allergy controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Flame className="h-4 w-4 text-amber-500" />
            Thông tin năng lượng
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Kcal được lưu cùng món trưa để tham khảo; UC này không chặn gửi duyệt theo ngưỡng kcal hoặc tỷ lệ P:L:C.
          </p>
        </div>

        {/* Protein Diversity Check (MSG-122) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Sparkles className="h-4 w-4 text-[#275A4E]" />
              Chính Sách Đa Dạng Món Đạm (MSG-122)
            </span>
            <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md font-bold">
              Tối đa 2 lần/tuần
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Mỗi món đạm chính (Thịt heo, Cá, Tôm, Bò, Gà) được lặp lại tối đa 2 lần trong tuần.
          </p>

          {duplicateProteins.length > 0 ? (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>Trùng lặp: "{duplicateProteins.join(', ')}". Hãy đổi sang món đạm khác.</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Mỗi món đạm chính xuất hiện không quá 2 lần trong tuần.</span>
            </div>
          )}
        </div>

        {/* Severe Allergy Cross-check (BR-041, BR-042, MSG-121) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700">
              <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
              Đối Soát Dị Ứng Học Sinh ({allergicStudents.length} bé)
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md font-bold">
              Bắt buộc gắn thẻ
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Tự động đối soát thẻ dị ứng của thực đơn với danh bạ học sinh có cơ địa nhạy cảm để Bếp chuẩn bị suất ăn thay thế an toàn.
          </p>

          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Phát hiện {allergicStudents.length} học sinh có tiền sử dị ứng cần khẩu phần riêng.</span>
          </div>
        </div>
      </div>

      {/* ================= 5-DAY MATRIX MENU GRID (MONDAY TO FRIDAY) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Table Header: 5 Days */}
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-[#1E4D40]">
                <th className="p-4 w-48 text-slate-500">Bữa ăn / Tiêu chí</th>
                {menuDays.map((day) => {
                  const dayDate = new Date(currentMonday.getTime() + (day.dayOfWeek - 1) * 24 * 60 * 60 * 1000);

                  return (
                    <th key={day.dayOfWeek} className="p-4 border-l border-slate-200 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-extrabold text-[#1E4D40]">{day.dayName}</span>
                          <span className="text-xs text-slate-400 block font-normal">{formatDayVn(dayDate)}</span>
                        </div>
                        <button
                          onClick={() => setEditingDay(day)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-[#275A4E] hover:text-white text-slate-600 transition"
                          title="Chỉnh sửa món ngày này"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Calorie Gauge Badge */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span
                          className="text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 bg-slate-100 text-slate-700"
                        >
                          <Flame className="h-3 w-3" />
                          {day.calories} kcal
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Bữa Sáng */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span>Bữa Sáng (~07:30)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Món chính + Sữa tươi</span>
                </td>
                {menuDays.map((day) => (
                  <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top">
                    <p className="font-semibold text-slate-800 leading-snug">{day.breakfast}</p>
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>Bữa Phụ Sáng</span>
                  </div>
                </td>
                {menuDays.map((day) => (
                  <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top">
                    <p className="font-semibold text-slate-800 leading-snug">{day.morningSnack}</p>
                  </td>
                ))}
              </tr>

              {/* Row 2: Bữa Trưa Chính */}
              <tr className="hover:bg-slate-50/50 transition bg-[#FBFDFB]">
                <td className="p-4 font-bold text-[#1E4D40] bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#275A4E]" />
                    <span>Bữa Trưa (~11:00)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Đạm, Xào, Canh, Cơm, Tráng miệng
                  </span>
                </td>
                {menuDays.map((day) => (
                  <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top space-y-1.5">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Món đạm chính:</span>
                      <p className="font-bold text-[#1E4D40]">{day.lunchMainProtein}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Món xào / luộc:</span>
                      <p className="text-slate-700 font-medium">{day.lunchVegetable}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Canh bổ dưỡng:</span>
                      <p className="text-slate-700 font-medium">{day.lunchSoup}</p>
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Cơm: {day.lunchRice}</span>
                      <span className="text-amber-700 font-semibold">{day.lunchDessert}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 3: Bữa Xế Chiều */}
              <tr className="hover:bg-slate-50/50 transition">
                <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    <span>Bữa Xế (~14:30)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Súp / Cháo / Sữa chua</span>
                </td>
                {menuDays.map((day) => (
                  <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top">
                    <p className="font-semibold text-slate-800 leading-snug">{day.snack}</p>
                  </td>
                ))}
              </tr>

              {/* Row 4: Thống Kê Năng Lượng & Ghi Chú */}
              <tr className="hover:bg-slate-50/50 transition bg-slate-50/20">
                <td className="p-4 font-bold text-slate-700 bg-slate-50/30">
                  <span>Ghi Chú Dinh Dưỡng</span>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">Khẩu phần & vi chất</span>
                </td>
                {menuDays.map((day) => (
                  <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top">
                    <p className="text-slate-600 text-[11px] italic">
                      "{day.nutritionNotes || 'Đầy đủ dưỡng chất thiết yếu cho trẻ'}"
                    </p>
                  </td>
                ))}
              </tr>

              {/* Row 5: Thẻ Dị Ứng Cảnh Báo (BR-041, BR-042, MSG-121) */}
              <tr className="hover:bg-slate-50/50 transition bg-[#FFFDFD]">
                <td className="p-4 font-bold text-[#DC2626] bg-slate-50/30">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-[#DC2626]" />
                    <span>Thẻ Dị Ứng</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                    Dị nguyên cần phòng ngừa
                  </span>
                </td>
                {menuDays.map((day) => {
                  const hasSevereAllergens = day.allergyTags.length > 0;
                  return (
                    <td key={day.dayOfWeek} className="p-4 border-l border-slate-100 align-top space-y-1">
                      {hasSevereAllergens ? (
                        <div className="flex flex-wrap gap-1">
                          {day.allergyTags.map((tagId) => {
                            const opt = ALLERGEN_OPTIONS.find((o) => o.id === tagId);
                            return (
                              <span
                                key={tagId}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                                style={{ backgroundColor: opt?.color || '#DC2626' }}
                              >
                                {opt?.label || tagId}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          Không có dị nguyên nguy hiểm
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Allergic Students Quick Inspection Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Danh Sách Trẻ Cần Chế Biến Suất Ăn Thay Thế Trong Tuần
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Đối chiếu từ cơ sở dữ liệu y tế học sinh (GET /api/academic/students/by-allergy)
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl">
            {allergicStudents.length} học sinh cần lưu ý đặc biệt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {allergicStudents.map((stu: any) => (
            <div
              key={stu.id}
              className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{stu.fullName}</span>
                <span className="text-slate-500 font-semibold">{stu.className}</span>
              </div>
              <p className="text-[11px] text-[#DC2626] font-extrabold flex items-center gap-1">
                <span>⚠️ {stu.allergyInfo || 'Dị ứng thực phẩm nặng'}</span>
              </p>
              <p className="text-[10px] text-slate-500 italic">
                Bếp trưởng yêu cầu tách xoong nồi và suất ăn riêng biệt.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= MODAL: CHỈNH SỬA THỰC ĐƠN NGÀY (DAY MENU EDITOR) ================= */}
      {editingDay && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 overflow-hidden shadow-2xl relative">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#E5A93C]" />
                <h3 className="font-bold text-base">Chỉnh Sửa Thực Đơn {editingDay.dayName}</h3>
              </div>
              <button
                onClick={() => setEditingDay(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const updated: DayMenuPlan = {
                  ...editingDay,
                  breakfast: formData.get('breakfast') as string,
                  morningSnack: formData.get('morningSnack') as string,
                  lunchMainProtein: formData.get('lunchMainProtein') as string,
                  lunchVegetable: formData.get('lunchVegetable') as string,
                  lunchSoup: formData.get('lunchSoup') as string,
                  lunchDessert: formData.get('lunchDessert') as string,
                  snack: formData.get('snack') as string,
                  calories: Number(formData.get('calories')) || editingDay.calories,
                  nutritionNotes: formData.get('nutritionNotes') as string
                };
                handleUpdateDay(updated);
              }}
              className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bữa Sáng (~07:30): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="breakfast"
                  defaultValue={editingDay.breakfast}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bữa Phụ Sáng: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="morningSnack"
                  defaultValue={editingDay.morningSnack}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-[#1E4D40] block">Các món Bữa Trưa (~11:00):</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Món đạm chính (Thịt/Cá/Tôm): <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lunchMainProtein"
                      defaultValue={editingDay.lunchMainProtein}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Món xào / rau củ:
                    </label>
                    <input
                      type="text"
                      name="lunchVegetable"
                      defaultValue={editingDay.lunchVegetable}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Món canh bổ dưỡng:
                    </label>
                    <input
                      type="text"
                      name="lunchSoup"
                      defaultValue={editingDay.lunchSoup}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Tráng miệng:
                    </label>
                    <input
                      type="text"
                      name="lunchDessert"
                      defaultValue={editingDay.lunchDessert}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bữa Xế Chiều (~14:30): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="snack"
                  defaultValue={editingDay.snack}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kcal (tham khảo):
                  </label>
                  <input
                    type="number"
                    name="calories"
                    defaultValue={editingDay.calories}
                    min="0"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Ghi chú dinh dưỡng:
                  </label>
                  <input
                    type="text"
                    name="nutritionNotes"
                    defaultValue={editingDay.nutritionNotes}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#275A4E]"
                  />
                </div>
              </div>

              {/* Multi-select Allergens with Red tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Thẻ Dị Nguyên Xuất Hiện Trong Món:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALLERGEN_OPTIONS.map((opt) => {
                    const isChecked = editingDay.allergyTags.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition ${isChecked
                            ? 'bg-rose-50 border-rose-300 font-bold text-rose-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingDay({
                                ...editingDay,
                                allergyTags: [...editingDay.allergyTags, opt.id]
                              });
                            } else {
                              setEditingDay({
                                ...editingDay,
                                allergyTags: editingDay.allergyTags.filter((t) => t !== opt.id)
                              });
                            }
                          }}
                          className="rounded-md text-[#DC2626] focus:ring-[#DC2626]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingDay(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 min-h-[44px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-[#275A4E] text-white text-xs font-bold hover:bg-[#1E4D40] transition min-h-[44px]"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyMenuPlanningTab;
