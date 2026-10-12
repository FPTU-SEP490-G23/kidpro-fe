import axiosClient from './axiosClient';
import {
  StudentRecord,
  StudentMobilityItem,
  StudentMobilitySummary,
} from '../types/studentAnalytics.types';

function mapStudentDtoToRecord(dto: any): StudentRecord {
  let allergyTags: string[] = [];
  if (Array.isArray(dto.allergyTags)) {
    allergyTags = dto.allergyTags;
  } else if (typeof dto.allergyTags === 'string' && dto.allergyTags.trim()) {
    allergyTags = dto.allergyTags.split(',').map((t: string) => t.trim()).filter(Boolean);
  }
  if (dto.allergyInfo && !allergyTags.includes(dto.allergyInfo)) {
    allergyTags.push(dto.allergyInfo);
  }

  const id = String(dto.id || '');
  const codePrefix = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  const studentCode = dto.studentCode || (codePrefix ? `KID-2026-${codePrefix}` : 'KID-2026-001');

  // Che mờ CCCD theo NĐ 13 nếu có
  const rawCccd = dto.guardianNationalId || dto.parentNationalId || dto.nationalId || '';
  const guardianNationalIdMasked = rawCccd
    ? `${rawCccd.slice(0, 6)}******`
    : (dto.guardianNationalIdMasked || '079201******');

  return {
    id: id || `st-${Math.random().toString(36).slice(2, 7)}`,
    studentCode,
    fullName: dto.fullName || 'Học sinh',
    dateOfBirth: dto.dateOfBirth ? String(dto.dateOfBirth) : '',
    gender: (dto.gender as any) || 'MALE',
    classId: dto.classId ? String(dto.classId) : '',
    className: dto.className || 'Chưa phân lớp',
    ageGroup: dto.ageGroup || dto.academicYearName || 'Khối Mầm',
    status: (dto.status as any) || 'ACTIVE',
    enrollmentDate: dto.enrollmentDate ? String(dto.enrollmentDate) : '',
    guardianName: dto.parentName || dto.guardianName || 'Phụ huynh',
    guardianPhone: dto.parentPhone || dto.guardianPhone || '',
    guardianNationalIdMasked,
    addressMasked: dto.addressMasked || dto.address || 'TP. Hồ Chí Minh',
    allergyTags,
    avatarUrl: dto.avatarUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    notes: dto.notes || dto.allergyInfo || '',
  };
}

function mapTransferDtoToItem(dto: any): StudentMobilityItem {
  const rawId = String(dto.id || '');
  return {
    id: rawId,
    studentId: dto.studentId ? String(dto.studentId) : '',
    studentName: dto.studentName || 'Học sinh',
    fromClassId: dto.fromClassId ? String(dto.fromClassId) : '',
    fromClassName: dto.currentClass || dto.fromClassName || 'Lớp hiện tại',
    toClassId: dto.toClassId ? String(dto.toClassId) : '',
    toClassName: dto.targetClass || dto.toClassName || (dto.requestType === 'DEFERRAL' ? 'Bảo lưu' : 'Lớp chuyển đến'),
    requestType: dto.requestType === 'DEFERRAL' || dto.requestType === 'RESERVATION' ? 'RESERVATION' : 'TRANSFER',
    reason: dto.reason || '',
    requestDate: dto.createdAt ? String(dto.createdAt).slice(0, 10) : (dto.requestDate || ''),
    status: (dto.status as any) || 'PENDING',
    reviewNote: dto.reviewNotes || dto.reviewNote || '',
    reviewedAt: dto.reviewedAt ? String(dto.reviewedAt) : '',
    reviewedBy: dto.reviewedByName || dto.reviewedBy || '',
  };
}

