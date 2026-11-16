export type FeeType = 'MONTHLY_FIXED' | 'PER_ATTENDANCE_DAY' | 'ONE_TIME';
export type InvoiceStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type FeeCycle = 'MONTHLY' | 'YEARLY' | 'DAILY';
export type FeeStatus = 'ACTIVE' | 'INACTIVE';
export type FeeNature = 'FIXED' | 'DAILY_VARIABLE' | 'SURCHARGE';
export type AgeGroupFilter = 'ALL' | 'NURSERY' | 'KINDERGARTEN' | 'PRE_K';

// ==========================================
// CẤU HÌNH DANH MỤC KHOẢN THU (FEE CONFIG)
// ==========================================
export interface FeeConfig {
  id: string;
  feeCode: string; // Mã khoản thu viết hoa không dấu (vd: TUITION_FEE, MEAL_FEE)
  name: string; // Tên khoản thu tiếng Việt
  type: FeeType;
  amount: number; // Đơn giá định mức (VNĐ)
  cycle: FeeCycle; // MONTHLY, YEARLY, DAILY
  feeNature: FeeNature; // FIXED (Cố định), DAILY_VARIABLE (Biến đổi theo ngày), SURCHARGE (Phụ thu)
  appliesToAgeGroup: string; // Khối Nhà trẻ (NURSERY), Khối Mẫu giáo (KINDERGARTEN, PRE_K) hoặc Toàn trường (ALL)
  isMandatory?: boolean; // Khoản thu bắt buộc hay Dịch vụ tự nguyện
  isRefundableOnAbsence?: boolean; // Có được hoàn tiền khi nghỉ phép hay không
  dailyRefundRate?: number; // Đơn giá hoàn tiền ăn theo ngày
  status: FeeStatus; // ACTIVE | INACTIVE
  hasTransactions?: boolean; // Đã phát sinh giao dịch thanh toán (Cấm Hard Delete theo quy định)
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFeeConfigPayload {
  feeCode: string;
  name: string;
  type: FeeType;
  amount: number;
  cycle: FeeCycle;
  feeNature: FeeNature;
  appliesToAgeGroup: string;
  isMandatory: boolean;
  isRefundableOnAbsence: boolean;
  dailyRefundRate?: number;
  description?: string;
}

// ==========================================
// CHÍNH SÁCH ĐƠN GIÁ HOÀN TIỀN ĂN (MEAL REFUND)
// ==========================================
export interface MealRefundPolicy {
  feeConfigId: string;
  monthlyMealFeeAmount: number; // Mức thu tiền ăn tháng (vd: 770.000 VNĐ / 22 ngày)
  calculatedDailyChargedRate: number; // 35.000 VNĐ / ngày thu thực tế
  dailyRefundRate: number; // Đơn giá hoàn trả 1 ngày vắng có phép (vd: 35.000 VNĐ)
  cutoffTime: string; // Mốc giờ nộp đơn muộn nhất: "08:30:00"
  effectiveMonth: string; // Kỳ áp dụng chính sách (vd: "2026-10")
  policyNotes?: string;
  requiresPrincipalApproval: boolean;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  isClosedForRetroactiveChanges?: boolean; // Không thể thay đổi hồi tố kỳ đã đóng sổ
}

export interface MealRefundAuditLog {
  id: string;
  changedAt: string;
  changedBy: string;
  oldRate: number;
  newRate: number;
  effectivePeriod: string;
  reason: string;
}

// ==========================================
// ĐỘNG CƠ QUYẾT TOÁN HỌC PHÍ ĐỘNG (BILLING ENGINE)
// ==========================================
export type DynamicInvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

export interface DynamicInvoice {
  id: string;
  invoiceNumber: string; // Mã hóa đơn (vd: INV-202610-001)
  studentId: string;
  studentName: string;
  className: string;
  billingPeriod: string; // MM-YYYY (vd: 10-2026)
  baseTuition: number; // Học phí cơ bản
  serviceFees: number; // Phí dịch vụ / Ngoại khóa
  excusedDaysCount: number; // Số ngày nghỉ hợp lệ có phép nộp trước 08:30
  dailyRefundRate: number; // Đơn giá hoàn tiền ăn áp dụng
  mealRefundTotal: number; // Tiền ăn hoàn trả (-VNĐ)
  lateMinutesCount: number; // Số phút đón muộn tích lũy
  latePickupFeeTotal: number; // Phụ phí đón muộn (+VNĐ)
  siblingDiscountAmount: number; // Chiết khấu anh chị em (-VNĐ)
  otherDiscountAmount: number; // Giảm trừ chính sách khác
  surplusCarriedForward: number; // Số tiền dư kỳ trước kết chuyển sang
  netPayableAmount: number; // Tổng thực nộp (VNĐ)
  paymentReferenceCode: string; // Mã VietQR định danh duy nhất (vd: INV202610A7B9C1)
  vietQrUrl?: string;
  status: DynamicInvoiceStatus;
  isNegativeBalance?: boolean; // Dư nợ âm -> bảo lưu sang kỳ tiếp theo
  reservedCreditAmount?: number;
  dueDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PreflightCheckStatus {
  attendanceFinalized: boolean; // 100% lớp đã chốt sổ điểm danh
  pendingClassesCount: number;
  mealHeadcountLocked: boolean; // Suất ăn đã khóa số
  feePolicyActive: boolean; // Biểu phí đã ban hành
  dailyRefundRateSet: boolean; // Đơn giá hoàn tiền ăn đã cấu hình
  paymentGatewayReady: boolean; // Cổng VietQR sẵn sàng
  totalActiveStudents: number; // Sĩ số học sinh dự kiến quyết toán
}

export interface GenerateBillingPayload {
  billingPeriod: string; // MM-YYYY
  applyLatePickupFees: boolean;
  applySiblingDiscounts: boolean;
  dueDate: string;
}

// ==========================================
// CÁC ĐỊNH NGHĨA KHÁC (HỌC BỔNG, ĐÓN MUỘN)
// ==========================================
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

// ==========================================
// KIỂM TOÁN HOÀN TIỀN ĂN NGHỈ PHÉP (MEAL REFUND AUDIT)
// ==========================================
export interface AbsenceDetailItem {
  id: string;
  date: string; // YYYY-MM-DD
  leaveRequestTime?: string; // vd: "07:15:00" | "08:45:00"
  isBeforeCutoff: boolean; // Nộp trước 08:30 AM
  gateCameraVerified: boolean; // Xác nhận bé không xuất hiện tại cổng
  teacherReportedAbsent: boolean; // Giáo viên đã chấm vắng mặt
  kitchenExcluded: boolean; // Không nhận suất ăn bếp chế biến
  isCampusClosedEvent?: boolean; // Nghỉ toàn trường (bão lũ, lễ tết) -> hoàn 100%
  status: 'ELIGIBLE' | 'LATE_SUBMISSION' | 'UNEXCUSED' | 'ATTENDED_DISQUALIFIED';
  refundAmount: number; // 35.000 VNĐ nếu ELIGIBLE, 0 nếu không
  manualOverride?: boolean; // Đã điều chỉnh ngoại lệ thủ công bởi kế toán
  overrideReason?: string;
}

export interface MealRefundAuditRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  classId: string;
  billingPeriod: string; // MM-YYYY
  totalAbsentDays: number;
  eligibleDays: number; // Nộp đơn trước 08:30:00
  ineligibleDays: number; // Sau 08:30 hoặc không phép
  dailyRefundRate: number; // 35.000 VNĐ
  totalRefundAmount: number; // eligibleDays * dailyRefundRate
  auditStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED';
  absenceDetails: AbsenceDetailItem[];
}

export interface MealRefundAuditSummary {
  billingPeriod: string;
  totalEligibleDays: number;
  totalRefundAmount: number;
  totalAbsentStudents: number;
  totalIneligibleDays: number;
  campusWideClosureDays: number;
}

// ==========================================
// DUYỆT & PHÁT HÀNH HÓA ĐƠN HÀNG LOẠT (BULK ISSUANCE)
// ==========================================
export interface BulkIssuancePayload {
  invoiceIds: string[];
  dueDate: string; // YYYY-MM-DD
  billingPeriod: string;
  principalPin?: string;
  sendFcmNotification: boolean;
  createPaperNoticesForOffline: boolean;
}

export interface BulkIssuanceResult {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  queuedForQrCount: number;
  paperNoticeCount: number;
  issuedInvoices: DynamicInvoice[];
}

export interface VietQrInvoiceData {
  invoiceId: string;
  invoiceNumber: string;
  paymentReferenceCode: string;
  qrCodeUrl: string;
  deepLink?: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
}

// ==========================================
// GẠCH NỢ THỦ CÔNG & THU TIỀN MẶT (CASH COLLECTION)
// ==========================================
export type PaymentMethod = 'CASH' | 'POS';

export interface CashPaymentPayload {
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber?: string;
  paymentDate: string; // YYYY-MM-DD
  cashierId: string;
  cashierName: string;
  usePrepaidCredit?: boolean;
}

export interface CashPaymentReceipt {
  receiptId: string;
  receiptNumber: string; // REC-2026-XXXXX
  invoiceId: string;
  invoiceNumber: string;
  paymentReferenceCode: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  payerName: string;
  payerPhone?: string;
  amountPaid: number;
  originalDebt: number;
  remainingDebt: number;
  excessAmount: number; // Tiền thừa kết chuyển đặt cọc
  paymentMethod: PaymentMethod;
  paymentDate: string;
  cashierId: string;
  cashierName: string;
  notes?: string;
  schoolName: string;
  schoolTaxCode: string;
  schoolAddress: string;
}

export interface CashAuditLog {
  id: string;
  auditDate: string;
  cashierId: string;
  cashierName: string;
  systemRecordedAmount: number;
  actualCountedAmount: number;
  discrepancy: number; // actual - system
  status: 'BALANCED' | 'DISCREPANCY_FLAGGED';
  notes?: string;
  createdAt: string;
}

// ==========================================
// ĐỐI SOÁT WEBHOOK VIETQR GẠCH NỢ TỰ ĐỘNG
// ==========================================
export type WebhookReconciliationStatus =
  | 'MATCHED_PAID'
  | 'PARTIAL_PAID'
  | 'MISMATCH_DISPUTED'
  | 'DUPLICATE_SKIPPED';

export interface WebhookTransactionLog {
  id: string;
  bankTransId: string; // Mã giao dịch ngân hàng / SePay (vd: TID-88992211)
  paymentReferenceCode: string; // Mã nội dung chuyển khoản (vd: INV202610A7B9C1)
  invoiceId?: string;
  studentName?: string;
  className?: string;
  transAmount: number; // Số tiền phụ huynh chuyển khoản (VNĐ)
  invoiceAmount: number; // Số tiền thực nộp theo bảng kê
  reconcileStatus: WebhookReconciliationStatus;
  hmacSignatureValid: boolean; // Kết quả xác thực chữ ký HMAC-SHA256
  httpResponseCode: number; // 200 OK
  processingTimeMs: number; // Tốc độ xử lý (< 2s, vd: 420ms)
  rawPayload: Record<string, any>; // JSONB nguyên trạng từ ngân hàng
  receivedAt: string; // ISO Timestamp
  discrepancyType?: 'NONE' | 'OVERPAID' | 'UNDERPAID' | 'WRONG_REFERENCE';
  resolvedNote?: string;
}

export interface WebhookGatewayStats {
  endpoint: string;
  gatewayStatus: 'ONLINE' | 'OFFLINE';
  totalReceivedToday: number;
  autoClearedCount: number;
  disputedCount: number;
  duplicateSkippedCount: number;
  averageLatencyMs: number;
}

// ==========================================
// TỰ ĐỘNG KHẤU TRỪ TIỀN CỌC NHẬP HỌC (ENROLLMENT DEPOSIT DEDUCTION)
// ==========================================

export type DepositStatus =
  | 'ACTIVE_UNCLAIMED' // Chưa khấu trừ (Sẵn sàng giảm trừ vào hóa đơn tháng đầu)
  | 'FULLY_DEDUCTED' // Đã khấu trừ toàn bộ
  | 'PARTIALLY_DEDUCTED' // Khấu trừ một phần (còn số dư bảo lưu)
  | 'REFUNDED'; // Đã hoàn trả lại cho phụ huynh

export interface StudentEnrollmentDeposit {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  academicYear: string;
  depositAmount: number; // vd: 2.000.000 VNĐ hoặc 3.000.000 VNĐ
  deductedAmount: number; // Số tiền đã khấu trừ
  remainingBalance: number; // Số dư cọc còn lại
  receiptNumber: string; // Mã phiếu thu (vd: DEP2026-001)
  paidDate: string; // Ngày nộp tiền cọc
  status: DepositStatus;
  linkedInvoiceId?: string; // Mã hóa đơn học phí đã liên kết
  linkedInvoiceNumber?: string;
  campusId: string; // Phân vùng chi nhánh trường
  campusName: string;
  notes?: string;
}

export interface FirstMonthInvoiceBreakdown {
  studentId: string;
  studentName: string;
  className: string;
  billingMonth: string;
  baseTuition: number; // Học phí cơ bản (+ 3.500.000 VNĐ)
  mealFee: number; // Tiền ăn bán trú (+ 770.000 VNĐ)
  facilityFee: number; // Tiền cơ sở vật chất đầu năm (+ 1.200.000 VNĐ)
  depositDeductionAmount: number; // Dòng giảm trừ cọc (- 2.000.000 VNĐ)
  depositReceiptRef: string; // Mô tả phiếu thu cọc
  netPayableAmount: number; // Tổng thực nộp (3.470.000 VNĐ)
  depositSurplusCarriedForward?: number; // Số dư cọc bảo lưu sang tháng 2 (nếu cọc > học phí)
}

export interface DeductDepositPayload {
  depositId: string;
  invoiceId: string;
  amountToDeduct: number;
  notes?: string;
}

// ==========================================
// THÔNG BÁO TỰ ĐỘNG NHẮC NỢ QUÁ HẠN (OVERDUE DEBT REMINDER ENGINE)
// ==========================================

export type AgingDebtBucket =
  | 'DAYS_1_3' // Quá hạn 1-3 ngày: Nhắc nhở nhẹ nhàng (FCM Push)
  | 'DAYS_4_10' // Quá hạn 4-10 ngày: Thông báo chính thức (FCM + SMS)
  | 'DAYS_OVER_10'; // Quá hạn > 10 ngày: Cảnh báo tạm dừng dịch vụ (Phiếu BGH gọi trực tiếp)

export type ReminderChannel = 'FCM' | 'SMS' | 'EMAIL';

export interface OverdueInvoiceItem {
  id: string;
  invoiceNumber: string; // Mã hóa đơn
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  teacherName: string;
  totalDebtAmount: number; // Số tiền còn nợ (VNĐ)
  overdueDays: number; // Số ngày quá hạn
  dueDate: string; // Ngày hết hạn nộp
  agingBucket: AgingDebtBucket;
  lastReminderChannel?: ReminderChannel;
  lastReminderAt?: string;
  reminderCount: number;
  disputeStatus: 'NONE' | 'DISPUTED'; // Hóa đơn đang có phiếu khiếu nại
  vietQrUrl: string; // Link VietQR 1-Chạm
  fallbackTeacherNoticeCreated?: boolean; // Phiếu nhắc trực tiếp giáo viên khi SMS lỗi
}

export interface BatchDebtReminderPayload {
  agingBucket?: AgingDebtBucket;
  channels: ReminderChannel[];
  excludeDisputed: boolean; // Tự động bỏ qua hóa đơn có khiếu nại
  scheduledTime?: string; // Mặc định 09:00 AM
}

export interface PersonalizedReminderPayload {
  invoiceId: string;
  templateType: 'POLITE' | 'SECOND_NOTICE' | 'URGENT_WARNING';
  customMessage: string;
  channel: 'FCM' | 'SMS';
}

export interface BatchReminderResult {
  totalEligible: number;
  sentSuccessCount: number;
  smsFailedCount: number;
  fallbackTeacherNoticesCreated: number;
  disputedSkippedCount: number;
}

// ==========================================
//  & KHIẾU NẠI & ĐIỀU CHỈNH HÓA ĐƠN HỌC PHÍ (PAYMENT DISPUTES & ADJUSTMENTS)
// ==========================================

export type DisputeCategory =
  | 'MEAL_REFUND' // Tiền ăn hoàn trả (Bé nghỉ có phép nhưng chưa trừ tiền)
  | 'LATE_PICKUP' // Phụ phí trông trẻ đón muộn (Tính sai số phút đón ngoài giờ)
  | 'BASE_TUITION' // Tiền bán trú / Học phí cơ bản
  | 'OTHER'; // Khoản thu khác

export type PaymentDisputeStatus =
  | 'PENDING_REVIEW' // Chờ kế toán kiểm tra đối soát
  | 'RESOLVED_ADJUSTED' // Đã chấp thuận & phát hành hóa đơn điều chỉnh
  | 'REJECTED_EXPLAINED' // Đã từ chối kèm bằng chứng minh bạch
  | 'CANCELLED'; // Phụ huynh tự hủy khiếu nại

export interface CrossCheckAuditResult {
  attendanceRecord: {
    date: string;
    isPresent: boolean;
    checkInTime?: string;
    checkOutTime?: string;
    cameraPhotoUrl?: string;
  };
  leaveRequest?: {
    id: string;
    submittedAt: string;
    approvedBy?: string;
    isBeforeCutoff: boolean; // Nộp trước 08:30 AM
  };
  kitchenHeadcount: {
    mealCharged: boolean;
    mealRefundLogged: boolean;
  };
  auditConclusion: string; // Kết luận đối chiếu
  suggestedAdjustmentAmount: number; // Gợi ý số tiền giảm trừ bổ sung
}

export interface PaymentDisputeItem {
  id: string; // DISP-202610-001
  invoiceId: string;
  invoiceNumber: string;
  referenceCode: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  parentName: string;
  parentPhone: string;
  category: DisputeCategory;
  disputedAmount: number;
  reason: string;
  proofPhotoUrl?: string;
  status: PaymentDisputeStatus;
  submittedAt: string;
  crossCheckAudit?: CrossCheckAuditResult;
  adjustmentAmount?: number; // Số tiền giảm trừ điều chỉnh (- 35.000 VNĐ)
  adjustmentReason?: string; // Giải trình kế toán
  principalAuthCode?: string; // Mã phê duyệt BGH nếu năm học cũ
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  originalInvoiceTotal: number;
  adjustedInvoiceTotal?: number;
  newVietQrUrl?: string;
}

export interface ResolveDisputePayload {
  action: 'APPROVE' | 'REJECT';
  adjustmentAmount?: number;
  reason: string;
  principalAuthCode?: string;
}

// ==========================================
// BÁO CÁO TÀI CHÍNH TỔNG HỢP & TUỔI NỢ CHUẨN MỰC VAS (FINANCIAL & AGING DEBT REPORTING)
// ==========================================

export type FinancialReportPeriodType = 'MONTH' | 'QUARTER' | 'ACADEMIC_YEAR';
export type PaymentChannelFilter = 'ALL' | 'VIETQR' | 'CASH' | 'POS';

export interface FinancialReportFilter {
  periodType: FinancialReportPeriodType;
  periodValue: string; // '2026-10', 'Q4-2026', '2026-2027'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  classId?: string; // 'ALL' or ID
  paymentChannel: PaymentChannelFilter;
}

export interface FinancialSummaryKPIs {
  totalIssuedRevenue: number; // Tổng Doanh Thu Phát Hành
  totalCollectedRevenue: number; // Tổng Thực Thu
  collectedViaVietQr: number; // Chuyển khoản VietQR
  collectedViaCash: number; // Tiền mặt quầy thu & POS
  totalDiscountsAndRefunds: number; // Tổng Giảm Trừ & Hoàn Phí
  totalOutstandingDebt: number; // Tổng Công Nợ Còn Tồn
  recoveryRatePercentage: number; // Tỷ lệ thu hồi học phí % (vd: 94.2%)
  totalInvoiceCount: number;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
}

export interface RevenueStructureItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AgingDebtReportItem {
  bucketName: string;
  amount: number;
  invoiceCount: number;
  color: string;
}

export interface DebtorStudentItem {
  studentId: string;
  studentCode: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  overdueDays: number;
  debtAmount: number;
  invoiceNumber: string;
}

export interface ClassDebtSummaryItem {
  classId: string;
  className: string;
  gradeLevel: string;
  totalStudents: number;
  totalIssued: number;
  totalCollected: number;
  unpaidCount: number;
  remainingDebt: number;
  recoveryRate: number;
  debtors: DebtorStudentItem[];
}

export interface FinancialReportData {
  periodTitle: string;
  kpis: FinancialSummaryKPIs;
  revenueStructure: RevenueStructureItem[];
  agingDebtReport: AgingDebtReportItem[];
  classSummaries: ClassDebtSummaryItem[];
  generatedAt: string;
  generatedBy: string;
}


// ==========================================
// NEW DB & DTO TYPES FOR KE_TOAN ( .. )
// ==========================================

export interface ServiceDto {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  chargeCycle: 'MONTHLY' | 'SEMESTER' | 'YEARLY' | 'ONE_TIME';
  isMandatory: boolean;
  message?: string;
}

export interface ServiceRequestDto {
  serviceName: string;
  unitPrice: number;
  chargeCycle: string;
  isMandatory: boolean;
}

export interface DiscountPolicyDto {
  policyId: string;
  policyName: string;
  discountPercentage: number;
  discountAmount: number;
  message?: string;
}

export interface DiscountPolicyRequestDto {
  policyName: string;
  discountPercentage: number;
  discountAmount: number;
}

export interface StudentDiscountDto {
  studentDiscountId: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  policyId: string;
  policyName: string;
  discountPercentage: number;
  discountAmount: number;
  appliedDate: string;
  message?: string;
}

export interface AssignStudentDiscountRequestDto {
  studentId: string;
  policyId: string;
  appliedDate?: string;
}

export interface InvoiceItemDto {
  itemId?: number;
  invoiceId?: string;
  itemDescription: string;
  amount: number;
}

export interface InvoiceDto {
  invoiceId: string;
  invoiceCode: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  parentName: string;
  parentPhone: string;
  billingMonth: number;
  billingYear: number;
  totalAmount: number;
  discountAmount: number;
  discountPolicyName?: string;
  finalAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' | 'OVERDUE' | 'DISPUTED';
  paymentQrCode: string;
  items: InvoiceItemDto[];
  message?: string;
}

export interface GenerateBillingRequestDto {
  month: number;
  year: number;
  classId?: string;
}

export interface AddInvoiceItemRequestDto {
  itemDescription: string;
  amount: number;
  reason?: string;
}

export interface PublishInvoicesRequestDto {
  month?: number;
  year?: number;
  classId?: string;
  dueDate?: string;
  customMessage?: string;
  invoiceIds?: string[];
}

export interface PublishInvoicesResponseDto {
  publishedCount: number;
  billingMonth: number;
  billingYear: number;
  dueDate: string;
  message: string;
}

export interface RecordCashPaymentRequestDto {
  amountPaid: number;
  paymentDate?: string;
  payerName?: string;
  notes?: string;
}

export interface ReceiptDto {
  receiptId: string;
  invoiceId: string;
  invoiceCode: string;
  transactionId: string;
  transactionCode: string;
  studentName: string;
  studentCode: string;
  className: string;
  payerName: string;
  amountPaid: number;
  remainingDebt: number;
  paymentMethod: 'VIETQR_PAYOS' | 'BANK_TRANSFER' | 'CASH';
  paymentTime: string;
  notes: string;
  schoolName: string;
  schoolTaxCode: string;
  schoolAddress: string;
  verificationCode: string;
  message?: string;
}

export interface ClassTuitionSummaryDto {
  classId: string;
  className: string;
  gradeLevel: string;
  studentCount: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

export interface TuitionSummaryDto {
  billingMonth: number;
  billingYear: number;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED' | 'SUBMITTED' | 'NOT_INITIALIZED';
  totalStudents: number;
  totalGrossAmount: number;
  totalDiscountAmount: number;
  totalNetAmount: number;
  rejectionReason?: string;
  message?: string;
  classSummaries: ClassTuitionSummaryDto[];
}
