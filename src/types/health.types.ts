export type BmiStatus = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
export type DevelopmentDomain = 'PHYSICAL' | 'COGNITIVE' | 'LANGUAGE' | 'SOCIO_EMOTIONAL' | 'AESTHETIC';
export type MealConsumptionLevel = 'FINISHED' | 'HALF' | 'SKIPPED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK';

export interface HealthMetric {
  id?: string;
  studentId: string;
  studentName?: string;
  measuredDate: string;
  heightCm: number;
  weightKg: number;
  bmi?: number;
  bmiStatus?: BmiStatus;
}

export type MedicationStatus = 'PENDING_RECEIPT' | 'RECEIVED_WAITING' | 'ADMINISTERED' | 'MISSED';

export interface MedicationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  avatarUrl?: string;
  medicationName: string;
  dosage: string;
  administrationTime: string; // e.g. "14:00"
  notes?: string;
  storageInstructions?: string;
  prescriptionPhotoUrl?: string;
  proofPhotoUrl?: string;
  administeredAt?: string;
  witnessTeacherId?: string;
  witnessTeacherName?: string;
  status: MedicationStatus;
  isAntibioticOrPrescription: boolean;
  maxDosesPerDay: number;
  dosesAdministeredToday: number;
}

export interface ClassroomJournalPost {
  id?: string;
  classId: string;
  className?: string;
  title?: string;
  content?: string;
  caption?: string;
  date: string;
  photoUrl?: string;
  mediaUrls?: string[];
  taggedStudentIds?: string[];
  taggedStudentNames?: string[];
  teacherName?: string;
  teacherAvatarUrl?: string;
  hasPrivacyRestrictedStudent?: boolean;
  createdAt?: string;
  isDeleted?: boolean;
}

export interface DevelopmentEvaluation {
  id?: string;
  studentId: string;
  studentName?: string;
  academicYearId?: string;
  evaluationPeriod: string;
  domain: DevelopmentDomain;
  scoreLevel: string;
  notes?: string;
}

export interface NapRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  date: string;
  napStart: string;
  napEnd: string;
  qualityNote?: string;
}

export interface MealRecord {
  id?: string;
  studentId: string;
  studentName?: string;
  date: string;
  mealType: MealType;
  consumptionLevel: MealConsumptionLevel;
}

// ==========================================
// GHI NHẬN CHỈ SỐ CHIỀU CAO & CÂN NẶNG CHUẨN WHO
// ==========================================

export type MeasurementPeriodType = 'BEGINNING_YEAR' | 'MID_YEAR' | 'END_YEAR';

export interface BatchStudentHealthEntry {
  studentId: string;
  studentCode: string;
  studentName: string;
  avatarUrl?: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  ageMonths: number;
  previousHeightCm?: number;
  previousWeightKg?: number;
  previousBmi?: number;
  previousBmiStatus?: BmiStatus;
  previousMeasuredDate?: string;
  currentHeightCm: number;
  currentWeightKg: number;
  bmi: number;
  bmiStatus: BmiStatus;
  notes?: string;
  isHeightDecreased?: boolean; // Cảnh báo h_new < h_old
}

export interface BatchHealthMetricsPayload {
  classId: string;
  measurementRound: MeasurementPeriodType;
  measurementDate: string;
  records: {
    studentId: string;
    heightCm: number;
    weightKg: number;
    notes?: string;
  }[];
}

export interface WhoGrowthStandardPoint {
  ageMonths: number;
  minus2SD_Height: number;
  median_Height: number;
  plus2SD_Height: number;
  minus2SD_Weight: number;
  median_Weight: number;
  plus2SD_Weight: number;
}

// ==========================================
// GHI CHÉP NHẬT KÝ SỰ VỤ Y TẾ HỌC ĐƯỜNG (MEDICAL INCIDENTS)
// ==========================================

export type MedicalIncidentCategory =
  | 'FEVER' // Sốt cao
  | 'SCRATCH_FALL' // Trầy xước / Té ngã
  | 'NOSEBLEED' // Chảy máu cam
  | 'VOMITING' // Nôn trớ / Tiêu hóa
  | 'ALLERGIC_REACTION' // Dị ứng thuốc / Thực phẩm
  | 'STOMACH_ACHE' // Đau bụng
  | 'OTHER'; // Khác

export type IncidentActionPlan =
  | 'RETURN_TO_CLASS' // Bé ổn định, trở lại lớp học
  | 'REST_IN_INFIRMARY' // Nằm theo dõi tại phòng y tế
  | 'PARENT_EARLY_PICKUP' // Liên hệ phụ huynh đón sớm
  | 'HOSPITAL_EMERGENCY_115'; // Cấp cứu khẩn cấp - Chuyển viện 115

export interface MedicalIncidentRecord {
  id: string;
  incidentCode: string; // INC-202610-001
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  avatarUrl?: string;
  category: MedicalIncidentCategory;
  categoryLabel: string;
  temperatureCelsius: number;
  isHighFever: boolean; // > 38.5°C
  isExtremeFever: boolean; // > 39.5°C (Cảnh báo sốt cao kịch phát MSG-218)
  symptomsDescription: string;
  firstAidMeasures: string[];
  medicationGiven: boolean;
  medicalConsentAgreed: boolean; // Đồng thuận dùng thuốc của phụ huynh
  actionPlan: IncidentActionPlan;
  actionPlanLabel: string;
  parentNotified: boolean;
  parentNotificationStatus: 'SENT' | 'PENDING' | 'FAILED';
  parentEmergencyPhone: string;
  recordedByStaffName: string;
  recordedAt: string;
  updatedAt?: string;
  notes?: string;
  allergyTags?: string[]; // Thẻ dị ứng của bé nếu có
}

export interface CreateMedicalIncidentPayload {
  studentId: string;
  category: MedicalIncidentCategory;
  temperatureCelsius: number;
  symptomsDescription: string;
  firstAidMeasures: string[];
  actionPlan: IncidentActionPlan;
  notes?: string;
}


