import React, { useState } from 'react';
import { ClipboardList, Wrench } from 'lucide-react';
import { MaintenanceProposalsPanel } from '../academic/tabs/MaintenanceProposalsPanel';
import { EquipmentIncidentReportsTab } from '../academic/tabs/EquipmentIncidentReportsTab';

/** BGH: phê duyệt kế hoạch sửa chữa / mua sắm (UC-66 A1, MSG-217, MSG-218) và theo dõi phiếu báo hỏng CSVC (UC-67). */
const BghFacilityRepairsPage: React.FC = () => {
  const [view, setView] = useState<'proposals' | 'incidents'>('proposals');

  const tabClass = (active: boolean) =>
    `min-h-[44px] flex items-center gap-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
      active ? 'bg-[#275A4E] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
    }`;

  return (
    <div className="px-6 py-4 space-y-4 font-['Plus_Jakarta_Sans']">
      <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200">
        <button type="button" className={tabClass(view === 'proposals')} onClick={() => setView('proposals')}>
          <ClipboardList className="w-4 h-4" /> Duyệt kế hoạch sửa chữa / mua sắm
        </button>
        <button type="button" className={tabClass(view === 'incidents')} onClick={() => setView('incidents')}>
          <Wrench className="w-4 h-4" /> Phiếu báo hỏng CSVC
        </button>
      </div>
      {view === 'proposals' ? <MaintenanceProposalsPanel mode="bgh" /> : <EquipmentIncidentReportsTab canPropose={false} />}
    </div>
  );
};

export default BghFacilityRepairsPage;
