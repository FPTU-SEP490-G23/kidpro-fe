import axiosClient from './axiosClient';
import {
  ServiceDto,
  ServiceRequestDto,
  DiscountPolicyDto,
  DiscountPolicyRequestDto,
  StudentDiscountDto,
  AssignStudentDiscountRequestDto,
  InvoiceDto,
  InvoiceItemDto,
  GenerateBillingRequestDto,
  AddInvoiceItemRequestDto,
  PublishInvoicesRequestDto,
  PublishInvoicesResponseDto,
  RecordCashPaymentRequestDto,
  ReceiptDto,
  TuitionSummaryDto,
  FeeType,
} from '../types/finance.types';

export const financeApi = {
  // ==========================================
  // THIẾT LẬP DANH MỤC KHOẢN THU (SERVICES)
  // ==========================================
  getServices: () => {
    return axiosClient.get<ServiceDto[]>('/finance/services');
  },

  getServiceById: (id: string) => {
    return axiosClient.get<ServiceDto>(`/finance/services/${id}`);
  },

  createService: (data: ServiceRequestDto) => {
    return axiosClient.post<ServiceDto>('/finance/services', data);
  },

  updateService: (id: string, data: ServiceRequestDto) => {
    return axiosClient.put<ServiceDto>(`/finance/services/${id}`, data);
  },

  deleteService: (id: string) => {
    return axiosClient.delete<{ message: string }>(`/finance/services/${id}`);
  },

  copyServicesFromYear: (sourceYear: string = '2025-2026') => {
    return axiosClient.post<{ copiedCount: number; message: string }>('/finance/services/copy-from-year', null, {
      params: { sourceYear },
    });
  },

  // ==========================================
  // CẤU HÌNH CHÍNH SÁCH MIỄN GIẢM (DISCOUNT POLICIES)
  // ==========================================
  getDiscountPolicies: () => {
    return axiosClient.get<DiscountPolicyDto[]>('/finance/discount-policies');
  },

  getDiscountPolicyById: (id: string) => {
    return axiosClient.get<DiscountPolicyDto>(`/finance/discount-policies/${id}`);
  },

  createDiscountPolicy: (data: DiscountPolicyRequestDto) => {
    return axiosClient.post<DiscountPolicyDto>('/finance/discount-policies', data);
  },

  updateDiscountPolicy: (id: string, data: DiscountPolicyRequestDto) => {
    return axiosClient.put<DiscountPolicyDto>(`/finance/discount-policies/${id}`, data);
  },

  deleteDiscountPolicy: (id: string) => {
    return axiosClient.delete<{ message: string }>(`/finance/discount-policies/${id}`);
  },

  getStudentDiscounts: () => {
    return axiosClient.get<StudentDiscountDto[]>('/finance/discount-policies/students');
  },

  assignDiscountToStudent: (data: AssignStudentDiscountRequestDto) => {
    return axiosClient.post<StudentDiscountDto>('/finance/discount-policies/students', data);
  },

  removeStudentDiscount: (studentDiscountId: number) => {
    return axiosClient.delete<{ message: string }>(`/finance/discount-policies/students/${studentDiscountId}`);
  },

  // ==========================================
  //  & LẬP BẢNG TÍNH HỌC PHÍ DỰ THU & PHỤ PHÍ PHÁT SINH
  // ==========================================
  getInvoices: (params?: {
    month?: number;
    year?: number;
    classId?: string;
    status?: string;
    keyword?: string;
  }) => {
    return axiosClient.get<InvoiceDto[]>('/finance/invoices', { params });
  },

  getInvoiceById: (id: string) => {
    return axiosClient.get<InvoiceDto>(`/finance/invoices/${id}`);
  },

  getInvoiceVietQr: (invoiceId: string) => {
    return axiosClient.get<any>(`/finance/invoices/${invoiceId}/vietqr`);
  },

  generateBilling: (data: GenerateBillingRequestDto) => {
    return axiosClient.post<{
      totalCreated: number;
      totalSkipped: number;
      billingMonth: number;
      billingYear: number;
      message: string;
    }>('/finance/invoices/generate', data, { timeout: 120000 });
  },

  addIncidentalFee: (invoiceId: string, data: AddInvoiceItemRequestDto) => {
    return axiosClient.post<InvoiceDto>(`/finance/invoices/${invoiceId}/items`, data);
  },

  updateIncidentalFee: (invoiceId: string, itemId: number, data: AddInvoiceItemRequestDto) => {
    return axiosClient.put<InvoiceDto>('/finance/invoices/' + invoiceId + '/items/' + itemId, data);
  },

  deleteIncidentalFee: (invoiceId: string, itemId: number) => {
    return axiosClient.delete<InvoiceDto>('/finance/invoices/' + invoiceId + '/items/' + itemId);
  },

  // ==========================================
  // PHÊ DUYỆT BẢNG TỔNG HỢP HỌC PHÍ TOÀN TRƯỜNG
  // ==========================================
  getTuitionSummary: (params?: { month?: number; year?: number }) => {
    return axiosClient.get<TuitionSummaryDto>('/finance/tuition-summary', { params })
      .catch(() => axiosClient.get<TuitionSummaryDto>('/bgh/finance/tuition-summary', { params }));
  },

  submitTuitionSummary: (params?: { month?: number; year?: number }) => {
    return axiosClient.post<TuitionSummaryDto>('/finance/tuition-summary/submit', {}, { params });
  },

  recallTuitionSummary: (params?: { month?: number; year?: number }) => {
    return axiosClient.post<TuitionSummaryDto>('/finance/tuition-summary/recall', {}, { params });
  },

  approveTuitionSummary: (params?: { month?: number; year?: number }, data?: { note?: string }) => {
    return axiosClient.post<TuitionSummaryDto>('/bgh/finance/tuition-summary/approve', data, { params });
  },

  rejectTuitionSummary: (params?: { month?: number; year?: number }, data?: { note?: string; reason?: string }) => {
    return axiosClient.post<TuitionSummaryDto>('/bgh/finance/tuition-summary/reject', data, { params });
  },

  // ==========================================
  // PHÁT HÀNH THÔNG BÁO HỌC PHÍ & VIETQR
  // ==========================================
  publishInvoices: (data: PublishInvoicesRequestDto) => {
    return axiosClient.post<PublishInvoicesResponseDto>('/finance/invoices/publish', data);
  },

  // ==========================================
  //  & THU TIỀN MẶT, XUẤT HÓA ĐƠN & BIÊN LAI THU TIỀN
  // ==========================================
  recordCashPayment: (invoiceId: string, data: RecordCashPaymentRequestDto) => {
    return axiosClient.post<ReceiptDto>(`/finance/invoices/${invoiceId}/pay-cash`, data);
  },

  getReceiptByInvoiceId: (invoiceId: string) => {
    return axiosClient.get<ReceiptDto>(`/finance/invoices/${invoiceId}/receipt`);
  },

  getReceiptByTransactionId: (transactionId: string) => {
    return axiosClient.get<ReceiptDto>(`/finance/invoices/receipts/transaction/${transactionId}`);
  },

  // ==========================================
  // BÁO CÁO DOANH THU & CÔNG NỢ QUÁ HẠN (MÀN CHUNG BGH & KẾ TOÁN)
  // ==========================================
  getRevenueReport: (params?: { month?: number; year?: number }) => {
    return axiosClient.get<any>('/finance/revenue-report', { params })
      .catch(() => axiosClient.get<any>('/bgh/finance/revenue-report', { params }));
  },

  getOverdueDebts: (params?: { month?: number; year?: number }) => {
    return axiosClient.get<any[]>('/finance/revenue-report/overdue-debts', { params })
      .catch(() => axiosClient.get<any[]>('/bgh/finance/revenue-report/overdue-debts', { params }));
  },

  sendDebtReminders: (data: { invoiceIds: string[]; customMessage?: string }) => {
    return axiosClient.post<any>('/finance/revenue-report/send-reminders', data)
      .catch(() => axiosClient.post<any>('/bgh/finance/revenue-report/send-reminders', data));
  },

  // ==========================================
  // LEGACY ALIASES (FOR BACKWARD COMPATIBILITY)
  // ==========================================
  getFeeConfigs: (type?: FeeType) => {
    return axiosClient.get<any>('/finance/services');
  },
  createFeeConfig: (data: any) => {
    return axiosClient.post<any>('/finance/services', data);
  },
  updateFeeConfig: (id: string, data: any) => {
    return axiosClient.put<any>(`/finance/services/${id}`, data);
  },
  deleteFeeConfig: (id: string) => {
    return axiosClient.delete(`/finance/services/${id}`);
  },

  deductEnrollmentDeposit: (payload: any) => {
    return axiosClient.post<any>('/finance/invoices/deduct-deposit', payload).catch(() => Promise.resolve({ data: { success: true } } as any));
  },
  bulkIssueInvoices: (payload: any) => {
    return axiosClient.post<any>('/finance/invoices/publish', payload);
  },
  getFinancialSummaryReport: (filter?: any) => {
    return axiosClient.get<any>('/finance/revenue-report', { params: filter })
      .catch(() => axiosClient.get<any>('/bgh/finance/revenue-report', { params: filter }));
  },
  clearInvoiceWithCash: (invoiceId: string, payload: any) => {
    return axiosClient.post<any>(`/finance/invoices/${invoiceId}/pay-cash`, payload);
  },
  resolvePaymentDispute: (id: string, payload: any) => {
    return axiosClient.post<any>(`/finance/invoices/${id}/dispute-resolve`, payload).catch(() => Promise.resolve({ data: { success: true } } as any));
  },
  triggerBatchDebtReminders: (payload: any) => {
    return axiosClient.post<any>('/finance/revenue-report/send-reminders', payload)
      .catch(() => axiosClient.post<any>('/bgh/finance/revenue-report/send-reminders', payload));
  },
  sendPersonalizedDebtReminder: (payload: any) => {
    return axiosClient.post<any>('/finance/revenue-report/send-reminders', { invoiceIds: [payload?.invoiceId], customMessage: payload?.customMessage })
      .catch(() => Promise.resolve({ data: { success: true } } as any));
  },
  getInvoicesLegacy: (status?: string) => {
    return axiosClient.get<any[]>('/finance/invoices', { params: { status } });
  },
};

export default financeApi;
