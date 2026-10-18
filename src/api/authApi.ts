import axios from 'axios';
import axiosClient from './axiosClient';
import { User } from '../types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface LoginResponse {
  token: string;
  type?: string;
  userId: string;
  email: string;
  role: string;
  fullName?: string;
  schoolId?: string;
  schoolCode?: string;
  schoolName?: string;
}

// Hàm xử lý Đăng nhập qua Spring Boot REST API
export const login = async (email: string, password?: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    // Kết quả trả về gồm: { token, type: "Bearer", userId, email, role, schoolId, schoolCode, schoolName }
    const { token, role, userId, email: userEmail, schoolId, schoolName, schoolCode, fullName } = response.data;

    // Lưu token và thông tin người dùng vào localStorage
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', String(userId));
    if (userEmail) {
      localStorage.setItem('userEmail', userEmail);
    }
    if (fullName) {
      localStorage.setItem('userFullName', fullName);
    }
    if (schoolId) {
      localStorage.setItem('userSchoolId', String(schoolId));
    } else {
      localStorage.removeItem('userSchoolId');
    }
    if (schoolName) {
      localStorage.setItem('userSchoolName', schoolName);
    } else {
      localStorage.removeItem('userSchoolName');
    }
    if (schoolCode) {
      localStorage.setItem('userSchoolCode', schoolCode);
    } else {
      localStorage.removeItem('userSchoolCode');
    }

    // Cấu hình Authorization header mặc định cho các request sau
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Đăng nhập không thành công';
  }
};

export const authApi = {
  login: (data: { email: string; password?: string }) => login(data.email, data.password),

  getCurrentUser: () => {
    return axiosClient.get<User>('/auth/me');
  },
};

export default authApi;
