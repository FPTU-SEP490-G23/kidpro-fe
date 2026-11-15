import { axiosClient } from '../api/axiosClient';

export interface LivenessChallengeResponse {
  challenge_id: string;
  action: 'TURN_LEFT' | 'TURN_RIGHT';
  expires_at: number;
  expires_in_seconds: number;
}

export interface FaceCheckInResult {
  status: 'PRESENT' | 'UNKNOWN' | 'BLURRED' | 'ERROR';
  student_id?: string;
  student_code?: string;
  name?: string;
  class_name?: string;
  confidence_score?: number;
  margin?: number;
  checkin_time?: string;
  registered_photo_url?: string;
  message?: string;
  blur_score?: number;
  pipeline_version?: string;
  request_id?: string;
  liveness_verified?: boolean;
}

export const faceAttendanceService = {
  /**
   * Tạo thử thách Liveness ngẫu nhiên từ server (OPT-004)
   */
  async createChallenge(): Promise<LivenessChallengeResponse> {
    const res = await axiosClient.post<any>('/attendance/face-recognition/challenge');
    return (res as any)?.data || res;
  },

  /**
   * Điểm danh khuôn mặt Server-to-Server qua Spring Boot (OPT-003, OPT-002, OPT-004)
   */
  async checkInWithFace(params: {
    file: Blob | File;
    turnFile?: Blob | File | null;
    classId: string;
    challengeId?: string | null;
    turnAction?: string | null;
  }): Promise<FaceCheckInResult> {
    const formData = new FormData();
    formData.append('file', params.file, 'checkin_face.jpg');

    if (params.turnFile) {
      formData.append('turnFile', params.turnFile, 'turn_face.jpg');
    }
    if (params.classId) {
      formData.append('classId', params.classId);
    }
    if (params.challengeId) {
      formData.append('challengeId', params.challengeId);
    }
    if (params.turnAction) {
      formData.append('turnAction', params.turnAction);
    }

    const res = await axiosClient.post<any>('/attendance/face-recognition/check-in', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return (res as any)?.data || res;
  },

  /**
   * Lấy danh sách khuôn mặt học sinh đã đăng ký của lớp
   */
  async getRegisteredFaces(classId?: string): Promise<any[]> {
    const query = classId ? `?classId=${classId}` : '';
    const res = await axiosClient.get<any>(`/attendance/face-recognition/registered-faces${query}`);
    return (res as any)?.data || res || [];
  },
};
