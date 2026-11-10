// ==========================================
// UC-041: ĐĂNG KÝ DỮ LIỆU KHUÔN MẶT CỦA BÉ (STUDENT AI FACE ENROLLMENT)
// ==========================================

export type FaceAngleType = 'FRONTAL' | 'LEFT_TILT' | 'RIGHT_TILT';

export interface BiometricPhotoItem {
  id: string;
  angle: FaceAngleType;
  photoUrl: string;
  capturedAt: string;
  qualityScore: number; // 0 - 100
  antiSpoofingPass: boolean; // Kiểm tra ảnh thật chống giả mạo
}

export type BiometricEnrollmentStatus =
  | 'NOT_REGISTERED'
  | 'EXTRACTING'
  | 'AI_READY'
  | 'REFUSED_MANUAL_ATTENDANCE';

export interface StudentFaceBiometricProfile {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  decree13ConsentAgreed: boolean; // Đồng thuận Nghị định 13/2023/NĐ-CP
  consentTimestamp?: string;
  guardianConsenterName?: string;
  status: BiometricEnrollmentStatus;
  photos: BiometricPhotoItem[];
  vectorDimension: number; // 512 chiều JSONB
  lastSyncedAt?: string;
  refusalReason?: string;
}

export interface Decree13ConsentAgreement {
  studentId: string;
  guardianName: string;
  relationship: string;
  isAgreed: boolean;
  agreedAt: string;
}

// ==========================================
// UC-042: ĐĂNG KÝ DANH SÁCH NGƯỜI THÂN ĐÓN BÉ (AUTHORIZED GUARDIANS)
// ==========================================

export type GuardianVerificationStatus =
  | 'PENDING_VERIFICATION' // Chờ nhà trường thẩm định CCCD
  | 'VERIFIED' // Đã thẩm định & kích hoạt nhận diện AI
  | 'REJECTED'; // Bị từ chối

export interface AuthorizedGuardian {
  id: string;
  studentId: string;
  fullName: string;
  relationship: string; // Bố, Mẹ, Ông nội, Bà nội, Ông ngoại, Bà ngoại, Chú/Bác/Cô/Dì, Người giúp việc/Tài xế
  phone: string; // 10 chữ số chuẩn VN (BR-008)
  citizenId: string; // 12 chữ số
  maskedCitizenId: string; // Che mờ 4 số giữa vd: 001094****12 (Privacy-by-Design)
  photoUrl: string; // Ảnh chân dung sắc nét
  idCardFrontUrl: string; // Mặt trước thẻ CCCD
  idCardBackUrl: string; // Mặt sau thẻ CCCD
  status: GuardianVerificationStatus;
  rejectionReason?: string;
  aiFaceEmbeddingReady: boolean; // Vector nhận diện AI tại cổng trường đã sẵn sàng
  createdAt: string;
  updatedAt?: string;
}

export interface RegisterGuardianPayload {
  studentId: string;
  fullName: string;
  relationship: string;
  phone: string;
  citizenId: string;
  photoUrl: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
}

// ==========================================
// UC-043: ỦY QUYỀN ĐÓN HỘ ĐỘT XUẤT TRONG NGÀY
// ==========================================

export type EmergencyPickupStatus = 'PENDING' | 'USED' | 'REVOKED' | 'EXPIRED';

export interface EmergencyPickupPayload {
  studentId: string;
  guardianName: string;
  relationship: string;
  phone: string;
  citizenId: string;
  photoUrl: string;
  faceEmbedding?: string; // 512 chiều JSONB
  pinCode?: string;
}

export interface EmergencyPickupRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  guardianName: string;
  relationship: string;
  phone: string;
  citizenId: string;
  photoUrl: string;
  faceEmbedding?: string;
  qrCodeData: string;
  qrExpiresAt: string; // 18:00 cùng ngày
  validDate: string; // YYYY-MM-DD
  status: EmergencyPickupStatus;
  isNearCutoff?: boolean; // Nộp sau 16:30 -> MSG-176
  usedAt?: string;
  revokedAt?: string;
  createdAt: string;
}

// ==========================================
// UC-044: NỘP ĐƠN XIN NGHỈ HỌC TRỰC TUYẾN
// ==========================================

export type LeaveReasonCategory =
  | 'ILLNESS' // Bị ốm / Sốt / Khám bệnh
  | 'FAMILY' // Việc gia đình
  | 'TRAVEL' // Về quê / Du lịch
  | 'OTHER'; // Khác

