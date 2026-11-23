import React, { useState, useEffect } from 'react';
import {
  Bus,
  Plus,
  Search,
  MapPin,
  UserCheck,
  Edit2,
  Trash2,
  Power,
  Clock,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { busManagementApi } from '../../api/busManagementApi';
import {
  BusItem,
  BusCreateRequest,
  BusUpdateRequest,
  BusStopItem,
  BusStopCreateRequest,
  TeacherOption,
  TeacherBusAssignmentItem,
  TeacherBusAssignmentRequest,
} from '../../types/bus.types';
import { CreateBusModal } from './bus/CreateBusModal';
import { EditBusModal } from './bus/EditBusModal';
import { CreateBusStopModal } from './bus/CreateBusStopModal';
import { AssignTeacherModal } from './bus/AssignTeacherModal';
import { BusRegistrationApprovalTab } from '../academic/tabs/BusRegistrationApprovalTab';

export const BghBusManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'buses' | 'stops' | 'assignments' | 'registrations'>('buses');

  // Dữ liệu chính
  const [buses, setBuses] = useState<BusItem[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [stops, setStops] = useState<BusStopItem[]>([]);
  const [assignments, setAssignments] = useState<TeacherBusAssignmentItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);

  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Bộ lọc
  const [searchBusTerm, setSearchBusTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Modals state
  const [isCreateBusOpen, setIsCreateBusOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusItem | null>(null);

  const [isCreateStopOpen, setIsCreateStopOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStopItem | null>(null);

  const [isAssignTeacherOpen, setIsAssignTeacherOpen] = useState(false);

  // 1. Load danh sách Buses & Teachers khi mở trang
  useEffect(() => {
    fetchInitialData();
  }, []);

  // 2. Load stops khi selectedBusId thay đổi
  useEffect(() => {
    if (selectedBusId) {
      fetchStops(selectedBusId);
    }
  }, [selectedBusId]);

  // 3. Load assignments khi tab assignments hoặc filter thay đổi
  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
    }
  }, [activeTab, filterDate, selectedBusId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [busList, teacherList] = await Promise.all([
        busManagementApi.getAllBuses(),
        busManagementApi.getTeacherOptions(),
      ]);
      setBuses(busList);
      setTeachers(teacherList);
      if (busList.length > 0 && !selectedBusId) {
        setSelectedBusId(busList[0].busId);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu xe buýt.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStops = async (busId: string) => {
    try {
      const stopList = await busManagementApi.getStopsByBusId(busId);
      setStops(stopList);
    } catch (err: any) {
      console.error('Lỗi tải điểm dừng:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const list = await busManagementApi.getAssignments(
        selectedBusId || undefined,
        filterDate || undefined
      );
      setAssignments(list);
    } catch (err: any) {
      console.error('Lỗi tải danh sách phân công:', err);
    }
  };

  // Helper trigger messages
  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // === XỬ LÝ BUS ===
  const handleCreateBus = async (data: BusCreateRequest) => {
    const newBus = await busManagementApi.createBus(data);
    setBuses([newBus, ...buses]);
    if (!selectedBusId) setSelectedBusId(newBus.busId);
    notifySuccess(`Đã thêm mới xe buýt ${newBus.busNumber} thành công!`);
  };

  const handleUpdateBus = async (busId: string, data: BusUpdateRequest) => {
    const updated = await busManagementApi.updateBus(busId, data);
    setBuses(buses.map((b) => (b.busId === busId ? updated : b)));
    notifySuccess(`Đã cập nhật thông tin xe buýt ${updated.busNumber}!`);
  };

  const handleToggleBusStatus = async (busId: string) => {
    try {
      await busManagementApi.toggleBusStatus(busId);
      setBuses(
        buses.map((b) => (b.busId === busId ? { ...b, isActive: !b.isActive } : b))
      );
      notifySuccess('Đã cập nhật trạng thái hoạt động của xe buýt.');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleDeleteBus = async (bus: BusItem) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tuyến xe buýt "${bus.busNumber}"?`)) {
      return;
    }
    try {
      await busManagementApi.deleteBus(bus.busId);
      setBuses(buses.filter((b) => b.busId !== bus.busId));
      if (selectedBusId === bus.busId) {
        const remaining = buses.filter((b) => b.busId !== bus.busId);
        setSelectedBusId(remaining.length > 0 ? remaining[0].busId : '');
      }
      notifySuccess(`Đã xóa xe buýt ${bus.busNumber} thành công.`);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể xóa xe buýt');
    }
  };

  // === XỬ LÝ BUS STOPS ===
  const handleCreateOrUpdateStop = async (data: BusStopCreateRequest) => {
    if (!selectedBusId) return;
    if (editingStop) {
      const updated = await busManagementApi.updateBusStop(selectedBusId, editingStop.stopId, data);
      setStops(stops.map((s) => (s.stopId === editingStop.stopId ? updated : s)));
      notifySuccess(`Đã cập nhật điểm dừng "${updated.stopName}"!`);
      setEditingStop(null);
    } else {
      const newStop = await busManagementApi.addBusStop(selectedBusId, data);
      setStops([...stops, newStop].sort((a, b) => a.stopOrder - b.stopOrder));
      // Tăng counter stops ở bus item
      setBuses(
        buses.map((b) =>
          b.busId === selectedBusId ? { ...b, totalStops: b.totalStops + 1 } : b
        )
      );
      notifySuccess(`Đã thêm điểm dừng "${newStop.stopName}" thành công!`);
    }
  };

  const handleDeleteStop = async (stopId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa điểm dừng này khỏi lộ trình xe?')) return;
    if (!selectedBusId) return;
    try {
      await busManagementApi.deleteBusStop(selectedBusId, stopId);
      setStops(stops.filter((s) => s.stopId !== stopId));
      setBuses(
        buses.map((b) =>
          b.busId === selectedBusId ? { ...b, totalStops: Math.max(0, b.totalStops - 1) } : b
        )
      );
      notifySuccess('Đã xóa điểm dừng khỏi tuyến xe.');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể xóa điểm dừng');
    }
  };

  // === XỬ LÝ TEACHER ASSIGNMENTS ===
  const handleAssignTeacher = async (data: TeacherBusAssignmentRequest) => {
    const newAssignment = await busManagementApi.assignTeacher(data);
    setAssignments([newAssignment, ...assignments]);
    setBuses(
      buses.map((b) =>
        b.busId === data.busId
          ? { ...b, assignedTeachersCount: b.assignedTeachersCount + 1 }
          : b
      )
    );
    notifySuccess(
      `Đã phân công giáo viên ${newAssignment.teacherName} phụ trách xe ${newAssignment.busNumber}!`
    );
  };

  const handleRemoveAssignment = async (assignment: TeacherBusAssignmentItem) => {
    if (
      !window.confirm(
        `Hủy phân công giáo viên "${assignment.teacherName}" khỏi xe "${assignment.busNumber}"?`
      )
    ) {
      return;
    }
    try {
      await busManagementApi.removeAssignment(assignment.assignmentId);
      setAssignments(assignments.filter((a) => a.assignmentId !== assignment.assignmentId));
      notifySuccess('Đã hủy phân công thành công.');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể hủy phân công');
    }
  };

  // Lọc buses
  const filteredBuses = buses.filter(
    (b) =>
      b.busNumber.toLowerCase().includes(searchBusTerm.toLowerCase()) ||
      b.driverName.toLowerCase().includes(searchBusTerm.toLowerCase()) ||
      b.startLocation.toLowerCase().includes(searchBusTerm.toLowerCase()) ||
      b.endLocation.toLowerCase().includes(searchBusTerm.toLowerCase())
  );

  const selectedBus = buses.find((b) => b.busId === selectedBusId);

  return (
    <div className="space-y-6 font-['Plus_Jakarta_Sans'] pb-12">
      {/* 1. Header Trang */}
      <div className="px-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#275A4E] border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
              <Bus className="w-6 h-6 text-[#275A4E]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5A93C]/20 text-[#9E6900] border border-[#E5A93C]/30 uppercase tracking-wide">
                  Ban Giám Hiệu
                </span>
                <span className="text-xs text-slate-500 font-medium">Hệ thống Đưa Đón Học Sinh</span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Quản Lý Xe Buýt, Điểm Dừng & Phân Công Giáo Viên
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchInitialData}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
            <button
              onClick={() => setIsCreateBusOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] rounded-xl shadow-sm shadow-emerald-900/10 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm Xe Buýt Mới
            </button>
          </div>
        </div>
      </div>

      {/* Thông báo Thành Công / Lỗi */}
      <div className="px-6">
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-in fade-in">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Thống kê nhanh */}
      <div className="px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Tổng số xe buýt</span>
              <Bus className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{buses.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Phương tiện đưa đón</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Đang hoạt động</span>
              <Power className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {buses.filter((b) => b.isActive).length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Tuyến đang đón trả trẻ</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Tổng điểm dừng (Stops)</span>
              <MapPin className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-black text-teal-700">
              {buses.reduce((acc, curr) => acc + (curr.totalStops || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Trạm đón trả trên hệ thống</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
              <span>Lượt giáo viên phụ trách</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">
              {buses.reduce((acc, curr) => acc + (curr.assignedTeachersCount || 0), 0)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Giáo viên quản lý xe</div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="px-6">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white/60 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('buses')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'buses'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bus className="w-4 h-4" />
            <span>Tất Cả Tuyến Xe ({buses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stops')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'stops'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Lộ Trình & Điểm Dừng (Stops)</span>
          </button>

          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'assignments'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Phân Công Giáo Viên Đi Xe</span>
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'registrations'
                ? 'bg-[#275A4E] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Duyệt Đăng Ký Của Phụ Huynh</span>
          </button>
        </div>
      </div>

      {/* 4. Nội Dung Tab 1: DANH SÁCH XE BUÝT */}
      {activeTab === 'buses' && (
        <div className="px-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo biển số, tài xế, tuyến đường..."
                value={searchBusTerm}
                onChange={(e) => setSearchBusTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Hiển thị <span className="font-bold text-slate-800">{filteredBuses.length}</span> xe buýt
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuses.map((bus) => (
              <div
                key={bus.busId}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#275A4E] flex items-center justify-center shrink-0">
                        <Bus className="w-5 h-5 text-[#275A4E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">{bus.busNumber}</h3>
                        <p className="text-[11px] text-slate-400 font-medium">{bus.capacity} chỗ ngồi</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBusStatus(bus.busId)}
                      title={bus.isActive ? 'Nhấp để tạm ngưng' : 'Nhấp để kích hoạt'}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${
                        bus.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${bus.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {bus.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </button>
                  </div>

                  <div className="space-y-2 py-2 text-xs border-y border-slate-100 my-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Tài xế: <strong className="text-slate-800">{bus.driverName}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>SĐT: <strong className="text-slate-800">{bus.driverPhone}</strong></span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px]">
                          <span className="text-slate-400 font-semibold">Khởi hành:</span> {bus.startLocation}
                        </p>
                        <p className="truncate text-[11px]">
                          <span className="text-slate-400 font-semibold">Kết thúc:</span> {bus.endLocation}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs py-1">
                    <div className="bg-teal-50/60 p-2 rounded-xl border border-teal-100">
                      <div className="font-extrabold text-teal-800 text-sm">{bus.totalStops}</div>
                      <div className="text-[10px] text-teal-600 font-medium">Điểm dừng (Stops)</div>
                    </div>
                    <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100">
                      <div className="font-extrabold text-blue-800 text-sm">{bus.assignedTeachersCount}</div>
                      <div className="text-[10px] text-blue-600 font-medium">Lượt giáo viên</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedBusId(bus.busId);
                        setActiveTab('stops');
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Điểm dừng
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBusId(bus.busId);
                        setIsAssignTeacherOpen(true);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Phân công
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingBus(bus)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      title="Chỉnh sửa xe buýt"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBus(bus)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa xe buýt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredBuses.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
                <Bus className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Không tìm thấy tuyến xe buýt nào</p>
                <p className="text-xs text-slate-400 mt-1">Bấm "Thêm Xe Buýt Mới" để khai báo phương tiện đầu tiên</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Nội Dung Tab 2: ĐIỂM DỪNG (BUS STOPS) */}
      {activeTab === 'stops' && (
        <div className="px-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                Chọn Tuyến Xe:
              </label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 transition focus:border-[#275A4E] focus:bg-white focus:outline-none"
              >
                {buses.map((b) => (
                  <option key={b.busId} value={b.busId}>
                    {b.busNumber} - {b.driverName} ({b.startLocation} ➔ {b.endLocation})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingStop(null);
                setIsCreateStopOpen(true);
              }}
              disabled={!selectedBusId}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Thêm Điểm Dừng Cho Xe Này
            </button>
          </div>

          {selectedBus && (
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#275A4E] text-white flex items-center justify-center font-bold text-xs">
                  {selectedBus.busNumber}
                </div>
                <div>
                  <p className="font-bold">Lộ trình: {selectedBus.startLocation} ➔ {selectedBus.endLocation}</p>
                  <p className="text-[11px] text-emerald-700">Tài xế: {selectedBus.driverName} ({selectedBus.driverPhone})</p>
                </div>
              </div>
              <span className="font-extrabold text-emerald-900 bg-emerald-100/80 px-3 py-1 rounded-full">
                {stops.length} Điểm dừng đón/trả
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Trạm</th>
                    <th className="py-3 px-4">Tên Điểm Dừng</th>
                    <th className="py-3 px-4">Địa Chỉ Đón/Trả</th>
                    <th className="py-3 px-4">Giờ Đón Dự Kiến</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {stops.map((stop) => (
                    <tr key={stop.stopId} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 text-teal-800 font-bold text-xs border border-teal-200">
                          {stop.stopOrder}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {stop.stopName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {stop.stopAddress || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          {stop.estimatedTime ? stop.estimatedTime.substring(0, 5) : '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingStop(stop);
                              setIsCreateStopOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Sửa điểm dừng"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStop(stop.stopId)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa điểm dừng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {stops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Chưa có điểm dừng nào cho xe buýt này</p>
                        <p className="text-[11px] text-slate-400 mt-1">Bấm "Thêm Điểm Dừng Cho Xe Này" để thiết lập lộ trình</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Nội Dung Tab 3: PHÂN CÔNG GIÁO VIÊN */}
      {activeTab === 'assignments' && (
        <div className="px-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Xe buýt:</label>
                <select
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">Tất cả xe buýt</option>
                  {buses.map((b) => (
                    <option key={b.busId} value={b.busId}>
                      {b.busNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ngày:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Xóa lọc ngày
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsAssignTeacherOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#275A4E] hover:bg-[#1E4D40] rounded-xl shadow-sm transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              Phân Công Giáo Viên Mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Giáo Viên Quản Lý</th>
                    <th className="py-3 px-4">Mã NV / SĐT</th>
                    <th className="py-3 px-4">Xe Buýt Phụ Trách</th>
                    <th className="py-3 px-4">Ngày Phân Công</th>
                    <th className="py-3 px-4">Ca Trực</th>
                    <th className="py-3 px-4">Ghi Chú</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {assignments.map((item) => (
                    <tr key={item.assignmentId} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.teacherName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{item.staffCode}</span>
                        {item.teacherPhone && (
                          <span className="text-[11px] text-slate-400 block">{item.teacherPhone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-bold text-[#275A4E] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          <Bus className="w-3.5 h-3.5" />
                          {item.busNumber}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {item.assignedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.shiftType === 'TWO_WAY'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.shiftType === 'MORNING_ONLY'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {item.shiftTypeName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {item.note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRemoveAssignment(item)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Hủy phân công
                        </button>
                      </td>
                    </tr>
                  ))}

                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <UserCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">Chưa có phân công giáo viên nào</p>
                        <p className="text-[11px] text-slate-400 mt-1">Bấm "Phân Công Giáo Viên Mới" để thiết lập người quản lý theo xe</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Nội Dung Tab 4: DUYỆT ĐĂNG KÝ XE BUÝT */}
      {activeTab === 'registrations' && (
        <div className="px-6">
          <BusRegistrationApprovalTab />
        </div>
      )}

      {/* 7. Các Modals */}
      <CreateBusModal
        isOpen={isCreateBusOpen}
        onClose={() => setIsCreateBusOpen(false)}
        onSubmit={handleCreateBus}
        existingBuses={buses}
      />

      <EditBusModal
        isOpen={!!editingBus}
        bus={editingBus}
        onClose={() => setEditingBus(null)}
        onSubmit={handleUpdateBus}
        existingBuses={buses}
      />

      <CreateBusStopModal
        isOpen={isCreateStopOpen}
        busNumber={selectedBus?.busNumber || ''}
        defaultOrder={stops.length + 1}
        editingStop={editingStop}
        existingStops={stops}
        onClose={() => {
          setIsCreateStopOpen(false);
          setEditingStop(null);
        }}
        onSubmit={handleCreateOrUpdateStop}
      />

      <AssignTeacherModal
        isOpen={isAssignTeacherOpen}
        buses={buses}
        teachers={teachers}
        preselectedBusId={selectedBusId}
        existingAssignments={assignments}
        onClose={() => setIsAssignTeacherOpen(false)}
        onSubmit={handleAssignTeacher}
      />
    </div>
  );
};

export default BghBusManagementPage;

