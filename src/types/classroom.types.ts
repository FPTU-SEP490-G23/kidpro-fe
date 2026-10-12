export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
export type TransferRequestType = 'TRANSFER' | 'DEFERRAL';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ClassEntity {
  id: string;
  name: string;
  teacherId?: string;
  teacherName?: string;
  academicYear?: string;
  ageGroup?: string;
  roomName?: string;
  roomNumber?: string;
  capacity?: number;
  maxCapacity?: number;
  currentCount?: number;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface Student {
  id: string;
  fullName: string;
  classId?: string;
  className?: string;
  parentId?: string;
  parentName?: string;
  allergyInfo?: string;
  status: StudentStatus;
  dateOfBirth?: string;
  gender?: string;
  enrollmentDate?: string;
}

export interface Timetable {
  id: string;
  classId: string;
  className?: string;
  dayOfWeek: number; // 1 = Thứ 2 ... 6 = Thứ 7, 7 = CN
  startTime: string; // HH:mm
  endTime: string;
  activityName?: string;
  subject?: string;
  teacherId?: string;
  teacherName?: string;
  roomName?: string;
  roomNumber?: string;
  notes?: string;
}

export interface TimetableConflict {
  id: string;
  type: 'TEACHER_CONFLICT' | 'ROOM_CONFLICT' | 'TEACHER_OVERLOAD';
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  conflictingTimetableIds: string[];
  classIds: string[];
  classNames: string[];
  entityName: string; // e.g. "Cô Nguyễn Thị Mai" or "Phòng Âm nhạc 102"
  description: string;
  suggestedAction?: string;
  suggestedRoom?: string;
  suggestedTime?: string;
}

export interface ClassTransferRequest {
  id: string;
  studentId: string;
  studentName?: string;
  studentDob?: string;
  studentAgeGroup?: string;
  fromClassId: string;
  fromClassName?: string;
  toClassId?: string;
  toClassName?: string;
  requestType: TransferRequestType;
  reason?: string;
  status: TransferStatus;
  reviewedBy?: string;
  reviewNote?: string;
  reviewNotes?: string;
  createdAt?: string;
  hasTuitionDebt?: boolean;
}

export interface Guardian {
  id: string;
  studentId?: string;
  studentName?: string;
  studentDob?: string;
  studentClassName?: string;
  fullName: string;
  relationship: string; // 'Bố' | 'Mẹ' | 'Ông' | 'Bà' | 'Người giám hộ'
  phone: string;
  identityCard: string; // 12 số CCCD
  address?: string;
  avatarUrl?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  faceEmbedding?: string | number[]; // 512-dim JSONB
  hasFaceEmbedding?: boolean;
  verificationStatus: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt?: string;
}

// ==========================================
// UC-053: TRUNG TÂM CẢNH BÁO DỊ ỨNG TOÀN HỆ THỐNG (ALLERGY COMMAND CENTER)
// ==========================================

export type AllergyCategory =
  | 'FOOD' // Thực phẩm
  | 'MEDICATION' // Dược phẩm / Thuốc
  | 'ENVIRONMENT' // Môi trường
  | 'SEAFOOD' // Hải sản / Tôm cua
  | 'PEANUT' // Đậu phộng / Lạc
  | 'EGG' // Trứng gà
  | 'DAIRY_LACTOSE' // Sữa bò / Bơ sữa / Lactose
  | 'DRUG_PENICILLIN' // Thuốc kháng sinh Penicillin
  | 'INSECT_STING' // Nọc côn trùng / Ong đốt
  | 'OTHER'; // Khác

export type AllergySeverity = 'SEVERE_ANAPHYLAXIS' | 'MILD_MODERATE'; // Sốc phản vệ nặng (Cần cấp cứu) | Nhẹ (Mẩn ngứa)

export interface StudentAllergyProfile {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  avatarUrl?: string;
  category: AllergyCategory;
  categoryLabel?: string;
  allergyTags: string[]; // ['peanuts', 'shrimp']
  severity: AllergySeverity;
  severityLabel?: string;
  firstAidProtocol: string; // Phác đồ sơ cứu & Vị trí thuốc cấp cứu (Bắt buộc nếu SEVERE_ANAPHYLAXIS - MSG-221)
  medicationLocation?: string; // Vị trí bút tiêm Epiphen / Thuốc chống sốc tại trường
  doctorCertificateUrl?: string; // Giấy chứng nhận y tế đính kèm
  isActive: boolean; // Huy hiệu khiên đỏ kích hoạt
  activatedAt?: string;
  lastReviewedAt?: string;
  parentPhone?: string;
  notes?: string;
}

export interface UpdateAllergyPayload {
  studentId?: string;
  category: AllergyCategory;
  allergyTags: string | string[]; // Chuỗi phân cách dấu phẩy, vd: 'peanuts,seafood' hoặc mảng
  severity: AllergySeverity;
  firstAidProtocol: string;
  medicationLocation?: string;
  doctorCertificateUrl?: string;
  notes?: string;
}

// ==========================================
// UC-054: KẾ HOẠCH & PHÊ DUYỆT GIÁO ÁN TUẦN (WEEKLY LESSON PLANS)
// ==========================================

export type LessonPlanStatus =
  | 'DRAFT' // Bản nháp chưa gửi
  | 'PENDING_APPROVAL' // Chờ Giáo vụ Phê duyệt
  | 'APPROVED' // Đã Phê duyệt Ban hành
  | 'REVISION_REQUESTED'; // Yêu cầu Chỉnh sửa

export interface DevelopmentObjectives {
  physical: string; // 1. Phát triển Thể chất
  cognitive: string; // 2. Phát triển Nhận thức
  language: string; // 3. Phát triển Ngôn ngữ
  socialEmotional: string; // 4. Tình cảm & Kỹ năng xã hội
  aesthetic: string; // 5. Phát triển Thẩm mỹ
}

export interface DayActivities {
  morningWarmup: string; // Đón trẻ & Thể dục sáng
  focusedLearning: string; // Hoạt động học có chủ đích
  cornerPlay: string; // Hoạt động chơi ở các góc
  outdoorActivity: string; // Hoạt động ngoài trời
  afternoonRoutine: string; // Hoạt động chiều & Trả trẻ
}

export interface WeeklyLessonPlan {
  id: string;
  weekNumber: number; // Tuần 08
  weekRange: string; // 12/10/2026 - 16/10/2026
  academicYear: string; // 2026-2027
  classId: string;
  className: string;
  ageGroup: string; // Mầm 1 (3-4 Tuổi)
  themeTopic: string; // Chủ đề tuần (vd: "Thế giới Động vật - Bé yêu thú cưng")
  teacherId: string;
  teacherName: string;
  status: LessonPlanStatus;
  objectives: DevelopmentObjectives;
  scheduleMatrix: {
    monday: DayActivities;
    tuesday: DayActivities;
    wednesday: DayActivities;
    thursday: DayActivities;
    friday: DayActivities;
  };
  attachmentUrls?: string[];
  submittedAt?: string;
  isSubmittedLate?: boolean; // Nộp sau 17:00 Thứ Sáu (MSG-302)
  reviewedAt?: string;
  reviewerName?: string;
  reviewerFeedback?: string;
  updatedAt?: string;
}

export interface CreateLessonPlanPayload {
  weekNumber: number;
  weekRange: string;
  classId: string;
  themeTopic: string;
  objectives: DevelopmentObjectives;
  scheduleMatrix: {
    monday: DayActivities;
    tuesday: DayActivities;
    wednesday: DayActivities;
    thursday: DayActivities;
    friday: DayActivities;
  };
  attachmentUrls?: string[];
  isDraft: boolean; // true = Lưu bản nháp, false = Gửi phê duyệt chính thức
}

// ==========================================
// UC-061: ĐÁNH GIÁ 5 LĨNH VỰC PHÁT TRIỂN MẦM NON (THÔNG TƯ 28/2016/TT-BGDĐT)
// ==========================================

export type EvaluationTerm = 'SEMESTER_1' | 'SEMESTER_2' | 'FULL_YEAR';
export type DomainEvaluationStatus = 'PASS' | 'DEVELOPING'; // Đạt / Cần rèn luyện

export interface StudentDomainScores {
  physicalScore: number; // 1 - 5 (Chuẩn: 5 = Đạt, 2 = Cần rèn luyện)
  physicalStatus: DomainEvaluationStatus;
  cognitiveScore: number;
  cognitiveStatus: DomainEvaluationStatus;
  languageScore: number;
  languageStatus: DomainEvaluationStatus;
  emotionalScore: number;
  emotionalStatus: DomainEvaluationStatus;
  aestheticScore: number;
  aestheticStatus: DomainEvaluationStatus;
  teacherNotes: string;
}

export interface ClassStudentEvaluationItem {
  studentId: string;
  studentCode: string;
  studentName: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  scores: StudentDomainScores;
  isSavedDraft?: boolean;
  isSubmitted?: boolean;
  updatedAt?: string;
}

export interface SaveClassEvaluationPayload {
  classId: string;
  academicYearId: string;
  term: EvaluationTerm;
  isDraft: boolean;
  unlockCode?: string;
  evaluations: Array<{
    studentId: string;
    physicalScore: number;
    cognitiveScore: number;
    languageScore: number;
    emotionalScore: number;
    aestheticScore: number;
    teacherNotes: string;
    status: 'DRAFT' | 'SUBMITTED';
  }>;
}

// ==========================================
// UC-062: PHÊ DUYỆT GIÁO ÁN TUẦN (LESSON PLAN REVIEW & APPROVAL)
// ==========================================

export type LessonPlanReviewAction = 'APPROVED' | 'REVISION_REQUESTED';

export interface ReviewLessonPlanPayload {
  action: LessonPlanReviewAction;
  reviewNotes: string;
  reviewedBy?: string;
  version?: number | string;
}

// ==========================================
// UC-063: QUẢN LÝ ĐỒ DÙNG & THIẾT BỊ DẠY HỌC LỚP (THÔNG TƯ 34/2013/TT-BGDĐT)
// ==========================================

export type EquipmentCondition =
  | 'GOOD' // Tốt
  | 'FAIR' // Trung bình
  | 'BROKEN_REPAIR' // Hỏng cần sửa
  | 'DAMAGED_DISPOSAL'; // Nứt vỡ cần thanh lý

export type EquipmentCategory =
  | 'OUTDOOR_PLAY' // Đồ chơi ngoài trời
  | 'MONTESSORI_LEARNING' // Học cụ góc học tập / Montessori
  | 'AUDIO_VISUAL' // Thiết bị nghe nhìn & Công nghệ
  | 'FURNITURE_APPLIANCE' // Thiết bị điện tử - gia dụng & Bàn ghế
  | 'STEAM_ROBOTICS'; // Bộ STEAM / Khám phá khoa học

export interface ClassroomEquipmentItem {
  id: string;
  classId: string;
  className: string;
  roomNumber: string;
  barcode: string; // Mã vạch tài sản
  name: string; // Tên học cụ / thiết bị
  category: EquipmentCategory;
  standardQuantity: number; // Định mức tối thiểu theo Thông tư 34
  actualQuantity: number; // Số lượng tồn thực tế tại lớp
  condition: EquipmentCondition;
  brokenNotes?: string;
  hasSafetyRisk?: boolean; // Cảnh báo nguy cơ cạnh sắc nhọn / nuốt nghẹn (MSG-273)
  lastInspectedDate: string;
  inspectedBy?: string;
}

export interface TransferEquipmentPayload {
  equipmentId: string;
  fromClassId: string;
  toClassId: string;
  transferQuantity: number;
  reason: string;
}

export interface EquipmentRequisitionItem {
  id: string;
  equipmentName: string;
  category: EquipmentCategory;
  currentQuantity: number;
  standardQuantity: number;
  suggestedQuantity: number;
  estimatedBudget: number;
  reason: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}



