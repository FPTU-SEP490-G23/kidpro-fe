import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, X, CheckCircle2, XCircle, Clock, RefreshCw, ShieldCheck } from 'lucide-react';
import {
  equipmentIncidentApi,
  MaintenanceProposalItem,
  ProposalStatus,
  ProposalType,
  BGH_APPROVAL_THRESHOLD,
  formatVnd,
  formatDateTime,
  apiErrorMessage,
} from '../../../api/equipmentIncidentApi';
import { useToast } from '../../../contexts/ToastContext';

export interface ProposalPrefill {
  proposalType: ProposalType;
  title: string;
  equipmentName: string;
  quantity: number;
  reason: string;
  incidentId?: string;
}

const TYPE_LABEL: Record<ProposalType, string> = { REPAIR: 'Sửa chữa', PURCHASE: 'Mua sắm' };
const STATUS_LABEL: Record<ProposalStatus, string> = {
  PENDING: 'Chờ BGH duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
};

/** Form lập kế hoạch sửa chữa / mua sắm (giáo vụ). Dùng chung cho tab kế hoạch và nút trên phiếu báo hỏng. */
export const ProposalFormModal: React.FC<{
  prefill?: ProposalPrefill;
  onClose: () => void;
  onCreated: (item: MaintenanceProposalItem) => void;
}> = ({ prefill, onClose, onCreated }) => {
  const { success, error } = useToast();
  const [type, setType] = useState<ProposalType>(prefill?.proposalType || 'REPAIR');
  const [title, setTitle] = useState(prefill?.title || '');
  const [equipmentName, setEquipmentName] = useState(prefill?.equipmentName || '');
  const [quantity, setQuantity] = useState<number>(prefill?.quantity || 1);
  const [cost, setCost] = useState<string>('');
  const [reason, setReason] = useState(prefill?.reason || '');
  const [saving, setSaving] = useState(false);

  const costNumber = Number(cost || 0);
  // BR-052: sửa chữa ≤ 10 triệu giáo vụ tự duyệt; còn lại trình BGH
  const needsBgh = type === 'PURCHASE' || costNumber > BGH_APPROVAL_THRESHOLD;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !equipmentName.trim() || !reason.trim() || cost === '') {
      error('Vui lòng nhập đủ tiêu đề, thiết bị, chi phí dự kiến và lý do.');
      return;
    }
    if (quantity < 1 || costNumber < 0) {
      error('Số lượng phải lớn hơn 0 và chi phí không được âm.');
      return;
    }
    setSaving(true);
    try {
      const res = await equipmentIncidentApi.createProposal({
        proposalType: type,
        title: title.trim(),
        equipmentName: equipmentName.trim(),
        quantity,
        estimatedCost: costNumber,
        reason: reason.trim(),
        incidentId: prefill?.incidentId,
      });
      success(res.message || 'Đã lập kế hoạch.');
      onCreated(res.data);
    } catch (err: any) {
      error(apiErrorMessage(err, 'Không lập được kế hoạch.'));
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#275A4E]';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        <div className="p-5 bg-[#1E4D40] text-white flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#78C2AD]" /> Lập kế hoạch sửa chữa / mua sắm
          </h3>
          <button type="button" onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(['REPAIR', 'PURCHASE'] as ProposalType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`min-h-[44px] rounded-xl text-sm font-bold border transition ${
                  type === t ? 'bg-[#275A4E] text-white border-[#275A4E]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tiêu đề kế hoạch *</label>
            <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Sửa điều hòa phòng PA101" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Thiết bị *</label>
              <input className={input} value={equipmentName} onChange={(e) => setEquipmentName(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Số lượng *</label>
              <input type="number" min={1} className={input} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Chi phí dự kiến (đồng) *</label>
            <input type="number" min={0} step={1000} className={input} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ví dụ: 2500000" />
            {cost !== '' && (
              <p className={`mt-1.5 text-xs font-semibold ${needsBgh ? 'text-[#9E6900]' : 'text-[#275A4E]'}`}>
                {formatVnd(costNumber)} ·{' '}
                {needsBgh
                  ? type === 'PURCHASE'
                    ? 'Kế hoạch mua sắm sẽ trình Ban Giám Hiệu phê duyệt.'
                    : 'Trên 10 triệu đồng: bắt buộc Ban Giám Hiệu phê duyệt (BR-052).'
                  : 'Không quá 10 triệu đồng: giáo vụ được tự duyệt (BR-052).'}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Lý do đề xuất *</label>
            <textarea rows={3} className={input} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-sm font-bold disabled:opacity-50"
            >
              {saving ? 'Đang gửi...' : needsBgh ? 'Trình Ban Giám Hiệu' : 'Lập kế hoạch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Danh sách kế hoạch sửa chữa / mua sắm.
 * mode 'staff': giáo vụ lập và theo dõi; mode 'bgh': Ban Giám Hiệu phê duyệt (MSG-217) hoặc từ chối.
 */
export const MaintenanceProposalsPanel: React.FC<{ mode: 'staff' | 'bgh' }> = ({ mode }) => {
  const { success, error } = useToast();
  const [items, setItems] = useState<MaintenanceProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | ProposalStatus>(mode === 'bgh' ? 'PENDING' : 'ALL');
  const [showForm, setShowForm] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await equipmentIncidentApi.getProposals());
    } catch (err: any) {
      error(apiErrorMessage(err, 'Không tải được danh sách kế hoạch.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(
    () => ({
      ALL: items.length,
      PENDING: items.filter((i) => i.status === 'PENDING').length,
      APPROVED: items.filter((i) => i.status === 'APPROVED').length,
      REJECTED: items.filter((i) => i.status === 'REJECTED').length,
    }),
    [items],
  );
  const visible = items.filter((i) => filter === 'ALL' || i.status === filter);

  const review = async (item: MaintenanceProposalItem, action: 'approve' | 'reject') => {
    const note = (notes[item.proposalId] || '').trim();
    if (action === 'reject' && !note) {
      error('Vui lòng nhập lý do từ chối.');
      return;
    }
    setBusyId(item.proposalId);
    try {
      const res =
        action === 'approve'
          ? await equipmentIncidentApi.approveProposal(item.proposalId, note || undefined)
          : await equipmentIncidentApi.rejectProposal(item.proposalId, note);
      setItems((prev) => prev.map((i) => (i.proposalId === item.proposalId ? { ...i, ...res.data } : i)));
      success(res.message || 'Đã cập nhật kế hoạch.');
    } catch (err: any) {
      // MSG-218: kế hoạch đã được xử lý trước đó -> tải lại để thấy trạng thái mới
      error(apiErrorMessage(err, 'Không cập nhật được kế hoạch.'));
      load();
    } finally {
      setBusyId(null);
    }
  };

  const badge = (status: ProposalStatus) => {
    const style: Record<ProposalStatus, string> = {
      PENDING: 'bg-[#E5A93C]/15 text-[#9E6900] border-[#E5A93C]/40',
      APPROVED: 'bg-[#78C2AD]/20 text-[#1E4D40] border-[#78C2AD]',
      REJECTED: 'bg-red-50 text-[#DC2626] border-red-200',
    };
    const Icon = status === 'PENDING' ? Clock : status === 'APPROVED' ? CheckCircle2 : XCircle;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${style[status]}`}>
        <Icon className="w-3 h-3" /> {STATUS_LABEL[status]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#1E4D40] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#275A4E]" />
            {mode === 'bgh' ? 'Duyệt kế hoạch sửa chữa / mua sắm trang thiết bị' : 'Kế hoạch sửa chữa / mua sắm'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sửa chữa trên 10 triệu đồng và mọi kế hoạch mua sắm phải được Ban Giám Hiệu phê duyệt (BR-052).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={load} title="Tải lại" className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {mode === 'staff' && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="min-h-[44px] px-4 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-sm font-bold flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#78C2AD]" /> Lập kế hoạch
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${
              filter === key ? 'bg-[#275A4E] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {key === 'ALL' ? 'Tất cả' : STATUS_LABEL[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">Đang tải...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">Không có kế hoạch nào.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visible.map((p) => (
            <div key={p.proposalId} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase text-[#275A4E]">{TYPE_LABEL[p.proposalType]}</span>
                  <h3 className="font-bold text-slate-900">{p.title}</h3>
                </div>
                {badge(p.status)}
              </div>
              <p className="text-sm text-slate-700">
                {p.equipmentName} × {p.quantity}
                {p.incidentClassroomName ? ` · ${p.incidentClassroomName}` : ''}
              </p>
              <p className="text-sm font-bold text-[#1E4D40]">
                Chi phí dự kiến: {formatVnd(p.estimatedCost)}
                {p.estimatedCost > BGH_APPROVAL_THRESHOLD && (
                  <span className="ml-2 text-[11px] font-semibold text-[#9E6900]">trên 10 triệu</span>
                )}
              </p>
              <p className="text-xs text-slate-600">Lý do: {p.reason}</p>
              <p className="text-xs text-slate-500">
                Lập bởi {p.createdByName || 'Giáo vụ'} · {formatDateTime(p.createdAt)}
              </p>
              {p.reviewedByName && (
                <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-2 py-1.5 flex items-start gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#275A4E]" />
                  <span>
                    {p.autoApproved ? 'Giáo vụ tự duyệt' : p.reviewedByName} · {formatDateTime(p.reviewedAt)}
                    {p.reviewNote ? `: ${p.reviewNote}` : ''}
                  </span>
                </p>
              )}
              {mode === 'bgh' && p.status === 'PENDING' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    value={notes[p.proposalId] || ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [p.proposalId]: e.target.value }))}
                    placeholder="Ghi chú (bắt buộc khi từ chối)"
                    className="flex-1 min-h-[44px] px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#275A4E]"
                  />
                  <button
                    type="button"
                    disabled={busyId === p.proposalId}
                    onClick={() => review(p, 'reject')}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-bold border border-red-200 text-[#DC2626] hover:bg-red-50 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.proposalId}
                    onClick={() => review(p, 'approve')}
                    className="min-h-[44px] px-4 rounded-xl text-sm font-bold bg-[#275A4E] hover:bg-[#1E4D40] text-white disabled:opacity-50"
                  >
                    Phê duyệt
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProposalFormModal
          onClose={() => setShowForm(false)}
          onCreated={(item) => {
            setShowForm(false);
            setItems((prev) => [item, ...prev]);
          }}
        />
      )}
    </div>
  );
};
