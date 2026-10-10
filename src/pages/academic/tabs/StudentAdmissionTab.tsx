import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreVertical,
  Loader2,
  Check
} from 'lucide-react';
import { academicApi } from '../../../api/academicApi';

const studentSchema = z.object({
  fullName: z.string().min(2, 'Họ tên quá ngắn'),
  dateOfBirth: z.string().refine((dateStr) => {
    const ageInMonths = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return ageInMonths >= 18 && ageInMonths <= 72;
  }, { message: 'Độ tuổi của trẻ không đáp ứng tiêu chí tuyển sinh của khối lớp này. (18-72 tháng)' }),
  gender: z.enum(['MALE', 'FEMALE']),
  ethnicity: z.string().default('Kinh'),
  allergyTags: z.array(z.string()).optional(),
  guardian: z.object({
    fullName: z.string().min(2, 'Họ tên phụ huynh quá ngắn'),
    relationship: z.string().min(1, 'Vui lòng chọn mối quan hệ'),
    phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ (10 số chuẩn VN)'),
    identityCard: z.string().regex(/^[0-9]{12}$/, 'CCCD phải gồm 12 chữ số'),
    address: z.string().min(5, 'Địa chỉ quá ngắn')
  }),
  academicYearId: z.string().min(1, 'Vui lòng chọn niên khóa'),
  classId: z.string().min(1, 'Vui lòng chọn lớp học')
});

type StudentFormValues = z.infer<typeof studentSchema>;