export type ParentLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SubmitLeaveRequestPayload {
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  attachmentUrl?: string; // Bắt buộc nếu nghỉ ốm >= 3 ngày (BR-035)
}

export interface ParentLeaveItem {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  className?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reasonCategory?: LeaveReasonCategory;
  reason: string;
  notes?: string;
  attachmentUrl?: string;
  status: ParentLeaveStatus;
  isEligibleForMealRefund: boolean;
  mealRefundAmount: number; // daily_refund_rate * days
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// ==========================================
// UC-045: GỬI ĐƠN DẶN THUỐC ĐIỆN TỬ
// ==========================================

export type MedicationCategory = 'REGULAR' | 'PRESCRIPTION_ANTIBIOTIC';
export type MedicationAdminStatus = 'PENDING_RECEIPT' | 'RECEIVED_WAITING' | 'ADMINISTERED' | 'MISSED';

export interface SubmitMedicationPayload {
  studentId: string;
  medicationName: string;
  category: MedicationCategory;
  dosage: string;
  administrationTime: string; // "11:30" | "14:00" | "15:30" hoặc "HH:mm" trong khoảng 07:30 - 17:00
  storageInstructions?: string;
  notes?: string;
  prescriptionPhotoUrl?: string; // Bắt buộc nếu là PRESCRIPTION_ANTIBIOTIC (BR-049)
  courseDays?: number; // 1-7 ngày
  agreedElectronicConsent: boolean; // BR-047
}

export interface ParentMedicationItem {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  medicationName: string;
  category: MedicationCategory;
  dosage: string;
  administrationTime: string;
  storageInstructions?: string;
  notes?: string;
  prescriptionPhotoUrl?: string;
  status: MedicationAdminStatus;
  courseDays?: number;
  administeredAt?: string;
  proofPhotoUrl?: string; // Ảnh cô chụp lúc 14:00
  witnessTeacherName?: string;
  createdAt: string;
}

// ==========================================
// UC-046: NHẬN THÔNG BÁO ĐIỂM DANH & ĐÓN TRẢ KÈM ẢNH
// ==========================================

export type GateEventType = 'GATE_CHECKIN' | 'GATE_CHECKOUT';

export interface GateNotificationItem {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  eventType: GateEventType;
  title: string;
  timestamp: string; // '2026-10-10T07:45:12+07:00'
  gateLocation: string; // 'Cổng chính 1', 'Cổng phụ 2'
  photoUrl: string; // Ảnh MinIO/S3
  fallbackPhotoUrl?: string; // Ảnh CDN dự phòng (MSG-187)
  isAiRecognized: boolean; // true = Camera AI, false = Thủ công
  confidenceScore?: number; // 0.98
  guardianName?: string; // Tên người đón khi check-out
  relationship?: string; // Mối quan hệ
  isEmergencyPickup?: boolean; // Đón khẩn cấp 1 ngày
  isRead: boolean;
  smsFallbackTriggered?: boolean; // MSG-186
  securityHash?: string;
}

export interface RegisterFcmTokenPayload {
  fcmToken: string;
  deviceType: 'WEB' | 'ANDROID' | 'IOS';
}

// ==========================================
// UC-047: XEM BẢNG KÊ HỌC PHÍ & CHI TIẾT KHẤU TRỪ
// ==========================================

export type ParentInvoiceStatus = 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'DISPUTED' | 'RECALLED';

export interface MealRefundDetailItem {
  date: string; // YYYY-MM-DD
  reason: string;
  leaveRequestTime: string; // '07:15 AM'
  refundAmount: number; // 35.000 VNĐ
}

export interface TuitionInvoiceItem {
  id: string;
  invoiceNumber: string; // INV-202610-001
  referenceCode: string; // INV202610A7B9C1
  studentId: string;
  studentName: string;
  className: string;
  billingPeriod: string; // 'Tháng 10/2026'
  dueDate: string; // '2026-10-15'
  status: ParentInvoiceStatus;
  
