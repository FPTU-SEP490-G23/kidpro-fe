import React, { useState, useEffect } from 'react';
import kitchenApi from '../../api/kitchenApi';
import { supabase } from '../../config/supabase';
import { WeeklyMenu } from '../../types/kitchen.types';
import {
  UtensilsCrossed,
  Lock,
  Unlock,
  AlertOctagon,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Inbox,
  Plus,
  Trash2,
  Pencil,
  X,
  Flame,
} from 'lucide-react';

interface ClassPortion {
  className: string;
  totalStudents: number;
  absentCount: number;
  standardPortions: number;
  specialDietPortions: number;
  dietNotes?: string;
}

interface AllergyAlert {
  studentName: string;
  className: string;
  allergies: string[];
  severity: 'HIGH' | 'MEDIUM';
}

export const KitchenPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'portions' | 'allergies' | 'menu'>('portions');
  const [classPortions, setClassPortions] = useState<ClassPortion[]>([]);
  const [allergies, setAllergies] = useState<AllergyAlert[]>([]);
  const [weeklyMenuDishes, setWeeklyMenuDishes] = useState<WeeklyMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal thêm món ăn (Task 4)
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [dishForm, setDishForm] = useState<{
    dayOfWeek: number;
    mealType: 'BREAKFAST' | 'LUNCH' | 'SNACK';
    dishName: string;
    calories: number | '';
    nutritionNotes: string;
    allergyTags: string;
  }>({
    dayOfWeek: 1,
    mealType: 'LUNCH',
    dishName: '',
    calories: '',
    nutritionNotes: '',
    allergyTags: '',
  });

  // Modal chỉnh sửa món ăn
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [editDishForm, setEditDishForm] = useState<{
    dayOfWeek: number;
    mealType: 'BREAKFAST' | 'LUNCH' | 'SNACK';
    dishName: string;
    calories: number | '';
    nutritionNotes: string;
    allergyTags: string;
  }>({
    dayOfWeek: 1,
    mealType: 'LUNCH',
    dishName: '',
    calories: '',
    nutritionNotes: '',
    allergyTags: '',
  });

  // Kiểm tra thời gian chốt bếp 08:30 AM
  const now = new Date();
  const cutoffTime = new Date();
  cutoffTime.setHours(8, 30, 0, 0);
  const isLocked = now > cutoffTime;

  // Tải dữ liệu thật từ Database
  const loadKitchenData = async () => {
    setIsLoading(true);
    try {
      // 1. Thử gọi API Backend /api/kitchen/daily-summary
      try {
        const response: any = await kitchenApi.getDailySummary(selectedDate);
        if (response && response.classSummaries && response.classSummaries.length > 0) {
          const mapped: ClassPortion[] = response.classSummaries.map((cs: any) => {
            const total = cs.totalStudents ?? cs.total ?? 0;
            const absent = cs.absentCount ?? cs.absent ?? 0;
            const special = cs.specialDietCount ?? cs.allergySafeCount ?? 0;
            const standard =
              cs.standardMealsToCook ??
              cs.regularMealCount ??
              Math.max(0, total - absent - special);
            return {
              className: cs.className || 'Lớp học',
              totalStudents: total,
              absentCount: absent,
              standardPortions: standard,
              specialDietPortions: special,
              dietNotes:
                cs.allergyNotes ??
                (cs.allergies && cs.allergies !== 'Không có cảnh báo dị ứng'
                  ? cs.allergies
                  : '') ??
                '',
            };
          });
          setClassPortions(mapped);
        } else {
          await loadPortionsFromSupabase();
        }
      } catch {
        await loadPortionsFromSupabase();
      }

      // 2. Tải danh sách dị ứng từ bảng students (ưu tiên academic.students rồi đến public.students)
      let stuAllergies: any[] | null = null;
      try {
        const { data: saAcad, error: saErr } = await supabase
          .schema('academic')
          .from('students')
          .select('full_name, allergy_info, class_id')
          .not('allergy_info', 'is', null)
          .neq('allergy_info', '');
        if (!saErr && saAcad) {
          stuAllergies = saAcad;
        } else {
          const { data: saPub } = await supabase
            .from('students')
            .select('full_name, allergy_info, class_id')
            .not('allergy_info', 'is', null)
            .neq('allergy_info', '');
          if (saPub) stuAllergies = saPub;
        }
      } catch {
        const { data: saPub } = await supabase
          .from('students')
          .select('full_name, allergy_info, class_id')
          .not('allergy_info', 'is', null)
          .neq('allergy_info', '');
        if (saPub) stuAllergies = saPub;
      }

      if (stuAllergies && stuAllergies.length > 0) {
        let classList: any[] | null = null;
        try {
          const { data: clCore, error: clErr } = await supabase
            .schema('core')
            .from('classes')
            .select('id, name');
          if (!clErr && clCore && clCore.length > 0) {
            classList = clCore;
          } else {
            const { data: clPub } = await supabase.from('classes').select('id, name');
            if (clPub) classList = clPub;
          }
        } catch {
          const { data: clPub } = await supabase.from('classes').select('id, name');
          if (clPub) classList = clPub;
        }

        const allergyList: AllergyAlert[] = stuAllergies.map((s: any) => {
          const matchedClass = classList?.find((c: any) => c.id === s.class_id);
          return {
            studentName: s.full_name,
            className: matchedClass?.name || 'Chưa xếp lớp',
            allergies: s.allergy_info ? [s.allergy_info] : [],
            severity: 'HIGH',
          };
        });
        setAllergies(allergyList);
      } else {
        setAllergies([]);
      }

      // 3. Tải thực đơn tuần (Task 4)
      let dbMenus: any[] = [];
      try {
        const resp: any = await kitchenApi.getWeeklyMenus();
        if (resp && Array.isArray(resp)) dbMenus = resp;
      } catch {
        try {
          const { data: kitchenMenus, error: kErr } = await supabase
            .schema('kitchen')
            .from('weekly_menus')
            .select('*')
            .order('day_of_week', { ascending: true });
          if (!kErr && kitchenMenus) {
            dbMenus = kitchenMenus;
          } else {
            const { data: pubMenus } = await supabase
              .from('weekly_menus')
              .select('*')
              .order('day_of_week', { ascending: true });
            if (pubMenus) dbMenus = pubMenus;
          }
        } catch {
          const { data: pubMenus } = await supabase
            .from('weekly_menus')
            .select('*')
            .order('day_of_week', { ascending: true });
          if (pubMenus) dbMenus = pubMenus;
        }
      }

      if (dbMenus && dbMenus.length > 0) {
        setWeeklyMenuDishes(
          dbMenus.map((m: any) => ({
            id: m.id,
            dayOfWeek: m.dayOfWeek ?? m.day_of_week ?? 1,
            mealType: (m.mealType || m.meal_type || 'LUNCH') as any,
            dishName: m.dishName || m.dish_name || 'Món ăn',
            calories: Number(m.calories || 0),
            nutritionNotes: m.nutritionNotes || m.nutrition_notes || '',
            allergyTags: m.allergyTags || m.allergy_tags || '',
          }))
        );
      } else {
        setWeeklyMenuDishes([]);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu bếp:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPortionsFromSupabase = async () => {
    // 1. Tải danh sách lớp: Ưu tiên core.classes, fallback public.classes
    let classesData: any[] | null = null;
    try {
      const { data: cCore, error: cErr } = await supabase
        .schema('core')
        .from('classes')
        .select('id, name');
      if (!cErr && cCore && cCore.length > 0) {
        classesData = cCore;
      } else {
        const { data: cPub } = await supabase.from('classes').select('id, name');
        if (cPub) classesData = cPub;
      }
    } catch {
      const { data: cPub } = await supabase.from('classes').select('id, name');
      if (cPub) classesData = cPub;
    }

    if (!classesData || classesData.length === 0) {
      setClassPortions([]);
      return;
    }

    // 2. Tải danh sách học sinh: Ưu tiên academic.students, fallback public.students
    let allStudents: any[] | null = null;
    try {
      const { data: sAcad, error: sErr } = await supabase
        .schema('academic')
        .from('students')
        .select('id, class_id, allergy_info');
      if (!sErr && sAcad) {
        allStudents = sAcad;
      } else {
        const { data: sPub } = await supabase
          .from('students')
          .select('id, class_id, allergy_info');
        if (sPub) allStudents = sPub;
      }
    } catch {
      const { data: sPub } = await supabase
        .from('students')
        .select('id, class_id, allergy_info');
      if (sPub) allStudents = sPub;
    }

    // 3. Tải attendances: Ưu tiên attendance.attendances, fallback public.attendances
    let allAttendances: any[] | null = null;
    try {
      const { data: aAtt, error: aErr } = await supabase
        .schema('attendance')
        .from('attendances')
        .select('student_id, status')
        .eq('date', selectedDate);
      if (!aErr && aAtt) allAttendances = aAtt;
      else {
        const { data: aPub } = await supabase
          .from('attendances')
          .select('student_id, status')
          .eq('date', selectedDate);
        if (aPub) allAttendances = aPub;
      }
    } catch {
      const { data: aPub } = await supabase
        .from('attendances')
        .select('student_id, status')
        .eq('date', selectedDate);
      if (aPub) allAttendances = aPub;
    }

    // 4. Tải leave_requests: Ưu tiên attendance.leave_requests, fallback public.leave_requests
    let allLeaves: any[] | null = null;
    try {
      const { data: lAtt, error: lErr } = await supabase
        .schema('attendance')
        .from('leave_requests')
        .select('student_id, status')
        .eq('date', selectedDate)
        .eq('status', 'APPROVED');
      if (!lErr && lAtt) allLeaves = lAtt;
      else {
        const { data: lPub } = await supabase
          .from('leave_requests')
          .select('student_id, status')
          .eq('date', selectedDate)
          .eq('status', 'APPROVED');
        if (lPub) allLeaves = lPub;
      }
    } catch {
      const { data: lPub } = await supabase
        .from('leave_requests')
        .select('student_id, status')
        .eq('date', selectedDate)
        .eq('status', 'APPROVED');
      if (lPub) allLeaves = lPub;
    }

    const mappedPortions: ClassPortion[] = classesData.map((cls: any) => {
      const classStudents = allStudents?.filter((s: any) => s.class_id === cls.id) || [];
      const totalInClass = classStudents.length;

      let absentCount = 0;
      let specialDietCount = 0;

      classStudents.forEach((stu: any) => {
        const hasLeave = allLeaves?.some((l: any) => l.student_id === stu.id);
        const att = allAttendances?.find((a: any) => a.student_id === stu.id);
        // Học sinh được tính là vắng nếu có đơn xin nghỉ duyệt hoặc điểm danh ghi nhận vắng (ABSENT_PERMITTED, ABSENT_UNPERMITTED)
        const isAbsent = hasLeave || (att && att.status !== 'PRESENT');

        if (isAbsent) {
          absentCount++;
        } else if (stu.allergy_info && stu.allergy_info.trim().length > 0) {
          specialDietCount++;
        }
      });

      const actualPresent = Math.max(0, totalInClass - absentCount);
      const standardCount = Math.max(0, actualPresent - specialDietCount);

      return {
        className: cls.name,
        totalStudents: totalInClass,
        absentCount: absentCount,
        standardPortions: standardCount,
        specialDietPortions: specialDietCount,
        dietNotes: specialDietCount > 0 ? `${specialDietCount} bé ăn chế độ riêng` : undefined,
      };
    });

    setClassPortions(mappedPortions);
  };

  useEffect(() => {
    loadKitchenData();
  }, [selectedDate]);

  // Thêm món vào thực đơn tuần (Task 4)
  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishForm.dishName.trim()) return;

    try {
      const newDish: WeeklyMenu = {
        dayOfWeek: dishForm.dayOfWeek,
        mealType: dishForm.mealType,
        dishName: dishForm.dishName.trim(),
        calories: dishForm.calories === '' ? undefined : Number(dishForm.calories),
        nutritionNotes: dishForm.nutritionNotes.trim(),
        allergyTags: dishForm.allergyTags.trim(),
        weekStartDate: new Date().toISOString().split('T')[0],
      };

      try {
        await kitchenApi.createWeeklyMenu(newDish);
      } catch {
        const payload = {
          day_of_week: dishForm.dayOfWeek,
          meal_type: dishForm.mealType,
          dish_name: dishForm.dishName.trim(),
          calories: Number(dishForm.calories) || 0,
          nutrition_notes: dishForm.nutritionNotes.trim(),
          allergy_tags: dishForm.allergyTags.trim(),
          week_start_date: new Date().toISOString().split('T')[0],
        };

        // 1. Ưu tiên ghi vào schema kitchen (nơi bảng weekly_menus đang nằm)
        const kitchenRes = await supabase.schema('kitchen').from('weekly_menus').insert([payload]);
        if (kitchenRes.error) {
          // 2. Thử sang public nếu kitchen thất bại
          const pubRes = await supabase.from('weekly_menus').insert([payload]);
          if (pubRes.error) {
            // Ném lỗi từ kitchen để người dùng thấy chính xác nguyên nhân
            throw kitchenRes.error;
          }
        }
      }

      setShowAddDishModal(false);
      setDishForm({
        dayOfWeek: 1,
        mealType: 'LUNCH',
        dishName: '',
        calories: 450,
        nutritionNotes: '',
        allergyTags: '',
      });
      setApiFeedback({ type: 'success', text: '✅ Đã thêm món ăn vào thực đơn tuần thành công!' });
      await loadKitchenData();
    } catch (err: any) {
      console.error('Lỗi khi thêm món ăn:', err);
      const is403 = err.status === 403 || err.code === '42501' || String(err.message).toLowerCase().includes('permission') || String(err.message).toLowerCase().includes('row-level security');
      setApiFeedback({
        type: 'error',
        text: is403
          ? '⚠️ Lỗi 403 (Forbidden): Bảng "kitchen.weekly_menus" chưa được tắt RLS hoặc cấp quyền truy cập. Vui lòng chạy lệnh cấp quyền cho schema kitchen trên Supabase.'
          : `⚠️ Không thể thêm món ăn: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Mở modal chỉnh sửa món ăn
  const handleOpenEditModal = (dish: WeeklyMenu) => {
    if (!dish.id) return;
    setEditingDishId(dish.id);
    setEditDishForm({
      dayOfWeek: Number(dish.dayOfWeek) || 1,
      mealType: (dish.mealType || 'LUNCH') as any,
      dishName: dish.dishName || '',
      calories: dish.calories ?? '',
      nutritionNotes: dish.nutritionNotes || '',
      allergyTags: dish.allergyTags || '',
    });
    setShowEditDishModal(true);
  };

  // Cập nhật món ăn
  const handleUpdateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDishId || !editDishForm.dishName.trim()) return;

    try {
      const updatedData: Partial<WeeklyMenu> = {
        dayOfWeek: editDishForm.dayOfWeek,
        mealType: editDishForm.mealType,
        dishName: editDishForm.dishName.trim(),
        calories: Number(editDishForm.calories) || 0,
        nutritionNotes: editDishForm.nutritionNotes.trim(),
        allergyTags: editDishForm.allergyTags.trim(),
      };

      try {
        await kitchenApi.updateWeeklyMenu(editingDishId, updatedData);
      } catch {
        const payload = {
          day_of_week: editDishForm.dayOfWeek,
          meal_type: editDishForm.mealType,
          dish_name: editDishForm.dishName.trim(),
          calories: Number(editDishForm.calories) || 0,
          nutrition_notes: editDishForm.nutritionNotes.trim(),
          allergy_tags: editDishForm.allergyTags.trim(),
        };

        const kRes = await supabase.schema('kitchen').from('weekly_menus').update(payload).eq('id', editingDishId);
        if (kRes.error) {
          const pubRes = await supabase.from('weekly_menus').update(payload).eq('id', editingDishId);
          if (pubRes.error) throw kRes.error;
        }
      }

      setShowEditDishModal(false);
      setEditingDishId(null);
      setApiFeedback({ type: 'success', text: `✅ Đã cập nhật món "${editDishForm.dishName}" thành công!` });
      await loadKitchenData();
    } catch (err: any) {
      console.error('Lỗi khi cập nhật món ăn:', err);
      const is403 = err.status === 403 || err.code === '42501' || String(err.message).toLowerCase().includes('permission') || String(err.message).toLowerCase().includes('row-level security');
      setApiFeedback({
        type: 'error',
        text: is403
          ? '⚠️ Lỗi 403 (Forbidden): Bảng "kitchen.weekly_menus" chưa được cấp quyền UPDATE hoặc đang bật RLS.'
          : `⚠️ Không thể cập nhật món ăn: ${err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  // Xóa món ăn
  const handleDeleteDish = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) return;
    try {
      try {
        await kitchenApi.deleteWeeklyMenu(id);
      } catch {
        const { error } = await supabase.schema('kitchen').from('weekly_menus').delete().eq('id', id);
        if (error) {
          await supabase.from('weekly_menus').delete().eq('id', id);
        }
      }
      setApiFeedback({ type: 'success', text: '✅ Đã xóa món ăn khỏi thực đơn.' });
      await loadKitchenData();
    } catch (err: any) {
      setApiFeedback({ type: 'error', text: `⚠️ Lỗi xóa món: ${err.message}` });
    }
  };

  // Đồng bộ lại
  const handleSyncSummary = async () => {
    setIsSyncing(true);
    setApiFeedback(null);
    try {
      await loadKitchenData();
      setApiFeedback({
        type: 'success',
        text: `✅ Đã đồng bộ số liệu thành công từ cơ sở dữ liệu!`,
      });
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi đồng bộ: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const totalStudents = classPortions.reduce((acc, c) => acc + c.totalStudents, 0);
  const totalAbsent = classPortions.reduce((acc, c) => acc + c.absentCount, 0);
  const totalStandard = classPortions.reduce((acc, c) => acc + c.standardPortions, 0);
  const totalSpecial = classPortions.reduce((acc, c) => acc + c.specialDietPortions, 0);
  const grandTotalPortions = totalStandard + totalSpecial;

  const dayNames: { [key: number]: string } = {
    1: 'Thứ Hai',
    2: 'Thứ Ba',
    3: 'Thứ Tư',
    4: 'Thứ Năm',
    5: 'Thứ Sáu',
  };

  return (
    <div className="space-y-6">
      {/* Header trang & Bộ chọn ngày */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <UtensilsCrossed className="h-7 w-7 text-amber-600" />
            <span>Báo Bếp & Quản lý Dinh dưỡng</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp suất ăn thực tế, quản lý dị ứng học sinh và thực đơn tuần
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 font-medium shadow-xs focus:border-amber-500 focus:outline-hidden"
            />
            <Calendar className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          </div>

          <button
            onClick={handleSyncSummary}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-100 hover:bg-amber-700 disabled:opacity-50 transition"
          >
            {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>{isSyncing ? 'Đang tải...' : 'Lấy số liệu từ DB'}</span>
          </button>
        </div>
      </div>

      {/* Thông báo kết quả API */}
      {apiFeedback && (
        <div
          className={`rounded-xl p-4 text-sm flex items-center gap-2 ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {apiFeedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{apiFeedback.text}</span>
        </div>
      )}

      {/* Banner 08:30 AM Cutoff Lock Rule */}
      <div
        className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
          isLocked
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2.5 rounded-xl text-white ${
              isLocked ? 'bg-rose-600' : 'bg-emerald-600 animate-pulse'
            }`}
          >
            {isLocked ? <Lock className="h-6 w-6" /> : <Unlock className="h-6 w-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base">
                {isLocked ? 'ĐÃ ĐÓNG BĂNG SUẤT ĂN HÔM NAY' : 'ĐANG MỞ CHỐT SUẤT ĂN'}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isLocked ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                MỐC 08:30 AM
              </span>
            </div>
            <p className="text-xs mt-1 text-slate-600 max-w-xl">
              {isLocked
                ? 'Sau 08:30 AM, dữ liệu chốt suất ăn được khóa cứng để Bếp tiến hành nấu ăn. Mọi đơn nghỉ phát sinh sau giờ này sẽ không được hoàn trừ tiền ăn.'
                : 'Đang tổng hợp điểm danh và đơn xin nghỉ trước 08:00 AM của phụ huynh. Dữ liệu sẽ tự động chốt vào 08:30 AM.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-2xl font-black text-amber-600">
            {isLoading ? '...' : grandTotalPortions} <span className="text-xs font-normal text-slate-500">suất ăn</span>
          </div>
          <p className="text-[11px] text-slate-400">Tổng khẩu phần hôm nay</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('portions')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'portions'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>Suất ăn theo lớp ({classPortions.length} lớp)</span>
        </button>

        <button
          onClick={() => setActiveTab('allergies')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'allergies'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          <span>Cảnh báo Dị ứng ({allergies.length} bé)</span>
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'menu'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Thực đơn tuần Bán trú ({weeklyMenuDishes.length} món)</span>
        </button>
      </div>

      {/* Tab 1: Suất ăn theo lớp */}
      {activeTab === 'portions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-500">Tổng học sinh</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{totalStudents}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-500">Vắng mặt hôm nay</span>
              <p className="text-xl font-bold text-rose-600 mt-1">{totalAbsent}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-500">Suất ăn tiêu chuẩn</span>
              <p className="text-xl font-bold text-emerald-600 mt-1">{totalStandard}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs text-slate-500">Chế độ ăn riêng (Dị ứng)</span>
              <p className="text-xl font-bold text-amber-600 mt-1">{totalSpecial}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
                <p className="text-sm font-medium text-slate-600">Đang tính toán suất ăn...</p>
              </div>
            ) : classPortions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <Inbox className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400" />
                <h3 className="text-base font-semibold text-slate-700">Chưa có dữ liệu lớp học</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Cơ sở dữ liệu Supabase hiện chưa có dữ liệu lớp học hoặc học sinh cho ngày {selectedDate}.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Lớp học</th>
                    <th className="py-3 px-4 text-center">Sĩ số</th>
                    <th className="py-3 px-4 text-center">Vắng mặt</th>
                    <th className="py-3 px-4 text-center">Suất tiêu chuẩn</th>
                    <th className="py-3 px-4 text-center">Ăn riêng / Dị ứng</th>
                    <th className="py-3 px-4">Ghi chú dinh dưỡng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classPortions.map((cp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{cp.className}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">{cp.totalStudents}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-600">{cp.absentCount}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">{cp.standardPortions}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-amber-600">{cp.specialDietPortions}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">{cp.dietNotes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Cảnh báo Dị ứng */}
      {activeTab === 'allergies' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-rose-600 shrink-0" />
            <span>
              <strong>LƯU Ý ĐẶC BIỆT CHO ĐẦU BẾP:</strong> Tuyệt đối không cho học sinh sử dụng các nguyên liệu dưới đây. Sử dụng dụng cụ nấu và khay chia khẩu phần riêng biệt cho trẻ dị ứng cấp độ cao.
            </span>
          </div>

          {allergies.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Không có cảnh báo dị ứng</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Không ghi nhận học sinh nào có thông tin dị ứng thực phẩm trong cơ sở dữ liệu Supabase.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allergies.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-rose-200 bg-white p-4 shadow-xs flex items-start justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800">{item.studentName}</h4>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 font-medium">
                        {item.className}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.allergies.map((allergy, aIdx) => (
                        <span
                          key={aIdx}
                          className="rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700"
                        >
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white tracking-wider">
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Thực đơn tuần (Task 4) */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Quản lý các món ăn theo từng ngày trong tuần và bữa ăn (Sáng, Trưa, Xế chiều) với thông số calo và dinh dưỡng.
            </p>
            <button
              onClick={() => setShowAddDishModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-100 hover:bg-amber-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Món Mới Vào Thực Đơn</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
              <p className="text-sm font-medium text-slate-600">Đang tải thực đơn tuần...</p>
            </div>
          ) : weeklyMenuDishes.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <UtensilsCrossed className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Chưa có món ăn trong thực đơn tuần</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Bảng weekly_menus trên Supabase hiện chưa có bản ghi món ăn nào. Nhấn nút trên để thêm món đầu tiên!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((dayNum) => {
                const dishesOfDay = weeklyMenuDishes.filter((d) => d.dayOfWeek === dayNum);
                return (
                  <div key={dayNum} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-amber-700">{dayNames[dayNum]}</span>
                      <span className="text-[11px] text-slate-400 font-semibold">{dishesOfDay.length} món</span>
                    </div>

                    {dishesOfDay.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có món</p>
                    ) : (
                      dishesOfDay.map((dish) => (
                        <div key={dish.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-xs space-y-1 relative group">
                          <div className="flex items-center justify-between">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                dish.mealType === 'BREAKFAST'
                                  ? 'bg-amber-100 text-amber-800'
                                  : dish.mealType === 'LUNCH'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {dish.mealType === 'BREAKFAST' && 'BỮA SÁNG'}
                              {dish.mealType === 'LUNCH' && 'BỮA TRƯA'}
                              {dish.mealType === 'SNACK' && 'BỮA XẾ'}
                            </span>

                            {dish.id && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(dish)}
                                  className="rounded p-1 text-slate-400 hover:bg-amber-100 hover:text-amber-700 transition"
                                  title="Chỉnh sửa món ăn"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDish(dish.id!)}
                                  className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                                  title="Xóa món ăn"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <p className="font-bold text-slate-800">{dish.dishName}</p>

                          {dish.calories ? (
                            <div className="flex items-center gap-1 text-[11px] text-amber-600 font-semibold">
                              <Flame className="h-3 w-3" />
                              <span>{dish.calories} Kcal</span>
                            </div>
                          ) : null}

                          {dish.nutritionNotes && (
                            <p className="text-[11px] text-slate-500">{dish.nutritionNotes}</p>
                          )}

                          {dish.allergyTags && (
                            <span className="inline-block rounded-md bg-rose-50 text-rose-700 text-[10px] px-1.5 py-0.5 font-bold">
                              Dị ứng: {dish.allergyTags}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL THÊM MÓN ĂN VÀO THỰC ĐƠN (TASK 4) */}
      {showAddDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Thêm Món Ăn Vào Thực Đơn Tuần</h3>
              <button onClick={() => setShowAddDishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Thứ trong tuần</label>
                  <select
                    value={dishForm.dayOfWeek}
                    onChange={(e) => setDishForm({ ...dishForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value={1}>Thứ Hai</option>
                    <option value={2}>Thứ Ba</option>
                    <option value={3}>Thứ Tư</option>
                    <option value={4}>Thứ Năm</option>
                    <option value={5}>Thứ Sáu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại bữa ăn</label>
                  <select
                    value={dishForm.mealType}
                    onChange={(e) => setDishForm({ ...dishForm, mealType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="BREAKFAST">Bữa sáng</option>
                    <option value="LUNCH">Bữa trưa chính</option>
                    <option value="SNACK">Bữa phụ xế chiều</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên món ăn</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cơm sườn rim mè, Canh bí đỏ thịt bằm..."
                  value={dishForm.dishName}
                  onChange={(e) => setDishForm({ ...dishForm, dishName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Năng lượng (Kcal)</label>
                  <input
                    type="number"
                    min={0}
                    value={dishForm.calories}
                    onChange={(e) => setDishForm({ ...dishForm, calories: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-amber-700 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cảnh báo dị ứng (nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: tôm, trứng, đậu phộng..."
                    value={dishForm.allergyTags}
                    onChange={(e) => setDishForm({ ...dishForm, allergyTags: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú dinh dưỡng</label>
                <textarea
                  rows={2}
                  placeholder="VD: Giàu đạm, chất xơ và vitamin A..."
                  value={dishForm.nutritionNotes}
                  onChange={(e) => setDishForm({ ...dishForm, nutritionNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDishModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                >
                  Lưu Món Vào Thực Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA MÓN ĂN TRONG THỰC ĐƠN */}
      {showEditDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                <span>Chỉnh Sửa Món Ăn Trong Thực Đơn</span>
              </h3>
              <button onClick={() => setShowEditDishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateDish} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Thứ trong tuần</label>
                  <select
                    value={editDishForm.dayOfWeek}
                    onChange={(e) => setEditDishForm({ ...editDishForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value={1}>Thứ Hai</option>
                    <option value={2}>Thứ Ba</option>
                    <option value={3}>Thứ Tư</option>
                    <option value={4}>Thứ Năm</option>
                    <option value={5}>Thứ Sáu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Loại bữa ăn</label>
                  <select
                    value={editDishForm.mealType}
                    onChange={(e) => setEditDishForm({ ...editDishForm, mealType: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value="BREAKFAST">Bữa sáng</option>
                    <option value="LUNCH">Bữa trưa chính</option>
                    <option value="SNACK">Bữa phụ xế chiều</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên món ăn (*)</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cơm sườn rim mè, Canh bí đỏ thịt bằm..."
                  value={editDishForm.dishName}
                  onChange={(e) => setEditDishForm({ ...editDishForm, dishName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Năng lượng (Kcal)</label>
                  <input
                    type="number"
                    min={0}
                    value={editDishForm.calories}
                    onChange={(e) => setEditDishForm({ ...editDishForm, calories: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-amber-700 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cảnh báo dị ứng (nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: tôm, trứng, đậu phộng..."
                    value={editDishForm.allergyTags}
                    onChange={(e) => setEditDishForm({ ...editDishForm, allergyTags: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú dinh dưỡng</label>
                <textarea
                  rows={2}
                  placeholder="VD: Giàu đạm, chất xơ và vitamin A..."
                  value={editDishForm.nutritionNotes}
                  onChange={(e) => setEditDishForm({ ...editDishForm, nutritionNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditDishModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700"
                >
                  Cập Nhật Món Ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
