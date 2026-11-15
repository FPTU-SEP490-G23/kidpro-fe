import { describe, it, expect, beforeEach } from 'vitest';
import { isTurnSatisfied, extractEulerAngles } from '../cameraDiagUtils';
import { LivenessStateMachine, BlendshapeData } from '../livenessStateMachine';

describe('1. Kiểm thử ánh xạ hướng quay đầu (Yaw Direction Mapping)', () => {
  it('Khớp đúng quy ước Flutter LivenessDirectionMapper: quay trái là yaw âm <= -15°', () => {
    expect(isTurnSatisfied('TURN_LEFT', -15)).toBe(true);
    expect(isTurnSatisfied('TURN_LEFT', -25.5)).toBe(true);
    expect(isTurnSatisfied('TURN_LEFT', -14.9)).toBe(false);
    expect(isTurnSatisfied('TURN_LEFT', 0)).toBe(false);
    expect(isTurnSatisfied('TURN_LEFT', 20)).toBe(false);
  });

  it('Khớp đúng quy ước Flutter LivenessDirectionMapper: quay phải là yaw dương >= 15°', () => {
    expect(isTurnSatisfied('TURN_RIGHT', 15)).toBe(true);
    expect(isTurnSatisfied('TURN_RIGHT', 30.2)).toBe(true);
    expect(isTurnSatisfied('TURN_RIGHT', 14.8)).toBe(false);
    expect(isTurnSatisfied('TURN_RIGHT', 0)).toBe(false);
    expect(isTurnSatisfied('TURN_RIGHT', -20)).toBe(false);
  });

  it('Trích xuất góc Euler từ ma trận 4x4 MediaPipe', () => {
    // Ma trận đơn vị 4x4 -> tất cả góc bằng 0
    const identityMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
    const angles = extractEulerAngles(identityMatrix);
    expect(angles.yaw).toBe(0);
    expect(angles.pitch).toBe(0);
    expect(angles.roll).toBe(0);
  });
});

describe('2. Kiểm thử Máy trạng thái Liveness State Machine', () => {
  let sm: LivenessStateMachine;

  beforeEach(() => {
    sm = new LivenessStateMachine({
      challengeId: 'test-challenge-123',
      action: 'TURN_LEFT',
      expiresAt: Date.now() + 60000,
    });
  });

  it('Khởi tạo trạng thái ban đầu là IDLE', () => {
    expect(sm.getState().status).toBe('IDLE');
    expect(sm.getState().challenge?.action).toBe('TURN_LEFT');
  });

  it('Luồng liveness hoàn chỉnh: Mở mắt -> Nhắm mắt -> Mở mắt (chớp mắt) -> Quay đầu sang trái', () => {
    sm.transition('READY');

    // Frame 1: Thấy mặt, mắt đang mở (eyeBlink < 0.35)
    const openEyes: BlendshapeData = { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, yaw: 0 };
    sm.processFrame(true, openEyes, 1000);
    expect(sm.getState().status).toBe('WAITING_BLINK');

    // Frame 2: Bé nhắm mắt (eyeBlink > 0.45) lúc t = 1100ms
    const closedEyes: BlendshapeData = { eyeBlinkLeft: 0.85, eyeBlinkRight: 0.82, yaw: 0 };
    sm.processFrame(true, closedEyes, 1100);
    expect(sm.getState().status).toBe('EYES_CLOSED');

    // Frame 3: Bé mở mắt lại lúc t = 1350ms (thời gian nhắm = 250ms -> nhịp chớp mắt sinh học đạt)
    const resBlink = sm.processFrame(true, openEyes, 1350);
    expect(resBlink.shouldCaptureFront).toBe(true); // Đã chụp ảnh chính diện
    expect(sm.getState().status).toBe('WAITING_TURN');

    // Frame 4: Bé quay mặt sang trái (yaw = -18°)
    const turnedLeft: BlendshapeData = { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, yaw: -18 };
    const resTurn = sm.processFrame(true, turnedLeft, 1600);
    expect(resTurn.shouldCaptureTurn).toBe(true); // Đã chụp ảnh quay đầu
    expect(resTurn.passed).toBe(true); // Đạt thử thách!
    expect(sm.getState().status).toBe('PASSED');
  });

  it('Từ chối nhắm mắt ngủ gật hoặc nhắm quá lâu (> 1800ms)', () => {
    sm.transition('READY');
    const openEyes: BlendshapeData = { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, yaw: 0 };
    const closedEyes: BlendshapeData = { eyeBlinkLeft: 0.9, eyeBlinkRight: 0.9, yaw: 0 };

    sm.processFrame(true, openEyes, 1000);
    sm.processFrame(true, closedEyes, 1100);
    expect(sm.getState().status).toBe('EYES_CLOSED');

    // Mở mắt lại sau 2500ms (t = 3600ms - 1100ms = 2500ms > 1800ms)
    const res = sm.processFrame(true, openEyes, 3600);
    expect(res.shouldCaptureFront).toBe(false);
    expect(sm.getState().status).toBe('WAITING_BLINK'); // Bắt chớp lại
  });

  it('Xử lý mất khuôn mặt giữa chừng (Face Lost)', () => {
    sm.transition('READY');
    const openEyes: BlendshapeData = { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, yaw: 0 };
    sm.processFrame(true, openEyes, 1000);
    expect(sm.getState().status).toBe('WAITING_BLINK');

    // Đột ngột mất mặt (hasFace = false)
    sm.processFrame(false, undefined, 1100);
    expect(sm.getState().status).toBe('DETECTING');
    expect(sm.getState().message).toContain('khung tròn');
  });

  it('Chịu được môi trường FPS thấp (khoảng cách khung hình 200ms)', () => {
    sm.transition('READY');
    const openEyes: BlendshapeData = { eyeBlinkLeft: 0.1, eyeBlinkRight: 0.1, yaw: 0 };
    const closedEyes: BlendshapeData = { eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8, yaw: 0 };

    sm.processFrame(true, openEyes, 1000);
    // Nhắm mắt tại 1200ms
    sm.processFrame(true, closedEyes, 1200);
    // Vẫn nhắm tại 1400ms
    sm.processFrame(true, closedEyes, 1400);
    // Mở lại tại 1600ms (tổng thời gian 400ms)
    const res = sm.processFrame(true, openEyes, 1600);
    expect(res.shouldCaptureFront).toBe(true);
    expect(sm.getState().status).toBe('WAITING_TURN');
  });

  it('Reset sẵn sàng cho học sinh tiếp theo và xóa ảnh chụp cũ', () => {
    sm.resetForNext({
      challengeId: 'next-456',
      action: 'TURN_RIGHT',
      expiresAt: Date.now() + 60000,
    });

    const state = sm.getState();
    expect(state.status).toBe('READY');
    expect(state.challenge?.action).toBe('TURN_RIGHT');
    expect(state.frontImageBlob).toBeNull();
    expect(state.turnImageBlob).toBeNull();
  });
});
