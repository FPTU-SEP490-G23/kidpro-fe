import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Thermometer,
  FileCheck2,
  AlertCircle,
  X,
  Ban,
  Check,
  FileText
} from 'lucide-react';
import {
  ThreeStepFoodSafetyInspectionLog,
  RawMaterialInspectionItem
} from '../../../types/kitchen.types';
import kitchenApi from '../../../api/kitchenApi';
import { openKitchenEvidence, uploadKitchenEvidence } from '../../../api/kitchenEvidenceApi';
import { useFoodInspectionSteps } from '../../../hooks/useFoodInspectionSteps';
import { DigitalSignaturePad } from '../../../components/common/DigitalSignaturePad';

const MSG_112 = 'Lưu sổ kiểm thực 3 bước và lưu mẫu thành công.';
const MSG_113 = 'Nguyên liệu nhập thiếu hóa đơn/ảnh chứng từ hoặc không đạt cảm quan tươi sống.';
const MSG_114 = 'Nhiệt độ tủ lưu mẫu nằm ngoài khoảng quy định an toàn (thấp hơn 2°C hoặc vượt quá 8°C).';
const MSG_115 = 'Bỏ sót mã niêm phong hoặc ảnh lưu mẫu của một món ăn trong thực đơn.';

// Mock Initial 3-Step Inspection Log
const createInitialInspectionLog = (date: string): ThreeStepFoodSafetyInspectionLog => ({
  id: `INSP-${date}`,
  inspectionDate: date,
  step1Completed: false,
  step1Time: '06:30 AM',
  step1ChefSignature: undefined,
  rawMaterials: [],
  step2Completed: false,
  step2Time: '10:30 AM',
  step2ChefSignature: undefined,
  cookingTemperatures: [],
  hygieneChecklist: {
    protectiveClothing: false,
    separateCuttingBoards: false,
    cleanWaterSource: false,
  },
  step3Completed: false,
  step3Time: '11:15 AM',
  step3ChefSignature: undefined,
  step3PrincipalSignature: undefined,
  retentionSamples: [],
  overallStatus: 'IN_PROGRESS',
  rejectionIncidentReported: false,
});

export interface FoodSafetyThreeStepInspectionTabProps {
  initialDate?: string;
}

