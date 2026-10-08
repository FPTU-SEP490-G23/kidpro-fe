import axiosClient from './axiosClient';
import { KitchenDailySummary, WeeklyMenu } from '../types/kitchen.types';

export const kitchenApi = {
  // Lấy dữ liệu suất ăn báo bếp trong ngày (Đóng băng mốc 08:30 AM)
  getDailySummary: (date?: string) => {
    const query = date ? `?date=${date}` : '';
    return axiosClient.get<KitchenDailySummary>(`/kitchen/daily-summary${query}`);
  },

  // Thực đơn tuần (/api/kitchen/menus)
  getWeeklyMenus: (weekStartDate?: string, dayOfWeek?: number) => {
    const params: any = {};
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
};

export default kitchenApi;