  // Các khoản thu & khấu trừ
  baseTuition: number; // + 3.000.000 VNĐ
  mealFee: number; // + 770.000 VNĐ (22 ngày x 35.000)
  siblingDiscount: number; // - 300.000 VNĐ
  latePickupMinutes: number; // Số phút muộn tích lũy
  latePickupFee: number; // + 100.000 VNĐ
  mealRefundCount: number; // 3 ngày
  mealRefundTotal: number; // - 105.000 VNĐ
  mealRefundDetails: MealRefundDetailItem[];
  otherDiscounts?: number;
  adjustmentAmount?: number; // Dòng giảm trừ bổ sung ADJUSTMENT (vd: - 35.000 VNĐ)
  adjustmentReason?: string; // Lý do giải trình kế toán
  totalAmount: number; // 3.845.000 VNĐ
  paidAmount: number;
  remainingAmount: number;
  bankReferenceCode?: string;
  paymentQrCode?: string;
  isRecalled?: boolean; // Bị thu hồi điều chỉnh (MSG-191)
  issuedAt: string;
  paidAt?: string;
  recalledReason?: string;
  disputeNotes?: string;
  disputeCategory?: 'MEAL_REFUND' | 'LATE_PICKUP' | 'BASE_TUITION' | 'OTHER';
  disputedAmount?: number;
  proofPhotoUrl?: string;
}

export type DisputeCategoryType = 'MEAL_REFUND' | 'LATE_PICKUP' | 'BASE_TUITION' | 'OTHER';

export interface InvoiceDisputePayload {
  invoiceId: string;
  referenceCode?: string;
  studentId?: string;
  category: DisputeCategoryType;
  reason: string;
  disputedAmount?: number;
  proofPhotoUrl?: string;
  parentContact: string;
}

// ==========================================
// UC-048: THANH TOÁN HỌC PHÍ QUA VIETQR 1-CHẠM
// ==========================================

export interface VietQrPaymentInfo {
  invoiceId: string;
  invoiceNumber: string;
  referenceCode: string; // Mã nội dung chuyển khoản duy nhất
  accountName: string; // TRUONG MAM NON KIDPRO
  accountNumber: string; // 666619092005
  bankName: string; // MBBank
  bankCode: string; // 970422
  amount: number; // 3845000
  description: string; // INV202610A7B9C1
  qrImageUrl: string;
  staticQrUrl?: string;
  paymentQrCode?: string;
  deepLinkUrl: string; // vietqr:// hoặc universal link PayOS
  isGatewayBusy?: boolean; // MSG-194
}

// ==========================================
// UC-049: TẢI BIÊN LAI THU TIỀN ĐIỆN TỬ & HÓA ĐƠN THUẾ (ELECTRONIC RECEIPT & VAS)
// ==========================================

export type PaymentMethodType = 'VIETQR_PAYOS' | 'CASH_COUNTER' | 'POS_CARD';

export interface ReceiptLineItem {
  id: string;
  orderIndex: number;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  itemType: 'TUITION' | 'MEAL' | 'LATE_PICKUP' | 'DISCOUNT' | 'MEAL_REFUND';
  notes?: string;
}

export interface DigitalSignatureInfo {
  certSerial: string;
  signerName: string;
  organization: string;
  signedAt: string;
  sha256Hash: string;
  isValid: boolean;
  algorithm: string;
  timestampAuthority: string;
}

export interface ElectronicReceiptData {
  id: string;
  receiptNumber: string; // REC-2026-10-00842
  invoiceId: string;
  invoiceNumber: string; // INV-202610-001
  referenceCode: string; // INV202610A7B9C1
  issueDate: string; // 2026-10-10
  billingPeriod: string; // Tháng 10/2026
  academicYear: string; // 2026 - 2027
  semester: string; // Học kỳ 1
  
  // Thông tin đơn vị phát hành (Nhà trường)
  schoolInfo: {
    name: string;
    taxCode: string;
    address: string;
    phone: string;
    email: string;
    bankAccount: string;
  };

  // Thông tin người nộp & học sinh
  payerInfo: {
    parentName: string;
    studentName: string;
    studentCode: string;
    className: string;
    phone?: string;
    address?: string;
  };

  // Chi tiết các khoản
  lineItems: ReceiptLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalPaid: number;
  amountInWords: string; // Ba triệu tám trăm bốn mươi lăm nghìn đồng chẵn

  // Giao dịch thanh toán
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  bankTransId: string;
  paidAt: string;

