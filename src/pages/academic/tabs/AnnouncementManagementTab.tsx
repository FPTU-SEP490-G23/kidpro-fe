import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Plus,
  Send,
  Calendar,
  Clock,
  Eye,
  FileText,
  Upload,
  X,
  Search,
  Filter,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Users,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Download,
  Bold,
  Italic,
  List,
  Heading2,
  Quote,
} from 'lucide-react';
import { announcementService } from '../../../services/announcementService';
import {
  AnnouncementItem,
  CreateAnnouncementPayload,
  AnnouncementScope,
  AnnouncementStatus,
  AnnouncementAttachment,
} from '../../../types/announcement.types';

const GRADE_OPTIONS = [
  { id: 'NHA_TRE', label: 'Nhà trẻ (18 - 36 tháng)' },
  { id: 'MAM', label: 'Khối Mầm (3 - 4 tuổi)' },
  { id: 'CHOI', label: 'Khối Chồi (4 - 5 tuổi)' },
  { id: 'LA', label: 'Khối Lá (5 - 6 tuổi)' },
];

export const AnnouncementManagementTab: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterScope, setFilterScope] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Composer State
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [scope, setScope] = useState<AnnouncementScope>('ALL_SCHOOL');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }[]>([]);
  const [activeEditorTab, setActiveEditorTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<AnnouncementItem | null>(null);

  // Toast / Alert Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; message: string; code?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, [filterScope, filterStatus]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const scopeParam = filterScope !== 'ALL' ? (filterScope as AnnouncementScope) : undefined;
      const statusParam = filterStatus !== 'ALL' ? (filterStatus as AnnouncementStatus) : undefined;
      const res = await announcementService.getAnnouncements({
        scope: scopeParam,
        status: statusParam,
        page: 0,
        size: 50,
      });
      setAnnouncements(res.content || []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách thông báo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setScope('ALL_SCHOOL');
    setSelectedGrades([]);
    setIsScheduled(false);
    setScheduledAt('');
    setAttachments([]);
    setActiveEditorTab('write');
    setShowComposer(true);
  };

  const handleOpenEditModal = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content);
    setScope(item.scope);
    setSelectedGrades(item.targetGrades || []);
    setIsScheduled(item.isScheduled);
    setScheduledAt(item.scheduledAt ? item.scheduledAt.substring(0, 16) : '');
    setAttachments(
      item.attachments?.map((a) => ({
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType || 'application/pdf',
        fileSize: a.fileSize || 1024 * 1024,
      })) || []
    );
    setActiveEditorTab('write');
    setShowComposer(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    // Client-side validation: Max 20MB
    const maxBytes = 20 * 1024 * 1024;
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (file.size > maxBytes || !allowedExts.includes(ext)) {
      setFeedback({
        type: 'error',
        code: 'MSG-231',
        message: 'Tệp đính kèm vượt quá dung lượng tối đa 20MB hoặc chứa định dạng không an toàn (chỉ chấp nhận PDF, PNG, JPG, DOCX).',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Mock upload URL for simulation
    const simulatedUrl = URL.createObjectURL(file);
    setAttachments((prev) => [
      ...prev,
      {
        fileName: file.name,
        fileUrl: simulatedUrl,
        fileType: file.type || ext,
        fileSize: file.size,
      },
    ]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleGrade = (gradeId: string) => {
    setSelectedGrades((prev) =>
      prev.includes(gradeId) ? prev.filter((g) => g !== gradeId) : [...prev, gradeId]
    );
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    // Client Validation 1: BR-055
    if (!title.trim() || title.trim().length < 10 || !content.trim() || content.trim().length < 10) {
      setFeedback({
        type: 'error',
        code: 'MSG-010',
        message: 'Tiêu đề hoặc nội dung thông báo bị bỏ trống hoặc ngắn hơn 10 ký tự.',
      });
      return;
    }

    // Client Validation 2: BR-056
    if (isScheduled && !isDraft) {
      if (!scheduledAt) {
        setFeedback({
          type: 'error',
          code: 'MSG-230',
          message: 'Thời gian hẹn giờ phát hành không hợp lệ (phải xảy ra trong tương lai).',
        });
        return;
      }
      const selectedTime = new Date(scheduledAt).getTime();
      const now = new Date().getTime();
      if (selectedTime <= now) {
        setFeedback({
          type: 'error',
          code: 'MSG-230',
          message: 'Thời gian hẹn giờ phát hành không hợp lệ (phải xảy ra trong tương lai).',
        });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback(null);

    const payload: CreateAnnouncementPayload = {
      title: title.trim(),
      content: content.trim(),
      scope,
      targetGrades: scope === 'SPECIFIC_GRADES' ? selectedGrades : ['ALL'],
      isScheduled: isScheduled && !isDraft,
      scheduledAt: isScheduled && !isDraft ? scheduledAt : undefined,
      isDraft,
      attachments,
    };

    try {
      if (editingId) {
        await announcementService.updateAnnouncement(editingId, payload);
      } else {
        await announcementService.createAnnouncement(payload);
      }

      setFeedback({
        type: 'success',
        code: 'MSG-229',
        message: isDraft
          ? 'Đã lưu bản nháp thông báo thành công.'
          : isScheduled
          ? 'Đã lên lịch phát hành thông báo thành công. Hệ thống sẽ tự động phát sóng qua FCM khi đến giờ.'
          : 'Phát hành thông báo toàn trường thành công. Push notification đang được gửi tới phụ huynh và giáo viên.',
      });

      setShowComposer(false);
      fetchAnnouncements();
    } catch (err: any) {
      const errRes = err.response?.data;
      setFeedback({
        type: 'error',
        code: errRes?.code || 'ERROR',
        message: errRes?.message || 'Có lỗi xảy ra khi xử lý thông báo. Vui lòng thử lại.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Quý thầy cô có chắc chắn muốn gỡ bỏ hoặc lưu trữ thông báo này không?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setFeedback({
        type: 'success',
        message: 'Đã gỡ bỏ và lưu trữ thông báo thành công.',
      });
      fetchAnnouncements();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể xóa thông báo.',
      });
    }
  };

  // Filtered List
  const filteredList = announcements.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  // KPI Counts
  const totalCount = announcements.length;
  const publishedCount = announcements.filter((a) => a.status === 'PUBLISHED').length;
  const scheduledCount = announcements.filter((a) => a.status === 'SCHEDULED').length;
  const draftCount = announcements.filter((a) => a.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
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
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng bản tin</span>
            <Megaphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Toàn trường & khối lớp</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Đã phát hành</span>
            <Send className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">{publishedCount}</div>
          <span className="text-xs text-emerald-600 mt-1 block">Đã gửi Push FCM</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hẹn giờ phát sóng</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{scheduledCount}</div>
          <span className="text-xs text-amber-600 mt-1 block">Tự động phát hành</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bản nháp</span>
            <Edit3 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-700">{draftCount}</div>
          <span className="text-xs text-slate-400 mt-1 block">Chờ phê duyệt</span>
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
              placeholder="Tìm kiếm tiêu đề, nội dung thông báo..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="ALL">Phạm vi: Tất cả</option>
              <option value="ALL_SCHOOL">Toàn trường</option>
              <option value="SPECIFIC_GRADES">Theo khối lớp</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="SCHEDULED">Hẹn giờ phát hành</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all hover:shadow-lg hover:shadow-emerald-700/30"
        >
          <Plus className="w-4 h-4" />
          <span>Soạn Thông Báo Mới</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            <p className="text-sm font-medium">Đang tải danh sách thông báo...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700 mb-1">Chưa có thông báo nào</p>
            <p className="text-xs text-slate-400">Nhấn nút "Soạn Thông Báo Mới" để tạo và phát hành bản tin đầu tiên.</p>
          </div>
        ) : (
          filteredList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[280px]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'SCHEDULED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : item.status === 'DRAFT'
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.status === 'SCHEDULED' && <Clock className="w-3 h-3" />}
                      {item.statusLabel || item.status}
                    </span>

                    {/* Scope Badge */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {item.scope === 'ALL_SCHOOL' ? (
                        <>
                          <Users className="w-3 h-3" />
                          <span>Toàn trường</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3 h-3" />
                          <span>Khối: {item.targetGrades?.join(', ') || 'Chỉ định'}</span>
                        </>
                      )}
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
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    Chi tiết
                  </button>

                  {(item.status === 'DRAFT' || item.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Sửa
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Gỡ bỏ/Lưu trữ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {item.content}
              </p>

              {/* Attachments preview & metadata footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Người đăng: <strong className="text-slate-700">{item.authorName || 'Ban Giám Hiệu'}</strong></span>
                  <span>•</span>
                  <span>
                    {item.status === 'SCHEDULED' && item.scheduledAt ? (
                      <span className="text-amber-700 font-semibold">
                        Hẹn giờ phát hành: {new Date(item.scheduledAt).toLocaleString('vi-VN')}
                      </span>
                    ) : item.publishedAt ? (
                      <span>Đã phát hành: {new Date(item.publishedAt).toLocaleString('vi-VN')}</span>
                    ) : (
                      <span>Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    )}
                  </span>
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{item.attachments.length} tệp đính kèm ({item.attachments[0].fileName})</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Soạn thảo Thông báo Mới / Chỉnh sửa */}
      {showComposer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#1E4D40] to-[#275A4E] text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5A93C] text-slate-950">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cán bộ Giáo vụ
                </span>
                <h2 className="text-xl font-bold">
                  {editingId ? 'Chỉnh Sửa Thông Báo' : 'Soạn Thảo & Phát Hành Thông Báo Mới'}
                </h2>
                <p className="text-xs text-emerald-100/80">
                  Phát hành bản tin toàn trường hoặc hẹn giờ phát hành qua Push FCM và bảng tin phụ huynh.
                </p>
              </div>
              <button
                onClick={() => setShowComposer(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Tiêu đề */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tiêu đề thông báo <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-medium ${title.trim().length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {title.trim().length}/10 ký tự tối thiểu
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch tổ chức Hội thi Rung Chuông Vàng và Lễ Hội Dã Ngoại Mùa Thu"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Radio Chọn phạm vi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phạm vi phát hành <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setScope('ALL_SCHOOL')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      scope === 'ALL_SCHOOL'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="announcement_scope"
                      checked={scope === 'ALL_SCHOOL'}
                      onChange={() => setScope('ALL_SCHOOL')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Toàn trường (ALL_SCHOOL)</div>
                      <div className="text-xs text-slate-500">Gửi tới 100% tài khoản phụ huynh & giáo viên các khối</div>
                    </div>
                  </label>

                  <label
                    onClick={() => setScope('SPECIFIC_GRADES')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      scope === 'SPECIFIC_GRADES'
                        ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="announcement_scope"
                      checked={scope === 'SPECIFIC_GRADES'}
                      onChange={() => setScope('SPECIFIC_GRADES')}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800">Chọn khối lớp cụ thể</div>
                      <div className="text-xs text-slate-500">Chỉ gửi tới phụ huynh học sinh thuộc khối lớp được chọn</div>
                    </div>
                  </label>
                </div>

                {/* Khối lớp cụ thể */}
                {scope === 'SPECIFIC_GRADES' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mt-2 animate-fadeIn">
                    <span className="text-xs font-semibold text-slate-700 block">Chọn các khối lớp áp dụng:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {GRADE_OPTIONS.map((g) => (
                        <label
                          key={g.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer text-xs font-medium text-slate-800 hover:border-emerald-400"
                        >
                          <input
                            type="checkbox"
                            checked={selectedGrades.includes(g.id)}
                            onChange={() => toggleGrade(g.id)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{g.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rich Text Editor for Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nội dung thông báo <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab('write')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          activeEditorTab === 'write' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Soạn thảo
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveEditorTab('preview')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                          activeEditorTab === 'preview' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                        }`}
                      >
                        Xem trước
                      </button>
                    </div>
                  </div>

                  <span className={`text-[11px] font-medium ${content.trim().length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {content.trim().length}/10 ký tự tối thiểu
                  </span>
                </div>

                {activeEditorTab === 'write' ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
                    {/* Formatting Toolbar */}
                    <div className="flex items-center gap-1 p-2 bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs">
                      <button
                        type="button"
                        onClick={() => setContent((prev) => prev + '\n**In đậm**')}
                        className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                        title="In đậm"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContent((prev) => prev + '\n*In nghiêng*')}
                        className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                        title="In nghiêng"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContent((prev) => prev + '\n## Tiêu đề phụ')}
                        className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                        title="Tiêu đề đề mục"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContent((prev) => prev + '\n- Ý thứ nhất\n- Ý thứ hai')}
                        className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                        title="Danh sách gạch đầu dòng"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setContent((prev) => prev + '\n> Lưu ý quan trọng')}
                        className="p-1.5 hover:bg-white rounded hover:text-slate-900"
                        title="Trích dẫn"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập nội dung thông báo chi tiết gửi phụ huynh (tối thiểu 10 ký tự)..."
                      className="w-full p-4 text-sm text-slate-800 bg-white border-none focus:outline-hidden resize-y"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[160px] text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {content.trim() ? content : <span className="text-slate-400 italic">Chưa có nội dung để xem trước.</span>}
                  </div>
                )}
              </div>

              {/* Lên lịch hẹn giờ phát hành */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Đặt lịch hẹn giờ phát hành (Scheduled At)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {isScheduled && (
                  <div className="space-y-2 animate-fadeIn">
                    <p className="text-xs text-amber-900/80">
                      Chọn mốc thời gian trong tương lai. Hệ thống Cron Task sẽ tự động chuyển sang trạng thái <strong>PUBLISHED</strong> và phát Push Notification tới phụ huynh.
                    </p>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}
              </div>

              {/* Tệp đính kèm tối đa 20MB */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tệp đính kèm tài liệu (Tối đa 20MB - PDF, PNG, JPG, DOCX)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Chọn tệp tải lên</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{att.fileName}</span>
                          <span className="text-slate-400 shrink-0">
                            ({(att.fileSize / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-slate-400 hover:text-rose-600 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-400 cursor-pointer transition-colors bg-slate-50/50"
                  >
                    <Upload className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">
                      Nhấn để tải tài liệu đính kèm (Thông tư, Kế hoạch dã ngoại, Sổ tay y tế...)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Lưu Bản Nháp (DRAFT)
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isScheduled ? 'Lên Lịch Hẹn Giờ' : 'Xuất Bản Ngay'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem Chi Tiết Thông Báo */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400">
                  {selectedDetail.scopeLabel} • {selectedDetail.statusLabel}
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
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span>Người đăng: <strong>{selectedDetail.authorName}</strong></span>
                <span>•</span>
                <span>Ngày đăng: {new Date(selectedDetail.createdAt).toLocaleString('vi-VN')}</span>
              </div>

              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedDetail.content}
              </div>

              {selectedDetail.attachments && selectedDetail.attachments.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 mt-4">
                  <span className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                    Tệp đính kèm ({selectedDetail.attachments.length}):
                  </span>
                  {selectedDetail.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs"
                    >
                      <span className="font-semibold text-slate-800 truncate">{att.fileName}</span>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải về
                      </a>
                    </div>
                  ))}
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

export default AnnouncementManagementTab;