export const FoodSafetyThreeStepInspectionTab: React.FC<FoodSafetyThreeStepInspectionTabProps> = ({
  initialDate
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [activeStepTab, setActiveStepTab] = useState<'step1' | 'step2' | 'step3'>('step2');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  // Rejection Incident Modal
  const [rejectingItem, setRejectingItem] = useState<RawMaterialInspectionItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Mutation
  const saveInspectionMutation = useFoodInspectionSteps();

  // Query Inspection Log
  const {
    data: inspectionLog,
    isLoading: isInspectionLogLoading,
    isError: isInspectionLogError,
    error: inspectionLogError
  } = useQuery<ThreeStepFoodSafetyInspectionLog>({
    queryKey: ['food-inspection-log', selectedDate],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getThreeStepInspectionLog(selectedDate);
        const data = res?.data ?? res;
        return (data && (data.inspectionDate || data.logId)) ? data : createInitialInspectionLog(selectedDate);
      } catch (e) {
        console.warn('Failed to fetch food inspection log:', e);
        return createInitialInspectionLog(selectedDate);
      }
    },
    retry: false
  });

  // State local to manage edits before save
  const [localLog, setLocalLog] = useState<ThreeStepFoodSafetyInspectionLog>(
    () => createInitialInspectionLog(selectedDate)
  );
  const [newMaterial, setNewMaterial] = useState({
    ingredientName: '',
    quantityKg: 0,
    supplierName: '',
    invoiceNumber: '',
    deliveryTemperatureCelsius: 4,
    isFrozenOrChilled: false
  });
  const [newCookingDish, setNewCookingDish] = useState({
    dishName: '',
    cookingMethod: '',
    coreTemperatureCelsius: 70
  });

  const getWeekStartDate = (dateText: string) => {
    const date = new Date(`${dateText}T00:00:00`);
    const day = date.getDay();
    date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const targetDayNumber = new Date(`${selectedDate}T00:00:00`).getDay() || 7;
  const {
    data: weeklyMenuItems,
    isLoading: isWeeklyMenuLoading,
    isError: isWeeklyMenuError,
    error: weeklyMenuError
  } = useQuery({
    queryKey: ['inspection-menu-items', selectedDate],
    queryFn: async () => {
      try {
        const res: any = await kitchenApi.getWeeklyMenus(getWeekStartDate(selectedDate));
        const data = res?.data ?? res;
        return Array.isArray(data) ? data : [];
      } catch (e) {
        console.warn('Failed to fetch inspection weekly menus:', e);
        return [];
      }
    },
    enabled: Boolean(selectedDate),
    retry: false
  });
  const dayName = ['', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'][targetDayNumber];
  const todaysApprovedDishes = React.useMemo(
    () => (weeklyMenuItems || []).filter((dish) =>
      dish.menuStatus === 'APPROVED' && (
        typeof dish.dayOfWeek === 'number'
          ? dish.dayOfWeek === targetDayNumber
          : String(dish.dayOfWeek) === dayName
      )
    ),
    [weeklyMenuItems, targetDayNumber, dayName]
  );

  // Update localLog if query changes
  React.useEffect(() => {
    setLocalLog(inspectionLog || createInitialInspectionLog(selectedDate));
  }, [inspectionLog, selectedDate]);

  React.useEffect(() => {
    if (!weeklyMenuItems || isInspectionLogLoading || isInspectionLogError || weeklyMenuItems.length === 0) return;
    if (todaysApprovedDishes.length === 0) return;

    setLocalLog((current) => {
      if (current.inspectionDate !== selectedDate || current.retentionSamples.length > 0) return current;
      return {
        ...current,
        retentionSamples: todaysApprovedDishes.map((dish) => ({
          id: `sample-${dish.id || dish.itemId || dish.mealType}-${targetDayNumber}`,
          dishName: dish.dishName,
          sampleWeightGrams: 100,
          sealCode: '',
          storageTemperatureCelsius: 4,
          sensoryEvaluation: 'PASSED',
          tastedBy: ''
        }))
      };
    });
  }, [isInspectionLogLoading, isInspectionLogError, weeklyMenuItems, todaysApprovedDishes, selectedDate, targetDayNumber]);

  const handleAddRawMaterial = () => {
    if (!newMaterial.ingredientName.trim() || !newMaterial.supplierName.trim() || !newMaterial.invoiceNumber.trim()) {
      setToastMessage({ type: 'error', text: 'Cần nhập tên thực phẩm, nhà cung cấp và số hóa đơn.' });
      return;
    }
    setLocalLog((current) => ({
      ...current,
      rawMaterials: [...current.rawMaterials, {
        ...newMaterial,
        id: crypto.randomUUID(),
        sensoryEvaluation: 'PASSED',
        isRejected: false
      }]
    }));
    setNewMaterial({
      ingredientName: '',
      quantityKg: 0,
      supplierName: '',
      invoiceNumber: '',
      deliveryTemperatureCelsius: 4,
      isFrozenOrChilled: false
    });
  };

  const handleAddCookingDish = () => {
    if (!newCookingDish.dishName.trim() || !newCookingDish.cookingMethod.trim()) {
      setToastMessage({ type: 'error', text: 'Cần nhập tên món và phương pháp chế biến.' });
      return;
    }
    setLocalLog((current) => ({
      ...current,
      cookingTemperatures: [...current.cookingTemperatures, {
        ...newCookingDish,
        id: crypto.randomUUID(),
        isHygieneStandardPassed: false
      }]
    }));
    setNewCookingDish({ dishName: '', cookingMethod: '', coreTemperatureCelsius: 70 });
  };

  const handleInvoicePhotoUpload = async (itemId: string, file?: File) => {
    if (!file) return;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `inspections/${selectedDate}/invoice_${itemId}.${extension}`;
      const savedPath = await uploadKitchenEvidence(file, path);
      setLocalLog((current) => ({
        ...current,
        rawMaterials: current.rawMaterials.map((item) =>
          item.id === itemId ? { ...item, invoicePhotoPath: savedPath } : item
        )
      }));
      setToastMessage({ type: 'success', text: 'Đã tải ảnh hóa đơn lên kho bằng chứng.' });
    } catch (uploadError) {
      setToastMessage({
        type: 'error',
        text: uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh hóa đơn.'
      });
    }
  };

  const handleSamplePhotoUpload = async (sampleId: string, sealCode: string, file?: File) => {
    if (!file) return;
    const safeSealCode = sealCode.trim().replace(/[^A-Za-z0-9_-]/g, '_');
    if (!safeSealCode) {
      setToastMessage({ type: 'error', text: 'Nhập mã niêm phong trước khi tải ảnh mẫu.' });
      return;
    }
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `samples/${selectedDate}/${safeSealCode}.${extension}`;
      const savedPath = await uploadKitchenEvidence(file, path);
      setLocalLog((current) => ({
        ...current,
        retentionSamples: current.retentionSamples.map((sample) =>
          sample.id === sampleId ? { ...sample, photoUrl: savedPath } : sample
        )
      }));
      setToastMessage({ type: 'success', text: 'Đã tải ảnh tem niêm phong lên kho bằng chứng.' });
    } catch (uploadError) {
      setToastMessage({
        type: 'error',
        text: uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh mẫu lưu.'
      });
    }
  };

  // Handle Step 1 Save
  const handleSaveStep1 = () => {
    const invalidRawMaterials = localLog.rawMaterials.length === 0 || localLog.rawMaterials.some(
      (item) =>
        !item.supplierName.trim() ||
        !item.invoiceNumber.trim() ||
        !item.invoicePhotoPath ||
        item.sensoryEvaluation !== 'PASSED'
    );
    if (invalidRawMaterials) {
      setToastMessage({ type: 'error', text: `MSG-113: ${MSG_113}` });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    if (!localLog.step1ChefSignature) {
      setToastMessage({
        type: 'warning',
        text: 'Vui lòng ký xác nhận điện tử Bước 1 của Bếp trưởng trước khi hoàn tất.',
      });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const updated: ThreeStepFoodSafetyInspectionLog = {
      ...localLog,
      step1Completed: true,
    };
    saveInspectionMutation.mutate(updated, {
      onSuccess: () => {
        setLocalLog(updated);
        setToastMessage({
          type: 'success',
          text: 'Đã hoàn thành và ký số Bước 1: Kiểm tra nhập nguyên liệu (06:30 AM)',
        });
        setTimeout(() => setToastMessage(null), 4000);
      },
      onError: (error) => {
        setToastMessage({ type: 'error', text: error.message });
      },
    });
  };

  // Handle Step 2 Save
  const handleSaveStep2 = () => {
    const invalidCookingTemperature = localLog.cookingTemperatures.length === 0 ||
      localLog.cookingTemperatures.some((dish) => dish.coreTemperatureCelsius < 70);
    if (invalidCookingTemperature) {
      setToastMessage({
        type: 'error',
        text: 'Nhiệt độ tâm thức ăn chín phải đạt ít nhất 70.0°C.',
      });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const hygiene = localLog.hygieneChecklist;
    if (!hygiene.protectiveClothing || !hygiene.separateCuttingBoards || !hygiene.cleanWaterSource) {
      setToastMessage({
        type: 'error',
        text: 'Vui lòng xác nhận đầy đủ các yêu cầu vệ sinh trong quá trình chế biến.',
      });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    if (!localLog.step2ChefSignature) {
      setToastMessage({
        type: 'warning',
        text: 'Vui lòng ký xác nhận điện tử Bước 2 của Bếp trưởng trước khi hoàn tất.',
      });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const updated: ThreeStepFoodSafetyInspectionLog = {
      ...localLog,
      step2Completed: true,
    };
    saveInspectionMutation.mutate(updated, {
      onSuccess: () => {
        setLocalLog(updated);
        setToastMessage({
          type: 'success',
          text: 'Đã hoàn thành và ký số Bước 2: Kiểm tra chế biến & nhiệt độ tâm món (10:30 AM)',
        });
        setTimeout(() => setToastMessage(null), 4000);
      },
      onError: (error) => {
        setToastMessage({ type: 'error', text: error.message });
      },
    });
  };

  // Handle Step 3 Save
  const handleSaveStep3 = () => {
    const invalidSamples = localLog.retentionSamples.length === 0 || localLog.retentionSamples.some(
      (sample) =>
        sample.sampleWeightGrams < 100 ||
        !sample.sealCode.trim() ||
        !sample.photoUrl
    );
    if (invalidSamples) {
      setToastMessage({
        type: 'error',
        text: `MSG-115: ${MSG_115}`,
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    const invalidTemp = localLog.retentionSamples.some(
      (s) => s.storageTemperatureCelsius < 2 || s.storageTemperatureCelsius > 8
    );
    if (invalidTemp) {
      setToastMessage({
        type: 'error',
        text: `MSG-114: ${MSG_114}`,
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    if (!localLog.step3ChefSignature) {
      setToastMessage({
        type: 'warning',
        text: 'Vui lòng ký xác nhận điện tử Bước 3 của Bếp trưởng trước khi hoàn tất.',
      });
      setTimeout(() => setToastMessage(null), 6000);
      return;
    }

    const updated: ThreeStepFoodSafetyInspectionLog = {
      ...localLog,
      step3Completed: true,
      overallStatus: 'COMPLETED',
    };
    saveInspectionMutation.mutate(updated, {
      onSuccess: () => {
        setLocalLog(updated);
        setToastMessage({
          type: 'success',
          text: `MSG-112: ${MSG_112}`,
        });
        setTimeout(() => setToastMessage(null), 6000);
      },
      onError: (error) => {
        setToastMessage({ type: 'error', text: error.message });
      },
    });
  };

  // Reject Raw Material Shipment
  const handleRejectShipment = () => {
    if (!rejectingItem) return;
    const updatedRaw = localLog.rawMaterials.map((r) =>
      r.id === rejectingItem.id
        ? {
            ...r,
            isRejected: true,
            sensoryEvaluation: 'FAILED' as const,
            rejectionReason: rejectionReasonInput || 'Không đạt chỉ tiêu cảm quan màu sắc/mùi vị, bao bì hở',
          }
        : r
    );

    const updated: ThreeStepFoodSafetyInspectionLog = {
      ...localLog,
      rawMaterials: updatedRaw,
      rejectionIncidentReported: true,
      overallStatus: 'REJECTED_INCIDENT',
    };

    saveInspectionMutation.mutate(updated, {
      onSuccess: () => {
        setLocalLog(updated);
        setRejectingItem(null);
        setRejectionReasonInput('');
        setToastMessage({
          type: 'warning',
          text: `Đã lưu biên bản từ chối lô hàng "${rejectingItem.ingredientName}".`,
        });
        setTimeout(() => setToastMessage(null), 6000);
      },
      onError: (error) => {
        setToastMessage({ type: 'error', text: error.message });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isInspectionLogError && (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          Không thể tải sổ kiểm thực từ máy chủ: {inspectionLogError instanceof Error
            ? inspectionLogError.message
            : 'Lỗi không xác định.'}
          <p className="mt-1 text-xs">
            Dữ liệu đang nhập chỉ là bản nháp trong phiên này; schema hiện tại chưa có API lưu đầy đủ thông tin 3 bước.
          </p>
        </div>
      )}

      {/* Header & Stepper */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1E4D40] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#275A4E]" />
            <span>Sổ Kiểm Thực 3 Bước & Lưu Mẫu 24H (QĐ 1246/QĐ-BYT)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quy trình kiểm soát an toàn thực phẩm 3 bước tuần tự theo khung giờ của Bộ Y Tế kèm chữ ký kép điện tử
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-xs focus:border-[#275A4E] focus:outline-none min-h-[44px]"
          />
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isInspectionLogLoading || isInspectionLogError}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs transition min-h-[44px] cursor-pointer"
          >
            <Printer className="h-4 w-4 text-[#275A4E]" />
            <span>Xuất Sổ QĐ 1246/BYT</span>
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Bước 1 */}
        <button
          onClick={() => setActiveStepTab('step1')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
            activeStepTab === 'step1'
              ? 'ring-2 ring-[#275A4E] bg-emerald-50/50 border-emerald-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              localLog.step1Completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {localLog.step1Completed ? <Check className="h-5 w-5" /> : '01'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase">Bước 1: Nhập Nguyên Liệu</span>
              <span className="text-[11px] font-semibold text-[#275A4E] bg-[#275A4E]/10 px-2 py-0.5 rounded-full">
                06:30 AM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Kiểm tra nguồn gốc, hóa đơn, cảm quan & nhiệt độ giao hàng</p>
            <div className="mt-2 text-[11px] font-bold">
              {localLog.step1Completed ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã ký duyệt Bước 1
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Chờ Bếp trưởng ký xác nhận
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Bước 2 */}
        <button
          onClick={() => setActiveStepTab('step2')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
            activeStepTab === 'step2'
              ? 'ring-2 ring-[#275A4E] bg-emerald-50/50 border-emerald-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              localLog.step2Completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {localLog.step2Completed ? <Check className="h-5 w-5" /> : '02'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase">Bước 2: Trong Chế Biến</span>
              <span className="text-[11px] font-semibold text-[#275A4E] bg-[#275A4E]/10 px-2 py-0.5 rounded-full">
                10:30 AM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Vệ sinh sơ chế, dao thớt tách biệt & đo nhiệt độ tâm món ≥ 70°C</p>
            <div className="mt-2 text-[11px] font-bold">
              {localLog.step2Completed ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Đã ký duyệt Bước 2
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Đang kiểm tra nhiệt độ nấu chín
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Bước 3 */}
        <button
          onClick={() => setActiveStepTab('step3')}
          className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
            activeStepTab === 'step3'
              ? 'ring-2 ring-[#275A4E] bg-emerald-50/50 border-emerald-300'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              localLog.step3Completed ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {localLog.step3Completed ? <Check className="h-5 w-5" /> : '03'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase">Bước 3: Trước Ăn & Lưu Mẫu</span>
              <span className="text-[11px] font-semibold text-[#275A4E] bg-[#275A4E]/10 px-2 py-0.5 rounded-full">
                11:15 AM
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Nếm cảm quan, dán tem niêm phong lưu hũ $\ge 100g$, tủ 2-8°C & Ký kép</p>
            <div className="mt-2 text-[11px] font-bold">
              {localLog.step3Completed ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn tất chữ ký kép Bếp & BGH
                </span>
              ) : (
                <span className="text-rose-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> Yêu cầu chữ ký kép Bếp & BGH
                </span>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* ================= TAB 1: BƯỚC 1 (06:30 AM) ================= */}
      {activeStepTab === 'step1' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#275A4E]" />
                  <span>Bước 1: Kiểm Tra Trước Khi Chế Biến (Nhập Nguyên Liệu Lúc 06:30 AM)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đánh giá cảm quan thực phẩm tươi sống, kiểm tra chứng từ nguồn gốc & nhiệt độ bảo quản khi giao nhận
                </p>
              </div>

              {localLog.rejectionIncidentReported && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Đã lập biên bản từ chối lô hàng</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
              <input aria-label="Tên thực phẩm" placeholder="Tên thực phẩm" value={newMaterial.ingredientName} onChange={(event) => setNewMaterial({ ...newMaterial, ingredientName: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
              <input aria-label="Khối lượng kg" type="number" min="0" step="0.1" placeholder="Khối lượng (kg)" value={newMaterial.quantityKg} onChange={(event) => setNewMaterial({ ...newMaterial, quantityKg: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
              <input aria-label="Nhà cung cấp" placeholder="Nhà cung cấp" value={newMaterial.supplierName} onChange={(event) => setNewMaterial({ ...newMaterial, supplierName: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
              <input aria-label="Số hóa đơn" placeholder="Số hóa đơn / kiểm dịch" value={newMaterial.invoiceNumber} onChange={(event) => setNewMaterial({ ...newMaterial, invoiceNumber: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
              <input aria-label="Nhiệt độ giao hàng" type="number" step="0.1" placeholder="Nhiệt độ giao (°C)" value={newMaterial.deliveryTemperatureCelsius} onChange={(event) => setNewMaterial({ ...newMaterial, deliveryTemperatureCelsius: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
              <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={newMaterial.isFrozenOrChilled} onChange={(event) => setNewMaterial({ ...newMaterial, isFrozenOrChilled: event.target.checked })} />Hàng đông lạnh / bảo quản mát</label>
              <button type="button" onClick={handleAddRawMaterial} className="rounded-lg bg-[#275A4E] px-4 py-2 text-xs font-bold text-white sm:col-span-3">Thêm nguyên liệu</button>
            </div>

            {/* Bảng nguyên liệu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b">
                  <tr>
                    <th className="py-3 px-3">Tên Thực Phẩm</th>
                    <th className="py-3 px-3">Khối Lượng</th>
                    <th className="py-3 px-3">Nhà Cung Cấp</th>
                    <th className="py-3 px-3">Số Hóa Đơn / Kiểm Dịch</th>
                    <th className="py-3 px-3">Nhiệt Độ Giao (°C)</th>
                    <th className="py-3 px-3">Đánh Giá Cảm Quan</th>
                    <th className="py-3 px-3">Ảnh Hóa Đơn</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localLog.rawMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Chưa có lô nguyên liệu nào được nhập trong ngày hôm nay.
                      </td>
                    </tr>
                  ) : (
                    localLog.rawMaterials.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 transition ${item.isRejected ? 'bg-rose-50/60' : ''}`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {item.ingredientName}
                        {item.isRejected && (
                          <span className="block text-[10px] text-rose-600 font-normal">
                            [ĐÃ TỪ CHỐI NHẬP: {item.rejectionReason}]
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold">{item.quantityKg} kg</td>
                      <td className="py-3 px-3 text-slate-600">{item.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.invoiceNumber}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-semibold ${
                            item.isFrozenOrChilled && item.deliveryTemperatureCelsius > 5
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-700'
                          }`}
                        >
                          {item.deliveryTemperatureCelsius}°C
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.isRejected ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            KHÔNG ĐẠT
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ĐẠT CHUẨN
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {item.invoicePhotoPath && (
                          <button type="button" onClick={() => openKitchenEvidence(item.invoicePhotoPath!).catch((error) => setToastMessage({ type: 'error', text: error.message }))} className="mb-1 block text-[10px] font-semibold text-[#275A4E] underline">Xem ảnh đã tải</button>
                        )}
                        <input type="file" accept="image/*" aria-label={`Ảnh hóa đơn ${item.ingredientName}`} onChange={(event) => handleInvoicePhotoUpload(item.id, event.target.files?.[0])} className="max-w-32 text-[10px]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!item.isRejected ? (
                          <button
                            type="button"
                            onClick={() => setRejectingItem(item)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                          >
                            Từ Chối Lô Hàng
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-600">Đã lập biên bản</span>
                        )}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            {/* Chữ ký số Bước 1 */}
            <div className="pt-4 border-t flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="w-full max-w-sm">
                <DigitalSignaturePad
                  signerTitle="Bếp Trưởng"
                  signerName="Nguyễn Văn Tuấn"
                  savedSignature={localLog.step1ChefSignature}
                  onSave={(signature) => setLocalLog({ ...localLog, step1ChefSignature: signature })}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveStep1}
                  disabled={saveInspectionMutation.isPending || isInspectionLogLoading || isInspectionLogError}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-xs transition min-h-[44px] cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Hoàn Tất & Lưu Bước 1 (06:30 AM)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: BƯỚC 2 (10:30 AM) ================= */}
      {activeStepTab === 'step2' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-[#275A4E]" />
                <span>Bước 2: Kiểm Tra Trong Quá Trình Chế Biến (Lúc 10:30 AM)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra điều kiện vệ sinh môi trường bếp, trang phục bảo hộ và đo nhiệt độ tâm món nấu chín (≥ 70°C)
              </p>
            </div>

            {/* Hygiene Checklist */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold text-[#1E4D40] uppercase">
                Tiêu Chí Vệ Sinh An Toàn Thực Phẩm Trong Khi Nấu:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localLog.hygieneChecklist.protectiveClothing}
                    onChange={(e) =>
                      setLocalLog({
                        ...localLog,
                        hygieneChecklist: {
                          ...localLog.hygieneChecklist,
                          protectiveClothing: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-[#275A4E]"
                  />
                  <span className="font-medium text-slate-700">100% NV mang mũ, khẩu trang, tạp dề</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localLog.hygieneChecklist.separateCuttingBoards}
                    onChange={(e) =>
                      setLocalLog({
                        ...localLog,
                        hygieneChecklist: {
                          ...localLog.hygieneChecklist,
                          separateCuttingBoards: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-[#275A4E]"
                  />
                  <span className="font-medium text-slate-700">Dao thớt sống / chín riêng biệt</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localLog.hygieneChecklist.cleanWaterSource}
                    onChange={(e) =>
                      setLocalLog({
                        ...localLog,
                        hygieneChecklist: {
                          ...localLog.hygieneChecklist,
                          cleanWaterSource: e.target.checked,
                        },
                      })
                    }
                    className="rounded text-[#275A4E]"
                  />
                  <span className="font-medium text-slate-700">Nguồn nước lọc đạt tiêu chuẩn QCVN</span>
                </label>
              </div>
            </div>

            {/* Bảng đo nhiệt độ tâm món */}
            <div>
              <div className="mb-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                <input aria-label="Tên món kiểm tra nhiệt độ" placeholder="Tên món" value={newCookingDish.dishName} onChange={(event) => setNewCookingDish({ ...newCookingDish, dishName: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
                <input aria-label="Phương pháp chế biến" placeholder="Phương pháp chế biến" value={newCookingDish.cookingMethod} onChange={(event) => setNewCookingDish({ ...newCookingDish, cookingMethod: event.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
                <input aria-label="Nhiệt độ tâm món" type="number" step="0.5" value={newCookingDish.coreTemperatureCelsius} onChange={(event) => setNewCookingDish({ ...newCookingDish, coreTemperatureCelsius: Number(event.target.value) })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs" />
                <button type="button" onClick={handleAddCookingDish} className="rounded-lg bg-[#275A4E] px-4 py-2 text-xs font-bold text-white sm:col-span-3">Thêm món đo nhiệt độ</button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase">
                  Bảng Đo Nhiệt Độ Tâm Món Nấu Chín (Bắt buộc ≥ 70°C)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dùng nhiệt kế kim đo trực tiếp tâm phần thịt/cá trước khi chia suất
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b">
                    <tr>
                      <th className="py-3 px-3">Tên Món Ăn</th>
                      <th className="py-3 px-3">Phương Pháp Chế Biến</th>
                      <th className="py-3 px-3">Nhiệt Độ Tâm Món (°C)</th>
                      <th className="py-3 px-3">Đánh Giá Tiêu Chuẩn</th>
                      <th className="py-3 px-3">Ghi Chú Kỹ Thuật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localLog.cookingTemperatures.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có dữ liệu đo nhiệt độ món ăn nào.
                        </td>
                      </tr>
                    ) : (
                      localLog.cookingTemperatures.map((dish, idx) => {
                      const isHotEnough = dish.coreTemperatureCelsius >= 70;

                      return (
                        <tr key={dish.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-800">{dish.dishName}</td>
                          <td className="py-3 px-3 text-slate-600">{dish.cookingMethod}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                value={dish.coreTemperatureCelsius}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const updated = [...localLog.cookingTemperatures];
                                  updated[idx] = { ...dish, coreTemperatureCelsius: val };
                                  setLocalLog({ ...localLog, cookingTemperatures: updated });
                                }}
                                className="w-20 px-2.5 py-1 text-xs rounded-lg border border-slate-300 font-bold focus:border-[#275A4E]"
                              />
                              <span className="font-semibold text-slate-500">°C</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {isHotEnough ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ĐẠT (≥ 70°C)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse">
                                CHƯA ĐẠT (CẦN NẤU THÊM)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{dish.notes}</td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chữ ký số Bước 2 */}
            <div className="pt-4 border-t flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="w-full max-w-sm">
                <DigitalSignaturePad
                  signerTitle="Bếp Trưởng"
                  signerName="Nguyễn Văn Tuấn"
                  savedSignature={localLog.step2ChefSignature}
                  onSave={(signature) => setLocalLog({ ...localLog, step2ChefSignature: signature })}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveStep2}
                  disabled={saveInspectionMutation.isPending || isInspectionLogLoading || isInspectionLogError}
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-xs transition min-h-[44px] cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Hoàn Tất & Lưu Bước 2 (10:30 AM)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: BƯỚC 3 (11:15 AM) ================= */}
      {activeStepTab === 'step3' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
            <div className="border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#275A4E]" />
                <span>Bước 3: Kiểm Tra Trước Khi Ăn & Lưu Mẫu Thức Ăn 24 Giờ (11:15 AM)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đánh giá cảm quan trước khi chia suất, niêm phong mẫu $\ge 100g$, tủ 2°C - 8°C và bắt buộc chữ ký kép Bếp & BGH
              </p>
            </div>
            {isWeeklyMenuError ? (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                Không tải được thực đơn để đối chiếu mẫu lưu: {weeklyMenuError instanceof Error ? weeklyMenuError.message : 'Lỗi không xác định'}.
              </div>
            ) : !isInspectionLogLoading && !isWeeklyMenuLoading && todaysApprovedDishes.length === 0 ? (
              <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Chưa có thực đơn đã duyệt cho ngày này. Không thể hoàn tất bước lưu mẫu cho tới khi có thực đơn đã duyệt.
              </div>
            ) : null}

            {/* Bảng lưu mẫu thức ăn */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b">
                  <tr>
                    <th className="py-3 px-3">Món Ăn Thực Đơn</th>
                    <th className="py-3 px-3">Cảm Quan Trước Ăn</th>
                    <th className="py-3 px-3">Khối Lượng Mẫu Lưu (g / ml)</th>
                    <th className="py-3 px-3">Mã Tem Niêm Phong</th>
                    <th className="py-3 px-3">Nhiệt Độ Tủ Lưu (°C)</th>
                    <th className="py-3 px-3">Ảnh Hũ Mẫu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localLog.retentionSamples.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Chưa có mẫu lưu thực phẩm nào được ghi nhận.
                      </td>
                    </tr>
                  ) : (
                    localLog.retentionSamples.map((sample, idx) => {
                    const isWeightValid = sample.sampleWeightGrams >= 100;
                    const isTempValid = sample.storageTemperatureCelsius >= 2 && sample.storageTemperatureCelsius <= 8;

                    return (
                      <tr key={sample.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-800">{sample.dishName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ĐẠT YÊU CẦU
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={sample.sampleWeightGrams}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                const updated = [...localLog.retentionSamples];
                                updated[idx] = { ...sample, sampleWeightGrams: val };
                                setLocalLog({ ...localLog, retentionSamples: updated });
                              }}
                              className={`w-20 px-2 py-1 text-xs rounded-lg border font-bold ${
                                isWeightValid ? 'border-slate-300' : 'border-rose-400 bg-rose-50 text-rose-700'
                              }`}
                            />
                            <span className="text-slate-500">g</span>
                          </div>
                          {!isWeightValid && (
                            <span className="text-[10px] text-rose-600 block mt-0.5">Bắt buộc ≥ 100g (MSG-115)</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={sample.sealCode}
                            onChange={(e) => {
                              const updated = [...localLog.retentionSamples];
                              updated[idx] = { ...sample, sealCode: e.target.value, photoUrl: undefined };
                              setLocalLog({ ...localLog, retentionSamples: updated });
                            }}
                            aria-label={`Mã niêm phong mẫu ${sample.dishName}`}
                            className={`w-36 px-2 py-1 text-xs rounded-lg border font-mono ${
                              sample.sealCode.trim() ? 'border-slate-300' : 'border-rose-400 bg-rose-50'
                            }`}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="any"
                              value={sample.storageTemperatureCelsius}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...localLog.retentionSamples];
                                updated[idx] = { ...sample, storageTemperatureCelsius: val };
                                setLocalLog({ ...localLog, retentionSamples: updated });
                              }}
                              className={`w-16 px-2 py-1 text-xs rounded-lg border font-bold ${
                                isTempValid ? 'border-slate-300' : 'border-rose-400 bg-rose-50 text-rose-700'
                              }`}
                            />
                            <span className="text-slate-500">°C</span>
                          </div>
                          {!isTempValid && (
                            <span className="text-[10px] text-rose-600 block mt-0.5">Tủ phải 2-8°C (MSG-114)</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {sample.photoUrl && <button type="button" onClick={() => openKitchenEvidence(sample.photoUrl!).catch((error) => setToastMessage({ type: 'error', text: error.message }))} className="mb-1 block text-[10px] font-semibold text-[#275A4E] underline">Xem ảnh đã tải</button>}
                          <input type="file" accept="image/*" aria-label={`Ảnh mẫu ${sample.dishName}`} onChange={(event) => handleSamplePhotoUpload(sample.id, sample.sealCode, event.target.files?.[0])} className="max-w-32 text-[10px]" />
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>

            <div className="w-full max-w-sm">
              <DigitalSignaturePad
                signerTitle="Bếp Trưởng"
                signerName="Nguyễn Văn Tuấn"
                savedSignature={localLog.step3ChefSignature}
                onSave={(signature) => setLocalLog({ ...localLog, step3ChefSignature: signature })}
              />
            </div>

            {/* Hoàn tất lưu mẫu 3 bước */}
            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={handleSaveStep3}
                disabled={saveInspectionMutation.isPending || isInspectionLogLoading || isInspectionLogError}
                className="px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white shadow-xs transition min-h-[44px] cursor-pointer flex items-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Xác Nhận & Niêm Phong Mẫu 24H (11:15 AM)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL TỪ CHỐI LÔ HÀNG (BIÊN BẢN VI PHẠM) ================= */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <Ban className="h-5 w-5" />
                <h3 className="text-base font-bold">Biên Bản Từ Chối Nhập Nguyên Liệu</h3>
              </div>
              <button onClick={() => setRejectingItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>
                  Thực phẩm: <strong className="text-slate-800">{rejectingItem.ingredientName}</strong>
                </div>
                <div>
                  Khối lượng giao: <strong>{rejectingItem.quantityKg} kg</strong>
                </div>
                <div>
                  Nhà cung cấp: <strong>{rejectingItem.supplierName}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lý Do Từ Chối Lô Hàng (Lập Biên Bản) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Thịt có mùi lạ, bao bì rách, nhiệt độ giao nhận 12°C vượt ngưỡng cho phép..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectShipment}
                disabled={isInspectionLogLoading || isInspectionLogError}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-700 text-white hover:bg-rose-800 shadow-sm cursor-pointer"
              >
                Lập biên bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL XUẤT BIỂU MẪU SỔ KIỂM THỰC 3 BƯỚC (QĐ 1246/BYT) ================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-5 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-[#275A4E]" />
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Sổ Kiểm Thực 3 Bước Theo Quyết Định 1246/QĐ-BYT (Bộ Y Tế)
                  </h3>
                  <p className="text-xs text-slate-500">Mẫu Biểu Số 1, 2, 3 - Ngày kiểm thực: {selectedDate}</p>
                </div>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4 bg-slate-50/50 rounded-xl border text-xs">
              <div className="text-center space-y-1 border-b pb-3">
                <div className="font-bold text-slate-800 uppercase text-sm">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="text-[11px] font-semibold text-slate-600">Độc lập - Tự do - Hạnh phúc</div>
                <div className="font-extrabold text-[#1E4D40] text-base mt-2">
                  SỔ KIỂM THỰC BA BƯỚC & LƯU MẪU THỨC ĂN
                </div>
                <div className="text-slate-500">Trường Mầm Non Tiêu Chuẩn Quốc Tế KidPro</div>
              </div>

              {/* Tóm tắt Bước 1 */}
              <div>
                <div className="font-bold text-slate-800 mb-1">MẪU 1: KIỂM TRA TRƯỚC KHI CHẾ BIẾN (06:30)</div>
                <div className="overflow-x-auto bg-white rounded-lg border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Tên thực phẩm</th>
                        <th className="p-2">Số lượng</th>
                        <th className="p-2">Nguồn gốc / Hóa đơn</th>
                        <th className="p-2">Cảm quan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {localLog.rawMaterials.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2 font-medium">{m.ingredientName}</td>
                          <td className="p-2">{m.quantityKg} kg</td>
                          <td className="p-2">{m.supplierName} ({m.invoiceNumber})</td>
                          <td className="p-2">{m.isRejected ? 'TỪ CHỐI' : 'ĐẠT'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tóm tắt Bước 2 */}
              <div>
                <div className="font-bold text-slate-800 mb-1">MẪU 2: KIỂM TRA TRONG QUÁ TRÌNH CHẾ BIẾN (10:30)</div>
                <div className="overflow-x-auto bg-white rounded-lg border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Món ăn</th>
                        <th className="p-2">Nhiệt độ tâm (≥ 70°C)</th>
                        <th className="p-2">Vệ sinh bảo hộ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {localLog.cookingTemperatures.map((c) => (
                        <tr key={c.id}>
                          <td className="p-2 font-medium">{c.dishName}</td>
                          <td className="p-2">{c.coreTemperatureCelsius}°C</td>
                          <td className="p-2">Đạt chuẩn</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tóm tắt Bước 3 */}
              <div>
                <div className="font-bold text-slate-800 mb-1">MẪU 3: KIỂM TRA TRƯỚC KHI ĂN & LƯU MẪU 24H (11:15)</div>
                <div className="overflow-x-auto bg-white rounded-lg border">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 font-bold">
                      <tr>
                        <th className="p-2">Mẫu lưu</th>
                        <th className="p-2">Khối lượng (&ge; 100g)</th>
                        <th className="p-2">Mã tem niêm phong</th>
                        <th className="p-2">Nhiệt độ tủ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {localLog.retentionSamples.map((r) => (
                        <tr key={r.id}>
                          <td className="p-2 font-medium">{r.dishName}</td>
                          <td className="p-2">{r.sampleWeightGrams} g</td>
                          <td className="p-2">{r.sealCode}</td>
                          <td className="p-2">{r.storageTemperatureCelsius}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chữ ký đại diện */}
              <div className="pt-3 grid grid-cols-2 text-center text-xs font-semibold">
                <div>
                  <div>BẾP TRƯỞNG</div>
                  <div className="text-[10px] text-slate-400 mt-1">(Đã ký số điện tử)</div>
                  {localLog.step3ChefSignature && (
                    <img src={localLog.step3ChefSignature} alt="Ký Bếp Trưởng" className="h-14 mx-auto mt-1" />
                  )}
                  <div className="mt-1 font-bold text-slate-700">Nguyễn Văn Tuấn</div>
                </div>
                <div>
                  <div>ĐẠI DIỆN BAN GIÁM HIỆU</div>
                  <div className="text-[10px] text-slate-400 mt-1">(Đã ký số điện tử)</div>
                  {localLog.step3PrincipalSignature && (
                    <img src={localLog.step3PrincipalSignature} alt="Ký BGH" className="h-14 mx-auto mt-1" />
                  )}
                  <div className="mt-1 font-bold text-slate-700">Trần Thị Mai</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#275A4E] text-white hover:bg-[#1E4D40] shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>In Sổ Kiểm Thực (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodSafetyThreeStepInspectionTab;
