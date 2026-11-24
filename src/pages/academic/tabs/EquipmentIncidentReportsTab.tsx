import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Search, Clock, CheckCircle2, Hammer, RefreshCw, Filter, ImageOff, User, AlertTriangle, ClipboardList } from 'lucide-react';
import {
  equipmentIncidentApi,
  EquipmentIncidentItem,
  EquipmentIncidentStatus,
  formatDateTime,
  isUrgentOverdue,
  apiErrorMessage,
} from '../../../api/equipmentIncidentApi';
import { useToast } from '../../../contexts/ToastContext';
import { ProposalFormModal, ProposalPrefill } from './MaintenanceProposalsPanel';

type FilterStatus = 'ALL' | EquipmentIncidentStatus;

const STATUS_LABEL: Record<EquipmentIncidentStatus, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang sửa chữa',
  RESOLVED: 'Đã sửa xong',
};

/**
 * Phiếu báo hỏng CSVC giáo viên gửi (UC-67). Giáo vụ và BGH tiếp nhận, cập nhật tiến độ sửa chữa.
 * canPropose: giáo vụ lập kế hoạch sửa chữa ngay từ phiếu (UC-66 A1).
 */
export const EquipmentIncidentReportsTab: React.FC<{ canPropose?: boolean }> = ({ canPropose = true }) => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<EquipmentIncidentItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [proposalPrefill, setProposalPrefill] = useState<ProposalPrefill | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    setLoading(true);
    try {
      setIncidents(await equipmentIncidentApi.getAll());
    } catch (err: any) {
      error(apiErrorMessage(err, 'Không tải được danh sách phiếu báo hỏng'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Cập nhật cảnh báo quá hạn 2 giờ mỗi phút
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(
    () => ({
      total: incidents.length,
      pending: incidents.filter((i) => i.status === 'PENDING').length,
      inProgress: incidents.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((i) => i.status === 'RESOLVED').length,
      overdue: incidents.filter((i) => isUrgentOverdue(i, now)).length,
    }),
    [incidents, now],
  );

  const visible = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return incidents
      .filter(
        (i) =>
          (filterStatus === 'ALL' || i.status === filterStatus) &&
          (!q ||
            i.equipmentName.toLowerCase().includes(q) ||
            (i.equipmentCode || '').toLowerCase().includes(q) ||
            (i.classroomName || '').toLowerCase().includes(q) ||
            (i.reportedByName || '').toLowerCase().includes(q)),
      )
      // Khẩn cấp chưa xử lý lên đầu
      .sort((a, b) => Number(b.severity === 'URGENT' && b.status === 'PENDING') - Number(a.severity === 'URGENT' && a.status === 'PENDING'));
  }, [incidents, filterStatus, searchTerm]);

  const changeStatus = async (item: EquipmentIncidentItem, status: EquipmentIncidentStatus) => {
    setSavingId(item.incidentId);
    try {
      const updated = await equipmentIncidentApi.updateStatus(item.incidentId, status, notes[item.incidentId]);
      setIncidents((prev) => prev.map((i) => (i.incidentId === item.incidentId ? { ...i, ...updated } : i)));
      setNotes((prev) => ({ ...prev, [item.incidentId]: '' }));
      success(`Đã chuyển phiếu "${item.equipmentName}" sang: ${STATUS_LABEL[status]}`);
    } catch (err: any) {
      error(apiErrorMessage(err, 'Không cập nhật được trạng thái phiếu'));
    } finally {
      setSavingId(null);
    }
  };

  const statusBadge = (status: EquipmentIncidentStatus) => {
    const styles: Record<EquipmentIncidentStatus, string> = {
      PENDING: 'bg-[#E5A93C]/15 text-[#9E6900] border-[#E5A93C]/40',
      IN_PROGRESS: 'bg-[#275A4E]/10 text-[#275A4E] border-[#275A4E]/30',
      RESOLVED: 'bg-[#78C2AD]/20 text-[#1E4D40] border-[#78C2AD]',
    };
    const Icon = status === 'PENDING' ? Clock : status === 'IN_PROGRESS' ? Hammer : CheckCircle2;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${styles[status]}`}>
        <Icon className="w-3 h-3" /> {STATUS_LABEL[status]}
      </span>
    );
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'ALL', label: 'Tất cả', count: stats.total },
    { key: 'PENDING', label: 'Chờ xử lý', count: stats.pending },
    { key: 'IN_PROGRESS', label: 'Đang sửa', count: stats.inProgress },
    { key: 'RESOLVED', label: 'Đã sửa xong', count: stats.resolved },
  ];

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans']">
      <div className="bg-[#1E4D40] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-white/15 rounded-xl">
                <Wrench className="w-6 h-6 text-[#78C2AD]" />
              </span>
              <h2 className="text-2xl font-bold">Phiếu Báo Hỏng Cơ Sở Vật Chất</h2>
            </div>
            <p className="text-white/75 text-sm max-w-2xl">
              Giáo viên chọn thiết bị, chụp ảnh và gửi phiếu. Sự cố khẩn cấp phải được tiếp nhận trong 2 giờ (BR-052).
            </p>
          </div>
          <button
            onClick={load}
            className="min-h-[44px] flex items-center gap-2 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải lại
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/15">
          {[
            ['Tổng số phiếu', stats.total, 'text-white'],
            ['Chờ xử lý', stats.pending, 'text-[#E5A93C]'],
            ['Đang sửa chữa', stats.inProgress, 'text-white'],
            ['Đã sửa xong', stats.resolved, 'text-[#78C2AD]'],
            ['Khẩn cấp quá 2 giờ', stats.overdue, stats.overdue > 0 ? 'text-red-300' : 'text-white'],
          ].map(([label, value, color]) => (
            <div key={label as string} className="bg-white/10 rounded-xl p-3">
              <span className="text-xs text-white/70 block">{label}</span>
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 ml-1 mr-1 shrink-0" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filterStatus === f.key ? 'bg-[#275A4E] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo thiết bị, mã, phòng học, giáo viên..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#275A4E]"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">Đang tải...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">Không có phiếu báo hỏng nào.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((item) => {
            const overdue = isUrgentOverdue(item, now);
            return (
              <div
                key={item.incidentId}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 ${overdue ? 'border-[#DC2626]' : 'border-slate-200'}`}
              >
                <button
                  type="button"
                  onClick={() => item.photoUrl && setPreviewUrl(item.photoUrl)}
                  className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center"
                >
                  {item.photoUrl ? (
                    <img src={item.photoUrl} alt={item.equipmentName} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900">
                        {item.equipmentName}
                        {(item.damagedQuantity ?? 1) > 1 && <span className="text-slate-500 font-semibold"> × {item.damagedQuantity}</span>}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {item.classroomName}
                        {item.equipmentCode ? ` · Mã ${item.equipmentCode}` : ' · Ngoài danh mục'}
                      </p>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                  {item.severity === 'URGENT' && (
                    <p className={`text-xs font-bold flex items-center gap-1 ${overdue ? 'text-[#DC2626]' : 'text-[#9E6900]'}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {overdue ? 'Khẩn cấp: đã quá 2 giờ chưa tiếp nhận (BR-052)' : 'Khẩn cấp: nguy hiểm cho trẻ, tiếp nhận trong 2 giờ'}
                    </p>
                  )}
                  <p className="text-sm text-slate-700">{item.description}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {item.reportedByName || 'Giáo viên'} · {formatDateTime(item.reportedAt)}
                  </p>
                  {(item.handledByName || item.handlerNote) && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1">
                      {item.handledByName ? `${item.handledByName}: ` : ''}
                      {item.handlerNote || STATUS_LABEL[item.status]}
                      {item.resolvedAt ? ` · xong lúc ${formatDateTime(item.resolvedAt)}` : ''}
                    </p>
                  )}
                  {item.status !== 'RESOLVED' && (
                    <div className="space-y-2 pt-1">
                      <input
                        value={notes[item.incidentId] || ''}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [item.incidentId]: e.target.value }))}
                        placeholder="Ghi chú cho giáo viên (tuỳ chọn)"
                        className="w-full min-h-[44px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#275A4E]"
                      />
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'PENDING' && (
                          <button
                            disabled={savingId === item.incidentId}
                            onClick={() => changeStatus(item, 'IN_PROGRESS')}
                            className="min-h-[44px] px-3 rounded-xl text-sm font-bold border border-[#275A4E] text-[#275A4E] hover:bg-[#275A4E]/5 disabled:opacity-50"
                          >
                            Tiếp nhận sửa
                          </button>
                        )}
                        <button
                          disabled={savingId === item.incidentId}
                          onClick={() => changeStatus(item, 'RESOLVED')}
                          className="min-h-[44px] px-3 rounded-xl text-sm font-bold bg-[#275A4E] text-white hover:bg-[#1E4D40] disabled:opacity-50"
                        >
                          Đã sửa xong
                        </button>
                        {canPropose && (
                          <button
                            onClick={() =>
                              setProposalPrefill({
                                proposalType: 'REPAIR',
                                title: `Sửa ${item.equipmentName} - ${item.classroomName}`,
                                equipmentName: item.equipmentName,
                                quantity: item.damagedQuantity ?? 1,
                                reason: item.description,
                                incidentId: item.incidentId,
                              })
                            }
                            className="min-h-[44px] px-3 rounded-xl text-sm font-bold bg-[#E5A93C] text-slate-900 hover:bg-[#d99c2f] flex items-center gap-1.5"
                          >
                            <ClipboardList className="w-4 h-4" /> Lập kế hoạch sửa chữa
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <img src={previewUrl} alt="Ảnh hiện trường" className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}

      {proposalPrefill && (
        <ProposalFormModal
          prefill={proposalPrefill}
          onClose={() => setProposalPrefill(null)}
          onCreated={() => {
            setProposalPrefill(null);
            // Kế hoạch được duyệt ngay (≤ 10 triệu) thì phiếu chuyển Đang sửa chữa
            load();
          }}
        />
      )}
    </div>
  );
};
