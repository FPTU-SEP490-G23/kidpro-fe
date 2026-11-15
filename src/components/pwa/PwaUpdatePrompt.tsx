import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const PwaUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div className="text-xs">
          <p className="font-semibold text-white">Có bản cập nhật mới</p>
          <p className="text-slate-300 mt-0.5">Tải lại ứng dụng để áp dụng tính năng mới nhất.</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-xs text-slate-400 hover:text-white px-2 py-1"
        >
          Để sau
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg flex items-center gap-1 shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tải lại
        </button>
      </div>
    </div>
  );
};
