/**
 * Tiện ích chẩn đoán môi trường trình duyệt, camera và MediaPipe FaceLandmarker
 */

export interface BrowserEnvironmentInfo {
  userAgent: string;
  isIOS: boolean;
  iosVersion: string | null;
  isStandalone: boolean;
  isInAppBrowser: boolean;
  inAppName: string | null;
  hasGetUserMedia: boolean;
  hasWakeLock: boolean;
  hasRequestVideoFrameCallback: boolean;
}

export function detectBrowserEnvironment(): BrowserEnvironmentInfo {
  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(uaLower);
  let iosVersion: string | null = null;
  const iosMatch = ua.match(/OS (\d+)_(\d+)(?:_(\d+))?/i);
  if (iosMatch) {
    iosVersion = `${iosMatch[1]}.${iosMatch[2]}` + (iosMatch[3] ? `.${iosMatch[3]}` : '');
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  let isInAppBrowser = false;
  let inAppName: string | null = null;

  if (uaLower.includes('zalo')) {
    isInAppBrowser = true;
    inAppName = 'Zalo In-App Browser';
  } else if (uaLower.includes('fbav') || uaLower.includes('fban') || uaLower.includes('fb_iab')) {
    isInAppBrowser = true;
    inAppName = 'Facebook In-App Browser';
  } else if (uaLower.includes('instagram')) {
    isInAppBrowser = true;
    inAppName = 'Instagram In-App Browser';
  } else if (uaLower.includes('messenger')) {
    isInAppBrowser = true;
    inAppName = 'Messenger In-App Browser';
  } else if (uaLower.includes('tiktok') || uaLower.includes('bytedance')) {
    isInAppBrowser = true;
    inAppName = 'TikTok In-App Browser';
  } else if (isIOS && !uaLower.includes('safari') && !uaLower.includes('crios') && !uaLower.includes('fxios')) {
    isInAppBrowser = true;
    inAppName = 'Unknown iOS WebKit Webview';
  }

  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const hasWakeLock = 'wakeLock' in navigator;
  const hasRequestVideoFrameCallback = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

  return {
    userAgent: ua,
    isIOS,
    iosVersion,
    isStandalone,
    isInAppBrowser,
    inAppName,
    hasGetUserMedia,
    hasWakeLock,
    hasRequestVideoFrameCallback,
  };
}

/**
 * Trích xuất góc quay Euler Angles (Yaw, Pitch, Roll) từ ma trận 4x4 (Row-Major hoặc Column-Major)
 * Matrix 4x4 từ MediaPipe: array 16 phần tử
 */
export function extractEulerAngles(matrix?: Float32Array | number[]): { yaw: number; pitch: number; roll: number } {
  if (!matrix || matrix.length < 16) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  // MediaPipe facialTransformationMatrixes trả về ma trận 4x4 cột trước (column-major)
  const m00 = matrix[0], m01 = matrix[4], m02 = matrix[8];
  const m10 = matrix[1], m11 = matrix[5], m12 = matrix[9];
  const m20 = matrix[2], m21 = matrix[6], m22 = matrix[10];

  // Pitch (X), Yaw (Y), Roll (Z) tính theo độ (degrees)
  let pitch = Math.asin(-Math.max(-1, Math.min(1, m12))) * (180 / Math.PI);
  let yaw = Math.atan2(m02, m22) * (180 / Math.PI);
  let roll = Math.atan2(m10, m11) * (180 / Math.PI);

  if (isNaN(pitch) || Math.abs(pitch) === 0) pitch = 0;
  if (isNaN(yaw) || Math.abs(yaw) === 0) yaw = 0;
  if (isNaN(roll) || Math.abs(roll) === 0) roll = 0;

  return {
    yaw: Math.round(yaw * 10) / 10 + 0,
    pitch: Math.round(pitch * 10) / 10 + 0,
    roll: Math.round(roll * 10) / 10 + 0,
  };
}

/**
 * Ánh xạ góc Yaw sang thử thách TURN_LEFT / TURN_RIGHT
 * Phù hợp với LivenessDirectionMapper trên mobile:
 * - Bé quay sang TRÁI (theo góc nhìn của bé): yaw < -15 độ
 * - Bé quay sang PHẢI (theo góc nhìn của bé): yaw > 15 độ
 */
export function isTurnSatisfied(action: 'TURN_LEFT' | 'TURN_RIGHT', yaw: number, threshold = 15): boolean {
  if (action === 'TURN_LEFT') {
    return yaw <= -threshold;
  }
  if (action === 'TURN_RIGHT') {
    return yaw >= threshold;
  }
  return false;
}
