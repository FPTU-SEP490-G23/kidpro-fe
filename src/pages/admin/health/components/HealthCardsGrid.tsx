import React, { useState } from 'react';
import {
  DatabaseHealth,
  RedisHealth,
  FaceAiHealth,
  MinioHealth,
  FcmHealth,
} from '../../../../types/healthMonitoring.types';
import { useToast } from '../../../../contexts/ToastContext';
import healthMonitoringApi from '../../../../api/healthMonitoringApi';
import {
  Database,
  Layers,
  ScanFace,
  HardDrive,
  BellRing,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Server,
  Cpu,
} from 'lucide-react';

interface HealthCardsGridProps {
  database: DatabaseHealth;
  redis: RedisHealth;
  aiService: FaceAiHealth;
  minio: MinioHealth;
  fcm: FcmHealth;
  onRefreshNeeded: () => void;
}

export const HealthCardsGrid: React.FC<HealthCardsGridProps> = ({
  database,
  redis,
  aiService,
  minio,
  fcm,
  onRefreshNeeded,
}) => {
  const { success, error } = useToast();
  const [pingingService, setPingingService] = useState<string | null>(null);

  const handlePing = async (serviceName: string) => {
    setPingingService(serviceName);
    try {
      const res = await healthMonitoringApi.pingService(serviceName);
      success(`${res.message} (Độ trễ: ${res.latencyMs}ms)`);
      onRefreshNeeded();
    } catch {
      error('MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.');
    } finally {
      setPingingService(null);
    }
  };

  const isDbWarning = database.latencyMs > 1000 || database.status === 'DEGRADED';
  const isAiDown = aiService.latencyMs > 5000 || aiService.status === 'DOWN';
  const isQueueWarning = redis.queueDepth > 100 || redis.status === 'DEGRADED';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* 1. Database PostgreSQL */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
          isDbWarning
            ? 'bg-amber-50/90 border-[#E5A93C] shadow-md shadow-amber-500/10'
            : 'bg-white border-slate-200 shadow-2xs hover:shadow-md'
        }`}
      >
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  isDbWarning ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-[#275A4E]'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Cơ Sở Dữ Liệu PostgreSQL</h3>
                <p className="text-[11px] text-slate-500">7 Schemas Multi-Domain Core</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isDbWarning
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isDbWarning ? 'bg-[#E5A93C]' : 'bg-[#10B981]'
                }`}
              ></span>
              {isDbWarning ? 'GIẢM TẢI' : 'TỐT'}
            </span>
          </div>

          {/* Cảnh báo DB chậm nếu latency > 1000ms */}
          {isDbWarning && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
              <span className="font-semibold leading-tight">
                MSG-030: Độ trễ phản hồi cơ sở dữ liệu cao. Hệ thống đang vận hành ở chế độ giảm tải.
              </span>
            </div>
          )}

          {/* Metrics chi tiết */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Độ trễ phản hồi</span>
              <span
                className={`text-base font-bold ${
                  isDbWarning ? 'text-amber-700' : 'text-[#275A4E]'
                }`}
              >
                {database.latencyMs} ms
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Active Connections</span>
              <span className="text-base font-bold text-slate-800">
                {database.activeConnections} / {database.maxConnections}
              </span>
            </div>
          </div>

          {/* 7 Schemas tags */}
          <div className="mt-3">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Phân vùng Schemas ({database.schemasCount}):
            </span>
            <div className="flex flex-wrap gap-1">
              {database.schemas.map((schema) => (
                <span
                  key={schema}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-mono font-medium"
                >
                  {schema}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Dung lượng: <strong className="text-slate-700">{database.databaseSize}</strong></span>
          <button
            type="button"
            onClick={() => handlePing('database')}
            disabled={pingingService === 'database'}
            className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {pingingService === 'database' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
            )}
            <span>Ping DB</span>
          </button>
        </div>
      </div>

      {/* 2. Redis Cache & BullMQ */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
          isQueueWarning
            ? 'bg-amber-50/90 border-[#E5A93C] shadow-md shadow-amber-500/10'
            : 'bg-white border-slate-200 shadow-2xs hover:shadow-md'
        }`}
      >
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bộ Nhớ Đệm & Hàng Đợi</h3>
                <p className="text-[11px] text-slate-500">Redis Cache & BullMQ Scheduler</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              CONNECTED
            </span>
          </div>

          {/* Cảnh báo nghẽn hàng đợi */}
          {isQueueWarning && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#E5A93C] shrink-0 mt-0.5" />
              <span className="font-semibold leading-tight">
                MSG-032: Hàng đợi phát thông báo bị chậm trễ. Hệ thống đang tự động mở rộng luồng xử lý.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Độ sâu hàng đợi (Queue)</span>
              <span
                className={`text-base font-bold ${
                  isQueueWarning ? 'text-amber-700' : 'text-slate-800'
                }`}
              >
                {redis.queueDepth} tác vụ
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Bộ nhớ RAM đã dùng</span>
              <span className="text-base font-bold text-slate-800">
                {redis.usedMemoryMb} MB <span className="text-xs text-slate-400 font-normal">/ {redis.maxMemoryMb} MB</span>
              </span>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">Độ trễ Redis:</span>
            <span className="font-mono font-bold text-emerald-700">{redis.latencyMs} ms</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Active Jobs: <strong className="text-slate-700">{redis.activeJobs} jobs</strong></span>
          <button
            type="button"
            onClick={() => handlePing('redis')}
            disabled={pingingService === 'redis'}
            className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {pingingService === 'redis' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
            )}
            <span>Ping Redis</span>
          </button>
        </div>
      </div>

      {/* 3. Máy chủ Face AI Microservice */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
          isAiDown
            ? 'bg-rose-50/90 border-rose-400 shadow-md shadow-rose-500/10'
            : 'bg-white border-slate-200 shadow-2xs hover:shadow-md'
        }`}
      >
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-2xl ${
                  isAiDown ? 'bg-rose-100 text-rose-700' : 'bg-teal-50 text-[#275A4E]'
                }`}
              >
                <ScanFace className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Máy Chủ AI Nhận Diện Cổng Trường</h3>
                <p className="text-[11px] text-slate-500">Python FastAPI Face Microservice</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                isAiDown
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAiDown ? 'bg-rose-600 animate-ping' : 'bg-[#10B981]'
                }`}
              ></span>
              {isAiDown ? 'MẤT KẾT NỐI' : 'HOẠT ĐỘNG'}
            </span>
          </div>

          {/* Cảnh báo Face AI mất kết nối - kích hoạt BR-007 */}
          {isAiDown && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-start gap-1.5 animate-pulse">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-tight">
                MSG-031: Máy chủ AI khuôn mặt không phản hồi. Đã kích hoạt chế độ điểm danh thủ công dự phòng (BR-007).
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Độ trễ AI Ping</span>
              <span
                className={`text-base font-bold ${
                  isAiDown ? 'text-rose-700' : 'text-[#275A4E]'
                }`}
              >
                {aiService.latencyMs} ms
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Tỷ lệ chính xác</span>
              <span className="text-base font-bold text-slate-800">{aiService.successRate}%</span>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">Lượt nhận diện hôm nay:</span>
            <span className="font-bold text-slate-800">{aiService.dailyRecognitions} lượt</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Camera hoạt động: <strong className="text-slate-700">{aiService.activeCameras}/3</strong></span>
          <button
            type="button"
            onClick={() => handlePing('aiService')}
            disabled={pingingService === 'aiService'}
            className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {pingingService === 'aiService' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
            )}
            <span>Ping AI</span>
          </button>
        </div>
      </div>

      {/* 4. MinIO S3 Object Storage */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-700">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Dịch Vụ Lưu Trữ Tệp Tin MinIO S3</h3>
                <p className="text-[11px] text-slate-500">Ảnh điểm danh & Bằng chứng kiểm thực</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              SẴN SÀNG
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Dung lượng đã dùng</span>
              <span className="text-base font-bold text-slate-800">
                {minio.usedStorageGb} GB <span className="text-xs text-slate-400 font-normal">/ {minio.totalStorageGb} GB</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Ảnh lưu trữ</span>
              <span className="text-base font-bold text-slate-800">{minio.imagesCount} tệp</span>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#275A4E] h-2 rounded-full transition-all duration-500"
                style={{ width: `${(minio.usedStorageGb / minio.totalStorageGb) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Đã dùng {Math.round((minio.usedStorageGb / minio.totalStorageGb) * 100)}%</span>
              <span>Khả dụng {Math.round(minio.totalStorageGb - minio.usedStorageGb)} GB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Buckets: <strong className="text-slate-700">{minio.bucketCount} buckets</strong></span>
          <button
            type="button"
            onClick={() => handlePing('minio')}
            disabled={pingingService === 'minio'}
            className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {pingingService === 'minio' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
            )}
            <span>Ping S3</span>
          </button>
        </div>
      </div>

      {/* 5. FCM Push Service */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-[#E5A93C]">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Cổng Thông Báo Đẩy Di Động</h3>
                <p className="text-[11px] text-slate-500">Firebase Cloud Messaging Service</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#1E4D40] border border-[#78C2AD] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              HOẠT ĐỘNG
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Đã gửi hôm nay</span>
              <span className="text-base font-bold text-slate-800">{fcm.pushedTodayCount} tin</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-[11px] text-slate-400 block">Tỷ lệ thành công</span>
              <span className="text-base font-bold text-[#275A4E]">{fcm.successRate}%</span>
            </div>
          </div>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/50 flex items-center justify-between text-xs">
            <span className="text-slate-500">Tin gửi lỗi (Retried):</span>
            <span className="font-bold text-slate-700">{fcm.failedTodayCount} tin</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100 text-xs text-slate-500">
          <span>Chế độ: <strong className="text-slate-700">Production Direct</strong></span>
          <button
            type="button"
            onClick={() => handlePing('fcm')}
            disabled={pingingService === 'fcm'}
            className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 cursor-pointer"
          >
            {pingingService === 'fcm' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
            )}
            <span>Ping FCM</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthCardsGrid;
