import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { User, UserRole, AuthState } from '../types/auth.types';
import { login } from '../api/authApi';

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

  // Khôi phục phiên làm việc khi load trang
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Ưu tiên kiểm tra token Spring Boot đã lưu (schema core)
        const savedAccessToken = localStorage.getItem('accessToken');
        const savedRole = localStorage.getItem('userRole') as UserRole;
        const savedUserId = localStorage.getItem('userId');
        const savedUser = localStorage.getItem('kidpro_user');

        if (savedAccessToken && savedRole && savedUserId) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedAccessToken}`;
          let normalizedRole = (savedRole?.replace('ROLE_', '') || 'SYSTEM_ADMIN') as UserRole;
          if ((normalizedRole as any) === 'SUPER_ADMIN') {
            normalizedRole = 'SYSTEM_ADMIN';
          }

          let parsedUser: User;
          if (savedUser) {
            try {
              parsedUser = JSON.parse(savedUser) as User;
            } catch {
              parsedUser = {
                id: savedUserId,
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
              id: savedUserId,
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
          setRole(parsedUser.role);
          setIsLoading(false);
          return;
        }

        // 2. Tiếp theo kiểm tra Supabase session nếu có
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            handleSupabaseSession(session);
            setIsLoading(false);
            return;
          }
        }

        // 3. Kiểm tra localStorage fallback (Local Development)
        const savedToken = localStorage.getItem('kidpro_token');
        if (savedUser && savedToken) {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser);
          setToken(savedToken);
          setRole(parsedUser.role);
        }
      } catch (err) {
        console.error('Lỗi khởi tạo phiên xác thực:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe thay đổi trạng thái từ Supabase
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleSupabaseSession(session);
        } else {
          // Chỉ clear nếu không ở chế độ mock development
          const savedUser = localStorage.getItem('kidpro_user');
          if (!savedUser) {
            setUser(null);
            setToken(null);
            setRole(null);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const handleSupabaseSession = async (session: any) => {
    const sbUser = session.user;

    // 1. Kiểm tra vai trò đã lưu trước đó trong localStorage
    let userRole: UserRole | undefined;
    const savedUser = localStorage.getItem('kidpro_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as User;
        if (parsed.email === sbUser.email && parsed.role) {
          userRole = parsed.role;
        }
      } catch {
        // bỏ qua nếu parse lỗi
      }
    }

    // 2. Kiểm tra vai trò trong user_metadata của Supabase Auth
    if (!userRole) {
      userRole = sbUser.user_metadata?.role as UserRole;
    }

    // 3. Nếu chưa có, truy vấn bảng users trên Supabase theo email
    if (!userRole && sbUser.email) {
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('role')
          .eq('email', sbUser.email)
          .maybeSingle();

        if (dbUser?.role) {
          userRole = dbUser.role as UserRole;
        }
      } catch {
        // bỏ qua nếu bảng chưa có hoặc quyền RLS
      }
    }

    // 4. Mặc định là SYSTEM_ADMIN để người dùng đăng nhập bằng Google lần đầu có toàn quyền trải nghiệm tất cả tính năng
    if (!userRole) {
      userRole = 'SYSTEM_ADMIN';
    }

    const appUser: User = {
      id: sbUser.id,
      email: sbUser.email || '',
      fullName: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Người dùng',
      avatarUrl: sbUser.user_metadata?.avatar_url,
      role: userRole,
      status: 'ACTIVE',
    };

    setUser(appUser);
    setToken(session.access_token);
    setRole(userRole);
    localStorage.setItem('kidpro_token', session.access_token);
    localStorage.setItem('kidpro_user', JSON.stringify(appUser));
  };

  // Chuyển đổi vai trò linh hoạt cho tài khoản đang đăng nhập (dành cho kiểm thử chức năng)
  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, role: newRole };
      localStorage.setItem('kidpro_user', JSON.stringify(updated));
      return updated;
    });
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

  // 2. Đăng nhập Email/Password qua Spring Boot REST API (/api/auth/login) -> lưu/xác thực vào schema core
  const loginWithPassword = async (email: string, password?: string) => {
    const data = await login(email, password);
    const normalizedRole = (data.role?.replace('ROLE_', '') || 'SYSTEM_ADMIN') as UserRole;

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
    localStorage.setItem('kidpro_token', data.token);
    localStorage.setItem('kidpro_user', JSON.stringify(appUser));
  };

  // 3. Mock Login nhanh cho 7 Vai trò (dành cho DEV & Demo)
  const mockLogin = (selectedRole: UserRole) => {
    const mockUsers: Record<UserRole, User> = {
      SYSTEM_ADMIN: { id: 'sa-01', email: 'admin@kidpro.edu.vn', fullName: 'Quản trị viên Hệ thống', role: 'SYSTEM_ADMIN', status: 'ACTIVE' },
      BGH: { id: 'bgh-01', email: 'hieutruong@kidpro.edu.vn', fullName: 'Cô Nguyễn Thu Hà (Hiệu Trưởng)', role: 'BGH', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
      GIAO_VU: { id: 'gv-01', email: 'giaovu@kidpro.edu.vn', fullName: 'Thầy Trần Quốc Bảo (Giáo vụ)', role: 'GIAO_VU', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
      KE_TOAN: { id: 'kt-01', email: 'ketoan@kidpro.edu.vn', fullName: 'Cô Lê Hoàng Mai (Kế toán)', role: 'KE_TOAN', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
      GIAO_VIEN: { id: 'tch-01', email: 'giaovien@kidpro.edu.vn', fullName: 'Cô Phạm Thị Lan (GV Lớp Mầm 1)', role: 'GIAO_VIEN', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
      BEP: { id: 'bep-01', email: 'bep@kidpro.edu.vn', fullName: 'Chú Nguyễn Văn Hùng (Bếp trưởng)', role: 'BEP', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
      PHU_HUYNH: { id: 'ph-01', email: 'phuhuynh@gmail.com', fullName: 'Anh Vũ Đình Trọng (Phụ huynh bé Bo)', role: 'PHU_HUYNH', status: 'ACTIVE', schoolId: 'a7553657-e409-415b-b2dc-5f26974a3b0a', schoolCode: 'KIDPRO_HANOI', schoolName: 'Trường Mầm Sống' },
    };

    const targetUser = mockUsers[selectedRole];
    const mockToken = `mock-token-${selectedRole.toLowerCase()}-jwt-string`;

    setUser(targetUser);
    setToken(mockToken);
    setRole(selectedRole);

    localStorage.setItem('accessToken', mockToken);
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userId', targetUser.id);
    localStorage.setItem('userEmail', targetUser.email);
    localStorage.setItem('userFullName', targetUser.fullName);
    if (targetUser.schoolId) localStorage.setItem('userSchoolId', targetUser.schoolId);
    if (targetUser.schoolName) localStorage.setItem('userSchoolName', targetUser.schoolName);
    if (targetUser.schoolCode) localStorage.setItem('userSchoolCode', targetUser.schoolCode);
    localStorage.setItem('kidpro_token', mockToken);
    localStorage.setItem('kidpro_user', JSON.stringify(targetUser));
    axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
  };

  // 4. Đăng xuất
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
