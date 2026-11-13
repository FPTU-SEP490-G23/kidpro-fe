import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from '../config/supabase';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Spring Boot JWT Token or Supabase Token
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // 1. Ưu tiên accessToken từ Spring Boot (schema core)
      const springToken = localStorage.getItem('accessToken');
      if (springToken && config.headers) {
        config.headers.Authorization = `Bearer ${springToken}`;
        return config;
      }

      // 2. Tiếp theo kiểm tra Supabase session hoặc kidpro_token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || localStorage.getItem('kidpro_token');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      const fallbackToken = localStorage.getItem('accessToken') || localStorage.getItem('kidpro_token');
      if (fallbackToken && config.headers) {
        config.headers.Authorization = `Bearer ${fallbackToken}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Hàm làm sạch chuỗi thông báo, gỡ bỏ triệt để mã tài liệu nội bộ (UC, BR, MSG)
const cleanDocCodes = (str?: string): string => {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/(?:\[|\()?(?:G\d+-)?(?:UC|BR|MSG)-?[0-9/]+(?:-[0-9]+)?(?:\s*[\/&,]\s*(?:UC|BR|MSG)-?[0-9/]+)*(?:\]|\))?:?\s*/gi, '')
    .replace(/\[\s*(?:G\d+-)?(?:UC|BR|MSG)[^\]]*\]/gi, '')
    .replace(/\(\s*(?:G\d+-)?(?:UC|BR|MSG)[^)]*\)/gi, '')
    .trim();
};

const sanitizeResponsePayload = (payload: any): any => {
  if (!payload || typeof payload !== 'object') return payload;
  if (typeof payload.message === 'string') {
    payload.message = cleanDocCodes(payload.message);
  }
  if (payload.data && typeof payload.data === 'object' && typeof payload.data.message === 'string') {
    payload.data.message = cleanDocCodes(payload.data.message);
  }
  return payload;
};

// Response Interceptor: Handle Global Errors (401, 403, 500)
axiosClient.interceptors.response.use(
  (response) => sanitizeResponsePayload(response.data),
  async (error: AxiosError<{ message?: string }>) => {
    if (error.response?.data) {
      sanitizeResponsePayload(error.response.data);
    }
    if (error.response?.status === 401) {
      console.warn(
        '⚠️ Backend Spring Boot trả về 401 Unauthorized.'
      );

      // Kiểm tra xem có phiên thật không
      const hasToken = localStorage.getItem('accessToken') || localStorage.getItem('kidpro_token');
      const localUser = localStorage.getItem('kidpro_user');

      // Chỉ chuyển về login nếu thực sự không có phiên đăng nhập nào
      if (!hasToken && !localUser) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('kidpro_token');
        localStorage.removeItem('kidpro_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=true';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
