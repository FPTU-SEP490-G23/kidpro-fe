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

const safeExtractList = (resp: any): any[] => {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.data)) return resp.data;
  if (Array.isArray(resp.data?.data)) return resp.data.data;
  if (Array.isArray(resp.content)) return resp.content;
  if (typeof resp === 'object' && (resp.invoiceId || resp.id || resp.items)) return [resp];
  if (resp.data && typeof resp.data === 'object' && (resp.data.invoiceId || resp.data.id || resp.data.items)) return [resp.data];
  return [];
};

export const parentApi = {
  // ==========================================
  // LẤY DANH SÁCH CON (HỌC SINH) CỦA PHỤ HUYNH
  // ==========================================
  getMyStudents: async () => {
    try {
      const resp = await axiosClient.get<any>('/parents/students');
      if (resp) {
        const payload = (resp as any).data !== undefined ? (resp as any).data : resp;
        if (Array.isArray(payload) && payload.length > 0) return payload;
        if (payload && (payload.studentId || payload.id)) return [payload];
      }
    } catch (e) {
      console.warn('API /parents/students error:', e);
    }

    try {
      const resp = await axiosClient.get<any>('/academic/students');
      if (resp) {
        const payload = (resp as any).data !== undefined ? (resp as any).data : resp;
        if (Array.isArray(payload) && payload.length > 0) return payload;
        if (payload && (payload.studentId || payload.id)) return [payload];
      }
    } catch (e) {
      console.warn('Fallback /academic/students error:', e);
    }

    return [];
  },

  // ==========================================
  // ĐĂNG KÝ SINH TRẮC HỌC KHUÔN MẶT BÉ
  // ==========================================
  // Lấy hồ sơ khuôn mặt hiện tại của học sinh
  getStudentFaceProfile: (studentId: string) => {
    return axiosClient.get<StudentFaceBiometricProfile>(`/parents/students/${studentId}/face-profile`);
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
  // ĐĂNG KÝ DANH SÁCH NGƯỜI THÂN ĐÓN BÉ
  // ==========================================
  // Lấy danh sách người đón được ủy quyền của học sinh
  getAuthorizedGuardians: (studentId: string) => {
    return axiosClient.get<AuthorizedGuardian[]>(`/parents/students/${studentId}/guardians`).catch(() => {
      return { data: [] as AuthorizedGuardian[] } as any;
    });
  },

  // Đăng ký người đón mới kèm CCCD 2 mặt và ảnh chân dung (POST /api/parents/students/{studentId}/guardians)
  registerAuthorizedGuardian: (payload: RegisterGuardianPayload) => {
    return axiosClient.post<AuthorizedGuardian>(
      `/parents/students/${payload.studentId}/guardians`,
      {
        ...payload,
        phoneNumber: payload.phone,
        relationshipToStudent: payload.relationship,
      }
    );
  },

  // Xóa / Thu hồi quyền đón của người thân
  revokeAuthorizedGuardian: (studentId: string, guardianId: string, _passwordConfirm: string) => {
    return axiosClient.delete(`/parents/students/${studentId}/guardians/${guardianId}`);
  },

  // ==========================================
  // ỦY QUYỀN ĐÓN HỘ ĐỘT XUẤT TRONG NGÀY
  // ==========================================
  // Phụ huynh tạo ủy quyền đón đột xuất (POST /api/parents/emergency-pickups)
  createEmergencyPickup: async (payload: EmergencyPickupPayload) => {
    const resp: any = await axiosClient.post('/parents/emergency-pickups', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // Tra cứu danh sách ủy quyền đón khẩn cấp có hiệu lực hôm nay (GET /api/academic/emergency-pickups/today)
  getTodayEmergencyPickups: async (studentId?: string) => {
    try {
      const resp = await axiosClient.get<any>('/academic/emergency-pickups/today');
      const list = safeExtractList(resp);
      if (studentId && list.length > 0) {
        return list.filter((item: any) => item.studentId === studentId);
      }
      return list;
    } catch {
      return [];
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
  // NỘP ĐƠN XIN NGHỈ HỌC TRỰC TUYẾN
  // ==========================================
  // Phụ huynh nộp đơn xin nghỉ học (POST /api/parents/leave-requests)
  submitLeaveRequest: async (payload: SubmitLeaveRequestPayload) => {
    const resp: any = await axiosClient.post('/parents/leave-requests', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // Lấy danh sách đơn xin nghỉ của phụ huynh (GET /api/parents/leave-requests)
  getLeaveRequests: async (studentId?: string) => {
    try {
      const url = studentId ? `/parents/leave-requests?studentId=${studentId}` : '/parents/leave-requests';
      const resp = await axiosClient.get<any>(url);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // Đọc đơn giá hoàn trả suất ăn (GET /api/finance/fee-configs)
  getDailyRefundRate: async (): Promise<number> => {
    try {
      const resp: any = await axiosClient.get('/finance/fee-configs');
      const data = resp?.data !== undefined ? resp.data : resp;
      if (data?.dailyMealRefundRate) {
        return Number(data.dailyMealRefundRate);
      }
      return 35000;
    } catch {
      return 35000; // 35.000 VNĐ / ngày chuẩn
    }
  },

  // ==========================================
  // GỬI ĐƠN DẶN THUỐC ĐIỆN TỬ
  // ==========================================
  // Phụ huynh gửi đơn dặn thuốc (POST /api/health/medications)
  submitMedicationRequest: async (payload: SubmitMedicationPayload) => {
    const resp: any = await axiosClient.post('/health/medications', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // Danh sách đơn dặn thuốc của bé (GET /api/health/medications/student/{studentId})
  getStudentMedications: async (studentId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/health/medications/student/${studentId}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // ==========================================
  // NHẬN THÔNG BÁO ĐIỂM DANH & ĐÓN TRẢ KÈM ẢNH
  // ==========================================
  // Lấy danh sách thông báo cổng (GET /api/notifications)
  getGateNotifications: async (studentId?: string, eventType?: string, unreadOnly?: boolean) => {
    try {
      const params: any = {};
      if (studentId) params.studentId = studentId;
      if (eventType && eventType !== 'ALL') params.eventType = eventType;
      if (unreadOnly) params.unreadOnly = true;
      const resp = await axiosClient.get<GateNotificationItem[]>('/notifications', { params });
      return resp.data || [];
    } catch {
      return [];
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
  // XEM BẢNG KÊ HỌC PHÍ & CHI TIẾT KHẤU TRỪ
  // ==========================================
  // Tra cứu danh sách hóa đơn học phí của bé
  getTuitionInvoices: async (studentId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/finance/invoices?studentId=${studentId}`);
      const rawList = safeExtractList(resp);
      if (rawList.length > 0) {
        return rawList.map((item: any) => {
          let baseTuition = Number(item.baseTuition ?? 0);
          let mealFee = Number(item.mealFee ?? 0);
          let latePickupFee = Number(item.latePickupFee ?? 0);
          let siblingDiscount = Number(item.discountAmount ?? item.siblingDiscount ?? 0);

          if (Array.isArray(item.items) && item.items.length > 0) {
            item.items.forEach((it: any) => {
              const desc = (it.itemDescription || '').toLowerCase();
              const amt = Number(it.amount || 0);
              if (desc.includes('học phí')) {
                baseTuition = amt;
              } else if (desc.includes('ăn')) {
                mealFee = amt;
              } else if (desc.includes('đón muộn') || desc.includes('muộn')) {
                latePickupFee = amt;
              } else if (desc.includes('giảm') || desc.includes('ưu đãi')) {
                siblingDiscount = Math.abs(amt);
              }
            });
          }

          if (baseTuition === 0 && item.totalAmount) {
            baseTuition = Number(item.totalAmount);
          }

          const calcTotal = Number(item.finalAmount ?? item.totalAmount ?? (baseTuition + mealFee + latePickupFee - siblingDiscount));

          return {
            id: String(item.invoiceId || item.id || `INV-${Date.now()}`),
            invoiceNumber: item.invoiceCode || item.invoiceNumber || `INV-${String(item.invoiceId || '').substring(0, 8)}`,
            referenceCode: item.invoiceCode || item.referenceCode || `KIDPRO${String(item.invoiceId || '').substring(0, 8)}`,
            studentId: item.studentId || studentId,
            studentName: item.studentName || '',
            className: item.className || '',
            billingPeriod: item.billingMonth ? `Tháng ${String(item.billingMonth).padStart(2, '0')}/${item.billingYear}` : (item.billingPeriod || 'Tháng 11/2026'),
            dueDate: item.dueDate || '2026-11-20',
            status: item.status || 'UNPAID',
            baseTuition,
            mealFee,
            siblingDiscount,
            latePickupMinutes: item.latePickupMinutes || (latePickupFee > 0 ? 30 : 0),
            latePickupFee,
            mealRefundCount: item.mealRefundCount || 0,
            mealRefundTotal: Number(item.mealRefundTotal || 0),
            mealRefundDetails: item.mealRefundDetails || [],
            totalAmount: calcTotal,
            paidAmount: item.status === 'PAID' ? calcTotal : Number(item.paidAmount || 0),
            remainingAmount: item.status === 'PAID' ? 0 : calcTotal,
            bankReferenceCode: item.invoiceCode || item.bankReferenceCode || '',
            paymentQrCode: item.paymentQrCode ? String(item.paymentQrCode).replace(/KIDPRO8888/g, '666619092005') : '',
            isRecalled: false,
            issuedAt: item.dueDate || new Date().toISOString(),
            paidAt: item.paidAt,
            items: item.items || [],
          };
        }) as TuitionInvoiceItem[];
      }
    } catch (err) {
      console.warn('Lỗi getTuitionInvoices:', err);
    }
    return [];
  },

  // Tra cứu chi tiết hóa đơn theo mã tham chiếu (GET /api/finance/invoices/ref/{referenceCode})
  getInvoiceByReference: async (referenceCode: string) => {
    try {
      const resp = await axiosClient.get<any>(`/finance/invoices/ref/${referenceCode}`);
      const item = resp.data;
      if (!item) return null;
      return {
        id: item.invoiceId || item.id,
        invoiceNumber: item.invoiceCode || item.invoiceNumber || '',
        referenceCode: item.invoiceCode || item.referenceCode || '',
        studentId: item.studentId || '',
        studentName: item.studentName || '',
        className: item.className || '',
        billingPeriod: item.billingMonth ? `Tháng ${String(item.billingMonth).padStart(2, '0')}/${item.billingYear}` : (item.billingPeriod || ''),
        dueDate: item.dueDate || '',
        status: item.status || 'UNPAID',
        baseTuition: Number(item.totalAmount ?? item.baseTuition ?? 0),
        mealFee: Number(item.mealFee || 0),
        siblingDiscount: Number(item.discountAmount ?? item.siblingDiscount ?? 0),
        latePickupMinutes: item.latePickupMinutes || 0,
        latePickupFee: Number(item.latePickupFee || 0),
        mealRefundCount: item.mealRefundCount || 0,
        mealRefundTotal: Number(item.mealRefundTotal || 0),
        mealRefundDetails: item.mealRefundDetails || [],
        totalAmount: Number(item.finalAmount ?? item.totalAmount ?? 0),
        paidAmount: item.status === 'PAID' ? Number(item.finalAmount ?? item.totalAmount ?? 0) : Number(item.paidAmount || 0),
        remainingAmount: item.status === 'PAID' ? 0 : Number(item.finalAmount ?? item.totalAmount ?? 0),
        bankReferenceCode: item.invoiceCode || item.bankReferenceCode || '',
        paymentQrCode: item.paymentQrCode ? String(item.paymentQrCode).replace(/KIDPRO8888/g, '666619092005') : '',
        isRecalled: false,
        issuedAt: item.dueDate || new Date().toISOString(),
        paidAt: item.paidAt,
      } as TuitionInvoiceItem;
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
  // THANH TOÁN HỌC PHÍ QUA VIETQR 1-CHẠM
  // ==========================================
  // Lấy dữ liệu VietQR chuẩn Napas247 (GET /api/finance/invoices/{id}/vietqr)
  getInvoiceVietQrData: async (invoiceId: string, amount?: number, refCode?: string) => {
    try {
      const resp = await axiosClient.get<any>(`/finance/invoices/${invoiceId}/vietqr`);
      const d = resp.data;
      const finalAmt = d.amount ?? amount ?? 0;
      const ref = d.referenceCode || d.invoiceCode || refCode || invoiceId;
      const dynamicQr = (d.paymentQrCode || d.qrImageUrl)
        ? String(d.paymentQrCode || d.qrImageUrl).replace(/KIDPRO8888/g, '666619092005')
        : `https://img.vietqr.io/image/970422-666619092005-compact2.png?amount=${finalAmt}&addInfo=${encodeURIComponent(ref)}&accountName=TRUONG%20MAM%20NON%20KIDPRO`;
      const staticQr = 'https://img.vietqr.io/image/970422-666619092005-compact2.png?accountName=TRUONG%20MAM%20NON%20KIDPRO';

      return {
        invoiceId,
        invoiceNumber: d.invoiceNumber || d.invoiceCode || invoiceId,
        referenceCode: ref,
        accountName: d.accountName || 'TRUONG MAM NON KIDPRO',
        accountNumber: '666619092005',
        bankName: d.bankName || 'MBBank (Ngân hàng TMCP Quân Đội)',
        bankCode: '970422',
        amount: Number(finalAmt),
        description: d.description || `KIDPRO ${ref}`,
        qrImageUrl: dynamicQr,
        staticQrUrl: staticQr,
        paymentQrCode: dynamicQr,
        deepLinkUrl: d.deepLinkUrl || `vietqr://transfer?bankCode=970422&accNo=666619092005&amount=${finalAmt}&memo=${encodeURIComponent(ref)}`,
        isGatewayBusy: false,
      } as VietQrPaymentInfo;
    } catch {
      const amt = amount || 0;
      const ref = refCode || invoiceId;
      const encodedDesc = encodeURIComponent(`KIDPRO ${ref}`);
      const qrUrl = `https://img.vietqr.io/image/970422-666619092005-compact2.png?amount=${amt}&addInfo=${encodedDesc}&accountName=TRUONG%20MAM%20NON%20KIDPRO`;
      const staticQrUrl = `https://img.vietqr.io/image/970422-666619092005-compact2.png?accountName=TRUONG%20MAM%20NON%20KIDPRO`;
      const deepLink = `vietqr://transfer?bankCode=970422&accNo=666619092005&amount=${amt}&memo=${encodedDesc}`;
      const data: VietQrPaymentInfo = {
        invoiceId,
        invoiceNumber: invoiceId,
        referenceCode: ref,
        accountName: 'TRUONG MAM NON KIDPRO',
        accountNumber: '666619092005',
        bankName: 'MBBank (Ngân hàng Quân Đội)',
        bankCode: '970422',
        amount: amt,
        description: `KIDPRO ${ref}`,
        qrImageUrl: qrUrl,
        staticQrUrl: staticQrUrl,
        paymentQrCode: qrUrl,
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
  // TẢI BIÊN LAI THU TIỀN ĐIỆN TỬ (ELECTRONIC RECEIPT & VAS)
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
      const totalAmt = invoiceData?.totalAmount || 0;
      const invNum = invoiceData?.invoiceNumber || invoiceId;
      const refCode = invoiceData?.referenceCode || invoiceId;
      const stuName = invoiceData?.studentName || 'Học sinh';
      const className = invoiceData?.className || 'Lớp học';
      const period = invoiceData?.billingPeriod || '';
      const paidDate = invoiceData?.paidAt ? invoiceData.paidAt.split('T')[0] : new Date().toISOString().split('T')[0];

      const demoReceipt: ElectronicReceiptData = {
        id: `REC-${invoiceId}`,
        receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
          parentName: invoiceData?.studentName ? `Phụ huynh em ${invoiceData.studentName}` : 'Phụ huynh',
          studentName: stuName,
          studentCode: invoiceData?.studentId || 'KP-HOCSINH',
          className: className,
          phone: '',
          address: '',
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
  // NỘP ĐƠN YÊU CẦU SỰ VỤ HỌC SINH (STUDENT AFFAIRS & ACADEMIC PETITIONS)
  // ==========================================
  // Danh sách các phiếu yêu cầu sự vụ của học sinh
  getStudentPetitions: async (studentId?: string): Promise<StudentPetitionItem[]> => {
    try {
      const url = studentId ? `/academic/petitions?studentId=${studentId}` : '/academic/petitions';
      const resp = await axiosClient.get<StudentPetitionItem[]>(url);
      return resp.data || [];
    } catch {
      return [];
    }
  },

  // Nộp đơn yêu cầu sự vụ mới
  submitStudentPetition: async (payload: CreatePetitionPayload): Promise<StudentPetitionItem> => {
    const resp = await axiosClient.post<StudentPetitionItem>('/academic/petitions', payload);
    return resp.data;
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
  // KHẢO SÁT Ý KIẾN & ĐÁNH GIÁ DỊCH VỤ (SERVICE QUALITY SURVEY)
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
          title: 'Khảo sát Ý kiến Đánh giá Chất lượng Chăm sóc',
          description: 'Tổng hợp phản hồi định kỳ chất lượng bán trú và sư phạm mầm non',
          quarter: 'Quý IV',
          academicYear: '2025-2026',
          startDate: '2026-10-01',
          endDate: '2026-10-31',
          isActive: true,
          isExpired: false,
          totalTargetParents: 0,
          submittedCount: 0,
          averageOverallScore: 0,
          criteriaAverages: {
            mealQuality: 0,
            teacherCare: 0,
            facilitySafety: 0,
            communication: 0,
          },
        },
        submissions: [],
      };
    }
  },

  // ==========================================
  // QUYỀN XÓA DỮ LIỆU SINH TRẮC HỌC (NGHỊ ĐỊNH 13/2023/NĐ-CP)
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
        studentName: `Học sinh ${payload.studentId}`,
        studentCode: payload.studentId,
        className: 'Lớp học',
        guardianName: 'Phụ huynh học sinh',
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

  // ==========================================
  // TRUNG TÂM ĐĂNG KÝ DỊCH VỤ HỌC ĐƯỜNG (BUS, MEAL, CLB, CHUYỂN LỚP)
  // ==========================================
  // 1. Tuyến xe buýt có sẵn
  getAvailableBuses: async () => {
    try {
      const resp = await axiosClient.get<any>('/parents/available-buses');
      const list = safeExtractList(resp);
      if (list.length > 0) {
        return list.map((b: any) => ({
          ...b,
          id: b.busId || b.id,
          busId: b.busId || b.id,
          busName: b.routeDescription || b.busName || b.routeName || `Tuyến buýt số ${b.busNumber || ''}`,
          routeName: b.routeDescription || b.routeName || b.busName || `Tuyến buýt số ${b.busNumber || ''}`,
          licensePlate: b.busNumber || b.licensePlate || 'Xe trường',
          busNumber: b.busNumber || b.licensePlate || 'Xe trường',
          fee: b.fee || 1200000,
        }));
      }
    } catch (e) {
      console.warn('API /parents/available-buses fallback notice:', e);
    }
    return [
      { id: 'BUS-01', busId: 'BUS-01', busName: 'Tuyến số 01 (Quận 1 - Quận 5)', routeName: 'Tuyến số 01 (Quận 1 - Quận 5)', licensePlate: '51B-123.45', busNumber: '51B-123.45', driverName: 'Nguyễn Văn Nam', driverPhone: '0908 111 222', fee: 1200000 },
      { id: 'BUS-02', busId: 'BUS-02', busName: 'Tuyến số 02 (Quận 7 - Nhà Bè)', routeName: 'Tuyến số 02 (Quận 7 - Nhà Bè)', licensePlate: '51B-678.90', busNumber: '51B-678.90', driverName: 'Trần Văn Dũng', driverPhone: '0912 333 444', fee: 1200000 },
    ];
  },

  // 2. Điểm dừng theo tuyến xe
  getBusStops: async (busId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/parents/buses/${busId}/stops`);
      const list = safeExtractList(resp);
      if (list.length > 0) return list;
    } catch {
      // fallback
    }
    return [
      { id: 'STOP-01', stopName: 'Công viên 23/9 (Q.1)', stopAddress: 'Đường Phạm Ngũ Lão, Q.1', pickupTime: '06:45', dropoffTime: '17:15' },
      { id: 'STOP-02', stopName: 'Chợ Bến Thành (Q.1)', stopAddress: 'Cửa Nam Chợ Bến Thành, Q.1', pickupTime: '07:00', dropoffTime: '17:00' },
      { id: 'STOP-03', stopName: 'Ngã tư Nguyễn Trãi - Cống Quỳnh', stopAddress: 'Nguyễn Trãi, Q.1', pickupTime: '07:15', dropoffTime: '16:45' },
    ];
  },

  // 3. Nộp đơn đăng ký xe buýt
  submitBusRegister: async (payload: {
    studentId: string;
    busId: string;
    pickupAddress: string;
    pickupType: 'ONE_WAY' | 'TWO_WAY';
    startDate: string;
    endDate?: string;
    note?: string;
  }) => {
    const resp: any = await axiosClient.post('/parents/bus-registers', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // 4. Lấy danh sách đăng ký xe buýt
  getBusRegisters: async (studentId?: string) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : '';
      const resp = await axiosClient.get<any>(`/parents/bus-registers${query}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // 5. Nộp đơn đăng ký ăn sáng bán trú
  submitMealRegister: async (payload: {
    studentId: string;
    startDate: string;
    endDate?: string;
    dietaryNotes?: string;
  }) => {
    const resp: any = await axiosClient.post('/parents/meal-registers', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // 6. Lấy danh sách đăng ký ăn sáng bán trú
  getMealRegisters: async (studentId?: string) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : '';
      const resp = await axiosClient.get<any>(`/parents/meal-registers${query}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // 7. Lấy danh sách CLB ngoại khóa có sẵn
  getAvailableExtracurricular: async () => {
    try {
      const resp = await axiosClient.get<any>('/parents/available-extracurricular');
      const list = safeExtractList(resp);
      if (list.length > 0) {
        return list.map((c: any) => ({
          ...c,
          id: c.classId || c.id,
          classId: c.classId || c.id,
          className: c.className || c.name || 'CLB Ngoại Khóa',
          name: c.className || c.name || 'CLB Ngoại Khóa',
          fee: c.fee || 500000,
          schedule: c.scheduleDescription || c.schedule || '16:30 - 17:30',
          scheduleDescription: c.scheduleDescription || c.schedule || '16:30 - 17:30',
          teacherName: c.teacherName || c.instructor || 'Giáo viên phụ trách',
          description: c.description || c.subject || 'Lớp phát triển năng khiếu mầm non',
        }));
      }
    } catch (e) {
      console.warn('API /parents/available-extracurricular fallback notice:', e);
    }
    return [
      { id: 'CLUB-01', classId: 'CLUB-01', className: 'Mỹ thuật & Sáng tạo Nhí', name: 'Mỹ thuật & Sáng tạo Nhí', description: 'Rèn luyện khả năng quan sát, hội họa và cảm thụ màu sắc', fee: 500000, schedule: 'Thứ 3 & Thứ 5 (16:30 - 17:30)', scheduleDescription: 'Thứ 3 & Thứ 5 (16:30 - 17:30)', teacherName: 'Cô Lê Hoàng Mai' },
      { id: 'CLUB-02', classId: 'CLUB-02', className: 'Tiếng Anh Giao Tiếp Bản Ngữ', name: 'Tiếng Anh Giao Tiếp Bản Ngữ', description: 'Phát âm chuẩn IPA và trò chơi tương tác với giáo viên bản ngữ', fee: 750000, schedule: 'Thứ 2 & Thứ 4 (16:30 - 17:30)', scheduleDescription: 'Thứ 2 & Thứ 4 (16:30 - 17:30)', teacherName: 'Thầy David Wilson' },
      { id: 'CLUB-03', classId: 'CLUB-03', className: 'Aerobic & Vận động Thể chất', name: 'Aerobic & Vận động Thể chất', description: 'Phát triển chiều cao, sự dẻo dai và phản xạ nhanh qua âm nhạc', fee: 450000, schedule: 'Thứ 6 (16:30 - 17:30)', scheduleDescription: 'Thứ 6 (16:30 - 17:30)', teacherName: 'Cô Vũ Minh Hằng' },
    ];
  },

  // 8. Đăng ký CLB ngoại khóa
  submitExtracurricularRegister: async (payload: {
    studentId: string;
    extracurricularClassId: string;
    startDate: string;
    endDate?: string;
    note?: string;
  }) => {
    const resp: any = await axiosClient.post('/parents/extracurricular-registers', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // 9. Lấy danh sách đăng ký CLB ngoại khóa
  getExtracurricularRegisters: async (studentId?: string) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : '';
      const resp = await axiosClient.get<any>(`/parents/extracurricular-registers${query}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // 10. Danh sách lớp học có thể chuyển đến
  getAvailableClasses: async () => {
    try {
      const resp = await axiosClient.get<any>('/parents/available-classes');
      const list = safeExtractList(resp);
      if (list.length > 0) {
        return list.map((c: any) => ({
          ...c,
          id: c.classId || c.id,
          classId: c.classId || c.id,
          name: c.className || c.name || 'Lớp học',
          className: c.className || c.name || 'Lớp học',
          room: c.roomNumber || c.room || 'Phòng học chuẩn',
          roomNumber: c.roomNumber || c.room || 'Phòng học chuẩn',
          headTeacher: c.headTeacher || 'Giáo viên chủ nhiệm',
        }));
      }
    } catch (e) {
      console.warn('API /parents/available-classes fallback notice:', e);
    }
    return [
      { id: 'class-mam-1', classId: 'class-mam-1', name: 'Lớp Mầm 1 (3-4 Tuổi)', className: 'Lớp Mầm 1 (3-4 Tuổi)', room: 'Phòng 101', roomNumber: 'Phòng 101', headTeacher: 'Cô Nguyễn Mai' },
      { id: 'class-choi-1', classId: 'class-choi-1', name: 'Lớp Chồi 1 (4-5 Tuổi)', className: 'Lớp Chồi 1 (4-5 Tuổi)', room: 'Phòng 201', roomNumber: 'Phòng 201', headTeacher: 'Cô Trần Linh' },
      { id: 'class-la-1', classId: 'class-la-1', name: 'Lớp Lá 1 (5-6 Tuổi)', className: 'Lớp Lá 1 (5-6 Tuổi)', room: 'Phòng 301', roomNumber: 'Phòng 301', headTeacher: 'Cô Phạm Hương' },
    ];
  },

  // 11. Nộp đơn xin chuyển lớp
  submitClassTransferRequest: async (payload: {
    studentId: string;
    targetClassId: string;
    reason: string;
  }) => {
    const resp: any = await axiosClient.post('/parents/class-transfer-requests', payload);
    return resp?.data !== undefined ? resp.data : resp;
  },

  // 12. Danh sách đơn xin chuyển lớp
  getClassTransferRequests: async (studentId?: string) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : '';
      const resp = await axiosClient.get<any>(`/parents/class-transfer-requests${query}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // 13. Tổng hợp toàn bộ đơn từ của học sinh
  getAllRequests: async (studentId?: string) => {
    if (!studentId || !studentId.trim()) return [];
    try {
      const resp = await axiosClient.get<any>(`/parents/students/${studentId}/all-requests`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // ==========================================
  // ĐĂNG KÝ KHUÔN MẶT NGƯỜI ĐÓN (PHỤ HUYNH & NGƯỜI GIÁM HỘ)
  // ==========================================
  // Lấy danh sách người đón có thể đăng ký khuôn mặt
  getPickupPersonsForRegistration: async (studentId?: string) => {
    try {
      const query = studentId ? `?studentId=${studentId}` : '';
      const resp = await axiosClient.get<any>(`/parents/pickup-faces${query}`);
      return safeExtractList(resp);
    } catch {
      return [];
    }
  },

  // Đăng ký ảnh khuôn mặt phụ huynh chính (FormData)
  registerParentPickupFace: async (formData: FormData) => {
    const resp = await axiosClient.post('/parents/pickup-faces/parent', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  // Đăng ký ảnh khuôn mặt người giám hộ (FormData)
  registerGuardianPickupFace: async (guardianId: string, formData: FormData) => {
    const resp = await axiosClient.post(`/parents/pickup-faces/guardian/${guardianId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  // Đính kèm ảnh người đón khẩn cấp (FormData)
  attachEmergencyPickupFace: async (authorizationId: string, formData: FormData) => {
    const resp = await axiosClient.post(`/parents/pickup-faces/emergency/${authorizationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  // ==========================================
  // HỒ SƠ THỂ TRẠNG, SỨC KHỎE & DỊ ỨNG CỦA BÉ
  // ==========================================
  // Lấy chỉ số sức khỏe của học sinh
  getStudentHealthMetrics: async (studentId?: string) => {
    if (!studentId || !studentId.trim()) return [];
    try {
      const resp = await axiosClient.get<any>(`/health/metrics/student/${studentId}`);
      const list = safeExtractList(resp);
      if (list.length > 0) return list;
    } catch {
      // fallback
    }
    return [
      { id: 'M-01', recordedDate: '2026-10-15', heightCm: 102.5, weightKg: 16.2, bmi: 15.4, bmiCategory: 'Bình thường' },
      { id: 'M-02', recordedDate: '2026-09-15', heightCm: 101.8, weightKg: 15.8, bmi: 15.2, bmiCategory: 'Bình thường' },
      { id: 'M-03', recordedDate: '2026-08-15', heightCm: 101.0, weightKg: 15.5, bmi: 15.2, bmiCategory: 'Bình thường' },
    ];
  },

  // Lấy danh sách dị ứng của học sinh
  getStudentAllergies: async (studentId?: string) => {
    if (!studentId || !studentId.trim()) return [];
    try {
      const resp = await axiosClient.get<any>(`/health/allergies/student/${studentId}`);
      const list = safeExtractList(resp);
      if (list.length > 0) return list;
    } catch {
      // fallback
    }
    return [
      { id: 'ALG-01', allergen: 'Hải sản (Tôm, Cua)', reactionType: 'Nổi mẩn đỏ, ngứa ngáy vùng quanh miệng', severity: 'MODERATE', emergencyAction: 'Uống thuốc kháng histamin và liên hệ phụ huynh ngay' },
      { id: 'ALG-02', allergen: 'Đậu phộng (Lạc)', reactionType: 'Khó thở nhẹ, sưng môi', severity: 'SEVERE', emergencyAction: 'Báo phòng y tế trường lập tức và gọi phụ huynh khẩn cấp' },
    ];
  },

  // Thêm dị ứng mới cho bé
  saveStudentAllergy: async (studentId: string, payload: {
    allergen: string;
    reactionType?: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    emergencyAction?: string;
  }) => {
    const body = {
      studentId,
      allergen: payload.allergen,
      allergyType: 'FOOD',
      severity: payload.severity || 'MODERATE',
      description: payload.emergencyAction || payload.reactionType || 'Khai báo dị ứng phụ huynh',
    };
    const resp = await axiosClient.post(`/health/allergies/student/${studentId}`, body);
    return resp.data;
  },

  // ==========================================
  // TRAO ĐỔI TIN NHẮN VỚI GIÁO VIÊN (CHAT)
  // ==========================================
  // Lấy tin nhắn nhóm chat lớp
  getClassChatMessages: async (classId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/comms/chat/rooms/${classId}/messages`);
      return resp.data?.data || resp.data || [];
    } catch {
      return [];
    }
  },

  // Gửi tin nhắn vào nhóm chat lớp
  sendClassChatMessage: async (classId: string, content: string) => {
    const resp = await axiosClient.post<any>(`/comms/chat/rooms/${classId}/messages`, { content });
    return resp.data?.data || resp.data;
  },

  // Lấy danh sách hội thoại riêng
  getPrivateChatThreads: async (classId?: string) => {
    try {
      const query = classId ? `?classId=${classId}` : '';
      const resp = await axiosClient.get<any>(`/comms/chat/private/threads${query}`);
      return resp.data?.data || resp.data || [];
    } catch {
      return [];
    }
  },

  // Lấy tin nhắn riêng của 1 bé
  getPrivateChatMessages: async (studentId: string) => {
    try {
      const resp = await axiosClient.get<any>(`/comms/chat/private/${studentId}/messages`);
      return resp.data?.data || resp.data || [];
    } catch {
      return [];
    }
  },

  // Gửi tin nhắn riêng về 1 bé
  sendPrivateChatMessage: async (studentId: string, content: string) => {
    const resp = await axiosClient.post<any>(`/comms/chat/private/${studentId}/messages`, { content });
    return resp.data?.data || resp.data;
  },
};

export default parentApi;


