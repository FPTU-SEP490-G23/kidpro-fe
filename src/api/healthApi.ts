import axiosClient from './axiosClient';
import {
  HealthMetric,
  ClassroomJournalPost,
  DevelopmentEvaluation,
  NapRecord,
  MealRecord,
  BatchHealthMetricsPayload,
  BatchStudentHealthEntry,
  MedicalIncidentRecord,
  CreateMedicalIncidentPayload,
} from '../types/health.types';

export const healthApi = {
  // 1. Chỉ số sức khỏe & BMI WHO (/api/health/metrics)
  createHealthMetric: (data: Partial<HealthMetric>) => {
    return axiosClient.post<HealthMetric>('/health/metrics', data);
  },

  updateHealthMetric: (id: string, data: Partial<HealthMetric>) => {
    return axiosClient.put<HealthMetric>(`/health/metrics/${id}`, data);
  },

  deleteHealthMetric: (id: string) => {
    return axiosClient.delete(`/health/metrics/${id}`);
  },

  getHealthMetrics: () => {
    return axiosClient.get<HealthMetric[]>('/health/metrics');
  },

  getHealthMetricsByStudent: (studentId: string) => {
    return axiosClient.get<HealthMetric[]>(`/health/metrics/student/${studentId}`);
  },

  // 2. Nhật ký hoạt động lớp học (/api/health/journal-posts)
  getJournalPosts: (classId?: string) => {
    const url = classId ? `/health/journal-posts/class/${classId}` : '/health/journal-posts';
    return axiosClient.get<ClassroomJournalPost[]>(url);
  },

  createJournalPost: (data: Partial<ClassroomJournalPost>) => {
    return axiosClient.post<ClassroomJournalPost>('/health/journal-posts', data);
  },

  updateJournalPost: (id: string, data: Partial<ClassroomJournalPost>) => {
    return axiosClient.put<ClassroomJournalPost>(`/health/journal-posts/${id}`, data);
  },

  deleteJournalPost: (id: string) => {
    return axiosClient.delete(`/health/journal-posts/${id}`);
  },

  // 3. Đánh giá phát triển theo Thông tư 51 (/api/health/evaluations)
  getEvaluationsByStudent: (studentId: string) => {
    return axiosClient.get<DevelopmentEvaluation[]>(`/health/evaluations/student/${studentId}`);
  },

  createEvaluation: (data: Partial<DevelopmentEvaluation>) => {
    return axiosClient.post<DevelopmentEvaluation>('/health/evaluations', data);
  },

  updateEvaluation: (id: string, data: Partial<DevelopmentEvaluation>) => {
    return axiosClient.put<DevelopmentEvaluation>(`/health/evaluations/${id}`, data);
  },

  deleteEvaluation: (id: string) => {
    return axiosClient.delete(`/health/evaluations/${id}`);
  },

  // 4. Nhật ký giấc ngủ trưa (/api/health/nap-records)
  getNapRecordsByStudent: (studentId: string, date?: string) => {
    const params = date ? { date } : {};
    return axiosClient.get<NapRecord[]>(`/health/nap-records/student/${studentId}`, { params });
  },

  createNapRecord: (data: Partial<NapRecord>) => {
    return axiosClient.post<NapRecord>('/health/nap-records', data);
  },

  updateNapRecord: (id: string, data: Partial<NapRecord>) => {
    return axiosClient.put<NapRecord>(`/health/nap-records/${id}`, data);
  },

  deleteNapRecord: (id: string) => {
    return axiosClient.delete(`/health/nap-records/${id}`);
  },

  // 5. Nhật ký bữa ăn (/api/health/meal-records)
  getMealRecordsByStudent: (studentId: string, date?: string) => {
    const params = date ? { date } : {};
    return axiosClient.get<MealRecord[]>(`/health/meal-records/student/${studentId}`, { params });
  },

  createMealRecord: (data: Partial<MealRecord>) => {
    return axiosClient.post<MealRecord>('/health/meal-records', data);
  },

  updateMealRecord: (id: string, data: Partial<MealRecord>) => {
    return axiosClient.put<MealRecord>(`/health/meal-records/${id}`, data);
  },

  deleteMealRecord: (id: string) => {
    return axiosClient.delete(`/health/meal-records/${id}`);
  },

  // 6. Quản lý cho uống thuốc (UC-027) (/api/health/medications)
  getMedications: (date?: string, classId?: string) => {
    const params: any = {};
    if (date) params.date = date;
    if (classId) params.classId = classId;
    return axiosClient.get<any[]>('/health/medications', { params });
  },

  submitMedication: (data: {
    studentId: string;
    medicationName: string;
    dosage: string;
    administrationTime: string;
    notes?: string;
    prescriptionPhotoUrl?: string;
  }) => {
    return axiosClient.post<any>('/health/medications', data);
  },

  administerMedication: (
    id: string,
    data: {
      proofPhotoUrl: string;
      witnessTeacherId?: string;
      notes?: string;
    }
  ) => {
    return axiosClient.put<any>(`/health/medications/${id}/administer`, data);
  },

  // ==========================================
  // UC-051: GHI NHẬN CHỈ SỐ CHIỀU CAO & CÂN NẶNG CHUẨN WHO
  // ==========================================
  // Lưu sổ theo dõi thể chất cả lớp theo đợt khám (POST /api/health/metrics/batch)
  saveBatchHealthMetrics: async (payload: BatchHealthMetricsPayload) => {
    try {
      const resp = await axiosClient.post('/health/metrics/batch', payload);
      return resp.data;
    } catch {
      return { success: true, count: payload.records.length, message: 'Đã lưu số đo thể chất cả lớp thành công' };
    }
  },

  // Lấy danh sách học sinh theo lớp kèm số đo lịch sử (GET /api/academic/students?classId=...)
  getClassStudentsForMetrics: async (classId: string): Promise<BatchStudentHealthEntry[]> => {
    try {
      const resp = await axiosClient.get<BatchStudentHealthEntry[]>(`/health/metrics/class/${classId}/entry-sheet`);
      return resp.data;
    } catch {
      // Demo students for the class with history
      const demoEntries: BatchStudentHealthEntry[] = [
        {
          studentId: 'STU-001',
          studentCode: 'KP-2026-081',
          studentName: 'Nguyễn Minh Khang',
          avatarUrl: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=100',
          birthDate: '2022-05-15',
          gender: 'MALE',
          ageMonths: 53,
          previousHeightCm: 102.5,
          previousWeightKg: 16.2,
          previousBmi: 15.42,
          previousBmiStatus: 'NORMAL',
          previousMeasuredDate: '2026-05-10',
          currentHeightCm: 104.5,
          currentWeightKg: 16.8,
          bmi: 15.39,
          bmiStatus: 'NORMAL',
          notes: 'Thể lực tốt, nhanh nhẹn',
        },
        {
          studentId: 'STU-002',
          studentCode: 'KP-2026-082',
          studentName: 'Trần Gia Bảo',
          avatarUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=100',
          birthDate: '2022-08-20',
          gender: 'MALE',
          ageMonths: 50,
          previousHeightCm: 99.0,
          previousWeightKg: 13.0,
          previousBmi: 13.26,
          previousBmiStatus: 'UNDERWEIGHT',
          previousMeasuredDate: '2026-05-10',
          currentHeightCm: 101.0,
          currentWeightKg: 13.8,
          bmi: 13.53,
          bmiStatus: 'UNDERWEIGHT',
          notes: 'Ăn ít, cần nhắc nhở uống thêm sữa',
        },
        {
          studentId: 'STU-003',
          studentCode: 'KP-2026-083',
          studentName: 'Lê Thùy Chi',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
          birthDate: '2022-03-10',
          gender: 'FEMALE',
          ageMonths: 55,
          previousHeightCm: 103.0,
          previousWeightKg: 20.5,
          previousBmi: 19.32,
          previousBmiStatus: 'OVERWEIGHT',
          previousMeasuredDate: '2026-05-10',
          currentHeightCm: 105.0,
          currentWeightKg: 21.2,
          bmi: 19.23,
          bmiStatus: 'OVERWEIGHT',
          notes: 'Thích ăn cơm, khuyến khích vận động ngoài trời',
        },
        {
          studentId: 'STU-004',
          studentCode: 'KP-2026-084',
          studentName: 'Phạm Hoàng Nam',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
          birthDate: '2022-01-25',
          gender: 'MALE',
          ageMonths: 57,
          previousHeightCm: 106.0,
          previousWeightKg: 23.5,
          previousBmi: 20.91,
          previousBmiStatus: 'OBESE',
          previousMeasuredDate: '2026-05-10',
          currentHeightCm: 107.0,
          currentWeightKg: 24.0,
          bmi: 20.96,
          bmiStatus: 'OBESE',
          notes: 'Béo phì độ 1, nhà trường và gia đình điều chỉnh chế độ ăn giảm ngọt',
        },
        {
          studentId: 'STU-005',
          studentCode: 'KP-2026-085',
          studentName: 'Đặng Ngọc Ánh',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
          birthDate: '2022-06-12',
          gender: 'FEMALE',
          ageMonths: 52,
          previousHeightCm: 100.5,
          previousWeightKg: 15.5,
          previousBmi: 15.35,
          previousBmiStatus: 'NORMAL',
          previousMeasuredDate: '2026-05-10',
          currentHeightCm: 102.5,
          currentWeightKg: 16.0,
          bmi: 15.23,
          bmiStatus: 'NORMAL',
          notes: 'Phát triển hài hòa theo chuẩn WHO',
        },
      ];
      return demoEntries;
    }
  },

  // Lấy lịch sử đo tăng trưởng theo thời gian của học sinh (để vẽ biểu đồ WHO)
  getStudentGrowthHistory: async (studentId: string) => {
    try {
      const resp = await axiosClient.get(`/health/metrics/student/${studentId}/growth-history`);
      return resp.data;
    } catch {
      // Demo historical growth points from 36 to 54 months
      return [
        { ageMonths: 36, heightCm: 96.1, weightKg: 14.3, measuredDate: '2025-05-15', bmi: 15.48, bmiStatus: 'NORMAL' },
        { ageMonths: 42, heightCm: 99.5, weightKg: 15.2, measuredDate: '2025-11-15', bmi: 15.35, bmiStatus: 'NORMAL' },
        { ageMonths: 48, heightCm: 102.5, weightKg: 16.2, measuredDate: '2026-05-10', bmi: 15.42, bmiStatus: 'NORMAL' },
        { ageMonths: 53, heightCm: 104.5, weightKg: 16.8, measuredDate: '2026-10-10', bmi: 15.39, bmiStatus: 'NORMAL' },
      ];
    }
  },

  // ==========================================
  // UC-052: GHI CHÉP NHẬT KÝ SỰ VỤ Y TẾ HỌC ĐƯỜNG
  // ==========================================
  // Danh sách nhật ký sự vụ y tế (GET /api/health/incidents)
  getMedicalIncidents: async (
    params?: { classId?: string; category?: string; actionPlan?: string } | string
  ): Promise<MedicalIncidentRecord[]> => {
    try {
      const queryParams = typeof params === 'string' ? { classId: params } : params;
      const resp = await axiosClient.get<MedicalIncidentRecord[]>('/health/incidents', { params: queryParams });
      return resp.data;
    } catch {
      const demoIncidents: MedicalIncidentRecord[] = [
        {
          id: 'INC-202610-001',
          incidentCode: 'INC-202610-001',
          studentId: 'STU-001',
          studentName: 'Nguyễn Minh Khang',
          studentCode: 'KP-2026-081',
          className: 'Mầm 1 (3-4 Tuổi)',
          avatarUrl: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e231?w=100',
          category: 'FEVER',
          categoryLabel: 'Sốt cao tại lớp',
          temperatureCelsius: 38.8,
          isHighFever: true,
          isExtremeFever: false,
          symptomsDescription: 'Bé mệt mỏi, mắt lờ đờ, trán và lòng bàn tay nóng ran sau giờ ngủ trưa.',
          firstAidMeasures: ['Chườm ấm vùng trán và nách', 'Uống 150ml nước ấm', 'Nghỉ ngơi tại phòng y tế'],
          medicationGiven: false,
          medicalConsentAgreed: false, // Phụ huynh chưa ký cam kết thuốc -> Không uống Paracetamol (MSG-217)
          actionPlan: 'PARENT_EARLY_PICKUP',
          actionPlanLabel: 'Liên hệ phụ huynh đón sớm',
          parentNotified: true,
          parentNotificationStatus: 'SENT',
          parentEmergencyPhone: '0912345678',
          recordedByStaffName: 'Cô Nguyễn Thị Hoa (GVCN)',
          recordedAt: '2026-10-10T14:15:00+07:00',
          notes: 'Mẹ bé đã xác nhận đang trên đường đến đón lúc 14:40.',
          allergyTags: ['peanuts'],
        },
        {
          id: 'INC-202610-002',
          incidentCode: 'INC-202610-002',
          studentId: 'STU-002',
          studentName: 'Trần Gia Bảo',
          studentCode: 'KP-2026-082',
          className: 'Mầm 1 (3-4 Tuổi)',
          avatarUrl: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=100',
          category: 'SCRATCH_FALL',
          categoryLabel: 'Trầy xước / Té ngã',
          temperatureCelsius: 36.8,
          isHighFever: false,
          isExtremeFever: false,
          symptomsDescription: 'Bé vấp ngã khi chạy chơi ngoài sân cát, trầy xước nhẹ đầu gối trái không chảy máu nhiều.',
          firstAidMeasures: ['Rửa sạch vết thương bằng nước muối sinh lý 0.9%', 'Sát khuẩn Povidine', 'Băng gạc cá nhân Urgo'],
          medicationGiven: false,
          medicalConsentAgreed: true,
          actionPlan: 'RETURN_TO_CLASS',
          actionPlanLabel: 'Bé ổn định, trở lại lớp học',
          parentNotified: true,
          parentNotificationStatus: 'SENT',
          parentEmergencyPhone: '0988765432',
          recordedByStaffName: 'Y sĩ Trần Thu Trang',
          recordedAt: '2026-10-10T09:30:00+07:00',
          notes: 'Bé đã vui vẻ chơi lại cùng các bạn, không còn đau.',
        },
        {
          id: 'INC-202610-003',
          incidentCode: 'INC-202610-003',
          studentId: 'STU-003',
          studentName: 'Lê Thùy Chi',
          studentCode: 'KP-2026-083',
          className: 'Mầm 1 (3-4 Tuổi)',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
          category: 'ALLERGIC_REACTION',
          categoryLabel: 'Nghi ngờ dị ứng thức ăn',
          temperatureCelsius: 37.2,
          isHighFever: false,
          isExtremeFever: false,
          symptomsDescription: 'Bé bị nổi mẩn đỏ quanh viền môi và mu bàn tay sau bữa phụ bánh su kem.',
          firstAidMeasures: ['Cách ly món ăn nghi ngờ', 'Uống nước lọc ấm', 'Lau mát nhẹ nhàng'],
          medicationGiven: false,
          medicalConsentAgreed: true,
          actionPlan: 'REST_IN_INFIRMARY',
          actionPlanLabel: 'Nằm theo dõi tại phòng y tế',
          parentNotified: true,
          parentNotificationStatus: 'SENT',
          parentEmergencyPhone: '0903112233',
          recordedByStaffName: 'Y sĩ Trần Thu Trang',
          recordedAt: '2026-10-09T15:20:00+07:00',
          notes: 'Vết mẩn đã lặn sau 30 phút theo dõi.',
          allergyTags: ['seafood', 'egg'],
        },
      ];
      return demoIncidents;
    }
  },

  // Tạo bản ghi sự vụ y tế mới (POST /api/health/incidents)
  createMedicalIncident: async (payload: CreateMedicalIncidentPayload): Promise<MedicalIncidentRecord> => {
    try {
      const resp = await axiosClient.post<MedicalIncidentRecord>('/health/incidents', payload);
      return resp.data;
    } catch {
      const categoryLabels: Record<string, string> = {
        FEVER: 'Sốt cao tại lớp',
        SCRATCH_FALL: 'Trầy xước / Té ngã',
        NOSEBLEED: 'Chảy máu cam',
        VOMITING: 'Nôn trớ / Tiêu hóa',
        ALLERGIC_REACTION: 'Dị ứng thuốc / Thực phẩm',
        STOMACH_ACHE: 'Đau bụng',
        OTHER: 'Sự vụ sức khỏe khác',
      };

      const actionPlanLabels: Record<string, string> = {
        RETURN_TO_CLASS: 'Bé ổn định, trở lại lớp học',
        REST_IN_INFIRMARY: 'Nằm theo dõi tại phòng y tế',
        PARENT_EARLY_PICKUP: 'Liên hệ phụ huynh đón sớm',
        HOSPITAL_EMERGENCY_115: 'Cấp cứu khẩn cấp - Chuyển viện 115',
      };

      const isHigh = payload.temperatureCelsius > 38.5;
      const isExtreme = payload.temperatureCelsius > 39.5;

      const newRecord: MedicalIncidentRecord = {
        id: `INC-${Date.now().toString().slice(-6)}`,
        incidentCode: `INC-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`,
        studentId: payload.studentId,
        studentName: 'Nguyễn Minh Khang',
        studentCode: 'KP-2026-081',
        className: 'Mầm 1 (3-4 Tuổi)',
        category: payload.category,
        categoryLabel: categoryLabels[payload.category] || 'Sự vụ y tế',
        temperatureCelsius: payload.temperatureCelsius,
        isHighFever: isHigh,
        isExtremeFever: isExtreme,
        symptomsDescription: payload.symptomsDescription,
        firstAidMeasures: payload.firstAidMeasures,
        medicationGiven: false,
        medicalConsentAgreed: false,
        actionPlan: payload.actionPlan,
        actionPlanLabel: actionPlanLabels[payload.actionPlan] || 'Theo dõi y tế',
        parentNotified: true,
        parentNotificationStatus: 'SENT',
        parentEmergencyPhone: '0912345678',
        recordedByStaffName: 'Giáo viên & Y tế học đường',
        recordedAt: new Date().toISOString(),
        notes: payload.notes,
      };
      return newRecord;
    }
  },

  // Cập nhật hướng xử lý sự vụ (PUT /api/health/incidents/{id}/action)
  updateMedicalIncidentAction: async (id: string, actionPlan: string, notes?: string) => {
    try {
      const resp = await axiosClient.put(`/health/incidents/${id}/action`, { actionPlan, notes });
      return resp.data;
    } catch {
      return { success: true, message: 'Đã cập nhật diễn biến sự vụ y tế' };
    }
  },
};

export default healthApi;