export const studentAnalyticsApi = {
  // Lấy danh sách học sinh theo lớp, trạng thái và từ khóa
  async getStudents(params?: {
    classId?: string;
    status?: string;
    keyword?: string;
    hasAllergyOnly?: boolean;
  }): Promise<StudentRecord[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.classId && params.classId !== 'ALL') queryParams.append('classId', params.classId);
      if (params?.status && params.status !== 'ALL') queryParams.append('status', params.status);
      if (params?.keyword) queryParams.append('keyword', params.keyword);

      const endpoint = params?.hasAllergyOnly
        ? '/academic/students/by-allergy'
        : `/academic/students${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const res: any = await axiosClient.get(endpoint);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      let result = list.map(mapStudentDtoToRecord);

      // Lọc client-side bổ sung để đảm bảo hiển thị đúng
      if (params?.classId && params.classId !== 'ALL') {
        result = result.filter((s: StudentRecord) => s.classId === params.classId);
      }
      if (params?.status && params.status !== 'ALL') {
        result = result.filter((s: StudentRecord) => s.status === params.status);
      }
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase().trim();
        result = result.filter(
          (s: StudentRecord) =>
            s.fullName.toLowerCase().includes(kw) ||
            s.studentCode.toLowerCase().includes(kw) ||
            s.guardianPhone.includes(kw)
        );
      }
      if (params?.hasAllergyOnly) {
        result = result.filter((s: StudentRecord) => s.allergyTags && s.allergyTags.length > 0);
      }

      return result;
    } catch (err) {
      console.warn('API getStudents error:', err);
      return [];
    }
  },

  // Lấy danh sách học sinh có tiền sử dị ứng thực phẩm nặng
  async getStudentsWithAllergy(): Promise<StudentRecord[]> {
    return this.getStudents({ hasAllergyOnly: true });
  },

  // Lấy danh sách đơn chuyển lớp & bảo lưu
  async getMobilityRequests(status?: string): Promise<StudentMobilityItem[]> {
    try {
      const query = status && status !== 'ALL' ? `?status=${status}` : '';
      const res: any = await axiosClient.get(`/academic/transfer-requests${query}`);
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      let result = list.map(mapTransferDtoToItem);

      if (status && status !== 'ALL') {
        result = result.filter((m: StudentMobilityItem) => m.status === status);
      }

      return result;
    } catch (err) {
      console.warn('API getMobilityRequests error:', err);
      return [];
    }
  },

  // Duyệt hoặc từ chối đơn chuyển lớp / bảo lưu
  async reviewTransferRequest(
    id: string,
    decision: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string }
  ): Promise<StudentMobilityItem> {
    const res: any = await axiosClient.put(
      `/academic/transfer-requests/${id}/review`,
      {
        status: decision.status,
        reviewNotes: decision.reviewNote
      }
    );
    const data = res?.data || res;
    return mapTransferDtoToItem(data);
  },

  // Tính toán tóm tắt biến động học sinh động từ DB backend
  async getMobilitySummary(): Promise<StudentMobilitySummary> {
    try {
      const [students, mobilities] = await Promise.all([
        this.getStudents(),
        this.getMobilityRequests(),
      ]);

      const totalStudents = students.length;
      const activeCount = students.filter((s) => s.status === 'ACTIVE').length;
      const transferredCount = students.filter((s) => s.status === 'TRANSFERRED').length;
      const reservedCount = students.filter((s) => s.status === 'RESERVED').length;
      const allergyCount = students.filter((s) => s.allergyTags && s.allergyTags.length > 0).length;
      const pendingTransferCount = mobilities.filter((m) => m.status === 'PENDING').length;
      const retentionRate = totalStudents > 0
        ? Number(((activeCount / totalStudents) * 100).toFixed(1))
        : 100;

      return {
        totalStudents,
        activeCount,
        transferredCount,
        reservedCount,
        allergyCount,
        retentionRate,
        pendingTransferCount,
      };
    } catch {
      return {
        totalStudents: 0,
        activeCount: 0,
        transferredCount: 0,
        reservedCount: 0,
        allergyCount: 0,
        retentionRate: 0,
        pendingTransferCount: 0,
      };
    }
  },
};

export default studentAnalyticsApi;
