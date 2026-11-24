import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Wrench, ClipboardList } from 'lucide-react';
import { EquipmentManagementTab } from './EquipmentManagementTab';
import { EquipmentIncidentReportsTab } from './EquipmentIncidentReportsTab';
import { MaintenanceProposalsPanel } from './MaintenanceProposalsPanel';
import { equipmentIncidentApi } from '../../../api/equipmentIncidentApi';

type View = 'catalog' | 'incidents' | 'proposals';

/**
 * Trang thiết bị của giáo vụ ('/academic/equipment'):
 * danh mục thiết bị (UC-66), phiếu báo hỏng giáo viên gửi (UC-67), kế hoạch sửa chữa / mua sắm (UC-66 A1).
 * '?view=incidents' / '?view=proposals' mở thẳng phần tương ứng (link từ thông báo).
 */
export const EquipmentWithIncidentsTab: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get('view');
  const view: View = param === 'incidents' || param === 'proposals' ? param : 'catalog';
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Số phiếu chờ xử lý trên nút chuyển; tải lại khi đổi chế độ xem
  useEffect(() => {
    equipmentIncidentApi
      .getAll('PENDING')
      .then((list) => setPendingCount(list.length))
      .catch(() => setPendingCount(0));
  }, [view]);

  const switchTo = (next: View) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'catalog') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  const tabClass = (active: boolean) =>
    `min-h-[44px] flex items-center gap-2 px-4 rounded-xl text-sm font-semibold transition-colors ${
      active ? 'bg-[#275A4E] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
    }`;

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-slate-100 border border-slate-200">
        <button type="button" className={tabClass(view === 'catalog')} onClick={() => switchTo('catalog')}>
          <Boxes className="w-4 h-4" /> Danh mục thiết bị
        </button>
        <button type="button" className={tabClass(view === 'incidents')} onClick={() => switchTo('incidents')}>
          <Wrench className="w-4 h-4" /> Phiếu báo hỏng
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-900">
              {pendingCount} chờ xử lý
            </span>
          )}
        </button>
        <button type="button" className={tabClass(view === 'proposals')} onClick={() => switchTo('proposals')}>
          <ClipboardList className="w-4 h-4" /> Kế hoạch sửa chữa / mua sắm
        </button>
      </div>

      {view === 'incidents' && <EquipmentIncidentReportsTab />}
      {view === 'proposals' && <MaintenanceProposalsPanel mode="staff" />}
      {view === 'catalog' && <EquipmentManagementTab />}
    </div>
  );
};
