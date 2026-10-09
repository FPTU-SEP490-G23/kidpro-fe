import React, { useState } from 'react';
import { CameraStation } from '../../../../types/healthMonitoring.types';
import { useToast } from '../../../../contexts/ToastContext';
import healthMonitoringApi from '../../../../api/healthMonitoringApi';
import {
  Cctv,
  Video,
  Check,
  RefreshCw,
  Zap,
  Radio,
  Eye,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

interface GateCameraWatcherProps {
  cameras: CameraStation[];
}

export const GateCameraWatcher: React.FC<GateCameraWatcherProps> = ({ cameras }) => {
  const { success } = useToast();
  const [pingingCameraId, setPingingCameraId] = useState<string | null>(null);

  const handlePingCamera = async (cam: CameraStation) => {
    setPingingCameraId(cam.id);
    try {
      const res = await healthMonitoringApi.pingCamera(cam.id);
      success(`Kiểm tra ${cam.name} thành công: FPS: ${res.fps}, Độ trễ mạng: ${res.latencyMs}ms`);
    } finally {
      setPingingCameraId(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-50 text-[#275A4E]">
            <Cctv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Giám Sát Trạm Camera AI Cổng Trường (Gate Stream Watcher)</h3>
            <p className="text-xs text-slate-500">
              Nhận diện khuôn mặt học sinh & phụ huynh tự động tại cổng theo thời gian thực (FPS & Stream Health)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1E4D40] text-xs font-bold border border-[#78C2AD]">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            LIVE RTSP FEED ({cameras.length} Kênh)
          </span>
        </div>
      </div>

      {/* Grid danh sách camera */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {cameras.map((cam) => {
          const isOnline = cam.status === 'ONLINE';

          return (
            <div
              key={cam.id}
              className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-900 shadow-sm flex flex-col justify-between"
            >
              {/* Vùng Video Stream mô phỏng với viền nhận diện AI Mint Green chuẩn Design System */}
              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group">
                {/* Lưới tọa độ quét AI giả lập */}
                <div className="absolute inset-0 bg-[radial-gradient(#78C2AD_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>

                {/* Khung nhận diện AI Camera Khớp Danh Tính (AI Recognition Frame chuẩn DESIGN_SYSTEM.md) */}
                <div className="relative w-44 h-32 rounded-2xl border-2 border-[#78C2AD] bg-[#78C2AD]/10 p-2 shadow-lg shadow-[#78C2AD]/20 flex flex-col justify-between backdrop-blur-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#78C2AD] uppercase">AI DETECT: OK</span>
                    <div className="bg-[#78C2AD] text-[#1E4D40] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <Check className="w-3 h-3" /> Đã xác thực
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-xs font-bold text-white tracking-wide">Bé Gia Bảo (Lớp Mầm 1)</p>
                    <p className="text-[10px] text-emerald-300">Độ tin cậy: 98.4% (0.98)</p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-300 border-t border-[#78C2AD]/40 pt-1">
                    <span>Cổng Đông</span>
                    <span className="font-mono">07:42:15</span>
                  </div>
                </div>

                {/* Top overlay badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-rose-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    REC
                  </span>
                  <span className="bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs">
                    {cam.fps} FPS
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-black/60 text-[#78C2AD] text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs font-semibold">
                    {cam.latencyMs}ms
                  </span>
                </div>

                <div className="absolute bottom-2 left-2.5 text-[10px] text-slate-300 font-mono bg-black/50 px-2 py-0.5 rounded-md">
                  {cam.resolution}
                </div>
              </div>

              {/* Thông tin chân thẻ camera */}
              <div className="p-4 bg-white flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{cam.name}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOnline
                          ? 'bg-emerald-50 text-[#1E4D40] border border-[#78C2AD]'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {cam.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cam.location}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                    {cam.streamUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePingCamera(cam)}
                    disabled={pingingCameraId === cam.id}
                    className="text-[#275A4E] hover:text-[#1E4D40] font-semibold flex items-center gap-1 text-xs cursor-pointer"
                  >
                    {pingingCameraId === cam.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#E5A93C]" />
                    )}
                    <span>Ping Test</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer ghi chú bảo mật */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-xs text-slate-600">
        <ShieldCheck className="w-4 h-4 text-[#275A4E] shrink-0" />
        <span>
          Toàn bộ camera cổng được kết nối qua mạng nội bộ VLAN cô lập, bảo mật chống rò rỉ dữ liệu trẻ em theo tiêu chuẩn an toàn mầm non KIDPRO.
        </span>
      </div>
    </div>
  );
};

export default GateCameraWatcher;
