import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Plus,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Filter,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  HeartPulse,
  Activity,
  Layers,
  Sparkles,
  Paperclip,
  Flame,
  Volume2,
} from 'lucide-react';
import { medicalBulletinService } from '../../../services/medicalBulletinService';
import {
  MedicalBulletinItem,
  CreateBulletinPayload,
  BulletinCategory,
  BulletinPriority,
} from '../../../types/medicalBulletin.types';

const CATEGORY_OPTIONS: { id: BulletinCategory; label: string }[] = [
  { id: 'OUTBREAK_ALERT', label: 'Cảnh báo dịch bệnh bùng phát' },
  { id: 'HEALTH_AWARENESS', label: 'Tuyên truyền y tế học đường' },
  { id: 'HYGIENE_VACCINATION', label: 'Tiêm chủng & Vệ sinh phòng dịch' },
];

const GRADE_LEVELS = [
  { id: 'NHA_TRE', label: 'Nhà trẻ' },
  { id: 'MAM', label: 'Khối Mầm' },
  { id: 'CHOI', label: 'Khối Chồi' },
  { id: 'LA', label: 'Khối Lá' },
];

export const MedicalBulletinTab: React.FC = () => {
  const [bulletins, setBulletins] = useState<MedicalBulletinItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [diseaseName, setDiseaseName] = useState<string>('');
  const [category, setCategory] = useState<BulletinCategory>('OUTBREAK_ALERT');
  const [priority, setPriority] = useState<BulletinPriority>('NORMAL');
  const [symptomsGuide, setSymptomsGuide] = useState<string>('');
  const [preventionAdvice, setPreventionAdvice] = useState<string>('');
  const [targetScope, setTargetScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<MedicalBulletinItem | null>(null);

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    code?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBulletins();
  }, [filterCategory, filterPriority]);

  const fetchBulletins = async () => {
    setIsLoading(true);
    try {
      const catParam = filterCategory !== 'ALL' ? (filterCategory as BulletinCategory) : undefined;
      const priParam = filterPriority !== 'ALL' ? (filterPriority as BulletinPriority) : undefined;
      const res = await medicalBulletinService.getBulletins({
        category: catParam,
        priority: priParam,
        page: 0,
        size: 50,
      });
      setBulletins(res.content || []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách bản tin y tế:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setDiseaseName('');
    setCategory('OUTBREAK_ALERT');
    setPriority('NORMAL');
    setSymptomsGuide('');
    setPreventionAdvice('');
    setTargetScope('ALL');
    setSelectedGrades([]);
    setAttachment(null);
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const simUrl = URL.createObjectURL(file);
    setAttachment({
      fileName: file.name,
      fileUrl: simUrl,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleGrade = (gradeId: string) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId) ? prev.filter((g) => g !== gradeId) : [...prev, gradeId]
    );
  };

  const handleSubmit = async () => {
    // 1. BR-055: Kiểm tra tiêu đề hoặc nội dung rỗng (MSG-010)
    if (!title.trim() || !preventionAdvice.trim()) {
      setFeedback({
        type: 'error',
        code: 'MSG-010',
        message: 'Tiêu đề hoặc nội dung bản tin y tế không được để trống.',
      });
      return;
    }

    // 2. BR-058: Bản tin y tế gắn nhãn khẩn cấp (URGENT) bắt buộc phải ghi rõ tên dịch bệnh và hướng dẫn triệu chứng (MSG-238)
    if (priority === 'URGENT') {
      if (!diseaseName.trim() || !symptomsGuide.trim()) {
        setFeedback({
          type: 'error',
          code: 'MSG-238',
          message: 'Bản tin y tế khẩn cấp bắt buộc phải nêu rõ tên dịch bệnh và hướng dẫn triệu chứng.',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: CreateBulletinPayload = {
      title: title.trim(),
      diseaseName: diseaseName.trim() || undefined,
      category,
      priority,
      symptomsGuide: symptomsGuide.trim() || undefined,
      preventionAdvice: preventionAdvice.trim(),
      targetGrades: targetScope === 'SPECIFIC' ? selectedGrades : ['ALL'],
      attachmentUrl: attachment?.fileUrl,
      attachmentName: attachment?.fileName,
    };

    try {
      await medicalBulletinService.createBulletin(payload);
      setFeedback({
        type: 'success',
        code: 'MSG-237',
        message:
          priority === 'URGENT'
            ? 'Đăng bản tin y tế học đường & cảnh báo dịch bệnh thành công. Đã kích hoạt High-Priority FCM Push Notification với âm thanh cảnh báo y tế tới toàn bộ phụ huynh.'
            : 'Đăng bản tin y tế học đường thành công. Bản tin đã được xuất bản lên chuyên mục Y tế.',
      });
      setShowModal(false);
      fetchBulletins();
    } catch (err: any) {
      const errRes = err.response?.data;
      setFeedback({
        type: 'error',
        code: errRes?.code || 'ERROR',
        message: errRes?.message || 'Có lỗi xảy ra khi xuất bản bản tin y tế.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, bulletinTitle: string) => {
    if (!window.confirm(`Xác nhận gỡ bỏ bản tin y tế "${bulletinTitle}"?`)) return;
    try {
      await medicalBulletinService.deleteBulletin(id);
      setFeedback({
        type: 'success',
        message: 'Đã gỡ bỏ bản tin y tế thành công khi mùa dịch kết thúc.',
      });
      fetchBulletins();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể gỡ bỏ bản tin.',
      });
    }
  };

  // Filtered List
  const filteredBulletins = bulletins.filter((b) => {
    const matchSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.diseaseName && b.diseaseName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.preventionAdvice.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const totalCount = bulletins.length;
  const urgentCount = bulletins.filter((b) => b.priority === 'URGENT').length;
  const normalCount = bulletins.filter((b) => b.priority === 'NORMAL').length;
  const outbreakCount = bulletins.filter((b) => b.category === 'OUTBREAK_ALERT').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-2xl border shadow-sm transition-all animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">
            {feedback.code && <span className="font-bold underline mr-1.5">[{feedback.code}]</span>}
            {feedback.message}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng bản tin y tế</span>
            <HeartPulse className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Tuyên truyền & dịch bệnh</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Cảnh báo khẩn cấp (URGENT)</span>
            <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">{urgentCount}</div>
          <span className="text-xs text-rose-600 mt-1 block">Banner đỏ & High FCM</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tuyên truyền thường nhật</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">{normalCount}</div>
          <span className="text-xs text-blue-600 mt-1 block">Cẩm nang sức khỏe</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dịch bệnh mùa</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">{outbreakCount}</div>
          <span className="text-xs text-amber-600 mt-1 block">Tay chân miệng, Cúm, Sốt</span>
        </div>
      </div>

      {/* Control Bar & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tên bệnh (Tay chân miệng, Sốt xuất huyết...), triệu chứng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="ALL">Phân loại: Tất cả</option>
              <option value="OUTBREAK_ALERT">Cảnh báo dịch bệnh</option>
              <option value="HEALTH_AWARENESS">Tuyên truyền y tế</option>
              <option value="HYGIENE_VACCINATION">Tiêm chủng & Vệ sinh</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="ALL">Mức độ: Tất cả</option>
              <option value="URGENT">Khẩn cấp (URGENT)</option>
              <option value="NORMAL">Thông thường</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg hover:shadow-emerald-700/30"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng Bản Tin Y Tế Mới</span>
        </button>
      </div>

      {/* Bulletins Cards List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm font-medium">Đang tải danh sách bản tin y tế...</p>
          </div>
        ) : filteredBulletins.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <HeartPulse className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700 mb-1">Chưa có bản tin y tế nào</p>
            <p className="text-xs text-slate-400">Nhấn nút "Đăng Bản Tin Y Tế Mới" để phát hành khuyến cáo dịch bệnh.</p>
          </div>
        ) : (
          filteredBulletins.map((item) => (
            <div
              key={item.id}
              className={`bg-white p-5 rounded-2xl border transition-all space-y-4 ${
                item.priority === 'URGENT'
                  ? 'border-rose-300 ring-1 ring-rose-500/20 shadow-md shadow-rose-500/5'
                  : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              {/* Top Banner / Tags */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Priority Badge */}
                    {item.priority === 'URGENT' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs animate-pulse">
                        <Flame className="w-3.5 h-3.5" />
                        <span>KHẨN CẤP (URGENT)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Activity className="w-3 h-3" />
                        <span>Tuyên truyền thường nhật</span>
                      </span>
                    )}

                    {/* Category Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.categoryLabel || item.category}
                    </span>

                    {/* Disease Name Tag */}
                    {item.diseaseName && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Bệnh: {item.diseaseName}
                      </span>
                    )}

                    {/* Target Scope */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span>{item.targetGrades?.join(', ') || 'Toàn trường'}</span>
                    </span>
                  </div>

                  <h3
                    onClick={() => setSelectedDetail(item)}
                    className="text-base sm:text-lg font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDetail(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shadow-xs"
                  >
                    Xem chi tiết
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Gỡ bỏ bản tin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Symptoms Guide Box (BR-058) */}
              {item.symptomsGuide && (
                <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Dấu hiệu nhận biết & Triệu chứng ban đầu:</span>
                  </div>
                  <p className="text-rose-950 font-medium pl-5.5 leading-relaxed">
                    {item.symptomsGuide}
                  </p>
                </div>
              )}

              {/* Prevention Advice */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 uppercase tracking-wider">
                  <HeartPulse className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hướng dẫn phòng dịch & Chăm sóc y tế tại gia đình:</span>
                </div>
                <p className="text-slate-800 pl-5.5 leading-relaxed line-clamp-3">
                  {item.preventionAdvice}
                </p>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
                <span>Ngày đăng: {new Date(item.createdAt).toLocaleString('vi-VN')}</span>

                {item.attachmentName && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Đính kèm: {item.attachmentName}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Đăng Bản Tin Y Tế Mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950">
                  <Sparkles className="w-3.5 h-3.5" />
                  G11-UC-08 • Cán bộ Giáo vụ
                </span>
                <h2 className="text-xl font-bold">Đăng Bản Tin Y Tế & Cảnh Báo Dịch Bệnh</h2>
                <p className="text-xs text-emerald-100/80">
                  Phát hành khuyến cáo sức khỏe, cảnh báo dịch bệnh theo mùa tới toàn thể phụ huynh.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tiêu đề (BR-055) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tiêu đề bản tin y tế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Cảnh báo khẩn cấp: Bùng phát dịch Tay Chân Miệng và Biện pháp cách ly y tế"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Phân loại & Mức độ ưu tiên */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Phân loại chuyên mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BulletinCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Switch Cảnh báo khẩn cấp (URGENT) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Mức độ ưu tiên phát sóng</span>
                    {priority === 'URGENT' && <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                  </label>
                  <div
                    onClick={() => setPriority((prev) => (prev === 'URGENT' ? 'NORMAL' : 'URGENT'))}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                      priority === 'URGENT'
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/10'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">
                      {priority === 'URGENT' ? 'Cảnh báo khẩn cấp (URGENT)' : 'Thông thường (NORMAL)'}
                    </span>
                    <div
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        priority === 'URGENT' ? 'bg-rose-600' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                          priority === 'URGENT' ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Thông báo chế độ khẩn cấp */}
              {priority === 'URGENT' && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                  <Volume2 className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                  <div className="text-xs text-rose-900 leading-relaxed font-medium">
                    <strong>Chế độ Khẩn cấp (High Priority FCM):</strong> Bắt buộc phải nhập <strong>Tên dịch bệnh</strong> và <strong>Dấu hiệu nhận biết ban đầu</strong> (BR-058, MSG-238). Khi phát hành, hệ thống sẽ đẩy Push Notification kèm âm thanh cảnh báo y tế tới 100% phụ huynh.
                  </div>
                </div>
              )}

              {/* Tên dịch bệnh (Bắt buộc khi URGENT - BR-058) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tên dịch bệnh {priority === 'URGENT' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  placeholder="Ví dụ: Bệnh Tay Chân Miệng (Chủng EV71) / Cúm Mùa A/B / Thủy Đậu..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Triệu chứng nhận biết (Bắt buộc khi URGENT - BR-058) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Dấu hiệu nhận biết & Triệu chứng ban đầu {priority === 'URGENT' && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={3}
                  value={symptomsGuide}
                  onChange={(e) => setSymptomsGuide(e.target.value)}
                  placeholder="Ví dụ: Sốt nhẹ hoặc cao 38.5-39°C khó hạ, vết loét đỏ ở niêm mạc miệng, mụn nước ở lòng bàn tay, lòng bàn chân, mông..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Hướng dẫn phòng dịch & Chăm sóc (BR-055) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hướng dẫn phòng ngừa & Khuyến nghị cách ly y tế <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={preventionAdvice}
                  onChange={(e) => setPreventionAdvice(e.target.value)}
                  placeholder="Ví dụ: Rửa tay thường xuyên bằng xà phòng sát khuẩn; khử khuẩn đồ chơi bằng Cloramin B; phụ huynh chủ động cách ly trẻ tại nhà tối thiểu 10 ngày nếu nghi nhiễm..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Đính kèm Infographic / Hướng dẫn y khoa */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Tài liệu / Infographic hướng dẫn y tế (PDF, PNG, JPG)</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn tệp</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {attachment ? (
                  <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{attachment.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="text-slate-400 hover:text-rose-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-3 text-center hover:border-emerald-400 cursor-pointer bg-slate-50/50"
                  >
                    <span className="text-xs text-slate-400">
                      Nhấn để đính kèm Infographic triệu chứng hoặc hướng dẫn của Bộ Y tế
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Xuất Bản Bản Tin (MSG-237)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Bản Tin Y Tế */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            <div
              className={`p-5 text-white flex items-center justify-between ${
                selectedDetail.priority === 'URGENT'
                  ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-800'
                  : 'bg-slate-900'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-300">
                  {selectedDetail.priorityLabel} • {selectedDetail.categoryLabel}
                </span>
                <h3 className="text-lg font-bold">{selectedDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedDetail.diseaseName && (
                <div className="text-xs font-bold text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  Tên dịch bệnh: {selectedDetail.diseaseName}
                </div>
              )}

              {selectedDetail.symptomsGuide && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Dấu hiệu nhận biết & Triệu chứng ban đầu:
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed">
                    {selectedDetail.symptomsGuide}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hướng dẫn phòng ngừa & Khuyến nghị chăm sóc:
                </h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedDetail.preventionAdvice}
                </div>
              </div>

              {selectedDetail.attachmentName && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-emerald-950">
                    Tài liệu: {selectedDetail.attachmentName}
                  </span>
                  {selectedDetail.attachmentUrl && (
                    <a
                      href={selectedDetail.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Tải về
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm rounded-xl"
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

export default MedicalBulletinTab;
