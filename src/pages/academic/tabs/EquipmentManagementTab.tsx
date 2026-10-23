import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Building,
  History,
  X,
  FileText,
  Tag,
  Package,
  Sparkles
} from 'lucide-react';
import { equipmentService } from '../../../services/equipmentService';
import {
  EquipmentInventoryResponse,
  EquipmentCategory,
  EquipmentStatus,
  CreateEquipmentPayload,
  TransferEquipmentPayload,
  EquipmentTransferLogResponse
} from '../../../types/equipment.types';
import { academicApi } from '../../../api/academicApi';
import { ClassEntity } from '../../../types/classroom.types';

export const EquipmentManagementTab: React.FC = () => {
  // State
  const [inventories, setInventories] = useState<EquipmentInventoryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [rooms, setRooms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [transferTarget, setTransferTarget] = useState<EquipmentInventoryResponse | null>(null);
  const [transferLogs, setTransferLogs] = useState<EquipmentTransferLogResponse[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  // Form states - Create
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<EquipmentCategory>('STEAM');
  const [newUnit, setNewUnit] = useState<string>('Bộ');
  const [newRoomId, setNewRoomId] = useState<string>('');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newDescription, setNewDescription] = useState<string>('');
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states - Transfer
  const [toRoomId, setToRoomId] = useState<string>('');
  const [transferQty, setTransferQty] = useState<number>(1);
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferSubmitting, setTransferSubmitting] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchInitialRooms();
    fetchInventories();
  }, []);

  const fetchInitialRooms = async () => {
    try {
      const res = await academicApi.getClasses().catch(() => ({ data: [] }));
      const classList: ClassEntity[] = Array.isArray(res?.data) ? res.data : [];
      if (classList && classList.length > 0) {
        const uniqueRooms = Array.from(
          new Map(
            classList
              .filter((c: ClassEntity) => c.id)
              .map((c: ClassEntity) => [c.id, { id: c.id, name: c.name || c.roomName || 'Phòng học' }])
          ).values()
        );
        setRooms(uniqueRooms);
        if (uniqueRooms.length > 0 && !newRoomId) {
          setNewRoomId(uniqueRooms[0].id);
        }
      }
    } catch (e) {
      console.warn('Could not load classes for rooms:', e);
    }
  };

  const fetchInventories = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedRoomId !== 'ALL') params.roomId = selectedRoomId;
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchTerm) params.keyword = searchTerm;

      const data = await equipmentService.getInventories(params);
      setInventories(data);
    } catch (err: any) {
      console.error('Failed to load equipment inventories:', err);
      showToast('error', 'Không thể tải danh sách trang thiết bị');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Open Transfer Modal
  const handleOpenTransferModal = (item: EquipmentInventoryResponse) => {
    setTransferTarget(item);
    setTransferQty(1);
    setToRoomId('');
    setTransferReason('');
    setTransferError(null);
    setShowTransferModal(true);
  };

  // Open Log Modal
  const handleOpenLogModal = async () => {
    setShowLogModal(true);
    setLoadingLogs(true);
    try {
      const logs = await equipmentService.getTransferLogs();
      setTransferLogs(logs);
    } catch (err) {
      console.error('Failed to load transfer logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Submit Create Equipment (BR-051, MSG-212, MSG-195, MSG-211)
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setCreateError('Vui lòng nhập mã định danh tài sản/thiết bị.');
      return;
    }
    if (!newName.trim()) {
      setCreateError('Vui lòng nhập tên thiết bị/giáo cụ.');
      return;
    }
    if (newQuantity <= 0) {
      setCreateError('MSG-195: Số lượng thiết bị khai báo không hợp lệ (phải lớn hơn 0).');
      return;
    }
    if (!newRoomId) {
      setCreateError('Vui lòng chọn phòng học/phòng chức năng để cấp phát.');
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError(null);

      const payload: CreateEquipmentPayload = {
        equipmentCode: newCode.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory,
        unit: newUnit.trim(),
        roomId: newRoomId,
        quantity: Number(newQuantity),
        description: newDescription.trim() || undefined
      };

      await equipmentService.createEquipment(payload);
      showToast('success', 'MSG-211: Khai báo và cấp phát thiết bị mầm non thành công.');
      setShowCreateModal(false);
      // Reset form
      setNewCode('');
      setNewName('');
      setNewDescription('');
      setNewQuantity(1);
      fetchInventories();
    } catch (err: any) {
      console.error('Create equipment error:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg && msg.includes('MSG-212')) {
        setCreateError('MSG-212: Mã định danh tài sản/thiết bị đã tồn tại trong hệ thống.');
      } else if (msg && msg.includes('MSG-195')) {
        setCreateError('MSG-195: Số lượng thiết bị khai báo không hợp lệ (phải lớn hơn 0).');
      } else {
        setCreateError(msg || 'Lỗi hệ thống khi tạo thiết bị.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Submit Transfer (BR-051, MSG-213, MSG-211)
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTarget) return;

    if (!toRoomId) {
      setTransferError('Vui lòng chọn phòng tiếp nhận.');
      return;
    }
    if (toRoomId === transferTarget.roomId) {
      setTransferError('Phòng tiếp nhận không được trùng với phòng hiện tại.');
      return;
    }
    if (transferQty <= 0) {
      setTransferError('MSG-195: Số lượng thiết bị điều chuyển phải lớn hơn 0.');
      return;
    }
    if (transferQty > transferTarget.quantity) {
      setTransferError(
        `MSG-213: Số lượng thiết bị điều chuyển (${transferQty}) vượt quá số lượng hiện có tại phòng học nguồn (${transferTarget.quantity}).`
      );
      return;
    }
    if (!transferReason.trim()) {
      setTransferError('Vui lòng nhập lý do điều chuyển.');
      return;
    }

    try {
      setTransferSubmitting(true);
      setTransferError(null);

      const payload: TransferEquipmentPayload = {
        equipmentId: transferTarget.equipmentId,
        fromRoomId: transferTarget.roomId || '',
        toRoomId: toRoomId,
        quantity: Number(transferQty),
        transferReason: transferReason.trim()
      };

      await equipmentService.transferEquipment(payload);
      showToast('success', 'MSG-211: Điều chuyển thiết bị mầm non thành công.');
      setShowTransferModal(false);
      setTransferTarget(null);
      fetchInventories();
    } catch (err: any) {
      console.error('Transfer equipment error:', err);
      const msg = err.response?.data?.message || err.message;
      if (msg && msg.includes('MSG-213')) {
        setTransferError('MSG-213: Số lượng thiết bị điều chuyển vượt quá số lượng hiện có tại phòng học nguồn.');
      } else {
        setTransferError(msg || 'Lỗi khi điều chuyển thiết bị.');
      }
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Filter local inventories
  const filteredInventories = inventories.filter((item) => {
    if (selectedRoomId !== 'ALL' && item.roomId !== selectedRoomId) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.equipmentCode.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        (item.roomName && item.roomName.toLowerCase().includes(term))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 border ${
            toastMsg.type === 'success'
              ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100'
              : 'bg-rose-900/90 border-rose-500/50 text-rose-100'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-yellow-900/40 border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Boxes className="w-6 h-6" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
                Quản lý Danh mục Thiết bị & Đồ chơi Mầm non
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                G9-UC-06 • BR-051
              </span>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Khai báo danh mục giáo cụ, đồ chơi mầm non (STEAM, Âm nhạc, Đồ chơi), cấp phát phân bổ về phòng học và thực hiện điều chuyển thiết bị an toàn giữa các lớp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenLogModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-medium text-xs transition-all cursor-pointer"
            >
              <History className="w-4 h-4" />
              Nhật ký điều chuyển
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Khai báo thiết bị mới
            </button>
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4.5 backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Room filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Phòng học / Phòng chức năng
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL">Tất cả các phòng ({rooms.length})</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Phân loại danh mục
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL">Tất cả phân loại</option>
              <option value="STEAM">Giáo cụ STEAM</option>
              <option value="MUSICAL">Dụng cụ Âm nhạc</option>
              <option value="TOY">Đồ chơi mầm non</option>
              <option value="FURNITURE">Bàn ghế & Nội thất</option>
              <option value="MEDICAL">Thiết bị Y tế học đường</option>
            </select>
          </div>

          {/* Search keyword */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tìm kiếm nhanh
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo mã tài sản (TB-STEAM-01), tên thiết bị..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            Danh sách Phân bổ Trang thiết bị & Hiện trạng Sử dụng
          </h2>
          <span className="text-xs text-slate-400">
            Hiển thị <strong>{filteredInventories.length}</strong> hạng mục tài sản
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
              <tr>
                <th className="py-3.5 px-4">Mã tài sản</th>
                <th className="py-3.5 px-4">Tên thiết bị / Giáo cụ</th>
                <th className="py-3.5 px-3">Phân loại</th>
                <th className="py-3.5 px-3">Phòng học hiện tại</th>
                <th className="py-3.5 px-3 text-center">ĐVT</th>
                <th className="py-3.5 px-3 text-right">Số lượng</th>
                <th className="py-3.5 px-3 text-center">Hiện trạng</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                    Đang tải danh mục thiết bị mầm non...
                  </td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    Không tìm thấy thiết bị nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredInventories.map((item) => (
                  <tr key={item.allocationId} className="hover:bg-slate-800/40 transition-colors">
                    {/* Equipment Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400 text-xs">
                      {item.equipmentCode}
                    </td>

                    {/* Equipment Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category === 'STEAM'
                          ? 'STEAM'
                          : item.category === 'MUSICAL'
                          ? 'Âm nhạc'
                          : item.category === 'TOY'
                          ? 'Đồ chơi'
                          : item.category === 'FURNITURE'
                          ? 'Nội thất'
                          : 'Y tế'}
                      </span>
                    </td>

                    {/* Room */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-white font-medium text-xs">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {item.roomName || 'Chưa gán phòng'}
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-3 text-center text-xs text-slate-400">{item.unit}</td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-right font-bold text-white text-base">
                      {item.quantity}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'GOOD'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.status === 'DAMAGED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.status === 'GOOD'
                          ? 'Tốt (Đang dùng)'
                          : item.status === 'DAMAGED'
                          ? 'Hỏng hóc'
                          : 'Chờ thanh lý'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenTransferModal(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Điều chuyển
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Khai báo Thiết bị Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Khai báo & Cấp phát Thiết bị Mới
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Đăng ký mã định danh duy nhất (BR-051) và cấp phát số lượng ban đầu về phòng học.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>{createError}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Equipment Code */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Mã tài sản <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: TB-STEAM-05"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Phân loại
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EquipmentCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="STEAM">Giáo cụ STEAM</option>
                    <option value="MUSICAL">Dụng cụ Âm nhạc</option>
                    <option value="TOY">Đồ chơi mầm non</option>
                    <option value="FURNITURE">Bàn ghế & Nội thất</option>
                    <option value="MEDICAL">Thiết bị Y tế</option>
                  </select>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tên trang thiết bị / đồ chơi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Bộ xếp hình bánh răng chuyển động 3D"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Đơn vị tính <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Bộ, Cái, Hộp, Chiếc..."
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Initial Quantity */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Số lượng cấp phát ({'> 0'}) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Room destination */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phòng học / Vị trí cấp phát ban đầu <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Chọn phòng tiếp nhận --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Mô tả / Xuất xứ giáo cụ
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm về chất liệu, thông số an toàn..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {createSubmitting ? 'Đang lưu...' : 'Khai báo & Cấp phát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Điều chuyển Thiết bị */}
      {showTransferModal && transferTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  Điều chuyển Thiết bị Giữa Các Phòng
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Thiết bị: <strong className="text-white">{transferTarget.name}</strong> ({transferTarget.equipmentCode})
                </p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              {transferError && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>{transferError}</div>
                </div>
              )}

              {/* Source Room Info */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Phòng nguồn:</span>
                  <div className="text-xs font-bold text-white mt-0.5">{transferTarget.roomName}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Tồn khả dụng:</span>
                  <div className="text-xs font-bold text-amber-400 mt-0.5">
                    {transferTarget.quantity} {transferTarget.unit}
                  </div>
                </div>
              </div>

              {/* Target Room */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Phòng tiếp nhận (Phòng đích) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={toRoomId}
                  onChange={(e) => {
                    setToRoomId(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Chọn phòng tiếp nhận --</option>
                  {rooms
                    .filter((r) => r.id !== transferTarget.roomId)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Số lượng điều chuyển <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max={transferTarget.quantity}
                    value={transferQty}
                    onChange={(e) => {
                      setTransferQty(parseInt(e.target.value) || 0);
                      setTransferError(null);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    / tối đa {transferTarget.quantity} {transferTarget.unit}
                  </span>
                </div>
              </div>

              {/* Transfer Reason */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Lý do điều chuyển biên bản <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Bổ sung giáo cụ học tiết Âm nhạc phòng Mầm 1..."
                  value={transferReason}
                  onChange={(e) => {
                    setTransferReason(e.target.value);
                    setTransferError(null);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {transferSubmitting ? 'Đang điều chuyển...' : 'Xác nhận điều chuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Nhật ký Điều chuyển */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-400" />
                  Nhật ký Biên bản Điều chuyển Trang thiết bị
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Lưu vết lịch sử phân bổ và điều phối giáo cụ giữa các phòng học.
                </p>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {loadingLogs ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  Đang tải lịch sử điều chuyển...
                </div>
              ) : transferLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có lượt điều chuyển nào được ghi nhận.
                </div>
              ) : (
                transferLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-white text-xs">
                        {log.equipmentName} <span className="text-amber-400 font-mono">({log.equipmentCode})</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(log.transferredAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-300 font-medium">{log.fromRoomName}</span>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-emerald-400 font-medium">{log.toRoomName}</span>
                      <span className="ml-auto font-bold text-white px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Số lượng: {log.quantityTransferred}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900/40 p-2 rounded-lg">
                      <strong className="text-slate-400">Lý do:</strong> {log.transferReason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
