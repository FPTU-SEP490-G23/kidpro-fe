import axiosClient from './axiosClient';
import {
  FeeConfig,
  Invoice,
  DiscountRule,
  LatePickupFeeRule,
  FeeType,
} from '../types/finance.types';

export const financeApi = {
  // 1. Cấu hình biểu phí (/api/admin/fee-configs)
  getFeeConfigs: (type?: FeeType) => {
    return axiosClient.get<FeeConfig[]>('/admin/fee-configs', { params: { type } });
  },

  createFeeConfig: (data: Partial<FeeConfig>) => {
    return axiosClient.post<FeeConfig>('/admin/fee-configs', data);
  },

  updateFeeConfig: (id: string, data: Partial<FeeConfig>) => {
    return axiosClient.put<FeeConfig>(`/admin/fee-configs/${id}`, data);
  },

  deleteFeeConfig: (id: string) => {
    return axiosClient.delete(`/admin/fee-configs/${id}`);
  },

  // 2. Quy tắc giảm trừ (/api/admin/discount-rules)
  getDiscountRules: (isActive?: boolean) => {
    return axiosClient.get<DiscountRule[]>('/admin/discount-rules', { params: { isActive } });
  },

  createDiscountRule: (data: Partial<DiscountRule>) => {
    return axiosClient.post<DiscountRule>('/admin/discount-rules', data);
  },

  updateDiscountRule: (id: string, data: Partial<DiscountRule>) => {
    return axiosClient.put<DiscountRule>(`/admin/discount-rules/${id}`, data);
  },

  deleteDiscountRule: (id: string) => {
    return axiosClient.delete(`/admin/discount-rules/${id}`);
  },

  // 3. Quy tắc phạt đón muộn (/api/admin/late-pickup-rules)
  getLatePickupRules: (feeConfigId?: string) => {
    return axiosClient.get<LatePickupFeeRule[]>('/admin/late-pickup-rules', { params: { feeConfigId } });
  },

  createLatePickupRule: (data: Partial<LatePickupFeeRule>) => {
    return axiosClient.post<LatePickupFeeRule>('/admin/late-pickup-rules', data);
  },

  updateLatePickupRule: (id: string, data: Partial<LatePickupFeeRule>) => {
    return axiosClient.put<LatePickupFeeRule>(`/admin/late-pickup-rules/${id}`, data);
  },

  deleteLatePickupRule: (id: string) => {
    return axiosClient.delete(`/admin/late-pickup-rules/${id}`);
  },

  // 4. Hóa đơn & Quyết toán
  getInvoicesByMonth: (monthYear: string) => {
    return axiosClient.get<Invoice[]>(`/payments/invoices?monthYear=${monthYear}`);
  },

  generateMonthlyInvoices: (monthYear: string) => {
    return axiosClient.post<Invoice[]>(`/payments/generate-invoices?monthYear=${monthYear}`);
  },

  getStudentInvoices: (studentId: string) => {
    return axiosClient.get<Invoice[]>(`/parents/invoices?studentId=${studentId}`);
  },
};

export default financeApi;
