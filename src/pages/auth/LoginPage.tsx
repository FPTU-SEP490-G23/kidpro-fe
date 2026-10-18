import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';
import { getRoleDisplayName, getRoleHomePath } from '../../utils/formatters';
import { ShieldCheck, LogIn, Sparkles, AlertCircle, Info } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithPassword, mockLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Đăng nhập qua Supabase Google OAuth
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đăng nhập bằng Google');
      setIsLoading(false);
    }
  };

  // 2. Đăng nhập Email/Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Vui lòng nhập email');
      return;
    }
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithPassword(email, password);
      const savedRole = (localStorage.getItem('userRole')?.replace('ROLE_', '') || 'SYSTEM_ADMIN') as UserRole;
      navigate(getRoleHomePath(savedRole));
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Sai thông tin đăng nhập'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Chọn nhanh Role để trải nghiệm thử
  const handleSelectMockRole = (role: UserRole) => {
    mockLogin(role);
    navigate(getRoleHomePath(role));
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-pink-50 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-3">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">KIDPRO Ecosystem</h2>
          <p className="text-sm text-slate-500 mt-1">Hệ sinh thái Quản lý Mầm non Toàn diện</p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Nút Đăng nhập Supabase Google OAuth */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:border-slate-400 transition"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập với Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">Hoặc đăng nhập với Email</span>
            </div>
          </div>

          {/* Form Email / Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email tài khoản</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: giaovien@kidpro.edu.vn"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập'}</span>
            </button>
          </form>
        </div>

        {/* Demo Fast Role Switcher */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Thử nghiệm nhanh theo Vai trò (Dev Quick Switch)</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['SYSTEM_ADMIN', 'BGH', 'GIAO_VIEN', 'BEP', 'KE_TOAN', 'GIAO_VU', 'PHU_HUYNH'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleSelectMockRole(r)}
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2 text-left font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition"
              >
                {getRoleDisplayName(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Status Banner */}
        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200/60 flex items-start gap-2">
          <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Đăng nhập Email xác thực trực tiếp qua Spring Boot REST API (`core.users`), cấp quyền tự động cho 7 vai trò.
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
