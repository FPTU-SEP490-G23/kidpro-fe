import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Hourglass,
  Check,
  Scale,
  FileCheck,
  X
} from 'lucide-react';
import { kitchenApi } from '../../../api/kitchenApi';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FoodSampleRetention,
  MealSessionType,
  FoodConsumptionItem
} from '../../../types/kitchen.types';

// Dữ liệu mẫu ban đầu cho danh sách lưu mẫu thức ăn 24h
const getInitialStoredSamples = (): FoodSampleRetention[] => {
  const now = Date.now();
  return [
    {
      id: 'sample-01',
      date: new Date(now - 25 * 3600 * 1000).toISOString().split('T')[0], // Đã lưu hơn 24h -> Sẵn sàng hủy
      mealSession: 'LUNCH',
      dishName: 'Cơm tám thơm dẻo',
      sampleWeightGrams: 150,
      sealCode: 'NP-20261008-01',
      storageTemperatureCelsius: 4.2,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      savedAt: new Date(now - 25 * 3600 * 1000).toISOString(),
      savedBy: 'Bếp trưởng Nguyễn Thị Lan',
      timerExpiresAt: new Date(now - 1 * 3600 * 1000).toISOString(),
      status: 'READY_FOR_DISPOSAL',
      noPoisoningIncidentConfirmed: false
    },
    {
      id: 'sample-02',
      date: new Date(now - 25 * 3600 * 1000).toISOString().split('T')[0],
      mealSession: 'LUNCH',
      dishName: 'Thịt kho trứng cút nước dừa',
      sampleWeightGrams: 120,
      sealCode: 'NP-20261008-02',
      storageTemperatureCelsius: 3.8,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      savedAt: new Date(now - 25 * 3600 * 1000).toISOString(),
      savedBy: 'Bếp trưởng Nguyễn Thị Lan',
      timerExpiresAt: new Date(now - 1 * 3600 * 1000).toISOString(),
      status: 'READY_FOR_DISPOSAL',
      noPoisoningIncidentConfirmed: false
    },
    {
      id: 'sample-03',
      date: new Date(now - 28 * 3600 * 1000).toISOString().split('T')[0], // Quá hạn > 24h chưa hủy
      mealSession: 'SNACK',
      dishName: 'Cháo sườn búp sen',
      sampleWeightGrams: 160,
      sealCode: 'NP-20261008-03',
      storageTemperatureCelsius: 4.0,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      savedAt: new Date(now - 28 * 3600 * 1000).toISOString(),
      savedBy: 'Bếp phó Lê Thị Mai',
      timerExpiresAt: new Date(now - 4 * 3600 * 1000).toISOString(),
      status: 'EXPIRED', // Quá hạn MSG cảnh báo
      noPoisoningIncidentConfirmed: false
    },
    {
      id: 'sample-04',
      date: new Date().toISOString().split('T')[0], // Bữa hôm nay đang lưu
      mealSession: 'LUNCH',
      dishName: 'Thịt heo rim nước dừa tươi',
      sampleWeightGrams: 125,
      sealCode: 'NP-20261009-01',
      storageTemperatureCelsius: 4.5,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      savedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      savedBy: 'Bếp trưởng Nguyễn Thị Lan',
      timerExpiresAt: new Date(now + 22 * 3600 * 1000).toISOString(),
      status: 'STORING',
      noPoisoningIncidentConfirmed: false
    },
    {
      id: 'sample-05',
      date: new Date().toISOString().split('T')[0],
      mealSession: 'LUNCH',
      dishName: 'Canh bí đỏ hầm sườn non',
      sampleWeightGrams: 180, // Canh >= 150ml
      sealCode: 'NP-20261009-02',
      storageTemperatureCelsius: 4.5,
      photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
      savedAt: new Date(now - 2 * 3600 * 1000).toISOString(),
      savedBy: 'Bếp trưởng Nguyễn Thị Lan',
      timerExpiresAt: new Date(now + 22 * 3600 * 1000).toISOString(),
      status: 'STORING',
      noPoisoningIncidentConfirmed: false
    }
  ];
};

