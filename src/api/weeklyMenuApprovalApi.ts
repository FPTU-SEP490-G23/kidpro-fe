import axiosClient from './axiosClient';

export interface MenuItemDto {
  itemId: number;
  dayOfWeek: string;
  mealType: string;
  dishName: string;
  calories: number;
}

export interface WeeklyMenuApprovalDto {
  menuId: number;
  academicYearId: string;
  academicYearName: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  totalCalories: number;
  dailyAverageCalories?: number;
  weeklyTotalCalories?: number;
  nutrientRatio: string;
  rejectionReason?: string;
  message?: string;
  items: MenuItemDto[];
}

export const weeklyMenuApprovalApi = {
  getMenus: async (params?: { status?: string; weekNumber?: number }) => {
    return axiosClient.get<WeeklyMenuApprovalDto[]>('/bgh/menus/approvals', { params });
  },

  getMenuDetail: async (menuId: number) => {
    return axiosClient.get<WeeklyMenuApprovalDto>(`/bgh/menus/approvals/${menuId}`);
  },

  approveMenu: async (menuId: number, note?: string) => {
    return axiosClient.post<WeeklyMenuApprovalDto>(`/bgh/menus/approvals/${menuId}/approve`, { note });
  },

  rejectMenu: async (menuId: number, reason: string) => {
    return axiosClient.post<WeeklyMenuApprovalDto>(`/bgh/menus/approvals/${menuId}/reject`, { reason });
  },

  resetPendingMenu: async (menuId: number) => {
    return axiosClient.post<WeeklyMenuApprovalDto>(`/bgh/menus/approvals/${menuId}/reset-pending`);
  },
};

export default weeklyMenuApprovalApi;
