import React, { useState } from 'react';
import { Calculator, Percent } from 'lucide-react';
import { FeeCatalogTab } from './FeeCatalogTab';
import { DiscountPolicyTab } from './DiscountPolicyTab';

export const FeePolicyManagementTab: React.FC = () => {
  const [subTab, setSubTab] = useState<'catalog' | 'discounts'>('catalog');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setSubTab('catalog')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            subTab === 'catalog'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Danh Mục Biểu Phí & Khoản Thu</span>
        </button>
        <button
          onClick={() => setSubTab('discounts')}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            subTab === 'discounts'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Chính Sách Miễn Giảm Học Phí</span>
        </button>
      </div>

      {subTab === 'catalog' ? <FeeCatalogTab /> : <DiscountPolicyTab />}
    </div>
  );
};

export default FeePolicyManagementTab;
