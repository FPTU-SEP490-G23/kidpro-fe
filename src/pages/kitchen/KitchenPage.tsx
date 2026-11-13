import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShieldAlert,
  Thermometer,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { MealHeadcountLockDashboardTab } from './tabs/MealHeadcountLockDashboardTab';
import { AllergyDietaryManagementTab } from './tabs/AllergyDietaryManagementTab';
import { WeeklyMenuPlanningTab } from './tabs/WeeklyMenuPlanningTab';
import { FoodRetentionConsumptionTab } from './tabs/FoodRetentionConsumptionTab';
import { FoodSafetyThreeStepInspectionTab } from './tabs/FoodSafetyThreeStepInspectionTab';

export type KitchenTabKey = 'portions' | 'allergies' | 'menu' | 'retention' | 'three-step-inspection';

interface TabMeta {
  title: string;
  description: string;
  icon: React.ElementType;
}

const TAB_META: Record<KitchenTabKey, TabMeta> = {
  portions: {
    title: 'Dashboard Khóa Số Suất Ăn 08:30 AM',
    description: 'Chốt sĩ số bán trú thực tế mỗi sáng từ giáo viên để bộ phận bếp định lượng khẩu phần và xuất kho thực phẩm.',
    icon: Clock,
  },
  allergies: {
    title: 'Quản Lý Dị Ứng Thực Phẩm & Khay Ăn Cách Ly',
    description: 'Bóc tách thực đơn và chế biến khay ăn riêng biệt tuyệt đối an toàn cho trẻ có tiền sử dị ứng thực phẩm nặng.',
    icon: ShieldAlert,
  },
  menu: {
    title: 'Thiết Lập Thực Đơn Bán Trú Tuần',
    description: 'Lập kế hoạch dinh dưỡng cân bằng calo, tỷ lệ đạm - đường - béo cho từng độ tuổi mầm non theo tuần.',
    icon: UtensilsCrossed,
  },
  retention: {
    title: 'Tiêu Hao Thực Phẩm & Lưu Mẫu Thức Ăn 24H',
    description: 'Biên bản tiêu hao nguyên liệu trong ngày và quy trình niêm phong tủ lạnh lưu mẫu thức ăn tối thiểu 24 giờ.',
    icon: Thermometer,
  },
  'three-step-inspection': {
    title: 'Sổ Kiểm Thực 3 Bước & Lưu Mẫu (Quyết Định 1246/QĐ-BYT)',
    description: 'Quy trình kiểm tra an toàn thực phẩm 3 bước của Bộ Y Tế: Trước khi nhập - Trước khi chế biến - Trước khi ăn.',
    icon: ClipboardCheck,
  },
};

export const KitchenPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  const resolveTab = (param: string | null): KitchenTabKey => {
    if (param && param in TAB_META) {
      return param as KitchenTabKey;
    }
    if (location.pathname === '/kitchen/menus') return 'menu';
    if (location.pathname === '/kitchen/allergies') return 'allergies';
    if (location.pathname === '/kitchen/safety') return 'three-step-inspection';
    return 'portions';
  };

  const [activeTab, setActiveTab] = useState<KitchenTabKey>(() => {
    return resolveTab(searchParams.get('tab'));
  });

  useEffect(() => {
    setActiveTab(resolveTab(searchParams.get('tab')));
  }, [location.pathname, searchParams]);

  const currentMeta = TAB_META[activeTab] || TAB_META['portions'];
  const MetaIcon = currentMeta.icon;

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* HEADER PHÂN HỆ BÁO BẾP (ĐỘNG THEO USE CASE, HOÀN TOÀN KHÔNG CÓ THANH SCROLL NGANG) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white rounded-3xl shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bếp Bán Trú</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-emerald-100 border border-white/20">
              Quyết định 1246/QĐ-BYT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center text-[#78C2AD] shrink-0">
              <MetaIcon className="h-5 w-5" />
            </div>
            <span>{currentMeta.title}</span>
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl">
            {currentMeta.description}
          </p>
        </div>

        {/* BỘ CHỌN NGÀY LÀM VIỆC CỦA BẾP */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-2xl border border-white/20 bg-white/15 text-white placeholder-emerald-200 px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs focus:border-[#78C2AD] focus:outline-hidden min-h-[44px] cursor-pointer"
            />
            <CalendarDays className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* NỘI DUNG TỪNG PHÂN HỆ (RENDER TRỰC TIẾP, KHÔNG CÒN THANH SCROLL NGANG LÀM RỐI MẮT) */}
      <div className="bg-transparent">
        {/* Phân hệ 1:  - Theo dõi Dashboard Khóa số Suất ăn 08:30 */}
        {activeTab === 'portions' && (
          <MealHeadcountLockDashboardTab selectedDate={selectedDate} />
        )}

        {/* Phân hệ 2:  - Quản lý Dị ứng Thực phẩm & Chế độ Ăn riêng */}
        {activeTab === 'allergies' && <AllergyDietaryManagementTab />}

        {/* Phân hệ 3:  - Thiết Lập Thực Đơn Tuần Bán Trú */}
        {activeTab === 'menu' && <WeeklyMenuPlanningTab />}

        {/* Phân hệ 4:  - Xuất Báo cáo Tiêu hao Thực phẩm & Lưu mẫu 24h */}
        {activeTab === 'retention' && <FoodRetentionConsumptionTab />}

        {/* Phân hệ 5:  - Sổ Kiểm thực 3 Bước & Lưu Mẫu Thức Ăn 24H */}
        {activeTab === 'three-step-inspection' && (
          <FoodSafetyThreeStepInspectionTab initialDate={selectedDate} />
        )}
      </div>
    </div>
  );
};

export default KitchenPage;
