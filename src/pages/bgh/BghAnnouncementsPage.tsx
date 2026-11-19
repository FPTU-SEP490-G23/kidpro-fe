import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  Eye,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Send,
  FileText,
  X,
  Upload,
  FileUp,
  FileCheck
} from 'lucide-react';
import {
  announcementApi,
  AnnouncementDto,
  AnnouncementCreateRequestDto
} from '../../api/announcementApi';

export const BghAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedAudience, setSelectedAudience] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Modal create announcement
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<AnnouncementCreateRequestDto>({
    title: '',
    content: '',
    targetAudience: 'ALL',
    isDraft: false,
    attachmentName: '',
    attachmentSize: 0,
  });

  // State cho kéo thả file
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal view detail
  const [viewDetail, setViewDetail] = useState<AnnouncementDto | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res: any = await announcementApi.getAnnouncements();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setAnnouncements(list);
    } catch (err: any) {
      console.error('Lỗi khi tải thông báo:', err);
      setToastMsg({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ để tải thông báo. Vui lòng thử lại.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Xử lý khi chọn file hoặc thả file
  const handleFileSelect = (file: File) => {
    // Tệp đính kèm tối đa 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setToastMsg({
        type: 'error',
        text: `Tệp "${file.name}" vượt quá dung lượng tối đa cho phép (20MB).`
      });
      return;
    }

    setAttachedFile(file);
    setFormData((prev) => ({
      ...prev,
      attachmentName: file.name,
      attachmentSize: file.size,
    }));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
    setFormData((prev) => ({
      ...prev,
      attachmentName: '',
      attachmentSize: 0,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleCreate = async (isDraft: boolean) => {
    // Tiêu đề bắt buộc
    if (!formData.title || !formData.title.trim()) {
      setToastMsg({
        type: 'warning',
        text: 'Vui lòng nhập tiêu đề thông báo.'
      });
      return;
    }

    // Nếu không phải lưu nháp thì nội dung bắt buộc
    if (!isDraft && (!formData.content || !formData.content.trim())) {
      setToastMsg({
        type: 'warning',
        text: 'Vui lòng nhập nội dung chi tiết thông báo.'
      });
      return;
    }

    // Tệp đính kèm tối đa 20MB
    if (formData.attachmentSize && formData.attachmentSize > 20 * 1024 * 1024) {
      setToastMsg({
        type: 'error',
        text: 'Tệp đính kèm vượt quá dung lượng tối đa cho phép (20MB).'
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: AnnouncementCreateRequestDto = {
        ...formData,
        isDraft,
      };

      await announcementApi.createAnnouncement(payload);

      setToastMsg({
        type: 'success',
        text: isDraft
          ? 'Bản nháp thông báo đã được lưu thành công vào danh sách.'
          : 'Thông báo toàn trường đã được phát hành thành công và gửi thông báo tới người nhận.'
      });

      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        targetAudience: 'ALL',
        isDraft: false,
        attachmentName: '',
        attachmentSize: 0,
      });
      setAttachedFile(null);

      fetchAnnouncements();
    } catch (err: any) {
      console.error('Lỗi khi đăng thông báo:', err);
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo thông báo.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này khỏi bảng tin toàn trường?')) {
      return;
    }

    try {
      await announcementApi.deleteAnnouncement(id);
      setToastMsg({
        type: 'success',
        text: 'Thông báo đã được xóa thành công.'
      });
      setAnnouncements(prev => (Array.isArray(prev) ? prev : []).filter(a => a.announcementId !== id));
      if (viewDetail?.announcementId === id) {
        setViewDetail(null);
      }
    } catch (err: any) {
      console.error('Lỗi xóa thông báo:', err);
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || 'Xóa thông báo thất bại.'
      });
    }
  };

  const safeList = Array.isArray(announcements) ? announcements : [];
  const filteredList = safeList.filter(a => {
    const matchSearch =
      (a.title && a.title.toLowerCase().includes(search.toLowerCase())) ||
      (a.content && a.content.toLowerCase().includes(search.toLowerCase())) ||
      (a.authorName && a.authorName.toLowerCase().includes(search.toLowerCase()));

    const matchAudience = selectedAudience === 'ALL' || a.targetAudience === selectedAudience;

    return matchSearch && matchAudience;
  });

  const getAudienceLabel = (aud: string) => {
    switch (aud) {
      case 'PARENTS_ONLY':
        return { label: 'Chỉ Phụ Huynh', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      case 'STAFF_ONLY':
        return { label: 'Chỉ Giáo Viên & Nhân Viên', bg: 'bg-purple-50 text-purple-700 border border-purple-200' };
      default:
        return { label: 'Toàn Trường (Tất Cả)', bg: 'bg-blue-50 text-blue-700 border border-blue-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 shadow-sm ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMsg.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : toastMsg.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold">{toastMsg.text}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-xs underline hover:opacity-75 ml-4 font-bold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-2xl text-[#275A4E]">
            <Megaphone className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-gray-900">
                Soạn Thảo & Đăng Thông Báo Toàn Trường
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Phát hành bảng tin chính thức • Gửi push notifications tới Phụ huynh & Cán bộ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnnouncements}
            disabled={loading}
            className="p-2.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* NÚT PHÁT THÔNG BÁO MỚI (MÀU CHUẨN THƯƠNG HIỆU, CHỮ TRẮNG NỀN XANH RÕ RÀNG) */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-[#275A4E] hover:bg-[#1E4D40] text-white px-5 py-2.5 rounded-xl font-bold shadow-sm hover:shadow transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Phát Thông Báo Mới</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, nội dung, người đăng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#275A4E]"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Đối tượng:</span>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#275A4E]"
          >
            <option value="ALL">Tất cả đối tượng</option>
            <option value="PARENTS_ONLY">Chỉ Phụ Huynh</option>
            <option value="STAFF_ONLY">Chỉ Cán Bộ / GV</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <RefreshCw className="w-8 h-8 text-[#275A4E] animate-spin" />
          <span className="ml-3 text-sm text-gray-500 font-medium">Đang tải danh sách thông báo...</span>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700">Chưa có thông báo nào</h3>
          <p className="text-xs text-gray-400 mt-1">
            Bấm vào nút "Phát Thông Báo Mới" để đăng bản tin tới phụ huynh hoặc cán bộ
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((ann) => {
            const aud = getAudienceLabel(ann.targetAudience);
            const isDraftItem = (ann as any).isDraft || (ann as any).status === 'DRAFT';

            return (
              <div
                key={ann.announcementId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition duration-200 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${aud.bg}`}>
                        {aud.label}
                      </span>
                      {isDraftItem && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Bản nháp
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </div>

                  <h3
                    onClick={() => setViewDetail(ann)}
                    className="font-bold text-gray-900 text-base mb-2 hover:text-[#275A4E] cursor-pointer line-clamp-2"
                  >
                    {ann.title}
                  </h3>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {ann.content || '(Bản nháp chưa có nội dung chi tiết)'}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium text-gray-800">{ann.authorName}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewDetail(ann)}
                      className="p-1.5 text-gray-500 hover:text-[#275A4E] bg-gray-50 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.announcementId)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Soạn Thông Báo Toàn Trường */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-50 text-[#275A4E] rounded-xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Soạn Thông Báo Toàn Trường</h3>
                  <p className="text-xs text-gray-500">Phát hành bảng tin chính thức gửi tới phụ huynh & cán bộ giáo viên</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tiêu đề thông báo */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tiêu đề thông báo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Kế hoạch tổ chức Ngày hội Trải nghiệm Khoa học nhí 2026..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#275A4E] focus:outline-none"
                />
              </div>

              {/* Đối tượng tiếp nhận */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Đối tượng tiếp nhận thông báo
                </label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#275A4E] focus:outline-none bg-white"
                >
                  <option value="ALL">📢 Toàn trường (Tất cả phụ huynh & cán bộ giáo viên)</option>
                  <option value="PARENTS_ONLY">👨‍👩‍👧 Chỉ Phụ Huynh Học Sinh</option>
                  <option value="STAFF_ONLY">👩‍🏫 Chỉ Cán Bộ Giáo Viên & Nhân Viên</option>
                </select>
              </div>

              {/* Nội dung chi tiết */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nội dung chi tiết thông báo <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Nhập nội dung đầy đủ của thông báo gửi tới nhà trường..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#275A4E] focus:outline-none"
                />
              </div>

              {/* VÙNG KÉO THẢ TỆP ĐÍNH KÈM (DRAG & DROP FILE ZONE) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Tệp đính kèm văn bản (Tối đa 20MB)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  accept=".pdf,.docx,.zip,.rar,.png,.jpg,.jpeg"
                  className="hidden"
                />

                {attachedFile || formData.attachmentName ? (
                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 bg-emerald-100 text-[#275A4E] rounded-xl flex-shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {attachedFile?.name || formData.attachmentName}
                        </p>
                        <p className="text-xs text-emerald-700 font-medium">
                          {formatFileSize(attachedFile?.size || formData.attachmentSize || 0)} • Đã sẵn sàng đính kèm
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeAttachedFile}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer ml-2 flex-shrink-0"
                      title="Xóa tệp đính kèm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                      isDragging
                        ? 'border-[#275A4E] bg-emerald-50/50 scale-[1.01]'
                        : 'border-gray-200 hover:border-[#275A4E] bg-gray-50/50 hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#275A4E] flex items-center justify-center mb-2">
                      <FileUp className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">
                      Kéo thả tệp vào đây, hoặc <span className="text-[#275A4E] underline">chọn tệp từ máy tính</span>
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Hỗ trợ PDF, DOCX, ZIP, PNG, JPG • Dung lượng tối đa 20MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="px-4 py-2.5 border border-gray-300 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              {/* NÚT LƯU NHÁP (DRAFT) - RÕ CHỨC NĂNG VÀ HOẠT ĐỘNG CHUẨN */}
              <button
                type="button"
                onClick={() => handleCreate(true)}
                disabled={submitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition border border-slate-200 flex items-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>{submitting ? 'Đang lưu...' : 'Lưu Nháp (Draft)'}</span>
              </button>

              {/* NÚT PHÁT HÀNH TOÀN TRƯỜNG - MÀU XANH FOREST, TEXT TRẮNG NỔI BẬT */}
              <button
                type="button"
                onClick={() => handleCreate(false)}
                disabled={submitting}
                className="px-5 py-2.5 bg-[#275A4E] hover:bg-[#1E4D40] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center space-x-2 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Đang phát hành...' : 'Phát Hành Toàn Trường'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xem Chi Tiết Thông Báo */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getAudienceLabel(viewDetail.targetAudience).bg}`}>
                {getAudienceLabel(viewDetail.targetAudience).label}
              </span>
              <button
                onClick={() => setViewDetail(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">{viewDetail.title}</h2>
              <div className="flex items-center space-x-3 text-xs text-gray-400 mt-2">
                <span>Người đăng: <strong className="text-gray-700">{viewDetail.authorName}</strong></span>
                <span>•</span>
                <span>{new Date(viewDetail.createdAt).toLocaleString('vi-VN')}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl text-gray-800 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {viewDetail.content || '(Bản nháp)'}
            </div>

            {viewDetail.attachmentName && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-[#275A4E] font-semibold">
                <Paperclip className="w-4 h-4" />
                <span>Tệp đính kèm: {viewDetail.attachmentName}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewDetail(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition cursor-pointer"
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

export default BghAnnouncementsPage;
