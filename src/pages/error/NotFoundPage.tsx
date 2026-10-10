import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">404 - Không Tìm Thấy Trang</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được thay đổi trong hệ thống KIDPRO.
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

export default NotFoundPage;
