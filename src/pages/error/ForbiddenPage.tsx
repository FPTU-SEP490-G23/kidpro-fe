import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleDisplayName } from '../../utils/formatters';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">403 - Giới Hạn Truy Cập</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Tài khoản của bạn với vai trò{' '}
        <span className="font-bold text-slate-700">
          {role ? getRoleDisplayName(role) : 'Khách'}
        </span>{' '}
        không có quyền truy cập vào phân hệ này theo phân quyền RBAC của KIDPRO.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
      >
        <Home className="h-4 w-4" />
        <span>Về trang chủ Dashboard</span>
      </button>
    </div>
  );
};

export default ForbiddenPage;
