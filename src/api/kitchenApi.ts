import axiosClient from './axiosClient';
import {
  KitchenDailySummary,
  WeeklyMenu,
  MealHeadcountSnapshot,
  LockHeadcountRequest,
  ExtendLockRequest,
  FoodSampleRetention,
  FoodSampleCreatePayload,
  FoodSampleDisposePayload,
  FoodConsumptionReport,
  DietaryPreparationUpdatePayload,
  ThreeStepFoodSafetyInspectionLog,
} from '../types/kitchen.types';

export const kitchenApi = {
  // ==========================================
  // UC-030: KHÓA SỐ SUẤT ĂN 08:30 AM
  // ==========================================
  // Lấy dữ liệu báo bếp tổng quan theo ngày
  getDailySummary: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return axiosClient.get<KitchenDailySummary>(`/kitchen/daily-summary${query}`);
  },

  // Lấy báo cáo tổng hợp snapshot suất ăn đã chốt (Cơm thường, Cháo, Tránh dị ứng)
  getMealHeadcounts: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return axiosClient.get<MealHeadcountSnapshot>(`/kitchen/meal-headcounts${query}`);
  },

  // Kích hoạt lệnh chốt đóng băng suất ăn thủ công ngay lập tức
  lockMealHeadcounts: (payload?: LockHeadcountRequest) => {
    return axiosClient.post<MealHeadcountSnapshot>('/kitchen/meal-headcounts/lock', payload || {});
  },

  // Gia hạn thời gian khóa sổ báo ăn khẩn cấp (Chỉ quyền BGH)
  extendLockMealHeadcounts: (payload: ExtendLockRequest) => {
    return axiosClient.post<MealHeadcountSnapshot>('/kitchen/meal-headcounts/extend', payload);
  },

  // ==========================================
  // UC-031: QUẢN LÝ DỊ ỨNG & CHẾ ĐỘ ĂN RIÊNG
  // ==========================================
  // Lấy danh sách học sinh có thẻ cảnh báo dị ứng thực phẩm kèm thông tin lớp
  getStudentsByAllergy: () => {
    return axiosClient.get<any[]>('/academic/students/by-allergy');
  },

  // Cập nhật trạng thái chuẩn bị suất ăn dị ứng cách ly & in nhãn
  updateDietaryPreparation: (payload: DietaryPreparationUpdatePayload) => {
    return axiosClient.put('/kitchen/special-diets', payload);
  },

  // ==========================================
  // UC-029: THỰC ĐƠN TUẦN BÁN TRÚ
  // ==========================================
  getWeeklyMenus: (weekStartDate?: string, dayOfWeek?: number) => {
    const params: Record<string, string | number> = {};
    if (weekStartDate) params.weekStartDate = weekStartDate;
    if (dayOfWeek) params.dayOfWeek = dayOfWeek;
    return axiosClient.get<WeeklyMenu[]>('/kitchen/menus', { params });
  },

  createWeeklyMenu: (data: WeeklyMenu) => {
    return axiosClient.post<WeeklyMenu>('/kitchen/menus', data);
  },

  updateWeeklyMenu: (id: string, data: Partial<WeeklyMenu>) => {
    return axiosClient.put<WeeklyMenu>(`/kitchen/menus/${id}`, data);
  },

  deleteWeeklyMenu: (id: string) => {
    return axiosClient.delete(`/kitchen/menus/${id}`);
  },

  saveWeeklyMenuPlan: (data: any) => {
    return axiosClient.post('/kitchen/menus', data);
  },

  // ==========================================
  // UC-032: TIÊU HAO THỰC PHẨM & LƯU MẪU 24H
  // ==========================================
  // Ghi nhật ký lưu mẫu thức ăn từng bữa kèm ảnh chụp và nhiệt độ tủ bảo quản
  createFoodSample: (data: FoodSampleCreatePayload) => {
    return axiosClient.post<FoodSampleRetention>('/kitchen/food-samples', data);
  },

  // Xác nhận hủy mẫu thực phẩm an toàn sau khi đã lưu đủ 24 giờ
  disposeFoodSample: (id: string, data: FoodSampleDisposePayload) => {
    return axiosClient.put<FoodSampleRetention>(`/kitchen/food-samples/${id}/dispose`, data);
  },

  // Lấy danh sách các mẫu thức ăn đã vượt quá 24h nhưng chưa thực hiện thủ tục hủy
  getOverdueFoodSamples: () => {
    return axiosClient.get<FoodSampleRetention[]>('/kitchen/food-samples/overdue');
  },

  // Lấy danh sách mẫu thức ăn đang lưu trong tủ theo ngày
  getFoodSamples: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return axiosClient.get<FoodSampleRetention[]>(`/kitchen/food-samples${query}`);
  },

  // Lưu báo cáo tiêu hao nguyên liệu & kiểm thực
  saveFoodConsumptionReport: (data: FoodConsumptionReport) => {
    return axiosClient.post<FoodConsumptionReport>('/kitchen/consumption-report', data);
  },

  // ==========================================
  // UC-055: SỔ KIỂM THỰC 3 BƯỚC & LƯU MẪU THỨC ĂN (QĐ 1246/QĐ-BYT)
  // ==========================================
  getThreeStepInspectionLog: (date: string) => {
    return axiosClient.get<ThreeStepFoodSafetyInspectionLog>('/kitchen/inspection-logs', { params: { date } });
  },

  saveThreeStepInspectionLog: (data: ThreeStepFoodSafetyInspectionLog) => {
    return axiosClient.post<ThreeStepFoodSafetyInspectionLog>('/kitchen/inspection-logs', data);
  },

  exportInspectionReportPdf: (date: string) => {
    return axiosClient.get(`/kitchen/inspection-logs/export-pdf?date=${date}`, { responseType: 'blob' });
  },
};

export default kitchenApi;
