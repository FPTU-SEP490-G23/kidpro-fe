import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import facilityClassroomApi, { FacilityClassroom } from '../../api/facilityClassroomApi';
import { useToast } from '../../contexts/ToastContext';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  DoorOpen,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Save,
  X,
  AlertCircle,
} from 'lucide-react';

export const BghClassroomsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<FacilityClassroom | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [validationError, setValidationError] = useState('');

  // Form states - chỉ chứa các trường lưu trong DB: room_name, building, capacity
  const [roomName, setRoomName] = useState('');
  const [building, setBuilding] = useState('Tòa nhà A');
  const [capacity, setCapacity] = useState<number>(30);

  const { data: classrooms = [], isLoading, isFetching, refetch } = useQuery<FacilityClassroom[]>({
    queryKey: ['facility-classrooms'],
    queryFn: facilityClassroomApi.getAllClassrooms,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<FacilityClassroom> = {
        roomName: roomName.trim(),
        building: building.trim() || 'Tòa nhà A',
        capacity: Number(capacity) || 30,
      };

      if (editingRoom?.classroomId) {
        return await facilityClassroomApi.updateClassroom(editingRoom.classroomId, payload);
      }
      return await facilityClassroomApi.createClassroom(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['facility-classrooms'] });
      success(data?.message || 'Thông tin phòng học đã được lưu thành công vào cơ sở dữ liệu.');
      closeModal();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Tên phòng học đã tồn tại hoặc dữ liệu không hợp lệ.';
      setValidationError(msg);
      error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await facilityClassroomApi.deleteClassroom(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-classrooms'] });
      success('Đã xóa phòng học thành công.');
    },
    onError: (err: any) => {
      error(err?.response?.data?.message || 'Không thể xóa phòng học.');
    },
  });

  const openCreateModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setBuilding('Tòa nhà A');
    setCapacity(30);
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: FacilityClassroom) => {
    setEditingRoom(room);
    setRoomName(room.roomName || '');
    setBuilding(room.building || 'Tòa nhà A');
    setCapacity(room.capacity || 30);
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setValidationError('Vui lòng nhập tên phòng học.');
      return;
    }

    if (capacity <= 0) {
      setValidationError('Sức chứa phòng học phải lớn hơn 0.');
      return;
    }

    if (capacity > 60) {
      setValidationError('Sức chứa phòng học mầm non tối đa không nên vượt quá 60 trẻ.');
      return;
    }

    saveMutation.mutate();
  };

  const handleDelete = (room: FacilityClassroom) => {
    if (!room.classroomId) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${room.roomName}" không?`)) {
      deleteMutation.mutate(room.classroomId);
    }
  };

  // Danh sách tòa nhà để lọc
  const buildings = Array.from(
    new Set(classrooms.map((r) => r.building).filter(Boolean))
  ) as string[];

  // Lọc dữ liệu
  const filteredClassrooms = classrooms.filter((room) => {
    const matchSearch =
      (room.roomName || '').toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (room.building || '').toLowerCase().includes(searchKeyword.toLowerCase());

    const matchBuilding = buildingFilter === 'ALL' || room.building === buildingFilter;

    return matchSearch && matchBuilding;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-[#275A4E] to-[#1E4D40] p-8 text-white shadow-xl shadow-[#275A4E]/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#78C2AD]" />
            <span>Ban Giám Hiệu</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Phòng Học</h1>
          <p className="mt-2 text-white/80 max-w-2xl text-sm leading-relaxed">
            Quản lý danh mục phòng học, vị trí dãy nhà và sức chứa học sinh chuẩn theo cơ sở dữ liệu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#78C2AD] text-[#1E4D40] hover:bg-[#68b49f] px-5 py-2.5 text-sm font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Phòng Học</span>
          </button>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Tìm theo tên phòng học..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#275A4E] outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[#275A4E]" />
          <span className="text-xs font-semibold text-slate-600">Dãy nhà:</span>
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-[#275A4E] transition"
          >
            <option value="ALL">Tất cả dãy nhà</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Danh Sách Phòng Học */}
      {filteredClassrooms.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200 p-12 text-center text-slate-400">
          <DoorOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#275A4E]" />
          <p className="text-base font-bold text-slate-700">Chưa tìm thấy phòng học nào</p>
          <p className="text-xs mt-1">Bấm "Thêm Phòng Học" để khởi tạo danh sách cơ sở vật chất</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClassrooms.map((room) => (
            <div
              key={room.classroomId}
              className="group bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-md hover:border-[#78C2AD] transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#78C2AD]/15 text-[#275A4E] flex items-center justify-center font-bold">
                    <DoorOpen className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(room)}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#275A4E] hover:bg-slate-100 transition cursor-pointer"
                      title="Chỉnh sửa thông tin"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(room)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa phòng học"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-[#275A4E] transition-colors">
                  {room.roomName}
                </h3>

                <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#275A4E]" />
                    <span>
                      Vị trí: <strong>{room.building || 'Tòa nhà chính'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#275A4E]" />
                    <span>
                      Sức chứa tối đa: <strong className="text-slate-900 font-extrabold">{room.capacity || 30} trẻ</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Chỉnh Sửa Phòng Học */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#275A4E] to-[#1E4D40] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <DoorOpen className="w-5 h-5 text-[#78C2AD]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {editingRoom ? 'Cập Nhật Phòng Học' : 'Thêm Phòng Học Mới'}
                  </h3>
                  <p className="text-xs text-[#78C2AD]">
                    Ban Giám Hiệu • Cơ sở dữ liệu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body - Chỉ gồm các trường lưu DB */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Tên phòng học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tên Phòng Học <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ví dụ: Phòng Mầm 1, Phòng Chồi 2, Phòng Âm Nhạc"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm font-semibold transition outline-none"
                  required
                />
              </div>

              {/* Tòa nhà / Dãy nhà */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tòa Nhà / Dãy Nhà
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="Ví dụ: Tòa nhà A, Tòa nhà B, Dãy Hoa Mai"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm font-medium transition outline-none"
                />
              </div>

              {/* Sức chứa tối đa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sức Chứa Tối Đa (Trẻ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#275A4E] text-sm font-bold transition outline-none"
                    required
                  />
                  <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-medium">
                    Học sinh
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Khuyến nghị theo chuẩn Bộ GD&ĐT: Nhà trẻ từ 20-25 trẻ, Mẫu giáo từ 25-35 trẻ.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saveMutation.isPending}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-6 py-2.5 rounded-xl bg-[#275A4E] hover:bg-[#1E4D40] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saveMutation.isPending ? 'Đang lưu...' : editingRoom ? 'Cập nhật' : 'Thêm mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghClassroomsPage;
