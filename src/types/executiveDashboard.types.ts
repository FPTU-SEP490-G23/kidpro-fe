export interface ExecutiveAttendanceMetrics {
  totalStudents: number;
  presentCount: number;
  absentWithLeave: number;
  absentWithoutLeave: number;
  attendanceRate: number; // %
}

export interface ExecutiveKitchenMetrics {
  isLocked: boolean;
  lockedAt: string;
  totalMeals: number;
  regularRiceCount: number;
  porridgeCount: number;
  allergyDietCount: number;
  allergyTags: string[];
}

export interface ExecutiveFinanceMetrics {
  totalBilledAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueCount: number;
  collectionRate: number; // %
}

export interface ExecutiveSecurityMetrics {
  unresolvedAlertsCount: number;
  totalScansToday: number;
  recognizedCount: number;
  unrecognizedCount: number;
  systemHealthStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
}

export interface UnresolvedSecurityAlert {
  id: string;
  photoUrl?: string;
  capturedAt: string;
  gateName: string;
  isMatch: boolean;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  similarityScore?: number;
}

export interface ClassDailyHeadcountSummary {
  classId: string;
  className: string;
  ageGroup: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  regularRiceCount: number;
  porridgeCount: number;
  allergyDietCount: number;
  allergyStudents: { name: string; allergyNote: string }[];
}

export interface ExecutiveDashboardData {
  date: string;
  attendance: ExecutiveAttendanceMetrics;
  kitchen: ExecutiveKitchenMetrics;
  finance: ExecutiveFinanceMetrics;
  security: ExecutiveSecurityMetrics;
  classSummaries: ClassDailyHeadcountSummary[];
  unresolvedAlerts: UnresolvedSecurityAlert[];
  isCacheData?: boolean;
}
