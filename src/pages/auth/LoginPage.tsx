import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { normalizeRole, getRoleHomePath } from '../../utils/formatters';
import { authApi } from '../../api/authApi';
import { ShieldCheck, LogIn, AlertCircle, KeyRound, Mail, X, CheckCircle2, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithPassword, user, role } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Trạng thái modal Quên Mật Khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

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

  // Đăng nhập nhanh 1 chạm cho tài khoản thử nghiệm
  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      setIsLoading(true);
      setErrorMsg('');
      await loginWithPassword(demoEmail, demoPass);
      const savedRole = localStorage.getItem('userRole');
      const cleanRole = normalizeRole(savedRole);
      navigate(getRoleHomePath(cleanRole), { replace: true });
    } catch (err: any) {
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Sai thông tin đăng nhập'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Mở Modal Quên mật khẩu
  const openForgotPasswordModal = () => {
    setForgotEmail(email.trim());
    setForgotSuccessMsg('');
    setForgotErrorMsg('');
    setIsForgotModalOpen(true);
  };

  // 4. Xử lý gửi yêu cầu Quên mật khẩu
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotErrorMsg('Vui lòng nhập địa chỉ email tài khoản.');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotErrorMsg('');
      setForgotSuccessMsg('');
      const res = await authApi.forgotPassword(forgotEmail.trim());
      setForgotSuccessMsg(res?.message || 'Mật khẩu ngẫu nhiên mới đã được gửi tới hòm thư Gmail của bạn.');
    } catch (err: any) {
      const errorText =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể gửi yêu cầu cấp lại mật khẩu. Vui lòng thử lại sau.';
      setForgotErrorMsg(errorText);
    } finally {
      setForgotLoading(false);
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-xs font-semibold text-[#275A4E] hover:underline cursor-pointer transition hover:text-[#1E4D40]"
                >
                  Quên mật khẩu?
                </button>
              </div>
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
                Tài khoản chạy thử nhanh (1 chạm)
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Thẻ Phụ Huynh Học Sinh nổi bật */}
            <div className="mb-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('nguyenvanhung.b1@kidpro.test', '123456')}
                className="w-full flex items-center gap-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/90 p-2.5 text-left hover:bg-emerald-100 hover:border-emerald-400 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <div className="w-9 h-9 rounded-xl bg-[#275A4E] text-white flex items-center justify-center text-lg shrink-0">
                  👨‍👩‍👧
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-emerald-950">Phụ Huynh Học Sinh</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 font-bold text-emerald-900">Bé Bảo (Lớp Chồi B1)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 truncate mt-0.5">nguyenvanhung.b1@kidpro.test • MK: 123456</p>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('giaovien@kidpro.edu.vn', 'password123')}
                className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/70 p-2 text-left hover:bg-teal-100/80 transition cursor-pointer disabled:opacity-50"
              >
                <span className="text-base">👩‍🏫</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-teal-950 truncate">Giáo Viên</p>
                  <p className="text-[10px] text-teal-700 truncate">giaovien@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('hieutruong@kidpro.edu.vn', 'password123')}
                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2 text-left hover:bg-emerald-100/80 transition cursor-pointer disabled:opacity-50"
              >
                <span className="text-base">🏫</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-950 truncate">Ban Giám Hiệu</p>
                  <p className="text-[10px] text-emerald-700 truncate">hieutruong@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('bep@kidpro.edu.vn', 'password123')}
                className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50/70 p-2 text-left hover:bg-orange-100/80 transition cursor-pointer disabled:opacity-50"
              >
                <span className="text-base">🍳</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-orange-950 truncate">Bộ phận Bếp</p>
                  <p className="text-[10px] text-orange-700 truncate">bep@kidpro.edu.vn</p>
                </div>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('ketoan@kidpro.edu.vn', 'password123')}
                className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 p-2 text-left hover:bg-blue-100/80 transition cursor-pointer disabled:opacity-50"
              >
                <span className="text-base">💵</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-950 truncate">Kế Toán</p>
                  <p className="text-[10px] text-blue-700 truncate">ketoan@kidpro.edu.vn</p>
                </div>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Mật khẩu mặc định: <span className="font-semibold text-slate-600">password123</span> (Phụ huynh: <span className="font-semibold text-slate-600">123456</span>)
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

      {/* Modal Quên Mật Khẩu */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#275A4E] flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quên mật khẩu?</h3>
                <p className="text-xs text-slate-500">Cấp lại mật khẩu mới tự động qua Gmail</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Nhập địa chỉ Gmail liên kết với tài khoản của bạn. Hệ thống sẽ tạo một mật khẩu ngẫu nhiên mới và gửi trực tiếp vào hòm thư Gmail của bạn.
            </p>

            {forgotSuccessMsg ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900 mb-1">Gửi mật khẩu thành công!</p>
                      <p className="leading-relaxed">{forgotSuccessMsg}</p>
                      <p className="mt-2 text-[11px] text-emerald-700">
                        💡 Vui lòng kiểm tra hộp thư đến (Inbox) hoặc Thư rác (Spam) để lấy mật khẩu đăng nhập.
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSuccessMsg('');
                  }}
                  className="w-full rounded-xl bg-[#275A4E] py-2.5 text-sm font-bold text-white hover:bg-[#1E4D40] transition cursor-pointer shadow-sm"
                >
                  Đã hiểu, quay lại đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                {forgotErrorMsg && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{forgotErrorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Địa chỉ Gmail tài khoản
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="vidu@gmail.com hoặc ten@kidpro.edu.vn"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={forgotLoading}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#275A4E] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-900/10 hover:bg-[#1E4D40] transition cursor-pointer disabled:opacity-50"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang gửi email...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Gửi mật khẩu mới</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
