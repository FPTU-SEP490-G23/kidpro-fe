import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  Play,
  RotateCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Users,
  ChevronRight,
  Volume2,
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';
import {
  LivenessStateMachine,
  LivenessState,
  BlendshapeData,
} from '../../utils/livenessStateMachine';
import { extractEulerAngles } from '../../utils/cameraDiagUtils';
import { playAudioFeedback } from '../../utils/audioFeedback';
import {
  faceAttendanceService,
  FaceCheckInResult,
  LivenessChallengeResponse,
} from '../../services/faceAttendanceService';

interface FaceAttendanceCameraProps {
  classId: string;
  className?: string;
  onClose: () => void;
  onSuccessCheckIn?: (result: FaceCheckInResult) => void;
}

export const FaceAttendanceCamera: React.FC<FaceAttendanceCameraProps> = ({
  classId,
  className,
  onClose,
  onSuccessCheckIn,
}) => {
  // Trạng thái camera & MediaPipe
  const [isStarted, setIsStarted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // MediaPipe
  const [landmarker, setLandmarker] = useState<FaceLandmarker | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [activeDelegate, setActiveDelegate] = useState<'GPU' | 'CPU'>('GPU');

  // Liveness State Machine
  const [livenessState, setLivenessState] = useState<LivenessState>({
    status: 'IDLE',
    message: 'Bấm nút để bắt đầu điểm danh',
    challenge: null,
    blinkStartTime: null,
    frontImageBlob: null,
    turnImageBlob: null,
    errorMessage: null,
  });

  // Kết quả nhận diện gần nhất
  const [lastResult, setLastResult] = useState<FaceCheckInResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPausedByBackground, setIsPausedByBackground] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateMachineRef = useRef<LivenessStateMachine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Khởi tạo state machine
  useEffect(() => {
    stateMachineRef.current = new LivenessStateMachine(null, (newState) => {
      setLivenessState(newState);
    });

    return () => {
      stopCameraAndVision();
      releaseWakeLock();
    };
  }, []);

  // Screen Wake Lock
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // Bỏ qua nếu không hỗ trợ
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch {
        // Bỏ qua
      }
    }
  };

  // Nạp Server Challenge (OPT-004)
  const fetchChallenge = async (): Promise<LivenessChallengeResponse | null> => {
    try {
      const challenge = await faceAttendanceService.createChallenge();
      if (challenge && challenge.challenge_id) {
        stateMachineRef.current?.setChallenge({
          challengeId: challenge.challenge_id,
          action: challenge.action,
          expiresAt: challenge.expires_at,
        });
        return challenge;
      }
    } catch (err) {
      console.warn('Không thể nạp challenge từ server:', err);
    }
    return null;
  };

  // Khởi tạo MediaPipe FilesetResolver & FaceLandmarker
  const initFaceLandmarker = async (delegate: 'GPU' | 'CPU' = 'GPU') => {
    setIsModelLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const marker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/models/face_landmarker.task',
          delegate,
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });

      setLandmarker(marker);
      setActiveDelegate(delegate);
      return marker;
    } catch (err) {
      console.warn(`MediaPipe ${delegate} init error, trying CPU fallback...`, err);
      if (delegate === 'GPU') {
        return await initFaceLandmarker('CPU');
      }
      setCameraError('Không thể khởi tạo mô hình nhận diện khuôn mặt.');
      return null;
    } finally {
      setIsModelLoading(false);
    }
  };

  // Chụp ảnh gốc từ Video lên Canvas (KHÔNG LẬT GƯƠNG để server nhận diện chuẩn mắt và góc quay)
  const captureRawFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }

      // Giới hạn độ phân giải gửi lên server tối đa 1024px để ảnh nhẹ (~150KB-200KB)
      const maxDim = 1024;
      let width = video.videoWidth;
      let height = video.videoHeight;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // VẼ TRỰC TIẾP TỪ VIDEO: Không áp dụng scaleX(-1) -> Ảnh gửi lên là ảnh tự nhiên của camera
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.82
      );
    });
  }, []);

  // Gửi điểm danh lên Spring Boot Backend
  const submitCheckIn = async (frontBlob: Blob, turnBlob?: Blob | null) => {
    setIsSubmitting(true);
    stateMachineRef.current?.transition('SUBMITTING', 'Đang đối chiếu dữ liệu AI trên máy chủ...');

    try {
      const currentChallenge = stateMachineRef.current?.getState().challenge;

      const result = await faceAttendanceService.checkInWithFace({
        file: frontBlob,
        turnFile: turnBlob,
        classId,
        challengeId: currentChallenge?.challengeId,
        turnAction: currentChallenge?.action,
      });

      setLastResult(result);
      stateMachineRef.current?.transition('RESULT');

      if (result.status === 'PRESENT') {
        playAudioFeedback.success();
        if (onSuccessCheckIn) {
          onSuccessCheckIn(result);
        }
        // Tự động lên lịch reset để điểm danh bé kế tiếp sau 3.5 giây
        autoResetTimerRef.current = setTimeout(() => {
          resetForNextStudent();
        }, 3500);
      } else {
        playAudioFeedback.warning();
        // Tự động thử lại sau 3.2 giây nếu không nhận ra hoặc ảnh nhòe
        autoResetTimerRef.current = setTimeout(() => {
          resetForNextStudent();
        }, 3200);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi kết nối điểm danh';
      setLastResult({
        status: 'ERROR',
        message: msg,
      });
      stateMachineRef.current?.transition('RESULT', msg);
      playAudioFeedback.warning();

      autoResetTimerRef.current = setTimeout(() => {
        resetForNextStudent();
      }, 3500);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khởi động Camera và phiên điểm danh (sau thao tác chạm)
  const handleStartSession = async () => {
    setCameraError(null);
    setIsStarted(true);
    stateMachineRef.current?.transition('REQUESTING_PERMISSION', 'Đang kết nối camera...');

    try {
      // 1. getUserMedia (User gesture bắt buộc cho iOS Safari)
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // 2. Gán vào thẻ video với các thuộc tính bắt buộc cho WebKit
      if (videoRef.current) {
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Giữ màn hình sáng
      await requestWakeLock();

      // 3. Khởi tạo MediaPipe nếu chưa có
      let marker = landmarker;
      if (!marker) {
        stateMachineRef.current?.transition('STARTING', 'Đang nạp mô hình nhận diện AI...');
        marker = await initFaceLandmarker('GPU');
      }

      // 4. Lấy challenge từ server
      await fetchChallenge();

      stateMachineRef.current?.transition('READY', 'Bé vui lòng nhìn thẳng vào camera');
    } catch (err: any) {
      console.error('Lỗi khởi động camera điểm danh:', err);
      let friendlyError = 'Không thể mở camera. Vui lòng kiểm tra quyền truy cập.';
      if (err.name === 'NotAllowedError') {
        friendlyError = 'Trình duyệt bị từ chối quyền camera. Vui lòng cấp quyền trong Cài đặt Safari/Chrome.';
      } else if (err.name === 'NotFoundError') {
        friendlyError = 'Không tìm thấy thiết bị camera trên máy.';
      } else if (err.name === 'NotReadableError') {
        friendlyError = 'Camera đang bị ứng dụng khác sử dụng.';
      }
      setCameraError(friendlyError);
      stateMachineRef.current?.transition('ERROR', friendlyError, friendlyError);
    }
  };

  // Đổi camera trước / sau
  const handleToggleFacingMode = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }
    } catch (e) {
      console.error('Lỗi đổi camera:', e);
    }
  };

  // Reset sẵn sàng cho học sinh tiếp theo (GIỮ NGUYÊN STREAM CAMERA ĐỂ KHÔNG BỊ HỎI LẠI QUYỀN TRÊN IOS)
  const resetForNextStudent = async () => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    setLastResult(null);
    setIsSubmitting(false);

    // Lấy challenge mới cho học sinh kế tiếp
    const newChallenge = await fetchChallenge();

    stateMachineRef.current?.resetForNext(
      newChallenge
        ? {
            challengeId: newChallenge.challenge_id,
            action: newChallenge.action,
            expiresAt: newChallenge.expires_at,
          }
        : null
    );
  };

  // Vòng lặp phát hiện & Liveness
  useEffect(() => {
    if (!landmarker || !stream || !videoRef.current || !isStarted) return;

    let isActive = true;
    let frontCapturedBlob: Blob | null = null;

    const detectionLoop = async () => {
      if (!isActive || !videoRef.current || videoRef.current.readyState < 2) {
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      const sm = stateMachineRef.current;
      const currentStatus = sm?.getState().status;

      // Nếu đang chụp hoặc đang gọi server hoặc đang hiển thị kết quả: tạm dừng suy luận để tiết kiệm pin/nhiệt
      if (
        currentStatus === 'SUBMITTING' ||
        currentStatus === 'RESULT' ||
        currentStatus === 'PAUSED' ||
        currentStatus === 'ERROR'
      ) {
        animationFrameRef.current = requestAnimationFrame(detectionLoop);
        return;
      }

      const now = performance.now();
      try {
        const results = landmarker.detectForVideo(videoRef.current, now);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const blendshapes = results.faceBlendshapes?.[0]?.categories || [];
          const leftBlink = blendshapes.find((c) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
          const rightBlink = blendshapes.find((c) => c.categoryName === 'eyeBlinkRight')?.score || 0;

          const matrix = results.facialTransformationMatrixes?.[0]?.data;
          const angles = extractEulerAngles(matrix);

          const signal: BlendshapeData = {
            eyeBlinkLeft: leftBlink,
            eyeBlinkRight: rightBlink,
            yaw: angles.yaw,
            pitch: angles.pitch,
            roll: angles.roll,
          };

          const check = sm?.processFrame(true, signal, now);

          // Phát âm thanh bíp nhẹ khi chớp mắt thành công
          if (check?.shouldCaptureFront) {
            playAudioFeedback.blink();
            frontCapturedBlob = await captureRawFrame();
          }

          if (check?.passed) {
            let turnCapturedBlob: Blob | null = null;
            if (check.shouldCaptureTurn) {
              turnCapturedBlob = await captureRawFrame();
            }

            // Đạt Liveness: tiến hành gửi lên server
            if (!frontCapturedBlob) {
              frontCapturedBlob = await captureRawFrame();
            }

            if (frontCapturedBlob) {
              submitCheckIn(frontCapturedBlob, turnCapturedBlob);
            }
          }
        } else {
          sm?.processFrame(false, undefined, now);
        }
      } catch (err) {
        console.error('Detection frame error:', err);
      }

      animationFrameRef.current = requestAnimationFrame(detectionLoop);
    };

    animationFrameRef.current = requestAnimationFrame(detectionLoop);

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [landmarker, stream, isStarted, captureRawFrame]);

  // Xử lý vòng đời app vào nền (Background / Foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsPausedByBackground(true);
        stateMachineRef.current?.transition('PAUSED', 'Tạm dừng điểm danh do ứng dụng vào chế độ nền');
      } else if (document.visibilityState === 'visible') {
        // Kiểm tra xem camera track có còn sống không
        const track = stream?.getVideoTracks()[0];
        if (!track || track.readyState === 'ended') {
          // Stream đã bị hệ điều hành tắt -> yêu cầu chạm để khôi phục
          setIsPausedByBackground(true);
        } else {
          setIsPausedByBackground(false);
          stateMachineRef.current?.transition('READY', 'Tiếp tục điểm danh học sinh');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stream]);

  const stopCameraAndVision = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (landmarker) {
      try {
        landmarker.close();
      } catch {
        // Bỏ qua
      }
      setLandmarker(null);
    }
  };

  // Xác định màu sắc vòng tròn căn chỉnh mặt theo bước liveness
  const getGuideBorderColor = () => {
    switch (livenessState.status) {
      case 'WAITING_BLINK':
        return 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]';
      case 'EYES_CLOSED':
        return 'border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.5)]';
      case 'WAITING_TURN':
        return 'border-purple-400 shadow-[0_0_30px_rgba(192,132,252,0.6)] animate-pulse';
      case 'PASSED':
      case 'SUBMITTING':
        return 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.7)]';
      case 'RESULT':
        return lastResult?.status === 'PRESENT'
          ? 'border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.8)]'
          : 'border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.8)]';
      default:
        return 'border-white/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      {/* 1. Header điều khiển */}
      <div className="relative z-20 flex items-center justify-between p-4 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={() => {
            stopCameraAndVision();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 touch-target"
          aria-label="Đóng camera"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-white tracking-wide">Điểm Danh Khuôn Mặt AI</h2>
          <p className="text-[11px] text-slate-300 font-medium">{className || 'Lớp Mầm Non'}</p>
        </div>

        <button
          onClick={handleToggleFacingMode}
          disabled={!stream}
          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 touch-target disabled:opacity-40"
          aria-label="Đổi camera"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Video Stream & Khung Oval Hướng Dẫn */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Thẻ video chính: Lật gương bằng CSS */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* Màn hình khởi động trước khi chạm */}
        {!isStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 mb-6 shadow-2xl animate-pulse">
              <Camera className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Bắt Đầu Phiên Điểm Danh</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-8 leading-relaxed">
              Hệ thống sẽ giữ camera liên tục để cô điểm danh nhanh từng học sinh. Hãy cho bé đứng nhìn vào camera.
            </p>
            <button
              onClick={handleStartSession}
              className="w-full max-w-xs py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 touch-target transition-all"
            >
              <Play className="w-5 h-5 fill-current" /> Bật Camera & Bắt Đầu
            </button>
          </div>
        )}

        {/* Cảnh báo tạm dừng khi ra nền */}
        {isPausedByBackground && isStarted && (
          <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Ứng Dụng Vừa Trở Lại</h3>
            <p className="text-xs text-slate-300 max-w-xs mb-6">
              Chạm nút dưới đây để kích hoạt lại luồng camera và tiếp tục điểm danh.
            </p>
            <button
              onClick={handleStartSession}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold rounded-xl flex items-center gap-2 touch-target"
            >
              <RefreshCw className="w-4 h-4" /> Tiếp Tục Quét
            </button>
          </div>
        )}

        {/* Khung Oval căn chỉnh mặt & Trạng thái hướng dẫn */}
        {isStarted && !isPausedByBackground && (
          <div className="relative z-10 flex flex-col items-center pointer-events-none w-full max-w-sm px-6">
            {/* Vòng Oval */}
            <div
              className={`w-64 h-80 sm:w-72 sm:h-96 rounded-[48%] border-4 transition-all duration-300 relative flex items-center justify-center ${getGuideBorderColor()}`}
            >
              {/* Thử thách quay đầu: hiển thị mũi tên to trực quan */}
              {livenessState.status === 'WAITING_TURN' && livenessState.challenge && (
                <div className="absolute inset-0 flex items-center justify-between px-4 text-purple-300 animate-bounce">
                  {livenessState.challenge.action === 'TURN_LEFT' ? (
                    <div className="flex items-center gap-1 bg-purple-900/80 px-3 py-1.5 rounded-xl border border-purple-400 shadow-xl">
                      <ArrowLeft className="w-6 h-6 stroke-[3]" />
                      <span className="text-xs font-bold">QUAY TRÁI</span>
                    </div>
                  ) : (
                    <div className="ml-auto flex items-center gap-1 bg-purple-900/80 px-3 py-1.5 rounded-xl border border-purple-400 shadow-xl">
                      <span className="text-xs font-bold">QUAY PHẢI</span>
                      <ArrowRight className="w-6 h-6 stroke-[3]" />
                    </div>
                  )}
                </div>
              )}

              {/* Icon xác thực thành công khi passed */}
              {livenessState.status === 'PASSED' && (
                <ShieldCheck className="w-16 h-16 text-emerald-400 animate-scale-up" />
              )}
            </div>

            {/* Thông điệp hướng dẫn tương tác */}
            <div className="mt-4 bg-black/75 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center shadow-lg max-w-xs">
              <p className="text-xs font-semibold text-white tracking-wide">
                {livenessState.message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Sheet Kết quả điểm danh (Nằm trong CÙNG 1 MÀN HÌNH, không pushState) */}
      <div className="relative z-20 p-4 pb-safe bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        {lastResult ? (
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {lastResult.status === 'PRESENT' ? (
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 flex-shrink-0">
                    <XCircle className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-white">
                    {lastResult.status === 'PRESENT'
                      ? lastResult.name || 'Học sinh điểm danh thành công'
                      : lastResult.status === 'BLURRED'
                      ? 'Ảnh quá nhòe / rung lắc'
                      : 'Chưa nhận diện được học sinh'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lastResult.status === 'PRESENT' ? (
                      <span>
                        Mã: <strong className="text-blue-400">{lastResult.student_code}</strong> | Giờ: {lastResult.checkin_time || 'Vừa xong'}
                      </span>
                    ) : (
                      lastResult.message || 'Vui lòng cho bé đứng yên nhìn vào camera'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={resetForNextStudent}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 touch-target shadow-md"
              >
                Điểm Danh Bé Tiếp Theo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isStarted ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
              <span>{isStarted ? 'Camera AI đang hoạt động' : 'Camera chưa bật'}</span>
            </div>
            <button
              onClick={resetForNextStudent}
              disabled={!isStarted}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Quét lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
