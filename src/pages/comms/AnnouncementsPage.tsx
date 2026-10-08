import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/formatters';
import commsApi from '../../api/commsApi';
import { supabase } from '../../config/supabase';
import {
  Megaphone,
  AlertCircle,
  Plus,
  Send,
  Calendar,
  CheckCircle2,
  Bell,
  Loader2,
  RefreshCw,
  Inbox,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';

interface AnnouncementItem {
  id: string;
  code: string;
  title: string;
  content: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  publishedAt: string;
  authorName: string;
}

export const AnnouncementsPage: React.FC = () => {
  const { role } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state thêm mới
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiFeedback, setApiFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state sửa thông báo
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'>('NORMAL');
  const [isUpdating, setIsUpdating] = useState(false);

  const canManage = role === 'BGH' || role === 'SYSTEM_ADMIN' || role === 'GIAO_VU';

  // Mở modal sửa thông báo
  const handleOpenEdit = (ann: AnnouncementItem) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditPriority(ann.priority);
    setShowEditModal(true);
  };

  // Cập nhật thông báo
  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim() || !editContent.trim()) return;

    setIsUpdating(true);
    setApiFeedback(null);

    const payload = {
      title: editTitle.trim(),
      content: editContent.trim(),
      priority: editPriority,
    };

    try {
      try {
        await commsApi.updateAnnouncement(editingId, payload);
      } catch {
        const cRes = await supabase.schema('comms').from('announcements').update(payload).eq('id', editingId);
        if (cRes.error) {
          const pubRes = await supabase.from('announcements').update(payload).eq('id', editingId);
          if (pubRes.error) throw cRes.error;
        }
      }

      setShowEditModal(false);
      setEditingId(null);
      setApiFeedback({
        type: 'success',
        text: '✅ Đã cập nhật nội dung thông báo thành công!',
      });
      await loadAnnouncements();
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi cập nhật thông báo: ${err.message}`,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Xóa thông báo
  const handleDeleteAnnouncement = async (id: string) => {
    if (!id) return;
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này vĩnh viễn khỏi hệ thống?')) return;

    try {
      try {
        await commsApi.deleteAnnouncement(id);
      } catch {
        const cRes = await supabase.schema('comms').from('announcements').delete().eq('id', id);
        if (cRes.error) {
          const pubRes = await supabase.from('announcements').delete().eq('id', id);
          if (pubRes.error) throw cRes.error;
        }
      }

      setApiFeedback({
        type: 'success',
        text: '✅ Đã xóa thông báo thành công khỏi database!',
      });
      await loadAnnouncements();
    } catch (err: any) {
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi xóa thông báo: ${err.message}`,
      });
    }
  };

  // Tải danh sách thông báo thật từ Supabase
  const loadAnnouncements = async () => {
    setIsLoading(true);
    try {
      let dbAnnouncements: any[] = [];
      try {
        const resp: any = await commsApi.getAnnouncements();
        if (resp && Array.isArray(resp)) {
          dbAnnouncements = resp;
        }
      } catch {
        try {
          const { data, error } = await supabase
            .schema('comms')
            .from('announcements')
            .select('*')
            .order('published_at', { ascending: false });

          if (!error && data) {
            dbAnnouncements = data;
          } else {
            const { data: pubData } = await supabase
              .from('announcements')
              .select('*')
              .order('published_at', { ascending: false });
            if (pubData) dbAnnouncements = pubData;
          }
        } catch {
          const { data: pubData } = await supabase
            .from('announcements')
            .select('*')
            .order('published_at', { ascending: false });
          if (pubData) dbAnnouncements = pubData;
        }
      }

      if (dbAnnouncements && dbAnnouncements.length > 0) {
        const mapped: AnnouncementItem[] = dbAnnouncements.map((a: any, idx: number) => ({
          id: a.id || '',
          code: a.id ? `ANN-${String(a.id).substring(0, 6).toUpperCase()}` : `ANN-0${idx + 1}`,
          title: a.title || 'Thông báo',
          content: a.content || '',
          priority: (a.priority as any) || 'NORMAL',
          publishedAt: a.publishedAt || a.published_at || new Date().toISOString(),
          authorName: a.authorName || 'Ban Giám Hiệu',
        }));
        setAnnouncements(mapped);
      } else {
        setAnnouncements([]);
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải thông báo:', err.message);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    setApiFeedback(null);

    try {
      try {
        await commsApi.createAnnouncement({
          title: newTitle.trim(),
          content: newContent.trim(),
          priority: newPriority,
        });
      } catch {
        // Fallback lưu trực tiếp vào Supabase (hỗ trợ schema comms và public)
        const payload = {
          title: newTitle.trim(),
          content: newContent.trim(),
          priority: newPriority,
          published_at: new Date().toISOString(),
        };
        const cRes = await supabase.schema('comms').from('announcements').insert([payload]);
        if (cRes.error) {
          const pubRes = await supabase.from('announcements').insert([payload]);
          if (pubRes.error) throw cRes.error;
        }
      }

      setNewTitle('');
      setNewContent('');
      setShowAddForm(false);
      setApiFeedback({
        type: 'success',
        text: '✅ Đã phát hành thông báo thành công vào cơ sở dữ liệu Supabase!',
      });
      await loadAnnouncements();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Chưa kết nối được Backend';
      setApiFeedback({
        type: 'error',
        text: `⚠️ Lỗi gửi thông báo: ${errMsg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: AnnouncementItem['priority']) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-600 text-white';
      case 'HIGH':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'NORMAL':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'LOW':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header trang */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-indigo-600" />
            <span>Bảng Thông Báo Trường Học</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kênh liên lạc chính thống giữa Ban Giám Hiệu, Giáo viên và Quý Phụ huynh
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAnnouncements}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {canManage && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'Đóng form' : 'Tạo Thông báo mới'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Thông báo kết quả API */}
      {apiFeedback && (
        <div
          className={`rounded-xl p-3 text-xs flex items-center gap-2 ${
            apiFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {apiFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{apiFeedback.text}</span>
        </div>
      )}

      {/* Form Tạo thông báo (Dành cho BGH) */}
      {showAddForm && (
        <form
          onSubmit={handleCreateAnnouncement}
          className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-xs space-y-4"
        >
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <span>Soạn Thông báo Toàn trường Mới</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu đề thông báo</label>
              <input
                type="text"
                placeholder="Nhập tiêu đề ngắn gọn, rõ ràng..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ ưu tiên</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 font-semibold focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="NORMAL">Bình thường (Normal)</option>
                <option value="HIGH">Quan trọng (High)</option>
                <option value="URGENT">Khẩn cấp (Urgent)</option>
                <option value="LOW">Tin tức phụ (Low)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung chi tiết</label>
            <textarea
              rows={4}
              placeholder="Nội dung truyền đạt tới phụ huynh và giáo viên..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isSubmitting ? 'Đang gửi...' : 'Phát hành Thông báo'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Danh sách thông báo */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-sm font-medium text-slate-600">Đang tải bảng thông báo...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-slate-200">
          <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
            <Inbox className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-700">Chưa có thông báo nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Hiện chưa có thông báo nào được phát hành trong cơ sở dữ liệu Supabase.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${getPriorityBadge(
                      ann.priority
                    )}`}
                  >
                    {ann.priority === 'URGENT' && 'KHẨN CẤP'}
                    {ann.priority === 'HIGH' && 'QUAN TRỌNG'}
                    {ann.priority === 'NORMAL' && 'THƯỜNG KỲ'}
                    {ann.priority === 'LOW' && 'THÔNG TIN THAM KHẢO'}
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-semibold">{ann.id}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{ann.authorName}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(ann.publishedAt)}</span>
                  </div>

                  {canManage && ann.id && (
                    <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
                      <button
                        onClick={() => handleOpenEdit(ann)}
                        className="text-slate-400 hover:text-indigo-600 transition p-1 rounded-md hover:bg-slate-50"
                        title="Sửa thông báo"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1 rounded-md hover:bg-slate-50"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-800">{ann.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL SỬA THÔNG BÁO ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Pencil className="h-4 w-4 text-indigo-600" />
                <span>Chỉnh Sửa Thông Báo</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tiêu đề thông báo</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ ưu tiên</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 font-semibold focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="NORMAL">Bình thường (Normal)</option>
                  <option value="HIGH">Quan trọng (High)</option>
                  <option value="URGENT">Khẩn cấp (Urgent)</option>
                  <option value="LOW">Tin tức phụ (Low)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nội dung chi tiết</label>
                <textarea
                  rows={5}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{isUpdating ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
