import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Printer,
  Camera,
  Trash2,
  Plus,
  Archive,
  Check,
  Scale,
  FileCheck,
  X,
} from 'lucide-react';
import { kitchenApi } from '../../../api/kitchenApi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FoodSampleRetention,
  MealSessionType
} from '../../../types/kitchen.types';

const getDefaultRetentionDate = () => {
  const now = new Date();
  const day = now.getDay(); // 0: Sun, 6: Sat
  if (day === 6) {
    now.setDate(now.getDate() - 1);
  } else if (day === 0) {
    now.setDate(now.getDate() - 2);
  }
  return now.toISOString().split('T')[0];
};

const getMondayOfWeek = (dStr: string) => {
  const d = new Date(dStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const getErrorMessage = (error: unknown) => {
  if (isAxiosError<{ message?: string; errors?: Record<string, string> }>(error)) {
    const response = error.response?.data;
    const validationMessages = Object.values(response?.errors ?? {});
    return response?.message || validationMessages.join(' ') || error.message;
  }
  return error instanceof Error ? error.message : 'Vui lòng thử lại sau.';
};

export const FoodRetentionConsumptionTab: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const foodSamplesQuery = useQuery({
    queryKey: ['food-samples'],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getFoodSamples();
        const data = res?.data ?? res;
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn('Failed to fetch food samples:', e);
        return [];
      }
    }
  });
  const storedSamples: FoodSampleRetention[] = foodSamplesQuery.data ?? [];

  // Toast / Thông báo
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);

  // ==========================================
  // KHỐI 1: FORM LƯU MẪU THỨC ĂN 24H (Section 2)
  // ==========================================
  const [selectedMealSession, setSelectedMealSession] = useState<MealSessionType>('LUNCH');
  const [retentionDate, setRetentionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [fridgeTemperature, setFridgeTemperature] = useState<number>(4.0); // Bắt buộc 2°C - 8°C
  const [samplesToSave, setSamplesToSave] = useState<{ dishName: string; weightGrams: number; sealCode: string }[]>([]);

  // Lấy danh sách món ăn từ thực đơn được duyệt trong database
  const availableDishesQuery = useQuery({
    queryKey: ['available-dishes', retentionDate, selectedMealSession],
    queryFn: () => kitchenApi.getAvailableDishes(retentionDate, selectedMealSession),
  });
  const availableDishes: string[] = availableDishesQuery.data ?? [];

  // Tự động nạp danh sách món ăn từ thực đơn vào danh sách lưu mẫu
  React.useEffect(() => {
    const dishes = Array.isArray(availableDishesQuery.data)
      ? availableDishesQuery.data
      : (availableDishesQuery.data as any)?.data ?? [];
    if (dishes.length > 0) {
      setSamplesToSave(
        dishes.map((dish: string, idx: number) => ({
          dishName: dish,
          weightGrams: 100,
          sealCode: `NP-${retentionDate.replace(/-/g, '')}-0${idx + 1}`
        }))
      );
    }
  }, [availableDishesQuery.data, retentionDate, selectedMealSession]);

  // ==========================================
  // KHỐI 2: TIÊU HAO THỰC PHẨM & QUYẾT TOÁN KHO
  // ==========================================
  const [isExportInspectionModalOpen, setIsExportInspectionModalOpen] = useState<boolean>(false);

  // Mutation: Lưu mẫu thức ăn 24h (POST /api/kitchen/food-samples)
  const saveSampleMutation = useMutation({
    mutationFn: async () => {
      if (samplesToSave.length === 0) {
        throw new Error('Vui lòng thêm ít nhất một món ăn trước khi lưu mẫu.');
      }

      // Validate BR-043: Nhiệt độ bắt buộc 2°C - 8°C
      if (fridgeTemperature < 2 || fridgeTemperature > 8) {
        throw new Error(
          'Nhiệt độ lưu mẫu thức ăn bắt buộc phải duy trì trong khoảng 2°C đến 8°C theo quy chuẩn an toàn thực phẩm.'
        );
      }

      // Validate BR-043: Khối lượng mẫu >= 100g hoặc >= 150ml canh
      for (const item of samplesToSave) {
        if (!item.dishName.trim()) {
          throw new Error('Toàn bộ các món ăn phục vụ học sinh bắt buộc phải có mẫu thức ăn lưu 24h không được bỏ sót.');
        }
        if (item.weightGrams < 100) {
          throw new Error(`Món "${item.dishName}" chưa đạt khối lượng tối thiểu 100g theo Thông tư 47/2010/TT-BYT!`);
        }
      }

      const sealCodes = samplesToSave.map((item) => item.sealCode.trim().toLowerCase());
      if (new Set(sealCodes).size !== sealCodes.length) {
        throw new Error('Mỗi mẫu phải sử dụng một mã niêm phong khác nhau.');
      }

      const promises = samplesToSave.map((s) =>
        kitchenApi.createFoodSample({
          date: retentionDate,
          mealSession: selectedMealSession,
          dishName: s.dishName,
          sampleWeightGrams: s.weightGrams,
          sealCode: s.sealCode,
          storageTemperatureCelsius: fridgeTemperature,
        })
      );
      const results = await Promise.allSettled(promises);
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        const successfulCount = results.length - failures.length;
        const firstFailure = failures[0];
        const reason = firstFailure.status === 'rejected'
          ? getErrorMessage(firstFailure.reason)
          : 'Vui lòng thử lại sau.';
        throw new Error(`Đã lưu ${successfulCount}/${results.length} mẫu; một số mẫu chưa lưu được. ${reason}`);
      }
      return results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    },
    onSuccess: () => {
      setSamplesToSave([]);
      setToastMessage({
        type: 'success',
        text: 'Đã lưu mẫu thức ăn vào sổ lưu mẫu.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: getErrorMessage(err)
      });
    }
  });

  const disposeSampleMutation = useMutation({
    mutationFn: async (sampleId: string) => kitchenApi.disposeFoodSample(sampleId, {
      noFoodSafetyIncidentConfirmed: true
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
      setToastMessage({
        type: 'success',
        text: 'Đã ghi nhận tiêu hủy mẫu lưu và lưu nhật ký kiểm toán.'
      });
    },
    onError: (error: unknown) => {
      setToastMessage({ type: 'error', text: getErrorMessage(error) });
    }
  });

  // Xử lý thêm món lưu mẫu
  const handleAddSampleRow = () => {
    const nextIdx = samplesToSave.length + 1;
    setSamplesToSave((prev) => [
      ...prev,
      {
        dishName: '',
        weightGrams: 100,
        sealCode: `NP-${retentionDate.replace(/-/g, '')}-0${nextIdx}`
      }
    ]);
  };

  const handleRemoveSampleRow = (index: number) => {
    setSamplesToSave((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateSampleRow = (
    index: number,
    field: 'dishName' | 'weightGrams' | 'sealCode',
    value: any
  ) => {
    setSamplesToSave((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Cập nhật khối lượng tiêu hao thực tế
  return (
    <div className="space-y-6">
      {/* Toast Notification Box */}
      {toastMessage && (
        <div
          className={`flex items-start justify-between p-4 rounded-2xl border shadow-sm transition-all duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-4"
          >
            Đóng
          </button>
        </div>
      )}
      {foodSamplesQuery.isError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Không thể tải sổ lưu mẫu: {getErrorMessage(foodSamplesQuery.error)}
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-[#275A4E] text-white shadow-md shadow-emerald-900/10 flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <span>Sổ Lưu Mẫu Thức Ăn Bán Trú</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportInspectionModalOpen(true)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 min-h-[44px] shadow-2xs"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Xuất Biên Bản Kiểm Thực 3 Bước</span>
          </button>
        </div>
      </div>

      {/* FORM GHI NHẬN LƯU MẪU 24 GIỜ (Section 2 - 24h Retention Logger Form) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#275A4E]/10 text-[#275A4E]">
                  <Thermometer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Ghi Nhật Ký Lưu Mẫu Thức Ăn Bán Trú
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khối lượng mẫu ≥ 100g, bảo quản ở 2°C - 8°C. Hệ thống tự động đếm lùi thời gian lưu tối thiểu 24 giờ theo QĐ 1246/QĐ-BYT.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Chọn bữa ăn */}
                <div className="flex rounded-xl bg-slate-100 p-1">
                  {(['LUNCH', 'SNACK', 'BREAKFAST'] as MealSessionType[]).map((session) => (
                    <button
                      key={session}
                      type="button"
                      onClick={() => setSelectedMealSession(session)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        selectedMealSession === session
                          ? 'bg-white text-[#275A4E] shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {session === 'LUNCH' ? 'Bữa Trưa' : session === 'SNACK' ? 'Bữa Xế' : 'Bữa Sáng'}
                    </button>
                  ))}
                </div>

                {/* Chọn ngày */}
                <input
                  type="date"
                  value={retentionDate}
                  onChange={(e) => setRetentionDate(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Cài đặt nhiệt độ tủ lạnh bảo quản (BR-043 / MSG-132) */}
            <div className="rounded-2xl bg-teal-50/60 border border-teal-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-600 text-white">
                  <Thermometer className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-900 block">
                    Nhiệt Độ Tủ Lạnh Chuyên Dụng Lưu Nghiệm (2°C - 8°C)
                  </span>
                  <p className="text-[11px] text-teal-800 mt-0.5">
                    Yêu cầu đo nhiệt độ thực tế bằng nhiệt kế điện tử trước khi niêm phong mẫu.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-slate-700">Nhiệt độ hiện tại:</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="1"
                    max="10"
                    value={fridgeTemperature}
                    onChange={(e) => setFridgeTemperature(parseFloat(e.target.value) || 0)}
                    className={`w-24 px-3 py-1.5 rounded-xl text-center font-mono font-bold text-sm border focus:outline-hidden ${
                      fridgeTemperature >= 2 && fridgeTemperature <= 8
                        ? 'border-emerald-300 bg-white text-emerald-800'
                        : 'border-red-400 bg-red-50 text-red-700 ring-2 ring-red-300'
                    }`}
                  />
                  <span className="pointer-events-none absolute right-2.5 top-1.5 text-xs text-slate-500 font-bold">
                    °C
                  </span>
                </div>
                {fridgeTemperature < 2 || fridgeTemperature > 8 ? (
                  <span className="text-[11px] font-bold text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> Ngoài dải 2-8°C!
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Đạt chuẩn
                  </span>
                )}
              </div>
            </div>

            {/* Danh sách các món ăn cần lưu mẫu */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Danh Sách Món Ăn Bắt Buộc Lưu Nghiệm ({samplesToSave.length} món)
                </span>
                <button
                  type="button"
                  onClick={handleAddSampleRow}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm món khác</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Tên Món Ăn Trong Thực Đơn</th>
                      <th className="py-2.5 px-3 text-center">Khối Lượng Mẫu (≥ 100g)</th>
                      <th className="py-2.5 px-3 text-center">Mã Tem Niêm Phong</th>
                      <th className="py-2.5 px-3 text-center">Đánh Giá Chuẩn</th>
                      <th className="py-2.5 px-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {samplesToSave.map((row, idx) => {
                      const isWeightValid = row.weightGrams >= 100;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <select
                              value={row.dishName}
                              onChange={(e) => handleUpdateSampleRow(idx, 'dishName', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden bg-white"
                            >
                              <option value="">-- Chọn món ăn từ thực đơn --</option>
                              {availableDishes.map((dish) => (
                                <option key={dish} value={dish}>
                                  {dish}
                                </option>
                              ))}
                              {row.dishName && !availableDishes.includes(row.dishName) && (
                                <option value={row.dishName}>{row.dishName}</option>
                              )}
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <input
                                type="number"
                                min="50"
                                max="500"
                                value={row.weightGrams}
                                onChange={(e) =>
                                  handleUpdateSampleRow(
                                    idx,
                                    'weightGrams',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className={`w-20 rounded-xl px-2.5 py-1.5 text-center font-bold text-xs border focus:outline-hidden ${
                                  isWeightValid
                                    ? 'border-slate-200 text-slate-800'
                                    : 'border-red-300 bg-red-50 text-red-600'
                                }`}
                              />
                              <span className="text-slate-400 font-medium">gram</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="text"
                              value={row.sealCode}
                              onChange={(e) => handleUpdateSampleRow(idx, 'sealCode', e.target.value)}
                              className="w-36 rounded-xl border border-slate-200 px-2.5 py-1.5 text-center font-mono font-bold text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isWeightValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                <Check className="h-3 w-3" /> Đạt ≥ 100g
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                <X className="h-3 w-3" /> Thiếu &lt; 100g
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveSampleRow(idx)}
                              disabled={samplesToSave.length <= 1}
                              className="text-slate-400 hover:text-red-600 p-1 disabled:opacity-30"
                              title="Xóa món"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ghi nhận mẫu vào sổ lưu */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Camera className="h-4 w-4 text-slate-400" />
                <span>
                  Người lưu được xác định từ tài khoản đăng nhập: <strong>{user?.fullName || 'Nhân viên bếp'}</strong>. Entity hiện tại không lưu ảnh niêm phong.
                </span>
              </div>

              <button
                type="button"
                onClick={() => saveSampleMutation.mutate()}
                disabled={saveSampleMutation.isPending}
                className="px-6 py-3 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-extrabold shadow-md shadow-emerald-900/10 min-h-[44px] flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Clock className="h-4 w-4 text-[#78C2AD]" />
                <span>{saveSampleMutation.isPending ? 'Đang lưu...' : 'Lưu mẫu vào sổ'}</span>
              </button>
            </div>
          </div>

          {/* BẢNG THEO DÕI & HỦY MẪU THỨC ĂN (Sample Expiry & Disposal Table - Section 2) */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Archive className="h-5 w-5 text-[#275A4E]" />
                  <span>Danh Sách Mẫu Đang Lưu Nghiệm Trong Tủ Bảo Quản</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thời điểm bắt đầu lưu và mốc đủ 24 giờ được ghi nhận tự động để phục vụ quy trình kiểm thực và tiêu hủy an toàn.
                </p>
              </div>

              <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">
                Tổng cộng: {storedSamples.length} hũ mẫu
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Tên Món Ăn</th>
                    <th className="py-3 px-3 text-center">Bữa Ăn</th>
                    <th className="py-3 px-3 text-center">Mã Niêm Phong</th>
                    <th className="py-3 px-3 text-center">Khối Lượng</th>
                    <th className="py-3 px-3 text-center">Nhiệt Độ Tủ</th>
                    <th className="py-3 px-3 text-center">Thời điểm lưu</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-3 text-center">Thao Tác Hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {foodSamplesQuery.isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Đang tải sổ lưu mẫu...
                      </td>
                    </tr>
                  ) : storedSamples.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có mẫu thức ăn nào đang lưu trong tủ bảo quản.
                      </td>
                    </tr>
                  ) : (
                    storedSamples.map((sample) => {
                    const isDisposed = sample.status === 'DISPOSED';
                    const isExpired = sample.status === 'EXPIRED';

                    return (
                      <tr key={sample.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {sample.dishName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Ngày lưu: {sample.date} · Người lưu: {sample.savedBy}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                            {sample.mealSession === 'LUNCH'
                              ? 'Trưa'
                              : sample.mealSession === 'SNACK'
                              ? 'Xế'
                              : 'Sáng'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                          {sample.sealCode}
                        </td>

                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {sample.sampleWeightGrams == null ? '—' : `${sample.sampleWeightGrams}g`}
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-teal-700">
                          {sample.storageTemperatureCelsius == null
                            ? '—'
                            : `${sample.storageTemperatureCelsius}°C`}
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-extrabold">
                          {sample.savedAt
                            ? new Date(sample.savedAt).toLocaleString('vi-VN')
                            : 'Không xác định'}
                          {!isDisposed && sample.timerExpiresAt && (
                            <span className="block text-[10px] text-slate-400">
                              Đủ 24h: {new Date(sample.timerExpiresAt).toLocaleString('vi-VN')}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isDisposed ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                              Đã tiêu hủy
                            </span>
                          ) : isExpired || sample.status === 'READY_FOR_DISPOSAL' ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold animate-pulse">
                              Đủ thời gian lưu 24h
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                              Chưa xác định đủ 24 giờ
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {!isDisposed && sample.status === 'READY_FOR_DISPOSAL' ? (
                            <button
                              type="button"
                              disabled={disposeSampleMutation.isPending}
                              onClick={() => {
                                const confirmed = window.confirm(
                                  'Xác nhận mẫu đã lưu đủ 24 giờ và không có sự cố an toàn thực phẩm trong thời gian lưu?'
                                );
                                if (confirmed) disposeSampleMutation.mutate(sample.id);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50"
                            >
                              Xác nhận tiêu hủy
                            </button>
                          ) : !isDisposed ? (
                            <span className="text-[11px] text-amber-700">
                              Chờ đủ 24 giờ
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Hủy lúc {sample.disposedAt}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>

      {/* MODAL XUẤT BIÊN BẢN KIỂM THỰC 3 BƯỚC (PDF / PRINT PREVIEW) */}
      {isExportInspectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#275A4E]">
                <FileCheck className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">
                  Biên Bản Kiểm Thực 3 Bước & Tiêu Hao Bếp Ăn Bán Trú
                </h3>
              </div>
              <button
                onClick={() => setIsExportInspectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* FORM BIÊN BẢN CHUẨN BỘ Y TẾ */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 font-serif text-slate-800 text-xs leading-relaxed">
              <div className="text-center space-y-1">
                <p className="font-bold uppercase tracking-wider text-xs">TRƯỜNG MẦM NON KIDPRO ECOSYSTEM</p>
                <h2 className="font-extrabold text-sm uppercase">SỔ KIỂM THỰC BA BƯỚC & LƯU MẪU THỨC ĂN</h2>
                <p className="text-[11px] italic text-slate-500">
                  (Theo Quyết định số 1246/QĐ-BYT của Bộ Y tế)
                </p>
                <p className="text-[11px] font-bold">Ngày thực hiện: {retentionDate}</p>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="font-bold uppercase text-[11px] text-[#275A4E]">
                  BƯỚC 1: KIỂM TRA NGUYÊN LIỆU THỰC PHẨM NHẬP VÀO
                </p>
                <p>Toàn bộ nguyên liệu thịt heo, rau củ quả, gạo tươi mới, đầy đủ tem truy xuất nguồn gốc kiểm dịch.</p>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="font-bold uppercase text-[11px] text-[#275A4E]">
                  BƯỚC 2: KIỂM TRA TRONG QUÁ TRÌNH CHẾ BIẾN
                </p>
                <p>Nấu chín ở nhiệt độ &gt; 100°C. Chế biến suất ăn dị ứng tại khu vực cách ly riêng biệt.</p>
              </div>

              <div className="space-y-2 border-t border-slate-200 pt-3">
                <p className="font-bold uppercase text-[11px] text-[#275A4E]">
                  BƯỚC 3: KIỂM TRA TRƯỚC KHI ĂN & LƯU MẪU 24 GIỜ
                </p>
                <p>
                  Đã lưu nghiệm <strong>{samplesToSave.length} hũ mẫu thủy tinh</strong> có tem niêm phong trong tủ lạnh chuyên dụng ở nhiệt độ <strong>{fridgeTemperature}°C</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 text-center pt-6 text-xs font-sans">
                <div>
                  <p className="font-bold">ĐẠI DIỆN TỔ BẾP</p>
                  <p className="italic text-[11px] text-slate-400 mt-10">Nguyễn Thị Lan (Đã ký)</p>
                </div>
                <div>
                  <p className="font-bold">BAN GIÁM HIỆU / Y TẾ TRƯỜNG</p>
                  <p className="italic text-[11px] text-slate-400 mt-10">Hiệu trưởng (Đã duyệt)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportInspectionModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] text-white text-xs font-bold shadow-md min-h-[44px] flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                <span>In Biên Bản (PDF / Máy in)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodRetentionConsumptionTab;
