/**
 * Máy trạng thái xác thực người thật (Liveness State Machine) cho điểm danh khuôn mặt
 * Thuần logic, không phụ thuộc UI/DOM để có thể unit-test chính xác.
 */

export type LivenessStatus =
  | 'IDLE'
  | 'REQUESTING_PERMISSION'
  | 'STARTING'
  | 'READY'
  | 'DETECTING'
  | 'WAITING_BLINK'
  | 'EYES_CLOSED'
  | 'WAITING_TURN'
  | 'PASSED'
  | 'CAPTURING'
  | 'SUBMITTING'
  | 'RESULT'
  | 'PAUSED'
  | 'ERROR';

export interface LivenessChallenge {
  challengeId: string;
  action: 'TURN_LEFT' | 'TURN_RIGHT';
  expiresAt: number;
}

export interface LivenessState {
  status: LivenessStatus;
  message: string;
  challenge: LivenessChallenge | null;
  blinkStartTime: number | null;
  frontImageBlob: Blob | null;
  turnImageBlob: Blob | null;
  errorMessage: string | null;
}

export interface BlendshapeData {
  eyeBlinkLeft: number;
  eyeBlinkRight: number;
  yaw: number;
  pitch?: number;
  roll?: number;
}

export class LivenessStateMachine {
  private state: LivenessState;
  private onStateChange?: (state: LivenessState) => void;

  constructor(initialChallenge?: LivenessChallenge | null, onStateChange?: (state: LivenessState) => void) {
    this.onStateChange = onStateChange;
    this.state = {
      status: 'IDLE',
      message: 'Bấm nút để bắt đầu điểm danh',
      challenge: initialChallenge || null,
      blinkStartTime: null,
      frontImageBlob: null,
      turnImageBlob: null,
      errorMessage: null,
    };
  }

  public getState(): LivenessState {
    return { ...this.state };
  }

  public setChallenge(challenge: LivenessChallenge | null) {
    this.state.challenge = challenge;
    this.notify();
  }

  public transition(status: LivenessStatus, message?: string, errorMessage?: string | null) {
    this.state.status = status;
    if (message) this.state.message = message;
    if (errorMessage !== undefined) this.state.errorMessage = errorMessage;
    this.notify();
  }

  /**
   * Xử lý tín hiệu mỗi frame từ MediaPipe FaceLandmarker
   */
  public processFrame(
    hasFace: boolean,
    signals?: BlendshapeData,
    currentTimeMs: number = performance.now()
  ): { shouldCaptureFront: boolean; shouldCaptureTurn: boolean; passed: boolean } {
    let shouldCaptureFront = false;
    let shouldCaptureTurn = false;
    let passed = false;

    if (!hasFace) {
      if (this.state.status !== 'IDLE' && this.state.status !== 'READY' && this.state.status !== 'SUBMITTING' && this.state.status !== 'RESULT' && this.state.status !== 'PAUSED') {
        this.state.status = 'DETECTING';
        this.state.message = 'Vui lòng đưa khuôn mặt bé vào giữa khung tròn';
        this.state.blinkStartTime = null;
        this.notify();
      }
      return { shouldCaptureFront, shouldCaptureTurn, passed };
    }

    if (!signals) return { shouldCaptureFront, shouldCaptureTurn, passed };

    const { eyeBlinkLeft, eyeBlinkRight, yaw } = signals;
    // Ngưỡng mở mắt và nhắm mắt từ Blendshapes (0.0: mở to, 1.0: nhắm hoàn toàn)
    // eyeBlink > 0.45: nhắm; eyeBlink < 0.35: mở
    const areEyesOpen = eyeBlinkLeft < 0.35 && eyeBlinkRight < 0.35;
    const areEyesClosed = eyeBlinkLeft > 0.45 || eyeBlinkRight > 0.45;

    switch (this.state.status) {
      case 'READY':
      case 'DETECTING':
        if (areEyesOpen) {
          this.state.status = 'WAITING_BLINK';
          this.state.message = 'Bé hãy chớp mắt nhẹ một cái nhé 😉';
          this.notify();
        } else {
          this.state.status = 'DETECTING';
          this.state.message = 'Bé hãy mở mắt nhìn thẳng vào camera';
          this.notify();
        }
        break;

      case 'WAITING_BLINK':
        if (areEyesClosed) {
          this.state.status = 'EYES_CLOSED';
          this.state.blinkStartTime = currentTimeMs;
          this.state.message = 'Đang nhận diện nhịp nhắm mắt...';
          this.notify();
        }
        break;

      case 'EYES_CLOSED':
        if (areEyesOpen) {
          const duration = this.state.blinkStartTime ? currentTimeMs - this.state.blinkStartTime : 0;
          // Nhịp chớp mắt sinh học người thật: 80ms - 1800ms
          if (duration >= 80 && duration <= 1800) {
            shouldCaptureFront = true; // Chụp ảnh chính diện ngay khi vừa chớp mắt xong

            if (this.state.challenge && this.state.challenge.action) {
              this.state.status = 'WAITING_TURN';
              this.state.message =
                this.state.challenge.action === 'TURN_LEFT'
                  ? 'Bé hãy từ từ quay mặt sang BÊN TRÁI nhé 👈'
                  : 'Bé hãy từ từ quay mặt sang BÊN PHẢI nhé 👉';
              this.notify();
            } else {
              this.state.status = 'PASSED';
              this.state.message = '✅ Đã xác thực người thật!';
              passed = true;
              this.notify();
            }
          } else {
            // Nhắm mắt quá lâu hoặc giật frame
            this.state.status = 'WAITING_BLINK';
            this.state.message = 'Bé hãy chớp mắt tự nhiên nhé!';
            this.notify();
          }
        }
        break;

      case 'WAITING_TURN':
        if (this.state.challenge) {
          const isSatisfied =
            (this.state.challenge.action === 'TURN_LEFT' && yaw <= -14) ||
            (this.state.challenge.action === 'TURN_RIGHT' && yaw >= 14);

          if (isSatisfied) {
            shouldCaptureTurn = true; // Chụp ảnh khi bé quay mặt đúng hướng
            this.state.status = 'PASSED';
            this.state.message = '✅ Đã hoàn thành thử thách quay đầu!';
            passed = true;
            this.notify();
          }
        }
        break;

      default:
        break;
    }

    return { shouldCaptureFront, shouldCaptureTurn, passed };
  }

  public resetForNext(newChallenge?: LivenessChallenge | null) {
    this.state = {
      status: 'READY',
      message: 'Sẵn sàng điểm danh học sinh tiếp theo',
      challenge: newChallenge || null,
      blinkStartTime: null,
      frontImageBlob: null,
      turnImageBlob: null,
      errorMessage: null,
    };
    this.notify();
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }
}
