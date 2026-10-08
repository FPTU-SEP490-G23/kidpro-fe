export type FeeType = 'MONTHLY_FIXED' | 'PER_ATTENDANCE_DAY' | 'ONE_TIME';
export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface FeeConfig {
  id: string;
  name: string;
  type: FeeType;
  amount: number;
  isRefundableOnAbsence?: boolean;
  appliesToAgeGroup?: string;
  dailyRefundRate?: number;
  description?: string;
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  monthYear: string; // MM-yyyy
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  createdAt?: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  applicableFeeType?: string;
  description?: string;
  isActive?: boolean;
}

export interface LatePickupFeeRule {
  id: string;
  feeConfigId?: string;
  feeConfigName?: string;
  minMinutes: number;
  maxMinutes: number;
  penaltyAmount: number;
  description?: string;
}
