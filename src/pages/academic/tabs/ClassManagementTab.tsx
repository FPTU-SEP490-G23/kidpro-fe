import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  UserCheck,
  XCircle
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';

const classSchema = z.object({
  name: z.string().min(2, 'Tên lớp quá ngắn'),
  ageGroup: z.enum(['NURSERY', 'KINDERGARTEN', 'PRE_K']),
  maxCapacity: z.coerce.number().min(10).max(40),
  roomNumber: z.string().min(2, 'Tên phòng trống'),
  academicYearId: z.string().min(1, 'Vui lòng chọn niên khóa'),
  teacherId: z.string().min(1, 'Vui lòng chọn GVCN')
});

type ClassFormValues = z.infer<typeof classSchema>;

export const ClassManagementTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterYear, ] = useState('ALL');
  const [filterAgeGroup, setFilterAgeGroup] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { data: activeYear } = useQuery({
    queryKey: ['activeAcademicYear'],
    queryFn: async () => {
      const res = await academicApi.getActiveAcademicYear();
      return res.data;
    }
  });

  const { data: classes = [], isLoading: isLoadingClasses } = useQuery({
    queryKey: ['classes', filterYear, filterAgeGroup],
    queryFn: async () => {
      const res = await academicApi.getClasses({
        academicYearId: filterYear !== 'ALL' ? filterYear : undefined,
        ageGroup: filterAgeGroup !== 'ALL' ? filterAgeGroup : undefined
      });
      return res.data;
    }
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['activeTeachers'],
    queryFn: async () => {
      const res = await academicApi.getActiveTeachers();
      return res.data;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema) as any,
    defaultValues: {
      ageGroup: 'KINDERGARTEN',
      maxCapacity: 30
    }
  });

  const createClassMutation = useMutation({
    mutationFn: async (data: ClassFormValues) => {
      if (editingClass) {
        return await academicApi.updateClass(editingClass.id, data);
      }
      return await academicApi.createClass(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setToastMessage({ type: 'success', text: editingClass ? 'Cập nhật lớp học thành công' : 'Phân công nhân sự giảng dạy lớp học thành công' });
      setIsModalOpen(false);
      reset();
      setEditingClass(null);
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (error: any) => {
      let msg = 'Không thể kết nối đến máy chủ.';
      if (error.response?.data?.message) msg = error.response.data.message;
      setToastMessage({ type: 'error', text: msg });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      return await academicApi.deleteClass(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setToastMessage({ type: 'success', text: 'Xóa lớp học thành công' });
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: () => {
      setToastMessage({ type: 'error', text: 'Không thể xóa lớp đang có học sinh' });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  const onSubmit = (data: ClassFormValues) => {
    createClassMutation.mutate(data);
  };

  const getAgeGroupLabel = (group: string) => {
    switch (group) {
      case 'NURSERY': return 'Nhà trẻ (18-36T)';
      case 'KINDERGARTEN': return 'Mầm/Chồi (3-5T)';
      case 'PRE_K': return 'Lá (5-6T)';
      default: return group;
    }
  };

  const getAgeGroupColor = (group: string) => {
    switch (group) {
      case 'NURSERY': return 'bg-pink-100 text-pink-700';
      case 'KINDERGARTEN': return 'bg-orange-100 text-orange-700';
      case 'PRE_K': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${toastMessage.type === 'success' ? 'bg-[#78C2AD]/10 border border-[#78C2AD] text-[#275A4E]' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toastMessage.text}</span>
        </div>
      )}

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-3">
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
            value={filterAgeGroup}
            onChange={e => setFilterAgeGroup(e.target.value)}
          >
            <option value="ALL">Tất cả khối tuổi</option>
            <option value="NURSERY">Nhà trẻ</option>
            <option value="KINDERGARTEN">Mầm / Chồi</option>
            <option value="PRE_K">Lá</option>
          </select>
        </div>
        <button 
          onClick={() => {
            reset();
            if (activeYear) setValue('academicYearId', activeYear.id);
            setEditingClass(null);
            setIsModalOpen(true);
          }}
          className="bg-[#275A4E] hover:bg-[#1E4D40] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Lớp Học Mới</span>
        </button>
      </div>

      {/* Grid */}
      {isLoadingClasses ? (
        <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#78C2AD]" /></div>
      ) : classes.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl shadow-sm">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>Chưa có lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c: any) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{c.name}</h3>
                  <div className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getAgeGroupColor(c.ageGroup)}`}>
                    {getAgeGroupLabel(c.ageGroup)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    setEditingClass(c);
                    setValue('name', c.name);
                    setValue('ageGroup', c.ageGroup);
                    setValue('maxCapacity', c.maxCapacity || c.capacity);
                    setValue('roomNumber', c.roomNumber || c.roomName);
                    setValue('academicYearId', c.academicYearId);
                    setValue('teacherId', c.teacherId);
                    setIsModalOpen(true);
                  }} className="p-2 text-slate-400 hover:text-[#E5A93C] bg-slate-50 hover:bg-orange-50 rounded-lg transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => {
                    if (confirm('Xác nhận xóa lớp học này?')) {
                      deleteClassMutation.mutate(c.id);
                    }
                  }} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3 mb-5 flex-1">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>GVCN: <span className="font-semibold text-slate-800">{c.teacherName || 'Chưa phân công'}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Phòng: <span className="font-semibold text-slate-800">{c.roomNumber || c.roomName}</span></span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Sĩ số: <span className="font-semibold text-slate-800">{c.currentCount || 0}/{c.maxCapacity || c.capacity}</span></span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <button 
                  onClick={() => {
                    setEditingClass(c);
                    setValue('name', c.name);
                    setValue('ageGroup', c.ageGroup);
                    setValue('maxCapacity', c.maxCapacity || c.capacity);
                    setValue('roomNumber', c.roomNumber || c.roomName);
                    setValue('academicYearId', c.academicYearId);
                    setValue('teacherId', c.teacherId);
                    setIsAssignModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-50 hover:bg-[#78C2AD]/10 text-[#275A4E] text-sm font-semibold rounded-xl transition border border-transparent hover:border-[#78C2AD]/30"
                >
                  Phân công / Đổi GVCN
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {(isModalOpen || isAssignModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#275A4E] text-white flex justify-between items-center">
              <h2 className="text-lg font-bold">
                {isAssignModalOpen ? 'Phân công Giáo viên Chủ nhiệm' : (editingClass ? 'Chỉnh sửa Lớp học' : 'Tạo Lớp học Mới')}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setIsAssignModalOpen(false); }} className="text-white/70 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 font-['Plus_Jakarta_Sans']">
              {!isAssignModalOpen && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tên lớp <span className="text-red-500">*</span></label>
                    <input {...register('name')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="VD: Mầm 1" />
                    {errors.name?.message && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Khối tuổi <span className="text-red-500">*</span></label>
                      <select {...register('ageGroup')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                        <option value="NURSERY">Nhà trẻ</option>
                        <option value="KINDERGARTEN">Mầm / Chồi</option>
                        <option value="PRE_K">Lá</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Sức chứa tối đa <span className="text-red-500">*</span></label>
                      <input type="number" {...register('maxCapacity')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                      {errors.maxCapacity?.message && <p className="text-xs text-red-500 mt-1">{errors.maxCapacity.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Phòng học <span className="text-red-500">*</span></label>
                    <input {...register('roomNumber')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="VD: Phòng 201" />
                    {errors.roomNumber?.message && <p className="text-xs text-red-500 mt-1">{errors.roomNumber.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Niên khóa <span className="text-red-500">*</span></label>
                    <select {...register('academicYearId')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                      <option value="">-- Chọn --</option>
                      {activeYear && <option value={activeYear.id}>{activeYear.name || '2026-2027'}</option>}
                    </select>
                    {errors.academicYearId?.message && <p className="text-xs text-red-500 mt-1">{errors.academicYearId.message}</p>}
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Giáo viên Chủ nhiệm <span className="text-red-500">*</span></label>
                <select {...register('teacherId')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                  <option value="">-- Chọn giáo viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName}</option>
                  ))}
                </select>
                {errors.teacherId?.message && <p className="text-xs text-red-500 mt-1">{errors.teacherId.message}</p>}
              </div>

              <div className="pt-4 mt-2 flex gap-3">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsAssignModalOpen(false); }} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition">
                  Hủy
                </button>
                <button type="submit" disabled={createClassMutation.isPending} className="flex-1 py-2.5 bg-[#275A4E] text-white font-semibold rounded-xl hover:bg-[#1E4D40] transition flex justify-center items-center gap-2">
                  {createClassMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (isAssignModalOpen ? 'Xác nhận Phân công' : 'Lưu Lớp học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
