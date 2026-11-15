import React, { useState, useEffect, useRef } from 'react';
import {
  detectBrowserEnvironment,
  BrowserEnvironmentInfo,
  extractEulerAngles,
  isTurnSatisfied,
} from '../../utils/cameraDiagUtils';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import {
  Camera,
  Play,
  Square,
  Copy,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Eye,
  RotateCcw,
} from 'lucide-react';

export const CameraDiagnosticPage: React.FC = () => {
  const [envInfo, setEnvInfo] = useState<BrowserEnvironmentInfo | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<{
    width: number;
    height: number;
    fps: number;
    label: string;
  } | null>(null);

  // MediaPipe state
  const [delegate, setDelegate] = useState<'GPU' | 'CPU'>('GPU');
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelInitTime, setModelInitTime] = useState<number | null>(null);
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Realtime detections
  const [faceDetected, setFaceDetected] = useState(false);
  const [blinkLeft, setBlinkLeft] = useState(0);
  const [blinkRight, setBlinkRight] = useState(0);
  const [yawAngle, setYawAngle] = useState(0);
  const [pitchAngle, setPitchAngle] = useState(0);
  const [rollAngle, setRollAngle] = useState(0);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [detectionFps, setDetectionFps] = useState(0);

  // Benchmark stats
  const latenciesRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastFpsCalcRef = useRef(performance.now());
  const [avgLatency, setAvgLatency] = useState(0);
  const [p95Latency, setP95Latency] = useState(0);

  // Lifecycle logs
  const [lifecycleLogs, setLifecycleLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLifecycleLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 40)]);
  };

  useEffect(() => {
    const info = detectBrowserEnvironment();
    setEnvInfo(info);
    addLog(`Trình duyệt: ${info.userAgent}`);
    if (info.isInAppBrowser) {
      addLog(`⚠️ CẢNH BÁO: Đang chạy trong ${info.inAppName}`);
    }
    if (info.isStandalone) {
      addLog('Đang chạy ở chế độ Standalone (PWA đã cài)');
    } else {
      addLog('Đang chạy trong tab trình duyệt thông thường');
    }

    // Lifecycle events
    const handleVisibilityChange = () => {
      const state = document.visibilityState;
      addLog(`visibilitychange: ${state}`);
      if (stream) {
        const track = stream.getVideoTracks()[0];
        if (track) {
          addLog(`Track state: readyState=${track.readyState}, muted=${track.muted}`);
        }
      }
    };

    const handlePageHide = () => {
      addLog('pagehide event');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      stopCamera();
    };
  }, [stream]);

  // Khởi tạo camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      addLog('Đang yêu cầu quyền getUserMedia (user gesture)...');
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      addLog('getUserMedia thành công!');

      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        addLog(`Camera device: ${track.label || 'Không tên'}`);
        track.onended = () => addLog('⚠️ Camera track kết thúc (ended)');
        track.onmute = () => addLog('⚠️ Camera track bị tắt tiếng (muted)');
        track.onunmute = () => addLog('ℹ️ Camera track đã hoạt động trở lại (unmuted)');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        setStreamInfo({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
          fps: track.getSettings()?.frameRate || 30,
          label: track.label || 'Camera',
        });
        addLog(`Độ phân giải thực: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
      }
    } catch (err: any) {
      const errorMsg = `${err.name}: ${err.message}`;
      setCameraError(errorMsg);
      addLog(`❌ Lỗi getUserMedia: ${errorMsg}`);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      addLog('Đã dừng camera stream');
    }
  };

  // Khởi tạo MediaPipe FaceLandmarker
  const initMediaPipe = async (chosenDelegate: 'GPU' | 'CPU') => {
    setIsModelLoading(true);
    setModelError(null);
    const start = performance.now();
    try {
      addLog(`Bắt đầu khởi tạo MediaPipe FilesetResolver (WASM nội bộ)...`);
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

      addLog(`Khởi tạo FaceLandmarker với delegate: ${chosenDelegate}...`);
      const marker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/models/face_landmarker.task',
          delegate: chosenDelegate,
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      const elapsed = Math.round(performance.now() - start);
      setModelInitTime(elapsed);
      setLandmarker(marker);
      setDelegate(chosenDelegate);
      addLog(`✅ Khởi tạo MediaPipe thành công (${chosenDelegate}) trong ${elapsed}ms`);
    } catch (err: any) {
      const errMsg = `${err.name || 'Error'}: ${err.message || err}`;
      setModelError(errMsg);
      addLog(`❌ Khởi tạo MediaPipe (${chosenDelegate}) thất bại: ${errMsg}`);
      if (chosenDelegate === 'GPU') {
        addLog('🔄 Đang thử tự động chuyển sang CPU delegate...');
        initMediaPipe('CPU');
      }
    } finally {
      setIsModelLoading(false);
    }
  };

  // Vòng lặp suy luận thời gian thực
  useEffect(() => {
    if (!landmarker || !stream || !videoRef.current) return;

    let active = true;

    const detectLoop = () => {
      if (!active || !videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      const now = performance.now();
      const startTime = performance.now();

      try {
        const results = landmarker.detectForVideo(videoRef.current, now);
        const duration = Math.round((performance.now() - startTime) * 10) / 10;
        setInferenceTime(duration);

        // Lưu thống kê benchmark
        latenciesRef.current.push(duration);
        if (latenciesRef.current.length > 100) latenciesRef.current.shift();

        frameCountRef.current++;
        if (now - lastFpsCalcRef.current >= 1000) {
          const fps = Math.round(
            (frameCountRef.current * 1000) / (now - lastFpsCalcRef.current)
          );
          setDetectionFps(fps);
          frameCountRef.current = 0;
          lastFpsCalcRef.current = now;

          // Tính Avg & P95
          if (latenciesRef.current.length > 0) {
            const sorted = [...latenciesRef.current].sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);
            setAvgLatency(Math.round((sum / sorted.length) * 10) / 10);
            const p95Idx = Math.floor(sorted.length * 0.95);
            setP95Latency(sorted[p95Idx]);
          }
        }

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          setFaceDetected(true);

          // Blendshapes (Chớp mắt)
          const blendshapes = results.faceBlendshapes?.[0]?.categories || [];
          const leftBlink = blendshapes.find((c) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
          const rightBlink = blendshapes.find((c) => c.categoryName === 'eyeBlinkRight')?.score || 0;
          setBlinkLeft(Math.round(leftBlink * 100) / 100);
          setBlinkRight(Math.round(rightBlink * 100) / 100);

          // Góc quay đầu (Matrix)
          const matrix = results.facialTransformationMatrixes?.[0]?.data;
          const angles = extractEulerAngles(matrix);
          setYawAngle(angles.yaw);
          setPitchAngle(angles.pitch);
          setRollAngle(angles.roll);
        } else {
          setFaceDetected(false);
          setBlinkLeft(0);
          setBlinkRight(0);
        }
      } catch (err) {
        console.error('Detection loop error:', err);
      }

      animationFrameRef.current = requestAnimationFrame(detectLoop);
    };

    animationFrameRef.current = requestAnimationFrame(detectLoop);

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarker, stream]);

  // Xuất báo cáo JSON
  const handleCopyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      browser: envInfo,
      camera: {
        error: cameraError,
        streamInfo,
      },
      mediapipe: {
        delegate,
        initTimeMs: modelInitTime,
        modelError,
        benchmark: {
          currentInferenceMs: inferenceTime,
          avgLatencyMs: avgLatency,
          p95LatencyMs: p95Latency,
          detectionFps,
        },
      },
      liveValues: {
        faceDetected,
        blinkLeft,
        blinkRight,
        yawAngle,
        pitchAngle,
        rollAngle,
        turnLeftSatisfied: isTurnSatisfied('TURN_LEFT', yawAngle),
        turnRightSatisfied: isTurnSatisfied('TURN_RIGHT', yawAngle),
      },
      logs: lifecycleLogs,
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-dvh bg-slate-900 text-slate-100 p-4 md:p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Công Cụ Chẩn Đoán Camera & MediaPipe</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Dành cho kỹ sư kiểm tra WebKit iOS/Android, đo hiệu năng FaceLandmarker trước khi chạy điểm danh thật.
            </p>
          </div>
          <button
            onClick={handleCopyReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg touch-target"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Đã sao chép báo cáo JSON!' : 'Sao chép báo cáo JSON'}
          </button>
        </div>

        {/* Cảnh báo In-App Browser nếu có */}
        {envInfo?.isInAppBrowser && (
          <div className="bg-amber-950/80 border border-amber-600/60 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong className="text-amber-100 block text-sm">Phát hiện In-App Browser ({envInfo.inAppName})</strong>
              Trình duyệt nội bộ này thường khóa quyền camera hoặc gây treo stream WebKit. Vui lòng mở bằng Safari
              (iPhone) hoặc Chrome (Android).
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1: Video Preview & Điều Khiển Camera */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" /> Luồng Video Camera
              </h2>
              <div className="flex items-center gap-2">
                {!stream ? (
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5" /> Bật Camera
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Square className="w-3.5 h-3.5" /> Dừng
                  </button>
                )}
              </div>
            </div>

            {/* Khung video preview */}
            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              {!stream && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Camera className="w-10 h-10 stroke-1" />
                  <span className="text-xs">Camera đang tắt. Bấm nút Bật Camera để cấp quyền.</span>
                </div>
              )}

              {/* Overlay hiển thị góc quay và trạng thái */}
              {stream && (
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white space-y-0.5 pointer-events-none">
                  <div>Mặt: {faceDetected ? '✅ Đã tìm thấy' : '❌ Chưa có mặt'}</div>
                  <div>Yaw: {yawAngle}° | Pitch: {pitchAngle}°</div>
                  <div>Blink L: {blinkLeft} | R: {blinkRight}</div>
                </div>
              )}
            </div>

            {/* Thông số stream */}
            {streamInfo && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
                <div>Độ phân giải: <span className="text-blue-400">{streamInfo.width}x{streamInfo.height}</span></div>
                <div>FPS thiết bị: <span className="text-blue-400">{streamInfo.fps}</span></div>
                <div className="col-span-2 truncate">Thiết bị: <span className="text-slate-300">{streamInfo.label}</span></div>
              </div>
            )}

            {cameraError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60">
                Lỗi Camera: {cameraError}
              </div>
            )}
          </div>

          {/* Cột 2: MediaPipe FaceLandmarker Benchmark */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" /> MediaPipe Vision Benchmark
              </h2>
              <div className="flex items-center gap-2">
                <button
                  disabled={isModelLoading}
                  onClick={() => initMediaPipe('GPU')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 ${
                    delegate === 'GPU' && landmarker
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Thử GPU
                </button>
                <button
                  disabled={isModelLoading}
                  onClick={() => initMediaPipe('CPU')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1 ${
                    delegate === 'CPU' && landmarker
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Thử CPU
                </button>
              </div>
            </div>

            {/* Benchmark Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Khởi tạo</div>
                <div className="text-base font-bold text-blue-400 mt-0.5">
                  {modelInitTime !== null ? `${modelInitTime}ms` : '--'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">FPS AI</div>
                <div className="text-base font-bold text-emerald-400 mt-0.5">
                  {detectionFps > 0 ? detectionFps : '--'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Trung bình</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">
                  {avgLatency > 0 ? `${avgLatency}ms` : '--'}
                </div>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/50">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">P95 Trễ</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {p95Latency > 0 ? `${p95Latency}ms` : '--'}
                </div>
              </div>
            </div>

            {/* Giá trị thời gian thực cho Liveness */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/50 space-y-2 text-xs">
              <div className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Thử nghiệm Thao Tác Sống (Liveness Test):</span>
                <span className={`px-2 py-0.5 rounded text-[11px] ${landmarker ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                  {landmarker ? `Mô hình: ${delegate}` : 'Chưa nạp model'}
                </span>
              </div>

              {/* Chớp mắt */}
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Eye className="w-3.5 h-3.5 text-blue-400" /> Chớp mắt (Blink):
                </span>
                <span className="font-mono">
                  L: {(blinkLeft * 100).toFixed(0)}% | R: {(blinkRight * 100).toFixed(0)}%
                  {(blinkLeft > 0.4 || blinkRight > 0.4) && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-900/80 text-blue-200 rounded text-[10px]">
                      Đang nhắm mắt
                    </span>
                  )}
                </span>
              </div>

              {/* Quay đầu */}
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Quay đầu (Yaw):
                </span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>{yawAngle}°</span>
                  {isTurnSatisfied('TURN_LEFT', yawAngle) && (
                    <span className="px-1.5 py-0.5 bg-emerald-900/80 text-emerald-200 rounded text-[10px] font-bold">
                      👈 QUAY TRÁI ĐẠT
                    </span>
                  )}
                  {isTurnSatisfied('TURN_RIGHT', yawAngle) && (
                    <span className="px-1.5 py-0.5 bg-emerald-900/80 text-emerald-200 rounded text-[10px] font-bold">
                      👉 QUAY PHẢI ĐẠT
                    </span>
                  )}
                </div>
              </div>
            </div>

            {modelError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 p-3 rounded-xl border border-rose-800/60">
                Lỗi Model: {modelError}
              </div>
            )}
          </div>
        </div>

        {/* Thông tin Môi trường chi tiết */}
        {envInfo && (
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-2">Thông Tin Môi Trường Phát Hiện</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
              <div className="bg-slate-900/40 p-2 rounded-lg">Thiết bị iOS: <span className="text-blue-400">{envInfo.isIOS ? `Có (v${envInfo.iosVersion || '?'})` : 'Không'}</span></div>
              <div className="bg-slate-900/40 p-2 rounded-lg">PWA Standalone: <span className="text-blue-400">{envInfo.isStandalone ? 'Có (Đã cài)' : 'Không (Tab web)'}</span></div>
              <div className="bg-slate-900/40 p-2 rounded-lg">In-App Browser: <span className="text-blue-400">{envInfo.isInAppBrowser ? envInfo.inAppName : 'Không'}</span></div>
              <div className="bg-slate-900/40 p-2 rounded-lg">getUserMedia: <span className="text-emerald-400">{envInfo.hasGetUserMedia ? 'Hỗ trợ' : 'Không hỗ trợ'}</span></div>
              <div className="bg-slate-900/40 p-2 rounded-lg">Screen WakeLock: <span className="text-emerald-400">{envInfo.hasWakeLock ? 'Hỗ trợ' : 'Không hỗ trợ'}</span></div>
              <div className="bg-slate-900/40 p-2 rounded-lg">rvfc (VideoFrame): <span className="text-emerald-400">{envInfo.hasRequestVideoFrameCallback ? 'Có' : 'raf fallback'}</span></div>
            </div>
          </div>
        )}

        {/* Nhật ký vòng đời (Lifecycle Event Logs) */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Nhật Ký Vòng Đời & Sự Kiện Stream</h3>
            <button
              onClick={() => setLifecycleLogs([])}
              className="text-[11px] text-slate-400 hover:text-slate-200"
            >
              Xóa log
            </button>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
            {lifecycleLogs.length === 0 ? (
              <span className="text-slate-600">Chưa có sự kiện nào được ghi nhận.</span>
            ) : (
              lifecycleLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
