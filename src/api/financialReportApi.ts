import axiosClient from './axiosClient';

export interface OverdueDebtDto {
  invoiceId: string;
  invoiceCode: string;
  studentId: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  overdueAmount: number;
  daysOverdue: number;
  debtLevel: 'MILD' | 'WARNING_1' | 'WARNING_2';
  dueDate: string;
  lastReminderDate?: string;
}

export interface RevenueReportDto {
  month: number;
  year: number;
  totalReceivable: number;
  totalCollected: number;
  totalOverdue: number;
  completionRate: number;
  totalOverdueCount: number;
  overdueDebts: OverdueDebtDto[];
}

export const financialReportApi = {
  getRevenueReport: async (params?: { month?: number; year?: number }) => {
    return axiosClient.get<RevenueReportDto>('/bgh/finance/revenue-report', { params });
  },

  getOverdueDebts: async (params?: { month?: number; year?: number }) => {
    return axiosClient.get<OverdueDebtDto[]>('/bgh/finance/revenue-report/overdue-debts', { params });
  },

  sendReminders: async (invoiceIds: string[], customMessage?: string) => {
    return axiosClient.post<{ success: boolean; sentCount: number; skippedCount: number; message: string }>(
      '/bgh/finance/revenue-report/send-reminders',
      { invoiceIds, customMessage }
    );
  },
};

export default financialReportApi;
