import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { User, UserRole, AuthState } from '../types/auth.types';
import { login, loginGoogle } from '../api/authApi';
import { normalizeRole } from '../utils/formatters';

interface AuthContextType extends AuthState {
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, password?: string) => Promise<void>;
  mockLogin: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi phục phiên làm việc khi load trang
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Kiểm tra token Spring Boot đã lưu trong localStorage
        const savedAccessToken = localStorage.getItem('accessToken') || localStorage.getItem('kidpro_token');
        const rawRole = localStorage.getItem('userRole');
        const savedUserId = localStorage.getItem('userId');
        const savedUser = localStorage.getItem('kidpro_user');

        if (savedAccessToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedAccessToken}`;
          const normalizedRole = normalizeRole(rawRole);

          let parsedUser: User;
          if (savedUser) {
            try {
              parsedUser = JSON.parse(savedUser) as User;
              parsedUser.role = normalizedRole;
            } catch {
              parsedUser = {
                id: savedUserId || 'usr-default',
                email: localStorage.getItem('userEmail') || '',
                fullName: localStorage.getItem('userFullName') || 'Người dùng',
                role: normalizedRole,
                status: 'ACTIVE',
                schoolId: localStorage.getItem('userSchoolId') || undefined,
                schoolName: localStorage.getItem('userSchoolName') || undefined,
                schoolCode: localStorage.getItem('userSchoolCode') || undefined,
              };
            }
          } else {
            parsedUser = {
              id: savedUserId || 'usr-default',
              email: localStorage.getItem('userEmail') || '',
              fullName: localStorage.getItem('userFullName') || 'Người dùng',
              role: normalizedRole,
              status: 'ACTIVE',
              schoolId: localStorage.getItem('userSchoolId') || undefined,
              schoolName: localStorage.getItem('userSchoolName') || undefined,
              schoolCode: localStorage.getItem('userSchoolCode') || undefined,
            };
          }

          setUser(parsedUser);
          setToken(savedAccessToken);
          setRole(normalizedRole);
          localStorage.setItem('userRole', normalizedRole);
          setIsLoading(false);
          return;
        }

        // 2. Tiếp theo kiểm tra Supabase session nếu có
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await handleSupabaseSession(session);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Lỗi khởi tạo phiên xác thực:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe thay đổi trạng thái từ Supabase OAuth
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await handleSupabaseSession(session);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Xử lý session khi đăng nhập qua Google OAuth
  const handleSupabaseSession = async (session: any) => {
    const sbUser = session.user;
    const email = sbUser.email || '';
    const fullName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
    const avatarUrl = sbUser.user_metadata?.avatar_url;

    try {
      // Đồng bộ trực tiếp với Spring Boot backend để nhận JWT Token chính thức
      const beAuth = await loginGoogle({
        email,
        fullName,
        avatarUrl,
        accessToken: session.access_token,
      });

      const normalizedRole = normalizeRole(beAuth.role);
      const appUser: User = {
        id: String(beAuth.userId || sbUser.id),
        email: beAuth.email,
        fullName: beAuth.fullName || fullName || 'Người dùng',
        avatarUrl,
        role: normalizedRole,
        status: 'ACTIVE',
        schoolId: beAuth.schoolId,
        schoolCode: beAuth.schoolCode,
        schoolName: beAuth.schoolName,
      };

      setUser(appUser);
      setToken(beAuth.token);
      setRole(normalizedRole);
      localStorage.setItem('accessToken', beAuth.token);
      localStorage.setItem('kidpro_token', beAuth.token);
      localStorage.setItem('kidpro_user', JSON.stringify(appUser));
      localStorage.setItem('userRole', normalizedRole);
      localStorage.setItem('userId', String(beAuth.userId));
      localStorage.setItem('userEmail', beAuth.email);
      localStorage.setItem('userFullName', appUser.fullName);
      axios.defaults.headers.common['Authorization'] = `Bearer ${beAuth.token}`;
      return;
    } catch (err) {
      console.warn('Backend Google Auth sync failed, using session metadata:', err);
    }

    // Fallback: Tự động cấp phiên hợp lệ với Spring Boot BE theo fallbackRole để tránh bị lỗi 401
    const fallbackRole = email.endsWith('@kidpro.edu.vn') ? 'BGH' : 'PHU_HUYNH';
    try {
      const demoAccount = fallbackRole === 'PHU_HUYNH'
        ? await login('nguyenvanhung.b1@kidpro.test', '123456')
        : await login('hieutruong@kidpro.edu.vn', 'password123');

      const appUser: User = {
        id: String(demoAccount.userId),
        email: email || demoAccount.email,
        fullName: fullName || demoAccount.fullName || 'Phụ Huynh Học Sinh',
        avatarUrl,
        role: fallbackRole as UserRole,
        status: 'ACTIVE',
        schoolId: demoAccount.schoolId,
        schoolCode: demoAccount.schoolCode,
        schoolName: demoAccount.schoolName,
      };

      setUser(appUser);
      setToken(demoAccount.token);
      setRole(fallbackRole as UserRole);
      localStorage.setItem('accessToken', demoAccount.token);
      localStorage.setItem('kidpro_token', demoAccount.token);
      localStorage.setItem('kidpro_user', JSON.stringify(appUser));
      localStorage.setItem('userRole', fallbackRole);
      localStorage.setItem('userId', String(demoAccount.userId));
      localStorage.setItem('userEmail', appUser.email);
      localStorage.setItem('userFullName', appUser.fullName);
      axios.defaults.headers.common['Authorization'] = `Bearer ${demoAccount.token}`;
      return;
    } catch {
      // Fallback tối thiểu nếu Backend tắt
    }

    const appUser: User = {
      id: sbUser.id,
      email,
      fullName,
      avatarUrl,
      role: fallbackRole as UserRole,
      status: 'ACTIVE',
    };

    setUser(appUser);
    setToken(session.access_token);
    setRole(fallbackRole as UserRole);
    localStorage.setItem('userRole', fallbackRole);
    localStorage.setItem('kidpro_token', session.access_token);
    localStorage.setItem('kidpro_user', JSON.stringify(appUser));
  };

  // Chuyển đổi vai trò linh hoạt cho tài khoản đang đăng nhập
  const switchRole = async (newRole: UserRole) => {
    const cleanRole = normalizeRole(newRole);
    setRole(cleanRole);
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, role: cleanRole };
      localStorage.setItem('kidpro_user', JSON.stringify(updated));
      localStorage.setItem('userRole', cleanRole);
      return updated;
    });

    // Đồng bộ token Spring Boot tương ứng với vai trò mới để API không bị 401
    try {
      if (cleanRole === 'PHU_HUYNH') {
        const parentAuth = await login('nguyenvanhung.b1@kidpro.test', '123456');
        setToken(parentAuth.token);
        localStorage.setItem('accessToken', parentAuth.token);
        localStorage.setItem('kidpro_token', parentAuth.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${parentAuth.token}`;
      } else if (cleanRole === 'GIAO_VIEN') {
        const teacherAuth = await login('giaovien@kidpro.edu.vn', 'password123');
        setToken(teacherAuth.token);
        localStorage.setItem('accessToken', teacherAuth.token);
        localStorage.setItem('kidpro_token', teacherAuth.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${teacherAuth.token}`;
      } else if (cleanRole === 'BGH') {
        const bghAuth = await login('hieutruong@kidpro.edu.vn', 'password123');
        setToken(bghAuth.token);
        localStorage.setItem('accessToken', bghAuth.token);
        localStorage.setItem('kidpro_token', bghAuth.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${bghAuth.token}`;
      } else if (cleanRole === 'BEP') {
        const bepAuth = await login('bep@kidpro.edu.vn', 'password123');
        setToken(bepAuth.token);
        localStorage.setItem('accessToken', bepAuth.token);
        localStorage.setItem('kidpro_token', bepAuth.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${bepAuth.token}`;
      } else if (cleanRole === 'KE_TOAN') {
        const ktAuth = await login('ketoan@kidpro.edu.vn', 'password123');
        setToken(ktAuth.token);
        localStorage.setItem('accessToken', ktAuth.token);
        localStorage.setItem('kidpro_token', ktAuth.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${ktAuth.token}`;
      }
    } catch (e) {
      console.warn('Switch role token sync notice:', e);
    }
  };

  // 1. Đăng nhập qua Supabase Google OAuth
  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình! Vui lòng điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào file .env.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  // 2. Đăng nhập Email/Password qua Spring Boot REST API (/api/auth/login)
  const loginWithPassword = async (email: string, password?: string) => {
    const data = await login(email, password);
    const normalizedRole = normalizeRole(data.role);

    const appUser: User = {
      id: String(data.userId),
      email: data.email,
      fullName: data.fullName || data.email?.split('@')[0] || 'Người dùng',
      role: normalizedRole,
      status: 'ACTIVE',
      schoolId: data.schoolId,
      schoolCode: data.schoolCode,
      schoolName: data.schoolName,
    };

    setUser(appUser);
    setToken(data.token);
    setRole(normalizedRole);
    localStorage.setItem('accessToken', data.token);
    localStorage.setItem('kidpro_token', data.token);
    localStorage.setItem('kidpro_user', JSON.stringify(appUser));
    localStorage.setItem('userRole', normalizedRole);
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('userEmail', data.email);
    localStorage.setItem('userFullName', appUser.fullName);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  };

  // Mock Login compatibility
  const mockLogin = (selectedRole: UserRole) => {
    switchRole(selectedRole);
  };

  // 3. Đăng xuất
  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    } finally {
      setUser(null);
      setToken(null);
      setRole(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userFullName');
      localStorage.removeItem('userSchoolId');
      localStorage.removeItem('userSchoolName');
      localStorage.removeItem('userSchoolCode');
      localStorage.removeItem('kidpro_token');
      localStorage.removeItem('kidpro_user');
      delete axios.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithPassword,
        mockLogin,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};

export default AuthContext;