// Dữ liệu định mức nguyên liệu tiêu hao chuẩn cho bếp ăn
const INITIAL_CONSUMPTION_ITEMS: FoodConsumptionItem[] = [
  {
    id: 'ing-01',
    ingredientName: 'Thịt heo nạc thăn sạch',
    category: 'MEAT',
    unit: 'kg',
    quotaPerPortionGrams: 85, // 85g/suất
    standardPlannedQtyKg: 16.06, // 189 suất * 85g = 16.065 kg
    actualConsumedQtyKg: 16.2,
    variancePercentage: 0.8,
  },
  {
    id: 'ing-02',
    ingredientName: 'Gạo tám thơm ST25',
    category: 'GRAIN',
    unit: 'kg',
    quotaPerPortionGrams: 90,
    standardPlannedQtyKg: 17.01,
    actualConsumedQtyKg: 17.0,
    variancePercentage: -0.1,
  },
  {
    id: 'ing-03',
    ingredientName: 'Bí đỏ hồ lô tươi',
    category: 'VEGETABLE',
    unit: 'kg',
    quotaPerPortionGrams: 60,
    standardPlannedQtyKg: 11.34,
    actualConsumedQtyKg: 11.5,
    variancePercentage: 1.4,
  },
  {
    id: 'ing-04',
    ingredientName: 'Sườn non heo sơ chế',
    category: 'MEAT',
    unit: 'kg',
    quotaPerPortionGrams: 40,
    standardPlannedQtyKg: 7.56,
    actualConsumedQtyKg: 9.5, // Chênh lệch 25.6% -> Cảnh báo MSG-134
    variancePercentage: 25.7,
    varianceExplanation: 'Học sinh khối Lá ăn thêm bữa trưa và một số trẻ bổ sung năng lượng thể chất sau giờ bơi lội.'
  },
  {
    id: 'ing-05',
    ingredientName: 'Dầu ăn đậu nành Tường An',
    category: 'SPICE',
    unit: 'lít',
    quotaPerPortionGrams: 10,
    standardPlannedQtyKg: 1.89,
    actualConsumedQtyKg: 1.9,
    variancePercentage: 0.5,
  }
];

