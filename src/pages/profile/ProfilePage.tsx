import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userProfileApi } from '../../api/userProfileApi';
import { UserProfile } from '../../types/userProfile.types';
import PersonalProfileTab from './components/PersonalProfileTab';
import SecurityPasswordTab from './components/SecurityPasswordTab';
import { User, Shield, AlertTriangle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>(
    tabFromUrl === 'security' || tabFromUrl === 'password' ? 'security' : 'profile'
  );

  useEffect(() => {
    const current = searchParams.get('tab');
    if (current === 'security' || current === 'password') {
      setActiveTab('security');
    }
  }, [searchParams]);

  // Lấy dữ liệu hồ sơ với React Query
  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserProfile>({
    queryKey: ['user-profile-me'],
    queryFn: () => userProfileApi.getProfile(),
  });

  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);

  // Đồng bộ profile khi fetch xong
  React.useEffect(() => {
    if (profile) {
      setCurrentProfile(profile);
    }
  }, [profile]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
            Hồ sơ Cá nhân & Cài đặt Tài khoản
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin định danh, số điện thoại liên lạc và thiết lập bảo mật tài khoản cá nhân
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#275A4E] text-[#275A4E] bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Thông tin cá nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-[#275A4E] text-[#275A4E] bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Bảo mật & Đổi Mật khẩu</span>
        </button>
      </div>

      {/* Nội dung Tab */}
      {isLoading ? (
        // Skeleton loader
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 animate-pulse">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-slate-200" />
              <div className="space-y-3 flex-1">
                <div className="h-5 w-48 bg-slate-200 rounded-lg" />
                <div className="h-4 w-72 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 rounded-xl" />
            <div className="h-10 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-medium text-rose-800">
            Không thể tải thông tin hồ sơ người dùng.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-[#275A4E] hover:bg-[#1E4D40]"
          >
            Thử lại
          </button>
        </div>
      ) : currentProfile ? (
        <>
          {activeTab === 'profile' && (
            <PersonalProfileTab
              profile={currentProfile}
              onProfileUpdated={(updated) => setCurrentProfile(updated)}
            />
          )}

          {activeTab === 'security' && <SecurityPasswordTab />}
        </>
      ) : null}
    </div>
  );
};

export default ProfilePage;
