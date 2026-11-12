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

// Hàm xử lý đăng nhập qua Email / Mật khẩu
export const login = async (email: string, password?: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    const { token, role, userId, email: userEmail, schoolId, schoolName, schoolCode, fullName } = response.data;

    localStorage.setItem('accessToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', String(userId));
    if (userEmail) localStorage.setItem('userEmail', userEmail);
    if (fullName) localStorage.setItem('userFullName', fullName);
    if (schoolId) localStorage.setItem('userSchoolId', String(schoolId));
    if (schoolName) localStorage.setItem('userSchoolName', schoolName);
    if (schoolCode) localStorage.setItem('userSchoolCode', schoolCode);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Đăng nhập không thành công';
  }
};

// Hàm xử lý đăng nhập qua Google OAuth (đồng bộ nhận Spring Boot JWT)
export const loginGoogle = async (googleUser: {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  accessToken: string;
}): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/google`, googleUser);
    const { token, role, userId, email: userEmail, schoolId, schoolName, schoolCode, fullName } = response.data;

    localStorage.setItem('accessToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userId', String(userId));
    if (userEmail) localStorage.setItem('userEmail', userEmail);
    if (fullName) localStorage.setItem('userFullName', fullName);
    if (schoolId) localStorage.setItem('userSchoolId', String(schoolId));
    if (schoolName) localStorage.setItem('userSchoolName', schoolName);
    if (schoolCode) localStorage.setItem('userSchoolCode', schoolCode);

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    return response.data;
  } catch (error: any) {
    throw error.response?.data?.message || 'Đăng nhập Google không thành công';
  }
};

export const authApi = {
  login: (data: { email: string; password?: string }) => login(data.email, data.password),
  loginGoogle,
  getCurrentUser: () => {
    return axiosClient.get<User>('/auth/me');
  },
  forgotPassword: async (email: string) => {
    const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
    return response.data;
  },
};

export default authApi;
