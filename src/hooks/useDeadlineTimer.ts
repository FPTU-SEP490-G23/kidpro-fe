import { useState, useEffect } from 'react';

export interface DeadlineTimerState {
  deadlineDate: Date;
  deadlineDisplay: string;
  isExpired: boolean;
  isUrgent: boolean; // Dưới 3 giờ
  hours: number;
  minutes: number;
  seconds: number;
  formattedCountdown: string;
}

/**
 * Hook tính toán đếm ngược đến hạn chót 17:00 Thứ Sáu tuần này
 */
export const useDeadlineTimer = (): DeadlineTimerState => {
  const calculateDeadline = (): Date => {
    const now = new Date();
    const currentDay = now.getDay(); // 0: CN, 1: T2, ..., 5: T6, 6: T7
    const daysUntilFriday = (5 - currentDay + 7) % 7;

    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(17, 0, 0, 0);

    // Nếu hôm nay là Thứ Sáu sau 17:00 hoặc Thứ Bảy, hạn chót tuần này đã qua
    if (currentDay === 5 && now.getHours() >= 17) {
      // Hạn chót chính là 17:00 hôm nay
      return friday;
    }
    if (currentDay === 6) {
      // Đã qua Thứ Sáu hôm qua
      friday.setDate(now.getDate() - 1);
      friday.setHours(17, 0, 0, 0);
      return friday;
    }

    return friday;
  };

  const [state, setState] = useState<DeadlineTimerState>(() => {
    const deadline = calculateDeadline();
    const diff = deadline.getTime() - Date.now();
    const isExpired = diff <= 0;
    const isUrgent = diff > 0 && diff < 3 * 60 * 60 * 1000;

    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      deadlineDate: deadline,
      deadlineDisplay: `17:00 Thứ Sáu (${deadline.toLocaleDateString('vi-VN')})`,
      isExpired,
      isUrgent,
      hours,
      minutes,
      seconds,
      formattedCountdown: isExpired
        ? 'ĐÃ QUÁ HẠN 17:00 THỨ SÁU'
        : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const deadline = calculateDeadline();
      const diff = deadline.getTime() - Date.now();
      const isExpired = diff <= 0;
      const isUrgent = diff > 0 && diff < 3 * 60 * 60 * 1000;

      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setState({
        deadlineDate: deadline,
        deadlineDisplay: `17:00 Thứ Sáu (${deadline.toLocaleDateString('vi-VN')})`,
        isExpired,
        isUrgent,
        hours,
        minutes,
        seconds,
        formattedCountdown: isExpired
          ? 'ĐÃ QUÁ HẠN 17:00 THỨ SÁU'
          : `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return state;
};

export default useDeadlineTimer;
