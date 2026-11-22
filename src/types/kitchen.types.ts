export interface ClassPortionSummaryDto {
  classId: string;
  className: string;
  total: number;
  present: number;
  absent: number;
  regularMealCount: number;
  porridgeCount: number;
  allergySafeCount: number;
  allergies: string;
}

export interface KitchenDailySummary {
  date: string;
  isLocked: boolean;
  lockedAt?: string | null;
  cutoffTimeMessage: string;
  totalStudents: number;
  totalActiveStudents: number;
  presentCount: number;
  absentPermitted: number;
  absentUnpermitted: number;
  absentWithLeave: number;
  absentWithoutLeave: number;
  totalAbsent: number;
  totalMealsToPrepare: number;
  totalPortionsToCook: number;
  specialDietCount: number;
  classSummaries: ClassPortionSummaryDto[];
}

export interface WeeklyMenu {
  id?: string;
  itemId?: number;
  menuStatus?: 'DRAFT' | 'APPROVED' | 'REJECTED';
  menuType?: 'RICE' | 'PORRIDGE';
  weekStartDate?: string;
  dayOfWeek: number; // 1 = Thứ 2 ... 7 = Chủ Nhật
  mealType: 'BREAKFAST' | 'MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK' | 'SNACK';
  dishName: string;
  nutritionNotes?: string;
  allergyTags?: string;
  calories?: number;
}

export interface DayMenuPlan {
  dayOfWeek: number; // 1 (T2) to 5 (T6)
  dayName: string;
  breakfast: string;
  morningSnack: string;
  lunchMainProtein: string;
  lunchVegetable: string;
  lunchSoup: string;
  lunchRice: string;
  lunchDessert: string;
  snack: string;
  calories: number;
  nutritionNotes?: string;
  allergyTags: string[];
}

export interface WeeklyMenuPayload {
  weekStartDate: string;
  menuType?: 'RICE' | 'PORRIDGE';
  days: {
    dayOfWeek: number;
    breakfast: string;
    morningSnack: string;
    lunch: string;
    snack: string;
    calories: number;
    nutritionNotes?: string;
    allergyTags: string[];
  }[];
}

// ==========================================
// KHÓA SỐ SUẤT ĂN 08:30 (MEAL HEADCOUNT LOCK)
// ==========================================
export type AgeGroupType = 'INFANT' | 'TODDLER' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';

export interface ClassMealHeadcountBreakdown {
  classId: string;
  className: string;
  ageGroup: AgeGroupType;
  totalEnrolled: number;
  presentCount: number;
  absentPermitted: number; // Nghỉ có phép (được hoàn tiền nếu trước 08:30)
  absentUnpermitted: number; // Vắng không phép
  regularRiceCount: number; // Suất cơm tiêu chuẩn
  porridgeCount: number; // Suất cháo dinh dưỡng (khối Nhà trẻ)
  allergyCount: number; // Suất tránh dị ứng riêng biệt
  isLocked: boolean;
  attendanceFinalized: boolean; // Trạng thái đã chốt điểm danh lúc 08:30 hay chưa
  allergyNotes?: string;
}

export interface MealHeadcountSnapshot {
  id?: string;
  date: string;
  isLocked: boolean;
  lockedAt?: string | null;
  lockType?: 'AUTO' | 'MANUAL';
  totalMealsToPrepare: number;
  regularRiceCount: number;
  porridgeCount: number;
  allergySafeCount: number;
  totalPresent: number;
  totalAbsentPermitted: number;
  totalAbsentUnpermitted: number;
  attendanceBreakdownAvailable?: boolean;
  mealPackageBreakdownAvailable?: boolean;
  classBreakdowns: ClassMealHeadcountBreakdown[];
}

export interface LockHeadcountRequest {
  date: string;
  forceLock?: boolean;
}

// ==========================================
// QUẢN LÝ DỊ ỨNG & CHẾ ĐỘ ĂN RIÊNG (ALLERGY DIETS)
// ==========================================
export type AllergySeverity = 'ANAPHYLAXIS' | 'HIGH' | 'MEDIUM';

export interface DietaryAllergyItem {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  roomNumber: string;
  allergyTags: string[]; // Danh sách dị nguyên (vd: ["Hải sản", "Đậu phộng"])
  severity: AllergySeverity;
  todayConflictedDishes: string[]; // Món ăn hôm nay xung đột (vd: ["Chả tôm hấp"])
  safeSubstituteDish: string; // Món ăn thay thế an toàn đã duyệt
  preparationStatus: 'PENDING' | 'PREPARED';
  preparedAt?: string;
  preparedBy?: string;
  isolatedAreaConfirmed: boolean; // Xác nhận chế biến tại khu vực cách ly, dụng cụ khử khuẩn riêng
  labelPrinted: boolean;
  labelPrintedAt?: string;
  isPresentToday: boolean;
  parentNotes?: string;
  allergenMatchKnown?: boolean;
}

export interface DietaryPreparationUpdatePayload {
  itemId: string;
  preparationStatus: 'PENDING' | 'PREPARED';
  isolatedAreaConfirmed: boolean;
  allergenMatchConfirmed: boolean;
  safeSubstituteDish?: string;
}

// ==========================================
// TIÊU HAO THỰC PHẨM & LƯU MẪU 24H (FOOD RETENTION & CONSUMPTION)
// ==========================================
export type MealSessionType = 'LUNCH' | 'SNACK' | 'BREAKFAST';
export type FoodSampleStatus = 'STORING' | 'READY_FOR_DISPOSAL' | 'EXPIRED' | 'DISPOSED';