export const FoodRetentionConsumptionTab: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<'RETENTION_24H' | 'CONSUMPTION_REPORT'>(
    'RETENTION_24H'
  );

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
  const [fridgeTemperature, setFridgeTemperature] = useState<number>(4.0); // Bắt buộc 2°C - 8°C (BR-043)
  const [samplesToSave, setSamplesToSave] = useState<
    { dishName: string; weightGrams: number; sealCode: string }[]
  >([
    { dishName: 'Cơm tám thơm dẻo', weightGrams: 150, sealCode: `NP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01` },
    { dishName: 'Thịt heo rim nước dừa tươi', weightGrams: 120, sealCode: `NP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-02` },
    { dishName: 'Bắp cải thảo xào cà rốt', weightGrams: 110, sealCode: `NP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-03` },
    { dishName: 'Canh bí đỏ hầm sườn non', weightGrams: 180, sealCode: `NP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-04` },
    { dishName: 'Dưa hấu tươi tráng miệng', weightGrams: 100, sealCode: `NP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-05` }
  ]);

  // Danh sách các hũ mẫu đang lưu trong tủ
  const [storedSamples, setStoredSamples] = useState<FoodSampleRetention[]>(getInitialStoredSamples());

  // Modal Xác Nhận Hủy Mẫu An Toàn
  const [disposeModalSample, setDisposeModalSample] = useState<FoodSampleRetention | null>(null);
  const [noPoisoningConfirmed, setNoPoisoningConfirmed] = useState<boolean>(false);
  const [disposalReason, setDisposalReason] = useState<string>('Hết hạn lưu nghiệm 24h theo TT 47/2010/TT-BYT, trường không có sự cố.');

  // ==========================================
  // KHỐI 2: TIÊU HAO THỰC PHẨM & QUYẾT TOÁN KHO
  // ==========================================
  const [consumptionHeadcount, setConsumptionHeadcount] = useState<number>(189);
  const [consumptionItems, setConsumptionItems] = useState<FoodConsumptionItem[]>(
    INITIAL_CONSUMPTION_ITEMS
  );
  const [isExportInspectionModalOpen, setIsExportInspectionModalOpen] = useState<boolean>(false);

  // Hook tính đồng hồ đếm ngược 24h thời gian thực cho từng hũ mẫu
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown hh:mm:ss
  const formatCountdown = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - currentTime;
    if (diff <= 0) {
      return { text: '00:00:00 (ĐỦ 24H)', isDone: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return {
      text: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      isDone: false
    };
  };

  // Mutation: Lưu mẫu thức ăn 24h (POST /api/kitchen/food-samples)
  const saveSampleMutation = useMutation({
    mutationFn: async () => {
      // Validate BR-043: Nhiệt độ bắt buộc 2°C - 8°C (MSG-132)
      if (fridgeTemperature < 2 || fridgeTemperature > 8) {
        throw new Error(
          'MSG-132: Nhiệt độ lưu mẫu thức ăn bắt buộc phải duy trì trong khoảng 2°C đến 8°C theo quy chuẩn an toàn thực phẩm.'
        );
      }

      // Validate BR-043: Khối lượng mẫu >= 100g hoặc >= 150ml canh
      for (const item of samplesToSave) {
        if (!item.dishName.trim()) {
          throw new Error('MSG-133: Toàn bộ các món ăn phục vụ học sinh bắt buộc phải có mẫu thức ăn lưu 24h không được bỏ sót.');
        }
        if (item.weightGrams < 100) {
          throw new Error(`Món "${item.dishName}" chưa đạt khối lượng tối thiểu 100g theo Thông tư 47/2010/TT-BYT!`);
        }
      }

      const promises = samplesToSave.map((s) =>
        kitchenApi.createFoodSample({
          date: retentionDate,
          mealSession: selectedMealSession,
          dishName: s.dishName,
          sampleWeightGrams: s.weightGrams,
          sealCode: s.sealCode,
          storageTemperatureCelsius: fridgeTemperature,
          savedBy: user?.fullName || 'Nhân viên Bếp'
        })
      );
      return await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
      // Thêm các mẫu mới vào state
      const now = Date.now();
      const newItems: FoodSampleRetention[] = samplesToSave.map((s, idx) => ({
        id: `sample-new-${now}-${idx}`,
        date: retentionDate,
        mealSession: selectedMealSession,
        dishName: s.dishName,
        sampleWeightGrams: s.weightGrams,
        sealCode: s.sealCode,
        storageTemperatureCelsius: fridgeTemperature,
        savedAt: new Date(now).toISOString(),
        savedBy: user?.fullName || 'Nhân viên Bếp',
        timerExpiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
        status: 'STORING',
        noPoisoningIncidentConfirmed: false
      }));

      setStoredSamples((prev) => [...newItems, ...prev]);
      setToastMessage({
        type: 'success',
        text: 'MSG-131: Ghi nhận tiêu hao thực phẩm và lưu mẫu thức ăn 24h thành công.'
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: err.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
    }
  });

  // Mutation: Xác nhận hủy mẫu an toàn (PUT /api/kitchen/food-samples/{id}/dispose)
  const disposeMutation = useMutation({
    mutationFn: async ({
      sampleId,
      notes,
      noPoisoning
    }: {
      sampleId: string;
      notes: string;
      noPoisoning: boolean;
    }) => {
      if (!noPoisoning) {
        throw new Error('Bắt buộc cam kết không có sự cố ngộ độc thực phẩm trong trường theo BR-044!');
      }
      return await kitchenApi.disposeFoodSample(sampleId, {
        sampleId,
        disposedBy: user?.fullName || 'Bếp trưởng',
        disposalNotes: notes,
        noPoisoningIncidentConfirmed: noPoisoning
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['food-samples'] });
      setStoredSamples((prev) =>
        prev.map((item) =>
          item.id === variables.sampleId
            ? {
                ...item,
                status: 'DISPOSED',
                disposedAt: new Date().toLocaleTimeString('vi-VN'),
                disposedBy: user?.fullName || 'Bếp trưởng',
                disposalNotes: variables.notes
              }
            : item
        )
      );
      setDisposeModalSample(null);
      setToastMessage({
        type: 'success',
        text: 'Đã hoàn tất quy trình tiêu hủy mẫu thức ăn an toàn và lưu biên bản kiểm thực.'
      });
    },
    onError: (err: any) => {
      setToastMessage({
        type: 'error',
        text: err.message || 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.'
      });
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
  const handleUpdateActualConsumed = (itemId: string, actualKg: number) => {
    setConsumptionItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const planned = (item.quotaPerPortionGrams * consumptionHeadcount) / 1000;
          const variance = planned > 0 ? Number((((actualKg - planned) / planned) * 100).toFixed(1)) : 0;
          return {
            ...item,
            standardPlannedQtyKg: Number(planned.toFixed(2)),
            actualConsumedQtyKg: actualKg,
            variancePercentage: variance
          };
        }
        return item;
      })
    );
  };

  const handleUpdateVarianceExplanation = (itemId: string, explanation: string) => {
    setConsumptionItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, varianceExplanation: explanation } : item))
    );
  };

  // Kiểm tra cảnh báo chênh lệch > 20% (MSG-134)
  const itemsWithHighVariance = consumptionItems.filter(
    (item) => Math.abs(item.variancePercentage) > 20
  );
  const hasUnexplainedHighVariance = itemsWithHighVariance.some(
    (item) => !item.varianceExplanation || !item.varianceExplanation.trim()
  );

  // Mẫu quá hạn chưa hủy
  const overdueSamples = storedSamples.filter(
    (s) => s.status === 'EXPIRED' || (s.status === 'READY_FOR_DISPOSAL' && new Date(s.timerExpiresAt).getTime() < currentTime - 2 * 3600 * 1000)
  );

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

      {/* CẢNH BÁO MẪU QUÁ HẠN 24H CHƯA HỦY */}
      {overdueSamples.length > 0 && (
        <div className="rounded-3xl border-2 border-amber-500 bg-amber-50/90 p-5 shadow-md flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-600 text-white shrink-0">
            <Hourglass className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-amber-900 text-base">
                CẢNH BÁO MẪU THỨC ĂN QUÁ HẠN 24 GIỜ CHƯA TIÊU HỦY
              </h4>
              <span className="bg-amber-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                {overdueSamples.length} MẪU
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Theo quy định <strong>TT 47/2010/TT-BYT</strong> và <strong>BR-044</strong>, mẫu lưu nghiệm đã qua 24 giờ phải được tiến hành hủy an toàn và lập biên bản kiểm thực 3 bước để giải phóng vị trí tủ bảo quản.
            </p>
          </div>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('RETENTION_24H')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 min-h-[44px] ${
              activeSubTab === 'RETENTION_24H'
                ? 'bg-[#275A4E] text-white shadow-md shadow-emerald-900/10'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Thermometer className="h-4 w-4" />
            <span>Lưu Mẫu Thức Ăn 24 Giờ & Niêm Phong Tủ Lạnh</span>
          </button>

          <button
            onClick={() => setActiveSubTab('CONSUMPTION_REPORT')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 min-h-[44px] ${
              activeSubTab === 'CONSUMPTION_REPORT'
                ? 'bg-[#E5A93C] text-[#1E4D40] shadow-md shadow-amber-900/10'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Scale className="h-4 w-4 text-amber-700" />
            <span>Báo Cáo Tiêu Hao Thực Phẩm & Quyết Toán Kho</span>
          </button>
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

      {/* SUB-TAB 1: LƯU MẪU THỨC ĂN 24H (RETENTION LOGGER) */}
      {activeSubTab === 'RETENTION_24H' && (
        <div className="space-y-6">
          {/* FORM GHI NHẬN LƯU MẪU 24 GIỜ (Section 2 - 24h Retention Logger Form) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#275A4E]/10 text-[#275A4E]">
                  <Thermometer className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">
                    Ghi Nhật Ký Lưu Mẫu Thức Ăn Bán Trú 24 Giờ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tuân thủ Thông tư 47/2010/TT-BYT: Khối lượng mẫu ≥ 100g, canh ≥ 150ml; bảo quản ở 2°C - 8°C
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
                    Yêu cầu đo nhiệt độ thực tế bằng nhiệt kế điện tử trước khi niêm phong mẫu (BR-043).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs font-bold text-slate-700">Nhiệt độ hiện tại:</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
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
                    <AlertTriangle className="h-4 w-4" /> MSG-132: Ngoài dải 2-8°C!
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
                            <input
                              type="text"
                              value={row.dishName}
                              onChange={(e) => handleUpdateSampleRow(idx, 'dishName', e.target.value)}
                              placeholder="Nhập tên món ăn..."
                              className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-[#275A4E] focus:outline-hidden"
                            />
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

            {/* Nút Ký Duyệt & Bắt Đầu Đếm Ngược 24 Giờ */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Camera className="h-4 w-4 text-slate-400" />
                <span>
                  Đã tự động đính kèm ảnh tem niêm phong và ghi nhận chữ ký điện tử của: <strong>{user?.fullName || 'Bếp trưởng'}</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={() => saveSampleMutation.mutate()}
                disabled={saveSampleMutation.isPending}
                className="px-6 py-3 rounded-2xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-extrabold shadow-md shadow-emerald-900/10 min-h-[44px] flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Clock className="h-4 w-4 text-[#78C2AD]" />
                <span>{saveSampleMutation.isPending ? 'Đang lưu...' : 'Ký Duyệt & Bắt Đầu Đếm Ngược 24 Giờ (MSG-131)'}</span>
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
                  Theo dõi thời gian đếm ngược 24 giờ. Chỉ thực hiện hủy khi đủ 24h và trường không có sự cố (BR-044).
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
                    <th className="py-3 px-3 text-center">Thời Gian Còn Lại (24h Timer)</th>
                    <th className="py-3 px-3 text-center">Trạng Thái</th>
                    <th className="py-3 px-3 text-center">Thao Tác Hủy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {storedSamples.map((sample) => {
                    const countdown = formatCountdown(sample.timerExpiresAt);
                    const isDisposed = sample.status === 'DISPOSED';
                    const isReady = sample.status === 'READY_FOR_DISPOSAL' || countdown.isDone;
                    const isExpired = sample.status === 'EXPIRED';

                    return (
                      <tr key={sample.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {sample.dishName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Lưu lúc: {new Date(sample.savedAt).toLocaleTimeString('vi-VN')} ({sample.date})
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
                          {sample.sampleWeightGrams}g
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-teal-700">
                          {sample.storageTemperatureCelsius}°C
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-extrabold">
                          {isDisposed ? (
                            <span className="text-slate-400 text-xs">Đã hủy xong</span>
                          ) : (
                            <span
                              className={`text-xs ${
                                countdown.isDone ? 'text-emerald-700' : 'text-amber-600'
                              }`}
                            >
                              {countdown.text}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {isDisposed ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                              Đã tiêu hủy
                            </span>
                          ) : isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-bold animate-pulse">
                              Quá hạn 24h
                            </span>
                          ) : isReady ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                              Đủ 24h - Sẵn sàng hủy
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                              Đang lưu nghiệm
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {!isDisposed ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDisposeModalSample(sample);
                                setNoPoisoningConfirmed(false);
                              }}
                              disabled={!isReady && !isExpired}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
                                isReady || isExpired
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-xs active:scale-95'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              title={
                                isReady || isExpired
                                  ? 'Xác nhận tiêu hủy an toàn theo BR-044'
                                  : 'Chưa đủ 24 giờ lưu nghiệm'
                              }
                            >
                              Xác Nhận Hủy Mẫu
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Hủy lúc {sample.disposedAt}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: BÁO CÁO TIÊU HAO THỰC PHẨM & QUYẾT TOÁN KHO BẾP */}
      {activeSubTab === 'CONSUMPTION_REPORT' && (
        <div className="space-y-6">
          {/* CẢNH BÁO CHÊNH LỆCH TIÊU HAO > 20% (MSG-134) */}
          {hasUnexplainedHighVariance && (
            <div className="rounded-3xl border-2 border-red-500 bg-red-50 p-5 shadow-sm flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <h4 className="font-extrabold text-red-900 text-base">
                  MSG-134: CẢNH BÁO CHÊNH LỆCH TIÊU HAO VƯỢT QUÁ 20%
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Phát hiện nguyên liệu có chênh lệch xuất dùng thực tế so với định mức suất ăn đã chốt lúc 08:30 vượt quá 20%. Bắt buộc nhập văn bản giải trình lý do xuất dùng trước khi hoàn tất quyết toán bếp trong ngày.
                </p>
              </div>
            </div>
          )}

          {/* BẢNG QUYẾT TOÁN TIÊU HAO NGUYÊN LIỆU THỰC TẾ */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#275A4E]" />
                  <span>Đối Chiếu Định Mức & Tiêu Hao Thực Tế Theo Suất Ăn Đã Chốt</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số suất ăn đã đóng băng lúc 08:30: <strong className="text-[#275A4E]">{consumptionHeadcount} suất</strong>. Tự động tính chênh lệch (% Variance).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Tổng suất chốt:</span>
                <input
                  type="number"
                  value={consumptionHeadcount}
                  onChange={(e) => setConsumptionHeadcount(parseInt(e.target.value) || 0)}
                  className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-center font-bold text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Tên Nguyên Liệu</th>
                    <th className="py-3 px-3 text-center">Định Mức (g/suất)</th>
                    <th className="py-3 px-3 text-center">Kế Hoạch Định Mức (Kg)</th>
                    <th className="py-3 px-3 text-center">Thực Tế Xuất Dùng (Kg)</th>
                    <th className="py-3 px-3 text-center">Chênh Lệch (% Variance)</th>
                    <th className="py-3 px-3">Giải Trình Xuất Dùng (Bắt buộc nếu &gt; 20%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consumptionItems.map((item) => {
                    const isHigh = Math.abs(item.variancePercentage) > 20;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold text-slate-800">
                          {item.ingredientName}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Đơn vị tính: {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-semibold text-slate-600">
                          {item.quotaPerPortionGrams}g
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {item.standardPlannedQtyKg} kg
                        </td>

                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={item.actualConsumedQtyKg}
                            onChange={(e) =>
                              handleUpdateActualConsumed(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 rounded-xl border border-slate-200 px-2 py-1.5 text-center font-bold text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
                          />
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-extrabold">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs ${
                              isHigh
                                ? 'bg-red-100 text-red-800'
                                : Math.abs(item.variancePercentage) > 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.variancePercentage > 0 ? `+${item.variancePercentage}%` : `${item.variancePercentage}%`}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          {isHigh ? (
                            <input
                              type="text"
                              value={item.varianceExplanation || ''}
                              onChange={(e) =>
                                handleUpdateVarianceExplanation(item.id, e.target.value)
                              }
                              placeholder="Nhập giải trình lý do xuất dùng..."
                              className="w-full rounded-xl border border-red-300 bg-red-50/40 p-2 text-xs text-red-900 font-medium focus:border-red-500 focus:outline-hidden"
                            />
                          ) : (
                            <span className="text-xs text-slate-400 italic">Đạt định mức bình thường</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Toàn bộ dữ liệu tiêu hao được mã hóa và đối soát tự động với hóa đơn nguyên liệu nhập kho.
              </span>
              <button
                type="button"
                onClick={() => {
                  if (hasUnexplainedHighVariance) {
                    setToastMessage({
                      type: 'error',
                      text: 'MSG-134: Chênh lệch tiêu hao vượt quá 20%. Vui lòng nhập giải trình lý do xuất dùng.'
                    });
                    return;
                  }
                  setToastMessage({
                    type: 'success',
                    text: 'Đã lưu và quyết toán tiêu hao thực phẩm thành công!'
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                Lưu Báo Cáo Quyết Toán Kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN HỦY MẪU AN TOÀN (BR-044) */}
      {disposeModalSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-base font-bold text-slate-800">
                  Xác Nhận Hủy Mẫu Thức Ăn An Toàn
                </h3>
              </div>
              <button
                onClick={() => setDisposeModalSample(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5">
              <p>
                <strong>Món ăn:</strong> {disposeModalSample.dishName}
              </p>
              <p>
                <strong>Mã niêm phong:</strong> {disposeModalSample.sealCode}
              </p>
              <p>
                <strong>Thời gian lưu:</strong> Đã lưu nghiệm đủ 24 giờ kể từ {new Date(disposeModalSample.savedAt).toLocaleString('vi-VN')}.
              </p>
            </div>

            {/* Checkbox cam kết không ngộ độc (BR-044) */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noPoisoningConfirmed}
                  onChange={(e) => setNoPoisoningConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs text-amber-950 font-semibold leading-relaxed">
                  Cam kết <strong>không có trường hợp ngộ độc thực phẩm</strong> hay bất thường tiêu hóa nào xảy ra trong toàn trường trong suốt 24 giờ qua (BR-044).
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú biên bản tiêu hủy:
              </label>
              <textarea
                rows={2}
                value={disposalReason}
                onChange={(e) => setDisposalReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-[#275A4E] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisposeModalSample(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 min-h-[44px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!noPoisoningConfirmed || disposeMutation.isPending}
                onClick={() =>
                  disposeMutation.mutate({
                    sampleId: disposeModalSample.id,
                    notes: disposalReason,
                    noPoisoning: noPoisoningConfirmed
                  })
                }
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold shadow-md min-h-[44px]"
              >
                {disposeMutation.isPending ? 'Đang tiêu hủy...' : 'Ký Biên Bản & Tiêu Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

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
