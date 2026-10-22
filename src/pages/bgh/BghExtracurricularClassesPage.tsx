import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  DollarSign,
  User,
  Power,
  RefreshCw,
  X,
  Layers,
} from 'lucide-react';
import extracurricularApi, {
  ExtracurricularClassDto,
  ExtracurricularClassCreatePayload,
} from '../../api/extracurricularApi';
import { facilityClassroomApi, FacilityClassroom } from '../../api/facilityClassroomApi';
import academicYearApi from '../../api/academicYearApi';

export const BghExtracurricularClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ExtracurricularClassDto[]>([]);
  const [classrooms, setClassrooms] = useState<FacilityClassroom[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Create
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ExtracurricularClassCreatePayload>({
    className: '',
    academicYearId: '',
    classroomId: '',
    scheduleDescription: '',
    maxCapacity: 20,
    externalInstructorName: '',
    tuitionFee: 500000,
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Toast
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clsRes, roomRes, yearRes] = await Promise.all([
        extracurricularApi.getClasses(),
        facilityClassroomApi.getAllClassrooms(),
        academicYearApi.getAcademicYears(),
      ]);
      setClasses(Array.isArray(clsRes) ? clsRes : ((clsRes as any)?.data || []));
      setClassrooms(roomRes || []);
      const years = Array.isArray(yearRes) ? yearRes : ((yearRes as any)?.data || []);
      setAcademicYears(years);
      if (years.length > 0 && !formData.academicYearId) {
        setFormData((prev) => ({ ...prev, academicYearId: years[0].academicYearId || years[0].id }));
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu CLB ngoại khóa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      setAlertInfo({ type: 'error', message: 'Vui lòng nhập tên lớp câu lạc bộ năng khiếu.' });
      return;
    }
    if (formData.maxCapacity < 10 || formData.maxCapacity > 30) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-229: Sĩ số tối đa vượt quá quy chuẩn phòng học chức năng (tối đa không quá 30 trẻ/lớp).',
      });
      return;
    }
    if (formData.tuitionFee <= 0) {
      setAlertInfo({
        type: 'error',
        message: 'MSG-230: Mức học phí câu lạc bộ năng khiếu phải lớn hơn 0 VNĐ.',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await extracurricularApi.createAndApproveClass(formData);
      setAlertInfo({
        type: 'success',
        message: (res as any)?.message || (res as any)?.data?.message || 'Lớp câu lạc bộ năng khiếu ngoại khóa đã được phê duyệt mở thành công và kích hoạt nhận đăng ký (MSG-228).',
      });
      setCreateModalOpen(false);
      setFormData({
        className: '',
        academicYearId: academicYears[0]?.academicYearId || '',
        classroomId: '',
        scheduleDescription: '',
        maxCapacity: 20,
        externalInstructorName: '',
        tuitionFee: 500000,
      });
      fetchData();
    } catch (err: any) {
      setAlertInfo({
        type: 'error',
        message: err?.response?.data?.message || 'Lỗi khi khởi tạo lớp câu lạc bộ ngoại khóa.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await extracurricularApi.toggleStatus(id);
      fetchData();
    } catch (err: any) {
      setAlertInfo({ type: 'error', message: 'Lỗi đổi trạng thái mở đăng ký.' });
    }
  };

  const formatVND = (amt?: number) => {
    if (!amt) return '0 ₫';
    return amt.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#275A4E]/10 flex items-center justify-center text-[#275A4E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                [UC-067] Mở Lớp Câu Lạc Bộ Ngoại Khóa
              </h1>
              <p className="text-sm text-slate-500">
                Khởi tạo & phê duyệt các lớp năng khiếu (Vẽ, Võ, Múa, Tiếng Anh, STEAM) và kích hoạt nhận đăng ký (BR-090, BR-091, BR-092)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm Lớp Năng Khiếu Mới
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert toast */}
      {alertInfo && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-medium">{alertInfo.message}</span>
          </div>
          <button onClick={() => setAlertInfo(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Đang tải danh sách CLB ngoại khóa...</div>
        ) : classes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Chưa có lớp câu lạc bộ ngoại khóa nào. Nhấn "Thêm Lớp Năng Khiếu Mới" để khởi tạo.
          </div>
        ) : (
          classes.map((cls) => (
            <div
              key={cls.extracurricularClassId}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    CLB Ngoại Khóa
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{cls.className}</h3>
                </div>
                <button
                  onClick={() => handleToggleStatus(cls.extracurricularClassId)}
                  title={cls.isActive ? 'Nhấp để tạm ngưng nhận đăng ký' : 'Nhấp để mở nhận đăng ký'}
                  className={`p-2 rounded-xl transition-colors ${
                    cls.isActive
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Building2 className="w-3.5 h-3.5" /> Phòng chức năng:
                  </span>
                  <span className="font-semibold text-slate-800">{cls.classroomName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> Lịch học:
                  </span>
                  <span className="font-semibold text-slate-800">{cls.scheduleDescription}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Users className="w-3.5 h-3.5" /> Sĩ số tối đa:
                  </span>
                  <span className="font-semibold text-slate-800">{cls.maxCapacity} trẻ (BR-090)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5" /> Giáo viên/HLV:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {cls.externalInstructorName || 'Chuyên gia nhà trường'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-2 text-slate-500">
                    <DollarSign className="w-3.5 h-3.5 text-[#275A4E]" /> Học phí / Tháng:
                  </span>
                  <span className="font-bold text-sm text-[#275A4E]">{formatVND(cls.tuitionFee)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    cls.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {cls.isActive ? 'Đang Mở Đăng Ký' : 'Đã Tạm Khóa'}
                </span>
                <span className="text-xs text-slate-400">{cls.academicYearName}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm Lớp Năng Khiếu Mới */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Khởi Tạo Lớp Câu Lạc Bộ Năng Khiếu</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên lớp câu lạc bộ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hội Họa Sáng Tạo, Võ Thuật Vovinam, Aerobic Mầm Non..."
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Năm học áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.academicYearId}
                    onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] bg-white"
                  >
                    {academicYears.map((ay) => (
                      <option key={ay.academicYearId || ay.id} value={ay.academicYearId || ay.id}>
                        {ay.yearName || ay.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phòng học chức năng (BR-091)
                  </label>
                  <select
                    value={formData.classroomId}
                    onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E] bg-white"
                  >
                    <option value="">-- Chọn phòng chức năng --</option>
                    {classrooms.map((cr) => (
                      <option key={cr.classroomId} value={cr.classroomId}>
                        {cr.roomName} ({cr.building})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lịch học & Khung giờ (BR-091) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thứ 3 & Thứ 5 (16:30 - 17:30)"
                  value={formData.scheduleDescription}
                  onChange={(e) => setFormData({ ...formData, scheduleDescription: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Sĩ số tối đa (10-30 trẻ - BR-090) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={30}
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Học phí / Tháng (VNĐ - BR-092) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={10000}
                    step={50000}
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                    className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Giáo viên / HLV phụ trách (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thầy Trần Anh Tuấn (HLV Võ thuật Đai đen)"
                  value={formData.externalInstructorName}
                  onChange={(e) => setFormData({ ...formData, externalInstructorName: e.target.value })}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-[#275A4E]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#275A4E] text-white rounded-xl text-sm font-semibold hover:bg-[#1E4D40]"
                >
                  {submitting ? 'Đang tạo...' : 'Phê Duyệt Mở Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BghExtracurricularClassesPage;
