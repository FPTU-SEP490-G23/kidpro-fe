export type HealthState = 'HEALTHY' | 'DEGRADED' | 'DOWN';

export interface DatabaseHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  activeConnections: number;
  maxConnections: number;
  databaseSize: string;
  schemasCount: number;
  schemas: string[];
}

export interface RedisHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  queueDepth: number;
  usedMemoryMb: number;
  maxMemoryMb: number;
  activeJobs: number;
}

export interface FaceAiHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  dailyRecognitions: number;
  successRate: number; // %
  threshold: number;
  activeCameras: number;
}

export interface MinioHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  usedStorageGb: number;
  totalStorageGb: number;
  imagesCount: number;
  bucketCount: number;
}

export interface FcmHealth {
  status: 'UP' | 'DEGRADED' | 'DOWN' | 'MOCK_LOGGING';
  pushedTodayCount: number;
  failedTodayCount: number;
  successRate: number;
}

export interface CameraStation {
  id: string;
  name: string;
  location: string;
  streamUrl: string;
  fps: number;
  latencyMs: number;
  status: 'ONLINE' | 'OFFLINE';
  lastPingTime: string;
  resolution: string;
}

export interface LatencyPoint {
  timeLabel: string;
  latencyMs: number;
}

export interface TrafficPoint {
  timeSlot: string;
  checkInCount: number;
  checkOutCount: number;
  total: number;
}

export interface SystemHealthResponse {
  status: HealthState;
  overallLatencyMs: number;
  uptimePercentage: number;
  lastCheckedAt: string;
  incidentAlert?: string;
  components: {
    database: DatabaseHealth;
    redis: RedisHealth;
    aiService: FaceAiHealth;
    minio: MinioHealth;
    fcm: FcmHealth;
  };
  cameras: CameraStation[];
}

export interface SystemMetricsResponse {
  latencyHistory: LatencyPoint[];
  trafficHistory: TrafficPoint[];
}
