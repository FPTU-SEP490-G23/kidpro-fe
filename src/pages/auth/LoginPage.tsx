import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole, getRoleHomePath } from '../../utils/formatters';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithPassword, user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập thì tự động điều hướng đúng trang theo role
  useEffect(() => {
    if (user && role) {
      navigate(getRoleHomePath(role), { replace: true });
    }
  }, [user, role, navigate]);

  // 1. Đăng nhập qua Google OAuth
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

  // 2. Đăng nhập Email / Mật khẩu
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
      const savedRole = localStorage.getItem('userRole');
      const cleanRole = normalizeRole(savedRole);
      navigate(getRoleHomePath(cleanRole), { replace: true });
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Sai thông tin đăng nhập'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-50/50 via-slate-50 to-teal-50/30 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#275A4E] text-white shadow-lg shadow-emerald-900/15 mb-3">
            <ShieldCheck className="h-8 w-8 text-[#78C2AD]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">KIDPRO Ecosystem</h2>
          <p className="text-sm text-slate-500 mt-1">Hệ sinh thái Quản lý Giáo dục Mầm non Toàn diện</p>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Nút Đăng nhập Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-98 cursor-pointer disabled:opacity-50"
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
            <span>Đăng nhập với Google (Gmail)</span>
          </button>

          {/* Đường ngăn cách */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3 text-xs font-medium text-slate-400">
              hoặc đăng nhập bằng tài khoản
            </span>
          </div>

          {/* Form Đăng nhập Email / Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@kidpro.edu.vn"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#275A4E] py-3 text-sm font-bold text-white shadow-md shadow-emerald-900/10 hover:bg-[#1E4D40] transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}</span>
            </button>
          </form>

          {/* Tài khoản thử nghiệm nhanh (Demo Fast Login) */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tài khoản chạy thử nhanh
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('bep@kidpro.edu.vn');
                  setPassword('password123');
                }}
                className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/70 p-2 text-left hover:bg-orange-100/80 transition cursor-pointer"
              >
                <span className="text-base">🍳</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-orange-950 truncate">Bộ phận Bếp</p>
                  <p className="text-[10px] text-orange-700 truncate">bep@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('bgh@kidpro.edu.vn');
                  setPassword('password123');
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-left hover:bg-emerald-100/80 transition cursor-pointer"
              >
                <span className="text-base">🏫</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-950 truncate">Ban Giám Hiệu</p>
                  <p className="text-[10px] text-emerald-700 truncate">bgh@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('giaovien@kidpro.edu.vn');
                  setPassword('password123');
                }}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 p-2 text-left hover:bg-teal-100/80 transition cursor-pointer"
              >
                <span className="text-base">👩‍🏫</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-teal-950 truncate">Giáo Viên</p>
                  <p className="text-[10px] text-teal-700 truncate">giaovien@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('ketoan@kidpro.edu.vn');
                  setPassword('password123');
                }}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-2 text-left hover:bg-blue-100/80 transition cursor-pointer"
              >
                <span className="text-base">💵</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-950 truncate">Kế Toán</p>
                  <p className="text-[10px] text-blue-700 truncate">ketoan@kidpro.edu.vn</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Mật khẩu mặc định: <span className="font-semibold text-slate-600">password123</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-slate-100 pt-4 text-center">
          <p className="text-xs text-slate-400">
            KIDPRO v2.0 • Bản quyền thuộc Ban Quản Trị Hệ Thống
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