export interface FoodSampleRetention {
  id: string;
  date: string; // YYYY-MM-DD
  mealSession: MealSessionType;
  dishName: string;
  sampleWeightGrams: number | null; // >= 100g khi được ghi nhận
  sealCode: string; // Mã tem niêm phong dùng 1 lần (vd: NP-20261009-01)
  storageTemperatureCelsius: number | null; // 2°C - 8°C khi được ghi nhận
  photoUrl?: string; // Ảnh hũ thủy tinh dán tem cất tủ lạnh
  savedAt?: string;
  savedBy: string; // Người thực hiện lưu mẫu
  timerExpiresAt?: string; // Chỉ có khi backend lưu được thời điểm tạo chính xác
  status: FoodSampleStatus;
  disposedAt?: string;
  disposedBy?: string;
  disposalNotes?: string;
  noPoisoningIncidentConfirmed?: boolean; // Xác nhận không có sự cố ngộ độc toàn trường
}

export interface FoodSampleCreatePayload {
  date: string;
  mealSession: MealSessionType;
  dishName: string;
  sampleWeightGrams: number;
  sealCode: string;
  storageTemperatureCelsius: number;
  photoUrl?: string;
}

export interface FoodSampleDisposalPayload {
  noFoodSafetyIncidentConfirmed: boolean;
}

export type IngredientCategory = 'MEAT' | 'FISH' | 'VEGETABLE' | 'GRAIN' | 'SPICE' | 'OTHER';

export interface FoodConsumptionItem {
  id: string;
  ingredientName: string; // vd: Thịt nạc vai heo, Cá hồi fillet, Gạo thơm ST25
  category: IngredientCategory;
  unit: string; // kg, lít
  quotaPerPortionGrams: number; // Định mức chuẩn gram/suất ăn
  standardPlannedQtyKg: number; // Khối lượng định mức = (quota * tổng suất) / 1000
  actualConsumedQtyKg: number; // Thực tế xuất kho dùng
  variancePercentage: number; // Tỷ lệ chênh lệch (%)
  varianceExplanation?: string; // Giải trình bắt buộc nếu |variance| > 20%
}

export interface FoodConsumptionReport {
  date: string;
  mealHeadcountTotal: number;
  items: FoodConsumptionItem[];
  preparedBy: string;
  inspectedBy?: string;
  notes?: string;
  isSigned?: boolean;
}

// ==========================================
// SỔ KIỂM THỰC 3 BƯỚC & LƯU MẪU THỨC ĂN (QĐ 1246/QĐ-BYT)
// ==========================================

export type InspectionStep = 'STEP_1_RAW_MATERIALS' | 'STEP_2_PROCESSING' | 'STEP_3_TASTING_RETENTION';
export type SensoryEvaluationResult = 'PASSED' | 'FAILED';

export interface RawMaterialInspectionItem {
  id: string;
  ingredientName: string; // Tên thực phẩm
  quantityKg: number; // Số lượng (kg)
  supplierName: string; // Đơn vị cung cấp
  invoiceNumber: string; // Số hóa đơn / Giấy kiểm dịch
  sensoryEvaluation: SensoryEvaluationResult; // Đánh giá cảm quan: Đạt / Không đạt
  deliveryTemperatureCelsius: number; // Nhiệt độ giao hàng (< -18°C hoặc mát < 5°C)
  isFrozenOrChilled: boolean;
  isRejected: boolean; // Từ chối lô hàng (nếu không đạt)
  rejectionReason?: string; // Biên bản vi phạm nhà cung cấp
  invoicePhotoPath?: string;
}

export interface CookingTemperatureInspectionItem {
  id: string;
  dishName: string; // Tên món ăn
  coreTemperatureCelsius: number; // Nhiệt độ tâm món nấu chín (Bắt buộc > 75°C)
  cookingMethod: string; // Luộc, Xào, Kho, Hầm, Nướng
  isHygieneStandardPassed: boolean; // Đạt tiêu chuẩn vệ sinh
  notes?: string;
}

export interface FoodRetentionSampleDetailItem {
  id: string;
  dishName: string;
  sampleWeightGrams: number; // Khối lượng lưu (Bắt buộc >= 100g hoặc >= 150ml canh)
  sealCode: string; // Mã số tem niêm phong dùng 1 lần (vd: NP-20261010-01)
  storageTemperatureCelsius: number; // Nhiệt độ tủ bảo quản (2°C <= T <= 8°C)
  photoUrl?: string; // Ảnh hũ thủy tinh dán tem trong tủ lạnh
  sensoryEvaluation: SensoryEvaluationResult; // Đánh giá cảm quan trước khi ăn
  tastedBy: string; // Cán bộ nếm cảm quan
}

export interface ThreeStepFoodSafetyInspectionLog {
  id: string;
  inspectionDate: string; // YYYY-MM-DD
  step1Completed: boolean;
  step1Time: string; // "06:30 AM"
  step1ChefSignature?: string;
  rawMaterials: RawMaterialInspectionItem[];

  step2Completed: boolean;
  step2Time: string; // "10:30 AM"
  step2ChefSignature?: string;
  cookingTemperatures: CookingTemperatureInspectionItem[];
  hygieneChecklist: {
    protectiveClothing: boolean; // Trang phục bảo hộ (mũ, khẩu trang, tạp dề)
    separateCuttingBoards: boolean; // Dao thớt sống/chín tách biệt
    cleanWaterSource: boolean; // Nguồn nước sạch
  };

  step3Completed: boolean;
  step3Time: string; // "11:15 AM"
  step3ChefSignature?: string;
  step3PrincipalSignature?: string; // Ban Giám Hiệu ký kép (Bắt buộc)
  retentionSamples: FoodRetentionSampleDetailItem[];

  overallStatus: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED_INCIDENT';
  rejectionIncidentReported?: boolean;
  notes?: string;
}
