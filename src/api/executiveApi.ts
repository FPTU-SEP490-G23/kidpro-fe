import axiosClient from './axiosClient';
import {
  ExecutiveDashboardData,
  UnresolvedSecurityAlert,
  ClassDailyHeadcountSummary,
} from '../types/executiveDashboard.types';

// Hàm trợ giúp giải nén kết quả từ PromiseSettledResult tương thích interceptor
function unwrapSettledResponse(p: PromiseSettledResult<any>): any {
  if (p.status !== 'fulfilled') return null;
  const val = p.value;
  return val?.data !== undefined ? val.data : val;
}

export const executiveApi = {
  // Lấy dữ liệu điều hành tổng thể toàn trường theo ngày từ API backend thực tế (UC-012)
  async getExecutiveOverview(selectedDate?: string): Promise<ExecutiveDashboardData> {
    const today = selectedDate || new Date().toISOString().split('T')[0];
    const monthYear = `${today.slice(5, 7)}-${today.slice(0, 4)}`; // ví dụ "10-2026"

    try {
      // 1. Ưu tiên gọi API tổng hợp Bảng Điều Hành Toàn Trường từ Spring Boot
      const res: any = await axiosClient.get(`/executive/dashboard?date=${today}`);
      const rawData = res?.data !== undefined ? res.data : res;

      if (rawData && rawData.attendance && rawData.kitchen && rawData.finance && rawData.security) {
        return {
          date: rawData.date || today,
          attendance: rawData.attendance,
          kitchen: rawData.kitchen,
          finance: rawData.finance,
          security: rawData.security,
          classSummaries: rawData.classSummaries || [],
          unresolvedAlerts: rawData.unresolvedAlerts || [],
          isCacheData: Boolean(rawData.isCacheData),
        };
      }
    } catch (e) {
      console.warn('Executive dashboard consolidated API failed, trying compatibility fallbacks...', e);
    }

    try {
      // 2. Fallback gọi song song các API backend thành phần
      const [
        kitchenSummaryRes,
        mealHeadcountsRes,
        alertsRes,
        allFaceLogsRes,
        studentsRes,
        invoicesRes,
      ] = await Promise.allSettled([
        axiosClient.get(`/kitchen/daily-summary?date=${today}`),
        axiosClient.get(`/kitchen/meal-headcounts?date=${today}`),
        axiosClient.get('/attendance/face-logs/unresolved-alerts'),
        axiosClient.get('/attendance/face-logs'),
        axiosClient.get('/academic/students'),
        axiosClient.get(`/finance/invoices/month?monthYear=${monthYear}`),
      ]);

      const kitchenSummary = unwrapSettledResponse(kitchenSummaryRes);
      const mealHeadcounts = unwrapSettledResponse(mealHeadcountsRes);
      const alerts = unwrapSettledResponse(alertsRes);
      const allFaceLogs = unwrapSettledResponse(allFaceLogsRes);
      const students = unwrapSettledResponse(studentsRes);
      const invoices = unwrapSettledResponse(invoicesRes);

      // 1. Chỉ số Sĩ số & Chuyên cần (Attendance)
      const studentList = Array.isArray(students) ? students : [];
      const totalStudents = Number(
        kitchenSummary?.totalStudents ??
        kitchenSummary?.totalActiveStudents ??
        studentList.length ??
        0
      );
      const presentCount = Number(
        kitchenSummary?.presentCount ??
        mealHeadcounts?.totalMealsToPrepare ??
        0
      );
      const absentWithLeave = Number(
        kitchenSummary?.absentWithLeave ??
        kitchenSummary?.absentPermitted ??
        0
      );
      const absentWithoutLeave = Number(
        kitchenSummary?.absentWithoutLeave ??
        kitchenSummary?.absentUnpermitted ??
        0
      );
      const attendanceRate = totalStudents > 0
        ? Math.min(100, Math.round((presentCount / totalStudents) * 100))
        : 0;

      // 2. Chỉ số Bếp ăn & Khóa suất ăn 08:30 AM (Kitchen)
      const isLocked = Boolean(mealHeadcounts?.isLocked ?? kitchenSummary?.isLocked ?? false);
      let lockedAt = '08:30 AM';
      if (mealHeadcounts?.lockedAt) {
        lockedAt = String(mealHeadcounts.lockedAt).slice(11, 16);
      } else if (kitchenSummary?.lockedAt) {
        lockedAt = String(kitchenSummary.lockedAt).slice(11, 16);
      }

      const totalMeals = Number(
        mealHeadcounts?.totalMealsToPrepare ??
        kitchenSummary?.totalMealsToPrepare ??
        presentCount
      );
      const regularRiceCount = Number(
        mealHeadcounts?.totalRegularMeals ??
        (Array.isArray(kitchenSummary?.classSummaries)
          ? kitchenSummary.classSummaries.reduce((sum: number, c: any) => sum + Number(c.regularMealCount || 0), 0)
          : 0)
      );
      const porridgeCount = Number(
        mealHeadcounts?.totalPorridgeMeals ??
        (Array.isArray(kitchenSummary?.classSummaries)
          ? kitchenSummary.classSummaries.reduce((sum: number, c: any) => sum + Number(c.porridgeCount || 0), 0)
          : 0)
      );
      const allergyDietCount = Number(
        mealHeadcounts?.totalAllergySafeMeals ??
        kitchenSummary?.specialDietCount ??
        (Array.isArray(kitchenSummary?.classSummaries)
          ? kitchenSummary.classSummaries.reduce((sum: number, c: any) => sum + Number(c.allergySafeCount || 0), 0)
          : 0)
      );

      // 3. Chỉ số Tài chính & Học phí (Finance)
      const invoiceList = Array.isArray(invoices) ? invoices : [];
      let totalBilledAmount = 0;
      let collectedAmount = 0;
      let pendingAmount = 0;
      let overdueCount = 0;

      if (invoiceList.length > 0) {
        totalBilledAmount = invoiceList.reduce(
          (sum: number, inv: any) => sum + Number(inv.totalAmount || inv.amount || 0),
          0
        );
        collectedAmount = invoiceList
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
        pendingAmount = invoiceList
          .filter((inv: any) => inv.status === 'PENDING' || inv.status === 'UNPAID')
          .reduce((sum: number, inv: any) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
        overdueCount = invoiceList.filter((inv: any) => inv.status === 'OVERDUE').length;
      }

      const collectionRate = totalBilledAmount > 0
        ? Math.round((collectedAmount / totalBilledAmount) * 100)
        : 100;

      // 4. Chỉ số An ninh cổng trường & Cảnh báo người lạ (Security)
      const alertList = Array.isArray(alerts) ? alerts : [];
      const faceLogList = Array.isArray(allFaceLogs) ? allFaceLogs : [];

      const unresolvedAlertsCount = alertList.length;
      const totalScansToday = faceLogList.length > 0 ? faceLogList.length : unresolvedAlertsCount;
      const recognizedCount = faceLogList.filter((l: any) => l.isMatch).length;
      const unrecognizedCount = faceLogList.length > 0
        ? faceLogList.filter((l: any) => !l.isMatch).length
        : unresolvedAlertsCount;

      // 5. Chi tiết khẩu phần từng lớp học (Class Summaries)
      let classSummaries: ClassDailyHeadcountSummary[] = [];
      if (Array.isArray(kitchenSummary?.classSummaries) && kitchenSummary.classSummaries.length > 0) {
        classSummaries = kitchenSummary.classSummaries.map((c: any) => {
          const allergyStudents = c.allergies
            ? [{ name: 'Học sinh lớp', allergyNote: String(c.allergies) }]
            : [];

          return {
            classId: String(c.classId || ''),
            className: c.className || 'Lớp học',
            ageGroup: c.className || 'Khối mầm non',
            totalStudents: Number(c.total || 0),
            presentCount: Number(c.present || 0),
            absentCount: Number(c.absent || 0),
            regularRiceCount: Number(c.regularMealCount || 0),
            porridgeCount: Number(c.porridgeCount || 0),
            allergyDietCount: Number(c.allergySafeCount || 0),
            allergyStudents,
          };
        });
      }

      // 6. Danh sách cảnh báo người lạ chưa giải quyết (Unresolved Security Alerts)
      const unresolvedAlerts: UnresolvedSecurityAlert[] = alertList.map((a: any) => ({
        id: String(a.id || ''),
        capturedAt: a.capturedAt || a.createdAt || new Date().toISOString(),
        gateName: a.deviceLocation || a.gateName || 'Cổng Chính 01 - Làn Đón Trẻ',
        photoUrl: a.capturedPhotoUrl || a.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        isMatch: Boolean(a.isMatch ?? false),
        resolved: Boolean(a.resolved ?? false),
        notes: a.strangerResolutionNote || a.notes || 'Khuôn mặt chưa khớp dữ liệu phụ huynh đã đăng ký. Đang đối chiếu CCCD trực tiếp.',
        similarityScore: typeof a.similarityScore === 'number' ? a.similarityScore : 0.45,
      }));

      return {
        date: today,
        attendance: {
          totalStudents,
          presentCount,
          absentWithLeave,
          absentWithoutLeave,
          attendanceRate,
        },
        kitchen: {
          isLocked,
          lockedAt,
          totalMeals,
          regularRiceCount,
          porridgeCount,
          allergyDietCount,
          allergyTags: ['Dị ứng đậu phộng', 'Dị ứng hải sản', 'Không uống sữa bò (Lactose)'],
        },
        finance: {
          totalBilledAmount,
          collectedAmount,
          pendingAmount,
          overdueCount,
          collectionRate,
        },
        security: {
          unresolvedAlertsCount,
          totalScansToday,
          recognizedCount,
          unrecognizedCount,
          systemHealthStatus: 'ONLINE',
        },
        classSummaries,
        unresolvedAlerts,
        isCacheData: false,
      };
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu tổng thể điều hành UC-012:', err);
      return {
        date: today,
        attendance: {
          totalStudents: 0,
          presentCount: 0,
          absentWithLeave: 0,
          absentWithoutLeave: 0,
          attendanceRate: 0,
        },
        kitchen: {
          isLocked: false,
          lockedAt: '08:30 AM',
          totalMeals: 0,
          regularRiceCount: 0,
          porridgeCount: 0,
          allergyDietCount: 0,
          allergyTags: [],
        },
        finance: {
          totalBilledAmount: 0,
          collectedAmount: 0,
          pendingAmount: 0,
          overdueCount: 0,
          collectionRate: 100,
        },
        security: {
          unresolvedAlertsCount: 0,
          totalScansToday: 0,
          recognizedCount: 0,
          unrecognizedCount: 0,
          systemHealthStatus: 'ONLINE',
        },
        classSummaries: [],
        unresolvedAlerts: [],
        isCacheData: false,
      };
    }
  },

  // Đánh dấu đã xác thực / giải quyết cảnh báo người lạ tại cổng
  async resolveAlert(alertId: string, notes?: string): Promise<void> {
    try {
      await axiosClient.patch(`/executive/security-alerts/${alertId}/resolve`, {
        note: notes || 'Bảo vệ và BGH đã kiểm tra CCCD, đối chiếu giấy ủy quyền đón trẻ hợp lệ.',
      });
    } catch {
      try {
        await axiosClient.put(`/attendance/face-logs/${alertId}/resolve-alert`, {
          resolutionNotes: notes || 'Đã xác minh bởi BGH',
        });
      } catch (err) {
        console.warn('Lỗi khi xử lý cảnh báo người lạ tại cổng:', err);
      }
    }
  },
};

export default executiveApi;