export const StudentAdmissionTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students', filterClass, filterStatus, searchKeyword],
    queryFn: async () => {
      const res = await academicApi.getStudents({
        classId: filterClass !== 'ALL' ? filterClass : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        keyword: searchKeyword || undefined
      });
      return res.data;
    }
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res = await academicApi.getClasses();
      return res.data;
    }
  });

  const { data: activeYear } = useQuery({
    queryKey: ['activeAcademicYear'],
    queryFn: async () => {
      const res = await academicApi.getActiveAcademicYear();
      return res.data;
    }
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema) as any,
    defaultValues: {
      gender: 'MALE',
      ethnicity: 'Kinh',
      allergyTags: [],
    }
  });

  const selectedClassId = watch('classId');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  const admissionMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      if (selectedClass && selectedClass.currentCount && selectedClass.capacity && selectedClass.currentCount >= selectedClass.capacity) {
        throw new Error('MSG-061: Lớp học đã đủ sĩ số tối đa. Vui lòng chọn lớp khác hoặc chuyển sang danh sách chờ.');
      }

      const res = await academicApi.createStudentAndEnroll({
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        ethnicity: data.ethnicity,
        classId: data.classId,
        academicYearId: data.academicYearId,
        allergyTags: data.allergyTags?.join(',') || ''
      });
      
      const studentId = (res.data as any).id;
      
      await academicApi.registerGuardian(studentId, data.guardian);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setToastMessage({ type: 'success', text: 'MSG-058: Tiếp nhận và xếp lớp cho học sinh thành công' });
      setIsModalOpen(false);
      reset();
      setStep(1);
      setTimeout(() => setToastMessage(null), 5000);
    },
    onError: (error: any) => {
      let msg = 'MSG-004: Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = error.message;
      }
      if (msg.includes('duplicate')) msg = 'MSG-062: Học sinh với định danh khai sinh này đã được đăng ký trong hệ thống.';
      setToastMessage({ type: 'error', text: msg });
      setTimeout(() => setToastMessage(null), 5000);
    }
  });

  const onSubmit = (data: StudentFormValues) => {
    admissionMutation.mutate(data);
  };

  const allergyOptions = ['Hải sản', 'Đậu phộng', 'Trứng', 'Sữa bò', 'Gluten'];

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
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm tên, mã học sinh..." 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#78C2AD] focus:border-transparent w-full sm:w-64"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
          >
            <option value="ALL">Tất cả lớp</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select 
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#78C2AD]"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học</option>
            <option value="PENDING">Chờ xếp lớp</option>
            <option value="TRANSFERRED">Đã chuyển trường</option>
            <option value="DROPPED">Nghỉ học</option>
          </select>
        </div>
        <button 
          onClick={() => {
            if (activeYear) setValue('academicYearId', activeYear.id);
            setIsModalOpen(true);
          }}
          className="bg-[#275A4E] hover:bg-[#1E4D40] text-white font-medium px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition duration-200 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tiếp nhận Học sinh Mới</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoadingStudents ? (
          <div className="p-8 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-[#78C2AD]" /></div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>Không tìm thấy học sinh nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F4F7F5] text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Học sinh</th>
                  <th className="px-6 py-4 font-semibold">Ngày sinh</th>
                  <th className="px-6 py-4 font-semibold">Lớp</th>
                  <th className="px-6 py-4 font-semibold">Người giám hộ</th>
                  <th className="px-6 py-4 font-semibold">Cảnh báo</th>
                  <th className="px-6 py-4 font-semibold">Trạng thái</th>
                  <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E5A93C]/20 flex items-center justify-center text-[#E5A93C] font-bold">
                          {student.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{student.fullName}</div>
                          <div className="text-xs text-slate-500">{student.studentCode || `HS-${student.id.substring(0,6)}`}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{student.dateOfBirth}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium text-xs">
                        {student.className || classes.find(c => c.id === student.classId)?.name || 'Chưa xếp'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-800 font-medium">{student.guardianName || 'Chưa cập nhật'}</div>
                      <div className="text-xs text-slate-500">{student.guardianPhone || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      {student.allergyTags ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{student.allergyTags}</span>
                        </div>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#78C2AD]/20 text-[#1E4D40] px-2.5 py-1 rounded-lg font-medium text-xs">
                        {student.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#275A4E] text-white">
              <h2 className="text-lg font-bold">Tiếp nhận Học sinh Mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/70 hover:text-white p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex px-6 py-3 border-b border-slate-100 bg-slate-50 text-sm font-medium">
              <div className={`flex-1 flex items-center gap-2 ${step >= 1 ? 'text-[#275A4E]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-[#275A4E] text-white' : 'bg-slate-200'}`}>1</div>
                Thông tin bé
              </div>
              <div className={`flex-1 flex items-center gap-2 ${step >= 2 ? 'text-[#275A4E]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-[#275A4E] text-white' : 'bg-slate-200'}`}>2</div>
                Phụ huynh
              </div>
              <div className={`flex-1 flex items-center gap-2 ${step >= 3 ? 'text-[#275A4E]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-[#275A4E] text-white' : 'bg-slate-200'}`}>3</div>
                Xếp lớp
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-['Plus_Jakarta_Sans']">
              <form id="admission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên bé <span className="text-red-500">*</span></label>
                        <input {...register('fullName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="Nguyễn Văn A" />
                        {errors.fullName?.message && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày sinh <span className="text-red-500">*</span></label>
                        <input type="date" {...register('dateOfBirth')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                        {errors.dateOfBirth?.message && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giới tính</label>
                        <select {...register('gender')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Dân tộc</label>
                        <input {...register('ethnicity')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <label className="block text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Cảnh báo dị ứng thực phẩm (Bắt buộc khảo sát)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {allergyOptions.map(allergy => (
                          <label key={allergy} className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg cursor-pointer hover:bg-rose-100 transition">
                            <input type="checkbox" value={allergy} {...register('allergyTags')} className="text-red-600 focus:ring-red-500 rounded" />
                            <span className="text-sm font-medium text-rose-800">{allergy}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên Phụ huynh <span className="text-red-500">*</span></label>
                        <input {...register('guardian.fullName')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                        {errors.guardian?.fullName?.message && <p className="text-xs text-red-500 mt-1">{errors.guardian.fullName.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Mối quan hệ <span className="text-red-500">*</span></label>
                        <select {...register('guardian.relationship')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                          <option value="">-- Chọn --</option>
                          <option value="Bố">Bố</option>
                          <option value="Mẹ">Mẹ</option>
                          <option value="Ông bà">Ông bà</option>
                          <option value="Người giám hộ">Người giám hộ khác</option>
                        </select>
                        {errors.guardian?.relationship?.message && <p className="text-xs text-red-500 mt-1">{errors.guardian.relationship.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                        <input {...register('guardian.phone')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="09..." />
                        {errors.guardian?.phone?.message && <p className="text-xs text-red-500 mt-1">{errors.guardian.phone.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số CCCD/CMND <span className="text-red-500">*</span></label>
                        <input {...register('guardian.identityCard')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" placeholder="12 chữ số" />
                        {errors.guardian?.identityCard?.message && <p className="text-xs text-red-500 mt-1">{errors.guardian.identityCard.message}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ thường trú <span className="text-red-500">*</span></label>
                        <input {...register('guardian.address')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none" />
                        {errors.guardian?.address?.message && <p className="text-xs text-red-500 mt-1">{errors.guardian.address.message}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Niên khóa <span className="text-red-500">*</span></label>
                        <select {...register('academicYearId')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                          <option value="">-- Chọn niên khóa --</option>
                          {activeYear && <option value={activeYear.id}>{activeYear.name || '2026-2027'}</option>}
                        </select>
                        {errors.academicYearId?.message && <p className="text-xs text-red-500 mt-1">{errors.academicYearId.message}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phân bổ Lớp học <span className="text-red-500">*</span></label>
                        <select {...register('classId')} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#78C2AD] focus:outline-none">
                          <option value="">-- Chọn lớp học --</option>
                          {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.ageGroup}</option>
                          ))}
                        </select>
                        {errors.classId?.message && <p className="text-xs text-red-500 mt-1">{errors.classId.message}</p>}
                      </div>
                    </div>
                    
                    {selectedClass && (
                      <div className="p-4 bg-[#78C2AD]/10 border border-[#78C2AD]/30 rounded-xl flex items-start gap-3 mt-4">
                        <Users className="w-5 h-5 text-[#275A4E] mt-0.5" />
                        <div>
                          <div className="font-semibold text-[#1E4D40]">Thông tin Lớp {selectedClass.name}</div>
                          <div className="text-sm text-[#275A4E] mt-1">
                            Sĩ số hiện tại: <strong>{selectedClass.currentCount || 0} / {selectedClass.capacity || 30}</strong> học sinh
                          </div>
                          {(selectedClass.currentCount || 0) >= (selectedClass.capacity || 30) && (
                            <div className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Lớp học đã đạt sức chứa tối đa. Không thể tiếp nhận thêm.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-3xl">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition">
                  Quay lại
                </button>
              ) : <div></div>}
              
              {step < 3 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="px-6 py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white font-medium rounded-xl shadow-sm transition">
                  Tiếp tục
                </button>
              ) : (
                <button 
                  type="submit" 
                  form="admission-form" 
                  disabled={admissionMutation.isPending || (selectedClass && (selectedClass.currentCount || 0) >= (selectedClass.capacity || 30))}
                  className="px-6 py-2.5 bg-[#78C2AD] hover:bg-[#5eb39a] text-white font-bold rounded-xl shadow-sm transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {admissionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Hoàn tất Tiếp nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
