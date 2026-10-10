import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShieldAlert,
  Calendar,
  Thermometer,
  CalendarDays,
  ClipboardCheck
} from 'lucide-react';
import { MealHeadcountLockDashboardTab } from './tabs/MealHeadcountLockDashboardTab';
import { AllergyDietaryManagementTab } from './tabs/AllergyDietaryManagementTab';
import { WeeklyMenuPlanningTab } from './tabs/WeeklyMenuPlanningTab';
import { FoodRetentionConsumptionTab } from './tabs/FoodRetentionConsumptionTab';
import { FoodSafetyThreeStepInspectionTab } from './tabs/FoodSafetyThreeStepInspectionTab';

export const KitchenPage: React.FC = () => {
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'portions' | 'allergies' | 'menu' | 'retention' | 'three-step-inspection'>(() => {
    if (location.pathname === '/kitchen/menus') return 'menu';
    if (location.pathname === '/kitchen/allergies') return 'allergies';
    if (location.pathname === '/kitchen/safety') return 'three-step-inspection';
    return 'three-step-inspection';
  });

  useEffect(() => {
    if (location.pathname === '/kitchen/menus') {
      setActiveTab('menu');
    } else if (location.pathname === '/kitchen/allergies') {
      setActiveTab('allergies');
    } else if (location.pathname === '/kitchen/safety') {
      setActiveTab('three-step-inspection');
    }
  }, [location.pathname]);

  return (
    <div className="space-y-6">
      {/* HEADER PHÂN HỆ BÁO BẾP & DINH DƯỠNG */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E4D40] flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <UtensilsCrossed className="h-6 w-6" />
            </div>
            <span>Báo Bếp & Quản Lý Dinh Dưỡng Bán Trú</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Đóng băng số liệu 08:30 AM, khay ăn dị ứng cách ly, lập thực đơn tuần & lưu mẫu 24 giờ
          </p>
        </div>

        {/* BỘ CHỌN NGÀY LÀM VIỆC */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm text-slate-800 font-bold shadow-xs focus:border-[#275A4E] focus:outline-hidden min-h-[44px]"
            />
            <CalendarDays className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 4 PHÂN HỆ TABS CHÍNH CỦA BẾP ĂN BÁN TRÚ (UC-030, UC-031, UC-029, UC-032) */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        {/* Tab 1: UC-030 */}
        <button
          onClick={() => setActiveTab('portions')}
          className={`py-3.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'portions'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>UC-030: Khóa Suất Ăn 08:30</span>
        </button>

        {/* Tab 2: UC-031 */}
        <button
          onClick={() => setActiveTab('allergies')}
          className={`py-3.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'allergies'
              ? 'border-[#DC2626] text-[#DC2626]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>UC-031: Quản Lý Dị Ứng & Khay Ăn Riêng</span>
        </button>

        {/* Tab 3: UC-029 */}
        <button
          onClick={() => setActiveTab('menu')}
          className={`py-3.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'menu'
              ? 'border-[#E5A93C] text-[#E5A93C]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>UC-029: Thực Đơn Tuần Bán Trú</span>
        </button>

        {/* Tab 4: UC-032 */}
        <button
          onClick={() => setActiveTab('retention')}
          className={`py-3.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'retention'
              ? 'border-[#78C2AD] text-[#1E4D40]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Thermometer className="h-4 w-4" />
          <span>UC-032: Tiêu Hao & Lưu Mẫu 24H</span>
        </button>

        {/* Tab 5: UC-055 */}
        <button
          onClick={() => setActiveTab('three-step-inspection')}
          className={`py-3.5 px-5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
            activeTab === 'three-step-inspection'
              ? 'border-[#275A4E] text-[#275A4E]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>UC-055: Kiểm Thực 3 Bước & Lưu Mẫu (QĐ 1246/BYT)</span>
        </button>
      </div>

      {/* NỘI DUNG TỪNG PHÂN HỆ */}
      <div>
        {/* Phân hệ 5: UC-055 - Sổ Kiểm thực 3 Bước & Lưu Mẫu Thức Ăn 24H */}
        {activeTab === 'three-step-inspection' && (
          <FoodSafetyThreeStepInspectionTab initialDate={selectedDate} />
        )}

        {/* Phân hệ 1: UC-030 - Theo dõi Dashboard Khóa số Suất ăn 08:30 */}
        {activeTab === 'portions' && (
          <MealHeadcountLockDashboardTab selectedDate={selectedDate} />
        )}

        {/* Phân hệ 2: UC-031 - Quản lý Dị ứng Thực phẩm & Chế độ Ăn riêng */}
        {activeTab === 'allergies' && <AllergyDietaryManagementTab />}

        {/* Phân hệ 3: UC-029 - Thiết Lập Thực Đơn Tuần Bán Trú */}
        {activeTab === 'menu' && <WeeklyMenuPlanningTab />}

        {/* Phân hệ 4: UC-032 - Xuất Báo cáo Tiêu hao Thực phẩm & Lưu mẫu 24h */}
        {activeTab === 'retention' && <FoodRetentionConsumptionTab />}
      </div>
    </div>
  );
};

export default KitchenPage;
