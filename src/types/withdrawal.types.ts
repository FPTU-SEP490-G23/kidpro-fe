import { GradeLevel } from './classAffairs.types';

export type Gender = 'MALE' | 'FEMALE';
export type WithdrawalStatus = 'PENDING' | 'ACCOUNTING_APPROVED' | 'COMPLETED' | 'CANCELLED';

export interface InvoiceSummary {
  invoiceId: string;
  invoiceCode: string;
  billingMonth: number;
  billingYear: number;
  finalAmount: number;
  dueDate: string;
  status: string;
}

export interface FinancialCheckResult {
  studentId: string;
  studentName: string;
  studentCode: string;
  hasOutstandingDebt: boolean;
  totalDebtAmount: number;
  unpaidInvoicesCount: number;
  overdueInvoicesCount: number;
  unpaidInvoices: InvoiceSummary[];
}

export interface WithdrawalRequestItem {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  classId?: string;
  className?: string;
  gradeLevel?: GradeLevel;
  destinationSchool: string;
  reason: string;
  expectedDate?: string;
  status: WithdrawalStatus;
  notes?: string;
  processedById?: string;
  processedByName?: string;
  completedAt?: string;
  createdAt: string;
  financialCheck?: FinancialCheckResult;
}

export interface CreateWithdrawalPayload {
  studentId: string;
  destinationSchool: string;
  reason: string;
  expectedDate?: string;
  notes?: string;
}

export interface DossierExportData {
  requestId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  dateOfBirth: string;
  gender: Gender;
  className: string;
  academicYear: string;
  destinationSchool: string;
  reason: string;
  handoverDate: string;
  processedByName: string;
  healthSummary: string;
  immunizationStatus: string;
  academicPerformanceSummary: string;
  financialObligationsSettled: boolean;
  handoverNote: string;
  generatedAt: string;
}
