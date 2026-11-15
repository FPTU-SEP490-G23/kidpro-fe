import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra trạng thái đã cài đặt (Standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // 2. Kiểm tra thiết bị iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|optios|edgios/.test(ua);
    setIsIOS(isIosDevice && isSafari);

    // 3. Bắt sự kiện beforeinstallprompt (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Kiểm tra xem người dùng đã đóng banner trong phiên này chưa
    if (sessionStorage.getItem('pwa_banner_dismissed') === 'true') {
      setDismissed(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // Không hiển thị nếu đã cài đặt (standalone), hoặc đã tắt, hoặc không có prompt và không phải iOS
  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-white border border-blue-200 shadow-2xl rounded-2xl p-4 transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md flex-shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Cài đặt ứng dụng KIDPRO</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Dùng như app điện thoại mượt mà, truy cập camera nhanh và tiện lợi hơn.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 touch-target -mr-1 -mt-1"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 bg-slate-50 p-2.5 rounded-xl">
          <p className="font-medium text-blue-700">Cách cài trên iPhone / iPad (Safari):</p>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
            <span>Chạm vào nút <strong>Chia sẻ</strong> <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> ở thanh dưới.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
            <span>Cuộn xuống và chọn <strong>Thêm vào MH chính</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" />.</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium rounded-lg"
          >
            Để sau
          </button>
          <button
            onClick={handleInstallClick}
            className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Cài đặt ngay
          </button>
        </div>
      )}
    </div>
  );
};
