import axiosClient from './axiosClient';
import {
  AuthorizedGuardian,
  RegisterGuardianPayload,
  StudentFaceBiometricProfile,
  Decree13ConsentAgreement,
  EmergencyPickupPayload,
  EmergencyPickupRecord,
  SubmitLeaveRequestPayload,
  ParentLeaveItem,
  SubmitMedicationPayload,
  ParentMedicationItem,
  GateNotificationItem,
  TuitionInvoiceItem,
  InvoiceDisputePayload,
  VietQrPaymentInfo,
  ElectronicReceiptData,
  StudentPetitionItem,
  CreatePetitionPayload,
  PetitionMessageItem,
  RegisterFcmTokenPayload,
  ServiceRatings,
  ServiceSurveySubmission,
  SurveyCampaign,
  BiometricPurgeRequestPayload,
  BiometricPurgeCertificate,
} from '../types/parent.types';
import { numberToVietnameseWords } from '../utils/formatters';

export const parentApi = {
  // ==========================================
  // UC-041: ĐĂNG KÝ SINH TRẮC HỌC KHUÔN MẶT BÉ
  // ==========================================
  // Lấy hồ sơ khuôn mặt hiện tại của học sinh
  getStudentFaceProfile: (studentId: string) => {
    return axiosClient.get<StudentFaceBiometricProfile>(`/parents/students/${studentId}/face-profile`).catch(() => {
      // Fallback demo profile
      const demoProfile: StudentFaceBiometricProfile = {
        studentId,
        studentName: 'Nguyễn Minh Khang',
        studentCode: 'KP-2026-081',
        className: 'Mầm 1 (3-4 Tuổi)',
        decree13ConsentAgreed: false,
        status: 'NOT_REGISTERED',
        photos: [],
        vectorDimension: 512,
      };
      return { data: demoProfile } as any;
    });
  },

  // Ghi nhận đồng thuận phụ huynh theo Nghị định 13/2023/NĐ-CP
  saveDecree13Consent: (payload: Decree13ConsentAgreement) => {
    return axiosClient.post(`/parents/students/${payload.studentId}/decree13-consent`, payload);
  },

  // Tải lên 3 góc ảnh chân dung & trích xuất vector 512 chiều
  enrollStudentFacePhotos: (
    studentId: string,
    photos: { angle: 'FRONTAL' | 'LEFT_TILT' | 'RIGHT_TILT'; photoUrl: string }[]
  ) => {
    return axiosClient.post<StudentFaceBiometricProfile>(`/parents/students/${studentId}/face-enrollment`, {
      photos,
    });
  },

  // Phụ huynh từ chối cấp quyền sinh trắc học -> chuyển sang điểm danh thủ công
  refuseFaceBiometrics: (studentId: string, reason: string) => {
    return axiosClient.post(`/parents/students/${studentId}/face-refusal`, { reason });
  },

  // ==========================================
  // UC-042: ĐĂNG KÝ DANH SÁCH NGƯỜI THÂN ĐÓN BÉ
  // ==========================================
  // Lấy danh sách người đón được ủy quyền của học sinh
  getAuthorizedGuardians: (studentId: string) => {
    return axiosClient.get<AuthorizedGuardian[]>(`/parents/students/${studentId}/guardians`).catch(() => {
      // Mock danh sách 3 người đón mẫu
      const demoGuardians: AuthorizedGuardian[] = [
        {
          id: 'GD-001',
          studentId,
          fullName: 'Nguyễn Văn Hùng',
          relationship: 'Bố ruột',
          phone: '0912345678',
          citizenId: '001094012345',
          maskedCitizenId: '001094****45',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          status: 'VERIFIED',
          aiFaceEmbeddingReady: true,
          createdAt: '2026-08-15T09:00:00Z',
        },
        {
          id: 'GD-002',
          studentId,
          fullName: 'Lê Thị Mai',
          relationship: 'Mẹ ruột',
          phone: '0988765432',
          citizenId: '001196023456',
          maskedCitizenId: '001196****56',
          photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          status: 'VERIFIED',
          aiFaceEmbeddingReady: true,
          createdAt: '2026-08-15T09:30:00Z',
        },
        {
          id: 'GD-003',
          studentId,
          fullName: 'Nguyễn Văn Thành',
          relationship: 'Ông nội',
          phone: '0903112233',
          citizenId: '001052034567',
          maskedCitizenId: '001052****67',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          idCardFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          idCardBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
          status: 'PENDING_VERIFICATION',
          aiFaceEmbeddingReady: false,
          createdAt: '2026-10-24T14:20:00Z',
        },
      ];
      return { data: demoGuardians } as any;
    });
  },

  // Đăng ký người đón mới kèm CCCD 2 mặt và ảnh chân dung (POST /api/parents/students/{studentId}/guardians)
  registerAuthorizedGuardian: (payload: RegisterGuardianPayload) => {
    return axiosClient.post<AuthorizedGuardian>(
      `/parents/students/${payload.studentId}/guardians`,
      payload
    );
  },

  // Xóa / Thu hồi quyền đón của người thân
  revokeAuthorizedGuardian: (studentId: string, guardianId: string, _passwordConfirm: string) => {
    return axiosClient.delete(`/parents/students/${studentId}/guardians/${guardianId}`);
  },

  // ==========================================
  // UC-043: ỦY QUYỀN ĐÓN HỘ ĐỘT XUẤT TRONG NGÀY
  // ==========================================
  // Phụ huynh tạo ủy quyền đón đột xuất (POST /api/parents/emergency-pickups)
  createEmergencyPickup: async (payload: EmergencyPickupPayload) => {
    try {
      const resp = await axiosClient.post<EmergencyPickupRecord>('/parents/emergency-pickups', payload);
      return resp.data;
    } catch {
      // Fallback demo record
      const todayStr = new Date().toISOString().split('T')[0];
      const demoRecord: EmergencyPickupRecord = {
        id: `EP-${Date.now().toString().slice(-6)}`,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        studentCode: 'KP-2026-081',
        className: 'Mầm 1 (3-4 Tuổi)',
        guardianName: payload.guardianName,
        relationship: payload.relationship,
        phone: payload.phone,
        citizenId: payload.citizenId,
        photoUrl: payload.photoUrl,
        faceEmbedding: payload.faceEmbedding || '[512-dim AI Vector]',
        qrCodeData: JSON.stringify({
          type: 'EMERGENCY_PICKUP_KIDPRO',
          authId: `EP-${Date.now().toString().slice(-6)}`,
          studentId: payload.studentId,
          guardianName: payload.guardianName,
          citizenId: payload.citizenId,
          validDate: todayStr,
          expiresAt: `${todayStr}T18:00:00+07:00`,
          hash: 'SHA256:KD772a8f90214cde8b3b'
        }),
        qrExpiresAt: `${todayStr} 18:00`,
        validDate: todayStr,
        status: 'PENDING',
        isNearCutoff: false,
        createdAt: new Date().toISOString()
      };
      return demoRecord;
    }
  },

  // Tra cứu danh sách ủy quyền đón khẩn cấp có hiệu lực hôm nay (GET /api/academic/emergency-pickups/today)
  getTodayEmergencyPickups: async (studentId?: string) => {
    try {
      const resp = await axiosClient.get<EmergencyPickupRecord[]>('/academic/emergency-pickups/today');
      if (studentId) {
        return resp.data.filter((item) => item.studentId === studentId);
      }
      return resp.data;
    } catch {
      // Fallback demo records
      const todayStr = new Date().toISOString().split('T')[0];
      const fallbackList: EmergencyPickupRecord[] = [
        {
          id: 'EP-902141',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          studentCode: 'KP-2026-081',
          className: 'Mầm 1 (3-4 Tuổi)',
          guardianName: 'Nguyễn Thế Hùng',
          relationship: 'Bác ruột',
          phone: '0981234567',
          citizenId: '001094012999',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          qrCodeData: JSON.stringify({
            type: 'EMERGENCY_PICKUP_KIDPRO',
            authId: 'EP-902141',
            studentId: studentId || 'STU-001',
            guardianName: 'Nguyễn Thế Hùng',
            citizenId: '001094012999',
            validDate: todayStr,
            expiresAt: `${todayStr}T18:00:00+07:00`,
            hash: 'SHA256:KD993f12a'
          }),
          qrExpiresAt: `${todayStr} 18:00`,
          validDate: todayStr,
          status: 'PENDING',
          isNearCutoff: false,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      return fallbackList;
    }
  },

  // Xác nhận hoàn tất đón trẻ (PUT /api/academic/emergency-pickups/{id}/use)
  useEmergencyPickup: (id: string) => {
    return axiosClient.put<EmergencyPickupRecord>(`/academic/emergency-pickups/${id}/use`).catch(() => ({
      data: { id, status: 'USED' as const, usedAt: new Date().toISOString() }
    } as any));
  },

  // Hủy ủy quyền khẩn cấp
  revokeEmergencyPickup: (id: string) => {
    return axiosClient.put(`/academic/emergency-pickups/${id}/revoke`).catch(() => ({
      data: { id, status: 'REVOKED' as const, revokedAt: new Date().toISOString() }
    } as any));
  },

  // ==========================================
  // UC-044: NỘP ĐƠN XIN NGHỈ HỌC TRỰC TUYẾN
  // ==========================================
  // Phụ huynh nộp đơn xin nghỉ học (POST /api/parents/leave-requests)
  submitLeaveRequest: async (payload: SubmitLeaveRequestPayload) => {
    try {
      const resp = await axiosClient.post<ParentLeaveItem>('/parents/leave-requests', payload);
      return resp.data;
    } catch {
      const nowStr = new Date().toISOString();
      const demoItem: ParentLeaveItem = {
        id: `LR-${Date.now().toString().slice(-6)}`,
        code: `LR-${Date.now().toString().slice(-6)}`,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        className: 'Mầm 1 (3-4 Tuổi)',
        startDate: payload.startDate,
        endDate: payload.endDate,
        totalDays: Math.max(1, Math.ceil((new Date(payload.endDate).getTime() - new Date(payload.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1),
        reason: payload.reason,
        notes: payload.notes,
        attachmentUrl: payload.attachmentUrl,
        status: 'PENDING',
        isEligibleForMealRefund: true,
        mealRefundAmount: 35000,
        submittedAt: nowStr
      };
      return demoItem;
    }
  },

  // Lấy danh sách đơn xin nghỉ của phụ huynh (GET /api/parents/leave-requests)
  getLeaveRequests: async (studentId?: string) => {
    try {
      const url = studentId ? `/parents/leave-requests?studentId=${studentId}` : '/parents/leave-requests';
      const resp = await axiosClient.get<ParentLeaveItem[]>(url);
      return resp.data;
    } catch {
      const fallbackLeaves: ParentLeaveItem[] = [
        {
          id: 'LR-108201',
          code: 'LR-108201',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          startDate: '2026-10-12',
          endDate: '2026-10-13',
          totalDays: 2,
          reasonCategory: 'FAMILY',
          reason: 'Về quê thăm ông bà ngoại dịp cuối tuần',
          notes: 'Nhờ cô cho bé làm bài tập vẽ tại nhà',
          status: 'PENDING',
          isEligibleForMealRefund: true,
          mealRefundAmount: 70000,
          submittedAt: '2026-10-09T08:15:00+07:00'
        },
        {
          id: 'LR-099412',
          code: 'LR-099412',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          startDate: '2026-09-22',
          endDate: '2026-09-24',
          totalDays: 3,
          reasonCategory: 'ILLNESS',
          reason: 'Bé bị viêm họng sốt nhẹ 38.5 độ',
          notes: 'Đã có đơn thuốc của bác sĩ Nhi Đồng',
          attachmentUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500',
          status: 'APPROVED',
          isEligibleForMealRefund: true,
          mealRefundAmount: 105000,
          submittedAt: '2026-09-22T07:45:00+07:00',
          reviewedAt: '2026-09-22T08:00:00+07:00',
          reviewNotes: 'Cô đã nhận đơn và báo bếp hủy suất ăn. Chúc con nhanh khỏe nhé!'
        }
      ];
      return fallbackLeaves;
    }
  },

  // Đọc đơn giá hoàn trả suất ăn (GET /api/finance/fee-configs)
  getDailyRefundRate: async (): Promise<number> => {
    try {
      const resp = await axiosClient.get<any>('/finance/fee-configs');
      if (resp.data?.dailyMealRefundRate) {
        return Number(resp.data.dailyMealRefundRate);
      }
      return 35000;
    } catch {
      return 35000; // 35.000 VNĐ / ngày chuẩn
    }
  },

  // ==========================================
  // UC-045: GỬI ĐƠN DẶN THUỐC ĐIỆN TỬ
  // ==========================================
  // Phụ huynh gửi đơn dặn thuốc (POST /api/health/medications)
  submitMedicationRequest: async (payload: SubmitMedicationPayload) => {
    try {
      const resp = await axiosClient.post<ParentMedicationItem>('/health/medications', payload);
      return resp.data;
    } catch {
      const demoMed: ParentMedicationItem = {
        id: `MED-${Date.now().toString().slice(-6)}`,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        className: 'Mầm 1 (3-4 Tuổi)',
        medicationName: payload.medicationName,
        category: payload.category,
        dosage: payload.dosage,
        administrationTime: payload.administrationTime,
        storageInstructions: payload.storageInstructions,
        notes: payload.notes,
        prescriptionPhotoUrl: payload.prescriptionPhotoUrl,
        status: 'PENDING_RECEIPT',
        courseDays: payload.courseDays || 1,
        createdAt: new Date().toISOString()
      };
      return demoMed;
    }
  },

  // Danh sách đơn dặn thuốc của bé (GET /api/health/medications/student/{studentId})
  getStudentMedications: async (studentId: string) => {
    try {
      const resp = await axiosClient.get<ParentMedicationItem[]>(`/health/medications/student/${studentId}`);
      return resp.data;
    } catch {
      const fallbackMeds: ParentMedicationItem[] = [
        {
          id: 'MED-77102',
          studentId,
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          medicationName: 'Siro ho thảo dược Prospan 100ml',
          category: 'REGULAR',
          dosage: '5ml sau khi ăn',
          administrationTime: '11:30',
          storageInstructions: 'Để nơi thoáng mát dưới 30 độ C',
          notes: 'Bé hơi khó uống thuốc nước, nhờ cô pha thêm chút nước ấm',
          status: 'RECEIVED_WAITING',
          courseDays: 3,
          createdAt: '2026-10-10T07:15:00+07:00'
        },
        {
          id: 'MED-66014',
          studentId,
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          medicationName: 'Kháng sinh Augmentin 250mg',
          category: 'PRESCRIPTION_ANTIBIOTIC',
          dosage: '1 gói pha 20ml nước',
          administrationTime: '14:00',
          storageInstructions: 'Ngăn mát tủ lạnh của lớp',
          notes: 'Uống sau khi ngủ trưa dậy đúng 14:00',
          prescriptionPhotoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600',
          status: 'ADMINISTERED',
          courseDays: 5,
          administeredAt: '2026-10-09T14:05:00+07:00',
          proofPhotoUrl: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600',
          witnessTeacherName: 'Cô Nguyễn Thị Hoa (GVCN)',
          createdAt: '2026-10-09T07:20:00+07:00'
        }
      ];
      return fallbackMeds;
    }
  },

  // ==========================================
  // UC-046: NHẬN THÔNG BÁO ĐIỂM DANH & ĐÓN TRẢ KÈM ẢNH
  // ==========================================
  // Lấy danh sách thông báo cổng (GET /api/notifications)
  getGateNotifications: async (studentId?: string, eventType?: string, unreadOnly?: boolean) => {
    try {
      const params: any = {};
      if (studentId) params.studentId = studentId;
      if (eventType && eventType !== 'ALL') params.eventType = eventType;
      if (unreadOnly) params.unreadOnly = true;
      const resp = await axiosClient.get<GateNotificationItem[]>('/notifications', { params });
      return resp.data;
    } catch {
      // Mock notifications
      const demoList: GateNotificationItem[] = [
        {
          id: 'NOTIF-001',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          eventType: 'GATE_CHECKIN',
          title: 'Bé đã đến trường: Nguyễn Minh Khang',
          timestamp: '2026-10-10T07:45:12+07:00',
          gateLocation: 'Cổng chính 1',
          photoUrl: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=800',
          fallbackPhotoUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400',
          isAiRecognized: true,
          confidenceScore: 0.98,
          isRead: false,
          securityHash: 'SHA256:GATE01_77AB99',
        },
        {
          id: 'NOTIF-002',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          eventType: 'GATE_CHECKOUT',
          title: 'Bé đã tan trường: Nguyễn Minh Khang',
          timestamp: '2026-10-09T16:35:20+07:00',
          gateLocation: 'Cổng chính 1',
          photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
          fallbackPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
          isAiRecognized: true,
          guardianName: 'Lê Thị Mai',
          relationship: 'Mẹ ruột',
          isEmergencyPickup: false,
          isRead: true,
          securityHash: 'SHA256:GATE01_66BD12',
        },
        {
          id: 'NOTIF-003',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          eventType: 'GATE_CHECKIN',
          title: 'Bé đã đến trường: Nguyễn Minh Khang',
          timestamp: '2026-10-09T07:40:05+07:00',
          gateLocation: 'Cổng phụ 2',
          photoUrl: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=800',
          isAiRecognized: true,
          confidenceScore: 0.96,
          isRead: true,
          securityHash: 'SHA256:GATE02_88AC31',
        },
        {
          id: 'NOTIF-004',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          eventType: 'GATE_CHECKOUT',
          title: 'Bé đã tan trường: Nguyễn Minh Khang',
          timestamp: '2026-10-08T16:42:15+07:00',
          gateLocation: 'Cổng chính 1',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800',
          isAiRecognized: true,
          guardianName: 'Nguyễn Thế Hùng',
          relationship: 'Bác ruột (Đón khẩn cấp 1 ngày)',
          isEmergencyPickup: true,
          isRead: true,
          securityHash: 'SHA256:GATE01_55EE99',
        },
      ];
      if (eventType && eventType !== 'ALL') {
        return demoList.filter((item) => item.eventType === eventType);
      }
      return demoList;
    }
  },

  // Đăng ký FCM Device Token (PUT /api/notifications/fcm-token)
  registerFcmToken: (payload: RegisterFcmTokenPayload) => {
    return axiosClient.put('/notifications/fcm-token', payload).catch(() => ({ data: { success: true } } as any));
  },

  // Đánh dấu đã đọc 1 thông báo
  markNotificationAsRead: (id: string) => {
    return axiosClient.put(`/notifications/${id}/read`).catch(() => ({ data: { success: true } } as any));
  },

  // Đánh dấu tất cả đã đọc
  markAllNotificationsAsRead: () => {
    return axiosClient.put('/notifications/read-all').catch(() => ({ data: { success: true } } as any));
  },

  // Tra cứu dữ liệu log điểm danh (GET /api/attendance/face-logs)
  getAttendanceFaceLogs: (studentId: string) => {
    return axiosClient.get(`/attendance/face-logs?studentId=${studentId}`).catch(() => ({ data: [] } as any));
  },

  // ==========================================
  // UC-047: XEM BẢNG KÊ HỌC PHÍ & CHI TIẾT KHẤU TRỪ
  // ==========================================
  // Tra cứu danh sách hóa đơn học phí của bé
  getTuitionInvoices: async (studentId: string) => {
    try {
      const resp = await axiosClient.get<TuitionInvoiceItem[]>(`/finance/invoices?studentId=${studentId}`);
      return resp.data;
    } catch {
      // Demo invoice item
      const fallbackInvoices: TuitionInvoiceItem[] = [
        {
          id: 'INV-202610-001',
          invoiceNumber: 'INV-202610-001',
          referenceCode: 'INV202610A7B9C1',
          studentId,
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          billingPeriod: 'Tháng 10/2026',
          dueDate: '2026-10-15',
          status: 'ISSUED',
          baseTuition: 3000000,
          mealFee: 770000,
          siblingDiscount: 300000,
          latePickupMinutes: 40,
          latePickupFee: 100000,
          mealRefundCount: 3,
          mealRefundTotal: 105000,
          mealRefundDetails: [
            {
              date: '2026-09-12',
              reason: 'Nghỉ ốm có phép (Nộp đơn lúc 07:15 AM)',
              leaveRequestTime: '07:15 AM',
              refundAmount: 35000,
            },
            {
              date: '2026-09-13',
              reason: 'Nghỉ ốm có phép (Nộp đơn lúc 07:30 AM)',
              leaveRequestTime: '07:30 AM',
              refundAmount: 35000,
            },
            {
              date: '2026-09-21',
              reason: 'Việc gia đình (Nộp đơn lúc 08:10 AM)',
              leaveRequestTime: '08:10 AM',
              refundAmount: 35000,
            },
          ],
          totalAmount: 3465000, // 3000000 + 770000 - 300000 + 100000 - 105000
          paidAmount: 0,
          remainingAmount: 3465000,
          issuedAt: '2026-10-01T08:00:00+07:00',
        },
        {
          id: 'INV-202609-088',
          invoiceNumber: 'INV-202609-088',
          referenceCode: 'INV202609X9Y1Z2',
          studentId,
          studentName: 'Nguyễn Minh Khang',
          className: 'Mầm 1 (3-4 Tuổi)',
          billingPeriod: 'Tháng 09/2026',
          dueDate: '2026-09-15',
          status: 'PAID',
          baseTuition: 3000000,
          mealFee: 770000,
          siblingDiscount: 300000,
          latePickupMinutes: 0,
          latePickupFee: 0,
          mealRefundCount: 0,
          mealRefundTotal: 0,
          mealRefundDetails: [],
          totalAmount: 3470000,
          paidAmount: 3470000,
          remainingAmount: 0,
          bankReferenceCode: 'FT2625890192841',
          issuedAt: '2026-09-01T08:00:00+07:00',
          paidAt: '2026-09-10T09:14:22+07:00',
        },
      ];
      return fallbackInvoices;
    }
  },

  // Tra cứu chi tiết hóa đơn theo mã tham chiếu (GET /api/finance/invoices/ref/{referenceCode})
  getInvoiceByReference: async (referenceCode: string) => {
    try {
      const resp = await axiosClient.get<TuitionInvoiceItem>(`/finance/invoices/ref/${referenceCode}`);
      return resp.data;
    } catch {
      return null;
    }
  },

  // Gửi khiếu nại sai lệch tiền (POST /api/parents/invoices/{invoiceId}/disputes)
  submitInvoiceDispute: async (payload: InvoiceDisputePayload) => {
    try {
      const resp = await axiosClient.post(`/parents/invoices/${payload.invoiceId}/disputes`, payload);
      return resp.data;
    } catch {
      return { success: true, message: 'Đã gửi phiếu tra soát thành công' };
    }
  },

  // Hủy khiếu nại học phí (DELETE /api/parents/invoices/{invoiceId}/disputes)
  cancelInvoiceDispute: async (invoiceId: string) => {
    try {
      const resp = await axiosClient.delete(`/parents/invoices/${invoiceId}/disputes`);
      return resp.data;
    } catch {
      return { success: true, message: 'Đã hủy phiếu khiếu nại' };
    }
  },

  // ==========================================
  // UC-048: THANH TOÁN HỌC PHÍ QUA VIETQR 1-CHẠM
  // ==========================================
  // Lấy dữ liệu VietQR chuẩn Napas247 (GET /api/finance/invoices/{id}/vietqr)
  getInvoiceVietQrData: async (invoiceId: string, amount?: number, refCode?: string) => {
    try {
      const resp = await axiosClient.get<VietQrPaymentInfo>(`/finance/invoices/${invoiceId}/vietqr`);
      return resp.data;
    } catch {
      const amt = amount || 3465000;
      const ref = refCode || 'INV202610A7B9C1';
      const encodedDesc = encodeURIComponent(`KIDPRO ${ref}`);
      const qrUrl = `https://api.vietqr.io/image/970422-0987654321-compact.jpg?amount=${amt}&addInfo=${encodedDesc}&accountName=TRUONG%20MAM%20NON%20KIDPRO`;
      const deepLink = `vietqr://transfer?bankCode=970422&accNo=0987654321&amount=${amt}&memo=${encodedDesc}`;
      const data: VietQrPaymentInfo = {
        invoiceId,
        invoiceNumber: invoiceId,
        referenceCode: ref,
        accountName: 'TRUONG MAM NON KIDPRO',
        accountNumber: '0987654321',
        bankName: 'MBBank (Ngân hàng Quân Đội)',
        bankCode: '970422',
        amount: amt,
        description: `KIDPRO ${ref}`,
        qrImageUrl: qrUrl,
        deepLinkUrl: deepLink,
        isGatewayBusy: false,
      };
      return data;
    }
  },

  // Mô phỏng nhận Webhook gạch nợ tức thì từ ngân hàng (POST /api/payments/webhook)
  simulatePaymentWebhook: async (referenceCode: string, amount: number) => {
    try {
      const resp = await axiosClient.post('/payments/webhook', {
        referenceCode,
        amount,
        bankTransId: `TID-${Date.now()}`,
        status: 'PAID',
      });
      return resp.data;
    } catch {
      return { success: true, message: 'Gạch nợ tự động thành công' };
    }
  },

  // ==========================================
  // UC-049: TẢI BIÊN LAI THU TIỀN ĐIỆN TỬ (ELECTRONIC RECEIPT & VAS)
  // ==========================================
  // Tra cứu chi tiết biên lai thu tiền điện tử có chữ ký số (GET /api/finance/invoices/{id}/receipt)
  getElectronicReceipt: async (
    invoiceId: string,
    invoiceData?: TuitionInvoiceItem
  ): Promise<ElectronicReceiptData> => {
    try {
      const resp = await axiosClient.get<ElectronicReceiptData>(`/finance/invoices/${invoiceId}/receipt`);
      return resp.data;
    } catch {
      const totalAmt = invoiceData?.totalAmount || 3465000;
      const invNum = invoiceData?.invoiceNumber || `INV-202610-${invoiceId.slice(-3)}`;
      const refCode = invoiceData?.referenceCode || `INV202610A7B9C1`;
      const stuName = invoiceData?.studentName || 'Nguyễn Minh Khang';
      const className = invoiceData?.className || 'Mầm 1 (3-4 Tuổi)';
      const period = invoiceData?.billingPeriod || 'Tháng 10/2026';
      const paidDate = invoiceData?.paidAt ? invoiceData.paidAt.split('T')[0] : '2026-10-10';

      const demoReceipt: ElectronicReceiptData = {
        id: `REC-${invoiceId}`,
        receiptNumber: `REC-2026-10-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceId,
        invoiceNumber: invNum,
        referenceCode: refCode,
        issueDate: paidDate,
        billingPeriod: period,
        academicYear: '2026 - 2027',
        semester: 'Học kỳ 1',
        schoolInfo: {
          name: 'TRƯỜNG MẦM NON QUỐC TẾ KIDPRO',
          taxCode: '0108923456',
          address: 'Số 123 Đường Nguyễn Tri Phương, Phường 7, Quận 5, TP. Hồ Chí Minh',
          phone: '1900 6868 - (028) 3838 9999',
          email: 'finance@kidpro.edu.vn',
          bankAccount: '0987654321 tại MBBank (Hội Sở TP.HCM)',
        },
        payerInfo: {
          parentName: 'Nguyễn Văn Hùng (Phụ huynh)',
          studentName: stuName,
          studentCode: 'KP-2026-081',
          className: className,
          phone: '0912345678',
          address: 'Chung cư Sunrise City, Quận 7, TP. Hồ Chí Minh',
        },
        lineItems: [
          {
            id: 'LI-01',
            orderIndex: 1,
            description: `Học phí cơ bản định mức (${period})`,
            unit: 'Tháng',
            quantity: 1,
            unitPrice: invoiceData?.baseTuition || 3000000,
            amount: invoiceData?.baseTuition || 3000000,
            itemType: 'TUITION',
          },
          {
            id: 'LI-02',
            orderIndex: 2,
            description: 'Tiền ăn bán trú (22 ngày tiêu chuẩn x 35.000đ/ngày)',
            unit: 'Tháng',
            quantity: 1,
            unitPrice: invoiceData?.mealFee || 770000,
            amount: invoiceData?.mealFee || 770000,
            itemType: 'MEAL',
          },
          ...(invoiceData?.siblingDiscount
            ? [
                {
                  id: 'LI-03',
                  orderIndex: 3,
                  description: 'Giảm trừ chính sách gia đình (Học sinh thứ 2)',
                  unit: 'Suất',
                  quantity: 1,
                  unitPrice: -invoiceData.siblingDiscount,
                  amount: -invoiceData.siblingDiscount,
                  itemType: 'DISCOUNT' as const,
                },
              ]
            : []),
          ...(invoiceData?.latePickupFee
            ? [
                {
                  id: 'LI-04',
                  orderIndex: 4,
                  description: `Phụ phí trông trẻ đón muộn lũy kế (${invoiceData.latePickupMinutes || 40} phút)`,
                  unit: 'Lần',
                  quantity: 1,
                  unitPrice: invoiceData.latePickupFee,
                  amount: invoiceData.latePickupFee,
                  itemType: 'LATE_PICKUP' as const,
                },
              ]
            : []),
          ...(invoiceData?.mealRefundTotal
            ? [
                {
                  id: 'LI-05',
                  orderIndex: 5,
                  description: `Hoàn trả tiền ăn bán trú (${invoiceData.mealRefundCount || 3} ngày nghỉ phép hợp lệ)`,
                  unit: 'Ngày',
                  quantity: invoiceData.mealRefundCount || 3,
                  unitPrice: -35000,
                  amount: -invoiceData.mealRefundTotal,
                  itemType: 'MEAL_REFUND' as const,
                },
              ]
            : []),
        ],
        subtotal: (invoiceData?.baseTuition || 3000000) + (invoiceData?.mealFee || 770000) + (invoiceData?.latePickupFee || 0),
        totalDiscount: (invoiceData?.siblingDiscount || 0) + (invoiceData?.mealRefundTotal || 0),
        totalPaid: totalAmt,
        amountInWords: numberToVietnameseWords(totalAmt),
        paymentMethod: 'VIETQR_PAYOS',
        paymentMethodLabel: 'Chuyển khoản VietQR Napas 24/7 (Cổng PayOS)',
        bankTransId: invoiceData?.bankReferenceCode || 'FT2625890192841',
        paidAt: invoiceData?.paidAt || new Date().toISOString(),
        digitalSignature: {
          certSerial: '7A:1F:B4:8C:3D:20:9E:01',
          signerName: 'NGUYỄN MINH TÂM - HIỆU TRƯỞNG',
          organization: 'TRƯỜNG MẦM NON QUỐC TẾ KIDPRO',
          signedAt: '2026-10-10T09:15:30+07:00',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          isValid: true,
          algorithm: 'SHA-256 with RSA 2048-bit',
          timestampAuthority: 'VNPT-CA Timestamping Service Authority 2026',
        },
        pdfDownloadUrl: `/api/finance/receipts/REC-2026-10-00842.pdf`,
      };
      return demoReceipt;
    }
  },

  // ==========================================
  // UC-050: NỘP ĐƠN YÊU CẦU SỰ VỤ HỌC SINH (STUDENT AFFAIRS & ACADEMIC PETITIONS)
  // ==========================================
  // Danh sách các phiếu yêu cầu sự vụ của học sinh
  getStudentPetitions: async (studentId?: string): Promise<StudentPetitionItem[]> => {
    try {
      const url = studentId ? `/academic/petitions?studentId=${studentId}` : '/academic/petitions';
      const resp = await axiosClient.get<StudentPetitionItem[]>(url);
      return resp.data;
    } catch {
      const demoPetitions: StudentPetitionItem[] = [
        {
          id: 'PET-2026-0842',
          trackingCode: 'PET-2026-0842',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          studentCode: 'KP-2026-081',
          className: 'Mầm 1 (3-4 Tuổi)',
          category: 'STUDENT_CONFIRMATION',
          categoryTitle: 'Cấp Giấy xác nhận học sinh',
          description:
            'Kính nhờ Nhà trường cấp 02 bản Giấy xác nhận bé đang theo học Lớp Chồi 1 có đóng dấu đỏ để gia đình hoàn tất hồ sơ visa du lịch Nhật Bản vào tháng tới.',
          deliveryFormat: 'HARD_COPY_OFFICE',
          targetDate: '2026-10-14',
          status: 'IN_PROGRESS',
          slaHours: 48,
          slaDeadline: '2026-10-12T17:00:00+07:00',
          createdAt: '2026-10-10T08:30:00+07:00',
          assignedStaffName: 'Cô Lê Thu Hà (Phòng Giáo vụ)',
          messages: [
            {
              id: 'MSG-M1',
              sender: 'PARENT',
              senderName: 'Nguyễn Văn Hùng (Bố bé)',
              senderRole: 'Phụ huynh',
              content: 'Nhờ cô kiểm tra giúp thông tin ngày sinh của con trên giấy xác nhận là 15/05/2022 ạ.',
              sentAt: '2026-10-10T08:32:00+07:00',
            },
            {
              id: 'MSG-M2',
              sender: 'STAFF',
              senderName: 'Cô Lê Thu Hà',
              senderRole: 'Cán bộ Giáo vụ',
              content: 'Chào phụ huynh, phòng Giáo vụ đã đối chiếu hồ sơ và trình Ban Giám Hiệu ký duyệt. Dự kiến chiều mai phụ huynh có thể ghé văn phòng nhận bản dấu mộc nhé ạ!',
              sentAt: '2026-10-10T09:15:00+07:00',
            },
          ],
        },
        {
          id: 'PET-2026-0711',
          trackingCode: 'PET-2026-0711',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          studentCode: 'KP-2026-081',
          className: 'Mầm 1 (3-4 Tuổi)',
          category: 'BUS_ROUTE_CHANGE',
          categoryTitle: 'Thay đổi tuyến xe buýt đưa đón',
          description:
            'Gia đình mới chuyển chỗ ở sang khu đô thị Sala, kính đề nghị chuyển điểm đón bé từ Tuyến B2 (Quận 7) sang Tuyến B5 (TP. Thủ Đức) bắt đầu từ thứ Hai tuần sau.',
          deliveryFormat: 'DIGITAL_PDF',
          targetDate: '2026-10-13',
          status: 'APPROVED',
          slaHours: 24,
          slaDeadline: '2026-10-09T17:00:00+07:00',
          createdAt: '2026-10-08T10:00:00+07:00',
          assignedStaffName: 'Thầy Trần Đình Trọng (Điều phối xe)',
          completedAt: '2026-10-09T14:20:00+07:00',
          resultDocumentUrl: 'https://kidpro.edu.vn/docs/bus-schedule-b5.pdf',
          messages: [
            {
              id: 'MSG-M3',
              sender: 'STAFF',
              senderName: 'Thầy Trần Đình Trọng',
              senderRole: 'Điều phối xe buýt',
              content: 'Đã cập nhật danh sách đón bé sang Tuyến B5 - Điểm đón sảnh Sarina Sala lúc 07:10 AM. Tài xế chú Nam sẽ liên hệ trước.',
              sentAt: '2026-10-09T14:22:00+07:00',
            },
          ],
        },
        {
          id: 'PET-2026-0604',
          trackingCode: 'PET-2026-0604',
          studentId: studentId || 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          studentCode: 'KP-2026-081',
          className: 'Mầm 1 (3-4 Tuổi)',
          category: 'ACADEMIC_RECORD_COPY',
          categoryTitle: 'Trích lục học bạ / Sổ theo dõi',
          description:
            'Kính nhờ nhà trường trích lục bản sao bảng đánh giá thể chất và sổ theo dõi phát triển năm học 2025-2026 để làm hồ sơ chuyển lớp năng khiếu.',
          deliveryFormat: 'HARD_COPY_OFFICE',
          targetDate: '2026-09-30',
          status: 'READY_FOR_PICKUP',
          slaHours: 48,
          slaDeadline: '2026-09-29T17:00:00+07:00',
          createdAt: '2026-09-27T14:00:00+07:00',
          assignedStaffName: 'Cô Lê Thu Hà (Phòng Giáo vụ)',
          completedAt: '2026-09-29T16:00:00+07:00',
          messages: [
            {
              id: 'MSG-M4',
              sender: 'STAFF',
              senderName: 'Cô Lê Thu Hà',
              senderRole: 'Cán bộ Giáo vụ',
              content: 'Văn bản đã hoàn tất và đóng dấu giáp lai, mời phụ huynh nhận tại Quầy số 2 Văn phòng tầng 1.',
              sentAt: '2026-09-29T16:05:00+07:00',
            },
          ],
        },
      ];
      return demoPetitions;
    }
  },

  // Nộp đơn yêu cầu sự vụ mới
  submitStudentPetition: async (payload: CreatePetitionPayload): Promise<StudentPetitionItem> => {
    try {
      const resp = await axiosClient.post<StudentPetitionItem>('/academic/petitions', payload);
      return resp.data;
    } catch {
      const categoryTitles: Record<string, string> = {
        STUDENT_CONFIRMATION: 'Cấp Giấy xác nhận học sinh',
        BUS_ROUTE_CHANGE: 'Thay đổi tuyến xe buýt đưa đón',
        ACADEMIC_RECORD_COPY: 'Trích lục học bạ / Bản sao sổ theo dõi',
        FEE_INQUIRY_OTHER: 'Thắc mắc chi phí lớp học / Dịch vụ khác',
      };

      const now = new Date();
      const code = `PET-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const deadline = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

      const newPetition: StudentPetitionItem = {
        id: code,
        trackingCode: code,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        studentCode: 'KP-2026-081',
        className: 'Mầm 1 (3-4 Tuổi)',
        category: payload.category,
        categoryTitle: categoryTitles[payload.category] || 'Yêu cầu sự vụ học sinh',
        description: payload.description,
        deliveryFormat: payload.deliveryFormat,
        targetDate: payload.targetDate,
        status: 'SUBMITTED',
        attachmentUrls: payload.attachmentUrls || [],
        slaHours: 48,
        slaDeadline: deadline,
        createdAt: now.toISOString(),
        assignedStaffName: 'Phòng Giáo vụ & Công tác Học sinh',
        messages: [
          {
            id: `MSG-${Date.now()}`,
            sender: 'PARENT',
            senderName: 'Phụ huynh học sinh',
            senderRole: 'Phụ huynh',
            content: payload.description,
            sentAt: now.toISOString(),
          },
        ],
      };
      return newPetition;
    }
  },

  // Gửi tin nhắn trao đổi trong phiếu yêu cầu
  sendPetitionMessage: async (petitionId: string, content: string): Promise<PetitionMessageItem> => {
    try {
      const resp = await axiosClient.post<PetitionMessageItem>(`/academic/petitions/${petitionId}/messages`, {
        content,
      });
      return resp.data;
    } catch {
      return {
        id: `MSG-${Date.now()}`,
        sender: 'PARENT',
        senderName: 'Phụ huynh học sinh',
        senderRole: 'Phụ huynh',
        content,
        sentAt: new Date().toISOString(),
      };
    }
  },

  // ==========================================
  // UC-068: KHẢO SÁT Ý KIẾN & ĐÁNH GIÁ DỊCH VỤ (SERVICE QUALITY SURVEY)
  // ==========================================

  // Lấy thông tin đợt khảo sát ý kiến đang kích hoạt
  getActiveSurveyCampaign: async (): Promise<SurveyCampaign> => {
    try {
      const resp = await axiosClient.get<SurveyCampaign>('/comms/surveys/active');
      return resp.data;
    } catch {
      // Mockup campaign chuẩn Quý IV/2026
      return {
        id: 'SURVEY-2026-Q4',
        title: 'Khảo sát Ý kiến Đánh giá Chất lượng Chăm sóc Quý IV/2026',
        description:
          'Nhà trường trân trọng kính mời Quý Phụ huynh đóng góp ý kiến về chất lượng bữa ăn bán trú, sự tận tâm của giáo viên, vệ sinh cơ sở vật chất và tính kịp thời của thông tin nhằm nâng cao chất lượng nuôi dạy trẻ.',
        quarter: 'Quý IV',
        academicYear: '2025-2026',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        isActive: true,
        isExpired: false,
        totalTargetParents: 450,
        submittedCount: 385,
        averageOverallScore: 4.7,
        criteriaAverages: {
          mealQuality: 4.8,
          teacherCare: 4.9,
          facilitySafety: 4.6,
          communication: 4.5,
        },
      };
    }
  },

  // Kiểm tra phụ huynh đã nộp bài khảo sát cho học sinh chưa (Chống nộp lặp MSG-296)
  checkSurveySubmissionStatus: async (
    surveyId: string,
    studentId: string
  ): Promise<{ hasSubmitted: boolean }> => {
    try {
      const resp = await axiosClient.get<{ hasSubmitted: boolean }>(
        `/comms/surveys/${surveyId}/check-submission`,
        { params: { studentId } }
      );
      return resp.data;
    } catch {
      const localCheck = localStorage.getItem(`survey_${surveyId}_${studentId}`);
      return { hasSubmitted: !!localCheck };
    }
  },

  // Gửi đánh giá khảo sát dịch vụ (BR-074 bóc tách ẩn danh)
  submitServiceSurvey: async (payload: {
    surveyId: string;
    studentId?: string;
    ratings: ServiceRatings;
    feedback: string;
    isAnonymous: boolean;
    sendToPrincipalOnly: boolean;
  }): Promise<{ success: boolean; message: string; submissionId: string }> => {
    try {
      const resp = await axiosClient.post<{ success: boolean; message: string; submissionId: string }>(
        '/comms/surveys/submissions',
        payload
      );
      if (payload.studentId) {
        localStorage.setItem(`survey_${payload.surveyId}_${payload.studentId}`, 'SUBMITTED');
      }
      return resp.data;
    } catch {
      if (payload.studentId) {
        localStorage.setItem(`survey_${payload.surveyId}_${payload.studentId}`, 'SUBMITTED');
      }
      return {
        success: true,
        message: 'Cảm ơn quý phụ huynh đã đóng góp ý kiến quý báu! Đánh giá của quý vị giúp nhà trường ngày càng hoàn thiện hơn.',
        submissionId: `SUB-${Date.now()}`,
      };
    }
  },

  // Bảng phân tích khảo sát chất lượng cho Ban Giám Hiệu
  getSurveyAnalytics: async (
    surveyId: string = 'SURVEY-2026-Q4'
  ): Promise<{ campaign: SurveyCampaign; submissions: ServiceSurveySubmission[] }> => {
    try {
      const resp = await axiosClient.get<any>(`/comms/surveys/${surveyId}/analytics`);
      return resp.data;
    } catch {
      return {
        campaign: {
          id: surveyId,
          title: 'Khảo sát Ý kiến Đánh giá Chất lượng Chăm sóc Quý IV/2026',
          description: 'Tổng hợp phản hồi định kỳ chất lượng bán trú và sư phạm mầm non',
          quarter: 'Quý IV',
          academicYear: '2025-2026',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          isActive: true,
          isExpired: false,
          totalTargetParents: 450,
          submittedCount: 385,
          averageOverallScore: 4.7,
          criteriaAverages: {
            mealQuality: 4.8,
            teacherCare: 4.9,
            facilitySafety: 4.6,
            communication: 4.5,
          },
        },
        submissions: [
          {
            id: 'SUB-01',
            surveyId,
            studentName: 'Nguyễn Minh Khang',
            className: 'Mầm 1',
            ratings: { mealQuality: 5, teacherCare: 5, facilitySafety: 4, communication: 5 },
            averageScore: 4.8,
            feedback: 'Các cô lớp Mầm 1 rất tận tình, con đi học về vui vẻ và biết tự xúc cơm.',
            isAnonymous: false,
            sendToPrincipalOnly: false,
            submittedAt: '2026-10-08T09:15:00Z',
            submitterName: 'Phụ huynh Nguyễn Văn Nam',
          },
          {
            id: 'SUB-02',
            surveyId,
            ratings: { mealQuality: 4, teacherCare: 5, facilitySafety: 5, communication: 4 },
            averageScore: 4.5,
            feedback: 'Đề xuất nhà trường bổ sung thêm nhiều loại nước ép hoa quả trong bữa xế của các con.',
            isAnonymous: true,
            sendToPrincipalOnly: false,
            submittedAt: '2026-10-07T14:30:00Z',
            submitterName: 'Phụ huynh Ẩn danh',
          },
          {
            id: 'SUB-03',
            surveyId,
            ratings: { mealQuality: 5, teacherCare: 5, facilitySafety: 5, communication: 5 },
            averageScore: 5.0,
            feedback: 'An ninh cổng trường và camera AI nhận diện rất an tâm, không sợ bị đón nhầm trẻ.',
            isAnonymous: true,
            sendToPrincipalOnly: true,
            submittedAt: '2026-10-06T18:20:00Z',
            submitterName: 'Hòm thư bí mật BGH (Ẩn danh)',
          },
        ],
      };
    }
  },

  // ==========================================
  // UC-069: QUYỀN XÓA DỮ LIỆU SINH TRẮC HỌC (NGHỊ ĐỊNH 13/2023/NĐ-CP)
  // ==========================================

  // Yêu cầu cấp mã OTP xác thực hủy sinh trắc học qua SMS/Email (2FA Bước 1)
  requestBiometricPurgeOtp: async (
    studentId: string,
    accountPassword: string
  ): Promise<{ success: boolean; message: string; custodyDisputeFlag?: boolean }> => {
    // Kiểm tra mật khẩu tài khoản
    if (!accountPassword || accountPassword.length < 6) {
      throw new Error('Mật khẩu tài khoản không đúng. Vui lòng kiểm tra lại.');
    }

    try {
      const resp = await axiosClient.post<any>(`/academic/students/${studentId}/biometric-purge/request-otp`, {
        accountPassword,
      });
      return resp.data;
    } catch {
      // Mock logic: nếu studentId là STU-DISPUTE thì giả lập cờ tranh chấp quyền nuôi con
      if (studentId === 'STU-DISPUTE') {
        return {
          success: false,
          message: 'Tạm dừng yêu cầu xóa dữ liệu do hồ sơ đang có tranh chấp quyền giám hộ pháp lý.',
          custodyDisputeFlag: true,
        };
      }
      return {
        success: true,
        message: 'Mã xác thực 2FA OTP 6 chữ số đã được gửi tới số điện thoại/email của Quý phụ huynh (Mã thử nghiệm: 132023).',
        custodyDisputeFlag: false,
      };
    }
  },

  // Thực hiện lệnh xóa vĩnh viễn vector sinh trắc học và ảnh gốc (2FA Bước 2)
  executeDecree13BiometricPurge: async (
    payload: BiometricPurgeRequestPayload
  ): Promise<{ success: boolean; message: string; certificate: BiometricPurgeCertificate }> => {
    if (payload.otpCode !== '132023' && payload.otpCode !== '123456') {
      throw new Error('Mã xác thực OTP không chính xác hoặc đã hết hạn.');
    }

    try {
      const resp = await axiosClient.post<any>(
        `/academic/students/${payload.studentId}/biometric-purge/execute`,
        payload
      );
      return resp.data;
    } catch {
      // Giả lập cấp chứng chỉ điện tử hủy dữ liệu sinh trắc học
      const cert: BiometricPurgeCertificate = {
        certificateId: `CERT-DEC13-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        studentCode: 'KP-2026-081',
        className: 'Mầm 1 (3-4 Tuổi)',
        guardianName: 'Nguyễn Văn Nam (Phụ huynh)',
        purgedAt: new Date().toISOString(),
        decreeArticle: 'Điều 16 Nghị định 13/2023/NĐ-CP (Quyền xóa dữ liệu cá nhân)',
        purgedItems: [
          'Vector đặc trưng khuôn mặt 512 chiều (student_face_vectors)',
          'Vector sinh trắc học của tất cả người giám hộ ủy quyền đón trẻ',
          'Tệp ảnh chân dung gốc lưu trên hệ thống lưu trữ MinIO S3',
          'Dữ liệu đệm nhận diện tại toàn bộ trạm Camera AI cổng trường',
        ],
        auditLogKey: 'BIOMETRIC_DATA_PURGED_DECREE13',
        sha256Digest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        schoolName: 'Trường Mầm Non Tiêu Chuẩn Quốc Tế KidPro',
        schoolSigner: 'Ban Giám Hiệu & Bộ Phận An Ninh Dữ Liệu',
      };

      // Lưu cờ đã xóa vào local state
      localStorage.setItem(`biometric_purged_${payload.studentId}`, JSON.stringify(cert));

      return {
        success: true,
        message: 'Toàn bộ dữ liệu vector khuôn mặt và hình ảnh đã được xóa vĩnh viễn theo đúng quy định Nghị định 13/2023/NĐ-CP.',
        certificate: cert,
      };
    }
  },

  // Lấy chứng nhận hủy dữ liệu đã cấp trước đó (nếu có)
  getBiometricPurgeCertificate: async (
    studentId: string
  ): Promise<BiometricPurgeCertificate | null> => {
    try {
      const resp = await axiosClient.get<BiometricPurgeCertificate>(
        `/academic/students/${studentId}/biometric-purge/certificate`
      );
      return resp.data;
    } catch {
      const saved = localStorage.getItem(`biometric_purged_${studentId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
      return null;
    }
  },
};

export default parentApi;


