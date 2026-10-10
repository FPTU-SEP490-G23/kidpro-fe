import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('KIDPRO ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] p-6 sm:p-10 flex flex-col items-center justify-center text-center font-['Plus_Jakarta_Sans'] bg-white rounded-3xl border border-slate-200/80 shadow-xs my-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#1E4D40]">
            {this.props.fallbackTitle || 'Đã xảy ra sự cố khi tải phân hệ'}
          </h2>

          <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
            {this.props.fallbackMessage ||
              'Hệ thống đang gặp gián đoạn tạm thời khi kết nối dữ liệu. Vui lòng thử tải lại trang hoặc quay về trang chủ làm việc.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs sm:text-sm font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-xs min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4 text-[#78C2AD]" />
              <span>Tải Lại Phân Hệ</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl transition flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Về Trang Chính</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>KIDPRO Kindergarten Safety &amp; Uptime Protocol</span>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