  // Dấu mộc & Chữ ký số điện tử
  digitalSignature: DigitalSignatureInfo;
  pdfDownloadUrl?: string;
}

// ==========================================
// UC-050: NỘP ĐƠN YÊU CẦU SỰ VỤ HỌC SINH (STUDENT AFFAIRS & ACADEMIC PETITIONS)
// ==========================================

export type PetitionCategory =
  | 'STUDENT_CONFIRMATION' // Cấp Giấy xác nhận học sinh (visa, bảo hiểm, hồ sơ cơ quan)
  | 'BUS_ROUTE_CHANGE' // Thay đổi tuyến xe buýt đưa đón
  | 'ACADEMIC_RECORD_COPY' // Trích lục học bạ / Bản sao sổ theo dõi
  | 'FEE_INQUIRY_OTHER'; // Thắc mắc chi phí lớp học / Dịch vụ khác

export type PetitionDeliveryFormat = 'DIGITAL_PDF' | 'HARD_COPY_OFFICE';

export type PetitionStatus =
  | 'SUBMITTED' // Đã nộp đơn
  | 'IN_PROGRESS' // Giáo vụ đang xử lý
  | 'APPROVED' // Ban Giám Hiệu đã ký duyệt
  | 'READY_FOR_PICKUP' // Sẵn sàng bàn giao / Hoàn tất
  | 'REJECTED'; // Từ chối / Cần bổ sung

export interface PetitionMessageItem {
  id: string;
  sender: 'PARENT' | 'STAFF';
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
}

export interface StudentPetitionItem {
  id: string;
  trackingCode: string; // PET-2026-0842
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  category: PetitionCategory;
  categoryTitle: string;
  description: string;
  deliveryFormat: PetitionDeliveryFormat;
  targetDate: string; // Ngày mong muốn nhận kết quả
  status: PetitionStatus;
  attachmentUrls?: string[];
  slaHours: number; // 24 - 48
  slaDeadline: string; // ISO datetime
  createdAt: string;
  assignedStaffName?: string;
  completedAt?: string;
  resultDocumentUrl?: string; // Link tải file kết quả nếu nhận PDF
  messages: PetitionMessageItem[];
}

export interface CreatePetitionPayload {
  studentId: string;
  category: PetitionCategory;
  description: string;
  deliveryFormat: PetitionDeliveryFormat;
  targetDate: string;
  attachmentUrls?: string[];
}

// ==========================================
// UC-068: KHẢO SÁT Ý KIẾN & ĐÁNH GIÁ DỊCH VỤ (SERVICE QUALITY SURVEY)
// ==========================================

export interface ServiceRatings {
  mealQuality: number; // 1 - 5 Sao: Chất lượng Bữa ăn Bán trú
  teacherCare: number; // 1 - 5 Sao: Sự Tận tâm của Giáo viên
  facilitySafety: number; // 1 - 5 Sao: Vệ sinh & An toàn Cơ sở Vật chất
  communication: number; // 1 - 5 Sao: Tính Kịp thời & Minh bạch của Thông tin
}

export interface ServiceSurveySubmission {
  id: string;
  surveyId: string;
  studentId?: string;
  studentName?: string;
  className?: string;
  ratings: ServiceRatings;
  averageScore: number;
  feedback: string;
  isAnonymous: boolean; // BR-074: Loại bỏ hoàn toàn thông tin cá nhân
  sendToPrincipalOnly: boolean; // Hòm thư bí mật gửi riêng Hiệu trưởng
  submittedAt: string;
  submitterName?: string;
}

export interface SurveyCampaign {
  id: string;
  title: string;
  description: string;
  quarter: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isExpired: boolean;
  totalTargetParents: number;
  submittedCount: number;
  averageOverallScore: number;
  criteriaAverages: {
    mealQuality: number;
    teacherCare: number;
    facilitySafety: number;
    communication: number;
  };
}

// ==========================================
// UC-069: QUYỀN XÓA DỮ LIỆU SINH TRẮC HỌC THEO ĐIỀU 16 NGHỊ ĐỊNH 13/2023/NĐ-CP
// ==========================================

export type PurgeReason =
  | 'STUDENT_TRANSFER'
  | 'GRADUATED'
  | 'PARENT_RIGHT_TO_ERASURE_DECREE13'
  | 'OTHER';

export interface BiometricPurgeRequestPayload {
  studentId: string;
  accountPassword: string;
  otpCode: string;
  reason: PurgeReason;
  notes?: string;
}

export interface BiometricPurgeCertificate {
  certificateId: string; // CERT-DEC13-2026-XXXX
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  guardianName: string;
  purgedAt: string;
  decreeArticle: string; // 'Điều 16 Nghị định 13/2023/NĐ-CP'
  purgedItems: string[];
  auditLogKey: string; // 'BIOMETRIC_DATA_PURGED_DECREE13'
  sha256Digest: string; // Mã băm mật mã toàn vẹn SHA-256
  schoolName: string;
  schoolSigner: string;
}



